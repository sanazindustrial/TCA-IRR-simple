"""
ML API endpoints – serves time-series forecasting, score prediction,
risk flag detection, and growth tier classification.

All routes are resilient: they return placeholder / rule-based results
when optional ML libraries (statsmodels, xgboost, tensorflow) are absent.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from app.ml.time_series_engine import time_series_engine
    from app.ml.ml_scoring import ml_scoring
    from app.ml.risk_classifier import risk_classifier
    from app.ml.growth_predictor import growth_predictor
    _ML_AVAILABLE = True
except Exception as _ml_import_err:  # pragma: no cover
    _ML_AVAILABLE = False
    _log = logging.getLogger(__name__)
    _log.warning("ML modules not available: %s", _ml_import_err)
    time_series_engine = None  # type: ignore
    ml_scoring = None  # type: ignore
    risk_classifier = None  # type: ignore
    growth_predictor = None  # type: ignore

logger = logging.getLogger(__name__)
router = APIRouter()

# ═══════════════════════════════════════════════════════════════════════════════
# Request / Response models
# ═══════════════════════════════════════════════════════════════════════════════


class TimeSeriesRequest(BaseModel):
    series: List[float] = Field(..., min_length=2, description="Historical data points")
    steps: int = Field(5, ge=1, le=20, description="Forecast horizon")


class ScoreRequest(BaseModel):
    metrics: Dict[str, Any] = Field(default_factory=dict)
    pitch_text: Optional[str] = None


class RiskRequest(BaseModel):
    metrics: Dict[str, Any] = Field(default_factory=dict)


class GrowthRequest(BaseModel):
    metrics: Dict[str, Any] = Field(default_factory=dict)


class TrainRequest(BaseModel):
    model: str = Field("all", description="'all', 'scoring', 'risk', 'growth', 'time_series'")
    samples: List[Dict[str, Any]] = Field(default_factory=list)
    labels: List[Any] = Field(default_factory=list)
    model_type: str = Field("random_forest", description="'linear', 'random_forest', 'xgboost', 'decision_tree', 'neural_network', 'logistic', 'svm'")


# ═══════════════════════════════════════════════════════════════════════════════
# Status endpoints (heartbeat / health-check)
# ═══════════════════════════════════════════════════════════════════════════════


@router.get("/status")
async def ml_status() -> Dict[str, Any]:
    """Overall ML platform status – used as heartbeat."""
    if not _ML_AVAILABLE:
        return {
            "status": "degraded",
            "ml_available": False,
            "models": {
                "time_series": {"arima": False, "xgboost": False, "lstm": False, "ensemble": False},
                "scoring": {"available": False, "trained": False},
                "risk": {"available": False, "trained": False},
                "growth": {"available": False, "trained": False},
            },
            "message": "ML libraries not available – rules-based fallback active",
        }
    ts_status = time_series_engine.model_status()
    sc_status = ml_scoring.status()
    rc_status = risk_classifier.status()
    gp_status = growth_predictor.status()

    any_available = any(ts_status.values())
    return {
        "status": "online",
        "ml_available": any_available,
        "models": {
            "time_series": ts_status,
            "scoring": {"available": sc_status["sklearn_available"], "trained": sc_status["trained"]},
            "risk": {"available": rc_status["sklearn_available"], "trained": rc_status["trained"]},
            "growth": {"available": gp_status["sklearn_available"], "trained": gp_status["trained"]},
        },
    }


@router.get("/time-series/status")
async def time_series_status() -> Dict[str, Any]:
    """Time-series engine heartbeat."""
    if not _ML_AVAILABLE:
        return {"status": "degraded", "arima": False, "xgboost": False, "lstm": False, "ensemble": False,
                "message": "ML libraries not available"}
    return {
        "status": "online",
        **time_series_engine.model_status(),
    }


@router.get("/training/status")
async def training_status() -> Dict[str, Any]:
    """Training status heartbeat."""
    if not _ML_AVAILABLE:
        return {
            "status": "degraded",
            "scoring": {"sklearn_available": False, "trained": False},
            "risk": {"sklearn_available": False, "trained": False},
            "growth": {"sklearn_available": False, "trained": False},
            "message": "ML libraries not available",
        }
    return {
        "status": "online",
        "scoring": ml_scoring.status(),
        "risk": risk_classifier.status(),
        "growth": growth_predictor.status(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Forecast
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/time-series")
async def run_time_series(req: TimeSeriesRequest) -> Dict[str, Any]:
    """
    Run ARIMA + XGBoost + LSTM ensemble forecast.

    Returns individual model forecasts and blended ensemble prediction.
    """
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available – rules-based fallback active")
    try:
        result = time_series_engine.run_ensemble(req.series, steps=req.steps)
        return {"status": "success", "input_length": len(req.series), **result}
    except Exception as exc:
        logger.exception("Time-series forecast failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/time-series/arima")
async def run_arima(req: TimeSeriesRequest) -> Dict[str, Any]:
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available")
    try:
        forecast = time_series_engine.run_arima(req.series, steps=req.steps)
        return {"model": "arima", "forecast": forecast}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/time-series/xgboost")
async def run_xgboost(req: TimeSeriesRequest) -> Dict[str, Any]:
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available")
    try:
        forecast = time_series_engine.run_xgboost(req.series, steps=req.steps)
        return {"model": "xgboost", "forecast": forecast}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/time-series/lstm")
async def run_lstm(req: TimeSeriesRequest) -> Dict[str, Any]:
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available")
    try:
        forecast = time_series_engine.run_lstm(req.series, steps=req.steps)
        return {"model": "lstm", "forecast": forecast}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Score prediction
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/score")
async def predict_score(req: ScoreRequest) -> Dict[str, Any]:
    """Predict 12-category startup scores (1-10) using ML + rules blend."""
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available – rules-based fallback active")
    try:
        result = ml_scoring.predict(req.metrics, req.pitch_text)
        return {"status": "success", **result}
    except Exception as exc:
        logger.exception("Score prediction failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Risk classification
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/risk")
async def classify_risk(req: RiskRequest) -> Dict[str, Any]:
    """Classify 14 risk flags as RED / YELLOW / GREEN."""
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available – rules-based fallback active")
    try:
        result = risk_classifier.classify(req.metrics)
        return {"status": "success", **result}
    except Exception as exc:
        logger.exception("Risk classification failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Growth prediction
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/predict")
async def predict_growth(req: GrowthRequest) -> Dict[str, Any]:
    """Predict growth tier (1–3) and 3-year scenario matrix."""
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available – rules-based fallback active")
    try:
        result = growth_predictor.predict_tier(req.metrics)
        return {"status": "success", **result}
    except Exception as exc:
        logger.exception("Growth prediction failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# Training
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/train")
async def train_models(req: TrainRequest) -> Dict[str, Any]:
    """
    Trigger training for one or all ML models.

    Labels schema:
    - scoring:  list[dict[category → float]]
    - risk:     list[dict[flag_id → severity]]  ('RED'|'YELLOW'|'GREEN')
    - growth:   list[int]  (1, 2, or 3)
    """
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML libraries not available – training unavailable")
    results: Dict[str, Any] = {}

    if req.model in ("all", "scoring"):
        if req.samples and req.labels:
            results["scoring"] = ml_scoring.train(req.samples, req.labels, req.model_type)
        else:
            results["scoring"] = {"status": "skipped", "reason": "no training data provided"}

    if req.model in ("all", "risk"):
        if req.samples and req.labels:
            results["risk"] = risk_classifier.train(req.samples, req.labels, req.model_type)
        else:
            results["risk"] = {"status": "skipped", "reason": "no training data provided"}

    if req.model in ("all", "growth"):
        if req.samples and req.labels:
            # Growth labels are ints
            int_labels = [int(l) if not isinstance(l, dict) else 2 for l in req.labels]
            results["growth"] = growth_predictor.train(req.samples, int_labels, req.model_type)
        else:
            results["growth"] = {"status": "skipped", "reason": "no training data provided"}

    if not results:
        raise HTTPException(status_code=400, detail=f"Unknown model target: {req.model}")

    return {"status": "success", "results": results}


# ═══════════════════════════════════════════════════════════════════════════════
# Demo / sample data endpoint (for frontend without real data)
# ═══════════════════════════════════════════════════════════════════════════════


@router.get("/demo")
async def demo_data() -> Dict[str, Any]:
    """
    Return sample data demonstrating all ML capabilities.
    Useful for UI development and testing when no real company data exists.
    """
    import random
    random.seed(42)

    # Generate synthetic revenue series (monthly, 24 months)
    base = 50_000.0
    series = [round(base * (1 + 0.05 * i + random.gauss(0, 0.02)), 2) for i in range(24)]

    sample_metrics = {
        "revenue_growth_pct": 85,
        "monthly_revenue": 180_000,
        "burn_rate": 120_000,
        "runway_months": 18,
        "team_size": 12,
        "founder_experience_years": 8,
        "patents_count": 2,
        "customer_count": 340,
        "nps_score": 62,
        "market_size_billions": 4.2,
        "tam_share_pct": 0.8,
        "irr_target_pct": 28,
        "ebitda_margin_pct": -12,
        "recurring_revenue_pct": 75,
        "churn_rate_pct": 3.5,
        "esg_score": 7,
        "governance_score": 6,
        "compliance_score": 8,
        "regulatory_compliance_score": 8,
        "competition_intensity_score": 6,
        "technology_readiness_level": 8,
        "exit_clarity_score": 7,
        "investor_fit_score": 8,
        "top_customer_revenue_pct": 22,
    }

    ts_result = time_series_engine.run_ensemble(series, steps=6)
    score_result = ml_scoring.predict(sample_metrics)
    risk_result = risk_classifier.classify(sample_metrics)
    growth_result = growth_predictor.predict_tier(sample_metrics)

    return {
        "status": "success",
        "demo": True,
        "time_series": {"historical": series, **ts_result},
        "scoring": score_result,
        "risk": risk_result,
        "growth": growth_result,
    }
