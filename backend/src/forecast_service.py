from __future__ import annotations

import io
import csv
import pandas as pd
import numpy as np
from typing import Dict, Any

from src.forecasting_engine import DemandForecaster
from config import Config


def _series_to_list(s: pd.Series) -> list[dict]:
    return [
        {"date": d.strftime("%Y-%m-%d"), "value": round(float(v), 2)}
        for d, v in s.items()
    ]

class ForecastService:
    def __init__(self, seasonal_period: int = Config.DEFAULT_SEASONAL_PERIOD):
        self.engine = DemandForecaster(seasonal_period=seasonal_period)
        self.seasonal_period = seasonal_period

    def build_series(self, records: list) -> pd.Series:
        """records: list of SalesRecord ORM objects."""
        if not records:
            raise ValueError("No sales data available.")
        rows = [{"date": r.date, "sales": r.sales} for r in records]
        df   = pd.DataFrame(rows)
        df["date"] = pd.to_datetime(df["date"])
        series = df.set_index("date")["sales"].sort_index()
        series = series.resample("D").sum().fillna(0)
        return series

    def full_forecast(
        self,
        series:         pd.Series,
        horizon:        int   = Config.DEFAULT_HORIZON,
        current_stock:  int   = Config.DEFAULT_CURRENT_STOCK,
        lead_time:      int   = Config.DEFAULT_LEAD_TIME,
        safety_factor:  float = Config.DEFAULT_SAFETY_FACTOR,
        method:         str   = "holt_winters",
    ) -> Dict[str, Any]:
        if len(series) < 14:
            raise ValueError(f"Insufficient data: need ≥14 days, got {len(series)}.")

        test_days    = min(Config.TEST_SPLIT_DAYS, len(series) // 4)
        train_series = series.iloc[:-test_days] if test_days > 0 else series
        test_series  = series.iloc[-test_days:] if test_days > 0 else pd.Series([], dtype=float)

        ma_res  = self.engine.moving_average_forecast(train_series, window=7, horizon=horizon)
        ses_res = self.engine.exponential_smoothing_forecast(train_series, horizon=horizon)
        hw_res  = self.engine.holt_winters_forecast(train_series, horizon=horizon)

        hw_fitted_full = self.engine.holt_winters_forecast(series, horizon=horizon)
        metrics = {}
        if len(test_series) > 0:
            try:
                metrics["ses"] = self.engine.evaluate(series, ses_res.get("fitted", pd.Series([], dtype=float)))
                metrics["hw"]  = self.engine.evaluate(series, hw_res.get("fitted", pd.Series([], dtype=float)))
            except Exception:
                metrics = {}

        primary_forecast = hw_res["forecast"]
        restock = self.engine.restocking_recommendation(
            primary_forecast, current_stock, lead_time, safety_factor
        )

        method_map = {"moving_average": ma_res, "ses": ses_res, "holt_winters": hw_res}
        selected   = method_map.get(method, hw_res)

        return {
            "historical":   _series_to_list(series),
            "forecast":     _series_to_list(selected["forecast"]),
            "ci_upper":     _series_to_list(selected["ci_upper"]),
            "ci_lower":     _series_to_list(selected["ci_lower"]),
            "all_forecasts": {
                "moving_average": _series_to_list(ma_res["forecast"]),
                "ses":            _series_to_list(ses_res["forecast"]),
                "holt_winters":   _series_to_list(hw_res["forecast"]),
            },
            "metrics":      metrics,
            "restock":      {
                k: (int(v) if isinstance(v, (np.integer,))
                    else float(v) if isinstance(v, (np.floating,))
                    else bool(v) if isinstance(v, (np.bool_,))
                    else v)
                for k, v in restock.items()
            },
            "method":       method,
            "horizon":      horizon,
            "alpha":        (float(ses_res.get("alpha")) if ses_res.get("alpha") is not None else None),
            "seasonal":     (bool(hw_res.get("seasonal")) if hw_res.get("seasonal") is not None else None),
            "train_size":   len(train_series),
            "test_size":    len(test_series),
        }

    def decompose(self, series: pd.Series) -> Dict[str, Any]:
        decomp = self.engine.decompose_series(series)
        if decomp is None:
            raise ValueError("Insufficient data for decomposition (need ≥ 2 seasonal periods).")
        return {
            "trend":    _series_to_list(decomp.trend.dropna()),
            "seasonal": _series_to_list(decomp.seasonal),
            "residual": _series_to_list(decomp.resid.dropna()),
            "observed": _series_to_list(decomp.observed),
        }

    def export_csv(self, forecast_data: Dict[str, Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["date", "forecast", "ci_lower", "ci_upper"])
        fc     = {r["date"]: r["value"] for r in forecast_data["forecast"]}
        ci_lo  = {r["date"]: r["value"] for r in forecast_data["ci_lower"]}
        ci_hi  = {r["date"]: r["value"] for r in forecast_data["ci_upper"]}
        for d in fc:
            writer.writerow([d, fc[d], ci_lo.get(d, ""), ci_hi.get(d, "")])
        return output.getvalue()
