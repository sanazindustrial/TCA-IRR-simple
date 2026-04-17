"""
Cost Management API endpoints for tracking usage, AI costs, and billing
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
import asyncpg

from app.db import get_db
from .auth import get_current_user

logger = logging.getLogger(__name__)


def require_admin(current_user: dict = Depends(get_current_user)):
    """Require admin role for cost management endpoints"""
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for cost management"
        )
    return current_user


router = APIRouter()


async def _table_exists(db: asyncpg.Connection, table_name: str) -> bool:
    """Check if a table exists in the public schema of the database"""
    try:
        result = await db.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = $1
            )
        """, table_name)
        return bool(result)
    except Exception:
        return False


@router.get("/summary")
async def get_cost_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get cost summary for the specified date range"""
    try:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.utcnow()
        start_dt = datetime.strptime(start_date, "%Y-%m-%d") if start_date else end_dt - timedelta(days=30)

        use_analyses_table = await _table_exists(db, 'company_analyses')
        if use_analyses_table:
            analysis_stats = await db.fetchrow("""
                SELECT
                    COUNT(*) as total_analyses,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
                FROM company_analyses
                WHERE created_at >= $1 AND created_at <= $2
            """, start_dt, end_dt)
        else:
            fallback = await db.fetchrow("""
                SELECT COUNT(*) as total_analyses, COUNT(DISTINCT user_id) as unique_users
                FROM audit_logs
                WHERE created_at >= $1 AND created_at <= $2
            """, start_dt, end_dt)
            analysis_stats = {
                'total_analyses': fallback['total_analyses'] if fallback else 0,
                'unique_users': fallback['unique_users'] if fallback else 0,
                'completed': 0,
            }

        report_stats = {'total_reports': 0, 'triage_reports': 0, 'dd_reports': 0}
        if await _table_exists(db, 'reports'):
            rs = await db.fetchrow("""
                SELECT
                    COUNT(*) as total_reports,
                    COUNT(CASE WHEN report_type = 'triage' THEN 1 END) as triage_reports,
                    COUNT(CASE WHEN report_type = 'due_diligence' THEN 1 END) as dd_reports
                FROM reports
                WHERE generated_at >= $1 AND generated_at <= $2
            """, start_dt, end_dt)
            if rs:
                report_stats = dict(rs)

        if use_analyses_table:
            user_activity = await db.fetch("""
                SELECT u.username, u.email, COUNT(ca.id) as analysis_count
                FROM users u
                LEFT JOIN company_analyses ca ON ca.user_id = u.id
                    AND ca.created_at >= $1 AND ca.created_at <= $2
                WHERE u.is_active = true
                GROUP BY u.id, u.username, u.email
                ORDER BY analysis_count DESC
                LIMIT 10
            """, start_dt, end_dt)
        else:
            user_activity = await db.fetch("""
                SELECT u.username, u.email, COUNT(al.id) as analysis_count
                FROM users u
                LEFT JOIN audit_logs al ON al.user_id = u.id
                    AND al.created_at >= $1 AND al.created_at <= $2
                WHERE u.is_active = true
                GROUP BY u.id, u.username, u.email
                ORDER BY analysis_count DESC
                LIMIT 10
            """, start_dt, end_dt)

        total_analyses = analysis_stats['total_analyses'] if analysis_stats else 0
        ai_cost_per_analysis = 0.45
        total_ai_cost = total_analyses * ai_cost_per_analysis

        breakdown = [
            {"category": "AI Analysis (GPT-4)", "cost": round(total_ai_cost * 0.80, 2), "percentage": 80.0, "executions": total_analyses},
            {"category": "Embeddings (Ada)", "cost": round(total_ai_cost * 0.12, 2), "percentage": 12.0, "executions": total_analyses * 3},
            {"category": "External Data APIs", "cost": round(total_analyses * 0.10, 2), "percentage": 5.0, "executions": total_analyses * 5},
            {"category": "Infrastructure", "cost": round(total_analyses * 0.05, 2), "percentage": 3.0, "executions": total_analyses * 10},
        ]

        if use_analyses_table:
            daily_trends = await db.fetch("""
                SELECT DATE(created_at) as date, COUNT(*) as analyses
                FROM company_analyses
                WHERE created_at >= $1 AND created_at <= $2
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 7
            """, start_dt, end_dt)
        else:
            daily_trends = await db.fetch("""
                SELECT DATE(created_at) as date, COUNT(*) as analyses
                FROM audit_logs
                WHERE created_at >= $1 AND created_at <= $2
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 7
            """, start_dt, end_dt)

        trends = [
            {"date": row['date'].strftime("%m/%d/%Y"), "cost": round(row['analyses'] * ai_cost_per_analysis, 2)}
            for row in daily_trends
        ]

        ai_breakdown = {
            "totalAiCost": round(total_ai_cost, 2),
            "costPerAnalysis": ai_cost_per_analysis,
            "inputTokens": total_analyses * 2500,
            "outputTokens": total_analyses * 625,
            "models": [
                {"name": "Analysis (GPT-4)", "cost": round(total_ai_cost * 0.80, 2), "percentage": 80.0},
                {"name": "Embedding (Ada)", "cost": round(total_ai_cost * 0.12, 2), "percentage": 12.0},
                {"name": "Fine-Tuning", "cost": round(total_ai_cost * 0.08, 2), "percentage": 8.0},
            ],
            "costByUser": [
                {
                    "name": row['username'],
                    "cost": round(row['analysis_count'] * ai_cost_per_analysis, 2),
                    "percentage": round((row['analysis_count'] / max(total_analyses, 1)) * 100, 1),
                }
                for row in user_activity[:5]
            ],
            "costByReportType": [
                {"name": "Triage Reports", "cost": round(report_stats.get('triage_reports', 0) * ai_cost_per_analysis, 2), "percentage": 70.0},
                {"name": "Due Diligence", "cost": round(report_stats.get('dd_reports', 0) * ai_cost_per_analysis * 2, 2), "percentage": 30.0},
            ],
        }

        return {
            "totalCost": round(total_ai_cost + 5.0, 2),
            "totalRequests": total_analyses,
            "billedUsers": analysis_stats['unique_users'] if analysis_stats else 0,
            "dailyAverage": round((total_ai_cost + 5.0) / 30, 2),
            "breakdown": breakdown,
            "trends": trends,
            "aiBreakdown": ai_breakdown,
            "dateRange": {"start": start_dt.strftime("%Y-%m-%d"), "end": end_dt.strftime("%Y-%m-%d")},
        }

    except Exception as e:
        logger.error(f"Cost summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve cost summary: {str(e)}",
        )


@router.get("/summary/public")
async def get_public_cost_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: asyncpg.Connection = Depends(get_db),
):
    """Public cost summary - no authentication required"""
    try:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.utcnow()
        start_dt = datetime.strptime(start_date, "%Y-%m-%d") if start_date else end_dt - timedelta(days=30)

        if await _table_exists(db, 'company_analyses'):
            total = await db.fetchval(
                "SELECT COUNT(*) FROM company_analyses WHERE created_at >= $1 AND created_at <= $2",
                start_dt, end_dt) or 0
        else:
            total = await db.fetchval(
                "SELECT COUNT(*) FROM audit_logs WHERE created_at >= $1 AND created_at <= $2",
                start_dt, end_dt) or 0

        ai_cost = round(total * 0.45, 2)
        return {
            "totalCost": round(ai_cost + 5.0, 2),
            "totalRequests": total,
            "billedUsers": 0,
            "dailyAverage": round((ai_cost + 5.0) / 30, 2),
            "breakdown": [
                {"category": "AI Analysis (GPT-4)", "cost": round(ai_cost * 0.80, 2), "percentage": 80.0, "executions": total},
                {"category": "Embeddings (Ada)", "cost": round(ai_cost * 0.12, 2), "percentage": 12.0, "executions": total * 3},
                {"category": "External Data APIs", "cost": round(total * 0.10, 2), "percentage": 5.0, "executions": total * 5},
                {"category": "Infrastructure", "cost": round(total * 0.05, 2), "percentage": 3.0, "executions": total * 10},
            ],
            "trends": [],
            "aiBreakdown": {
                "totalAiCost": ai_cost,
                "costPerAnalysis": 0.45,
                "inputTokens": total * 2500,
                "outputTokens": total * 625,
                "models": [],
                "costByUser": [],
                "costByReportType": [],
            },
            "dateRange": {"start": start_dt.strftime("%Y-%m-%d"), "end": end_dt.strftime("%Y-%m-%d")},
        }
    except Exception as e:
        logger.error(f"Public cost summary error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve cost summary")


@router.get("/usage")
async def get_usage_details(
    time_period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y"),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Get detailed usage statistics"""
    try:
        now = datetime.utcnow()
        days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(time_period, 30)
        start_date = now - timedelta(days=days)

        usage_by_feature: List[Dict[str, Any]] = []

        if await _table_exists(db, 'company_analyses'):
            count = await db.fetchval(
                "SELECT COUNT(*) FROM company_analyses WHERE created_at >= $1", start_date) or 0
            usage_by_feature.append({"feature": "Analysis", "usage_count": count})

        try:
            auth_count = await db.fetchval(
                "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'LOGIN' AND created_at >= $1",
                start_date) or 0
            usage_by_feature.append({"feature": "Authentication", "usage_count": auth_count})
        except Exception:
            pass

        if await _table_exists(db, 'reports'):
            try:
                rep_count = await db.fetchval(
                    "SELECT COUNT(*) FROM reports WHERE generated_at >= $1", start_date) or 0
            except Exception:
                try:
                    rep_count = await db.fetchval(
                        "SELECT COUNT(*) FROM reports WHERE created_at >= $1", start_date) or 0
                except Exception:
                    rep_count = 0
            usage_by_feature.append({"feature": "Report Generation", "usage_count": rep_count})

        return {
            "period": time_period,
            "startDate": start_date.isoformat(),
            "endDate": now.isoformat(),
            "usageByFeature": usage_by_feature,
            "limits": {"analysesPerMonth": 1000, "usersIncluded": 50, "storageGB": 100},
        }

    except Exception as e:
        logger.error(f"Usage details error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage details",
        )


@router.get("/budget")
async def get_budget_status(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Get budget allocation and spending status"""
    try:
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        if await _table_exists(db, 'company_analyses'):
            monthly_analyses = await db.fetchval(
                "SELECT COUNT(*) FROM company_analyses WHERE created_at >= $1",
                start_of_month) or 0
        else:
            monthly_analyses = await db.fetchval(
                "SELECT COUNT(*) FROM audit_logs WHERE created_at >= $1",
                start_of_month) or 0

        monthly_cost = monthly_analyses * 0.45
        monthly_budget = 500.00

        return {
            "monthlyBudget": monthly_budget,
            "currentSpend": round(monthly_cost, 2),
            "remainingBudget": round(monthly_budget - monthly_cost, 2),
            "percentUsed": round((monthly_cost / monthly_budget) * 100, 1),
            "projectedMonthEnd": round(monthly_cost * (30 / now.day), 2),
            "alerts": [
                {"type": "warning", "message": "Approaching 80% of budget"}
                if monthly_cost > monthly_budget * 0.8 else None
            ],
            "recommendations": [
                "Consider batch processing for non-urgent analyses",
                "Review user access to optimize costs",
            ],
        }

    except Exception as e:
        logger.error(f"Budget status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve budget status",
        )
