"""
Permission-based Access Control System
Provides granular permissions beyond role-based access
"""

from enum import Enum
from typing import List, Dict, Set, Optional
from functools import wraps
from fastapi import HTTPException, status, Depends
import logging

logger = logging.getLogger(__name__)


class Permission(str, Enum):
    """Granular permissions for the system"""
    
    # User Management Permissions
    USER_READ = "user:read"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_MANAGE_ROLES = "user:manage_roles"
    
    # Company/Evaluation Permissions
    COMPANY_READ = "company:read"
    COMPANY_CREATE = "company:create"
    COMPANY_UPDATE = "company:update"
    COMPANY_DELETE = "company:delete"
    COMPANY_EXPORT = "company:export"
    
    # Analysis Permissions
    ANALYSIS_READ = "analysis:read"
    ANALYSIS_CREATE = "analysis:create"
    ANALYSIS_UPDATE = "analysis:update"
    ANALYSIS_DELETE = "analysis:delete"
    ANALYSIS_APPROVE = "analysis:approve"
    ANALYSIS_EXPORT = "analysis:export"
    
    # Investment Permissions
    INVESTMENT_READ = "investment:read"
    INVESTMENT_CREATE = "investment:create"
    INVESTMENT_UPDATE = "investment:update"
    INVESTMENT_DELETE = "investment:delete"
    
    # TCA Module Permissions
    TCA_VIEW = "tca:view"
    TCA_EDIT = "tca:edit"
    TCA_CONFIGURE = "tca:configure"
    
    # Admin Permissions
    ADMIN_DASHBOARD = "admin:dashboard"
    ADMIN_LOGS = "admin:logs"
    ADMIN_SETTINGS = "admin:settings"
    ADMIN_MAINTENANCE = "admin:maintenance"
    ADMIN_AUDIT = "admin:audit"
    
    # System Permissions
    SYSTEM_HEALTH = "system:health"
    SYSTEM_METRICS = "system:metrics"
    SYSTEM_BACKUP = "system:backup"


# Role to Permission Mapping
ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    "admin": {
        # Admins have all permissions
        Permission.USER_READ, Permission.USER_CREATE, Permission.USER_UPDATE,
        Permission.USER_DELETE, Permission.USER_MANAGE_ROLES,
        Permission.COMPANY_READ, Permission.COMPANY_CREATE, Permission.COMPANY_UPDATE,
        Permission.COMPANY_DELETE, Permission.COMPANY_EXPORT,
        Permission.ANALYSIS_READ, Permission.ANALYSIS_CREATE, Permission.ANALYSIS_UPDATE,
        Permission.ANALYSIS_DELETE, Permission.ANALYSIS_APPROVE, Permission.ANALYSIS_EXPORT,
        Permission.INVESTMENT_READ, Permission.INVESTMENT_CREATE, Permission.INVESTMENT_UPDATE,
        Permission.INVESTMENT_DELETE,
        Permission.TCA_VIEW, Permission.TCA_EDIT, Permission.TCA_CONFIGURE,
        Permission.ADMIN_DASHBOARD, Permission.ADMIN_LOGS, Permission.ADMIN_SETTINGS,
        Permission.ADMIN_MAINTENANCE, Permission.ADMIN_AUDIT,
        Permission.SYSTEM_HEALTH, Permission.SYSTEM_METRICS, Permission.SYSTEM_BACKUP
    },
    
    "analyst": {
        Permission.USER_READ,
        Permission.COMPANY_READ, Permission.COMPANY_CREATE, Permission.COMPANY_UPDATE,
        Permission.COMPANY_EXPORT,
        Permission.ANALYSIS_READ, Permission.ANALYSIS_CREATE, Permission.ANALYSIS_UPDATE,
        Permission.ANALYSIS_EXPORT,
        Permission.INVESTMENT_READ, Permission.INVESTMENT_CREATE, Permission.INVESTMENT_UPDATE,
        Permission.TCA_VIEW, Permission.TCA_EDIT,
        Permission.SYSTEM_HEALTH
    },
    
    "reviewer": {
        Permission.USER_READ,
        Permission.COMPANY_READ, Permission.COMPANY_EXPORT,
        Permission.ANALYSIS_READ, Permission.ANALYSIS_APPROVE, Permission.ANALYSIS_EXPORT,
        Permission.INVESTMENT_READ,
        Permission.TCA_VIEW,
        Permission.SYSTEM_HEALTH
    },
    
    "user": {
        Permission.USER_READ,
        Permission.COMPANY_READ,
        Permission.ANALYSIS_READ,
        Permission.INVESTMENT_READ,
        Permission.TCA_VIEW,
        Permission.SYSTEM_HEALTH
    }
}


def get_user_permissions(role: str) -> Set[Permission]:
    """Get all permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, set())


def has_permission(user_role: str, required_permission: Permission) -> bool:
    """Check if a role has a specific permission"""
    user_permissions = get_user_permissions(user_role)
    return required_permission in user_permissions


def has_any_permission(user_role: str, required_permissions: List[Permission]) -> bool:
    """Check if a role has any of the required permissions"""
    user_permissions = get_user_permissions(user_role)
    return any(perm in user_permissions for perm in required_permissions)


def has_all_permissions(user_role: str, required_permissions: List[Permission]) -> bool:
    """Check if a role has all of the required permissions"""
    user_permissions = get_user_permissions(user_role)
    return all(perm in user_permissions for perm in required_permissions)


def require_permission(permission: Permission):
    """
    Dependency to require a specific permission
    
    Usage:
        @app.get("/companies")
        async def list_companies(
            current_user: dict = Depends(get_current_user),
            _: None = Depends(require_permission(Permission.COMPANY_READ))
        ):
            pass
    """
    from app.core.dependencies import get_current_active_user
    
    async def permission_checker(
        current_user: dict = Depends(get_current_active_user)
    ) -> dict:
        user_role = current_user.get('role', 'user')
        
        if not has_permission(user_role, permission):
            logger.warning(
                f"Permission denied for user {current_user.get('username')} "
                f"(role: {user_role}). Required permission: {permission.value}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission.value}"
            )
        
        return current_user
    
    return permission_checker


def require_any_permission(permissions: List[Permission]):
    """
    Dependency to require any of the specified permissions
    """
    from app.core.dependencies import get_current_active_user
    
    async def permission_checker(
        current_user: dict = Depends(get_current_active_user)
    ) -> dict:
        user_role = current_user.get('role', 'user')
        
        if not has_any_permission(user_role, permissions):
            logger.warning(
                f"Permission denied for user {current_user.get('username')} "
                f"(role: {user_role}). Required any of: {[p.value for p in permissions]}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required one of: {[p.value for p in permissions]}"
            )
        
        return current_user
    
    return permission_checker


def require_all_permissions(permissions: List[Permission]):
    """
    Dependency to require all of the specified permissions
    """
    from app.core.dependencies import get_current_active_user
    
    async def permission_checker(
        current_user: dict = Depends(get_current_active_user)
    ) -> dict:
        user_role = current_user.get('role', 'user')
        
        if not has_all_permissions(user_role, permissions):
            missing = [p.value for p in permissions if not has_permission(user_role, p)]
            logger.warning(
                f"Permission denied for user {current_user.get('username')} "
                f"(role: {user_role}). Missing permissions: {missing}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Missing: {missing}"
            )
        
        return current_user
    
    return permission_checker


# Permission Governance Rules
class GovernancePolicy:
    """Governance policies for data access and management"""
    
    # Maximum days to retain audit logs
    AUDIT_LOG_RETENTION_DAYS = 365
    
    # Maximum days to retain user activity logs
    USER_ACTIVITY_RETENTION_DAYS = 90
    
    # Require approval for analysis above this threshold
    ANALYSIS_APPROVAL_THRESHOLD = 1000000  # Investment amount
    
    # Maximum concurrent sessions per user (0 = unlimited)
    MAX_CONCURRENT_SESSIONS = 3
    
    # Session timeout in minutes
    SESSION_TIMEOUT_MINUTES = 30
    
    # Maximum file upload size in MB
    MAX_UPLOAD_SIZE_MB = 50
    
    # Allowed file types for upload
    ALLOWED_FILE_TYPES = ['.pdf', '.xlsx', '.xls', '.csv', '.docx', '.doc']
    
    # IP whitelist for admin access (empty = all IPs allowed)
    ADMIN_IP_WHITELIST: List[str] = []
    
    # Required MFA for specific roles
    MFA_REQUIRED_ROLES = ['admin']
    
    @classmethod
    def is_file_type_allowed(cls, filename: str) -> bool:
        """Check if file type is allowed for upload"""
        import os
        ext = os.path.splitext(filename)[1].lower()
        return ext in cls.ALLOWED_FILE_TYPES
    
    @classmethod
    def is_ip_allowed_for_admin(cls, ip_address: str) -> bool:
        """Check if IP is allowed for admin access"""
        if not cls.ADMIN_IP_WHITELIST:
            return True  # No whitelist = all allowed
        return ip_address in cls.ADMIN_IP_WHITELIST
    
    @classmethod
    def requires_mfa(cls, role: str) -> bool:
        """Check if role requires MFA"""
        return role in cls.MFA_REQUIRED_ROLES
