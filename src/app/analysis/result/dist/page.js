'use client';
"use strict";
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
exports.dynamic = void 0;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var link_1 = require("next/link");
// UI Components
var button_1 = require("@/components/ui/button");
var lucide_react_1 = require("lucide-react");
// Hooks and Utils
var use_toast_1 = require("@/hooks/use-toast");
var report_storage_1 = require("@/lib/report-storage");
// Evaluation Components
var benchmark_comparison_1 = require("@/components/evaluation/benchmark-comparison");
var funder_fit_analysis_1 = require("@/components/evaluation/funder-fit-analysis");
var gap_analysis_1 = require("@/components/evaluation/gap-analysis");
var growth_classifier_1 = require("@/components/evaluation/growth-classifier");
var macro_trend_alignment_1 = require("@/components/evaluation/macro-trend-alignment");
var risk_flags_1 = require("@/components/evaluation/risk-flags");
var strategic_fit_matrix_1 = require("@/components/evaluation/strategic-fit-matrix");
var tca_scorecard_1 = require("@/components/evaluation/tca-scorecard");
var team_assessment_1 = require("@/components/evaluation/team-assessment");
var export_buttons_1 = require("@/components/evaluation/export-buttons");
var evaluation_provider_1 = require("@/components/evaluation/evaluation-provider");
var quick_summary_1 = require("@/components/evaluation/quick-summary");
var executive_summary_1 = require("@/components/evaluation/executive-summary");
var tca_summary_card_1 = require("@/components/evaluation/tca-summary-card");
var consistency_check_1 = require("@/components/evaluation/consistency-check");
var reviewer_comments_1 = require("@/components/evaluation/reviewer-comments");
var final_recommendation_1 = require("@/components/evaluation/final-recommendation");
var reviewer_ai_deviation_1 = require("@/components/evaluation/reviewer-ai-deviation");
var weighted_score_breakdown_1 = require("@/components/evaluation/weighted-score-breakdown");
var competitive_landscape_1 = require("@/components/evaluation/competitive-landscape");
var regulatory_compliance_review_1 = require("@/components/evaluation/regulatory-compliance-review");
var gtm_strategy_1 = require("@/components/evaluation/gtm-strategy");
var ip_technology_review_1 = require("@/components/evaluation/ip-technology-review");
var financials_burn_rate_1 = require("@/components/evaluation/financials-burn-rate");
var exit_strategy_roadmap_1 = require("@/components/evaluation/exit-strategy-roadmap");
var term_sheet_trigger_analysis_1 = require("@/components/evaluation/term-sheet-trigger-analysis");
var appendix_1 = require("@/components/evaluation/appendix");
var ceo_questions_1 = require("@/components/evaluation/ceo-questions");
var tca_ai_table_1 = require("@/components/evaluation/tca-ai-table");
var risk_flag_summary_table_1 = require("@/components/evaluation/risk-flag-summary-table");
var tca_interpretation_summary_1 = require("@/components/evaluation/tca-interpretation-summary");
var flag_analysis_narrative_1 = require("@/components/evaluation/flag-analysis-narrative");
// Loading Component
var loading_1 = require("../../loading");
// Sample Data and Types
var sample_data_1 = require("@/lib/sample-data");
// Report Components Configuration - Complete list of all available components
var allReportComponents = [
    // Core Analysis Components
    { id: 'quick-summary', title: 'Quick Summary', component: quick_summary_1.QuickSummary, category: 'core' },
    { id: 'executive-summary', title: 'Executive Summary', component: executive_summary_1.ExecutiveSummary, category: 'core' },
    { id: 'tca-scorecard', title: 'TCA Scorecard', component: tca_scorecard_1.TcaScorecard, category: 'core' },
    { id: 'tca-summary-card', title: 'TCA Summary Card', component: tca_summary_card_1.TcaSummaryCard, category: 'core' },
    { id: 'tca-ai-table', title: 'TCA AI Analysis Table', component: tca_ai_table_1.TcaAiTable, category: 'core' },
    { id: 'tca-interpretation-summary', title: 'TCA AI Interpretation Summary', component: tca_interpretation_summary_1.TcaInterpretationSummary, category: 'core' },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', component: flag_analysis_narrative_1.FlagAnalysisNarrative, category: 'core' },
    // Risk & Assessment Components
    { id: 'risk-flags', title: 'Risk Flags & Mitigation', component: risk_flags_1.RiskFlags, category: 'assessment' },
    { id: 'risk-flag-summary-table', title: 'Risk Flag Summary Table', component: risk_flag_summary_table_1.RiskFlagSummaryTable, category: 'assessment' },
    { id: 'gap-analysis', title: 'Gap Analysis', component: gap_analysis_1.GapAnalysis, category: 'assessment' },
    { id: 'consistency-check', title: 'Consistency Check', component: consistency_check_1.ConsistencyCheck, category: 'assessment' },
    { id: 'weighted-score-breakdown', title: 'Weighted Score Breakdown', component: weighted_score_breakdown_1.WeightedScoreBreakdown, category: 'assessment' },
    // Market & Strategy Components
    { id: 'macro-trend-alignment', title: 'Macro Trend Alignment', component: macro_trend_alignment_1.MacroTrendAlignment, category: 'market' },
    { id: 'benchmark-comparison', title: 'Benchmark Comparison', component: benchmark_comparison_1.BenchmarkComparison, category: 'market' },
    { id: 'competitive-landscape', title: 'Competitive Landscape', component: competitive_landscape_1.CompetitiveLandscape, category: 'market' },
    { id: 'gtm-strategy', title: 'Go-to-Market Strategy', component: gtm_strategy_1.GtmStrategy, category: 'market' },
    // Growth & Financial Components  
    { id: 'growth-classifier', title: 'Growth Classifier', component: growth_classifier_1.GrowthClassifier, category: 'financial' },
    { id: 'financials-burn-rate', title: 'Financials & Burn Rate', component: financials_burn_rate_1.FinancialsBurnRate, category: 'financial' },
    { id: 'exit-strategy-roadmap', title: 'Exit Strategy Roadmap', component: exit_strategy_roadmap_1.ExitStrategyRoadmap, category: 'financial' },
    { id: 'term-sheet-trigger', title: 'Term Sheet Trigger Analysis', component: term_sheet_trigger_analysis_1.TermSheetTriggerAnalysis, category: 'financial' },
    // Team & Fit Components
    { id: 'funder-fit-analysis', title: 'Funder Fit Analysis', component: funder_fit_analysis_1.FunderFitAnalysis, category: 'team' },
    { id: 'team-assessment', title: 'Team Assessment', component: team_assessment_1.TeamAssessment, category: 'team' },
    { id: 'strategic-fit-matrix', title: 'Strategic Fit Matrix', component: strategic_fit_matrix_1.StrategicFitMatrix, category: 'team' },
    // Technology & IP Components
    { id: 'ip-technology-review', title: 'IP & Technology Review', component: ip_technology_review_1.IpTechnologyReview, category: 'technology' },
    { id: 'regulatory-compliance', title: 'Regulatory Compliance Review', component: regulatory_compliance_review_1.RegulatoryComplianceReview, category: 'technology' },
    // Review & Final Components
    { id: 'ceo-questions', title: 'CEO Questions', component: ceo_questions_1.CEOQuestions, category: 'review' },
    { id: 'reviewer-comments', title: 'Reviewer Comments', component: reviewer_comments_1.ReviewerComments, category: 'review' },
    { id: 'reviewer-ai-deviation', title: 'Reviewer AI Deviation', component: reviewer_ai_deviation_1.ReviewerAIDeviation, category: 'review' },
    { id: 'final-recommendation', title: 'Final Recommendation', component: final_recommendation_1.FinalRecommendation, category: 'review' },
    { id: 'appendix', title: 'Appendix', component: appendix_1.Appendix, category: 'review' }
];
// Triage Report Configuration (Standard User) - 5-7 pages
var triageStandardConfig = [
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
var triageAdminConfig = [
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
var ddReportConfig = [
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
function getComponentData(componentId, analysisData) {
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
function ReportView(_a) {
    var analysisData = _a.analysisData, isPreview = _a.isPreview, visibleSections = _a.visibleSections;
    var visibleComponents = allReportComponents.filter(function (comp) {
        return visibleSections.some(function (section) { return section.id === comp.id && section.active; });
    });
    return (react_1["default"].createElement("div", { className: "space-y-8" }, visibleComponents.map(function (_a) {
        var id = _a.id, title = _a.title, Component = _a.component;
        return (react_1["default"].createElement("div", { key: id, id: id }, id === 'tca-summary-card' ? (react_1["default"].createElement(Component, { initialData: getComponentData(id, analysisData) })) : id === 'tca-ai-table' ? (react_1["default"].createElement(Component, { data: getComponentData(id, analysisData) })) : id === 'tca-interpretation-summary' ? (react_1["default"].createElement(Component, { tcaData: getComponentData(id, analysisData) })) : id === 'risk-flag-summary-table' ? (react_1["default"].createElement(Component, { data: analysisData.riskData })) : id === 'flag-analysis-narrative' ? (react_1["default"].createElement(Component, { riskData: analysisData.riskData, tcaData: analysisData.tcaData })) : (react_1["default"].createElement(Component, { initialData: getComponentData(id, analysisData) }))));
    })));
}
// Main Page Component
// Mark this page as dynamic
exports.dynamic = 'force-dynamic';
function AnalysisResultPage(_a) {
    var _this = this;
    var searchParams = _a.searchParams;
    var toast = use_toast_1.useToast().toast;
    var router = navigation_1.useRouter();
    var _b = react_1.useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = react_1.useState('user'), role = _c[0], setRole = _c[1];
    var _d = react_1.useState('triage'), reportType = _d[0], setReportType = _d[1];
    var _e = react_1.useState('general'), framework = _e[0], setFramework = _e[1];
    var _f = react_1.useState([]), visibleSections = _f[0], setVisibleSections = _f[1];
    var _g = react_1.useState(sample_data_1.sampleAnalysisData), analysisData = _g[0], setAnalysisData = _g[1];
    var _h = react_1.useState(null), analysisDuration = _h[0], setAnalysisDuration = _h[1];
    var _j = react_1.useState({}), params = _j[0], setParams = _j[1];
    var _k = react_1.useState(false), isPreview = _k[0], setIsPreview = _k[1];
    // Unwrap searchParams
    react_1.useEffect(function () {
        searchParams.then(function (p) {
            setParams(p);
            setIsPreview(p.preview === 'true');
        });
    }, [searchParams]);
    // Load user role and analysis data - Dynamic Data Loading
    react_1.useEffect(function () {
        var loadUserAndConfig = function () {
            var _a;
            setIsLoading(true);
            try {
                // Load user role from localStorage
                var storedUser = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
                if (storedUser) {
                    try {
                        var user = JSON.parse(storedUser);
                        var userRole = ((_a = user.role) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'user';
                        setRole(userRole);
                    }
                    catch (e) {
                        console.error('Failed to parse user data:', e);
                        setRole('user');
                    }
                }
                else {
                    setRole('user');
                }
                // Load analysis data from localStorage or use sample data
                var storedAnalysis = localStorage.getItem('analysisResult');
                if (storedAnalysis && !isPreview) {
                    try {
                        var parsedAnalysis = JSON.parse(storedAnalysis);
                        setAnalysisData(parsedAnalysis);
                    }
                    catch (e) {
                        console.error('Failed to parse analysis data:', e);
                        setAnalysisData(sample_data_1.sampleAnalysisData);
                    }
                }
                else {
                    setAnalysisData(sample_data_1.sampleAnalysisData);
                }
                // Load analysis duration
                var storedDuration = localStorage.getItem('analysisDuration');
                if (storedDuration) {
                    setAnalysisDuration(parseFloat(storedDuration));
                }
                else {
                    setAnalysisDuration(45.32); // Default sample duration
                }
                // Load framework from localStorage
                var storedFramework = localStorage.getItem('analysisFramework');
                if (storedFramework) {
                    setFramework(storedFramework);
                }
                // Set report type from URL params or localStorage with access control
                if (params.type === 'dd') {
                    // Check if user has permission for DD reports
                    var isPrivileged = role === 'admin' || role === 'reviewer';
                    if (isPrivileged) {
                        setReportType('dd');
                    }
                    else {
                        // Redirect standard users away from DD reports
                        console.log('Standard user attempted to access DD report, redirecting to triage');
                        setReportType('triage');
                        // Show a toast notification about access restriction
                        setTimeout(function () {
                            toast({
                                variant: 'destructive',
                                title: 'Access Restricted',
                                description: 'Due Diligence reports are only available for admin and reviewer accounts.'
                            });
                        }, 1000);
                    }
                }
                else if (params.type === 'triage') {
                    setReportType('triage');
                }
                else {
                    // Try to load from localStorage or default to triage
                    var savedReportType = localStorage.getItem('currentReportType');
                    // Ensure standard users can't access DD even from localStorage
                    if (savedReportType === 'dd' && !(role === 'admin' || role === 'reviewer')) {
                        setReportType('triage');
                    }
                    else {
                        setReportType(savedReportType || 'triage');
                    }
                }
            }
            catch (error) {
                console.error('Error loading user and config:', error);
                setRole('user');
                setReportType('triage');
                setAnalysisData(sample_data_1.sampleAnalysisData);
                setAnalysisDuration(45.32);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadUserAndConfig();
    }, [params.type, isPreview, params]);
    // Load configuration based on role and report type - Dynamic Configuration
    react_1.useEffect(function () {
        if (isPreview) {
            // In preview mode, show all possible sections
            var allSections = allReportComponents.map(function (comp) { return ({
                id: comp.id,
                title: comp.title,
                active: true
            }); });
            setVisibleSections(allSections);
            return;
        }
        try {
            var isPrivileged = role === 'admin' || role === 'reviewer';
            var configKey = '';
            var defaultConfig = [];
            // Determine configuration based on report type and user role
            if (reportType === 'triage') {
                if (isPrivileged) {
                    configKey = 'report-config-triage-admin';
                    defaultConfig = triageAdminConfig;
                }
                else {
                    configKey = 'report-config-triage-standard';
                    defaultConfig = triageStandardConfig;
                }
            }
            else if (reportType === 'dd') {
                // STRICT: Only admin/reviewer can access DD reports
                if (isPrivileged) {
                    configKey = 'report-config-dd';
                    defaultConfig = ddReportConfig;
                }
                else {
                    // Force standard users back to triage with notification
                    console.warn('SECURITY: Standard user blocked from DD report access');
                    setReportType('triage');
                    configKey = 'report-config-triage-standard';
                    defaultConfig = triageStandardConfig;
                    // Show access denied notification
                    setTimeout(function () {
                        toast({
                            variant: 'destructive',
                            title: 'Access Denied',
                            description: 'Due Diligence reports are restricted to admin and reviewer accounts only.'
                        });
                    }, 500);
                }
            }
            else {
                // Fallback for any other report type
                defaultConfig = triageStandardConfig;
            }
            // Try to load saved configuration, fallback to default
            var savedConfig = localStorage.getItem(configKey);
            if (savedConfig) {
                try {
                    var parsed = JSON.parse(savedConfig);
                    // Validate that parsed config has required structure
                    if (Array.isArray(parsed) && parsed.every(function (item) {
                        return item.id && item.title && typeof item.active === 'boolean';
                    })) {
                        setVisibleSections(parsed);
                    }
                    else {
                        // Invalid saved config, use default
                        setVisibleSections(defaultConfig);
                        localStorage.setItem(configKey, JSON.stringify(defaultConfig));
                    }
                }
                catch (parseError) {
                    console.warn('Invalid saved config format, using default:', parseError);
                    setVisibleSections(defaultConfig);
                    localStorage.setItem(configKey, JSON.stringify(defaultConfig));
                }
            }
            else {
                // No saved config, use and save default
                setVisibleSections(defaultConfig);
                localStorage.setItem(configKey, JSON.stringify(defaultConfig));
            }
        }
        catch (e) {
            console.error("Failed to load report configuration:", e);
            // Emergency fallback - minimal working configuration
            var emergencyConfig = [
                { id: 'quick-summary', title: 'Quick Summary', active: true },
                { id: 'tca-scorecard', title: 'TCA Scorecard', active: true },
                { id: 'final-recommendation', title: 'Final Recommendation', active: true }
            ];
            setVisibleSections(emergencyConfig);
        }
    }, [role, reportType, isPreview]);
    var handleRunAnalysis = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            toast({
                title: 'Navigating to New Analysis',
                description: 'Redirecting to the analysis page...'
            });
            router.push('/dashboard/evaluation');
            return [2 /*return*/];
        });
    }); };
    // Auto-save analysis when data is loaded
    react_1.useEffect(function () {
        var autoSaveAnalysis = function () { return __awaiter(_this, void 0, void 0, function () {
            var user, userData, userId, companyName, reportId, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!analysisData || !role || isPreview)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        user = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
                        if (!user)
                            return [2 /*return*/];
                        userData = JSON.parse(user);
                        userId = userData.id || userData.email || 'anonymous';
                        companyName = analysisData.companyName || 'Analysis Report';
                        return [4 /*yield*/, report_storage_1.saveAnalysisReport(analysisData, {
                                reportType: reportType,
                                framework: framework,
                                userId: userId,
                                companyName: companyName,
                                analysisDuration: analysisDuration,
                                tags: [reportType, framework]
                            })];
                    case 2:
                        reportId = _a.sent();
                        console.log("Analysis auto-saved with ID: " + reportId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Auto-save failed:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        // Delay auto-save to ensure all data is loaded
        var saveTimeout = setTimeout(autoSaveAnalysis, 2000);
        return function () { return clearTimeout(saveTimeout); };
    }, [analysisData, reportType, framework, role, analysisDuration, isPreview]);
    if (isLoading) {
        return react_1["default"].createElement(loading_1["default"], null);
    }
    return (react_1["default"].createElement(evaluation_provider_1.EvaluationProvider, { role: role, reportType: reportType, framework: framework, onFrameworkChangeAction: setFramework, setReportTypeAction: setReportType, uploadedFiles: [], setUploadedFilesAction: function () { }, importedUrls: [], setImportedUrlsAction: function () { }, submittedTexts: [], setSubmittedTextsAction: function () { }, isLoading: isLoading, handleRunAnalysisAction: handleRunAnalysis },
        react_1["default"].createElement("main", { className: "bg-background text-foreground min-h-screen" },
            react_1["default"].createElement("div", { className: "container mx-auto p-4 md:p-8" },
                react_1["default"].createElement("header", { className: "mb-12" },
                    react_1["default"].createElement("div", { className: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6" },
                        react_1["default"].createElement("div", { className: "text-center lg:text-left" },
                            react_1["default"].createElement("h1", { className: "text-3xl md:text-4xl font-bold mb-2" }, "Technology Commercialization Analysis"),
                            react_1["default"].createElement("p", { className: "text-lg text-muted-foreground max-w-2xl" }, reportType === 'triage' ?
                                'Triage analysis provides key insights for initial investment screening.' :
                                'Due Diligence analysis provides comprehensive evaluation for investment decisions.')),
                        react_1["default"].createElement("div", { className: "flex flex-wrap items-center justify-center lg:justify-end gap-2 lg:flex-shrink-0" },
                            !isPreview && (react_1["default"].createElement(react_1["default"].Fragment, null,
                                react_1["default"].createElement(button_1.Button, { variant: reportType === 'triage' ? 'default' : 'outline', size: "sm", onClick: function () {
                                        setReportType('triage');
                                        localStorage.setItem('currentReportType', 'triage');
                                    } }, "Triage Report"),
                                (role === 'admin' || role === 'reviewer') && (react_1["default"].createElement(button_1.Button, { variant: reportType === 'dd' ? 'default' : 'outline', size: "sm", onClick: function () {
                                        setReportType('dd');
                                        localStorage.setItem('currentReportType', 'dd');
                                    } }, "DD Report (Admin Only)")),
                                react_1["default"].createElement(button_1.Button, { asChild: true, variant: "outline", size: "sm" },
                                    react_1["default"].createElement(link_1["default"], { href: "/dashboard/evaluation" }, "New Analysis")))),
                            react_1["default"].createElement(export_buttons_1.ExportButtons, null))),
                    react_1["default"].createElement("div", { className: "flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground bg-muted/30 px-4 py-3 rounded-lg" },
                        analysisDuration && !isPreview && (react_1["default"].createElement("div", { className: "flex items-center gap-2" },
                            react_1["default"].createElement(lucide_react_1.Timer, { className: "size-4" }),
                            react_1["default"].createElement("span", null,
                                "Analysis completed in ",
                                analysisDuration.toFixed(2),
                                " seconds"))),
                        react_1["default"].createElement("div", { className: "flex items-center gap-2" },
                            react_1["default"].createElement(lucide_react_1.Eye, { className: "size-4" }),
                            react_1["default"].createElement("span", null,
                                visibleSections.filter(function (s) { return s.active; }).length,
                                " sections visible")),
                        react_1["default"].createElement("div", { className: "px-3 py-1 bg-primary/10 rounded-md border border-primary/20" },
                            react_1["default"].createElement("span", { className: "text-primary font-medium" },
                                reportType.toUpperCase(),
                                " Report (",
                                role,
                                ")")))),
                react_1["default"].createElement(ReportView, { analysisData: analysisData, isPreview: isPreview, visibleSections: visibleSections })))));
}
exports["default"] = AnalysisResultPage;
