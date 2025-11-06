#!/usr/bin/env python3
"""
TCA IRR App Backend
FastAPI backend server for the TCA Investment Risk Rating application
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncpg
import os
import logging
import uvicorn
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import jwt
import bcrypt
import uuid
from pydantic import BaseModel, EmailStr, validator
import asyncio
from pathlib import Path
import json

# Import database configuration
from database_config import db_manager, db_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY", "your-secret-key-change-in-production-TCA-IRR-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting TCA IRR Backend...")
    logger.info(
        f"Connecting to Azure PostgreSQL: {db_config.host}/{db_config.database}"
    )

    try:
        await db_manager.create_pool()

        # Perform initial health check
        health = await db_manager.health_check()
        logger.info(f"Database health check: {health['status']}")

        if health['status'] == 'healthy':
            logger.info(f"Connected to {health['version']}")
            logger.info(f"Found {health['table_count']} tables in database")
        else:
            logger.warning(
                f"Database health check failed: {health.get('error')}")

    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down TCA IRR Backend...")
    await db_manager.close_pool()


# Create FastAPI app
app = FastAPI(
    title="TCA IRR Backend API",
    description="Backend API for TCA Investment Risk Rating Application",
    version="1.0.0",
    lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Pydantic models
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "User"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: str
    full_name: str
    email: str
    role: str
    status: str
    avatar_url: Optional[str] = None
    created_at: datetime
    last_activity: Optional[datetime] = None


class AppRequestCreate(BaseModel):
    request_type: str
    title: str
    description: str
    priority: str = "medium"


class AppRequestResponse(BaseModel):
    request_id: str
    user_id: str
    request_type: str
    title: str
    description: str
    priority: str
    status: str
    submitted_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None


class EvaluationCreate(BaseModel):
    company_name: str
    evaluation_data: Dict[str, Any]
    request_id: Optional[str] = None


class EvaluationResponse(BaseModel):
    evaluation_id: str
    user_id: str
    company_name: str
    status: str
    created_at: datetime
    results: Optional[Dict[str, Any]] = None


# Utility functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'),
                         bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials,
                             JWT_SECRET_KEY,
                             algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        async with db_manager.get_connection() as conn:
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE user_id = $1 AND status = 'Active'",
                uuid.UUID(user_id))
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# API Routes


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "TCA IRR Backend API is running", "status": "healthy"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    health = await db_manager.health_check()
    health["timestamp"] = datetime.utcnow()
    health["backend_status"] = "running"
    health[
        "database_url"] = f"{db_config.host}:{db_config.port}/{db_config.database}"
    return health


# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        async with db_manager.get_connection() as conn:
            # Check if user already exists
            existing = await conn.fetchrow(
                "SELECT email FROM users WHERE email = $1", user_data.email)
            if existing:
                raise HTTPException(status_code=400,
                                    detail="Email already registered")

            # Hash password and create user
            hashed_password = hash_password(user_data.password)
            user_id = uuid.uuid4()

            await conn.execute(
                """
                INSERT INTO users (user_id, full_name, email, password_hash, role)
                VALUES ($1, $2, $3, $4, $5)
            """, user_id, user_data.full_name, user_data.email,
                hashed_password, user_data.role)

            # Create user settings
            await conn.execute(
                """
                INSERT INTO user_settings (user_id) VALUES ($1)
            """, user_id)

            # Create report quotas
            await conn.execute(
                """
                INSERT INTO report_quotas (user_id) VALUES ($1)
            """, user_id)

            # Fetch and return user
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE user_id = $1", user_id)
            return UserResponse(**dict(user))

    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/auth/login")
async def login_user(user_data: UserLogin):
    """Login user and return JWT token"""
    try:
        async with db_manager.get_connection() as conn:
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1 AND status = 'Active'",
                user_data.email)

            if not user or not verify_password(user_data.password,
                                               user['password_hash']):
                raise HTTPException(status_code=401,
                                    detail="Invalid credentials")

            # Update last activity
            await conn.execute(
                "UPDATE users SET last_activity = NOW() WHERE user_id = $1",
                user['user_id'])

            # Create access token
            access_token = create_access_token({"sub": str(user['user_id'])})

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse(**dict(user))
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(
        current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user)


# App Requests endpoints
@app.post("/requests", response_model=AppRequestResponse)
async def create_app_request(request_data: AppRequestCreate,
                             current_user: dict = Depends(get_current_user)):
    """Create a new app request"""
    try:
        async with db_manager.get_connection() as conn:
            request_id = uuid.uuid4()

            await conn.execute(
                """
                INSERT INTO app_requests (request_id, user_id, request_type, title, description, priority)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, request_id, current_user['user_id'],
                request_data.request_type, request_data.title,
                request_data.description, request_data.priority)

            request = await conn.fetchrow(
                "SELECT * FROM app_requests WHERE request_id = $1", request_id)

            return AppRequestResponse(**dict(request))

    except Exception as e:
        logger.error(f"Create request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create request")


@app.get("/requests", response_model=List[AppRequestResponse])
async def get_app_requests(status: Optional[str] = None,
                           current_user: dict = Depends(get_current_user)):
    """Get app requests for current user"""
    try:
        async with db_manager.get_connection() as conn:
            if status:
                requests = await conn.fetch(
                    """
                    SELECT * FROM app_requests 
                    WHERE user_id = $1 AND status = $2 
                    ORDER BY submitted_at DESC
                """, current_user['user_id'], status)
            else:
                requests = await conn.fetch(
                    """
                    SELECT * FROM app_requests 
                    WHERE user_id = $1 
                    ORDER BY submitted_at DESC
                """, current_user['user_id'])

            return [AppRequestResponse(**dict(req)) for req in requests]

    except Exception as e:
        logger.error(f"Get requests error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch requests")


# Evaluation endpoints (placeholder for AI integration)
@app.post("/evaluations", response_model=Dict[str, str])
async def create_evaluation(evaluation_data: EvaluationCreate,
                            background_tasks: BackgroundTasks,
                            current_user: dict = Depends(get_current_user)):
    """Create a new evaluation (placeholder for AI integration)"""
    try:
        async with db_manager.get_connection() as conn:
            evaluation_id = uuid.uuid4()

            # This is a placeholder - integrate with your AI flows from src/ai/
            await conn.execute(
                """
                INSERT INTO evaluations (evaluation_id, user_id, company_name, status, evaluation_data)
                VALUES ($1, $2, $3, $4, $5)
            """, evaluation_id, current_user['user_id'],
                evaluation_data.company_name, 'processing',
                json.dumps(evaluation_data.evaluation_data))

            # Add background task to process evaluation
            background_tasks.add_task(process_evaluation, str(evaluation_id))

            return {
                "evaluation_id": str(evaluation_id),
                "status": "processing",
                "message": "Evaluation started successfully"
            }

    except Exception as e:
        logger.error(f"Create evaluation error: {e}")
        raise HTTPException(status_code=500,
                            detail="Failed to create evaluation")


async def process_evaluation(evaluation_id: str):
    """Background task to process evaluation with AI"""
    try:
        async with db_manager.get_connection() as conn:
            # Get evaluation data
            evaluation = await conn.fetchrow(
                "SELECT * FROM evaluations WHERE evaluation_id = $1",
                uuid.UUID(evaluation_id))

            if not evaluation:
                logger.error(f"Evaluation {evaluation_id} not found")
                return

            evaluation_data = json.loads(
                evaluation['evaluation_data']
            ) if evaluation['evaluation_data'] else {}

            # Import and use AI integration
            from ai_integration import process_evaluation_task
            await process_evaluation_task(evaluation_id, evaluation_data,
                                          db_manager)

    except Exception as e:
        logger.error(f"Processing evaluation {evaluation_id} failed: {e}")

        # Update status to failed
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute(
                    """
                    UPDATE evaluations 
                    SET status = 'failed', results = $1, updated_at = NOW()
                    WHERE evaluation_id = $2
                """, json.dumps({
                        "error": str(e),
                        "status": "failed"
                    }), uuid.UUID(evaluation_id))
        except Exception as update_error:
            logger.error(f"Failed to update evaluation status: {update_error}")


@app.get("/evaluations/{evaluation_id}")
async def get_evaluation(evaluation_id: str,
                         current_user: dict = Depends(get_current_user)):
    """Get evaluation by ID"""
    try:
        async with db_manager.get_connection() as conn:
            evaluation = await conn.fetchrow(
                """
                SELECT * FROM evaluations 
                WHERE evaluation_id = $1 AND user_id = $2
            """, uuid.UUID(evaluation_id), current_user['user_id'])

            if not evaluation:
                raise HTTPException(status_code=404,
                                    detail="Evaluation not found")

            return dict(evaluation)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get evaluation error: {e}")
        raise HTTPException(status_code=500,
                            detail="Failed to fetch evaluation")


# Admin endpoints
@app.get("/admin/requests", response_model=List[AppRequestResponse])
async def get_all_requests(current_user: dict = Depends(get_current_user)):
    """Get all app requests (admin only)"""
    if current_user['role'] not in ['Admin', 'Reviewer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        async with db_manager.get_connection() as conn:
            requests = await conn.fetch("""
                SELECT ar.*, u.full_name as user_name
                FROM app_requests ar
                JOIN users u ON ar.user_id = u.user_id
                ORDER BY ar.submitted_at DESC
            """)

            return [AppRequestResponse(**dict(req)) for req in requests]

    except Exception as e:
        logger.error(f"Get all requests error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch requests")


if __name__ == "__main__":
    # Run the server
    uvicorn.run("main:app",
                host="0.0.0.0",
                port=8000,
                reload=True,
                log_level="info")
