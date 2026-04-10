"""
Module Configuration Models
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class ModuleStatus(str, Enum):
    """Module activation status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"


class ModuleCategory(str, Enum):
    """Module category types"""
    CORE = "core"
    ANALYSIS = "analysis"
    STRATEGIC = "strategic"
    COMPLIANCE = "compliance"


class DataSourceType(str, Enum):
    """Types of data sources for modules"""
    UPLOADED_FILES = "uploaded_files"
    EXTERNAL_APIS = "external_apis"
    USER_INPUT = "user_input"
    DATABASE = "database"
    CALCULATED = "calculated"


class DataMappingRule(BaseModel):
    """Rules for mapping uploaded data to module inputs"""
    source_field: str = Field(..., description="Field name in uploaded data")
    target_field: str = Field(
        ..., description="Target field in module configuration")
    data_type: str = Field(default="string", description="Expected data type")
    required: bool = Field(default=False,
                           description="Whether field is required")
    default_value: Any = Field(default=None,
                               description="Default value if field missing")
    transformation: Optional[str] = Field(
        default=None, description="Data transformation rule")


class ModuleConfiguration(BaseModel):
    """Individual module configuration"""
    module_id: str = Field(..., description="Unique module identifier")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Module description")
    category: ModuleCategory = Field(..., description="Module category")
    status: ModuleStatus = Field(default=ModuleStatus.ACTIVE,
                                 description="Module status")
    weight: float = Field(default=1.0,
                          ge=0.0,
                          le=5.0,
                          description="Analysis weight")
    priority: int = Field(default=1,
                          ge=1,
                          le=10,
                          description="Execution priority")

    # Data mapping configuration
    data_sources: List[DataSourceType] = Field(
        default_factory=list, description="Required data sources")
    data_mapping: List[DataMappingRule] = Field(
        default_factory=list, description="Data mapping rules")

    # Module-specific settings
    settings: Dict[str,
                   Any] = Field(default_factory=dict,
                                description="Module-specific configuration")
    thresholds: Dict[str, float] = Field(default_factory=dict,
                                         description="Analysis thresholds")

    # Output configuration
    output_fields: List[str] = Field(default_factory=list,
                                     description="Expected output fields")
    requires_ai: bool = Field(default=False,
                              description="Whether module requires AI service")


class NineCoreAnalysisModules(BaseModel):
    """Configuration for 9 core analysis modules"""

    # Module 1: TCA Scorecard (Core Assessment)
    tca_scorecard: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="tca_scorecard",
            name="TCA Scorecard",
            description=
            "Technology Commercialization Assessment with weighted scoring",
            category=ModuleCategory.CORE,
            status=ModuleStatus.ACTIVE,
            weight=3.0,
            priority=1,
            data_sources=[
                DataSourceType.UPLOADED_FILES, DataSourceType.USER_INPUT,
                DataSourceType.CALCULATED
            ],
            data_mapping=[
                DataMappingRule(source_field="company_name",
                                target_field="company.name",
                                required=True),
                DataMappingRule(source_field="industry",
                                target_field="company.industry",
                                required=True),
                DataMappingRule(source_field="funding_stage",
                                target_field="company.stage",
                                required=False,
                                default_value="seed"),
                DataMappingRule(source_field="revenue",
                                target_field="financials.revenue",
                                data_type="float"),
                DataMappingRule(source_field="team_size",
                                target_field="team.size",
                                data_type="int"),
            ],
            settings={
                "categories": [
                    "market_potential", "technology_innovation",
                    "team_capability", "business_model", "financial_health"
                ],
                "scoring_method":
                "weighted_average",
                "include_benchmarking":
                True
            },
            thresholds={
                "excellent": 8.5,
                "good": 7.0,
                "acceptable": 5.5
            },
            output_fields=
            ["overall_score", "category_scores", "recommendation"],
            requires_ai=True))

    # Module 2: Risk Assessment & Flags
    risk_assessment: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="risk_assessment",
            name="Risk Assessment & Flags",
            description="Comprehensive risk analysis across multiple domains",
            category=ModuleCategory.ANALYSIS,
            status=ModuleStatus.ACTIVE,
            weight=2.5,
            priority=2,
            data_sources=[
                DataSourceType.UPLOADED_FILES, DataSourceType.EXTERNAL_APIS,
                DataSourceType.CALCULATED
            ],
            data_mapping=[
                DataMappingRule(source_field="market_data",
                                target_field="market.competitive_landscape"),
                DataMappingRule(source_field="technology_stack",
                                target_field="technology.stack"),
                DataMappingRule(source_field="regulatory_status",
                                target_field="compliance.regulatory"),
                DataMappingRule(source_field="financial_statements",
                                target_field="financials.statements"),
            ],
            settings={
                "risk_domains": [
                    "market_risk", "technology_risk", "team_risk",
                    "financial_risk", "regulatory_risk", "competitive_risk",
                    "execution_risk"
                ],
                "severity_levels": ["low", "medium", "high", "critical"],
                "auto_mitigation":
                True
            },
            thresholds={
                "critical": 8.0,
                "high": 6.0,
                "medium": 4.0
            },
            output_fields=
            ["overall_risk_score", "risk_flags", "mitigation_strategies"],
            requires_ai=True))

    # Module 3: Market & Competition Analysis
    market_analysis: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="market_analysis",
            name="Market & Competition Analysis",
            description=
            "Market opportunity and competitive positioning assessment",
            category=ModuleCategory.ANALYSIS,
            status=ModuleStatus.ACTIVE,
            weight=2.0,
            priority=3,
            data_sources=[
                DataSourceType.UPLOADED_FILES, DataSourceType.EXTERNAL_APIS,
                DataSourceType.DATABASE
            ],
            data_mapping=[
                DataMappingRule(source_field="target_market",
                                target_field="market.target"),
                DataMappingRule(source_field="market_size",
                                target_field="market.size",
                                data_type="float"),
                DataMappingRule(source_field="competitors",
                                target_field="market.competitors"),
                DataMappingRule(source_field="market_trends",
                                target_field="market.trends"),
            ],
            settings={
                "analysis_dimensions": [
                    "market_size", "growth_rate", "competitive_intensity",
                    "barriers_to_entry"
                ],
                "competitive_factors": [
                    "product_features", "pricing", "distribution",
                    "brand_strength"
                ],
                "include_tam_sam_som":
                True
            },
            thresholds={
                "strong_opportunity": 8.0,
                "moderate_opportunity": 6.0,
                "limited_opportunity": 4.0
            },
            output_fields=
            ["market_score", "competitive_position", "market_opportunity"],
            requires_ai=True))

    # Module 4: Team & Leadership Assessment
    team_assessment: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="team_assessment",
            name="Team & Leadership Assessment",
            description=
            "Founding team and organizational capabilities evaluation",
            category=ModuleCategory.STRATEGIC,
            status=ModuleStatus.ACTIVE,
            weight=2.0,
            priority=4,
            data_sources=
            [DataSourceType.UPLOADED_FILES, DataSourceType.USER_INPUT],
            data_mapping=[
                DataMappingRule(source_field="founders",
                                target_field="team.founders"),
                DataMappingRule(source_field="key_personnel",
                                target_field="team.key_personnel"),
                DataMappingRule(source_field="advisors",
                                target_field="team.advisors"),
                DataMappingRule(source_field="organizational_chart",
                                target_field="team.structure"),
            ],
            settings={
                "assessment_criteria": [
                    "experience", "track_record", "domain_expertise",
                    "leadership_skills", "team_completeness", "cultural_fit",
                    "commitment"
                ],
                "weight_distribution": {
                    "founders": 0.4,
                    "key_personnel": 0.3,
                    "advisors": 0.2,
                    "culture": 0.1
                }
            },
            thresholds={
                "exceptional": 9.0,
                "strong": 7.5,
                "adequate": 6.0
            },
            output_fields=
            ["team_score", "strengths", "gaps", "recommendations"],
            requires_ai=True))

    # Module 5: Financial Health & Projections
    financial_analysis: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="financial_analysis",
            name="Financial Health & Projections",
            description="Financial performance and sustainability analysis",
            category=ModuleCategory.ANALYSIS,
            status=ModuleStatus.ACTIVE,
            weight=2.0,
            priority=5,
            data_sources=
            [DataSourceType.UPLOADED_FILES, DataSourceType.CALCULATED],
            data_mapping=[
                DataMappingRule(source_field="revenue",
                                target_field="financials.revenue",
                                data_type="float"),
                DataMappingRule(source_field="expenses",
                                target_field="financials.expenses",
                                data_type="float"),
                DataMappingRule(source_field="burn_rate",
                                target_field="financials.burn_rate",
                                data_type="float"),
                DataMappingRule(source_field="runway_months",
                                target_field="financials.runway",
                                data_type="int"),
                DataMappingRule(source_field="funding_history",
                                target_field="financials.funding_history"),
            ],
            settings={
                "metrics": [
                    "revenue_growth", "burn_multiple", "ltv_cac",
                    "gross_margins", "unit_economics"
                ],
                "projection_periods": [12, 24, 36],  # months
                "benchmarking":
                True
            },
            thresholds={
                "healthy": 8.0,
                "sustainable": 6.0,
                "concerning": 4.0
            },
            output_fields=[
                "financial_score", "key_metrics", "projections",
                "runway_analysis"
            ],
            requires_ai=False))

    # Module 6: Technology & IP Assessment
    technology_assessment: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="technology_assessment",
            name="Technology & IP Assessment",
            description=
            "Technology stack and intellectual property evaluation",
            category=ModuleCategory.ANALYSIS,
            status=ModuleStatus.ACTIVE,
            weight=1.5,
            priority=6,
            data_sources=
            [DataSourceType.UPLOADED_FILES, DataSourceType.USER_INPUT],
            data_mapping=[
                DataMappingRule(source_field="technology_stack",
                                target_field="technology.stack"),
                DataMappingRule(source_field="patents",
                                target_field="ip.patents"),
                DataMappingRule(source_field="trade_secrets",
                                target_field="ip.trade_secrets"),
                DataMappingRule(source_field="development_stage",
                                target_field="technology.development_stage"),
            ],
            settings={
                "assessment_areas": [
                    "innovation_level", "technical_feasibility", "scalability",
                    "ip_strength"
                ],
                "ip_types":
                ["patents", "trademarks", "copyrights", "trade_secrets"],
                "technology_readiness_levels":
                list(range(1, 10))
            },
            thresholds={
                "breakthrough": 9.0,
                "innovative": 7.0,
                "standard": 5.0
            },
            output_fields=[
                "technology_score", "ip_strength", "development_risks",
                "competitive_advantages"
            ],
            requires_ai=True))

    # Module 7: Business Model & Strategy
    business_model: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="business_model",
            name="Business Model & Strategy",
            description="Business model viability and strategic positioning",
            category=ModuleCategory.STRATEGIC,
            status=ModuleStatus.ACTIVE,
            weight=1.5,
            priority=7,
            data_sources=
            [DataSourceType.UPLOADED_FILES, DataSourceType.USER_INPUT],
            data_mapping=[
                DataMappingRule(source_field="revenue_model",
                                target_field="business_model.revenue_model"),
                DataMappingRule(source_field="value_proposition",
                                target_field="business_model.value_proposition"
                                ),
                DataMappingRule(source_field="customer_segments",
                                target_field="business_model.customer_segments"
                                ),
                DataMappingRule(source_field="distribution_channels",
                                target_field="business_model.channels"),
            ],
            settings={
                "model_types": [
                    "subscription", "freemium", "marketplace", "licensing",
                    "direct_sales"
                ],
                "strategy_frameworks":
                ["porter_five_forces", "swot", "business_model_canvas"],
                "validation_criteria":
                ["customer_validation", "market_traction", "revenue_proof"]
            },
            thresholds={
                "proven": 8.5,
                "promising": 6.5,
                "experimental": 4.0
            },
            output_fields=[
                "model_score", "strategic_fit", "scalability_assessment",
                "recommendations"
            ],
            requires_ai=True))

    # Module 8: Growth Potential & Scalability
    growth_assessment: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="growth_assessment",
            name="Growth Potential & Scalability",
            description="Growth trajectory and scalability evaluation",
            category=ModuleCategory.ANALYSIS,
            status=ModuleStatus.ACTIVE,
            weight=1.5,
            priority=8,
            data_sources=[
                DataSourceType.UPLOADED_FILES, DataSourceType.CALCULATED,
                DataSourceType.EXTERNAL_APIS
            ],
            data_mapping=[
                DataMappingRule(source_field="growth_metrics",
                                target_field="growth.metrics"),
                DataMappingRule(source_field="customer_acquisition",
                                target_field="growth.customer_acquisition"),
                DataMappingRule(source_field="market_expansion",
                                target_field="growth.market_expansion"),
                DataMappingRule(source_field="product_roadmap",
                                target_field="growth.product_roadmap"),
            ],
            settings={
                "growth_dimensions": [
                    "customer_growth", "revenue_growth", "market_expansion",
                    "product_evolution"
                ],
                "scalability_factors":
                ["operational", "technical", "financial", "organizational"],
                "growth_stages": ["startup", "growth", "maturity", "scale"]
            },
            thresholds={
                "high_growth": 8.0,
                "moderate_growth": 6.0,
                "limited_growth": 4.0
            },
            output_fields=[
                "growth_score", "scalability_index", "growth_projections",
                "bottlenecks"
            ],
            requires_ai=True))

    # Module 9: Investment Readiness & Exit Potential
    investment_readiness: ModuleConfiguration = Field(
        default_factory=lambda: ModuleConfiguration(
            module_id="investment_readiness",
            name="Investment Readiness & Exit Potential",
            description=
            "Investment attractiveness and exit strategy assessment",
            category=ModuleCategory.STRATEGIC,
            status=ModuleStatus.ACTIVE,
            weight=2.0,
            priority=9,
            data_sources=[
                DataSourceType.UPLOADED_FILES, DataSourceType.CALCULATED,
                DataSourceType.DATABASE
            ],
            data_mapping=[
                DataMappingRule(source_field="funding_requirements",
                                target_field="investment.funding_requirements"
                                ),
                DataMappingRule(source_field="use_of_funds",
                                target_field="investment.use_of_funds"),
                DataMappingRule(source_field="exit_strategy",
                                target_field="investment.exit_strategy"),
                DataMappingRule(source_field="comparable_exits",
                                target_field="investment.comparables"),
            ],
            settings={
                "readiness_criteria": [
                    "team_completeness", "market_validation",
                    "financial_projections", "legal_structure",
                    "ip_protection", "scalability_proof"
                ],
                "exit_types": [
                    "ipo", "strategic_acquisition", "financial_acquisition",
                    "merger"
                ],
                "valuation_methods":
                ["dcf", "comparable_company", "precedent_transaction"]
            },
            thresholds={
                "investment_ready": 8.0,
                "needs_preparation": 6.0,
                "early_stage": 4.0
            },
            output_fields=[
                "readiness_score", "funding_recommendation", "exit_potential",
                "investor_fit"
            ],
            requires_ai=True))


class AnalysisConfiguration(BaseModel):
    """Complete analysis configuration for uploaded data processing"""

    framework: str = Field(default="general",
                           description="Analysis framework (general/medtech)")
    modules: NineCoreAnalysisModules = Field(
        default_factory=NineCoreAnalysisModules)

    # Global settings
    enable_ai_processing: bool = Field(
        default=True, description="Enable AI-powered analysis")
    auto_data_mapping: bool = Field(
        default=True, description="Automatically map uploaded data")
    confidence_threshold: float = Field(
        default=0.7, description="Minimum confidence for AI analysis")

    # Data processing settings
    data_validation_rules: Dict[str, Any] = Field(
        default_factory=dict, description="Data validation rules")
    missing_data_strategy: str = Field(default="interpolate",
                                       description="Strategy for missing data")

    # Output configuration
    include_raw_data: bool = Field(
        default=False, description="Include raw analysis data in output")
    export_formats: List[str] = Field(default=["json", "pdf"],
                                      description="Available export formats")


class ModuleDataProcessor:
    """Processor for mapping uploaded data to module configurations"""

    @staticmethod
    def extract_company_data(
            uploaded_files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract company data from uploaded files"""
        extracted_data = {
            "company_name": None,
            "industry": None,
            "funding_stage": "seed",
            "revenue": 0,
            "team_size": 0,
            "market_data": {},
            "financial_data": {},
            "team_data": {}
        }

        for file_data in uploaded_files:
            file_type = file_data.get("type", "").lower()
            content = file_data.get("content", {})

            if "pitch" in file_type or "presentation" in file_type:
                extracted_data.update({
                    "company_name":
                    content.get("company_name"),
                    "industry":
                    content.get("industry"),
                    "value_proposition":
                    content.get("value_proposition"),
                    "market_size":
                    content.get("market_size")
                })

            elif "financial" in file_type or "excel" in file_type:
                extracted_data["financial_data"].update({
                    "revenue":
                    content.get("revenue", 0),
                    "expenses":
                    content.get("expenses", 0),
                    "burn_rate":
                    content.get("burn_rate", 0),
                    "runway_months":
                    content.get("runway_months", 0)
                })

            elif "team" in file_type or "org" in file_type:
                extracted_data["team_data"].update({
                    "founders":
                    content.get("founders", []),
                    "key_personnel":
                    content.get("key_personnel", []),
                    "team_size":
                    content.get("team_size", 0)
                })

        return extracted_data

    @staticmethod
    def map_data_to_modules(
            extracted_data: Dict[str, Any],
            config: AnalysisConfiguration) -> Dict[str, Dict[str, Any]]:
        """Map extracted data to module inputs based on configuration"""
        module_inputs = {}

        for module_name, module_config in config.modules.dict().items():
            if module_config["status"] != ModuleStatus.ACTIVE:
                continue

            module_input = {}

            # Apply data mapping rules
            for mapping_rule in module_config["data_mapping"]:
                source_field = mapping_rule["source_field"]
                target_field = mapping_rule["target_field"]

                # Navigate nested fields
                source_value = extracted_data
                for field_part in source_field.split("."):
                    source_value = source_value.get(field_part, {})
                    if not isinstance(source_value, dict):
                        break

                # Set target field
                if source_value is not None and source_value != {}:
                    module_input[target_field] = source_value
                elif mapping_rule["required"] and mapping_rule.get(
                        "default_value") is not None:
                    module_input[target_field] = mapping_rule["default_value"]

            # Add module-specific settings
            module_input["settings"] = module_config["settings"]
            module_input["thresholds"] = module_config["thresholds"]

            module_inputs[module_name] = module_input

        return module_inputs

    @staticmethod
    def validate_module_inputs(
            module_inputs: Dict[str, Dict[str, Any]],
            config: AnalysisConfiguration) -> Dict[str, List[str]]:
        """Validate module inputs against configuration requirements"""
        validation_errors = {}

        for module_name, module_input in module_inputs.items():
            errors = []
            module_config = getattr(config.modules, module_name)

            # Check required fields
            for mapping_rule in module_config.data_mapping:
                if mapping_rule.required and mapping_rule.target_field not in module_input:
                    errors.append(
                        f"Missing required field: {mapping_rule.target_field}")

            if errors:
                validation_errors[module_name] = errors

        return validation_errors


# Default configuration instances
DEFAULT_ANALYSIS_CONFIG = AnalysisConfiguration()

# Configuration presets
ANALYSIS_PRESETS = {
    "triage":
    AnalysisConfiguration(
        framework="general",
        modules=NineCoreAnalysisModules(
            # Enable only core modules for triage
            market_analysis=ModuleConfiguration(
                **{
                    **DEFAULT_ANALYSIS_CONFIG.modules.market_analysis.dict(), "status":
                    ModuleStatus.INACTIVE
                }),
            technology_assessment=ModuleConfiguration(
                **{
                    **DEFAULT_ANALYSIS_CONFIG.modules.technology_assessment.dict(
                    ), "status":
                    ModuleStatus.INACTIVE
                }))),
    "comprehensive":
    DEFAULT_ANALYSIS_CONFIG,
    "medtech":
    AnalysisConfiguration(
        framework="medtech",
        modules=NineCoreAnalysisModules(
            # Add MedTech-specific configurations
            **DEFAULT_ANALYSIS_CONFIG.modules.dict(), ))
}