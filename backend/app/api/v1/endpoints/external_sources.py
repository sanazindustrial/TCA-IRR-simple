"""
External Sources Management API
Provides endpoints for testing, monitoring, and managing external data sources
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from functools import lru_cache
import httpx
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from enum import Enum

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# Models
# ============================================================================

class SourceCategory(str, Enum):
    COMPANY_INTELLIGENCE = "Company Intelligence"
    TECHNOLOGY_SOURCES = "Technology Sources"
    AI_ML_SOURCES = "AI & ML Sources"
    FINANCIAL_DATA = "Financial Data"
    ECONOMIC_DATA = "Economic Data"
    CLINICAL_TRIALS = "Clinical Trial Databases"
    DRUG_REGULATORY = "Drug & Regulatory"
    RESEARCH_MEDICAL = "Research & Medical"
    PROFESSIONAL_NETWORKS = "Professional Networks"
    SOCIAL_MEDIA = "Social Media & Sentiment"
    INTELLECTUAL_PROPERTY = "Intellectual Property"
    VC_INVESTMENT = "VC & Investment"
    NEWS_MEDIA = "News & Media"


class SourcePricing(str, Enum):
    FREE = "Free"
    FREEMIUM = "Freemium"
    PREMIUM = "Premium"
    ENTERPRISE = "Enterprise"


class AuthType(str, Enum):
    NONE = "none"
    API_KEY = "api_key"
    OAUTH = "oauth"
    BEARER = "bearer"
    BASIC = "basic"


class TCAModule(str, Enum):
    COMPANY_ANALYSIS = "Company Analysis"
    TECHNOLOGY_SCORE = "Technology Score"
    FINANCIAL_SCORE = "Financial Score"
    MARKET_TRENDS = "Market Trends"
    REGULATORY_RISK = "Regulatory Risk"
    IP_STRENGTH = "IP Strength"
    SENTIMENT_ANALYSIS = "Sentiment Analysis"


class SourceHealth(BaseModel):
    source_id: str
    status: str  # healthy, degraded, unhealthy, unknown
    latency_ms: Optional[float] = None
    last_check: datetime
    error_message: Optional[str] = None
    success_rate: float = 100.0


class SourceTestResult(BaseModel):
    source_id: str
    name: str
    success: bool
    status_code: Optional[int] = None
    latency_ms: float
    error: Optional[str] = None
    timestamp: datetime
    sample_data: Optional[Dict] = None


class ExternalSourceConfig(BaseModel):
    id: str
    name: str
    description: str
    category: SourceCategory
    pricing: SourcePricing
    cost: str
    api_endpoint: Optional[str] = None
    test_endpoint: Optional[str] = None
    auth_type: AuthType = AuthType.NONE
    rate_limit: str = "Unknown"
    documentation_url: Optional[str] = None
    get_key_url: Optional[str] = None
    signup_url: Optional[str] = None
    requires_auth: bool = False
    free_tier_available: bool = False
    tca_modules: List[TCAModule] = []
    features: List[str] = []
    headers: Dict[str, str] = {}
    timeout: int = 10


class SourceCostRecord(BaseModel):
    source_id: str
    date: datetime
    api_calls: int
    estimated_cost: float
    plan_type: str


class NormalizedCompanyData(BaseModel):
    """Normalized schema for company data across all sources"""
    source_id: str
    company_name: Optional[str] = None
    description: Optional[str] = None
    funding_total: Optional[float] = None
    employee_count: Optional[int] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    social_links: Dict[str, str] = {}
    funding_rounds: List[Dict] = []
    competitors: List[str] = []
    technologies: List[str] = []
    raw_data: Dict = {}
    confidence_score: float = 0.0
    fetched_at: datetime


# ============================================================================
# External Sources Registry - All 41 Sources with Get Key URLs
# ============================================================================

EXTERNAL_SOURCES: Dict[str, ExternalSourceConfig] = {
    # =========== COMPANY INTELLIGENCE (5 sources) ===========
    "crunchbase": ExternalSourceConfig(
        id="crunchbase",
        name="Crunchbase",
        description="Startup database with company information, funding, and market data",
        category=SourceCategory.COMPANY_INTELLIGENCE,
        pricing=SourcePricing.FREEMIUM,
        cost="$29/mo",
        api_endpoint="https://api.crunchbase.com/api/v4",
        test_endpoint="https://api.crunchbase.com/api/v4/autocompletes?query=microsoft",
        auth_type=AuthType.API_KEY,
        rate_limit="200 requests/min",
        documentation_url="https://data.crunchbase.com/docs/using-the-api",
        get_key_url="https://data.crunchbase.com/docs/using-the-api",
        signup_url="https://www.crunchbase.com/register",
        requires_auth=True,
        free_tier_available=False,
        tca_modules=[TCAModule.COMPANY_ANALYSIS, TCAModule.FINANCIAL_SCORE],
        features=["Company profiles", "Funding rounds", "Investor data", "Market analytics"],
        headers={"X-cb-user-key": "{api_key}"}
    ),
    "pitchbook": ExternalSourceConfig(
        id="pitchbook",
        name="PitchBook",
        description="Private market data and intelligence platform",
        category=SourceCategory.COMPANY_INTELLIGENCE,
        pricing=SourcePricing.ENTERPRISE,
        cost="$400/mo",
        api_endpoint="https://api.pitchbook.com/v1",
        auth_type=AuthType.BEARER,
        rate_limit="Contact Sales",
        documentation_url="https://pitchbook.com/data",
        get_key_url="https://pitchbook.com/request-a-free-trial",
        signup_url="https://pitchbook.com/request-a-free-trial",
        requires_auth=True,
        free_tier_available=False,
        tca_modules=[TCAModule.COMPANY_ANALYSIS, TCAModule.FINANCIAL_SCORE],
        features=["Private market data", "Valuations", "Deal sourcing", "Fund performance"]
    ),
    "cb-insights": ExternalSourceConfig(
        id="cb-insights",
        name="CB Insights",
        description="Market intelligence platform for emerging technology trends",
        category=SourceCategory.COMPANY_INTELLIGENCE,
        pricing=SourcePricing.PREMIUM,
        cost="$99/mo",
        api_endpoint="https://api.cbinsights.com/v1",
        auth_type=AuthType.API_KEY,
        rate_limit="Contact Sales",
        documentation_url="https://www.cbinsights.com/research/",
        get_key_url="https://www.cbinsights.com/research-request-a-demo",
        signup_url="https://www.cbinsights.com/research/",
        requires_auth=True,
        free_tier_available=False,
        tca_modules=[TCAModule.COMPANY_ANALYSIS, TCAModule.MARKET_TRENDS],
        features=["Market maps", "Trend analysis", "Company scoring", "Patent analytics"]
    ),
    "owler": ExternalSourceConfig(
        id="owler",
        name="Owler",
        description="Competitive intelligence and business insights",
        category=SourceCategory.COMPANY_INTELLIGENCE,
        pricing=SourcePricing.FREEMIUM,
        cost="$35/mo",
        api_endpoint="https://api.owler.com/v1",
        auth_type=AuthType.API_KEY,
        rate_limit="100 requests/day",
        documentation_url="https://corp.owler.com/",
        get_key_url="https://corp.owler.com/our-data",
        signup_url="https://www.owler.com/signup",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.COMPANY_ANALYSIS],
        features=["Company news", "Competitive alerts", "Revenue estimates", "Employee counts"]
    ),
    "similarweb": ExternalSourceConfig(
        id="similarweb",
        name="SimilarWeb",
        description="Website analytics and digital market intelligence",
        category=SourceCategory.COMPANY_INTELLIGENCE,
        pricing=SourcePricing.FREEMIUM,
        cost="$199/mo",
        api_endpoint="https://api.similarweb.com/v1",
        test_endpoint="https://api.similarweb.com/v1/website/google.com/total-traffic-and-engagement/visits",
        auth_type=AuthType.API_KEY,
        rate_limit="Contact Sales",
        documentation_url="https://support.similarweb.com/",
        get_key_url="https://account.similarweb.com/#/api-management",
        signup_url="https://www.similarweb.com/corp/pricing/",
        requires_auth=True,
        free_tier_available=False,
        tca_modules=[TCAModule.COMPANY_ANALYSIS, TCAModule.MARKET_TRENDS],
        features=["Website traffic", "Audience analysis", "App intelligence", "Market share"]
    ),

    # =========== TECHNOLOGY SOURCES (7 sources) ===========
    "github": ExternalSourceConfig(
        id="github",
        name="GitHub",
        description="Code repositories and developer collaboration platform",
        category=SourceCategory.TECHNOLOGY_SOURCES,
        pricing=SourcePricing.FREEMIUM,
        cost="Free (5000 req/hr)",
        api_endpoint="https://api.github.com",
        test_endpoint="https://api.github.com/rate_limit",
        auth_type=AuthType.BEARER,
        rate_limit="5000 requests/hr (authenticated), 60/hr (unauthenticated)",
        documentation_url="https://docs.github.com/en/rest",
        get_key_url="https://github.com/settings/tokens",
        signup_url="https://github.com/signup",
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.TECHNOLOGY_SCORE],
        features=["Code analysis", "Developer activity", "Project popularity", "Technology stack"],
        headers={"Authorization": "token {api_key}", "Accept": "application/vnd.github.v3+json"}
    ),
    "stackoverflow": ExternalSourceConfig(
        id="stackoverflow",
        name="Stack Overflow",
        description="Developer community and knowledge platform",
        category=SourceCategory.TECHNOLOGY_SOURCES,
        pricing=SourcePricing.FREEMIUM,
        cost="Free (300 req/day)",
        api_endpoint="https://api.stackexchange.com/2.3",
        test_endpoint="https://api.stackexchange.com/2.3/info?site=stackoverflow",
        auth_type=AuthType.API_KEY,
        rate_limit="300 requests/day (free), 10000/day (with key)",
        documentation_url="https://api.stackexchange.com/docs",
        get_key_url="https://stackapps.com/apps/oauth/register",
        signup_url="https://stackoverflow.com/users/signup",
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.TECHNOLOGY_SCORE],
        features=["Developer insights", "Technology trends", "Skill assessment", "Community engagement"]
    ),
    "hackernews": ExternalSourceConfig(
        id="hackernews",
        name="Hacker News",
        description="Tech community discussions and news",
        category=SourceCategory.TECHNOLOGY_SOURCES,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://hacker-news.firebaseio.com/v0",
        test_endpoint="https://hacker-news.firebaseio.com/v0/topstories.json",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://github.com/HackerNews/API",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.SENTIMENT_ANALYSIS, TCAModule.MARKET_TRENDS],
        features=["Tech discussions", "Industry news", "Community sentiment", "Trend identification"]
    ),
    "producthunt": ExternalSourceConfig(
        id="producthunt",
        name="Product Hunt",
        description="Product discovery and launch platform",
        category=SourceCategory.TECHNOLOGY_SOURCES,
        pricing=SourcePricing.FREEMIUM,
        cost="Free",
        api_endpoint="https://api.producthunt.com/v2/api/graphql",
        auth_type=AuthType.BEARER,
        rate_limit="500 requests/hour",
        documentation_url="https://api.producthunt.com/v2/docs",
        get_key_url="https://www.producthunt.com/v2/oauth/applications",
        signup_url="https://www.producthunt.com/",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.TECHNOLOGY_SCORE, TCAModule.MARKET_TRENDS],
        features=["Product launches", "User feedback", "Innovation tracking", "Maker community"]
    ),
    "google-trends": ExternalSourceConfig(
        id="google-trends",
        name="Google Trends",
        description="Search trend analysis and market insights",
        category=SourceCategory.TECHNOLOGY_SOURCES,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://trends.google.com/trends/api",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited (unofficial)",
        documentation_url="https://support.google.com/trends",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.MARKET_TRENDS, TCAModule.SENTIMENT_ANALYSIS],
        features=["Search trends", "Geographic data", "Related queries", "Market interest"]
    ),
    "wayback-machine": ExternalSourceConfig(
        id="wayback-machine",
        name="Wayback Machine",
        description="Historical website analysis",
        category=SourceCategory.TECHNOLOGY_SOURCES,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://archive.org/wayback",
        test_endpoint="https://archive.org/wayback/available?url=google.com",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://archive.org/help/wayback_api.php",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.COMPANY_ANALYSIS],
        features=["Website history", "Content evolution", "Historical analysis", "Digital archaeology"]
    ),
    "techcrunch": ExternalSourceConfig(
        id="techcrunch",
        name="TechCrunch",
        description="Technology news and startup coverage",
        category=SourceCategory.TECHNOLOGY_SOURCES,
        pricing=SourcePricing.FREE,
        cost="Free (RSS)",
        api_endpoint="https://techcrunch.com/feed/",
        test_endpoint="https://techcrunch.com/feed/",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited (RSS)",
        documentation_url="https://techcrunch.com/",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.MARKET_TRENDS],
        features=["Tech news", "Startup coverage", "Industry analysis", "Event information"]
    ),

    # =========== AI & ML SOURCES (2 sources) ===========
    "huggingface": ExternalSourceConfig(
        id="huggingface",
        name="Hugging Face",
        description="AI models, datasets, and machine learning platform",
        category=SourceCategory.AI_ML_SOURCES,
        pricing=SourcePricing.FREEMIUM,
        cost="Free (rate limited)",
        api_endpoint="https://huggingface.co/api",
        test_endpoint="https://huggingface.co/api/models?limit=1",
        auth_type=AuthType.BEARER,
        rate_limit="30 requests/min (free)",
        documentation_url="https://huggingface.co/docs/api-inference",
        get_key_url="https://huggingface.co/settings/tokens",
        signup_url="https://huggingface.co/join",
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.TECHNOLOGY_SCORE],
        features=["AI model repository", "Dataset access", "Model performance", "ML community"],
        headers={"Authorization": "Bearer {api_key}"}
    ),
    "paperswithcode": ExternalSourceConfig(
        id="paperswithcode",
        name="Papers With Code",
        description="Machine learning research papers with code implementation",
        category=SourceCategory.AI_ML_SOURCES,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://paperswithcode.com/api/v1",
        test_endpoint="https://paperswithcode.com/api/v1/papers/?items_per_page=1",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://paperswithcode.com/api/v1/docs/",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.TECHNOLOGY_SCORE],
        features=["Research papers", "Code implementations", "Benchmarks", "State-of-the-art tracking"]
    ),

    # =========== FINANCIAL DATA (3 sources) ===========
    "sec-edgar": ExternalSourceConfig(
        id="sec-edgar",
        name="SEC EDGAR Database",
        description="US Securities and Exchange Commission filings",
        category=SourceCategory.FINANCIAL_DATA,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://data.sec.gov",
        test_endpoint="https://data.sec.gov/submissions/CIK0000320193.json",  # Apple
        auth_type=AuthType.NONE,
        rate_limit="10 requests/second",
        documentation_url="https://www.sec.gov/os/accessing-edgar-data",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.FINANCIAL_SCORE, TCAModule.REGULATORY_RISK],
        features=["SEC filings", "Financial statements", "Regulatory documents", "Corporate actions"],
        headers={"User-Agent": "TCA-IRR-App contact@example.com"}
    ),
    "yahoo-finance": ExternalSourceConfig(
        id="yahoo-finance",
        name="Yahoo Finance",
        description="Financial market data and analysis",
        category=SourceCategory.FINANCIAL_DATA,
        pricing=SourcePricing.FREEMIUM,
        cost="$15/mo (via RapidAPI)",
        api_endpoint="https://yahoo-finance1.p.rapidapi.com",
        auth_type=AuthType.API_KEY,
        rate_limit="500 requests/month (free)",
        documentation_url="https://rapidapi.com/apidojo/api/yahoo-finance1",
        get_key_url="https://rapidapi.com/apidojo/api/yahoo-finance1/pricing",
        signup_url="https://rapidapi.com/signup",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.FINANCIAL_SCORE],
        features=["Stock prices", "Financial news", "Market data", "Company financials"],
        headers={"X-RapidAPI-Key": "{api_key}", "X-RapidAPI-Host": "yahoo-finance1.p.rapidapi.com"}
    ),
    "alpha-vantage": ExternalSourceConfig(
        id="alpha-vantage",
        name="Alpha Vantage",
        description="Real-time and historical financial market data API",
        category=SourceCategory.FINANCIAL_DATA,
        pricing=SourcePricing.FREEMIUM,
        cost="Free (25 req/day)",
        api_endpoint="https://www.alphavantage.co/query",
        test_endpoint="https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo",
        auth_type=AuthType.API_KEY,
        rate_limit="25 requests/day (free), 500/day ($49.99/mo)",
        documentation_url="https://www.alphavantage.co/documentation/",
        get_key_url="https://www.alphavantage.co/support/#api-key",
        signup_url="https://www.alphavantage.co/support/#api-key",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.FINANCIAL_SCORE],
        features=["Real-time data", "Technical indicators", "Fundamental data", "Economic indicators"]
    ),

    # =========== ECONOMIC DATA (4 sources) ===========
    "fred": ExternalSourceConfig(
        id="fred",
        name="Federal Reserve Economic Data (FRED)",
        description="US economic time series data from Federal Reserve",
        category=SourceCategory.ECONOMIC_DATA,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://api.stlouisfed.org/fred",
        test_endpoint="https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=DEMO_KEY&file_type=json",
        auth_type=AuthType.API_KEY,
        rate_limit="Unlimited",
        documentation_url="https://fred.stlouisfed.org/docs/api/fred/",
        get_key_url="https://fred.stlouisfed.org/docs/api/api_key.html",
        signup_url="https://fredaccount.stlouisfed.org/login/secure/",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.MARKET_TRENDS, TCAModule.FINANCIAL_SCORE],
        features=["Economic indicators", "Historical data", "Forecasts", "Regional data"]
    ),
    "world-bank": ExternalSourceConfig(
        id="world-bank",
        name="World Bank Open Data",
        description="Global development and economic indicators",
        category=SourceCategory.ECONOMIC_DATA,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://api.worldbank.org/v2",
        test_endpoint="https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.CD?format=json",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.MARKET_TRENDS],
        features=["Global indicators", "Country data", "Development metrics", "Statistical data"]
    ),
    "bea": ExternalSourceConfig(
        id="bea",
        name="Bureau of Economic Analysis (BEA)",
        description="GDP and economic statistics",
        category=SourceCategory.ECONOMIC_DATA,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://apps.bea.gov/api/data",
        auth_type=AuthType.API_KEY,
        rate_limit="100 requests/minute",
        documentation_url="https://apps.bea.gov/api/_pdf/bea-web-service-api-user-guide.pdf",
        get_key_url="https://apps.bea.gov/API/signup/",
        signup_url="https://apps.bea.gov/API/signup/",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.MARKET_TRENDS, TCAModule.FINANCIAL_SCORE],
        features=["GDP data", "Economic accounts", "Regional data", "Industry statistics"]
    ),
    "bls": ExternalSourceConfig(
        id="bls",
        name="Bureau of Labor Statistics (BLS)",
        description="Employment and wage data",
        category=SourceCategory.ECONOMIC_DATA,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://api.bls.gov/publicAPI/v2",
        test_endpoint="https://api.bls.gov/publicAPI/v2/timeseries/data/",
        auth_type=AuthType.API_KEY,
        rate_limit="500 requests/day (with key)",
        documentation_url="https://www.bls.gov/developers/api_signature_v2.htm",
        get_key_url="https://data.bls.gov/registrationEngine/",
        signup_url="https://data.bls.gov/registrationEngine/",
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.MARKET_TRENDS],
        features=["Employment data", "Wage statistics", "Labor trends", "Industry employment"]
    ),

    # =========== CLINICAL TRIAL DATABASES (3 sources) ===========
    "clinicaltrials-gov": ExternalSourceConfig(
        id="clinicaltrials-gov",
        name="ClinicalTrials.gov",
        description="US clinical trials database",
        category=SourceCategory.CLINICAL_TRIALS,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://clinicaltrials.gov/api/v2",
        test_endpoint="https://clinicaltrials.gov/api/v2/studies?pageSize=1",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://clinicaltrials.gov/data-api/api",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.REGULATORY_RISK],
        features=["Clinical trials", "Study protocols", "Results data", "Regulatory information"]
    ),
    "eu-clinical-trials": ExternalSourceConfig(
        id="eu-clinical-trials",
        name="EU Clinical Trials Register",
        description="European clinical trials database",
        category=SourceCategory.CLINICAL_TRIALS,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://www.clinicaltrialsregister.eu",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://www.clinicaltrialsregister.eu/",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.REGULATORY_RISK],
        features=["European trials", "Study protocols", "Regulatory data", "Trial results"]
    ),
    "who-ictrp": ExternalSourceConfig(
        id="who-ictrp",
        name="WHO ICTRP",
        description="Global clinical trial registry platform",
        category=SourceCategory.CLINICAL_TRIALS,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://trialsearch.who.int",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://www.who.int/clinical-trials-registry-platform",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.REGULATORY_RISK],
        features=["Global trials", "Registry network", "Trial transparency", "Public health data"]
    ),

    # =========== DRUG & REGULATORY (3 sources) ===========
    "fda-orange-book": ExternalSourceConfig(
        id="fda-orange-book",
        name="FDA Orange Book",
        description="FDA approved drug products database",
        category=SourceCategory.DRUG_REGULATORY,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://www.fda.gov/drugs/drug-approvals-and-databases/about-orange-book",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.REGULATORY_RISK, TCAModule.IP_STRENGTH],
        features=["Approved drugs", "Patent information", "Generic equivalents", "Regulatory status"]
    ),
    "fda-purple-book": ExternalSourceConfig(
        id="fda-purple-book",
        name="FDA Purple Book",
        description="FDA biological products database",
        category=SourceCategory.DRUG_REGULATORY,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://purplebooksearch.fda.gov/api/v1",
        test_endpoint="https://purplebooksearch.fda.gov/api/v1/products",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://purplebooksearch.fda.gov/",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.REGULATORY_RISK],
        features=["Biological products", "Biosimilars", "Licensing info", "Patent data"]
    ),
    "ema-clinical": ExternalSourceConfig(
        id="ema-clinical",
        name="EMA Clinical Data",
        description="European Medicines Agency clinical data",
        category=SourceCategory.DRUG_REGULATORY,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://clinicaldata.ema.europa.eu",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://clinicaldata.ema.europa.eu/",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.REGULATORY_RISK],
        features=["European approvals", "Clinical data", "Safety information", "Regulatory decisions"]
    ),

    # =========== RESEARCH & MEDICAL (1 source) ===========
    "pubmed": ExternalSourceConfig(
        id="pubmed",
        name="PubMed",
        description="Biomedical literature database",
        category=SourceCategory.RESEARCH_MEDICAL,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
        test_endpoint="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?retmode=json",
        auth_type=AuthType.API_KEY,
        rate_limit="3 req/sec (free), 10 req/sec (with key)",
        documentation_url="https://www.ncbi.nlm.nih.gov/books/NBK25501/",
        get_key_url="https://www.ncbi.nlm.nih.gov/account/settings/",
        signup_url="https://www.ncbi.nlm.nih.gov/account/",
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.TECHNOLOGY_SCORE, TCAModule.REGULATORY_RISK],
        features=["Medical literature", "Research papers", "Clinical studies", "Biomedical data"]
    ),

    # =========== PROFESSIONAL NETWORKS (2 sources) ===========
    "linkedin": ExternalSourceConfig(
        id="linkedin",
        name="LinkedIn",
        description="Professional network and talent insights",
        category=SourceCategory.PROFESSIONAL_NETWORKS,
        pricing=SourcePricing.FREEMIUM,
        cost="$30/mo (Sales Navigator)",
        api_endpoint="https://api.linkedin.com/v2",
        auth_type=AuthType.OAUTH,
        rate_limit="Varies by endpoint",
        documentation_url="https://developer.linkedin.com/docs",
        get_key_url="https://www.linkedin.com/developers/apps",
        signup_url="https://www.linkedin.com/developers/",
        requires_auth=True,
        free_tier_available=False,
        tca_modules=[TCAModule.COMPANY_ANALYSIS],
        features=["Professional profiles", "Company insights", "Talent analytics", "Network analysis"]
    ),
    "angellist": ExternalSourceConfig(
        id="angellist",
        name="AngelList (Wellfound)",
        description="Startup jobs and investment platform",
        category=SourceCategory.PROFESSIONAL_NETWORKS,
        pricing=SourcePricing.FREEMIUM,
        cost="Free (limited)",
        api_endpoint="https://api.angel.co/1",
        auth_type=AuthType.OAUTH,
        rate_limit="1000 requests/hour",
        documentation_url="https://angel.co/api",
        get_key_url="https://angel.co/api/oauth/clients",
        signup_url="https://wellfound.com/",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.COMPANY_ANALYSIS],
        features=["Startup profiles", "Job postings", "Investor connections", "Salary data"]
    ),

    # =========== SOCIAL MEDIA & SENTIMENT (2 sources) ===========
    "reddit": ExternalSourceConfig(
        id="reddit",
        name="Reddit API",
        description="Community discussions and sentiment analysis",
        category=SourceCategory.SOCIAL_MEDIA,
        pricing=SourcePricing.FREEMIUM,
        cost="Free (100 req/min)",
        api_endpoint="https://oauth.reddit.com",
        auth_type=AuthType.OAUTH,
        rate_limit="100 requests/min",
        documentation_url="https://www.reddit.com/dev/api/",
        get_key_url="https://www.reddit.com/prefs/apps",
        signup_url="https://www.reddit.com/register/",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.SENTIMENT_ANALYSIS, TCAModule.MARKET_TRENDS],
        features=["Community discussions", "Sentiment analysis", "Trend tracking", "User engagement"]
    ),
    "twitter": ExternalSourceConfig(
        id="twitter",
        name="Twitter (X) API",
        description="Social sentiment and real-time discussions",
        category=SourceCategory.SOCIAL_MEDIA,
        pricing=SourcePricing.FREEMIUM,
        cost="$100/mo (Basic)",
        api_endpoint="https://api.twitter.com/2",
        auth_type=AuthType.BEARER,
        rate_limit="50 requests/15min (free)",
        documentation_url="https://developer.twitter.com/en/docs",
        get_key_url="https://developer.twitter.com/en/portal/dashboard",
        signup_url="https://developer.twitter.com/en/portal/petition/essential/basic-info",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.SENTIMENT_ANALYSIS],
        features=["Social sentiment", "Real-time trends", "Influencer tracking", "Brand monitoring"]
    ),

    # =========== INTELLECTUAL PROPERTY (3 sources) ===========
    "uspto": ExternalSourceConfig(
        id="uspto",
        name="USPTO Patent Database",
        description="US patents and trademark database",
        category=SourceCategory.INTELLECTUAL_PROPERTY,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://developer.uspto.gov/ibd-api",
        test_endpoint="https://developer.uspto.gov/ibd-api/v1/patent/application?searchText=AI&rows=1",
        auth_type=AuthType.NONE,
        rate_limit="5 requests/second",
        documentation_url="https://developer.uspto.gov/api-catalog",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.IP_STRENGTH],
        features=["Patent search", "Trademark data", "IP analytics", "Filing status"]
    ),
    "google-patents": ExternalSourceConfig(
        id="google-patents",
        name="Google Patents",
        description="Global patent search and analysis",
        category=SourceCategory.INTELLECTUAL_PROPERTY,
        pricing=SourcePricing.FREE,
        cost="Free (BigQuery)",
        api_endpoint="https://patents.google.com",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited (web)",
        documentation_url="https://cloud.google.com/blog/topics/public-datasets/google-patents-public-datasets-connecting-public-paid-and-private-patent-data",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.IP_STRENGTH],
        features=["Global patents", "Patent families", "Citation analysis", "Prior art search"]
    ),
    "wipo": ExternalSourceConfig(
        id="wipo",
        name="WIPO Global Brand Database",
        description="International trademarks and designs",
        category=SourceCategory.INTELLECTUAL_PROPERTY,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://branddb.wipo.int",
        test_endpoint="https://branddb.wipo.int/branddb/en/",
        auth_type=AuthType.NONE,
        rate_limit="Unlimited",
        documentation_url="https://www.wipo.int/branddb/en/",
        get_key_url=None,
        signup_url=None,
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.IP_STRENGTH],
        features=["International trademarks", "Design patents", "Madrid system", "Brand protection"]
    ),

    # =========== VC & INVESTMENT (2 sources) ===========
    "angellist-venture": ExternalSourceConfig(
        id="angellist-venture",
        name="AngelList Venture",
        description="Startup investor matching platform",
        category=SourceCategory.VC_INVESTMENT,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://venture.angellist.com",
        auth_type=AuthType.OAUTH,
        rate_limit="Varies",
        documentation_url="https://venture.angellist.com/",
        get_key_url="https://venture.angellist.com/",
        signup_url="https://venture.angellist.com/",
        requires_auth=True,
        free_tier_available=True,
        tca_modules=[TCAModule.COMPANY_ANALYSIS, TCAModule.FINANCIAL_SCORE],
        features=["Investor matching", "Startup profiles", "Funding data", "Network access"]
    ),
    "gust": ExternalSourceConfig(
        id="gust",
        name="Gust",
        description="Angel investor platform",
        category=SourceCategory.VC_INVESTMENT,
        pricing=SourcePricing.FREE,
        cost="Free",
        api_endpoint="https://gust.com",
        auth_type=AuthType.NONE,
        rate_limit="N/A (Web)",
        documentation_url="https://gust.com/",
        get_key_url=None,
        signup_url="https://gust.com/users/sign_up",
        requires_auth=False,
        free_tier_available=True,
        tca_modules=[TCAModule.COMPANY_ANALYSIS],
        features=["Angel networks", "Deal flow", "Due diligence", "Investor matching"]
    ),

    # =========== NEWS & MEDIA (2 sources) ===========
    "reuters": ExternalSourceConfig(
        id="reuters",
        name="Reuters",
        description="Global news and financial information",
        category=SourceCategory.NEWS_MEDIA,
        pricing=SourcePricing.PREMIUM,
        cost="$40/mo (via LSEG)",
        api_endpoint="https://www.reuters.com/",
        auth_type=AuthType.API_KEY,
        rate_limit="Contact Sales",
        documentation_url="https://www.lseg.com/en/data-analytics",
        get_key_url="https://www.lseg.com/en/data-analytics",
        signup_url="https://www.lseg.com/en/data-analytics",
        requires_auth=True,
        free_tier_available=False,
        tca_modules=[TCAModule.MARKET_TRENDS, TCAModule.SENTIMENT_ANALYSIS],
        features=["Global news", "Financial data", "Market analysis", "Breaking news"]
    ),
    "wsj": ExternalSourceConfig(
        id="wsj",
        name="Wall Street Journal",
        description="Business news and market analysis",
        category=SourceCategory.NEWS_MEDIA,
        pricing=SourcePricing.PREMIUM,
        cost="$39/mo",
        api_endpoint="https://www.wsj.com/",
        auth_type=AuthType.NONE,
        rate_limit="N/A (Web)",
        documentation_url="https://www.wsj.com/",
        get_key_url=None,
        signup_url="https://subscribe.wsj.com/",
        requires_auth=True,
        free_tier_available=False,
        tca_modules=[TCAModule.MARKET_TRENDS],
        features=["Business news", "Market analysis", "Industry insights", "Economic reporting"]
    ),
}


# ============================================================================
# In-Memory Storage for Health & Cost Tracking
# ============================================================================

_source_health: Dict[str, SourceHealth] = {}
_source_costs: Dict[str, List[SourceCostRecord]] = {}
_api_keys: Dict[str, str] = {}  # In production, use Azure Key Vault


# ============================================================================
# Helper Functions
# ============================================================================

async def test_source_connection(source: ExternalSourceConfig, api_key: Optional[str] = None) -> SourceTestResult:
    """Test connection to an external source"""
    start_time = time.time()
    
    try:
        test_url = source.test_endpoint or source.api_endpoint
        if not test_url:
            return SourceTestResult(
                source_id=source.id,
                name=source.name,
                success=False,
                latency_ms=0,
                error="No test endpoint configured",
                timestamp=datetime.utcnow()
            )
        
        headers = dict(source.headers)
        if api_key and "{api_key}" in str(headers):
            headers = {k: v.replace("{api_key}", api_key) for k, v in headers.items()}
        
        async with httpx.AsyncClient(timeout=source.timeout) as client:
            response = await client.get(test_url, headers=headers)
            latency = (time.time() - start_time) * 1000
            
            sample_data = None
            if response.status_code == 200:
                try:
                    sample_data = response.json()
                    # Truncate large responses
                    if isinstance(sample_data, dict) and len(str(sample_data)) > 1000:
                        sample_data = {"preview": "Data received successfully", "size": len(str(sample_data))}
                except:
                    sample_data = {"preview": response.text[:200] if response.text else "Empty response"}
            
            return SourceTestResult(
                source_id=source.id,
                name=source.name,
                success=response.status_code < 400,
                status_code=response.status_code,
                latency_ms=round(latency, 2),
                timestamp=datetime.utcnow(),
                sample_data=sample_data
            )
    
    except httpx.TimeoutException:
        return SourceTestResult(
            source_id=source.id,
            name=source.name,
            success=False,
            latency_ms=(time.time() - start_time) * 1000,
            error="Connection timeout",
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        return SourceTestResult(
            source_id=source.id,
            name=source.name,
            success=False,
            latency_ms=(time.time() - start_time) * 1000,
            error=str(e),
            timestamp=datetime.utcnow()
        )


def normalize_company_data(source_id: str, raw_data: Dict) -> NormalizedCompanyData:
    """Normalize company data from different sources into a common schema"""
    
    normalizers = {
        "crunchbase": lambda d: {
            "company_name": d.get("properties", {}).get("name"),
            "description": d.get("properties", {}).get("short_description"),
            "funding_total": d.get("properties", {}).get("total_funding_usd"),
            "employee_count": d.get("properties", {}).get("num_employees_enum"),
            "founded_year": d.get("properties", {}).get("founded_on", "").split("-")[0] if d.get("properties", {}).get("founded_on") else None,
            "headquarters": f"{d.get('properties', {}).get('city', '')}, {d.get('properties', {}).get('country', '')}",
            "website": d.get("properties", {}).get("homepage_url"),
        },
        "github": lambda d: {
            "company_name": d.get("name") or d.get("login"),
            "description": d.get("bio") or d.get("description"),
            "website": d.get("blog") or d.get("html_url"),
            "technologies": [d.get("language")] if d.get("language") else [],
        },
        "sec-edgar": lambda d: {
            "company_name": d.get("name"),
            "headquarters": d.get("addresses", {}).get("business", {}).get("city"),
        },
    }
    
    normalizer = normalizers.get(source_id, lambda d: {})
    normalized = normalizer(raw_data)
    
    return NormalizedCompanyData(
        source_id=source_id,
        **{k: v for k, v in normalized.items() if v},
        raw_data=raw_data,
        confidence_score=0.8 if normalized else 0.3,
        fetched_at=datetime.utcnow()
    )


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/sources", response_model=List[ExternalSourceConfig])
async def list_all_sources(
    category: Optional[SourceCategory] = None,
    pricing: Optional[SourcePricing] = None,
    free_only: bool = False,
    tca_module: Optional[TCAModule] = None
):
    """List all external sources with optional filtering"""
    sources = list(EXTERNAL_SOURCES.values())
    
    if category:
        sources = [s for s in sources if s.category == category]
    if pricing:
        sources = [s for s in sources if s.pricing == pricing]
    if free_only:
        sources = [s for s in sources if s.free_tier_available]
    if tca_module:
        sources = [s for s in sources if tca_module in s.tca_modules]
    
    return sources


@router.get("/sources/{source_id}", response_model=ExternalSourceConfig)
async def get_source(source_id: str):
    """Get details for a specific source"""
    if source_id not in EXTERNAL_SOURCES:
        raise HTTPException(status_code=404, detail=f"Source {source_id} not found")
    return EXTERNAL_SOURCES[source_id]


@router.get("/sources/{source_id}/get-key-info")
async def get_source_key_info(source_id: str):
    """Get information on how to obtain an API key for a source"""
    if source_id not in EXTERNAL_SOURCES:
        raise HTTPException(status_code=404, detail=f"Source {source_id} not found")
    
    source = EXTERNAL_SOURCES[source_id]
    
    return {
        "source_id": source.id,
        "name": source.name,
        "requires_auth": source.requires_auth,
        "auth_type": source.auth_type,
        "free_tier_available": source.free_tier_available,
        "pricing": source.pricing,
        "cost": source.cost,
        "get_key_url": source.get_key_url,
        "signup_url": source.signup_url,
        "documentation_url": source.documentation_url,
        "instructions": _get_key_instructions(source)
    }


def _get_key_instructions(source: ExternalSourceConfig) -> str:
    """Generate step-by-step instructions for getting an API key"""
    if not source.requires_auth:
        return "No API key required. This source is free to use without authentication."
    
    if source.auth_type == AuthType.NONE:
        return "No authentication needed."
    
    instructions = {
        "github": """
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "TCA-IRR Integration")
4. Select scopes: public_repo, read:user
5. Click "Generate token"
6. Copy and save the token (you won't see it again!)
""",
        "huggingface": """
1. Sign up at https://huggingface.co/join
2. Go to Settings > Access Tokens
3. Click "New token"
4. Name your token and select permissions
5. Click "Generate a token"
6. Copy the token starting with "hf_"
""",
        "alpha-vantage": """
1. Go to https://www.alphavantage.co/support/#api-key
2. Fill in your email and submit
3. You'll receive a free API key instantly
4. Free tier: 25 requests/day
""",
        "fred": """
1. Go to https://fred.stlouisfed.org/docs/api/api_key.html
2. Click "Request API Key"
3. Create an account or sign in
4. You'll receive your API key via email
""",
        "reddit": """
1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..."
3. Select "script" as the app type
4. Fill in name, redirect uri (http://localhost)
5. Note your client_id (under app name) and secret
""",
        "pubmed": """
1. Go to https://www.ncbi.nlm.nih.gov/account/
2. Create an account or sign in
3. Go to Settings > API Key Management
4. Generate a new API key
5. Key increases rate limit from 3/sec to 10/sec
""",
    }
    
    return instructions.get(source.id, f"""
1. Visit {source.signup_url or source.get_key_url or source.documentation_url}
2. Create an account if required
3. Navigate to API settings or developer portal
4. Generate a new API key
5. Enter the key in TCA-IRR Data Sources settings
""")


@router.post("/sources/{source_id}/test", response_model=SourceTestResult)
async def test_source(source_id: str, api_key: Optional[str] = None):
    """Test connection to a specific source"""
    if source_id not in EXTERNAL_SOURCES:
        raise HTTPException(status_code=404, detail=f"Source {source_id} not found")
    
    source = EXTERNAL_SOURCES[source_id]
    result = await test_source_connection(source, api_key or _api_keys.get(source_id))
    
    # Update health status
    _source_health[source_id] = SourceHealth(
        source_id=source_id,
        status="healthy" if result.success else "unhealthy",
        latency_ms=result.latency_ms,
        last_check=result.timestamp,
        error_message=result.error,
        success_rate=100.0 if result.success else 0.0
    )
    
    return result


@router.post("/sources/test-all")
async def test_all_sources(
    category: Optional[SourceCategory] = None,
    free_only: bool = True,
    background_tasks: BackgroundTasks = None
):
    """Test all sources (or filtered subset) - runs tests in parallel"""
    sources = list(EXTERNAL_SOURCES.values())
    
    if category:
        sources = [s for s in sources if s.category == category]
    if free_only:
        sources = [s for s in sources if s.free_tier_available and s.test_endpoint]
    
    # Only test sources with test endpoints
    testable_sources = [s for s in sources if s.test_endpoint]
    
    # Run tests in parallel
    tasks = [test_source_connection(s, _api_keys.get(s.id)) for s in testable_sources]
    results = await asyncio.gather(*tasks)
    
    # Update health statuses
    for result in results:
        _source_health[result.source_id] = SourceHealth(
            source_id=result.source_id,
            status="healthy" if result.success else "unhealthy",
            latency_ms=result.latency_ms,
            last_check=result.timestamp,
            error_message=result.error
        )
    
    # Summary
    successful = sum(1 for r in results if r.success)
    failed = len(results) - successful
    
    return {
        "total_tested": len(results),
        "successful": successful,
        "failed": failed,
        "success_rate": round(successful / len(results) * 100, 1) if results else 0,
        "results": results,
        "summary_by_category": _summarize_by_category(results)
    }


def _summarize_by_category(results: List[SourceTestResult]) -> Dict:
    """Summarize test results by category"""
    summary = {}
    for result in results:
        source = EXTERNAL_SOURCES.get(result.source_id)
        if source:
            cat = source.category.value
            if cat not in summary:
                summary[cat] = {"total": 0, "success": 0, "avg_latency": 0}
            summary[cat]["total"] += 1
            if result.success:
                summary[cat]["success"] += 1
            summary[cat]["avg_latency"] = (
                summary[cat]["avg_latency"] * (summary[cat]["total"] - 1) + result.latency_ms
            ) / summary[cat]["total"]
    
    for cat in summary:
        summary[cat]["avg_latency"] = round(summary[cat]["avg_latency"], 2)
    
    return summary


@router.get("/health", response_model=Dict[str, SourceHealth])
async def get_sources_health():
    """Get health status of all sources"""
    return _source_health


@router.get("/health/dashboard")
async def get_health_dashboard():
    """Get dashboard data for source health monitoring"""
    total = len(EXTERNAL_SOURCES)
    healthy = sum(1 for h in _source_health.values() if h.status == "healthy")
    degraded = sum(1 for h in _source_health.values() if h.status == "degraded")
    unhealthy = sum(1 for h in _source_health.values() if h.status == "unhealthy")
    unknown = total - healthy - degraded - unhealthy
    
    # Calculate average latency
    latencies = [h.latency_ms for h in _source_health.values() if h.latency_ms]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    
    # Group by category
    by_category = {}
    for source in EXTERNAL_SOURCES.values():
        cat = source.category.value
        if cat not in by_category:
            by_category[cat] = {"total": 0, "healthy": 0, "sources": []}
        by_category[cat]["total"] += 1
        health = _source_health.get(source.id)
        if health and health.status == "healthy":
            by_category[cat]["healthy"] += 1
        by_category[cat]["sources"].append({
            "id": source.id,
            "name": source.name,
            "status": health.status if health else "unknown",
            "latency_ms": health.latency_ms if health else None
        })
    
    return {
        "summary": {
            "total_sources": total,
            "healthy": healthy,
            "degraded": degraded,
            "unhealthy": unhealthy,
            "unknown": unknown,
            "overall_health_percent": round(healthy / total * 100, 1) if total else 0,
            "avg_latency_ms": round(avg_latency, 2)
        },
        "by_category": by_category,
        "recent_issues": [
            {
                "source_id": h.source_id,
                "name": EXTERNAL_SOURCES[h.source_id].name,
                "error": h.error_message,
                "last_check": h.last_check
            }
            for h in _source_health.values()
            if h.status == "unhealthy" and h.error_message
        ][:10]
    }


@router.post("/api-keys/{source_id}")
async def set_api_key(source_id: str, api_key: str):
    """Store API key for a source (in production, use Azure Key Vault)"""
    if source_id not in EXTERNAL_SOURCES:
        raise HTTPException(status_code=404, detail=f"Source {source_id} not found")
    
    # In production: Store in Azure Key Vault
    _api_keys[source_id] = api_key
    
    return {"message": f"API key stored for {source_id}", "masked_key": f"{api_key[:4]}...{api_key[-4:]}"}


@router.delete("/api-keys/{source_id}")
async def delete_api_key(source_id: str):
    """Remove API key for a source"""
    if source_id in _api_keys:
        del _api_keys[source_id]
    return {"message": f"API key removed for {source_id}"}


@router.get("/api-keys")
async def list_configured_keys():
    """List which sources have API keys configured (masked)"""
    return {
        source_id: f"{key[:4]}...{key[-4:]}" if len(key) > 8 else "****"
        for source_id, key in _api_keys.items()
    }


@router.get("/costs")
async def get_cost_summary():
    """Get cost summary for all sources"""
    # Calculate estimated costs based on pricing tiers
    cost_data = []
    
    for source_id, source in EXTERNAL_SOURCES.items():
        monthly_cost = 0
        if source.pricing == SourcePricing.FREE:
            monthly_cost = 0
        elif source.cost:
            # Parse cost string like "$29/mo"
            try:
                cost_str = source.cost.replace("$", "").replace("/mo", "").split(" ")[0]
                monthly_cost = float(cost_str)
            except:
                monthly_cost = 0
        
        api_calls = len(_source_costs.get(source_id, []))
        
        cost_data.append({
            "source_id": source_id,
            "name": source.name,
            "pricing_tier": source.pricing.value,
            "monthly_cost": monthly_cost,
            "api_calls_this_month": api_calls,
            "has_api_key": source_id in _api_keys,
            "is_active": source_id in _source_health and _source_health[source_id].status == "healthy"
        })
    
    total_monthly = sum(c["monthly_cost"] for c in cost_data if c["has_api_key"])
    free_sources = sum(1 for c in cost_data if c["pricing_tier"] == "Free")
    paid_sources = sum(1 for c in cost_data if c["has_api_key"] and c["pricing_tier"] != "Free")
    
    return {
        "summary": {
            "total_monthly_cost": total_monthly,
            "free_sources": free_sources,
            "paid_sources_configured": paid_sources,
            "total_sources": len(EXTERNAL_SOURCES)
        },
        "sources": cost_data
    }


@router.get("/tca-mapping")
async def get_tca_module_mapping():
    """Get mapping of external sources to TCA scoring modules"""
    mapping = {}
    
    for module in TCAModule:
        sources_for_module = [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category.value,
                "pricing": s.pricing.value,
                "free_tier": s.free_tier_available,
                "has_key": s.id in _api_keys,
                "health": _source_health.get(s.id, {}).status if s.id in _source_health else "unknown"
            }
            for s in EXTERNAL_SOURCES.values()
            if module in s.tca_modules
        ]
        
        mapping[module.value] = {
            "description": _get_module_description(module),
            "total_sources": len(sources_for_module),
            "configured_sources": sum(1 for s in sources_for_module if s["has_key"] or not EXTERNAL_SOURCES[s["id"]].requires_auth),
            "sources": sources_for_module
        }
    
    return mapping


def _get_module_description(module: TCAModule) -> str:
    """Get description for TCA module"""
    descriptions = {
        TCAModule.COMPANY_ANALYSIS: "Company overview, competitors, traction metrics",
        TCAModule.TECHNOLOGY_SCORE: "Tech stack assessment, innovation metrics",
        TCAModule.FINANCIAL_SCORE: "Revenue signals, funding, valuations",
        TCAModule.MARKET_TRENDS: "Market demand, trend validation",
        TCAModule.REGULATORY_RISK: "Compliance, clinical trials, approvals",
        TCAModule.IP_STRENGTH: "Patents, trademarks, IP protection",
        TCAModule.SENTIMENT_ANALYSIS: "Social sentiment, brand perception"
    }
    return descriptions.get(module, "")


@router.get("/categories")
async def get_categories_summary():
    """Get summary of all source categories"""
    categories = {}
    
    for source in EXTERNAL_SOURCES.values():
        cat = source.category.value
        if cat not in categories:
            categories[cat] = {
                "total": 0,
                "free": 0,
                "freemium": 0,
                "premium": 0,
                "enterprise": 0,
                "sources": []
            }
        
        categories[cat]["total"] += 1
        categories[cat][source.pricing.value.lower()] += 1
        categories[cat]["sources"].append({
            "id": source.id,
            "name": source.name,
            "pricing": source.pricing.value,
            "free_tier": source.free_tier_available,
            "get_key_url": source.get_key_url
        })
    
    return categories


# ============================================================================
# Data Orchestrator Endpoints (for report enrichment)
# ============================================================================

@router.post("/enrich-report-context")
async def enrich_report_context(company_name: str, company_website: Optional[str] = None):
    """
    Enrich report context by fetching data from multiple sources.
    Call this before generate_report() to add external data.
    """
    results = {}
    errors = []
    
    # Define which sources to query for company enrichment
    enrichment_sources = [
        ("github", f"https://api.github.com/search/repositories?q={company_name}&sort=stars&per_page=3"),
        ("hackernews", f"https://hn.algolia.com/api/v1/search?query={company_name}&tags=story"),
        ("pubmed", f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={company_name}&retmode=json&retmax=5"),
    ]
    
    async with httpx.AsyncClient(timeout=10) as client:
        for source_id, url in enrichment_sources:
            try:
                source = EXTERNAL_SOURCES.get(source_id)
                headers = {}
                
                if source and source.headers:
                    api_key = _api_keys.get(source_id, "")
                    headers = {k: v.replace("{api_key}", api_key) for k, v in source.headers.items()}
                
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    results[source_id] = normalize_company_data(source_id, data).dict()
            except Exception as e:
                errors.append({"source": source_id, "error": str(e)})
    
    return {
        "company_name": company_name,
        "enrichment_results": results,
        "errors": errors,
        "sources_queried": len(enrichment_sources),
        "successful": len(results)
    }
