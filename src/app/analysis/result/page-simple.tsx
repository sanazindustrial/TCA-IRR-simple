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
        benchmarkOverlay: [],
        competitorAnalysis: [],
        performanceSummary: '',
        overlayScore: 0
    };

    const mockTcaData = {
        categories: [
            { category: 'Leadership', rawScore: 8.5, weight: 15, weightedScore: 1.28, flag: 'green' as const, pestel: 'Political: Regulatory approval processes; Social: Public trust in leadership', description: 'Evaluates founder/CEO experience, vision clarity, and decision-making capability', strengths: 'Strong technical background, clear communication, proven track record', concerns: 'Limited industry experience, single founder risk', interpretation: 'Strong leadership foundation with room for advisory board expansion', aiRecommendation: 'Consider adding industry veterans to advisory board' },
            { category: 'Regulatory/Compliance', rawScore: 7.0, weight: 15, weightedScore: 1.05, flag: 'yellow' as const, pestel: 'Political: FDA regulations; Legal: Compliance requirements; Economic: Approval costs', description: 'Assesses regulatory pathway clarity, compliance readiness, and approval timeline', strengths: 'Clear regulatory pathway identified, initial FDA engagement', concerns: 'Complex approval process, potential delays, high compliance costs', interpretation: 'Moderate regulatory risk with manageable pathway', aiRecommendation: 'Engage regulatory consultant and establish compliance timeline' },
            { category: 'Product-Market Fit', rawScore: 9.0, weight: 15, weightedScore: 1.35, flag: 'green' as const, pestel: 'Social: Patient needs; Economic: Market demand; Technological: Innovation fit', description: 'Measures product-market alignment, customer validation, and market demand evidence', strengths: 'Strong customer validation, clear unmet need, positive pilot results', concerns: 'Limited market testing, potential competition', interpretation: 'Excellent product-market alignment with strong validation', aiRecommendation: 'Expand pilot programs and gather additional customer testimonials' },
            { category: 'Team Strength', rawScore: 7.5, weight: 10, weightedScore: 0.75, flag: 'yellow' as const, pestel: 'Social: Team dynamics; Economic: Talent costs; Technological: Technical expertise', description: 'Evaluates team composition, expertise coverage, and execution capability', strengths: 'Strong technical team, complementary skills, good retention', concerns: 'Missing commercial expertise, limited sales experience', interpretation: 'Solid foundation requiring commercial talent addition', aiRecommendation: 'Recruit experienced commercial team members' },
            { category: 'Technology & IP', rawScore: 8.0, weight: 10, weightedScore: 0.80, flag: 'green' as const, pestel: 'Technological: Innovation level; Legal: IP protection; Economic: R&D investment', description: 'Assesses technology differentiation, IP portfolio strength, and defensibility', strengths: 'Strong patent portfolio, innovative technology, clear differentiation', concerns: 'Competitive IP landscape, potential infringement risks', interpretation: 'Well-protected innovative technology with competitive advantages', aiRecommendation: 'Continue IP development and monitor competitive landscape' },
            { category: 'Business Model & Financials', rawScore: 7.0, weight: 10, weightedScore: 0.70, flag: 'yellow' as const, pestel: 'Economic: Revenue model; Legal: Contract structures; Political: Reimbursement', description: 'Reviews revenue model viability, unit economics, and financial sustainability', strengths: 'Clear revenue model, positive unit economics potential', concerns: 'Unproven scalability, reimbursement uncertainty', interpretation: 'Promising model requiring validation and refinement', aiRecommendation: 'Validate unit economics through pilot implementations' },
            { category: 'Go-to-Market Strategy', rawScore: 6.5, weight: 5, weightedScore: 0.33, flag: 'red' as const, pestel: 'Social: Customer adoption; Economic: Market access costs; Political: Channel regulations', description: 'Evaluates market entry strategy, sales approach, and customer acquisition plan', strengths: 'Identified key customer segments, partnership opportunities', concerns: 'Unclear sales strategy, limited channel validation, high CAC', interpretation: 'GTM strategy needs significant development and validation', aiRecommendation: 'Develop detailed sales playbook and validate customer acquisition channels' },
            { category: 'Competition & Moat', rawScore: 7.8, weight: 5, weightedScore: 0.39, flag: 'yellow' as const, pestel: 'Economic: Market competition; Technological: Competitive advantages; Legal: Barriers', description: 'Analyzes competitive landscape, differentiation, and sustainable advantages', strengths: 'Clear differentiation, technological advantages, patent protection', concerns: 'Emerging competitors, potential market consolidation', interpretation: 'Strong competitive position with moderate threat monitoring needed', aiRecommendation: 'Monitor competitive developments and strengthen market positioning' },
            { category: 'Market Potential', rawScore: 8.8, weight: 5, weightedScore: 0.44, flag: 'green' as const, pestel: 'Economic: Market size; Social: Demographics; Technological: Adoption trends', description: 'Assesses total addressable market, growth trends, and market dynamics', strengths: 'Large TAM, growing market, favorable demographics', concerns: 'Market fragmentation, adoption barriers', interpretation: 'Excellent market opportunity with strong growth potential', aiRecommendation: 'Focus on addressable segments and develop market entry priorities' },
            { category: 'Traction', rawScore: 7.2, weight: 5, weightedScore: 0.36, flag: 'yellow' as const, pestel: 'Economic: Revenue growth; Social: Customer adoption; Technological: Usage metrics', description: 'Measures customer adoption, revenue growth, and validation milestones', strengths: 'Early customer adoption, positive feedback, pilot agreements', concerns: 'Limited revenue, slow customer onboarding, pilot conversion', interpretation: 'Promising early traction requiring acceleration', aiRecommendation: 'Accelerate pilot conversions and expand customer base' },
            { category: 'Scalability', rawScore: 6.8, weight: 2.5, weightedScore: 0.17, flag: 'yellow' as const, pestel: 'Technological: Infrastructure; Economic: Cost structure; Social: Team scaling', description: 'Evaluates business scalability, operational leverage, and growth sustainability', strengths: 'Technology scalability, automation potential', concerns: 'Manual processes, limited operational systems', interpretation: 'Moderate scalability with operational improvements needed', aiRecommendation: 'Implement scalable processes and operational systems' },
            { category: 'Risk Assessment', rawScore: 7.5, weight: 2.5, weightedScore: 0.19, flag: 'yellow' as const, pestel: 'All factors: Comprehensive risk evaluation across PESTEL dimensions', description: 'Overall risk evaluation including operational, financial, and strategic risks', strengths: 'Identified risk mitigation strategies, proactive risk management', concerns: 'Regulatory risks, market timing, execution risks', interpretation: 'Manageable risk profile with identified mitigation strategies', aiRecommendation: 'Implement risk monitoring dashboard and contingency plans' }
        ],
        compositeScore: 7.67,
        summary: 'Comprehensive analysis across 12 key evaluation categories showing strong overall performance with targeted improvement opportunities.'
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
                        <RiskFlags initialData={mockRiskFlagsData} />
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
