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
        
    def holt_winters_forecast(self, series: pd.Series, horizon: int = 30) -> dict:
        sp = self.seasonal_period
        if len(series) >= 2 * sp:
            model    = ExponentialSmoothing(
                series, trend='add', seasonal='add',
                seasonal_periods=sp, initialization_method='estimated'
            )
            seasonal = True
        else:
            model    = ExponentialSmoothing(
                series, trend='add', initialization_method='estimated'
            )
            seasonal = False

        fit      = model.fit(optimized=True)
        forecast = fit.forecast(horizon)

        residuals = series - fit.fittedvalues
        sigma     = residuals.std()
        ci_upper  = pd.Series(np.maximum((forecast + 1.96 * sigma).values, 0),
                               index=forecast.index)
        ci_lower  = pd.Series(np.maximum((forecast - 1.96 * sigma).values, 0),
                               index=forecast.index)

        return {
            'method':   'Holt-Winters',
            'seasonal': seasonal,
            'fitted':   fit.fittedvalues,
            'forecast': forecast,
            'ci_upper': ci_upper,
            'ci_lower': ci_lower,
            'aic':      fit.aic,
        }


    def decompose_series(self, series: pd.Series):
        sp = self.seasonal_period
        if len(series) < 2 * sp:
            return None
        try:
            return seasonal_decompose(series, model='additive', period=sp)
        except Exception:
            return None

    def evaluate(self, actual: pd.Series, fitted: pd.Series) -> dict:
        mask   = ~fitted.isna()
        y_true = actual[mask]
        y_pred = fitted[mask]
        mae    = mean_absolute_error(y_true, y_pred)
        rmse   = np.sqrt(mean_squared_error(y_true, y_pred))
        mape   = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-9))) * 100
        return {'MAE': round(mae, 2), 'RMSE': round(rmse, 2), 'MAPE%': round(mape, 2)}


    def restocking_recommendation(self, forecast: pd.Series,
                                   current_stock: int,
                                   lead_time_days: int = 7,
                                   safety_factor: float = 1.2) -> dict:
        total_forecasted  = forecast.sum()
        demand_lead       = forecast.iloc[:lead_time_days].sum()
        recommended_order = max(0, (total_forecasted * safety_factor) - current_stock)
        daily_avg         = forecast.mean()
        days_of_stock     = current_stock / (daily_avg + 1e-9)
        reorder_needed    = days_of_stock < lead_time_days

        return {
            'current_stock':           current_stock,
            'forecasted_demand_total': round(total_forecasted,  0),
            'demand_during_lead_time': round(demand_lead,       0),
            'recommended_order_qty':   round(recommended_order, 0),
            'days_of_stock_remaining': round(days_of_stock,     1),
            'reorder_alert':           reorder_needed,
        }