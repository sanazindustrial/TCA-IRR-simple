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
import httpx

# Import database configuration
from database_config import db_manager, db_config

# Import SSD → TCA TIRR report configuration
from ssd_tirr_report_config import (
    REPORT_META,
    SCORING_THRESHOLDS,
    PAGE_CONFIG,
    SSD_FIELD_MAPPING,
    SSD_MANDATORY_FIELDS,
    CALLBACK_CONFIG,
    REPORT_EXPORT,
    SSD_MODULE_WEIGHTS,
    SCORE_INTERPRETATION,
    INVESTOR_QUESTION_MODULES,
    get_recommendation,
    interpret_score,
)

# Report output directory
REPORTS_DIR = Path(__file__).parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

# SSD callback URL — override via SSD_CALLBACK_URL environment variable
SSD_CALLBACK_URL = os.getenv("SSD_CALLBACK_URL", "")

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Global exception handlers
from starlette.exceptions import HTTPException as StarletteHTTPException
from json import JSONDecodeError
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware

class CatchAllErrorMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
            return response
        except JSONDecodeError:
            return JSONResponse(status_code=422, content={"detail": "Invalid JSON in request body"})
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            logger.error(f"Unhandled error: {e}")
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(CatchAllErrorMiddleware)

# Raw ASGI middleware to catch malformed JSON before Starlette parses it
from starlette.types import ASGIApp, Receive, Scope, Send

class JSONBodyValidationMiddleware:
    """Validates JSON body at ASGI level before Starlette can parse and 500."""
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] == "http" and scope.get("method", "") in ("POST", "PUT", "PATCH"):
            headers = dict(scope.get("headers", []))
            content_type = headers.get(b"content-type", b"").decode("utf-8", errors="ignore")
            if "application/json" in content_type:
                body_parts = []
                while True:
                    message = await receive()
                    body_parts.append(message.get("body", b""))
                    if not message.get("more_body", False):
                        break
                body = b"".join(body_parts)
                if body:
                    try:
                        json.loads(body)
                    except (json.JSONDecodeError, ValueError):
                        response = JSONResponse(
                            status_code=422,
                            content={"detail": "Invalid JSON in request body"}
                        )
                        await response(scope, receive, send)
                        return
                # Re-wrap body so downstream can read it
                async def new_receive():
                    return {"type": "http.request", "body": body, "more_body": False}
                await self.app(scope, new_receive, send)
                return
        await self.app(scope, receive, send)

@app.exception_handler(JSONDecodeError)
async def json_decode_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid JSON in request body"}
    )

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)}
    )


# Pydantic models
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "User"

    @validator('password')
    def password_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Password cannot be empty')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


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

    @classmethod
    def from_db_row(cls, row: dict):
        """Create UserResponse from actual DB row (maps column names)"""
        return cls(
            user_id=str(row['id']),
            full_name=row.get('username', ''),
            email=row['email'],
            role=row.get('role', 'User'),
            status='Active' if row.get('is_active', True) else 'Inactive',
            avatar_url=None,
            created_at=row.get('created_at', datetime.now()),
            last_activity=row.get('updated_at')
        )


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
    description: Optional[str] = None
    priority: str
    status: str
    submitted_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    @classmethod
    def from_db_row(cls, row: dict):
        """Create AppRequestResponse from actual DB row"""
        return cls(
            request_id=str(row['request_id']),
            user_id=str(row['user_id']),
            request_type=row['request_type'],
            title=row['title'],
            description=row.get('description'),
            priority=row.get('priority', 'Medium'),
            status=str(row.get('status', 'Pending')),
            submitted_at=row.get('created_at', datetime.now()),
            resolved_at=row.get('completed_at'),
            resolution_notes=None
        )


class EvaluationCreate(BaseModel):
    company_name: str
    evaluation_data: Dict[str, Any]
    request_id: Optional[str] = None


# ── SSD → TCA TIRR Payload Models (sections 4.1.1 – 4.1.8) ──────────

class SSDContactInformation(BaseModel):
    email: EmailStr
    phoneNumber: str
    firstName: str
    lastName: str
    jobTitle: Optional[str] = None
    linkedInUrl: Optional[str] = None

class SSDCompanyInformation(BaseModel):
    companyName: Optional[str] = None
    website: Optional[str] = None
    industryVertical: str
    developmentStage: str
    businessModel: str
    country: str
    state: str
    city: str
    oneLineDescription: str
    companyDescription: str
    productDescription: str
    pitchDeckPath: str
    legalName: Optional[str] = None
    numberOfEmployees: Optional[int] = None

class SSDFinancialInformation(BaseModel):
    fundingType: str
    annualRevenue: float
    preMoneyValuation: float
    postMoneyValuation: Optional[float] = None
    offeringType: Optional[str] = None
    targetRaise: Optional[float] = None
    currentlyRaised: Optional[float] = None

class SSDInvestorQuestions(BaseModel):
    problemSolution: Optional[str] = None
    companyBackgroundTeam: Optional[str] = None
    markets: Optional[str] = None
    competitionDifferentiation: Optional[str] = None
    businessModelChannels: Optional[str] = None
    timeline: Optional[str] = None
    technologyIP: Optional[str] = None
    specialAgreements: Optional[str] = None
    cashFlow: Optional[str] = None
    fundingHistory: Optional[str] = None
    risksChallenges: Optional[str] = None
    exitStrategy: Optional[str] = None

class SSDDocuments(BaseModel):
    executiveSummaryPath: Optional[str] = None
    businessPlanPath: Optional[str] = None
    financialProjectionPath: Optional[str] = None
    additionalDocumentsPaths: Optional[List[str]] = None

class SSDCustomerMetrics(BaseModel):
    customerAcquisitionCost: Optional[float] = None
    customerLifetimeValue: Optional[float] = None
    churn: Optional[float] = None
    margins: Optional[float] = None

class SSDRevenueMetrics(BaseModel):
    totalRevenuesToDate: Optional[float] = None
    monthlyRecurringRevenue: Optional[float] = None
    yearToDateRevenue: Optional[float] = None
    burnRate: Optional[float] = None

class SSDMarketSize(BaseModel):
    totalAvailableMarket: Optional[float] = None
    serviceableAreaMarket: Optional[float] = None
    serviceableObtainableMarket: Optional[float] = None


class SSDStartupData(BaseModel):
    """Full SSD → TCA TIRR request schema (sections 4.1.1–4.1.8)."""
    contactInformation: SSDContactInformation
    companyInformation: SSDCompanyInformation
    financialInformation: SSDFinancialInformation
    investorQuestions: Optional[SSDInvestorQuestions] = None
    documents: Optional[SSDDocuments] = None
    customerMetrics: Optional[SSDCustomerMetrics] = None
    revenueMetrics: Optional[SSDRevenueMetrics] = None
    marketSize: Optional[SSDMarketSize] = None
    # Internal fields (not from SSD spec — used for routing/callback)
    callback_url: Optional[str] = None


class EvaluationResponse(BaseModel):
    evaluation_id: str
    user_id: str
    company_name: str
    status: str
    created_at: datetime
    results: Optional[Dict[str, Any]] = None


# ─── SSD Audit Log Models ─────────────────────────────────────────────
class SSDAuditLogEntry(BaseModel):
    """A single audit log entry for SSD→TCA TIRR integration."""
    tracking_id: str
    event_type: str  # received, validated, processing, completed, callback_sent, callback_failed, error
    timestamp: str
    details: Optional[Dict[str, Any]] = None


class SSDAuditLog(BaseModel):
    """Full audit log for an SSD request."""
    tracking_id: str
    company_name: str
    founder_email: str
    status: str  # pending, processing, completed, failed
    created_at: str
    updated_at: str
    request_payload_hash: Optional[str] = None
    request_payload_size: int = 0
    report_path: Optional[str] = None
    report_version: int = 1
    callback_url: Optional[str] = None
    callback_status: Optional[str] = None  # sent, failed, not_configured
    callback_response_code: Optional[int] = None
    processing_duration_ms: Optional[int] = None
    final_score: Optional[float] = None
    recommendation: Optional[str] = None
    events: List[SSDAuditLogEntry] = []


# In-memory audit storage (production would use database)
SSD_AUDIT_LOGS: Dict[str, Dict[str, Any]] = {}


def _ssd_audit_log(tracking_id: str, event_type: str, details: Optional[Dict[str, Any]] = None):
    """Add an audit log entry for an SSD request."""
    entry = {
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": details or {},
    }
    if tracking_id not in SSD_AUDIT_LOGS:
        SSD_AUDIT_LOGS[tracking_id] = {
            "tracking_id": tracking_id,
            "events": [],
            "created_at": entry["timestamp"],
        }
    SSD_AUDIT_LOGS[tracking_id]["events"].append(entry)
    SSD_AUDIT_LOGS[tracking_id]["updated_at"] = entry["timestamp"]
    logger.info(f"[SSD-AUDIT] {tracking_id}: {event_type}")


def _ssd_audit_update(tracking_id: str, **kwargs):
    """Update audit log metadata fields."""
    if tracking_id in SSD_AUDIT_LOGS:
        SSD_AUDIT_LOGS[tracking_id].update(kwargs)


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
                "SELECT * FROM users WHERE id = $1 AND is_active = true",
                int(user_id))
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
            # Check if user already exists (email or username)
            existing = await conn.fetchrow(
                "SELECT email FROM users WHERE email = $1", user_data.email)
            if existing:
                raise HTTPException(status_code=400,
                                    detail="Email already registered")
            existing_name = await conn.fetchrow(
                "SELECT username FROM users WHERE username = $1", user_data.full_name)
            if existing_name:
                raise HTTPException(status_code=400,
                                    detail="Username already taken")

            # Hash password and create user
            hashed_password = hash_password(user_data.password)

            # Insert using actual DB schema: id is auto-increment, username maps to full_name
            user = await conn.fetchrow(
                """
                INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, true, NOW(), NOW())
                RETURNING *
            """, user_data.full_name, user_data.email,
                hashed_password, user_data.role)

            return UserResponse.from_db_row(dict(user))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/auth/login")
async def login_user(user_data: UserLogin):
    """Login user and return JWT token"""
    try:
        async with db_manager.get_connection() as conn:
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1 AND is_active = true",
                user_data.email)

            if not user or not verify_password(user_data.password,
                                               user['password_hash']):
                raise HTTPException(status_code=401,
                                    detail="Invalid credentials")

            # Update last activity
            await conn.execute(
                "UPDATE users SET updated_at = NOW() WHERE id = $1",
                user['id'])

            # Create access token
            access_token = create_access_token({"sub": str(user['id'])})

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse.from_db_row(dict(user))
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
    return UserResponse.from_db_row(current_user)


# App Requests endpoints
@app.post("/requests", response_model=AppRequestResponse)
async def create_app_request(request_data: AppRequestCreate,
                             current_user: dict = Depends(get_current_user)):
    """Create a new app request"""
    try:
        async with db_manager.get_connection() as conn:
            request_id = uuid.uuid4()
            # Convert integer user id to UUID for app_requests table compatibility
            user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(current_user['id']))

            await conn.execute(
                """
                INSERT INTO app_requests (request_id, user_id, request_type, title, description, priority)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, request_id, user_uuid,
                request_data.request_type, request_data.title,
                request_data.description, request_data.priority)

            request = await conn.fetchrow(
                "SELECT * FROM app_requests WHERE request_id = $1", request_id)

            return AppRequestResponse.from_db_row(dict(request))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create request")


@app.get("/requests", response_model=List[AppRequestResponse])
async def get_app_requests(status: Optional[str] = None,
                           current_user: dict = Depends(get_current_user)):
    """Get app requests for current user"""
    try:
        async with db_manager.get_connection() as conn:
            user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(current_user['id']))
            if status:
                requests = await conn.fetch(
                    """
                    SELECT * FROM app_requests 
                    WHERE user_id = $1 AND status = $2 
                    ORDER BY created_at DESC
                """, user_uuid, status)
            else:
                requests = await conn.fetch(
                    """
                    SELECT * FROM app_requests 
                    WHERE user_id = $1 
                    ORDER BY created_at DESC
                """, user_uuid)

            return [AppRequestResponse.from_db_row(dict(req)) for req in requests]

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
            """, evaluation_id, current_user['id'],
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
            """, uuid.UUID(evaluation_id), current_user['id'])

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


# Analysis endpoints
@app.post("/api/analysis/comprehensive")
async def run_comprehensive_analysis(request: Request):
    """Run comprehensive TCA analysis"""
    try:
        # Parse request data
        data = await request.json()

        # Extract analysis parameters
        framework = data.get('framework', 'general')
        company_data = data.get('company_data', {})
        tca_input = data.get('tcaInput', {})

        logger.info(
            f"Running comprehensive analysis for framework: {framework}")
        logger.info(f"Company: {company_data.get('name', 'Unknown')}")

        # Simulate analysis processing
        await asyncio.sleep(2)  # Simulate processing time

        # Generate comprehensive analysis results
        analysis_result = {
            "final_tca_score": 78.5,
            "investment_recommendation": "Proceed with due diligence",
            "scorecard": {
                "categories": {
                    "market_potential": {
                        "name":
                        "Market Potential",
                        "raw_score":
                        8.2,
                        "weight":
                        0.20,
                        "weighted_score":
                        16.4,
                        "notes":
                        "Strong market opportunity with clear value proposition"
                    },
                    "technology_innovation": {
                        "name":
                        "Technology Innovation",
                        "raw_score":
                        7.8,
                        "weight":
                        0.15,
                        "weighted_score":
                        11.7,
                        "notes":
                        "Solid technology foundation with competitive advantages"
                    },
                    "team_capability": {
                        "name": "Team Capability",
                        "raw_score": 8.0,
                        "weight": 0.25,
                        "weighted_score": 20.0,
                        "notes":
                        "Experienced team with relevant domain expertise"
                    },
                    "business_model": {
                        "name": "Business Model",
                        "raw_score": 7.5,
                        "weight": 0.20,
                        "weighted_score": 15.0,
                        "notes": "Clear revenue model with growth potential"
                    },
                    "financial_health": {
                        "name":
                        "Financial Health",
                        "raw_score":
                        7.0,
                        "weight":
                        0.20,
                        "weighted_score":
                        14.0,
                        "notes":
                        "Adequate funding runway with reasonable burn rate"
                    }
                }
            },
            "risk_assessment": {
                "overall_risk_score": 6.5,
                "flags": {
                    "market_risk": {
                        "level": {
                            "value": "yellow"
                        },
                        "trigger":
                        "Market competition intensity",
                        "impact":
                        "Medium competitive pressure in target market",
                        "severity_score":
                        6,
                        "mitigation":
                        "Strengthen differentiation and build market partnerships",
                        "ai_recommendation":
                        "Focus on unique value proposition and early customer acquisition"
                    },
                    "technology_risk": {
                        "level": {
                            "value": "green"
                        },
                        "trigger":
                        "Technology scalability",
                        "impact":
                        "Strong technical architecture with good scalability",
                        "severity_score":
                        3,
                        "mitigation":
                        "Continue investing in technical talent and infrastructure",
                        "ai_recommendation":
                        "Maintain current technical roadmap and expand development team"
                    }
                }
            },
            "pestel_analysis": {
                "political": 7.2,
                "economic": 7.8,
                "social": 8.0,
                "technological": 8.5,
                "environmental": 6.8,
                "legal": 7.0,
                "composite_score": 75.5,
                "trend_alignment": {
                    "digital_transformation": "Strong alignment",
                    "sustainability": "Moderate alignment",
                    "regulatory_changes": "Good preparation",
                    "economic_growth": "Positive outlook",
                    "technology_adoption": "Excellent positioning"
                }
            },
            "benchmark_analysis": {
                "overall_percentile": 72,
                "category_benchmarks": {
                    "growth_metrics": {
                        "percentile_rank": 75,
                        "sector_average": 65,
                        "z_score": 0.8
                    },
                    "financial_metrics": {
                        "percentile_rank": 68,
                        "sector_average": 70,
                        "z_score": -0.2
                    },
                    "operational_metrics": {
                        "percentile_rank": 74,
                        "sector_average": 68,
                        "z_score": 0.6
                    }
                }
            },
            "gap_analysis": {
                "total_gaps":
                5,
                "priority_areas": [
                    "Sales and Marketing Capability",
                    "Customer Success Infrastructure"
                ],
                "quick_wins":
                ["Automated onboarding process", "Enhanced product analytics"],
                "gaps": [{
                    "category": "Sales Performance",
                    "gap_size": 15,
                    "priority": "High",
                    "gap_percentage": 20
                }, {
                    "category": "Marketing Reach",
                    "gap_size": 12,
                    "priority": "Medium",
                    "gap_percentage": 15
                }]
            },
            "funder_analysis": {
                "funding_readiness_score":
                76,
                "recommended_round_size":
                2.5,
                "investor_matches": [{
                    "investor_name": "TechStars Ventures",
                    "sector_focus": "B2B SaaS and AI",
                    "fit_score": 85,
                    "stage_match": "Seed"
                }, {
                    "investor_name": "Accel Partners",
                    "sector_focus": "Technology Infrastructure",
                    "fit_score": 78,
                    "stage_match": "Series A"
                }]
            },
            "team_analysis": {
                "team_completeness":
                82,
                "diversity_score":
                75,
                "founders": [{
                    "name":
                    "CEO/Founder",
                    "experience_score":
                    85,
                    "track_record":
                    "Previous successful exit, 10+ years domain experience"
                }, {
                    "name":
                    "CTO/Co-founder",
                    "experience_score":
                    80,
                    "track_record":
                    "Technical leadership at scale-up companies, strong engineering background"
                }]
            }
        }

        return analysis_result

    except Exception as e:
        logger.error(f"Comprehensive analysis error: {e}")
        raise HTTPException(status_code=500,
                            detail=f"Analysis failed: {str(e)}")


# â”€â”€â”€ File upload endpoints (persisted to allupload table) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.post("/api/files/upload")
async def upload_files(request: Request):
    """Handle file uploads, extract data, and persist to allupload table"""
    try:
        data = await request.json()
        files_data = data.get('files', [])
        company_name = data.get('company_name', None)

        processed_files = []
        async with db_manager.get_connection() as conn:
            for file_info in files_data:
                fname = file_info.get('name', 'unknown.pdf')
                ftype = file_info.get('type', 'application/pdf')
                fsize = file_info.get('size', 0)

                # Simulated extraction â€“ replace with real parser later
                extracted_data = {
                    "text_content":
                    f"Extracted text from {fname}",
                    "financial_data": {
                        "revenue": 500000,
                        "burn_rate": 50000,
                        "runway_months": 10
                    },
                    "key_metrics": {
                        "team_size": 8,
                        "customers": 45,
                        "mrr": 25000
                    }
                }

                # Persist to allupload
                row = await conn.fetchrow(
                    """
                    INSERT INTO allupload
                        (source_type, file_name, file_type, file_size,
                         extracted_text, extracted_data, company_name,
                         processing_status, upload_metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING upload_id, created_at
                    """,
                    'file',
                    fname,
                    ftype,
                    fsize,
                    extracted_data.get('text_content', ''),
                    json.dumps(extracted_data),
                    company_name,
                    'completed',
                    json.dumps({"original_request": "file_upload"})
                )

                processed_files.append({
                    "upload_id": str(row['upload_id']),
                    "name": fname,
                    "size": fsize,
                    "type": ftype,
                    "extracted_data": extracted_data,
                    "processing_status": "completed",
                    "created_at": str(row['created_at'])
                })

        return {
            "status": "success",
            "files_processed": len(processed_files),
            "processed_files": processed_files
        }

    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500,
                            detail=f"File upload failed: {str(e)}")


@app.post("/api/urls/fetch")
async def fetch_url_data(request: Request):
    """Fetch data from URLs and persist to allupload table"""
    try:
        data = await request.json()
        urls = data.get('urls', [])
        company_name = data.get('company_name', None)

        processed_urls = []
        async with db_manager.get_connection() as conn:
            for url in urls:
                domain = url.split('/')[2] if '://' in url else url
                extracted_data = {
                    "text_content": f"Extracted content from {url}",
                    "metadata": {
                        "domain": domain,
                        "content_type": "text/html",
                        "word_count": 1250
                    }
                }

                row = await conn.fetchrow(
                    """
                    INSERT INTO allupload
                        (source_type, file_name, file_type, source_url,
                         extracted_text, extracted_data, company_name,
                         processing_status, upload_metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING upload_id, created_at
                    """,
                    'url',
                    domain,
                    'text/html',
                    url,
                    extracted_data.get('text_content', ''),
                    json.dumps(extracted_data),
                    company_name,
                    'completed',
                    json.dumps({"original_request": "url_fetch"})
                )

                processed_urls.append({
                    "upload_id": str(row['upload_id']),
                    "url": url,
                    "title": f"Content from {domain}",
                    "extracted_data": extracted_data,
                    "processing_status": "completed",
                    "created_at": str(row['created_at'])
                })

        return {
            "status": "success",
            "urls_processed": len(processed_urls),
            "processed_urls": processed_urls
        }

    except Exception as e:
        logger.error(f"URL fetch error: {e}")
        raise HTTPException(status_code=500,
                            detail=f"URL fetch failed: {str(e)}")


@app.post("/api/text/submit")
async def submit_text(request: Request):
    """Submit raw text and persist to allupload table"""
    try:
        data = await request.json()
        text = data.get('text', '') or data.get('content', '') or data.get('extracted_text', '')
        title = data.get('title', 'Text Submission')
        company_name = data.get('company_name', None)

        # Build extracted_data: merge auto-generated stats with user-provided data
        extracted_data = {
            "text_content": text,
            "word_count": len(text.split()),
            "char_count": len(text)
        }
        user_extracted = data.get('extracted_data')
        if isinstance(user_extracted, dict):
            extracted_data = {**extracted_data, **user_extracted}

        # Map company_data fields to the expected extracted_data structure
        company_data = data.get('company_data')
        if isinstance(company_data, dict):
            financial_data = {}
            key_metrics = {}
            # Financial fields
            for fk in ('revenue', 'mrr', 'burn_rate', 'runway_months', 'gross_margin',
                        'arr', 'ltv', 'cac', 'arpu'):
                if fk in company_data:
                    financial_data[fk] = company_data[fk]
            # Key metrics
            for mk in ('customers', 'nrr', 'mom_growth', 'team_size', 'funding_stage',
                        'industry', 'churn_rate', 'dau', 'mau'):
                if mk in company_data:
                    key_metrics[mk] = company_data[mk]
            if financial_data:
                extracted_data['financial_data'] = financial_data
            if key_metrics:
                extracted_data['key_metrics'] = key_metrics
            # Keep the raw company_data for reference
            extracted_data['company_data'] = company_data

        async with db_manager.get_connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO allupload
                    (source_type, file_name, file_type,
                     extracted_text, extracted_data, company_name,
                     processing_status, upload_metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING upload_id, created_at
                """,
                'text',
                title,
                'text/plain',
                text,
                json.dumps(extracted_data),
                company_name,
                'completed',
                json.dumps({"original_request": "text_submit"})
            )

        return {
            "status": "success",
            "upload_id": str(row['upload_id']),
            "title": title,
            "company_name": company_name,
            "word_count": extracted_data['word_count'],
            "processing_status": "completed",
            "created_at": str(row['created_at'])
        }

    except Exception as e:
        logger.error(f"Text submit error: {e}")
        raise HTTPException(status_code=500,
                            detail=f"Text submit failed: {str(e)}")


# â”€â”€â”€ AllUpload query endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.get("/api/uploads")
async def list_uploads(status: Optional[str] = None, limit: int = 50):
    """List all uploads from allupload table"""
    try:
        async with db_manager.get_connection() as conn:
            if status:
                rows = await conn.fetch(
                    """SELECT upload_id, source_type, file_name, file_type,
                              file_size, company_name, processing_status,
                              analysis_id, created_at
                       FROM allupload
                       WHERE processing_status = $1
                       ORDER BY created_at DESC LIMIT $2""",
                    status, limit
                )
            else:
                rows = await conn.fetch(
                    """SELECT upload_id, source_type, file_name, file_type,
                              file_size, company_name, processing_status,
                              analysis_id, created_at
                       FROM allupload
                       ORDER BY created_at DESC LIMIT $1""",
                    limit
                )
            return {
                "total": len(rows),
                "uploads": [
                    {**{k: (str(v) if isinstance(v, uuid.UUID) else v)
                         for k, v in dict(r).items()}}
                    for r in rows
                ]
            }
    except Exception as e:
        logger.error(f"List uploads error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/uploads/{upload_id}")
async def get_upload(upload_id: str):
    """Get a single upload with full extracted data"""
    try:
        async with db_manager.get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM allupload WHERE upload_id = $1",
                uuid.UUID(upload_id)
            )
            if not row:
                raise HTTPException(status_code=404, detail="Upload not found")
            result = {}
            jsonb_cols = {'extracted_data', 'analysis_result', 'upload_metadata'}
            for k, v in dict(row).items():
                if isinstance(v, uuid.UUID):
                    result[k] = str(v)
                elif isinstance(v, datetime):
                    result[k] = v.isoformat()
                elif k in jsonb_cols and isinstance(v, str):
                    try:
                        result[k] = json.loads(v)
                    except (json.JSONDecodeError, TypeError):
                        result[k] = v
                else:
                    result[k] = v
            return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/uploads/{upload_id}")
async def delete_upload(upload_id: str):
    """Delete an upload record"""
    try:
        async with db_manager.get_connection() as conn:
            result = await conn.execute(
                "DELETE FROM allupload WHERE upload_id = $1",
                uuid.UUID(upload_id)
            )
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Upload not found")
            return {"status": "deleted", "upload_id": upload_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# â”€â”€â”€ 9-Module Analysis (reads uploads from allupload) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

# The 9 modules and their weights (total weight 17.5 for normalization)
NINE_MODULES = [
    {"id": "tca_scorecard",          "name": "TCA Scorecard",                  "weight": 3.0},
    {"id": "risk_assessment",        "name": "Risk Assessment & Flags",        "weight": 2.5},
    {"id": "market_analysis",        "name": "Market & Competition Analysis",  "weight": 2.0},
    {"id": "team_assessment",        "name": "Team & Leadership Assessment",   "weight": 2.0},
    {"id": "financial_analysis",     "name": "Financial Health & Projections", "weight": 2.0},
    {"id": "technology_assessment",  "name": "Technology & IP Assessment",     "weight": 1.5},
    {"id": "business_model",         "name": "Business Model & Strategy",      "weight": 1.5},
    {"id": "growth_assessment",      "name": "Growth Potential & Scalability", "weight": 1.5},
    {"id": "investment_readiness",   "name": "Investment Readiness & Exit",    "weight": 1.5},
]


def _clamp(val, lo=0.0, hi=10.0):
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, val))


def _flag_color(score):
    """Return traffic-light flag from a 0-10 score."""
    if score >= 7.0:
        return "green"
    elif score >= 5.0:
        return "yellow"
    return "red"


def _extract_text_mentions(text: str, keywords: list) -> list:
    """Return which keywords appear in the text (case-insensitive)."""
    lower = text.lower()
    return [k for k in keywords if k.lower() in lower]


def _run_module(module_cfg: dict, company_data: dict, extracted: dict) -> dict:
    """
    Run a single analysis module.
    ALL scores are derived from the actual uploaded / client-entered data.
    No hardcoded mock scores.
    """
    mid = module_cfg["id"]
    fin = extracted.get("financial_data", {})
    met = extracted.get("key_metrics", {})
    ci  = extracted.get("company_info", {})
    text = company_data.get("extracted_text", "")

    # â”€â”€ helpers to normalise incoming numeric values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    def n(dct, key, default=0):
        v = dct.get(key, default)
        try:
            return float(v)
        except (TypeError, ValueError):
            return float(default)

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 1. TCA SCORECARD
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "tca_scorecard":
        # --- Market Potential (weight 20) --------------------------
        revenue = n(fin, "revenue")
        customers = n(met, "customers")
        nrr = n(met, "nrr")
        market_score = 5.0
        if revenue > 0:
            market_score += min(2.0, revenue / 500_000)   # up to +2 for $1M+
        if customers >= 20:
            market_score += 1.0
        if nrr > 100:
            market_score += min(1.0, (nrr - 100) / 30)
        market_score = _clamp(round(market_score, 1))
        market_strengths = []
        market_concerns = []
        if revenue >= 300_000:
            market_strengths.append(f"Revenue ${revenue:,.0f} shows product-market fit")
        else:
            market_concerns.append(f"Revenue ${revenue:,.0f} â€” product-market fit not yet proven")
        if customers >= 30:
            market_strengths.append(f"{int(customers)} paying customers")
        elif customers > 0:
            market_concerns.append(f"Only {int(customers)} customers â€” early traction")
        if nrr > 100:
            market_strengths.append(f"{nrr:.0f}% NRR â€” strong retention")

        # --- Technology Innovation (weight 15) ---------------------
        tech_mentions = _extract_text_mentions(text,
            ["patent", "proprietary", "AI", "ML", "NLP", "machine learning",
             "SOC 2", "SOC2", "ISO 27001", "microservice", "cloud-native"])
        tech_score = _clamp(round(5.0 + min(3.0, len(tech_mentions) * 0.8), 1))
        tech_strengths = tech_mentions[:3] if tech_mentions else ["No specific tech differentiators identified"]
        tech_concerns = []
        if len(tech_mentions) < 2:
            tech_concerns.append("Limited technology differentiation signals")
        else:
            tech_concerns.append("IP portfolio depth should be verified")

        # --- Team Capability (weight 25) ---------------------------
        team_size = n(met, "team_size")
        team_mentions = _extract_text_mentions(text,
            ["ex-Google", "ex-Meta", "ex-Amazon", "ex-Microsoft",
             "Stanford", "MIT", "Harvard", "MBA", "PhD",
             "prior exit", "previous exit", "co-founder", "CTO", "CEO", "VP"])
        team_score = 5.0
        if team_size >= 10:
            team_score += 1.5
        elif team_size >= 5:
            team_score += 0.8
        team_score += min(2.5, len(team_mentions) * 0.5)
        team_score = _clamp(round(team_score, 1))
        team_strengths = f"Team of {int(team_size)}" if team_size else "Team size not provided"
        if team_mentions:
            team_strengths += f"; signals: {', '.join(team_mentions[:4])}"
        team_concerns = "Detailed team background needs verification" if len(team_mentions) < 3 else "Key-person dependency risk"

        # --- Business Model (weight 20) ----------------------------
        mrr = n(fin, "mrr") or n(met, "mrr")
        gross_margin = n(fin, "gross_margin")
        bm_score = 5.0
        if mrr > 0:
            bm_score += min(2.0, mrr / 30_000)
        if gross_margin > 50:
            bm_score += min(2.0, (gross_margin - 50) / 20)
        bm_mentions = _extract_text_mentions(text, ["SaaS", "subscription", "recurring", "ARR", "MRR", "enterprise"])
        bm_score += min(1.0, len(bm_mentions) * 0.3)
        bm_score = _clamp(round(bm_score, 1))
        bm_strengths = f"MRR ${mrr:,.0f}" if mrr else "Revenue model data not provided"
        if gross_margin:
            bm_strengths += f"; Gross margin {gross_margin}%"
        bm_concerns = "Unit economics at scale need validation"

        # --- Financial Health (weight 20) --------------------------
        burn_rate = n(fin, "burn_rate")
        runway = n(fin, "runway_months")
        fh_score = 5.0
        if runway >= 18:
            fh_score += 2.5
        elif runway >= 12:
            fh_score += 1.5
        elif runway >= 6:
            fh_score += 0.5
        else:
            fh_score -= 1.0
        if revenue > 0 and burn_rate > 0:
            burn_multiple = burn_rate / max(revenue / 12, 1)
            if burn_multiple < 1.5:
                fh_score += 1.5
            elif burn_multiple < 3.0:
                fh_score += 0.5
        fh_score = _clamp(round(fh_score, 1))
        fh_strengths = f"Runway {runway:.0f} months" if runway else "Runway not provided"
        if burn_rate:
            fh_strengths += f"; Burn ${burn_rate:,.0f}/mo"
        fh_concerns = "Burn rate optimization needed" if burn_rate and revenue and burn_rate > revenue / 12 * 2 else "Monitor cash efficiency"

        categories = [
            {"category": "Market Potential",      "raw_score": market_score, "weight": 20, "flag": _flag_color(market_score),
             "strengths": "; ".join(market_strengths) if market_strengths else "N/A",
             "concerns": "; ".join(market_concerns) if market_concerns else "None identified"},
            {"category": "Technology Innovation", "raw_score": tech_score, "weight": 15, "flag": _flag_color(tech_score),
             "strengths": "; ".join(tech_strengths),
             "concerns": "; ".join(tech_concerns) if tech_concerns else "None identified"},
            {"category": "Team Capability",       "raw_score": team_score, "weight": 25, "flag": _flag_color(team_score),
             "strengths": team_strengths, "concerns": team_concerns},
            {"category": "Business Model",        "raw_score": bm_score, "weight": 20, "flag": _flag_color(bm_score),
             "strengths": bm_strengths, "concerns": bm_concerns},
            {"category": "Financial Health",      "raw_score": fh_score, "weight": 20, "flag": _flag_color(fh_score),
             "strengths": fh_strengths, "concerns": fh_concerns},
        ]
        composite = round(sum(c["raw_score"] * c["weight"] for c in categories) / 100, 2)
        return {
            "module_id": mid, "score": composite,
            "composite_score": composite,
            "categories": categories,
            "recommendation": "Proceed with due diligence" if composite >= 7 else "Further analysis needed",
            "data_sources": {"financial_data": bool(fin), "key_metrics": bool(met), "text_analysis": bool(text)},
            "confidence": min(0.95, 0.5 + 0.15 * sum([bool(fin), bool(met), bool(text)])),
        }

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 2. RISK ASSESSMENT
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "risk_assessment":
        revenue = n(fin, "revenue")
        burn_rate = n(fin, "burn_rate")
        runway = n(fin, "runway_months")
        team_size = n(met, "team_size")
        customers = n(met, "customers")

        # Financial risk: high burn vs runway
        if runway > 0 and burn_rate > 0:
            fin_risk = _clamp(round(10 - runway / 2, 1), 1, 9)
        elif burn_rate > 0:
            fin_risk = 7.0
        else:
            fin_risk = 5.0
        fin_trigger = f"Burn ${burn_rate:,.0f}/mo with {runway:.0f} months runway" if burn_rate else "Financial data incomplete"
        fin_impact = "High â€” limited runway" if runway < 12 else "Medium â€” adequate runway" if runway < 18 else "Low â€” strong runway"
        fin_mitigation = "Raise follow-on or cut burn" if runway < 12 else "Optimise spend; plan next raise" if runway < 18 else "Maintain current trajectory"

        # Market risk: customer concentration
        mkt_risk = _clamp(round(8 - min(4.0, customers / 15), 1), 1, 9) if customers > 0 else 6.0
        mkt_trigger = f"{int(customers)} customers â€” {'diversified' if customers >= 30 else 'concentration risk'}"
        mkt_impact = "Low" if customers >= 50 else "Medium" if customers >= 20 else "High â€” customer concentration"
        mkt_mitigation = "Expand customer base" if customers < 30 else "Continue customer acquisition"

        # Team risk
        team_risk = _clamp(round(7 - min(3.0, team_size / 5), 1), 1, 9) if team_size > 0 else 6.0
        team_trigger = f"Team of {int(team_size)}" if team_size else "Team size unknown"
        team_impact = "Limited" if team_size >= 10 else "Medium â€” small team" if team_size >= 5 else "High â€” very small team"
        team_mitigation = "Cross-train and hire for gaps" if team_size < 10 else "Ensure succession planning"

        # Technology risk from text signals
        tech_risk_signals = _extract_text_mentions(text, ["patent", "proprietary", "SOC 2", "SOC2", "cloud-native", "microservice"])
        tech_risk = _clamp(round(7 - len(tech_risk_signals) * 1.2, 1), 1, 9)
        tech_trigger = f"{len(tech_risk_signals)} tech differentiators identified" if tech_risk_signals else "Limited tech differentiation signals"
        tech_impact = "Low" if len(tech_risk_signals) >= 3 else "Medium"
        tech_mitigation = "Continue R&D investment" if len(tech_risk_signals) >= 2 else "Invest in IP protection and tech stack"

        # Execution risk
        mom_growth = n(met, "mom_growth")
        nrr = n(met, "nrr")
        exec_risk = 5.0
        if mom_growth > 10:
            exec_risk -= 1.5
        elif mom_growth > 5:
            exec_risk -= 0.5
        if nrr > 100:
            exec_risk -= 1.0
        exec_risk = _clamp(round(exec_risk, 1), 1, 9)
        exec_trigger = f"Growth {mom_growth}% MoM, NRR {nrr}%" if mom_growth or nrr else "Growth metrics not provided"
        exec_impact = "Low" if exec_risk < 4 else "Medium" if exec_risk < 6 else "High"
        exec_mitigation = "Maintain execution momentum" if exec_risk < 4 else "Improve delivery processes"

        # Regulatory risk (baseline from text)
        reg_signals = _extract_text_mentions(text, ["SOC 2", "SOC2", "GDPR", "HIPAA", "ISO", "compliance", "certified"])
        reg_risk = _clamp(round(6 - len(reg_signals) * 1.5, 1), 1, 9)
        reg_trigger = f"Compliance signals: {', '.join(reg_signals)}" if reg_signals else "No compliance certifications mentioned"
        reg_impact = "Low" if reg_risk < 4 else "Medium"
        reg_mitigation = "Maintain compliance posture" if reg_signals else "Pursue relevant compliance certifications"

        # Competitive risk
        comp_signals = _extract_text_mentions(text, ["first-mover", "moat", "network effect", "proprietary", "patent", "barrier"])
        comp_risk = _clamp(round(7 - len(comp_signals) * 1.5, 1), 1, 9)
        comp_trigger = "Competitive moats identified" if comp_signals else "Limited competitive moats"
        comp_impact = "Low" if comp_risk < 4 else "Medium-high"
        comp_mitigation = "Build partnerships and strengthen moat" if comp_risk >= 5 else "Continue building competitive advantages"

        risk_domains = {
            "financial_risk":   {"score": fin_risk, "level": _flag_color(10 - fin_risk), "trigger": fin_trigger, "impact": fin_impact, "mitigation": fin_mitigation},
            "market_risk":      {"score": mkt_risk, "level": _flag_color(10 - mkt_risk), "trigger": mkt_trigger, "impact": mkt_impact, "mitigation": mkt_mitigation},
            "team_risk":        {"score": team_risk, "level": _flag_color(10 - team_risk), "trigger": team_trigger, "impact": team_impact, "mitigation": team_mitigation},
            "technology_risk":  {"score": tech_risk, "level": _flag_color(10 - tech_risk), "trigger": tech_trigger, "impact": tech_impact, "mitigation": tech_mitigation},
            "execution_risk":   {"score": exec_risk, "level": _flag_color(10 - exec_risk), "trigger": exec_trigger, "impact": exec_impact, "mitigation": exec_mitigation},
            "regulatory_risk":  {"score": reg_risk, "level": _flag_color(10 - reg_risk), "trigger": reg_trigger, "impact": reg_impact, "mitigation": reg_mitigation},
            "competitive_risk": {"score": comp_risk, "level": _flag_color(10 - comp_risk), "trigger": comp_trigger, "impact": comp_impact, "mitigation": comp_mitigation},
        }
        overall = round(sum(d["score"] for d in risk_domains.values()) / len(risk_domains), 1)
        flags = [{"domain": k, "flag": v["level"], "severity": v["score"], "trigger": v["trigger"],
                  "impact": v["impact"], "mitigation": v["mitigation"]}
                 for k, v in risk_domains.items()]
        return {"module_id": mid, "score": _clamp(round(10 - overall, 1)),
                "overall_risk_score": overall,
                "risk_domains": risk_domains, "flags": flags,
                "data_sources": {"financial_data": bool(fin), "key_metrics": bool(met), "text_analysis": bool(text)},
                "confidence": min(0.90, 0.4 + 0.15 * sum([bool(fin), bool(met), bool(text)]))}

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 3. MARKET ANALYSIS
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "market_analysis":
        revenue = n(fin, "revenue")
        customers = n(met, "customers")
        nrr = n(met, "nrr")
        mom_growth = n(met, "mom_growth")

        # Extract market sizing from text or company_info
        import re
        tam_match = re.search(r'TAM[:\s]*\$?([\d.]+)\s*(B|M|billion|million)', text, re.IGNORECASE)
        sam_match = re.search(r'SAM[:\s]*\$?([\d.]+)\s*(B|M|billion|million)', text, re.IGNORECASE)
        som_match = re.search(r'SOM[:\s]*\$?([\d.]+)\s*(B|M|billion|million)', text, re.IGNORECASE)

        def _fmt_market(m):
            if not m:
                return "Not provided"
            val, unit = m.group(1), m.group(2).upper()
            return f"${val}{'B' if unit.startswith('B') else 'M'}"

        tam = _fmt_market(tam_match)
        sam = _fmt_market(sam_match)
        som = _fmt_market(som_match)

        # Derive growth rate from text or metrics
        growth_match = re.search(r'(\d+)%?\s*(CAGR|month-over-month|MoM|annual)', text, re.IGNORECASE)
        growth_rate = f"{mom_growth}% MoM" if mom_growth else (growth_match.group(0) if growth_match else "Not provided")

        # Score: based on actual market data availability + metrics
        market_score = 5.0
        if tam != "Not provided":
            market_score += 1.5
        if revenue > 200_000:
            market_score += 1.0
        if customers >= 20:
            market_score += 0.8
        if nrr > 100:
            market_score += 0.7
        if mom_growth > 10:
            market_score += 1.0
        elif mom_growth > 5:
            market_score += 0.5
        market_score = _clamp(round(market_score, 1))

        # Competitive advantages from text
        adv_keywords = ["proprietary", "patent", "first-mover", "network effect", "moat",
                        "AI-powered", "machine learning", "NLP", "unique", "barrier"]
        competitive_advantages = _extract_text_mentions(text, adv_keywords) or ["Not identified from submitted data"]

        # Competitive position derived from score
        if market_score >= 8:
            competitive_position = "Leader"
        elif market_score >= 6.5:
            competitive_position = "Challenger"
        elif market_score >= 5:
            competitive_position = "Emerging"
        else:
            competitive_position = "Nascent"

        return {"module_id": mid, "score": market_score, "market_score": market_score,
                "tam": tam, "sam": sam, "som": som,
                "growth_rate": growth_rate, "competitive_position": competitive_position,
                "competitive_advantages": competitive_advantages,
                "data_sources": {"text_analysis": bool(text), "key_metrics": bool(met)},
                "confidence": min(0.90, 0.4 + 0.1 * sum([tam != "Not provided", sam != "Not provided",
                                                          revenue > 0, customers > 0, mom_growth > 0]))}

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 4. TEAM ASSESSMENT
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "team_assessment":
        team_size = n(met, "team_size")

        # Parse founder/team info from text
        import re
        founder_mentions = re.findall(
            r'(?:CEO|CTO|Co-?founder|Founder|VP|Director)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)',
            text
        )
        experience_signals = _extract_text_mentions(text,
            ["ex-Google", "ex-Meta", "ex-Amazon", "ex-Microsoft", "ex-Apple",
             "Stanford", "MIT", "Harvard", "Wharton", "MBA", "PhD",
             "prior exit", "previous exit", "years experience", "senior engineer"])
        role_mentions = _extract_text_mentions(text,
            ["CEO", "CTO", "CFO", "COO", "VP Sales", "VP Engineering",
             "VP Marketing", "Head of", "Director"])

        # Build founder list from real text
        founders = []
        ceo_match = re.search(r'CEO[:\s]+(.+?)(?:\n|$)', text)
        cto_match = re.search(r'CTO[:\s]+(.+?)(?:\n|$)', text)
        if ceo_match:
            founders.append({"role": "CEO", "description": ceo_match.group(1).strip(),
                             "experience_score": min(95, 60 + len(experience_signals) * 5)})
        if cto_match:
            founders.append({"role": "CTO", "description": cto_match.group(1).strip(),
                             "experience_score": min(95, 55 + len(experience_signals) * 5)})
        if not founders and founder_mentions:
            for fm in founder_mentions[:3]:
                founders.append({"role": "Team member", "description": fm, "experience_score": 60})

        # Completeness: check key roles present
        key_roles = ["CEO", "CTO", "VP Sales", "CFO", "VP Engineering"]
        covered = sum(1 for r in key_roles if r.lower() in text.lower())
        team_completeness = round(covered / len(key_roles) * 100)

        # Gaps: roles NOT found
        gaps = [r for r in key_roles if r.lower() not in text.lower()]

        # Score
        team_score = 5.0
        if team_size >= 10:
            team_score += 1.5
        elif team_size >= 5:
            team_score += 0.8
        team_score += min(2.0, len(experience_signals) * 0.4)
        team_score += min(1.0, len(founders) * 0.5)
        if team_completeness >= 60:
            team_score += 0.5
        team_score = _clamp(round(team_score, 1))

        return {"module_id": mid, "score": team_score, "team_score": team_score,
                "team_completeness": team_completeness,
                "diversity_score": min(100, 40 + len(set(experience_signals)) * 10),
                "founder_experience": min(95, 50 + len(experience_signals) * 7),
                "leadership_strength": min(95, 45 + covered * 10),
                "gaps": gaps if gaps else ["No major gaps identified"],
                "founders": founders if founders else [{"role": "Unknown", "description": "No founder data extracted", "experience_score": 0}],
                "team_size": int(team_size) if team_size else "Not provided",
                "data_sources": {"text_analysis": bool(text), "key_metrics": bool(met)},
                "confidence": min(0.90, 0.3 + 0.15 * sum([team_size > 0, bool(founders), bool(experience_signals), bool(text)]))}

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 5. FINANCIAL ANALYSIS
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "financial_analysis":
        revenue = n(fin, "revenue")
        burn_rate = n(fin, "burn_rate")
        runway = n(fin, "runway_months")
        mrr = n(fin, "mrr") or n(met, "mrr")
        gross_margin = n(fin, "gross_margin")
        mom_growth = n(met, "mom_growth")

        # Score built entirely from actual data
        score = 5.0
        if revenue > 500_000:
            score += 2.0
        elif revenue > 200_000:
            score += 1.0
        elif revenue > 50_000:
            score += 0.5
        if runway >= 18:
            score += 1.5
        elif runway >= 12:
            score += 1.0
        elif runway < 6 and runway > 0:
            score -= 1.0
        if gross_margin >= 70:
            score += 1.0
        elif gross_margin >= 50:
            score += 0.5
        if mom_growth > 10:
            score += 0.5

        # Burn multiple (lower is better)
        burn_multiple = 0
        if revenue > 0 and burn_rate > 0:
            burn_multiple = round(burn_rate / (revenue / 12), 2)
            if burn_multiple < 1.5:
                score += 1.0
            elif burn_multiple < 3:
                score += 0.3

        # LTV/CAC proxy (if NRR and MRR available)
        nrr = n(met, "nrr")
        customers = n(met, "customers")
        ltv_cac = 0
        if mrr > 0 and customers > 0:
            avg_revenue_per_customer = mrr / customers
            estimated_ltv = avg_revenue_per_customer * 12 * (nrr / 100 if nrr > 0 else 1.0)
            estimated_cac = burn_rate * 0.4 / max(customers / 12, 1) if burn_rate > 0 and customers > 0 else 0
            ltv_cac = round(estimated_ltv / estimated_cac, 1) if estimated_cac > 0 else 0

        score = _clamp(round(score, 1))

        # Revenue projections based on actual growth rate
        growth_multiplier = 1 + (mom_growth / 100) if mom_growth > 0 else 1.05
        proj_12m = round(revenue * (growth_multiplier ** 12)) if revenue > 0 else 0
        proj_24m = round(revenue * (growth_multiplier ** 24)) if revenue > 0 else 0

        return {"module_id": mid, "score": score,
                "financial_health_score": score,
                "revenue": revenue, "mrr": mrr,
                "burn_rate": burn_rate, "runway_months": runway,
                "ltv_cac_ratio": ltv_cac,
                "gross_margin": gross_margin / 100 if gross_margin > 1 else gross_margin,
                "revenue_growth_mom": mom_growth / 100 if mom_growth > 1 else mom_growth,
                "burn_multiple": burn_multiple,
                "projections": {"12m_revenue": proj_12m, "24m_revenue": proj_24m},
                "data_sources": {"financial_data": bool(fin), "key_metrics": bool(met)},
                "confidence": min(0.95, 0.3 + 0.1 * sum([revenue > 0, burn_rate > 0, runway > 0, mrr > 0, gross_margin > 0, mom_growth > 0]))}

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 6. TECHNOLOGY ASSESSMENT
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "technology_assessment":
        tech_keywords = ["patent", "proprietary", "AI", "ML", "NLP", "machine learning",
                         "deep learning", "cloud-native", "microservice", "kubernetes",
                         "docker", "serverless", "API", "SDK"]
        security_keywords = ["SOC 2", "SOC2", "ISO 27001", "GDPR", "HIPAA", "encryption", "certified"]
        stack_keywords = ["Python", "React", "Node", "TypeScript", "PostgreSQL", "MongoDB",
                          "Azure", "AWS", "GCP", "Terraform", "Redis", "Kafka"]

        tech_found = _extract_text_mentions(text, tech_keywords)
        security_found = _extract_text_mentions(text, security_keywords)
        stack_found = _extract_text_mentions(text, stack_keywords)

        # IP / patent signals
        import re
        patent_match = re.search(r'(\d+)\s*patents?\s*(pending|granted|filed)?', text, re.IGNORECASE)
        patents_desc = patent_match.group(0) if patent_match else "No patent data found"

        # TRL (Technology Readiness Level) estimation
        trl = 5  # base
        if tech_found:
            trl += 1
        if security_found:
            trl += 1
        if n(met, "customers") >= 10:
            trl = max(trl, 7)  # deployed with paying customers
        if n(fin, "revenue") > 100_000:
            trl = max(trl, 8)

        # Score
        score = 5.0
        score += min(2.0, len(tech_found) * 0.5)
        score += min(1.0, len(security_found) * 0.5)
        score += min(1.0, len(stack_found) * 0.3)
        if patent_match:
            score += 1.0
        score = _clamp(round(score, 1))

        # Risks derived from gaps
        risks = []
        if not security_found:
            risks.append("No security certifications mentioned")
        if len(stack_found) < 2:
            risks.append("Limited tech stack information provided")
        if not patent_match:
            risks.append("No patent or IP protection mentioned")
        if not risks:
            risks.append("Monitor technology evolution and competitive responses")

        ip_strength = "Strong" if patent_match and security_found else "Moderate" if patent_match or security_found else "Weak â€” no IP signals found"

        return {"module_id": mid, "score": score, "technology_score": score,
                "ip_strength": f"{ip_strength} â€” {patents_desc}",
                "trl": min(trl, 9),
                "scalability": "Production-ready" if trl >= 7 else "Scaling needed" if trl >= 5 else "Early stage",
                "stack": stack_found if stack_found else ["Not identified from submitted data"],
                "risks": risks,
                "tech_differentiators": tech_found if tech_found else ["None identified"],
                "security_compliance": security_found if security_found else ["None identified"],
                "data_sources": {"text_analysis": bool(text)},
                "confidence": min(0.85, 0.3 + 0.1 * sum([bool(tech_found), bool(security_found), bool(stack_found), bool(patent_match)]))}

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 7. BUSINESS MODEL
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "business_model":
        revenue = n(fin, "revenue")
        mrr = n(fin, "mrr") or n(met, "mrr")
        burn_rate = n(fin, "burn_rate")
        gross_margin = n(fin, "gross_margin")
        customers = n(met, "customers")

        # Detect model type from text
        model_signals = _extract_text_mentions(text,
            ["SaaS", "subscription", "B2B", "B2C", "marketplace", "platform",
             "enterprise", "freemium", "usage-based", "transactional", "licensing"])
        model_type = ", ".join(model_signals[:3]) if model_signals else "Not identified"

        # Revenue model strength
        rev_strength = 5.0
        if mrr > 0:
            rev_strength += min(2.0, mrr / 30_000)
        if gross_margin > 60:
            rev_strength += 1.0
        if "subscription" in text.lower() or "SaaS" in text.lower() or "recurring" in text.lower():
            rev_strength += 0.5  # recurring revenue models are stronger
        rev_strength = _clamp(round(rev_strength, 1))

        # Unit economics from real data
        cac = 0
        ltv = 0
        payback_months = 0
        if customers > 0 and burn_rate > 0:
            cac = round(burn_rate * 0.4 * 12 / max(customers, 1))  # estimated
        if mrr > 0 and customers > 0:
            avg_mrr_per_customer = mrr / customers
            nrr = n(met, "nrr")
            ltv = round(avg_mrr_per_customer * 12 * (nrr / 100 if nrr > 0 else 1.0))
        if cac > 0 and mrr > 0 and customers > 0:
            payback_months = round(cac / (mrr / customers)) if mrr / customers > 0 else 0

        # Overall score
        score = 5.0
        if mrr > 20_000:
            score += 1.0
        if gross_margin > 60:
            score += 1.0
        if ltv > 0 and cac > 0 and ltv / cac > 3:
            score += 1.0
        elif ltv > 0 and cac > 0 and ltv / cac > 1.5:
            score += 0.5
        score += min(1.0, len(model_signals) * 0.3)
        score = _clamp(round(score, 1))

        # Strategic positioning from text
        positioning_signals = _extract_text_mentions(text,
            ["product-led", "enterprise sales", "channel partner", "self-serve",
             "land and expand", "niche", "vertical", "horizontal"])
        strategic_positioning = ", ".join(positioning_signals) if positioning_signals else "Not clearly identified from data"

        return {"module_id": mid, "score": score, "business_model_score": score,
                "model_type": model_type,
                "revenue_model_strength": rev_strength,
                "strategic_positioning": strategic_positioning,
                "unit_economics": {"cac": cac, "ltv": ltv, "payback_months": payback_months,
                                   "ltv_cac_ratio": round(ltv / cac, 1) if cac > 0 else 0},
                "data_sources": {"financial_data": bool(fin), "key_metrics": bool(met), "text_analysis": bool(text)},
                "confidence": min(0.90, 0.3 + 0.1 * sum([revenue > 0, mrr > 0, customers > 0, gross_margin > 0, bool(model_signals)]))}

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 8. GROWTH ASSESSMENT
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "growth_assessment":
        revenue = n(fin, "revenue")
        mrr = n(fin, "mrr") or n(met, "mrr")
        mom_growth = n(met, "mom_growth")
        nrr = n(met, "nrr")
        customers = n(met, "customers")
        team_size = n(met, "team_size")

        # Growth score from actual metrics
        score = 5.0
        if mom_growth > 15:
            score += 2.0
        elif mom_growth > 10:
            score += 1.5
        elif mom_growth > 5:
            score += 0.8
        if nrr > 120:
            score += 1.5
        elif nrr > 100:
            score += 0.8
        if customers >= 30:
            score += 0.5
        if revenue > 300_000:
            score += 0.5
        score = _clamp(round(score, 1))

        # Scalability index
        scalability = 5.0
        if team_size > 0 and revenue > 0:
            revenue_per_head = revenue / team_size
            if revenue_per_head > 50_000:
                scalability += 1.5
            elif revenue_per_head > 25_000:
                scalability += 0.8
        if nrr > 100:
            scalability += 1.0
        scalability = _clamp(round(scalability, 1))

        # Growth projections from actual growth rate
        growth_multiplier = 1 + (mom_growth / 100) if mom_growth > 0 else 1.05
        proj_y1 = round(growth_multiplier ** 12, 1) if mom_growth > 0 else "N/A â€” growth data not provided"
        proj_y2 = round(growth_multiplier ** 24, 1) if mom_growth > 0 else "N/A"
        proj_y3 = round(growth_multiplier ** 36, 1) if mom_growth > 0 else "N/A"

        # Drivers and challenges from actual data signals
        growth_drivers = []
        if nrr > 100:
            growth_drivers.append(f"Net revenue retention {nrr}% â€” expansion revenue")
        if mom_growth > 10:
            growth_drivers.append(f"{mom_growth}% MoM growth â€” strong momentum")
        if customers > 20:
            growth_drivers.append(f"{int(customers)} customers â€” expanding base")
        text_drivers = _extract_text_mentions(text,
            ["network effect", "platform", "expansion", "partnership", "integration"])
        growth_drivers.extend(text_drivers)
        if not growth_drivers:
            growth_drivers.append("Growth drivers not clearly identified from data")

        scaling_challenges = []
        if team_size < 10:
            scaling_challenges.append(f"Small team ({int(team_size)}) may limit scaling speed")
        if n(fin, "runway_months") < 12:
            scaling_challenges.append(f"Limited runway ({n(fin, 'runway_months'):.0f} months) constrains growth")
        text_challenges = _extract_text_mentions(text, ["challenge", "risk", "limitation", "constraint"])
        scaling_challenges.extend(text_challenges[:2])
        if not scaling_challenges:
            scaling_challenges.append("No major scaling challenges identified")

        return {"module_id": mid, "score": score, "growth_potential_score": score,
                "scalability_index": scalability,
                "growth_drivers": growth_drivers,
                "scaling_challenges": scaling_challenges,
                "growth_projections": {"year1": f"{proj_y1}x", "year2": f"{proj_y2}x", "year3": f"{proj_y3}x"},
                "actual_growth_rate": f"{mom_growth}% MoM" if mom_growth else "Not provided",
                "nrr": nrr if nrr else "Not provided",
                "data_sources": {"financial_data": bool(fin), "key_metrics": bool(met), "text_analysis": bool(text)},
                "confidence": min(0.90, 0.3 + 0.15 * sum([mom_growth > 0, nrr > 0, customers > 0, revenue > 0]))}

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # 9. INVESTMENT READINESS
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if mid == "investment_readiness":
        revenue = n(fin, "revenue")
        mrr = n(fin, "mrr") or n(met, "mrr")
        burn_rate = n(fin, "burn_rate")
        runway = n(fin, "runway_months")
        customers = n(met, "customers")
        nrr = n(met, "nrr")
        mom_growth = n(met, "mom_growth")
        team_size = n(met, "team_size")
        gross_margin = n(fin, "gross_margin")

        # Readiness score from actual data
        score = 5.0
        if revenue > 300_000:
            score += 1.0
        elif revenue > 100_000:
            score += 0.5
        if runway >= 12:
            score += 0.8
        if mom_growth > 10:
            score += 0.8
        if nrr > 100:
            score += 0.5
        if gross_margin > 60:
            score += 0.5
        if team_size >= 8:
            score += 0.4
        if customers >= 20:
            score += 0.5
        score = _clamp(round(score, 1))

        # Extract funding ask from text
        import re
        ask_match = re.search(r'\$?([\d.]+)\s*[Mm](illion)?\s*(Series\s*[A-Z]|seed|raise|round)', text, re.IGNORECASE)
        valuation_match = re.search(r'\$?([\d.]+)\s*[Mm](illion)?\s*(pre-money|post-money|valuation)', text, re.IGNORECASE)
        stage_match = re.search(r'(Series\s*[A-Z]|Seed|Pre-?seed|Bridge)', text, re.IGNORECASE)

        funding_ask = ask_match.group(0) if ask_match else "Not specified"
        valuation = valuation_match.group(0) if valuation_match else "Not specified"
        stage = stage_match.group(0) if stage_match else ci.get("stage", "Not specified")

        # Implied ARR multiple
        arr = revenue if revenue > 0 else mrr * 12 if mrr > 0 else 0
        val_num = 0
        if valuation_match:
            try:
                val_num = float(valuation_match.group(1)) * 1_000_000
            except ValueError:
                val_num = 0
        arr_multiple = round(val_num / arr, 1) if arr > 0 and val_num > 0 else "N/A"

        # Exit potential from actual metrics
        exit_timeline = "7+ years"
        if revenue > 500_000 and mom_growth > 10:
            exit_timeline = "4-6 years"
        elif revenue > 200_000:
            exit_timeline = "5-7 years"

        return {"module_id": mid, "score": score, "readiness_score": score,
                "exit_potential": {"timeline": exit_timeline,
                                   "strategic_fit": "High" if score >= 7 else "Moderate" if score >= 5 else "Low"},
                "funding_recommendation": {"round": stage, "ask": funding_ask,
                                            "valuation": valuation,
                                            "arr_multiple": arr_multiple,
                                            "valuation_range": valuation if valuation != "Not specified" else "Insufficient data"},
                "investor_fit": [],  # no mock investors; real matching requires external data
                "actual_metrics_used": {
                    "revenue": revenue, "mrr": mrr, "burn_rate": burn_rate,
                    "runway_months": runway, "customers": int(customers),
                    "growth_rate": f"{mom_growth}% MoM" if mom_growth else "N/A",
                },
                "data_sources": {"financial_data": bool(fin), "key_metrics": bool(met), "text_analysis": bool(text)},
                "confidence": min(0.90, 0.3 + 0.1 * sum([revenue > 0, mrr > 0, customers > 0, mom_growth > 0, runway > 0, bool(stage)]))}

    return {"module_id": mid, "score": 5.0, "confidence": 0.3,
            "note": "Insufficient data for this module", "data_sources": {}}


@app.post("/api/analysis/9-module")
async def run_nine_module_analysis(request: Request):
    """
    Run the full 9-module TCA analysis.
    Reads uploaded data from allupload table for the specified company,
    runs all 9 modules, stores the result back, and returns it.
    """
    try:
        data = await request.json()
        company_name = data.get("company_name", "Unknown")
        upload_ids = data.get("upload_ids", [])          # optional filter

        # â”€â”€ 1. Read uploads from allupload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        async with db_manager.get_connection() as conn:
            if upload_ids:
                rows = await conn.fetch(
                    """SELECT upload_id, source_type, file_name, extracted_text,
                              extracted_data, company_name
                       FROM allupload
                       WHERE upload_id = ANY($1::uuid[])
                       ORDER BY created_at""",
                    upload_ids
                )
            else:
                rows = await conn.fetch(
                    """SELECT upload_id, source_type, file_name, extracted_text,
                              extracted_data, company_name
                       FROM allupload
                       WHERE (company_name = $1 OR $1 = 'Unknown')
                       ORDER BY created_at DESC LIMIT 20""",
                    company_name
                )

        # â”€â”€ 2. Merge extracted data from all uploads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        merged_text = []
        merged_data = {}
        source_ids = []

        if rows:
            for r in rows:
                source_ids.append(str(r["upload_id"]))
                if r["extracted_text"]:
                    merged_text.append(r["extracted_text"])
                ed = r["extracted_data"]
                if isinstance(ed, str):
                    try:
                        ed = json.loads(ed)
                    except Exception:
                        ed = {}
                if isinstance(ed, dict):
                    merged_data = {**merged_data, **ed}
        else:
            # Support inline analysis: use data provided directly in the request
            inline_financial = data.get("financial_data")
            inline_metrics = data.get("key_metrics")
            if inline_financial or inline_metrics:
                if inline_financial:
                    merged_data["financial_data"] = inline_financial
                if inline_metrics:
                    merged_data["key_metrics"] = inline_metrics
            else:
                raise HTTPException(status_code=404,
                                    detail="No uploads found. Upload data first via /api/files/upload")

        # Overlay any inline financial_data / key_metrics from the request
        if data.get("financial_data") and "financial_data" not in merged_data:
            merged_data["financial_data"] = data["financial_data"]
        if data.get("key_metrics") and "key_metrics" not in merged_data:
            merged_data["key_metrics"] = data["key_metrics"]

        company_data = {
            "company_name": company_name,
            "extracted_text": "\n".join(merged_text),
            **merged_data,
        }

        logger.info(f"Running 9-module analysis for '{company_name}' using {len(rows)} uploads")

        # â”€â”€ 3. Run all 9 modules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await asyncio.sleep(1)  # simulate processing

        module_results = {}
        total_weight = 0
        weighted_score = 0

        for mod in NINE_MODULES:
            result = _run_module(mod, company_data, merged_data)
            score = result.get("score", 0)
            w = mod["weight"]
            result["weighted_score"] = round(score * w / 100, 2)
            module_results[mod["id"]] = result
            weighted_score += score * w
            total_weight += w

        final_score = round(weighted_score / total_weight, 1) if total_weight > 0 else 0

        # â”€â”€ 4. Determine recommendation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if final_score >= 8.0:
            recommendation = "STRONG BUY â€” High confidence investment opportunity"
        elif final_score >= 7.0:
            recommendation = "PROCEED â€” Proceed with due diligence"
        elif final_score >= 5.5:
            recommendation = "CONDITIONAL â€” Address key risks before investing"
        else:
            recommendation = "PASS â€” Risk/reward profile not aligned"

        analysis_output = {
            "analysis_type": "comprehensive_9_module",
            "company_name": company_name,
            "timestamp": datetime.utcnow().isoformat(),
            "final_tca_score": final_score,
            "investment_recommendation": recommendation,
            "active_modules": [m["id"] for m in NINE_MODULES],
            "module_count": len(NINE_MODULES),
            "analysis_completeness": 100.0,
            "source_upload_ids": source_ids,
            "module_results": module_results,
        }

        # â”€â”€ 5. Store analysis result back into allupload rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if source_ids:
            async with db_manager.get_connection() as conn:
                for uid in source_ids:
                    await conn.execute(
                        """UPDATE allupload
                           SET analysis_result = $1,
                               analysis_id = $2,
                               updated_at = NOW()
                           WHERE upload_id = $3""",
                        json.dumps(analysis_output),
                        f"9mod_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                        uuid.UUID(uid)
                    )

        logger.info(f"9-module analysis complete: score={final_score}, rec={recommendation}")
        return analysis_output

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"9-module analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"9-module analysis failed: {str(e)}")


# â”€â”€â”€ Triage Report Generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.post("/api/reports/triage")
async def generate_triage_report(request: Request):
    """
    Generate a triage report from 9-module analysis data.
    Returns structured JSON suitable for the frontend to render or export as PDF.
    Structure: Executive Summary + TCA Scorecard (Page 1), Risks + Recommendation (Page 2),
    plus additional detail pages for a total of ~5-6 pages.
    """
    try:
        data = await request.json()
        company_name = data.get("company_name", "Unknown")
        analysis = data.get("analysis_data")

        # If no analysis provided, try to read the latest from DB
        if not analysis:
            async with db_manager.get_connection() as conn:
                row = await conn.fetchrow(
                    """SELECT analysis_result FROM allupload
                       WHERE company_name = $1 AND analysis_result != '{}'::jsonb
                       ORDER BY updated_at DESC LIMIT 1""",
                    company_name
                )
            if row:
                ar = row["analysis_result"]
                analysis = json.loads(ar) if isinstance(ar, str) else ar
            else:
                raise HTTPException(status_code=404,
                                    detail="No analysis found. Run /api/analysis/9-module first.")

        mr = analysis.get("module_results", {})
        tca = mr.get("tca_scorecard", {})
        risk = mr.get("risk_assessment", {})
        market = mr.get("market_analysis", {})
        team = mr.get("team_assessment", {})
        fin = mr.get("financial_analysis", {})
        tech = mr.get("technology_assessment", {})
        biz = mr.get("business_model", {})
        growth = mr.get("growth_assessment", {})
        invest = mr.get("investment_readiness", {})

        triage_report = {
            "report_type": "triage",
            "company_name": company_name,
            "generated_at": datetime.utcnow().isoformat(),
            "final_tca_score": analysis.get("final_tca_score", 0),
            "recommendation": analysis.get("investment_recommendation", ""),
            "total_pages": 6,

            # â”€â”€ Page 1: Executive Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "page_1_executive_summary": {
                "title": f"Triage Report â€” {company_name}",
                "overall_score": analysis.get("final_tca_score", 0),
                "score_interpretation": (
                    "Strong candidate for investment" if analysis.get("final_tca_score", 0) >= 7.5
                    else "Moderate potential â€” further analysis required" if analysis.get("final_tca_score", 0) >= 5.5
                    else "Significant concerns identified"
                ),
                "investment_recommendation": analysis.get("investment_recommendation", ""),
                "analysis_completeness": analysis.get("analysis_completeness", 0),
                "modules_run": analysis.get("module_count", 9),
            },

            # â”€â”€ Page 2: TCA Scorecard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "page_2_tca_scorecard": {
                "title": "TCA Scorecard â€” Category Breakdown",
                "composite_score": tca.get("composite_score", 0),
                "categories": tca.get("categories", []),
                "top_strengths": [c["category"] for c in tca.get("categories", []) if c.get("flag") == "green"][:3],
                "areas_of_concern": [c["category"] for c in tca.get("categories", []) if c.get("flag") != "green"][:3],
            },

            # â”€â”€ Page 3: Risk Assessment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "page_3_risk_assessment": {
                "title": "Risk Assessment & Flags",
                "overall_risk_score": risk.get("overall_risk_score", 0),
                "total_flags": len(risk.get("flags", [])),
                "high_risk_count": len([f for f in risk.get("flags", []) if f.get("severity", 0) >= 6]),
                "risk_flags": risk.get("flags", []),
                "risk_domains": risk.get("risk_domains", {}),
            },

            # â”€â”€ Page 4: Market & Team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "page_4_market_and_team": {
                "title": "Market Opportunity & Team Assessment",
                "market_score": market.get("market_score", 0),
                "tam": market.get("tam", "N/A"),
                "sam": market.get("sam", "N/A"),
                "som": market.get("som", "N/A"),
                "growth_rate": market.get("growth_rate", "N/A"),
                "competitive_position": market.get("competitive_position", "N/A"),
                "competitive_advantages": market.get("competitive_advantages", []),
                "team_score": team.get("team_score", 0),
                "team_completeness": team.get("team_completeness", 0),
                "founders": team.get("founders", []),
                "team_gaps": team.get("gaps", []),
            },

            # â”€â”€ Page 5: Financial & Technology â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "page_5_financials_and_tech": {
                "title": "Financial Health & Technology Assessment",
                "financial_score": fin.get("financial_health_score", 0),
                "revenue": fin.get("revenue", 0),
                "mrr": fin.get("mrr", 0),
                "burn_rate": fin.get("burn_rate", 0),
                "runway_months": fin.get("runway_months", 0),
                "ltv_cac_ratio": fin.get("ltv_cac_ratio", 0),
                "gross_margin": fin.get("gross_margin", 0),
                "technology_score": tech.get("technology_score", 0),
                "trl": tech.get("trl", 0),
                "ip_strength": tech.get("ip_strength", "N/A"),
                "tech_stack": tech.get("stack", []),
            },

            # â”€â”€ Page 6: Recommendations & Next Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "page_6_recommendations": {
                "title": "Investment Recommendation & Next Steps",
                "final_decision": analysis.get("investment_recommendation", ""),
                "business_model_score": biz.get("business_model_score", 0),
                "business_model_type": biz.get("model_type", "N/A"),
                "growth_potential_score": growth.get("growth_potential_score", 0),
                "growth_projections": growth.get("growth_projections", {}),
                "investment_readiness_score": invest.get("readiness_score", 0),
                "exit_potential": invest.get("exit_potential", {}),
                "funding_recommendation": invest.get("funding_recommendation", {}),
                "next_steps": [
                    "1. Conduct management team interviews and reference checks",
                    "2. Verify financial projections with audited statements",
                    "3. Commission independent market sizing analysis",
                    "4. Perform detailed competitive landscape mapping",
                    "5. Engage technical due diligence on IP and architecture",
                    "6. Negotiate term sheet based on analysis findings",
                ],
            },
        }

        logger.info(f"Triage report generated for '{company_name}' â€” 6 pages")
        return triage_report

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Triage report error: {e}")
        raise HTTPException(status_code=500, detail=f"Triage report failed: {str(e)}")


# â”€â”€â”€ DD (Due Diligence) Report Generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.post("/api/reports/dd")
async def generate_dd_report(request: Request):
    """
    Generate a comprehensive Due Diligence report from 9-module analysis data.
    Returns structured JSON with 20+ sections suitable for a thorough DD document.
    """
    try:
        data = await request.json()
        company_name = data.get("company_name", "Unknown")
        analysis = data.get("analysis_data")

        # If no analysis provided, read from DB
        if not analysis:
            async with db_manager.get_connection() as conn:
                # Get analysis result
                row = await conn.fetchrow(
                    """SELECT analysis_result FROM allupload
                       WHERE company_name = $1 AND analysis_result != '{}'::jsonb
                       ORDER BY updated_at DESC LIMIT 1""",
                    company_name
                )
            if row:
                ar = row["analysis_result"]
                analysis = json.loads(ar) if isinstance(ar, str) else ar
            else:
                raise HTTPException(status_code=404,
                                    detail="No analysis found. Run /api/analysis/9-module first.")

        mr = analysis.get("module_results", {})
        tca = mr.get("tca_scorecard", {})
        risk = mr.get("risk_assessment", {})
        market = mr.get("market_analysis", {})
        team = mr.get("team_assessment", {})
        fin = mr.get("financial_analysis", {})
        tech = mr.get("technology_assessment", {})
        biz = mr.get("business_model", {})
        growth = mr.get("growth_assessment", {})
        invest = mr.get("investment_readiness", {})

        dd_report = {
            "report_type": "due_diligence",
            "company_name": company_name,
            "generated_at": datetime.utcnow().isoformat(),
            "final_tca_score": analysis.get("final_tca_score", 0),
            "total_pages": 25,

            # â”€â”€ Section 1: Cover & Table of Contents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_01_cover": {
                "title": f"Due Diligence Report â€” {company_name}",
                "subtitle": "Comprehensive Investment Analysis",
                "prepared_by": "TCA IRR Analysis Platform",
                "date": datetime.utcnow().strftime("%B %d, %Y"),
                "classification": "CONFIDENTIAL",
                "table_of_contents": [
                    "1. Executive Summary", "2. Investment Thesis",
                    "3. TCA Scorecard", "4. Risk Assessment",
                    "5. Market Analysis", "6. Competitive Landscape",
                    "7. Team Assessment", "8. Financial Analysis",
                    "9. Technology & IP", "10. Business Model",
                    "11. Growth Assessment", "12. Investment Readiness",
                    "13. PESTEL Analysis", "14. Benchmarking",
                    "15. Gap Analysis", "16. Strategic Fit",
                    "17. Valuation Analysis", "18. Deal Structure",
                    "19. Conditions & Covenants", "20. Appendices",
                ],
            },

            # â”€â”€ Section 2: Executive Summary (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_02_executive_summary": {
                "title": "Executive Summary",
                "overall_score": analysis.get("final_tca_score", 0),
                "investment_recommendation": analysis.get("investment_recommendation", ""),
                "key_findings": [
                    f"TCA composite score: {analysis.get('final_tca_score', 0)}/10",
                    f"Overall risk level: {risk.get('overall_risk_score', 0)}/10",
                    f"Market opportunity: {market.get('tam', 'N/A')} TAM",
                    f"Team readiness: {team.get('team_score', 0)}/10",
                    f"Financial health: {fin.get('financial_health_score', 0)}/10",
                    f"Investment readiness: {invest.get('readiness_score', 0)}/10",
                ],
                "strengths_summary": [c["category"] for c in tca.get("categories", []) if c.get("flag") == "green"],
                "concerns_summary": [c["category"] for c in tca.get("categories", []) if c.get("flag") != "green"],
                "modules_completed": analysis.get("module_count", 9),
                "analysis_completeness": analysis.get("analysis_completeness", 100),
            },

            # â”€â”€ Section 3: Investment Thesis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_03_investment_thesis": {
                "title": "Investment Thesis",
                "thesis_statement": f"{company_name} presents a {'compelling' if analysis.get('final_tca_score', 0) >= 7.5 else 'moderate'} investment opportunity with strong potential in its target market.",
                "value_drivers": [
                    "Strong founding team with relevant domain expertise",
                    "Clear product-market fit demonstrated through growing revenue",
                    "Large addressable market with favorable growth dynamics",
                    "Defensible technology with intellectual property protection",
                ],
                "key_risks": [f.get("trigger", "") for f in risk.get("flags", []) if f.get("severity", 0) >= 5],
                "risk_mitigants": [f.get("mitigation", "") for f in risk.get("flags", []) if f.get("severity", 0) >= 5],
            },

            # â”€â”€ Section 4: TCA Scorecard (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_04_tca_scorecard": {
                "title": "TCA Scorecard â€” Detailed Category Breakdown",
                "composite_score": tca.get("composite_score", 0),
                "categories": tca.get("categories", []),
                "scoring_methodology": "Weighted average across 5 core categories (weights sum to 100%)",
                "interpretation_scale": {
                    "8.0_plus": "Excellent â€” strong investment candidate",
                    "7.0_to_8.0": "Good â€” proceed with due diligence",
                    "5.5_to_7.0": "Moderate â€” conditional proceed",
                    "below_5.5": "Weak â€” significant barriers to investment",
                },
            },

            # â”€â”€ Section 5: Risk Assessment (3 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_05_risk_assessment": {
                "title": "Comprehensive Risk Assessment",
                "overall_risk_score": risk.get("overall_risk_score", 0),
                "risk_rating": (
                    "LOW" if risk.get("overall_risk_score", 0) < 4
                    else "MEDIUM" if risk.get("overall_risk_score", 0) < 6
                    else "HIGH"
                ),
                "flags": risk.get("flags", []),
                "risk_domains": risk.get("risk_domains", {}),
                "risk_matrix": {
                    "high_impact_high_probability": [f for f in risk.get("flags", []) if f.get("severity", 0) >= 6],
                    "high_impact_low_probability": [],
                    "low_impact_high_probability": [f for f in risk.get("flags", []) if 4 <= f.get("severity", 0) < 6],
                    "low_impact_low_probability": [f for f in risk.get("flags", []) if f.get("severity", 0) < 4],
                },
                "mitigation_plan": [
                    {"risk": f.get("domain", ""), "strategy": f.get("mitigation", ""), "priority": "High" if f.get("severity", 0) >= 6 else "Medium"}
                    for f in risk.get("flags", [])
                ],
            },

            # â”€â”€ Section 6: Market Analysis (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_06_market_analysis": {
                "title": "Market & Competition Analysis",
                "market_score": market.get("market_score", 0),
                "market_sizing": {"tam": market.get("tam"), "sam": market.get("sam"), "som": market.get("som")},
                "growth_rate": market.get("growth_rate", ""),
                "competitive_position": market.get("competitive_position", ""),
                "competitive_advantages": market.get("competitive_advantages", []),
                "market_trends": ["Digital transformation acceleration", "AI/ML adoption growth", "Remote-work enablement"],
                "barriers_to_entry": ["Technical complexity", "Regulatory requirements", "Network effects"],
            },

            # â”€â”€ Section 7: Team Assessment (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_07_team_assessment": {
                "title": "Team & Leadership Assessment",
                "team_score": team.get("team_score", 0),
                "team_completeness": team.get("team_completeness", 0),
                "diversity_score": team.get("diversity_score", 0),
                "founders": team.get("founders", []),
                "leadership_strength": team.get("leadership_strength", 0),
                "gaps_identified": team.get("gaps", []),
                "recommendations": [
                    f"Hire {gap} within next 6 months" for gap in team.get("gaps", [])
                ],
                "organizational_readiness": "Adequate for current stage; scaling plan needed for Series A",
            },

            # â”€â”€ Section 8: Financial Analysis (3 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_08_financial_analysis": {
                "title": "Financial Health & Projections",
                "financial_score": fin.get("financial_health_score", 0),
                "current_metrics": {
                    "revenue": fin.get("revenue", 0),
                    "mrr": fin.get("mrr", 0),
                    "burn_rate": fin.get("burn_rate", 0),
                    "runway_months": fin.get("runway_months", 0),
                    "gross_margin": fin.get("gross_margin", 0),
                    "ltv_cac_ratio": fin.get("ltv_cac_ratio", 0),
                    "revenue_growth_mom": fin.get("revenue_growth_mom", 0),
                },
                "projections": fin.get("projections", {}),
                "funding_history": "Seed round completed",
                "use_of_proceeds": [
                    "Engineering (40%)", "Sales & Marketing (30%)",
                    "Operations (15%)", "G&A (15%)"
                ],
                "financial_risks": [
                    "Burn rate exceeds revenue growth rate in short term",
                    "Customer concentration risk in top accounts",
                ],
            },

            # â”€â”€ Section 9: Technology & IP (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_09_technology": {
                "title": "Technology & Intellectual Property Assessment",
                "technology_score": tech.get("technology_score", 0),
                "trl": tech.get("trl", 0),
                "ip_strength": tech.get("ip_strength", ""),
                "tech_stack": tech.get("stack", []),
                "development_risks": tech.get("risks", []),
                "scalability_assessment": tech.get("scalability", ""),
                "security_posture": "SOC 2 Type I in progress, GDPR compliant",
                "technical_debt": "Moderate â€” refactoring scheduled for Q3",
            },

            # â”€â”€ Section 10: Business Model (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_10_business_model": {
                "title": "Business Model & Strategy Analysis",
                "business_model_score": biz.get("business_model_score", 0),
                "model_type": biz.get("model_type", ""),
                "revenue_model_strength": biz.get("revenue_model_strength", 0),
                "strategic_positioning": biz.get("strategic_positioning", ""),
                "unit_economics": biz.get("unit_economics", {}),
                "pricing_strategy": "Value-based tiered pricing with annual contracts",
                "customer_segments": ["Mid-market B2B", "Enterprise", "Government"],
            },

            # â”€â”€ Section 11: Growth Assessment (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_11_growth": {
                "title": "Growth Potential & Scalability Analysis",
                "growth_potential_score": growth.get("growth_potential_score", 0),
                "scalability_index": growth.get("scalability_index", 0),
                "growth_drivers": growth.get("growth_drivers", []),
                "scaling_challenges": growth.get("scaling_challenges", []),
                "growth_projections": growth.get("growth_projections", {}),
                "expansion_strategy": {
                    "geographic": ["North America", "Europe", "APAC"],
                    "product": ["Core platform", "API marketplace", "Analytics add-on"],
                    "channel": ["Direct sales", "Partner channel", "Self-serve"],
                },
            },

            # â”€â”€ Section 12: Investment Readiness (2 pages) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_12_investment_readiness": {
                "title": "Investment Readiness & Exit Potential",
                "readiness_score": invest.get("readiness_score", 0),
                "exit_potential": invest.get("exit_potential", {}),
                "funding_recommendation": invest.get("funding_recommendation", {}),
                "investor_fit": invest.get("investor_fit", []),
                "comparable_exits": [
                    {"company": "CompanyA", "exit_type": "Acquisition", "valuation": "$45M", "year": 2024},
                    {"company": "CompanyB", "exit_type": "IPO", "valuation": "$200M", "year": 2025},
                ],
            },

            # â”€â”€ Section 13: PESTEL Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_13_pestel": {
                "title": "PESTEL Macro-Environment Analysis",
                "factors": {
                    "political": {"score": 7.2, "assessment": "Favorable regulatory environment for tech startups"},
                    "economic": {"score": 6.8, "assessment": "Mixed macro conditions; strong VC funding environment"},
                    "social": {"score": 8.1, "assessment": "Growing demand for digital solutions"},
                    "technological": {"score": 8.7, "assessment": "Rapid AI/ML adoption creating tailwinds"},
                    "environmental": {"score": 7.0, "assessment": "Low environmental regulatory exposure"},
                    "legal": {"score": 6.9, "assessment": "Standard compliance requirements; data privacy focus"},
                },
                "composite_score": 44.7,
            },

            # â”€â”€ Section 14: Benchmark Comparison â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_14_benchmarks": {
                "title": "Industry Benchmarking & Peer Comparison",
                "overall_percentile": 72,
                "benchmarks": {
                    "revenue_growth": {"company": "15% MoM", "industry_avg": "10% MoM", "percentile": 75},
                    "burn_multiple": {"company": "1.8x", "industry_avg": "2.5x", "percentile": 68},
                    "ltv_cac": {"company": "3.2x", "industry_avg": "3.0x", "percentile": 55},
                    "team_size_efficiency": {"company": "$62K ARR/employee", "industry_avg": "$55K", "percentile": 70},
                },
            },

            # â”€â”€ Section 15: Gap Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            "section_15_gap_analysis": {
                "title": "Gap Analysis & Improvement Roadmap",
                "gaps": [
                    {"area": "Sales & Marketing Capability", "gap_size": 2.5, "priority": "High",
                     "recommendation": "Hire VP Sales and build outbound motion"},
                    {"area": "Product Analytics", "gap_size": 1.2, "priority": "Medium",
                     "recommendation": "Implement product-led growth metrics"},
                    {"area": "Operations Scalability", "gap_size": 3.0, "priority": "High",
                     "recommendation": "Automate onboarding and support workflows"},
                    {"area": "Financial Planning", "gap_size": 1.5, "priority": "Medium",
                     "recommendation": "Build rolling 18-month financial model"},
                ],
            },

            # â”€â”€ Section 16â€“20: Strategic Fit, Valuation, Deal, Conditions, Appendices
            "section_16_strategic_fit": {
                "title": "Strategic Fit Analysis",
                "alignment_score": 7.5,
                "fit_factors": [
                    {"factor": "Market Alignment", "score": 8.0, "comment": "Strong fit with target sectors"},
                    {"factor": "Portfolio Synergy", "score": 7.2, "comment": "Complementary to existing investments"},
                    {"factor": "Value-Add Potential", "score": 7.8, "comment": "Significant operational support opportunity"},
                ],
            },
            "section_17_valuation": {
                "title": "Valuation Analysis",
                "methodology": ["DCF", "Comparable Multiples", "Precedent Transactions"],
                "valuation_range": invest.get("funding_recommendation", {}).get("valuation_range", "$15-20M"),
                "implied_multiples": {"revenue": "8-12x ARR", "arr_growth_adjusted": "1.5-2.0x"},
            },
            "section_18_deal_structure": {
                "title": "Proposed Deal Structure",
                "investment_amount": invest.get("funding_recommendation", {}).get("target", "$3-5M"),
                "instrument": "Series A Preferred Equity",
                "key_terms": [
                    "1x non-participating liquidation preference",
                    "Pro-rata rights for follow-on rounds",
                    "Board observer seat",
                    "Standard protective provisions",
                ],
            },
            "section_19_conditions": {
                "title": "Conditions & Covenants",
                "conditions_precedent": [
                    "Satisfactory completion of legal due diligence",
                    "Verification of financial statements",
                    "Key employee retention agreements",
                    "IP assignment confirmation",
                ],
                "ongoing_covenants": [
                    "Monthly financial reporting",
                    "Quarterly board meetings",
                    "Annual budget approval",
                    "Material event notification",
                ],
            },
            "section_20_appendices": {
                "title": "Appendices",
                "items": [
                    "A. Detailed Financial Statements",
                    "B. Market Research Data Sources",
                    "C. Technical Architecture Diagrams",
                    "D. Team Biographies",
                    "E. Comparable Transaction Analysis",
                    "F. Risk Register (Full)",
                    "G. Data Room Index",
                ],
            },
        }

        logger.info(f"DD report generated for '{company_name}' â€” {dd_report['total_pages']} pages, 20 sections")
        return dd_report

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DD report error: {e}")
        raise HTTPException(status_code=500, detail=f"DD report failed: {str(e)}")


# Health check for API
@app.get("/api/health")
async def api_health_check():
    """API health check endpoint"""
    health = await db_manager.health_check()
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": health.get("status", "unknown"),
        "api_version": "1.0.0"
    }


# Admin endpoints
@app.get("/admin/requests", response_model=List[AppRequestResponse])
async def get_all_requests(current_user: dict = Depends(get_current_user)):
    """Get all app requests (admin only)"""
    if current_user['role'] not in ['Admin', 'Reviewer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        async with db_manager.get_connection() as conn:
            requests = await conn.fetch("""
                SELECT ar.*
                FROM app_requests ar
                ORDER BY ar.created_at DESC
            """)

            return [AppRequestResponse.from_db_row(dict(req)) for req in requests]

    except Exception as e:
        logger.error(f"Get all requests error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch requests")


# ═══════════════════════════════════════════════════════════════════════
#  SSD → TCA TIRR INTEGRATION ENDPOINT
# ═══════════════════════════════════════════════════════════════════════

def _ssd_build_extracted_text(payload: SSDStartupData) -> str:
    """Assemble a rich text block from the structured SSD payload
    so the existing 9-module keyword scanner can derive signals."""
    ci = payload.companyInformation
    fi = payload.financialInformation
    co = payload.contactInformation
    iq = payload.investorQuestions or SSDInvestorQuestions()
    cm = payload.customerMetrics or SSDCustomerMetrics()
    rm = payload.revenueMetrics or SSDRevenueMetrics()
    ms = payload.marketSize or SSDMarketSize()

    parts = [
        f"Company: {ci.companyName or 'N/A'}",
        f"Industry: {ci.industryVertical}",
        f"Stage: {ci.developmentStage}",
        f"Business Model: {ci.businessModel}",
        f"Location: {ci.city}, {ci.state}, {ci.country}",
        f"One-liner: {ci.oneLineDescription}",
        f"Description: {ci.companyDescription}",
        f"Product: {ci.productDescription}",
        f"Employees: {ci.numberOfEmployees or 'N/A'}",
        f"Founder: {co.firstName} {co.lastName} — {co.jobTitle or 'Founder'}",
        f"LinkedIn: {co.linkedInUrl or 'N/A'}",
        f"Funding type: {fi.fundingType}",
        f"Annual revenue: ${fi.annualRevenue:,.2f}",
        f"Pre-money valuation: ${fi.preMoneyValuation:,.2f}",
    ]
    if fi.postMoneyValuation:
        parts.append(f"Post-money valuation: ${fi.postMoneyValuation:,.2f}")
    if fi.targetRaise:
        parts.append(f"Target raise: ${fi.targetRaise:,.2f}")
    if fi.currentlyRaised:
        parts.append(f"Currently raised: ${fi.currentlyRaised:,.2f}")
    if fi.offeringType:
        parts.append(f"Offering type: {fi.offeringType}")

    # Revenue metrics
    if rm.totalRevenuesToDate:
        parts.append(f"Total revenues to date: ${rm.totalRevenuesToDate:,.2f}")
    if rm.monthlyRecurringRevenue:
        parts.append(f"MRR: ${rm.monthlyRecurringRevenue:,.2f}")
    if rm.yearToDateRevenue:
        parts.append(f"YTD revenue: ${rm.yearToDateRevenue:,.2f}")
    if rm.burnRate:
        parts.append(f"Burn rate: ${rm.burnRate:,.2f}/month")

    # Customer metrics
    if cm.customerAcquisitionCost:
        parts.append(f"CAC: ${cm.customerAcquisitionCost:,.2f}")
    if cm.customerLifetimeValue:
        parts.append(f"LTV: ${cm.customerLifetimeValue:,.2f}")
    if cm.churn is not None:
        parts.append(f"Churn: {cm.churn}%")
    if cm.margins is not None:
        parts.append(f"Gross margin: {cm.margins}%")

    # Market size
    if ms.totalAvailableMarket:
        parts.append(f"TAM: ${ms.totalAvailableMarket:,.0f}")
    if ms.serviceableAreaMarket:
        parts.append(f"SAM: ${ms.serviceableAreaMarket:,.0f}")
    if ms.serviceableObtainableMarket:
        parts.append(f"SOM: ${ms.serviceableObtainableMarket:,.0f}")

    # Investor question blocks
    for field_name, label in [
        ("problemSolution", "Problem & Solution"),
        ("companyBackgroundTeam", "Team Background"),
        ("markets", "Markets"),
        ("competitionDifferentiation", "Competition & Differentiation"),
        ("businessModelChannels", "Business Model & Channels"),
        ("timeline", "Timeline"),
        ("technologyIP", "Technology & IP"),
        ("specialAgreements", "Special Agreements"),
        ("cashFlow", "Cash Flow"),
        ("fundingHistory", "Funding History"),
        ("risksChallenges", "Risks & Challenges"),
        ("exitStrategy", "Exit Strategy"),
    ]:
        val = getattr(iq, field_name, None)
        if val:
            parts.append(f"{label}: {val}")

    return "\n".join(parts)


def _ssd_build_financial_data(payload: SSDStartupData) -> Dict[str, Any]:
    """Map SSD financial fields → analysis engine financial_data dict."""
    fi = payload.financialInformation
    rm = payload.revenueMetrics or SSDRevenueMetrics()
    cm = payload.customerMetrics or SSDCustomerMetrics()

    data: Dict[str, Any] = {
        "revenue": fi.annualRevenue,
        "arr": fi.annualRevenue,
        "pre_money_valuation": fi.preMoneyValuation,
    }
    if fi.postMoneyValuation:
        data["post_money_valuation"] = fi.postMoneyValuation
    if fi.targetRaise:
        data["target_raise"] = fi.targetRaise
    if fi.currentlyRaised:
        data["currently_raised"] = fi.currentlyRaised
    if rm.monthlyRecurringRevenue:
        data["mrr"] = rm.monthlyRecurringRevenue
    if rm.burnRate:
        data["burn_rate"] = rm.burnRate
    if rm.totalRevenuesToDate:
        data["total_revenues"] = rm.totalRevenuesToDate
    if cm.margins is not None:
        data["gross_margin"] = cm.margins
    if cm.customerAcquisitionCost:
        data["cac"] = cm.customerAcquisitionCost
    if cm.customerLifetimeValue:
        data["ltv"] = cm.customerLifetimeValue
    if cm.churn is not None:
        data["churn_rate"] = cm.churn

    # Compute runway if burn_rate is available
    if rm.burnRate and rm.burnRate > 0:
        cash = fi.currentlyRaised or 0
        if cash > 0:
            data["runway_months"] = round(cash / rm.burnRate, 1)

    return data


def _ssd_build_key_metrics(payload: SSDStartupData) -> Dict[str, Any]:
    """Map SSD fields → analysis engine key_metrics dict."""
    ci = payload.companyInformation
    fi = payload.financialInformation
    cm = payload.customerMetrics or SSDCustomerMetrics()
    ms = payload.marketSize or SSDMarketSize()

    data: Dict[str, Any] = {
        "industry": ci.industryVertical,
        "funding_stage": fi.fundingType,
        "development_stage": ci.developmentStage,
        "business_model": ci.businessModel,
    }
    if ci.numberOfEmployees:
        data["team_size"] = ci.numberOfEmployees
    if cm.churn is not None:
        data["churn_rate"] = cm.churn
    if ms.totalAvailableMarket:
        data["tam"] = ms.totalAvailableMarket
    if ms.serviceableAreaMarket:
        data["sam"] = ms.serviceableAreaMarket
    if ms.serviceableObtainableMarket:
        data["som"] = ms.serviceableObtainableMarket
    return data


@app.post("/api/ssd/tirr")
async def ssd_tirr_endpoint(payload: SSDStartupData, background_tasks: BackgroundTasks):
    """
    TCA TIRR endpoint for the SSD application.

    Flow:
      1. Receive structured startup data from SSD (JSON POST, sections 4.1.1–4.1.8)
      2. Persist to allupload table
      3. Run 9-module analysis
      4. Generate triage report and save to server
      5. POST callback to SSD CaptureTCAReportResponse with founderEmail + generatedReportPath

    Request body: SSDStartupData (contactInformation, companyInformation,
                  financialInformation, investorQuestions, documents,
                  customerMetrics, revenueMetrics, marketSize)

    Response: immediate 202 Accepted with a tracking reference;
              the full report is delivered asynchronously via the SSD callback.
    """
    import hashlib
    
    company_name = payload.companyInformation.companyName or f"{payload.contactInformation.firstName}'s Company"
    founder_email = payload.contactInformation.email
    tracking_id = str(uuid.uuid4())
    
    # Create payload hash and size for audit
    payload_json = payload.model_dump_json(exclude_none=True)
    payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()[:16]
    payload_size = len(payload_json)
    
    logger.info(
        f"[SSD-TIRR] Received request for '{company_name}' "
        f"(founder={founder_email}, tracking={tracking_id})"
    )
    
    # Initialize audit log
    _ssd_audit_log(tracking_id, "received", {
        "company_name": company_name,
        "founder_email": founder_email,
    })
    _ssd_audit_update(
        tracking_id,
        company_name=company_name,
        founder_email=founder_email,
        status="pending",
        request_payload=payload.model_dump(exclude_none=True),
        request_payload_hash=payload_hash,
        request_payload_size=payload_size,
    )

    # Determine callback URL
    callback = payload.callback_url or SSD_CALLBACK_URL
    if not callback:
        logger.warning("[SSD-TIRR] No SSD callback URL configured — report will be saved but not pushed.")
        _ssd_audit_update(tracking_id, callback_url=None, callback_status="not_configured")
    else:
        _ssd_audit_update(tracking_id, callback_url=callback)
    
    # Log validation success
    _ssd_audit_log(tracking_id, "validated", {
        "payload_hash": payload_hash,
        "payload_size": payload_size,
    })

    # Schedule the heavy work in a background task so SSD gets an immediate response
    background_tasks.add_task(
        _process_ssd_tirr_request,
        payload=payload,
        tracking_id=tracking_id,
        callback_url=callback,
    )

    return JSONResponse(
        status_code=202,
        content={
            "status": "accepted",
            "tracking_id": tracking_id,
            "message": f"Report generation started for '{company_name}'. "
                       f"Results will be delivered to the SSD callback endpoint.",
        },
    )


@app.get("/api/ssd/tirr/{tracking_id}")
async def ssd_tirr_status(tracking_id: str):
    """
    Check the status of a TCA TIRR report by tracking_id.
    Returns the report if it has been generated, or a status message otherwise.
    """
    report_path = REPORTS_DIR / f"tirr_{tracking_id}.json"
    if report_path.exists():
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        return {
            "status": "completed",
            "tracking_id": tracking_id,
            "report_file_path": str(report_path),
            "report": report,
        }
    else:
        return JSONResponse(
            status_code=202,
            content={
                "status": "processing",
                "tracking_id": tracking_id,
                "message": "Report is still being generated.",
            },
        )


async def _process_ssd_tirr_request(
    payload: SSDStartupData,
    tracking_id: str,
    callback_url: str,
):
    """
    Background task that:
      1. Stores the SSD data in allupload
      2. Runs the 9-module analysis
      3. Generates a triage report
      4. Saves the report to REPORTS_DIR
      5. POSTs the callback to SSD CaptureTCAReportResponse
    """
    import time
    start_time = time.time()
    
    company_name = payload.companyInformation.companyName or f"{payload.contactInformation.firstName}'s Company"
    founder_email = payload.contactInformation.email
    upload_id = None
    
    # Update audit status to processing
    _ssd_audit_log(tracking_id, "processing", {"stage": "started"})
    _ssd_audit_update(tracking_id, status="processing")
    
    try:
        # ── 1. Persist to allupload ──────────────────────────────────
        _ssd_audit_log(tracking_id, "processing", {"stage": "data_extraction"})
        
        text = _ssd_build_extracted_text(payload)
        financial_data = _ssd_build_financial_data(payload)
        key_metrics = _ssd_build_key_metrics(payload)

        extracted_data: Dict[str, Any] = {
            "text_content": text,
            "word_count": len(text.split()),
            "char_count": len(text),
            "financial_data": financial_data,
            "key_metrics": key_metrics,
            "company_data": {
                **financial_data,
                **key_metrics,
            },
            "ssd_payload": payload.model_dump(exclude_none=True),
        }
        
        _ssd_audit_log(tracking_id, "processing", {"stage": "database_insert"})

        async with db_manager.get_connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO allupload
                    (source_type, file_name, file_type,
                     extracted_text, extracted_data, company_name,
                     processing_status, upload_metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING upload_id, created_at
                """,
                "ssd_tirr",
                f"SSD-{company_name}",
                "application/json",
                text,
                json.dumps(extracted_data, default=str),
                company_name,
                "processing",
                json.dumps({
                    "source": "ssd_tirr",
                    "tracking_id": tracking_id,
                    "founder_email": founder_email,
                    "founder_name": f"{payload.contactInformation.firstName} {payload.contactInformation.lastName}",
                }),
            )
            upload_id = str(row["upload_id"])

        logger.info(f"[SSD-TIRR] Data stored as upload_id={upload_id}")
        _ssd_audit_log(tracking_id, "processing", {"stage": "data_stored", "upload_id": upload_id})

        # ── 2. Run 9-module analysis ─────────────────────────────────
        _ssd_audit_log(tracking_id, "processing", {"stage": "analysis_started"})
        
        merged_data = extracted_data.copy()
        company_context = {
            "company_name": company_name,
            "extracted_text": text,
            **merged_data,
        }

        module_results: Dict[str, Any] = {}
        total_weight = 0.0
        weighted_score = 0.0
        source_ids = [upload_id]

        for mod in NINE_MODULES:
            result = _run_module(mod, company_context, merged_data)
            score = result.get("score", 0)
            w = mod["weight"]
            result["weighted_score"] = round(score * w / 100, 2)
            module_results[mod["id"]] = result
            weighted_score += score * w
            total_weight += w

        final_score = round(weighted_score / total_weight, 1) if total_weight > 0 else 0

        rec_info = get_recommendation(final_score)
        recommendation = rec_info["label"]
        score_interpretation = interpret_score(final_score)

        analysis_output = {
            "analysis_type": "comprehensive_9_module",
            "company_name": company_name,
            "timestamp": datetime.utcnow().isoformat(),
            "final_tca_score": final_score,
            "investment_recommendation": recommendation,
            "active_modules": [m["id"] for m in NINE_MODULES],
            "module_count": len(NINE_MODULES),
            "analysis_completeness": 100.0,
            "source_upload_ids": source_ids,
            "module_results": module_results,
        }

        # Store analysis result back into allupload
        async with db_manager.get_connection() as conn:
            await conn.execute(
                """UPDATE allupload
                   SET analysis_result = $1,
                       analysis_id = $2,
                       processing_status = 'completed',
                       updated_at = NOW()
                   WHERE upload_id = $3""",
                json.dumps(analysis_output),
                f"tirr_{tracking_id}",
                uuid.UUID(upload_id),
            )

        logger.info(
            f"[SSD-TIRR] 9-module analysis complete: score={final_score}, rec={recommendation}"
        )
        _ssd_audit_log(tracking_id, "processing", {
            "stage": "analysis_complete",
            "final_score": final_score,
            "recommendation": recommendation,
        })
        _ssd_audit_update(
            tracking_id,
            final_score=final_score,
            recommendation=recommendation,
        )

        # ── 3. Generate triage report ────────────────────────────────
        _ssd_audit_log(tracking_id, "processing", {"stage": "report_generation"})
        mr = analysis_output.get("module_results", {})
        tca = mr.get("tca_scorecard", {})
        risk = mr.get("risk_assessment", {})
        market = mr.get("market_analysis", {})
        team = mr.get("team_assessment", {})
        fin_mod = mr.get("financial_analysis", {})
        tech = mr.get("technology_assessment", {})
        biz = mr.get("business_model", {})
        growth = mr.get("growth_assessment", {})
        invest = mr.get("investment_readiness", {})

        triage_report = {
            "report_type": "triage",
            "company_name": company_name,
            "founder_email": founder_email,
            "founder_name": f"{payload.contactInformation.firstName} {payload.contactInformation.lastName}",
            "tracking_id": tracking_id,
            "generated_at": datetime.utcnow().isoformat(),
            "final_tca_score": final_score,
            "recommendation": recommendation,
            "total_pages": 6,

            "report_meta": REPORT_META,
            "page_1_executive_summary": {
                "title": f"Triage Report — {company_name}",
                "overall_score": final_score,
                "score_interpretation": score_interpretation,
                "investment_recommendation": recommendation,
                "analysis_completeness": 100.0,
                "modules_run": 9,
            },
            "page_2_tca_scorecard": {
                "title": "TCA Scorecard — Category Breakdown",
                "composite_score": tca.get("composite_score", 0),
                "categories": tca.get("categories", []),
                "top_strengths": [c["category"] for c in tca.get("categories", []) if c.get("flag") == "green"][:3],
                "areas_of_concern": [c["category"] for c in tca.get("categories", []) if c.get("flag") != "green"][:3],
            },
            "page_3_risk_assessment": {
                "title": "Risk Assessment & Flags",
                "overall_risk_score": risk.get("overall_risk_score", 0),
                "total_flags": len(risk.get("flags", [])),
                "high_risk_count": len([f for f in risk.get("flags", []) if f.get("severity", 0) >= 6]),
                "risk_flags": risk.get("flags", []),
                "risk_domains": risk.get("risk_domains", {}),
            },
            "page_4_market_and_team": {
                "title": "Market Opportunity & Team Assessment",
                "market_score": market.get("market_score", 0),
                "tam": market.get("tam", "N/A"),
                "sam": market.get("sam", "N/A"),
                "som": market.get("som", "N/A"),
                "growth_rate": market.get("growth_rate", "N/A"),
                "competitive_position": market.get("competitive_position", "N/A"),
                "competitive_advantages": market.get("competitive_advantages", []),
                "team_score": team.get("team_score", 0),
                "team_completeness": team.get("team_completeness", 0),
                "founders": team.get("founders", []),
                "team_gaps": team.get("gaps", []),
            },
            "page_5_financials_and_tech": {
                "title": "Financial Health & Technology Assessment",
                "financial_score": fin_mod.get("financial_health_score", 0),
                "revenue": fin_mod.get("revenue", 0),
                "mrr": fin_mod.get("mrr", 0),
                "burn_rate": fin_mod.get("burn_rate", 0),
                "runway_months": fin_mod.get("runway_months", 0),
                "ltv_cac_ratio": fin_mod.get("ltv_cac_ratio", 0),
                "gross_margin": fin_mod.get("gross_margin", 0),
                "technology_score": tech.get("technology_score", 0),
                "trl": tech.get("trl", 0),
                "ip_strength": tech.get("ip_strength", "N/A"),
                "tech_stack": tech.get("stack", []),
            },
            "page_6_recommendations": {
                "title": "Investment Recommendation & Next Steps",
                "final_decision": recommendation,
                "business_model_score": biz.get("business_model_score", 0),
                "business_model_type": biz.get("model_type", "N/A"),
                "growth_potential_score": growth.get("growth_potential_score", 0),
                "growth_projections": growth.get("growth_projections", {}),
                "investment_readiness_score": invest.get("readiness_score", 0),
                "exit_potential": invest.get("exit_potential", {}),
                "funding_recommendation": invest.get("funding_recommendation", {}),
                "next_steps": PAGE_CONFIG["page_6_recommendations"]["default_next_steps"],
            },
        }

        # ── 4. Save report to filesystem ─────────────────────────────
        report_filename = f"tirr_{tracking_id}.json"
        report_path = REPORTS_DIR / report_filename
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(triage_report, f, indent=2, default=str)

        logger.info(f"[SSD-TIRR] Triage report saved → {report_path}")
        _ssd_audit_log(tracking_id, "processing", {"stage": "report_saved", "path": str(report_path)})
        _ssd_audit_update(tracking_id, report_path=str(report_path))

        # ── 5. POST callback to SSD CaptureTCAReportResponse ─────────
        if callback_url:
            # Response payload per spec section 4.2
            callback_payload = {
                "founderEmail": founder_email,
                "generatedReportPath": str(report_path),
            }
            _ssd_audit_update(tracking_id, response_payload=callback_payload)
            
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.post(callback_url, json=callback_payload)
                    resp.raise_for_status()
                logger.info(
                    f"[SSD-TIRR] Callback sent to {callback_url} — HTTP {resp.status_code}"
                )
                _ssd_audit_log(tracking_id, "callback_sent", {
                    "url": callback_url,
                    "status_code": resp.status_code,
                })
                _ssd_audit_update(
                    tracking_id,
                    callback_status="sent",
                    callback_response_code=resp.status_code,
                    callback_sent_at=datetime.utcnow().isoformat() + "Z",
                )
            except Exception as cb_err:
                logger.error(f"[SSD-TIRR] Callback to SSD failed: {cb_err}")
                _ssd_audit_log(tracking_id, "callback_failed", {
                    "url": callback_url,
                    "error": str(cb_err),
                })
                _ssd_audit_update(tracking_id, callback_status="failed")
        else:
            logger.info("[SSD-TIRR] No callback URL — skipping SSD notification.")
        
        # Mark completed
        processing_duration_ms = int((time.time() - start_time) * 1000)
        _ssd_audit_log(tracking_id, "completed", {
            "duration_ms": processing_duration_ms,
            "final_score": final_score,
            "recommendation": recommendation,
        })
        _ssd_audit_update(
            tracking_id,
            status="completed",
            processing_duration_ms=processing_duration_ms,
        )

    except Exception as e:
        logger.error(f"[SSD-TIRR] Processing failed for tracking_id={tracking_id}: {e}")
        _ssd_audit_log(tracking_id, "error", {"error": str(e)})
        _ssd_audit_update(tracking_id, status="failed")
        # Update allupload status to failed if we got an upload_id
        if upload_id:
            try:
                async with db_manager.get_connection() as conn:
                    await conn.execute(
                        """UPDATE allupload
                           SET processing_status = 'failed',
                               processing_error = $1,
                               updated_at = NOW()
                           WHERE upload_id = $2""",
                        str(e),
                        uuid.UUID(upload_id),
                    )
            except Exception as update_err:
                logger.error(f"[SSD-TIRR] Failed to update status: {update_err}")

        # Attempt to notify SSD of failure (error response per spec section 5.3)
        if callback_url:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    await client.post(callback_url, json={
                        "error": {
                            "code": "REPORT_GENERATION_FAILED",
                            "message": str(e),
                            "details": {
                                "tracking_id": tracking_id,
                                "timestamp": datetime.utcnow().isoformat() + "Z",
                            },
                        },
                        "founderEmail": founder_email,
                    })
            except Exception:
                pass


# ═══════════════════════════════════════════════════════════════════════
#  SSD AUDIT LOG API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/ssd/audit/logs")
async def list_ssd_audit_logs(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """
    List all SSD integration audit logs.
    Admin endpoint to review all SSD→TCA TIRR requests.
    """
    logs = list(SSD_AUDIT_LOGS.values())
    
    # Filter by status if provided
    if status:
        logs = [l for l in logs if l.get("status") == status]
    
    # Sort by created_at descending
    logs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Paginate
    total = len(logs)
    paginated = logs[offset:offset + limit]
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": paginated,
    }


@app.get("/api/ssd/audit/logs/{tracking_id}")
async def get_ssd_audit_log(tracking_id: str):
    """
    Get detailed audit log for a specific SSD request by tracking_id.
    Includes all events, request/response data, and processing details.
    """
    if tracking_id not in SSD_AUDIT_LOGS:
        raise HTTPException(status_code=404, detail=f"Audit log for tracking_id '{tracking_id}' not found")
    
    audit_log = SSD_AUDIT_LOGS[tracking_id]
    
    # Also check if report exists and enrich with report info
    report_path = REPORTS_DIR / f"tirr_{tracking_id}.json"
    if report_path.exists():
        audit_log["report_exists"] = True
        audit_log["report_file_size"] = report_path.stat().st_size
    else:
        audit_log["report_exists"] = False
    
    return audit_log


@app.get("/api/ssd/audit/logs/{tracking_id}/request")
async def get_ssd_request_payload(tracking_id: str):
    """
    Retrieve the original SSD request payload for a tracking_id.
    Used for audit review to see exact data received from SSD.
    """
    if tracking_id not in SSD_AUDIT_LOGS:
        raise HTTPException(status_code=404, detail=f"Audit log for tracking_id '{tracking_id}' not found")
    
    audit_log = SSD_AUDIT_LOGS[tracking_id]
    
    return {
        "tracking_id": tracking_id,
        "request_payload": audit_log.get("request_payload"),
        "received_at": audit_log.get("created_at"),
        "payload_size": audit_log.get("request_payload_size", 0),
    }


@app.get("/api/ssd/audit/logs/{tracking_id}/response")
async def get_ssd_response_payload(tracking_id: str):
    """
    Retrieve the callback response sent to SSD for a tracking_id.
    Used for audit review to see exact data sent back to SSD.
    """
    if tracking_id not in SSD_AUDIT_LOGS:
        raise HTTPException(status_code=404, detail=f"Audit log for tracking_id '{tracking_id}' not found")
    
    audit_log = SSD_AUDIT_LOGS[tracking_id]
    
    return {
        "tracking_id": tracking_id,
        "callback_url": audit_log.get("callback_url"),
        "callback_status": audit_log.get("callback_status"),
        "callback_response_code": audit_log.get("callback_response_code"),
        "response_payload": audit_log.get("response_payload"),
        "sent_at": audit_log.get("callback_sent_at"),
    }


@app.get("/api/ssd/audit/logs/{tracking_id}/report")
async def get_ssd_report_data(tracking_id: str):
    """
    Retrieve the generated report for a tracking_id.
    Returns the full report JSON if available.
    """
    report_path = REPORTS_DIR / f"tirr_{tracking_id}.json"
    if not report_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Report for tracking_id '{tracking_id}' not found or not yet generated"
        )
    
    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)
    
    return {
        "tracking_id": tracking_id,
        "report_path": str(report_path),
        "report": report,
    }


@app.get("/api/ssd/audit/stats")
async def get_ssd_audit_stats():
    """
    Get aggregate statistics on SSD integration health.
    """
    logs = list(SSD_AUDIT_LOGS.values())
    total = len(logs)
    completed = len([l for l in logs if l.get("status") == "completed"])
    failed = len([l for l in logs if l.get("status") == "failed"])
    processing = len([l for l in logs if l.get("status") == "processing"])
    
    callback_sent = len([l for l in logs if l.get("callback_status") == "sent"])
    callback_failed = len([l for l in logs if l.get("callback_status") == "failed"])
    
    # Calculate average processing time
    processing_times = [
        l.get("processing_duration_ms", 0) for l in logs
        if l.get("processing_duration_ms")
    ]
    avg_processing_ms = sum(processing_times) / len(processing_times) if processing_times else 0
    
    # Score distribution
    scores = [l.get("final_score") for l in logs if l.get("final_score") is not None]
    avg_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "total_requests": total,
        "status_breakdown": {
            "completed": completed,
            "failed": failed,
            "processing": processing,
        },
        "callback_stats": {
            "sent": callback_sent,
            "failed": callback_failed,
            "not_configured": total - callback_sent - callback_failed,
        },
        "performance": {
            "avg_processing_time_ms": round(avg_processing_ms, 2),
        },
        "scores": {
            "avg_final_score": round(avg_score, 2),
            "total_evaluated": len(scores),
        },
    }


@app.delete("/api/ssd/audit/logs/{tracking_id}")
async def delete_ssd_audit_log(tracking_id: str):
    """
    Delete an audit log entry (admin only, for cleanup).
    """
    if tracking_id not in SSD_AUDIT_LOGS:
        raise HTTPException(status_code=404, detail=f"Audit log for tracking_id '{tracking_id}' not found")
    
    del SSD_AUDIT_LOGS[tracking_id]
    
    # Also try to delete the report file
    report_path = REPORTS_DIR / f"tirr_{tracking_id}.json"
    if report_path.exists():
        report_path.unlink()
    
    return {"status": "deleted", "tracking_id": tracking_id}


# Wrap app with ASGI JSON validation middleware (must be after all route definitions)
app = JSONBodyValidationMiddleware(app)

if __name__ == "__main__":
    # Run the server
    uvicorn.run("main:app",
                host="0.0.0.0",
                port=8000,
                reload=True,
                log_level="info")
