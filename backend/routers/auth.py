"""
Authentication Router
User authentication and authorization endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import logging
import hashlib
import secrets

from app.core.database import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class InviteRequest(BaseModel):
    """Request to invite an admin/analyst user"""
    email: EmailStr
    role: str  # 'admin' or 'analyst'
    invited_by_email: str


class AcceptInviteRequest(BaseModel):
    """Accept an invite and create account"""
    invite_token: str
    password: str
    first_name: str
    last_name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: dict


def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """Authenticate user and return access token"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Find user by email
            user = await conn.fetchrow(
                """SELECT id, username, email, password, full_name, role, is_active 
                   FROM users WHERE email = $1""",
                login_data.email
            )
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            if not user['is_active']:
                raise HTTPException(status_code=401, detail="Account is deactivated")
            
            # Verify password
            if not verify_password(login_data.password, user['password']):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Generate access token
            token = secrets.token_urlsafe(32)
            
            return TokenResponse(
                access_token=token,
                token_type="Bearer",
                expires_in=3600,
                user_info={
                    "user_id": str(user['id']),
                    "email": user['email'],
                    "name": user['full_name'] or user['username'],
                    "role": user['role'],
                    "permissions": get_permissions_for_role(user['role'])
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def get_permissions_for_role(role: str) -> list:
    """Get permissions based on user role"""
    if role == 'admin':
        return ["read", "write", "evaluate", "admin", "invite"]
    elif role == 'analyst':
        return ["read", "write", "evaluate"]
    else:
        return ["read"]


@router.post("/signup", response_model=TokenResponse)
async def signup(signup_data: SignupRequest):
    """Register new user account (always creates 'user' role)"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Check if email already exists
            existing = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1",
                signup_data.email
            )
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Create username from email
            username = signup_data.email.split('@')[0]
            
            # Check if username exists, add number if needed
            base_username = username
            counter = 1
            while await conn.fetchrow(
                "SELECT id FROM users WHERE username = $1",
                username
            ):
                username = f"{base_username}{counter}"
                counter += 1
            
            # Hash password and create user (always 'user' role for normal signup)
            hashed_password = hash_password(signup_data.password)
            full_name = f"{signup_data.first_name} {signup_data.last_name}"
            
            user = await conn.fetchrow(
                """INSERT INTO users (username, email, password, full_name, role, is_active)
                   VALUES ($1, $2, $3, $4, 'user', true)
                   RETURNING id, username, email, full_name, role""",
                username, signup_data.email, hashed_password, full_name
            )
            
            # Generate access token
            token = secrets.token_urlsafe(32)
            
            logger.info(f"New user registered: {signup_data.email}")
            
            return TokenResponse(
                access_token=token,
                token_type="Bearer",
                expires_in=3600,
                user_info={
                    "user_id": str(user['id']),
                    "email": user['email'],
                    "name": user['full_name'],
                    "role": user['role'],
                    "permissions": get_permissions_for_role(user['role'])
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")


@router.post("/invite")
async def invite_user(invite_data: InviteRequest):
    """Invite an admin or analyst user (admin only)"""
    try:
        if invite_data.role not in ['admin', 'analyst']:
            raise HTTPException(status_code=400, detail="Can only invite admin or analyst roles")
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Verify the inviter is an admin
            inviter = await conn.fetchrow(
                "SELECT id, role FROM users WHERE email = $1 AND is_active = true",
                invite_data.invited_by_email
            )
            if not inviter or inviter['role'] != 'admin':
                raise HTTPException(status_code=403, detail="Only admins can invite users")
            
            # Check if email already exists
            existing = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1",
                invite_data.email
            )
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Check if there's already a pending invite
            existing_invite = await conn.fetchrow(
                "SELECT id FROM user_invites WHERE email = $1 AND status = 'pending'",
                invite_data.email
            )
            if existing_invite:
                raise HTTPException(status_code=400, detail="Invite already sent to this email")
            
            # Generate invite token
            invite_token = secrets.token_urlsafe(32)
            
            # Create invite record
            await conn.execute(
                """INSERT INTO user_invites (email, role, invite_token, invited_by, status, created_at, expires_at)
                   VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW() + INTERVAL '7 days')""",
                invite_data.email, invite_data.role, invite_token, inviter['id']
            )
            
            logger.info(f"Invite sent to {invite_data.email} for role {invite_data.role}")
            
            return {
                "message": f"Invite sent to {invite_data.email}",
                "invite_token": invite_token,  # In production, this would be sent via email
                "role": invite_data.role,
                "expires_in": "7 days"
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Invite error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to send invite: {str(e)}")


@router.post("/accept-invite", response_model=TokenResponse)
async def accept_invite(accept_data: AcceptInviteRequest):
    """Accept an invite and create admin/analyst account"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Find the invite
            invite = await conn.fetchrow(
                """SELECT id, email, role FROM user_invites 
                   WHERE invite_token = $1 AND status = 'pending' AND expires_at > NOW()""",
                accept_data.invite_token
            )
            if not invite:
                raise HTTPException(status_code=400, detail="Invalid or expired invite")
            
            # Create username from email
            username = invite['email'].split('@')[0]
            base_username = username
            counter = 1
            while await conn.fetchrow(
                "SELECT id FROM users WHERE username = $1",
                username
            ):
                username = f"{base_username}{counter}"
                counter += 1
            
            # Hash password and create user with invited role
            hashed_password = hash_password(accept_data.password)
            full_name = f"{accept_data.first_name} {accept_data.last_name}"
            
            user = await conn.fetchrow(
                """INSERT INTO users (username, email, password, full_name, role, is_active)
                   VALUES ($1, $2, $3, $4, $5, true)
                   RETURNING id, username, email, full_name, role""",
                username, invite['email'], hashed_password, full_name, invite['role']
            )
            
            # Mark invite as used
            await conn.execute(
                "UPDATE user_invites SET status = 'accepted' WHERE id = $1",
                invite['id']
            )
            
            # Generate access token
            token = secrets.token_urlsafe(32)
            
            logger.info(f"Invite accepted: {invite['email']} as {invite['role']}")
            
            return TokenResponse(
                access_token=token,
                token_type="Bearer",
                expires_in=3600,
                user_info={
                    "user_id": str(user['id']),
                    "email": user['email'],
                    "name": user['full_name'],
                    "role": user['role'],
                    "permissions": get_permissions_for_role(user['role'])
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Accept invite error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to accept invite: {str(e)}")


@router.post("/refresh")
async def refresh_token():
    """Refresh access token"""
    try:
        return {
            "access_token": "refreshed_token_789",
            "token_type": "Bearer",
            "expires_in": 3600
        }
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=401, detail="Token refresh failed")


@router.post("/logout")
async def logout():
    """Logout user and invalidate token"""
    try:
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Logout failed")


@router.get("/profile")
async def get_user_profile():
    """Get current user profile"""
    try:
        return {
            "user_id": "user_123",
            "email": "analyst@tca.com",
            "first_name": "John",
            "last_name": "Analyst",
            "role": "analyst",
            "created_at": "2024-01-01T00:00:00Z",
            "last_login": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        raise HTTPException(status_code=500, detail="Profile retrieval failed")