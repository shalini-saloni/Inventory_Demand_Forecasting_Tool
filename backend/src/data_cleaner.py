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
        key = getattr(group, 'name', None)
        group = group.copy()
        if 'item_id' not in group.columns and key is not None:
            group['item_id'] = key

        q1  = group['sales'].quantile(0.25)
        q3  = group['sales'].quantile(0.75)
        iqr = q3 - q1
        upper = q3 + 3.0 * iqr          
        n = (group['sales'] > upper).sum()
        total_capped += n
        group['sales'] = group['sales'].clip(upper=upper)
        return group

    df = df.groupby('item_id', group_keys=False).apply(cap_outliers)
    df = df.reset_index()
    df['sales'] = df['sales'].round(0).astype(int)
    report['steps'].append(f'Outliers capped at Q3 + 3×IQR per item: {total_capped} values')

    df, filled_rows = _fill_missing_dates(df)
    report['steps'].append(f'Missing calendar days filled with 0 sales: {filled_rows} rows added')

    sort_cols = ['item_id', 'date'] + (['store_id'] if 'store_id' in df.columns else [])
    df = df.sort_values(sort_cols).reset_index(drop=True)
    report['steps'].append('Sorted by item_id, date')

    report['final_shape'] = df.shape
    return df, report


def _fill_missing_dates(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    group_cols = ['item_id']
    if 'store_id' in df.columns:
        group_cols = ['store_id'] + group_cols

    full_date_range = pd.date_range(df['date'].min(), df['date'].max(), freq='D')
    pieces  = []
    filled  = 0

    for keys, grp in df.groupby(group_cols):
        grp = grp.set_index('date').reindex(full_date_range)
        grp.index.name = 'date'
        grp = grp.reset_index()

        if isinstance(keys, str):
            keys = (keys,)
        for col, val in zip(group_cols, keys):
            if col in grp.columns:
                grp[col] = grp[col].fillna(val)
            else:
                grp[col] = val

        n_before = grp['sales'].isna().sum()
        grp['sales'] = grp['sales'].fillna(0).astype(int)
        filled += int(n_before)
        pieces.append(grp)

    return pd.concat(pieces, ignore_index=True), filled


def print_cleaning_report(report: dict):
    print(f"\n{'─'*55}")
    print("DATA CLEANING REPORT")
    print(f"{'─'*55}")
    print(f"  Original shape : {report['original_shape']}")
    print(f"  Final shape    : {report['final_shape']}")
    print(f"\n  Steps performed:")
    for i, step in enumerate(report['steps'], 1):
        print(f"    {i}. {step}")
    print(f"{'─'*55}\n")