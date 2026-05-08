"""
ML Scoring Engine – predicts 12-category startup scores using a hybrid
rule + ML approach.

Phase 1 (current): Rules-based scoring with an ML correction layer.
Phase 2: ML suggests scores (requires ≥100 labelled samples).
Phase 3: Continuous learning with analyst feedback loop.

Models: Linear Regression (baseline), Random Forest, XGBoost.
Output: 12 scores in [1, 10] + confidence + model used.
"""
from __future__ import annotations

import logging
import math
from typing import Dict, List, Any, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Optional deps ────────────────────────────────────────────────────────────
try:
    from sklearn.linear_model import LinearRegression  # type: ignore
    from sklearn.ensemble import RandomForestRegressor  # type: ignore
    from sklearn.preprocessing import StandardScaler  # type: ignore
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed – ML scoring will use rule-based fallback")

try:
    import xgboost as xgb  # type: ignore
    _XGB_AVAILABLE = True
except ImportError:
    _XGB_AVAILABLE = False

# ── Category definitions ─────────────────────────────────────────────────────

SCORE_CATEGORIES: List[str] = [
    "team_strength",
    "market_size",
    "product_innovation",
    "business_model",
    "traction",
    "financial_health",
    "competitive_moat",
    "scalability",
    "exit_potential",
    "esg_alignment",
    "regulatory_compliance",
    "investor_fit",
]

# Rule weights used when ML model is not available or has low confidence
_RULE_WEIGHTS: Dict[str, float] = {
    "team_strength": 0.20,
    "market_size": 0.15,
    "product_innovation": 0.15,
    "business_model": 0.10,
    "traction": 0.12,
    "financial_health": 0.10,
    "competitive_moat": 0.08,
    "scalability": 0.05,
    "exit_potential": 0.03,
    "esg_alignment": 0.01,
    "regulatory_compliance": 0.01,
    "investor_fit": 0.0,
}


# ── Feature engineering ───────────────────────────────────────────────────────

def _build_feature_vector(metrics: Dict[str, Any]) -> np.ndarray:
    """
    Convert raw pitch metrics into a fixed-length float feature vector.
    Unknown fields are filled with 0.
    """
    features = [
        float(metrics.get("revenue_growth_pct", 0)),
        float(metrics.get("monthly_revenue", 0)),
        float(metrics.get("burn_rate", 0)),
        float(metrics.get("runway_months", 0)),
        float(metrics.get("team_size", 0)),
        float(metrics.get("founder_experience_years", 0)),
        float(metrics.get("patents_count", 0)),
        float(metrics.get("customer_count", 0)),
        float(metrics.get("nps_score", 0)),
        float(metrics.get("market_size_billions", 0)),
        float(metrics.get("tam_share_pct", 0)),
        float(metrics.get("irr_target_pct", 0)),
        float(metrics.get("ebitda_margin_pct", 0)),
        float(metrics.get("recurring_revenue_pct", 0)),
        float(metrics.get("churn_rate_pct", 0)),
    ]
    return np.array(features, dtype=float)


def _rule_based_score(category: str, metrics: Dict[str, Any]) -> float:
    """Deterministic rule-based score (1-10) for a given category."""
    raw = metrics.get("revenue_growth_pct", 0)
    team = metrics.get("team_size", 1)
    runway = metrics.get("runway_months", 6)
    market = metrics.get("market_size_billions", 0)

    score_map: Dict[str, float] = {
        "team_strength": min(10, 4 + math.log1p(team) * 1.5),
        "market_size": min(10, 3 + math.log1p(market) * 2),
        "product_innovation": min(10, 5 + float(metrics.get("patents_count", 0)) * 0.5),
        "business_model": min(10, 5 + float(metrics.get("recurring_revenue_pct", 50)) / 20),
        "traction": min(10, 4 + math.log1p(float(metrics.get("customer_count", 0))) * 0.8),
        "financial_health": min(10, 3 + min(runway / 3, 4) + float(metrics.get("ebitda_margin_pct", 0)) / 20),
        "competitive_moat": min(10, 5 + float(metrics.get("patents_count", 0)) * 0.4),
        "scalability": min(10, 4 + raw / 20),
        "exit_potential": min(10, 5 + float(metrics.get("irr_target_pct", 20)) / 10),
        "esg_alignment": float(metrics.get("esg_score", 5)),
        "regulatory_compliance": float(metrics.get("compliance_score", 7)),
        "investor_fit": float(metrics.get("investor_fit_score", 6)),
    }
    return round(max(1.0, min(10.0, score_map.get(category, 5.0))), 2)


# ── Scorer ───────────────────────────────────────────────────────────────────

class MLScoring:
    """
    Generates 12-category scores for a startup pitch.
    Falls back to rule-based scoring when ML libraries are unavailable or
    when the training set is too small for reliable predictions.
    """

    MIN_SAMPLES_FOR_ML = 50  # Require ≥50 training rows before trusting ML

    def __init__(self) -> None:
        self._scaler: Optional[Any] = StandardScaler() if _SKLEARN_AVAILABLE else None
        self._models: Dict[str, Any] = {}  # category → fitted model
        self._trained = False
        self._training_samples = 0

    # ── Training ─────────────────────────────────────────────────────────────

    def train(
        self,
        samples: List[Dict[str, Any]],
        labels: List[Dict[str, float]],
        model_type: str = "random_forest",
    ) -> Dict[str, Any]:
        """
        Train per-category regression models.

        samples: list of metric dicts (same schema as predict input).
        labels:  list of dicts mapping category → ground-truth score (1-10).
        model_type: 'linear', 'random_forest', or 'xgboost'.
        """
        if not _SKLEARN_AVAILABLE:
            return {"status": "error", "message": "scikit-learn not installed"}
        if len(samples) < 2:
            return {"status": "error", "message": "Need at least 2 samples to train"}

        X = np.array([_build_feature_vector(m) for m in samples])
        self._scaler.fit(X)
        X_scaled = self._scaler.transform(X)

        results: Dict[str, float] = {}
        for cat in SCORE_CATEGORIES:
            y = np.array([lbl.get(cat, 5.0) for lbl in labels])
            if model_type == "xgboost" and _XGB_AVAILABLE:
                mdl = xgb.XGBRegressor(n_estimators=50, verbosity=0)
            elif model_type == "linear":
                mdl = LinearRegression()
            else:
                mdl = RandomForestRegressor(n_estimators=50, random_state=42)
            mdl.fit(X_scaled, y)
            self._models[cat] = mdl
            # Compute in-sample R²
            try:
                results[cat] = round(float(mdl.score(X_scaled, y)), 4)
            except Exception:
                results[cat] = 0.0

        self._trained = True
        self._training_samples = len(samples)
        logger.info("MLScoring trained on %d samples with %s", len(samples), model_type)
        return {
            "status": "success",
            "model_type": model_type,
            "samples": len(samples),
            "r2_scores": results,
        }

    # ── Prediction ────────────────────────────────────────────────────────────

    def predict(
        self,
        metrics: Dict[str, Any],
        pitch_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Return 12 category scores plus metadata.

        If ML models are trained and reliable, blends ML + rules.
        Otherwise returns pure rules-based scores.
        """
        rule_scores = {cat: _rule_based_score(cat, metrics) for cat in SCORE_CATEGORIES}

        use_ml = (
            _SKLEARN_AVAILABLE
            and self._trained
            and self._training_samples >= self.MIN_SAMPLES_FOR_ML
            and self._scaler is not None
        )

        if use_ml:
            try:
                x = _build_feature_vector(metrics).reshape(1, -1)
                x_scaled = self._scaler.transform(x)
                ml_scores: Dict[str, float] = {}
                for cat, mdl in self._models.items():
                    p = float(mdl.predict(x_scaled)[0])
                    ml_scores[cat] = round(max(1.0, min(10.0, p)), 2)
                # Blend: 60 % ML, 40 % rules when ML is available
                blended = {
                    cat: round(0.6 * ml_scores.get(cat, rule_scores[cat]) + 0.4 * rule_scores[cat], 2)
                    for cat in SCORE_CATEGORIES
                }
                overall = round(sum(blended.values()) / len(blended), 2)
                return {
                    "scores": blended,
                    "overall": overall,
                    "mode": "ml_blend",
                    "confidence": 0.85,
                    "ml_available": True,
                    "training_samples": self._training_samples,
                }
            except Exception as exc:
                logger.warning("ML prediction failed: %s – using rule-based", exc)

        overall = round(sum(rule_scores.values()) / len(rule_scores), 2)
        return {
            "scores": rule_scores,
            "overall": overall,
            "mode": "rule_based",
            "confidence": 0.70,
            "ml_available": _SKLEARN_AVAILABLE,
            "training_samples": self._training_samples,
        }

    def status(self) -> Dict[str, Any]:
        return {
            "trained": self._trained,
            "training_samples": self._training_samples,
            "sklearn_available": _SKLEARN_AVAILABLE,
            "xgboost_available": _XGB_AVAILABLE,
            "categories": SCORE_CATEGORIES,
        }


# Module-level singleton
ml_scoring = MLScoring()
