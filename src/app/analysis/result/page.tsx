'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Timer, Eye } from 'lucide-react';

// Hooks and Utils
import { useToast } from '@/hooks/use-toast';

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

// Loading Component
import Loading from '../../loading';

// Sample Data and Types
import { sampleAnalysisData, type ComprehensiveAnalysisOutput } from '@/lib/sample-data';

// Type Definitions
export type UserRole = 'user' | 'admin' | 'reviewer';
export type ReportType = 'triage' | 'dd';
type ReportSection = { id: string; title: string; active: boolean; };



// Report Components Configuration
const allReportComponents = [
    { id: 'quick-summary', title: 'Quick Summary', component: QuickSummary },
    { id: 'executive-summary', title: 'Executive Summary', component: ExecutiveSummary },
    { id: 'tca-scorecard', title: 'TCA Scorecard', component: TcaScorecard },
    { id: 'risk-flags', title: 'Risk Flags & Mitigation', component: RiskFlags },
    { id: 'macro-trend-alignment', title: 'Macro Trend Alignment', component: MacroTrendAlignment },
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', component: BenchmarkComparison },
    { id: 'growth-classifier', title: 'Growth Classifier', component: GrowthClassifier },
    { id: 'gap-analysis', title: 'Gap Analysis', component: GapAnalysis },
    { id: 'funder-fit-analysis', title: 'Funder Fit Analysis', component: FunderFitAnalysis },
    { id: 'team-assessment', title: 'Team Assessment', component: TeamAssessment },
    { id: 'strategic-fit-matrix', title: 'Strategic Fit Matrix', component: StrategicFitMatrix }
];

// Helper function to extract the correct data for each component
function getComponentData(componentId: string, analysisData: ComprehensiveAnalysisOutput) {
    switch (componentId) {
        case 'macro-trend-alignment':
            return analysisData.macroData;
        case 'benchmark-comparison':
            return analysisData.benchmarkData;
        case 'growth-classifier':
            return analysisData.growthData;
        case 'gap-analysis':
            return analysisData.gapData;
        case 'funder-fit-analysis':
            return analysisData.founderFitData;
        case 'team-assessment':
            return analysisData.teamData;
        case 'tca-scorecard':
            return analysisData.tcaData;
        case 'risk-flags':
            return analysisData.riskData;
        case 'strategic-fit-matrix':
            return analysisData.strategicFitData;
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
                    <Component data={getComponentData(id, analysisData)} />
                </div>
            ))}
        </div>
    );
}

// Main Page Component
export default function AnalysisResultPage({
    searchParams
}: {
    searchParams: { preview?: string; type?: string }
}) {
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<UserRole>('user');
    const [reportType, setReportType] = useState<ReportType>('triage');
    const [framework, setFramework] = useState<'general' | 'medtech'>('general');
    const [visibleSections, setVisibleSections] = useState<ReportSection[]>([]);

    const isPreview = searchParams.preview === 'true';
    const analysisDuration = 45.32; // Sample duration
    const analysisData = sampleAnalysisData;

    // Load user role and configuration
    useEffect(() => {
        const loadUserAndConfig = async () => {
            setIsLoading(true);

            // Load user role
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const userRole = user.role?.toLowerCase() || 'user';
                    setRole(userRole as UserRole);
                } catch (e) {
                    console.error('Failed to parse user data:', e);
                    setRole('user');
                }
            }

            // Set report type from URL params
            if (searchParams.type === 'dd') {
                setReportType('dd');
            }

            setIsLoading(false);
        };

        loadUserAndConfig();
    }, [searchParams.type]);

    // Load configuration based on role and report type
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

            if (reportType === 'triage') {
                configKey = isPrivileged ? 'report-config-triage-admin' : 'report-config-triage-standard';
            } else {
                configKey = 'report-config-dd';
            }

            const savedConfig = localStorage.getItem(configKey);
            if (savedConfig) {
                setVisibleSections(JSON.parse(savedConfig));
            } else {
                // Fallback to default configuration
                const defaultConfig = [
                    { id: 'quick-summary', title: 'Quick Summary', active: true },
                    { id: 'executive-summary', title: 'Executive Summary', active: true },
                    { id: 'tca-scorecard', title: 'TCA Scorecard', active: true }
                ];
                setVisibleSections(defaultConfig);
            }
        } catch (e) {
            console.error("Failed to load report configuration:", e);
            // Set minimal default configuration on error
            setVisibleSections([
                { id: 'quick-summary', title: 'Quick Summary', active: true }
            ]);
        }
    }, [role, reportType, isPreview]);

    const handleRunAnalysis = async () => {
        toast({
            title: 'Navigating to New Analysis',
            description: 'Redirecting to the analysis page...'
        });
        router.push('/dashboard/evaluation');
    };

    if (isLoading) {
        return <Loading />;
    }

    return (
        <EvaluationProvider
            role={role}
            reportType={reportType}
            framework={framework}
            onFrameworkChange={setFramework}
            setReportType={setReportType}
            isLoading={isLoading}
            handleRunAnalysis={handleRunAnalysis}
        >
            <main className="bg-background text-foreground min-h-screen">
                <div className="container mx-auto p-4 md:p-8">
                    <header className="mb-12">
                        <div className="relative text-center">
                            <h1 className="text-3xl font-bold mb-4">
                                Technology Commercialization Analysis
                            </h1>
                            <div className="absolute top-0 right-0 flex gap-2">
                                {!isPreview && (
                                    <Button asChild variant="outline">
                                        <Link href="/dashboard/evaluation">
                                            New Analysis
                                        </Link>
                                    </Button>
                                )}
                                <ExportButtons />
                            </div>
                        </div>

                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-center">
                            Review the complete output from all analysis modules before generating the final report.
                        </p>

                        {analysisDuration && !isPreview && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Timer className="size-4" />
                                <span>
                                    Analysis completed in {analysisDuration.toFixed(2)} seconds.
                                </span>
                            </div>
                        )}
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