"""Core module initialization"""

from .config import settings, get_settings, configure_logging
from .security import create_access_token, create_refresh_token, verify_token, get_password_hash, verify_password
from .dependencies import (get_current_user, get_current_active_user,
                           require_roles, require_admin,
                           require_analyst_or_admin,
                           require_reviewer_or_higher, get_optional_user)
from .audit import audit_logger, AuditEventType
from .permissions import (Permission, ROLE_PERMISSIONS, get_user_permissions,
                          has_permission, require_permission, require_any_permission,
                          require_all_permissions, GovernancePolicy)
from .enhanced_security import (PasswordPolicy, account_lockout, token_blacklist,
                                 session_manager)

__all__ = [
    # Config
    "settings", "get_settings", "configure_logging",
    # Security
    "create_access_token", "create_refresh_token", "verify_token", "get_password_hash", "verify_password",
    # Dependencies
    "get_current_user", "get_current_active_user", "require_roles", "require_admin",
    "require_analyst_or_admin", "require_reviewer_or_higher", "get_optional_user",
    # Audit
    "audit_logger", "AuditEventType",
    # Permissions
    "Permission", "ROLE_PERMISSIONS", "get_user_permissions", "has_permission",
    "require_permission", "require_any_permission", "require_all_permissions",
    "GovernancePolicy",
    # Enhanced Security
    "PasswordPolicy", "account_lockout", "token_blacklist", "session_manager"
]