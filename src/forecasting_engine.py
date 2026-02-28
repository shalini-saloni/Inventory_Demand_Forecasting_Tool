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
    
    def moving_average_forecast(self, series: pd.Series,
                                 window: int = 7, horizon: int = 30) -> dict:
        ma          = series.rolling(window=window, min_periods=1).mean()
        rolling_std = series.rolling(window=window, min_periods=1).std().fillna(0)
        last_ma     = ma.iloc[-1]
        last_std    = rolling_std.iloc[-1]

        future_idx      = pd.date_range(series.index[-1] + pd.Timedelta(days=1),
                                         periods=horizon, freq='D')
        forecast_values = np.full(horizon, last_ma)
        ci_upper        = forecast_values + 1.96 * last_std
        ci_lower        = np.maximum(forecast_values - 1.96 * last_std, 0)

        return {
            'method':        'Moving Average',
            'window':        window,
            'historical_ma': ma,
            'forecast':      pd.Series(forecast_values, index=future_idx),
            'ci_upper':      pd.Series(ci_upper,         index=future_idx),
            'ci_lower':      pd.Series(ci_lower,         index=future_idx),
        }
        
    def exponential_smoothing_forecast(self, series: pd.Series,
                                        alpha: float = None,
                                        horizon: int = 30) -> dict:
        model = SimpleExpSmoothing(series, initialization_method='estimated')
        fit   = model.fit(smoothing_level=alpha, optimized=(alpha is None))
        forecast = fit.forecast(horizon)

        residuals = series - fit.fittedvalues
        sigma     = residuals.std()
        ci_upper  = pd.Series(np.maximum((forecast + 1.96 * sigma).values, 0),
                               index=forecast.index)
        ci_lower  = pd.Series(np.maximum((forecast - 1.96 * sigma).values, 0),
                               index=forecast.index)

        return {
            'method':   'Exponential Smoothing',
            'alpha':    round(fit.params['smoothing_level'], 4),
            'fitted':   fit.fittedvalues,
            'forecast': forecast,
            'ci_upper': ci_upper,
            'ci_lower': ci_lower,
            'aic':      fit.aic,
        }