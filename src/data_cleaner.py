import pandas as pd
import numpy as np
from typing import Tuple

def clean_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:

    report = {
        'original_shape':   df.shape,
        'steps':            [],
    }
    df = df.copy()

    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
    report['steps'].append('Column names standardised (lowercase, underscores)')

    required = {'date', 'item_id', 'sales'}
    missing_cols = required - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    df['date']  = pd.to_datetime(df['date'], errors='coerce')
    df['sales'] = pd.to_numeric(df['sales'], errors='coerce')
    report['steps'].append('Types cast: date → datetime, sales → numeric')

    n_null_dates  = df['date'].isna().sum()
    n_null_sales  = df['sales'].isna().sum()
    n_null_item   = df['item_id'].isna().sum() if 'item_id' in df.columns else 0

    before = len(df)
    df = df.dropna(subset=['date', 'item_id'])
    dropped_key = before - len(df)

    df['sales'] = df['sales'].fillna(0)

    report['steps'].append(
        f'Nulls: date={n_null_dates}, item_id={n_null_item}, '
        f'sales={n_null_sales} (sales→0). Dropped {dropped_key} rows with null date/item_id.'
    )

    key_cols = ['date', 'item_id'] + (['store_id'] if 'store_id' in df.columns else [])
    n_dupes = df.duplicated(subset=key_cols).sum()
    if n_dupes > 0:
        df = df.groupby(key_cols, as_index=False)['sales'].sum()
        report['steps'].append(f'Duplicates: {n_dupes} merged by summing sales')
    else:
        report['steps'].append('Duplicates: none found')

    n_neg = (df['sales'] < 0).sum()
    df['sales'] = df['sales'].clip(lower=0)
    report['steps'].append(f'Negative sales clipped to 0: {n_neg} rows')

    total_capped = 0
    def cap_outliers(group):
        nonlocal total_capped
        q1  = group['sales'].quantile(0.25)
        q3  = group['sales'].quantile(0.75)
        iqr = q3 - q1
        upper = q3 + 3.0 * iqr          
        n = (group['sales'] > upper).sum()
        total_capped += n
        group = group.copy()
        group['sales'] = group['sales'].clip(upper=upper)
        return group

    df = df.groupby('item_id', group_keys=False).apply(cap_outliers)
    df['sales'] = df['sales'].round(0).astype(int)
    report['steps'].append(f'Outliers capped at Q3 + 3×IQR per item: {total_capped} values')

    