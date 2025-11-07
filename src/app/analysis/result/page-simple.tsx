'use client';
import React from 'react';
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
import { ArrowLeft, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardCard } from '@/components/shared/dashboard-card';

function ResultContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reportType = searchParams.get('type') || 'triage'; // 'triage' or 'dd'
    const companyName = 'Company Analysis';

    // Mock benchmark comparison data - replace with actual data from your context
    const mockBenchmarkData: GenerateBenchmarkComparisonOutput = {
        benchmarkMetrics: [],
        comparisonResults: [],
        industryAverages: {},
        competitivePosition: 'average'
    };

    const mockTcaData = {
        categories: [],
        compositeScore: 75,
        summary: 'Analysis complete'
    };

    const mockRiskData = {
        riskSummary: 'Risk assessment complete',
        riskFlags: []
    };

    const mockRiskFlagsData = {
        riskFlags: [],
        mitigationStrategies: [],
        riskScore: 0,
        recommendations: []
    };

    const handleBack = () => {
        router.back();
    };

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

                {/* TCA AI Table - Core Analysis */}
                <TcaAiTable data={mockTcaData} />

                {/* Weighted Score Breakdown - After TCA table as requested */}
                <WeightedScoreBreakdown data={mockTcaData} />

                {/* Risk Flag Summary Table - Risk Assessment */}
                <RiskFlagSummaryTable data={mockRiskData} />

                {/* Report Type Specific Content */}
                {reportType === 'dd' ? (
                    <>
                        {/* Detailed Due Diligence Components */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <BenchmarkComparison initialData={mockBenchmarkData} />
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
                        <RiskFlags />
                        <ExitStrategyRoadmap />
                        <CEOQuestions />
                        <FinalRecommendation />
                    </>
                ) : (
                    <>
                        {/* Triage Report - Key Components Only */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <BenchmarkComparison initialData={mockBenchmarkData} />
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
