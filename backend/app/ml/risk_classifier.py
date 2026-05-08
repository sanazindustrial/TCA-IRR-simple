"""
Risk Classifier – detects 14 risk flags with RED / YELLOW / GREEN severity
using Logistic Regression (fast) and SVM (high-accuracy fallback).

Each flag is evaluated independently; results are returned as a structured list.
"""
from __future__ import annotations

import logging
from typing import Dict, List, Any, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ── Optional deps ─────────────────────────────────────────────────────────────
try:
    from sklearn.linear_model import LogisticRegression  # type: ignore
    from sklearn.svm import SVC  # type: ignore
    from sklearn.preprocessing import StandardScaler  # type: ignore
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed – risk classification uses rule-based fallback")

# ── Risk flag registry ────────────────────────────────────────────────────────

RISK_FLAGS: List[Dict[str, Any]] = [
    {"id": "burn_rate_risk",        "label": "High Burn Rate",              "category": "financial"},
    {"id": "runway_risk",           "label": "Short Runway",                "category": "financial"},
    {"id": "concentration_risk",    "label": "Customer Concentration",      "category": "market"},
    {"id": "market_size_risk",      "label": "Limited Market Size",         "category": "market"},
    {"id": "team_risk",             "label": "Thin Team / Single Founder",  "category": "team"},
    {"id": "regulatory_risk",       "label": "Regulatory Exposure",         "category": "compliance"},
    {"id": "ip_risk",               "label": "No IP / Patent Protection",   "category": "legal"},
    {"id": "churn_risk",            "label": "High Churn Rate",             "category": "product"},
    {"id": "revenue_risk",          "label": "No Recurring Revenue",        "category": "financial"},
    {"id": "competition_risk",      "label": "Intense Competition",         "category": "market"},
    {"id": "esg_risk",              "label": "Low ESG Score",               "category": "esg"},
    {"id": "governance_risk",       "label": "Weak Governance",             "category": "compliance"},
    {"id": "technology_risk",       "label": "Technology Maturity Gap",     "category": "product"},
    {"id": "exit_risk",             "label": "Unclear Exit Strategy",       "category": "strategy"},
]

Severity = str  # 'RED' | 'YELLOW' | 'GREEN'


# ── Rule-based evaluation ─────────────────────────────────────────────────────

def _rule_severity(flag_id: str, metrics: Dict[str, Any]) -> Tuple[Severity, float]:
    """Return (severity, confidence) for a flag using deterministic rules."""
    burn = float(metrics.get("burn_rate", 0))
    runway = float(metrics.get("runway_months", 12))
    churn = float(metrics.get("churn_rate_pct", 0))
    customers = int(metrics.get("customer_count", 0))
    top_customer_pct = float(metrics.get("top_customer_revenue_pct", 0))
    market = float(metrics.get("market_size_billions", 1))
    team_size = int(metrics.get("team_size", 1))
    patents = int(metrics.get("patents_count", 0))
    recurring_rev = float(metrics.get("recurring_revenue_pct", 0))
    competition_score = float(metrics.get("competition_intensity_score", 5))
    esg = float(metrics.get("esg_score", 5))
    governance = float(metrics.get("governance_score", 5))
    tech_trl = float(metrics.get("technology_readiness_level", 7))
    exit_clarity = float(metrics.get("exit_clarity_score", 5))
    compliance = float(metrics.get("regulatory_compliance_score", 5))

    rules: Dict[str, Tuple[Severity, float]] = {
        "burn_rate_risk": ("RED", 0.9) if burn > 500_000 else ("YELLOW", 0.7) if burn > 200_000 else ("GREEN", 0.85),
        "runway_risk": ("RED", 0.95) if runway < 6 else ("YELLOW", 0.80) if runway < 12 else ("GREEN", 0.90),
        "concentration_risk": ("RED", 0.9) if top_customer_pct > 50 else ("YELLOW", 0.75) if top_customer_pct > 30 else ("GREEN", 0.85),
        "market_size_risk": ("RED", 0.85) if market < 0.1 else ("YELLOW", 0.70) if market < 0.5 else ("GREEN", 0.80),
        "team_risk": ("RED", 0.90) if team_size == 1 else ("YELLOW", 0.70) if team_size < 3 else ("GREEN", 0.85),
        "regulatory_risk": ("RED", 0.85) if compliance < 3 else ("YELLOW", 0.70) if compliance < 6 else ("GREEN", 0.80),
        "ip_risk": ("RED", 0.80) if patents == 0 else ("YELLOW", 0.65) if patents < 2 else ("GREEN", 0.80),
        "churn_risk": ("RED", 0.90) if churn > 10 else ("YELLOW", 0.75) if churn > 5 else ("GREEN", 0.85),
        "revenue_risk": ("RED", 0.90) if recurring_rev < 20 else ("YELLOW", 0.70) if recurring_rev < 50 else ("GREEN", 0.85),
        "competition_risk": ("RED", 0.85) if competition_score > 8 else ("YELLOW", 0.70) if competition_score > 6 else ("GREEN", 0.80),
        "esg_risk": ("RED", 0.80) if esg < 3 else ("YELLOW", 0.65) if esg < 6 else ("GREEN", 0.80),
        "governance_risk": ("RED", 0.85) if governance < 3 else ("YELLOW", 0.70) if governance < 6 else ("GREEN", 0.82),
        "technology_risk": ("RED", 0.85) if tech_trl < 4 else ("YELLOW", 0.70) if tech_trl < 7 else ("GREEN", 0.80),
        "exit_risk": ("RED", 0.80) if exit_clarity < 3 else ("YELLOW", 0.65) if exit_clarity < 6 else ("GREEN", 0.80),
    }
    return rules.get(flag_id, ("YELLOW", 0.50))


# ── Classifier ────────────────────────────────────────────────────────────────

class RiskClassifier:
    """Classifies 14 risk dimensions as RED / YELLOW / GREEN."""

    MIN_SAMPLES_FOR_ML = 30

    def __init__(self) -> None:
        self._models: Dict[str, Any] = {}  # flag_id → fitted model
        self._scaler: Optional[Any] = StandardScaler() if _SKLEARN_AVAILABLE else None
        self._trained = False
        self._training_samples = 0

    # ── Training ──────────────────────────────────────────────────────────────

    def train(
        self,
        samples: List[Dict[str, Any]],
        labels: List[Dict[str, Severity]],
        model_type: str = "logistic",
    ) -> Dict[str, Any]:
        if not _SKLEARN_AVAILABLE:
            return {"status": "error", "message": "scikit-learn not installed"}
        if len(samples) < 2:
            return {"status": "error", "message": "Need at least 2 samples"}

        # Build feature matrix (same 15 columns as rules)
        def _features(m: Dict[str, Any]) -> List[float]:
            return [
                float(m.get("burn_rate", 0)),
                float(m.get("runway_months", 12)),
                float(m.get("churn_rate_pct", 0)),
                float(m.get("top_customer_revenue_pct", 0)),
                float(m.get("market_size_billions", 1)),
                float(m.get("team_size", 1)),
                float(m.get("patents_count", 0)),
                float(m.get("recurring_revenue_pct", 0)),
                float(m.get("competition_intensity_score", 5)),
                float(m.get("esg_score", 5)),
                float(m.get("governance_score", 5)),
                float(m.get("technology_readiness_level", 7)),
                float(m.get("exit_clarity_score", 5)),
                float(m.get("regulatory_compliance_score", 5)),
            ]

        X = np.array([_features(s) for s in samples])
        self._scaler.fit(X)
        X_sc = self._scaler.transform(X)

        severity_map = {"GREEN": 0, "YELLOW": 1, "RED": 2}

        for flag in RISK_FLAGS:
            fid = flag["id"]
            y = np.array([severity_map.get(lbl.get(fid, "YELLOW"), 1) for lbl in labels])
            if len(np.unique(y)) < 2:
                continue  # Can't train on single-class data
            try:
                if model_type == "svm":
                    mdl = SVC(kernel="rbf", probability=True, random_state=42)
                else:
                    mdl = LogisticRegression(max_iter=500, random_state=42)
                mdl.fit(X_sc, y)
                self._models[fid] = mdl
            except Exception as exc:
                logger.warning("Risk flag %s training failed: %s", fid, exc)

        self._trained = True
        self._training_samples = len(samples)
        return {
            "status": "success",
            "model_type": model_type,
            "samples": len(samples),
            "flags_trained": len(self._models),
        }

    # ── Prediction ────────────────────────────────────────────────────────────

    def classify(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Classify all 14 risk flags and return a structured report."""
        flags_out: List[Dict[str, Any]] = []
        severity_order = {"RED": 2, "YELLOW": 1, "GREEN": 0}

        for flag in RISK_FLAGS:
            fid = flag["id"]
            rule_sev, rule_conf = _rule_severity(fid, metrics)

            # ML override if available
            sev, conf, mode = rule_sev, rule_conf, "rule_based"
            if (
                _SKLEARN_AVAILABLE
                and self._trained
                and self._training_samples >= self.MIN_SAMPLES_FOR_ML
                and fid in self._models
            ):
                try:
                    feat = self._build_ml_features(metrics)
                    x_sc = self._scaler.transform(feat)
                    label_map = {0: "GREEN", 1: "YELLOW", 2: "RED"}
                    pred = int(self._models[fid].predict(x_sc)[0])
                    prob = float(self._models[fid].predict_proba(x_sc)[0].max())
                    # Blend: trust ML more when confidence is high
                    if prob > 0.80:
                        sev, conf, mode = label_map[pred], round(prob, 2), "ml"
                    else:
                        sev, conf, mode = rule_sev, rule_conf, "ml_low_conf"
                except Exception as exc:
                    logger.debug("ML risk predict failed for %s: %s", fid, exc)

            flags_out.append({
                "id": fid,
                "label": flag["label"],
                "category": flag["category"],
                "severity": sev,
                "confidence": conf,
                "mode": mode,
            })

        # Summary
        red_count = sum(1 for f in flags_out if f["severity"] == "RED")
        yellow_count = sum(1 for f in flags_out if f["severity"] == "YELLOW")
        green_count = sum(1 for f in flags_out if f["severity"] == "GREEN")
        overall_risk = "HIGH" if red_count >= 4 else "MEDIUM" if red_count >= 1 or yellow_count >= 6 else "LOW"

        return {
            "flags": flags_out,
            "summary": {
                "red": red_count,
                "yellow": yellow_count,
                "green": green_count,
                "overall_risk": overall_risk,
            },
            "ml_active": self._trained and self._training_samples >= self.MIN_SAMPLES_FOR_ML,
        }

    def _build_ml_features(self, metrics: Dict[str, Any]) -> np.ndarray:
        return np.array([[
            float(metrics.get("burn_rate", 0)),
            float(metrics.get("runway_months", 12)),
            float(metrics.get("churn_rate_pct", 0)),
            float(metrics.get("top_customer_revenue_pct", 0)),
            float(metrics.get("market_size_billions", 1)),
            float(metrics.get("team_size", 1)),
            float(metrics.get("patents_count", 0)),
            float(metrics.get("recurring_revenue_pct", 0)),
            float(metrics.get("competition_intensity_score", 5)),
            float(metrics.get("esg_score", 5)),
            float(metrics.get("governance_score", 5)),
            float(metrics.get("technology_readiness_level", 7)),
            float(metrics.get("exit_clarity_score", 5)),
            float(metrics.get("regulatory_compliance_score", 5)),
        ]])

    def status(self) -> Dict[str, Any]:
        return {
            "trained": self._trained,
            "training_samples": self._training_samples,
            "sklearn_available": _SKLEARN_AVAILABLE,
            "flags_trained": len(self._models),
        }


# Module-level singleton
risk_classifier = RiskClassifier()
