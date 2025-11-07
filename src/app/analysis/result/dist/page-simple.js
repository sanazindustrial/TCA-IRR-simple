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
var react_1 = require("react");
var evaluation_provider_1 = require("@/components/evaluation/evaluation-provider");
var executive_summary_1 = require("@/components/evaluation/executive-summary");
var benchmark_comparison_1 = require("@/components/evaluation/benchmark-comparison");
var gap_analysis_1 = require("@/components/evaluation/gap-analysis");
var growth_classifier_1 = require("@/components/evaluation/growth-classifier");
var risk_flags_1 = require("@/components/evaluation/risk-flags");
var competitive_landscape_1 = require("@/components/evaluation/competitive-landscape");
var final_recommendation_1 = require("@/components/evaluation/final-recommendation");
var team_assessment_1 = require("@/components/evaluation/team-assessment");
var exit_strategy_roadmap_1 = require("@/components/evaluation/exit-strategy-roadmap");
var funder_fit_analysis_1 = require("@/components/evaluation/funder-fit-analysis");
var tca_ai_table_1 = require("@/components/evaluation/tca-ai-table");
var risk_flag_summary_table_1 = require("@/components/evaluation/risk-flag-summary-table");
var weighted_score_breakdown_1 = require("@/components/evaluation/weighted-score-breakdown");
var ceo_questions_1 = require("@/components/evaluation/ceo-questions");
var export_buttons_1 = require("@/components/evaluation/export-buttons");
var button_1 = require("@/components/ui/button");
var lucide_react_1 = require("lucide-react");
var navigation_1 = require("next/navigation");
var dashboard_card_1 = require("@/components/shared/dashboard-card");
function ResultContent() {
    var router = navigation_1.useRouter();
    var searchParams = navigation_1.useSearchParams();
    var reportType = searchParams.get('type') || 'triage'; // 'triage' or 'dd'
    var companyName = 'Company Analysis';
    // Mock benchmark comparison data - replace with actual data from your context
    var mockBenchmarkData = {
        benchmarkMetrics: [],
        comparisonResults: [],
        industryAverages: {},
        competitivePosition: 'average'
    };
    var mockTcaData = {
        categories: [],
        compositeScore: 75,
        summary: 'Analysis complete'
    };
    var mockRiskData = {
        riskSummary: 'Risk assessment complete',
        riskFlags: []
    };
    var mockRiskFlagsData = {
        riskFlags: [],
        mitigationStrategies: [],
        riskScore: 0,
        recommendations: []
    };
    var handleBack = function () {
        router.back();
    };
    var reportTitle = reportType === 'dd' ? 'Due Diligence Report' : 'Triage Report';
    var reportDescription = reportType === 'dd'
        ? 'Comprehensive analysis with detailed risk assessment and strategic recommendations'
        : 'Initial assessment with key findings and preliminary recommendations';
    return (react_1["default"].createElement("div", { className: "container mx-auto px-4 py-8 max-w-7xl" },
        react_1["default"].createElement("div", { className: "mb-8" },
            react_1["default"].createElement("div", { className: "flex items-center justify-between mb-6" },
                react_1["default"].createElement(button_1.Button, { variant: "ghost", onClick: handleBack, className: "flex items-center gap-2 text-muted-foreground hover:text-foreground" },
                    react_1["default"].createElement(lucide_react_1.ArrowLeft, { className: "h-4 w-4" }),
                    "Back to Analysis"),
                react_1["default"].createElement(export_buttons_1.ExportButtons, null)),
            react_1["default"].createElement(dashboard_card_1.DashboardCard, { title: reportTitle + ": " + companyName, icon: reportType === 'dd' ? lucide_react_1.FileText : lucide_react_1.BarChart3, description: reportDescription },
                react_1["default"].createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-center" },
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("div", { className: "text-sm text-muted-foreground" }, "Report Type"),
                        react_1["default"].createElement("div", { className: "font-bold text-primary" }, reportTitle)),
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("div", { className: "text-sm text-muted-foreground" }, "Analysis Date"),
                        react_1["default"].createElement("div", { className: "font-bold text-foreground" }, new Date().toLocaleDateString())),
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("div", { className: "text-sm text-muted-foreground" }, "Status"),
                        react_1["default"].createElement("div", { className: "font-bold text-success" }, "Complete"))))),
        react_1["default"].createElement("div", { className: "space-y-8" },
            react_1["default"].createElement(executive_summary_1.ExecutiveSummary, null),
            react_1["default"].createElement(tca_ai_table_1.TcaAiTable, { data: mockTcaData }),
            react_1["default"].createElement(weighted_score_breakdown_1.WeightedScoreBreakdown, { data: mockTcaData }),
            react_1["default"].createElement(risk_flag_summary_table_1.RiskFlagSummaryTable, { data: mockRiskData }),
            reportType === 'dd' ? (react_1["default"].createElement(react_1["default"].Fragment, null,
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(benchmark_comparison_1.BenchmarkComparison, { initialData: mockBenchmarkData }),
                    react_1["default"].createElement(gap_analysis_1.GapAnalysis, null)),
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(growth_classifier_1.GrowthClassifier, null),
                    react_1["default"].createElement(team_assessment_1.TeamAssessment, null)),
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(competitive_landscape_1.CompetitiveLandscape, null),
                    react_1["default"].createElement(funder_fit_analysis_1.FunderFitAnalysis, null)),
                react_1["default"].createElement(risk_flags_1.RiskFlags, null),
                react_1["default"].createElement(exit_strategy_roadmap_1.ExitStrategyRoadmap, null),
                react_1["default"].createElement(ceo_questions_1.CEOQuestions, null),
                react_1["default"].createElement(final_recommendation_1.FinalRecommendation, null))) : (react_1["default"].createElement(react_1["default"].Fragment, null,
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(benchmark_comparison_1.BenchmarkComparison, { initialData: mockBenchmarkData }),
                    react_1["default"].createElement(growth_classifier_1.GrowthClassifier, null)),
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(gap_analysis_1.GapAnalysis, null),
                    react_1["default"].createElement(team_assessment_1.TeamAssessment, null)),
                react_1["default"].createElement(final_recommendation_1.FinalRecommendation, null),
                react_1["default"].createElement(dashboard_card_1.DashboardCard, { title: "Need More Detailed Analysis?", icon: lucide_react_1.AlertTriangle, description: "This triage report provides initial insights. For comprehensive due diligence, generate a full DD report." },
                    react_1["default"].createElement("div", { className: "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" },
                        react_1["default"].createElement("div", { className: "text-sm text-muted-foreground" }, "Full DD reports include competitive landscape, exit strategy roadmap, detailed risk mitigation, and comprehensive funder fit analysis."),
                        react_1["default"].createElement(button_1.Button, { onClick: function () { return router.push("/analysis/result?type=dd"); }, className: "shrink-0" }, "Generate DD Report"))))))));
}
function ResultPage() {
    var _this = this;
    var handleFrameworkChange = function () { };
    var handleReportTypeChange = function () { };
    var handleFilesChange = function () { };
    var handleUrlsChange = function () { };
    var handleTextsChange = function () { };
    var handleRunAnalysis = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); };
    return (react_1["default"].createElement(evaluation_provider_1.EvaluationProvider, { role: "user", reportType: "triage", framework: "general", onFrameworkChangeAction: handleFrameworkChange, setReportTypeAction: handleReportTypeChange, uploadedFiles: [], setUploadedFilesAction: handleFilesChange, importedUrls: [], setImportedUrlsAction: handleUrlsChange, submittedTexts: [], setSubmittedTextsAction: handleTextsChange, isLoading: false, handleRunAnalysisAction: handleRunAnalysis },
        react_1["default"].createElement(ResultContent, null)));
}
exports["default"] = ResultPage;
