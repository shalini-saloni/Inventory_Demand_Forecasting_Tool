from src.data_cleaner import _fill_missing_dates, clean_dataframe
import pandas as pd, io, traceback

s='\ufeffdate,store_id,item_id,sales\n2023-01-01,store_1,item_1,10\n'
df=pd.read_csv(io.StringIO(s))

print('STEP 0: raw columns:', list(df.columns))

# emulate clean_dataframe up to before _fill_missing_dates
df2 = df.copy()
df2.columns = [c.strip().lower().replace(' ', '_') for c in df2.columns]
print('STEP 1: after normalise columns:', list(df2.columns))

df2['date'] = pd.to_datetime(df2['date'], errors='coerce')
df2['sales'] = pd.to_numeric(df2['sales'], errors='coerce')

df2 = df2.dropna(subset=['date', 'item_id'])
df2['sales'] = df2['sales'].fillna(0)

key_cols = ['date', 'item_id'] + (['store_id'] if 'store_id' in df2.columns else [])
print('STEP 2: key_cols for duplicate check:', key_cols)

n_dupes = df2.duplicated(subset=key_cols).sum()
if n_dupes > 0:
    df2 = df2.groupby(key_cols, as_index=False)['sales'].sum()
    print('Merged duplicates')

print('STEP 3: columns before outlier capping:', list(df2.columns))

def cap_outliers(group):
    q1  = group['sales'].quantile(0.25)
    q3  = group['sales'].quantile(0.75)
    iqr = q3 - q1
    upper = q3 + 3.0 * iqr
    group = group.copy()
    group['sales'] = group['sales'].clip(upper=upper)
    return group

df3 = df2.groupby('item_id', group_keys=False).apply(cap_outliers)
print('STEP 4: columns after groupby.apply:', list(df3.columns))
df3 = df3.reset_index()
print('STEP 5: columns after reset_index:', list(df3.columns))

try:
    out = _fill_missing_dates(df3)
    print('fill ok', out[1])
except Exception:
    traceback.print_exc()

try:
    cleaned, report = clean_dataframe(df)
    print('clean ok, cleaned columns:', list(cleaned.columns))
    print('steps:', report['steps'])
except Exception:
    traceback.print_exc()
