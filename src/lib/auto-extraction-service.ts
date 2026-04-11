/**
 * Auto-Extraction Service
 * 
 * Automated data extraction from pitch decks for 9-module TCA analysis.
 * Removes manual "Extract Data" button - extraction happens automatically on document upload.
 * 
 * Standard extraction schema for consistent analysis and report generation.
 */

// ========================================
// UNIQUE IDENTIFIER GENERATION
// ========================================

/**
 * Generate unique evaluation ID
 * Format: EVAL-{timestamp}-{random}
 */
export function generateEvaluationId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EVAL-${timestamp}-${random}`;
}

/**
 * Generate unique report ID
 * Format: RPT-{type}-{timestamp}-{random}
 */
export function generateReportId(reportType: 'triage' | 'dd'): string {
    const prefix = reportType === 'dd' ? 'DD' : 'TR';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RPT-${prefix}-${timestamp}-${random}`;
}

/**
 * Generate unique company ID from name
 * Format: CO-{normalized_name}-{hash}
 */
export function generateCompanyId(companyName: string): string {
    const normalized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 16);
    const hash = Array.from(companyName).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    return `CO-${normalized}-${Math.abs(hash).toString(36).toUpperCase().substring(0, 6)}`;
}

// ========================================
// 9-MODULE STANDARD EXTRACTION SCHEMA
// ========================================

/**
 * Standard extraction schema for 9-module TCA analysis
 * All evaluations must extract these fields for consistent analysis
 */
export interface ExtractionSchema {
    // Core identifiers (auto-generated)
    evaluationId: string;
    companyId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;

    // Company Basic Info (extracted from pitch deck)
    company: {
        name: string;
        legalName: string;
        website: string;
        foundedYear: number | null;
        country: string;
        state: string;
        city: string;
        oneLineDescription: string;
        fullDescription: string;
    };

    // Module 1: Leadership & Team
    leadership: {
        founderCount: number;
        founderNames: string[];
        founderExperience: string[];
        hasCofounder: boolean;
        ceoBackground: string;
        teamSize: number;
        keyHires: string[];
        advisors: string[];
        boardMembers: string[];
    };

    // Module 2: Product-Market Fit
    productMarketFit: {
        productDescription: string;
        uniqueValueProposition: string;
        targetCustomer: string;
        problemStatement: string;
        solutionApproach: string;
        productStage: string; // prototype, mvp, beta, launched, scaling
        keyFeatures: string[];
    };

    // Module 3: Technology & IP
    technology: {
        techStack: string[];
        proprietaryTech: boolean;
        patents: number;
        patentsPending: number;
        ipStrategy: string;
        techDifferentiator: string;
        scalabilityPlan: string;
    };

    // Module 4: Financials
    financials: {
        revenueModel: string;
        currentRevenue: number | null;
        revenueGrowthRate: number | null;
        grossMargin: number | null;
        burnRate: number | null;
        runway: number | null; // months
        previousFunding: number | null;
        fundingRounds: string[];
        seekingAmount: number | null;
        valuation: number | null;
        unitEconomics: string;
    };

    // Module 5: Market & Competition
    market: {
        industryVertical: string;
        marketSize: number | null; // TAM
        servicableMarket: number | null; // SAM
        targetMarket: number | null; // SOM
        marketGrowthRate: number | null;
        competitors: string[];
        competitiveAdvantage: string;
        barriers: string[];
    };

    // Module 6: Go-to-Market
    goToMarket: {
        gtmStrategy: string;
        salesModel: string; // direct, channel, freemium, enterprise
        customerAcquisitionCost: number | null;
        lifetimeValue: number | null;
        marketingChannels: string[];
        partnershipStrategy: string;
        distributionModel: string;
    };

    // Module 7: Traction & Metrics
    traction: {
        currentCustomers: number | null;
        monthlyActiveUsers: number | null;
        growthMetrics: string;
        keyMilestones: string[];
        pilotsOrTrials: string[];
        testimonials: string[];
        pressOrAwards: string[];
    };

    // Module 8: Risk Factors
    risks: {
        regulatoryRisks: string[];
        marketRisks: string[];
        executionRisks: string[];
        technologyRisks: string[];
        financialRisks: string[];
        mitigationStrategies: string[];
    };

    // Module 9: Exit & Scalability
    exitStrategy: {
        exitOptions: string[];
        comparableExits: string[];
        scalabilityPlan: string;
        internationalExpansion: string;
        fiveYearVision: string;
    };

    // Development Stage (normalized)
    developmentStage: 'Pre-seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'Growth' | 'Pre-IPO' | '';

    // Extraction metadata
    extractionMetadata: {
        sourcesProcessed: number;
        extractionConfidence: number;
        extractedAt: string;
        version: string;
    };
}

// ========================================
// DEFAULT EMPTY EXTRACTION
// ========================================

export function createEmptyExtraction(userId: string): ExtractionSchema {
    const now = new Date().toISOString();
    const evaluationId = generateEvaluationId();

    return {
        evaluationId,
        companyId: '',
        userId,
        createdAt: now,
        updatedAt: now,

        company: {
            name: '',
            legalName: '',
            website: '',
            foundedYear: null,
            country: '',
            state: '',
            city: '',
            oneLineDescription: '',
            fullDescription: '',
        },

        leadership: {
            founderCount: 0,
            founderNames: [],
            founderExperience: [],
            hasCofounder: false,
            ceoBackground: '',
            teamSize: 0,
            keyHires: [],
            advisors: [],
            boardMembers: [],
        },

        productMarketFit: {
            productDescription: '',
            uniqueValueProposition: '',
            targetCustomer: '',
            problemStatement: '',
            solutionApproach: '',
            productStage: '',
            keyFeatures: [],
        },

        technology: {
            techStack: [],
            proprietaryTech: false,
            patents: 0,
            patentsPending: 0,
            ipStrategy: '',
            techDifferentiator: '',
            scalabilityPlan: '',
        },

        financials: {
            revenueModel: '',
            currentRevenue: null,
            revenueGrowthRate: null,
            grossMargin: null,
            burnRate: null,
            runway: null,
            previousFunding: null,
            fundingRounds: [],
            seekingAmount: null,
            valuation: null,
            unitEconomics: '',
        },

        market: {
            industryVertical: '',
            marketSize: null,
            servicableMarket: null,
            targetMarket: null,
            marketGrowthRate: null,
            competitors: [],
            competitiveAdvantage: '',
            barriers: [],
        },

        goToMarket: {
            gtmStrategy: '',
            salesModel: '',
            customerAcquisitionCost: null,
            lifetimeValue: null,
            marketingChannels: [],
            partnershipStrategy: '',
            distributionModel: '',
        },

        traction: {
            currentCustomers: null,
            monthlyActiveUsers: null,
            growthMetrics: '',
            keyMilestones: [],
            pilotsOrTrials: [],
            testimonials: [],
            pressOrAwards: [],
        },

        risks: {
            regulatoryRisks: [],
            marketRisks: [],
            executionRisks: [],
            technologyRisks: [],
            financialRisks: [],
            mitigationStrategies: [],
        },

        exitStrategy: {
            exitOptions: [],
            comparableExits: [],
            scalabilityPlan: '',
            internationalExpansion: '',
            fiveYearVision: '',
        },

        developmentStage: '',

        extractionMetadata: {
            sourcesProcessed: 0,
            extractionConfidence: 0,
            extractedAt: now,
            version: '1.0.0',
        },
    };
}

// ========================================
// AUTOMATED EXTRACTION ENGINE
// ========================================

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

/**
 * Automatic extraction from uploaded documents
 * Called automatically when documents are uploaded - NO manual button needed
 */
export async function autoExtractFromDocuments(
    documents: { type: 'file' | 'url' | 'text'; content: string; name?: string }[],
    userId: string,
    framework: 'general' | 'medtech' = 'general'
): Promise<ExtractionSchema> {
    const extraction = createEmptyExtraction(userId);

    if (documents.length === 0) {
        return extraction;
    }

    try {
        // Combine all content for extraction
        const allContent = documents.map(doc => doc.content).join('\n\n---DOCUMENT_SEPARATOR---\n\n');

        // Call backend extraction API
        const response = await fetch(`${BACKEND_API}/api/v1/analysis/extract-company-info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: allContent,
                framework,
                schema: '9-module-v1',
            }),
        });

        if (response.ok) {
            const extractedData = await response.json();
            return mapApiResponseToSchema(extractedData, extraction);
        } else {
            // Fallback to local pattern extraction
            return localPatternExtraction(allContent, extraction);
        }
    } catch (error) {
        console.error('Auto-extraction failed:', error);
        // Fallback to local pattern extraction
        const allContent = documents.map(doc => doc.content).join('\n\n');
        return localPatternExtraction(allContent, extraction);
    }
}

/**
 * Map API response to standard schema
 */
function mapApiResponseToSchema(
    apiData: Record<string, unknown>,
    base: ExtractionSchema
): ExtractionSchema {
    const extraction = { ...base };
    const now = new Date().toISOString();

    // Map company info
    extraction.company.name = getString(apiData.company_name || apiData.companyName);
    extraction.company.legalName = getString(apiData.legal_name || apiData.legalName);
    extraction.company.website = normalizeWebsite(getString(apiData.website));
    extraction.company.foundedYear = getNumber(apiData.founded_year || apiData.foundedYear);
    extraction.company.country = getString(apiData.country);
    extraction.company.state = getString(apiData.state);
    extraction.company.city = getString(apiData.city);
    extraction.company.oneLineDescription = getString(apiData.one_line_description || apiData.oneLineDescription);
    extraction.company.fullDescription = getString(apiData.description || apiData.companyDescription);

    // Generate company ID
    if (extraction.company.name) {
        extraction.companyId = generateCompanyId(extraction.company.name);
    }

    // Map leadership
    extraction.leadership.founderNames = getStringArray(apiData.founders || apiData.founderNames);
    extraction.leadership.founderCount = extraction.leadership.founderNames.length;
    extraction.leadership.hasCofounder = extraction.leadership.founderCount > 1;
    extraction.leadership.teamSize = getNumber(apiData.team_size || apiData.numberOfEmployees) || 0;
    extraction.leadership.ceoBackground = getString(apiData.ceo_background);
    extraction.leadership.advisors = getStringArray(apiData.advisors);
    extraction.leadership.boardMembers = getStringArray(apiData.board_members);

    // Map product-market fit
    extraction.productMarketFit.productDescription = getString(apiData.product_description || apiData.productDescription);
    extraction.productMarketFit.uniqueValueProposition = getString(apiData.value_proposition || apiData.uvp);
    extraction.productMarketFit.targetCustomer = getString(apiData.target_customer || apiData.targetMarket);
    extraction.productMarketFit.problemStatement = getString(apiData.problem);
    extraction.productMarketFit.solutionApproach = getString(apiData.solution);
    extraction.productMarketFit.productStage = getString(apiData.product_stage);
    extraction.productMarketFit.keyFeatures = getStringArray(apiData.features || apiData.keyFeatures);

    // Map technology
    extraction.technology.techStack = getStringArray(apiData.tech_stack || apiData.technology);
    extraction.technology.patents = getNumber(apiData.patents) || 0;
    extraction.technology.patentsPending = getNumber(apiData.patents_pending) || 0;
    extraction.technology.proprietaryTech = Boolean(apiData.proprietary_tech || extraction.technology.patents > 0);
    extraction.technology.techDifferentiator = getString(apiData.tech_differentiator);

    // Map financials
    extraction.financials.revenueModel = getString(apiData.revenue_model || apiData.businessModel);
    extraction.financials.currentRevenue = getNumber(apiData.revenue || apiData.current_revenue);
    extraction.financials.revenueGrowthRate = getNumber(apiData.revenue_growth);
    extraction.financials.grossMargin = getNumber(apiData.gross_margin);
    extraction.financials.burnRate = getNumber(apiData.burn_rate);
    extraction.financials.runway = getNumber(apiData.runway);
    extraction.financials.previousFunding = getNumber(apiData.total_funding || apiData.previous_funding);
    extraction.financials.fundingRounds = getStringArray(apiData.funding_rounds);
    extraction.financials.seekingAmount = getNumber(apiData.seeking || apiData.raise_amount);
    extraction.financials.valuation = getNumber(apiData.valuation);
    extraction.financials.unitEconomics = getString(apiData.unit_economics);

    // Map market
    extraction.market.industryVertical = normalizeIndustry(getString(apiData.industry || apiData.industryVertical));
    extraction.market.marketSize = getNumber(apiData.tam || apiData.market_size);
    extraction.market.servicableMarket = getNumber(apiData.sam);
    extraction.market.targetMarket = getNumber(apiData.som);
    extraction.market.marketGrowthRate = getNumber(apiData.market_growth);
    extraction.market.competitors = getStringArray(apiData.competitors);
    extraction.market.competitiveAdvantage = getString(apiData.competitive_advantage);
    extraction.market.barriers = getStringArray(apiData.barriers_to_entry);

    // Map go-to-market
    extraction.goToMarket.gtmStrategy = getString(apiData.gtm_strategy);
    extraction.goToMarket.salesModel = getString(apiData.sales_model);
    extraction.goToMarket.customerAcquisitionCost = getNumber(apiData.cac);
    extraction.goToMarket.lifetimeValue = getNumber(apiData.ltv);
    extraction.goToMarket.marketingChannels = getStringArray(apiData.marketing_channels);
    extraction.goToMarket.partnershipStrategy = getString(apiData.partnerships);
    extraction.goToMarket.distributionModel = getString(apiData.distribution);

    // Map traction
    extraction.traction.currentCustomers = getNumber(apiData.customers || apiData.customer_count);
    extraction.traction.monthlyActiveUsers = getNumber(apiData.mau || apiData.users);
    extraction.traction.growthMetrics = getString(apiData.growth_metrics);
    extraction.traction.keyMilestones = getStringArray(apiData.milestones);
    extraction.traction.pilotsOrTrials = getStringArray(apiData.pilots);
    extraction.traction.testimonials = getStringArray(apiData.testimonials);
    extraction.traction.pressOrAwards = getStringArray(apiData.press || apiData.awards);

    // Map risks
    extraction.risks.regulatoryRisks = getStringArray(apiData.regulatory_risks);
    extraction.risks.marketRisks = getStringArray(apiData.market_risks);
    extraction.risks.executionRisks = getStringArray(apiData.execution_risks);
    extraction.risks.technologyRisks = getStringArray(apiData.technology_risks);
    extraction.risks.financialRisks = getStringArray(apiData.financial_risks);
    extraction.risks.mitigationStrategies = getStringArray(apiData.risk_mitigation);

    // Map exit strategy
    extraction.exitStrategy.exitOptions = getStringArray(apiData.exit_options);
    extraction.exitStrategy.comparableExits = getStringArray(apiData.comparable_exits);
    extraction.exitStrategy.scalabilityPlan = getString(apiData.scalability_plan);
    extraction.exitStrategy.internationalExpansion = getString(apiData.international_expansion);
    extraction.exitStrategy.fiveYearVision = getString(apiData.five_year_vision);

    // Map development stage
    extraction.developmentStage = normalizeStage(getString(apiData.development_stage || apiData.stage));

    // Update metadata
    extraction.extractionMetadata.extractedAt = now;
    extraction.extractionMetadata.extractionConfidence = getNumber(apiData.confidence) || 70;
    extraction.extractionMetadata.sourcesProcessed = getNumber(apiData.sources_processed) || 1;
    extraction.updatedAt = now;

    return extraction;
}

/**
 * Local pattern-based extraction fallback
 */
function localPatternExtraction(content: string, base: ExtractionSchema): ExtractionSchema {
    const extraction = { ...base };
    const now = new Date().toISOString();

    // Extract company name
    const namePatterns = [
        /^([A-Z][A-Za-z0-9\s&]+)(?:\s*[-–—]\s*(?:Pitch|Deck|Presentation))/im,
        /company[:\s]+["']?([A-Z][A-Za-z0-9\s&]+)["']?/i,
        /(?:about|introducing)\s+([A-Z][A-Za-z0-9\s&]+)/i,
    ];
    for (const pattern of namePatterns) {
        const match = content.match(pattern);
        if (match?.[1]) {
            extraction.company.name = match[1].trim().substring(0, 100);
            extraction.companyId = generateCompanyId(extraction.company.name);
            break;
        }
    }

    // Extract description
    const descPatterns = [
        /(?:we are|is a|company that)\s+([^.]+\.)/i,
        /(?:our mission|mission:)\s+([^.]+\.)/i,
    ];
    for (const pattern of descPatterns) {
        const match = content.match(pattern);
        if (match?.[1]) {
            extraction.company.fullDescription = match[1].trim().substring(0, 1000);
            break;
        }
    }

    // Extract funding amount
    const fundingMatch = content.match(/raising\s*\$?([\d,.]+)\s*(million|M|thousand|K)/i);
    if (fundingMatch) {
        let amount = parseFloat(fundingMatch[1].replace(/,/g, ''));
        if (fundingMatch[2].toLowerCase().includes('m')) amount *= 1000000;
        else if (fundingMatch[2].toLowerCase().includes('k') || fundingMatch[2].toLowerCase().includes('thousand')) amount *= 1000;
        extraction.financials.seekingAmount = amount;
    }

    // Extract team size
    const teamMatch = content.match(/(\d+)\s*(?:employees|team members|people)/i);
    if (teamMatch) {
        extraction.leadership.teamSize = parseInt(teamMatch[1], 10);
    }

    // Extract customers
    const customerMatch = content.match(/(\d+(?:,\d+)?)\s*(?:customers|clients|users)/i);
    if (customerMatch) {
        extraction.traction.currentCustomers = parseInt(customerMatch[1].replace(/,/g, ''), 10);
    }

    // Extract stage
    const stagePatterns = [
        /(?:seed|pre-seed|series\s*[a-c]|growth)\s*(?:stage|round)/gi,
        /(?:currently|at)\s*(?:the\s*)?(seed|pre-seed|series\s*[a-c]|growth)/gi,
    ];
    for (const pattern of stagePatterns) {
        const match = content.match(pattern);
        if (match?.[0]) {
            extraction.developmentStage = normalizeStage(match[0]);
            break;
        }
    }

    // Extract industry
    const industryPatterns = [
        /(?:industry|sector|vertical)[:\s]+([A-Za-z\s/]+)/i,
        /(?:fintech|healthtech|medtech|saas|software|ai|ml|biotech|cleantech|edtech)/gi,
    ];
    for (const pattern of industryPatterns) {
        const match = content.match(pattern);
        if (match) {
            extraction.market.industryVertical = normalizeIndustry(match[1] || match[0]);
            break;
        }
    }

    // Extract website
    const urlMatch = content.match(/(?:www\.|https?:\/\/)([\w.-]+\.\w{2,})/i);
    if (urlMatch) {
        extraction.company.website = normalizeWebsite(urlMatch[0]);
    }

    // Update metadata
    extraction.extractionMetadata.extractedAt = now;
    extraction.extractionMetadata.extractionConfidence = 40; // Lower confidence for pattern extraction
    extraction.extractionMetadata.sourcesProcessed = 1;
    extraction.updatedAt = now;

    return extraction;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function getNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[,$]/g, ''));
    return isNaN(num) ? null : num;
}

function getStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return [];
}

function normalizeWebsite(url: string): string {
    if (!url) return '';
    url = url.trim().toLowerCase();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    return url;
}

function normalizeIndustry(industry: string): string {
    if (!industry) return '';
    const mappings: Record<string, string> = {
        'saas': 'Software/SaaS',
        'software': 'Software/SaaS',
        'fintech': 'FinTech',
        'healthtech': 'HealthTech/MedTech',
        'medtech': 'HealthTech/MedTech',
        'biotech': 'BioTech',
        'edtech': 'EdTech',
        'cleantech': 'CleanTech',
        'ai': 'AI/ML',
        'ml': 'AI/ML',
    };
    const lower = industry.toLowerCase().trim();
    return mappings[lower] || industry;
}

function normalizeStage(stage: string): ExtractionSchema['developmentStage'] {
    if (!stage) return '';
    const lower = stage.toLowerCase().replace(/\s+/g, '').trim();
    const mappings: Record<string, ExtractionSchema['developmentStage']> = {
        'preseed': 'Pre-seed',
        'pre-seed': 'Pre-seed',
        'seed': 'Seed',
        'seriesa': 'Series A',
        'seriesb': 'Series B',
        'seriesc': 'Series C+',
        'seriesd': 'Series C+',
        'growth': 'Growth',
        'preipo': 'Pre-IPO',
    };
    return mappings[lower] || '';
}

// ========================================
// FRESH EVALUATION STATE MANAGEMENT
// ========================================

const EVALUATION_STORAGE_KEY = 'tca_current_evaluation';
const EVALUATION_HISTORY_KEY = 'tca_evaluation_history';

/**
 * Start a fresh evaluation - CLEARS ALL PREVIOUS DATA
 * Call this when starting a new evaluation to ensure independence
 */
export function startFreshEvaluation(userId: string): ExtractionSchema {
    // Clear all previous evaluation data
    clearEvaluationState();

    // Create new extraction
    const extraction = createEmptyExtraction(userId);

    // Store in session
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(extraction));
    }

    return extraction;
}

/**
 * Clear all evaluation state - ensures fresh start
 */
export function clearEvaluationState(): void {
    if (typeof window === 'undefined') return;

    // Clear sessionStorage
    const sessionKeys = [
        EVALUATION_STORAGE_KEY,
        'tca_company_info',
        'tca_uploaded_files',
        'tca_processed_files',
        'tca_extraction_data',
        'tca_analysis_results',
        'tca_module_config',
        'tca_analysis_tracking',
    ];
    sessionKeys.forEach(key => sessionStorage.removeItem(key));

    // Clear localStorage evaluation data (but keep history)
    const localKeys = [
        'evaluation_autosave',
        'processedFiles',
        'processedUrls',
        'processedTexts',
        'analysisCompanyName',
        'analysisData',
        'companyData',
        // Analysis result and report data
        'analysisResult',
        'analysisTrackingInfo',
        'currentEvaluationId',
        'currentAnalysisId',
        'currentSimulationId',
        'reportApprovalStatus',
        'simulationAdjusted',
        'triageReportReady',
        'analysisDuration',
        'analysisFramework',
        'currentReportType',
        // Additional analysis state
        'analysisCompanyId',
        'analysisEvaluationId',
        'storedTrackingParams',
        'whatIfAdjustments',
        // Company and evaluation form data
        'selectedCompanyId',
        'selectedCompanyName',
        'evaluationFormData',
        'pitchDeckProcessed',
    ];
    localKeys.forEach(key => localStorage.removeItem(key));

    // Dispatch event for components to react
    window.dispatchEvent(new CustomEvent('tca_evaluation_reset'));
}

/**
 * Save current evaluation to history before starting new one
 */
export function archiveCurrentEvaluation(): void {
    if (typeof window === 'undefined') return;

    const current = sessionStorage.getItem(EVALUATION_STORAGE_KEY);
    if (!current) return;

    const history = JSON.parse(localStorage.getItem(EVALUATION_HISTORY_KEY) || '[]');
    const parsed = JSON.parse(current);

    // Only archive if it has meaningful data
    if (parsed.company?.name) {
        history.unshift({
            ...parsed,
            archivedAt: new Date().toISOString(),
        });
        // Keep only last 10 evaluations
        localStorage.setItem(EVALUATION_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    }
}

/**
 * Get current evaluation or create fresh one
 */
export function getCurrentEvaluation(userId: string): ExtractionSchema {
    if (typeof window === 'undefined') {
        return createEmptyExtraction(userId);
    }

    const stored = sessionStorage.getItem(EVALUATION_STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        // Verify it belongs to the same user
        if (parsed.userId === userId) {
            return parsed;
        }
    }

    // Start fresh if no valid evaluation found
    return startFreshEvaluation(userId);
}

/**
 * Update current evaluation
 */
export function updateCurrentEvaluation(updates: Partial<ExtractionSchema>): void {
    if (typeof window === 'undefined') return;

    const current = sessionStorage.getItem(EVALUATION_STORAGE_KEY);
    if (!current) return;

    const parsed = JSON.parse(current);
    const updated = {
        ...parsed,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    sessionStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(updated));
}

// ========================================
// REPORT TRACKING RECORD
// ========================================

export interface ReportTrackingRecord {
    reportId: string;
    evaluationId: string;
    companyId: string;
    companyName: string;
    userId: string;
    userEmail: string;
    reportType: 'triage' | 'dd';
    createdAt: string;
    status: 'generating' | 'completed' | 'failed';
    modulesAnalyzed: string[];
    overallScore: number | null;
    documentIds: string[];
}

/**
 * Create report tracking record
 */
export function createReportRecord(
    extraction: ExtractionSchema,
    reportType: 'triage' | 'dd',
    userEmail: string,
    modulesAnalyzed: string[]
): ReportTrackingRecord {
    return {
        reportId: generateReportId(reportType),
        evaluationId: extraction.evaluationId,
        companyId: extraction.companyId,
        companyName: extraction.company.name,
        userId: extraction.userId,
        userEmail,
        reportType,
        createdAt: new Date().toISOString(),
        status: 'generating',
        modulesAnalyzed,
        overallScore: null,
        documentIds: [],
    };
}

// ========================================
// EXPORTS
// ========================================

export default {
    generateEvaluationId,
    generateReportId,
    generateCompanyId,
    createEmptyExtraction,
    autoExtractFromDocuments,
    startFreshEvaluation,
    clearEvaluationState,
    archiveCurrentEvaluation,
    getCurrentEvaluation,
    updateCurrentEvaluation,
    createReportRecord,
};
