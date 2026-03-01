from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Item, SalesRecord
from src.forecast_service import ForecastService
from config import Config

restock_bp = Blueprint("restock", __name__, url_prefix="/api/restock")


@restock_bp.route("", methods=["GET"])
@jwt_required()
def get_restock():
    store_id = request.args.get("store_id", "store_1")
    horizon  = request.args.get("horizon",  Config.DEFAULT_HORIZON, type=int)
    sp       = request.args.get("seasonal_period", Config.DEFAULT_SEASONAL_PERIOD, type=int)

    items    = Item.query.filter_by(store_id=store_id).all()

    if not items:
        return jsonify({
            "recommendations": [],
            "low_stock_count": 0,
            "low_stock_skus":  [],
        }), 200

    service       = ForecastService(seasonal_period=sp)
    results       = []
    low_stock_skus = []

    for item in items:
        records = item.sales.order_by(SalesRecord.date).all()
        if len(records) < 14:
            continue
        try:
            series = service.build_series(records)
            result = service.full_forecast(
                series,
                horizon=horizon,
                current_stock=item.current_stock or Config.DEFAULT_CURRENT_STOCK,
                lead_time=item.lead_time         or Config.DEFAULT_LEAD_TIME,
            )
            rec = result["restock"]
            row = {
                "item_id":                   item.item_id,
                "store_id":                  item.store_id,
                "item_pk":                   item.id,
                "current_stock":             item.current_stock,
                "forecasted_demand_total":   rec["forecasted_demand_total"],
                "demand_during_lead_time":   rec["demand_during_lead_time"],
                "recommended_order_qty":     rec["recommended_order_qty"],
                "days_of_stock_remaining":   rec["days_of_stock_remaining"],
                "reorder_alert":             rec["reorder_alert"],
            }
            results.append(row)
            if rec["reorder_alert"]:
                low_stock_skus.append(item.item_id)
        except Exception:
            continue

    return jsonify({
        "recommendations": results,
        "low_stock_count": len(low_stock_skus),
        "low_stock_skus":  low_stock_skus,
    }), 200
