"""
Enhanced security dependencies and utilities
"""

import logging
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import asyncpg

from app.core import verify_token
from app.db import get_db
from app.models import UserRole

logger = logging.getLogger(__name__)
security = HTTPBearer()


class SecurityError(Exception):
    """Custom security exception"""
    pass


async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Security(security),
        db: asyncpg.Connection = Depends(get_db)) -> dict:
    """
    Dependency to get current authenticated user
    
    Validates JWT token and returns user information
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verify token
        token = credentials.credentials
        payload = verify_token(token)

        if payload is None:
            raise credentials_exception

        username = payload.get("sub")
        if username is None:
            raise credentials_exception

    except Exception as e:
        logger.warning(f"Token validation failed: {e}")
        raise credentials_exception

    try:
        # Get user from database
        user = await db.fetchrow(
            """
            SELECT id, username, email, full_name, role, is_active, 
                   created_at, updated_at, last_login
            FROM users 
            WHERE username = $1
        """, username)

        if user is None:
            logger.warning(f"User not found: {username}")
            raise credentials_exception

        if not user['is_active']:
            logger.warning(f"Inactive user attempted access: {username}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="User account is inactive")

        # Update last login
        await db.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
            user['id'])

        return dict(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Authentication service error")


async def get_current_active_user(current_user: dict = Depends(
    get_current_user)) -> dict:
    """
    Dependency to ensure user is active
    """
    if not current_user.get('is_active', False):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Inactive user")
    return current_user


def require_roles(allowed_roles: List[UserRole]):
    """
    Dependency factory to require specific user roles
    
    Usage:
        @app.get("/admin-only")
        async def admin_endpoint(user: dict = Depends(require_roles([UserRole.ADMIN]))):
            pass
    """

    def role_checker(current_user: dict = Depends(
        get_current_active_user)) -> dict:
        user_role = current_user.get('role')

        if user_role not in [role.value for role in allowed_roles]:
            logger.warning(
                f"Access denied for user {current_user.get('username')} "
                f"with role {user_role}. Required: {[role.value for role in allowed_roles]}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=
                f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )

        return current_user

    return role_checker


def require_admin(current_user: dict = Depends(
    get_current_active_user)) -> dict:
    """Dependency to require admin role"""
    if current_user.get('role') != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin access required")
    return current_user


def require_analyst_or_admin(current_user: dict = Depends(
    get_current_active_user)) -> dict:
    """Dependency to require analyst or admin role"""
    allowed_roles = [UserRole.ADMIN.value, UserRole.ANALYST.value]
    if current_user.get('role') not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Analyst or admin access required")
    return current_user


def require_reviewer_or_higher(current_user: dict = Depends(
    get_current_active_user)) -> dict:
    """Dependency to require reviewer, analyst, or admin role"""
    allowed_roles = [
        UserRole.ADMIN.value, UserRole.ANALYST.value, UserRole.REVIEWER.value
    ]
    if current_user.get('role') not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Reviewer access or higher required")
    return current_user


async def check_resource_ownership(resource_id: int, resource_type: str,
                                   current_user: dict,
                                   db: asyncpg.Connection) -> bool:
    """
    Check if user owns or has access to a resource
    
    Args:
        resource_id: ID of the resource
        resource_type: Type of resource (company, analysis, etc.)
        current_user: Current authenticated user
        db: Database connection
    
    Returns:
        Boolean indicating if user has access
    """
    # Admin has access to everything
    if current_user.get('role') == UserRole.ADMIN.value:
        return True

    try:
        if resource_type == "company":
            result = await db.fetchrow(
                "SELECT created_by FROM companies WHERE id = $1", resource_id)
            return result and result['created_by'] == current_user['id']

        elif resource_type == "analysis":
            result = await db.fetchrow(
                "SELECT created_by FROM analyses WHERE id = $1", resource_id)
            return result and result['created_by'] == current_user['id']

        # Add more resource types as needed
        return False

    except Exception as e:
        logger.error(f"Error checking resource ownership: {e}")
        return False


def require_resource_access(resource_type: str):
    """
    Dependency factory to check resource ownership
    
    Usage:
        @app.get("/companies/{company_id}")
        async def get_company(
            company_id: int,
            current_user: dict = Depends(require_resource_access("company")),
            db: asyncpg.Connection = Depends(get_db)
        ):
            pass
    """

    async def access_checker(
        resource_id: int,
        current_user: dict = Depends(get_current_active_user),
        db: asyncpg.Connection = Depends(get_db)
    ) -> dict:
        has_access = await check_resource_ownership(resource_id, resource_type,
                                                    current_user, db)

        if not has_access:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Access denied to this resource")

        return current_user

    return access_checker


# Optional dependencies for public endpoints that may have authenticated users
async def get_optional_user(
        credentials: Optional[HTTPAuthorizationCredentials] = Security(
            security),
        db: asyncpg.Connection = Depends(get_db)) -> Optional[dict]:
    """
    Optional dependency to get current user without requiring authentication
    
    Returns None if no valid token is provided
    """
    if not credentials:
        return None

    try:
        # Use the main authentication flow
        return await get_current_user(credentials, db)
    except HTTPException:
        # If authentication fails, return None instead of raising
        return None
    except Exception as e:
        logger.warning(f"Optional authentication failed: {e}")
        return None


# Rate limiting helpers
class RateLimit:
    """Rate limiting configuration"""

    @staticmethod
    def for_endpoint(requests_per_minute: int = 60):
        """Create rate limit configuration for specific endpoint"""
        return {
            "requests_per_minute": requests_per_minute,
            "window_size": 60  # seconds
        }

    @staticmethod
    def for_user_type(user_role: str):
        """Get rate limits based on user role"""
        limits = {
            UserRole.ADMIN.value: 1000,
            UserRole.ANALYST.value: 500,
            UserRole.REVIEWER.value: 200,
            UserRole.USER.value: 100
        }
        return limits.get(user_role, 60)


# Security validation helpers
def validate_user_input(input_data: str, max_length: int = 1000) -> str:
    """Validate and sanitize user input"""
    if not input_data:
        return ""

    # Basic sanitization
    sanitized = input_data.strip()

    if len(sanitized) > max_length:
        raise ValueError(
            f"Input too long. Maximum {max_length} characters allowed")

    # Add more validation as needed
    return sanitized


def check_password_strength(password: str) -> bool:
    """Check if password meets security requirements"""
    if len(password) < 8:
        return False

    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)

    return has_upper and has_lower and has_digit