"""
Authentication endpoints with improved error handling and validation

Enhanced with:
- Account lockout protection
- Password policy enforcement
- Audit logging
- Token blacklisting for secure logout
- Password reset functionality
"""

import logging
import secrets
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
            "SELECT id, username, email, role, is_active, created_at FROM users WHERE username = $1",
            username)

        if user is None:
            raise credentials_exception

        user_dict = dict(user)
        user_dict['full_name'] = None  # Column doesn't exist in DB
        if not user_dict['is_active']:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="User account is inactive")

        return user_dict

    except Exception as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database error")


async def get_user_by_username(db: asyncpg.Connection, username: str) -> dict:
    """Get user by username"""
    try:
        user = await db.fetchrow(
            "SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1",
            username)
        if user:
            user_dict = dict(user)
            # Map password_hash to password for compatibility with verify_password
            user_dict['password'] = user_dict.pop('password_hash', None)
            user_dict['full_name'] = None  # Column doesn't exist in DB
            return user_dict
        return None
    except Exception as e:
        logger.error(f"Error fetching user {username}: {e}")
        return None


@router.post("/login", response_model=Token)
async def login(request: Request,
                user_credentials: UserLogin,
                db: asyncpg.Connection = Depends(get_db)):
    """
    Authenticate user and return access token
    
    - **username**: User's username
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
        is_locked, minutes_remaining = await account_lockout.is_locked(user_credentials.username)
        if is_locked:
            await audit_logger.log(
                AuditEventType.LOGIN_FAILED,
                username=user_credentials.username,
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
        
        # Get user from database
        user = await get_user_by_username(db, user_credentials.username)

        if not user:
            # Record failed attempt
            locked, remaining = await account_lockout.record_failed_attempt(
                user_credentials.username, client_ip
            )
            await audit_logger.log(
                AuditEventType.LOGIN_FAILED,
                username=user_credentials.username,
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"reason": "user_not_found"},
                success=False,
                db=db
            )
            logger.warning(f"Login attempt for non-existent user: {user_credentials.username}")
            detail = "Incorrect username or password"
            if locked:
                detail += ". Account has been locked due to multiple failed attempts"
            elif remaining <= 2:
                detail += f". {remaining} attempts remaining before lockout"
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

        # Verify password
        if not verify_password(user_credentials.password, user['password']):
            # Record failed attempt
            locked, remaining = await account_lockout.record_failed_attempt(
                user_credentials.username, client_ip
            )
            await audit_logger.log(
                AuditEventType.LOGIN_FAILED,
                user_id=user['id'],
                username=user_credentials.username,
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"reason": "invalid_password", "locked": locked},
                success=False,
                db=db
            )
            logger.warning(f"Failed login attempt for user: {user_credentials.username}")
            detail = "Incorrect username or password"
            if locked:
                await audit_logger.log(
                    AuditEventType.ACCOUNT_LOCKED,
                    user_id=user['id'],
                    username=user_credentials.username,
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
                username=user_credentials.username,
                ip_address=client_ip,
                user_agent=user_agent,
                action_details={"reason": "account_inactive"},
                success=False,
                db=db
            )
            logger.warning(f"Login attempt for inactive user: {user_credentials.username}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Account is inactive")

        # Clear failed attempts on successful login
        await account_lockout.clear_failed_attempts(user_credentials.username)
        
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
        
        logger.info(f"Successful login for user: {user_credentials.username}")

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

        # Insert new user - using correct column names (password_hash not password)
        user_id = await db.fetchval(
            """
            INSERT INTO users (username, email, password_hash, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
            """, user_data.username, user_data.email, hashed_password,
            user_data.role.value, user_data.is_active)

        # Fetch created user
        created_user_row = await db.fetchrow(
            """
            SELECT id, username, email, role, is_active, created_at, updated_at
            FROM users WHERE id = $1
            """, user_id)
        
        # Add full_name as None for compatibility with UserResponse model
        created_user = dict(created_user_row)
        created_user['full_name'] = None

        # Log successful registration
        await audit_logger.log(
            AuditEventType.USER_CREATED,
            user_id=user_id,
            username=user_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
            action_details={"email": user_data.email, "role": user_data.role.value},
            success=True,
            db=db
        )
        
        logger.info(f"New user registered: {user_data.username}")

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
            
            # In a production system, you would send an email here with the reset link
            # For now, we just log the token (in real app, send email)
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
