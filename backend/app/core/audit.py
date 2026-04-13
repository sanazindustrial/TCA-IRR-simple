"""
Audit Logging Service - Tracks all security and governance events
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import json
import asyncpg

logger = logging.getLogger(__name__)


class AuditEventType(str, Enum):
    """Types of audit events to track"""
    # Authentication Events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    TOKEN_REFRESH = "token_refresh"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET_REQUEST = "password_reset_request"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    
    # User Management Events
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_ACTIVATED = "user_activated"
    USER_DEACTIVATED = "user_deactivated"
    ROLE_CHANGED = "role_changed"
    
    # Data Access Events
    DATA_ACCESSED = "data_accessed"
    DATA_CREATED = "data_created"
    DATA_UPDATED = "data_updated"
    DATA_DELETED = "data_deleted"
    DATA_EXPORTED = "data_exported"
    
    # Admin Events
    ADMIN_ACTION = "admin_action"
    SYSTEM_CONFIG_CHANGED = "system_config_changed"
    MAINTENANCE_MODE = "maintenance_mode"
    
    # Security Events
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    INVALID_TOKEN = "invalid_token"


class AuditLogger:
    """
    Centralized audit logging service for security and governance compliance.
    Supports both database and file-based logging for redundancy.
    """
    
    def __init__(self):
        self.file_logger = logging.getLogger("audit")
        self._setup_file_handler()
    
    def _setup_file_handler(self):
        """Set up file handler for audit logs"""
        import os
        log_dir = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        
        handler = logging.FileHandler(
            os.path.join(log_dir, "audit.log"),
            encoding="utf-8"
        )
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - AUDIT - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        ))
        self.file_logger.addHandler(handler)
        self.file_logger.setLevel(logging.INFO)
    
    async def log(
        self,
        event_type: AuditEventType,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        action_details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        db: Optional[asyncpg.Connection] = None
    ):
        """
        Log an audit event to both database and file
        
        Args:
            event_type: Type of event being logged
            user_id: ID of user performing action (if authenticated)
            username: Username of user performing action
            resource_type: Type of resource being accessed/modified
            resource_id: ID of specific resource
            action_details: Additional details about the action
            ip_address: Client IP address
            user_agent: Client user agent string
            success: Whether the action was successful
            db: Database connection for persistent logging
        """
        
        event_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type.value,
            "user_id": user_id,
            "username": username,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action_details": action_details,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "success": success
        }
        
        # Log to file (always)
        self.file_logger.info(json.dumps(event_data))
        
        # Log to database (if connection available)
        if db:
            try:
                await self._log_to_database(db, event_data)
            except Exception as e:
                logger.error(f"Failed to log audit event to database: {e}")
    
    async def _log_to_database(self, db: asyncpg.Connection, event_data: Dict[str, Any]):
        """Persist audit log to database"""
        await db.execute(
            """
            INSERT INTO audit_logs 
            (event_type, user_id, username, resource_type, resource_id, 
             action_details, ip_address, user_agent, success, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            """,
            event_data["event_type"],
            event_data["user_id"],
            event_data["username"],
            event_data["resource_type"],
            event_data["resource_id"],
            json.dumps(event_data["action_details"]) if event_data["action_details"] else None,
            event_data["ip_address"],
            event_data["user_agent"],
            event_data["success"]
        )
    
    async def get_user_activity(
        self,
        db: asyncpg.Connection,
        user_id: int,
        limit: int = 100,
        event_types: Optional[list] = None
    ) -> list:
        """Get activity log for a specific user"""
        query = """
            SELECT * FROM audit_logs 
            WHERE user_id = $1
        """
        params = [user_id]
        
        if event_types:
            query += " AND event_type = ANY($2)"
            params.append(event_types)
            
        query += " ORDER BY created_at DESC LIMIT $" + str(len(params) + 1)
        params.append(limit)
        
        return await db.fetch(query, *params)
    
    async def get_security_events(
        self,
        db: asyncpg.Connection,
        hours: int = 24,
        limit: int = 1000
    ) -> list:
        """Get security-related events for monitoring"""
        security_events = [
            AuditEventType.LOGIN_FAILED.value,
            AuditEventType.ACCOUNT_LOCKED.value,
            AuditEventType.PERMISSION_DENIED.value,
            AuditEventType.SUSPICIOUS_ACTIVITY.value,
            AuditEventType.RATE_LIMIT_EXCEEDED.value,
            AuditEventType.INVALID_TOKEN.value
        ]
        
        return await db.fetch(
            """
            SELECT * FROM audit_logs 
            WHERE event_type = ANY($1)
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '%s hours'
            ORDER BY created_at DESC
            LIMIT $2
            """ % hours,
            security_events,
            limit
        )


# Singleton instance
audit_logger = AuditLogger()
