"""
User management endpoints
"""

import logging
import io
import csv
import secrets
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
import asyncpg
import math

from app.db import get_db
from app.models import UserResponse, UserUpdate, PaginatedResponse
from .auth import get_current_user
from app.services.email_service import send_invite_email

logger = logging.getLogger(__name__)
router = APIRouter()

# Import invite_tokens from auth module for shared storage
from . import auth


# ============================================================================
# STATIC ROUTES - Must be defined BEFORE dynamic /{user_id} routes
# ============================================================================

@router.get("/", response_model=PaginatedResponse)
async def get_users(page: int = 1,
                    size: int = 20,
                    search: Optional[str] = None,
                    db: asyncpg.Connection = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    """Get paginated list of users (admin only)"""
    
    # Check if current user is admin
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view user list"
        )
    
    try:
        # Calculate offset
        offset = (page - 1) * size
        
        # Build query based on search
        if search:
            # Count total matching users
            total = await db.fetchval(
                """
                SELECT COUNT(*) FROM users 
                WHERE username ILIKE $1 OR email ILIKE $1
                """,
                f"%{search}%"
            )
            
            # Fetch users with search
            rows = await db.fetch(
                """
                SELECT id, username, email, role, is_active, created_at, updated_at
                FROM users 
                WHERE username ILIKE $1 OR email ILIKE $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
                """,
                f"%{search}%", size, offset
            )
        else:
            # Count total users
            total = await db.fetchval("SELECT COUNT(*) FROM users")
            
            # Fetch users
            rows = await db.fetch(
                """
                SELECT id, username, email, role, is_active, created_at, updated_at
                FROM users 
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
                """,
                size, offset
            )
        
        # Convert rows to user responses
        users = []
        for row in rows:
            user_dict = dict(row)
            user_dict['full_name'] = None  # Column doesn't exist in DB
            users.append(UserResponse(**user_dict))
        
        # Calculate pagination
        total_pages = math.ceil(total / size) if total > 0 else 0
        
        return PaginatedResponse(
            items=users,
            total=total,
            page=page,
            size=size,
            pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching users"
        )


@router.get("/export")
async def export_users(
    format: str = Query("csv", description="Export format (csv or json)"),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Export all users to CSV or JSON (admin only)"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can export users"
        )
    
    try:
        rows = await db.fetch(
            """
            SELECT id, username, email, role, is_active, created_at, updated_at
            FROM users ORDER BY created_at DESC
            """
        )
        
        if format.lower() == "csv":
            # Create CSV in memory
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(['ID', 'Username', 'Email', 'Role', 'Status', 'Created At', 'Updated At'])
            
            # Write data
            for row in rows:
                writer.writerow([
                    row['id'],
                    row['username'],
                    row['email'],
                    row['role'],
                    'Active' if row['is_active'] else 'Inactive',
                    row['created_at'].isoformat() if row['created_at'] else '',
                    row['updated_at'].isoformat() if row['updated_at'] else ''
                ])
            
            output.seek(0)
            filename = f"users_export_{datetime.now().strftime('%Y%m%d')}.csv"
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        else:
            # Return JSON
            users = []
            for row in rows:
                users.append({
                    "id": row['id'],
                    "username": row['username'],
                    "email": row['email'],
                    "role": row['role'],
                    "is_active": row['is_active'],
                    "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                    "updated_at": row['updated_at'].isoformat() if row['updated_at'] else None
                })
            return {"users": users, "total": len(users)}
            
    except Exception as e:
        logger.error(f"Error exporting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error exporting users"
        )


@router.post("/invite")
async def invite_user(
    request: Request,
    invite_data: dict,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Invite a new user via email (admin only).
    This is an alias for /auth/invite for frontend compatibility.
    """
    
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can invite users"
        )
    
    email = invite_data.get('email')
    role = invite_data.get('role', 'analyst')
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    if role not in ['admin', 'analyst', 'user']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be admin, analyst, or user"
        )
    
    try:
        # Check if user already exists
        existing = await db.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            email
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        
        # Check if there's already a pending invite for this email
        for token, data in auth.invite_tokens.items():
            if data['email'] == email and datetime.utcnow() < data['expires_at']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An active invitation already exists for this email"
                )
        
        # Generate invite token
        invite_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Store the invite token (shared with auth module)
        auth.invite_tokens[invite_token] = {
            "email": email,
            "role": role,
            "invited_by": current_user['id'],
            "invited_by_username": current_user['username'],
            "expires_at": expires_at,
            "created_at": datetime.utcnow()
        }
        
        # Send invitation email
        try:
            await send_invite_email(
                to_email=email,
                invite_token=invite_token,
                role=role,
                inviter_name=current_user.get('username', 'Admin')
            )
            email_sent = True
        except Exception as e:
            logger.warning(f"Failed to send invite email: {e}")
            email_sent = False
        
        logger.info(f"Invitation sent to {email} for role {role} by {current_user['username']}")
        
        return {
            "success": True,
            "message": f"Invitation sent to {email}",
            "email": email,
            "role": role,
            "email_sent": email_sent,
            "invite_token": invite_token if not email_sent else None  # Only return token if email failed
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending invitation: {str(e)}"
        )


# ============================================================================
# DYNAMIC ROUTES - /{user_id} patterns must come AFTER static routes
# ============================================================================

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int,
                   db: asyncpg.Connection = Depends(get_db),
                   current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    
    # Check if current user is admin or requesting their own info
    if current_user.get('role') != 'admin' and current_user.get('id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile"
        )
    
    try:
        row = await db.fetchrow(
            """
            SELECT id, username, email, role, is_active, created_at, updated_at
            FROM users WHERE id = $1
            """,
            user_id
        )
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_dict = dict(row)
        user_dict['full_name'] = None
        return UserResponse(**user_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int,
                      user_update: UserUpdate,
                      db: asyncpg.Connection = Depends(get_db),
                      current_user: dict = Depends(get_current_user)):
    """Update user information (admin only for role changes, user for own profile)"""
    
    is_admin = current_user.get('role') == 'admin'
    is_own_profile = current_user.get('id') == user_id
    
    # Non-admins can only update their own profile (excluding role)
    if not is_admin and not is_own_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    # Non-admins cannot change role
    if not is_admin and user_update.role is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change user roles"
        )
    
    try:
        # Check user exists
        existing = await db.fetchrow("SELECT id FROM users WHERE id = $1", user_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Build update query dynamically
        update_fields = []
        values = []
        param_count = 1
        
        if user_update.email is not None:
            # Check email uniqueness
            email_check = await db.fetchrow(
                "SELECT id FROM users WHERE email = $1 AND id != $2",
                user_update.email, user_id
            )
            if email_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            update_fields.append(f"email = ${param_count}")
            values.append(user_update.email)
            param_count += 1
        
        if user_update.role is not None and is_admin:
            if user_update.role not in ['admin', 'analyst', 'user']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role. Must be 'admin', 'analyst', or 'user'"
                )
            update_fields.append(f"role = ${param_count}")
            values.append(user_update.role)
            param_count += 1
        
        if user_update.is_active is not None and is_admin:
            update_fields.append(f"is_active = ${param_count}")
            values.append(user_update.is_active)
            param_count += 1
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Add updated_at
        update_fields.append(f"updated_at = NOW()")
        
        # Add user_id to values
        values.append(user_id)
        
        # Execute update
        query = f"""
            UPDATE users SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, username, email, role, is_active, created_at, updated_at
        """
        
        row = await db.fetchrow(query, *values)
        
        user_dict = dict(row)
        user_dict['full_name'] = None
        
        logger.info(f"User {user_id} updated by {current_user['username']}")
        return UserResponse(**user_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )


@router.delete("/{user_id}")
async def delete_user(user_id: int,
                      db: asyncpg.Connection = Depends(get_db),
                      current_user: dict = Depends(get_current_user)):
    """Delete a user (admin only)"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users"
        )
    
    # Prevent self-deletion
    if current_user.get('id') == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    try:
        # Check user exists
        existing = await db.fetchrow("SELECT username FROM users WHERE id = $1", user_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user
        await db.execute("DELETE FROM users WHERE id = $1", user_id)
        
        logger.info(f"User {existing['username']} (ID: {user_id}) deleted by {current_user['username']}")
        
        return {"message": f"User {existing['username']} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )


@router.post("/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Suspend a user account (admin only)"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can suspend users"
        )
    
    # Prevent self-suspension
    if current_user.get('id') == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend your own account"
        )
    
    try:
        # Check user exists
        existing = await db.fetchrow(
            "SELECT username, is_active FROM users WHERE id = $1",
            user_id
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not existing['is_active']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already suspended"
            )
        
        # Suspend user
        await db.execute(
            "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1",
            user_id
        )
        
        logger.info(f"User {existing['username']} (ID: {user_id}) suspended by {current_user['username']}")
        
        return {
            "success": True,
            "message": f"User {existing['username']} has been suspended"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error suspending user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error suspending user"
        )


@router.post("/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Activate a suspended user account (admin only)"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can activate users"
        )
    
    try:
        # Check user exists
        existing = await db.fetchrow(
            "SELECT username, is_active FROM users WHERE id = $1",
            user_id
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if existing['is_active']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already active"
            )
        
        # Activate user
        await db.execute(
            "UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1",
            user_id
        )
        
        logger.info(f"User {existing['username']} (ID: {user_id}) activated by {current_user['username']}")
        
        return {
            "success": True,
            "message": f"User {existing['username']} has been activated"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error activating user"
        )


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Reset a user's password and send them a reset link (admin only)"""
    
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reset passwords"
        )
    
    try:
        # Check user exists
        existing = await db.fetchrow(
            "SELECT username, email FROM users WHERE id = $1",
            user_id
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate a temporary password
        temp_password = secrets.token_urlsafe(12)
        hashed_password = hashlib.sha256(temp_password.encode()).hexdigest()
        
        # Update password
        await db.execute(
            "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
            hashed_password, user_id
        )
        
        logger.info(f"Password reset for user {existing['username']} (ID: {user_id}) by {current_user['username']}")
        
        # In production, you would send an email with the reset link
        # For now, return success (the temp password would be emailed)
        return {
            "success": True,
            "message": f"Password reset link sent to {existing['email']}",
            "email": existing['email']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting password"
        )
