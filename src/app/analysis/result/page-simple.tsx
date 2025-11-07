'use client';
import React, { useState, useEffect } from 'react';
import { EvaluationProvider, useEvaluationContext } from '@/components/evaluation/evaluation-provider';
import { ExecutiveSummary } from '@/components/evaluation/executive-summary';
import { BenchmarkComparison, type GenerateBenchmarkComparisonOutput } from '@/components/evaluation/benchmark-comparison';
import { GapAnalysis } from '@/components/evaluation/gap-analysis';
import { GrowthClassifier } from '@/components/evaluation/growth-classifier';
import { RiskFlags } from '@/components/evaluation/risk-flags';
import { CompetitiveLandscape } from '@/components/evaluation/competitive-landscape';
import { FinalRecommendation } from '@/components/evaluation/final-recommendation';
import { TeamAssessment } from '@/components/evaluation/team-assessment';
import { ExitStrategyRoadmap } from '@/components/evaluation/exit-strategy-roadmap';
import { FunderFitAnalysis } from '@/components/evaluation/funder-fit-analysis';
import { TcaAiTable } from '@/components/evaluation/tca-ai-table';
import { RiskFlagSummaryTable } from '@/components/evaluation/risk-flag-summary-table';
import { WeightedScoreBreakdown } from '@/components/evaluation/weighted-score-breakdown';
import { CEOQuestions } from '@/components/evaluation/ceo-questions';
import { ExportButtons } from '@/components/evaluation/export-buttons';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { runAnalysis } from '../actions';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import Loading from '@/app/loading';

function ResultContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reportType = searchParams.get('type') || 'triage'; // 'triage' or 'dd'
    const framework = (searchParams.get('framework') || 'general') as 'general' | 'medtech';
    const companyName = searchParams.get('company') || 'Company Analysis';

    const [analysisData, setAnalysisData] = useState<ComprehensiveAnalysisOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load analysis data on component mount
    useEffect(() => {
        const loadAnalysisData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // First try to load from localStorage
                const storedData = localStorage.getItem('analysisResult');
                if (storedData) {
                    const parsedData: ComprehensiveAnalysisOutput = JSON.parse(storedData);
                    setAnalysisData(parsedData);
                    setIsLoading(false);
                    return;
                }

                // If no stored data, run new analysis
                console.log('No stored analysis data found. Running new analysis...');
                const result = await runAnalysis(framework, {
                    companyName: companyName,
                    companyDescription: `A ${framework} company seeking investment evaluation.`,
                    uploadedFiles: [],
                    importedUrls: [],
                    submittedTexts: []
                });

                setAnalysisData(result);
                // Store for future use
                localStorage.setItem('analysisResult', JSON.stringify(result));

            } catch (err) {
                console.error('Failed to load analysis data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load analysis data');
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalysisData();
    }, [framework, companyName]);

    const handleBack = () => {
        router.back();
    };

    const handleRefreshAnalysis = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Clear stored data and run fresh analysis
            localStorage.removeItem('analysisResult');

            const result = await runAnalysis(framework, {
                companyName: companyName,
                companyDescription: `A ${framework} company seeking comprehensive investment evaluation.`,
                uploadedFiles: [],
                importedUrls: [],
                submittedTexts: []
            });

            setAnalysisData(result);
            localStorage.setItem('analysisResult', JSON.stringify(result));

        } catch (err) {
            console.error('Failed to refresh analysis:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh analysis');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <h2 className="text-xl font-semibold">Running Comprehensive Analysis</h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        Analyzing all 9 modules with real AI-powered evaluation. This may take a few moments...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <h2 className="text-xl font-semibold text-destructive">Analysis Error</h2>
                    <p className="text-muted-foreground text-center max-w-md">{error}</p>
                    <Button onClick={handleRefreshAnalysis} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!analysisData) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">No Analysis Data</h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        No analysis data found. Please run an analysis first.
                    </p>
                    <Button onClick={handleRefreshAnalysis}>
                        Run Analysis
                    </Button>
                </div>
            </div>
        );
    }

    const reportTitle = reportType === 'dd' ? 'Due Diligence Report' : 'Triage Report';
    const reportDescription = reportType === 'dd'
        ? 'Comprehensive analysis with detailed risk assessment and strategic recommendations'
        : 'Initial assessment with key findings and preliminary recommendations';

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Analysis
                    </Button>
                    <ExportButtons />
                </div>

                <DashboardCard
                    title={`${reportTitle}: ${companyName}`}
                    icon={reportType === 'dd' ? FileText : BarChart3}
                    description={reportDescription}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-sm text-muted-foreground">Report Type</div>
                            <div className="font-bold text-primary">{reportTitle}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Analysis Date</div>
                            <div className="font-bold text-foreground">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="font-bold text-success">Complete</div>
                        </div>
                    </div>
                </DashboardCard>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-8">
                {/* Executive Summary - Always First */}
                <ExecutiveSummary />

                {/* TCA AI Table - Core Analysis with Real Data */}
                <TcaAiTable data={analysisData.tcaData} />

                {/* Weighted Score Breakdown - Real TCA Analysis */}
                <WeightedScoreBreakdown data={analysisData.tcaData} />

                {/* Risk Flag Summary Table - Real Risk Assessment */}
                <RiskFlagSummaryTable data={analysisData.riskData} />

                {/* Report Type Specific Content */}
                {reportType === 'dd' ? (
                    <>
                        {/* Detailed Due Diligence Components */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <BenchmarkComparison initialData={analysisData.benchmarkData || {
                                benchmarkOverlay: [],
                                competitorAnalysis: [],
                                performanceSummary: "Analysis pending...",
                                overlayScore: 0
                            }} />
                            <GapAnalysis />
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <GrowthClassifier />
                            <TeamAssessment />
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <CompetitiveLandscape />
                            <FunderFitAnalysis />
                        </div>
                        <RiskFlags initialData={analysisData.riskData} />
                        <ExitStrategyRoadmap />
                        <CEOQuestions />
                        <FinalRecommendation />
                    </>
                ) : (
                    <>
                        {/* Triage Report - Key Components Only */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <BenchmarkComparison initialData={analysisData.benchmarkData || {
                                benchmarkOverlay: [],
                                competitorAnalysis: [],
                                performanceSummary: "Analysis pending...",
                                overlayScore: 0
                            }} />
                            <GrowthClassifier />
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <GapAnalysis />
                            <TeamAssessment />
                        </div>
                        <FinalRecommendation />

                        {/* Alert for Comprehensive Analysis */}
                        <DashboardCard
                            title="Need More Detailed Analysis?"
                            icon={AlertTriangle}
                            description="This triage report provides initial insights. For comprehensive due diligence, generate a full DD report."
                        >
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Full DD reports include competitive landscape, exit strategy roadmap,
                                    detailed risk mitigation, and comprehensive funder fit analysis.
                                </div>
                                <Button
                                    onClick={() => router.push(`/analysis/result?type=dd`)}
                                    className="shrink-0"
                                >
                                    Generate DD Report
                                </Button>
                            </div>
                        </DashboardCard>
                    </>
                )}

                {/* Debug Information for Development */}
                {process.env.NODE_ENV === 'development' && (
                    <DashboardCard
                        title="Analysis Debug Info"
                        icon={BarChart3}
                        description="Development information about the analysis data"
                    >
                        <div className="space-y-4 text-sm">
                            <div>
                                <strong>Framework:</strong> {framework}
                            </div>
                            <div>
                                <strong>Report Type:</strong> {reportType}
                            </div>
                            <div>
                                <strong>Company:</strong> {companyName}
                            </div>
                            <div>
                                <strong>TCA Categories:</strong> {analysisData.tcaData?.categories?.length || 0}/12
                            </div>
                            <div>
                                <strong>Risk Flags:</strong> {analysisData.riskData?.riskFlags?.length || 0}
                            </div>
                            <div>
                                <strong>Composite Score:</strong> {analysisData.tcaData?.compositeScore || 'N/A'}
                            </div>
                            <Button onClick={handleRefreshAnalysis} variant="outline" size="sm" className="mt-4">
                                Refresh Analysis
                            </Button>
                        </div>
                    </DashboardCard>
                )}
            </div>
        </div>
    );
}

export default function ResultPage() {
    const handleFrameworkChange = () => { };
    const handleReportTypeChange = () => { };
    const handleFilesChange = () => { };
    const handleUrlsChange = () => { };
    const handleTextsChange = () => { };
    const handleRunAnalysis = async () => { };

    return (
        <EvaluationProvider
            role="user"
            reportType="triage"
            framework="general"
            onFrameworkChangeAction={handleFrameworkChange}
            setReportTypeAction={handleReportTypeChange}
            uploadedFiles={[]}
            setUploadedFilesAction={handleFilesChange}
            importedUrls={[]}
            setImportedUrlsAction={handleUrlsChange}
            submittedTexts={[]}
            setSubmittedTextsAction={handleTextsChange}
            isLoading={false}
            handleRunAnalysisAction={handleRunAnalysis}
        >
            <ResultContent />
        </EvaluationProvider>
    );
}
