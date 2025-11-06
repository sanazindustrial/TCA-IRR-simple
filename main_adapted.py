#!/usr/bin/env python3
"""
TCA IRR Platform Backend - Adapted for Existing Database Schema
Compatible with the existing database structure using id/username instead of user_id/full_name.
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import asyncpg
import bcrypt
import jwt
import uuid
from datetime import datetime, timedelta
import logging
from database_config import DatabaseManager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="TCA IRR Platform API",
              description="Investment Risk Rating Platform Backend",
              version="1.0.0")


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(
        f"🌐 Incoming request: {request.method} {request.url} from {request.client}"
    )
    response = await call_next(request)
    logger.info(f"🌐 Response: {response.status_code}")
    return response


# Add CORS middleware
app.add_middleware(CORSMiddleware,
                   allow_origins=[
                       "http://localhost:3000", "http://127.0.0.1:3000",
                       "http://localhost:3001", "http://127.0.0.1:3001",
                       "http://localhost:8080", "http://127.0.0.1:8080"
                   ],
                   allow_credentials=True,
                   allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                   allow_headers=["*"],
                   expose_headers=["*"])


# Add explicit preflight handler for debugging
@app.options("/{full_path:path}")
async def handle_preflight(full_path: str, request: Request):
    logger.info(f"🔧 CORS Preflight for path: {full_path}")
    logger.info(
        f"🔧 Origin: {request.headers.get('origin', 'No origin header')}")
    logger.info(
        f"🔧 Access-Control-Request-Method: {request.headers.get('access-control-request-method', 'None')}"
    )
    logger.info(
        f"🔧 Access-Control-Request-Headers: {request.headers.get('access-control-request-headers', 'None')}"
    )
    return {"message": "CORS preflight handled"}


# Initialize database manager
from database_config import DatabaseConfig

db_config = DatabaseConfig()
db_manager = DatabaseManager(db_config)

# Security settings
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
security = HTTPBearer()

# === PYDANTIC MODELS ===


class UserCreate(BaseModel):
    username: str  # Changed from full_name
    email: EmailStr
    password: str
    role: Optional[str] = "User"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int  # Changed from user_id (UUID)
    username: str  # Changed from full_name
    email: str
    role: Optional[str]
    is_active: Optional[bool]
    created_at: Optional[datetime]


class CompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None


class EvaluationCreate(BaseModel):
    id: int  # Changed from user_id
    company_id: int  # Assuming this exists
    title: str
    description: Optional[str] = None


class RequestCreate(BaseModel):
    id: int  # Changed from user_id
    company_id: Optional[int] = None
    request_type: str
    title: str
    description: str
    priority: Optional[str] = "Medium"


# === AUTHENTICATION FUNCTIONS ===


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'),
                         bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401,
                                detail="Invalid authentication credentials")

        async with db_manager.get_connection() as conn:
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE id = $1 AND is_active = true",  # Changed: id instead of user_id, is_active instead of status
                int(user_id))

        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        return dict(user)

    except jwt.PyJWTError:
        raise HTTPException(status_code=401,
                            detail="Invalid authentication credentials")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# === API ENDPOINTS ===


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "TCA IRR Platform API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        async with db_manager.get_connection() as conn:
            await conn.fetchrow("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }


# === USER MANAGEMENT ===


@app.post("/api/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        async with db_manager.get_connection() as conn:
            # Check if user already exists
            existing_user = await conn.fetchrow(
                "SELECT email FROM users WHERE email = $1", user_data.email)

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="User with this email already exists")

            # Hash password and create user
            hashed_password = hash_password(user_data.password)

            # Insert user (adapted for existing schema)
            user = await conn.fetchrow(
                """
                INSERT INTO users (username, email, password_hash, role, is_active, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            """, user_data.username, user_data.email, hashed_password,
                user_data.role, True, datetime.utcnow())

            return UserResponse(**dict(user))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="User registration failed")


@app.post("/api/auth/login")
async def login_user(login_data: UserLogin):
    """Login user and return access token"""
    try:
        async with db_manager.get_connection() as conn:
            # Find user by email
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1 AND is_active = true",
                login_data.email)

            if not user or not verify_password(login_data.password,
                                               user['password_hash']):
                raise HTTPException(status_code=401,
                                    detail="Invalid email or password")

            # Update last login (if column exists)
            try:
                await conn.execute(
                    "UPDATE users SET updated_at = NOW() WHERE id = $1",  # Changed: id instead of user_id
                    user['id'])
            except:
                pass  # Column might not exist

            # Create access token
            access_token = create_access_token({"sub": str(
                user['id'])})  # Changed: id instead of user_id

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse(**dict(user))
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(
        current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user)


# === REQUEST MANAGEMENT ===


@app.post("/api/requests")
async def create_request(request_data: RequestCreate,
                         current_user: dict = Depends(get_current_user)):
    """Create a new request"""
    try:
        async with db_manager.get_connection() as conn:
            # Check if app_requests table exists and its structure
            table_check = await conn.fetchrow("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'app_requests' AND column_name = 'user_id'
            """)

            if table_check:
                # Table has user_id column
                request = await conn.fetchrow(
                    """
                    INSERT INTO app_requests (user_id, company_id, request_type, title, description, priority, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                """, current_user['id'], request_data.company_id,
                    request_data.request_type, request_data.title,
                    request_data.description, request_data.priority,
                    datetime.utcnow())
            else:
                # Table might have different structure, insert basic info
                request = await conn.fetchrow(
                    """
                    INSERT INTO app_requests (request_type, title, description, created_at)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                """, request_data.request_type, request_data.title,
                    request_data.description, datetime.utcnow())

        return {
            "message": "Request created successfully",
            "request": dict(request)
        }

    except Exception as e:
        logger.error(f"Request creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create request")


@app.get("/api/requests")
async def get_user_requests(current_user: dict = Depends(get_current_user)):
    """Get current user's requests"""
    try:
        async with db_manager.get_connection() as conn:
            requests = await conn.fetch(
                "SELECT * FROM app_requests ORDER BY created_at DESC LIMIT 50")

        return {"requests": [dict(req) for req in requests]}

    except Exception as e:
        logger.error(f"Request retrieval error: {str(e)}")
        raise HTTPException(status_code=500,
                            detail="Failed to retrieve requests")


# === COMPANY MANAGEMENT ===


@app.get("/api/companies")
async def get_companies(current_user: dict = Depends(get_current_user)):
    """Get all companies"""
    try:
        async with db_manager.get_connection() as conn:
            companies = await conn.fetch(
                "SELECT * FROM companies ORDER BY created_at DESC LIMIT 50")

        return {"companies": [dict(company) for company in companies]}

    except Exception as e:
        logger.error(f"Company retrieval error: {str(e)}")
        raise HTTPException(status_code=500,
                            detail="Failed to retrieve companies")


# === CORS PREFLIGHT HANDLER ===

from fastapi import Request


@app.options("/{full_path:path}")
async def preflight_handler(request: Request, full_path: str):
    """Handle CORS preflight requests"""
    return {"message": "OK"}


# === EVALUATION ENDPOINTS ===


@app.get("/api")
@app.get("/api/")
async def api_root():
    """API root endpoint - provides available endpoints information"""
    logger.info("📡 API root endpoint accessed")
    return {
        "message": "TCA IRR Platform API",
        "version": "1.0.0",
        "status": "running",
        "available_endpoints": {
            "authentication": {
                "register": "POST /auth/register",
                "login": "POST /auth/login",
                "me": "GET /auth/me",
                "update_profile": "PUT /auth/profile"
            },
            "companies": {
                "create": "POST /api/companies",
                "list": "GET /api/companies",
                "get": "GET /api/companies/{id}",
                "update": "PUT /api/companies/{id}",
                "delete": "DELETE /api/companies/{id}"
            },
            "evaluations": {
                "list": "GET /api/evaluations",
                "create": "POST /api/evaluations",
                "get": "GET /api/evaluations/{id}",
                "update": "PUT /api/evaluations/{id}"
            },
            "documentation": "GET /docs"
        }
    }


# === EVALUATION ENDPOINTS ===


@app.get("/api/evaluations")
async def get_evaluations(current_user: dict = Depends(get_current_user)):
    """Get evaluations for current user"""
    try:
        async with db_manager.get_connection() as conn:
            evaluations = await conn.fetch(
                "SELECT * FROM evaluations ORDER BY created_at DESC LIMIT 50")

        return {
            "evaluations": [dict(evaluation) for evaluation in evaluations]
        }

    except Exception as e:
        logger.error(f"Evaluation retrieval error: {str(e)}")
        raise HTTPException(status_code=500,
                            detail="Failed to retrieve evaluations")


# === ADMIN ENDPOINTS ===


@app.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Get admin statistics"""
    if current_user.get('role') != 'Admin':
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        async with db_manager.get_connection() as conn:
            stats = {}

            # Get basic counts
            stats['users'] = await conn.fetchval("SELECT COUNT(*) FROM users")
            stats['companies'] = await conn.fetchval(
                "SELECT COUNT(*) FROM companies")
            stats['evaluations'] = await conn.fetchval(
                "SELECT COUNT(*) FROM evaluations")
            stats['requests'] = await conn.fetchval(
                "SELECT COUNT(*) FROM app_requests")

        return {"stats": stats}

    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        raise HTTPException(status_code=500,
                            detail="Failed to retrieve statistics")


# === STARTUP/SHUTDOWN EVENTS ===


@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    logger.info("🚀 Starting TCA IRR Platform Backend...")
    logger.info("✅ Backend server is ready!")
    logger.info("📡 API Documentation: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    logger.info("🔄 Shutting down TCA IRR Platform Backend...")
    await db_manager.close_pool()
    logger.info("✅ Backend shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_adapted:app",
                host="0.0.0.0",
                port=8000,
                reload=False,
                log_level="info")
