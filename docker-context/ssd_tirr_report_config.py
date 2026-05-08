"""
═══════════════════════════════════════════════════════════════════════
  SSD → TCA TIRR  —  CUSTOMIZABLE REPORT CONFIGURATION
═══════════════════════════════════════════════════════════════════════

This module defines the report template and scoring configuration
that controls how the 6-page TCA Triage Report is generated for
data arriving through the SSD integration endpoint (/api/ssd/tirr).

Configuration areas:
  1. REPORT_META        – branding, versioning, page count
  2. SCORING_THRESHOLDS – score→recommendation mapping
  3. PAGE_CONFIG        – what each of the 6 pages contains
  4. SSD_FIELD_MAPPING  – how SSD payload fields map to analysis inputs
  5. CALLBACK_CONFIG    – SSD CaptureTCAReportResponse settings
  6. REPORT_EXPORT      – output format preferences (JSON / PDF / both)

Override any constant here to customise reports without touching main.py.
"""

from typing import Dict, Any, List

# ─────────────────────────────────────────────────────────────────────
# 1. REPORT META
# ─────────────────────────────────────────────────────────────────────
REPORT_META = {
    "report_type": "triage",
    "version": "3.0.0",
    "total_pages": 10,
    "branding": {
        "title_prefix": "TCA Investment Risk Rating",
        "subtitle": "Triage Report — SSD Integration",
        "logo_path": None,               # If set, include in PDF header
        "footer_text": "Confidential — TCA TIRR Platform",
        "color_primary": "#1E3A5F",
        "color_accent": "#2F855A",
    },
    "generated_by": "TCA TIRR Analysis Engine v3.0",
}


# ─────────────────────────────────────────────────────────────────────
# 2. SCORING THRESHOLDS
# ─────────────────────────────────────────────────────────────────────
SCORING_THRESHOLDS = {
    "STRONG_BUY": {
        "min_score": 8.0,
        "label": "STRONG BUY",
        "description": "High confidence investment opportunity",
        "color": "#2F855A",   # green
    },
    "PROCEED": {
        "min_score": 7.0,
        "label": "PROCEED",
        "description": "Proceed with due diligence",
        "color": "#3182CE",   # blue
    },
    "CONDITIONAL": {
        "min_score": 5.5,
        "label": "CONDITIONAL",
        "description": "Address key risks before investing",
        "color": "#D69E2E",   # yellow
    },
    "PASS": {
        "min_score": 0.0,
        "label": "PASS",
        "description": "Risk/reward profile not aligned",
        "color": "#E53E3E",   # red
    },
}


def get_recommendation(score: float) -> Dict[str, str]:
    """Return the recommendation tier for a given 0-10 score."""
    for tier in ("STRONG_BUY", "PROCEED", "CONDITIONAL", "PASS"):
        cfg = SCORING_THRESHOLDS[tier]
        if score >= cfg["min_score"]:
            return {
                "tier": tier,
                "label": f'{cfg["label"]} — {cfg["description"]}',
                "color": cfg["color"],
            }
    return {"tier": "PASS", "label": "PASS — Risk/reward profile not aligned", "color": "#E53E3E"}


# ─────────────────────────────────────────────────────────────────────
# 3. PAGE CONFIGURATION  (10-page triage report)
# ─────────────────────────────────────────────────────────────────────
PAGE_CONFIG: Dict[str, Dict[str, Any]] = {
    "page_1_executive_summary": {
        "page_number": 1,
        "title": "Executive Summary",
        "sections": [
            "overall_score",
            "score_interpretation",
            "investment_recommendation",
            "analysis_completeness",
            "modules_run",
            "company_snapshot",             # name, industry, stage, location
            "founder_snapshot",             # name, title, LinkedIn
        ],
        "show_score_gauge": True,           # visual gauge widget in UI
    },
    "page_2_company_profile": {
        "page_number": 2,
        "title": "Company Profile & Overview",
        "sections": [
            "company_name",
            "legal_name",
            "website",
            "industry_vertical",
            "development_stage",
            "business_model",
            "location",                     # city, state, country
            "one_line_description",
            "company_description",
            "product_description",
            "number_of_employees",
        ],
    },
    "page_3_tca_scorecard": {
        "page_number": 3,
        "title": "TCA Scorecard — Category Breakdown",
        "sections": [
            "composite_score",
            "categories",                   # array of {category, score, weight, flag}
            "top_strengths",
            "areas_of_concern",
        ],
        "chart_type": "radar",              # radar | bar | table
    },
    "page_4_risk_assessment": {
        "page_number": 4,
        "title": "Risk Assessment & Flags",
        "sections": [
            "overall_risk_score",
            "total_flags",
            "high_risk_count",
            "risk_flags",                   # array of {flag, severity, description}
            "risk_domains",
        ],
        "flag_severity_colors": {
            "critical": "#E53E3E",
            "high": "#DD6B20",
            "medium": "#D69E2E",
            "low": "#38A169",
        },
    },
    "page_5_market_opportunity": {
        "page_number": 5,
        "title": "Market Opportunity Analysis",
        "sections": [
            "market_score",
            "tam",
            "sam",
            "som",
            "growth_rate",
            "competitive_position",
            "competitive_advantages",
            "market_trends",
        ],
    },
    "page_6_team_assessment": {
        "page_number": 6,
        "title": "Team Assessment",
        "sections": [
            "team_score",
            "team_completeness",
            "founders",
            "founder_background",
            "team_gaps",
            "leadership_assessment",
        ],
    },
    "page_7_financials": {
        "page_number": 7,
        "title": "Financial Health Analysis",
        "sections": [
            "financial_score",
            "revenue",
            "mrr",
            "arr",
            "burn_rate",
            "runway_months",
            "ltv_cac_ratio",
            "gross_margin",
            "customer_metrics",
        ],
    },
    "page_8_technology": {
        "page_number": 8,
        "title": "Technology & IP Assessment",
        "sections": [
            "technology_score",
            "trl",
            "ip_strength",
            "tech_stack",
            "scalability",
            "tech_differentiation",
        ],
    },
    "page_9_business_model": {
        "page_number": 9,
        "title": "Business Model & Growth Strategy",
        "sections": [
            "business_model_score",
            "business_model_type",
            "growth_potential_score",
            "growth_projections",
            "revenue_streams",
            "customer_acquisition",
            "exit_potential",
        ],
    },
    "page_10_recommendations": {
        "page_number": 10,
        "title": "Investment Recommendation & Next Steps",
        "sections": [
            "final_decision",
            "investment_readiness_score",
            "funding_recommendation",
            "key_opportunities",
            "key_risks_summary",
            "next_steps",
        ],
        "default_next_steps": [
            "1. Conduct management team interviews and reference checks",
            "2. Verify financial projections with audited statements",
            "3. Commission independent market sizing analysis",
            "4. Perform detailed competitive landscape mapping",
            "5. Engage technical due diligence on IP and architecture",
            "6. Negotiate term sheet based on analysis findings",
        ],
    },
}


# ─────────────────────────────────────────────────────────────────────
# 4. SSD FIELD MAPPING
# ─────────────────────────────────────────────────────────────────────
# Maps incoming SSD payload paths → internal analysis engine field names.
# This table is used by the _ssd_build_* helpers in main.py.

SSD_FIELD_MAPPING = {
    # contactInformation → founder profile
    "contactInformation.email":        "founder_email",
    "contactInformation.firstName":    "founder_first_name",
    "contactInformation.lastName":     "founder_last_name",
    "contactInformation.phoneNumber":  "founder_phone",
    "contactInformation.jobTitle":     "founder_title",
    "contactInformation.linkedInUrl":  "founder_linkedin",

    # companyInformation → company profile
    "companyInformation.companyName":          "company_name",
    "companyInformation.website":              "website",
    "companyInformation.industryVertical":     "industry",
    "companyInformation.developmentStage":     "development_stage",
    "companyInformation.businessModel":        "business_model",
    "companyInformation.country":              "country",
    "companyInformation.state":                "state",
    "companyInformation.city":                 "city",
    "companyInformation.oneLineDescription":   "one_liner",
    "companyInformation.companyDescription":   "description",
    "companyInformation.productDescription":   "product_description",
    "companyInformation.pitchDeckPath":        "pitch_deck_path",
    "companyInformation.legalName":            "legal_name",
    "companyInformation.numberOfEmployees":    "team_size",

    # financialInformation → financial_data
    "financialInformation.fundingType":        "funding_stage",
    "financialInformation.annualRevenue":      "revenue",
    "financialInformation.preMoneyValuation":  "pre_money_valuation",
    "financialInformation.postMoneyValuation": "post_money_valuation",
    "financialInformation.offeringType":       "offering_type",
    "financialInformation.targetRaise":        "target_raise",
    "financialInformation.currentlyRaised":    "currently_raised",

    # revenueMetrics → financial_data
    "revenueMetrics.totalRevenuesToDate":      "total_revenues",
    "revenueMetrics.monthlyRecurringRevenue":  "mrr",
    "revenueMetrics.yearToDateRevenue":        "ytd_revenue",
    "revenueMetrics.burnRate":                 "burn_rate",

    # customerMetrics → key_metrics
    "customerMetrics.customerAcquisitionCost": "cac",
    "customerMetrics.customerLifetimeValue":   "ltv",
    "customerMetrics.churn":                   "churn_rate",
    "customerMetrics.margins":                 "gross_margin",

    # marketSize → key_metrics
    "marketSize.totalAvailableMarket":         "tam",
    "marketSize.serviceableAreaMarket":        "sam",
    "marketSize.serviceableObtainableMarket":  "som",
}


# Mandatory fields from the SSD spec (section 6)
SSD_MANDATORY_FIELDS: List[str] = [
    "contactInformation.email",
    "contactInformation.phoneNumber",
    "contactInformation.firstName",
    "contactInformation.lastName",
    "companyInformation.industryVertical",
    "companyInformation.developmentStage",
    "companyInformation.businessModel",
    "companyInformation.country",
    "companyInformation.state",
    "companyInformation.city",
    "companyInformation.oneLineDescription",
    "companyInformation.companyDescription",
    "companyInformation.productDescription",
    "companyInformation.pitchDeckPath",
    "financialInformation.fundingType",
    "financialInformation.annualRevenue",
    "financialInformation.preMoneyValuation",
]


# ─────────────────────────────────────────────────────────────────────
# 5. CALLBACK CONFIGURATION
# ─────────────────────────────────────────────────────────────────────
CALLBACK_CONFIG = {
    # Response payload shape for SSD CaptureTCAReportResponse (spec §4.2)
    "response_fields": ["founderEmail", "generatedReportPath"],
    # Error response shape (spec §5.3)
    "error_fields": ["error.code", "error.message", "error.details", "founderEmail"],
    # Timeout for the HTTP POST callback to SSD (seconds)
    "timeout_seconds": 30,
    # Retry settings for failed callbacks
    "max_retries": 3,
    "retry_delay_seconds": 5,
}


# ─────────────────────────────────────────────────────────────────────
# 6. REPORT EXPORT SETTINGS
# ─────────────────────────────────────────────────────────────────────
REPORT_EXPORT = {
    "output_dir": "reports",               # relative to project root
    "filename_template": "tirr_{tracking_id}.json",
    "formats": ["json"],                   # Supported: "json", "pdf"
    "pdf_options": {
        "page_size": "Letter",
        "margin_top": "0.75in",
        "margin_bottom": "0.75in",
        "margin_left": "1in",
        "margin_right": "1in",
        "include_charts": True,
        "include_watermark": False,
    },
    "json_options": {
        "indent": 2,
        "sort_keys": False,
        "ensure_ascii": False,
    },
}


# ─────────────────────────────────────────────────────────────────────
# 7. MODULE WEIGHT OVERRIDES  (for SSD-sourced data specifically)
# ─────────────────────────────────────────────────────────────────────
# If you want the SSD integration to weigh modules differently from
# the default NINE_MODULES list, override weights here.
# Set to None to use main.py defaults.
SSD_MODULE_WEIGHTS: Dict[str, float] | None = None
# Example:
# SSD_MODULE_WEIGHTS = {
#     "tca_scorecard": 3.0,
#     "risk_assessment": 2.5,
#     "market_analysis": 2.0,
#     "team_assessment": 2.0,
#     "financial_analysis": 2.5,   # weighted higher for SSD data
#     "technology_assessment": 1.5,
#     "business_model": 1.5,
#     "growth_assessment": 1.5,
#     "investment_readiness": 1.5,
# }


# ─────────────────────────────────────────────────────────────────────
# 8. SCORE INTERPRETATION LABELS
# ─────────────────────────────────────────────────────────────────────
SCORE_INTERPRETATION = {
    (7.5, 10.0): "Strong candidate for investment",
    (5.5, 7.5): "Moderate potential — further analysis required",
    (0.0, 5.5): "Significant concerns identified",
}


def interpret_score(score: float) -> str:
    """Return a human-readable interpretation for a 0-10 score."""
    for (lo, hi), label in SCORE_INTERPRETATION.items():
        if lo <= score < hi or (hi == 10.0 and score == 10.0):
            return label
    return "Score outside expected range"


# ─────────────────────────────────────────────────────────────────────
# 9. INVESTOR QUESTION → MODULE MAPPING
# ─────────────────────────────────────────────────────────────────────
# Maps investorQuestions fields to the analysis modules they influence
INVESTOR_QUESTION_MODULES = {
    "problemSolution":             ["market_analysis", "business_model"],
    "companyBackgroundTeam":       ["team_assessment"],
    "markets":                     ["market_analysis"],
    "competitionDifferentiation":  ["market_analysis", "business_model"],
    "businessModelChannels":       ["business_model", "growth_assessment"],
    "timeline":                    ["growth_assessment", "investment_readiness"],
    "technologyIP":                ["technology_assessment"],
    "specialAgreements":           ["business_model", "investment_readiness"],
    "cashFlow":                    ["financial_analysis"],
    "fundingHistory":              ["financial_analysis", "investment_readiness"],
    "risksChallenges":             ["risk_assessment"],
    "exitStrategy":                ["investment_readiness"],
}
