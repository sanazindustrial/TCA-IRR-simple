
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
// Define the type locally until the correct import path is established
type ComprehensiveAnalysisOutput = {
    tcaData: {
        categories: Array<{
            category: string;
            rawScore: number;
            weight: number;
            weightedScore: number;
            flag: "green" | "yellow" | "red";
            pestel: string;
            description: string;
            strengths: string;
            concerns: string;
            interpretation: string;
            aiRecommendation: string;
        }>;
        compositeScore: number;
        summary: string;
    };
    riskData: {
        riskSummary: string;
        riskFlags: Array<{
            domain: string;
            flag: string;
            trigger: string;
            description: string;
            impact: string;
            mitigation: string;
            aiRecommendation: string;
            thresholds: string;
        }>;
    };
    macroData: {
        pestelDashboard: {
            political: number;
            economic: number;
            social: number;
            technological: number;
            environmental: number;
            legal: number;
        };
        trendOverlayScore: number;
        summary: string;
        sectorOutlook: string;
        trendSignals: string[];
    };
    benchmarkData: {
        benchmarkOverlay: Array<{
            category: string;
            score: number;
            avg: number;
            percentile: number;
            deviation: number;
        }>;
        competitorAnalysis: Array<{
            metric: string;
            startup: number;
            competitorA: number;
            competitorB: number;
        }>;
        performanceSummary: string;
        overlayScore: number;
    };
    growthData: any;
    gapData: {
        heatmap: Array<{
            category: string;
            gap: number;
            priority: string;
            trend: number;
            direction: string;
        }>;
        roadmap: Array<{
            area: string;
            action: string;
            type: string;
        }>;
        interpretation: string;
    };
    founderFitData: {
        readinessScore: number;
        investorList: Array<{
            name: string;
            thesis: string;
            match: number;
            stage: string;
        }>;
        interpretation: string;
    };
    teamData: {
        members: Array<{
            id: string;
            name: string;
            role: string;
            experience: string;
            skills: string;
            avatarId: string;
        }>;
        interpretation: string;
    };
    strategicFitData: any;
};
import { BenchmarkComparison } from '@/components/evaluation/benchmark-comparison';
import { FunderFitAnalysis } from '@/components/evaluation/funder-fit-analysis';
import { GapAnalysis } from '@/components/evaluation/gap-analysis';
import { GrowthClassifier } from '@/components/evaluation/growth-classifier';
import { MacroTrendAlignment } from '@/components/evaluation/macro-trend-alignment';
import { RiskFlags } from '@/components/evaluation/risk-flags';
import { StrategicFitMatrix } from '@/components/evaluation/strategic-fit-matrix';
import { TcaScorecard } from '@/components/evaluation/tca-scorecard';
import { TeamAssessment } from '@/components/evaluation/team-assessment';
import { Button } from '@/components/ui/button';
import Loading from '../../loading';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, Eye } from 'lucide-react';
import { ExportButtons } from '@/components/evaluation/export-buttons';
import { EvaluationProvider, useEvaluationContext } from '@/components/evaluation/evaluation-provider';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QuickSummary } from '@/components/evaluation/quick-summary';
import { ExecutiveSummary } from '@/components/evaluation/executive-summary';
import { TcaSummaryCard } from '@/components/evaluation/tca-summary-card';
import { ConsistencyCheck } from '@/components/evaluation/consistency-check';
import { ReviewerComments } from '@/components/evaluation/reviewer-comments';
import { FinalRecommendation } from '@/components/evaluation/final-recommendation';
import { useRouter } from 'next/navigation';
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

export type UserRole = 'user' | 'admin' | 'reviewer';
export type ReportType = 'triage' | 'dd';
type ReportSection = { id: string; title: string; active: boolean; };

// --- Start of Sample Data ---
const sampleTcaData: ComprehensiveAnalysisOutput['tcaData'] = {
    categories: [
        { category: 'Leadership', rawScore: 8.5, weight: 20, weightedScore: 1.7, flag: 'green', pestel: 'Social', description: 'Assesses the quality, experience, and vision of the leadership team.', strengths: 'Experienced founders with multiple prior exits.', concerns: 'First-time CEO.', interpretation: 'Strong leadership is a key asset.', aiRecommendation: 'Leverage founder track record in investor meetings.' },
        { category: 'Product-Market Fit', rawScore: 9.0, weight: 20, weightedScore: 1.8, flag: 'green', pestel: 'Technological', description: 'Measures how well the product solves a market problem.', strengths: 'High user engagement and positive feedback.', concerns: 'Niche market, limited scalability.', interpretation: 'Excellent PMF in a targeted niche.', aiRecommendation: 'Double down on the current niche before expanding.' },
        { category: 'Team Strength', rawScore: 7.5, weight: 10, weightedScore: 0.75, flag: 'yellow', pestel: 'Social', description: 'Evaluates the team\'s skills and completeness.', strengths: 'Strong technical expertise.', concerns: 'Lacks a dedicated marketing lead.', interpretation: 'Solid technical team, needs commercial side.', aiRecommendation: 'Prioritize hiring a Head of Marketing.' },
        { category: 'Technology & IP', rawScore: 8.0, weight: 10, weightedScore: 0.8, flag: 'green', pestel: 'Technological', description: 'Analyzes the technology stack and intellectual property.', strengths: 'Proprietary algorithm with a pending patent.', concerns: 'Dependent on third-party APIs.', interpretation: 'Strong, defensible technology.', aiRecommendation: 'Expedite patent prosecution and explore alternatives for key APIs.' },
        { category: 'Business Model & Financials', rawScore: 7.0, weight: 10, weightedScore: 0.7, flag: 'yellow', pestel: 'Economic', description: 'Reviews the business model, revenue streams, and financial health.', strengths: 'Clear path to profitability.', concerns: 'High burn rate, short runway.', interpretation: 'Viable model but needs cash management.', aiRecommendation: 'Revise financial model to extend runway to 18+ months.' },
        { category: 'Go-to-Market Strategy', rawScore: 6.5, weight: 10, weightedScore: 0.65, flag: 'red', pestel: 'Economic', description: 'Assesses the plan for reaching customers.', strengths: 'Initial traction in one channel.', concerns: 'Over-reliance on a single acquisition channel.', interpretation: 'GTM strategy needs diversification.', aiRecommendation: 'Test two new acquisition channels (e.g., content, partnerships) immediately.' },
        { category: 'Competition & Moat', rawScore: 7.8, weight: 5, weightedScore: 0.39, flag: 'yellow', pestel: 'Economic', description: 'Evaluates the competitive landscape and defensibility.', strengths: 'Strong network effects.', concerns: 'Several large, well-funded competitors.', interpretation: 'Competitive market but has a defensible moat.', aiRecommendation: 'Focus product roadmap on features that deepen the network effect.' },
        { category: 'Market Potential', rawScore: 8.8, weight: 5, weightedScore: 0.44, flag: 'green', pestel: 'Economic', description: 'Analyzes the size and growth of the target market.', strengths: 'Large and growing Total Addressable Market (TAM).', concerns: 'Regulatory hurdles could slow adoption.', interpretation: 'Significant market opportunity.', aiRecommendation: 'Develop a strategy to navigate potential regulatory changes.' },
        { category: 'Traction', rawScore: 7.2, weight: 5, weightedScore: 0.36, flag: 'yellow', pestel: 'Social', description: 'Measures current progress and user adoption.', strengths: 'Consistent month-over-month user growth.', concerns: 'High customer churn in the first month.', interpretation: 'Good initial traction but retention is a concern.', aiRecommendation: 'Improve user onboarding to address early-stage churn.' },
        { category: 'Scalability', rawScore: 8.1, weight: 2.5, weightedScore: 0.20, flag: 'green', pestel: 'Technological', description: 'Assesses the ability to grow efficiently.', strengths: 'Cloud-native architecture.', concerns: 'Customer support may become a bottleneck.', interpretation: 'Technically scalable, ops may lag.', aiRecommendation: 'Plan for scalable customer support solutions (e.g., knowledge base, tiered support).' },
        { category: 'Risk Assessment', rawScore: 7.0, weight: 2.5, weightedScore: 0.18, flag: 'yellow', pestel: 'Legal', description: 'Overall risk profile.', strengths: 'Proactive legal and compliance measures.', concerns: 'Identified market and financial risks.', interpretation: 'Key risks are manageable.', aiRecommendation: 'Assign owners to each identified risk and track mitigation progress.' },
        { category: 'Exit Potential', rawScore: 8.2, weight: 0, weightedScore: 0, flag: 'green', pestel: 'Economic', description: 'Potential for a successful exit (M&A or IPO).', strengths: 'Active M&A in the sector.', concerns: 'Public market conditions are volatile.', interpretation: 'Clear exit paths exist.', aiRecommendation: 'Build relationships with potential strategic acquirers early.' },
    ],
    compositeScore: 8.17,
    summary: 'Innovate Inc. shows strong potential with excellent leadership and product-market fit. Key concerns are the high burn rate and a narrow go-to-market strategy. The recommendation is to proceed to due diligence, focusing on financial health and customer acquisition strategy.',
};

const sampleRiskData: ComprehensiveAnalysisOutput['riskData'] = {
    riskSummary: 'The primary risks are market competition and go-to-market execution. While technical and legal risks are low, the company\'s success hinges on its ability to out-maneuver larger competitors and diversify its customer acquisition channels. A red flag in GTM requires immediate attention.',
    riskFlags: [
        { domain: 'Regulatory / Compliance', flag: 'green', trigger: 'Standard privacy policy in place.', description: 'Compliant with GDPR and CCPA.', impact: 'Low', mitigation: 'Monitor for changes in data privacy laws.', aiRecommendation: 'Current measures are sufficient for this stage.', thresholds: 'Green if standard policies are present.' },
        { domain: 'Clinical / Safety / Product Safety', flag: 'green', trigger: 'N/A for B2B SaaS.', description: 'Not applicable for non-medical software.', impact: 'Low', mitigation: 'N/A', aiRecommendation: 'N/A', thresholds: 'Green for non-health tech.' },
        { domain: 'Liability / Legal Exposure', flag: 'green', trigger: 'Standard ToS and corporate structure.', description: 'Standard terms of service and legal structure are in place.', impact: 'Low', mitigation: 'Review contracts with legal counsel.', aiRecommendation: 'Standard legal review recommended.', thresholds: 'Green for standard legal setup.' },
        { domain: 'Technical Execution Risk', flag: 'green', trigger: 'Robust, scalable, and well-documented tech stack.', description: 'Modern architecture with high test coverage.', impact: 'Low', mitigation: 'Continue best practices for code review and CI/CD.', aiRecommendation: 'Maintain current technical standards.', thresholds: 'Green if test coverage >80%.' },
        { domain: 'Market Risk', flag: 'yellow', trigger: 'Incumbent competitors are well-funded.', description: 'The market has 3-4 established players.', impact: 'Medium', mitigation: 'Focus on a niche vertical to establish a strong foothold before expanding.', aiRecommendation: 'Niche-down strategy is advised.', thresholds: 'Yellow if >2 major competitors.' },
        { domain: 'Go-To-Market (GTM) Risk', flag: 'red', trigger: 'Over 80% of leads from a single channel.', description: 'High dependency on paid search.', impact: 'High', mitigation: 'Develop and test at least two new acquisition channels in the next quarter (e.g., content marketing, partnerships).', aiRecommendation: 'Diversify acquisition channels immediately.', thresholds: 'Red if >75% dependency on one channel.' },
        { domain: 'Financial Risk', flag: 'yellow', trigger: '12-month runway with current burn.', description: 'Runway is shorter than the ideal 18+ months.', impact: 'Medium', mitigation: 'Model scenarios for reduced spending or faster revenue growth.', aiRecommendation: 'Prepare a plan for runway extension within 6 months.', thresholds: 'Yellow if runway < 18 months.' },
        { domain: 'Team / Execution Risk', flag: 'yellow', trigger: 'Key person dependency on CEO.', description: 'The CEO is the primary driver of sales and product vision.', impact: 'Medium', mitigation: 'Cross-train team members and document key processes.', aiRecommendation: 'Delegate more responsibilities to build team redundancy.', thresholds: 'Yellow if clear key-person risk exists.' },
        { domain: 'IP / Defensibility Risk', flag: 'green', trigger: 'Proprietary algorithm with pending patent.', description: 'A patent has been filed for the core algorithm.', impact: 'Low', mitigation: 'Continue patent prosecution and monitor for infringement.', aiRecommendation: 'Strong IP position for this stage.', thresholds: 'Green if IP is filed.' },
        { domain: 'Data Privacy / Governance', flag: 'green', trigger: 'GDPR/CCPA compliant processes in place.', description: 'Data handling policies are up-to-date.', impact: 'Low', mitigation: 'Regularly review and update data handling policies.', aiRecommendation: 'Maintain compliance with evolving regulations.', thresholds: 'Green if compliant.' },
        { domain: 'Security / Cyber Risk', flag: 'green', trigger: 'Standard security measures implemented.', description: 'Uses industry-standard encryption and security protocols.', impact: 'Low', mitigation: 'Conduct regular security audits and penetration testing.', aiRecommendation: 'Sufficient for current stage, plan for future audits.', thresholds: 'Green for standard measures.' },
        { domain: 'Operational / Supply Chain', flag: 'green', trigger: 'N/A for pure software.', description: 'No physical supply chain.', impact: 'Low', mitigation: 'N/A', aiRecommendation: 'N/A', thresholds: 'Green for software companies.' },
        { domain: 'Ethical / Societal Risk', flag: 'green', trigger: 'No major ethical concerns identified.', description: 'The product has a positive societal impact.', impact: 'Low', mitigation: 'Establish an ethics committee as the company grows.', aiRecommendation: 'No immediate action needed.', thresholds: 'Green if no concerns.' },
        { domain: 'Adoption / Customer Retention Risk', flag: 'yellow', trigger: 'High churn in first 30 days.', description: 'User data shows a 15% churn rate in the first month.', impact: 'Medium', mitigation: 'Improve onboarding process and user support.', aiRecommendation: 'Focus on early user success to reduce churn.', thresholds: 'Yellow if churn > 10%.' }
    ],
};

const sampleMacroData: ComprehensiveAnalysisOutput['macroData'] = {
    pestelDashboard: { political: 7, economic: 6, social: 8, technological: 9, environmental: 7, legal: 8 },
    trendOverlayScore: 0.04,
    summary: 'The company is well-aligned with major technological and social trends, such as the adoption of AI and the shift to remote work. Economic headwinds (e.g., inflation, rising interest rates) present a moderate risk but are offset by the cost-saving nature of the product.',
    sectorOutlook: 'The B2B SaaS sector remains strong, with high demand for efficiency-boosting software. Companies with clear ROI will continue to thrive despite economic pressures.',
    trendSignals: ['Increased enterprise adoption of AI', 'Global supply chain optimization focus', 'Rising importance of data privacy'],
};

const sampleBenchmarkData: ComprehensiveAnalysisOutput['benchmarkData'] = {
    benchmarkOverlay: [
        { category: 'Revenue Growth', score: 8.5, avg: 6.5, percentile: 80, deviation: 2.0 },
        { category: 'Net Retention', score: 7.0, avg: 7.5, percentile: 45, deviation: -0.5 },
        { category: 'LTV/CAC Ratio', score: 9.0, avg: 7.0, percentile: 85, deviation: 2.0 },
    ],
    competitorAnalysis: [
        { metric: 'Growth', startup: 8.5, competitorA: 7.0, competitorB: 6.0 },
        { metric: 'Profitability', startup: 6.0, competitorA: 8.0, competitorB: 7.5 },
        { metric: 'Moat', startup: 9.0, competitorA: 7.5, competitorB: 8.0 },
        { metric: 'Team', startup: 8.0, competitorA: 9.0, competitorB: 7.0 },
        { metric: 'Tech', startup: 9.5, competitorA: 8.0, competitorB: 8.5 },
    ],
    performanceSummary: 'Innovate Inc. significantly outperforms its peers in revenue growth and LTV/CAC ratio, placing it in the top quintile. However, its net retention is slightly below average, suggesting a potential churn issue that needs investigation. Compared to direct competitors, it leads in technology and moat but lags in profitability.',
    overlayScore: 0.035
};

const sampleGrowthData: ComprehensiveAnalysisOutput['growthData'] = { tier: 2, confidence: 82, scenarios: [{ name: 'Worst Case', growth: 1.5 }, { name: 'Base Case', growth: 2.5 }, { name: 'Best Case', growth: 4.0 },], analysis: 'The growth model ensemble predicts a Tier 2 classification, indicating moderate growth potential. The base case scenario suggests a 2.5x YoY growth, driven by strong market positioning but constrained by team scalability. The sector-adjusted model slightly downgraded the score due to high competition in the B2B SaaS space.', models: [{ name: 'XGBoost', score: 8.1, contribution: '20%' }, { name: 'Random Forest', score: 7.9, contribution: '20%' }, { name: 'Neural Network', score: 8.3, contribution: '20%' }, { name: 'SVM', score: 7.8, contribution: '15%' }, { name: 'Gradient Boosting', score: 8.2, contribution: '15%' }, { name: 'Ensemble Voting', score: 8.0, contribution: '10%' },], interpretation: 'The classification as Tier 2 suggests a solid foundation but with clear areas for improvement to unlock high-growth potential. Key drivers are strong product-market fit and a large addressable market. However, scaling challenges and competitive pressures are significant headwinds that need to be addressed in the operational plan.' } as any;
const sampleGapData: ComprehensiveAnalysisOutput['gapData'] = {
    heatmap: [
        { category: 'Product Quality', gap: -15, priority: 'High', trend: -2, direction: 'down' },
        { category: 'Team Strength', gap: -25, priority: 'High', trend: -5, direction: 'down' },
        { category: 'Financial Viability', gap: 5, priority: 'Low', trend: 3, direction: 'up' },
    ],
    roadmap: [
        { area: 'Team Strength', action: 'Hire a senior backend engineer.', type: 'Priority Area' },
    ],
    interpretation: 'The gap analysis reveals critical deficiencies in Team Strength.'
};

const sampleFounderFitData: ComprehensiveAnalysisOutput['founderFitData'] = {
    readinessScore: 78,
    investorList: [{ name: 'Sequoia', thesis: 'SaaS', match: 92, stage: 'Seed' }],
    interpretation: 'Strong readiness score.'
};

const sampleTeamData: ComprehensiveAnalysisOutput['teamData'] = {
    members: [
        { id: '1', name: 'Alex Johnson', role: 'CEO', experience: '10+ years', skills: 'SaaS, Leadership', avatarId: 'avatar1' }
    ],
    interpretation: 'Experienced team.'
};
const sampleStrategicFitData: ComprehensiveAnalysisOutput['strategicFitData'] = {
    data: [
        { pathway: 'GTM Fit', signal: 'green', notes: 'Strong partner compatibility', trend: 0.2, direction: 'up' },
        { pathway: 'ESG Score', signal: 'green', notes: 'High sustainability alignment', trend: 0.1, direction: 'up' },
        { pathway: 'M&A Readiness', signal: 'yellow', notes: 'Needs better reporting', trend: -0.1, direction: 'down' },
        { pathway: 'VC Fit', signal: 'green', notes: 'Aligns with top-tier VC theses', trend: 0.0, direction: 'stable' },
    ],
    interpretation: "The startup shows strong alignment with GTM partners and ESG goals, which are positive signals. However, its M&A readiness is a moderate concern due to reporting gaps. The strong VC fit suggests it is well-positioned for fundraising within its target investor segment. The overall strategic fit is positive but requires operational improvements for M&A scenarios."
} as any;

const sampleAnalysisData: ComprehensiveAnalysisOutput = {
    tcaData: sampleTcaData,
    riskData: sampleRiskData,
    macroData: sampleMacroData,
    benchmarkData: sampleBenchmarkData,
    growthData: sampleGrowthData,
    gapData: sampleGapData,
    founderFitData: sampleFounderFitData,
    teamData: sampleTeamData,
    strategicFitData: sampleStrategicFitData,
};
// --- End of Sample Data ---

const allReportComponents: { id: string; title: string; component: React.ReactElement | null; }[] = [
    { id: 'quick-summary', title: 'Quick Summary', component: <QuickSummary /> },
    { id: 'tca-summary-card', title: 'TCA Summary Card', component: sampleAnalysisData.tcaData && <TcaSummaryCard initialData={sampleAnalysisData.tcaData} /> },
    { id: 'executive-summary', title: 'Executive Summary', component: <ExecutiveSummary /> },
    { id: 'tca-scorecard', title: 'TCA Scorecard', component: sampleAnalysisData.tcaData && <TcaScorecard initialData={sampleAnalysisData.tcaData} /> },
    { id: 'risk-flags', title: 'Risk Flags', component: sampleAnalysisData.riskData && <RiskFlags initialData={sampleAnalysisData.riskData} /> },
    { id: 'macro-trend', title: 'Macro Trend Alignment', component: sampleAnalysisData.macroData && <MacroTrendAlignment data={sampleAnalysisData.macroData} /> },
    { id: 'benchmark', title: 'Benchmark Comparison', component: sampleAnalysisData.benchmarkData && <BenchmarkComparison initialData={sampleAnalysisData.benchmarkData} /> },
    { id: 'growth-classifier', title: 'Growth Classifier', component: sampleAnalysisData.growthData && Object.keys(sampleAnalysisData.growthData).length > 0 ? <GrowthClassifier /> : null },
    { id: 'strategic-fit', title: 'Strategic Fit Matrix', component: sampleAnalysisData.strategicFitData && Object.keys(sampleAnalysisData.strategicFitData).length > 0 ? <StrategicFitMatrix /> : null },
    { id: 'consistency-check', title: 'Consistency Check', component: <ConsistencyCheck /> },
    { id: 'gap-analysis', title: 'Gap Analysis', component: sampleAnalysisData.gapData && Object.keys(sampleAnalysisData.gapData).length > 0 ? <GapAnalysis /> : null },
    { id: 'funder-fit-analysis', title: 'Funder Fit Analysis', component: sampleAnalysisData.founderFitData && Object.keys(sampleAnalysisData.founderFitData).length > 0 ? <FunderFitAnalysis /> : null },
    { id: 'team-assessment', title: 'Team Assessment', component: sampleAnalysisData.teamData && Object.keys(sampleAnalysisData.teamData).length > 0 ? <TeamAssessment /> : null },
    { id: 'reviewer-comments', title: 'Reviewer Comments', component: <ReviewerComments /> },
    { id: 'final-recommendation', title: 'Final Recommendation', component: <FinalRecommendation /> },
    { id: 'dd-weighted-score-breakdown', title: 'Weighted Score Breakdown', component: <WeightedScoreBreakdown /> },
    { id: 'dd-competitive-landscape', title: 'Competitive Landscape', component: <CompetitiveLandscape /> },
    { id: 'dd-regulatory-compliance', title: 'Regulatory Compliance', component: <RegulatoryComplianceReview /> },
    { id: 'dd-gtm-strategy', title: 'GTM Strategy', component: <GtmStrategy /> },
    { id: 'dd-ip-tech-review', title: 'IP & Tech Review', component: <IpTechnologyReview /> },
    { id: 'dd-financials-burn-rate', title: 'Financials & Burn Rate', component: <FinancialsBurnRate /> },
    { id: 'dd-exit-strategy', title: 'Exit Strategy', component: <ExitStrategyRoadmap /> },
    { id: 'dd-term-sheet', title: 'Term Sheet Analysis', component: <TermSheetTriggerAnalysis /> },
    { id: 'reviewer-ai-deviation', title: 'Reviewer/AI Deviation', component: <ReviewerAIDeviation /> },
    { id: 'dd-appendix', title: 'Appendix', component: <Appendix /> },
];


function ReportView({ analysisData, isPreview = false, visibleSections }: { analysisData: ComprehensiveAnalysisOutput | null, isPreview?: boolean, visibleSections: ReportSection[] }) {
    const { reportType } = useEvaluationContext();
    const router = useRouter();
    const { toast } = useToast();

    if (!analysisData) {
        return <Loading />;
    }

    const sectionIsVisible = (id: string) => {
        return visibleSections.some(s => s.id === id && s.active);
    };

    const saveReport = (status: string) => {
        try {
            const reports = JSON.parse(localStorage.getItem('allReports') || '[]');
            const missingSections = Object.entries(analysisData)
                .filter(([, value]) => value === null || (typeof value === 'object' && Object.keys(value).length === 0))
                .map(([key]) => key);

            const newReport = {
                id: `rep-${Date.now()}`,
                company: 'Innovate Inc.',
                type: 'Triage',
                status: 'Completed',
                approval: status,
                score: analysisData?.tcaData?.compositeScore || 0,
                confidence: 88.1,
                recommendation: 'Recommend',
                user: JSON.parse(localStorage.getItem('loggedInUser') || '{}'),
                createdAt: new Date().toLocaleDateString(),
                missingSections: missingSections.length > 0 ? missingSections : undefined,
            };
            const updatedReports = [newReport, ...reports];
            localStorage.setItem('allReports', JSON.stringify(updatedReports));
        } catch (e) {
            console.error("Failed to save report:", e);
        }
    }

    const handleGenerateTriage = () => {
        saveReport('Approved');
        toast({
            title: 'Report Approved',
            description: 'The Triage Report has been generated and approved.',
        });
        router.push('/dashboard/reports/triage');
    }

    const handleProceed = () => {
        saveReport('Due Diligence');
        toast({
            title: 'Proceeding to Full Screening',
            description: 'The report has been marked for Due Diligence.',
        });
        router.push('/dashboard/evaluation/modules');
    }

    const handleReject = () => {
        saveReport('Rejected');
        toast({
            variant: 'destructive',
            title: 'Evaluation Rejected',
            description: 'The "Innovate Inc." evaluation has been marked as rejected.',
        });
        router.push('/dashboard');
    }

    const reportComponents: Record<string, React.ReactElement | null> = {
        'quick-summary': <QuickSummary />,
        'tca-summary-card': analysisData.tcaData && <TcaSummaryCard initialData={analysisData.tcaData} />,
        'executive-summary': <ExecutiveSummary />,
        'tca-scorecard': analysisData.tcaData && <TcaScorecard initialData={analysisData.tcaData} />,
        'risk-flags': analysisData.riskData && <RiskFlags initialData={analysisData.riskData} />,
        'macro-trend': analysisData.macroData && <MacroTrendAlignment data={analysisData.macroData} />,
        'benchmark': analysisData.benchmarkData && <BenchmarkComparison initialData={analysisData.benchmarkData} />,
        'growth-classifier': analysisData.growthData && Object.keys(analysisData.growthData).length > 0 ? <GrowthClassifier /> : null,
        'strategic-fit': analysisData.strategicFitData && Object.keys(analysisData.strategicFitData).length > 0 ? <StrategicFitMatrix /> : null,
        'consistency-check': <ConsistencyCheck />,
        'gap-analysis': analysisData.gapData && Object.keys(analysisData.gapData).length > 0 ? <GapAnalysis /> : null,
        'funder-fit-analysis': analysisData.founderFitData && Object.keys(analysisData.founderFitData).length > 0 ? <FunderFitAnalysis /> : null,
        'team-assessment': analysisData.teamData && Object.keys(analysisData.teamData).length > 0 ? <TeamAssessment /> : null,
        'reviewer-comments': <ReviewerComments />,
        'final-recommendation': <FinalRecommendation />,
        'dd-weighted-score-breakdown': <WeightedScoreBreakdown />,
        'dd-competitive-landscape': <CompetitiveLandscape />,
        'dd-regulatory-compliance': <RegulatoryComplianceReview />,
        'dd-gtm-strategy': <GtmStrategy />,
        'dd-ip-tech-review': <IpTechnologyReview />,
        'dd-financials-burn-rate': <FinancialsBurnRate />,
        'dd-exit-strategy': <ExitStrategyRoadmap />,
        'dd-term-sheet': <TermSheetTriggerAnalysis />,
        'reviewer-ai-deviation': <ReviewerAIDeviation />,
        'dd-appendix': <Appendix />,
        'admin-approval-panel': !isPreview ? (
            <Card>
                <CardHeader><CardTitle>Admin Final Approval Panel</CardTitle></CardHeader>
                <CardContent className='flex gap-4'>
                    <Button variant="outline" onClick={handleGenerateTriage}>Generate Triage Report</Button>
                    <Button onClick={handleProceed}>Proceed to Full Screening</Button>
                    <Button variant="destructive" onClick={handleReject}>Reject</Button>
                </CardContent>
            </Card>
        ) : null,
        'export-links': <ExportButtons />
    };

    return (
        <div className="space-y-6">
            {isPreview && (
                <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
                    <Eye className="h-4 w-4 !text-primary" />
                    <AlertTitle className="text-primary">Preview Mode</AlertTitle>
                    <AlertDescription className="flex justify-between items-center text-primary/90">
                        This is a sample report to demonstrate the layout and components. The data is not real.
                        <Button asChild size="sm">
                            <Link href="/dashboard/evaluation">Run a New Analysis</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {visibleSections.map(section => (
                sectionIsVisible(section.id) ? (
                    <div key={section.id}>
                        {reportComponents[section.id]}
                    </div>
                ) : null
            ))}
        </div>
    );
}

export default function AnalysisResultPage() {
    const [analysisData, setAnalysisData] = React.useState<ComprehensiveAnalysisOutput>(sampleAnalysisData);
    const [isLoading, setIsLoading] = React.useState(true);
    const [role, setRole] = React.useState<UserRole>('admin');
    const [reportType, setReportType] = React.useState<ReportType>('dd');
    const [analysisDuration, setAnalysisDuration] = React.useState<number | null>(null);
    const [framework, setFramework] = React.useState<'general' | 'medtech'>('general');
    const [visibleSections, setVisibleSections] = React.useState<ReportSection[]>([]);
    const { toast } = useToast();
    const isPreview = typeof window !== 'undefined' ? !localStorage.getItem('analysisResult') : true;
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const storedData = localStorage.getItem('analysisResult');
        const storedDuration = localStorage.getItem('analysisDuration');
        const storedFramework = localStorage.getItem('analysisFramework');
        const storedUser = localStorage.getItem('loggedInUser');

        if (storedData) {
            setAnalysisData(JSON.parse(storedData));
        } else {
            setAnalysisData(sampleAnalysisData);
        }

        if (storedDuration) {
            setAnalysisDuration(parseFloat(storedDuration));
        }
        if (storedFramework) {
            setFramework(storedFramework as 'general' | 'medtech');
        }
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const userRole = user.role?.toLowerCase() || 'user';
                setRole(userRole);
            } catch (e) {
                setRole('user');
            }
        }
        setIsLoading(false);
    }, []);
    useEffect(() => {
        // Load configuration based on role and report type
        if (isPreview) {
            // In preview mode, show all possible sections
            const allSections = allReportComponents.map(comp => ({ id: comp.id, title: comp.title, active: true }));
            setVisibleSections(allSections);
            return;
        }
        try {
            const isPrivileged = role === 'admin' || role === 'reviewer';
            let configKey = '';
            if (reportType === 'triage') {
                configKey = isPrivileged ? 'report-config-triage-admin' : 'report-config-triage-standard';
            } else { // dd
                configKey = 'report-config-dd';
            }

            const savedConfig = localStorage.getItem(configKey);
            if (savedConfig) {
                setVisibleSections(JSON.parse(savedConfig));
            } else {
                // Fallback to a default if nothing is configured (should not happen if config page is used)
                const defaultConfig = [{ id: 'quick-summary', title: 'Quick Summary', active: true }, { id: 'executive-summary', title: 'Executive Summary', active: true }, { id: 'tca-scorecard', title: 'TCA Scorecard', active: true }];
                setVisibleSections(defaultConfig as ReportSection[]);
            }
        } catch (e) {
            console.error("Failed to load report configuration", e);
        }
    }, [role, reportType, isPreview]);

    const handleRunAnalysis = async () => {
        toast({ title: 'Navigating to New Analysis' });
    };

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
            <main className="bg-background text-foreground">
                <div className="container mx-auto p-4 md:p-8">
                    <header className="mb-12">
                        <div className='relative text-center'>
                            <div className="absolute top-0 right-0 flex gap-2">
                                {!isPreview && <Button asChild variant="outline"><Link href="/dashboard/evaluation">New Analysis</Link></Button>}
                                <ExportButtons />
                            </div>
                        </div>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-center">
                            Review the complete output from all 9 analysis modules before generating the final report.
                        </p>
                        {analysisDuration && !isPreview && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Timer className="size-4" />
                                <span>Analysis completed in {analysisDuration.toFixed(2)} seconds.</span>
                            </div>
                        )}
                    </header>

                    {isLoading ? <Loading /> : <ReportView analysisData={analysisData} isPreview={isPreview} visibleSections={visibleSections} />}
                </div>
            </main>
        </EvaluationProvider>
    );
}






