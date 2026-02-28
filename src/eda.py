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
    
    
def _plot_sales_overview(df, items, out):
    fig, axes = plt.subplots(len(items), 1, figsize=(16, 3 * len(items)), sharex=True)
    if len(items) == 1:
        axes = [axes]
    fig.suptitle('Daily Sales — All Items (2023)', fontsize=14, fontweight='bold')

    for ax, item, color in zip(axes, items, COLORS):
        s = df[df['item_id'] == item].set_index('date')['sales'].sort_index()
        s_ma = s.rolling(7).mean()
        ax.bar(s.index, s.values, color=color, alpha=0.35, width=1, label='Daily')
        ax.plot(s_ma.index, s_ma.values, color=color, linewidth=2, label='7-day MA')
        ax.set_ylabel('Sales', fontsize=9)
        ax.set_title(item, fontsize=10, fontweight='bold')
        ax.legend(fontsize=8)
        ax.grid(True, alpha=0.3)
        ax.spines[['top', 'right']].set_visible(False)

    axes[-1].xaxis.set_major_formatter(mdates.DateFormatter('%b'))
    axes[-1].xaxis.set_major_locator(mdates.MonthLocator())
    plt.tight_layout()
    fig.savefig(f"{out}/01_sales_overview.png", dpi=150, bbox_inches='tight')
    plt.close()


def _plot_weekly_pattern(df, items, out):
    fig, ax = plt.subplots(figsize=(10, 5))
    day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    df2 = df.copy()
    df2['dow'] = df2['date'].dt.dayofweek

    for item, color in zip(items, COLORS):
        s = df2[df2['item_id'] == item].groupby('dow')['sales'].mean()
        ax.plot(day_names, s.values, marker='o', linewidth=2,
                label=item, color=color)

    ax.set_title('Average Sales by Day of Week', fontsize=13, fontweight='bold')
    ax.set_ylabel('Avg Daily Sales')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.spines[['top', 'right']].set_visible(False)
    plt.tight_layout()
    fig.savefig(f"{out}/02_weekly_pattern.png", dpi=150, bbox_inches='tight')
    plt.close()


def _plot_monthly_trend(df, items, out):
    fig, ax = plt.subplots(figsize=(12, 5))
    df2 = df.copy()
    df2['month'] = df2['date'].dt.month
    month_names  = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec']

    for item, color in zip(items, COLORS):
        s = df2[df2['item_id'] == item].groupby('month')['sales'].sum()
        all_months = pd.Series(0, index=range(1, 13))
        all_months.update(s)
        ax.plot(month_names, all_months.values, marker='o', linewidth=2.5,
                label=item, color=color)

    ax.set_title('Monthly Total Sales by Item (2023)', fontsize=13, fontweight='bold')
    ax.set_ylabel('Total Sales')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.spines[['top', 'right']].set_visible(False)
    plt.tight_layout()
    fig.savefig(f"{out}/03_monthly_trend.png", dpi=150, bbox_inches='tight')
    plt.close()
    
def _plot_distribution(df, items, out):
    fig, axes = plt.subplots(1, len(items), figsize=(4 * len(items), 4), sharey=True)
    if len(items) == 1:
        axes = [axes]
    fig.suptitle('Sales Distribution per Item', fontsize=13, fontweight='bold')

    for ax, item, color in zip(axes, items, COLORS):
        s = df[df['item_id'] == item]['sales']
        ax.hist(s, bins=30, color=color, alpha=0.75, edgecolor='white')
        ax.axvline(s.mean(),   color='black', linestyle='--', linewidth=1.5,
                   label=f'Mean={s.mean():.1f}')
        ax.axvline(s.median(), color='gray',  linestyle=':',  linewidth=1.5,
                   label=f'Median={s.median():.1f}')
        ax.set_title(item, fontsize=10, fontweight='bold')
        ax.set_xlabel('Daily Sales')
        ax.legend(fontsize=8)
        ax.grid(True, alpha=0.3)
        ax.spines[['top', 'right']].set_visible(False)

    axes[0].set_ylabel('Frequency')
    plt.tight_layout()
    fig.savefig(f"{out}/04_sales_distribution.png", dpi=150, bbox_inches='tight')
    plt.close()


def _print_stats(df, items):
    print("\n  📊  Descriptive Statistics per Item:")
    print("  " + "─" * 60)
    stats = df.groupby('item_id')['sales'].agg(
        days='count', total='sum',
        mean='mean',  std='std',
        min='min',    q25=lambda x: x.quantile(0.25),
        median='median', q75=lambda x: x.quantile(0.75),
        max='max'
    ).round(1)
    print(stats.to_string())
    print("  " + "─" * 60)