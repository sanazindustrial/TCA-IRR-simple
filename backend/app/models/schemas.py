"""
Pydantic models for API request/response validation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum


# Configure Pydantic to serialize datetime as ISO format strings
class BaseModelWithDatetime(BaseModel):
    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()})


class UserRole(str, Enum):
    """User roles in the system"""
    USER = "user"
    ADMIN = "admin"
    REVIEWER = "reviewer"
    ANALYST = "analyst"


class CompanyStage(str, Enum):
    """Company development stages"""
    IDEA = "idea"
    MVP = "mvp"
    EARLY_STAGE = "early_stage"
    GROWTH = "growth"
    MATURE = "mature"
    SCALE_UP = "scale_up"


class InvestmentType(str, Enum):
    """Types of investment"""
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    SERIES_C = "series_c"
    BRIDGE = "bridge"
    GROWTH = "growth"
    DEBT = "debt"


class AnalysisStatus(str, Enum):
    """Analysis processing status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Base Models
class BaseResponse(BaseModelWithDatetime):
    """Base response model"""
    success: bool = True
    message: str = "Operation successful"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseResponse):
    """Error response model"""
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


# User Models
class UserBase(BaseModel):
    """Base user model"""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    full_name: Optional[str] = Field(None, max_length=100)
    role: UserRole = UserRole.USER
    is_active: bool = True


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        password = info.data.get('password')
        if password and v != password:
            raise ValueError('Passwords do not match')
        return v


class UserUpdate(BaseModel):
    """User update model"""
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """User response model"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User login model"""
    username: str
    password: str


class Token(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None


# Company Models
class CompanyBase(BaseModel):
    """Base company model"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    website: Optional[str] = None
    industry: Optional[str] = Field(None, max_length=100)
    stage: Optional[CompanyStage] = None
    location: Optional[str] = Field(None, max_length=100)
    founded_year: Optional[int] = Field(None, ge=1800, le=2030)
    employee_count: Optional[int] = Field(None, ge=0)


class CompanyCreate(CompanyBase):
    """Company creation model"""
    pass


class CompanyUpdate(BaseModel):
    """Company update model"""
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[CompanyStage] = None
    location: Optional[str] = None
    founded_year: Optional[int] = None
    employee_count: Optional[int] = None


class CompanyResponse(CompanyBase):
    """Company response model"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int

    class Config:
        from_attributes = True


# Analysis Models
class AnalysisBase(BaseModel):
    """Base analysis model"""
    company_id: int
    analysis_type: str = Field(..., max_length=50)
    parameters: Optional[Dict[str, Any]] = None


class AnalysisCreate(AnalysisBase):
    """Analysis creation model"""
    pass


class AnalysisUpdate(BaseModel):
    """Analysis update model"""
    status: Optional[AnalysisStatus] = None
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class AnalysisResponse(AnalysisBase):
    """Analysis response model"""
    id: int
    status: AnalysisStatus
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: int

    class Config:
        from_attributes = True


# Investment Models
class InvestmentBase(BaseModel):
    """Base investment model"""
    company_id: int
    investment_type: InvestmentType
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    valuation: Optional[float] = Field(None, gt=0)
    investor_name: Optional[str] = Field(None, max_length=200)


class InvestmentCreate(InvestmentBase):
    """Investment creation model"""
    pass


class InvestmentUpdate(BaseModel):
    """Investment update model"""
    amount: Optional[float] = None
    valuation: Optional[float] = None
    investor_name: Optional[str] = None


class InvestmentResponse(InvestmentBase):
    """Investment response model"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# TCA Specific Models
class TCAScorecard(BaseModel):
    """TCA scorecard results"""
    overall_score: float = Field(..., ge=0, le=100)
    technology_score: float = Field(..., ge=0, le=100)
    market_score: float = Field(..., ge=0, le=100)
    team_score: float = Field(..., ge=0, le=100)
    financial_score: float = Field(..., ge=0, le=100)
    risk_score: float = Field(..., ge=0, le=100)
    recommendation: str
    confidence_level: float = Field(..., ge=0, le=100)
    key_insights: List[str] = []
    risk_factors: List[str] = []
    mitigation_strategies: List[str] = []


class BenchmarkComparison(BaseModel):
    """Benchmark comparison results"""
    company_metrics: Dict[str, float]
    industry_averages: Dict[str, float]
    percentile_rankings: Dict[str, float]
    competitive_position: str
    key_differentiators: List[str]
    improvement_areas: List[str]


class RiskAssessment(BaseModel):
    """Risk assessment results"""
    risk_level: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    risk_score: float = Field(..., ge=0, le=100)
    risk_categories: Dict[str, float]
    major_risks: List[Dict[str, Any]]
    mitigation_plan: List[Dict[str, Any]]
    monitoring_metrics: List[str]


class FounderAnalysis(BaseModel):
    """Founder fit analysis"""
    founder_score: float = Field(..., ge=0, le=100)
    experience_rating: str
    track_record: Dict[str, Any]
    leadership_assessment: Dict[str, float]
    team_dynamics: Dict[str, Any]
    recommendations: List[str]


# Health Check Models
class HealthCheck(BaseModel):
    """System health check response"""
    status: str = Field(..., pattern="^(healthy|degraded|unhealthy)$")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str
    environment: str
    database: Dict[str, Any]
    ai_service: Dict[str, Any]
    external_apis: Dict[str, Any]


# Pagination Models
class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")


class PaginatedResponse(BaseModelWithDatetime):
    """Paginated response wrapper"""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_previous: bool