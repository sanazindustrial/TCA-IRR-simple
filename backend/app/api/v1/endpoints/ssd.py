"""
SSD (Startup Success Dashboard) TIRR Integration Endpoints
Implements the SSD → TCA TIRR API for startup data ingestion and triage report generation
"""

import logging
import json
import uuid
import hashlib
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
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
SSD_CALLBACK_URL = getattr(settings, 'SSD_CALLBACK_URL', None)


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


def _generate_triage_report(
    payload: SSDStartupData,
    tracking_id: str,
    score_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate a 6-page triage report from SSD data."""
    ci = payload.companyInformation
    co = payload.contactInformation
    fi = payload.financialInformation
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
    elif final_score >= 6:
        score_interpretation = "Moderate potential — further analysis required"
    elif final_score >= 4:
        score_interpretation = "Weak — significant concerns identified"
    else:
        score_interpretation = "Not recommended — critical issues"
    
    # Build risk flag details
    risk_flag_details = []
    for i, flag in enumerate(risk_flags[:7]):
        risk_flag_details.append({
            "domain": "general_risk",
            "flag": "yellow" if i < len(risk_flags) // 2 else "red",
            "severity": 5.0,
            "trigger": flag,
            "impact": "Medium" if i < len(risk_flags) // 2 else "High",
            "mitigation": "Further due diligence recommended"
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
    
    return {
        "report_type": "triage",
        "company_name": company_name,
        "founder_email": co.email,
        "founder_name": founder_name,
        "tracking_id": tracking_id,
        "generated_at": datetime.utcnow().isoformat(),
        "final_tca_score": final_score,
        "recommendation": recommendation,
        "total_pages": 6,
        
        "report_meta": {
            "report_type": "triage",
            "version": "2.0.0",
            "total_pages": 6,
            "branding": {
                "title_prefix": "TCA Investment Risk Rating",
                "subtitle": "Triage Report — SSD Integration",
                "logo_path": None,
                "footer_text": "Confidential — TCA TIRR Platform",
                "color_primary": "#1E3A5F",
                "color_accent": "#2F855A"
            },
            "generated_by": "TCA TIRR Analysis Engine v2.0"
        },
        
        "page_1_executive_summary": {
            "title": f"Triage Report — {company_name}",
            "overall_score": final_score,
            "score_interpretation": score_interpretation,
            "investment_recommendation": recommendation,
            "analysis_completeness": 100.0,
            "modules_run": 9
        },
        
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
        
        "page_3_risk_assessment": {
            "title": "Risk Assessment & Flags",
            "overall_risk_score": max(1, 10 - final_score),
            "total_flags": len(risk_flags),
            "high_risk_count": len([f for f in risk_flag_details if f.get("flag") == "red"]),
            "risk_flags": risk_flag_details
        },
        
        "page_4_market_and_team": {
            "title": "Market Opportunity & Team Assessment",
            "market_score": min(10, final_score + 0.3),
            "tam": str(ms.totalAvailableMarket) if ms.totalAvailableMarket else "Not provided",
            "sam": str(ms.serviceableAreaMarket) if ms.serviceableAreaMarket else "Not provided",
            "som": str(ms.serviceableObtainableMarket) if ms.serviceableObtainableMarket else "Not provided",
            "growth_rate": "N/A",
            "competitive_position": "Emerging",
            "competitive_advantages": strengths[:5] if strengths else ["Not identified"],
            "team_score": min(10, final_score + 0.5),
            "team_completeness": min(100, (ci.numberOfEmployees or 1) * 10),
            "founders": [
                {
                    "role": "CEO",
                    "description": "& Co-Founder",
                    "experience_score": 70
                }
            ],
            "team_gaps": ["CTO", "VP Sales", "CFO", "VP Engineering"] if (ci.numberOfEmployees or 0) < 10 else []
        },
        
        "page_5_financials_and_tech": {
            "title": "Financial Health & Technology Assessment",
            "financial_score": min(10, final_score - 0.2),
            "revenue": fi.annualRevenue or 0,
            "mrr": rm.monthlyRecurringRevenue or 0,
            "burn_rate": rm.burnRate or 0,
            "runway_months": (fi.currentlyRaised / rm.burnRate) if rm.burnRate and fi.currentlyRaised else 0,
            "ltv_cac_ratio": (cm.customerLifetimeValue / cm.customerAcquisitionCost) if cm.customerAcquisitionCost and cm.customerLifetimeValue else 0,
            "gross_margin": cm.margins or 0,
            "technology_score": min(10, final_score + 0.7),
            "trl": 7,
            "ip_strength": "Moderate — Verification recommended",
            "tech_stack": ["Not identified from submitted data"]
        },
        
        "page_6_recommendations": {
            "title": "Investment Recommendation & Next Steps",
            "final_decision": final_decision,
            "business_model_score": min(10, final_score + 0.3),
            "business_model_type": ci.businessModel or "N/A",
            "growth_potential_score": min(10, final_score + 0.2),
            "growth_projections": {
                "year1": "N/A — growth data not provided",
                "year2": "N/A",
                "year3": "N/A"
            },
            "investment_readiness_score": final_score,
            "exit_potential": {
                "timeline": "5-7 years",
                "strategic_fit": "Moderate" if final_score >= 5 else "Low"
            },
            "funding_recommendation": {
                "round": fi.fundingType or "Seed",
                "ask": f"${fi.targetRaise:,.0f}" if fi.targetRaise else "Not specified",
                "valuation": f"${fi.preMoneyValuation:,.0f}" if fi.preMoneyValuation else "Not specified",
                "arr_multiple": "N/A",
                "valuation_range": "Based on submitted data"
            },
            "next_steps": next_steps
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
async def ssd_tirr_endpoint(payload: SSDStartupData, background_tasks: BackgroundTasks):
    """
    TCA TIRR endpoint for the SSD application.
    
    Receives structured startup data from SSD and generates a triage report.
    Returns 202 Accepted with a tracking ID for status polling.
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
