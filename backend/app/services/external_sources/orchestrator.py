"""
Data Orchestrator Service
Handles API calls with retry logic, timeout, caching, and failover support
"""

import asyncio
import logging
import time
import hashlib
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
import httpx
from tenacity import (
    retry, 
    stop_after_attempt, 
    wait_exponential,
    retry_if_exception_type
)
from cachetools import TTLCache

logger = logging.getLogger(__name__)


class AdapterType(str, Enum):
    """Type of adapter for different auth patterns"""
    REST = "rest"           # Simple GET/POST without auth
    API_KEY = "api_key"     # API key in header or query
    BEARER = "bearer"       # Bearer token auth
    OAUTH2 = "oauth2"       # OAuth2 flow
    RSS = "rss"             # RSS feed parsing
    SCRAPE = "scrape"       # Web scraping
    BULK = "bulk"           # File download


@dataclass
class SourceResponse:
    """Standardized response from any external source"""
    source_id: str
    success: bool
    status_code: Optional[int] = None
    data: Optional[Dict] = None
    error: Optional[str] = None
    latency_ms: float = 0.0
    cached: bool = False
    timestamp: datetime = field(default_factory=datetime.utcnow)
    raw_response: Optional[str] = None


@dataclass 
class SourceConfig:
    """Configuration for an external source"""
    id: str
    name: str
    base_url: str
    adapter_type: AdapterType
    auth_header: Optional[str] = None
    auth_format: Optional[str] = None  # e.g., "Bearer {key}" or "token {key}"
    auth_param: Optional[str] = None   # Query param for API key
    timeout: int = 10
    max_retries: int = 3
    cache_ttl: int = 3600  # 1 hour default
    rate_limit: Optional[int] = None  # requests per minute
    headers: Dict[str, str] = field(default_factory=dict)
    fallback_sources: List[str] = field(default_factory=list)


class SourceAdapter:
    """Base adapter for external API sources"""
    
    def __init__(self, config: SourceConfig, api_key: Optional[str] = None):
        self.config = config
        self.api_key = api_key
        self._client: Optional[httpx.AsyncClient] = None
        self._last_call_time: float = 0
        self._call_count: int = 0
        
    async def get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.config.timeout),
                follow_redirects=True
            )
        return self._client
    
    async def close(self):
        """Close the HTTP client"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
    
    def _build_headers(self) -> Dict[str, str]:
        """Build request headers with auth"""
        headers = {
            "Accept": "application/json",
            "User-Agent": "TCA-IRR-App/1.0 contact@tca-irr.com",
            **self.config.headers
        }
        
        if self.api_key:
            if self.config.adapter_type == AdapterType.BEARER:
                format_str = self.config.auth_format or "Bearer {key}"
                headers["Authorization"] = format_str.replace("{key}", self.api_key)
            elif self.config.adapter_type == AdapterType.API_KEY and self.config.auth_header:
                headers[self.config.auth_header] = self.api_key
        
        return headers
    
    def _build_params(self, params: Optional[Dict] = None) -> Dict:
        """Build query parameters with auth"""
        params = params or {}
        
        if self.api_key and self.config.auth_param:
            params[self.config.auth_param] = self.api_key
            
        return params
    
    async def _rate_limit_check(self):
        """Check and enforce rate limiting"""
        if self.config.rate_limit:
            elapsed = time.time() - self._last_call_time
            min_interval = 60.0 / self.config.rate_limit
            
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
        
        self._last_call_time = time.time()
        self._call_count += 1
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError))
    )
    async def fetch(
        self, 
        endpoint: str = "",
        params: Optional[Dict] = None,
        method: str = "GET",
        body: Optional[Dict] = None
    ) -> SourceResponse:
        """Fetch data from the source with retry logic"""
        start_time = time.time()
        
        try:
            await self._rate_limit_check()
            
            client = await self.get_client()
            url = f"{self.config.base_url}{endpoint}"
            headers = self._build_headers()
            params = self._build_params(params)
            
            if method.upper() == "GET":
                response = await client.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                response = await client.post(url, headers=headers, params=params, json=body)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            latency = (time.time() - start_time) * 1000
            
            # Try to parse JSON
            try:
                data = response.json()
            except:
                data = {"raw": response.text[:5000]}
            
            return SourceResponse(
                source_id=self.config.id,
                success=response.status_code < 400,
                status_code=response.status_code,
                data=data if response.status_code < 400 else None,
                error=None if response.status_code < 400 else f"HTTP {response.status_code}",
                latency_ms=latency,
                raw_response=response.text[:10000] if response.status_code >= 400 else None
            )
            
        except httpx.TimeoutException as e:
            latency = (time.time() - start_time) * 1000
            logger.warning(f"Timeout calling {self.config.id}: {e}")
            return SourceResponse(
                source_id=self.config.id,
                success=False,
                error=f"Timeout after {self.config.timeout}s",
                latency_ms=latency
            )
        except httpx.NetworkError as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Network error calling {self.config.id}: {e}")
            return SourceResponse(
                source_id=self.config.id,
                success=False,
                error=f"Network error: {str(e)}",
                latency_ms=latency
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Error calling {self.config.id}: {e}")
            return SourceResponse(
                source_id=self.config.id,
                success=False,
                error=str(e),
                latency_ms=latency
            )


class DataOrchestrator:
    """
    Central orchestrator for all external data sources.
    Handles caching, failover, normalization, and aggregation.
    """
    
    def __init__(
        self,
        cache_maxsize: int = 1000,
        cache_ttl: int = 3600
    ):
        self._adapters: Dict[str, SourceAdapter] = {}
        self._cache = TTLCache(maxsize=cache_maxsize, ttl=cache_ttl)
        self._source_configs: Dict[str, SourceConfig] = {}
        self._api_keys: Dict[str, str] = {}
        self._health_status: Dict[str, Dict] = {}
        
    def register_source(self, config: SourceConfig, api_key: Optional[str] = None):
        """Register a source with its configuration"""
        self._source_configs[config.id] = config
        if api_key:
            self._api_keys[config.id] = api_key
        self._adapters[config.id] = SourceAdapter(config, api_key)
        logger.info(f"Registered source: {config.id}")
    
    def set_api_key(self, source_id: str, api_key: str):
        """Set or update API key for a source"""
        self._api_keys[source_id] = api_key
        if source_id in self._source_configs:
            self._adapters[source_id] = SourceAdapter(
                self._source_configs[source_id],
                api_key
            )
    
    def _cache_key(self, source_id: str, endpoint: str, params: Dict) -> str:
        """Generate cache key"""
        params_str = json.dumps(params, sort_keys=True)
        key_str = f"{source_id}:{endpoint}:{params_str}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    async def fetch(
        self,
        source_id: str,
        endpoint: str = "",
        params: Optional[Dict] = None,
        use_cache: bool = True,
        use_fallback: bool = True
    ) -> SourceResponse:
        """
        Fetch data from a source with caching and fallback support
        """
        params = params or {}
        
        # Check cache first
        if use_cache:
            cache_key = self._cache_key(source_id, endpoint, params)
            if cache_key in self._cache:
                cached = self._cache[cache_key]
                cached.cached = True
                logger.debug(f"Cache hit for {source_id}")
                return cached
        
        # Try primary source
        if source_id not in self._adapters:
            return SourceResponse(
                source_id=source_id,
                success=False,
                error=f"Source '{source_id}' not registered"
            )
        
        adapter = self._adapters[source_id]
        response = await adapter.fetch(endpoint, params)
        
        # Update health status
        self._health_status[source_id] = {
            "last_check": datetime.utcnow(),
            "success": response.success,
            "latency_ms": response.latency_ms,
            "error": response.error
        }
        
        # If failed and fallback enabled, try fallback sources
        if not response.success and use_fallback:
            config = self._source_configs.get(source_id)
            if config and config.fallback_sources:
                for fallback_id in config.fallback_sources:
                    logger.info(f"Trying fallback source: {fallback_id}")
                    if fallback_id in self._adapters:
                        fallback_response = await self._adapters[fallback_id].fetch(endpoint, params)
                        if fallback_response.success:
                            fallback_response.source_id = f"{source_id}->fallback:{fallback_id}"
                            response = fallback_response
                            break
        
        # Cache successful responses
        if response.success and use_cache:
            cache_key = self._cache_key(source_id, endpoint, params)
            self._cache[cache_key] = response
        
        return response
    
    async def fetch_multiple(
        self,
        source_ids: List[str],
        endpoint: str = "",
        params: Optional[Dict] = None,
        parallel: bool = True
    ) -> Dict[str, SourceResponse]:
        """Fetch data from multiple sources"""
        params = params or {}
        
        if parallel:
            tasks = [
                self.fetch(source_id, endpoint, params)
                for source_id in source_ids
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            return {
                source_id: (
                    resp if isinstance(resp, SourceResponse) 
                    else SourceResponse(source_id=source_id, success=False, error=str(resp))
                )
                for source_id, resp in zip(source_ids, responses)
            }
        else:
            results = {}
            for source_id in source_ids:
                results[source_id] = await self.fetch(source_id, endpoint, params)
            return results
    
    async def fetch_by_category(
        self,
        category: str,
        endpoint: str = "",
        params: Optional[Dict] = None
    ) -> Dict[str, SourceResponse]:
        """Fetch from all sources in a category"""
        source_ids = [
            config.id for config in self._source_configs.values()
            # Category filtering would need additional metadata
        ]
        return await self.fetch_multiple(source_ids, endpoint, params)
    
    def get_health_status(self) -> Dict[str, Dict]:
        """Get health status of all sources"""
        return self._health_status.copy()
    
    def clear_cache(self, source_id: Optional[str] = None):
        """Clear cache for a source or all sources"""
        if source_id:
            keys_to_remove = [k for k in self._cache.keys() if k.startswith(source_id)]
            for key in keys_to_remove:
                del self._cache[key]
        else:
            self._cache.clear()
    
    async def close_all(self):
        """Close all adapter connections"""
        for adapter in self._adapters.values():
            await adapter.close()


# Pre-configured adapters for all 41 sources
SOURCE_CONFIGS: Dict[str, SourceConfig] = {
    # ===== NO AUTH SOURCES =====
    "hacker_news": SourceConfig(
        id="hacker_news",
        name="Hacker News",
        base_url="https://hacker-news.firebaseio.com/v0",
        adapter_type=AdapterType.REST,
        timeout=10,
        cache_ttl=300  # 5 min cache for news
    ),
    "world_bank": SourceConfig(
        id="world_bank", 
        name="World Bank",
        base_url="https://api.worldbank.org/v2",
        adapter_type=AdapterType.REST,
        timeout=15,
        cache_ttl=86400  # 24 hour cache for economic data
    ),
    "clinicaltrials_gov": SourceConfig(
        id="clinicaltrials_gov",
        name="ClinicalTrials.gov",
        base_url="https://clinicaltrials.gov/api/v2",
        adapter_type=AdapterType.REST,
        timeout=15,
        cache_ttl=3600
    ),
    "wayback_machine": SourceConfig(
        id="wayback_machine",
        name="Wayback Machine",
        base_url="https://archive.org/wayback/available",
        adapter_type=AdapterType.REST,
        timeout=10,
        cache_ttl=86400
    ),
    "uspto": SourceConfig(
        id="uspto",
        name="USPTO Patents",
        base_url="https://developer.uspto.gov/ibd-api/v1",
        adapter_type=AdapterType.REST,
        rate_limit=300,  # 5 req/sec = 300/min
        cache_ttl=3600
    ),
    "fda_purple_book": SourceConfig(
        id="fda_purple_book",
        name="FDA Purple Book",
        base_url="https://purplebooksearch.fda.gov/api/v1",
        adapter_type=AdapterType.REST,
        timeout=10,
        cache_ttl=86400
    ),
    "papers_with_code": SourceConfig(
        id="papers_with_code",
        name="Papers With Code",
        base_url="https://paperswithcode.com/api/v1",
        adapter_type=AdapterType.REST,
        timeout=15,
        cache_ttl=3600
    ),
    
    # ===== API KEY SOURCES =====
    "github": SourceConfig(
        id="github",
        name="GitHub",
        base_url="https://api.github.com",
        adapter_type=AdapterType.BEARER,
        auth_header="Authorization",
        auth_format="token {key}",
        headers={"Accept": "application/vnd.github.v3+json"},
        rate_limit=5000,  # 5000/hr = ~83/min
        cache_ttl=600
    ),
    "alpha_vantage": SourceConfig(
        id="alpha_vantage",
        name="Alpha Vantage",
        base_url="https://www.alphavantage.co/query",
        adapter_type=AdapterType.API_KEY,
        auth_param="apikey",
        rate_limit=5,  # 5/min on free tier
        cache_ttl=300
    ),
    "fred": SourceConfig(
        id="fred",
        name="FRED",
        base_url="https://api.stlouisfed.org/fred",
        adapter_type=AdapterType.API_KEY,
        auth_param="api_key",
        cache_ttl=86400
    ),
    "hugging_face": SourceConfig(
        id="hugging_face",
        name="Hugging Face",
        base_url="https://huggingface.co/api",
        adapter_type=AdapterType.BEARER,
        auth_header="Authorization",
        auth_format="Bearer {key}",
        rate_limit=30,
        cache_ttl=3600
    ),
    "pubmed": SourceConfig(
        id="pubmed",
        name="PubMed",
        base_url="https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
        adapter_type=AdapterType.API_KEY,
        auth_param="api_key",
        rate_limit=10 * 60,  # 10/sec = 600/min
        cache_ttl=3600
    ),
    "crunchbase": SourceConfig(
        id="crunchbase",
        name="Crunchbase",
        base_url="https://api.crunchbase.com/api/v4",
        adapter_type=AdapterType.API_KEY,
        auth_param="user_key",
        rate_limit=200,
        cache_ttl=3600
    ),
    "similarweb": SourceConfig(
        id="similarweb",
        name="SimilarWeb",
        base_url="https://api.similarweb.com/v1",
        adapter_type=AdapterType.API_KEY,
        auth_param="api_key",
        cache_ttl=86400
    ),
    "bea": SourceConfig(
        id="bea",
        name="BEA",
        base_url="https://apps.bea.gov/api/data",
        adapter_type=AdapterType.API_KEY,
        auth_param="UserID",
        rate_limit=100,
        cache_ttl=86400
    ),
    
    # ===== SEC EDGAR (Special header requirement) =====
    "sec_edgar": SourceConfig(
        id="sec_edgar",
        name="SEC EDGAR",
        base_url="https://data.sec.gov",
        adapter_type=AdapterType.REST,
        headers={"User-Agent": "TCA-IRR-App contact@tca-irr.com"},
        rate_limit=600,  # 10/sec
        cache_ttl=3600
    ),
    
    # ===== RSS/SCRAPE SOURCES =====
    "techcrunch": SourceConfig(
        id="techcrunch",
        name="TechCrunch",
        base_url="https://techcrunch.com/feed/",
        adapter_type=AdapterType.RSS,
        cache_ttl=900
    ),
}


# Global orchestrator instance
_orchestrator: Optional[DataOrchestrator] = None


def get_orchestrator() -> DataOrchestrator:
    """Get or create the global orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = DataOrchestrator()
        # Register all pre-configured sources
        for config in SOURCE_CONFIGS.values():
            _orchestrator.register_source(config)
    return _orchestrator
