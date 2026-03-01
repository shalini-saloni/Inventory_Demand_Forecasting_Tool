import io
import pandas as pd
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Item, SalesRecord
from src.data_cleaner import clean_dataframe

items_bp = Blueprint("items", __name__, url_prefix="/api/items")

REQUIRED_COLS = {"date", "item_id", "sales"}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    def _norm(col):
        if not isinstance(col, str):
            return col
        return col.strip().lstrip('\ufeff').lower().replace(' ', '_')

    df.columns = [_norm(c) for c in df.columns]
    return df


@items_bp.route("", methods=["GET"])
@jwt_required()
def get_items():
    page     = request.args.get("page",  1,   type=int)
    per_page = request.args.get("limit", 20,  type=int)
    store_id = request.args.get("store_id", None)

    q = Item.query
    if store_id:
        q = q.filter_by(store_id=store_id)

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    items_data = []
    for item in pagination.items:
        d = item.to_dict()
        d["total_sales"] = db.session.query(
            db.func.sum(SalesRecord.sales)
        ).filter_by(item_pk=item.id).scalar() or 0
        d["record_count"] = item.sales.count()
        items_data.append(d)

    return jsonify({
        "items":   items_data,
        "total":   pagination.total,
        "pages":   pagination.pages,
        "page":    page,
        "per_page": per_page,
    }), 200


@items_bp.route("/<int:item_pk>", methods=["GET"])
@jwt_required()
def get_item(item_pk):
    item = Item.query.get_or_404(item_pk)
    records = item.sales.order_by(SalesRecord.date).all()
    return jsonify({
        "item":    item.to_dict(),
        "history": [r.to_dict() for r in records],
    }), 200


@items_bp.route("/<int:item_pk>", methods=["PUT"])
@jwt_required()
def update_item(item_pk):
    item = Item.query.get_or_404(item_pk)
    data = request.get_json(silent=True) or {}
    if "current_stock" in data:
        item.current_stock = int(data["current_stock"])
    if "lead_time" in data:
        item.lead_time = int(data["lead_time"])
    db.session.commit()
    return jsonify({"item": item.to_dict()}), 200


@items_bp.route("/<int:item_pk>", methods=["DELETE"])
@jwt_required()
def delete_item(item_pk):
    item = Item.query.get_or_404(item_pk)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": f"Item {item.item_id} deleted."}), 200


@items_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_csv():
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Send multipart/form-data with key 'file'."}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename."}), 400
    if not f.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only .csv files are accepted."}), 400

    try:
        raw_bytes = f.read()
        df = pd.read_csv(io.BytesIO(raw_bytes), encoding='utf-8-sig')
    except Exception as e:
        return jsonify({"error": f"Cannot parse CSV: {e}"}), 400

    if df.empty:
        return jsonify({"error": "The uploaded CSV is empty."}), 400

    df = _normalise_columns(df)

    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        return jsonify({
            "error": f"Missing required columns: {', '.join(sorted(missing))}. "
                     f"Found: {', '.join(sorted(df.columns.tolist()))}"
        }), 400

    try:
        df, report = clean_dataframe(df)
    except ValueError as e:
        return jsonify({"error": f"Data validation failed: {e}"}), 422
    except KeyError as e:
        return jsonify({
            "error": f"Data cleaning failed - missing column: {e}.",
            "found_columns": list(df.columns),
        }), 422
    except Exception as e:
        return jsonify({"error": f"Data cleaning failed: {e}"}), 422

    try:
        inserted = _upsert_records(df)
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database write failed: {e}"}), 500

    return jsonify({
        "success":         True,
        "message":         f"Upload successful. {inserted} new records saved.",
        "rows_processed":  int(report["final_shape"][0]),
        "cleaning_report": report["steps"],
        "original_shape":  list(report["original_shape"]),
        "final_shape":     list(report["final_shape"]),
    }), 201


def _upsert_records(df: pd.DataFrame) -> int:
    inserted = 0

    if "store_id" not in df.columns:
        df = df.copy()
        df["store_id"] = "default"

    group_cols = ["store_id", "item_id"]

    for (store_id, item_id), grp in df.groupby(group_cols):
        item = Item.query.filter_by(item_id=item_id, store_id=store_id).first()
        if not item:
            item = Item(item_id=item_id, store_id=store_id)
            db.session.add(item)
            db.session.flush()   

        for _, row in grp.iterrows():
            row_dict = row.to_dict()

            date_val = row_dict["date"]
            if hasattr(date_val, "date"):
                date_val = date_val.date()

            existing = SalesRecord.query.filter_by(
                item_pk=item.id, date=date_val
            ).first()

            if existing:
                existing.sales = float(row_dict["sales"])
            else:
                def _is_nan(x):
                    try:
                        return pd.isna(x)
                    except Exception:
                        return False

                def _safe_float(x):
                    return None if _is_nan(x) else float(x)

                def _safe_int(x, default=None):
                    if _is_nan(x):
                        return default
                    try:
                        return int(x)
                    except Exception:
                        return default

                rec = SalesRecord(
                    item_pk = item.id,
                    date    = date_val,
                    sales   = float(row_dict.get("sales") or 0),
                    price   = _safe_float(row_dict.get("price")),
                    promo   = _safe_int(row_dict.get("promo"), default=0),
                    weekday = _safe_int(row_dict.get("weekday"), default=None),
                    month   = _safe_int(row_dict.get("month"), default=None),
                )
                db.session.add(rec)
                inserted += 1

    db.session.commit()
    return inserted
