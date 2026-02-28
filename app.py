import pandas as pd

df = pd.read_csv("data/retail_sales.csv")

df['date'] = pd.to_datetime(df['date'])

df_2023 = df[df['date'].dt.year == 2023]

selected_items = ['item_1','item_2','item_3','item_4','item_5']

df_small = df_2023[
    (df_2023['store_id'] == 'store_1') &
    (df_2023['item_id'].isin(selected_items))
]

print(df_small.shape)

df_small.to_csv("data/retail_sales_2023_small.csv", index=False)
df = pd.read_csv("data/retail_sales_2023_small.csv")
