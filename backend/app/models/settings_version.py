"""
Settings Version Models for Module Configuration
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class ModuleId(str, Enum):
    """Module identifiers for the 9 core modules"""
    TCA = "tca"
    RISK = "risk"
    MACRO = "macro"
    BENCHMARK = "benchmark"
    GROWTH = "growth"
    GAP = "gap"
    FOUNDER_FIT = "founderFit"
    TEAM = "team"
    STRATEGIC_FIT = "strategicFit"


class TCACategory(BaseModel):
    """TCA Category configuration (12 categories) with dual framework weights"""
    id: Optional[int] = None
    category_name: str = Field(..., description="Category name")
    category_order: int = Field(..., ge=1, le=13, description="Display order (1-13)")
    weight: float = Field(default=8.33, ge=0, le=100, description="General framework weight percentage")
    medtech_weight: float = Field(default=8.33, ge=0, le=100, description="MedTech framework weight percentage")
    is_active: bool = Field(default=True, description="Whether category is active for General")
    is_medtech_active: bool = Field(default=True, description="Whether category is active for MedTech")
    normalization_key: Optional[str] = Field(None, description="Key for frontend normalization mapping")
    description: Optional[str] = Field(None, description="Category description")
    factors: List[str] = Field(default_factory=list, description="Scoring factors")


class ModuleSetting(BaseModel):
    """Individual module settings"""
    id: Optional[int] = None
    module_id: ModuleId = Field(..., description="Module identifier")
    module_name: str = Field(..., description="Display name")
    weight: float = Field(default=10.0, ge=0, le=100, description="Weight percentage")
    is_enabled: bool = Field(default=True, description="Whether module is enabled")
    priority: int = Field(default=1, ge=1, le=9, description="Execution priority")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Module-specific settings")
    thresholds: Dict[str, float] = Field(default_factory=dict, description="Score thresholds")


class SettingsVersion(BaseModel):
    """Settings version for module configuration"""
    id: Optional[int] = None
    version_number: int = Field(..., description="Version number")
    version_name: str = Field(..., description="Human-readable version name")
    description: Optional[str] = Field(None, description="Version description")
    created_by: Optional[int] = Field(None, description="User ID who created this version")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=False, description="Whether this is the active version")
    is_archived: bool = Field(default=False, description="Whether version is archived")
    
    # Related settings
    module_settings: List[ModuleSetting] = Field(default_factory=list)
    tca_categories: List[TCACategory] = Field(default_factory=list)


class SettingsVersionCreate(BaseModel):
    """Create new settings version"""
    version_name: str = Field(..., description="Version name")
    description: Optional[str] = Field(None, description="Version description")
    copy_from_version: Optional[int] = Field(None, description="Version ID to copy settings from")


class SettingsVersionUpdate(BaseModel):
    """Update settings version"""
    version_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_archived: Optional[bool] = None


class ModuleSettingUpdate(BaseModel):
    """Update module setting"""
    weight: Optional[float] = Field(None, ge=0, le=100)
    is_enabled: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1, le=9)
    settings: Optional[Dict[str, Any]] = None
    thresholds: Optional[Dict[str, float]] = None


class TCACategoryUpdate(BaseModel):
    """Update TCA category setting"""
    weight: Optional[float] = Field(None, ge=0, le=100, description="General framework weight")
    medtech_weight: Optional[float] = Field(None, ge=0, le=100, description="MedTech framework weight")
    is_active: Optional[bool] = None
    is_medtech_active: Optional[bool] = None
    description: Optional[str] = None
    factors: Optional[List[str]] = None


class SimulationRun(BaseModel):
    """Simulation run using specific settings version"""
    id: Optional[int] = None
    settings_version_id: int = Field(..., description="Settings version used")
    user_id: Optional[int] = Field(None, description="User who ran simulation")
    company_name: Optional[str] = Field(None, description="Company analyzed")
    analysis_id: Optional[int] = Field(None, description="Related analysis ID")
    
    # Results
    tca_score: Optional[float] = Field(None, description="TCA score (primary outcome)")
    module_scores: Dict[str, float] = Field(default_factory=dict, description="Individual module scores")
    simulation_data: Dict[str, Any] = Field(default_factory=dict, description="Full simulation data")
    
    # Metadata
    run_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: str = Field(default="pending", description="Run status")


class SimulationRunCreate(BaseModel):
    """Create simulation run"""
    settings_version_id: int = Field(..., description="Settings version to use")
    company_name: Optional[str] = None
    analysis_id: Optional[int] = None
    adjusted_scores: Optional[Dict[str, Any]] = Field(None, description="User-adjusted scores")


class SimulationResult(BaseModel):
    """Result of a simulation run"""
    simulation_id: int
    tca_score: float = Field(..., description="TCA score (primary outcome from 12 categories)")
    module_scores: Dict[str, float] = Field(..., description="Individual module scores calculated separately")
    settings_version: SettingsVersion
    timestamp: datetime
    status: str


# Default settings for initial setup - Dual framework weights (General + MedTech)
DEFAULT_TCA_CATEGORIES = [
    TCACategory(category_name="Leadership", category_order=1, weight=20.0, medtech_weight=15.0, normalization_key="leadership", description="Founder experience and leadership track record", factors=["founder_experience", "leadership_track_record"]),
    TCACategory(category_name="Product-Market Fit", category_order=2, weight=20.0, medtech_weight=15.0, normalization_key="pmf", description="Market validation, customer feedback, and product traction", factors=["market_validation", "customer_feedback", "product_traction"]),
    TCACategory(category_name="Team Strength", category_order=3, weight=10.0, medtech_weight=10.0, normalization_key="team", description="Team experience, technical skills, and domain expertise", factors=["team_experience", "technical_skills", "domain_expertise"]),
    TCACategory(category_name="Technology & IP", category_order=4, weight=10.0, medtech_weight=10.0, normalization_key="tech", description="Tech innovation, IP portfolio, and technical moat", factors=["tech_innovation", "ip_portfolio", "technical_moat"]),
    TCACategory(category_name="Business Model & Financials", category_order=5, weight=10.0, medtech_weight=10.0, normalization_key="financials", description="Revenue model, financial metrics, and burn rate", factors=["revenue_model", "financial_metrics", "burn_rate"]),
    TCACategory(category_name="Go-to-Market Strategy", category_order=6, weight=10.0, medtech_weight=5.0, normalization_key="gtm", description="Sales strategy, marketing approach, and customer acquisition", factors=["sales_strategy", "marketing_approach", "customer_acquisition"]),
    TCACategory(category_name="Competition & Moat", category_order=7, weight=5.0, medtech_weight=5.0, normalization_key="competition", description="Competitive advantage and market differentiation", factors=["competitive_advantage", "market_differentiation"]),
    TCACategory(category_name="Market Potential", category_order=8, weight=5.0, medtech_weight=5.0, normalization_key="market", description="Market size, growth rate, and market timing", factors=["market_size", "growth_rate", "market_timing"]),
    TCACategory(category_name="Traction", category_order=9, weight=5.0, medtech_weight=5.0, normalization_key="traction", description="Customer growth, revenue growth, and partnerships", factors=["customer_growth", "revenue_growth", "partnerships"]),
    TCACategory(category_name="Scalability", category_order=10, weight=2.5, medtech_weight=0.0, is_medtech_active=False, normalization_key="scalability", description="Technical and business scalability", factors=["technical_scalability", "business_scalability"]),
    TCACategory(category_name="Risk Assessment", category_order=11, weight=2.5, medtech_weight=0.0, is_medtech_active=False, normalization_key="risk", description="Identified risks and mitigation strategies", factors=["identified_risks", "mitigation_strategies"]),
    TCACategory(category_name="Regulatory", category_order=12, weight=0.0, medtech_weight=15.0, is_active=False, normalization_key="regulatory", description="Regulatory compliance and approval pathway", factors=["regulatory_pathway", "fda_approval", "compliance_status"]),
    TCACategory(category_name="Exit Potential", category_order=13, weight=0.0, medtech_weight=0.0, is_active=False, is_medtech_active=False, normalization_key="exit", description="Acquisition targets and IPO potential", factors=["acquisition_targets", "ipo_potential"]),
]

DEFAULT_MODULE_SETTINGS = [
    ModuleSetting(module_id=ModuleId.TCA, module_name="TCA Scorecard", weight=20.0, priority=1),
    ModuleSetting(module_id=ModuleId.RISK, module_name="Risk Assessment", weight=15.0, priority=2),
    ModuleSetting(module_id=ModuleId.MACRO, module_name="Macro Trend Analysis", weight=10.0, priority=3),
    ModuleSetting(module_id=ModuleId.BENCHMARK, module_name="Benchmark Comparison", weight=10.0, priority=4),
    ModuleSetting(module_id=ModuleId.GROWTH, module_name="Growth Classification", weight=10.0, priority=5),
    ModuleSetting(module_id=ModuleId.GAP, module_name="Gap Analysis", weight=10.0, priority=6),
    ModuleSetting(module_id=ModuleId.FOUNDER_FIT, module_name="Founder Fit Analysis", weight=10.0, priority=7),
    ModuleSetting(module_id=ModuleId.TEAM, module_name="Team Assessment", weight=10.0, priority=8),
    ModuleSetting(module_id=ModuleId.STRATEGIC_FIT, module_name="Strategic Fit Matrix", weight=5.0, priority=9),
]
