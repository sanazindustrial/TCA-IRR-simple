"""
Authentication endpoints with improved error handling and validation

Enhanced with:
- Account lockout protection
- Password policy enforcement
- Audit logging
- Token blacklisting for secure logout
- Password reset functionality
- Invite-based signup for admin/analyst roles
"""

import logging
import secrets
from datetime import timedelta, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
import asyncpg

from app.core import (settings, create_access_token, verify_token, 
                      get_password_hash, verify_password,
                      account_lockout, token_blacklist, PasswordPolicy,
                      audit_logger, AuditEventType)
from app.db import get_db
from app.models import (UserLogin, UserCreate, UserResponse, Token,
                        BaseResponse, ErrorResponse,
                        ForgotPasswordRequest, ForgotPasswordResponse,
                        ResetPasswordRequest, ResetPasswordResponse)
from app.services.email_service import (
    send_password_reset_email, 
    send_welcome_email, 
    send_invite_email,
    email_service
)

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# In-memory password reset token storage (for production, use Redis or database)
password_reset_tokens: dict = {}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(
    security),
                           db: asyncpg.Connection = Depends(get_db)) -> dict:
    """Get current authenticated user with token blacklist check"""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        
        # Check if token is blacklisted
        if await token_blacklist.is_blacklisted(token):
            logger.warning("Attempted use of blacklisted token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked"
            )
        
        payload = verify_token(token)

        if payload is None:
            raise credentials_exception

        username = payload.get("sub")
        if username is None:
            raise credentials_exception

    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Token validation failed: {e}")
        raise credentials_exception

    try:
        user = await db.fetchrow(
            "SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE username = $1",
            username)

        if user is None:
            raise credentials_exception

        user_dict = dict(user)
        if not user_dict['is_active']:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="User account is inactive")

        return user_dict

    except Exception as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database error")


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    db: asyncpg.Connection = Depends(get_db)
) -> dict | None:
    """Get current user if authenticated, otherwise return None.
    Does not raise exception for unauthenticated requests."""
    
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        
        # Check if token is blacklisted
        if await token_blacklist.is_blacklisted(token):
            return None
        
        payload = verify_token(token)
        if payload is None:
            return None

        username = payload.get("sub")
        if username is None:
            return None

        user = await db.fetchrow(
            "SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE username = $1",
            username)

        if user is None or not user['is_active']:
            return None

        return dict(user)

    except Exception as e:
        logger.debug(f"Optional auth check failed: {e}")
        return None


async def get_user_by_username(db: asyncpg.Connection, username: str) -> dict:
    """Get user by username"""
    try:
        user = await db.fetchrow(
            "SELECT id, username, email, full_name, password_hash, role, is_active FROM users WHERE username = $1",
            username)
        if user:
            user_dict = dict(user)
            # Map password_hash to password for compatibility with verify_password
            user_dict['password'] = user_dict.pop('password_hash', None)
            return user_dict
        return None
    except Exception as e:
        logger.error(f"Error fetching user {username}: {e}")
        return None


async def get_user_by_email(db: asyncpg.Connection, email: str) -> dict:
    """Get user by email address"""
    try:
        user = await db.fetchrow(
            "SELECT id, username, email, full_name, password_hash, role, is_active FROM users WHERE email = $1",
            email)
        if user:
            user_dict = dict(user)
            # Map password_hash to password for compatibility with verify_password
            user_dict['password'] = user_dict.pop('password_hash', None)
            return user_dict
        return None
    except Exception as e:
        logger.error(f"Error fetching user by email {email}: {e}")
        return None


@router.post("/login", response_model=Token)
async def login(request: Request,
                user_credentials: UserLogin,
                db: asyncpg.Connection = Depends(get_db)):
    """
    Authenticate user and return access token
    
    - **email**: User's email address
    - **password**: User's password
    
    Security features:
    - Account lockout after 5 failed attempts
    - Audit logging for all login attempts
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Check if account is locked
        is_locked, minutes_remaining = await account_lockout.is_locked(user_credentials.email)
        if is_locked:
            await audit_logger.log(
                AuditEventType.LOGIN_FAILED,
                username=user_credentials.email,
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"reason": "account_locked", "minutes_remaining": minutes_remaining},
                success=False,
                db=db
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Account locked. Try again in {minutes_remaining} minutes"
            )
        
        # Get user from database by email
        user = await get_user_by_email(db, user_credentials.email)

        if not user:
            # Record failed attempt
            locked, remaining = await account_lockout.record_failed_attempt(
                user_credentials.email, client_ip
            )
            await audit_logger.log(
                AuditEventType.LOGIN_FAILED,
                username=user_credentials.email,
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"reason": "user_not_found"},
                success=False,
                db=db
            )
            logger.warning(f"Login attempt for non-existent user: {user_credentials.email}")
            detail = "Incorrect email or password"
            if locked:
                detail += ". Account has been locked due to multiple failed attempts"
            elif remaining <= 2:
                detail += f". {remaining} attempts remaining before lockout"
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

        # Verify password
        if not verify_password(user_credentials.password, user['password']):
            # Record failed attempt
            locked, remaining = await account_lockout.record_failed_attempt(
                user_credentials.email, client_ip
            )
            await audit_logger.log(
                AuditEventType.LOGIN_FAILED,
                user_id=user['id'],
                username=user_credentials.email,
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"reason": "invalid_password", "locked": locked},
                success=False,
                db=db
            )
            logger.warning(f"Failed login attempt for user: {user_credentials.email}")
            detail = "Incorrect email or password"
            if locked:
                await audit_logger.log(
                    AuditEventType.ACCOUNT_LOCKED,
                    user_id=user['id'],
                    username=user_credentials.email,
                    ip_address=client_ip,
                    action_details={"reason": "max_failed_attempts"},
                    db=db
                )
                detail += ". Account has been locked due to multiple failed attempts"
            elif remaining <= 2:
                detail += f". {remaining} attempts remaining before lockout"
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

        # Check if user is active
        if not user['is_active']:
            await audit_logger.log(
                AuditEventType.LOGIN_FAILED,
                user_id=user['id'],
                username=user_credentials.email,
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"reason": "account_inactive"},
                success=False,
                db=db
            )
            logger.warning(f"Login attempt for inactive user: {user_credentials.email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Account is inactive")

        # Clear failed attempts on successful login
        await account_lockout.clear_failed_attempts(user_credentials.email)
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(data={
            "sub": user['username'],
            "role": user['role'],
            "user_id": user['id']
        }, expires_delta=access_token_expires)

        # Log successful login
        await audit_logger.log(
            AuditEventType.LOGIN_SUCCESS,
            user_id=user['id'],
            username=user['username'],
            ip_address=client_ip,
            user_agent=user_agent,
            success=True,
            db=db
        )
        
        logger.info(f"Successful login for user: {user_credentials.email}")

        return Token(access_token=access_token,
                     token_type="bearer",
                     expires_in=settings.access_token_expire_minutes * 60)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal server error during login")


@router.post("/register",
             response_model=UserResponse,
             status_code=status.HTTP_201_CREATED)
async def register(request: Request,
                   user_data: UserCreate,
                   db: asyncpg.Connection = Depends(get_db)):
    """
    Register a new user
    
    - **username**: Unique username (3-50 characters)
    - **email**: Valid email address
    - **password**: Password (minimum 8 characters with complexity requirements)
    - **confirm_password**: Password confirmation
    - **full_name**: Optional full name
    
    Password Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Validate password strength
        is_valid, errors = PasswordPolicy.validate(
            user_data.password, 
            username=user_data.username,
            email=user_data.email
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"password_errors": errors}
            )
        
        # Check if username or email already exists
        existing_user = await db.fetchrow(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            user_data.username, user_data.email)

        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Username or email already registered")

        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Public signup always creates 'user' role - admin/analyst require invitation
        signup_role = 'user'

        # Insert new user - using correct column names (password_hash not password)
        user_id = await db.fetchval(
            """
            INSERT INTO users (username, email, password_hash, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
            """, user_data.username, user_data.email, hashed_password,
            signup_role, user_data.is_active)

        # Fetch created user
        created_user_row = await db.fetchrow(
            """
            SELECT id, username, email, full_name, role, is_active, created_at, updated_at
            FROM users WHERE id = $1
            """, user_id)
        
        created_user = dict(created_user_row)

        # Log successful registration
        await audit_logger.log(
            AuditEventType.USER_CREATED,
            user_id=user_id,
            username=user_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
            action_details={"email": user_data.email, "role": signup_role},
            success=True,
            db=db
        )
        
        logger.info(f"New user registered: {user_data.username}")
        
        # Send welcome email
        try:
            email_sent = await send_welcome_email(
                to_email=user_data.email,
                username=user_data.username
            )
            if email_sent:
                logger.info(f"Welcome email sent to {user_data.email}")
            else:
                logger.warning(f"Failed to send welcome email to {user_data.email} - email service may not be configured")
        except Exception as email_error:
            logger.error(f"Error sending welcome email: {email_error}")

        return UserResponse(**created_user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal server error during registration")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
        current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    
    Requires valid JWT token in Authorization header
    """
    return UserResponse(**current_user)


@router.post("/logout", response_model=BaseResponse)
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Logout current user and invalidate token
    
    The token is added to a blacklist and will be rejected on future requests.
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Blacklist the token
    token = credentials.credentials
    await token_blacklist.blacklist_token(token)
    
    # Log the logout
    await audit_logger.log(
        AuditEventType.LOGOUT,
        user_id=current_user.get('id'),
        username=current_user['username'],
        ip_address=client_ip,
        user_agent=user_agent,
        success=True,
        db=db
    )
    
    logger.info(f"User logged out: {current_user['username']}")

    return BaseResponse(message="Logout successful. Token has been invalidated.")


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: Request,
    forgot_request: ForgotPasswordRequest,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Request a password reset email
    
    - **email**: The email address associated with the account
    
    For security, this endpoint always returns success even if the email doesn't exist.
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Check if user exists
        user = await db.fetchrow(
            "SELECT id, username, email FROM users WHERE email = $1",
            forgot_request.email
        )
        
        if user:
            # Generate password reset token
            reset_token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=1)
            
            # Store the reset token (in-memory for demo, use database/Redis for production)
            password_reset_tokens[reset_token] = {
                "user_id": user['id'],
                "email": user['email'],
                "username": user['username'],
                "expires_at": expires_at
            }
            
            # Log the password reset request
            await audit_logger.log(
                AuditEventType.PASSWORD_RESET_REQUEST,
                user_id=user['id'],
                username=user['username'],
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"email": forgot_request.email},
                success=True,
                db=db
            )
            
            logger.info(f"Password reset requested for user: {user['username']}, token: {reset_token[:8]}...")
            
            # Send password reset email
            try:
                email_sent = await send_password_reset_email(
                    to_email=user['email'],
                    reset_token=reset_token,
                    username=user['username']
                )
                if email_sent:
                    logger.info(f"Password reset email sent to {user['email']}")
                else:
                    logger.warning(f"Failed to send password reset email to {user['email']} - email service may not be configured")
            except Exception as email_error:
                logger.error(f"Error sending password reset email: {email_error}")
        else:
            # Log the attempt even if user doesn't exist (for security monitoring)
            logger.info(f"Password reset requested for non-existent email: {forgot_request.email}")
        
        # Always return success to prevent email enumeration
        return ForgotPasswordResponse(
            success=True,
            message="If an account exists with that email, a password reset link has been sent."
        )
        
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        # Return success even on error to prevent information leakage
        return ForgotPasswordResponse(
            success=True,
            message="If an account exists with that email, a password reset link has been sent."
        )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: Request,
    reset_request: ResetPasswordRequest,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Reset password using a valid reset token
    
    - **token**: The password reset token from the email link
    - **new_password**: The new password (must meet complexity requirements)
    - **confirm_password**: Confirmation of the new password
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Validate the reset token
        token_data = password_reset_tokens.get(reset_request.token)
        
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token"
            )
        
        # Check if token has expired
        if datetime.utcnow() > token_data['expires_at']:
            # Remove expired token
            del password_reset_tokens[reset_request.token]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token has expired"
            )
        
        # Validate the new password
        is_valid, errors = PasswordPolicy.validate(
            reset_request.new_password,
            username=token_data['username'],
            email=token_data['email']
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"password_errors": errors}
            )
        
        # Hash the new password
        hashed_password = get_password_hash(reset_request.new_password)
        
        # Update the user's password in the database
        await db.execute(
            "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
            hashed_password, token_data['user_id']
        )
        
        # Remove the used token
        del password_reset_tokens[reset_request.token]
        
        # Clear any account lockout for this user
        await account_lockout.clear_failed_attempts(token_data['username'])
        
        # Log the password reset
        await audit_logger.log(
            AuditEventType.PASSWORD_CHANGE,
            user_id=token_data['user_id'],
            username=token_data['username'],
            ip_address=client_ip,
            user_agent=user_agent,
            action_details={"method": "password_reset"},
            success=True,
            db=db
        )
        
        logger.info(f"Password reset successful for user: {token_data['username']}")
        
        return ResetPasswordResponse(
            success=True,
            message="Password has been reset successfully. You can now log in with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting your password"
        )


@router.get("/reset-password/validate/{token}")
async def validate_reset_token(token: str):
    """
    Validate a password reset token without using it
    
    - **token**: The password reset token to validate
    
    Returns whether the token is valid and not expired.
    """
    token_data = password_reset_tokens.get(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token"
        )
    
    if datetime.utcnow() > token_data['expires_at']:
        # Remove expired token
        del password_reset_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired"
        )
    
    return {
        "valid": True,
        "email": token_data['email'][:3] + "***" + token_data['email'][token_data['email'].index('@'):],
        "expires_in_minutes": int((token_data['expires_at'] - datetime.utcnow()).total_seconds() / 60)
    }


@router.get("/test/reset-token/{email}")
async def get_reset_token_for_testing(email: str):
    """
    TEST ONLY: Get the reset token for a given email.
    This endpoint is for development/testing purposes only and should be 
    disabled in production.
    """
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found"
        )
    
    # Find token for this email
    for token, data in password_reset_tokens.items():
        if data['email'] == email:
            return {
                "token": token,
                "email": email,
                "expires_at": data['expires_at'].isoformat(),
                "user_id": data['user_id']
            }
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No reset token found for this email"
    )


# =============================================
# INVITE-BASED SIGNUP FOR ADMIN/ANALYST ROLES
# =============================================

# In-memory invite token storage (for production, use Redis or database)
invite_tokens: dict = {}


class InviteRequest(BaseModel):
    """Request model for creating user invitation"""
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    role: str = Field(..., description="Role to assign: 'admin' or 'analyst'")


class InviteResponse(BaseModel):
    """Response model for invitation creation"""
    success: bool
    message: str
    invite_token: Optional[str] = None
    expires_at: Optional[str] = None


class AcceptInviteRequest(BaseModel):
    """Request model for accepting an invitation"""
    token: str
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    confirm_password: str
    full_name: Optional[str] = None

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        password = info.data.get('password')
        if password and v != password:
            raise ValueError('Passwords do not match')
        return v


class CompleteInviteRequest(BaseModel):
    """Request model for completing an invitation (simplified frontend version)"""
    token: str
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


@router.post("/invite", response_model=InviteResponse)
async def invite_user(
    request: Request,
    invite_data: InviteRequest,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Invite a new admin or analyst user (admin only)
    
    - **email**: Email address to send invitation to
    - **role**: Role to assign ('admin' or 'analyst')
    
    Only admins can create invitations for privileged roles.
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Check if current user is admin
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can invite admin or analyst users"
        )
    
    # Validate role
    if invite_data.role not in ['admin', 'analyst']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'admin' or 'analyst'"
        )
    
    try:
        # Check if email already exists
        existing_user = await db.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            invite_data.email
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        
        # Check if there's already a pending invite for this email
        for token, data in invite_tokens.items():
            if data['email'] == invite_data.email and datetime.utcnow() < data['expires_at']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An active invitation already exists for this email"
                )
        
        # Generate invite token
        invite_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)  # Invite valid for 7 days
        
        # Store the invite token
        invite_tokens[invite_token] = {
            "email": invite_data.email,
            "role": invite_data.role,
            "invited_by": current_user['id'],
            "invited_by_username": current_user['username'],
            "expires_at": expires_at,
            "created_at": datetime.utcnow()
        }
        
        # Log the invitation
        await audit_logger.log(
            AuditEventType.USER_CREATED,  # Use USER_CREATED for invite events
            user_id=current_user['id'],
            username=current_user['username'],
            ip_address=client_ip,
            user_agent=user_agent,
            action_details={
                "action": "invite_created",
                "invited_email": invite_data.email,
                "invited_role": invite_data.role
            },
            success=True,
            db=db
        )
        
        logger.info(f"Invite created by {current_user['username']} for {invite_data.email} as {invite_data.role}")
        
        # Send invitation email
        try:
            email_sent = await send_invite_email(
                to_email=invite_data.email,
                invite_token=invite_token,
                role=invite_data.role,
                invited_by=current_user['username']
            )
            if email_sent:
                logger.info(f"Invitation email sent to {invite_data.email}")
            else:
                logger.warning(f"Failed to send invitation email to {invite_data.email} - email service may not be configured")
        except Exception as email_error:
            logger.error(f"Error sending invitation email: {email_error}")
        
        return InviteResponse(
            success=True,
            message=f"Invitation created for {invite_data.email}. Token valid for 7 days.",
            invite_token=invite_token,
            expires_at=expires_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating invitation"
        )


@router.post("/accept-invite", response_model=UserResponse)
async def accept_invite(
    request: Request,
    accept_data: AcceptInviteRequest,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Accept an invitation and create an admin/analyst account
    
    - **token**: The invitation token received
    - **username**: Desired username
    - **password**: Password (minimum 8 characters with complexity requirements)
    - **confirm_password**: Password confirmation
    - **full_name**: Optional full name
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Validate the invite token
        token_data = invite_tokens.get(accept_data.token)
        
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invitation token"
            )
        
        # Check if token has expired
        if datetime.utcnow() > token_data['expires_at']:
            # Remove expired token
            del invite_tokens[accept_data.token]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation token has expired"
            )
        
        # Validate password strength
        is_valid, errors = PasswordPolicy.validate(
            accept_data.password,
            username=accept_data.username,
            email=token_data['email']
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"password_errors": errors}
            )
        
        # Check if username already exists
        existing_user = await db.fetchrow(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            accept_data.username, token_data['email']
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered"
            )
        
        # Hash password
        hashed_password = get_password_hash(accept_data.password)
        
        # Create the user with the invited role
        user_id = await db.fetchval(
            """
            INSERT INTO users (username, email, password_hash, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, TRUE, NOW())
            RETURNING id
            """,
            accept_data.username,
            token_data['email'],
            hashed_password,
            token_data['role']
        )
        
        # Remove the used invite token
        del invite_tokens[accept_data.token]
        
        # Fetch created user
        created_user_row = await db.fetchrow(
            """
            SELECT id, username, email, role, is_active, created_at, updated_at
            FROM users WHERE id = $1
            """, user_id
        )
        
        created_user = dict(created_user_row)
        created_user['full_name'] = accept_data.full_name
        
        # Log the account creation
        await audit_logger.log(
            AuditEventType.USER_CREATED,
            user_id=user_id,
            username=accept_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
            action_details={
                "email": token_data['email'],
                "role": token_data['role'],
                "invited_by": token_data['invited_by_username'],
                "method": "invitation"
            },
            success=True,
            db=db
        )
        
        logger.info(f"User {accept_data.username} accepted invite as {token_data['role']}")
        
        # Send welcome email to the new user
        try:
            email_sent = await send_welcome_email(
                to_email=token_data['email'],
                username=accept_data.username
            )
            if email_sent:
                logger.info(f"Welcome email sent to {token_data['email']}")
            else:
                logger.warning(f"Failed to send welcome email to {token_data['email']} - email service may not be configured")
        except Exception as email_error:
            logger.error(f"Error sending welcome email: {email_error}")
        
        return UserResponse(**created_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating account"
        )


@router.post("/complete-invite", response_model=UserResponse)
async def complete_invite(
    request: Request,
    complete_data: CompleteInviteRequest,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Complete an invitation and create an admin/analyst account (simplified version)
    
    This endpoint is compatible with the frontend signup form for invites.
    Username is auto-generated from the invitation email.
    
    - **token**: The invitation token received
    - **password**: Password (minimum 8 characters with complexity requirements)
    - **full_name**: Optional full name
    """
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Validate the invite token
        token_data = invite_tokens.get(complete_data.token)
        
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invitation token"
            )
        
        # Check if token has expired
        if datetime.utcnow() > token_data['expires_at']:
            del invite_tokens[complete_data.token]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation token has expired"
            )
        
        # Generate username from email
        email = token_data['email']
        username = email.split('@')[0].replace('.', '_').replace('-', '_')[:50]
        
        # Validate password strength
        is_valid, errors = PasswordPolicy.validate(
            complete_data.password,
            username=username,
            email=email
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"password_errors": errors}
            )
        
        # Check if username already exists
        existing_user = await db.fetchrow(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            username, email
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account already exists for this email"
            )
        
        # Hash password and create user
        hashed_password = get_password_hash(complete_data.password)
        
        # Insert new user with role from invite
        user_id = await db.fetchval(
            """
            INSERT INTO users (username, email, password_hash, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, true, NOW())
            RETURNING id
            """,
            username, email, hashed_password, token_data['role']
        )
        
        # Remove used token
        del invite_tokens[complete_data.token]
        
        # Fetch created user
        created_user_row = await db.fetchrow(
            """
            SELECT id, username, email, role, is_active, created_at, updated_at
            FROM users WHERE id = $1
            """, user_id
        )
        created_user = dict(created_user_row)
        created_user['full_name'] = complete_data.full_name
        
        # Log successful account creation
        await audit_logger.log(
            AuditEventType.USER_CREATED,
            user_id=user_id,
            username=username,
            ip_address=client_ip,
            user_agent=user_agent,
            action_details={
                "email": email,
                "role": token_data['role'],
                "method": "invitation"
            },
            success=True,
            db=db
        )
        
        logger.info(f"User {username} completed invite as {token_data['role']}")
        
        # Send welcome email
        try:
            email_sent = await send_welcome_email(
                to_email=email,
                username=username
            )
            if email_sent:
                logger.info(f"Welcome email sent to {email}")
        except Exception as email_error:
            logger.error(f"Error sending welcome email: {email_error}")
        
        return UserResponse(**created_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing invite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating account"
        )


@router.get("/validate-invite")
async def validate_invite_query(token: str = Query(..., description="The invitation token to validate")):
    """
    Validate an invitation token using query parameter (frontend compatibility)
    
    - **token**: The invitation token to validate (as query param)
    
    Returns the email and role for the invitation.
    """
    token_data = invite_tokens.get(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation token"
        )
    
    if datetime.utcnow() > token_data['expires_at']:
        # Remove expired token
        del invite_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token has expired"
        )
    
    # Return full email for the signup form (frontend needs it to pre-fill)
    return {
        "valid": True,
        "email": token_data['email'],
        "role": token_data['role'],
        "invited_by": token_data['invited_by_username']
    }


@router.get("/invite/validate/{token}")
async def validate_invite_token(token: str):
    """
    Validate an invitation token without using it
    
    - **token**: The invitation token to validate
    
    Returns whether the token is valid and what role it's for.
    """
    token_data = invite_tokens.get(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation token"
        )
    
    if datetime.utcnow() > token_data['expires_at']:
        # Remove expired token
        del invite_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token has expired"
        )
    
    # Mask email for privacy
    email = token_data['email']
    masked_email = email[:3] + "***" + email[email.index('@'):]
    
    return {
        "valid": True,
        "email": masked_email,
        "role": token_data['role'],
        "invited_by": token_data['invited_by_username'],
        "expires_in_days": int((token_data['expires_at'] - datetime.utcnow()).total_seconds() / 86400)
    }


@router.get("/invites", response_model=List[dict])
async def list_pending_invites(
    current_user: dict = Depends(get_current_user)
):
    """
    List all pending invitations (admin only)
    """
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view pending invitations"
        )
    
    pending_invites = []
    current_time = datetime.utcnow()
    
    for token, data in invite_tokens.items():
        if current_time < data['expires_at']:
            pending_invites.append({
                "email": data['email'],
                "role": data['role'],
                "invited_by": data['invited_by_username'],
                "created_at": data['created_at'].isoformat(),
                "expires_at": data['expires_at'].isoformat(),
                "token_preview": token[:8] + "..."  # Show partial token for reference
            })
    
    return pending_invites


@router.delete("/invite/{email}")
async def revoke_invite(
    email: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Revoke a pending invitation (admin only)
    
    - **email**: Email address of the invitation to revoke
    """
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can revoke invitations"
        )
    
    # Find and remove the invite for this email
    token_to_remove = None
    for token, data in invite_tokens.items():
        if data['email'] == email:
            token_to_remove = token
            break
    
    if token_to_remove:
        del invite_tokens[token_to_remove]
        logger.info(f"Invite for {email} revoked by {current_user['username']}")
        return {"success": True, "message": f"Invitation for {email} has been revoked"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No pending invitation found for this email"
    )


# =============================================
# EMAIL SERVICE STATUS & TESTING ENDPOINTS
# =============================================

@router.get("/email/status")
async def email_service_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Check email service configuration status (admin only)
    
    Returns whether email service is configured and what provider is active.
    """
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can check email service status"
        )
    
    sendgrid_configured = bool(email_service.settings.sendgrid_api_key)
    smtp_configured = bool(email_service.settings.smtp_user and email_service.settings.smtp_password)
    
    return {
        "is_configured": email_service.is_configured,
        "provider": "sendgrid" if sendgrid_configured else ("smtp" if smtp_configured else "none"),
        "sendgrid_configured": sendgrid_configured,
        "smtp_configured": smtp_configured,
        "smtp_host": email_service.settings.smtp_host if smtp_configured else None,
        "from_email": email_service.settings.smtp_from_email,
        "from_name": email_service.settings.smtp_from_name,
        "frontend_url": email_service.settings.frontend_url,
        "message": "Email service is ready" if email_service.is_configured else "Email service not configured - set SENDGRID_API_KEY or SMTP_USER/SMTP_PASSWORD"
    }


class TestEmailRequest(BaseModel):
    """Request model for test email"""
    to_email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')


@router.post("/email/test")
async def send_test_email(
    request: TestEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a test email to verify email service configuration (admin only)
    
    - **to_email**: Email address to send test email to
    """
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send test emails"
        )
    
    if not email_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured. Set SENDGRID_API_KEY or SMTP credentials in Azure App Service settings."
        )
    
    try:
        # Send a test email
        test_content = f"""
        <h2>TCA Platform Email Test</h2>
        <p>This is a test email sent from the TCA Investment Platform.</p>
        <p><strong>Sent by:</strong> {current_user['username']}</p>
        <p><strong>Sent at:</strong> {datetime.utcnow().isoformat()}</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        """
        
        result = await email_service.send_email(
            to_email=request.to_email,
            subject="TCA Platform - Email Test",
            html_content=email_service._get_base_template(test_content),
            text_content=f"This is a test email from TCA Platform. Sent by {current_user['username']} at {datetime.utcnow().isoformat()}"
        )
        
        if result:
            logger.info(f"Test email sent to {request.to_email} by {current_user['username']}")
            return {
                "success": True,
                "message": f"Test email sent successfully to {request.to_email}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email. Check server logs for details."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending test email: {str(e)}"
        )
