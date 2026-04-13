"""
Dashboard endpoints for analytics and statistics
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import asyncpg

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
