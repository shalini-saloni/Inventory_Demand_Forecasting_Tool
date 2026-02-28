import pandas as pd
import numpy as np
import os
import sys
from typing import Tuple, Dict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data_cleaner       import clean_dataframe, print_cleaning_report
from src.forecasting_engine import DemandForecaster
from src.visualizer         import plot_item_dashboard, plot_restocking_summary
from src.eda                import run_eda


CSV_PATH        = "data/retail_sales_2023_small.csv"
OUTPUT_DIR      = "outputs"
SELECTED_ITEMS  = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5']
TARGET_STORE    = 'store_1'
HORIZON         = 30
SEASONAL_PERIOD = 7
CURRENT_STOCK   = 300
LEAD_TIME       = 7
SAFETY_FACTOR   = 1.2


def load_data(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"\nFile not found: {path}"
            "\nMake sure retail_sales_2023_small.csv is inside the data/ folder."
        )

    df = pd.read_csv(path)

    required_cols = ['date', 'store_id', 'item_id']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date'])

    print(f"Loaded data → shape: {df.shape}")
    return df

def filter_data(df: pd.DataFrame) -> pd.DataFrame:
    df_filtered = df[
        (df['store_id'] == TARGET_STORE) &
        (df['item_id'].isin(SELECTED_ITEMS))
    ].copy()

    if df_filtered.empty:
        raise ValueError("No data after filtering. Check store_id or item_id values.")

    print(f"Filtered data → shape: {df_filtered.shape}")
    return df_filtered

def run_forecast(df: pd.DataFrame) -> Tuple[Dict, Dict]:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    forecaster = DemandForecaster(seasonal_period=SEASONAL_PERIOD)

    all_results     = {}
    recommendations = {}

    available_items = df['item_id'].unique()

    for item_id in SELECTED_ITEMS:

        if item_id not in available_items:
            print(f"⚠ {item_id} not found in dataset. Skipping.")
            continue

        print(f"\n{'─'*60}")
        print(f"Forecasting: {item_id}")

        series = forecaster.prepare_data(df, item_id)

        if len(series) < 14:
            print(f"⚠ Skipping {item_id}: insufficient data ({len(series)} days).")
            continue

        try:
            ma_result  = forecaster.moving_average_forecast(series, window=7, horizon=HORIZON)
            ses_result = forecaster.exponential_smoothing_forecast(series, horizon=HORIZON)
            hw_result  = forecaster.holt_winters_forecast(series, horizon=HORIZON)
            decomp     = forecaster.decompose_series(series)

            ses_metrics = forecaster.evaluate(series, ses_result['fitted'])
            hw_metrics  = forecaster.evaluate(series, hw_result['fitted'])

            print(f"SES  → α={ses_result['alpha']}  {ses_metrics}")
            print(f"HW   → seasonal={hw_result['seasonal']}  {hw_metrics}")

            rec = forecaster.restocking_recommendation(
                hw_result['forecast'],
                CURRENT_STOCK,
                lead_time_days=LEAD_TIME,
                safety_factor=SAFETY_FACTOR
            )

            recommendations[item_id] = rec

            flag = "🔴 REORDER NOW" if rec['reorder_alert'] else "🟢 OK"

            print(
                f"Stock: {CURRENT_STOCK} | "
                f"Days left: {rec['days_of_stock_remaining']} | "
                f"Order: {rec['recommended_order_qty']} units  {flag}"
            )

            plot_item_dashboard(
                series,
                ma_result,
                ses_result,
                hw_result,
                decomp,
                item_id=item_id,
                save_dir=OUTPUT_DIR
            )

            all_results[item_id] = {
                'series': series,
                'ma': ma_result,
                'ses': ses_result,
                'hw': hw_result,
                'ses_metrics': ses_metrics,
                'hw_metrics': hw_metrics,
            }

        except Exception as e:
            print(f"Error forecasting {item_id}: {e}")
            continue

    return all_results, recommendations

def save_summary(recommendations: Dict):
    if not recommendations:
        print("⚠ No recommendations generated.")
        return

    print(f"\n{'═'*60}")
    print("RESTOCKING RECOMMENDATIONS")
    print(f"{'═'*60}")

    rec_df = pd.DataFrame(recommendations).T
    print(rec_df.to_string())

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, "restocking_recommendations.csv")
    rec_df.to_csv(out_path)

    print(f"\nSaved: {out_path}")

    plot_restocking_summary(recommendations, save_dir=OUTPUT_DIR)
    print(f"Saved: {OUTPUT_DIR}/restocking_summary.png")
