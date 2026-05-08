"""
Dashboard endpoints for analytics and statistics
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import asyncpg

from app.db import get_db
from .auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get dashboard statistics and metrics"""
    try:
        users = await db.fetchrow(
            """
            SELECT COUNT(*) AS total_users,
                   COUNT(*) FILTER (WHERE is_active = true) AS active_users,
                   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_this_month
            FROM users
            """
        )

        analyses = await db.fetchrow(
            """
            SELECT COUNT(*) AS total_analyses,
                   COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'completed') AS completed_analyses,
                   COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) IN ('pending', 'processing', 'running')) AS pending_analyses,
                   COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) IN ('failed', 'error')) AS failed_analyses
            FROM company_analyses
            """
        )

        companies = await db.fetchrow(
            """
            SELECT COUNT(*) AS total_companies
            FROM companies
            """
        )

        companies_analyzed = await db.fetchval(
            """
            SELECT COUNT(DISTINCT company_id)
            FROM company_analyses
            WHERE company_id IS NOT NULL
            """
        )

        recent = await db.fetch(
            """
            SELECT COALESCE(company_name, 'Unknown Company') AS company_name,
                   created_at,
                   COALESCE(status, 'unknown') AS status
            FROM company_analyses
            ORDER BY created_at DESC
            LIMIT 5
            """
        )

        stats_data = {
            "user_metrics": {
                "total_users": int((users or {}).get("total_users", 0) or 0),
                "active_users": int((users or {}).get("active_users", 0) or 0),
                "new_users_this_month": int((users or {}).get("new_users_this_month", 0) or 0),
            },
            "analysis_metrics": {
                "total_analyses": int((analyses or {}).get("total_analyses", 0) or 0),
                "completed_analyses": int((analyses or {}).get("completed_analyses", 0) or 0),
                "pending_analyses": int((analyses or {}).get("pending_analyses", 0) or 0),
                "failed_analyses": int((analyses or {}).get("failed_analyses", 0) or 0),
            },
            "company_metrics": {
                "total_companies": int((companies or {}).get("total_companies", 0) or 0),
                "companies_analyzed": int(companies_analyzed or 0),
                "avg_analysis_time": "n/a",
            },
            "system_metrics": {
                "uptime": "n/a",
                "avg_response_time": "n/a",
                "error_rate": "n/a",
            },
            "recent_activity": [
                {
                    "type": "analysis_status",
                    "company": row.get("company_name", "Unknown Company"),
                    "status": row.get("status", "unknown"),
                    "timestamp": row["created_at"].isoformat() if row.get("created_at") else datetime.utcnow().isoformat(),
                }
                for row in recent
            ],
            "updated_at": datetime.utcnow().isoformat(),
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
        if timeframe == "7d":
            days = 7
        elif timeframe == "90d":
            days = 90
        else:
            days = 30

        start_dt = datetime.utcnow() - timedelta(days=days)
        trend_rows = await db.fetch(
            """
            SELECT DATE(created_at) AS day,
                   COUNT(*) AS cnt
            FROM company_analyses
            WHERE created_at >= $1
            GROUP BY DATE(created_at)
            ORDER BY day
            """,
            start_dt,
        )

        labels = [r["day"].strftime("%m/%d") for r in trend_rows]
        values = [int(r["cnt"] or 0) for r in trend_rows]

        chart_data = {
            "analysis_trend": {
                "labels": labels,
                "datasets": [{
                    "label": "Completed Analyses",
                    "data": values,
                }]
            },
            "score_distribution": {
                "labels": ["0-20", "21-40", "41-60", "61-80", "81-100"],
                "data": [0, 0, 0, 0, 0],
            },
            "user_activity": {
                "labels": labels,
                "data": values,
            },
            "generated_at": datetime.utcnow().isoformat(),
        }

        return chart_data

    except Exception as e:
        logger.error(f"Dashboard charts error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to retrieve chart data")
