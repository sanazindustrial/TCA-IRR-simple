#!/usr/bin/env python3
"""
Simplified TCA Backend for Testing
Minimal FastAPI server without database dependencies
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import asyncio
import logging
from datetime import datetime
import uvicorn
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TCA Backend API (Test Mode)",
    description="Simplified backend for testing TCA analysis pipeline",
    version="1.0.0-test")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:8001", "http://127.0.0.1:8001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "TCA Backend API (Test Mode) is running",
        "status": "healthy",
        "timestamp": datetime.utcnow()
    }


@app.get("/api/health")
async def api_health():
    """API health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "mode": "test",
        "database": "simulated"
    }


@app.post("/api/analysis/comprehensive")
async def run_comprehensive_analysis(request: Request):
    """Run comprehensive TCA analysis (test mode)"""
    try:
        data = await request.json()
        logger.info(
            f"Received analysis request for framework: {data.get('framework', 'unknown')}"
        )

        # Simulate processing time
        await asyncio.sleep(1)

        # Return comprehensive mock results
        return {
            "final_tca_score": 78.5,
            "investment_recommendation":
            "Proceed with due diligence - Strong potential with manageable risks",
            "scorecard": {
                "categories": {
                    "market_potential": {
                        "name":
                        "Market Potential",
                        "raw_score":
                        8.2,
                        "weight":
                        0.20,
                        "weighted_score":
                        16.4,
                        "notes":
                        "Strong market opportunity with clear value proposition and significant addressable market"
                    },
                    "technology_innovation": {
                        "name":
                        "Technology Innovation",
                        "raw_score":
                        7.8,
                        "weight":
                        0.15,
                        "weighted_score":
                        11.7,
                        "notes":
                        "Solid technology foundation with competitive advantages and scalable architecture"
                    },
                    "team_capability": {
                        "name":
                        "Team Capability",
                        "raw_score":
                        8.0,
                        "weight":
                        0.25,
                        "weighted_score":
                        20.0,
                        "notes":
                        "Experienced team with relevant domain expertise and successful track record"
                    },
                    "business_model": {
                        "name":
                        "Business Model",
                        "raw_score":
                        7.5,
                        "weight":
                        0.20,
                        "weighted_score":
                        15.0,
                        "notes":
                        "Clear revenue model with multiple monetization streams and growth potential"
                    },
                    "financial_health": {
                        "name":
                        "Financial Health",
                        "raw_score":
                        7.0,
                        "weight":
                        0.20,
                        "weighted_score":
                        14.0,
                        "notes":
                        "Adequate funding runway with reasonable burn rate and path to profitability"
                    }
                }
            },
            "risk_assessment": {
                "overall_risk_score": 6.5,
                "flags": {
                    "market_risk": {
                        "level": {
                            "value": "yellow"
                        },
                        "trigger":
                        "Competitive market dynamics",
                        "impact":
                        "Medium competitive pressure in target market segment",
                        "severity_score":
                        6,
                        "mitigation":
                        "Strengthen differentiation through unique value proposition and strategic partnerships",
                        "ai_recommendation":
                        "Focus on customer acquisition and market positioning to establish strong foothold"
                    },
                    "technology_risk": {
                        "level": {
                            "value": "green"
                        },
                        "trigger":
                        "Technology scalability assessment",
                        "impact":
                        "Strong technical architecture with proven scalability patterns",
                        "severity_score":
                        3,
                        "mitigation":
                        "Continue investing in technical talent and infrastructure development",
                        "ai_recommendation":
                        "Maintain current technical roadmap while expanding development capabilities"
                    },
                    "financial_risk": {
                        "level": {
                            "value": "yellow"
                        },
                        "trigger":
                        "Funding runway analysis",
                        "impact":
                        "Moderate risk due to burn rate and funding timeline",
                        "severity_score":
                        5,
                        "mitigation":
                        "Optimize operational efficiency and prepare next funding round strategy",
                        "ai_recommendation":
                        "Focus on revenue growth and cost optimization to extend runway"
                    }
                }
            },
            "pestel_analysis": {
                "political": 7.2,
                "economic": 7.8,
                "social": 8.0,
                "technological": 8.5,
                "environmental": 6.8,
                "legal": 7.0,
                "composite_score": 75.5,
                "trend_alignment": {
                    "digital_transformation":
                    "Strong alignment with digital transformation trends",
                    "sustainability":
                    "Moderate alignment with sustainability initiatives",
                    "regulatory_changes":
                    "Well-positioned for anticipated regulatory changes",
                    "economic_growth":
                    "Positive outlook given economic conditions",
                    "technology_adoption":
                    "Excellent positioning for technology adoption cycle"
                }
            },
            "benchmark_analysis": {
                "overall_percentile": 72,
                "category_benchmarks": {
                    "growth_metrics": {
                        "percentile_rank": 75,
                        "sector_average": 65,
                        "z_score": 0.8
                    },
                    "financial_metrics": {
                        "percentile_rank": 68,
                        "sector_average": 70,
                        "z_score": -0.2
                    },
                    "operational_metrics": {
                        "percentile_rank": 74,
                        "sector_average": 68,
                        "z_score": 0.6
                    },
                    "market_metrics": {
                        "percentile_rank": 71,
                        "sector_average": 66,
                        "z_score": 0.5
                    }
                }
            },
            "gap_analysis": {
                "total_gaps":
                5,
                "priority_areas": [
                    "Sales and Marketing Capability Enhancement",
                    "Customer Success Infrastructure Development"
                ],
                "quick_wins": [
                    "Automated customer onboarding process",
                    "Enhanced product analytics and insights",
                    "Improved customer communication workflows",
                    "Streamlined sales pipeline management"
                ],
                "gaps": [{
                    "category": "Sales Performance",
                    "gap_size": 15,
                    "priority": "High",
                    "gap_percentage": 20
                }, {
                    "category": "Marketing Reach",
                    "gap_size": 12,
                    "priority": "Medium",
                    "gap_percentage": 15
                }, {
                    "category": "Customer Retention",
                    "gap_size": 8,
                    "priority": "Medium",
                    "gap_percentage": 10
                }]
            },
            "funder_analysis": {
                "funding_readiness_score":
                76,
                "recommended_round_size":
                2.5,
                "investor_matches": [{
                    "investor_name": "TechStars Ventures",
                    "sector_focus": "B2B SaaS and AI Technologies",
                    "fit_score": 85,
                    "stage_match": "Seed to Series A"
                }, {
                    "investor_name": "Accel Partners",
                    "sector_focus":
                    "Technology Infrastructure and Enterprise Software",
                    "fit_score": 78,
                    "stage_match": "Series A"
                }, {
                    "investor_name": "Bessemer Venture Partners",
                    "sector_focus": "Cloud and SaaS Companies",
                    "fit_score": 82,
                    "stage_match": "Seed to Series B"
                }]
            },
            "team_analysis": {
                "team_completeness":
                82,
                "diversity_score":
                75,
                "founders": [{
                    "name":
                    "CEO/Founder",
                    "experience_score":
                    85,
                    "track_record":
                    "Previous successful exit, 10+ years domain experience, strong leadership background"
                }, {
                    "name":
                    "CTO/Co-founder",
                    "experience_score":
                    80,
                    "track_record":
                    "Technical leadership at scale-up companies, strong engineering and architecture background"
                }, {
                    "name":
                    "VP of Sales",
                    "experience_score":
                    75,
                    "track_record":
                    "Proven sales track record in similar markets, strong customer relationships"
                }]
            },
            "processing_metadata": {
                "files_processed":
                data.get('tcaInput', {}).get('processed_files_count', 0),
                "urls_processed":
                data.get('tcaInput', {}).get('processed_urls_count', 0),
                "texts_processed":
                data.get('tcaInput', {}).get('processed_texts_count', 0),
                "analysis_timestamp":
                datetime.utcnow().isoformat(),
                "framework":
                data.get('framework', 'general')
            }
        }

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return JSONResponse(status_code=500,
                            content={"error": f"Analysis failed: {str(e)}"})


@app.post("/api/files/upload")
async def upload_files(request: Request):
    """Handle file uploads (test mode)"""
    try:
        data = await request.json()
        files = data.get('files', [])

        processed_files = []
        for file_info in files:
            processed_file = {
                "name": file_info.get('name', 'unknown.pdf'),
                "size": file_info.get('size', 0),
                "type": file_info.get('type', 'application/pdf'),
                "extracted_data": {
                    "text_content":
                    f"[Simulated] Extracted content from {file_info.get('name', 'file')}: Business plan highlights include market analysis, financial projections, and competitive positioning.",
                    "financial_data": {
                        "revenue":
                        750000 if 'financial' in file_info.get(
                            'name', '').lower() else 0,
                        "burn_rate":
                        65000,
                        "runway_months":
                        12,
                        "cash_position":
                        800000
                    },
                    "key_metrics": {
                        "team_size": 12,
                        "customers": 67,
                        "mrr": 45000,
                        "growth_rate": 15
                    },
                    "business_highlights": [
                        "Strong product-market fit demonstrated",
                        "Experienced founding team with domain expertise",
                        "Scalable technology platform",
                        "Clear path to profitability"
                    ]
                },
                "processing_status": "completed",
                "confidence_score": 0.92
            }
            processed_files.append(processed_file)

        logger.info(f"Processed {len(processed_files)} files")
        return {
            "status": "success",
            "files_processed": len(processed_files),
            "processed_files": processed_files
        }

    except Exception as e:
        logger.error(f"File upload error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"File processing failed: {str(e)}"})


@app.post("/api/urls/fetch")
async def fetch_url_data(request: Request):
    """Fetch data from URLs (test mode)"""
    try:
        data = await request.json()
        urls = data.get('urls', [])

        processed_urls = []
        for url in urls:
            processed_url = {
                "url": url,
                "title":
                f"[Simulated] Content from {url.split('//')[-1] if '//' in url else url}",
                "extracted_data": {
                    "text_content":
                    f"[Simulated] Web content extracted from {url}: Industry insights, market trends, and competitive analysis data.",
                    "metadata": {
                        "domain": url.split('/')[2] if '://' in url else url,
                        "content_type": "text/html",
                        "word_count": 1850,
                        "relevance_score": 0.88
                    },
                    "key_insights": [
                        "Market shows strong growth potential",
                        "Technology adoption accelerating",
                        "Competitive landscape favorable",
                        "Regulatory environment stable"
                    ]
                },
                "processing_status": "completed",
                "fetch_timestamp": datetime.utcnow().isoformat()
            }
            processed_urls.append(processed_url)

        logger.info(f"Processed {len(processed_urls)} URLs")
        return {
            "status": "success",
            "urls_processed": len(processed_urls),
            "processed_urls": processed_urls
        }

    except Exception as e:
        logger.error(f"URL fetch error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"URL processing failed: {str(e)}"})


if __name__ == "__main__":
    print("🚀 Starting TCA Backend (Test Mode)...")
    print("📡 Backend will be available at: http://localhost:8001")
    print("📋 API docs available at: http://localhost:8001/docs")
    print("⚡ This is a test mode backend without database dependencies")

    uvicorn.run(
        "simple_backend:app",
        host="0.0.0.0",
        port=8001,
        reload=False,  # Disable reload for stability
        log_level="info")
