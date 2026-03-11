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
            if ai_results.get(
                    "status") != "success" or not ai_results.get("results"):
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
    tca_categories = _calculate_tca_categories(company_data)
    composite_score = _calculate_composite_score(tca_categories)

    # Generate risk assessment
    risk_data = _calculate_risk_assessment(company_data, tca_categories)

    # Generate recommendation
    recommendation = _generate_recommendation(composite_score, risk_data)

    return {
        "analysis_id": f"calc_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "company_name": company_name,
        "executive_summary": {
            "overall_score": composite_score,
            "recommendation": recommendation["overall"],
            "key_strengths": recommendation["strengths"],
            "key_concerns": recommendation["concerns"]
        },
        "tca_data": {
            "categories": tca_categories,
            "compositeScore": composite_score,
            "summary": recommendation["summary"]
        },
        "risk_data": risk_data,
        "detailed_analysis": {
            "market_analysis": _analyze_market_potential(company_data),
            "financial_analysis": _analyze_financial_health(company_data),
            "team_analysis": _analyze_team_strength(company_data),
            "risk_assessment": risk_data["summary"]
        },
        "status": "completed",
        "created_at": datetime.now().isoformat()
    }


def _format_ai_results(ai_results: Dict[str, Any],
                       company_data: Dict[str, Any]) -> Dict[str, Any]:
    """Format AI analysis results into consistent structure"""
    from datetime import datetime

    results = ai_results.get("results", {})

    return {
        "analysis_id": f"ai_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "company_name": company_data.get("company_name", "Unknown Company"),
        "ai_powered": True,
        "executive_summary": {
            "overall_score":
            results.get("tca_scorecard", {}).get("overall_score", 0),
            "recommendation":
            results.get("tca_scorecard", {}).get("recommendation",
                                                 "Further analysis needed"),
            "key_strengths":
            results.get("tca_scorecard", {}).get("key_insights", [])[:3],
            "key_concerns":
            results.get("risk_assessment", {}).get("major_risks", [])[:3]
        },
        "tca_data": results.get("tca_scorecard", {}),
        "risk_data": results.get("risk_assessment", {}),
        "benchmark_data": results.get("benchmark_comparison", {}),
        "founder_data": results.get("founder_analysis", {}),
        "status": "completed",
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
    
    # Extract company name patterns - stop at newline or punctuation
    name_patterns = [
        r"(?:company\s*name|legal\s*name|startup\s*name)[:\s]+([A-Za-z0-9\s&.,'-]+?)(?:\n|$|Website|Founded|Industry)",
        r"(?:company|startup)[:\s]+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\n|$|Website|Founded)",
        r"^([A-Z][A-Za-z0-9\s&]{2,30})\s*[-–—]\s*(?:pitch|deck|presentation)",
        r"(?:welcome to|introducing|about)\s+([A-Z][A-Za-z0-9\s&]{2,30})",
        r"(?:^|\n)([A-Z][A-Za-z0-9\s&]{2,25}(?:\s+(?:Inc|LLC|Ltd|Corp|Co))\.?)\s*(?:\n|$)",
    ]
    for pattern in name_patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
        if match:
            extracted["company_name"] = match.group(1).strip()[:100]
            break
    
    # Extract website
    website_match = re.search(r'(https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)', content)
    if website_match:
        extracted["website"] = website_match.group(1).rstrip('.,)')
    else:
        # Try without protocol
        website_match = re.search(r'(?:website|url|site)[:\s]+((?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,})', content, re.IGNORECASE)
        if website_match:
            extracted["website"] = f"https://{website_match.group(1)}"
    
    # Extract description patterns
    desc_patterns = [
        r"(?:we are|is a|company that)\s+([^.]{20,300}\.)",
        r"(?:our mission|mission:)\s+([^.]{20,300}\.)",
        r"(?:about us|overview:)\s+([^.]{20,300}\.)",
    ]
    for pattern in desc_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            extracted["description"] = match.group(1).strip()[:500]
            break
    
    # Extract employee count
    emp_match = re.search(r'(\d{1,5})\s*(?:employees|team members|people)', content, re.IGNORECASE)
    if emp_match:
        extracted["number_of_employees"] = int(emp_match.group(1))
    
    # Extract location
    location_patterns = [
        r"(?:based in|headquarters?|located in)\s+([A-Za-z\s,]+)",
        r"([A-Za-z]+),\s*(CA|NY|TX|WA|MA|FL|USA|UK|US)",
    ]
    for pattern in location_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            location = match.group(1).strip()
            parts = location.split(",")
            if len(parts) >= 1:
                extracted["city"] = parts[0].strip()[:50]
            if len(parts) >= 2:
                extracted["state"] = parts[1].strip()[:50]
            break
    
    # Extract funding stage
    stage_keywords = {
        "pre-seed": "Pre-seed",
        "seed": "Seed",
        "series a": "Series A",
        "series b": "Series B",
        "series c": "Series C+",
        "growth": "Growth",
    }
    for keyword, stage in stage_keywords.items():
        if keyword in content.lower():
            extracted["development_stage"] = stage
            break
    
    # Extract industry vertical
    industry_keywords = {
        "saas": "Software/SaaS",
        "fintech": "FinTech",
        "healthtech": "HealthTech/MedTech",
        "medtech": "HealthTech/MedTech",
        "biotech": "BioTech",
        "ecommerce": "E-commerce",
        "edtech": "EdTech",
        "cleantech": "CleanTech/GreenTech",
        "proptech": "PropTech",
        "artificial intelligence": "AI/ML",
        "machine learning": "AI/ML",
        "cybersecurity": "Cybersecurity",
    }
    for keyword, industry in industry_keywords.items():
        if keyword in content.lower():
            extracted["industry_vertical"] = industry
            break
    
    # Extract business model
    model_keywords = {
        "b2b saas": "B2B SaaS",
        "b2c saas": "B2C SaaS",
        "marketplace": "Marketplace",
        "subscription": "Subscription",
        "freemium": "Freemium",
        "platform": "Platform",
    }
    for keyword, model in model_keywords.items():
        if keyword in content.lower():
            extracted["business_model"] = model
            break
    
    # If MedTech framework, set accordingly
    if framework == "medtech" and not extracted.get("industry_vertical"):
        extracted["industry_vertical"] = "HealthTech/MedTech"
    
    logger.info(f"Extracted company info: {list(extracted.keys())}")
    
    return extracted


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
