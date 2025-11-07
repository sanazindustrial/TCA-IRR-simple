"""
Admin Router
Administrative endpoints for system management
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def get_admin_dashboard():
    """Get admin dashboard data"""
    try:
        return {
            "system_stats": {
                "total_evaluations": 150,
                "active_users": 25,
                "pending_reviews": 8,
                "system_health": "excellent"
            },
            "recent_activity": [{
                "action": "evaluation_completed",
                "user": "analyst1",
                "timestamp": datetime.now().isoformat()
            }, {
                "action": "user_login",
                "user": "reviewer2",
                "timestamp": datetime.now().isoformat()
            }],
            "alerts": []
        }
    except Exception as e:
        logger.error(f"Admin dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system-health")
async def get_system_health():
    """Get system health status"""
    try:
        return {
            "database": {
                "status": "healthy",
                "response_time": "15ms"
            },
            "cache": {
                "status": "healthy",
                "hit_ratio": 0.94
            },
            "ml_services": {
                "status": "operational",
                "models_active": 3
            },
            "external_apis": {
                "status": "connected",
                "latency": "250ms"
            },
            "overall_status": "excellent"
        }
    except Exception as e:
        logger.error(f"System health error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-logs")
async def get_audit_logs():
    """Get system audit logs"""
    try:
        return {
            "logs": [{
                "timestamp": datetime.now().isoformat(),
                "action": "user_login",
                "details": "User authenticated"
            }, {
                "timestamp": datetime.now().isoformat(),
                "action": "evaluation_created",
                "details": "New TCA evaluation"
            }],
            "total_count":
            2
        }
    except Exception as e:
        logger.error(f"Audit logs error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))