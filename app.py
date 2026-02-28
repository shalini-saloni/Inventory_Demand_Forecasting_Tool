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
