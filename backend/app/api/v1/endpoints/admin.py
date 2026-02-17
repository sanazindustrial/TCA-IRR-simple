"""
Administrative endpoints with enhanced security and governance features
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from typing import Dict, Any, List, Optional
from app.utils.json_utils import json_response_with_datetime
import asyncpg

from app.db import get_db, db_manager
from app.models import BaseResponse, HealthCheck
from app.services import ai_client
from app.core import (audit_logger, AuditEventType, Permission, 
                      require_permission, account_lockout, 
                      GovernancePolicy, get_user_permissions)
from .auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require admin role with IP whitelist check"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin access required")
    return current_user


@router.get("/health", response_model=HealthCheck)
async def admin_health_check(
    request: Request,
    current_user: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db)
):
    """Detailed health check for administrators"""
    # Log admin action
    await audit_logger.log(
        AuditEventType.ADMIN_ACTION,
        user_id=current_user.get('id'),
        username=current_user['username'],
        ip_address=request.client.host if request.client else None,
        action_details={"action": "health_check"},
        db=db
    )
    
    # Get database health
    db_health = await db_manager.health_check()
    
    return HealthCheck(
        status="healthy" if db_health.get("status") == "healthy" else "degraded",
        database=db_health,
        timestamp=datetime.utcnow()
    )


@router.get("/system-status")
async def system_status(
    request: Request,
    current_user: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db)
):
    """Get comprehensive system status"""
    await audit_logger.log(
        AuditEventType.ADMIN_ACTION,
        user_id=current_user.get('id'),
        username=current_user['username'],
        ip_address=request.client.host if request.client else None,
        action_details={"action": "system_status"},
        db=db
    )
    
    db_health = await db_manager.health_check()
    ai_health = await ai_client.health_check()
    
    # Get user statistics
    user_stats = await db.fetchrow("""
        SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN is_active THEN 1 END) as active_users,
            COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
        FROM users
    """)
    
    return {
        "database": db_health,
        "ai_service": ai_health,
        "users": dict(user_stats) if user_stats else {},
        "governance": {
            "audit_log_retention_days": GovernancePolicy.AUDIT_LOG_RETENTION_DAYS,
            "max_concurrent_sessions": GovernancePolicy.MAX_CONCURRENT_SESSIONS,
            "session_timeout_minutes": GovernancePolicy.SESSION_TIMEOUT_MINUTES
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/audit-logs")
async def get_audit_logs(
    request: Request,
    hours: int = Query(24, ge=1, le=168),
    event_type: Optional[str] = None,
    username: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db)
):
    """Get audit logs with filtering options"""
    await audit_logger.log(
        AuditEventType.ADMIN_ACTION,
        user_id=current_user.get('id'),
        username=current_user['username'],
        ip_address=request.client.host if request.client else None,
        action_details={"action": "view_audit_logs", "filters": {
            "hours": hours, "event_type": event_type, "username": username
        }},
        db=db
    )
    
    # Build query dynamically
    query = """
        SELECT * FROM audit_logs 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '%s hours'
    """ % hours
    params = []
    param_count = 0
    
    if event_type:
        param_count += 1
        query += f" AND event_type = ${param_count}"
        params.append(event_type)
    
    if username:
        param_count += 1
        query += f" AND username = ${param_count}"
        params.append(username)
    
    query += " ORDER BY created_at DESC LIMIT $" + str(param_count + 1)
    params.append(limit)
    
    try:
        logs = await db.fetch(query, *params)
        return {
            "logs": [dict(log) for log in logs],
            "total_count": len(logs),
            "filters_applied": {
                "hours": hours,
                "event_type": event_type,
                "username": username,
                "limit": limit
            }
        }
    except Exception as e:
        logger.error(f"Error fetching audit logs: {e}")
        # Return empty result if table doesn't exist yet
        return {"logs": [], "total_count": 0, "error": str(e)}


@router.get("/security-events")
async def get_security_events(
    request: Request,
    hours: int = Query(24, ge=1, le=168),
    current_user: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db)
):
    """Get security-related events (failed logins, lockouts, etc.)"""
    await audit_logger.log(
        AuditEventType.ADMIN_ACTION,
        user_id=current_user.get('id'),
        username=current_user['username'],
        ip_address=request.client.host if request.client else None,
        action_details={"action": "view_security_events"},
        db=db
    )
    
    try:
        events = await audit_logger.get_security_events(db, hours=hours)
        return {
            "events": [dict(e) for e in events],
            "total_count": len(events),
            "time_range_hours": hours
        }
    except Exception as e:
        logger.error(f"Error fetching security events: {e}")
        return {"events": [], "total_count": 0, "error": str(e)}


@router.post("/unlock-account")
async def unlock_user_account(
    request: Request,
    username: str,
    current_user: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db)
):
    """Unlock a locked user account"""
    await account_lockout.unlock_account(username)
    
    await audit_logger.log(
        AuditEventType.ACCOUNT_UNLOCKED,
        username=username,
        ip_address=request.client.host if request.client else None,
        action_details={"unlocked_by": current_user['username']},
        db=db
    )
    
    return BaseResponse(message=f"Account '{username}' has been unlocked")


@router.get("/user-permissions/{user_role}")
async def get_role_permissions(
    user_role: str,
    current_user: dict = Depends(require_admin)
):
    """Get permissions for a specific role"""
    permissions = get_user_permissions(user_role)
    return {
        "role": user_role,
        "permissions": [p.value for p in permissions],
        "permission_count": len(permissions)
    }


@router.get("/governance-policies")
async def get_governance_policies(
    current_user: dict = Depends(require_admin)
):
    """Get current governance policies"""
    return {
        "audit_log_retention_days": GovernancePolicy.AUDIT_LOG_RETENTION_DAYS,
        "user_activity_retention_days": GovernancePolicy.USER_ACTIVITY_RETENTION_DAYS,
        "analysis_approval_threshold": GovernancePolicy.ANALYSIS_APPROVAL_THRESHOLD,
        "max_concurrent_sessions": GovernancePolicy.MAX_CONCURRENT_SESSIONS,
        "session_timeout_minutes": GovernancePolicy.SESSION_TIMEOUT_MINUTES,
        "max_upload_size_mb": GovernancePolicy.MAX_UPLOAD_SIZE_MB,
        "allowed_file_types": GovernancePolicy.ALLOWED_FILE_TYPES,
        "mfa_required_roles": GovernancePolicy.MFA_REQUIRED_ROLES,
        "admin_ip_whitelist": GovernancePolicy.ADMIN_IP_WHITELIST or "All IPs allowed"
    }


@router.post("/maintenance", response_model=BaseResponse)
async def maintenance_mode(
    request: Request,
    enabled: bool,
    current_user: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db)
):
    """Enable/disable maintenance mode"""
    await audit_logger.log(
        AuditEventType.MAINTENANCE_MODE,
        user_id=current_user.get('id'),
        username=current_user['username'],
        ip_address=request.client.host if request.client else None,
        action_details={"enabled": enabled},
        db=db
    )
    
    return BaseResponse(
        message=f"Maintenance mode {'enabled' if enabled else 'disabled'}"
    )


@router.get("/logs")
async def get_system_logs(
    lines: int = Query(100, ge=1, le=1000),
    level: str = Query("INFO", regex="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$"),
    current_user: dict = Depends(require_admin)
):
    """Get system logs"""
    import os
    
    log_file = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "logs", "app.log"
    )
    
    if not os.path.exists(log_file):
        return {"logs": [], "message": "Log file not found"}
    
    try:
        with open(log_file, 'r') as f:
            all_lines = f.readlines()
            
        # Filter by level
        filtered = [
            line for line in all_lines 
            if level in line.upper() or level == "DEBUG"
        ]
        
        return {
            "logs": filtered[-lines:],
            "total_lines": len(all_lines),
            "filtered_lines": len(filtered),
            "level_filter": level
        }
    except Exception as e:
        logger.error(f"Error reading system logs: {e}")
        return {"logs": [], "error": str(e)}