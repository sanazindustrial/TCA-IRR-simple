/**
 * Workflow Automation Service
 * 
 * Automates the complete TCA-IRR analysis workflow:
 * 1. Evaluation - Company data input and document extraction
 * 2. External Data - Fetch data from external sources automatically
 * 3. Module Configuration - Validate and apply module settings
 * 4. Run Analysis - Execute enabled modules
 * 5. What-If Analysis - Allow score adjustments
 * 6. Report Generation - Generate triage/DD reports
 * 7. Reviewer Approval - Submit for review
 * 
 * All steps share the same tracking ID for end-to-end traceability
 */

import { unifiedRecordTracking, generateEvaluationId, generateAnalysisId, generateReportId, generateSimulationId, UnifiedRecord, AnalysisModuleResult } from './unified-record-tracking';
import { settingsApi, ModuleSetting } from './settings-api';
import { fetchExternalData, enrichAnalysisWithExternalData, AggregatedExternalData } from './external-data-fetcher';
import { reportStorage, StoredReport } from './report-storage';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';

// Type for report metadata used locally in workflow
interface ReportMetadata {
    id: string;
    companyName: string;
    reportType: 'triage' | 'dd';
    version: number;
    createdAt: string;
    createdBy: string;
    status: string;
    evaluationId: string;
    companyId: string;
    framework: 'general' | 'medtech';
}

// ============================================================================
// Workflow State Types
// ============================================================================

export interface WorkflowStep {
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'error';
    startedAt?: string;
    completedAt?: string;
    error?: string;
    data?: any;
}

export interface WorkflowState {
    evaluationId: string;
    companyId: string;
    userId: string;
    userName: string;
    companyName: string;
    framework: 'general' | 'medtech';
    steps: WorkflowStep[];
    currentStep: string;
    analysisResult?: ComprehensiveAnalysisOutput;
    externalData?: AggregatedExternalData;
    simulationData?: any;
    reportId?: string;
    reportType?: 'triage' | 'dd';
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Workflow Steps Configuration
// ============================================================================

export const WORKFLOW_STEPS = [
    { id: 'evaluation', name: 'Upload Documents & Company Info', index: 0 },
    { id: 'company-info', name: 'Company Information', index: 1 },
    { id: 'external-data', name: 'External Data Sources', index: 2 },
    { id: 'module-config', name: 'Module Configuration', index: 3 },
    { id: 'run-analysis', name: 'Run Analysis', index: 4 },
    { id: 'what-if', name: 'What-If Analysis', index: 5 },
    { id: 'report-generation', name: 'Generate Report', index: 6 },
    { id: 'reviewer-approval', name: 'Reviewer Approval', index: 7 },
];

const STORAGE_KEY = 'tca_workflow_state';

// ============================================================================
// Workflow Class
// ============================================================================

class WorkflowAutomation {
    private static instance: WorkflowAutomation;
    private state: WorkflowState | null = null;

    private constructor() { }

    public static getInstance(): WorkflowAutomation {
        if (!WorkflowAutomation.instance) {
            WorkflowAutomation.instance = new WorkflowAutomation();
        }
        return WorkflowAutomation.instance;
    }

    // Initialize a new workflow
    public initializeWorkflow(companyName: string, framework: 'general' | 'medtech' = 'general'): WorkflowState {
        const user = this.getCurrentUser();
        const evaluationId = generateEvaluationId();
        const companyId = this.generateCompanyId(companyName);

        const state: WorkflowState = {
            evaluationId,
            companyId,
            userId: user.id,
            userName: user.name,
            companyName,
            framework,
            steps: WORKFLOW_STEPS.map(step => ({
                id: step.id,
                name: step.name,
                status: step.index === 0 ? 'in-progress' : 'pending'
            })),
            currentStep: 'evaluation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.state = state;
        this.saveState();

        // Also create unified record for tracking
        unifiedRecordTracking.createRecord(companyName, framework);

        console.log('[WorkflowAutomation] Initialized new workflow:', evaluationId);
        return state;
    }

    // Get current workflow state
    public getState(): WorkflowState | null {
        if (!this.state) {
            this.loadState();
        }
        return this.state;
    }

    // Load state from localStorage
    private loadState(): void {
        if (typeof window === 'undefined') return;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.state = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('[WorkflowAutomation] Failed to load state:', e);
        }
    }

    // Save state to localStorage
    private saveState(): void {
        if (typeof window === 'undefined' || !this.state) return;
        try {
            this.state.updatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.warn('[WorkflowAutomation] Failed to save state:', e);
        }
    }

    // Update step status
    public updateStep(stepId: string, status: WorkflowStep['status'], data?: any, error?: string): void {
        if (!this.state) return;

        const step = this.state.steps.find(s => s.id === stepId);
        if (step) {
            step.status = status;
            if (status === 'in-progress') {
                step.startedAt = new Date().toISOString();
            }
            if (status === 'completed' || status === 'error') {
                step.completedAt = new Date().toISOString();
            }
            if (data) step.data = data;
            if (error) step.error = error;
        }

        this.saveState();
    }

    // Move to next step
    public nextStep(): string | null {
        if (!this.state) return null;

        const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === this.state!.currentStep);
        if (currentIndex < 0 || currentIndex >= WORKFLOW_STEPS.length - 1) return null;

        const nextStep = WORKFLOW_STEPS[currentIndex + 1];
        this.state.currentStep = nextStep.id;
        this.updateStep(nextStep.id, 'in-progress');
        this.saveState();

        return nextStep.id;
    }

    // Complete current step and move to next
    public completeCurrentStep(data?: any): string | null {
        if (!this.state) return null;

        this.updateStep(this.state.currentStep, 'completed', data);
        return this.nextStep();
    }

    // Get current user from localStorage
    private getCurrentUser(): { id: string; name: string; email: string; role: string } {
        if (typeof window === 'undefined') {
            return { id: 'system', name: 'System', email: 'system@tca-irr.com', role: 'system' };
        }
        try {
            const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            return {
                id: user.id || user.user_id || 'anonymous',
                name: user.name || user.email?.split('@')[0] || 'Anonymous',
                email: user.email || 'anonymous@tca-irr.com',
                role: user.role?.toLowerCase() || 'user',
            };
        } catch {
            return { id: 'anonymous', name: 'Anonymous', email: 'anonymous@tca-irr.com', role: 'user' };
        }
    }

    // Generate company ID
    private generateCompanyId(companyName: string): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const prefix = companyName
            ? companyName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CO'
            : 'CO';
        return `${prefix}-${timestamp}-${random}`;
    }

    // ============================================================================
    // Automated External Data Fetching
    // ============================================================================

    /**
     * Automatically fetch external data for the current workflow company
     */
    public async fetchExternalDataAutomatically(): Promise<AggregatedExternalData | null> {
        if (!this.state) {
            console.warn('[WorkflowAutomation] No active workflow');
            return null;
        }

        console.log('[WorkflowAutomation] Auto-fetching external data for:', this.state.companyName);
        this.updateStep('external-data', 'in-progress');

        try {
            // Get company info from localStorage
            let domain: string | undefined;
            let industry: string | undefined;

            try {
                const companyData = JSON.parse(localStorage.getItem('companyData') || '{}');
                domain = companyData.website?.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                industry = companyData.industry || companyData.sector;
            } catch (e) {
                console.warn('[WorkflowAutomation] Could not parse company data');
            }

            const externalData = await fetchExternalData({
                companyName: this.state.companyName,
                domain,
                industry,
            });

            this.state.externalData = externalData;
            this.updateStep('external-data', 'completed', {
                sourcesFetched: externalData.fetchSummary.successfulFetches,
                totalSources: externalData.fetchSummary.totalSources,
            });

            // Store in localStorage for use by other components
            localStorage.setItem('tca_external_data', JSON.stringify(externalData));

            console.log('[WorkflowAutomation] External data fetched:', externalData.fetchSummary.successfulFetches, 'sources');
            return externalData;
        } catch (error) {
            console.error('[WorkflowAutomation] External data fetch failed:', error);
            this.updateStep('external-data', 'error', undefined, String(error));
            return null;
        }
    }

    // ============================================================================
    // Module Configuration Validation
    // ============================================================================

    /**
     * Validate and load module configuration before running analysis
     */
    public async validateModuleConfiguration(): Promise<ModuleSetting[] | null> {
        if (!this.state) return null;

        console.log('[WorkflowAutomation] Validating module configuration...');
        this.updateStep('module-config', 'in-progress');

        try {
            const activeVersion = await settingsApi.getActiveVersion();
            if (!activeVersion?.module_settings) {
                throw new Error('No active module settings found');
            }

            const enabledModules = activeVersion.module_settings.filter(m => m.is_enabled);

            this.updateStep('module-config', 'completed', {
                activeModules: enabledModules.length,
                totalModules: activeVersion.module_settings.length,
                version: activeVersion.version_number,
            });

            console.log('[WorkflowAutomation] Module config validated:', enabledModules.length, 'active modules');
            return activeVersion.module_settings;
        } catch (error) {
            console.error('[WorkflowAutomation] Module config validation failed:', error);
            this.updateStep('module-config', 'error', undefined, String(error));
            return null;
        }
    }

    // ============================================================================
    // Analysis Result Storage
    // ============================================================================

    /**
     * Store analysis results and enrich with external data
     */
    public async storeAnalysisResult(analysisResult: ComprehensiveAnalysisOutput): Promise<void> {
        if (!this.state) return;

        console.log('[WorkflowAutomation] Storing analysis result...');
        this.updateStep('run-analysis', 'completed');

        // Enrich with external data if available
        if (this.state.externalData) {
            (analysisResult as any).externalData = {
                summary: this.state.externalData.fetchSummary,
                companyIntelligence: this.state.externalData.companyIntelligence,
                technologyData: this.state.externalData.technologyData,
                financialData: this.state.externalData.financialData,
                newsAndSentiment: this.state.externalData.newsAndSentiment,
            };
        }

        this.state.analysisResult = analysisResult;

        // Store with tracking IDs
        const enrichedResult = {
            ...analysisResult,
            _tracking: {
                evaluationId: this.state.evaluationId,
                companyId: this.state.companyId,
                userId: this.state.userId,
                userName: this.state.userName,
                companyName: this.state.companyName,
                framework: this.state.framework,
                analyzedAt: new Date().toISOString(),
            }
        };

        localStorage.setItem('analysisResult', JSON.stringify(enrichedResult));
        this.saveState();

        // Update unified record
        const moduleResults: AnalysisModuleResult[] = [];
        // Extract module results from analysis - use compositeScore as fallback
        if (analysisResult.tcaData) {
            const tcaScore = (analysisResult.tcaData as { overallTCAScore?: number; compositeScore?: number }).overallTCAScore
                ?? analysisResult.tcaData.compositeScore
                ?? 0;
            moduleResults.push({
                moduleId: 'tca-scorecard',
                moduleName: 'TCA Scorecard',
                score: tcaScore,
                weight: 15,
                weightedScore: tcaScore * 0.15,
                confidence: 0.85,
                status: 'completed',
            });
        }

        const tcaData = analysisResult.tcaData as { overallTCAScore?: number; compositeScore?: number; recommendation?: string } | undefined;
        const overallScore = tcaData?.overallTCAScore ?? tcaData?.compositeScore ?? 0;
        const recommendation = tcaData?.recommendation ?? analysisResult.tcaData?.summary?.slice(0, 50) ?? 'Monitor';

        unifiedRecordTracking.addAnalysisResults(
            moduleResults,
            overallScore,
            0.85,
            recommendation,
            this.state.framework
        );
    }

    // ============================================================================
    // What-If Simulation
    // ============================================================================

    /**
     * Store what-if simulation results
     */
    public storeSimulationResults(parameters: Record<string, any>, results: Record<string, any>): void {
        if (!this.state) return;

        this.state.simulationData = { parameters, results, simulatedAt: new Date().toISOString() };

        // Store with tracking ID
        const simulationId = generateSimulationId();
        const simulationWithTracking = {
            simulationId,
            evaluationId: this.state.evaluationId,
            companyId: this.state.companyId,
            ...this.state.simulationData,
        };

        localStorage.setItem('whatIfSimulation', JSON.stringify(simulationWithTracking));
        this.updateStep('what-if', 'completed', { simulationId });
        this.saveState();

        // Update unified record
        unifiedRecordTracking.addSimulationResults(parameters, results);
    }

    // ============================================================================
    // Report Generation
    // ============================================================================

    /**
     * Generate and store a report
     */
    public async generateReport(reportType: 'triage' | 'dd'): Promise<string | null> {
        if (!this.state || !this.state.analysisResult) {
            console.warn('[WorkflowAutomation] Cannot generate report: no analysis result');
            return null;
        }

        console.log('[WorkflowAutomation] Generating', reportType, 'report...');
        this.updateStep('report-generation', 'in-progress');

        try {
            const reportId = generateReportId(reportType);
            this.state.reportId = reportId;
            this.state.reportType = reportType;

            // Create report metadata
            const reportMetadata: ReportMetadata = {
                id: reportId,
                companyName: this.state.companyName,
                reportType,
                version: 1,
                createdAt: new Date().toISOString(),
                createdBy: this.state.userName,
                status: 'completed',
                evaluationId: this.state.evaluationId,
                companyId: this.state.companyId,
                framework: this.state.framework,
            };

            // Store in report storage using proper signature
            await reportStorage.saveReport(
                this.state.analysisResult as ComprehensiveAnalysisOutput,
                reportType,
                this.state.framework,
                this.state.userId,
                this.state.companyName,
                { status: 'completed' },
                {
                    evaluationId: this.state.evaluationId,
                    companyId: this.state.companyId
                }
            );

            this.updateStep('report-generation', 'completed', { reportId, reportType });
            this.saveState();

            // Initialize reviewer approval
            unifiedRecordTracking.initializeReviewerApproval();

            console.log('[WorkflowAutomation] Report generated:', reportId);
            return reportId;
        } catch (error) {
            console.error('[WorkflowAutomation] Report generation failed:', error);
            this.updateStep('report-generation', 'error', undefined, String(error));
            return null;
        }
    }

    // ============================================================================
    // Navigation Helpers
    // ============================================================================

    /**
     * Get the next step URL based on current workflow state
     */
    public getNextStepUrl(): string {
        if (!this.state) return '/dashboard/evaluation';

        const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === this.state!.currentStep);

        switch (this.state.currentStep) {
            case 'evaluation':
                return '/dashboard/evaluation';
            case 'company-info':
                return '/dashboard/evaluation';
            case 'external-data':
                return '/dashboard/evaluation';
            case 'module-config':
                return '/dashboard/evaluation/modules';
            case 'run-analysis':
                return '/analysis/run';
            case 'what-if':
                return '/analysis/what-if';
            case 'report-generation':
                return '/analysis/result';
            case 'reviewer-approval':
                return '/analysis/result';
            default:
                return '/dashboard/evaluation';
        }
    }

    /**
     * Build URL with tracking parameters
     */
    public buildUrlWithTracking(basePath: string): string {
        if (!this.state) return basePath;

        const params = new URLSearchParams({
            evalId: this.state.evaluationId,
            companyId: this.state.companyId,
        });

        return `${basePath}?${params.toString()}`;
    }

    // ============================================================================
    // Reset / Clear
    // ============================================================================

    /**
     * Reset the workflow for a new evaluation
     */
    public reset(): void {
        this.state = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
        console.log('[WorkflowAutomation] Workflow reset');
    }
}

// Export singleton instance
export const workflowAutomation = WorkflowAutomation.getInstance();

// Export functions for direct use
export const initializeWorkflow = (companyName: string, framework: 'general' | 'medtech' = 'general') =>
    workflowAutomation.initializeWorkflow(companyName, framework);

export const getWorkflowState = () => workflowAutomation.getState();

export const fetchExternalDataAutomatically = () => workflowAutomation.fetchExternalDataAutomatically();

export const validateModuleConfiguration = () => workflowAutomation.validateModuleConfiguration();

export const storeAnalysisResult = (result: ComprehensiveAnalysisOutput) =>
    workflowAutomation.storeAnalysisResult(result);

export const storeSimulationResults = (params: Record<string, any>, results: Record<string, any>) =>
    workflowAutomation.storeSimulationResults(params, results);

export const generateWorkflowReport = (reportType: 'triage' | 'dd') =>
    workflowAutomation.generateReport(reportType);

export const getNextStepUrl = () => workflowAutomation.getNextStepUrl();

export const buildUrlWithTracking = (basePath: string) => workflowAutomation.buildUrlWithTracking(basePath);

export const resetWorkflow = () => workflowAutomation.reset();

export default workflowAutomation;
