"""
Dashboard endpoints for analytics and statistics
"""

import logging
import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import asyncpg

try:
    import psutil
    _HAS_PSUTIL = True
except ImportError:
    _HAS_PSUTIL = False

from app.db import get_db
from .auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics and metrics"""
    try:
        # Mock dashboard statistics
        stats_data = {
            "user_metrics": {
                "total_users": 150,
                "active_users": 45,
                "new_users_this_month": 12
            },
            "analysis_metrics": {
                "total_analyses": 89,
                "completed_analyses": 76,
                "pending_analyses": 8,
                "failed_analyses": 5
            },
            "company_metrics": {
                "total_companies": 234,
                "companies_analyzed": 89,
                "avg_analysis_time": "45 minutes"
            },
            "system_metrics": {
                "uptime": "99.5%",
                "avg_response_time": "250ms",
                "error_rate": "0.2%"
            },
            "recent_activity": [{
                "type": "analysis_completed",
                "company": "TechCorp Inc",
                "timestamp": "2024-01-20T09:45:00Z"
            }, {
                "type": "user_registered",
                "user": "john.doe",
                "timestamp": "2024-01-20T09:30:00Z"
            }],
            "updated_at":
            "2024-01-20T10:00:00Z"
        }

        return stats_data

    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to retrieve dashboard statistics")


@router.get("/charts", response_model=Dict[str, Any])
async def get_dashboard_charts(timeframe: str = "30d",
                               db: asyncpg.Connection = Depends(get_db),
                               current_user: dict = Depends(get_current_user)):
    """Get dashboard chart data"""
    try:
        # Mock chart data
        chart_data = {
            "analysis_trend": {
                "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
                "datasets": [{
                    "label": "Completed Analyses",
                    "data": [12, 18, 15, 22]
                }]
            },
            "score_distribution": {
                "labels": ["0-20", "21-40", "41-60", "61-80", "81-100"],
                "data": [5, 12, 25, 35, 23]
            },
            "user_activity": {
                "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "data": [45, 52, 48, 61, 55, 32, 28]
            },
            "generated_at": "2024-01-20T10:00:00Z"
        }

        return chart_data

    except Exception as e:
        logger.error(f"Dashboard charts error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to retrieve chart data")


@router.get("/health", response_model=Dict[str, Any])
async def get_dashboard_health(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get real-time system health metrics."""
    # System metrics via psutil
    cpu_percent = psutil.cpu_percent(interval=0.1) if _HAS_PSUTIL else 0.0
    memory = psutil.virtual_memory() if _HAS_PSUTIL else None
    disk = psutil.disk_usage("/") if _HAS_PSUTIL else None
    net_io = psutil.net_io_counters() if _HAS_PSUTIL else None
    boot_time = psutil.boot_time() if _HAS_PSUTIL else time.time()
    uptime_seconds = int(time.time() - boot_time)

    # DB counts
    try:
        user_count = await db.fetchval("SELECT COUNT(*) FROM users") or 0
    except Exception:
        user_count = 0
    try:
        analysis_count = await db.fetchval("SELECT COUNT(*) FROM analyses") or 0
    except Exception:
        analysis_count = 0
    try:
        company_count = await db.fetchval("SELECT COUNT(*) FROM companies") or 0
    except Exception:
        company_count = 0
    try:
        pending_analyses = await db.fetchval(
            "SELECT COUNT(*) FROM analyses WHERE status IN ('pending','processing')"
        ) or 0
    except Exception:
        pending_analyses = 0

    # Determine overall status
    mem_pct = memory.percent if memory else 0.0
    disk_pct = (disk.used / disk.total * 100) if disk else 0.0
    if cpu_percent > 90 or mem_pct > 90:
        health_status = "degraded"
    else:
        health_status = "healthy"

    return {
        "status": health_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": uptime_seconds,
        "cpu": {
            "percent": round(cpu_percent, 1),
        },
        "memory": {
            "percent": round(mem_pct, 1),
            "total_mb": round(memory.total / 1024 / 1024, 1) if memory else 0,
            "used_mb": round(memory.used / 1024 / 1024, 1) if memory else 0,
            "available_mb": round(memory.available / 1024 / 1024, 1) if memory else 0,
        },
        "disk": {
            "percent": round(disk_pct, 1),
            "total_gb": round(disk.total / 1024 / 1024 / 1024, 1) if disk else 0,
            "used_gb": round(disk.used / 1024 / 1024 / 1024, 1) if disk else 0,
            "free_gb": round(disk.free / 1024 / 1024 / 1024, 1) if disk else 0,
        },
        "network": {
            "bytes_sent": net_io.bytes_sent if net_io else 0,
            "bytes_recv": net_io.bytes_recv if net_io else 0,
        },
        "database": {
            "status": "connected",
            "user_count": user_count,
            "analysis_count": analysis_count,
            "company_count": company_count,
            "pending_analyses": pending_analyses,
        },
    }
