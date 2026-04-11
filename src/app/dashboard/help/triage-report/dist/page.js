'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var benchmark_comparison_1 = require("@/components/evaluation/benchmark-comparison");
var funder_fit_analysis_1 = require("@/components/evaluation/funder-fit-analysis");
var gap_analysis_1 = require("@/components/evaluation/gap-analysis");
var growth_classifier_1 = require("@/components/evaluation/growth-classifier");
var macro_trend_alignment_1 = require("@/components/evaluation/macro-trend-alignment");
var risk_flags_1 = require("@/components/evaluation/risk-flags");
var strategic_fit_matrix_1 = require("@/components/evaluation/strategic-fit-matrix");
var tca_scorecard_1 = require("@/components/evaluation/tca-scorecard");
var team_assessment_1 = require("@/components/evaluation/team-assessment");
var use_toast_1 = require("@/hooks/use-toast");
var lucide_react_1 = require("lucide-react");
var evaluation_provider_1 = require("@/components/evaluation/evaluation-provider");
var link_1 = require("next/link");
var alert_1 = require("@/components/ui/alert");
var quick_summary_1 = require("@/components/evaluation/quick-summary");
var executive_summary_1 = require("@/components/evaluation/executive-summary");
var tca_summary_card_1 = require("@/components/evaluation/tca-summary-card");
var consistency_check_1 = require("@/components/evaluation/consistency-check");
var analyst_comments_1 = require("@/components/evaluation/analyst-comments");
var final_recommendation_1 = require("@/components/evaluation/final-recommendation");
var react_1 = require("react");
var label_1 = require("@/components/ui/label");
var switch_1 = require("@/components/ui/switch");
var card_1 = require("@/components/ui/card");
var button_1 = require("@/components/ui/button");
// --- Start of Sample Data ---
var sampleTcaData = {
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
    summary: 'Innovate Inc. shows strong potential with excellent leadership and product-market fit. Key concerns are the high burn rate and a narrow go-to-market strategy. The recommendation is to proceed to due diligence, focusing on financial health and customer acquisition strategy.'
};
var sampleRiskData = {
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
    ]
};
var sampleMacroData = {
    pestelDashboard: { political: 7, economic: 6, social: 8, technological: 9, environmental: 7, legal: 8 },
    trendOverlayScore: 0.04,
    summary: 'The company is well-aligned with major technological and social trends, such as the adoption of AI and the shift to remote work. Economic headwinds (e.g., inflation, rising interest rates) present a moderate risk but are offset by the cost-saving nature of the product.',
    sectorOutlook: 'The B2B SaaS sector remains strong, with high demand for efficiency-boosting software. Companies with clear ROI will continue to thrive despite economic pressures.',
    trendSignals: ['Increased enterprise adoption of AI', 'Global supply chain optimization focus', 'Rising importance of data privacy']
};
var sampleBenchmarkData = {
    benchmarkOverlay: [
        { category: 'Revenue Growth', score: 8.5, avg: 6.5, percentile: 80, deviation: 2.0 },
        { category: 'Net Retention', score: 7.0, avg: 7.5, percentile: 45, deviation: -0.5 },
        { category: 'LTV/CAC Ratio', score: 9.0, avg: 7.0, percentile: 85, deviation: 2.0 },
    ],
    competitorAnalysis: [
        { metric: 'Growth', startup: 8.5, competitorA: 7.0, competitorB: 6.0 },
        { metric: 'Profitability', startup: 6.0, competitorA: 8.0, competitorB: 7.5 },
        { metric: 'Moat', startup: 9.0, competitorA: 7.5, competitorB: 8.0 },
    ],
    performanceSummary: 'Innovate Inc. significantly outperforms its peers in revenue growth and LTV/CAC ratio, placing it in the top quintile. However, its net retention is slightly below average, suggesting a potential churn issue that needs investigation.',
    overlayScore: 0.035
};
var sampleGrowthData = { tier: 2, confidence: 82, scenarios: [{ name: 'Worst Case', growth: 1.5 }, { name: 'Base Case', growth: 2.5 }, { name: 'Best Case', growth: 4.0 },], analysis: 'The growth model ensemble predicts a Tier 2 classification, indicating moderate growth potential. The base case scenario suggests a 2.5x YoY growth, driven by strong market positioning but constrained by team scalability. The sector-adjusted model slightly downgraded the score due to high competition in the B2B SaaS space.', models: [{ name: 'XGBoost', score: 8.1, contribution: '20%' }, { name: 'Random Forest', score: 7.9, contribution: '20%' }, { name: 'Neural Network', score: 8.3, contribution: '20%' }, { name: 'SVM', score: 7.8, contribution: '15%' }, { name: 'Gradient Boosting', score: 8.2, contribution: '15%' }, { name: 'Ensemble Voting', score: 8.0, contribution: '10%' },], interpretation: 'The classification as Tier 2 suggests a solid foundation but with clear areas for improvement to unlock high-growth potential. Key drivers are strong product-market fit and a large addressable market. However, scaling challenges and competitive pressures are significant headwinds that need to be addressed in the operational plan.' };
var sampleGapData = {
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
var sampleFounderFitData = {
    readinessScore: 78,
    investorList: [{ name: 'Sequoia', thesis: 'SaaS', match: 92, stage: 'Seed' }],
    interpretation: 'Strong readiness score.'
};
var sampleTeamData = {
    members: [
        { id: '1', name: 'Alex Johnson', role: 'CEO', experience: '10+ years', skills: 'SaaS, Leadership', avatarId: 'avatar1' }
    ],
    interpretation: 'Experienced team.'
};
var sampleStrategicFitData = {
    data: [
        { pathway: 'GTM Fit', signal: 'green', notes: 'Strong partner compatibility', trend: 0.2, direction: 'up' },
        { pathway: 'ESG Score', signal: 'green', notes: 'High sustainability alignment', trend: 0.1, direction: 'up' },
        { pathway: 'M&A Readiness', signal: 'yellow', notes: 'Needs better reporting', trend: -0.1, direction: 'down' },
        { pathway: 'VC Fit', signal: 'green', notes: 'Aligns with top-tier VC theses', trend: 0.0, direction: 'stable' },
    ],
    interpretation: "The startup shows strong alignment with GTM partners and ESG goals, which are positive signals. However, its M&A readiness is a moderate concern due to reporting gaps. The strong VC fit suggests it is well-positioned for fundraising within its target investor segment. The overall strategic fit is positive but requires operational improvements for M&A scenarios."
};
var sampleAnalysisData = {
    tcaData: sampleTcaData,
    riskData: sampleRiskData,
    macroData: sampleMacroData,
    benchmarkData: sampleBenchmarkData,
    growthData: sampleGrowthData,
    gapData: sampleGapData,
    founderFitData: sampleFounderFitData,
    teamData: sampleTeamData,
    strategicFitData: sampleStrategicFitData
};
// --- End of Sample Data ---
function ReportView(_a) {
    var analysisData = _a.analysisData, visibleSections = _a.visibleSections;
    var isPrivilegedUser = evaluation_provider_1.useEvaluationContext().isPrivilegedUser;
    if (!analysisData) {
        return null;
    }
    var sectionIsVisible = function (id) {
        return visibleSections.some(function (s) { return s.id === id && s.active; });
    };
    var reportComponents = {
        'quick-summary': React.createElement(quick_summary_1.QuickSummary, null),
        'tca-summary-card': analysisData.tcaData && React.createElement(tca_summary_card_1.TcaSummaryCard, { initialData: analysisData.tcaData }),
        'executive-summary': React.createElement(executive_summary_1.ExecutiveSummary, null),
        'tca-scorecard': analysisData.tcaData && React.createElement(tca_scorecard_1.TcaScorecard, { initialData: analysisData.tcaData }),
        'risk-flags': analysisData.riskData && React.createElement(risk_flags_1.RiskFlags, { initialData: analysisData.riskData }),
        'macro-trend': analysisData.macroData && React.createElement(macro_trend_alignment_1.MacroTrendAlignment, { data: analysisData.macroData }),
        'benchmark': analysisData.benchmarkData && React.createElement(benchmark_comparison_1.BenchmarkComparison, { initialData: analysisData.benchmarkData }),
        'growth-classifier': analysisData.growthData && Object.keys(analysisData.growthData).length > 0 && React.createElement(growth_classifier_1.GrowthClassifier, null),
        'strategic-fit': analysisData.strategicFitData && Object.keys(analysisData.strategicFitData).length > 0 && React.createElement(strategic_fit_matrix_1.StrategicFitMatrix, null),
        'consistency-check': React.createElement(consistency_check_1.ConsistencyCheck, null),
        'gap-analysis': analysisData.gapData && Object.keys(analysisData.gapData).length > 0 && React.createElement(gap_analysis_1.GapAnalysis, null),
        'funder-fit-analysis': analysisData.founderFitData && Object.keys(analysisData.founderFitData).length > 0 && React.createElement(funder_fit_analysis_1.FunderFitAnalysis, null),
        'team-assessment': analysisData.teamData && Object.keys(analysisData.teamData).length > 0 && React.createElement(team_assessment_1.TeamAssessment, null),
        'Analyst-comments': React.createElement(analyst_comments_1.AnalystComments, null),
        'final-recommendation': React.createElement(final_recommendation_1.FinalRecommendation, null),
        'admin-approval-panel': (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Admin Final Approval Panel")),
            React.createElement(card_1.CardContent, { className: 'flex gap-4' },
                React.createElement(button_1.Button, { variant: "outline" }, "Generate Triage Report"),
                React.createElement(button_1.Button, null, "Proceed to Full Screening"),
                React.createElement(button_1.Button, { variant: "destructive" }, "Reject"))))
    };
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement(alert_1.Alert, { variant: "default", className: "bg-primary/10 border-primary/30 text-primary-foreground" },
            React.createElement(lucide_react_1.Eye, { className: "h-4 w-4 !text-primary" }),
            React.createElement(alert_1.AlertTitle, { className: "text-primary" }, "Training Mode: Sample Report"),
            React.createElement(alert_1.AlertDescription, { className: "flex justify-between items-center text-primary/90" }, "This is a sample Triage report to demonstrate the layout and components for training purposes. The data is not real.")),
        visibleSections.map(function (section) { return (sectionIsVisible(section.id) ? (React.createElement("div", { key: section.id }, reportComponents[section.id])) : null); })));
}
var defaultStandardSections = [
    { id: 'quick-summary', title: 'Quick Summary', active: true },
    { id: 'tca-summary-card', title: 'TCA Summary Score Card', active: true },
    { id: 'executive-summary', title: 'AI Interpretation Summary', active: true },
    { id: 'tca-scorecard', title: 'TCA AI Table – 12 Categories', active: true },
    { id: 'risk-flags', title: 'Risk Flag Summary Table', active: true },
    { id: 'macro-trend', title: 'Macro Trend Alignment', active: true },
    { id: 'benchmark', title: 'Benchmark Comparison', active: true },
    { id: 'growth-classifier', title: 'Growth Classifier Matrix', active: true },
    { id: 'strategic-fit', title: 'Strategic Fit Matrix', active: true },
    { id: 'gap-analysis', title: 'Gap Analysis', active: true },
    { id: 'founder-fit-analysis', title: 'Founder Fit Analysis', active: true },
    { id: 'team-assessment', title: 'Team Assessment', active: true },
    { id: 'final-recommendation', title: 'Final Recommendation', active: true },
];
function TriageReportPage() {
    var _this = this;
    var toast = use_toast_1.useToast().toast;
    var _a = react_1.useState('user'), role = _a[0], setRole = _a[1];
    var _b = react_1.useState([]), visibleSections = _b[0], setVisibleSections = _b[1];
    var isPrivilegedUser = role === 'admin' || role === 'analyst';
    react_1.useEffect(function () {
        // Load config based on role
        var configKey = isPrivilegedUser ? 'report-config-triage-admin' : 'report-config-triage-standard';
        try {
            var savedConfig = localStorage.getItem(configKey);
            if (savedConfig) {
                setVisibleSections(JSON.parse(savedConfig));
            }
            else {
                // Fallback to a complete default list if nothing is saved
                var defaultConfig = isPrivilegedUser ? defaultStandardSections.map(function (s) { return (__assign(__assign({}, s), { description: '' })); }) : defaultStandardSections.map(function (s) { return (__assign(__assign({}, s), { description: '' })); }); // A more complete default can be defined
                setVisibleSections(defaultConfig);
            }
        }
        catch (e) {
            console.error("Failed to load triage report configuration", e);
            var defaultConfig = isPrivilegedUser ? defaultStandardSections.map(function (s) { return (__assign(__assign({}, s), { description: '' })); }) : defaultStandardSections.map(function (s) { return (__assign(__assign({}, s), { description: '' })); });
            setVisibleSections(defaultConfig);
        }
    }, [isPrivilegedUser]);
    var handleRunAnalysis = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            toast({ title: 'Navigating to New Analysis' });
            return [2 /*return*/];
        });
    }); };
    return (React.createElement(evaluation_provider_1.EvaluationProvider, { role: role, reportType: "triage", framework: "general", onFrameworkChangeAction: function () { }, setReportTypeAction: function () { }, isLoading: false, handleRunAnalysisAction: handleRunAnalysis },
        React.createElement("main", { className: "bg-background text-foreground" },
            React.createElement("div", { className: "container mx-auto p-4 md:p-8" },
                React.createElement("header", { className: "mb-12" },
                    React.createElement(link_1["default"], { href: "/dashboard/help/understanding-your-report", className: "flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4" },
                        React.createElement(lucide_react_1.ArrowLeft, { className: "size-4" }),
                        "Back to Report Guides"),
                    React.createElement("div", { className: 'relative text-center' },
                        React.createElement("div", { className: "absolute top-0 right-0 flex items-center gap-4" },
                            React.createElement(label_1.Label, { htmlFor: "role-switcher", className: !isPrivilegedUser ? 'text-primary' : '' }, "Standard User"),
                            React.createElement(switch_1.Switch, { id: "role-switcher", checked: isPrivilegedUser, onCheckedChange: function (checked) { return setRole(checked ? 'admin' : 'user'); } }),
                            React.createElement(label_1.Label, { htmlFor: "role-switcher", className: isPrivilegedUser ? 'text-primary font-semibold' : '' }, "Admin / Analyst")),
                        React.createElement("h1", { className: "text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight" }, "Sample Triage Report")),
                    React.createElement("p", { className: "mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-center" }, "This is a sample Triage report for training and demonstration purposes. Use the switch above to see how the report changes based on user role.")),
                React.createElement(ReportView, { analysisData: sampleAnalysisData, visibleSections: visibleSections })))));
}
exports["default"] = TriageReportPage;
