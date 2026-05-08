"""
Source Health Monitor
Tracks health, latency, uptime, and availability of all 41 external data sources
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json
import httpx
from collections import deque
from pathlib import Path

logger = logging.getLogger(__name__)


class HealthStatus(str, Enum):
    """Health status levels"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthCheck:
    """Single health check result"""
    source_id: str
    timestamp: datetime
    status: HealthStatus
    latency_ms: float
    status_code: Optional[int] = None
    error: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "timestamp": self.timestamp.isoformat(),
            "status": self.status.value,
            "latency_ms": round(self.latency_ms, 2),
            "status_code": self.status_code,
            "error": self.error
        }


@dataclass
class SourceHealthSummary:
    """Aggregated health summary for a source"""
    source_id: str
    current_status: HealthStatus
    last_check: Optional[datetime] = None
    uptime_percentage: float = 100.0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    total_checks: int = 0
    successful_checks: int = 0
    failed_checks: int = 0
    consecutive_failures: int = 0
    last_error: Optional[str] = None
    enabled: bool = True
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "current_status": self.current_status.value,
            "last_check": self.last_check.isoformat() if self.last_check else None,
            "uptime_percentage": round(self.uptime_percentage, 2),
            "avg_latency_ms": round(self.avg_latency_ms, 2),
            "p95_latency_ms": round(self.p95_latency_ms, 2),
            "p99_latency_ms": round(self.p99_latency_ms, 2),
            "total_checks": self.total_checks,
            "successful_checks": self.successful_checks,
            "failed_checks": self.failed_checks,
            "consecutive_failures": self.consecutive_failures,
            "last_error": self.last_error,
            "enabled": self.enabled
        }


class SourceHealthMonitor:
    """
    Monitors health of all external data sources.
    Tracks latency, uptime, and provides circuit breaker functionality.
    """
    
    # Thresholds for health status
    LATENCY_WARNING_MS = 2000  # 2 seconds
    LATENCY_CRITICAL_MS = 5000  # 5 seconds
    CONSECUTIVE_FAILURES_WARNING = 2
    CONSECUTIVE_FAILURES_CRITICAL = 5
    HISTORY_SIZE = 100  # Keep last 100 checks per source
    
    def __init__(
        self,
        config_path: Optional[str] = None,
        check_interval_seconds: int = 300  # 5 minutes
    ):
        self._summaries: Dict[str, SourceHealthSummary] = {}
        self._history: Dict[str, deque] = {}  # source_id -> deque of HealthCheck
        self._config_path = config_path
        self._check_interval = check_interval_seconds
        self._running = False
        self._check_task: Optional[asyncio.Task] = None
        self._api_keys: Dict[str, str] = {}
        self._source_configs: Dict[str, Dict] = {}
        
        # Load config if path provided
        if config_path:
            self._load_config(config_path)
    
    def _load_config(self, config_path: str):
        """Load source configuration from JSON file"""
        try:
            path = Path(config_path)
            if path.exists():
                with open(path, 'r') as f:
                    config = json.load(f)
                    
                for category in config.get("categories", []):
                    for source in category.get("sources", []):
                        source_id = source["id"]
                        self._source_configs[source_id] = source
                        self._summaries[source_id] = SourceHealthSummary(
                            source_id=source_id,
                            current_status=HealthStatus.UNKNOWN,
                            enabled=source.get("enabled", False)
                        )
                        self._history[source_id] = deque(maxlen=self.HISTORY_SIZE)
                        
                logger.info(f"Loaded {len(self._source_configs)} source configurations")
        except Exception as e:
            logger.error(f"Failed to load config from {config_path}: {e}")
    
    def register_source(self, source_id: str, config: Dict = None):
        """Register a source for health monitoring"""
        if source_id not in self._summaries:
            self._summaries[source_id] = SourceHealthSummary(
                source_id=source_id,
                current_status=HealthStatus.UNKNOWN
            )
            self._history[source_id] = deque(maxlen=self.HISTORY_SIZE)
        
        if config:
            self._source_configs[source_id] = config
    
    def set_api_key(self, source_id: str, api_key: str):
        """Set API key for a source"""
        self._api_keys[source_id] = api_key
    
    async def check_source(self, source_id: str) -> HealthCheck:
        """
        Perform health check on a single source.
        Uses the test endpoint from config if available.
        """
        config = self._source_configs.get(source_id, {})
        test_config = config.get("test")
        
        if not test_config or not test_config.get("url"):
            # No test endpoint configured
            return HealthCheck(
                source_id=source_id,
                timestamp=datetime.utcnow(),
                status=HealthStatus.UNKNOWN,
                latency_ms=0,
                error="No test endpoint configured"
            )
        
        url = test_config["url"]
        method = test_config.get("method", "GET")
        
        # Build headers with auth if needed
        headers = {
            "Accept": "application/json",
            "User-Agent": "TCA-IRR-HealthMonitor/1.0"
        }
        
        auth = config.get("auth", {})
        api_key = self._api_keys.get(source_id)
        
        if api_key:
            auth_type = auth.get("type")
            if auth_type == "bearer_token":
                format_str = auth.get("format", "Bearer {key}")
                headers["Authorization"] = format_str.replace("${GITHUB_TOKEN}", api_key).replace("{key}", api_key)
            elif auth_type == "api_key" and auth.get("location") == "header":
                header_name = auth.get("header_name", "Authorization")
                headers[header_name] = api_key
        
        # Build query params
        params = {}
        if api_key and auth.get("location") == "query":
            param_name = auth.get("param_name", "api_key")
            params[param_name] = api_key
        
        start_time = datetime.utcnow()
        
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                if method.upper() == "GET":
                    response = await client.get(url, headers=headers, params=params)
                else:
                    response = await client.post(url, headers=headers, params=params)
                
                latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
                
                # Determine health status based on response and latency
                if response.status_code >= 400:
                    status = HealthStatus.UNHEALTHY
                    error = f"HTTP {response.status_code}"
                elif latency_ms > self.LATENCY_CRITICAL_MS:
                    status = HealthStatus.DEGRADED
                    error = f"High latency: {latency_ms:.0f}ms"
                elif latency_ms > self.LATENCY_WARNING_MS:
                    status = HealthStatus.DEGRADED
                    error = None
                else:
                    status = HealthStatus.HEALTHY
                    error = None
                
                check = HealthCheck(
                    source_id=source_id,
                    timestamp=datetime.utcnow(),
                    status=status,
                    latency_ms=latency_ms,
                    status_code=response.status_code,
                    error=error
                )
                
        except httpx.TimeoutException:
            latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            check = HealthCheck(
                source_id=source_id,
                timestamp=datetime.utcnow(),
                status=HealthStatus.UNHEALTHY,
                latency_ms=latency_ms,
                error="Request timeout"
            )
        except httpx.NetworkError as e:
            check = HealthCheck(
                source_id=source_id,
                timestamp=datetime.utcnow(),
                status=HealthStatus.UNHEALTHY,
                latency_ms=0,
                error=f"Network error: {str(e)}"
            )
        except Exception as e:
            check = HealthCheck(
                source_id=source_id,
                timestamp=datetime.utcnow(),
                status=HealthStatus.UNHEALTHY,
                latency_ms=0,
                error=str(e)
            )
        
        # Update history and summary
        self._record_check(check)
        
        return check
    
    def _record_check(self, check: HealthCheck):
        """Record a health check result and update summary"""
        source_id = check.source_id
        
        if source_id not in self._history:
            self._history[source_id] = deque(maxlen=self.HISTORY_SIZE)
        
        self._history[source_id].append(check)
        
        # Update summary
        if source_id not in self._summaries:
            self._summaries[source_id] = SourceHealthSummary(
                source_id=source_id,
                current_status=check.status
            )
        
        summary = self._summaries[source_id]
        summary.last_check = check.timestamp
        summary.current_status = check.status
        summary.total_checks += 1
        
        if check.status == HealthStatus.HEALTHY:
            summary.successful_checks += 1
            summary.consecutive_failures = 0
        else:
            summary.failed_checks += 1
            summary.consecutive_failures += 1
            summary.last_error = check.error
        
        # Calculate uptime percentage
        if summary.total_checks > 0:
            summary.uptime_percentage = (summary.successful_checks / summary.total_checks) * 100
        
        # Calculate latency percentiles
        latencies = [c.latency_ms for c in self._history[source_id] if c.latency_ms > 0]
        if latencies:
            latencies_sorted = sorted(latencies)
            summary.avg_latency_ms = sum(latencies) / len(latencies)
            p95_idx = int(len(latencies_sorted) * 0.95)
            p99_idx = int(len(latencies_sorted) * 0.99)
            summary.p95_latency_ms = latencies_sorted[min(p95_idx, len(latencies_sorted) - 1)]
            summary.p99_latency_ms = latencies_sorted[min(p99_idx, len(latencies_sorted) - 1)]
        
        # Update status based on consecutive failures
        if summary.consecutive_failures >= self.CONSECUTIVE_FAILURES_CRITICAL:
            summary.current_status = HealthStatus.UNHEALTHY
        elif summary.consecutive_failures >= self.CONSECUTIVE_FAILURES_WARNING:
            summary.current_status = HealthStatus.DEGRADED
    
    async def check_all_sources(self) -> Dict[str, HealthCheck]:
        """Check health of all registered sources in parallel"""
        tasks = []
        for source_id in self._source_configs:
            if self._summaries.get(source_id, SourceHealthSummary(source_id=source_id, current_status=HealthStatus.UNKNOWN)).enabled:
                tasks.append(self.check_source(source_id))
        
        if not tasks:
            return {}
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            check.source_id: check
            for check in results
            if isinstance(check, HealthCheck)
        }
    
    async def check_category(self, category_id: str) -> Dict[str, HealthCheck]:
        """Check health of all sources in a category"""
        source_ids = [
            source_id for source_id, config in self._source_configs.items()
            if config.get("category", "").lower().replace(" ", "_") == category_id
        ]
        
        tasks = [self.check_source(source_id) for source_id in source_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            check.source_id: check
            for check in results
            if isinstance(check, HealthCheck)
        }
    
    def get_summary(self, source_id: str) -> Optional[SourceHealthSummary]:
        """Get health summary for a source"""
        return self._summaries.get(source_id)
    
    def get_all_summaries(self) -> Dict[str, SourceHealthSummary]:
        """Get health summaries for all sources"""
        return self._summaries.copy()
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get aggregated dashboard data"""
        summaries = list(self._summaries.values())
        
        healthy_count = sum(1 for s in summaries if s.current_status == HealthStatus.HEALTHY)
        degraded_count = sum(1 for s in summaries if s.current_status == HealthStatus.DEGRADED)
        unhealthy_count = sum(1 for s in summaries if s.current_status == HealthStatus.UNHEALTHY)
        unknown_count = sum(1 for s in summaries if s.current_status == HealthStatus.UNKNOWN)
        
        enabled_sources = [s for s in summaries if s.enabled]
        
        avg_uptime = 0.0
        if enabled_sources:
            avg_uptime = sum(s.uptime_percentage for s in enabled_sources) / len(enabled_sources)
        
        return {
            "summary": {
                "total_sources": len(summaries),
                "enabled_sources": len(enabled_sources),
                "healthy": healthy_count,
                "degraded": degraded_count,
                "unhealthy": unhealthy_count,
                "unknown": unknown_count,
                "average_uptime_percentage": round(avg_uptime, 2)
            },
            "sources": [s.to_dict() for s in summaries],
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def get_history(self, source_id: str, limit: int = 50) -> List[Dict]:
        """Get health check history for a source"""
        history = self._history.get(source_id, deque())
        return [check.to_dict() for check in list(history)[-limit:]]
    
    def is_source_available(self, source_id: str) -> bool:
        """Check if a source should be used (circuit breaker)"""
        summary = self._summaries.get(source_id)
        if not summary:
            return True  # Unknown sources default to available
        
        # Circuit breaker: disable if too many consecutive failures
        if summary.consecutive_failures >= self.CONSECUTIVE_FAILURES_CRITICAL:
            return False
        
        return True
    
    async def start_background_monitoring(self):
        """Start background health monitoring loop"""
        if self._running:
            return
        
        self._running = True
        
        async def monitor_loop():
            while self._running:
                try:
                    await self.check_all_sources()
                except Exception as e:
                    logger.error(f"Health monitoring error: {e}")
                
                await asyncio.sleep(self._check_interval)
        
        self._check_task = asyncio.create_task(monitor_loop())
        logger.info(f"Started health monitoring (interval: {self._check_interval}s)")
    
    def stop_background_monitoring(self):
        """Stop background health monitoring"""
        self._running = False
        if self._check_task:
            self._check_task.cancel()
            self._check_task = None
        logger.info("Stopped health monitoring")
    
    def enable_source(self, source_id: str):
        """Enable a source for health monitoring"""
        if source_id in self._summaries:
            self._summaries[source_id].enabled = True
    
    def disable_source(self, source_id: str):
        """Disable a source from health monitoring"""
        if source_id in self._summaries:
            self._summaries[source_id].enabled = False
    
    def reset_source_stats(self, source_id: str):
        """Reset health statistics for a source"""
        if source_id in self._summaries:
            self._summaries[source_id] = SourceHealthSummary(
                source_id=source_id,
                current_status=HealthStatus.UNKNOWN,
                enabled=self._summaries[source_id].enabled
            )
        if source_id in self._history:
            self._history[source_id].clear()
