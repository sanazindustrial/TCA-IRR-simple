"""
Authentication Router
User authentication and authorization endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import logging

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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: dict


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """Authenticate user and return access token"""
    try:
        # Mock authentication logic
        return TokenResponse(access_token="mock_access_token_123",
                             token_type="Bearer",
                             expires_in=3600,
                             user_info={
                                 "user_id": "user_123",
                                 "email": login_data.email,
                                 "role": "analyst",
                                 "permissions": ["read", "write", "evaluate"]
                             })
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


@router.post("/signup", response_model=TokenResponse)
async def signup(signup_data: SignupRequest):
    """Register new user account"""
    try:
        # Mock user registration
        return TokenResponse(access_token="mock_access_token_456",
                             token_type="Bearer",
                             expires_in=3600,
                             user_info={
                                 "user_id": "user_456",
                                 "email": signup_data.email,
                                 "first_name": signup_data.first_name,
                                 "last_name": signup_data.last_name,
                                 "role": "user",
                                 "permissions": ["read"]
                             })
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail="Registration failed")


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