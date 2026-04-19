"""
Analysis management endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any
import asyncpg

from app.db import get_db
from app.models import AnalysisResponse, AnalysisCreate, PaginatedResponse
from app.services import analysis_processor
from .auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def get_analyses(page: int = 1,
                       size: int = 20,
                       db: asyncpg.Connection = Depends(get_db),
                       current_user: dict = Depends(get_current_user)):
    """Get paginated list of analyses"""
    # Implementation placeholder
    return PaginatedResponse(items=[],
                             total=0,
                             page=page,
                             size=size,
                             pages=0,
                             has_next=False,
                             has_previous=False)


@router.post("/",
             response_model=AnalysisResponse,
             status_code=status.HTTP_201_CREATED)
async def create_analysis(analysis_data: AnalysisCreate,
                          background_tasks: BackgroundTasks,
                          db: asyncpg.Connection = Depends(get_db),
                          current_user: dict = Depends(get_current_user)):
    """Create and start a new analysis"""
    # Implementation placeholder
    pass


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: int,
                       db: asyncpg.Connection = Depends(get_db),
                       current_user: dict = Depends(get_current_user)):
    """Get analysis by ID"""
    # Implementation placeholder
    pass


@router.post("/test", response_model=Dict[str, Any])
async def test_analysis(company_data: Dict[str, Any]):
    """Test endpoint for basic analysis"""
    return {
        "test": "success",
        "company_name": company_data.get("company_name", "Unknown"),
        "message": "Basic endpoint working"
    }


@router.post("/comprehensive", response_model=Dict[str, Any])
async def comprehensive_analysis(company_data: Dict[str, Any]):
    """Run comprehensive TCA analysis on company data"""
    try:
        logger.info(
            f"Starting comprehensive analysis for: {company_data.get('company_name', 'Unknown')}"
        )

        # Use real analysis processor instead of mock data
        analysis_options = {
            "tca_scorecard": True,
            "benchmark_comparison": True,
            "risk_assessment": True,
            "founder_analysis": company_data.get("founders") is not None
        }
        # Process analysis through AI service
        try:
            ai_results = await analysis_processor.process_comprehensive_analysis(
                company_data, analysis_options)
            logger.info(
                f"AI analysis completed with status: {ai_results.get('status')}"
            )

            # If AI analysis fails, use calculated fallback
            if not ai_results.get("module_results"):
                logger.warning(
                    "AI analysis failed or incomplete, using calculated fallback"
                )
                analysis_result = _calculate_fallback_analysis(company_data)
            else:
                analysis_result = _format_ai_results(ai_results, company_data)

        except Exception as ai_error:
            logger.error(f"AI analysis error: {ai_error}")
            # Fallback to calculated analysis
            analysis_result = _calculate_fallback_analysis(company_data)

        return analysis_result

    except Exception as e:
        logger.error(f"Comprehensive analysis error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Analysis processing failed")


def _calculate_fallback_analysis(
        company_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate TCA analysis using business logic when AI service is unavailable"""
    from datetime import datetime

    company_name = company_data.get("company_name", "Unknown Company")

    # Calculate TCA scores based on available data
    tca_categories_list = _calculate_tca_categories(company_data)
    composite_score = _calculate_composite_score(tca_categories_list)

    # Convert categories list → dict format expected by frontend
    # (raw_score 0-10, weight as decimal fraction 0-1)
    categories_dict: Dict[str, Any] = {}
    for cat in tca_categories_list:
        key = (cat["category"].lower().replace(" ", "_").replace(
            "-", "_").replace("&", "and").replace("/", "_"))
        categories_dict[key] = {
            "name": cat["category"],
            "raw_score": cat["rawScore"],
            "weight": cat["weight"] / 100,  # int % → decimal
            "weighted_score": cat["weightedScore"],
            "notes": cat.get("interpretation", f"Analysis for {cat['category']}")
        }

    # Generate risk assessment
    risk_data_raw = _calculate_risk_assessment(company_data, tca_categories_list)

    # Convert risk flags list → domain-keyed dict expected by frontend
    risk_flags_dict: Dict[str, Any] = {}
    for flag in risk_data_raw.get("riskFlags", []):
        domain_key = (flag["category"].lower().replace(" ", "_")
                      .replace("-", "_").replace("/", "_"))
        level = ("red" if flag["severity"] == "high"
                 else ("yellow" if flag["severity"] == "medium" else "green"))
        risk_flags_dict[domain_key] = {
            "level": {"value": level},
            "trigger": flag["description"],
            "impact": f"Impact on {flag['category']} performance",
            "severity_score": 8.0 if flag["severity"] == "high" else 5.0,
            "mitigation": flag["mitigation"],
            "ai_recommendation": f"Prioritize {flag['category'].lower()} improvements"
        }

    # Derive gap analysis from low-scoring categories
    gaps: List[Dict[str, Any]] = []
    priority_areas: List[str] = []
    quick_wins: List[str] = []
    target_score = 7.5
    for cat_key, cat_data in categories_dict.items():
        score = cat_data["raw_score"]
        if score < target_score:
            gap_size = round((target_score - score) * 10)
            priority = ("High" if score < 5.5
                        else ("Medium" if score < 6.5 else "Low"))
            gaps.append({
                "category": cat_data["name"],
                "gap_size": gap_size,
                "priority": priority,
                "gap_percentage": round(gap_size * 1.5)
            })
            if priority == "High":
                priority_areas.append(f"Improve {cat_data['name']}")
            else:
                quick_wins.append(f"Enhance {cat_data['name']}")

    # Derive benchmark percentiles from category scores
    category_benchmarks: Dict[str, Any] = {
        cat_key: {
            "percentile_rank": min(95, max(20, round(cat_data["raw_score"] * 10))),
            "sector_average": 65,
            "z_score": round((cat_data["raw_score"] - 6.5) / 1.5, 2)
        }
        for cat_key, cat_data in categories_dict.items()
    }

    overall_risk_score = min(10.0, 5.0 + len(risk_data_raw.get("riskFlags", [])) * 0.5)
    recommendation = _generate_recommendation(composite_score, risk_data_raw)
    growth_tier = max(1, min(5, round(composite_score / 20)))

    return {
        "analysis_id": f"calc_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "company_name": company_name,
        "ai_powered": False,
        "status": "completed",
        "final_tca_score": composite_score,  # 0-100; actions.ts divides by 10
        "investment_recommendation": recommendation["overall"],
        "confidence_score": 0.70,
        # TCA Scorecard — categories in dict format with snake_case keys
        "scorecard": {
            "categories": categories_dict,
            "overall_score": composite_score
        },
        # Risk Assessment — flags as domain-keyed dict
        "risk_assessment": {
            "overall_risk_score": overall_risk_score,
            "flags": risk_flags_dict
        },
        # PESTEL proxy — basic defaults
        "pestel_analysis": {
            "political": 6.5,
            "economic": 7.0,
            "social": 7.0,
            "technological": 7.5,
            "environmental": 6.0,
            "legal": 6.5,
            "composite_score": 70.0,
            "trend_alignment": {}
        },
        # Benchmark derived from TCA category scores
        "benchmark_analysis": {
            "category_benchmarks": category_benchmarks,
            "overall_percentile": min(95, max(20, round(composite_score)))
        },
        # Growth classification estimated from composite score
        "growth_classification": {
            "tier": growth_tier,
            "confidence": 0.65,
            "analysis": f"Composite TCA score: {composite_score:.1f}/100",
            "scenarios": [],
            "models": [],
            "interpretation": (
                f"Tier {growth_tier} company based on TCA composite score of {composite_score:.1f}"
            )
        },
        # Gap analysis from categories below target
        "gap_analysis": {
            "gaps": gaps[:5],
            "priority_areas": priority_areas[:3],
            "quick_wins": quick_wins[:3],
            "total_gaps": len(gaps)
        } if gaps else None,
        # Funder/founder fit proxy
        "funder_analysis": {
            "funding_readiness_score": min(100, round(composite_score)),
            "investor_matches": [{
                "investor_name": "Growth Capital Partners",
                "sector_focus": "Technology & Innovation",
                "fit_score": min(100, round(composite_score)),
                "stage_match": company_data.get("development_stage", "Seed")
            }],
            "recommended_round_size": max(1, round(composite_score / 20))
        },
        # Team analysis proxy
        "team_analysis": {
            "founders": [{
                "name": "Founding Team",
                "experience_score": min(100, round(composite_score)),
                "track_record": "Experienced team with domain expertise"
            }],
            "team_completeness": min(100, round(composite_score)),
            "diversity_score": 70
        },
        # Strategic fit proxy
        "strategic_fit": {
            "score": round(composite_score / 10, 1),
            "strategic_positioning": recommendation["overall"],
            "scalability_potential": round(composite_score / 10, 1)
        },
        "created_at": datetime.now().isoformat()
    }


def _format_ai_results(ai_results: Dict[str, Any],
                       company_data: Dict[str, Any]) -> Dict[str, Any]:
    """Format AI analysis results into structure expected by frontend"""
    from datetime import datetime

    module_results = ai_results.get("module_results", {})

    # ── TCA Scorecard ──
    tca = module_results.get("tca_scorecard", {})
    tca_categories = tca.get("categories", {})  # dict with raw_score/weight(decimal)
    tca_score = tca.get("overall_score", 0.0)   # 0-100 scale

    # ── Risk Assessment ──
    risk = module_results.get("risk_assessment", {})
    risk_domains = risk.get("risk_domains", {})
    risk_flags_dict: Dict[str, Any] = {}
    for domain, score in risk_domains.items():
        level = "red" if score >= 7 else ("yellow" if score >= 4 else "green")
        risk_flags_dict[domain] = {
            "level": {"value": level},
            "trigger": f"Risk score {score:.1f}/10",
            "impact": f"Potential impact on {domain.replace('_', ' ')} performance",
            "severity_score": score,
            "mitigation": f"Implement {domain.replace('_', ' ')} risk mitigation",
            "ai_recommendation": f"Proactively address {domain.replace('_', ' ')} exposure"
        }
    overall_risk_score = risk.get("overall_risk_score", 5.0)

    # ── Market Analysis → PESTEL proxy ──
    market = module_results.get("market_analysis", {})
    market_score = market.get("market_score", 7.0)  # 0-10

    # ── Team Assessment ──
    team = module_results.get("team_assessment", {})
    team_score = team.get("team_score", 7.0)
    completeness_raw = team.get("team_completeness", 0.75)
    team_completeness_pct = (round(completeness_raw * 100)
                             if completeness_raw <= 1.0
                             else round(completeness_raw))
    founders_raw = (company_data.get("founders")
                    or company_data.get("team_data", {}).get("founders", []))
    if isinstance(founders_raw, list) and founders_raw:
        founder_list: List[Dict[str, Any]] = [
            {
                "name": f.get("name", f"Co-Founder {i+1}"),
                "experience_score": min(100, round(team_score * 10)),
                "track_record": f.get("background", "Experienced professional")
            }
            for i, f in enumerate(founders_raw[:3])
        ]
    else:
        founder_list = [{
            "name": "Founding Team",
            "experience_score": min(100, round(team_score * 10)),
            "track_record": "Experienced team with domain expertise"
        }]

    # ── Growth Assessment ──
    growth = module_results.get("growth_assessment", {})
    growth_score = growth.get("growth_potential_score", 6.5)  # 0-10
    growth_tier = max(1, min(5, round(growth_score / 2)))

    # ── Investment Readiness → Funder Fit proxy ──
    invest = module_results.get("investment_readiness", {})
    readiness = invest.get("readiness_score", 7.0)  # 0-10
    funding_readiness_pct = min(100, round(readiness * 10))

    # ── Business Model → Strategic Fit proxy ──
    biz = module_results.get("business_model", {})

    # ── Gap Analysis derived from TCA categories ──
    gaps: List[Dict[str, Any]] = []
    priority_areas: List[str] = []
    quick_wins: List[str] = []
    target_score = 7.5
    for cat_key, cat_data in tca_categories.items():
        if isinstance(cat_data, dict):
            score = cat_data.get("raw_score", 7.0)
            if score < target_score:
                gap_size = round((target_score - score) * 10)
                priority = ("High" if score < 5.5
                            else ("Medium" if score < 6.5 else "Low"))
                gaps.append({
                    "category": cat_data.get("name", cat_key.replace("_", " ").title()),
                    "gap_size": gap_size,
                    "priority": priority,
                    "gap_percentage": round(gap_size * 1.5)
                })
                cat_display = cat_data.get("name", cat_key.replace("_", " "))
                if priority == "High":
                    priority_areas.append(f"Improve {cat_display}")
                else:
                    quick_wins.append(f"Enhance {cat_display}")

    # ── Benchmark derived from TCA category scores ──
    category_benchmarks: Dict[str, Any] = {}
    for cat_key, cat_data in tca_categories.items():
        if isinstance(cat_data, dict):
            score = cat_data.get("raw_score", 7.0)
            category_benchmarks[cat_key] = {
                "percentile_rank": min(95, max(20, round(score * 10))),
                "sector_average": 65,
                "z_score": round((score - 6.5) / 1.5, 2)
            }

    return {
        "analysis_id": f"ai_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "company_name": company_data.get("company_name", "Unknown Company"),
        "ai_powered": True,
        "status": "completed",
        "final_tca_score": ai_results.get("final_tca_score", tca_score),  # 0-100
        "investment_recommendation": ai_results.get(
            "investment_recommendation", tca.get("recommendation", "")),
        "confidence_score": ai_results.get("confidence_score", 0.75),
        # TCA Scorecard — categories already in dict/snake_case format from ai_service
        "scorecard": {
            "categories": tca_categories,
            "overall_score": tca_score
        } if tca_categories else None,
        # Risk Assessment — flags as domain-keyed dict
        "risk_assessment": {
            "overall_risk_score": overall_risk_score,
            "flags": risk_flags_dict
        } if risk else None,
        # PESTEL derived from market_analysis
        "pestel_analysis": {
            "political": 6.5,
            "economic": round(market_score * 0.9, 1),
            "social": 7.0,
            "technological": round(market_score, 1),
            "environmental": 6.0,
            "legal": 6.5,
            "composite_score": round(market_score * 10, 1),
            "trend_alignment": {
                "market_opportunity": str(market.get("growth_potential", "positive"))
            }
        } if market else None,
        # Benchmark derived from TCA category scores
        "benchmark_analysis": {
            "category_benchmarks": category_benchmarks,
            "overall_percentile": min(95, max(20, round(tca_score)))
        } if category_benchmarks else None,
        # Growth classification from growth_assessment
        "growth_classification": {
            "tier": growth_tier,
            "confidence": growth.get("confidence", 0.75),
            "analysis": (
                f"Growth potential: {growth_score:.1f}/10. "
                f"Scalability index: {growth.get('scalability_index', 6.0):.1f}/10"
            ),
            "scenarios": [],
            "models": [],
            "interpretation": (
                f"Tier {growth_tier} growth company with {growth_score:.1f}/10 potential"
            )
        } if growth else None,
        # Gap analysis from low TCA category scores
        "gap_analysis": {
            "gaps": gaps[:5],
            "priority_areas": priority_areas[:3],
            "quick_wins": quick_wins[:3],
            "total_gaps": len(gaps)
        } if gaps else None,
        # Funder analysis from investment_readiness
        "funder_analysis": {
            "funding_readiness_score": funding_readiness_pct,
            "investor_matches": [{
                "investor_name": "Growth Capital Partners",
                "sector_focus": (
                    f"{company_data.get('framework', 'technology')} investments"
                ),
                "fit_score": funding_readiness_pct,
                "stage_match": company_data.get("development_stage", "Seed")
            }],
            "recommended_round_size": max(1, round(readiness * 0.5))
        } if invest else None,
        # Team analysis from team_assessment
        "team_analysis": {
            "founders": founder_list,
            "team_completeness": team_completeness_pct,
            "diversity_score": 70
        } if team else None,
        # Strategic fit from business_model
        "strategic_fit": {
            "score": biz.get("business_model_score", 7.0),
            "strategic_positioning": str(
                biz.get("strategic_positioning", "Strong market positioning")),
            "scalability_potential": biz.get("scalability_potential", 7.0)
        } if biz else None,
        "created_at": datetime.now().isoformat(),
        "ai_errors": ai_results.get("errors", [])
    }


def _calculate_tca_categories(
        company_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Calculate TCA category scores based on company data"""

    # TCA Category weights (General framework)
    category_config = {
        "Leadership": {
            "weight": 0.20,
            "factors": ["founder_experience", "leadership_track_record"]
        },
        "Product-Market Fit": {
            "weight":
            0.20,
            "factors":
            ["market_validation", "customer_feedback", "product_traction"]
        },
        "Team Strength": {
            "weight": 0.10,
            "factors":
            ["team_experience", "technical_skills", "domain_expertise"]
        },
        "Technology & IP": {
            "weight": 0.10,
            "factors": ["tech_innovation", "ip_portfolio", "technical_moat"]
        },
        "Business Model & Financials": {
            "weight": 0.10,
            "factors": ["revenue_model", "financial_metrics", "burn_rate"]
        },
        "Go-to-Market Strategy": {
            "weight":
            0.10,
            "factors":
            ["sales_strategy", "marketing_approach", "customer_acquisition"]
        },
        "Competition & Moat": {
            "weight": 0.05,
            "factors": ["competitive_advantage", "market_differentiation"]
        },
        "Market Potential": {
            "weight": 0.05,
            "factors": ["market_size", "growth_rate", "market_timing"]
        },
        "Traction": {
            "weight": 0.05,
            "factors": ["customer_growth", "revenue_growth", "partnerships"]
        },
        "Scalability": {
            "weight": 0.025,
            "factors": ["technical_scalability", "business_scalability"]
        },
        "Risk Assessment": {
            "weight": 0.025,
            "factors": ["identified_risks", "mitigation_strategies"]
        },
        "Exit Potential": {
            "weight": 0.0,
            "factors": ["acquisition_targets", "ipo_potential"]
        }
    }

    categories = []

    for category_name, config in category_config.items():
        # Calculate raw score based on available data
        raw_score = _calculate_category_score(company_data, category_name,
                                              config["factors"])
        weighted_score = raw_score * config["weight"]

        # Determine flag color
        flag_color = "green" if raw_score >= 8.0 else "yellow" if raw_score >= 6.5 else "red"

        categories.append({
            "category":
            category_name,
            "rawScore":
            round(raw_score, 1),
            "weight":
            int(config["weight"] * 100),
            "weightedScore":
            round(weighted_score, 2),
            "flag":
            flag_color,
            "description":
            f"Evaluation of {category_name.lower()} performance",
            "strengths":
            f"Strong performance indicators in {category_name.lower()}",
            "concerns":
            "Areas for improvement identified"
            if raw_score < 7.0 else "Minor optimization opportunities",
            "interpretation":
            _get_category_interpretation(category_name, raw_score),
            "aiRecommendation":
            _get_category_recommendation(category_name, raw_score)
        })

    return categories


def _calculate_category_score(company_data: Dict[str, Any], category: str,
                              factors: List[str]) -> float:
    """Calculate score for a specific TCA category"""

    base_score = 5.0  # Default neutral score

    # Category-specific scoring logic
    if category == "Leadership":
        score = base_score
        if company_data.get("founder_experience"):
            score += 2.0
        if company_data.get("leadership_team"):
            score += 1.5
        if company_data.get("advisory_board"):
            score += 0.5
        return min(score, 10.0)

    elif category == "Product-Market Fit":
        score = base_score
        if company_data.get("customer_validation"):
            score += 2.5
        if company_data.get("revenue_traction"):
            score += 2.0
        if company_data.get("market_feedback"):
            score += 1.0
        return min(score, 10.0)

    elif category == "Team Strength":
        score = base_score
        team_size = company_data.get("team_size", 0)
        if team_size >= 5:
            score += 1.5
        if company_data.get("technical_team"):
            score += 2.0
        if company_data.get("industry_experience"):
            score += 1.5
        return min(score, 10.0)

    elif category == "Technology & IP":
        score = base_score
        if company_data.get("patents"):
            score += 2.0
        if company_data.get("technical_innovation"):
            score += 1.5
        if company_data.get("tech_stack"):
            score += 1.0
        return min(score, 10.0)

    elif category == "Market Potential":
        score = base_score
        market_size = company_data.get("market_size", 0)
        if market_size > 1000000000:  # $1B+ market
            score += 2.5
        elif market_size > 100000000:  # $100M+ market
            score += 1.5
        if company_data.get("growth_rate", 0) > 0.1:  # 10%+ growth
            score += 1.5
        return min(score, 10.0)

    elif category == "Business Model & Financials":
        score = base_score
        if company_data.get("revenue_model"):
            score += 1.5
        if company_data.get("monthly_revenue", 0) > 0:
            score += 2.0
        if company_data.get("positive_unit_economics"):
            score += 1.5
        return min(score, 10.0)

    else:
        # For other categories, use a formula based on available data
        score = base_score
        for factor in factors:
            if company_data.get(factor):
                score += 1.0
        return min(score, 10.0)


def _calculate_composite_score(categories: List[Dict[str, Any]]) -> float:
    """Calculate composite TCA score from weighted categories"""
    total_weighted_score = sum(cat["weightedScore"] for cat in categories)
    return round(total_weighted_score * 10, 1)  # Convert to 0-100 scale


def _calculate_risk_assessment(
        company_data: Dict[str, Any],
        tca_categories: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate risk assessment based on company data and TCA scores"""

    # Identify risk factors
    risk_flags = []

    # Low scoring categories become risks
    for cat in tca_categories:
        if cat["rawScore"] < 6.5:
            risk_flags.append({
                "category":
                cat["category"],
                "severity":
                "high" if cat["rawScore"] < 5.0 else "medium",
                "description":
                f"Below threshold performance in {cat['category']}",
                "mitigation":
                f"Focus improvement efforts on {cat['category'].lower()}"
            })

    # Market risks
    if company_data.get("competitive_landscape") == "highly_competitive":
        risk_flags.append({
            "category": "Market Risk",
            "severity": "medium",
            "description": "Highly competitive market environment",
            "mitigation": "Strengthen differentiation strategy"
        })

    # Financial risks
    burn_rate = company_data.get("monthly_burn", 0)
    cash_balance = company_data.get("cash_balance", 0)
    if burn_rate > 0 and cash_balance / burn_rate < 12:  # Less than 12 months runway
        risk_flags.append({
            "category":
            "Financial Risk",
            "severity":
            "high",
            "description":
            "Limited cash runway",
            "mitigation":
            "Secure additional funding or reduce burn rate"
        })

    # Calculate overall risk level
    high_risks = len([r for r in risk_flags if r["severity"] == "high"])
    medium_risks = len([r for r in risk_flags if r["severity"] == "medium"])

    if high_risks > 2:
        overall_risk = "HIGH"
    elif high_risks > 0 or medium_risks > 3:
        overall_risk = "MEDIUM"
    else:
        overall_risk = "LOW"

    return {
        "riskLevel":
        overall_risk,
        "riskFlags":
        risk_flags,
        "totalRisks":
        len(risk_flags),
        "highSeverityRisks":
        high_risks,
        "mediumSeverityRisks":
        medium_risks,
        "summary":
        f"Identified {len(risk_flags)} risk factors with {overall_risk.lower()} overall risk level"
    }


def _generate_recommendation(composite_score: float,
                             risk_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate investment recommendation based on scores and risks"""

    if composite_score >= 80 and risk_data["riskLevel"] in ["LOW", "MEDIUM"]:
        overall = "STRONG INVEST - High potential with manageable risks"
        tier = "Tier 1"
    elif composite_score >= 70 and risk_data["riskLevel"] != "HIGH":
        overall = "INVEST - Solid opportunity with acceptable risk profile"
        tier = "Tier 2"
    elif composite_score >= 60:
        overall = "CONDITIONAL - Potential with improvement needed"
        tier = "Tier 3"
    else:
        overall = "PASS - Significant concerns identified"
        tier = "No Investment"

    # Generate strengths and concerns
    strengths = []
    concerns = []

    if composite_score >= 75:
        strengths.append("Strong overall fundamentals")
    if risk_data["riskLevel"] == "LOW":
        strengths.append("Low risk profile")
    if len(risk_data["riskFlags"]) == 0:
        strengths.append("No critical risks identified")

    if composite_score < 70:
        concerns.append("Below target composite score")
    if risk_data["highSeverityRisks"] > 0:
        concerns.append("High severity risks present")
    if len(risk_data["riskFlags"]) > 3:
        concerns.append("Multiple risk factors identified")

    return {
        "overall":
        overall,
        "tier":
        tier,
        "strengths":
        strengths[:3],  # Limit to top 3
        "concerns":
        concerns[:3],  # Limit to top 3
        "summary":
        f"TCA Analysis: {composite_score}/100 - {tier} recommendation. {overall}"
    }


def _get_category_interpretation(category: str, score: float) -> str:
    """Get interpretation for category score"""
    if score >= 8.0:
        return f"Excellent {category.lower()} performance - key competitive advantage"
    elif score >= 6.5:
        return f"Good {category.lower()} showing - meets investment criteria"
    else:
        return f"{category} needs improvement - requires attention"


def _get_category_recommendation(category: str, score: float) -> str:
    """Get AI recommendation for category"""
    if score >= 8.0:
        return f"Leverage strong {category.lower()} in investment narrative"
    elif score >= 6.5:
        return f"Continue building on {category.lower()} foundation"
    else:
        return f"Priority: Address {category.lower()} weaknesses before investment"


def _analyze_market_potential(company_data: Dict[str, Any]) -> str:
    """Analyze market potential based on data"""
    market_size = company_data.get("market_size", 0)
    if market_size > 1000000000:
        return "Large addressable market with significant growth potential"
    elif market_size > 100000000:
        return "Moderate market size with good growth opportunities"
    else:
        return "Market size requires validation and expansion strategy"


def _analyze_financial_health(company_data: Dict[str, Any]) -> str:
    """Analyze financial health"""
    revenue = company_data.get("monthly_revenue", 0)
    burn = company_data.get("monthly_burn", 0)

    if revenue > burn:
        return "Positive unit economics with sustainable financial model"
    elif revenue > 0:
        return "Revenue traction demonstrated, path to profitability visible"
    else:
        return "Pre-revenue stage requires clear monetization strategy"


def _analyze_team_strength(company_data: Dict[str, Any]) -> str:
    """Analyze team strength"""
    team_size = company_data.get("team_size", 0)
    if team_size >= 10:
        return "Well-sized team with diverse capabilities"
    elif team_size >= 5:
        return "Core team assembled with key skills represented"
    else:
        return "Early-stage team requiring strategic hiring"


# ============ Company Info Extraction Endpoint ============

@router.post("/extract-company-info", response_model=Dict[str, Any])
async def extract_company_info(request_data: Dict[str, Any]):
    """
    Extract company information from document content using AI/NLP.
    Used by frontend to auto-fill company information form after document upload.
    """
    import re
    
    content = request_data.get("content", "")
    framework = request_data.get("framework", "general")
    
    if not content:
        return {"error": "No content provided"}
    
    extracted = {}
    content_lower = content.lower()

    # ── helpers ──────────────────────────────────────────────────────────────
    def _clean_text(t: str, max_len: int = 500) -> str:
        return re.sub(r'\s+', ' ', t).strip()[:max_len]

    def _find_section(heading_re: str, content: str, max_chars: int = 600) -> str | None:
        """Return text following a section heading."""
        m = re.search(
            r"(?:^|\n)\s*" + heading_re + r"\s*[:\-–]?\s*\n?((?:[^\n]{5,}\n?){1,5})",
            content, re.IGNORECASE | re.MULTILINE,
        )
        if m:
            return _clean_text(m.group(1), max_chars)
        return None
    
    # ========== COMPANY NAME EXTRACTION (Enhanced) ==========
    # Blocklist: generic/template phrases that should never be a company name
    COMPANY_NAME_BLOCKLIST = {
        "startup steroid", "startup steroid compatible", "pitch deck", "investor presentation",
        "executive summary", "company overview", "business plan", "table of contents",
        "confidential", "thank you", "questions", "contact us", "appendix", "disclaimer",
        "about us", "our company", "our startup", "company name", "enter company name",
        "your company", "example company", "sample company", "template", "slide", "overview",
        "introduction", "agenda", "mission", "vision", "problem", "solution", "market",
        "traction", "team", "financials", "ask", "summary", "background",
    }

    def is_valid_company_name(name: str) -> bool:
        """Reject generic/template phrases and too-short/too-long names."""
        if not name or len(name.strip()) < 2 or len(name.strip()) > 100:
            return False
        name_lower = name.lower().strip()
        # Reject if it IS a blocked phrase or CONTAINS a blocked phrase as the whole name
        if name_lower in COMPANY_NAME_BLOCKLIST:
            return False
        # Reject if any blocklist term appears as a substantial part (>50%) of the name
        for blocked in COMPANY_NAME_BLOCKLIST:
            if blocked in name_lower and len(blocked) / len(name_lower) > 0.5:
                return False
        return True

    name_patterns = [
        # 1. Explicit labels (highest confidence)
        r"(?:company\s*name|legal\s*name|startup\s*name|organization)[:\s=]+([A-Za-z0-9\s&.,'\-]+?)(?:\n|$|\s{2,}|Website|Founded|Industry|Location|Address)",
        # 2. Pitch deck title with explicit qualifier
        r"^([A-Z][A-Za-z0-9\s&'\-]{2,35})\s*[-–—:]\s*(?:pitch|deck|presentation|investor|overview)",
        # 3. Explicit introduction phrases
        r"(?:welcome to|introducing|about|presenting)\s+([A-Z][A-Za-z0-9\s&'\-]{2,35})(?:\s|$|\n|,)",
        # 4. Company with legal suffix at start of line (clear indicator)
        r"(?:^|\n)\s*([A-Z][A-Za-z0-9\s&'\-]{2,25})(?:\s+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|GmbH|PLC|SA))\s*(?:\n|$|,)",
        # 5. "Overview of" pattern
        r"(?:overview of|profile of|summary of)\s+([A-Z][A-Za-z0-9\s&'\-]{2,35})",
        # 6. All-caps header — LAST resort only, very conservative (single word or 2-3 word max)
        r"^([A-Z][A-Z]{1,15}(?:\s+[A-Z]{2,15}){0,1})\s*\n",
    ]
    for pattern in name_patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
        if match:
            name = match.group(1).strip()
            # Clean up trailing punctuation and template suffixes
            name = re.sub(r'[,.:;]+$', '', name).strip()
            name = re.sub(r'\s*(overview|pitch|deck|presentation|compatible|template)$', '', name, flags=re.IGNORECASE).strip()
            if is_valid_company_name(name):
                extracted["company_name"] = name
                break
    
    # ========== LEGAL NAME (if different) ==========
    legal_patterns = [
        r"(?:legal\s*name|registered\s*(?:as|name)|trading\s*as|dba|d\.b\.a\.)[:\s=]+([A-Za-z0-9\s&.,'\-]+?)(?:\n|$|\s{2,})",
        r"(?:^|\n)\s*([A-Z][A-Za-z0-9\s&'\-]{2,40})\s*(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|GmbH|PLC|SA|SAS|BV|Pty)[\s.,\n]",
    ]
    for pattern in legal_patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
        if match:
            extracted["legal_name"] = match.group(1).strip()[:100]
            break
    
    # ========== WEBSITE EXTRACTION (Enhanced) ==========
    # Try explicit label first
    website_labeled = re.search(r"(?:website|url|web|site|homepage)[:\s=]+(https?://[^\s<>\"']+|(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:/[^\s<>\"']*)?)", content, re.IGNORECASE)
    if website_labeled:
        url = website_labeled.group(1).rstrip('.,)>')
        extracted["website"] = url if url.startswith('http') else f"https://{url}"
    else:
        # Any URL in content
        website_match = re.search(r'(https?://[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}(?:/[^\s<>\"\']*)?)', content)
        if website_match:
            extracted["website"] = website_match.group(1).rstrip('.,)>')
    
    # ========== DESCRIPTION / ONE-LINER EXTRACTION (Enhanced) ==========
    # One-line description
    one_liner_patterns = [
        r"(?:one[\s-]?liner?|tagline|slogan|elevator\s*pitch)[:\s=]+([^\n]{10,200})",
        r"(?:we\s+(?:are|help|enable|provide|build|develop|create|power|transform|connect))\s+([^\n.]{15,200}\.?)",
        r"(?:our\s+(?:mission|vision))[:\s=]+([^\n]{15,200})",
    ]
    for pattern in one_liner_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            extracted["one_line_description"] = _clean_text(match.group(1), 200)
            break

    # Full description — try explicit sections first
    desc_patterns = [
        r"(?:company\s*description|about\s*us|overview|executive\s*summary)[:\s=]+([^\n]{30,}(?:\n[^\n]{20,}){0,4})",
        r"(?:mission|our\s*mission)[:\s=]+([^\n]{20,400})",
        r"(?:^|\n)([A-Z][^.!?]{30,400}(?:company|startup|platform|solution|service|technology|software|product|business)[^.!?]{5,300}[.!?])",
    ]
    for pattern in desc_patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
        if match:
            extracted["description"] = _clean_text(match.group(1), 700)
            break

    # Fallback: join consecutive non-header lines into paragraphs, then pick first good one
    if "description" not in extracted:
        lines = content.split('\n')
        joined_paras = []
        current = []
        for line in lines:
            stripped = line.strip()
            # A "break" line is empty, all-caps, or ends with ':'
            is_break = (not stripped
                        or stripped.isupper()
                        or stripped.endswith(':')
                        or re.match(r'^[•\-\*>]', stripped))
            if is_break:
                if current:
                    joined_paras.append(' '.join(current))
                    current = []
            else:
                current.append(stripped)
        if current:
            joined_paras.append(' '.join(current))
        for para in joined_paras:
            if (len(para) >= 60
                    and not para.startswith('http')
                    and para.count(' ') >= 5):
                extracted["description"] = _clean_text(para, 700)
                break

    # If still nothing, try first 3 sentences from the content
    if "description" not in extracted:
        sentences = re.findall(r'[A-Z][^.!?]{30,300}[.!?]', content)
        if sentences:
            extracted["description"] = _clean_text(' '.join(sentences[:3]), 600)

    # One-liner fallback: first sentence of description
    if "one_line_description" not in extracted and extracted.get("description"):
        first_sent = re.split(r'(?<=[.!?])\s', extracted["description"])[0]
        if 15 <= len(first_sent) <= 220:
            extracted["one_line_description"] = first_sent.strip()

    # Last-resort one-liner: any tagline-length line near the top of the document
    if "one_line_description" not in extracted:
        for line in content.split('\n')[:50]:
            line = line.strip()
            if (20 <= len(line) <= 150
                    and ' ' in line
                    and not line.isupper()
                    and not line.endswith(':')
                    and not line.startswith('http')):
                extracted["one_line_description"] = line
                break
    
    # ========== PRODUCT DESCRIPTION (Enhanced) ==========
    product_patterns = [
        r"(?:product|solution|platform|service)\s*(?:description|overview|details)?[:\s=]+([^\n]{20,}(?:\n[^\n]{20,}){0,3})",
        r"(?:what\s*we\s*(?:do|build|offer|provide))[:\s=]+([^\n]{20,400})",
        r"(?:our\s*(?:product|solution|platform|technology))[:\s=]+([^\n]{20,400})",
        r"(?:key\s*features?|core\s*features?)[:\s=]+([^\n]{20,}(?:\n[^\n]{10,}){0,5})",
        r"(?:how\s*it\s*works?)[:\s=]+([^\n]{20,}(?:\n[^\n]{10,}){0,3})",
    ]
    for pattern in product_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            extracted["product_description"] = _clean_text(match.group(1), 500)
            break

    # Fallback: look for problem/solution sections
    if "product_description" not in extracted:
        solution_section = _find_section(r"(?:solution|our\s*solution|the\s*solution)", content, 500)
        if solution_section:
            extracted["product_description"] = solution_section

    # Fallback: problem statement + solution combined
    if "product_description" not in extracted:
        problem_section = _find_section(r"(?:problem|the\s*problem|pain\s*point)", content, 300)
        solution_section2 = _find_section(r"(?:solution|our\s*solution)", content, 300)
        if problem_section and solution_section2:
            extracted["product_description"] = f"Problem: {problem_section} Solution: {solution_section2}"[:500]
        elif solution_section2:
            extracted["product_description"] = solution_section2

    # Last resort: use description as product_description
    if "product_description" not in extracted and extracted.get("description"):
        extracted["product_description"] = extracted["description"][:500]
    
    # ========== EMPLOYEE COUNT (Enhanced) ==========
    emp_patterns = [
        r"(?:employees?|team\s*(?:size|members?)|headcount|staff)[:\s=]+(\d{1,5})",
        r"(\d{1,5})\s*(?:full[\s-]?time\s+)?(?:employees?|team\s*members?|people|staff)",
        r"(?:team\s*of|staff\s*of|workforce\s*of)\s*(\d{1,5})",
        r"(\d{1,5})[\s-]person\s+team",
        r"(\d{1,5})[\s-]member\s+team",
        r"over\s+(\d{1,5})\s+employees?",
        r"(\d{1,5})\+\s*employees?",
        r"team\s+of\s+(\d{1,5})\+?",
        r"(\d{1,5})\s*-\s*\d{1,5}\s*employees?",   # range — take lower bound
    ]
    for pattern in emp_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            extracted["number_of_employees"] = int(match.group(1))
            break
    
    # ========== LOCATION EXTRACTION (Enhanced) ==========
    # Full address
    address_match = re.search(r"(?:address|headquarters?|hq|located?(?:\s*(?:at|in))?)[:\s=]+([^\n]{10,150})", content, re.IGNORECASE)
    if address_match:
        addr = address_match.group(1).strip()
        extracted["address"] = addr[:200]
        # Try to parse city/state/country from address
        parts = [p.strip() for p in addr.split(',')]
        if len(parts) >= 2:
            extracted["city"] = parts[0][:50]
            if len(parts) >= 3:
                extracted["state"] = parts[-2][:50]
                extracted["country"] = parts[-1][:50]
            else:
                extracted["country"] = parts[-1][:50]
    
    # Comprehensive US state abbreviations and full names
    US_STATES = {
        "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
        "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
        "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
        "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
        "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
        "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
        "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
        "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
        "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
        "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
        "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
        "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
        "WI": "Wisconsin", "WY": "Wyoming", "DC": "Washington DC",
    }
    US_STATE_NAMES = {v.lower(): v for v in US_STATES.values()}

    # Fallback location patterns
    if "city" not in extracted:
        location_patterns = [
            # "Based in City, State" or "Located in City, Country"
            r"(?:based\s*in|located\s*in|headquarters?\s*in|offices?\s*in)\s+([A-Za-z][A-Za-z\s]{1,30}),\s*([A-Za-z][A-Za-z\s]{1,30})",
            # "City, ST" (US 2-letter abbrev)
            r"([A-Za-z][A-Za-z\s]{1,25}),\s*(" + "|".join(US_STATES.keys()) + r")\b",
            # "City, Full State Name"
            r"([A-Za-z][A-Za-z\s]{1,25}),\s*(" + "|".join(re.escape(s) for s in US_STATES.values()) + r")\b",
        ]
        for pattern in location_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                city_candidate = match.group(1).strip()[:50]
                state_candidate = match.group(2).strip()[:50]
                # Expand abbreviation
                state_full = US_STATES.get(state_candidate.upper(), state_candidate)
                extracted["city"] = city_candidate
                extracted["state"] = state_full
                if not extracted.get("country"):
                    extracted["country"] = "United States"
                break

    # State fallback: scan content for US state names
    if "state" not in extracted:
        for abbr, full in US_STATES.items():
            if re.search(r'\b' + re.escape(abbr) + r'\b', content):
                extracted["state"] = full
                if not extracted.get("country"):
                    extracted["country"] = "United States"
                break
        if "state" not in extracted:
            for name_lower, name_full in US_STATE_NAMES.items():
                if re.search(r'\b' + re.escape(name_full) + r'\b', content, re.IGNORECASE):
                    extracted["state"] = name_full
                    if not extracted.get("country"):
                        extracted["country"] = "United States"
                    break
    
    # Country
    KNOWN_COUNTRIES = [
        "United States", "United Kingdom", "Canada", "Germany", "France",
        "Australia", "India", "Israel", "Singapore", "Netherlands", "Sweden",
        "Norway", "Denmark", "Finland", "Switzerland", "Austria", "Spain",
        "Italy", "Portugal", "Belgium", "Ireland", "New Zealand", "Japan",
        "South Korea", "China", "Brazil", "Mexico", "Nigeria", "Kenya",
        "South Africa", "UAE", "United Arab Emirates", "Saudi Arabia",
        "Indonesia", "Malaysia", "Thailand", "Vietnam", "Pakistan",
        "Estonia", "Latvia", "Lithuania", "Poland", "Czech Republic",
        "Hungary", "Romania", "Ukraine", "Turkey", "Egypt",
    ]
    COUNTRY_ALIASES = {
        "US": "United States", "USA": "United States", "U.S.": "United States",
        "U.S.A.": "United States", "UK": "United Kingdom", "U.K.": "United Kingdom",
        "UAE": "United Arab Emirates",
    }
    # City → country inference
    CITY_COUNTRY = {
        "san francisco": "United States", "new york": "United States",
        "los angeles": "United States", "seattle": "United States",
        "boston": "United States", "chicago": "United States",
        "austin": "United States", "denver": "United States",
        "miami": "United States", "atlanta": "United States",
        "london": "United Kingdom", "manchester": "United Kingdom",
        "berlin": "Germany", "munich": "Germany", "hamburg": "Germany",
        "paris": "France", "amsterdam": "Netherlands", "stockholm": "Sweden",
        "oslo": "Norway", "copenhagen": "Denmark", "helsinki": "Finland",
        "zurich": "Switzerland", "geneva": "Switzerland",
        "tel aviv": "Israel", "jerusalem": "Israel",
        "toronto": "Canada", "vancouver": "Canada", "montreal": "Canada",
        "sydney": "Australia", "melbourne": "Australia",
        "bangalore": "India", "mumbai": "India", "delhi": "India",
        "hyderabad": "India", "chennai": "India", "pune": "India",
        "singapore": "Singapore",
        "dubai": "United Arab Emirates", "abu dhabi": "United Arab Emirates",
        "tokyo": "Japan", "seoul": "South Korea", "shanghai": "China",
        "beijing": "China", "sao paulo": "Brazil",
        "nairobi": "Kenya", "lagos": "Nigeria",
        "tallinn": "Estonia", "riga": "Latvia", "vilnius": "Lithuania",
        "warsaw": "Poland", "prague": "Czech Republic", "budapest": "Hungary",
        "kyiv": "Ukraine", "istanbul": "Turkey", "cairo": "Egypt",
    }
    country_patterns = [
        r"(?:country|nation)[:\s=]+([A-Za-z\s]+?)(?:\n|$|,)",
        r"(?:headquartered|located|based|registered)\s+in\s+([A-Za-z\s]+?)(?:\.|,|$|\n)",
    ]
    if "country" not in extracted:
        for pattern in country_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                raw = match.group(1).strip()
                country = COUNTRY_ALIASES.get(raw.upper(), None) or COUNTRY_ALIASES.get(raw, None)
                if not country:
                    for known in KNOWN_COUNTRIES:
                        if known.lower() == raw.lower():
                            country = known
                            break
                if country:
                    extracted["country"] = country
                    break
    # Fallback: scan for known country names/aliases in content
    if "country" not in extracted:
        for alias, full in COUNTRY_ALIASES.items():
            if re.search(r'\b' + re.escape(alias) + r'\b', content):
                extracted["country"] = full
                break
    if "country" not in extracted:
        for known in KNOWN_COUNTRIES:
            if re.search(r'\b' + re.escape(known) + r'\b', content, re.IGNORECASE):
                extracted["country"] = known
                break
    # City → country inference
    if "country" not in extracted and "city" in extracted:
        city_key = extracted["city"].lower().strip()
        if city_key in CITY_COUNTRY:
            extracted["country"] = CITY_COUNTRY[city_key]
    # Also infer country from city anywhere in text
    if "country" not in extracted:
        for city, ctry in CITY_COUNTRY.items():
            if re.search(r'\b' + re.escape(city) + r'\b', content_lower):
                if "city" not in extracted:
                    extracted["city"] = city.title()
                extracted["country"] = ctry
                break

    # Website fallback: extract domain from email address
    if "website" not in extracted:
        email_match = re.search(r'[a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})', content)
        if email_match:
            domain = email_match.group(1)
            # Exclude generic domains
            if domain not in ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                              'icloud.com', 'me.com', 'aol.com', 'protonmail.com'):
                extracted["website"] = f"https://{domain}"
    
    # ========== FOUNDING DATE / YEAR ==========
    founded_patterns = [
        r"(?:founded|established|started|launched|incorporated)\s*(?:in\s*)?(\d{4})",
        r"(?:year\s*founded|founding\s*year)[:\s=]+(\d{4})",
        r"(?:since|est\.?)\s*(\d{4})",
    ]
    for pattern in founded_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            year = int(match.group(1))
            if 1900 <= year <= 2030:
                extracted["founded_year"] = year
                break
    
    # ========== FUNDING STAGE (Enhanced) ==========
    # Check explicit label first
    stage_label_match = re.search(
        r"(?:stage|funding stage|investment stage|current stage|round)[:\s=]+([^\n,]{3,40})",
        content, re.IGNORECASE
    )
    if stage_label_match:
        raw_stage = stage_label_match.group(1).strip().lower()
        stage_map = {
            "pre-seed": "Pre-seed", "preseed": "Pre-seed", "pre seed": "Pre-seed",
            "seed": "Seed", "seed round": "Seed", "seed stage": "Seed",
            "series a": "Series A", "series-a": "Series A",
            "series b": "Series B", "series-b": "Series B",
            "series c": "Series C+", "series d": "Series C+", "series e": "Series C+",
            "growth": "Growth", "late stage": "Growth", "late-stage": "Growth",
            "pre-ipo": "Pre-IPO", "ipo": "Pre-IPO",
        }
        for key, val in stage_map.items():
            if key in raw_stage:
                extracted["development_stage"] = val
                break
        if not extracted.get("development_stage"):
            extracted["development_stage"] = _clean_text(stage_label_match.group(1), 40)

    if not extracted.get("development_stage"):
        stage_keywords = [
            ("pre-seed", "Pre-seed"),
            ("preseed", "Pre-seed"),
            ("seed round", "Seed"),
            ("seed stage", "Seed"),
            ("seed funding", "Seed"),
            ("series a", "Series A"),
            ("series b", "Series B"),
            ("series c", "Series C+"),
            ("series d", "Series C+"),
            ("growth stage", "Growth"),
            ("growth round", "Growth"),
            ("late stage", "Growth"),
            ("late-stage", "Growth"),
            ("growth equity", "Growth"),
            ("angel round", "Pre-seed"),
            ("angel funding", "Pre-seed"),
            ("vc-backed", "Seed"),
            ("vc backed", "Seed"),
            ("venture capital", "Seed"),
            ("bootstrapped", "Pre-seed"),
            ("pre-revenue", "Pre-seed"),
            ("mvp", "Pre-seed"),
            ("minimum viable product", "Pre-seed"),
            ("early stage", "Seed"),
            ("early-stage", "Seed"),
            ("pre-ipo", "Pre-IPO"),
            ("ipo", "Pre-IPO"),
            ("public company", "Pre-IPO"),
            ("seed", "Seed"),
        ]
        for keyword, stage in stage_keywords:
            if keyword in content_lower:
                extracted["development_stage"] = stage
                break
    
    # ========== FUNDING AMOUNT ==========
    funding_patterns = [
        r"(?:raised|funding|investment)\s*[:\s=]?\s*\$?([\d,.]+)\s*(million|m|billion|b|k|thousand)?",
        r"\$?([\d,.]+)\s*(million|m|billion|b)\s*(?:raised|funding|investment)",
    ]
    for pattern in funding_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            amount = float(match.group(1).replace(',', ''))
            multiplier = match.group(2).lower() if match.group(2) else ''
            if multiplier in ['m', 'million']:
                amount *= 1000000
            elif multiplier in ['b', 'billion']:
                amount *= 1000000000
            elif multiplier in ['k', 'thousand']:
                amount *= 1000
            extracted["funding_amount"] = amount
            break
    
    # ========== INDUSTRY VERTICAL (Enhanced) ==========
    # Check explicit label first (highest confidence)
    industry_label_match = re.search(
        r"(?:industry|sector|vertical|space)\s*[:\-–=]\s*([^\n,]{3,60})",
        content, re.IGNORECASE
    )
    if industry_label_match:
        extracted["industry_vertical"] = _clean_text(industry_label_match.group(1), 60)

    if not extracted.get("industry_vertical"):
        # Ordered: specific multi-word phrases first, then single keywords
        # (more specific → less specific to avoid false matches)
        industry_keywords = [
            ("artificial intelligence", "AI/ML"),
            ("machine learning", "AI/ML"),
            ("deep learning", "AI/ML"),
            ("generative ai", "AI/ML"),
            ("large language model", "AI/ML"),
            ("llm", "AI/ML"),
            ("fintech", "FinTech"),
            ("financial technology", "FinTech"),
            ("financial services", "FinTech"),
            ("payments", "FinTech"),
            ("insurtech", "InsurTech"),
            ("insurance technology", "InsurTech"),
            ("healthtech", "HealthTech/MedTech"),
            ("health tech", "HealthTech/MedTech"),
            ("healthcare technology", "HealthTech/MedTech"),
            ("medtech", "HealthTech/MedTech"),
            ("medical technology", "HealthTech/MedTech"),
            ("medical device", "HealthTech/MedTech"),
            ("digital health", "HealthTech/MedTech"),
            ("biotech", "BioTech"),
            ("biotechnology", "BioTech"),
            ("life sciences", "BioTech"),
            ("pharmaceutical", "BioTech"),
            ("edtech", "EdTech"),
            ("education technology", "EdTech"),
            ("learning platform", "EdTech"),
            ("e-learning", "EdTech"),
            ("cleantech", "CleanTech/GreenTech"),
            ("clean technology", "CleanTech/GreenTech"),
            ("green tech", "CleanTech/GreenTech"),
            ("sustainability", "CleanTech/GreenTech"),
            ("renewable energy", "CleanTech/GreenTech"),
            ("climate tech", "CleanTech/GreenTech"),
            ("proptech", "PropTech"),
            ("property technology", "PropTech"),
            ("real estate tech", "PropTech"),
            ("cybersecurity", "Cybersecurity"),
            ("information security", "Cybersecurity"),
            ("cyber security", "Cybersecurity"),
            ("e-commerce", "E-commerce"),
            ("ecommerce", "E-commerce"),
            ("online retail", "E-commerce"),
            ("retail tech", "E-commerce"),
            ("agtech", "AgTech"),
            ("agriculture technology", "AgTech"),
            ("precision farming", "AgTech"),
            ("logistics", "Logistics/Supply Chain"),
            ("supply chain", "Logistics/Supply Chain"),
            ("foodtech", "FoodTech"),
            ("food technology", "FoodTech"),
            ("gaming", "Gaming/Entertainment"),
            ("game development", "Gaming/Entertainment"),
            ("entertainment", "Gaming/Entertainment"),
            ("media", "Media/Content"),
            ("content platform", "Media/Content"),
            ("hr tech", "HR Tech"),
            ("human resources", "HR Tech"),
            ("workforce", "HR Tech"),
            ("hrtech", "HR Tech"),
            ("marketing tech", "MarTech"),
            ("martech", "MarTech"),
            ("adtech", "AdTech"),
            ("advertising technology", "AdTech"),
            ("iot", "IoT"),
            ("internet of things", "IoT"),
            ("hardware", "Hardware"),
            ("semiconductor", "Hardware"),
            ("software as a service", "Software/SaaS"),
            ("saas", "Software/SaaS"),
            ("cloud software", "Software/SaaS"),
            ("enterprise software", "Enterprise Software"),
            ("software", "Software/SaaS"),
        ]
        for keyword, industry in industry_keywords:
            if keyword in content_lower:
                extracted["industry_vertical"] = industry
                break
    
    # ========== BUSINESS MODEL (Enhanced) ==========
    # Check explicit label first
    bm_label_match = re.search(
        r"(?:business model|revenue model|monetization model|go[\s-]?to[\s-]?market|pricing model)\s*[:\-–=]\s*([^\n]{5,100})",
        content, re.IGNORECASE
    )
    if bm_label_match:
        extracted["business_model"] = _clean_text(bm_label_match.group(1), 80)

    if not extracted.get("business_model"):
        # Ordered: most specific multi-word first
        model_keywords = [
            ("b2b saas", "B2B SaaS"),
            ("b2b software", "B2B SaaS"),
            ("enterprise saas", "B2B SaaS"),
            ("b2c saas", "B2C SaaS"),
            ("consumer saas", "B2C SaaS"),
            ("b2b2c", "B2B2C"),
            ("two-sided marketplace", "Marketplace"),
            ("two sided marketplace", "Marketplace"),
            ("marketplace", "Marketplace"),
            ("platform business", "Platform"),
            ("usage-based pricing", "Usage-Based"),
            ("usage based pricing", "Usage-Based"),
            ("pay-as-you-go", "Usage-Based"),
            ("pay as you go", "Usage-Based"),
            ("per-transaction", "Transaction Fee"),
            ("transaction fee", "Transaction Fee"),
            ("subscription-based", "Subscription"),
            ("subscription model", "Subscription"),
            ("recurring revenue", "Subscription"),
            ("annual recurring", "Subscription"),
            ("freemium", "Freemium"),
            ("free trial", "Freemium"),
            ("licensing model", "Licensing"),
            ("software licensing", "Licensing"),
            ("licensing", "Licensing"),
            ("advertising model", "Advertising"),
            ("ad-supported", "Advertising"),
            ("professional services", "Professional Services"),
            ("consulting", "Professional Services"),
            ("hardware + software", "Hardware + Software"),
            ("hardware and software", "Hardware + Software"),
            ("b2b", "B2B SaaS"),
            ("b2c", "B2C SaaS"),
            ("platform", "Platform"),
            ("subscription", "Subscription"),
        ]
        for keyword, model in model_keywords:
            if keyword in content_lower:
                extracted["business_model"] = model
                break
    
    # ========== REVENUE / FINANCIALS ==========
    revenue_patterns = [
        r"(?:revenue|arr|annual\s*recurring\s*revenue|mrr)[:\s=]?\s*\$?([\d,.]+)\s*(million|m|k|thousand)?",
        r"(?:revenue|arr|mrr)\s*(?:of|:)?\s*\$?([\d,.]+)\s*(million|m|k)?",
    ]
    for pattern in revenue_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            amount = float(match.group(1).replace(',', ''))
            multiplier = match.group(2).lower() if match.group(2) else ''
            if multiplier in ['m', 'million']:
                amount *= 1000000
            elif multiplier in ['k', 'thousand']:
                amount *= 1000
            extracted["annual_revenue"] = amount
            break
    
    # ========== FOUNDERS / CEO ==========
    founder_patterns = [
        r"(?:founder(?:s)?|ceo|chief\s*executive)[:\s=]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
        r"(?:founded\s*by|co-founders?)[:\s=]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}(?:\s*(?:and|,)\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})*)",
    ]
    for pattern in founder_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            extracted["founders"] = match.group(1).strip()[:200]
            break
    
    # ========== FRAMEWORK-SPECIFIC DEFAULTS ==========
    if framework == "medtech" and not extracted.get("industry_vertical"):
        extracted["industry_vertical"] = "HealthTech/MedTech"
    elif framework == "fintech" and not extracted.get("industry_vertical"):
        extracted["industry_vertical"] = "FinTech"
    elif framework == "saas" and not extracted.get("industry_vertical"):
        extracted["industry_vertical"] = "Software/SaaS"

    # ========== COMPANY NAME FALLBACK (Title/First Heading) ==========
    if not extracted.get("company_name"):
        # Try to find the first meaningful heading in the document
        lines = content.split('\n')
        for line in lines[:30]:
            line = line.strip()
            # Skip empty, pure-number, URL, or very long lines
            if not line or len(line) < 2 or len(line) > 60:
                continue
            if line.startswith('http') or line.startswith('www'):
                continue
            if re.match(r'^\d+[\s.)]', line):
                continue
            # Skip generic template/slide labels
            if re.match(r'^(slide|page|section|appendix|table\s*of|confidential|disclaimer|agenda|©|copyright|\d+$)', line, re.IGNORECASE):
                continue
            # Accept Title Case or ALL CAPS short text as potential company name
            word_count = len(line.split())
            if 1 <= word_count <= 5:
                candidate = line.strip('.,;:!?')
                if is_valid_company_name(candidate):
                    extracted["company_name"] = candidate
                    break

    # ========== LEGAL NAME FALLBACK ==========
    # If legal name not explicitly found, use company name as default
    if "legal_name" not in extracted and extracted.get("company_name"):
        # Check if company name already has a legal suffix — if so it IS the legal name
        if re.search(r'\b(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|GmbH|PLC|SA|BV|Pty|SAS)\b',
                     extracted["company_name"], re.IGNORECASE):
            extracted["legal_name"] = extracted["company_name"]
        else:
            # Use company name as-is — user can correct in the form
            extracted["legal_name"] = extracted["company_name"]

    # ========== CITY FALLBACK FROM KNOWN CITIES IN CITY_COUNTRY ==========
    if "city" not in extracted:
        for city_name, ctry in CITY_COUNTRY.items():
            if re.search(r'\b' + re.escape(city_name) + r'\b', content_lower):
                extracted["city"] = city_name.title()
                if "country" not in extracted:
                    extracted["country"] = ctry
                break

    logger.info(f"Extracted company info: {list(extracted.keys())} - {len(extracted)} fields")
    
    return extracted


# ============ Analyst Review Workflow Endpoints ============

@router.get("/analyst-reviews", response_model=Dict[str, Any])
async def list_analyst_reviews(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all analyses as analyst review queue."""
    try:
        rows = await db.fetch(
            """SELECT a.id, a.company_name, a.analysis_type, a.status,
                      a.created_at, a.updated_at, a.created_by,
                      u.username as analyst_name
               FROM analyses a
               LEFT JOIN users u ON a.created_by = u.id
               ORDER BY a.updated_at DESC
               LIMIT 100"""
        )
        reviews = []
        for row in rows:
            r = dict(row)
            # Map DB status to review status
            status_map = {
                "completed": "completed",
                "processing": "in_progress",
                "pending": "pending",
                "failed": "failed",
            }
            reviews.append({
                "id": str(r["id"]),
                "company": r.get("company_name") or "Unknown",
                "reportType": r.get("analysis_type") or "TCA Analysis",
                "status": status_map.get(r.get("status", "pending"), "pending"),
                "assigned": r.get("analyst_name") or current_user.get("username", "Unassigned"),
                "progress": 100 if r.get("status") == "completed" else (50 if r.get("status") == "processing" else 0),
                "lastActivity": r["updated_at"].isoformat() + "Z" if r.get("updated_at") else None,
            })
        return {"success": True, "reviews": reviews}
    except Exception as e:
        logger.error(f"Failed to list analyst reviews: {e}")
        return {"success": True, "reviews": []}


@router.post("/analyst-reviews", response_model=Dict[str, Any])
async def create_analyst_review(review_data: Dict[str, Any]):
    """
    Create a new analyst review for an analysis.
    Captures human scores, comments, and deviation rationale.
    """
    from datetime import datetime
    
    try:
        analysis_id = review_data.get("analysis_id")
        if not analysis_id:
            raise HTTPException(status_code=400, detail="analysis_id required")
        
        review = {
            "id": f"review_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "analysis_id": analysis_id,
            "analyst_id": review_data.get("analyst_id"),
            "analyst_name": review_data.get("analyst_name", "Unknown Analyst"),
            "human_scores": review_data.get("human_scores", {}),
            "ai_scores": review_data.get("ai_scores", {}),
            "deviation_rationale": review_data.get("deviation_rationale", ""),
            "category_comments": review_data.get("category_comments", {}),
            "overall_assessment": review_data.get("overall_assessment", ""),
            "sentiment_indicators": review_data.get("sentiment_indicators", {}),
            "recommendation_override": review_data.get("recommendation_override"),
            "training_approved": review_data.get("training_approved", False),
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        
        # Calculate deviation metrics
        review["deviation_metrics"] = _calculate_deviation_metrics(
            review["human_scores"], 
            review["ai_scores"]
        )
        
        # Analyze sentiment from comments
        review["sentiment_analysis"] = _analyze_review_sentiment(
            review["category_comments"],
            review["deviation_rationale"]
        )
        
        logger.info(f"Created analyst review: {review['id']}")
        return review
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create analyst review: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyst-reviews/{analysis_id}", response_model=Dict[str, Any])
async def get_analyst_review(analysis_id: str):
    """Get analyst review for an analysis"""
    # In production, fetch from database
    return {
        "analysis_id": analysis_id,
        "reviews": [],
        "message": "No reviews found for this analysis"
    }


@router.post("/ai-deviation-comparison", response_model=Dict[str, Any])
async def compare_ai_human_scores(comparison_data: Dict[str, Any]):
    """
    Compare AI scores with human analyst scores and generate deviation analysis.
    Used by the AI vs Human Gap Analysis component.
    """
    try:
        ai_scores = comparison_data.get("ai_scores", {})
        human_scores = comparison_data.get("human_scores", {})
        analyst_comments = comparison_data.get("comments", {})
        
        if not ai_scores or not human_scores:
            raise HTTPException(status_code=400, detail="Both ai_scores and human_scores required")
        
        # Calculate deviation metrics
        deviation_metrics = _calculate_deviation_metrics(human_scores, ai_scores)
        
        # Generate chart data for visualization
        chart_data = []
        for category in set(ai_scores.keys()) | set(human_scores.keys()):
            ai_score = ai_scores.get(category, 0)
            human_score = human_scores.get(category, 0)
            chart_data.append({
                "category": category,
                "ai": ai_score,
                "analyst": human_score,
                "deviation": round(ai_score - human_score, 2),
                "comment": analyst_comments.get(category, "")
            })
        
        # Sort by absolute deviation (largest first)
        chart_data.sort(key=lambda x: abs(x["deviation"]), reverse=True)
        
        # Generate AI recommendations based on deviations
        recommendations = _generate_training_recommendations(chart_data, deviation_metrics)
        
        # Perform sentiment analysis on comments
        sentiment_analysis = _analyze_review_sentiment(analyst_comments, "")
        
        return {
            "chart_data": chart_data,
            "deviation_metrics": deviation_metrics,
            "recommendations": recommendations,
            "sentiment_analysis": sentiment_analysis,
            "training_suggested": deviation_metrics.get("mae", 0) > 0.5,
            "review_needed": any(abs(d["deviation"]) > 2.0 for d in chart_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI deviation comparison failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-for-training", response_model=Dict[str, Any])
async def submit_for_ml_training(training_data: Dict[str, Any]):
    """
    Submit analyst review data for ML model training.
    Captures human corrections to improve AI accuracy over time.
    """
    from datetime import datetime
    
    try:
        training_record = {
            "id": f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "analysis_id": training_data.get("analysis_id"),
            "company_name": training_data.get("company_name", "Unknown"),
            "ai_scores": training_data.get("ai_scores", {}),
            "human_scores": training_data.get("human_scores", {}),
            "human_rationale": training_data.get("rationale", ""),
            "category_adjustments": training_data.get("category_adjustments", {}),
            "analyst_id": training_data.get("analyst_id"),
            "industry_context": training_data.get("industry_context", ""),
            "company_stage": training_data.get("company_stage", ""),
            "submitted_at": datetime.now().isoformat(),
            "status": "queued",
            "priority": _calculate_training_priority(training_data)
        }
        
        logger.info(f"Submitted training data: {training_record['id']}")
        
        return {
            "success": True,
            "training_id": training_record["id"],
            "message": "Training data submitted successfully. It will be processed in the next training batch.",
            "estimated_incorporation": "Within 24 hours",
            "priority": training_record["priority"]
        }
        
    except Exception as e:
        logger.error(f"Failed to submit training data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sentiment-analysis", response_model=Dict[str, Any])
async def analyze_comment_sentiment(request_data: Dict[str, Any]):
    """
    Analyze sentiment and insights from analyst comments.
    Supports deep content analysis for reviewer feedback.
    """
    try:
        comments = request_data.get("comments", {})
        rationale = request_data.get("rationale", "")
        
        analysis = _analyze_review_sentiment(comments, rationale)
        
        # Deep content analysis
        content_insights = _deep_content_analysis(comments, rationale)
        
        return {
            "sentiment_scores": analysis,
            "content_insights": content_insights,
            "key_themes": content_insights.get("themes", []),
            "action_items": content_insights.get("action_items", []),
            "confidence_level": content_insights.get("confidence", "medium")
        }
        
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _calculate_deviation_metrics(human_scores: Dict[str, float], ai_scores: Dict[str, float]) -> Dict[str, Any]:
    """Calculate statistical metrics for AI vs Human score deviations"""
    import math
    
    categories = list(set(human_scores.keys()) & set(ai_scores.keys()))
    if not categories:
        return {"error": "No overlapping categories"}
    
    deviations = []
    squared_deviations = []
    agreements = 0
    
    for cat in categories:
        human = human_scores.get(cat, 0)
        ai = ai_scores.get(cat, 0)
        diff = abs(ai - human)
        deviations.append(diff)
        squared_deviations.append(diff ** 2)
        if diff < 0.5:  # Within 0.5 points is considered agreement
            agreements += 1
    
    n = len(deviations)
    mae = sum(deviations) / n  # Mean Absolute Error
    rmse = math.sqrt(sum(squared_deviations) / n)  # Root Mean Square Error
    agreement_rate = agreements / n
    
    # Calculate Cohen's Kappa approximation
    # (simplified for numerical scores - use discretized buckets)
    human_bins = [_score_bucket(human_scores.get(c, 0)) for c in categories]
    ai_bins = [_score_bucket(ai_scores.get(c, 0)) for c in categories]
    observed_agreement = sum(1 for h, a in zip(human_bins, ai_bins) if h == a) / n
    expected_agreement = 0.33  # Random agreement for 3 buckets
    kappa = (observed_agreement - expected_agreement) / (1 - expected_agreement) if expected_agreement < 1 else 1
    
    # Bias calculation (positive = AI higher, negative = Human higher)
    bias = sum(ai_scores.get(c, 0) - human_scores.get(c, 0) for c in categories) / n
    
    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "cohens_kappa": round(max(0, kappa), 3),
        "agreement_rate": round(agreement_rate * 100, 1),
        "bias": round(bias, 3),
        "bias_direction": "AI Higher" if bias > 0.1 else "Human Higher" if bias < -0.1 else "Neutral",
        "total_categories": n,
        "high_deviation_count": sum(1 for d in deviations if d > 1.5),
        "calibration_quality": "High" if mae < 0.5 else "Medium" if mae < 1.0 else "Low"
    }


def _score_bucket(score: float) -> str:
    """Convert score to bucket for kappa calculation"""
    if score >= 8:
        return "high"
    elif score >= 6:
        return "medium"
    else:
        return "low"


def _generate_training_recommendations(chart_data: List[Dict], metrics: Dict) -> Dict[str, Any]:
    """Generate AI training recommendations based on deviations"""
    
    recommendations = []
    weight_adjustments = {}
    
    for item in chart_data:
        deviation = item["deviation"]
        category = item["category"]
        
        if abs(deviation) > 1.5:
            if deviation > 0:
                recommendations.append(
                    f"Reduce weight on '{category}' - AI over-scoring by {abs(deviation):.1f} points"
                )
                weight_adjustments[category] = {"action": "reduce", "magnitude": min(0.2, abs(deviation) / 10)}
            else:
                recommendations.append(
                    f"Increase weight on '{category}' - AI under-scoring by {abs(deviation):.1f} points"
                )
                weight_adjustments[category] = {"action": "increase", "magnitude": min(0.2, abs(deviation) / 10)}
    
    # Add general recommendations based on metrics
    if metrics.get("bias", 0) > 0.5:
        recommendations.append("General bias detected: AI tends to score higher. Consider calibration adjustment.")
    elif metrics.get("bias", 0) < -0.5:
        recommendations.append("General bias detected: AI tends to score lower. Consider calibration adjustment.")
    
    if metrics.get("mae", 0) > 1.0:
        recommendations.append("High overall deviation suggests model retraining may be beneficial.")
    
    return {
        "recommendations": recommendations[:5],  # Top 5 recommendations
        "weight_adjustments": weight_adjustments,
        "retraining_suggested": metrics.get("mae", 0) > 0.8,
        "priority": "high" if metrics.get("mae", 0) > 1.5 else "medium" if metrics.get("mae", 0) > 0.8 else "low"
    }


def _analyze_review_sentiment(comments: Dict[str, str], rationale: str) -> Dict[str, Any]:
    """Analyze sentiment from analyst comments"""
    
    # Simple keyword-based sentiment analysis
    positive_keywords = [
        "strong", "excellent", "good", "impressive", "solid", "promising", "innovative",
        "growth", "opportunity", "potential", "advantage", "leading", "experienced"
    ]
    negative_keywords = [
        "weak", "poor", "concern", "risk", "challenge", "limited", "lacking",
        "unclear", "uncertain", "competitive", "struggling", "unproven"
    ]
    neutral_keywords = ["adequate", "average", "moderate", "typical", "standard"]
    
    all_text = " ".join(comments.values()) + " " + rationale
    all_text_lower = all_text.lower()
    
    positive_count = sum(1 for kw in positive_keywords if kw in all_text_lower)
    negative_count = sum(1 for kw in negative_keywords if kw in all_text_lower)
    neutral_count = sum(1 for kw in neutral_keywords if kw in all_text_lower)
    
    total = positive_count + negative_count + neutral_count + 1  # +1 to avoid division by zero
    
    # Calculate sentiment score (-1 to 1)
    sentiment_score = (positive_count - negative_count) / total
    
    # Per-category sentiment
    category_sentiment = {}
    for cat, comment in comments.items():
        comment_lower = comment.lower()
        cat_positive = sum(1 for kw in positive_keywords if kw in comment_lower)
        cat_negative = sum(1 for kw in negative_keywords if kw in comment_lower)
        if cat_positive > cat_negative:
            category_sentiment[cat] = "positive"
        elif cat_negative > cat_positive:
            category_sentiment[cat] = "negative"
        else:
            category_sentiment[cat] = "neutral"
    
    return {
        "overall_sentiment": "positive" if sentiment_score > 0.2 else "negative" if sentiment_score < -0.2 else "neutral",
        "sentiment_score": round(sentiment_score, 3),
        "positive_indicators": positive_count,
        "negative_indicators": negative_count,
        "category_sentiment": category_sentiment,
        "confidence": "high" if total > 5 else "medium" if total > 2 else "low"
    }


def _deep_content_analysis(comments: Dict[str, str], rationale: str) -> Dict[str, Any]:
    """Perform deep content analysis on analyst comments"""
    import re
    
    all_text = " ".join(comments.values()) + " " + rationale
    
    # Extract themes
    theme_patterns = {
        "market_concerns": r"market|competition|competitive|competitor|share|penetration",
        "team_assessment": r"team|leadership|founder|experience|execute|execution",
        "financial_view": r"revenue|financial|burn|runway|profit|margin|cost",
        "product_feedback": r"product|technology|innovation|feature|development",
        "growth_outlook": r"growth|scale|expand|traction|momentum|potential",
        "risk_factors": r"risk|challenge|concern|threat|weakness|barrier",
    }
    
    themes = []
    for theme, pattern in theme_patterns.items():
        if re.search(pattern, all_text, re.IGNORECASE):
            themes.append(theme.replace("_", " ").title())
    
    # Extract action items (sentences with action verbs)
    action_patterns = [
        r"(?:should|need to|must|recommend|suggest|consider)\s+([^.!?]+[.!?])",
        r"(?:improve|address|focus on|strengthen)\s+([^.!?]+[.!?])",
    ]
    
    action_items = []
    for pattern in action_patterns:
        matches = re.findall(pattern, all_text, re.IGNORECASE)
        action_items.extend([m.strip() for m in matches[:3]])  # Max 3 per pattern
    
    # Calculate content depth
    word_count = len(all_text.split())
    sentence_count = len(re.split(r'[.!?]+', all_text))
    avg_sentence_length = word_count / max(sentence_count, 1)
    
    return {
        "themes": themes[:5],
        "action_items": action_items[:5],
        "word_count": word_count,
        "depth_score": "comprehensive" if word_count > 200 else "moderate" if word_count > 50 else "brief",
        "avg_sentence_length": round(avg_sentence_length, 1),
        "confidence": "high" if word_count > 100 else "medium" if word_count > 30 else "low"
    }


def _calculate_training_priority(training_data: Dict[str, Any]) -> str:
    """Calculate priority level for training data"""
    
    # Higher priority for larger deviations
    ai_scores = training_data.get("ai_scores", {})
    human_scores = training_data.get("human_scores", {})
    
    if not ai_scores or not human_scores:
        return "low"
    
    max_deviation = 0
    for cat in set(ai_scores.keys()) & set(human_scores.keys()):
        deviation = abs(ai_scores[cat] - human_scores[cat])
        max_deviation = max(max_deviation, deviation)
    
    # Also consider if rationale is provided (more valuable for training)
    has_rationale = bool(training_data.get("rationale", "").strip())
    
    if max_deviation > 2.0 or (max_deviation > 1.0 and has_rationale):
        return "high"
    elif max_deviation > 1.0 or has_rationale:
        return "medium"
    else:
        return "low"


# ============ File Upload & Text Extraction Endpoint ============

@router.post("/extract-text-from-file", response_model=Dict[str, Any])
async def extract_text_from_file(
    file: bytes = None,
    file_data: Dict[str, Any] = None,
):
    """
    Extract text content from uploaded files (PDF, DOCX, etc.)
    Accepts either raw file bytes or base64-encoded file data.
    """
    import base64
    import io
    
    try:
        content = ""
        file_bytes = None
        filename = "unknown"
        
        if file_data:
            # Handle base64 encoded file
            file_bytes = base64.b64decode(file_data.get("content", ""))
            filename = file_data.get("filename", "unknown")
        elif file:
            file_bytes = file
        
        if not file_bytes:
            return {"error": "No file data provided", "text_content": ""}
        
        # Try to extract text based on file type
        if filename.lower().endswith('.pdf'):
            # Use PyMuPDF for PDF extraction if available
            try:
                import fitz  # PyMuPDF
                pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
                text_parts = []
                for page_num in range(len(pdf_doc)):
                    page = pdf_doc.load_page(page_num)
                    text_parts.append(page.get_text())
                pdf_doc.close()
                content = "\n".join(text_parts)
            except ImportError:
                # Fallback: try pdfplumber
                try:
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        text_parts = []
                        for page in pdf.pages:
                            text = page.extract_text()
                            if text:
                                text_parts.append(text)
                        content = "\n".join(text_parts)
                except ImportError:
                    content = "[PDF extraction requires PyMuPDF or pdfplumber]"
                except Exception as e:
                    content = f"[PDF extraction failed: {str(e)}]"
            except Exception as e:
                content = f"[PDF extraction failed: {str(e)}]"
                
        elif filename.lower().endswith(('.docx', '.doc')):
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                content = "\n".join([para.text for para in doc.paragraphs])
            except ImportError:
                content = "[DOCX extraction requires python-docx]"
            except Exception as e:
                content = f"[DOCX extraction failed: {str(e)}]"
        
        elif filename.lower().endswith(('.xlsx', '.xls')):
            # Excel file extraction
            try:
                import openpyxl
                workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
                text_parts = []
                for sheet_name in workbook.sheetnames:
                    sheet = workbook[sheet_name]
                    text_parts.append(f"=== Sheet: {sheet_name} ===")
                    for row in sheet.iter_rows(values_only=True):
                        row_text = "\t".join([str(cell) if cell is not None else "" for cell in row])
                        if row_text.strip():
                            text_parts.append(row_text)
                content = "\n".join(text_parts)
            except ImportError:
                # Fallback: try pandas
                try:
                    import pandas as pd
                    excel_file = pd.ExcelFile(io.BytesIO(file_bytes))
                    text_parts = []
                    for sheet_name in excel_file.sheet_names:
                        df = pd.read_excel(excel_file, sheet_name=sheet_name)
                        text_parts.append(f"=== Sheet: {sheet_name} ===")
                        text_parts.append(df.to_string())
                    content = "\n".join(text_parts)
                except ImportError:
                    content = "[Excel extraction requires openpyxl or pandas]"
                except Exception as e:
                    content = f"[Excel extraction failed: {str(e)}]"
            except Exception as e:
                content = f"[Excel extraction failed: {str(e)}]"
        
        elif filename.lower().endswith('.pptx'):
            # PowerPoint file extraction
            try:
                from pptx import Presentation
                prs = Presentation(io.BytesIO(file_bytes))
                text_parts = []
                for slide_num, slide in enumerate(prs.slides, 1):
                    slide_text = [f"=== Slide {slide_num} ==="]
                    for shape in slide.shapes:
                        if hasattr(shape, "text") and shape.text:
                            slide_text.append(shape.text)
                    text_parts.extend(slide_text)
                content = "\n".join(text_parts)
            except ImportError:
                content = "[PowerPoint extraction requires python-pptx]"
            except Exception as e:
                content = f"[PowerPoint extraction failed: {str(e)}]"
        
        elif filename.lower().endswith('.rtf'):
            # RTF file extraction
            try:
                from striprtf.striprtf import rtf_to_text
                content = rtf_to_text(file_bytes.decode('utf-8', errors='ignore'))
            except ImportError:
                content = "[RTF extraction requires striprtf]"
            except Exception as e:
                content = f"[RTF extraction failed: {str(e)}]"
                
        elif filename.lower().endswith(('.txt', '.csv', '.json', '.md', '.yaml', '.yml')):
            try:
                content = file_bytes.decode('utf-8')
            except UnicodeDecodeError:
                content = file_bytes.decode('latin-1')
        else:
            content = f"[Unsupported file type: {filename}]"
        
        logger.info(f"Extracted {len(content)} characters from {filename}")
        
        return {
            "filename": filename,
            "text_content": content,
            "char_count": len(content),
            "word_count": len(content.split()) if content else 0,
        }
        
    except Exception as e:
        logger.error(f"File text extraction failed: {e}")
        return {"error": str(e), "text_content": ""}
