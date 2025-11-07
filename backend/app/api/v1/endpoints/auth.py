"""
Authentication endpoints with improved error handling and validation
"""

import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import asyncpg

from app.core import settings, create_access_token, verify_token, get_password_hash, verify_password
from app.db import get_db
from app.models import (UserLogin, UserCreate, UserResponse, Token,
                        BaseResponse, ErrorResponse)

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(
    security),
                           db: asyncpg.Connection = Depends(get_db)) -> dict:
    """Get current authenticated user"""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
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
        user = await db.fetchrow(
            "SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE username = $1",
            username)

        if user is None:
            raise credentials_exception

        if not user['is_active']:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="User account is inactive")

        return dict(user)

    except Exception as e:
        logger.error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database error")


async def get_user_by_username(db: asyncpg.Connection, username: str) -> dict:
    """Get user by username"""
    try:
        user = await db.fetchrow("SELECT * FROM users WHERE username = $1",
                                 username)
        return dict(user) if user else None
    except Exception as e:
        logger.error(f"Error fetching user {username}: {e}")
        return None


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin,
                db: asyncpg.Connection = Depends(get_db)):
    """
    Authenticate user and return access token
    
    - **username**: User's username
    - **password**: User's password
    """
    try:
        # Get user from database
        user = await get_user_by_username(db, user_credentials.username)

        if not user:
            logger.warning(
                f"Login attempt for non-existent user: {user_credentials.username}"
            )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Incorrect username or password")

        # Verify password
        if not verify_password(user_credentials.password, user['password']):
            logger.warning(
                f"Failed login attempt for user: {user_credentials.username}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Incorrect username or password")

        # Check if user is active
        if not user['is_active']:
            logger.warning(
                f"Login attempt for inactive user: {user_credentials.username}"
            )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Account is inactive")

        # Create access token
        access_token_expires = timedelta(
            minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(data={
            "sub": user['username'],
            "role": user['role']
        },
                                           expires_delta=access_token_expires)

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
async def register(user_data: UserCreate,
                   db: asyncpg.Connection = Depends(get_db)):
    """
    Register a new user
    
    - **username**: Unique username (3-50 characters)
    - **email**: Valid email address
    - **password**: Password (minimum 8 characters)
    - **confirm_password**: Password confirmation
    - **full_name**: Optional full name
    """
    try:
        # Check if username already exists
        existing_user = await db.fetchrow(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            user_data.username, user_data.email)

        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Username or email already registered")

        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Insert new user
        user_id = await db.fetchval(
            """
            INSERT INTO users (username, email, password, full_name, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
            """, user_data.username, user_data.email, hashed_password,
            user_data.full_name, user_data.role.value, user_data.is_active)

        # Fetch created user
        created_user = await db.fetchrow(
            """
            SELECT id, username, email, full_name, role, is_active, created_at, updated_at
            FROM users WHERE id = $1
            """, user_id)

        logger.info(f"New user registered: {user_data.username}")

        return UserResponse(**dict(created_user))

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
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout current user
    
    Note: JWT tokens are stateless, so actual logout requires client-side token removal
    """
    logger.info(f"User logged out: {current_user['username']}")

    return BaseResponse(
        message=
        "Logout successful. Please remove the token from client storage.")
