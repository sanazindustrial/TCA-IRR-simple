/**
 * Standard Data Extraction Schema for 9-Module Analysis
 * 
 * This file defines the standardized data extraction schema for pitch deck analysis.
 * Each evaluation must extract data according to this schema to ensure consistency
 * in analysis and report generation.
 * 
 * IMPORTANT: This schema ensures each evaluation is INDEPENDENT with its own:
 * - Unique evaluation_id (UUID)
 * - Company association (company_id)
 * - User tracking (user_id, created_by)
 * - Timestamp tracking
 */

// ============================================================================
// CORE IDENTIFICATION TYPES
// ============================================================================

export interface EvaluationIdentifier {
    evaluation_id: string;      // UUID - Primary key
    company_id: string;         // UUID - Foreign key to companies
    user_id: string;            // UUID - Foreign key to users
    created_by: string;         // User who created this evaluation
    created_at: string;         // ISO timestamp
    version: number;            // Version number for this evaluation
}

export interface CompanyIdentifier {
    company_id: string;
    company_name: string;
    legal_name?: string;
    primary_key_index: string;  // Unique index: COMP-{timestamp}-{random}
}

export interface ReportIdentifier {
    report_id: string;          // UUID - Primary key
    evaluation_id: string;      // Foreign key to evaluations
    company_id: string;         // Foreign key to companies
    user_id: string;            // Foreign key to users
    report_type: 'Triage' | 'Due Diligence' | 'Full Assessment';
    primary_key_index: string;  // Unique index: RPT-{timestamp}-{random}
}

// ============================================================================
// 9-MODULE EXTRACTION SCHEMA
// ============================================================================

/**
 * Module 1: Company Analysis
 * Required fields for company profile extraction
 */
export interface CompanyAnalysisData {
    // Basic Information (Required)
    company_name: string;
    legal_name: string;
    website: string;
    industry_vertical: string;
    development_stage: 'Pre-seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'Growth';
    business_model: string;
    
    // Location (Required)
    country: string;
    state: string;
    city: string;
    
    // Descriptions (Required)
    one_line_description: string;
    company_description: string;
    product_description: string;
    
    // Additional (Optional)
    founded_year?: number;
    number_of_employees?: number;
    headquarters_address?: string;
}

/**
 * Module 2: Financial Score
 * Required financial data for evaluation
 */
export interface FinancialScoreData {
    // Revenue Metrics
    current_revenue?: number;
    revenue_growth_rate?: number;       // Percentage
    mrr?: number;                       // Monthly Recurring Revenue
    arr?: number;                       // Annual Recurring Revenue
    
    // Funding Information
    total_funding_raised?: number;
    last_funding_round?: string;
    last_funding_amount?: number;
    last_funding_date?: string;
    valuation?: number;
    
    // Unit Economics
    ltv?: number;                       // Lifetime Value
    cac?: number;                       // Customer Acquisition Cost
    ltv_cac_ratio?: number;
    gross_margin?: number;              // Percentage
    net_margin?: number;                // Percentage
    
    // Cash Position
    burn_rate?: number;                 // Monthly burn
    runway_months?: number;
    cash_on_hand?: number;
}

/**
 * Module 3: Technology Score
 * Required technology data for evaluation
 */
export interface TechnologyScoreData {
    // Tech Stack
    primary_technologies: string[];
    tech_stack_description: string;
    
    // IP & Innovation
    patents_filed?: number;
    patents_granted?: number;
    trade_secrets?: boolean;
    proprietary_technology?: string;
    
    // Infrastructure
    cloud_provider?: string;
    scalability_approach?: string;
    security_certifications?: string[];
    
    // Development
    development_methodology?: string;
    code_quality_metrics?: Record<string, unknown>;
}

/**
 * Module 4: Market Trends (PESTEL)
 * Required market data for evaluation
 */
export interface MarketTrendsData {
    // Market Size
    tam?: number;                       // Total Addressable Market
    sam?: number;                       // Serviceable Addressable Market
    som?: number;                       // Serviceable Obtainable Market
    market_growth_rate?: number;        // Percentage
    
    // Competitive Landscape
    main_competitors: string[];
    competitive_advantages: string[];
    market_position?: string;
    
    // Trends
    industry_trends: string[];
    regulatory_environment?: string;
    market_timing_assessment?: string;
}

/**
 * Module 5: Risk Assessment
 * Required risk data for evaluation
 */
export interface RiskAssessmentData {
    // Regulatory Risks
    regulatory_requirements: string[];
    compliance_status?: string;
    pending_regulatory_actions?: string[];
    
    // Operational Risks
    key_dependencies: string[];
    single_points_of_failure?: string[];
    
    // Legal Risks
    pending_litigation?: boolean;
    litigation_details?: string;
    
    // Market Risks
    market_concentration_risk?: string;
    customer_concentration?: number;    // Percentage from top customers
}

/**
 * Module 6: IP Strength
 * Required IP data for evaluation
 */
export interface IPStrengthData {
    // Patents
    patent_portfolio: {
        filed: number;
        granted: number;
        pending: number;
        categories?: string[];
    };
    
    // Trademarks
    trademark_count?: number;
    registered_trademarks?: string[];
    
    // Trade Secrets
    trade_secrets_documented?: boolean;
    nda_coverage?: string;
    
    // Copyrights
    copyrighted_works?: string[];
    
    // Freedom to Operate
    freedom_to_operate_analysis?: boolean;
    ip_risk_assessment?: string;
}

/**
 * Module 7: Team Assessment
 * Required team data for evaluation
 */
export interface TeamAssessmentData {
    // Founders
    founders: FounderProfile[];
    
    // Team Composition
    total_team_size: number;
    engineering_team_size?: number;
    sales_team_size?: number;
    leadership_team: LeadershipMember[];
    
    // Team Metrics
    average_tenure_months?: number;
    key_hires_needed?: string[];
    team_diversity_score?: number;
    
    // Advisors
    advisors?: AdvisorProfile[];
    board_members?: BoardMember[];
}

export interface FounderProfile {
    name: string;
    role: string;
    linkedin_url?: string;
    previous_exits?: number;
    years_experience?: number;
    domain_expertise?: string[];
    equity_percentage?: number;
}

export interface LeadershipMember {
    name: string;
    title: string;
    years_at_company?: number;
    previous_experience?: string;
}

export interface AdvisorProfile {
    name: string;
    expertise_area: string;
    notable_background?: string;
}

export interface BoardMember {
    name: string;
    affiliation?: string;
    role_type: 'Independent' | 'Investor' | 'Founder';
}

/**
 * Module 8: Competitive Analysis
 * Required competitive data for evaluation
 */
export interface CompetitiveAnalysisData {
    // Direct Competitors
    direct_competitors: CompetitorProfile[];
    
    // Indirect Competitors
    indirect_competitors?: CompetitorProfile[];
    
    // Competitive Position
    market_share_estimate?: number;     // Percentage
    competitive_advantages: string[];
    competitive_weaknesses?: string[];
    
    // Differentiation
    unique_value_proposition: string;
    moat_description?: string;
    switching_cost_level?: 'Low' | 'Medium' | 'High';
}

export interface CompetitorProfile {
    name: string;
    website?: string;
    estimated_revenue?: number;
    funding_raised?: number;
    key_differentiators?: string[];
    threat_level?: 'Low' | 'Medium' | 'High';
}

/**
 * Module 9: Strategic Fit Matrix
 * Required strategic fit data for evaluation
 */
export interface StrategicFitData {
    // Investment Thesis Fit
    thesis_alignment_areas: string[];
    strategic_synergies?: string[];
    
    // Portfolio Fit
    portfolio_overlap?: string;
    follow_on_potential?: boolean;
    
    // Value Add Opportunities
    value_add_opportunities: string[];
    operational_support_needed?: string[];
    
    // Exit Potential
    potential_acquirers?: string[];
    ipo_potential?: boolean;
    estimated_exit_timeline?: string;
    target_exit_multiple?: number;
}

// ============================================================================
// COMPLETE EXTRACTION SCHEMA
// ============================================================================

/**
 * Complete Extraction Schema for one evaluation
 * All data must be tied to a unique evaluation_id
 */
export interface StandardExtractionSchema {
    // Identification (REQUIRED - prevents confusion between evaluations)
    identification: EvaluationIdentifier;
    
    // Module Data (extracted from pitch deck)
    company_analysis: CompanyAnalysisData;
    financial_score: Partial<FinancialScoreData>;
    technology_score: Partial<TechnologyScoreData>;
    market_trends: Partial<MarketTrendsData>;
    risk_assessment: Partial<RiskAssessmentData>;
    ip_strength: Partial<IPStrengthData>;
    team_assessment: Partial<TeamAssessmentData>;
    competitive_analysis: Partial<CompetitiveAnalysisData>;
    strategic_fit: Partial<StrategicFitData>;
    
    // Metadata
    extraction_metadata: ExtractionMetadata;
}

export interface ExtractionMetadata {
    extraction_timestamp: string;
    extraction_source: 'pitch_deck' | 'manual' | 'external_api' | 'combination';
    pitch_deck_file_name?: string;
    pitch_deck_pages?: number;
    extraction_confidence: number;      // 0-100
    missing_required_fields: string[];
    missing_optional_fields: string[];
    validation_warnings: string[];
}

// ============================================================================
// EXTRACTION UTILITIES
// ============================================================================

/**
 * Generate unique evaluation ID
 */
export function generateEvaluationId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EVAL-${timestamp}-${random}`;
}

/**
 * Generate unique company ID
 */
export function generateCompanyId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `COMP-${timestamp}-${random}`;
}

/**
 * Generate unique report ID
 */
export function generateReportId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RPT-${timestamp}-${random}`;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUserId(): string {
    if (typeof window === 'undefined') return 'system';
    try {
        const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        return user.id || user.user_id || 'anonymous';
    } catch {
        return 'anonymous';
    }
}

/**
 * Create a fresh evaluation identifier
 */
export function createFreshEvaluationIdentifier(): EvaluationIdentifier {
    const userId = getCurrentUserId();
    return {
        evaluation_id: generateEvaluationId(),
        company_id: generateCompanyId(),
        user_id: userId,
        created_by: userId,
        created_at: new Date().toISOString(),
        version: 1,
    };
}

/**
 * Create default extraction schema with fresh IDs
 */
export function createFreshExtractionSchema(): StandardExtractionSchema {
    const identification = createFreshEvaluationIdentifier();
    
    return {
        identification,
        company_analysis: {
            company_name: '',
            legal_name: '',
            website: '',
            industry_vertical: '',
            development_stage: 'Pre-seed',
            business_model: '',
            country: '',
            state: '',
            city: '',
            one_line_description: '',
            company_description: '',
            product_description: '',
        },
        financial_score: {},
        technology_score: {
            primary_technologies: [],
            tech_stack_description: '',
        },
        market_trends: {
            main_competitors: [],
            competitive_advantages: [],
            industry_trends: [],
        },
        risk_assessment: {
            regulatory_requirements: [],
            key_dependencies: [],
        },
        ip_strength: {
            patent_portfolio: { filed: 0, granted: 0, pending: 0 },
        },
        team_assessment: {
            founders: [],
            total_team_size: 0,
            leadership_team: [],
        },
        competitive_analysis: {
            direct_competitors: [],
            competitive_advantages: [],
            unique_value_proposition: '',
        },
        strategic_fit: {
            thesis_alignment_areas: [],
            value_add_opportunities: [],
        },
        extraction_metadata: {
            extraction_timestamp: new Date().toISOString(),
            extraction_source: 'manual',
            extraction_confidence: 0,
            missing_required_fields: [],
            missing_optional_fields: [],
            validation_warnings: [],
        },
    };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Required fields for minimum viable extraction
 */
export const REQUIRED_EXTRACTION_FIELDS = [
    'identification.evaluation_id',
    'identification.company_id',
    'identification.user_id',
    'company_analysis.company_name',
    'company_analysis.industry_vertical',
    'company_analysis.development_stage',
    'company_analysis.company_description',
] as const;

/**
 * Validate extraction has minimum required data
 */
export function validateExtractionSchema(data: Partial<StandardExtractionSchema>): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
} {
    const missingFields: string[] = [];
    const warnings: string[] = [];
    
    // Check required identification
    if (!data.identification?.evaluation_id) {
        missingFields.push('identification.evaluation_id');
    }
    if (!data.identification?.company_id) {
        missingFields.push('identification.company_id');
    }
    if (!data.identification?.user_id) {
        missingFields.push('identification.user_id');
    }
    
    // Check required company data
    if (!data.company_analysis?.company_name) {
        missingFields.push('company_analysis.company_name');
    }
    if (!data.company_analysis?.industry_vertical) {
        missingFields.push('company_analysis.industry_vertical');
    }
    if (!data.company_analysis?.development_stage) {
        missingFields.push('company_analysis.development_stage');
    }
    if (!data.company_analysis?.company_description) {
        warnings.push('Company description is recommended for better analysis');
    }
    
    // Check team data
    if (!data.team_assessment?.founders?.length) {
        warnings.push('No founder information provided');
    }
    
    // Check financial data
    if (!data.financial_score?.current_revenue && !data.financial_score?.total_funding_raised) {
        warnings.push('No financial data provided - analysis may be limited');
    }
    
    return {
        isValid: missingFields.length === 0,
        missingFields,
        warnings,
    };
}

/**
 * Clear all previous evaluation data from localStorage
 * IMPORTANT: Call this when starting a new evaluation to prevent data mixing
 */
export function clearPreviousEvaluationData(): void {
    if (typeof window === 'undefined') return;
    
    const keysToRemove = [
        'evaluation_autosave',
        'current_evaluation_id',
        'processedFiles',
        'processedUrls',
        'processedTexts',
        'analysisResult',
        'analysisDuration',
        'analysisFramework',
        'current_extraction_data',
    ];
    
    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Failed to remove ${key} from localStorage:`, e);
        }
    });
    
    console.log('[Extraction] Cleared previous evaluation data');
}

/**
 * Log extraction event for audit trail
 */
export function logExtractionEvent(
    evaluationId: string,
    eventType: 'started' | 'extracted' | 'validated' | 'saved' | 'error',
    details?: Record<string, unknown>
): void {
    const event = {
        timestamp: new Date().toISOString(),
        evaluation_id: evaluationId,
        event_type: eventType,
        user_id: getCurrentUserId(),
        details,
    };
    
    console.log('[Extraction Event]', JSON.stringify(event));
    
    // Store in localStorage for debugging
    try {
        const logs = JSON.parse(localStorage.getItem('extraction_logs') || '[]');
        logs.push(event);
        // Keep only last 100 events
        if (logs.length > 100) logs.shift();
        localStorage.setItem('extraction_logs', JSON.stringify(logs));
    } catch (e) {
        console.warn('Failed to store extraction log:', e);
    }
}
