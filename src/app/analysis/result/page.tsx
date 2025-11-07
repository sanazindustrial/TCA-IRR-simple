'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Timer, Eye } from 'lucide-react';

// Hooks and Utils
import { useToast } from '@/hooks/use-toast';
import { saveAnalysisReport, reportStorage } from '@/lib/report-storage';

// Evaluation Components
import { BenchmarkComparison } from '@/components/evaluation/benchmark-comparison';
import { FunderFitAnalysis } from '@/components/evaluation/funder-fit-analysis';
import { GapAnalysis } from '@/components/evaluation/gap-analysis';
import { GrowthClassifier } from '@/components/evaluation/growth-classifier';
import { MacroTrendAlignment } from '@/components/evaluation/macro-trend-alignment';
import { RiskFlags } from '@/components/evaluation/risk-flags';
import { StrategicFitMatrix } from '@/components/evaluation/strategic-fit-matrix';
import { TcaScorecard } from '@/components/evaluation/tca-scorecard';
import { TeamAssessment } from '@/components/evaluation/team-assessment';
import { ExportButtons } from '@/components/evaluation/export-buttons';
import { EvaluationProvider } from '@/components/evaluation/evaluation-provider';
import { QuickSummary } from '@/components/evaluation/quick-summary';
import { ExecutiveSummary } from '@/components/evaluation/executive-summary';
import { TcaSummaryCard } from '@/components/evaluation/tca-summary-card';
import { ConsistencyCheck } from '@/components/evaluation/consistency-check';
import { ReviewerComments } from '@/components/evaluation/reviewer-comments';
import { FinalRecommendation } from '@/components/evaluation/final-recommendation';
import { ReviewerAIDeviation } from '@/components/evaluation/reviewer-ai-deviation';
import { WeightedScoreBreakdown } from '@/components/evaluation/weighted-score-breakdown';
import { CompetitiveLandscape } from '@/components/evaluation/competitive-landscape';
import { RegulatoryComplianceReview } from '@/components/evaluation/regulatory-compliance-review';
import { GtmStrategy } from '@/components/evaluation/gtm-strategy';
import { IpTechnologyReview } from '@/components/evaluation/ip-technology-review';
import { FinancialsBurnRate } from '@/components/evaluation/financials-burn-rate';
import { ExitStrategyRoadmap } from '@/components/evaluation/exit-strategy-roadmap';
import { TermSheetTriggerAnalysis } from '@/components/evaluation/term-sheet-trigger-analysis';
import { Appendix } from '@/components/evaluation/appendix';
import { CEOQuestions } from '@/components/evaluation/ceo-questions';
import { TcaAiTable } from '@/components/evaluation/tca-ai-table';
import { RiskFlagSummaryTable } from '@/components/evaluation/risk-flag-summary-table';
import { TcaInterpretationSummary } from '@/components/evaluation/tca-interpretation-summary';
import { FlagAnalysisNarrative } from '@/components/evaluation/flag-analysis-narrative';

// Loading Component
import Loading from '../../loading';

// Sample Data and Types
import { sampleAnalysisData, type ComprehensiveAnalysisOutput } from '@/lib/sample-data';

// Type Definitions
export type UserRole = 'user' | 'admin' | 'reviewer';
export type ReportType = 'triage' | 'dd';
type ReportSection = { id: string; title: string; active: boolean; };



// Report Components Configuration - Complete list of all available components
const allReportComponents = [
    // Core Analysis Components
    { id: 'quick-summary', title: 'Quick Summary', component: QuickSummary, category: 'core' },
    { id: 'executive-summary', title: 'Executive Summary', component: ExecutiveSummary, category: 'core' },
    { id: 'tca-scorecard', title: 'TCA Scorecard', component: TcaScorecard, category: 'core' },
    { id: 'tca-summary-card', title: 'TCA Summary Card', component: TcaSummaryCard, category: 'core' },
    { id: 'tca-ai-table', title: 'TCA AI Analysis Table', component: TcaAiTable, category: 'core' },
    { id: 'tca-interpretation-summary', title: 'TCA AI Interpretation Summary', component: TcaInterpretationSummary, category: 'core' },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', component: FlagAnalysisNarrative, category: 'core' },

    // Risk & Assessment Components
    { id: 'risk-flags', title: 'Risk Flags & Mitigation', component: RiskFlags, category: 'assessment' },
    { id: 'risk-flag-summary-table', title: 'Risk Flag Summary Table', component: RiskFlagSummaryTable, category: 'assessment' },
    { id: 'gap-analysis', title: 'Gap Analysis', component: GapAnalysis, category: 'assessment' },
    { id: 'consistency-check', title: 'Consistency Check', component: ConsistencyCheck, category: 'assessment' },
    { id: 'weighted-score-breakdown', title: 'Weighted Score Breakdown', component: WeightedScoreBreakdown, category: 'assessment' },

    // Market & Strategy Components
    { id: 'macro-trend-alignment', title: 'Macro Trend Alignment', component: MacroTrendAlignment, category: 'market' },
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', component: BenchmarkComparison, category: 'market' },
    { id: 'competitive-landscape', title: 'Competitive Landscape', component: CompetitiveLandscape, category: 'market' },
    { id: 'gtm-strategy', title: 'Go-to-Market Strategy', component: GtmStrategy, category: 'market' },

    // Growth & Financial Components  
    { id: 'growth-classifier', title: 'Growth Classifier', component: GrowthClassifier, category: 'financial' },
    { id: 'financials-burn-rate', title: 'Financials & Burn Rate', component: FinancialsBurnRate, category: 'financial' },
    { id: 'exit-strategy-roadmap', title: 'Exit Strategy Roadmap', component: ExitStrategyRoadmap, category: 'financial' },
    { id: 'term-sheet-trigger', title: 'Term Sheet Trigger Analysis', component: TermSheetTriggerAnalysis, category: 'financial' },

    // Team & Fit Components
    { id: 'funder-fit-analysis', title: 'Funder Fit Analysis', component: FunderFitAnalysis, category: 'team' },
    { id: 'team-assessment', title: 'Team Assessment', component: TeamAssessment, category: 'team' },
    { id: 'strategic-fit-matrix', title: 'Strategic Fit Matrix', component: StrategicFitMatrix, category: 'team' },

    // Technology & IP Components
    { id: 'ip-technology-review', title: 'IP & Technology Review', component: IpTechnologyReview, category: 'technology' },
    { id: 'regulatory-compliance', title: 'Regulatory Compliance Review', component: RegulatoryComplianceReview, category: 'technology' },

    // Review & Final Components
    { id: 'ceo-questions', title: 'CEO Questions', component: CEOQuestions, category: 'review' },
    { id: 'reviewer-comments', title: 'Reviewer Comments', component: ReviewerComments, category: 'review' },
    { id: 'reviewer-ai-deviation', title: 'Reviewer AI Deviation', component: ReviewerAIDeviation, category: 'review' },
    { id: 'final-recommendation', title: 'Final Recommendation', component: FinalRecommendation, category: 'review' },
    { id: 'appendix', title: 'Appendix', component: Appendix, category: 'review' }
];

// Triage Report Configuration (Standard User) - 5-7 pages
const triageStandardConfig = [
    { id: 'quick-summary', title: 'Quick Summary', active: true },
    { id: 'tca-scorecard', title: 'TCA Scorecard', active: true },
    { id: 'tca-ai-table', title: 'TCA AI Analysis Table', active: true },
    { id: 'tca-interpretation-summary', title: 'TCA AI Interpretation Summary', active: true },
    { id: 'weighted-score-breakdown', title: 'Weighted Score Breakdown', active: true },
    { id: 'risk-flag-summary-table', title: 'Risk Flag Summary Table', active: true },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', active: true },
    { id: 'ceo-questions', title: 'CEO Questions', active: true },
    { id: 'growth-classifier', title: 'Growth Classifier', active: true },
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', active: true },
    { id: 'final-recommendation', title: 'Final Recommendation', active: true }
];

// Triage Report Configuration (Admin/Reviewer) - Enhanced 5-7 pages
const triageAdminConfig = [
    { id: 'executive-summary', title: 'Executive Summary', active: true },
    { id: 'tca-scorecard', title: 'TCA Scorecard', active: true },
    { id: 'tca-summary-card', title: 'TCA Summary Card', active: true },
    { id: 'tca-ai-table', title: 'TCA AI Analysis Table', active: true },
    { id: 'tca-interpretation-summary', title: 'TCA AI Interpretation Summary', active: true },
    { id: 'weighted-score-breakdown', title: 'Weighted Score Breakdown', active: true },
    { id: 'risk-flag-summary-table', title: 'Risk Flag Summary Table', active: true },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', active: true },
    { id: 'ceo-questions', title: 'CEO Questions', active: true },
    { id: 'gap-analysis', title: 'Gap Analysis', active: true },
    { id: 'macro-trend-alignment', title: 'Macro Trend Alignment', active: true },
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', active: true },
    { id: 'growth-classifier', title: 'Growth Classifier', active: true },
    { id: 'team-assessment', title: 'Team Assessment', active: true },
    { id: 'consistency-check', title: 'Consistency Check', active: true },
    { id: 'reviewer-comments', title: 'Reviewer Comments', active: true },
    { id: 'final-recommendation', title: 'Final Recommendation', active: true }
];

// Due Diligence (DD) Report Configuration - Complete Analysis (25-100 pages)
const ddReportConfig = [
    { id: 'executive-summary', title: 'Executive Summary', active: true },
    { id: 'tca-scorecard', title: 'TCA Scorecard', active: true },
    { id: 'tca-summary-card', title: 'TCA Summary Card', active: true },
    { id: 'tca-ai-table', title: 'TCA AI Analysis Table', active: true },
    { id: 'tca-interpretation-summary', title: 'TCA AI Interpretation Summary', active: true },
    { id: 'weighted-score-breakdown', title: 'Weighted Score Breakdown', active: true },
    { id: 'risk-flags', title: 'Risk Flags & Mitigation', active: true },
    { id: 'risk-flag-summary-table', title: 'Risk Flag Summary Table', active: true },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', active: true },
    { id: 'gap-analysis', title: 'Gap Analysis', active: true },
    { id: 'macro-trend-alignment', title: 'Macro Trend Alignment', active: true },
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', active: true },
    { id: 'competitive-landscape', title: 'Competitive Landscape', active: true },
    { id: 'growth-classifier', title: 'Growth Classifier', active: true },
    { id: 'financials-burn-rate', title: 'Financials & Burn Rate', active: true },
    { id: 'gtm-strategy', title: 'Go-to-Market Strategy', active: true },
    { id: 'funder-fit-analysis', title: 'Funder Fit Analysis', active: true },
    { id: 'team-assessment', title: 'Team Assessment', active: true },
    { id: 'strategic-fit-matrix', title: 'Strategic Fit Matrix', active: true },
    { id: 'ip-technology-review', title: 'IP & Technology Review', active: true },
    { id: 'regulatory-compliance', title: 'Regulatory Compliance Review', active: true },
    { id: 'exit-strategy-roadmap', title: 'Exit Strategy Roadmap', active: true },
    { id: 'term-sheet-trigger', title: 'Term Sheet Trigger Analysis', active: true },
    { id: 'ceo-questions', title: 'CEO Questions', active: true },
    { id: 'consistency-check', title: 'Consistency Check', active: true },
    { id: 'reviewer-comments', title: 'Reviewer Comments', active: true },
    { id: 'reviewer-ai-deviation', title: 'Reviewer AI Deviation', active: true },
    { id: 'final-recommendation', title: 'Final Recommendation', active: true },
    { id: 'appendix', title: 'Appendix', active: true }
];

// Helper function to extract the correct data for each component
function getComponentData(componentId: string, analysisData: ComprehensiveAnalysisOutput) {
    switch (componentId) {
        // Core Components
        case 'quick-summary':
        case 'executive-summary':
            return analysisData;
        case 'tca-summary-card':
        case 'tca-scorecard':
        case 'tca-ai-table':
        case 'tca-interpretation-summary':
            return analysisData.tcaData;

        // Risk & Assessment
        case 'risk-flags':
            return analysisData.riskData;
        case 'gap-analysis':
            return analysisData.gapData;
        case 'consistency-check':
        case 'weighted-score-breakdown':
            return analysisData;

        // Market & Strategy
        case 'macro-trend-alignment':
            return analysisData.macroData;
        case 'benchmark-comparison':
            return analysisData.benchmarkData;
        case 'competitive-landscape':
        case 'gtm-strategy':
            return analysisData;

        // Growth & Financial
        case 'growth-classifier':
            return analysisData.growthData;
        case 'financials-burn-rate':
        case 'exit-strategy-roadmap':
        case 'term-sheet-trigger':
            return analysisData;

        // Team & Fit
        case 'funder-fit-analysis':
            return analysisData.founderFitData;
        case 'team-assessment':
            return analysisData.teamData;
        case 'strategic-fit-matrix':
            return analysisData.strategicFitData;

        // Technology & IP
        case 'ip-technology-review':
        case 'regulatory-compliance':
            return analysisData;

        // Review & Final
        case 'ceo-questions':
        case 'reviewer-comments':
        case 'reviewer-ai-deviation':
        case 'final-recommendation':
        case 'appendix':
            return analysisData;

        default:
            return analysisData;
    }
}

// Report View Component
function ReportView({
    analysisData,
    isPreview,
    visibleSections
}: {
    analysisData: ComprehensiveAnalysisOutput;
    isPreview: boolean;
    visibleSections: ReportSection[];
}) {
    const visibleComponents = allReportComponents.filter(comp =>
        visibleSections.some(section => section.id === comp.id && section.active)
    );

    return (
        <div className="space-y-8">
            {visibleComponents.map(({ id, title, component: Component }) => (
                <div key={id} id={id}>
                    {id === 'tca-summary-card' ? (
                        <Component initialData={getComponentData(id, analysisData)} />
                    ) : id === 'tca-ai-table' ? (
                        <Component data={getComponentData(id, analysisData)} />
                    ) : (
                        <Component data={getComponentData(id, analysisData)} />
                    )}
                </div>
            ))}
        </div>
    );
}

// Main Page Component
// Mark this page as dynamic
export const dynamic = 'force-dynamic';

export default function AnalysisResultPage({
    searchParams
}: {
    searchParams: Promise<{ preview?: string; type?: string }>
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<UserRole>('user');
    const [reportType, setReportType] = useState<ReportType>('triage');
    const [framework, setFramework] = useState<'general' | 'medtech'>('general');
    const [visibleSections, setVisibleSections] = useState<ReportSection[]>([]);
    const [analysisData, setAnalysisData] = useState<ComprehensiveAnalysisOutput>(sampleAnalysisData);
    const [analysisDuration, setAnalysisDuration] = useState<number | null>(null);
    const [params, setParams] = useState<{ preview?: string; type?: string }>({});
    const [isPreview, setIsPreview] = useState(false);

    // Unwrap searchParams
    useEffect(() => {
        searchParams.then(p => {
            setParams(p);
            setIsPreview(p.preview === 'true');
        });
    }, [searchParams]);

    // Load user role and analysis data - Dynamic Data Loading
    useEffect(() => {
        const loadUserAndConfig = () => {
            setIsLoading(true);

            try {
                // Load user role from localStorage
                const storedUser = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const user = JSON.parse(storedUser);
                        const userRole = user.role?.toLowerCase() || 'user';
                        setRole(userRole as UserRole);
                    } catch (e) {
                        console.error('Failed to parse user data:', e);
                        setRole('user');
                    }
                } else {
                    setRole('user');
                }

                // Load analysis data from localStorage or use sample data
                const storedAnalysis = localStorage.getItem('analysisResult');
                if (storedAnalysis && !isPreview) {
                    try {
                        const parsedAnalysis = JSON.parse(storedAnalysis);
                        setAnalysisData(parsedAnalysis);
                    } catch (e) {
                        console.error('Failed to parse analysis data:', e);
                        setAnalysisData(sampleAnalysisData);
                    }
                } else {
                    setAnalysisData(sampleAnalysisData);
                }

                // Load analysis duration
                const storedDuration = localStorage.getItem('analysisDuration');
                if (storedDuration) {
                    setAnalysisDuration(parseFloat(storedDuration));
                } else {
                    setAnalysisDuration(45.32); // Default sample duration
                }

                // Load framework from localStorage
                const storedFramework = localStorage.getItem('analysisFramework') as 'general' | 'medtech';
                if (storedFramework) {
                    setFramework(storedFramework);
                }

                // Set report type from URL params or localStorage with access control
                if (params.type === 'dd') {
                    // Check if user has permission for DD reports
                    const isPrivileged = role === 'admin' || role === 'reviewer';
                    if (isPrivileged) {
                        setReportType('dd');
                    } else {
                        // Redirect standard users away from DD reports
                        console.log('Standard user attempted to access DD report, redirecting to triage');
                        setReportType('triage');
                        // Show a toast notification about access restriction
                        setTimeout(() => {
                            toast({
                                variant: 'destructive',
                                title: 'Access Restricted',
                                description: 'Due Diligence reports are only available for admin and reviewer accounts.',
                            });
                        }, 1000);
                    }
                } else if (params.type === 'triage') {
                    setReportType('triage');
                } else {
                    // Try to load from localStorage or default to triage
                    const savedReportType = localStorage.getItem('currentReportType') as ReportType;
                    // Ensure standard users can't access DD even from localStorage
                    if (savedReportType === 'dd' && !(role === 'admin' || role === 'reviewer')) {
                        setReportType('triage');
                    } else {
                        setReportType(savedReportType || 'triage');
                    }
                }

            } catch (error) {
                console.error('Error loading user and config:', error);
                setRole('user');
                setReportType('triage');
                setAnalysisData(sampleAnalysisData);
                setAnalysisDuration(45.32);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserAndConfig();
    }, [params.type, isPreview, params]);

    // Load configuration based on role and report type - Dynamic Configuration
    useEffect(() => {
        if (isPreview) {
            // In preview mode, show all possible sections
            const allSections = allReportComponents.map(comp => ({
                id: comp.id,
                title: comp.title,
                active: true
            }));
            setVisibleSections(allSections);
            return;
        }

        try {
            const isPrivileged = role === 'admin' || role === 'reviewer';
            let configKey = '';
            let defaultConfig: ReportSection[] = [];

            // Determine configuration based on report type and user role
            if (reportType === 'triage') {
                if (isPrivileged) {
                    configKey = 'report-config-triage-admin';
                    defaultConfig = triageAdminConfig;
                } else {
                    configKey = 'report-config-triage-standard';
                    defaultConfig = triageStandardConfig;
                }
            } else if (reportType === 'dd') {
                // STRICT: Only admin/reviewer can access DD reports
                if (isPrivileged) {
                    configKey = 'report-config-dd';
                    defaultConfig = ddReportConfig;
                } else {
                    // Force standard users back to triage with notification
                    console.warn('SECURITY: Standard user blocked from DD report access');
                    setReportType('triage');
                    configKey = 'report-config-triage-standard';
                    defaultConfig = triageStandardConfig;

                    // Show access denied notification
                    setTimeout(() => {
                        toast({
                            variant: 'destructive',
                            title: 'Access Denied',
                            description: 'Due Diligence reports are restricted to admin and reviewer accounts only.',
                        });
                    }, 500);
                }
            } else {
                // Fallback for any other report type
                defaultConfig = triageStandardConfig;
            }

            // Try to load saved configuration, fallback to default
            const savedConfig = localStorage.getItem(configKey);
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    // Validate that parsed config has required structure
                    if (Array.isArray(parsed) && parsed.every(item =>
                        item.id && item.title && typeof item.active === 'boolean'
                    )) {
                        setVisibleSections(parsed);
                    } else {
                        // Invalid saved config, use default
                        setVisibleSections(defaultConfig);
                        localStorage.setItem(configKey, JSON.stringify(defaultConfig));
                    }
                } catch (parseError) {
                    console.warn('Invalid saved config format, using default:', parseError);
                    setVisibleSections(defaultConfig);
                    localStorage.setItem(configKey, JSON.stringify(defaultConfig));
                }
            } else {
                // No saved config, use and save default
                setVisibleSections(defaultConfig);
                localStorage.setItem(configKey, JSON.stringify(defaultConfig));
            }
        } catch (e) {
            console.error("Failed to load report configuration:", e);
            // Emergency fallback - minimal working configuration
            const emergencyConfig = [
                { id: 'quick-summary', title: 'Quick Summary', active: true },
                { id: 'tca-scorecard', title: 'TCA Scorecard', active: true },
                { id: 'final-recommendation', title: 'Final Recommendation', active: true }
            ];
            setVisibleSections(emergencyConfig);
        }
    }, [role, reportType, isPreview]);

    const handleRunAnalysis = async () => {
        toast({
            title: 'Navigating to New Analysis',
            description: 'Redirecting to the analysis page...'
        });
        router.push('/dashboard/evaluation');
    };

    // Auto-save analysis when data is loaded
    useEffect(() => {
        const autoSaveAnalysis = async () => {
            if (!analysisData || !role || isPreview) return;

            try {
                const user = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
                if (!user) return;

                const userData = JSON.parse(user);
                const userId = userData.id || userData.email || 'anonymous';
                const companyName = (analysisData as any).companyName || 'Analysis Report';

                // Auto-save the current analysis
                const reportId = await saveAnalysisReport(analysisData, {
                    reportType,
                    framework,
                    userId,
                    companyName,
                    analysisDuration,
                    tags: [reportType, framework]
                });

                console.log(`Analysis auto-saved with ID: ${reportId}`);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        };

        // Delay auto-save to ensure all data is loaded
        const saveTimeout = setTimeout(autoSaveAnalysis, 2000);
        return () => clearTimeout(saveTimeout);
    }, [analysisData, reportType, framework, role, analysisDuration, isPreview]);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <EvaluationProvider
            role={role}
            reportType={reportType}
            framework={framework}
            onFrameworkChangeAction={setFramework}
            setReportTypeAction={setReportType}
            uploadedFiles={[]}
            setUploadedFilesAction={() => { }}
            importedUrls={[]}
            setImportedUrlsAction={() => { }}
            submittedTexts={[]}
            setSubmittedTextsAction={() => { }}
            isLoading={isLoading}
            handleRunAnalysisAction={handleRunAnalysis}
        >
            <main className="bg-background text-foreground min-h-screen">
                <div className="container mx-auto p-4 md:p-8">
                    <header className="mb-12">
                        {/* Main Header with Title and Action Buttons */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                            <div className="text-center lg:text-left">
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                    Technology Commercialization Analysis
                                </h1>
                                <p className="text-lg text-muted-foreground max-w-2xl">
                                    {reportType === 'triage' ?
                                        'Triage analysis provides key insights for initial investment screening.' :
                                        'Due Diligence analysis provides comprehensive evaluation for investment decisions.'
                                    }
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 lg:flex-shrink-0">
                                {!isPreview && (
                                    <>
                                        <Button
                                            variant={reportType === 'triage' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                setReportType('triage');
                                                localStorage.setItem('currentReportType', 'triage');
                                            }}
                                        >
                                            Triage Report
                                        </Button>
                                        {(role === 'admin' || role === 'reviewer') && (
                                            <Button
                                                variant={reportType === 'dd' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => {
                                                    setReportType('dd');
                                                    localStorage.setItem('currentReportType', 'dd');
                                                }}
                                            >
                                                DD Report (Admin Only)
                                            </Button>
                                        )}
                                        <Button asChild variant="outline" size="sm">
                                            <Link href="/dashboard/evaluation">
                                                New Analysis
                                            </Link>
                                        </Button>
                                    </>
                                )}
                                <ExportButtons />
                            </div>
                        </div>

                        {/* Status Information Bar */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground bg-muted/30 px-4 py-3 rounded-lg">
                            {analysisDuration && !isPreview && (
                                <div className="flex items-center gap-2">
                                    <Timer className="size-4" />
                                    <span>
                                        Analysis completed in {analysisDuration.toFixed(2)} seconds
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Eye className="size-4" />
                                <span>
                                    {visibleSections.filter((s: ReportSection) => s.active).length} sections visible
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-primary/10 rounded-md border border-primary/20">
                                <span className="text-primary font-medium">
                                    {reportType.toUpperCase()} Report ({role})
                                </span>
                            </div>
                        </div>
                    </header>

                    <ReportView
                        analysisData={analysisData}
                        isPreview={isPreview}
                        visibleSections={visibleSections}
                    />
                </div>
            </main>
        </EvaluationProvider>
    );
}
