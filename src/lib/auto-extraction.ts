/**
 * Automated Pitch Deck Data Extraction Service
 * 
 * This service provides AUTOMATED extraction of company data from uploaded pitch decks
 * following the standardized 9-module analysis schema.
 * 
 * KEY FEATURES:
 * - No manual "Extract Data" button needed
 * - Automatic extraction triggered on document upload
 * - Standardized schema for consistent analysis
 * - Unique indexing with primary/foreign keys
 * - Fresh state for each evaluation (no data mixing)
 * - Real data only - no mock data
 */

import {
    StandardExtractionSchema,
    EvaluationIdentifier,
    CompanyAnalysisData,
    FinancialScoreData,
    TechnologyScoreData,
    MarketTrendsData,
    RiskAssessmentData,
    IPStrengthData,
    TeamAssessmentData,
    CompetitiveAnalysisData,
    StrategicFitData,
    ExtractionMetadata,
    generateEvaluationId,
    generateCompanyId,
    generateReportId,
    createFreshExtractionSchema,
    validateExtractionSchema,
} from './extraction-schema';

// ============================================================================
// AUTO-EXTRACTION SERVICE CONFIGURATION
// ============================================================================

const API_BASE_URL = 'https://tcairrapiccontainer.azurewebsites.net';

// Storage keys for extraction data (unique per evaluation)
const EXTRACTION_STORAGE_KEY = 'current_extraction_data';
const EVALUATION_STATE_KEY = 'evaluation_state';
const PROCESSED_DOCUMENTS_KEY = 'processed_documents_for_extraction';

// ============================================================================
// TYPES
// ============================================================================

export interface AutoExtractionResult {
    success: boolean;
    extractionId: string;
    data: StandardExtractionSchema;
    confidence: number;
    warnings: string[];
    errors: string[];
    processingTimeMs: number;
}

export interface DocumentContent {
    type: 'file' | 'url' | 'text';
    filename?: string;
    url?: string;
    content: string;
    mimeType?: string;
    extractedAt: string;
}

export interface ExtractionStatus {
    isExtracting: boolean;
    progress: number;
    currentStep: string;
    documentsProcessed: number;
    totalDocuments: number;
}

// ============================================================================
// FRESH STATE MANAGEMENT
// ============================================================================

/**
 * Clear ALL previous evaluation data to ensure fresh state
 * CRITICAL: Call this when starting a new evaluation
 */
export function clearAllEvaluationState(): void {
    if (typeof window === 'undefined') return;

    // List of all storage keys to clear for fresh evaluation
    const keysToRemove = [
        // Extraction data
        EXTRACTION_STORAGE_KEY,
        EVALUATION_STATE_KEY,
        PROCESSED_DOCUMENTS_KEY,
        'current_extraction_schema',

        // Previous evaluation data
        'evaluation_autosave',
        'processedFiles',
        'processedUrls',
        'processedTexts',

        // Analysis results from previous runs
        'analysisResult',
        'analysisFramework',
        'analysisDuration',
        'analysisCompanyName',

        // Company data from previous evaluations
        'companyData',
        'companyInfo',
        'extractedCompanyData',

        // Report data (keep only stored reports, not working data)
        'currentReportData',
        'reportGenerationState',

        // Module scores from previous analysis
        'moduleScores',
        'adjustedScores',
        'whatIfAnalysis',
    ];

    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        } catch (e) {
            console.warn(`Failed to remove ${key}:`, e);
        }
    });

    console.log('[AutoExtraction] Cleared all previous evaluation state - fresh start');
}

/**
 * Initialize a new evaluation with fresh state
 */
export function initializeFreshEvaluation(): {
    evaluationId: string;
    companyId: string;
    schema: StandardExtractionSchema;
} {
    // Clear previous data first
    clearAllEvaluationState();

    // Create fresh schema with new IDs
    const schema = createFreshExtractionSchema();
    const evaluationId = schema.identification.evaluation_id;
    const companyId = schema.identification.company_id;

    // Store the fresh state
    if (typeof window !== 'undefined') {
        localStorage.setItem(EXTRACTION_STORAGE_KEY, JSON.stringify(schema));
        localStorage.setItem(EVALUATION_STATE_KEY, JSON.stringify({
            evaluationId,
            companyId,
            startedAt: new Date().toISOString(),
            status: 'initialized',
        }));
    }

    console.log(`[AutoExtraction] Initialized fresh evaluation: ${evaluationId}`);
    return { evaluationId, companyId, schema };
}

// ============================================================================
// DOCUMENT PROCESSING
// ============================================================================

/**
 * Process uploaded files and extract content
 */
async function processUploadedFiles(
    files: Array<{ filename: string; content?: string; url?: string }>
): Promise<DocumentContent[]> {
    const processedDocs: DocumentContent[] = [];

    for (const file of files) {
        try {
            let content = file.content || '';

            // If file has URL (uploaded to storage), fetch content
            if (file.url && !content) {
                const response = await fetch(`${API_BASE_URL}/files/extract-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_url: file.url }),
                });
                if (response.ok) {
                    const data = await response.json();
                    content = data.text_content || '';
                }
            }

            processedDocs.push({
                type: 'file',
                filename: file.filename,
                content,
                extractedAt: new Date().toISOString(),
            });
        } catch (e) {
            console.warn(`Failed to process file ${file.filename}:`, e);
        }
    }

    return processedDocs;
}

/**
 * Process URLs and extract content
 */
async function processUrls(urls: string[]): Promise<DocumentContent[]> {
    const processedDocs: DocumentContent[] = [];

    for (const url of urls) {
        try {
            const response = await fetch(`${API_BASE_URL}/scrape/url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (response.ok) {
                const data = await response.json();
                processedDocs.push({
                    type: 'url',
                    url,
                    content: data.text_content || data.content || '',
                    extractedAt: new Date().toISOString(),
                });
            }
        } catch (e) {
            console.warn(`Failed to process URL ${url}:`, e);
        }
    }

    return processedDocs;
}

// ============================================================================
// 9-MODULE EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract company analysis data (Module 1)
 */
function extractCompanyAnalysis(content: string, apiData?: Record<string, unknown>): CompanyAnalysisData {
    const data: CompanyAnalysisData = {
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
    };

    // Use API extracted data if available
    if (apiData) {
        data.company_name = String(apiData.company_name || apiData.companyName || '');
        data.legal_name = String(apiData.legal_name || apiData.legalName || '');
        data.website = String(apiData.website || '');
        data.industry_vertical = String(apiData.industry_vertical || apiData.industryVertical || '');
        data.development_stage = (apiData.development_stage || apiData.developmentStage || 'Pre-seed') as CompanyAnalysisData['development_stage'];
        data.business_model = String(apiData.business_model || apiData.businessModel || '');
        data.country = String(apiData.country || '');
        data.state = String(apiData.state || '');
        data.city = String(apiData.city || '');
        data.one_line_description = String(apiData.one_line_description || apiData.oneLineDescription || '');
        data.company_description = String(apiData.description || apiData.companyDescription || '');
        data.product_description = String(apiData.product_description || apiData.productDescription || '');
        data.founded_year = apiData.founded_year as number | undefined;
        data.number_of_employees = apiData.number_of_employees as number | undefined;
    }

    // Fallback: Extract from content using patterns
    if (!data.company_name) {
        const namePatterns = [
            /(?:company|startup|venture)[\s:]+([A-Z][A-Za-z0-9\s&.,]+?)(?:\s*[-–—]|\s+is|\s*\n)/i,
            /^([A-Z][A-Za-z0-9\s&]+?)(?:\s*[-–—]\s*(?:pitch|deck|presentation))/im,
            /about\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*\n|\s*,)/i,
            /welcome\s+to\s+([A-Z][A-Za-z0-9\s&]+)/i,
        ];
        for (const pattern of namePatterns) {
            const match = content.match(pattern);
            if (match?.[1]) {
                data.company_name = match[1].trim().slice(0, 100);
                break;
            }
        }
    }

    // Extract description if missing
    if (!data.company_description) {
        const descPatterns = [
            /(?:we are|is a|company that|platform that|solution that)\s+([^.]+\.[^.]*\.?)/i,
            /(?:our mission|mission:)\s+([^.]+\.)/i,
            /(?:overview|about us|what we do)[\s:]+([^.]+\.[^.]*\.?)/i,
        ];
        for (const pattern of descPatterns) {
            const match = content.match(pattern);
            if (match?.[1]) {
                data.company_description = match[1].trim().slice(0, 2000);
                break;
            }
        }
    }

    // Extract website
    if (!data.website) {
        const urlMatch = content.match(/(?:www\.|https?:\/\/)([\w.-]+\.[a-z]{2,})/i);
        if (urlMatch) {
            data.website = `https://${urlMatch[1]}`;
        }
    }

    // Extract industry vertical
    if (!data.industry_vertical) {
        const industries = [
            'SaaS', 'FinTech', 'HealthTech', 'MedTech', 'EdTech', 'PropTech',
            'CleanTech', 'AgriTech', 'FoodTech', 'InsurTech', 'LegalTech',
            'MarTech', 'HRTech', 'Cybersecurity', 'AI/ML', 'Biotech',
            'E-commerce', 'Logistics', 'Gaming', 'Media', 'Enterprise',
        ];
        for (const industry of industries) {
            if (content.toLowerCase().includes(industry.toLowerCase())) {
                data.industry_vertical = industry;
                break;
            }
        }
    }

    // Extract development stage
    const stagePatterns = [
        { pattern: /pre[-\s]?seed/i, stage: 'Pre-seed' as const },
        { pattern: /seed\s*(?:stage|round)?/i, stage: 'Seed' as const },
        { pattern: /series\s*a/i, stage: 'Series A' as const },
        { pattern: /series\s*b/i, stage: 'Series B' as const },
        { pattern: /series\s*c|growth\s*stage/i, stage: 'Series C+' as const },
        { pattern: /growth/i, stage: 'Growth' as const },
    ];
    for (const { pattern, stage } of stagePatterns) {
        if (pattern.test(content)) {
            data.development_stage = stage;
            break;
        }
    }

    return data;
}

/**
 * Extract financial data (Module 2)
 */
function extractFinancialData(content: string, apiData?: Record<string, unknown>): Partial<FinancialScoreData> {
    const data: Partial<FinancialScoreData> = {};

    if (apiData) {
        Object.assign(data, {
            current_revenue: apiData.current_revenue || apiData.revenue,
            revenue_growth_rate: apiData.revenue_growth_rate,
            mrr: apiData.mrr,
            arr: apiData.arr,
            total_funding_raised: apiData.total_funding_raised || apiData.funding,
            last_funding_round: apiData.last_funding_round,
            last_funding_amount: apiData.last_funding_amount,
            valuation: apiData.valuation,
            burn_rate: apiData.burn_rate,
            runway_months: apiData.runway_months,
        });
    }

    // Extract revenue from content
    if (!data.current_revenue) {
        const revenueMatch = content.match(/revenue[:\s]*\$?([\d,.]+)\s*(million|m|k|thousand)?/i);
        if (revenueMatch) {
            let amount = parseFloat(revenueMatch[1].replace(/,/g, ''));
            const multiplier = revenueMatch[2]?.toLowerCase();
            if (multiplier === 'million' || multiplier === 'm') amount *= 1000000;
            if (multiplier === 'thousand' || multiplier === 'k') amount *= 1000;
            data.current_revenue = amount;
        }
    }

    // Extract funding
    if (!data.total_funding_raised) {
        const fundingMatch = content.match(/(?:raised|funding)[:\s]*\$?([\d,.]+)\s*(million|m|k)?/i);
        if (fundingMatch) {
            let amount = parseFloat(fundingMatch[1].replace(/,/g, ''));
            const multiplier = fundingMatch[2]?.toLowerCase();
            if (multiplier === 'million' || multiplier === 'm') amount *= 1000000;
            if (multiplier === 'thousand' || multiplier === 'k') amount *= 1000;
            data.total_funding_raised = amount;
        }
    }

    // Extract MRR/ARR
    const mrrMatch = content.match(/mrr[:\s]*\$?([\d,.]+)\s*(k|thousand)?/i);
    if (mrrMatch) {
        let amount = parseFloat(mrrMatch[1].replace(/,/g, ''));
        if (mrrMatch[2]) amount *= 1000;
        data.mrr = amount;
    }

    const arrMatch = content.match(/arr[:\s]*\$?([\d,.]+)\s*(million|m)?/i);
    if (arrMatch) {
        let amount = parseFloat(arrMatch[1].replace(/,/g, ''));
        if (arrMatch[2]) amount *= 1000000;
        data.arr = amount;
    }

    return data;
}

/**
 * Extract technology data (Module 3)
 */
function extractTechnologyData(content: string, apiData?: Record<string, unknown>): Partial<TechnologyScoreData> {
    const data: Partial<TechnologyScoreData> = {
        primary_technologies: [],
        tech_stack_description: '',
    };

    // Common technologies to look for
    const techKeywords = [
        'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'TypeScript',
        'JavaScript', 'Go', 'Rust', 'Ruby', 'PHP', 'AWS', 'Azure', 'GCP',
        'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
        'GraphQL', 'REST API', 'Machine Learning', 'AI', 'Deep Learning',
        'TensorFlow', 'PyTorch', 'Blockchain', 'IoT', 'Cloud',
    ];

    const foundTech: string[] = [];
    for (const tech of techKeywords) {
        if (new RegExp(`\\b${tech}\\b`, 'i').test(content)) {
            foundTech.push(tech);
        }
    }
    data.primary_technologies = foundTech;

    // Extract patents
    const patentMatch = content.match(/(\d+)\s*(?:patent|ip)/i);
    if (patentMatch) {
        data.patents_filed = parseInt(patentMatch[1]);
    }

    // Cloud provider
    if (/\baws\b/i.test(content)) data.cloud_provider = 'AWS';
    else if (/\bazure\b/i.test(content)) data.cloud_provider = 'Azure';
    else if (/\bgcp\b|google\s*cloud/i.test(content)) data.cloud_provider = 'GCP';

    return data;
}

/**
 * Extract market data (Module 4)
 */
function extractMarketData(content: string): Partial<MarketTrendsData> {
    const data: Partial<MarketTrendsData> = {
        main_competitors: [],
        competitive_advantages: [],
        industry_trends: [],
    };

    // Extract TAM/SAM/SOM
    const tamMatch = content.match(/tam[:\s]*\$?([\d,.]+)\s*(billion|b|million|m)?/i);
    if (tamMatch) {
        let amount = parseFloat(tamMatch[1].replace(/,/g, ''));
        const multiplier = tamMatch[2]?.toLowerCase();
        if (multiplier === 'billion' || multiplier === 'b') amount *= 1000000000;
        if (multiplier === 'million' || multiplier === 'm') amount *= 1000000;
        data.tam = amount;
    }

    const samMatch = content.match(/sam[:\s]*\$?([\d,.]+)\s*(billion|b|million|m)?/i);
    if (samMatch) {
        let amount = parseFloat(samMatch[1].replace(/,/g, ''));
        const multiplier = samMatch[2]?.toLowerCase();
        if (multiplier === 'billion' || multiplier === 'b') amount *= 1000000000;
        if (multiplier === 'million' || multiplier === 'm') amount *= 1000000;
        data.sam = amount;
    }

    // Extract competitors from "competitors" section
    const compSection = content.match(/competitors?[:\s]+([^.]+)/i);
    if (compSection) {
        const competitors = compSection[1].split(/[,\n&]/).map(c => c.trim()).filter(c => c.length > 1 && c.length < 50);
        data.main_competitors = competitors.slice(0, 10);
    }

    return data;
}

/**
 * Extract team data (Module 7)
 */
function extractTeamData(content: string, apiData?: Record<string, unknown>): Partial<TeamAssessmentData> {
    const data: Partial<TeamAssessmentData> = {
        founders: [],
        leadership_team: [],
        total_team_size: 0,
    };

    // Extract team size
    const teamMatch = content.match(/(\d+)\s*(?:employees?|team\s*members?|people)/i);
    if (teamMatch) {
        data.total_team_size = parseInt(teamMatch[1]);
    }

    // Extract founders - look for "Founder", "CEO", "Co-founder" patterns
    const founderPatterns = [
        /(?:founder|ceo|co-founder)[:\s]*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
        /([A-Z][a-z]+\s+[A-Z][a-z]+)[,\s]*(?:founder|ceo|co-founder)/gi,
    ];

    const foundersSet = new Set<string>();
    for (const pattern of founderPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
            const name = match[1].trim();
            if (name.length > 3 && name.length < 50) {
                foundersSet.add(name);
            }
        }
    }

    data.founders = Array.from(foundersSet).slice(0, 5).map(name => ({
        name,
        role: 'Founder',
    }));

    return data;
}

/**
 * Extract competitive analysis (Module 8)
 */
function extractCompetitiveAnalysis(content: string): Partial<CompetitiveAnalysisData> {
    const data: Partial<CompetitiveAnalysisData> = {
        direct_competitors: [],
        competitive_advantages: [],
        unique_value_proposition: '',
    };

    // Extract competitive advantages
    const advantagePatterns = [
        /(?:advantage|differentiat|unique)[:\s]+([^.\n]+)/gi,
        /(?:we are|we're)\s+(?:the\s+)?(?:only|first|best)[^.]+/gi,
    ];

    const advantages = new Set<string>();
    for (const pattern of advantagePatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
            const adv = match[1]?.trim() || match[0].trim();
            if (adv.length > 10 && adv.length < 200) {
                advantages.add(adv);
            }
        }
    }
    data.competitive_advantages = Array.from(advantages).slice(0, 5);

    // Extract UVP
    const uvpMatch = content.match(/(?:value\s*proposition|uvp)[:\s]+([^.\n]+)/i);
    if (uvpMatch) {
        data.unique_value_proposition = uvpMatch[1].trim().slice(0, 500);
    } else {
        // Try to find "We help/enable" statements
        const helpMatch = content.match(/we\s+(?:help|enable|allow|empower)[^.]+\./i);
        if (helpMatch) {
            data.unique_value_proposition = helpMatch[0].trim();
        }
    }

    return data;
}

// ============================================================================
// MAIN AUTO-EXTRACTION FUNCTION
// ============================================================================

/**
 * Automatically extract data from uploaded documents
 * This is the main function called when documents are uploaded - NO MANUAL BUTTON NEEDED
 */
export async function autoExtractFromDocuments(
    files: Array<{ filename: string; content?: string; url?: string; extracted_data?: { text_content?: string } }>,
    urls: string[],
    texts: string[],
    options: {
        evaluationId?: string;
        companyId?: string;
        userId?: string;
        framework?: 'general' | 'medtech';
    } = {}
): Promise<AutoExtractionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    console.log('[AutoExtraction] Starting automatic extraction...');

    // Initialize fresh evaluation if no IDs provided
    let evaluationId = options.evaluationId;
    let companyId = options.companyId;
    let schema: StandardExtractionSchema;

    if (!evaluationId) {
        const { evaluationId: newEvalId, companyId: newCompId, schema: newSchema } = initializeFreshEvaluation();
        evaluationId = newEvalId;
        companyId = newCompId;
        schema = newSchema;
    } else {
        // Load existing schema or create new
        const stored = typeof window !== 'undefined'
            ? localStorage.getItem(EXTRACTION_STORAGE_KEY)
            : null;
        schema = stored ? JSON.parse(stored) : createFreshExtractionSchema();
        schema.identification.evaluation_id = evaluationId;
        if (companyId) schema.identification.company_id = companyId;
    }

    // Set user ID
    if (options.userId) {
        schema.identification.user_id = options.userId;
        schema.identification.created_by = options.userId;
    } else if (typeof window !== 'undefined') {
        try {
            const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            schema.identification.user_id = user.id || user.user_id || 'anonymous';
            schema.identification.created_by = user.email || user.name || 'anonymous';
        } catch {
            schema.identification.user_id = 'anonymous';
            schema.identification.created_by = 'anonymous';
        }
    }

    try {
        // Collect all content
        const allContent: string[] = [];

        // Process files - use pre-extracted content if available
        for (const file of files) {
            if (file.extracted_data?.text_content) {
                allContent.push(file.extracted_data.text_content);
            } else if (file.content) {
                allContent.push(file.content);
            }
        }

        // Add URLs content (would need to be pre-processed)
        const processedUrls = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('processedUrls') || '[]')
            : [];
        for (const urlData of processedUrls) {
            if (urlData.extracted_data?.text_content) {
                allContent.push(urlData.extracted_data.text_content);
            }
        }

        // Add direct text inputs
        allContent.push(...texts);

        const combinedContent = allContent.join('\n\n');

        if (!combinedContent.trim()) {
            warnings.push('No content found in uploaded documents');
        }

        // Call backend API for AI-powered extraction
        let apiExtractedData: Record<string, unknown> | null = null;
        try {
            const response = await fetch(`${API_BASE_URL}/analysis/extract-company-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: combinedContent,
                    framework: options.framework || 'general',
                    evaluation_id: evaluationId,
                }),
            });

            if (response.ok) {
                apiExtractedData = await response.json();
                console.log('[AutoExtraction] API extraction successful');
            } else {
                warnings.push('API extraction failed - using fallback pattern matching');
            }
        } catch (apiError) {
            console.warn('[AutoExtraction] API call failed:', apiError);
            warnings.push('API extraction unavailable - using local extraction');
        }

        // Extract data for each module
        schema.company_analysis = extractCompanyAnalysis(combinedContent, apiExtractedData || undefined);
        schema.financial_score = extractFinancialData(combinedContent, apiExtractedData || undefined);
        schema.technology_score = extractTechnologyData(combinedContent, apiExtractedData || undefined);
        schema.market_trends = extractMarketData(combinedContent);
        schema.risk_assessment = { regulatory_requirements: [], key_dependencies: [] };
        schema.ip_strength = { patent_portfolio: { filed: 0, granted: 0, pending: 0 } };
        schema.team_assessment = extractTeamData(combinedContent, apiExtractedData || undefined);
        schema.competitive_analysis = extractCompetitiveAnalysis(combinedContent);
        schema.strategic_fit = { thesis_alignment_areas: [], value_add_opportunities: [] };

        // Update extraction metadata
        const pitchDeckFile = files.find(f =>
            f.filename?.toLowerCase().includes('pitch') ||
            f.filename?.toLowerCase().includes('deck')
        );

        schema.extraction_metadata = {
            extraction_timestamp: new Date().toISOString(),
            extraction_source: apiExtractedData ? 'combination' : 'pitch_deck',
            pitch_deck_file_name: pitchDeckFile?.filename,
            extraction_confidence: apiExtractedData ? 85 : 60,
            missing_required_fields: [],
            missing_optional_fields: [],
            validation_warnings: warnings,
        };

        // Validate the extraction
        const validation = validateExtractionSchema(schema);
        if (!validation.isValid) {
            schema.extraction_metadata.missing_required_fields = validation.missingFields;
        }
        schema.extraction_metadata.validation_warnings = [...warnings, ...validation.warnings];

        // Store the extracted data
        if (typeof window !== 'undefined') {
            localStorage.setItem(EXTRACTION_STORAGE_KEY, JSON.stringify(schema));
            localStorage.setItem('current_extraction_schema', JSON.stringify(schema));

            // Also store in a format compatible with existing components
            localStorage.setItem('extractedCompanyData', JSON.stringify({
                companyName: schema.company_analysis.company_name,
                legalName: schema.company_analysis.legal_name,
                website: schema.company_analysis.website,
                companyDescription: schema.company_analysis.company_description,
                oneLineDescription: schema.company_analysis.one_line_description,
                productDescription: schema.company_analysis.product_description,
                industryVertical: schema.company_analysis.industry_vertical,
                developmentStage: schema.company_analysis.development_stage,
                businessModel: schema.company_analysis.business_model,
                country: schema.company_analysis.country,
                state: schema.company_analysis.state,
                city: schema.company_analysis.city,
                numberOfEmployees: schema.company_analysis.number_of_employees,
                foundedYear: schema.company_analysis.founded_year,
            }));
        }

        const processingTimeMs = Date.now() - startTime;
        console.log(`[AutoExtraction] Completed in ${processingTimeMs}ms`);

        return {
            success: true,
            extractionId: evaluationId,
            data: schema,
            confidence: schema.extraction_metadata.extraction_confidence,
            warnings,
            errors,
            processingTimeMs,
        };

    } catch (error) {
        console.error('[AutoExtraction] Extraction failed:', error);
        errors.push(error instanceof Error ? error.message : 'Unknown extraction error');

        return {
            success: false,
            extractionId: evaluationId,
            data: schema,
            confidence: 0,
            warnings,
            errors,
            processingTimeMs: Date.now() - startTime,
        };
    }
}

/**
 * Get the current extraction data
 */
export function getCurrentExtractionData(): StandardExtractionSchema | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(EXTRACTION_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

/**
 * Update extraction data (for user edits)
 */
export function updateExtractionData(updates: Partial<StandardExtractionSchema>): void {
    if (typeof window === 'undefined') return;

    const current = getCurrentExtractionData() || createFreshExtractionSchema();
    const updated = {
        ...current,
        ...updates,
        extraction_metadata: {
            ...current.extraction_metadata,
            ...updates.extraction_metadata,
            extraction_timestamp: new Date().toISOString(),
        },
    };

    localStorage.setItem(EXTRACTION_STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Convert extraction schema to company info format used by evaluation page
 */
export function extractionSchemaToCompanyInfo(schema: StandardExtractionSchema): Record<string, unknown> {
    return {
        companyName: schema.company_analysis.company_name,
        legalName: schema.company_analysis.legal_name,
        website: schema.company_analysis.website,
        companyDescription: schema.company_analysis.company_description,
        oneLineDescription: schema.company_analysis.one_line_description,
        productDescription: schema.company_analysis.product_description,
        industryVertical: schema.company_analysis.industry_vertical,
        developmentStage: schema.company_analysis.development_stage,
        businessModel: schema.company_analysis.business_model,
        country: schema.company_analysis.country,
        state: schema.company_analysis.state,
        city: schema.company_analysis.city,
        numberOfEmployees: schema.company_analysis.number_of_employees,
        foundedYear: schema.company_analysis.founded_year,
        pitchDeckPath: schema.extraction_metadata.pitch_deck_file_name,
    };
}

// ============================================================================
// UNIQUE INDEXING HELPERS
// ============================================================================

/**
 * Create a unique report with proper indexing
 */
export function createUniqueReportIndex(
    evaluationId: string,
    companyId: string,
    userId: string,
    reportType: 'Triage' | 'Due Diligence' | 'Full Assessment'
): {
    reportId: string;
    primaryKey: string;
    foreignKeys: {
        evaluation_id: string;
        company_id: string;
        user_id: string;
    };
    metadata: {
        created_at: string;
        report_type: string;
        version: number;
    };
} {
    const reportId = generateReportId();

    return {
        reportId,
        primaryKey: reportId,
        foreignKeys: {
            evaluation_id: evaluationId,
            company_id: companyId,
            user_id: userId,
        },
        metadata: {
            created_at: new Date().toISOString(),
            report_type: reportType,
            version: 1,
        },
    };
}

/**
 * Save report with unique indexing to storage and API
 */
export async function saveReportWithIndex(
    reportData: Record<string, unknown>,
    indexData: ReturnType<typeof createUniqueReportIndex>
): Promise<{ success: boolean; savedId: string; error?: string }> {
    const fullReport = {
        ...reportData,
        id: indexData.reportId,
        report_id: indexData.reportId,
        primary_key: indexData.primaryKey,
        evaluation_id: indexData.foreignKeys.evaluation_id,
        company_id: indexData.foreignKeys.company_id,
        user_id: indexData.foreignKeys.user_id,
        created_at: indexData.metadata.created_at,
        report_type: indexData.metadata.report_type,
        version: indexData.metadata.version,
    };

    try {
        // Save to API
        const response = await fetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullReport),
        });

        if (!response.ok) {
            throw new Error(`API save failed: ${response.status}`);
        }

        // Also save to localStorage for offline access
        if (typeof window !== 'undefined') {
            const storedReports = JSON.parse(localStorage.getItem('stored_reports') || '[]');
            storedReports.push(fullReport);
            localStorage.setItem('stored_reports', JSON.stringify(storedReports));
        }

        return { success: true, savedId: indexData.reportId };

    } catch (error) {
        console.error('[AutoExtraction] Failed to save report:', error);

        // Fallback: save to localStorage
        if (typeof window !== 'undefined') {
            const storedReports = JSON.parse(localStorage.getItem('stored_reports') || '[]');
            storedReports.push(fullReport);
            localStorage.setItem('stored_reports', JSON.stringify(storedReports));
        }

        return {
            success: false,
            savedId: indexData.reportId,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Export utility functions
export {
    generateEvaluationId,
    generateCompanyId,
    generateReportId,
};
