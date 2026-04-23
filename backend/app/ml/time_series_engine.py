"""
Time-Series Engine – ARIMA + XGBoost + LSTM ensemble.

All heavy imports are guarded with try/except so the module loads gracefully
even when optional ML libraries (statsmodels, xgboost, tensorflow) are absent.
The ensemble blends three signals: 30 % ARIMA, 40 % XGBoost, 30 % LSTM.
"""
from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional

try:
    import numpy as np
    _NUMPY_AVAILABLE = True
except ImportError:
    np = None  # type: ignore
    _NUMPY_AVAILABLE = False

logger = logging.getLogger(__name__)

# ── Optional heavy deps ──────────────────────────────────────────────────────
try:
    from statsmodels.tsa.arima.model import ARIMA as _ARIMA  # type: ignore
    _ARIMA_AVAILABLE = True
except ImportError:
    _ARIMA_AVAILABLE = False
    logger.warning("statsmodels not installed – ARIMA will use linear fallback")

try:
    import xgboost as xgb  # type: ignore
    _XGB_AVAILABLE = True
except ImportError:
    _XGB_AVAILABLE = False
    logger.warning("xgboost not installed – XGBoost will use linear fallback")

try:
    from tensorflow.keras.models import Sequential  # type: ignore
    from tensorflow.keras.layers import LSTM, Dense  # type: ignore
    _KERAS_AVAILABLE = True
except ImportError:
    _KERAS_AVAILABLE = False
    logger.warning("tensorflow not installed – LSTM will use linear fallback")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _linear_extrapolate(series: List[float], steps: int) -> List[float]:
    """Simple linear extrapolation used as fallback when a model is unavailable."""
    if len(series) < 2:
        return [series[-1]] * steps if series else [0.0] * steps
    slope = (series[-1] - series[0]) / (len(series) - 1)
    last = series[-1]
    return [round(last + slope * (i + 1), 4) for i in range(steps)]


def _build_lag_features(series: List[float], lags: int = 5):
    """Create lagged feature matrix for XGBoost from a 1-D series."""
    arr = np.array(series, dtype=float)
    X, y = [], []
    for i in range(lags, len(arr)):
        X.append(arr[i - lags:i])
        y.append(arr[i])
    return np.array(X), np.array(y)


# ── Engine ───────────────────────────────────────────────────────────────────

class TimeSeriesEngine:
    """Hybrid time-series forecasting engine (ARIMA + XGBoost + LSTM)."""

    # Ensemble weights (must sum to 1.0)
    ARIMA_WEIGHT: float = 0.30
    XGB_WEIGHT: float = 0.40
    LSTM_WEIGHT: float = 0.30

    # ── ARIMA ────────────────────────────────────────────────────────────────

    def run_arima(self, series: List[float], steps: int = 5) -> List[float]:
        """Fit ARIMA(2,1,2) and return *steps* forecasted values."""
        if not _ARIMA_AVAILABLE or len(series) < 10:
            return _linear_extrapolate(series, steps)
        try:
            model_fit = _ARIMA(series, order=(2, 1, 2)).fit()
            forecast = model_fit.forecast(steps=steps)
            return [round(float(v), 4) for v in forecast]
        except Exception as exc:
            logger.warning("ARIMA fit failed: %s – using linear fallback", exc)
            return _linear_extrapolate(series, steps)

    # ── XGBoost ──────────────────────────────────────────────────────────────

    def run_xgboost(
        self,
        series: List[float],
        steps: int = 5,
        lags: int = 5,
    ) -> List[float]:
        """Train XGBRegressor on lagged features and forecast *steps* ahead."""
        if not _XGB_AVAILABLE or len(series) < lags + 2:
            return _linear_extrapolate(series, steps)
        try:
            X, y = _build_lag_features(series, lags=lags)
            model = xgb.XGBRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=4,
                verbosity=0,
                use_label_encoder=False,
            )
            model.fit(X, y)
            # Iterative multi-step forecast
            history = list(series[-lags:])
            preds: List[float] = []
            for _ in range(steps):
                x_in = np.array(history[-lags:]).reshape(1, -1)
                p = float(model.predict(x_in)[0])
                preds.append(round(p, 4))
                history.append(p)
            return preds
        except Exception as exc:
            logger.warning("XGBoost forecast failed: %s – using linear fallback", exc)
            return _linear_extrapolate(series, steps)

    # ── LSTM ─────────────────────────────────────────────────────────────────

    def run_lstm(self, series: List[float], steps: int = 5) -> List[float]:
        """Train a single-layer LSTM and forecast *steps* ahead."""
        if not _KERAS_AVAILABLE or len(series) < 10:
            return _linear_extrapolate(series, steps)
        try:
            data = np.array(series, dtype=float)
            # Normalise to [0, 1]
            d_min, d_max = data.min(), data.max()
            if d_max - d_min == 0:
                return [float(d_min)] * steps
            norm = (data - d_min) / (d_max - d_min)
            X = norm[:-1].reshape(-1, 1, 1)
            y = norm[1:]

            model = Sequential()
            model.add(LSTM(50, activation="relu", input_shape=(1, 1)))
            model.add(Dense(1))
            model.compile(optimizer="adam", loss="mse")
            model.fit(X, y, epochs=20, verbose=0)

            # Auto-regressive forecast
            last = norm[-1:]
            preds_norm: List[float] = []
            for _ in range(steps):
                inp = last.reshape(1, 1, 1)
                p = float(model.predict(inp, verbose=0)[0][0])
                preds_norm.append(p)
                last = np.array([p])

            # Denormalise
            return [round(float(p) * (d_max - d_min) + d_min, 4) for p in preds_norm]
        except Exception as exc:
            logger.warning("LSTM forecast failed: %s – using linear fallback", exc)
            return _linear_extrapolate(series, steps)

    # ── Ensemble ─────────────────────────────────────────────────────────────

    def run_ensemble(self, series: List[float], steps: int = 5) -> Dict[str, Any]:
        """
        Blend ARIMA, XGBoost and LSTM forecasts.

        Returns a dict with individual and blended forecasts plus confidence bounds.
        """
        arima_fc = self.run_arima(series, steps)
        xgb_fc = self.run_xgboost(series, steps)
        lstm_fc = self.run_lstm(series, steps)

        blended: List[float] = []
        for a, x, l in zip(arima_fc, xgb_fc, lstm_fc):
            b = self.ARIMA_WEIGHT * a + self.XGB_WEIGHT * x + self.LSTM_WEIGHT * l
            blended.append(round(b, 4))

        # Simple confidence interval: ±1 std of the three forecasts at each step
        lower, upper = [], []
        for a, x, l, b in zip(arima_fc, xgb_fc, lstm_fc, blended):
            if _NUMPY_AVAILABLE:
                std = float(np.std([a, x, l]))
            else:
                vals = [a, x, l]
                mean = sum(vals) / 3
                std = (sum((v - mean) ** 2 for v in vals) / 3) ** 0.5
            lower.append(round(b - std, 4))
            upper.append(round(b + std, 4))

        return {
            "arima": arima_fc,
            "xgboost": xgb_fc,
            "lstm": lstm_fc,
            "ensemble": blended,
            "lower_bound": lower,
            "upper_bound": upper,
            "weights": {
                "arima": self.ARIMA_WEIGHT,
                "xgboost": self.XGB_WEIGHT,
                "lstm": self.LSTM_WEIGHT,
            },
            "available_models": {
                "arima": _ARIMA_AVAILABLE,
                "xgboost": _XGB_AVAILABLE,
                "lstm": _KERAS_AVAILABLE,
            },
        }

    def model_status(self) -> Dict[str, bool]:
        return {
            "arima": _ARIMA_AVAILABLE,
            "xgboost": _XGB_AVAILABLE,
            "lstm": _KERAS_AVAILABLE,
        }


# Module-level singleton
time_series_engine = TimeSeriesEngine()
