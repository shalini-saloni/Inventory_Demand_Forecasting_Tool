"""
routes/dashboard.py — Dashboard summary stats
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Item, SalesRecord
import sqlalchemy as sa

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("", methods=["GET"])
@jwt_required()
def get_dashboard():
    store_id = request.args.get("store_id", "store_1")

    items = Item.query.filter_by(store_id=store_id).all()
    item_pks = [i.id for i in items]

    if not item_pks:
        return jsonify({
            "total_skus":    0,
            "total_sales":   0,
            "avg_demand":    0,
            "low_stock_count": 0,
            "trend_chart":   [],
        }), 200

    # Aggregate stats
    total_sales = db.session.query(
        sa.func.sum(SalesRecord.sales)
    ).filter(SalesRecord.item_pk.in_(item_pks)).scalar() or 0

    total_records = db.session.query(
        sa.func.count(SalesRecord.id)
    ).filter(SalesRecord.item_pk.in_(item_pks)).scalar() or 1

    avg_demand = total_sales / total_records if total_records else 0

    low_stock = sum(1 for i in items if (i.current_stock or 0) < 100)

    # Daily trend (last 90 days) across all items
    from sqlalchemy import func
    trend_rows = (
        db.session.query(SalesRecord.date, func.sum(SalesRecord.sales).label("total"))
        .filter(SalesRecord.item_pk.in_(item_pks))
        .group_by(SalesRecord.date)
        .order_by(SalesRecord.date.desc())
        .limit(90)
        .all()
    )
    trend_chart = [
        {"date": r.date.isoformat(), "value": round(float(r.total), 2)}
        for r in reversed(trend_rows)
    ]

    # Per-SKU mini stats
    sku_stats = []
    for item in items:
        total = db.session.query(
            sa.func.sum(SalesRecord.sales)
        ).filter_by(item_pk=item.id).scalar() or 0
        sku_stats.append({
            "item_id":       item.item_id,
            "store_id":      item.store_id,
            "item_pk":       item.id,
            "current_stock": item.current_stock,
            "total_sales":   round(float(total), 2),
        })

    return jsonify({
        "total_skus":    len(items),
        "total_sales":   round(float(total_sales), 2),
        "avg_demand":    round(float(avg_demand), 2),
        "low_stock_count": low_stock,
        "trend_chart":   trend_chart,
        "sku_stats":     sku_stats,
    }), 200
