import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pathlib import Path


COLORS = ['#2C3E50', '#3498DB', '#E67E22', '#27AE60', '#E74C3C']


def run_eda(df: pd.DataFrame, output_dir: str = "outputs/eda") -> None:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    items = sorted(df['item_id'].unique())

    _plot_sales_overview(df, items, output_dir)
    _plot_weekly_pattern(df, items, output_dir)
    _plot_monthly_trend(df, items, output_dir)
    _plot_distribution(df, items, output_dir)
    _print_stats(df, items)
    print(f"  📊  EDA charts saved to: {output_dir}/")