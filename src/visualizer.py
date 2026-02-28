import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.gridspec import GridSpec
import numpy as np
from pathlib import Path

COLORS = {
    'historical': '#2C3E50',
    'ma':         '#3498DB',
    'ses':        '#E67E22',
    'hw':         '#27AE60',
    'ci':         '#BDC3C7',
    'trend':      '#8E44AD',
    'seasonal':   '#E74C3C',
    'residual':   '#F39C12',
}


def _setup_ax(ax, title: str, ylabel: str = 'Sales Units'):
    ax.set_title(title, fontsize=12, fontweight='bold', pad=10)
    ax.set_ylabel(ylabel, fontsize=10)
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
    ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=2))
    ax.tick_params(axis='x', rotation=30)
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.spines[['top', 'right']].set_visible(False)
    
def plot_item_dashboard(series: pd.Series,
                         ma_result: dict,
                         ses_result: dict,
                         hw_result: dict,
                         decomp,
                         item_id: str,
                         save_dir: str = None) -> plt.Figure:

    fig = plt.figure(figsize=(18, 14))
    fig.suptitle(f'Demand Forecasting Dashboard — {item_id}',
                 fontsize=16, fontweight='bold', y=0.98)
    gs = GridSpec(3, 2, figure=fig, hspace=0.45, wspace=0.35)


    ax1 = fig.add_subplot(gs[0, 0])
    ax1.plot(series.index, series.values, color=COLORS['historical'],
             alpha=0.6, linewidth=1, label='Actual')
    ax1.plot(ma_result['historical_ma'].index, ma_result['historical_ma'].values,
             color=COLORS['ma'], linewidth=2,
             label=f"MA (w={ma_result['window']})")
    ax1.plot(ma_result['forecast'].index, ma_result['forecast'].values,
             color=COLORS['ma'], linewidth=2, linestyle='--', label='MA Forecast')
    ax1.fill_between(ma_result['forecast'].index,
                     ma_result['ci_lower'], ma_result['ci_upper'],
                     color=COLORS['ci'], alpha=0.4, label='95% CI')
    _setup_ax(ax1, 'Moving Average Forecast')


    ax2 = fig.add_subplot(gs[0, 1])
    ax2.plot(series.index, series.values, color=COLORS['historical'],
             alpha=0.6, linewidth=1, label='Actual')
    ax2.plot(ses_result['fitted'].index, ses_result['fitted'].values,
             color=COLORS['ses'], linewidth=1.5, label='SES Fitted')
    ax2.plot(ses_result['forecast'].index, ses_result['forecast'].values,
             color=COLORS['ses'], linewidth=2.5, linestyle='--',
             label=f"SES Forecast (α={ses_result['alpha']})")
    ax2.fill_between(ses_result['forecast'].index,
                     ses_result['ci_lower'], ses_result['ci_upper'],
                     color=COLORS['ci'], alpha=0.4, label='95% CI')
    _setup_ax(ax2, 'Exponential Smoothing Forecast')


    ax3 = fig.add_subplot(gs[1, 0])
    ax3.plot(series.index, series.values, color=COLORS['historical'],
             alpha=0.6, linewidth=1, label='Actual')
    ax3.plot(hw_result['fitted'].index, hw_result['fitted'].values,
             color=COLORS['hw'], linewidth=1.5, label='HW Fitted')
    ax3.plot(hw_result['forecast'].index, hw_result['forecast'].values,
             color=COLORS['hw'], linewidth=2.5, linestyle='--',
             label='Holt-Winters Forecast')
    ax3.fill_between(hw_result['forecast'].index,
                     hw_result['ci_lower'], hw_result['ci_upper'],
                     color=COLORS['ci'], alpha=0.4, label='95% CI')
    _setup_ax(ax3, 'Holt-Winters (Triple Exp. Smoothing)')


    ax4 = fig.add_subplot(gs[1, 1])
    if decomp is not None:
        ax4.plot(decomp.trend.dropna().index, decomp.trend.dropna().values,
                 color=COLORS['trend'], linewidth=2, label='Trend')
        ax4_twin = ax4.twinx()
        ax4_twin.plot(decomp.seasonal.index, decomp.seasonal.values,
                      color=COLORS['seasonal'], linewidth=1, alpha=0.7,
                      label='Seasonal')
        ax4_twin.set_ylabel('Seasonal Component', fontsize=9,
                             color=COLORS['seasonal'])
        ax4_twin.tick_params(axis='y', labelcolor=COLORS['seasonal'])
        lines1, labels1 = ax4.get_legend_handles_labels()
        lines2, labels2 = ax4_twin.get_legend_handles_labels()
        ax4.legend(lines1 + lines2, labels1 + labels2, fontsize=9)
    else:
        ax4.text(0.5, 0.5, 'Insufficient data\nfor decomposition',
                 ha='center', va='center', transform=ax4.transAxes, fontsize=12)
    ax4.set_title('Seasonality Decomposition', fontsize=12,
                  fontweight='bold', pad=10)
    ax4.set_ylabel('Trend', fontsize=10)
    ax4.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
    ax4.xaxis.set_major_locator(mdates.WeekdayLocator(interval=2))
    ax4.tick_params(axis='x', rotation=30)
    ax4.grid(True, alpha=0.3)
    ax4.spines[['top', 'right']].set_visible(False)


    ax5 = fig.add_subplot(gs[2, :])
    hist_tail = series.iloc[-60:]
    ax5.plot(hist_tail.index, hist_tail.values, color=COLORS['historical'],
             alpha=0.7, linewidth=1.5, label='Historical (last 60 days)')
    ax5.plot(ma_result['forecast'].index, ma_result['forecast'].values,
             color=COLORS['ma'], linewidth=2.5, linestyle='-',
             label=f"MA Forecast")
    ax5.plot(ses_result['forecast'].index, ses_result['forecast'].values,
             color=COLORS['ses'], linewidth=2.5, linestyle='--',
             label='SES Forecast')
    ax5.plot(hw_result['forecast'].index, hw_result['forecast'].values,
             color=COLORS['hw'], linewidth=2.5, linestyle='-.',
             label='Holt-Winters Forecast')
    ax5.fill_between(hw_result['forecast'].index,
                     hw_result['ci_lower'], hw_result['ci_upper'],
                     color=COLORS['hw'], alpha=0.15, label='HW 95% CI')
    ax5.axvline(x=series.index[-1], color='red', linestyle=':', alpha=0.7,
                label='Forecast Start')
    _setup_ax(ax5, 'Forecast Comparison — All Methods')

    plt.tight_layout()
    if save_dir:
        out = Path(save_dir) / f"{item_id}_dashboard.png"
        fig.savefig(out, dpi=150, bbox_inches='tight')
        print(f"  Saved: {out}")
    return fig

def plot_restocking_summary(recommendations: dict, save_dir: str = None) -> plt.Figure:
    items = list(recommendations.keys())
    qtys = [v['recommended_order_qty'] for v in recommendations.values()]
    alerts = [v['reorder_alert'] for v in recommendations.values()]
    colors = ['#E74C3C' if a else '#27AE60' for a in alerts]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(items, qtys, color=colors, edgecolor='white', linewidth=0.5)
    ax.bar_label(bars, fmt='%.0f', padding=3, fontsize=10)
    ax.set_title('Recommended Restock Quantities by SKU\n'
                 '(Red = Reorder Alert Active)', fontsize=13, fontweight='bold')
    ax.set_ylabel('Units to Order')
    ax.set_xlabel('Item ID')
    ax.spines[['top', 'right']].set_visible(False)
    ax.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    if save_dir:
        out = Path(save_dir) / "restocking_summary.png"
        fig.savefig(out, dpi=150, bbox_inches='tight')
        print(f"  Saved: {out}")
    return fig