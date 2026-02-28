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