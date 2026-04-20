'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Timer, Eye, Save, Loader2, CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, Shield, ArrowRight, MessageSquare, RefreshCw, BarChart3, TrendingUp, Users, Megaphone, Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

// Hooks and Utils
import { useToast } from '@/hooks/use-toast';
import { saveAnalysisReport, reportStorage } from '@/lib/report-storage';
import { unifiedRecordTracking, generateReportId } from '@/lib/unified-record-tracking';
import { clearEvaluationState } from '@/lib/auto-extraction-service';

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
import { AnalystComments } from '@/components/evaluation/analyst-comments';
import { FinalRecommendation } from '@/components/evaluation/final-recommendation';
import { AnalystAIDeviation } from '@/components/evaluation/analyst-ai-deviation';
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
import { normalizeAnalysisData } from '@/lib/normalize-tca-data';

// Type Definitions
export type UserRole = 'user' | 'admin' | 'analyst';
export type ReportType = 'triage' | 'dd';
type ReportSection = { id: string; title: string; active: boolean; };
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs-revision';
type ReviewCheckItem = {
    id: string;
    label: string;
    checked: boolean;
};

type WizardResult = {
    savedAt: string;
    sentiment: { positive: number; negative: number; neutral: number; total: number };
    gaps: Array<{ category: string; status: 'covered' | 'gap' | 'partial'; detail: string }>;
    keywords: Array<{ word: string; count: number; group: string }>;
    aiVsHuman: Array<{ area: string; aiNote: string; analystNote: string; aligned: boolean }>;
    aiScoresMap: Record<string, number>;
    humanScoresMap: Record<string, number>;
    ceoQa: string;
    analystNotes: string;
    comments: string[];
};

const defaultReviewChecklist: ReviewCheckItem[] = [
    { id: 'data-accuracy', label: 'Data accuracy verified', checked: false },
    { id: 'scoring-consistency', label: 'TCA scoring consistency checked', checked: false },
    { id: 'risk-flags-reviewed', label: 'All risk flags reviewed', checked: false },
    { id: 'recommendations-valid', label: 'Recommendations are valid', checked: false },
    { id: 'formatting-correct', label: 'Report formatting is correct', checked: false },
];



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
    { id: 'analyst-comments', title: 'Analyst Comments', component: AnalystComments, category: 'review' },
    { id: 'analyst-ai-deviation', title: 'Analyst AI Deviation', component: AnalystAIDeviation, category: 'review' },
    { id: 'final-recommendation', title: 'Final Recommendation', component: FinalRecommendation, category: 'review' },
    { id: 'appendix', title: 'Appendix', component: Appendix, category: 'review' }
];

// Triage Report Configuration (Standard User) - 10 pages
const triageStandardConfig = [
    // Page 1: Cover & Executive Summary
    { id: 'executive-summary', title: 'Executive Summary', active: true },
    // Page 2: Quick Summary & TCA Overview
    { id: 'quick-summary', title: 'Quick Summary', active: true },
    { id: 'tca-scorecard', title: 'TCA Scorecard', active: true },
    // Page 3: TCA Analysis Details
    { id: 'tca-summary-card', title: 'TCA Summary Card', active: true },
    { id: 'tca-ai-table', title: 'TCA AI Analysis Table', active: true },
    // Page 4: TCA Interpretation
    { id: 'tca-interpretation-summary', title: 'TCA AI Interpretation Summary', active: true },
    { id: 'weighted-score-breakdown', title: 'Weighted Score Breakdown', active: true },
    // Page 5: Risk Assessment
    { id: 'risk-flag-summary-table', title: 'Risk Flag Summary Table', active: true },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', active: true },
    // Page 6: Gap & Trend Analysis
    { id: 'gap-analysis', title: 'Gap Analysis', active: true },
    { id: 'macro-trend-alignment', title: 'Macro Trend Alignment', active: true },
    // Page 7: Market Position
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', active: true },
    { id: 'competitive-landscape', title: 'Competitive Landscape', active: true },
    // Page 8: Growth & Team
    { id: 'growth-classifier', title: 'Growth Classifier', active: true },
    { id: 'team-assessment', title: 'Team Assessment', active: true },
    // Page 9: CEO Questions & Consistency
    { id: 'ceo-questions', title: 'CEO Questions', active: true },
    { id: 'consistency-check', title: 'Consistency Check', active: true },
    // Page 10: Final Recommendation & Next Steps
    { id: 'final-recommendation', title: 'Final Recommendation', active: true }
];

// Triage Report Configuration (Admin/Analyst) - Enhanced 10 pages with analytics
const triageAdminConfig = [
    // Page 1: Cover & Executive Summary
    { id: 'executive-summary', title: 'Executive Summary', active: true },
    // Page 2: Quick Summary & TCA Overview
    { id: 'quick-summary', title: 'Quick Summary', active: true },
    { id: 'tca-scorecard', title: 'TCA Scorecard', active: true },
    // Page 3: TCA Analysis Details
    { id: 'tca-summary-card', title: 'TCA Summary Card', active: true },
    { id: 'tca-ai-table', title: 'TCA AI Analysis Table', active: true },
    // Page 4: TCA Interpretation
    { id: 'tca-interpretation-summary', title: 'TCA AI Interpretation Summary', active: true },
    { id: 'weighted-score-breakdown', title: 'Weighted Score Breakdown', active: true },
    // Page 5: Risk Assessment
    { id: 'risk-flag-summary-table', title: 'Risk Flag Summary Table', active: true },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', active: true },
    // Page 6: Gap & Trend Analysis
    { id: 'gap-analysis', title: 'Gap Analysis', active: true },
    { id: 'macro-trend-alignment', title: 'Macro Trend Alignment', active: true },
    // Page 7: Market Position
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', active: true },
    { id: 'competitive-landscape', title: 'Competitive Landscape', active: true },
    // Page 8: Growth & Team
    { id: 'growth-classifier', title: 'Growth Classifier', active: true },
    { id: 'team-assessment', title: 'Team Assessment', active: true },
    // Page 9: CEO Questions, Consistency & Analyst Review
    { id: 'ceo-questions', title: 'CEO Questions', active: true },
    { id: 'consistency-check', title: 'Consistency Check', active: true },
    { id: 'analyst-comments', title: 'Analyst Comments', active: true },
    // Page 10: AI Deviation & Final Recommendation
    { id: 'analyst-ai-deviation', title: 'Analyst AI Deviation', active: true },
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
    { id: 'analyst-comments', title: 'Analyst Comments', active: true },
    { id: 'analyst-ai-deviation', title: 'Analyst AI Deviation', active: true },
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
        case 'analyst-comments':
        case 'analyst-ai-deviation':
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
    visibleSections,
    wizardResult
}: {
    analysisData: ComprehensiveAnalysisOutput;
    isPreview: boolean;
    visibleSections: ReportSection[];
    wizardResult?: WizardResult | null;
}) {
    const visibleComponents = allReportComponents.filter(comp =>
        visibleSections.some(section => section.id === comp.id && section.active)
    );

    // Helper to render component with proper props
    const renderComponent = (id: string, Component: React.ComponentType<any>) => {
        switch (id) {
            case 'tca-summary-card':
                return <Component initialData={getComponentData(id, analysisData)} />;
            case 'tca-ai-table':
                return <Component data={getComponentData(id, analysisData)} />;
            case 'tca-interpretation-summary':
                return <Component tcaData={getComponentData(id, analysisData)} />;
            case 'risk-flag-summary-table':
                return <Component data={analysisData.riskData} />;
            case 'flag-analysis-narrative':
                return <Component riskData={analysisData.riskData} tcaData={analysisData.tcaData} />;
            case 'analyst-ai-deviation':
                return <Component
                    aiScores={wizardResult?.aiScoresMap}
                    humanScores={wizardResult?.humanScoresMap}
                    companyName={(analysisData as any).companyName}
                    readOnly={true}
                />;
            case 'analyst-comments':
                return <Component
                    wizardSentiment={wizardResult?.sentiment}
                    wizardKeywords={wizardResult?.keywords}
                    wizardComments={wizardResult?.comments}
                />;
            case 'gap-analysis':
                return <Component wizardGaps={wizardResult?.gaps} />;
            default:
                return <Component data={getComponentData(id, analysisData)} />;
        }
    };

    // Show message if no visible sections
    if (visibleComponents.length === 0) {
        return (
            <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="size-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Report Sections Available</h3>
                    <p className="text-muted-foreground mb-4">
                        There are no visible sections configured for this report type.
                        Please check your report configuration or contact an administrator.
                    </p>
                    <Button asChild variant="default">
                        <Link href="/dashboard/evaluation">Start New Analysis</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {visibleComponents.map(({ id, component: Component }) => (
                <div key={id} id={id}>
                    {renderComponent(id, Component)}
                </div>
            ))}
        </div>
    );
}

// Main Page Component
export default function AnalysisResultPage({
    searchParams
}: {
    searchParams: Promise<{ preview?: string; type?: string; evalId?: string; anlId?: string; company?: string; user?: string }>
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<UserRole>('user');
    const [reportType, setReportType] = useState<ReportType>('triage');
    const [framework, setFramework] = useState<'general' | 'medtech'>('general');
    const [visibleSections, setVisibleSections] = useState<ReportSection[]>([]);
    const [analysisData, setAnalysisData] = useState<ComprehensiveAnalysisOutput>(sampleAnalysisData);
    const [wizardResult, setWizardResult] = useState<WizardResult | null>(null);
    const [analysisDuration, setAnalysisDuration] = useState<number | null>(null);
    const [params, setParams] = useState<{ preview?: string; type?: string; evalId?: string; anlId?: string; company?: string; user?: string }>({});
    const [isPreview, setIsPreview] = useState(false);
    const [isUsingSampleData, setIsUsingSampleData] = useState(false);
    const hasSavedRef = useRef(false);

    const redirectToRunAnalysis = (description: string) => {
        setIsUsingSampleData(false);
        toast({
            variant: 'destructive',
            title: 'No Analysis Data',
            description,
        });
        router.push('/dashboard/evaluation');
    };

    // Unified Record Tracking State
    const [evaluationId, setEvaluationId] = useState<string | null>(null);
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string>('');
    const [currentUserName, setCurrentUserName] = useState<string>('');

    // Reviewer Approval State
    const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('pending');
    const [reviewChecklist, setReviewChecklist] = useState<ReviewCheckItem[]>(defaultReviewChecklist);
    const [reviewerComments, setReviewerComments] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [showApprovalPanel, setShowApprovalPanel] = useState(true);

    // Unwrap searchParams and load tracking IDs
    useEffect(() => {
        searchParams.then(p => {
            setParams(p);
            setIsPreview(p.preview === 'true');

            // Load tracking IDs from URL params
            if (p.evalId) {
                setEvaluationId(p.evalId);
                localStorage.setItem('currentEvaluationId', p.evalId);
            }
            if (p.anlId) {
                setAnalysisId(p.anlId);
                localStorage.setItem('currentAnalysisId', p.anlId);
            }
            if (p.company) {
                // Decode and sanitize company name (remove newlines and extra whitespace)
                const decodedCompany = decodeURIComponent(p.company).replace(/[\r\n]+/g, ' ').trim();
                setCompanyName(decodedCompany);
                console.log('Loaded company name from URL:', decodedCompany);
            }
            if (p.user) {
                const decodedUser = decodeURIComponent(p.user).trim();
                setCurrentUserName(decodedUser);
            }
        });

        // Load user name from localStorage if not in URL params
        const storedUser = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (!currentUserName) {
                    setCurrentUserName(user.name || user.email?.split('@')[0] || 'User');
                }
            } catch (e) {
                console.error('Failed to parse user data for name:', e);
            }
        }
    }, [searchParams]);

    // Load approval status from localStorage
    useEffect(() => {
        try {
            const savedApproval = localStorage.getItem('reportApprovalStatus');
            if (savedApproval) {
                const parsed = JSON.parse(savedApproval);
                setApprovalStatus(parsed.status || 'pending');
                setReviewerComments(parsed.comments || '');
                if (parsed.checklist) {
                    setReviewChecklist(parsed.checklist);
                }
            }
        } catch (e) {
            console.error('Failed to load approval status:', e);
        }
    }, []);

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

                // Load real analysis data from localStorage
                // First, validate that stored analysis belongs to current evaluation
                const storedEvalIdForValidation = localStorage.getItem('currentEvaluationId');
                const urlEvalId = params?.evalId;

                // If URL has an evalId that doesn't match stored data, clear stale data
                if (urlEvalId && storedEvalIdForValidation && urlEvalId !== storedEvalIdForValidation) {
                    console.log('Clearing stale analysis data - URL evalId:', urlEvalId, 'stored:', storedEvalIdForValidation);
                    localStorage.removeItem('analysisResult');
                    localStorage.removeItem('analysisTrackingInfo');
                    localStorage.removeItem('reportApprovalStatus');
                    setIsLoading(false);
                    redirectToRunAnalysis('No analysis data found for this evaluation. Please run analysis first.');
                    return;
                }

                const storedAnalysis = localStorage.getItem('analysisResult');
                if (storedAnalysis) {
                    try {
                        const parsedAnalysis = JSON.parse(storedAnalysis);

                        // Normalize TCA data to ensure correct composite score (0-10 scale)
                        if (parsedAnalysis.tcaData) {
                            let compositeScore = parsedAnalysis.tcaData.compositeScore || 0;

                            // If score > 10, it's on 0-100 scale, convert to 0-10
                            if (compositeScore > 10) {
                                compositeScore /= 10;
                            }

                            // If score is still 0 or too low, recalculate from categories
                            if (compositeScore === 0 && parsedAnalysis.tcaData.categories?.length > 0) {
                                compositeScore = parsedAnalysis.tcaData.categories.reduce((sum: number, cat: any) => {
                                    const weight = cat.weight || 10;
                                    const rawScore = cat.rawScore || 0;
                                    return sum + (rawScore * weight / 100);
                                }, 0);
                            }

                            // Clamp to 0-10 range
                            compositeScore = Math.max(0, Math.min(10, compositeScore));
                            parsedAnalysis.tcaData.compositeScore = compositeScore;
                        }

                        // Add company info - URL params take priority over localStorage
                        if (params?.company) {
                            // URL company param is authoritative
                            const decodedCompany = decodeURIComponent(params.company).replace(/[\r\n]+/g, ' ').trim();
                            parsedAnalysis.companyName = decodedCompany;
                        } else {
                            // Fall back to localStorage if no URL param
                            const storedCompanyName = localStorage.getItem('analysisCompanyName');
                            if (storedCompanyName) {
                                parsedAnalysis.companyName = storedCompanyName;
                                // Only set state from localStorage if URL didn't provide company
                                if (!companyName) {
                                    setCompanyName(storedCompanyName);
                                }
                            }
                        }

                        setAnalysisData(parsedAnalysis);
                        // If backend was unreachable, actions.ts marks the result with _isFallbackData.
                        // Never display fallback/sample data — redirect the user to run a real analysis.
                        if ((parsedAnalysis as any)._isFallbackData) {
                            if (!isPreview) {
                                setIsLoading(false);
                                redirectToRunAnalysis('The analysis could not reach the backend and returned no real data. Please run a new analysis with your company details.');
                                return;
                            }
                            // In preview mode with fallback data, show sample data with warning
                            setIsUsingSampleData(true);
                        } else {
                            setIsUsingSampleData(false);
                        }
                        console.log('Loaded analysis data with composite score:', parsedAnalysis.tcaData?.compositeScore);
                    } catch (e) {
                        console.error('Failed to parse analysis data:', e);
                        if (!isPreview) {
                            redirectToRunAnalysis('Stored analysis data is invalid. Please run the analysis again.');
                            return;
                        }
                        // Preview mode with invalid data — show sample data with warning
                        setIsUsingSampleData(true);
                    }
                } else if (!isPreview) {
                    redirectToRunAnalysis('No real analysis results were found. Please run analysis first.');
                    return;
                } else {
                    // Preview mode with no real data — display sample data but flag it clearly
                    setIsUsingSampleData(true);
                }

                // Load analyst wizard computed results (persisted by analyst wizard page)
                const storedWizardResult = localStorage.getItem('analyst-wizard-result');
                if (storedWizardResult) {
                    try {
                        setWizardResult(JSON.parse(storedWizardResult));
                    } catch (e) {
                        console.warn('Failed to parse analyst wizard result:', e);
                    }
                }

                // Load unified record tracking IDs
                const currentRecord = unifiedRecordTracking.getCurrentRecord();
                if (currentRecord) {
                    setEvaluationId(currentRecord.id.evaluationId);
                    setCompanyId(currentRecord.id.companyId);
                } else {
                    // Try to get from localStorage directly
                    const storedEvalId = localStorage.getItem('currentEvaluationId');
                    if (storedEvalId) {
                        setEvaluationId(storedEvalId);
                    }
                }

                // Load analysis duration (only show real duration, never a fake default)
                const storedDuration = localStorage.getItem('analysisDuration');
                if (storedDuration) {
                    setAnalysisDuration(parseFloat(storedDuration));
                }

                // Load framework from localStorage
                const storedFramework = localStorage.getItem('analysisFramework') as 'general' | 'medtech';
                if (storedFramework) {
                    setFramework(storedFramework);
                }

                // Set report type from URL params or localStorage with access control
                if (params.type === 'dd') {
                    // Check if user has permission for DD reports
                    const isPrivileged = role === 'admin' || role === 'analyst';
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
                                description: 'Due Diligence reports are only available for admin and analyst accounts.',
                            });
                        }, 1000);
                    }
                } else if (params.type === 'triage') {
                    setReportType('triage');
                } else {
                    // Try to load from localStorage or default to triage
                    const savedReportType = localStorage.getItem('currentReportType') as ReportType;
                    // Ensure standard users can't access DD even from localStorage
                    if (savedReportType === 'dd' && !(role === 'admin' || role === 'analyst')) {
                        setReportType('triage');
                    } else {
                        setReportType(savedReportType || 'triage');
                    }
                }

            } catch (error) {
                console.error('Error loading user and config:', error);
                setRole('user');
                setReportType('triage');
                setIsUsingSampleData(false);
                setAnalysisDuration(null);
                redirectToRunAnalysis('Unable to load a real analysis result. Please start a new analysis.');
                return;
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
            const isPrivileged = role === 'admin' || role === 'analyst';
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
                // STRICT: Only admin/analyst can access DD reports
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
                            description: 'Due Diligence reports are restricted to admin and analyst accounts only.',
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
        // Clear all analysis-related localStorage data before starting fresh
        const keysToRemove = [
            'analysisResult', 'analysisTrackingInfo', 'currentEvaluationId',
            'currentAnalysisId', 'reportApprovalStatus', 'analysisCompanyName',
            'analysisFramework', 'analysisCompanyId', 'companyData',
            'uploadedFiles', 'importedUrls', 'submittedTexts'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        toast({
            title: 'Starting New Analysis',
            description: 'Previous analysis data cleared. Redirecting to evaluation page...'
        });
        router.push('/dashboard/evaluation');
    };

    // Handle save to reports and redirect
    const [isSaving, setIsSaving] = useState(false);
    const handleSaveToReports = async () => {
        if (!analysisData || isPreview) {
            toast({
                variant: 'destructive',
                title: 'Cannot Save',
                description: 'No analysis data available to save.'
            });
            return;
        }

        setIsSaving(true);
        try {
            const user = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
            const userData = user ? JSON.parse(user) : { id: 'anonymous', email: 'anonymous@example.com' };
            const userId = userData.id || userData.email || 'anonymous';
            const companyName = (analysisData as any).companyName ||
                localStorage.getItem('analysisCompanyName') ||
                'Analysis Report';

            // Get or create evaluation ID for tracking
            let currentEvalId = evaluationId;
            if (!currentEvalId) {
                const currentRecord = unifiedRecordTracking.getCurrentRecord();
                if (currentRecord) {
                    currentEvalId = currentRecord.id.evaluationId;
                    setEvaluationId(currentEvalId);
                }
            }

            // Save the report with evaluation ID for tracking
            const reportId = await saveAnalysisReport(analysisData, {
                reportType,
                framework,
                userId,
                companyName,
                analysisDuration: analysisDuration ?? undefined,
                tags: [reportType, framework],
                evaluationId: currentEvalId || undefined,
                companyId: companyId || undefined,
            });

            console.log(`Report saved with ID: ${reportId}`);

            toast({
                title: 'Report Saved Successfully',
                description: `${companyName} ${reportType.toUpperCase()} report saved. Redirecting to Reports...`
            });

            // Try to sync any pending reports
            try {
                await reportStorage.syncPendingReports();
            } catch (e) {
                console.warn('Pending report sync failed:', e);
            }

            // Clear all evaluation/analysis state for fresh start
            clearEvaluationState();
            console.log('Cleared evaluation state after successful save');

            // Redirect to reports page after a short delay
            setTimeout(() => {
                router.push('/dashboard/reports');
            }, 1500);

        } catch (error) {
            console.error('Save failed:', error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save report. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle checklist item toggle
    const handleChecklistToggle = (itemId: string) => {
        setReviewChecklist(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
            )
        );
    };

    // Calculate checklist progress
    const checklistProgress = Math.round(
        (reviewChecklist.filter(item => item.checked).length / reviewChecklist.length) * 100
    );

    // Handle approval submission
    const handleApprovalSubmit = async (status: ApprovalStatus) => {
        setIsSubmittingReview(true);

        try {
            const reviewer = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            const reviewerEmail = reviewer?.email || 'Unknown';
            const reviewerId = reviewer?.id || reviewer?.email || 'unknown';

            const approvalData = {
                status,
                comments: reviewerComments,
                checklist: reviewChecklist,
                timestamp: new Date().toISOString(),
                reviewer: reviewerEmail
            };

            localStorage.setItem('reportApprovalStatus', JSON.stringify(approvalData));
            setApprovalStatus(status);

            // Update unified record tracking with approval status
            if (evaluationId) {
                const allChecked = reviewChecklist.every(item => item.checked);
                unifiedRecordTracking.updateReviewerApproval(
                    reviewChecklist.map(item => ({ id: item.id, checked: item.checked })),
                    reviewerComments,
                    status === 'approved' && allChecked
                );
            }

            // Update report storage with approval status
            const currentReportId = localStorage.getItem('currentReportId');
            if (currentReportId) {
                const report = await reportStorage.getReport(currentReportId);
                if (report) {
                    report.metadata.approvalStatus = status === 'approved' ? 'approved' :
                        status === 'rejected' ? 'rejected' : 'needs_revision';
                    report.metadata.status = status === 'approved' ? 'completed' : 'pending_approval';
                    report.metadata.reviewerId = reviewerId;
                    report.metadata.reviewedAt = new Date().toISOString();
                    report.metadata.reviewerComments = reviewerComments;
                    report.updatedAt = new Date().toISOString();

                    // Save the updated report back to storage and sync to backend
                    await reportStorage.updateReport(currentReportId, {
                        metadata: report.metadata,
                        updatedAt: report.updatedAt
                    });
                }
            }

            toast({
                title: status === 'approved' ? '✅ Report Approved' :
                    status === 'rejected' ? '❌ Report Rejected' : '📝 Revision Requested',
                description: status === 'approved' ?
                    'The report has been approved and is ready for distribution.' :
                    status === 'rejected' ?
                        'The report has been rejected. Please review the comments.' :
                        'The analyst has been notified to make revisions.',
            });

            // Update the review assignment status
            const storedReviews = localStorage.getItem('reviewerAssignments');
            if (storedReviews) {
                const reviews = JSON.parse(storedReviews);
                const updatedReviews = reviews.map((r: any) => ({
                    ...r,
                    status: status === 'approved' ? 'Completed' : r.status,
                    progress: status === 'approved' ? 100 : r.progress,
                    lastActivity: status === 'approved' ? 'Approved by reviewer' :
                        status === 'rejected' ? 'Rejected by reviewer' : 'Revision requested'
                }));
                localStorage.setItem('reviewerAssignments', JSON.stringify(updatedReviews));
            }

        } catch (error) {
            console.error('Approval submission failed:', error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Could not submit review. Please try again.'
            });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Auto-save analysis when data is loaded (fires once per page session)
    useEffect(() => {
        const autoSaveAnalysis = async () => {
            // Don't auto-save if already saved this session, using sample data, in preview mode, or missing required data
            if (hasSavedRef.current || !analysisData || !role || isPreview || isUsingSampleData) {
                if (isUsingSampleData) {
                    console.log('Skipping auto-save: Using sample data');
                }
                return;
            }
            hasSavedRef.current = true;

            try {
                const user = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
                if (!user) {
                    console.log('Skipping auto-save: No user logged in');
                    return;
                }

                const userData = JSON.parse(user);
                const userId = userData.id || userData.email || 'anonymous';
                const savedCompanyName = companyName || (analysisData as any).companyName || localStorage.getItem('analysisCompanyName') || 'Analysis Report';

                // Get evaluation ID from state or localStorage
                const savedEvalId = evaluationId || localStorage.getItem('currentEvaluationId');
                const savedCompanyId = companyId || localStorage.getItem('currentCompanyId');

                // Auto-save the current analysis with tracking IDs
                const reportId = await saveAnalysisReport(analysisData, {
                    reportType,
                    framework,
                    userId,
                    companyName: savedCompanyName,
                    analysisDuration: analysisDuration ?? undefined,
                    tags: [reportType, framework, 'auto-saved'],
                    evaluationId: savedEvalId || undefined,
                    companyId: savedCompanyId || undefined,
                });

                console.log(`Analysis auto-saved with ID: ${reportId}, EvalID: ${savedEvalId}`);
            } catch (error) {
                console.error('Auto-save failed:', error);
                toast({
                    variant: 'destructive',
                    title: 'Save Failed',
                    description: 'Failed to auto-save the report. You can manually save it.',
                });
            }
        };

        // Delay auto-save to ensure all data is loaded
        const saveTimeout = setTimeout(autoSaveAnalysis, 2000);
        return () => clearTimeout(saveTimeout);
    }, [analysisData, reportType, framework, role, analysisDuration, isPreview, isUsingSampleData, evaluationId, companyId, companyName, toast]);

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
                    {/* Sample Data Warning Banner */}
                    {isUsingSampleData && (
                        <Card className="mb-6 border-amber-500 bg-amber-50/50 dark:bg-amber-900/20">
                            <CardContent className="py-4">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="size-5 text-amber-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-amber-800 dark:text-amber-200">
                                            Viewing Sample Data
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            No analysis results found. This is sample demonstration data.
                                            To generate a real report, please run an analysis first.
                                        </p>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="border-amber-500 text-amber-700 hover:bg-amber-100">
                                        <Link href="/dashboard/evaluation">Run Analysis</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Evaluation Context Banner - Company, User, Evaluation ID */}
                    {(companyName || evaluationId || currentUserName) && !isPreview && (
                        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                            <CardContent className="py-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Company Name - Left Side */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Shield className="size-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Company Analysis</p>
                                            <p className="text-lg font-semibold text-foreground">
                                                {companyName || 'Untitled Analysis'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Evaluation Info & User - Right Side */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {evaluationId && (
                                            <Badge variant="outline" className="px-3 py-1 font-mono text-xs bg-background">
                                                <ClipboardCheck className="size-3 mr-1.5" />
                                                {evaluationId}
                                            </Badge>
                                        )}
                                        {analysisId && (
                                            <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
                                                ANL: {analysisId}
                                            </Badge>
                                        )}
                                        {currentUserName && (
                                            <Badge variant="default" className="px-3 py-1">
                                                <span className="size-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                                                {currentUserName}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                                        {(role === 'admin' || role === 'analyst') && (
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
                                        <Button
                                            onClick={handleRunAnalysis}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            New Analysis
                                        </Button>
                                        <Button
                                            onClick={handleSaveToReports}
                                            disabled={isSaving}
                                            variant="default"
                                            size="sm"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin mr-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="size-4 mr-2" />
                                                    Save to Reports
                                                </>
                                            )}
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

                    {/* Reviewer Approval Panel - Only for Admin/Analyst */}
                    {(role === 'admin' || role === 'analyst') && !isPreview && showApprovalPanel && (
                        <Card className={`mb-8 border-2 ${approvalStatus === 'approved' ? 'border-green-300 bg-green-50/50' :
                            approvalStatus === 'rejected' ? 'border-red-300 bg-red-50/50' :
                                approvalStatus === 'needs-revision' ? 'border-amber-300 bg-amber-50/50' :
                                    'border-primary/30 bg-primary/5'
                            }`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${approvalStatus === 'approved' ? 'bg-green-100' :
                                            approvalStatus === 'rejected' ? 'bg-red-100' :
                                                approvalStatus === 'needs-revision' ? 'bg-amber-100' :
                                                    'bg-primary/20'
                                            }`}>
                                            {approvalStatus === 'approved' ? (
                                                <CheckCircle2 className="size-6 text-green-600" />
                                            ) : approvalStatus === 'rejected' ? (
                                                <XCircle className="size-6 text-red-600" />
                                            ) : approvalStatus === 'needs-revision' ? (
                                                <AlertTriangle className="size-6 text-amber-600" />
                                            ) : (
                                                <ClipboardCheck className="size-6 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                Reviewer Approval Process
                                                <Badge variant={
                                                    approvalStatus === 'approved' ? 'success' :
                                                        approvalStatus === 'rejected' ? 'destructive' :
                                                            approvalStatus === 'needs-revision' ? 'warning' : 'outline'
                                                }>
                                                    {approvalStatus === 'pending' ? 'Pending Review' :
                                                        approvalStatus === 'approved' ? 'Approved' :
                                                            approvalStatus === 'rejected' ? 'Rejected' : 'Needs Revision'}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>
                                                Complete the checklist below before approving this report
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowApprovalPanel(false)}
                                    >
                                        Minimize
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Review Checklist Progress</span>
                                        <span className="font-medium">{checklistProgress}%</span>
                                    </div>
                                    <Progress value={checklistProgress} className="h-2" />
                                </div>

                                {/* Review Checklist */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {reviewChecklist.map(item => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${item.checked ? 'bg-green-50 border-green-200' : 'bg-muted/30 hover:bg-muted/50'
                                                }`}
                                            onClick={() => handleChecklistToggle(item.id)}
                                        >
                                            <Checkbox
                                                checked={item.checked}
                                                onCheckedChange={() => handleChecklistToggle(item.id)}
                                            />
                                            <span className={`text-sm ${item.checked ? 'text-green-700 font-medium' : ''}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Reviewer Comments */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="size-4" />
                                        Reviewer Comments (Optional)
                                    </label>
                                    <Textarea
                                        placeholder="Add any comments or notes about this report..."
                                        value={reviewerComments}
                                        onChange={(e) => setReviewerComments(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                {approvalStatus === 'pending' ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                                            onClick={() => handleApprovalSubmit('needs-revision')}
                                            disabled={isSubmittingReview}
                                        >
                                            <AlertTriangle className="size-4 mr-2" />
                                            Request Revision
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => handleApprovalSubmit('rejected')}
                                            disabled={isSubmittingReview}
                                        >
                                            <XCircle className="size-4 mr-2" />
                                            Reject Report
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprovalSubmit('approved')}
                                            disabled={isSubmittingReview || checklistProgress < 100}
                                        >
                                            {isSubmittingReview ? (
                                                <Loader2 className="size-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="size-4 mr-2" />
                                            )}
                                            Approve Report
                                        </Button>
                                    </>
                                ) : (
                                    <div className="w-full flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Shield className="size-5 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                Review submitted. Status: <strong>{approvalStatus}</strong>
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setApprovalStatus('pending');
                                                setReviewChecklist(defaultReviewChecklist);
                                                setReviewerComments('');
                                                localStorage.removeItem('reportApprovalStatus');
                                            }}
                                        >
                                            Reset Review
                                        </Button>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    )}

                    {/* Minimized Approval Panel Toggle */}
                    {(role === 'admin' || role === 'analyst') && !isPreview && !showApprovalPanel && (
                        <div className="mb-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowApprovalPanel(true)}
                                className="w-full justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <ClipboardCheck className="size-4" />
                                    Reviewer Approval Panel
                                    <Badge variant={
                                        approvalStatus === 'approved' ? 'success' :
                                            approvalStatus === 'rejected' ? 'destructive' :
                                                approvalStatus === 'needs-revision' ? 'warning' : 'outline'
                                    } className="ml-2">
                                        {approvalStatus}
                                    </Badge>
                                </span>
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    )}

                    {/* ── Expanded Module Analysis (5 specialised modules) ── */}
                    {(() => {
                        const EXPANDED_MODULES = [
                            {
                                key: 'financialData' as const,
                                label: 'Financial Analysis',
                                Icon: BarChart3,
                                subscore_labels: { revenue_model: 'Revenue Model', unit_economics: 'Unit Economics', projections: 'Projections', funding_requirements: 'Funding Requirements' },
                            },
                            {
                                key: 'economicData' as const,
                                label: 'Economic Analysis',
                                Icon: TrendingUp,
                                subscore_labels: { industry_structure: 'Industry Structure', pricing_power: 'Pricing Power', macro_indicators: 'Macro Indicators', cycle_resilience: 'Cycle Resilience' },
                            },
                            {
                                key: 'socialData' as const,
                                label: 'Social Analysis',
                                Icon: Users,
                                subscore_labels: { social_impact: 'Social Impact', demographic_fit: 'Demographic Fit', cultural_adoption: 'Cultural Adoption', stakeholder_trust: 'Stakeholder Trust' },
                            },
                            {
                                key: 'marketingData' as const,
                                label: 'Marketing Analysis',
                                Icon: Megaphone,
                                subscore_labels: { positioning: 'Positioning', digital_presence: 'Digital Presence', spend_efficiency: 'Spend Efficiency', gtm_execution: 'GTM Execution' },
                            },
                            {
                                key: 'environmentalData' as const,
                                label: 'Environmental Analysis',
                                Icon: Leaf,
                                subscore_labels: { impact: 'Environmental Impact', climate_risk: 'Climate Risk', certification: 'Certification', esg_alignment: 'ESG Alignment' },
                            },
                        ] as const;

                        const visibleModules = EXPANDED_MODULES.filter(m => (analysisData as any)[m.key]);
                        if (visibleModules.length === 0) return null;

                        const signalStyle = (signal: string) => {
                            if (signal === 'green') return 'bg-green-100 text-green-800 border-green-300';
                            if (signal === 'yellow') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                            return 'bg-red-100 text-red-800 border-red-300';
                        };
                        const signalDot = (signal: string) => {
                            if (signal === 'green') return 'bg-green-500';
                            if (signal === 'yellow') return 'bg-yellow-500';
                            return 'bg-red-500';
                        };

                        return (
                            <div className="mt-8 space-y-6">
                                <h2 className="text-2xl font-bold text-foreground">Expanded Module Analysis</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {visibleModules.map(({ key, label, Icon, subscore_labels }) => {
                                        const mod = (analysisData as any)[key] as NonNullable<typeof analysisData['financialData']>;
                                        return (
                                            <Card key={key} className="flex flex-col">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                                                        <span className="flex items-center gap-2">
                                                            <Icon className="size-5 text-primary" />
                                                            {label}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded border font-semibold ${signalStyle(mod.signal)}`}>
                                                            <span className={`inline-block size-2 rounded-full mr-1 ${signalDot(mod.signal)}`} />
                                                            {mod.signal.toUpperCase()}
                                                        </span>
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-2xl font-bold text-primary">{mod.score.toFixed(1)}</span>
                                                        <span className="text-sm text-muted-foreground">/ 10</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="flex-1 space-y-4">
                                                    {/* Subscores */}
                                                    <div className="space-y-1">
                                                        {(Object.entries(mod.subscores) as [string, number][]).map(([k, v]) => (
                                                            <div key={k} className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">{(subscore_labels as Record<string, string>)[k] ?? k}</span>
                                                                <span className="font-mono font-medium">{v.toFixed(1)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Summary */}
                                                    {mod.summary && (
                                                        <p className="text-sm text-muted-foreground border-t pt-3">{mod.summary}</p>
                                                    )}
                                                    {/* Risks */}
                                                    {mod.risks?.length > 0 && (
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Risks</p>
                                                            <ul className="space-y-1">
                                                                {mod.risks.map((r: string, i: number) => (
                                                                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                                                        <span className="text-destructive mt-0.5">•</span>
                                                                        {r}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {/* Recommendations */}
                                                    {mod.recommendations?.length > 0 && (
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Recommendations</p>
                                                            <ul className="space-y-1">
                                                                {mod.recommendations.map((r: string, i: number) => (
                                                                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                                                        <span className="text-primary mt-0.5">›</span>
                                                                        {r}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    <ReportView
                        analysisData={analysisData}
                        isPreview={isPreview}
                        visibleSections={visibleSections}
                        wizardResult={wizardResult}
                    />
                </div>
            </main>
        </EvaluationProvider>
    );
}
