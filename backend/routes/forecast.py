from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from models import db, Item, SalesRecord
from src.forecast_service import ForecastService
from config import Config

forecast_bp = Blueprint("forecast", __name__, url_prefix="/api/forecast")


def _get_item_and_series(sku: str):
    """Resolve SKU → (Item, pd.Series). Returns 404 dict on failure."""
    store_id = request.args.get("store_id", "store_1")
    item     = Item.query.filter_by(item_id=sku, store_id=store_id).first()
    if not item:
        return None, None, f"Item '{sku}' not found for store '{store_id}'."

    records = item.sales.order_by(SalesRecord.date).all()
    if not records:
        return item, None, f"No sales records for '{sku}'."

    sp      = request.args.get("seasonal_period", Config.DEFAULT_SEASONAL_PERIOD, type=int)
    service = ForecastService(seasonal_period=sp)
    series  = service.build_series(records)
    return item, series, None


@forecast_bp.route("/<sku>", methods=["GET"])
@jwt_required()
def get_forecast(sku):
    item, series, error = _get_item_and_series(sku)
    if error:
        return jsonify({"error": error}), 404

    horizon       = request.args.get("horizon",        Config.DEFAULT_HORIZON,         type=int)
    method        = request.args.get("method",         "holt_winters")
    current_stock = request.args.get("current_stock",  item.current_stock or Config.DEFAULT_CURRENT_STOCK, type=int)
    lead_time     = request.args.get("lead_time",      item.lead_time     or Config.DEFAULT_LEAD_TIME,     type=int)
    sp            = request.args.get("seasonal_period", Config.DEFAULT_SEASONAL_PERIOD, type=int)

    try:
        service = ForecastService(seasonal_period=sp)
        result  = service.full_forecast(
            series, horizon=horizon, current_stock=current_stock,
            lead_time=lead_time, method=method
        )
        result["sku"]      = sku
        result["store_id"] = request.args.get("store_id", "store_1")
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": f"Forecasting failed: {e}"}), 500


@forecast_bp.route("/decompose/<sku>", methods=["GET"])
@jwt_required()
def get_decomposition(sku):
    _, series, error = _get_item_and_series(sku)
    if error:
        return jsonify({"error": error}), 404

    sp      = request.args.get("seasonal_period", Config.DEFAULT_SEASONAL_PERIOD, type=int)
    service = ForecastService(seasonal_period=sp)
    try:
        result          = service.decompose(series)
        result["sku"]   = sku
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 422


@forecast_bp.route("/<sku>/export", methods=["GET"])
@jwt_required()
def export_forecast(sku):
    item, series, error = _get_item_and_series(sku)
    if error:
        return jsonify({"error": error}), 404

    horizon = request.args.get("horizon", Config.DEFAULT_HORIZON, type=int)
    sp      = request.args.get("seasonal_period", Config.DEFAULT_SEASONAL_PERIOD, type=int)
    service = ForecastService(seasonal_period=sp)

    try:
        result  = service.full_forecast(series, horizon=horizon,
                                        current_stock=item.current_stock or Config.DEFAULT_CURRENT_STOCK)
        csv_str = service.export_csv(result)
        return Response(
            csv_str,
            mimetype="text/csv",
            headers={"Content-Disposition": f'attachment; filename="forecast_{sku}.csv"'},
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
