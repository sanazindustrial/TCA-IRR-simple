"""
Cost Tracker Module
Tracks API usage, costs, and provides budget monitoring for external data sources
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json
from pathlib import Path
from collections import defaultdict

logger = logging.getLogger(__name__)


class PricingModel(str, Enum):
    """Pricing model types"""
    FREE = "free"
    FREEMIUM = "freemium"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    PAY_PER_USE = "pay_per_use"


@dataclass
class SourcePricing:
    """Pricing configuration for a source"""
    source_id: str
    pricing_model: PricingModel
    monthly_cost: float = 0.0
    cost_per_call: float = 0.0
    free_tier_limit: int = 0  # Free calls per month
    overage_cost: float = 0.0  # Cost per call over limit
    notes: str = ""


@dataclass
class UsageRecord:
    """Single API usage record"""
    source_id: str
    timestamp: datetime
    calls: int = 1
    success: bool = True
    latency_ms: float = 0.0
    endpoint: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "timestamp": self.timestamp.isoformat(),
            "calls": self.calls,
            "success": self.success,
            "latency_ms": round(self.latency_ms, 2),
            "endpoint": self.endpoint
        }


@dataclass
class MonthlyUsageSummary:
    """Monthly usage summary for a source"""
    source_id: str
    year: int
    month: int
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_latency_ms: float = 0.0
    estimated_cost: float = 0.0
    within_free_tier: bool = True
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "period": f"{self.year}-{self.month:02d}",
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "avg_latency_ms": round(self.total_latency_ms / max(self.total_calls, 1), 2),
            "estimated_cost": round(self.estimated_cost, 2),
            "within_free_tier": self.within_free_tier
        }


class CostTracker:
    """
    Tracks API usage and costs across all external data sources.
    Provides cost estimation, budget alerts, and usage analytics.
    """
    
    def __init__(
        self,
        config_path: Optional[str] = None,
        monthly_budget: float = 500.0  # Default monthly budget
    ):
        self._pricing: Dict[str, SourcePricing] = {}
        self._usage: Dict[str, List[UsageRecord]] = defaultdict(list)
        self._monthly_summaries: Dict[str, Dict[str, MonthlyUsageSummary]] = {}
        self._monthly_budget = monthly_budget
        self._budget_alerts: List[Dict] = []
        
        if config_path:
            self._load_pricing_from_config(config_path)
    
    def _load_pricing_from_config(self, config_path: str):
        """Load pricing info from external sources config"""
        try:
            path = Path(config_path)
            if path.exists():
                with open(path, 'r') as f:
                    config = json.load(f)
                
                for category in config.get("categories", []):
                    for source in category.get("sources", []):
                        source_id = source["id"]
                        pricing_model = source.get("pricing_model", "free")
                        
                        self._pricing[source_id] = SourcePricing(
                            source_id=source_id,
                            pricing_model=PricingModel(pricing_model),
                            monthly_cost=source.get("monthly_cost", 0.0),
                            notes=source.get("pricing_note", "")
                        )
                        
                logger.info(f"Loaded pricing for {len(self._pricing)} sources")
        except Exception as e:
            logger.error(f"Failed to load pricing config: {e}")
    
    def set_pricing(self, pricing: SourcePricing):
        """Set or update pricing for a source"""
        self._pricing[pricing.source_id] = pricing
    
    def set_monthly_budget(self, budget: float):
        """Set monthly budget threshold"""
        self._monthly_budget = budget
    
    def record_usage(
        self,
        source_id: str,
        success: bool = True,
        latency_ms: float = 0.0,
        endpoint: str = "",
        calls: int = 1
    ):
        """Record API usage for a source"""
        record = UsageRecord(
            source_id=source_id,
            timestamp=datetime.utcnow(),
            calls=calls,
            success=success,
            latency_ms=latency_ms,
            endpoint=endpoint
        )
        
        self._usage[source_id].append(record)
        
        # Update monthly summary
        self._update_monthly_summary(record)
        
        # Check budget
        self._check_budget_alert()
    
    def _get_month_key(self, dt: datetime) -> str:
        """Get month key in YYYY-MM format"""
        return f"{dt.year}-{dt.month:02d}"
    
    def _update_monthly_summary(self, record: UsageRecord):
        """Update monthly usage summary"""
        now = record.timestamp
        month_key = self._get_month_key(now)
        source_id = record.source_id
        
        if source_id not in self._monthly_summaries:
            self._monthly_summaries[source_id] = {}
        
        if month_key not in self._monthly_summaries[source_id]:
            self._monthly_summaries[source_id][month_key] = MonthlyUsageSummary(
                source_id=source_id,
                year=now.year,
                month=now.month
            )
        
        summary = self._monthly_summaries[source_id][month_key]
        summary.total_calls += record.calls
        summary.total_latency_ms += record.latency_ms
        
        if record.success:
            summary.successful_calls += record.calls
        else:
            summary.failed_calls += record.calls
        
        # Calculate estimated cost
        pricing = self._pricing.get(source_id)
        if pricing:
            if pricing.pricing_model == PricingModel.FREE:
                summary.estimated_cost = 0.0
                summary.within_free_tier = True
            elif pricing.pricing_model == PricingModel.FREEMIUM:
                if summary.total_calls <= pricing.free_tier_limit:
                    summary.estimated_cost = 0.0
                    summary.within_free_tier = True
                else:
                    overage = summary.total_calls - pricing.free_tier_limit
                    summary.estimated_cost = overage * pricing.overage_cost
                    summary.within_free_tier = False
            elif pricing.pricing_model == PricingModel.PAY_PER_USE:
                summary.estimated_cost = summary.total_calls * pricing.cost_per_call
                summary.within_free_tier = False
            else:
                # Premium/Enterprise - monthly flat fee
                summary.estimated_cost = pricing.monthly_cost
                summary.within_free_tier = False
    
    def _check_budget_alert(self):
        """Check if we're approaching budget limit"""
        now = datetime.utcnow()
        month_key = self._get_month_key(now)
        
        total_cost = self.get_current_month_total_cost()
        
        if total_cost >= self._monthly_budget:
            self._budget_alerts.append({
                "type": "budget_exceeded",
                "timestamp": now.isoformat(),
                "budget": self._monthly_budget,
                "current_cost": total_cost,
                "message": f"Monthly budget exceeded: ${total_cost:.2f} / ${self._monthly_budget:.2f}"
            })
        elif total_cost >= self._monthly_budget * 0.8:
            self._budget_alerts.append({
                "type": "budget_warning",
                "timestamp": now.isoformat(),
                "budget": self._monthly_budget,
                "current_cost": total_cost,
                "message": f"Approaching budget limit: ${total_cost:.2f} / ${self._monthly_budget:.2f}"
            })
    
    def get_current_month_total_cost(self) -> float:
        """Get total estimated cost for current month"""
        now = datetime.utcnow()
        month_key = self._get_month_key(now)
        
        total = 0.0
        for source_id, months in self._monthly_summaries.items():
            if month_key in months:
                total += months[month_key].estimated_cost
        
        # Add fixed monthly costs for enabled sources
        for source_id, pricing in self._pricing.items():
            if pricing.monthly_cost > 0 and pricing.pricing_model != PricingModel.FREE:
                total += pricing.monthly_cost
        
        return total
    
    def get_source_usage_summary(
        self,
        source_id: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Optional[MonthlyUsageSummary]:
        """Get usage summary for a specific source and month"""
        if year is None or month is None:
            now = datetime.utcnow()
            year = now.year
            month = now.month
        
        month_key = f"{year}-{month:02d}"
        
        if source_id in self._monthly_summaries:
            return self._monthly_summaries[source_id].get(month_key)
        return None
    
    def get_all_usage_summaries(
        self,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Dict[str, MonthlyUsageSummary]:
        """Get usage summaries for all sources for a given month"""
        if year is None or month is None:
            now = datetime.utcnow()
            year = now.year
            month = now.month
        
        month_key = f"{year}-{month:02d}"
        
        summaries = {}
        for source_id, months in self._monthly_summaries.items():
            if month_key in months:
                summaries[source_id] = months[month_key]
        
        return summaries
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive cost dashboard data"""
        now = datetime.utcnow()
        current_month = self._get_month_key(now)
        
        # Get current month summaries
        current_summaries = self.get_all_usage_summaries()
        
        # Calculate totals
        total_calls = sum(s.total_calls for s in current_summaries.values())
        successful_calls = sum(s.successful_calls for s in current_summaries.values())
        failed_calls = sum(s.failed_calls for s in current_summaries.values())
        
        # Get costs by category
        costs_by_source = {}
        for source_id, summary in current_summaries.items():
            pricing = self._pricing.get(source_id)
            costs_by_source[source_id] = {
                "calls": summary.total_calls,
                "estimated_cost": round(summary.estimated_cost, 2),
                "pricing_model": pricing.pricing_model.value if pricing else "unknown",
                "within_free_tier": summary.within_free_tier
            }
        
        # Get fixed monthly costs
        fixed_costs = {}
        for source_id, pricing in self._pricing.items():
            if pricing.monthly_cost > 0:
                fixed_costs[source_id] = pricing.monthly_cost
        
        total_estimated_cost = self.get_current_month_total_cost()
        budget_remaining = self._monthly_budget - total_estimated_cost
        budget_usage_percent = (total_estimated_cost / self._monthly_budget) * 100 if self._monthly_budget > 0 else 0
        
        return {
            "period": current_month,
            "summary": {
                "total_api_calls": total_calls,
                "successful_calls": successful_calls,
                "failed_calls": failed_calls,
                "success_rate": round((successful_calls / max(total_calls, 1)) * 100, 2),
                "total_estimated_cost": round(total_estimated_cost, 2),
                "monthly_budget": self._monthly_budget,
                "budget_remaining": round(budget_remaining, 2),
                "budget_usage_percent": round(budget_usage_percent, 2)
            },
            "by_source": costs_by_source,
            "fixed_monthly_costs": fixed_costs,
            "recent_alerts": self._budget_alerts[-10:],
            "last_updated": now.isoformat()
        }
    
    def get_cost_projection(self, days: int = 30) -> Dict[str, Any]:
        """Project costs based on current usage patterns"""
        now = datetime.utcnow()
        day_of_month = now.day
        
        if day_of_month == 0:
            return {"error": "Cannot project on first day of month"}
        
        current_cost = self.get_current_month_total_cost()
        daily_avg = current_cost / day_of_month
        
        # Project to end of month
        days_in_month = 30  # Simplified
        projected_monthly = daily_avg * days_in_month
        
        return {
            "current_cost": round(current_cost, 2),
            "days_elapsed": day_of_month,
            "daily_average": round(daily_avg, 2),
            "projected_monthly_cost": round(projected_monthly, 2),
            "budget": self._monthly_budget,
            "projected_over_budget": projected_monthly > self._monthly_budget,
            "projected_savings": round(self._monthly_budget - projected_monthly, 2)
        }
    
    def get_top_consumers(self, limit: int = 10) -> List[Dict]:
        """Get top API consumers by call count"""
        now = datetime.utcnow()
        summaries = self.get_all_usage_summaries()
        
        sorted_sources = sorted(
            summaries.items(),
            key=lambda x: x[1].total_calls,
            reverse=True
        )[:limit]
        
        return [
            {
                "source_id": source_id,
                "total_calls": summary.total_calls,
                "estimated_cost": round(summary.estimated_cost, 2)
            }
            for source_id, summary in sorted_sources
        ]
    
    def get_usage_history(
        self,
        source_id: str,
        days: int = 30
    ) -> List[Dict]:
        """Get daily usage history for a source"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        usage_records = self._usage.get(source_id, [])
        recent = [r for r in usage_records if r.timestamp >= cutoff]
        
        # Aggregate by day
        daily: Dict[str, Dict] = {}
        for record in recent:
            day_key = record.timestamp.strftime("%Y-%m-%d")
            if day_key not in daily:
                daily[day_key] = {"date": day_key, "calls": 0, "successful": 0, "failed": 0}
            
            daily[day_key]["calls"] += record.calls
            if record.success:
                daily[day_key]["successful"] += record.calls
            else:
                daily[day_key]["failed"] += record.calls
        
        return list(daily.values())
    
    def clear_budget_alerts(self):
        """Clear budget alerts"""
        self._budget_alerts.clear()
    
    def export_report(self, year: int, month: int) -> Dict[str, Any]:
        """Export detailed cost report for a month"""
        month_key = f"{year}-{month:02d}"
        summaries = {}
        
        for source_id, months in self._monthly_summaries.items():
            if month_key in months:
                summaries[source_id] = months[month_key].to_dict()
        
        total_cost = sum(
            s.estimated_cost 
            for source_id, months in self._monthly_summaries.items()
            if month_key in months
            for s in [months[month_key]]
        )
        
        # Add fixed costs
        for source_id, pricing in self._pricing.items():
            if pricing.monthly_cost > 0:
                total_cost += pricing.monthly_cost
        
        return {
            "report_period": month_key,
            "generated_at": datetime.utcnow().isoformat(),
            "total_estimated_cost": round(total_cost, 2),
            "budget": self._monthly_budget,
            "sources": summaries,
            "pricing_config": {
                source_id: {
                    "model": p.pricing_model.value,
                    "monthly_cost": p.monthly_cost,
                    "notes": p.notes
                }
                for source_id, p in self._pricing.items()
            }
        }
