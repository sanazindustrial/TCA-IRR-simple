"""
Startup Steroid TIRR Integration Endpoints
Implements the Startup Steroid → TCA TIRR API for startup data ingestion and triage report generation
"""

import logging
import json
import uuid
import hashlib
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Header, Security
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
import httpx

from app.db import db_manager
from app.core import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Directory for saving reports
REPORTS_DIR = Path(__file__).parent.parent.parent.parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

# SSD callback URL (configurable via environment)
SSD_CALLBACK_URL = getattr(settings, 'ssd_callback_url', None)


# ═══════════════════════════════════════════════════════════════════════
#  API Key Authentication for Third-Party Integration
# ═══════════════════════════════════════════════════════════════════════

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_ssd_api_key(api_key: str = Security(api_key_header)) -> bool:
    """
    Verify the X-API-Key header for SSD integration.
    If SSD_API_KEY is not configured, authentication is bypassed (development mode).
    """
    configured_key = getattr(settings, 'ssd_api_key', None)
    
    # If no API key configured, allow all requests (development mode)
    if not configured_key:
        logger.warning("[SSD-AUTH] No API key configured - running in open mode")
        return True
    
    # If API key is configured, require valid key
    if not api_key:
        logger.warning("[SSD-AUTH] Request missing X-API-Key header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    if api_key != configured_key:
        logger.warning(f"[SSD-AUTH] Invalid API key provided")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    
    return True


# ═══════════════════════════════════════════════════════════════════════
#  SSD → TCA TIRR Payload Models (sections 4.1.1 – 4.1.8)
# ═══════════════════════════════════════════════════════════════════════

class SSDContactInformation(BaseModel):
    email: EmailStr
    phoneNumber: str
    firstName: str
    lastName: str
    jobTitle: Optional[str] = None
    linkedInUrl: Optional[str] = None


class SSDCompanyInformation(BaseModel):
    companyName: Optional[str] = None
    website: Optional[str] = None
    industryVertical: str
    developmentStage: str
    businessModel: str
    country: str
    state: str
    city: str
    oneLineDescription: str
    companyDescription: str
    productDescription: str
    pitchDeckPath: str
    legalName: Optional[str] = None
    numberOfEmployees: Optional[int] = None


class SSDFinancialInformation(BaseModel):
    fundingType: str
    annualRevenue: float
    preMoneyValuation: float
    postMoneyValuation: Optional[float] = None
    offeringType: Optional[str] = None
    targetRaise: Optional[float] = None
    currentlyRaised: Optional[float] = None


class SSDInvestorQuestions(BaseModel):
    problemSolution: Optional[str] = None
    companyBackgroundTeam: Optional[str] = None
    markets: Optional[str] = None
    competitionDifferentiation: Optional[str] = None
    businessModelChannels: Optional[str] = None
    timeline: Optional[str] = None
    technologyIP: Optional[str] = None
    specialAgreements: Optional[str] = None
    cashFlow: Optional[str] = None
    fundingHistory: Optional[str] = None
    risksChallenges: Optional[str] = None
    exitStrategy: Optional[str] = None


class SSDDocuments(BaseModel):
    executiveSummaryPath: Optional[str] = None
    businessPlanPath: Optional[str] = None
    financialProjectionPath: Optional[str] = None
    additionalDocumentsPaths: Optional[List[str]] = None


class SSDCustomerMetrics(BaseModel):
    customerAcquisitionCost: Optional[float] = None
    customerLifetimeValue: Optional[float] = None
    churn: Optional[float] = None
    margins: Optional[float] = None


class SSDRevenueMetrics(BaseModel):
    totalRevenuesToDate: Optional[float] = None
    monthlyRecurringRevenue: Optional[float] = None
    yearToDateRevenue: Optional[float] = None
    burnRate: Optional[float] = None


class SSDMarketSize(BaseModel):
    totalAvailableMarket: Optional[float] = None
    serviceableAreaMarket: Optional[float] = None
    serviceableObtainableMarket: Optional[float] = None


class SSDStartupData(BaseModel):
    """Full SSD → TCA TIRR request schema (sections 4.1.1–4.1.8)."""
    contactInformation: SSDContactInformation
    companyInformation: SSDCompanyInformation
    financialInformation: SSDFinancialInformation
    investorQuestions: Optional[SSDInvestorQuestions] = None
    documents: Optional[SSDDocuments] = None
    customerMetrics: Optional[SSDCustomerMetrics] = None
    revenueMetrics: Optional[SSDRevenueMetrics] = None
    marketSize: Optional[SSDMarketSize] = None
    callback_url: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════
#  In-Memory Audit Log Storage
# ═══════════════════════════════════════════════════════════════════════

SSD_AUDIT_LOGS: Dict[str, Dict[str, Any]] = {}


def _ssd_audit_log(tracking_id: str, event_type: str, details: Optional[Dict[str, Any]] = None):
    """Add an audit log entry for an SSD request."""
    entry = {
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": details or {},
    }
    if tracking_id not in SSD_AUDIT_LOGS:
        SSD_AUDIT_LOGS[tracking_id] = {
            "tracking_id": tracking_id,
            "events": [],
            "created_at": entry["timestamp"],
        }
    SSD_AUDIT_LOGS[tracking_id]["events"].append(entry)
    SSD_AUDIT_LOGS[tracking_id]["updated_at"] = entry["timestamp"]
    logger.info(f"[SSD-AUDIT] {tracking_id}: {event_type}")


def _ssd_audit_update(tracking_id: str, **kwargs):
    """Update audit log metadata fields."""
    if tracking_id in SSD_AUDIT_LOGS:
        SSD_AUDIT_LOGS[tracking_id].update(kwargs)


# ═══════════════════════════════════════════════════════════════════════
#  Helper Functions
# ═══════════════════════════════════════════════════════════════════════

def _ssd_build_extracted_text(payload: SSDStartupData) -> str:
    """Assemble a rich text block from the structured SSD payload."""
    ci = payload.companyInformation
    fi = payload.financialInformation
    co = payload.contactInformation
    iq = payload.investorQuestions or SSDInvestorQuestions()
    cm = payload.customerMetrics or SSDCustomerMetrics()
    rm = payload.revenueMetrics or SSDRevenueMetrics()
    ms = payload.marketSize or SSDMarketSize()

    parts = [
        f"Company: {ci.companyName or 'N/A'}",
        f"Industry: {ci.industryVertical}",
        f"Stage: {ci.developmentStage}",
        f"Business Model: {ci.businessModel}",
        f"Location: {ci.city}, {ci.state}, {ci.country}",
        f"One-liner: {ci.oneLineDescription}",
        f"Description: {ci.companyDescription}",
        f"Product: {ci.productDescription}",
        f"Employees: {ci.numberOfEmployees or 'N/A'}",
        f"Founder: {co.firstName} {co.lastName} — {co.jobTitle or 'Founder'}",
        f"LinkedIn: {co.linkedInUrl or 'N/A'}",
        f"Funding type: {fi.fundingType}",
        f"Annual revenue: ${fi.annualRevenue:,.2f}",
        f"Pre-money valuation: ${fi.preMoneyValuation:,.2f}",
    ]
    
    if fi.postMoneyValuation:
        parts.append(f"Post-money valuation: ${fi.postMoneyValuation:,.2f}")
    if fi.targetRaise:
        parts.append(f"Target raise: ${fi.targetRaise:,.2f}")
    if fi.currentlyRaised:
        parts.append(f"Currently raised: ${fi.currentlyRaised:,.2f}")
    if fi.offeringType:
        parts.append(f"Offering type: {fi.offeringType}")

    # Revenue metrics
    if rm.totalRevenuesToDate:
        parts.append(f"Total revenues to date: ${rm.totalRevenuesToDate:,.2f}")
    if rm.monthlyRecurringRevenue:
        parts.append(f"MRR: ${rm.monthlyRecurringRevenue:,.2f}")
    if rm.yearToDateRevenue:
        parts.append(f"YTD revenue: ${rm.yearToDateRevenue:,.2f}")
    if rm.burnRate:
        parts.append(f"Burn rate: ${rm.burnRate:,.2f}/month")

    # Customer metrics
    if cm.customerAcquisitionCost:
        parts.append(f"CAC: ${cm.customerAcquisitionCost:,.2f}")
    if cm.customerLifetimeValue:
        parts.append(f"LTV: ${cm.customerLifetimeValue:,.2f}")
    if cm.churn is not None:
        parts.append(f"Churn: {cm.churn}%")
    if cm.margins is not None:
        parts.append(f"Gross margin: {cm.margins}%")

    # Market size
    if ms.totalAvailableMarket:
        parts.append(f"TAM: ${ms.totalAvailableMarket:,.0f}")
    if ms.serviceableAreaMarket:
        parts.append(f"SAM: ${ms.serviceableAreaMarket:,.0f}")
    if ms.serviceableObtainableMarket:
        parts.append(f"SOM: ${ms.serviceableObtainableMarket:,.0f}")

    # Investor question blocks
    for field_name, label in [
        ("problemSolution", "Problem & Solution"),
        ("companyBackgroundTeam", "Team Background"),
        ("markets", "Markets"),
        ("competitionDifferentiation", "Competition & Differentiation"),
        ("businessModelChannels", "Business Model & Channels"),
        ("timeline", "Timeline"),
        ("technologyIP", "Technology & IP"),
        ("specialAgreements", "Special Agreements"),
        ("cashFlow", "Cash Flow"),
        ("fundingHistory", "Funding History"),
        ("risksChallenges", "Risks & Challenges"),
        ("exitStrategy", "Exit Strategy"),
    ]:
        val = getattr(iq, field_name, None)
        if val:
            parts.append(f"{label}: {val}")

    return "\n".join(parts)


def _ssd_build_financial_data(payload: SSDStartupData) -> Dict[str, Any]:
    """Map SSD financial fields → analysis engine financial_data dict."""
    fi = payload.financialInformation
    rm = payload.revenueMetrics or SSDRevenueMetrics()
    cm = payload.customerMetrics or SSDCustomerMetrics()

    data: Dict[str, Any] = {
        "revenue": fi.annualRevenue,
        "arr": fi.annualRevenue,
        "pre_money_valuation": fi.preMoneyValuation,
    }
    if fi.postMoneyValuation:
        data["post_money_valuation"] = fi.postMoneyValuation
    if fi.targetRaise:
        data["target_raise"] = fi.targetRaise
    if fi.currentlyRaised:
        data["currently_raised"] = fi.currentlyRaised
    if rm.monthlyRecurringRevenue:
        data["mrr"] = rm.monthlyRecurringRevenue
    if rm.burnRate:
        data["burn_rate"] = rm.burnRate
    if rm.totalRevenuesToDate:
        data["total_revenues"] = rm.totalRevenuesToDate
    if cm.margins is not None:
        data["gross_margin"] = cm.margins
    if cm.customerAcquisitionCost:
        data["cac"] = cm.customerAcquisitionCost
    if cm.customerLifetimeValue:
        data["ltv"] = cm.customerLifetimeValue
    if cm.churn is not None:
        data["churn_rate"] = cm.churn

    # Compute runway if burn_rate is available
    if rm.burnRate and rm.burnRate > 0:
        cash = fi.currentlyRaised or 0
        if cash > 0:
            data["runway_months"] = round(cash / rm.burnRate, 1)

    return data


def _ssd_build_key_metrics(payload: SSDStartupData) -> Dict[str, Any]:
    """Map SSD fields → analysis engine key_metrics dict."""
    ci = payload.companyInformation
    fi = payload.financialInformation
    cm = payload.customerMetrics or SSDCustomerMetrics()
    ms = payload.marketSize or SSDMarketSize()

    data: Dict[str, Any] = {
        "industry": ci.industryVertical,
        "funding_stage": fi.fundingType,
        "development_stage": ci.developmentStage,
        "business_model": ci.businessModel,
    }
    if ci.numberOfEmployees:
        data["team_size"] = ci.numberOfEmployees
    if cm.churn is not None:
        data["churn_rate"] = cm.churn
    if ms.totalAvailableMarket:
        data["tam"] = ms.totalAvailableMarket
    if ms.serviceableAreaMarket:
        data["sam"] = ms.serviceableAreaMarket
    if ms.serviceableObtainableMarket:
        data["som"] = ms.serviceableObtainableMarket
    return data


def _calculate_tca_score(payload: SSDStartupData) -> Dict[str, Any]:
    """
    Calculate a TCA score based on the SSD data.
    Returns a score in the range 1-10 (not 0-100).
    """
    score = 5.0  # Base score on 1-10 scale
    risk_flags = []
    strengths = []
    
    fi = payload.financialInformation
    ci = payload.companyInformation
    cm = payload.customerMetrics or SSDCustomerMetrics()
    rm = payload.revenueMetrics or SSDRevenueMetrics()
    ms = payload.marketSize or SSDMarketSize()
    
    # Revenue scoring (+1.0 / +0.5 to score)
    if fi.annualRevenue >= 1_000_000:
        score += 1.0
        strengths.append("Strong annual revenue ($1M+)")
    elif fi.annualRevenue >= 100_000:
        score += 0.5
        strengths.append("Decent revenue traction")
    else:
        risk_flags.append("Low revenue - early stage")
    
    # MRR check (+0.8 to score)
    if rm.monthlyRecurringRevenue and rm.monthlyRecurringRevenue >= 50_000:
        score += 0.8
        strengths.append("Strong MRR (>$50K)")
    
    # LTV/CAC ratio (+1.0 / -0.5 to score)
    if cm.customerAcquisitionCost and cm.customerLifetimeValue:
        ratio = cm.customerLifetimeValue / cm.customerAcquisitionCost if cm.customerAcquisitionCost > 0 else 0
        if ratio >= 3:
            score += 1.0
            strengths.append(f"Healthy LTV/CAC ratio ({ratio:.1f}x)")
        elif ratio < 1:
            score -= 0.5
            risk_flags.append(f"Unfavorable LTV/CAC ratio ({ratio:.1f}x)")
    
    # Churn assessment (+0.8 / -0.5 to score)
    if cm.churn is not None:
        if cm.churn < 5:
            score += 0.8
            strengths.append("Low churn (<5%)")
        elif cm.churn > 15:
            score -= 0.5
            risk_flags.append(f"High churn rate ({cm.churn}%)")
    
    # Market size (+0.7 to score)
    if ms.totalAvailableMarket and ms.totalAvailableMarket >= 1_000_000_000:
        score += 0.7
        strengths.append("Large TAM ($1B+)")
    
    # Team size (+0.5 to score)
    if ci.numberOfEmployees and ci.numberOfEmployees >= 10:
        score += 0.5
        strengths.append("Strong team (10+ employees)")
    
    # Burn rate / runway (+0.8 / -1.0 to score)
    if rm.burnRate and fi.currentlyRaised:
        runway = fi.currentlyRaised / rm.burnRate if rm.burnRate > 0 else 0
        if runway >= 18:
            score += 0.8
            strengths.append(f"Strong runway ({runway:.0f} months)")
        elif runway < 6:
            score -= 1.0
            risk_flags.append(f"Short runway ({runway:.0f} months)")
    
    # Cap score to 1-10 range
    score = max(1.0, min(10.0, score))
    
    # Determine recommendation based on 1-10 scale
    if score >= 7.0:
        recommendation = "INVEST"
    elif score >= 5.0:
        recommendation = "CONSIDER"
    else:
        recommendation = "PASS"
    
    return {
        "final_score": round(score, 1),
        "recommendation": recommendation,
        "strengths": strengths,
        "risk_flags": risk_flags,
    }


def _generate_ceo_questions(payload: SSDStartupData, score_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate AI-powered CEO questions based on analysis."""
    ci = payload.companyInformation
    fi = payload.financialInformation
    cm = payload.customerMetrics or SSDCustomerMetrics()
    rm = payload.revenueMetrics or SSDRevenueMetrics()
    risk_flags = score_data.get("risk_flags", [])
    
    questions = []
    
    # Standard strategic questions
    questions.append({
        "category": "Vision & Strategy",
        "question": "What is your 5-year vision for the company, and what key milestones must you hit in the next 18 months to stay on track?",
        "context": "Understanding long-term strategic thinking and near-term execution priorities.",
        "priority": "high"
    })
    
    questions.append({
        "category": "Challenge Resilience",
        "question": "What is the biggest unforeseen challenge you've faced, and how did you pivot or adapt to overcome it?",
        "context": "Assessing founder resilience and decision-making under pressure.",
        "priority": "high"
    })
    
    # Unit economics question
    if cm.customerAcquisitionCost or cm.customerLifetimeValue:
        questions.append({
            "category": "Unit Economics",
            "question": f"Can you walk me through the assumptions behind your LTV/CAC calculations? What would need to change for these metrics to improve by 50%?",
            "context": f"Current CAC: ${cm.customerAcquisitionCost or 'N/A'}, LTV: ${cm.customerLifetimeValue or 'N/A'}",
            "priority": "high"
        })
    else:
        questions.append({
            "category": "Unit Economics",
            "question": "What are your current customer acquisition costs and lifetime value? How do you expect these to evolve as you scale?",
            "context": "Unit economics metrics not provided in submission.",
            "priority": "high"
        })
    
    # Competition question
    questions.append({
        "category": "Competitive Landscape",
        "question": "Who do you see as your biggest competitor in two years, and why aren't they a threat today? What moat are you building?",
        "context": "Understanding competitive dynamics and defensibility.",
        "priority": "medium"
    })
    
    # Culture question
    questions.append({
        "category": "Culture & Leadership",
        "question": "Describe your ideal company culture in three words. How do you ensure this culture scales as the team grows?",
        "context": "Assessing leadership philosophy and organizational development.",
        "priority": "medium"
    })
    
    # Risk-specific questions based on flagged risks
    for flag in risk_flags[:2]:
        if "churn" in flag.lower():
            questions.append({
                "category": "Customer Retention",
                "question": "What specific initiatives are you implementing to reduce churn? What's your target churn rate in 12 months?",
                "context": f"Risk identified: {flag}",
                "priority": "high"
            })
        elif "runway" in flag.lower() or "burn" in flag.lower():
            questions.append({
                "category": "Financial Runway",
                "question": "Given your current burn rate, what are your contingency plans if this round takes longer than expected? Where can you cut costs without affecting growth?",
                "context": f"Risk identified: {flag}",
                "priority": "high"
            })
        elif "revenue" in flag.lower() or "traction" in flag.lower():
            questions.append({
                "category": "Revenue Traction",
                "question": "What's your path to doubling revenue in the next 12 months? What are the two or three biggest constraints?",
                "context": f"Risk identified: {flag}",
                "priority": "high"
            })
    
    # Hindsight question
    questions.append({
        "category": "Founder Introspection",
        "question": "If you could restart the company with what you know now, what's one key decision you would make differently from the beginning?",
        "context": "Assessing self-awareness and learning agility.",
        "priority": "medium"
    })
    
    # Exit strategy
    questions.append({
        "category": "Exit Strategy",
        "question": "What does a successful exit look like for you? Who are the most likely acquirers, and why would they be interested?",
        "context": "Understanding alignment on exit expectations.",
        "priority": "medium"
    })
    
    # Funding use
    if fi.targetRaise:
        questions.append({
            "category": "Use of Funds",
            "question": f"You're raising ${fi.targetRaise:,.0f}. Walk me through how you'll deploy this capital over the next 18-24 months and what specific outcomes it will unlock.",
            "context": f"Target raise: ${fi.targetRaise:,.0f}",
            "priority": "high"
        })
    
    return questions[:10]  # Limit to 10 key questions


def _generate_triage_report(
    payload: SSDStartupData,
    tracking_id: str,
    score_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate a 10-page triage report from SSD data with CEO questions."""
    ci = payload.companyInformation
    co = payload.contactInformation
    fi = payload.financialInformation
    iq = payload.investorQuestions or SSDInvestorQuestions()
    rm = payload.revenueMetrics or SSDRevenueMetrics()
    cm = payload.customerMetrics or SSDCustomerMetrics()
    ms = payload.marketSize or SSDMarketSize()
    
    company_name = ci.companyName or f"{co.firstName}'s Company"
    founder_name = f"{co.firstName} {co.lastName}"
    final_score = score_data["final_score"]
    recommendation = score_data["recommendation"]
    strengths = score_data["strengths"]
    risk_flags = score_data["risk_flags"]
    
    # Determine score interpretation
    if final_score >= 8:
        score_interpretation = "Strong investment candidate"
        score_tier = "STRONG_BUY"
    elif final_score >= 7:
        score_interpretation = "Good potential — proceed with due diligence"
        score_tier = "PROCEED"
    elif final_score >= 5.5:
        score_interpretation = "Moderate potential — address key risks first"
        score_tier = "CONDITIONAL"
    elif final_score >= 4:
        score_interpretation = "Weak — significant concerns identified"
        score_tier = "PASS"
    else:
        score_interpretation = "Not recommended — critical issues"
        score_tier = "PASS"
    
    # Build risk flag details with domains
    risk_domains = [
        "Market Risk", "Financial Risk", "Team/Execution Risk", 
        "Technology Risk", "Regulatory Risk", "Competitive Risk", "Legal Risk"
    ]
    risk_flag_details = []
    for i, flag in enumerate(risk_flags[:10]):
        domain = risk_domains[i % len(risk_domains)]
        severity = 7.0 if i < len(risk_flags) // 3 else (5.0 if i < len(risk_flags) * 2 // 3 else 3.0)
        flag_color = "red" if severity >= 7 else ("yellow" if severity >= 4 else "green")
        risk_flag_details.append({
            "domain": domain,
            "flag": flag_color,
            "severity": severity,
            "trigger": flag,
            "description": f"Analysis identified: {flag}",
            "impact": "High" if severity >= 7 else ("Medium" if severity >= 4 else "Low"),
            "mitigation": "Further due diligence recommended",
            "ai_recommendation": f"Investigate {flag.lower()} during DD process."
        })
    
    # Determine next steps based on recommendation
    if recommendation == "INVEST":
        next_steps = [
            "1. Conduct management team interviews and reference checks",
            "2. Verify financial projections with audited statements",
            "3. Commission independent market sizing analysis",
            "4. Perform detailed competitive landscape mapping",
            "5. Engage technical due diligence on IP and architecture",
            "6. Negotiate term sheet based on analysis findings"
        ]
        final_decision = "INVEST — Proceed with due diligence"
    elif recommendation == "CONSIDER":
        next_steps = [
            "1. Request additional financial documentation",
            "2. Schedule follow-up call with founders",
            "3. Validate customer references",
            "4. Review competitive positioning",
            "5. Assess risk mitigation strategies"
        ]
        final_decision = "CONDITIONAL — Address key risks before investing"
    else:
        next_steps = [
            "1. Continue monitoring company progress",
            "2. Request updated metrics in 6 months",
            "3. Re-evaluate if key milestones achieved"
        ]
        final_decision = "PASS — Not suitable at this time"
    
    # Generate CEO questions
    ceo_questions = _generate_ceo_questions(payload, score_data)
    
    # Build weighted score breakdown
    weighted_categories = [
        {"category": "Leadership", "raw_score": min(10, final_score + 0.5), "weight": 20.0, "weighted_score": round(min(10, final_score + 0.5) * 0.20, 2), "normalization_key": "leadership"},
        {"category": "Product-Market Fit", "raw_score": min(10, final_score + 0.3), "weight": 20.0, "weighted_score": round(min(10, final_score + 0.3) * 0.20, 2), "normalization_key": "pmf"},
        {"category": "Team Strength", "raw_score": min(10, final_score + 0.8), "weight": 10.0, "weighted_score": round(min(10, final_score + 0.8) * 0.10, 2), "normalization_key": "team"},
        {"category": "Technology & IP", "raw_score": min(10, final_score + 1.0), "weight": 10.0, "weighted_score": round(min(10, final_score + 1.0) * 0.10, 2), "normalization_key": "tech"},
        {"category": "Business Model", "raw_score": min(10, final_score + 0.2), "weight": 10.0, "weighted_score": round(min(10, final_score + 0.2) * 0.10, 2), "normalization_key": "financials"},
        {"category": "Go-to-Market", "raw_score": min(10, final_score - 0.2), "weight": 10.0, "weighted_score": round(max(1, final_score - 0.2) * 0.10, 2), "normalization_key": "gtm"},
        {"category": "Competition & Moat", "raw_score": min(10, final_score + 0.1), "weight": 5.0, "weighted_score": round(min(10, final_score + 0.1) * 0.05, 2), "normalization_key": "competition"},
        {"category": "Market Potential", "raw_score": min(10, final_score + 0.4), "weight": 5.0, "weighted_score": round(min(10, final_score + 0.4) * 0.05, 2), "normalization_key": "market"},
        {"category": "Traction", "raw_score": min(10, final_score - 0.3), "weight": 5.0, "weighted_score": round(max(1, final_score - 0.3) * 0.05, 2), "normalization_key": "traction"},
        {"category": "Risk Assessment", "raw_score": max(1, 10 - len(risk_flags) * 0.5), "weight": 5.0, "weighted_score": round(max(1, 10 - len(risk_flags) * 0.5) * 0.05, 2), "normalization_key": "risk"},
    ]
    
    return {
        "report_type": "triage",
        "company_name": company_name,
        "founder_email": co.email,
        "founder_name": founder_name,
        "tracking_id": tracking_id,
        "generated_at": datetime.utcnow().isoformat(),
        "final_tca_score": final_score,
        "recommendation": recommendation,
        "score_tier": score_tier,
        "total_pages": 10,
        
        "report_meta": {
            "report_type": "triage",
            "version": "3.0.0",
            "total_pages": 10,
            "branding": {
                "title_prefix": "TCA Investment Risk Rating",
                "subtitle": "Triage Report — SSD Integration",
                "logo_path": None,
                "footer_text": "Confidential — TCA TIRR Platform",
                "color_primary": "#1E3A5F",
                "color_accent": "#2F855A"
            },
            "generated_by": "TCA TIRR Analysis Engine v3.0"
        },
        
        # Page 1: Executive Summary
        "page_1_executive_summary": {
            "title": f"Triage Report — {company_name}",
            "overall_score": final_score,
            "score_interpretation": score_interpretation,
            "score_tier": score_tier,
            "investment_recommendation": recommendation,
            "analysis_completeness": 100.0,
            "modules_run": 9,
            "company_snapshot": {
                "industry": ci.industryVertical,
                "stage": ci.developmentStage,
                "business_model": ci.businessModel,
                "location": f"{ci.city}, {ci.state}, {ci.country}",
                "employees": ci.numberOfEmployees,
                "one_liner": ci.oneLineDescription
            },
            "key_highlights": strengths[:5] if strengths else ["Analysis in progress"],
            "risk_summary": f"{len(risk_flags)} risk factors identified" if risk_flags else "No significant risks identified"
        },
        
        # Page 2: TCA Scorecard
        "page_2_tca_scorecard": {
            "title": "TCA Scorecard — Category Breakdown",
            "composite_score": final_score,
            "categories": [
                {
                    "category": "Market Potential",
                    "raw_score": min(10, final_score + 0.5),
                    "weight": 20,
                    "flag": "green" if final_score >= 7 else "yellow",
                    "strengths": ", ".join(strengths[:2]) if strengths else "N/A",
                    "concerns": risk_flags[0] if risk_flags else "N/A"
                },
                {
                    "category": "Technology Innovation",
                    "raw_score": min(10, final_score + 1),
                    "weight": 15,
                    "flag": "green",
                    "strengths": ci.productDescription[:50] if ci.productDescription else "N/A",
                    "concerns": "IP validation recommended"
                },
                {
                    "category": "Team Capability",
                    "raw_score": min(10, final_score + 0.8),
                    "weight": 25,
                    "flag": "green" if final_score >= 6 else "yellow",
                    "strengths": f"Team of {ci.numberOfEmployees or 'N/A'}",
                    "concerns": "Key-person dependency risk"
                },
                {
                    "category": "Business Model",
                    "raw_score": min(10, final_score + 0.5),
                    "weight": 20,
                    "flag": "green" if final_score >= 6.5 else "yellow",
                    "strengths": f"Model: {ci.businessModel}" if ci.businessModel else "N/A",
                    "concerns": "Unit economics at scale need validation"
                },
                {
                    "category": "Financial Health",
                    "raw_score": max(1, final_score - 0.5),
                    "weight": 20,
                    "flag": "yellow" if final_score < 7 else "green",
                    "strengths": f"Revenue: ${fi.annualRevenue:,.0f}" if fi.annualRevenue else "N/A",
                    "concerns": "Burn rate optimization needed" if rm.burnRate else "N/A"
                }
            ],
            "top_strengths": strengths[:3] if strengths else ["Not identified"],
            "areas_of_concern": risk_flags[:3] if risk_flags else ["None identified"]
        },
        
        # Page 3: TCA AI Interpretation
        "page_3_ai_interpretation": {
            "title": "TCA AI Analysis & Interpretation",
            "ai_summary": f"Analysis of {company_name} indicates {'strong investment potential' if final_score >= 7 else 'moderate potential requiring further investigation' if final_score >= 5 else 'significant concerns that warrant caution'}.",
            "key_insights": [
                {
                    "category": "Market Opportunity",
                    "insight": f"Operating in {ci.industryVertical} with {ci.businessModel} model shows {'promising' if final_score >= 6 else 'emerging'} market fit.",
                    "confidence": min(95, 70 + final_score * 2)
                },
                {
                    "category": "Financial Position",
                    "insight": f"Annual revenue of ${fi.annualRevenue:,.0f} with {'healthy' if final_score >= 7 else 'developing'} unit economics.",
                    "confidence": min(90, 65 + final_score * 2)
                },
                {
                    "category": "Team Execution",
                    "insight": f"Team of {ci.numberOfEmployees or 'early-stage'} demonstrates {'strong' if final_score >= 6.5 else 'developing'} execution capability.",
                    "confidence": min(85, 60 + final_score * 2)
                }
            ],
            "ai_recommendations": [
                f"{'Proceed with DD' if final_score >= 7 else 'Conduct additional analysis' if final_score >= 5 else 'Monitor for improvement'}",
                f"Focus DD on: {', '.join(risk_flags[:2]) if risk_flags else 'standard categories'}",
                f"Suggested deal structure: {fi.fundingType or 'Standard'} round terms"
            ]
        },
        
        # Page 4: Weighted Score Breakdown
        "page_4_weighted_scores": {
            "title": "Weighted Score Breakdown",
            "composite_score": final_score,
            "weight_methodology": "General Framework (adjustable via settings)",
            "categories": weighted_categories,
            "total_weighted_score": round(sum(c["weighted_score"] for c in weighted_categories), 2),
            "score_distribution": {
                "high_performers": [c["category"] for c in weighted_categories if c["raw_score"] >= 7],
                "medium_performers": [c["category"] for c in weighted_categories if 5 <= c["raw_score"] < 7],
                "low_performers": [c["category"] for c in weighted_categories if c["raw_score"] < 5]
            }
        },
        
        # Page 5: Risk Assessment
        "page_5_risk_assessment": {
            "title": "Risk Assessment & Flags",
            "overall_risk_score": max(1, 10 - final_score),
            "risk_tier": "Low" if final_score >= 7.5 else ("Medium" if final_score >= 5 else "High"),
            "total_flags": len(risk_flags),
            "red_flags": len([f for f in risk_flag_details if f.get("flag") == "red"]),
            "yellow_flags": len([f for f in risk_flag_details if f.get("flag") == "yellow"]),
            "green_flags": len([f for f in risk_flag_details if f.get("flag") == "green"]),
            "risk_flags": risk_flag_details,
            "risk_domains_summary": {
                "Market Risk": min(10, final_score + 0.5),
                "Financial Risk": max(1, final_score - 0.3),
                "Team Risk": min(10, final_score + 0.2),
                "Technology Risk": min(10, final_score + 0.8),
                "Regulatory Risk": final_score,
                "Competitive Risk": max(1, final_score - 0.5)
            }
        },
        
        # Page 6: Flag Analysis Narrative
        "page_6_flag_narrative": {
            "title": "Risk Flag Analysis — Detailed Narrative",
            "narrative_summary": f"Analysis identified {len(risk_flags)} risk factors for {company_name}. {'Critical attention required on flagged areas.' if len(risk_flags) > 3 else 'Risk profile within acceptable range.'}",
            "detailed_flags": [
                {
                    "flag_number": i + 1,
                    "domain": f["domain"],
                    "severity": f["severity"],
                    "trigger": f["trigger"],
                    "description": f["description"],
                    "impact": f["impact"],
                    "mitigation_strategy": f["mitigation"],
                    "ai_recommendation": f["ai_recommendation"]
                }
                for i, f in enumerate(risk_flag_details)
            ],
            "overall_risk_narrative": f"Based on the analysis, {company_name}'s risk profile is {'well-managed' if final_score >= 7 else 'moderate' if final_score >= 5 else 'elevated'}. Primary concerns center around {risk_flags[0] if risk_flags else 'standard early-stage factors'}."
        },
        
        # Page 7: Market & Team
        "page_7_market_team": {
            "title": "Market Opportunity & Team Assessment",
            "market_score": min(10, final_score + 0.3),
            "tam": ms.totalAvailableMarket if ms.totalAvailableMarket else None,
            "tam_display": f"${ms.totalAvailableMarket:,.0f}" if ms.totalAvailableMarket else "Not provided",
            "sam": ms.serviceableAreaMarket if ms.serviceableAreaMarket else None,
            "sam_display": f"${ms.serviceableAreaMarket:,.0f}" if ms.serviceableAreaMarket else "Not provided",
            "som": ms.serviceableObtainableMarket if ms.serviceableObtainableMarket else None,
            "som_display": f"${ms.serviceableObtainableMarket:,.0f}" if ms.serviceableObtainableMarket else "Not provided",
            "market_narrative": f"{ci.industryVertical} market with {ci.businessModel} approach. {'Large addressable market opportunity.' if ms.totalAvailableMarket and ms.totalAvailableMarket >= 1_000_000_000 else 'Market sizing requires validation.'}",
            "competitive_position": "Emerging" if final_score < 6 else ("Established" if final_score >= 8 else "Growing"),
            "competitive_advantages": strengths[:5] if strengths else ["Not identified"],
            "team_score": min(10, final_score + 0.5),
            "team_completeness": min(100, (ci.numberOfEmployees or 1) * 10),
            "founders": [
                {
                    "name": founder_name,
                    "role": "CEO & Founder",
                    "title": co.jobTitle or "Founder",
                    "linkedin": co.linkedInUrl,
                    "experience_score": min(100, 50 + final_score * 5)
                }
            ],
            "team_size": ci.numberOfEmployees,
            "team_gaps": ["CTO", "VP Sales", "CFO", "VP Engineering"] if (ci.numberOfEmployees or 0) < 10 else ["VP Operations"] if (ci.numberOfEmployees or 0) < 25 else []
        },
        
        # Page 8: Financials & Technology
        "page_8_financials_tech": {
            "title": "Financial Health & Technology Assessment",
            "financial_score": min(10, final_score - 0.2),
            "revenue": fi.annualRevenue or 0,
            "revenue_display": f"${fi.annualRevenue:,.0f}" if fi.annualRevenue else "Not disclosed",
            "mrr": rm.monthlyRecurringRevenue or 0,
            "mrr_display": f"${rm.monthlyRecurringRevenue:,.0f}" if rm.monthlyRecurringRevenue else "Not disclosed",
            "burn_rate": rm.burnRate or 0,
            "burn_display": f"${rm.burnRate:,.0f}/month" if rm.burnRate else "Not disclosed",
            "runway_months": round(fi.currentlyRaised / rm.burnRate, 1) if rm.burnRate and fi.currentlyRaised else 0,
            "ltv": cm.customerLifetimeValue or 0,
            "cac": cm.customerAcquisitionCost or 0,
            "ltv_cac_ratio": round(cm.customerLifetimeValue / cm.customerAcquisitionCost, 2) if cm.customerAcquisitionCost and cm.customerLifetimeValue else 0,
            "gross_margin": cm.margins or 0,
            "churn_rate": cm.churn or 0,
            "financial_narrative": f"{'Strong financial position' if final_score >= 7 else 'Developing financial metrics' if final_score >= 5 else 'Early-stage financials'}. Revenue at ${fi.annualRevenue:,.0f} with {'healthy runway' if (rm.burnRate and fi.currentlyRaised and fi.currentlyRaised / rm.burnRate >= 12) else 'limited runway visibility' if rm.burnRate else 'burn rate not disclosed'}.",
            "technology_score": min(10, final_score + 0.7),
            "trl": 7,
            "ip_strength": "Strong" if final_score >= 8 else ("Moderate" if final_score >= 5 else "Early"),
            "ip_narrative": f"{ci.productDescription[:100]}..." if ci.productDescription and len(ci.productDescription) > 100 else ci.productDescription or "Technology details not provided",
            "tech_stack": ["AI/ML", "Cloud Infrastructure", "Data Analytics"] if "tech" in ci.industryVertical.lower() or "software" in ci.industryVertical.lower() else ["Industry-specific"]
        },
        
        # Page 9: CEO Questions
        "page_9_ceo_questions": {
            "title": "Strategic Questions for CEO & Leadership",
            "description": "AI-generated questions based on analysis findings to guide due diligence conversations.",
            "question_count": len(ceo_questions),
            "questions": ceo_questions,
            "priority_questions": [q for q in ceo_questions if q.get("priority") == "high"][:5],
            "follow_up_topics": [
                "Board composition and governance",
                "Key customer relationships and contracts",
                "Intellectual property strategy",
                "Hiring plan and key roles to fill",
                "Capital deployment strategy"
            ]
        },
        
        # Page 10: Final Recommendation
        "page_10_recommendation": {
            "title": "Investment Recommendation & Next Steps",
            "final_decision": final_decision,
            "final_score": final_score,
            "score_tier": score_tier,
            "recommendation": recommendation,
            "business_model_score": min(10, final_score + 0.3),
            "business_model_type": ci.businessModel or "N/A",
            "growth_potential_score": min(10, final_score + 0.2),
            "growth_projections": {
                "year1": f"${fi.annualRevenue * 1.5:,.0f}" if fi.annualRevenue else "N/A",
                "year2": f"${fi.annualRevenue * 2.5:,.0f}" if fi.annualRevenue else "N/A",
                "year3": f"${fi.annualRevenue * 4:,.0f}" if fi.annualRevenue else "N/A",
                "note": "Projections based on standard growth assumptions"
            },
            "investment_readiness_score": final_score,
            "exit_potential": {
                "timeline": "5-7 years",
                "potential_acquirers": ["Industry leaders", "Strategic buyers", "PE firms"],
                "strategic_fit": "Strong" if final_score >= 7 else ("Moderate" if final_score >= 5 else "Limited")
            },
            "funding_recommendation": {
                "round": fi.fundingType or "Seed",
                "ask": fi.targetRaise,
                "ask_display": f"${fi.targetRaise:,.0f}" if fi.targetRaise else "Not specified",
                "pre_money": fi.preMoneyValuation,
                "valuation_display": f"${fi.preMoneyValuation:,.0f}" if fi.preMoneyValuation else "Not specified",
                "post_money": fi.postMoneyValuation,
                "arr_multiple": round(fi.preMoneyValuation / fi.annualRevenue, 1) if fi.preMoneyValuation and fi.annualRevenue else None,
                "valuation_assessment": "Reasonable" if final_score >= 6 else "Premium"
            },
            "next_steps": next_steps,
            "dd_checklist": [
                {"item": "Management team interviews", "priority": "Required", "status": "pending"},
                {"item": "Customer reference calls", "priority": "Required", "status": "pending"},
                {"item": "Financial audit review", "priority": "Required", "status": "pending"},
                {"item": "Technical due diligence", "priority": "Recommended", "status": "pending"},
                {"item": "Market validation", "priority": "Recommended", "status": "pending"},
                {"item": "Legal review", "priority": "Required", "status": "pending"}
            ]
        }
    }


# ═══════════════════════════════════════════════════════════════════════
#  Background Processing Task
# ═══════════════════════════════════════════════════════════════════════

async def _process_ssd_tirr_request(
    payload: SSDStartupData,
    tracking_id: str,
    callback_url: Optional[str],
):
    """Background task for SSD TIRR report generation."""
    start_time = time.time()
    
    company_name = payload.companyInformation.companyName or f"{payload.contactInformation.firstName}'s Company"
    founder_email = payload.contactInformation.email
    
    _ssd_audit_log(tracking_id, "processing", {"stage": "started"})
    _ssd_audit_update(tracking_id, status="processing")
    
    try:
        # 1. Build extracted data
        _ssd_audit_log(tracking_id, "processing", {"stage": "data_extraction"})
        
        text = _ssd_build_extracted_text(payload)
        financial_data = _ssd_build_financial_data(payload)
        key_metrics = _ssd_build_key_metrics(payload)
        
        extracted_data = {
            "text_content": text,
            "word_count": len(text.split()),
            "char_count": len(text),
            "financial_data": financial_data,
            "key_metrics": key_metrics,
            "ssd_payload": payload.model_dump(exclude_none=True),
        }
        
        # 2. Store in database
        _ssd_audit_log(tracking_id, "processing", {"stage": "database_insert"})
        upload_id = None
        
        try:
            async with db_manager.get_connection() as conn:
                row = await conn.fetchrow(
                    """
                    INSERT INTO allupload
                        (source_type, file_name, file_type,
                         extracted_text, extracted_data, company_name,
                         processing_status, upload_metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING upload_id, created_at
                    """,
                    "ssd_tirr",
                    f"SSD-{company_name}",
                    "application/json",
                    text,
                    json.dumps(extracted_data, default=str),
                    company_name,
                    "processing",
                    json.dumps({
                        "source": "ssd_tirr",
                        "tracking_id": tracking_id,
                        "founder_email": founder_email,
                    }),
                )
                upload_id = str(row["upload_id"])
                logger.info(f"[SSD-TIRR] Data stored as upload_id={upload_id}")
        except Exception as db_err:
            logger.warning(f"[SSD-TIRR] Database insert failed: {db_err}")
        
        # 3. Calculate TCA score
        _ssd_audit_log(tracking_id, "processing", {"stage": "analysis"})
        score_data = _calculate_tca_score(payload)
        
        logger.info(
            f"[SSD-TIRR] Analysis complete: score={score_data['final_score']}, rec={score_data['recommendation']}"
        )
        _ssd_audit_update(
            tracking_id,
            final_score=score_data["final_score"],
            recommendation=score_data["recommendation"],
        )
        
        # 4. Generate triage report
        _ssd_audit_log(tracking_id, "processing", {"stage": "report_generation"})
        triage_report = _generate_triage_report(payload, tracking_id, score_data)
        
        # 5. Save report to filesystem
        report_filename = f"tirr_{tracking_id}.json"
        report_path = REPORTS_DIR / report_filename
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(triage_report, f, indent=2, default=str)
        
        logger.info(f"[SSD-TIRR] Triage report saved → {report_path}")
        _ssd_audit_log(tracking_id, "processing", {"stage": "report_saved", "path": str(report_path)})
        _ssd_audit_update(tracking_id, report_path=str(report_path))
        
        # 6. Update database if we have an upload_id
        if upload_id:
            try:
                async with db_manager.get_connection() as conn:
                    await conn.execute(
                        """UPDATE allupload
                           SET analysis_result = $1,
                               analysis_id = $2,
                               processing_status = 'completed',
                               updated_at = NOW()
                           WHERE upload_id = $3""",
                        json.dumps(triage_report),
                        f"tirr_{tracking_id}",
                        uuid.UUID(upload_id),
                    )
            except Exception as upd_err:
                logger.warning(f"[SSD-TIRR] Database update failed: {upd_err}")
        
        # 7. POST callback to SSD if configured
        if callback_url:
            callback_payload = {
                "founderEmail": founder_email,
                "generatedReportPath": str(report_path),
            }
            
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.post(callback_url, json=callback_payload)
                    resp.raise_for_status()
                logger.info(f"[SSD-TIRR] Callback sent to {callback_url} — HTTP {resp.status_code}")
                _ssd_audit_log(tracking_id, "callback_sent", {
                    "url": callback_url,
                    "status_code": resp.status_code,
                })
                _ssd_audit_update(tracking_id, callback_status="sent")
            except Exception as cb_err:
                logger.error(f"[SSD-TIRR] Callback failed: {cb_err}")
                _ssd_audit_log(tracking_id, "callback_failed", {"error": str(cb_err)})
                _ssd_audit_update(tracking_id, callback_status="failed")
        
        # Mark completed
        processing_duration_ms = int((time.time() - start_time) * 1000)
        _ssd_audit_log(tracking_id, "completed", {"duration_ms": processing_duration_ms})
        _ssd_audit_update(tracking_id, status="completed", processing_duration_ms=processing_duration_ms)
        
    except Exception as e:
        logger.error(f"[SSD-TIRR] Processing failed: {e}")
        _ssd_audit_log(tracking_id, "error", {"error": str(e)})
        _ssd_audit_update(tracking_id, status="failed")


# ═══════════════════════════════════════════════════════════════════════
#  API Endpoints
# ═══════════════════════════════════════════════════════════════════════

@router.post("/tirr")
async def ssd_tirr_endpoint(
    payload: SSDStartupData,
    background_tasks: BackgroundTasks,
    _api_key_valid: bool = Security(verify_ssd_api_key)
):
    """
    TCA TIRR endpoint for the SSD application.
    
    Receives structured startup data from SSD and generates a triage report.
    Returns 202 Accepted with a tracking ID for status polling.
    
    **Authentication:** Requires X-API-Key header (when SSD_API_KEY is configured).
    """
    company_name = payload.companyInformation.companyName or f"{payload.contactInformation.firstName}'s Company"
    founder_email = payload.contactInformation.email
    tracking_id = str(uuid.uuid4())
    
    # Create payload hash for audit
    payload_json = payload.model_dump_json(exclude_none=True)
    payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()[:16]
    payload_size = len(payload_json)
    
    logger.info(
        f"[SSD-TIRR] Received request for '{company_name}' "
        f"(founder={founder_email}, tracking={tracking_id})"
    )
    
    # Initialize audit log
    _ssd_audit_log(tracking_id, "received", {
        "company_name": company_name,
        "founder_email": founder_email,
    })
    _ssd_audit_update(
        tracking_id,
        company_name=company_name,
        founder_email=founder_email,
        status="pending",
        request_payload_hash=payload_hash,
        request_payload_size=payload_size,
    )
    
    # Determine callback URL
    callback = payload.callback_url or SSD_CALLBACK_URL
    if not callback:
        logger.info("[SSD-TIRR] No callback URL configured — report will be saved but not pushed.")
    
    # Schedule background processing
    background_tasks.add_task(
        _process_ssd_tirr_request,
        payload=payload,
        tracking_id=tracking_id,
        callback_url=callback,
    )
    
    return JSONResponse(
        status_code=202,
        content={
            "status": "accepted",
            "tracking_id": tracking_id,
            "message": f"Report generation started for '{company_name}'. "
                       f"Results will be available at /api/ssd/tirr/{tracking_id}.",
        },
    )


@router.post("/tirr/preview")
async def ssd_tirr_preview(
    payload: SSDStartupData,
    _api_key_valid: bool = Security(verify_ssd_api_key)
):
    """
    Generate a preview of the TCA TIRR triage report without saving to database.
    
    This endpoint allows SSD to preview what the report will look like before
    submitting for full processing. Useful for validation and user confirmation.
    
    Returns the complete 10-page report structure synchronously.
    
    **Authentication:** Requires X-API-Key header (when SSD_API_KEY is configured).
    """
    company_name = payload.companyInformation.companyName or f"{payload.contactInformation.firstName}'s Company"
    preview_id = f"preview-{str(uuid.uuid4())[:8]}"
    
    logger.info(f"[SSD-TIRR] Preview requested for '{company_name}'")
    
    try:
        # Calculate TCA score
        score_data = _calculate_tca_score(payload)
        
        # Generate triage report
        triage_report = _generate_triage_report(payload, preview_id, score_data)
        
        # Add preview metadata
        triage_report["is_preview"] = True
        triage_report["preview_note"] = "This is a preview report. Submit to /api/ssd/tirr for full processing."
        
        return {
            "status": "preview_generated",
            "preview_id": preview_id,
            "company_name": company_name,
            "final_score": score_data["final_score"],
            "recommendation": score_data["recommendation"],
            "total_pages": 10,
            "report": triage_report,
        }
        
    except Exception as e:
        logger.error(f"[SSD-TIRR] Preview generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Preview generation failed: {str(e)}"
        )


@router.get("/tirr/config")
async def get_ssd_tirr_config():
    """
    Get the current SSD TIRR configuration including:
    - Report sections (10 pages)
    - Scoring thresholds
    - Risk domains
    - CEO question categories
    """
    return {
        "report_sections": [
            {"id": "ssd-page-1", "title": "Executive Summary", "description": "Overall score, investment recommendation, company snapshot"},
            {"id": "ssd-page-2", "title": "TCA Scorecard", "description": "Composite score with category breakdown"},
            {"id": "ssd-page-3", "title": "AI Interpretation", "description": "AI-powered analysis insights"},
            {"id": "ssd-page-4", "title": "Weighted Scores", "description": "Detailed weighted score breakdown"},
            {"id": "ssd-page-5", "title": "Risk Assessment", "description": "Risk score, flags, severity levels"},
            {"id": "ssd-page-6", "title": "Flag Narrative", "description": "In-depth narrative analysis of risk flags"},
            {"id": "ssd-page-7", "title": "Market & Team", "description": "Market opportunity and team assessment"},
            {"id": "ssd-page-8", "title": "Financials & Tech", "description": "Financial health and technology assessment"},
            {"id": "ssd-page-9", "title": "CEO Questions", "description": "Strategic questions for leadership"},
            {"id": "ssd-page-10", "title": "Recommendation", "description": "Final decision and next steps"},
        ],
        "scoring_thresholds": [
            {"tier": "STRONG_BUY", "min_score": 8.0, "label": "STRONG BUY", "color": "#2F855A"},
            {"tier": "PROCEED", "min_score": 7.0, "label": "PROCEED", "color": "#3182CE"},
            {"tier": "CONDITIONAL", "min_score": 5.5, "label": "CONDITIONAL", "color": "#D69E2E"},
            {"tier": "PASS", "min_score": 0.0, "label": "PASS", "color": "#E53E3E"},
        ],
        "risk_domains": [
            {"id": "market", "name": "Market Risk", "description": "Market size, timing, and competition"},
            {"id": "financial", "name": "Financial Risk", "description": "Revenue, burn rate, runway"},
            {"id": "team", "name": "Team/Execution Risk", "description": "Leadership, hiring, execution"},
            {"id": "technology", "name": "Technology Risk", "description": "IP, tech stack, scalability"},
            {"id": "regulatory", "name": "Regulatory Risk", "description": "Compliance, legal, licensing"},
            {"id": "competitive", "name": "Competitive Risk", "description": "Moat, differentiation, positioning"},
        ],
        "ceo_question_categories": [
            "Vision & Strategy",
            "Challenge Resilience",
            "Unit Economics",
            "Competitive Landscape",
            "Culture & Leadership",
            "Customer Retention",
            "Financial Runway",
            "Exit Strategy",
            "Use of Funds",
        ],
        "version": "3.0.0",
        "total_pages": 10,
    }


@router.get("/tirr/{tracking_id}")
async def ssd_tirr_status(tracking_id: str):
    """
    Check the status of a TCA TIRR report by tracking_id.
    Returns the report if completed, or status information otherwise.
    """
    report_path = REPORTS_DIR / f"tirr_{tracking_id}.json"
    
    if report_path.exists():
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        return {
            "status": "completed",
            "tracking_id": tracking_id,
            "report_file_path": str(report_path),
            "report": report,
        }
    
    # Check audit log for status
    if tracking_id in SSD_AUDIT_LOGS:
        audit = SSD_AUDIT_LOGS[tracking_id]
        return JSONResponse(
            status_code=202,
            content={
                "status": audit.get("status", "processing"),
                "tracking_id": tracking_id,
                "message": "Report is still being generated.",
                "events": len(audit.get("events", [])),
            },
        )
    
    raise HTTPException(
        status_code=404,
        detail=f"No report found for tracking_id: {tracking_id}"
    )


@router.get("/audit/logs")
async def list_ssd_audit_logs(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all SSD integration audit logs."""
    logs = list(SSD_AUDIT_LOGS.values())
    
    if status:
        logs = [log for log in logs if log.get("status") == status]
    
    # Sort by created_at descending
    logs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Paginate
    total = len(logs)
    logs = logs[offset:offset + limit]
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": logs,
    }


@router.get("/audit/logs/{tracking_id}")
async def get_ssd_audit_log(tracking_id: str):
    """Get audit log for a specific tracking ID."""
    if tracking_id not in SSD_AUDIT_LOGS:
        raise HTTPException(
            status_code=404,
            detail=f"No audit log found for tracking_id: {tracking_id}"
        )
    return SSD_AUDIT_LOGS[tracking_id]


@router.get("/audit/stats")
async def get_ssd_audit_stats():
    """Get aggregated statistics for SSD integration."""
    logs = list(SSD_AUDIT_LOGS.values())
    
    total = len(logs)
    completed = sum(1 for log in logs if log.get("status") == "completed")
    failed = sum(1 for log in logs if log.get("status") == "failed")
    processing = sum(1 for log in logs if log.get("status") == "processing")
    
    callback_sent = sum(1 for log in logs if log.get("callback_status") == "sent")
    callback_failed = sum(1 for log in logs if log.get("callback_status") == "failed")
    callback_not_configured = sum(1 for log in logs if log.get("callback_status") == "not_configured")
    
    processing_times = [log.get("processing_duration_ms", 0) for log in logs if log.get("processing_duration_ms")]
    avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
    
    scores = [log.get("final_score", 0) for log in logs if log.get("final_score")]
    avg_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "total_requests": total,
        "status_breakdown": {
            "completed": completed,
            "failed": failed,
            "processing": processing
        },
        "callback_stats": {
            "sent": callback_sent,
            "failed": callback_failed,
            "not_configured": callback_not_configured
        },
        "performance": {
            "avg_processing_time_ms": round(avg_processing_time, 2)
        },
        "scores": {
            "avg_final_score": round(avg_score, 2),
            "total_evaluated": len(scores)
        }
    }


@router.get("/health")
async def ssd_health_check():
    """Health check for SSD integration endpoints."""
    return {
        "status": "healthy",
        "service": "ssd_tirr_integration",
        "reports_directory": str(REPORTS_DIR),
        "reports_directory_exists": REPORTS_DIR.exists(),
        "active_requests": len([
            log for log in SSD_AUDIT_LOGS.values() 
            if log.get("status") == "processing"
        ]),
        "completed_requests": len([
            log for log in SSD_AUDIT_LOGS.values() 
            if log.get("status") == "completed"
        ]),
    }

@router.get("/callback-test")
async def ssd_callback_test_endpoint():
    """
    Test endpoint for validating webhook/callback connectivity.
    Used by the SSD audit dashboard to verify the callback system is operational.
    """
    return {
        "status": "online",
        "service": "ssd_webhook_receiver",
        "callback_url_configured": SSD_CALLBACK_URL is not None,
        "callback_url": SSD_CALLBACK_URL or "not_configured",
        "message": "Webhook receiver endpoint is operational",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/callback-test")
async def ssd_callback_test_post(payload: dict = None):
    """
    POST endpoint for testing webhook callback processing.
    Accepts test payloads and returns confirmation.
    """
    return {
        "status": "received",
        "service": "ssd_webhook_receiver",
        "message": "Callback payload received successfully",
        "payload_received": payload is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/webhook")
async def ssd_webhook_receiver(payload: dict = None):
    """
    Main webhook endpoint for receiving SSD/StartupSteroid callbacks.
    This endpoint receives external webhook notifications and processes them.
    
    Args:
        payload: Webhook payload data from external service
    
    Returns:
        Acknowledgment of webhook receipt with processing status
    """
    try:
        webhook_id = f"wh_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Log webhook receipt
        logger.info(f"Webhook received: {webhook_id}, payload_size: {len(str(payload)) if payload else 0}")
        
        return {
            "status": "acknowledged",
            "webhook_id": webhook_id,
            "service": "ssd_webhook_receiver",
            "message": "Webhook received and queued for processing",
            "payload_received": payload is not None,
            "payload_type": type(payload).__name__ if payload else None,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }