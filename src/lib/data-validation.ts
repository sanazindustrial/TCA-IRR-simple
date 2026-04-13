/**
 * Data Validation Service
 * 
 * Comprehensive validation and normalization for:
 * - Company information from pitch decks
 * - User input data
 * - Report generation data
 * - External source data
 */

// Validation result types
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    normalizedData?: Record<string, unknown>;
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}

// Company validation rules
export interface CompanyValidationRules {
    requiredFields: string[];
    optionalFields: string[];
    fieldPatterns: Record<string, RegExp>;
    fieldLimits: Record<string, { min?: number; max?: number }>;
}

const DEFAULT_VALIDATION_RULES: CompanyValidationRules = {
    requiredFields: [
        'companyName',
        'industryVertical',
        'developmentStage',
    ],
    optionalFields: [
        'website',
        'legalName',
        'numberOfEmployees',
        'country',
        'state',
        'city',
        'oneLineDescription',
        'companyDescription',
        'productDescription',
        'businessModel',
        'foundedYear',
        'revenue',
        'teamSize',
    ],
    fieldPatterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        website: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i,
        phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
    },
    fieldLimits: {
        companyName: { min: 2, max: 200 },
        legalName: { min: 2, max: 300 },
        oneLineDescription: { min: 10, max: 500 },
        companyDescription: { min: 50, max: 5000 },
        productDescription: { min: 20, max: 3000 },
        numberOfEmployees: { min: 1, max: 1000000 },
        revenue: { min: 0 },
        teamSize: { min: 1, max: 100000 },
    },
};

// Normalization functions
function normalizeString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function normalizeNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}

function normalizeWebsite(url: string): string {
    if (!url) return '';
    url = url.trim().toLowerCase();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    return url;
}

function normalizeCompanyName(name: string): string {
    if (!name) return '';
    // Remove extra spaces, capitalize properly
    name = name.trim().replace(/\s+/g, ' ');
    // Preserve common suffixes
    const suffixes = ['Inc.', 'LLC', 'Ltd.', 'Corp.', 'Corporation', 'Company', 'Co.'];
    for (const suffix of suffixes) {
        const pattern = new RegExp(suffix.replace('.', '\\.'), 'i');
        if (pattern.test(name)) {
            name = name.replace(pattern, suffix);
        }
    }
    return name;
}

function normalizeIndustry(industry: string): string {
    if (!industry) return '';

    const industryMappings: Record<string, string> = {
        'saas': 'Software/SaaS',
        'software': 'Software/SaaS',
        'fintech': 'FinTech',
        'financial technology': 'FinTech',
        'healthtech': 'HealthTech/MedTech',
        'health tech': 'HealthTech/MedTech',
        'medtech': 'HealthTech/MedTech',
        'medical technology': 'HealthTech/MedTech',
        'biotech': 'BioTech',
        'biotechnology': 'BioTech',
        'ecommerce': 'E-commerce',
        'e-commerce': 'E-commerce',
        'edtech': 'EdTech',
        'education technology': 'EdTech',
        'cleantech': 'CleanTech/GreenTech',
        'greentech': 'CleanTech/GreenTech',
        'proptech': 'PropTech',
        'property technology': 'PropTech',
        'agtech': 'AgTech',
        'agricultural technology': 'AgTech',
        'ai': 'AI/ML',
        'artificial intelligence': 'AI/ML',
        'machine learning': 'AI/ML',
        'ml': 'AI/ML',
        'cybersecurity': 'Cybersecurity',
        'cyber security': 'Cybersecurity',
        'security': 'Cybersecurity',
        'iot': 'IoT',
        'internet of things': 'IoT',
        'hardware': 'Hardware',
        'consumer': 'Consumer Goods',
        'enterprise': 'Enterprise Software',
    };

    const lowerIndustry = industry.toLowerCase().trim();
    return industryMappings[lowerIndustry] || industry;
}

function normalizeStage(stage: string): string {
    if (!stage) return '';

    const stageMappings: Record<string, string> = {
        'pre-seed': 'Pre-seed',
        'preseed': 'Pre-seed',
        'idea': 'Pre-seed',
        'seed': 'Seed',
        'series a': 'Series A',
        'a': 'Series A',
        'series b': 'Series B',
        'b': 'Series B',
        'series c': 'Series C+',
        'c': 'Series C+',
        'series c+': 'Series C+',
        'series d': 'Series C+',
        'growth': 'Growth',
        'expansion': 'Growth',
        'pre-ipo': 'Pre-IPO',
        'preipo': 'Pre-IPO',
        'ipo': 'Pre-IPO',
    };

    const lowerStage = stage.toLowerCase().trim();
    return stageMappings[lowerStage] || stage;
}

/**
 * Validate company information
 */
export function validateCompanyData(
    data: Record<string, unknown>,
    rules: CompanyValidationRules = DEFAULT_VALIDATION_RULES
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const normalizedData: Record<string, unknown> = {};

    // Check required fields
    for (const field of rules.requiredFields) {
        const value = data[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push({
                field,
                message: `${formatFieldName(field)} is required`,
                code: 'REQUIRED_FIELD_MISSING',
            });
        }
    }

    // Validate and normalize all fields
    for (const [field, value] of Object.entries(data)) {
        // Skip empty optional fields
        if (!value && !rules.requiredFields.includes(field)) {
            continue;
        }

        // Normalize based on field type
        switch (field) {
            case 'companyName':
                normalizedData[field] = normalizeCompanyName(normalizeString(value));
                break;
            case 'website':
                const normalizedUrl = normalizeWebsite(normalizeString(value));
                normalizedData[field] = normalizedUrl;
                if (normalizedUrl && !rules.fieldPatterns.website.test(normalizedUrl)) {
                    warnings.push({
                        field,
                        message: 'Website URL format may be invalid',
                        suggestion: 'Please verify the URL is correct',
                    });
                }
                break;
            case 'industryVertical':
                normalizedData[field] = normalizeIndustry(normalizeString(value));
                break;
            case 'developmentStage':
                normalizedData[field] = normalizeStage(normalizeString(value));
                break;
            case 'numberOfEmployees':
            case 'teamSize':
            case 'revenue':
            case 'foundedYear':
                const numValue = normalizeNumber(value);
                normalizedData[field] = numValue;
                const limits = rules.fieldLimits[field];
                if (numValue !== null && limits) {
                    if (limits.min !== undefined && numValue < limits.min) {
                        errors.push({
                            field,
                            message: `${formatFieldName(field)} must be at least ${limits.min}`,
                            code: 'VALUE_TOO_LOW',
                        });
                    }
                    if (limits.max !== undefined && numValue > limits.max) {
                        errors.push({
                            field,
                            message: `${formatFieldName(field)} must be at most ${limits.max}`,
                            code: 'VALUE_TOO_HIGH',
                        });
                    }
                }
                break;
            default:
                normalizedData[field] = normalizeString(value);
        }

        // Check field limits for strings
        if (typeof value === 'string') {
            const limits = rules.fieldLimits[field];
            if (limits) {
                if (limits.min !== undefined && value.length < limits.min) {
                    warnings.push({
                        field,
                        message: `${formatFieldName(field)} is shorter than recommended (${limits.min} characters)`,
                        suggestion: `Add more detail to ${formatFieldName(field)}`,
                    });
                }
                if (limits.max !== undefined && value.length > limits.max) {
                    errors.push({
                        field,
                        message: `${formatFieldName(field)} exceeds maximum length (${limits.max} characters)`,
                        code: 'VALUE_TOO_LONG',
                    });
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        normalizedData,
    };
}

/**
 * Validate report data for generation
 */
export function validateReportData(
    data: Record<string, unknown>,
    reportType: 'triage' | 'dd'
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields for report generation
    const requiredFields = [
        'companyName',
        'industryVertical',
        'developmentStage',
    ];

    // Additional fields for DD reports
    if (reportType === 'dd') {
        requiredFields.push(
            'companyDescription',
            'businessModel',
        );
    }

    for (const field of requiredFields) {
        if (!data[field]) {
            errors.push({
                field,
                message: `${formatFieldName(field)} is required for ${reportType === 'dd' ? 'Due Diligence' : 'Triage'} report`,
                code: 'REQUIRED_FOR_REPORT',
            });
        }
    }

    // Validate analysis data completeness
    const modulesRequired = reportType === 'dd' ? 5 : 3;
    const modulesCompleted = Object.keys(data).filter(k => k.startsWith('module_') && data[k]).length;

    if (modulesCompleted < modulesRequired) {
        warnings.push({
            field: 'modules',
            message: `Only ${modulesCompleted}/${modulesRequired} modules completed`,
            suggestion: 'Complete more modules for a comprehensive analysis',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate user data for isolation checks
 */
export function validateUserDataAccess(
    userId: string,
    dataUserId: string,
    userRole: string
): boolean {
    // Admin and analyst can access all data
    if (userRole === 'admin' || userRole === 'analyst') {
        return true;
    }
    // Regular users can only access their own data
    return userId === dataUserId;
}

/**
 * Normalize extract data from pitch deck
 */
export function normalizePitchDeckData(
    extractedData: Record<string, unknown>
): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    // Map common extraction field names to our schema
    const fieldMappings: Record<string, string> = {
        'company_name': 'companyName',
        'company': 'companyName',
        'name': 'companyName',
        'industry': 'industryVertical',
        'sector': 'industryVertical',
        'vertical': 'industryVertical',
        'stage': 'developmentStage',
        'funding_stage': 'developmentStage',
        'round': 'developmentStage',
        'description': 'companyDescription',
        'about': 'companyDescription',
        'overview': 'companyDescription',
        'product': 'productDescription',
        'solution': 'productDescription',
        'website_url': 'website',
        'url': 'website',
        'web': 'website',
        'employees': 'numberOfEmployees',
        'team_size': 'teamSize',
        'headcount': 'numberOfEmployees',
        'location': 'city',
        'headquarters': 'city',
        'hq': 'city',
        'founded': 'foundedYear',
        'year_founded': 'foundedYear',
        'business_model': 'businessModel',
        'model': 'businessModel',
        'legal_name': 'legalName',
        'entity_name': 'legalName',
    };

    for (const [key, value] of Object.entries(extractedData)) {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        const mappedKey = fieldMappings[normalizedKey] || key;

        // Apply type-specific normalization
        switch (mappedKey) {
            case 'companyName':
                normalized[mappedKey] = normalizeCompanyName(normalizeString(value));
                break;
            case 'industryVertical':
                normalized[mappedKey] = normalizeIndustry(normalizeString(value));
                break;
            case 'developmentStage':
                normalized[mappedKey] = normalizeStage(normalizeString(value));
                break;
            case 'website':
                normalized[mappedKey] = normalizeWebsite(normalizeString(value));
                break;
            case 'numberOfEmployees':
            case 'teamSize':
            case 'foundedYear':
                normalized[mappedKey] = normalizeNumber(value);
                break;
            default:
                normalized[mappedKey] = normalizeString(value);
        }
    }

    return normalized;
}

/**
 * Auto-fill company form from extracted data
 */
export function autoFillCompanyForm(
    extractedData: Record<string, unknown>,
    existingData: Record<string, unknown> = {}
): { filledData: Record<string, unknown>; confidence: number; filledFields: string[] } {
    const normalizedExtracted = normalizePitchDeckData(extractedData);
    const filledData: Record<string, unknown> = { ...existingData };
    const filledFields: string[] = [];
    let totalFields = 0;
    let filledCount = 0;

    const targetFields = [
        'companyName', 'legalName', 'website', 'industryVertical',
        'developmentStage', 'businessModel', 'country', 'state', 'city',
        'oneLineDescription', 'companyDescription', 'productDescription',
        'numberOfEmployees', 'foundedYear',
    ];

    for (const field of targetFields) {
        totalFields++;
        const extractedValue = normalizedExtracted[field];
        const existingValue = existingData[field];

        // Only fill if extracted value exists and no existing value
        if (extractedValue && !existingValue) {
            filledData[field] = extractedValue;
            filledFields.push(field);
            filledCount++;
        } else if (existingValue) {
            filledCount++; // Count existing values for confidence
        }
    }

    const confidence = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;

    return {
        filledData,
        confidence,
        filledFields,
    };
}

/**
 * Validate evaluation workflow step
 */
export function validateWorkflowStep(
    step: number,
    currentData: Record<string, unknown>
): { canProceed: boolean; blockers: string[] } {
    const blockers: string[] = [];

    switch (step) {
        case 1: // Document Upload
            if (!currentData.hasDocuments) {
                blockers.push('Upload at least one document to proceed');
            }
            break;
        case 2: // Data Extraction
            if (!currentData.extractionComplete) {
                blockers.push('Complete data extraction before proceeding');
            }
            break;
        case 3: // Company Info
            if (!currentData.companyName) {
                blockers.push('Company name is required');
            }
            if (!currentData.industryVertical) {
                blockers.push('Industry vertical is required');
            }
            if (!currentData.developmentStage) {
                blockers.push('Development stage is required');
            }
            break;
        case 4: // External Sources (optional for non-privileged)
            // No blockers - optional step
            break;
        case 5: // Module Config
            if (!currentData.moduleSelected) {
                blockers.push('Select at least one analysis module');
            }
            break;
        case 6: // Analysis
            if (!currentData.analysisComplete) {
                blockers.push('Complete analysis before generating report');
            }
            break;
        case 7: // Report Generation
            // Final step - no blockers
            break;
    }

    return {
        canProceed: blockers.length === 0,
        blockers,
    };
}

/**
 * Format field name for display
 */
function formatFieldName(field: string): string {
    return field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

/**
 * Generate evaluation tracking record
 */
export interface EvaluationRecord {
    evaluationId: string;
    userId: string;
    userEmail: string;
    userName: string;
    companyName: string;
    timestamp: string;
    reportType: 'triage' | 'dd';
    status: 'started' | 'in-progress' | 'completed' | 'failed';
    stepHistory: { step: number; timestamp: string; status: string }[];
}

export function createEvaluationRecord(
    userId: string,
    userEmail: string,
    userName: string,
    companyName: string,
    reportType: 'triage' | 'dd'
): EvaluationRecord {
    const now = new Date().toISOString();
    const evaluationId = `EVAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return {
        evaluationId,
        userId,
        userEmail,
        userName,
        companyName,
        timestamp: now,
        reportType,
        status: 'started',
        stepHistory: [
            { step: 1, timestamp: now, status: 'started' },
        ],
    };
}

/**
 * Data cleanup for fresh evaluation
 */
export function cleanupEvaluationData(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove = [
        'tca_current_evaluation',
        'tca_company_info',
        'tca_uploaded_files',
        'tca_external_data',
        'tca_analysis_results',
        'tca_module_config',
        'tca_extraction_data',
        'analysisCompanyName',
        'analysisData',
        'companyData',
    ];

    for (const key of keysToRemove) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    }

    // Dispatch cleanup event
    window.dispatchEvent(new CustomEvent('tca_data_cleanup'));
}

export default {
    validateCompanyData,
    validateReportData,
    validateUserDataAccess,
    normalizePitchDeckData,
    autoFillCompanyForm,
    validateWorkflowStep,
    createEvaluationRecord,
    cleanupEvaluationData,
};
