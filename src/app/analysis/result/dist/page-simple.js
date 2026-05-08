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
var actions_1 = require("@/app/analysis/actions");
function ResultContent() {
    var _this = this;
    var _a, _b, _c, _d, _e;
    var router = navigation_1.useRouter();
    var searchParams = navigation_1.useSearchParams();
    var reportType = searchParams.get('type') || 'triage'; // 'triage' or 'dd'
    var framework = (searchParams.get('framework') || 'general');
    var companyName = searchParams.get('company') || 'Company Analysis';
    var _f = react_1.useState(null), analysisData = _f[0], setAnalysisData = _f[1];
    var _g = react_1.useState(true), isLoading = _g[0], setIsLoading = _g[1];
    var _h = react_1.useState(null), error = _h[0], setError = _h[1];
    // Load analysis data on component mount
    react_1.useEffect(function () {
        var loadAnalysisData = function () { return __awaiter(_this, void 0, void 0, function () {
            var storedData, parsedData, result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsLoading(true);
                        setError(null);
                        storedData = localStorage.getItem('analysisResult');
                        if (storedData) {
                            parsedData = JSON.parse(storedData);
                            setAnalysisData(parsedData);
                            setIsLoading(false);
                            return [2 /*return*/];
                        }
                        // If no stored data, run new analysis
                        console.log('No stored analysis data found. Running new analysis...');
                        return [4 /*yield*/, actions_1.runAnalysis(framework, {
                                companyName: companyName,
                                companyDescription: "A " + framework + " company seeking investment evaluation.",
                                uploadedFiles: [],
                                importedUrls: [],
                                submittedTexts: []
                            })];
                    case 1:
                        result = _a.sent();
                        setAnalysisData(result);
                        // Store for future use
                        localStorage.setItem('analysisResult', JSON.stringify(result));
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Failed to load analysis data:', err_1);
                        setError(err_1 instanceof Error ? err_1.message : 'Failed to load analysis data');
                        return [3 /*break*/, 4];
                    case 3:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        loadAnalysisData();
    }, [framework, companyName]);
    var handleBack = function () {
        router.back();
    };
    var handleRefreshAnalysis = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setIsLoading(true);
                    setError(null);
                    // Clear stored data and run fresh analysis
                    localStorage.removeItem('analysisResult');
                    return [4 /*yield*/, actions_1.runAnalysis(framework, {
                            companyName: companyName,
                            companyDescription: "A " + framework + " company seeking comprehensive investment evaluation.",
                            uploadedFiles: [],
                            importedUrls: [],
                            submittedTexts: []
                        })];
                case 1:
                    result = _a.sent();
                    setAnalysisData(result);
                    localStorage.setItem('analysisResult', JSON.stringify(result));
                    return [3 /*break*/, 4];
                case 2:
                    err_2 = _a.sent();
                    console.error('Failed to refresh analysis:', err_2);
                    setError(err_2 instanceof Error ? err_2.message : 'Failed to refresh analysis');
                    return [3 /*break*/, 4];
                case 3:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading) {
        return (react_1["default"].createElement("div", { className: "container mx-auto px-4 py-8 max-w-7xl" },
            react_1["default"].createElement("div", { className: "flex flex-col items-center justify-center min-h-[400px] space-y-4" },
                react_1["default"].createElement(lucide_react_1.Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
                react_1["default"].createElement("h2", { className: "text-xl font-semibold" }, "Running Comprehensive Analysis"),
                react_1["default"].createElement("p", { className: "text-muted-foreground text-center max-w-md" }, "Analyzing all 9 modules with real AI-powered evaluation. This may take a few moments..."))));
    }
    if (error) {
        return (react_1["default"].createElement("div", { className: "container mx-auto px-4 py-8 max-w-7xl" },
            react_1["default"].createElement("div", { className: "flex flex-col items-center justify-center min-h-[400px] space-y-4" },
                react_1["default"].createElement(lucide_react_1.AlertTriangle, { className: "h-8 w-8 text-destructive" }),
                react_1["default"].createElement("h2", { className: "text-xl font-semibold text-destructive" }, "Analysis Error"),
                react_1["default"].createElement("p", { className: "text-muted-foreground text-center max-w-md" }, error),
                react_1["default"].createElement(button_1.Button, { onClick: handleRefreshAnalysis, variant: "outline" }, "Try Again"))));
    }
    if (!analysisData) {
        return (react_1["default"].createElement("div", { className: "container mx-auto px-4 py-8 max-w-7xl" },
            react_1["default"].createElement("div", { className: "flex flex-col items-center justify-center min-h-[400px] space-y-4" },
                react_1["default"].createElement(lucide_react_1.FileText, { className: "h-8 w-8 text-muted-foreground" }),
                react_1["default"].createElement("h2", { className: "text-xl font-semibold" }, "No Analysis Data"),
                react_1["default"].createElement("p", { className: "text-muted-foreground text-center max-w-md" }, "No analysis data found. Please run an analysis first."),
                react_1["default"].createElement(button_1.Button, { onClick: handleRefreshAnalysis }, "Run Analysis"))));
    }
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
            react_1["default"].createElement(tca_ai_table_1.TcaAiTable, { data: analysisData.tcaData }),
            react_1["default"].createElement(weighted_score_breakdown_1.WeightedScoreBreakdown, { data: analysisData.tcaData }),
            react_1["default"].createElement(risk_flag_summary_table_1.RiskFlagSummaryTable, { data: analysisData.riskData }),
            reportType === 'dd' ? (react_1["default"].createElement(react_1["default"].Fragment, null,
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(benchmark_comparison_1.BenchmarkComparison, { initialData: analysisData.benchmarkData || {
                            benchmarkOverlay: [],
                            competitorAnalysis: [],
                            performanceSummary: "Analysis pending...",
                            overlayScore: 0
                        } }),
                    react_1["default"].createElement(gap_analysis_1.GapAnalysis, null)),
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(growth_classifier_1.GrowthClassifier, null),
                    react_1["default"].createElement(team_assessment_1.TeamAssessment, null)),
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(competitive_landscape_1.CompetitiveLandscape, null),
                    react_1["default"].createElement(funder_fit_analysis_1.FunderFitAnalysis, null)),
                analysisData.riskData && react_1["default"].createElement(risk_flags_1.RiskFlags, { initialData: analysisData.riskData }),
                react_1["default"].createElement(exit_strategy_roadmap_1.ExitStrategyRoadmap, null),
                react_1["default"].createElement(ceo_questions_1.CEOQuestions, null),
                react_1["default"].createElement(final_recommendation_1.FinalRecommendation, null))) : (react_1["default"].createElement(react_1["default"].Fragment, null,
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(benchmark_comparison_1.BenchmarkComparison, { initialData: analysisData.benchmarkData || {
                            benchmarkOverlay: [],
                            competitorAnalysis: [],
                            performanceSummary: "Analysis pending...",
                            overlayScore: 0
                        } }),
                    react_1["default"].createElement(growth_classifier_1.GrowthClassifier, null)),
                react_1["default"].createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8" },
                    react_1["default"].createElement(gap_analysis_1.GapAnalysis, null),
                    react_1["default"].createElement(team_assessment_1.TeamAssessment, null)),
                react_1["default"].createElement(final_recommendation_1.FinalRecommendation, null),
                react_1["default"].createElement(dashboard_card_1.DashboardCard, { title: "Need More Detailed Analysis?", icon: lucide_react_1.AlertTriangle, description: "This triage report provides initial insights. For comprehensive due diligence, generate a full DD report." },
                    react_1["default"].createElement("div", { className: "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" },
                        react_1["default"].createElement("div", { className: "text-sm text-muted-foreground" }, "Full DD reports include competitive landscape, exit strategy roadmap, detailed risk mitigation, and comprehensive founder fit analysis."),
                        react_1["default"].createElement(button_1.Button, { onClick: function () { return router.push("/analysis/result?type=dd"); }, className: "shrink-0" }, "Generate DD Report"))))),
            process.env.NODE_ENV === 'development' && (react_1["default"].createElement(dashboard_card_1.DashboardCard, { title: "Analysis Debug Info", icon: lucide_react_1.BarChart3, description: "Development information about the analysis data" },
                react_1["default"].createElement("div", { className: "space-y-4 text-sm" },
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("strong", null, "Framework:"),
                        " ",
                        framework),
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("strong", null, "Report Type:"),
                        " ",
                        reportType),
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("strong", null, "Company:"),
                        " ",
                        companyName),
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("strong", null, "TCA Categories:"),
                        " ",
                        ((_b = (_a = analysisData.tcaData) === null || _a === void 0 ? void 0 : _a.categories) === null || _b === void 0 ? void 0 : _b.length) || 0,
                        "/12"),
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("strong", null, "Risk Flags:"),
                        " ",
                        ((_d = (_c = analysisData.riskData) === null || _c === void 0 ? void 0 : _c.riskFlags) === null || _d === void 0 ? void 0 : _d.length) || 0),
                    react_1["default"].createElement("div", null,
                        react_1["default"].createElement("strong", null, "Composite Score:"),
                        " ",
                        ((_e = analysisData.tcaData) === null || _e === void 0 ? void 0 : _e.compositeScore) || 'N/A'),
                    react_1["default"].createElement(button_1.Button, { onClick: handleRefreshAnalysis, variant: "outline", size: "sm", className: "mt-4" }, "Refresh Analysis")))))));
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
