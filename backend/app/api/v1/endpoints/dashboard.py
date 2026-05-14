"""
Dashboard endpoints for analytics and statistics
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
import asyncpg

from app.db import get_db
from .auth import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


async def _get_table_columns(db: asyncpg.Connection, table_name: str) -> List[str]:
    rows = await db.fetch(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
        ORDER BY ordinal_position
        """,
        table_name,
    )
    return [row["column_name"] for row in rows]


def _pick_column(columns: List[str], candidates: List[str]) -> Optional[str]:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    return None


async def _pick_analysis_table(db: asyncpg.Connection) -> tuple[Optional[str], List[str]]:
    company_columns = await _get_table_columns(db, "company_analyses")
    if company_columns:
        return "company_analyses", company_columns

    evaluation_columns = await _get_table_columns(db, "evaluations_simple")
    if evaluation_columns:
        return "evaluations_simple", evaluation_columns

    return None, []


def _to_dict(row: Optional[asyncpg.Record]) -> Dict[str, Any]:
    return dict(row) if row else {}


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get dashboard statistics and metrics"""
    try:
        try:
            users = await db.fetchrow(
                """
                SELECT COUNT(*) AS total_users,
                       COUNT(*) FILTER (WHERE is_active = true) AS active_users,
                       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_this_month
                FROM users
                """
            )
        except Exception:
            users = None
        users_data = _to_dict(users)

        analysis_table, analysis_columns = await _pick_analysis_table(db)
        analysis_status_column = _pick_column(analysis_columns, ["status", "analysis_status"])
        analysis_company_id_column = _pick_column(analysis_columns, ["company_id"])
        analysis_company_name_column = _pick_column(analysis_columns, ["company_name", "title"])
        analysis_created_column = _pick_column(analysis_columns, ["created_at", "generated_at", "updated_at"])

        analyses = None
        analyses_data: Dict[str, Any] = {}
        companies_analyzed = 0
        recent = []

        if analysis_table:
            if analysis_status_column:
                analyses = await db.fetchrow(
                    f"""
                    SELECT COUNT(*) AS total_analyses,
                           COUNT(*) FILTER (WHERE LOWER(COALESCE({analysis_status_column}, '')) = 'completed') AS completed_analyses,
                           COUNT(*) FILTER (WHERE LOWER(COALESCE({analysis_status_column}, '')) IN ('pending', 'processing', 'running')) AS pending_analyses,
                           COUNT(*) FILTER (WHERE LOWER(COALESCE({analysis_status_column}, '')) IN ('failed', 'error')) AS failed_analyses
                    FROM {analysis_table}
                    """
                )
            else:
                analyses = await db.fetchrow(
                    f"SELECT COUNT(*) AS total_analyses, 0 AS completed_analyses, 0 AS pending_analyses, 0 AS failed_analyses FROM {analysis_table}"
                )
            if analysis_company_id_column:
                companies_analyzed = int(
                    await db.fetchval(
                        f"SELECT COUNT(DISTINCT {analysis_company_id_column}) FROM {analysis_table} WHERE {analysis_company_id_column} IS NOT NULL"
                    )
                    or 0
                )
            elif analysis_company_name_column:
                companies_analyzed = int(
                    await db.fetchval(
                        f"SELECT COUNT(DISTINCT {analysis_company_name_column}) FROM {analysis_table} WHERE {analysis_company_name_column} IS NOT NULL"
                    )
                    or 0
                )

            company_expr = (
                f"COALESCE({analysis_company_name_column}, 'Unknown Company')"
                if analysis_company_name_column
                else "'Unknown Company'"
            )
            status_expr = (
                f"COALESCE({analysis_status_column}, 'unknown')"
                if analysis_status_column
                else "'unknown'"
            )
            created_expr = analysis_created_column or "NOW()"

            recent = await db.fetch(
                f"""
                SELECT {company_expr} AS company_name,
                       {created_expr} AS created_at,
                       {status_expr} AS status
                FROM {analysis_table}
                ORDER BY {created_expr} DESC NULLS LAST
                LIMIT 5
                """
            )

            analyses_data = _to_dict(analyses)

        try:
            companies = await db.fetchrow(
                """
                SELECT COUNT(*) AS total_companies
                FROM companies
                """
            )
        except Exception:
            companies = None
        companies_data = _to_dict(companies)

        stats_data = {
            "user_metrics": {
                "total_users": int(users_data.get("total_users", 0) or 0),
                "active_users": int(users_data.get("active_users", 0) or 0),
                "new_users_this_month": int(users_data.get("new_users_this_month", 0) or 0),
            },
            "analysis_metrics": {
                "total_analyses": int(analyses_data.get("total_analyses", 0) or 0),
                "completed_analyses": int(analyses_data.get("completed_analyses", 0) or 0),
                "pending_analyses": int(analyses_data.get("pending_analyses", 0) or 0),
                "failed_analyses": int(analyses_data.get("failed_analyses", 0) or 0),
            },
            "company_metrics": {
                "total_companies": int(companies_data.get("total_companies", 0) or 0),
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
                    "company": row_data.get("company_name", "Unknown Company"),
                    "status": row_data.get("status", "unknown"),
                    "timestamp": row_data["created_at"].isoformat() if row_data.get("created_at") else datetime.utcnow().isoformat(),
                }
                for row_data in (dict(row) for row in recent)
            ],
            "updated_at": datetime.utcnow().isoformat(),
        }

        return stats_data

    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to retrieve dashboard statistics")


@router.get("/health", response_model=Dict[str, Any])
async def get_dashboard_health(
    db: asyncpg.Connection = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """Lightweight health check for the dashboard surface."""
    try:
        await db.fetchval("SELECT 1")
        return {
            "status": "healthy",
            "database": {"status": "healthy", "connected": True},
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as exc:
        logger.error(f"Dashboard health check error: {exc}")
        return {
            "status": "degraded",
            "database": {"status": "unhealthy", "connected": False},
            "timestamp": datetime.utcnow().isoformat(),
        }


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
        analysis_table, analysis_columns = await _pick_analysis_table(db)
        created_column = _pick_column(analysis_columns, ["created_at", "generated_at", "updated_at"])

        trend_rows = []
        if analysis_table and created_column:
            trend_rows = await db.fetch(
                f"""
                SELECT DATE({created_column}) AS day,
                       COUNT(*) AS cnt
                FROM {analysis_table}
                WHERE {created_column} >= $1
                GROUP BY DATE({created_column})
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
