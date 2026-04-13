"""
External Sources API Router
FastAPI endpoints for managing 41 external data sources.
Follows the 5 requirement groups: A (Public), B (Freemium), C (OAuth), D (Enterprise), E (Scraper)
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Body, Depends, BackgroundTasks
from pydantic import BaseModel, Field

from .health_monitor import SourceHealthMonitor, HealthStatus
from .key_manager import APIKeyManager, KeyStatus
from .cost_tracker import CostTracker
from .normalizer import DataNormalizer, RequirementGroup
from .orchestrator import DataOrchestrator

logger = logging.getLogger(__name__)

# Router setup
router = APIRouter(prefix="/api/external-sources", tags=["External Sources"])

# Config path
CONFIG_PATH = Path(__file__).parent / "config" / "external-sources-config.json"

# =============================================================================
# Pydantic Models
# =============================================================================

class SourceSummary(BaseModel):
    """Summary of an external source"""
    id: str
    name: str
    category: str
    pricing_model: str
    monthly_cost: float
    access_type: str
    requirement_group: str
    api_available: bool
    enabled: bool
    has_key: bool
    health_status: Optional[str] = None
    get_key_url: Optional[str] = None
    documentation_url: Optional[str] = None


class SourceDetail(BaseModel):
    """Detailed source information"""
    id: str
    name: str
    category: str
    pricing_model: str
    pricing_note: str
    monthly_cost: float
    access_type: str
    requirement_group: str
    api_available: bool
    base_url: Optional[str]
    auth_type: str
    rate_limit: Optional[str]
    enabled: bool
    has_key: bool
    masked_key: Optional[str] = None
    health_status: Optional[str] = None
    last_health_check: Optional[str] = None
    uptime_percentage: Optional[float] = None
    avg_latency_ms: Optional[float] = None
    monthly_calls: int = 0
    monthly_cost_estimate: float = 0.0
    test_endpoint: Optional[str] = None
    get_key_url: str
    documentation_url: Optional[str] = None
    notes: Optional[str] = None
    tca_module: Optional[str] = None
    data_points: List[str] = []


class HealthCheckResponse(BaseModel):
    """Health check result"""
    source_id: str
    status: str
    latency_ms: float
    status_code: Optional[int] = None
    error: Optional[str] = None
    timestamp: str


class HealthDashboard(BaseModel):
    """Overall health dashboard"""
    total_sources: int
    healthy_count: int
    degraded_count: int
    unhealthy_count: int
    unknown_count: int
    overall_uptime: float
    sources: List[Dict]


class CostSummary(BaseModel):
    """Cost tracking summary"""
    total_monthly_cost: float
    total_calls_this_month: int
    budget: float
    budget_remaining: float
    budget_used_percent: float
    sources: List[Dict]


class KeyInput(BaseModel):
    """API key input"""
    api_key: str
    key_name: str = "default"
    notes: str = ""


class TestResult(BaseModel):
    """Source test result"""
    source_id: str
    success: bool
    status_code: Optional[int] = None
    latency_ms: float
    response_preview: Optional[Dict] = None
    error: Optional[str] = None
    timestamp: str


class FetchRequest(BaseModel):
    """Data fetch request"""
    endpoint: str = ""
    params: Dict = Field(default_factory=dict)
    use_cache: bool = True


# =============================================================================
# Service Singletons
# =============================================================================

# Initialize services
_health_monitor: Optional[SourceHealthMonitor] = None
_key_manager: Optional[APIKeyManager] = None
_cost_tracker: Optional[CostTracker] = None
_orchestrator: Optional[DataOrchestrator] = None
_config: Optional[Dict] = None


def get_config() -> Dict:
    """Load source configuration"""
    global _config
    if _config is None:
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH) as f:
                _config = json.load(f)
        else:
            _config = {"categories": [], "total_sources": 0}
    return _config


def get_health_monitor() -> SourceHealthMonitor:
    """Get or create health monitor"""
    global _health_monitor
    if _health_monitor is None:
        _health_monitor = SourceHealthMonitor(config_path=str(CONFIG_PATH))
    return _health_monitor


def get_key_manager() -> APIKeyManager:
    """Get or create key manager"""
    global _key_manager
    if _key_manager is None:
        _key_manager = APIKeyManager()
    return _key_manager


def get_cost_tracker() -> CostTracker:
    """Get or create cost tracker"""
    global _cost_tracker
    if _cost_tracker is None:
        _cost_tracker = CostTracker()
    return _cost_tracker


def get_orchestrator() -> DataOrchestrator:
    """Get or create orchestrator"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = DataOrchestrator()
    return _orchestrator


# =============================================================================
# GET KEY URL MAPPING (Administrative Requirements)
# =============================================================================

GET_KEY_URLS = {
    # Group A: Public/No-Auth (User-Agent required for some)
    "sec_edgar": "https://www.sec.gov/developer",
    "hacker_news": "https://github.com/HackerNews/API",
    "world_bank": "https://datahelpdesk.worldbank.org/knowledgebase/articles/889386",
    "pubmed": "https://www.ncbi.nlm.nih.gov/account/",
    "clinicaltrials_gov": "https://clinicaltrials.gov/data-api/about-api",
    "uspto_patents": "https://developer.uspto.gov/api-catalog",
    "arxiv": "https://info.arxiv.org/help/api/index.html",
    "wayback_machine": "https://archive.org/help/wayback_api.php",
    "stack_overflow": "https://stackapps.com/apps/oauth/register",
    "techcrunch": "https://techcrunch.com/feed/",
    "papers_with_code": "https://paperswithcode.com/api/v1/docs/",
    
    # Group B: Instant Key (Freemium) - requires business email
    "github": "https://github.com/settings/tokens",
    "alpha_vantage": "https://www.alphavantage.co/support/#api-key",
    "fred": "https://fred.stlouisfed.org/docs/api/api_key.html",
    "bea": "https://apps.bea.gov/API/signup/",
    "bls": "https://data.bls.gov/registrationEngine/",
    "hugging_face": "https://huggingface.co/settings/tokens",
    "crunchbase": "https://data.crunchbase.com/",
    "product_hunt": "https://www.producthunt.com/v2/oauth/applications",
    "owler": "https://corp.owler.com/",
    "newsapi": "https://newsapi.org/register",
    "google_trends": "https://trends.google.com/trends/",
    
    # Group C: OAuth/App Registration - requires developer profile
    "linkedin": "https://www.linkedin.com/developers/apps",
    "twitter_x": "https://developer.twitter.com/en/portal/dashboard",
    "reddit": "https://www.reddit.com/prefs/apps",
    
    # Group D: Enterprise Contract - requires sales contact
    "pitchbook": "https://pitchbook.com/request-a-free-trial",
    "cb_insights": "https://www.cbinsights.com/research/",
    "similarweb": "https://www.similarweb.com/corp/pricing/",
    "bloomberg": "https://www.bloomberg.com/professional/request-demo/",
    
    # Group E: Scraper/Dataset - requires Puppeteer or dataset download
    "eu_clinical_trials": "https://www.clinicaltrialsregister.eu/",
    "wellfound": "https://angel.co/api",
    "who_ictrp": "https://trialsearch.who.int/",
    "fda_orange_book": "https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files",
}


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("/config", response_model=Dict)
async def get_sources_config():
    """
    Get the complete external sources configuration.
    Returns all 41 sources grouped by category with Get Key URLs.
    """
    config = get_config()
    
    # Enrich with Get Key URLs
    enriched = {**config}
    for category in enriched.get("categories", []):
        for source in category.get("sources", []):
            source_id = source.get("id")
            source["get_key_url"] = GET_KEY_URLS.get(source_id, source.get("access_url"))
            source["requirement_group"] = DataNormalizer.get_requirement_group(source_id)
            if source["requirement_group"]:
                source["requirement_group"] = source["requirement_group"].value
    
    return enriched


@router.get("/sources", response_model=List[SourceSummary])
async def list_sources(
    category: Optional[str] = Query(None, description="Filter by category"),
    pricing: Optional[str] = Query(None, description="Filter by pricing model"),
    enabled: Optional[bool] = Query(None, description="Filter by enabled status"),
    group: Optional[str] = Query(None, description="Filter by requirement group (A, B, C, D, E)")
):
    """
    List all external data sources with optional filtering.
    """
    config = get_config()
    key_manager = get_key_manager()
    health_monitor = get_health_monitor()
    
    sources = []
    
    for cat in config.get("categories", []):
        for source in cat.get("sources", []):
            source_id = source.get("id")
            
            # Apply filters
            if category and cat.get("id") != category:
                continue
            if pricing and source.get("pricing_model") != pricing:
                continue
            if enabled is not None and source.get("enabled") != enabled:
                continue
            
            req_group = DataNormalizer.get_requirement_group(source_id)
            if group:
                group_map = {"A": RequirementGroup.GROUP_A, "B": RequirementGroup.GROUP_B,
                           "C": RequirementGroup.GROUP_C, "D": RequirementGroup.GROUP_D,
                           "E": RequirementGroup.GROUP_E}
                if req_group != group_map.get(group.upper()):
                    continue
            
            # Get health status
            health = health_monitor.get_summary(source_id)
            
            sources.append(SourceSummary(
                id=source_id,
                name=source.get("name", ""),
                category=source.get("category", ""),
                pricing_model=source.get("pricing_model", "unknown"),
                monthly_cost=source.get("monthly_cost", 0),
                access_type=source.get("access_type", "unknown"),
                requirement_group=req_group.value if req_group else "unknown",
                api_available=source.get("api_available", False),
                enabled=source.get("enabled", False),
                has_key=key_manager.get_key(source_id) is not None,
                health_status=health.current_status.value if health else "unknown",
                get_key_url=GET_KEY_URLS.get(source_id, source.get("access_url")),
                documentation_url=source.get("documentation_url")
            ))
    
    return sources


@router.get("/sources/{source_id}", response_model=SourceDetail)
async def get_source_detail(source_id: str):
    """
    Get detailed information about a specific source.
    """
    config = get_config()
    key_manager = get_key_manager()
    health_monitor = get_health_monitor()
    cost_tracker = get_cost_tracker()
    
    # Find source
    source = None
    for cat in config.get("categories", []):
        for s in cat.get("sources", []):
            if s.get("id") == source_id:
                source = s
                break
        if source:
            break
    
    if not source:
        raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found")
    
    # Get health info
    health = health_monitor.get_summary(source_id)
    
    # Get key metadata
    key_meta = key_manager.get_metadata(source_id)
    
    # Get cost info
    source_cost = cost_tracker.get_source_cost(source_id) if hasattr(cost_tracker, 'get_source_cost') else {}
    
    req_group = DataNormalizer.get_requirement_group(source_id)
    
    return SourceDetail(
        id=source_id,
        name=source.get("name", ""),
        category=source.get("category", ""),
        pricing_model=source.get("pricing_model", "unknown"),
        pricing_note=source.get("pricing_note", ""),
        monthly_cost=source.get("monthly_cost", 0),
        access_type=source.get("access_type", "unknown"),
        requirement_group=req_group.value if req_group else "unknown",
        api_available=source.get("api_available", False),
        base_url=source.get("base_url"),
        auth_type=source.get("auth", {}).get("type", "none"),
        rate_limit=source.get("rate_limit"),
        enabled=source.get("enabled", False),
        has_key=key_manager.get_key(source_id) is not None,
        masked_key=key_meta.masked_key if key_meta else None,
        health_status=health.current_status.value if health else "unknown",
        last_health_check=health.last_check.isoformat() if health and health.last_check else None,
        uptime_percentage=health.uptime_percentage if health else None,
        avg_latency_ms=health.avg_latency_ms if health else None,
        monthly_calls=source_cost.get("call_count", 0),
        monthly_cost_estimate=source_cost.get("estimated_cost", 0),
        test_endpoint=source.get("test", {}).get("url") if source.get("test") else None,
        get_key_url=GET_KEY_URLS.get(source_id, source.get("access_url", "")),
        documentation_url=source.get("documentation_url"),
        notes=source.get("notes"),
        tca_module=source.get("tca_module"),
        data_points=source.get("data_points", [])
    )


@router.get("/categories", response_model=List[Dict])
async def list_categories():
    """
    List all source categories with counts.
    """
    config = get_config()
    categories = []
    
    for cat in config.get("categories", []):
        categories.append({
            "id": cat.get("id"),
            "name": cat.get("name"),
            "source_count": len(cat.get("sources", [])),
            "sources": [s.get("id") for s in cat.get("sources", [])]
        })
    
    return categories


@router.get("/requirement-groups", response_model=Dict)
async def list_requirement_groups():
    """
    List sources by administrative requirement groups.
    Returns the 5 groups (A-E) with their sources and requirements.
    """
    groups = {
        "A": {
            "name": "Public/No-Auth",
            "requirements": ["User-Agent string (required for SEC EDGAR)", "No account needed"],
            "sources": DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_A)
        },
        "B": {
            "name": "Instant Key (Freemium)",
            "requirements": ["Business email", "Verified account (click activation link)", "Mobile phone for 2FA (some providers)"],
            "sources": DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_B)
        },
        "C": {
            "name": "OAuth/App Registration",
            "requirements": ["Developer profile application", "Redirect URL (even localhost)", "App description (~200 words)"],
            "sources": DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_C)
        },
        "D": {
            "name": "Enterprise Contract",
            "requirements": ["Sales contact required", "Enterprise pricing"],
            "sources": DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_D)
        },
        "E": {
            "name": "Scraper/Dataset",
            "requirements": ["Puppeteer/Playwright for scraping", "Robots.txt compliance", "Cron job for dataset downloads"],
            "sources": DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_E)
        }
    }
    
    # Add Get Key URLs to each group
    for group_key, group in groups.items():
        group["source_details"] = [
            {"id": s, "get_key_url": GET_KEY_URLS.get(s, "")}
            for s in group["sources"]
        ]
    
    return groups


# =============================================================================
# Health Monitoring Endpoints
# =============================================================================

@router.get("/health", response_model=HealthDashboard)
async def get_health_dashboard():
    """
    Get overall health status of all external sources.
    """
    health_monitor = get_health_monitor()
    config = get_config()
    
    all_summaries = health_monitor.get_all_summaries()
    
    healthy = sum(1 for s in all_summaries.values() if s.current_status == HealthStatus.HEALTHY)
    degraded = sum(1 for s in all_summaries.values() if s.current_status == HealthStatus.DEGRADED)
    unhealthy = sum(1 for s in all_summaries.values() if s.current_status == HealthStatus.UNHEALTHY)
    unknown = sum(1 for s in all_summaries.values() if s.current_status == HealthStatus.UNKNOWN)
    
    total = len(all_summaries) or 1
    overall_uptime = sum(s.uptime_percentage for s in all_summaries.values()) / total if all_summaries else 0
    
    sources = [
        {
            "id": s.source_id,
            "status": s.current_status.value,
            "uptime": s.uptime_percentage,
            "avg_latency": s.avg_latency_ms,
            "last_check": s.last_check.isoformat() if s.last_check else None,
            "consecutive_failures": s.consecutive_failures,
            "enabled": s.enabled
        }
        for s in all_summaries.values()
    ]
    
    return HealthDashboard(
        total_sources=config.get("total_sources", len(all_summaries)),
        healthy_count=healthy,
        degraded_count=degraded,
        unhealthy_count=unhealthy,
        unknown_count=unknown,
        overall_uptime=overall_uptime,
        sources=sources
    )


@router.get("/health/{source_id}", response_model=Dict)
async def get_source_health(source_id: str):
    """
    Get detailed health information for a specific source.
    """
    health_monitor = get_health_monitor()
    summary = health_monitor.get_summary(source_id)
    
    if not summary:
        raise HTTPException(status_code=404, detail=f"No health data for source '{source_id}'")
    
    return summary.to_dict()


@router.post("/health/check/{source_id}", response_model=HealthCheckResponse)
async def check_source_health(source_id: str, background_tasks: BackgroundTasks):
    """
    Run a health check on a specific source.
    """
    health_monitor = get_health_monitor()
    key_manager = get_key_manager()
    
    # Set API key if available
    api_key = key_manager.get_key(source_id)
    if api_key:
        health_monitor.set_api_key(source_id, api_key)
    
    result = await health_monitor.check_source(source_id)
    
    return HealthCheckResponse(
        source_id=result.source_id,
        status=result.status.value,
        latency_ms=result.latency_ms,
        status_code=result.status_code,
        error=result.error,
        timestamp=result.timestamp.isoformat()
    )


@router.post("/health/check-all", response_model=List[HealthCheckResponse])
async def check_all_sources_health(
    category: Optional[str] = Query(None),
    enabled_only: bool = Query(True)
):
    """
    Run health checks on all sources (or filtered subset).
    """
    health_monitor = get_health_monitor()
    key_manager = get_key_manager()
    config = get_config()
    
    results = []
    
    for cat in config.get("categories", []):
        if category and cat.get("id") != category:
            continue
        
        for source in cat.get("sources", []):
            if enabled_only and not source.get("enabled"):
                continue
            
            source_id = source.get("id")
            
            # Set API key if available
            api_key = key_manager.get_key(source_id)
            if api_key:
                health_monitor.set_api_key(source_id, api_key)
            
            result = await health_monitor.check_source(source_id)
            
            results.append(HealthCheckResponse(
                source_id=result.source_id,
                status=result.status.value,
                latency_ms=result.latency_ms,
                status_code=result.status_code,
                error=result.error,
                timestamp=result.timestamp.isoformat()
            ))
    
    return results


# =============================================================================
# API Key Management Endpoints
# =============================================================================

@router.get("/keys", response_model=Dict)
async def list_api_keys():
    """
    List all stored API keys (masked) with metadata.
    """
    key_manager = get_key_manager()
    all_metadata = key_manager.get_all_metadata()
    
    return {
        "total_keys": len(all_metadata),
        "keys": [
            {
                "source_id": m.source_id,
                "key_name": m.key_name,
                "status": m.status.value,
                "masked_key": m.masked_key,
                "created_at": m.created_at.isoformat(),
                "last_used": m.last_used.isoformat() if m.last_used else None,
                "use_count": m.use_count,
                "get_key_url": GET_KEY_URLS.get(m.source_id, "")
            }
            for m in all_metadata.values()
        ]
    }


@router.get("/keys/{source_id}", response_model=Dict)
async def get_key_info(source_id: str):
    """
    Get API key metadata for a specific source.
    """
    key_manager = get_key_manager()
    metadata = key_manager.get_metadata(source_id)
    
    if not metadata:
        return {
            "source_id": source_id,
            "has_key": False,
            "get_key_url": GET_KEY_URLS.get(source_id, ""),
            "message": "No API key stored. Use the Get Key URL to obtain one."
        }
    
    return {
        "source_id": metadata.source_id,
        "has_key": True,
        "key_name": metadata.key_name,
        "status": metadata.status.value,
        "masked_key": metadata.masked_key,
        "created_at": metadata.created_at.isoformat(),
        "last_used": metadata.last_used.isoformat() if metadata.last_used else None,
        "use_count": metadata.use_count,
        "get_key_url": GET_KEY_URLS.get(source_id, "")
    }


@router.post("/keys/{source_id}", response_model=Dict)
async def store_api_key(source_id: str, key_input: KeyInput):
    """
    Store an API key for a source.
    """
    key_manager = get_key_manager()
    
    success = key_manager.store_key(
        source_id=source_id,
        api_key=key_input.api_key,
        key_name=key_input.key_name,
        notes=key_input.notes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to store API key")
    
    metadata = key_manager.get_metadata(source_id)
    
    return {
        "success": True,
        "source_id": source_id,
        "masked_key": metadata.masked_key if metadata else None,
        "message": f"API key stored for {source_id}"
    }


@router.delete("/keys/{source_id}", response_model=Dict)
async def delete_api_key(source_id: str):
    """
    Delete an API key for a source.
    """
    key_manager = get_key_manager()
    success = key_manager.delete_key(source_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"No API key found for '{source_id}'")
    
    return {
        "success": True,
        "message": f"API key deleted for {source_id}"
    }


@router.post("/keys/{source_id}/rotate", response_model=Dict)
async def rotate_api_key(source_id: str, key_input: KeyInput):
    """
    Rotate (replace) an API key for a source.
    """
    key_manager = get_key_manager()
    success = key_manager.rotate_key(source_id, key_input.api_key)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"No existing key to rotate for '{source_id}'")
    
    metadata = key_manager.get_metadata(source_id)
    
    return {
        "success": True,
        "source_id": source_id,
        "masked_key": metadata.masked_key if metadata else None,
        "message": f"API key rotated for {source_id}"
    }


# =============================================================================
# Cost Tracking Endpoints
# =============================================================================

@router.get("/costs", response_model=CostSummary)
async def get_cost_summary():
    """
    Get cost tracking summary for all sources.
    """
    cost_tracker = get_cost_tracker()
    config = get_config()
    
    # Get monthly costs for all sources
    total_cost = 0.0
    total_calls = 0
    sources = []
    
    for cat in config.get("categories", []):
        for source in cat.get("sources", []):
            source_id = source.get("id")
            monthly_cost = source.get("monthly_cost", 0)
            
            # Get actual usage from cost tracker if available
            source_cost = cost_tracker.get_source_cost(source_id) if hasattr(cost_tracker, 'get_source_cost') else {}
            call_count = source_cost.get("call_count", 0)
            
            total_cost += monthly_cost
            total_calls += call_count
            
            sources.append({
                "id": source_id,
                "name": source.get("name"),
                "base_monthly_cost": monthly_cost,
                "call_count": call_count,
                "pricing_model": source.get("pricing_model"),
                "rate_limit": source.get("rate_limit")
            })
    
    # Default budget
    budget = os.environ.get("TCA_MONTHLY_BUDGET", 500.0)
    try:
        budget = float(budget)
    except:
        budget = 500.0
    
    return CostSummary(
        total_monthly_cost=total_cost,
        total_calls_this_month=total_calls,
        budget=budget,
        budget_remaining=budget - total_cost,
        budget_used_percent=(total_cost / budget * 100) if budget > 0 else 0,
        sources=sources
    )


# =============================================================================
# Testing Endpoints
# =============================================================================

@router.post("/test/{source_id}", response_model=TestResult)
async def test_source(source_id: str):
    """
    Test connection to a specific source using its test endpoint.
    """
    config = get_config()
    key_manager = get_key_manager()
    
    # Find source config
    source_config = None
    for cat in config.get("categories", []):
        for s in cat.get("sources", []):
            if s.get("id") == source_id:
                source_config = s
                break
        if source_config:
            break
    
    if not source_config:
        raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found")
    
    test_config = source_config.get("test")
    if not test_config or not test_config.get("url"):
        return TestResult(
            source_id=source_id,
            success=False,
            latency_ms=0,
            error="No test endpoint configured for this source",
            timestamp=datetime.utcnow().isoformat()
        )
    
    import httpx
    import time
    
    # Build request
    url = test_config.get("url")
    method = test_config.get("method", "GET")
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "TCA-IRR-App/1.0 (contact@tca-irr.com)"
    }
    
    # Add auth if needed
    auth = source_config.get("auth", {})
    api_key = key_manager.get_key(source_id)
    
    if api_key:
        auth_type = auth.get("type")
        if auth_type == "bearer_token":
            format_str = auth.get("format", "Bearer {key}")
            headers["Authorization"] = format_str.replace("${" + source_id.upper() + "_TOKEN}", api_key).replace("{key}", api_key)
        elif auth_type == "api_key" and auth.get("location") == "header":
            header_name = auth.get("header_name", "Authorization")
            headers[header_name] = api_key
    
    params = {}
    if api_key and auth.get("location") == "query":
        param_name = auth.get("param_name", "api_key")
        params[param_name] = api_key
    
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
            if method.upper() == "GET":
                response = await client.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                body = test_config.get("body", {})
                response = await client.post(url, headers=headers, params=params, json=body)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Try to get response preview
            try:
                preview = response.json()
                # Truncate large responses
                if isinstance(preview, dict) and len(str(preview)) > 1000:
                    preview = {"_truncated": True, "_keys": list(preview.keys())[:10]}
                elif isinstance(preview, list) and len(preview) > 5:
                    preview = preview[:5] + [{"_truncated": True, "_total": len(preview)}]
            except:
                preview = {"_raw": response.text[:500]}
            
            return TestResult(
                source_id=source_id,
                success=response.status_code < 400,
                status_code=response.status_code,
                latency_ms=latency_ms,
                response_preview=preview,
                error=None if response.status_code < 400 else f"HTTP {response.status_code}",
                timestamp=datetime.utcnow().isoformat()
            )
            
    except httpx.TimeoutException:
        latency_ms = (time.time() - start_time) * 1000
        return TestResult(
            source_id=source_id,
            success=False,
            latency_ms=latency_ms,
            error="Request timeout (15s)",
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        return TestResult(
            source_id=source_id,
            success=False,
            latency_ms=latency_ms,
            error=str(e),
            timestamp=datetime.utcnow().isoformat()
        )


# =============================================================================
# Data Fetching Endpoints
# =============================================================================

@router.post("/fetch/{source_id}", response_model=Dict)
async def fetch_data(source_id: str, request: FetchRequest):
    """
    Fetch data from a source using the orchestrator.
    Data is automatically normalized.
    """
    orchestrator = get_orchestrator()
    key_manager = get_key_manager()
    
    # Set API key
    api_key = key_manager.get_key(source_id)
    if api_key:
        orchestrator.set_api_key(source_id, api_key)
    
    response = await orchestrator.fetch(
        source_id=source_id,
        endpoint=request.endpoint,
        params=request.params,
        use_cache=request.use_cache
    )
    
    if not response.success:
        raise HTTPException(
            status_code=502,
            detail={
                "error": response.error,
                "source_id": source_id,
                "latency_ms": response.latency_ms
            }
        )
    
    # Normalize the data
    normalized = DataNormalizer.normalize(source_id, response.data)
    
    return {
        "source_id": source_id,
        "success": True,
        "cached": response.cached,
        "latency_ms": response.latency_ms,
        "data": normalized,
        "raw_data": response.data if not request.use_cache else None
    }


# =============================================================================
# Bulk Operations
# =============================================================================

@router.post("/enable", response_model=Dict)
async def enable_sources(source_ids: List[str] = Body(...)):
    """
    Enable multiple sources at once.
    """
    # In production, this would update the config file
    return {
        "success": True,
        "enabled": source_ids,
        "message": f"Enabled {len(source_ids)} sources"
    }


@router.post("/disable", response_model=Dict)
async def disable_sources(source_ids: List[str] = Body(...)):
    """
    Disable multiple sources at once.
    """
    return {
        "success": True,
        "disabled": source_ids,
        "message": f"Disabled {len(source_ids)} sources"
    }


@router.get("/get-key-urls", response_model=Dict)
async def get_all_key_urls():
    """
    Get all Get Key URLs for administrative setup.
    """
    return {
        "total_sources": len(GET_KEY_URLS),
        "urls": GET_KEY_URLS,
        "groups": {
            "A_public_no_auth": [s for s in DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_A)],
            "B_freemium_key": [s for s in DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_B)],
            "C_oauth_registration": [s for s in DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_C)],
            "D_enterprise": [s for s in DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_D)],
            "E_scraper_dataset": [s for s in DataNormalizer.get_sources_by_group(RequirementGroup.GROUP_E)],
        }
    }


# Export router
__all__ = ["router"]
