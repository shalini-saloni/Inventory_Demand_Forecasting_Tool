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