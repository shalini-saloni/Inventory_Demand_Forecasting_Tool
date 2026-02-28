import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.holtwinters import ExponentialSmoothing, SimpleExpSmoothing
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings
warnings.filterwarnings('ignore')


class DemandForecaster:
    
    def __init__(self, seasonal_period: int = 7):
        self.seasonal_period = seasonal_period
        
    def prepare_data(self, df: pd.DataFrame, item_id: str,
                     date_col: str = 'date', sales_col: str = 'sales') -> pd.Series:

        mask = df['item_id'] == item_id
        series = (
            df.loc[mask, [date_col, sales_col]]
            .set_index(date_col)[sales_col]
            .sort_index()
        )
        series.index = pd.to_datetime(series.index)
        series = series.resample('D').sum().fillna(0)
        return series