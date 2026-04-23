"""
Growth Predictor – classifies startups into Growth Tiers 1-3 and runs
scenario simulation using Decision Tree and Neural Network.

Tier 1 = High Growth (>3× expected within 3 years)
Tier 2 = Moderate Growth (1.5–3×)
Tier 3 = Low / Uncertain Growth (<1.5×)
"""
from __future__ import annotations

import logging
import math
from typing import Dict, List, Any, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Optional deps ─────────────────────────────────────────────────────────────
try:
    from sklearn.tree import DecisionTreeClassifier  # type: ignore
    from sklearn.preprocessing import StandardScaler  # type: ignore
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed – growth prediction uses rule-based fallback")

try:
    from tensorflow.keras.models import Sequential  # type: ignore
    from tensorflow.keras.layers import Dense, Dropout  # type: ignore
    _KERAS_AVAILABLE = True
except ImportError:
    _KERAS_AVAILABLE = False

# ── Tier labels ───────────────────────────────────────────────────────────────
TIERS: Dict[int, str] = {1: "High Growth", 2: "Moderate Growth", 3: "Low Growth"}

# ── Feature builder ──────────────────────────────────────────────────────────

def _features(metrics: Dict[str, Any]) -> np.ndarray:
    return np.array([
        float(metrics.get("revenue_growth_pct", 0)),
        float(metrics.get("monthly_revenue", 0)),
        float(metrics.get("market_size_billions", 0)),
        float(metrics.get("tam_share_pct", 0)),
        float(metrics.get("customer_count", 0)),
        float(metrics.get("nps_score", 0)),
        float(metrics.get("team_size", 1)),
        float(metrics.get("runway_months", 6)),
        float(metrics.get("recurring_revenue_pct", 0)),
        float(metrics.get("churn_rate_pct", 0)),
    ], dtype=float)


# ── Rule-based tier ───────────────────────────────────────────────────────────

def _rule_tier(metrics: Dict[str, Any]) -> int:
    growth = float(metrics.get("revenue_growth_pct", 0))
    runway = float(metrics.get("runway_months", 6))
    market = float(metrics.get("market_size_billions", 0))
    nps = float(metrics.get("nps_score", 0))

    score = 0
    if growth > 100:
        score += 3
    elif growth > 50:
        score += 2
    elif growth > 20:
        score += 1

    if runway > 24:
        score += 2
    elif runway > 12:
        score += 1

    if market > 5:
        score += 2
    elif market > 1:
        score += 1

    if nps > 50:
        score += 1

    if score >= 6:
        return 1
    elif score >= 3:
        return 2
    return 3


# ── Predictor ─────────────────────────────────────────────────────────────────

class GrowthPredictor:
    """Classifies growth tier and runs scenario simulation."""

    MIN_SAMPLES_FOR_ML = 30

    def __init__(self) -> None:
        self._dt_model: Optional[Any] = None
        self._nn_model: Optional[Any] = None
        self._scaler: Optional[Any] = StandardScaler() if _SKLEARN_AVAILABLE else None
        self._trained = False
        self._training_samples = 0

    # ── Training ──────────────────────────────────────────────────────────────

    def train(
        self,
        samples: List[Dict[str, Any]],
        labels: List[int],                # 1, 2, or 3
        model_type: str = "decision_tree",
    ) -> Dict[str, Any]:
        if not _SKLEARN_AVAILABLE:
            return {"status": "error", "message": "scikit-learn not installed"}
        if len(samples) < 2:
            return {"status": "error", "message": "Need at least 2 samples"}

        X = np.array([_features(s) for s in samples])
        y = np.array(labels, dtype=int)
        self._scaler.fit(X)
        X_sc = self._scaler.transform(X)

        if model_type == "neural_network" and _KERAS_AVAILABLE:
            self._nn_model = self._build_nn(X_sc.shape[1])
            # Convert labels to one-hot
            y_oh = np.zeros((len(y), 3))
            for i, lbl in enumerate(y):
                y_oh[i, lbl - 1] = 1
            self._nn_model.fit(X_sc, y_oh, epochs=30, verbose=0)
        else:
            self._dt_model = DecisionTreeClassifier(max_depth=6, random_state=42)
            self._dt_model.fit(X_sc, y)

        self._trained = True
        self._training_samples = len(samples)
        return {
            "status": "success",
            "model_type": model_type,
            "samples": len(samples),
        }

    def _build_nn(self, input_dim: int):
        mdl = Sequential()
        mdl.add(Dense(64, activation="relu", input_dim=input_dim))
        mdl.add(Dropout(0.2))
        mdl.add(Dense(32, activation="relu"))
        mdl.add(Dense(3, activation="softmax"))
        mdl.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
        return mdl

    # ── Prediction ────────────────────────────────────────────────────────────

    def predict_tier(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Return growth tier, confidence, and the 3-year scenario matrix."""
        rule_tier = _rule_tier(metrics)
        tier, confidence, mode = rule_tier, 0.70, "rule_based"

        use_ml = (
            self._trained
            and self._training_samples >= self.MIN_SAMPLES_FOR_ML
        )

        if use_ml and self._scaler is not None:
            try:
                X_sc = self._scaler.transform(_features(metrics).reshape(1, -1))
                if self._nn_model is not None:
                    probs = self._nn_model.predict(X_sc, verbose=0)[0]
                    tier = int(np.argmax(probs)) + 1
                    confidence = round(float(probs.max()), 2)
                    mode = "neural_network"
                elif self._dt_model is not None:
                    tier = int(self._dt_model.predict(X_sc)[0])
                    proba = self._dt_model.predict_proba(X_sc)[0]
                    confidence = round(float(proba.max()), 2)
                    mode = "decision_tree"
            except Exception as exc:
                logger.warning("Growth ML predict failed: %s", exc)

        scenarios = self._run_scenarios(metrics, tier)

        return {
            "tier": tier,
            "tier_label": TIERS[tier],
            "confidence": confidence,
            "mode": mode,
            "scenarios": scenarios,
        }

    def _run_scenarios(self, metrics: Dict[str, Any], tier: int) -> Dict[str, Any]:
        """Generate bear / base / bull 3-year revenue projections."""
        revenue = float(metrics.get("monthly_revenue", 0)) * 12  # annual
        growth = float(metrics.get("revenue_growth_pct", 20)) / 100

        tier_multipliers = {1: (0.6, 1.0, 1.5), 2: (0.3, 0.6, 1.0), 3: (0.1, 0.3, 0.6)}
        bear_g, base_g, bull_g = tier_multipliers[tier]

        def project(g: float) -> List[float]:
            return [round(revenue * (1 + g) ** y, 2) for y in range(1, 4)]

        return {
            "bear": {"growth_rate": round(bear_g * 100, 1), "revenue_y1y2y3": project(bear_g)},
            "base": {"growth_rate": round(base_g * 100, 1), "revenue_y1y2y3": project(base_g)},
            "bull": {"growth_rate": round(bull_g * 100, 1), "revenue_y1y2y3": project(bull_g)},
        }

    def status(self) -> Dict[str, Any]:
        return {
            "trained": self._trained,
            "training_samples": self._training_samples,
            "sklearn_available": _SKLEARN_AVAILABLE,
            "keras_available": _KERAS_AVAILABLE,
        }


# Module-level singleton
growth_predictor = GrowthPredictor()
