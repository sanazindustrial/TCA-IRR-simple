"""
Role Configuration API Endpoints
Manage role permissions and limits dynamically
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
import asyncpg

from app.db import get_db, db_manager
from app.models import (
    RolePermission,
    RoleLimits,
    RoleConfig,
    RoleConfigUpdate,
    RoleConfigResponse,
)
from app.api.v1.endpoints.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/roles", tags=["Role Configuration"])

# Default fallback configuration (used if database has no data)
DEFAULT_ROLE_CONFIGS = {
    "admin": {
        "label":
        "Administrator",
        "icon":
        "Shield",
        "color":
        "text-red-600",
        "bgColor":
        "bg-red-50",
        "permissions": [
            {
                "name": "Full System Access",
                "description": "Complete access to all features",
                "enabled": True
            },
            {
                "name": "User Management",
                "description": "Can create, edit, and delete users",
                "enabled": True
            },
            {
                "name": "Module Configuration",
                "description": "Can modify analysis modules",
                "enabled": True
            },
            {
                "name": "Export Data",
                "description": "Can export reports and data",
                "enabled": True
            },
            {
                "name": "View Reports",
                "description": "Can view all reports",
                "enabled": True
            },
            {
                "name": "Run Analysis",
                "description": "Can execute triage and DD analysis",
                "enabled": True
            },
        ],
        "limits": {
            "triageReports": "Unlimited",
            "ddReports": "Unlimited"
        }
    },
    "analyst": {
        "label":
        "Analyst",
        "icon":
        "LineChart",
        "color":
        "text-blue-600",
        "bgColor":
        "bg-blue-50",
        "permissions": [
            {
                "name": "Run DD Analysis",
                "description": "Can execute deep dive analysis",
                "enabled": True
            },
            {
                "name": "Run Triage Analysis",
                "description": "Can execute triage analysis",
                "enabled": True
            },
            {
                "name": "View Reports",
                "description": "Can view assigned reports",
                "enabled": True
            },
            {
                "name": "Export Data",
                "description": "Can export own reports",
                "enabled": True
            },
            {
                "name": "User Management",
                "description": "Can manage users",
                "enabled": False
            },
            {
                "name": "Module Configuration",
                "description": "Can modify analysis modules",
                "enabled": False
            },
        ],
        "limits": {
            "triageReports": 50,
            "ddReports": 10
        }
    },
    "user": {
        "label":
        "Standard User",
        "icon":
        "User",
        "color":
        "text-gray-600",
        "bgColor":
        "bg-gray-50",
        "permissions": [
            {
                "name": "Run Triage Analysis",
                "description": "Can execute triage analysis",
                "enabled": True
            },
            {
                "name": "View Reports",
                "description": "Can view own reports only",
                "enabled": True
            },
            {
                "name": "Run DD Analysis",
                "description": "Can execute deep dive analysis",
                "enabled": False
            },
            {
                "name": "Export Data",
                "description": "Can export data",
                "enabled": False
            },
            {
                "name": "User Management",
                "description": "Can manage users",
                "enabled": False
            },
            {
                "name": "Module Configuration",
                "description": "Can modify analysis modules",
                "enabled": False
            },
        ],
        "limits": {
            "triageReports": 10,
            "ddReports": 0
        }
    }
}


def format_limit(value: Any) -> Any:
    """Convert NULL to 'Unlimited' for display"""
    if value is None:
        return "Unlimited"
    return value


def parse_limit(value: Any) -> Any:
    """Convert 'Unlimited' back to NULL for storage"""
    if value == "Unlimited":
        return None
    if isinstance(value, str) and value.lower() == "unlimited":
        return None
    return value


@router.get("/configurations")
async def get_role_configurations() -> Dict[str, Any]:
    """Get all role configurations from database"""
    try:
        async with db_manager.get_connection() as db:
            # Check if tables exist (run migration check)
            table_exists = await db.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = 'role_configurations'
                )
            """)

            if not table_exists:
                # Return defaults if table doesn't exist yet
                logger.warning(
                    "role_configurations table not found, returning defaults")
                return {"roles": DEFAULT_ROLE_CONFIGS, "fromDefaults": True}

            # Fetch role configurations
            role_rows = await db.fetch("""
                SELECT role_key, label, icon, color, bg_color, updated_at
                FROM role_configurations
                ORDER BY 
                    CASE role_key 
                        WHEN 'admin' THEN 1 
                        WHEN 'analyst' THEN 2 
                        WHEN 'user' THEN 3 
                        ELSE 4 
                    END
            """)

            if not role_rows:
                return {"roles": DEFAULT_ROLE_CONFIGS, "fromDefaults": True}

            roles = {}
            latest_update = None

            for row in role_rows:
                role_key = row['role_key']

                # Track latest update
                if row['updated_at'] and (not latest_update
                                          or row['updated_at'] > latest_update):
                    latest_update = row['updated_at']

                # Fetch permissions for this role
                perm_rows = await db.fetch(
                    """
                    SELECT id, permission_name, description, is_enabled
                    FROM role_permissions
                    WHERE role_key = $1
                    ORDER BY id
                """, role_key)

                permissions = [{
                    "id": p['id'],
                    "name": p['permission_name'],
                    "description": p['description'],
                    "enabled": p['is_enabled']
                } for p in perm_rows]

                # Fetch limits for this role
                limit_row = await db.fetchrow(
                    """
                    SELECT triage_reports, dd_reports
                    FROM role_limits
                    WHERE role_key = $1
                """, role_key)

                limits = {
                    "triageReports":
                    format_limit(limit_row['triage_reports'])
                    if limit_row else "Unlimited",
                    "ddReports":
                    format_limit(limit_row['dd_reports'])
                    if limit_row else "Unlimited"
                }

                roles[role_key] = {
                    "label": row['label'],
                    "icon": row['icon'],
                    "color": row['color'],
                    "bgColor": row['bg_color'],
                    "permissions": permissions,
                    "limits": limits
                }

            return {
                "roles": roles,
                "updatedAt": latest_update.isoformat() if latest_update else None,
                "fromDefaults": False
            }

    except Exception as e:
        logger.warning(f"DB unavailable for role configurations, returning defaults: {e}")
        return {"roles": DEFAULT_ROLE_CONFIGS, "fromDefaults": True}


@router.put("/configurations/{role_key}")
async def update_role_configuration(
    role_key: str,
    update: RoleConfigUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update a specific role's configuration (admin only)"""

    # Check admin access
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can modify role configurations")

    if role_key not in ['admin', 'analyst', 'user']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role key. Must be 'admin', 'analyst', or 'user'")

    try:
        async with db.transaction():
            # Update role configuration
            if update.label or update.icon or update.color or update.bgColor:
                await db.execute(
                    """
                    UPDATE role_configurations 
                    SET 
                        label = COALESCE($2, label),
                        icon = COALESCE($3, icon),
                        color = COALESCE($4, color),
                        bg_color = COALESCE($5, bg_color)
                    WHERE role_key = $1
                """, role_key, update.label, update.icon, update.color,
                    update.bgColor)

            # Update permissions
            if update.permissions is not None:
                # Delete existing permissions
                await db.execute(
                    """
                    DELETE FROM role_permissions WHERE role_key = $1
                """, role_key)

                # Insert new permissions
                for perm in update.permissions:
                    await db.execute(
                        """
                        INSERT INTO role_permissions (role_key, permission_name, description, is_enabled)
                        VALUES ($1, $2, $3, $4)
                    """, role_key, perm.name, perm.description, perm.enabled)

            # Update limits
            if update.limits is not None:
                triage = parse_limit(update.limits.triageReports)
                dd = parse_limit(update.limits.ddReports)

                await db.execute(
                    """
                    INSERT INTO role_limits (role_key, triage_reports, dd_reports)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (role_key) 
                    DO UPDATE SET 
                        triage_reports = $2,
                        dd_reports = $3
                """, role_key, triage, dd)

        logger.info(
            f"Role configuration updated for {role_key} by user {current_user.get('username')}"
        )

        return {
            "success": True,
            "message": f"Role '{role_key}' configuration updated successfully"
        }

    except Exception as e:
        logger.error(f"Error updating role configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating role configuration: {str(e)}")


@router.post("/configurations/reset")
async def reset_role_configurations(db: asyncpg.Connection = Depends(get_db),
                                    current_user: dict = Depends(
                                        get_current_user)) -> Dict[str, Any]:
    """Reset all role configurations to defaults (admin only)"""

    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only admins can reset role configurations")

    try:
        async with db.transaction():
            # Delete all existing data
            await db.execute("DELETE FROM role_permissions")
            await db.execute("DELETE FROM role_limits")
            await db.execute("DELETE FROM role_configurations")

            # Re-insert defaults
            for role_key, config in DEFAULT_ROLE_CONFIGS.items():
                # Insert role config
                await db.execute(
                    """
                    INSERT INTO role_configurations (role_key, label, icon, color, bg_color)
                    VALUES ($1, $2, $3, $4, $5)
                """, role_key, config['label'], config['icon'],
                    config['color'], config['bgColor'])

                # Insert permissions
                for perm in config['permissions']:
                    await db.execute(
                        """
                        INSERT INTO role_permissions (role_key, permission_name, description, is_enabled)
                        VALUES ($1, $2, $3, $4)
                    """, role_key, perm['name'], perm['description'],
                        perm['enabled'])

                # Insert limits
                limits = config['limits']
                triage = parse_limit(limits['triageReports'])
                dd = parse_limit(limits['ddReports'])

                await db.execute(
                    """
                    INSERT INTO role_limits (role_key, triage_reports, dd_reports)
                    VALUES ($1, $2, $3)
                """, role_key, triage, dd)

        logger.info(
            f"Role configurations reset to defaults by user {current_user.get('username')}"
        )

        return {
            "success": True,
            "message": "Role configurations reset to defaults"
        }

    except Exception as e:
        logger.error(f"Error resetting role configurations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting role configurations: {str(e)}")


@router.post("/configurations/initialize")
async def initialize_role_configurations(
        db: asyncpg.Connection = Depends(get_db),
        current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Initialize role tables with default data (admin only, creates tables if needed)"""

    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can initialize role configurations")

    try:
        # Read and execute migration SQL
        import os
        migration_path = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            'db', 'migrations', '006_role_permissions.sql')

        if os.path.exists(migration_path):
            with open(migration_path, 'r') as f:
                migration_sql = f.read()

            # Execute migration in statements
            statements = migration_sql.split(';')
            async with db.transaction():
                for stmt in statements:
                    stmt = stmt.strip()
                    if stmt and not stmt.startswith('--'):
                        try:
                            await db.execute(stmt)
                        except Exception as e:
                            # Some statements may fail if already exists, that's OK
                            logger.debug(f"Migration statement skipped: {e}")

            logger.info(
                f"Role configurations initialized by user {current_user.get('username')}"
            )
            return {
                "success": True,
                "message": "Role configurations initialized successfully"
            }
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Migration file not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing role configurations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing role configurations: {str(e)}")
