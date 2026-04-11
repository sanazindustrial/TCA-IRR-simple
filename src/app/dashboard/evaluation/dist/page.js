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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var company_information_1 = require("@/components/analysis/company-information");
var document_submission_1 = require("@/components/analysis/document-submission");
var module_configuration_1 = require("@/components/analysis/module-configuration");
var external_data_sources_1 = require("@/components/evaluation/external-data-sources");
var button_1 = require("@/components/ui/button");
var use_toast_1 = require("@/hooks/use-toast");
var label_1 = require("@/components/ui/label");
var switch_1 = require("@/components/ui/switch");
var evaluation_provider_1 = require("@/components/evaluation/evaluation-provider");
var navigation_1 = require("next/navigation");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var tracking_service_1 = require("@/lib/tracking-service");
var auto_extraction_service_1 = require("@/lib/auto-extraction-service");
var lucide_react_2 = require("lucide-react");
var alert_1 = require("@/components/ui/alert");
// Autosave storage key
var AUTOSAVE_KEY = 'evaluation_autosave';
// Evaluation ID generator for unique indexing - using tracking service format
var generateEvaluationId = function () {
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return "EVAL-" + timestamp + "-" + random;
};
// Generate unique company ID for tracking
var generateCompanyId = function (companyName) {
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = Math.random().toString(36).substring(2, 6).toUpperCase();
    var prefix = companyName
        ? companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'CO'
        : 'CO';
    return prefix + "-" + timestamp + "-" + random;
};
// Default company info
var DEFAULT_COMPANY_INFO = {
    companyName: '',
    website: '',
    industryVertical: '',
    developmentStage: '',
    businessModel: '',
    country: '',
    state: '',
    city: '',
    oneLineDescription: '',
    companyDescription: '',
    productDescription: '',
    pitchDeckPath: '',
    legalName: '',
    numberOfEmployees: null
};
// Workflow steps configuration - Complete 7-step workflow
var WORKFLOW_STEPS = [
    {
        id: 1,
        name: 'Upload Pitch Deck',
        description: 'Upload your company pitch deck (PPT, PDF) to extract company details',
        icon: React.createElement(lucide_react_1.Upload, { className: "h-5 w-5" }),
        isLocked: function () { return false; },
        isComplete: function (data) { return data.hasDocuments; }
    },
    {
        id: 2,
        name: 'Company Information',
        description: 'Review and confirm extracted company details',
        icon: React.createElement(lucide_react_1.FileText, { className: "h-5 w-5" }),
        isLocked: function () { return false; },
        isComplete: function (data) { return data.hasCompanyInfo; }
    },
    {
        id: 3,
        name: 'External Data Sources',
        description: 'Configure external data extraction (Admin/Analyst)',
        icon: React.createElement(lucide_react_1.Database, { className: "h-5 w-5" }),
        isLocked: function (data) { return !data.hasCompanyInfo; },
        isComplete: function (data) { return data.hasExternalData || !data.hasCompanyInfo; }
    },
    {
        id: 4,
        name: 'Module Configuration',
        description: 'Configure analysis modules (Admin/Analyst)',
        icon: React.createElement(lucide_react_1.Settings, { className: "h-5 w-5" }),
        isLocked: function (data) { return !data.hasCompanyInfo; },
        isComplete: function () { return true; }
    },
    {
        id: 5,
        name: 'Run Analysis',
        description: 'Execute the startup evaluation',
        icon: React.createElement(lucide_react_1.Play, { className: "h-5 w-5" }),
        isLocked: function (data) { return !data.hasCompanyInfo && !data.hasDocuments; },
        isComplete: function (data) { return data.analysisComplete; }
    },
    {
        id: 6,
        name: 'What-If Analysis',
        description: 'Explore scenarios and adjust parameters',
        icon: React.createElement(lucide_react_1.GitBranch, { className: "h-5 w-5" }),
        isLocked: function (data) { return !data.analysisComplete; },
        isComplete: function () { return false; }
    },
    {
        id: 7,
        name: 'Generate Report',
        description: 'View and export final analysis report',
        icon: React.createElement(lucide_react_1.FileCheck2, { className: "h-5 w-5" }),
        isLocked: function (data) { return !data.analysisComplete; },
        isComplete: function () { return false; }
    },
];
// Workflow Progress Indicator Component
function WorkflowProgress(_a) {
    var currentStep = _a.currentStep, steps = _a.steps, workflowData = _a.workflowData, onStepClick = _a.onStepClick;
    return (React.createElement("div", { className: "mb-8" },
        React.createElement("div", { className: "flex items-center justify-between" }, steps.map(function (step, index) {
            var isActive = currentStep === step.id;
            var isLocked = step.isLocked(workflowData);
            var isComplete = step.isComplete(workflowData);
            var isPast = currentStep > step.id;
            return (React.createElement("div", { key: step.id, className: "flex items-center flex-1" },
                React.createElement("button", { onClick: function () { return !isLocked && onStepClick(step.id); }, disabled: isLocked, className: utils_1.cn("flex flex-col items-center gap-2 p-3 rounded-lg transition-all w-full", isActive && "bg-primary/10 border-2 border-primary", !isActive && !isLocked && "hover:bg-muted cursor-pointer", isLocked && "opacity-50 cursor-not-allowed", isComplete && !isActive && "bg-green-50 dark:bg-green-950") },
                    React.createElement("div", { className: utils_1.cn("flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors", isActive && "bg-primary text-primary-foreground border-primary", isComplete && !isActive && "bg-green-500 text-white border-green-500", isLocked && "bg-muted border-muted-foreground/30", !isActive && !isComplete && !isLocked && "border-muted-foreground/50") }, isLocked ? React.createElement(lucide_react_1.Lock, { className: "h-4 w-4" }) : isComplete && !isActive ? React.createElement(lucide_react_1.Check, { className: "h-4 w-4" }) : step.icon),
                    React.createElement("span", { className: utils_1.cn("text-xs font-medium text-center", isActive && "text-primary", isLocked && "text-muted-foreground") }, step.name)),
                index < steps.length - 1 && (React.createElement("div", { className: utils_1.cn("h-0.5 w-full mx-2", isPast || isComplete ? "bg-green-500" : "bg-muted") }))));
        }))));
}
function AnalysisSetup(_a) {
    var _b, _c, _d, _e, _f;
    var onClearAllData = _a.onClearAllData, onShowClearConfirm = _a.onShowClearConfirm, onExtractFromDocuments = _a.onExtractFromDocuments, isExtracting = _a.isExtracting, extractionComplete = _a.extractionComplete, extractionProgress = _a.extractionProgress, extractionTimeLeft = _a.extractionTimeLeft, extractionStep = _a.extractionStep, currentStep = _a.currentStep, setCurrentStep = _a.setCurrentStep, evaluationId = _a.evaluationId, workflowData = _a.workflowData;
    var _g = evaluation_provider_1.useEvaluationContext(), framework = _g.framework, onFrameworkChangeAction = _g.onFrameworkChangeAction, isPrivilegedUser = _g.isPrivilegedUser, isLoading = _g.isLoading, handleRunAnalysisAction = _g.handleRunAnalysisAction, _h = _g.uploadedFiles, uploadedFiles = _h === void 0 ? [] : _h, setUploadedFilesAction = _g.setUploadedFilesAction, _j = _g.importedUrls, importedUrls = _j === void 0 ? [] : _j, setImportedUrlsAction = _g.setImportedUrlsAction, _k = _g.submittedTexts, submittedTexts = _k === void 0 ? [] : _k, setSubmittedTextsAction = _g.setSubmittedTextsAction, companyInfo = _g.companyInfo;
    var hasDocuments = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
    var hasCompanyData = ((_c = (_b = companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.companyName) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 0 || ((_e = (_d = companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.companyDescription) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0) > 0;
    var hasData = hasDocuments || hasCompanyData;
    var canRunAnalysis = extractionComplete || !hasDocuments;
    // Filter steps for non-privileged users
    var visibleSteps = isPrivilegedUser
        ? WORKFLOW_STEPS
        : WORKFLOW_STEPS.filter(function (s) { return s.id <= 2 || s.id === 5; });
    var canGoNext = function () {
        var currentStepConfig = WORKFLOW_STEPS.find(function (s) { return s.id === currentStep; });
        if (!currentStepConfig)
            return false;
        // Check if current step is complete or optional
        if (currentStep === 1)
            return true; // Can always proceed from step 1
        if (currentStep === 2)
            return hasCompanyData || extractionComplete;
        if (currentStep === 3)
            return true; // External data is optional
        if (currentStep === 4)
            return true; // Module config has defaults
        return false;
    };
    var handleNext = function () {
        if (currentStep === 1 && hasDocuments && !extractionComplete) {
            // Auto-extract when moving from step 1 to step 2
            onExtractFromDocuments();
        }
        var nextSteps = visibleSteps.filter(function (s) { return s.id > currentStep; });
        if (nextSteps.length > 0) {
            setCurrentStep(nextSteps[0].id);
        }
    };
    var handleBack = function () {
        var prevSteps = visibleSteps.filter(function (s) { return s.id < currentStep; });
        if (prevSteps.length > 0) {
            setCurrentStep(prevSteps[prevSteps.length - 1].id);
        }
    };
    // Handle step click with navigation for external steps
    var handleStepClick = function (stepId) {
        var step = WORKFLOW_STEPS.find(function (s) { return s.id === stepId; });
        if (!step || step.isLocked(workflowData))
            return;
        // Navigate to external pages for steps 6 and 7
        if (stepId === 6) {
            window.location.href = '/analysis/what-if';
            return;
        }
        if (stepId === 7) {
            window.location.href = '/analysis/result';
            return;
        }
        // For other steps, just update the current step
        setCurrentStep(stepId);
    };
    return (React.createElement("div", { className: "space-y-6 mb-12" },
        React.createElement("div", { className: "flex items-center justify-between bg-muted/50 rounded-lg p-4" },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "px-3 py-1 bg-primary/10 rounded-full" },
                    React.createElement("span", { className: "text-sm font-mono font-semibold text-primary" }, evaluationId)),
                React.createElement("span", { className: "text-sm text-muted-foreground" }, "Unique Evaluation ID")),
            hasData && (React.createElement("span", { className: "flex items-center gap-2 text-sm text-muted-foreground" },
                React.createElement("span", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
                "Auto-saving"))),
        React.createElement(WorkflowProgress, { currentStep: currentStep, steps: visibleSteps, workflowData: workflowData, onStepClick: handleStepClick }),
        React.createElement("div", { className: "min-h-[400px]" },
            currentStep === 1 && (React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "border rounded-lg p-6" },
                    React.createElement("h3", { className: "text-lg font-semibold mb-2 flex items-center gap-2" },
                        React.createElement(lucide_react_1.Upload, { className: "h-5 w-5" }),
                        "Upload Pitch Deck"),
                    React.createElement("p", { className: "text-sm text-muted-foreground mb-4" }, "Upload your company pitch deck (PowerPoint or PDF) to automatically extract company information. You can upload additional documents after the initial analysis."),
                    React.createElement(document_submission_1.DocumentSubmission, { uploadedFiles: uploadedFiles, setUploadedFiles: setUploadedFilesAction || (function () { }), importedUrls: importedUrls, setImportedUrls: setImportedUrlsAction || (function () { }), submittedTexts: submittedTexts, setSubmittedTexts: setSubmittedTextsAction || (function () { }), showUrlInput: false, showTextInput: false, title: "Upload Pitch Deck", description: "Upload only 1 pitch deck file (PDF, DOCX, or PPTX)", pitchDeckOnly: true })),
                hasDocuments && (React.createElement("div", { className: "p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg" },
                    React.createElement("p", { className: "text-blue-700 dark:text-blue-300 text-sm" },
                        "\u2728 Pitch deck uploaded! Click ",
                        React.createElement("strong", null, "Next"),
                        " to extract company information automatically."))))),
            currentStep === 2 && (React.createElement("div", { className: "space-y-4" },
                isExtracting && (React.createElement("div", { className: "p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg" },
                    React.createElement("div", { className: "text-center" },
                        React.createElement("div", { className: "inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" }),
                        React.createElement("h4", { className: "text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2" }, "Extracting Company Information"),
                        React.createElement("p", { className: "text-blue-700 dark:text-blue-300 text-sm mb-4" }, extractionStep || 'Processing documents...'),
                        React.createElement("div", { className: "w-full max-w-md mx-auto mb-3" },
                            React.createElement("div", { className: "h-3 bg-blue-100 dark:bg-blue-800 rounded-full overflow-hidden" },
                                React.createElement("div", { className: "h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-200 ease-out", style: { width: Math.min(extractionProgress, 100) + "%" } }))),
                        React.createElement("div", { className: "flex items-center justify-center gap-2 text-sm" },
                            React.createElement("span", { className: "text-blue-600 dark:text-blue-400 font-medium" }, extractionTimeLeft > 0 ? (React.createElement(React.Fragment, null,
                                "\u23F1\uFE0F ~",
                                extractionTimeLeft,
                                "s remaining")) : (React.createElement(React.Fragment, null, "\u2728 Almost ready..."))),
                            React.createElement("span", { className: "text-blue-500/70 dark:text-blue-400/70" },
                                "(",
                                Math.round(extractionProgress),
                                "%)")),
                        React.createElement("p", { className: "text-xs text-blue-500/80 dark:text-blue-400/80 mt-3" }, "AI is analyzing your documents to extract company details")))),
                !isExtracting && extractionComplete && (React.createElement("div", { className: "p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" },
                    React.createElement("p", { className: "text-green-700 dark:text-green-300 text-sm flex items-center gap-2" },
                        React.createElement(lucide_react_1.Check, { className: "h-4 w-4" }),
                        "Company information extracted! Please review and edit if needed."))),
                React.createElement("div", { className: "border rounded-lg p-6" },
                    React.createElement("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
                        React.createElement(lucide_react_1.FileText, { className: "h-5 w-5" }),
                        "Company Information"),
                    React.createElement(company_information_1.CompanyInformation, { framework: framework, onFrameworkChange: onFrameworkChangeAction })),
                extractionComplete && (React.createElement("div", { className: "border rounded-lg p-6 bg-muted/30" },
                    React.createElement("h4", { className: "text-md font-semibold mb-2 flex items-center gap-2" },
                        React.createElement(lucide_react_1.Upload, { className: "h-4 w-4" }),
                        "Upload Additional Documents (Optional)"),
                    React.createElement("p", { className: "text-sm text-muted-foreground mb-4" }, "Add financial statements, market research, or other supporting documents. You can upload files, import from URLs, or paste text directly."),
                    React.createElement(document_submission_1.DocumentSubmission, { uploadedFiles: uploadedFiles, setUploadedFiles: setUploadedFilesAction || (function () { }), importedUrls: importedUrls, setImportedUrls: setImportedUrlsAction || (function () { }), submittedTexts: submittedTexts, setSubmittedTexts: setSubmittedTextsAction || (function () { }), showUrlInput: true, showTextInput: true, title: "Additional Documents" }))))),
            currentStep === 3 && isPrivilegedUser && (React.createElement("div", { className: "border rounded-lg p-6" },
                React.createElement("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
                    React.createElement(lucide_react_1.Database, { className: "h-5 w-5" }),
                    "External Data Sources"),
                React.createElement("p", { className: "text-sm text-muted-foreground mb-4" }, "Configure external data sources to enrich the analysis with market data, competitor info, and more."),
                React.createElement(external_data_sources_1.ExternalDataSources, { framework: framework, companyName: (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.companyName) || '' }))),
            currentStep === 4 && isPrivilegedUser && (React.createElement("div", { className: "border rounded-lg p-6" },
                React.createElement("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
                    React.createElement(lucide_react_1.Settings, { className: "h-5 w-5" }),
                    "Module Configuration"),
                React.createElement(module_configuration_1.ModuleConfiguration, { framework: framework }))),
            currentStep === 5 && (React.createElement("div", { className: "border rounded-lg p-6" },
                React.createElement("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
                    React.createElement(lucide_react_1.Play, { className: "h-5 w-5" }),
                    "Run Analysis"),
                React.createElement("div", { className: "space-y-4" },
                    React.createElement("div", { className: "bg-muted/50 rounded-lg p-4" },
                        React.createElement("h4", { className: "font-medium mb-2" }, "Analysis Summary"),
                        React.createElement("ul", { className: "text-sm text-muted-foreground space-y-1" },
                            React.createElement("li", null,
                                "\u2022 Evaluation ID: ",
                                React.createElement("span", { className: "font-mono text-primary" }, evaluationId)),
                            React.createElement("li", null,
                                "\u2022 Documents: ",
                                uploadedFiles.length,
                                " files, ",
                                importedUrls.length,
                                " URLs, ",
                                submittedTexts.length,
                                " text inputs"),
                            React.createElement("li", null,
                                "\u2022 Company: ",
                                (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.companyName) || 'Not specified'),
                            React.createElement("li", null,
                                "\u2022 Framework: ",
                                framework === 'medtech' ? 'MedTech' : 'General'))),
                    React.createElement(button_1.Button, { size: "lg", className: "w-full", onClick: handleRunAnalysisAction, disabled: isLoading || (hasDocuments && !canRunAnalysis) }, isLoading ? (React.createElement(React.Fragment, null,
                        React.createElement("span", { className: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" }),
                        "Running Analysis...")) : (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.Play, { className: "h-4 w-4 mr-2" }),
                        "Run Analysis"))))))),
        React.createElement("div", { className: "flex justify-between items-center pt-6 border-t" },
            React.createElement("div", { className: "flex gap-2" },
                React.createElement(button_1.Button, { variant: "outline", onClick: handleBack, disabled: currentStep === ((_f = visibleSteps[0]) === null || _f === void 0 ? void 0 : _f.id) },
                    React.createElement(lucide_react_1.ChevronLeft, { className: "h-4 w-4 mr-1" }),
                    "Back"),
                hasData && (React.createElement(button_1.Button, { variant: "ghost", onClick: onShowClearConfirm, className: "text-destructive hover:text-destructive" },
                    React.createElement(lucide_react_2.Trash2, { className: "h-4 w-4 mr-1" }),
                    "Clear All Data"))),
            React.createElement("div", { className: "flex gap-2" }, currentStep < 5 && (React.createElement(button_1.Button, { onClick: handleNext, disabled: !canGoNext() },
                "Next",
                React.createElement(lucide_react_1.ChevronRight, { className: "h-4 w-4 ml-1" })))))));
}
function EvaluationPage() {
    var _this = this;
    var _a, _b, _c, _d;
    var _e = react_1.useState(false), isLoading = _e[0], setIsLoading = _e[1];
    var _f = react_1.useState('general'), framework = _f[0], setFramework = _f[1];
    var _g = react_1.useState('user'), role = _g[0], setRole = _g[1];
    var _h = react_1.useState('triage'), reportType = _h[0], setReportType = _h[1];
    var _j = react_1.useState(false), isInitialized = _j[0], setIsInitialized = _j[1];
    var toast = use_toast_1.useToast().toast;
    var router = navigation_1.useRouter();
    // Workflow step state
    var _k = react_1.useState(1), currentStep = _k[0], setCurrentStep = _k[1];
    var _l = react_1.useState(function () { return generateEvaluationId(); }), evaluationId = _l[0], setEvaluationId = _l[1];
    var _m = react_1.useState(function () { return generateCompanyId(); }), companyId = _m[0], setCompanyId = _m[1];
    var _o = react_1.useState(true), isFreshEvaluation = _o[0], setIsFreshEvaluation = _o[1];
    // Ref to track if auto-extraction has been triggered
    var autoExtractionTriggered = react_1.useRef(false);
    // State for document submission
    var _p = react_1.useState([]), uploadedFiles = _p[0], setUploadedFiles = _p[1];
    var _q = react_1.useState([]), importedUrls = _q[0], setImportedUrls = _q[1];
    var _r = react_1.useState([]), submittedTexts = _r[0], setSubmittedTexts = _r[1];
    // State for company information (unified object for all fields)
    var _s = react_1.useState(DEFAULT_COMPANY_INFO), companyInfo = _s[0], setCompanyInfo = _s[1];
    // Helper to update company info fields
    var updateCompanyInfo = react_1.useCallback(function (updates) {
        setCompanyInfo(function (prev) { return (__assign(__assign({}, prev), updates)); });
    }, []);
    // State for AI extraction
    var _t = react_1.useState(false), isExtracting = _t[0], setIsExtracting = _t[1];
    var _u = react_1.useState(false), isAiProcessing = _u[0], setIsAiProcessing = _u[1]; // Track AI API call phase
    var _v = react_1.useState(false), extractionComplete = _v[0], setExtractionComplete = _v[1];
    var _w = react_1.useState(0), extractionProgress = _w[0], setExtractionProgress = _w[1];
    var _x = react_1.useState(0), extractionTimeLeft = _x[0], setExtractionTimeLeft = _x[1];
    var _y = react_1.useState(''), extractionStep = _y[0], setExtractionStep = _y[1];
    var extractionStartTime = react_1.useRef(0);
    var ESTIMATED_EXTRACTION_TIME = 8; // 8 seconds estimated for AI extraction
    // Countdown timer effect for AI extraction phase only
    react_1.useEffect(function () {
        var interval;
        if (isAiProcessing && extractionStartTime.current > 0) {
            interval = setInterval(function () {
                var elapsed = (Date.now() - extractionStartTime.current) / 1000;
                var remaining = Math.max(0, ESTIMATED_EXTRACTION_TIME - elapsed);
                // Progress from 40% to 95% during AI phase
                var aiProgress = Math.min(55, (elapsed / ESTIMATED_EXTRACTION_TIME) * 55);
                setExtractionTimeLeft(Math.ceil(remaining));
                setExtractionProgress(40 + aiProgress);
            }, 100);
        }
        return function () { return clearInterval(interval); };
    }, [isAiProcessing]);
    // Compute workflow data for step validation
    var workflowData = {
        hasDocuments: uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0,
        extractionComplete: extractionComplete,
        hasCompanyInfo: ((_b = (_a = companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.companyName) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0 || ((_d = (_c = companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.companyDescription) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 0,
        hasExternalData: false,
        analysisComplete: false,
        hasModuleConfig: true
    };
    // User session state
    var _z = react_1.useState(null), userSession = _z[0], setUserSession = _z[1];
    var _0 = react_1.useState(false), showClearConfirm = _0[0], setShowClearConfirm = _0[1];
    // Load user session on mount
    react_1.useEffect(function () {
        var loadUserSession = function () {
            var _a, _b, _c;
            var storedUser = localStorage.getItem('loggedInUser');
            if (storedUser) {
                try {
                    var user = JSON.parse(storedUser);
                    setUserSession({
                        userId: user.id || user.userId || 'unknown',
                        email: user.email || 'Not logged in',
                        name: user.name || ((_a = user.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'User',
                        role: (((_b = user.role) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || 'user'),
                        companyActive: companyInfo.companyName || undefined,
                        sessionStart: Date.now(),
                        lastActivity: Date.now()
                    });
                    setRole(((_c = user.role) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || 'user');
                }
                catch (e) {
                    console.warn('Failed to parse user session:', e);
                    setRole('user');
                }
            }
            else {
                setRole('user');
            }
        };
        loadUserSession();
    }, []);
    // Update session activity and company
    react_1.useEffect(function () {
        if (userSession && companyInfo.companyName) {
            setUserSession(function (prev) { return prev ? __assign(__assign({}, prev), { companyActive: companyInfo.companyName, lastActivity: Date.now() }) : null; });
        }
    }, [companyInfo.companyName]);
    // Start fresh evaluation - clears all previous data COMPLETELY
    var startNewEvaluation = react_1.useCallback(function () {
        // Archive current evaluation if it has data
        auto_extraction_service_1.archiveCurrentEvaluation();
        // Clear all previous evaluation state
        auto_extraction_service_1.clearEvaluationState();
        tracking_service_1.trackingService.clearAllPreviousData();
        // Generate new IDs
        var newEvaluationId = generateEvaluationId();
        var newCompanyId = generateCompanyId();
        setEvaluationId(newEvaluationId);
        setCompanyId(newCompanyId);
        setIsFreshEvaluation(true);
        // Reset all state
        setUploadedFiles([]);
        setImportedUrls([]);
        setSubmittedTexts([]);
        setCompanyInfo(DEFAULT_COMPANY_INFO);
        setExtractionComplete(false);
        setIsExtracting(false);
        setExtractionProgress(0);
        setExtractionTimeLeft(0);
        setExtractionStep('');
        extractionStartTime.current = 0;
        setCurrentStep(1);
        setFramework('general');
        setReportType('triage');
        autoExtractionTriggered.current = false;
        // Initialize tracking service
        tracking_service_1.trackingService.initializeNewEvaluation('general');
        // CLEAR ALL localStorage keys related to evaluation/analysis
        var keysToRemove = [
            AUTOSAVE_KEY,
            'processedFiles',
            'processedUrls',
            'processedTexts',
            'analysisResult',
            'analysisDuration',
            'analysisFramework',
            'analysisEvaluationId',
            'analysisCompanyId',
            'analysisCompanyName',
            'currentEvaluationId',
            'currentCompanyId',
            'evaluationArchive',
            'tca_analysis_state',
        ];
        keysToRemove.forEach(function (key) {
            try {
                localStorage.removeItem(key);
            }
            catch (e) {
                console.warn("Failed to remove " + key + ":", e);
            }
        });
        // Hide clear confirmation
        setShowClearConfirm(false);
        toast({
            title: 'New Company Analysis Started',
            description: "Fresh analysis " + newEvaluationId + " created."
        });
    }, [framework, toast]);
    // Auto-extract when documents are uploaded - AUTOMATIC, no button needed
    var triggerAutoExtraction = react_1.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var hasContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (autoExtractionTriggered.current || isExtracting)
                        return [2 /*return*/];
                    hasContent = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
                    if (!hasContent)
                        return [2 /*return*/];
                    autoExtractionTriggered.current = true;
                    // Show toast that extraction is starting
                    toast({
                        title: 'Starting Extraction',
                        description: 'Analyzing uploaded documents for company information...'
                    });
                    return [4 /*yield*/, handleExtractFromDocuments()];
                case 1:
                    _a.sent();
                    // Auto-navigate to step 2 after successful extraction to show filled form
                    setCurrentStep(2);
                    return [2 /*return*/];
            }
        });
    }); }, [uploadedFiles, importedUrls, submittedTexts, isExtracting, toast]);
    // Auto-trigger extraction when documents change (only in step 1)
    react_1.useEffect(function () {
        var hasDocuments = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
        if (isInitialized && hasDocuments && !extractionComplete && !isExtracting && currentStep === 1) {
            // Delay auto-extraction slightly to allow batch uploads
            var timer_1 = setTimeout(function () {
                triggerAutoExtraction();
            }, 1500); // 1.5 second delay for batch uploads (reduced from 2s)
            return function () { return clearTimeout(timer_1); };
        }
    }, [uploadedFiles.length, importedUrls.length, submittedTexts.length, isInitialized, extractionComplete, isExtracting, currentStep, triggerAutoExtraction]);
    // Extract company info from uploaded documents
    var handleExtractFromDocuments = function () { return __awaiter(_this, void 0, void 0, function () {
        var maxWait, processedFiles, processedUrls, processedTexts, allContent, response, extractedData, updates_1, newCompanyId, fieldsExtracted, extractedName, extractedDescription, extractedWebsite, extractedIndustry, extractedStage, updates_2, newCompanyId, fieldsExtracted, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsExtracting(true);
                    setExtractionProgress(0);
                    setExtractionStep('Reading document content...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 11]);
                    maxWait = 15;
                    processedFiles = [];
                    processedUrls = [];
                    processedTexts = [];
                    allContent = '';
                    _a.label = 2;
                case 2:
                    if (!(maxWait > 0)) return [3 /*break*/, 4];
                    setExtractionStep("Waiting for document processing... (" + maxWait + "s)");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 3:
                    _a.sent();
                    maxWait--;
                    // Get processed files from localStorage (set by document-submission component)
                    processedFiles = JSON.parse(localStorage.getItem('processedFiles') || '[]');
                    processedUrls = JSON.parse(localStorage.getItem('processedUrls') || '[]');
                    processedTexts = JSON.parse(localStorage.getItem('processedTexts') || '[]');
                    // Combine all text content for extraction
                    allContent = __spreadArrays(processedFiles.map(function (f) { var _a; return ((_a = f.extracted_data) === null || _a === void 0 ? void 0 : _a.text_content) || ''; }), processedUrls.map(function (u) { var _a; return ((_a = u.extracted_data) === null || _a === void 0 ? void 0 : _a.text_content) || ''; }), processedTexts.map(function (t) { return t.content || ''; }), submittedTexts).filter(function (c) { return c.length > 0 && !c.includes('[File extraction pending') && !c.includes('[File extraction failed'); }).join('\n\n');
                    // Update progress based on wait time
                    setExtractionProgress(Math.min(30, ((15 - maxWait) / 15) * 30));
                    // If we have real content, break
                    if (allContent.trim().length >= 50)
                        return [3 /*break*/, 4];
                    return [3 /*break*/, 2];
                case 4:
                    // If still no content, show message and exit
                    if (allContent.trim().length < 50) {
                        toast({
                            title: 'Processing Documents',
                            description: 'Could not extract text content. Please try uploading a different file format (PDF recommended).',
                            variant: 'destructive'
                        });
                        setIsExtracting(false);
                        setIsAiProcessing(false);
                        setExtractionProgress(0);
                        setExtractionTimeLeft(0);
                        extractionStartTime.current = 0;
                        autoExtractionTriggered.current = false; // Allow retry
                        return [2 /*return*/];
                    }
                    setExtractionStep('Analyzing with AI...');
                    setExtractionProgress(40);
                    // Start the AI countdown timer
                    extractionStartTime.current = Date.now();
                    setIsAiProcessing(true);
                    return [4 /*yield*/, fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-company-info', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                content: allContent,
                                framework: framework
                            })
                        })];
                case 5:
                    response = _a.sent();
                    setExtractionStep('Processing extracted data...');
                    if (!response.ok) return [3 /*break*/, 7];
                    return [4 /*yield*/, response.json()];
                case 6:
                    extractedData = _a.sent();
                    console.log('Extraction API response:', extractedData);
                    updates_1 = {};
                    if (extractedData.company_name)
                        updates_1.companyName = extractedData.company_name;
                    if (extractedData.legal_name)
                        updates_1.legalName = extractedData.legal_name;
                    if (extractedData.website)
                        updates_1.website = extractedData.website;
                    if (extractedData.description)
                        updates_1.companyDescription = extractedData.description;
                    if (extractedData.one_line_description)
                        updates_1.oneLineDescription = extractedData.one_line_description;
                    if (extractedData.product_description)
                        updates_1.productDescription = extractedData.product_description;
                    if (extractedData.industry_vertical)
                        updates_1.industryVertical = extractedData.industry_vertical;
                    if (extractedData.development_stage)
                        updates_1.developmentStage = extractedData.development_stage;
                    if (extractedData.business_model)
                        updates_1.businessModel = extractedData.business_model;
                    if (extractedData.country)
                        updates_1.country = extractedData.country;
                    if (extractedData.state)
                        updates_1.state = extractedData.state;
                    if (extractedData.city)
                        updates_1.city = extractedData.city;
                    if (extractedData.number_of_employees)
                        updates_1.numberOfEmployees = extractedData.number_of_employees;
                    // Update company info with extracted data
                    if (Object.keys(updates_1).length > 0) {
                        setCompanyInfo(function (prev) { return (__assign(__assign({}, prev), updates_1)); });
                        console.log('Updated company info with:', updates_1);
                    }
                    // Generate company ID based on extracted name
                    if (extractedData.company_name) {
                        newCompanyId = generateCompanyId(extractedData.company_name);
                        setCompanyId(newCompanyId);
                    }
                    fieldsExtracted = Object.keys(updates_1).length;
                    toast({
                        title: 'Extraction Complete!',
                        description: "Extracted " + fieldsExtracted + " field(s). Please review and confirm the details."
                    });
                    return [3 /*break*/, 8];
                case 7:
                    console.log('Extraction API failed, using fallback extraction');
                    extractedName = extractNameFromContent(allContent);
                    extractedDescription = extractDescriptionFromContent(allContent);
                    extractedWebsite = extractWebsiteFromContent(allContent);
                    extractedIndustry = extractIndustryFromContent(allContent);
                    extractedStage = extractStageFromContent(allContent);
                    updates_2 = {};
                    if (extractedName)
                        updates_2.companyName = extractedName;
                    if (extractedDescription)
                        updates_2.companyDescription = extractedDescription;
                    if (extractedWebsite)
                        updates_2.website = extractedWebsite;
                    if (extractedIndustry)
                        updates_2.industryVertical = extractedIndustry;
                    if (extractedStage)
                        updates_2.developmentStage = extractedStage;
                    if (Object.keys(updates_2).length > 0) {
                        setCompanyInfo(function (prev) { return (__assign(__assign({}, prev), updates_2)); });
                        console.log('Fallback extraction found:', updates_2);
                        // Generate company ID if we found a name
                        if (updates_2.companyName) {
                            newCompanyId = generateCompanyId(updates_2.companyName);
                            setCompanyId(newCompanyId);
                        }
                    }
                    fieldsExtracted = Object.keys(updates_2).length;
                    toast({
                        title: fieldsExtracted > 0 ? 'Extraction Complete' : 'Manual Entry Required',
                        description: fieldsExtracted > 0
                            ? "Extracted " + fieldsExtracted + " field(s). Please review and complete any missing information."
                            : 'Could not identify company information automatically. Please enter details manually.'
                    });
                    _a.label = 8;
                case 8:
                    setExtractionComplete(true);
                    return [3 /*break*/, 11];
                case 9:
                    error_1 = _a.sent();
                    console.error('Extraction failed:', error_1);
                    toast({
                        variant: 'destructive',
                        title: 'Extraction Failed',
                        description: 'Could not extract company info. Please fill in the details manually.'
                    });
                    setExtractionComplete(true); // Still mark complete so user can proceed
                    return [3 /*break*/, 11];
                case 10:
                    setIsExtracting(false);
                    setIsAiProcessing(false);
                    setExtractionProgress(100);
                    setExtractionStep('Complete!');
                    setExtractionTimeLeft(0);
                    extractionStartTime.current = 0;
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    // Helper functions for robust extraction fallback
    var extractNameFromContent = function (content) {
        // Look for common patterns - expanded to handle more cases
        var patterns = [
            // Direct company mentions
            /(?:company\s*(?:name)?[:\s]+)([A-Z][A-Za-z0-9\s&.,]+?)(?:\s*[-–—|,]|$)/im,
            // Pitch deck title patterns
            /^([A-Z][A-Za-z0-9\s&]+?)\s*[-–—|]\s*(?:pitch|deck|presentation|investor)/im,
            // About section
            /(?:about|introducing|introducing)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[-–—.,]|$)/im,
            // Header/Title patterns
            /^#\s*([A-Z][A-Za-z0-9\s&]+)$/m,
            // Logo/Company header
            /(?:welcome to|meet|discover)\s+([A-Z][A-Za-z0-9\s&]+)/i,
            // Legal patterns
            /(?:inc\.|llc|corp\.|ltd\.?)\s*$/im,
            // First line if capitalized
            /^([A-Z][A-Z0-9\s]{2,30})$/m,
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = content.match(pattern);
            if ((match === null || match === void 0 ? void 0 : match[1]) || (match === null || match === void 0 ? void 0 : match[0])) {
                var name = (match[1] || match[0]).trim().replace(/\s+/g, ' ').slice(0, 100);
                if (name.length > 2 && !name.toLowerCase().includes('pitch') && !name.toLowerCase().includes('deck')) {
                    return name;
                }
            }
        }
        return '';
    };
    var extractDescriptionFromContent = function (content) {
        // Look for description patterns - expanded
        var patterns = [
            /(?:we\s+are|is\s+a|company\s+that)\s+([^.!?]+[.!?])/i,
            /(?:our\s+mission|mission[:\s]+)([^.!?]+[.!?])/i,
            /(?:what\s+we\s+do|overview[:\s]+)([^.!?]+[.!?])/i,
            /(?:executive\s+summary[:\s]+)([^.!?]+[.!?])/i,
            /(?:company\s+description[:\s]+)([^.!?]+[.!?])/i,
            /(?:about\s+(?:us|the\s+company)[:\s]+)([^.!?]+[.!?])/i,
        ];
        for (var _i = 0, patterns_2 = patterns; _i < patterns_2.length; _i++) {
            var pattern = patterns_2[_i];
            var match = content.match(pattern);
            if (match === null || match === void 0 ? void 0 : match[1])
                return match[1].trim().slice(0, 500);
        }
        // Return first substantial paragraph
        var paragraphs = content.split(/\n\n+/).filter(function (p) { return p.length > 50 && p.length < 500; });
        return paragraphs[0] || '';
    };
    // Enhanced extraction for additional fields
    var extractWebsiteFromContent = function (content) {
        var match = content.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
        return match ? "https://www." + match[1] : '';
    };
    var extractIndustryFromContent = function (content) {
        var industries = {
            'Software/SaaS': ['saas', 'software', 'cloud', 'api', 'platform'],
            'FinTech': ['fintech', 'financial', 'banking', 'payment', 'lending'],
            'HealthTech/MedTech': ['health', 'medical', 'healthcare', 'clinical', 'patient'],
            'AI/ML': ['artificial intelligence', 'machine learning', 'ai', 'ml', 'deep learning'],
            'E-commerce': ['ecommerce', 'e-commerce', 'retail', 'marketplace', 'shopping'],
            'EdTech': ['education', 'learning', 'edtech', 'e-learning', 'training'],
            'CleanTech/GreenTech': ['clean', 'green', 'sustainable', 'renewable', 'environmental'],
            'Cybersecurity': ['security', 'cyber', 'encryption', 'privacy', 'protection']
        };
        var lower = content.toLowerCase();
        for (var _i = 0, _a = Object.entries(industries); _i < _a.length; _i++) {
            var _b = _a[_i], industry = _b[0], keywords = _b[1];
            if (keywords.some(function (k) { return lower.includes(k); }))
                return industry;
        }
        return '';
    };
    var extractStageFromContent = function (content) {
        var lower = content.toLowerCase();
        if (lower.includes('series c') || lower.includes('series d'))
            return 'Series C+';
        if (lower.includes('series b'))
            return 'Series B';
        if (lower.includes('series a'))
            return 'Series A';
        if (lower.includes('seed round') || lower.includes('seed funding'))
            return 'Seed';
        if (lower.includes('pre-seed') || lower.includes('preseed'))
            return 'Pre-seed';
        if (lower.includes('growth') || lower.includes('scaling'))
            return 'Growth';
        return '';
    };
    // Restore autosaved data on mount
    react_1.useEffect(function () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            var savedData = localStorage.getItem(AUTOSAVE_KEY);
            if (savedData) {
                var parsed = JSON.parse(savedData);
                // Only restore if data is less than 24 hours old
                var isRecent = Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000;
                if (isRecent && parsed.isFreshEvaluation !== false) {
                    // Restore evaluation IDs
                    if (parsed.evaluationId)
                        setEvaluationId(parsed.evaluationId);
                    if (parsed.companyId)
                        setCompanyId(parsed.companyId);
                    if (parsed.isFreshEvaluation !== undefined)
                        setIsFreshEvaluation(parsed.isFreshEvaluation);
                    if (((_a = parsed.uploadedFiles) === null || _a === void 0 ? void 0 : _a.length) > 0)
                        setUploadedFiles(parsed.uploadedFiles);
                    if (((_b = parsed.importedUrls) === null || _b === void 0 ? void 0 : _b.length) > 0)
                        setImportedUrls(parsed.importedUrls);
                    if (((_c = parsed.submittedTexts) === null || _c === void 0 ? void 0 : _c.length) > 0)
                        setSubmittedTexts(parsed.submittedTexts);
                    if (parsed.framework)
                        setFramework(parsed.framework);
                    if (parsed.reportType)
                        setReportType(parsed.reportType);
                    // Restore company info as unified object
                    if (parsed.companyInfo) {
                        setCompanyInfo(parsed.companyInfo);
                    }
                    // Show toast if data was restored
                    var hasData = ((_d = parsed.uploadedFiles) === null || _d === void 0 ? void 0 : _d.length) > 0 || ((_e = parsed.importedUrls) === null || _e === void 0 ? void 0 : _e.length) > 0 || ((_f = parsed.submittedTexts) === null || _f === void 0 ? void 0 : _f.length) > 0 || ((_g = parsed.companyInfo) === null || _g === void 0 ? void 0 : _g.companyName);
                    if (hasData) {
                        toast({
                            title: 'Evaluation Restored',
                            description: "Restored evaluation " + (parsed.evaluationId || 'data') + " from your last session."
                        });
                    }
                }
                else if (!isRecent) {
                    // Data is old, start fresh
                    localStorage.removeItem(AUTOSAVE_KEY);
                }
            }
        }
        catch (e) {
            console.warn('Failed to restore autosaved data:', e);
        }
        setIsInitialized(true);
    }, [toast]);
    // Autosave data whenever it changes
    react_1.useEffect(function () {
        if (!isInitialized)
            return; // Don't save during initial restore
        var autosaveData = {
            evaluationId: evaluationId,
            companyId: companyId,
            currentStep: currentStep,
            uploadedFiles: uploadedFiles,
            importedUrls: importedUrls,
            submittedTexts: submittedTexts,
            framework: framework,
            reportType: reportType,
            companyInfo: companyInfo,
            savedAt: Date.now(),
            isFreshEvaluation: isFreshEvaluation
        };
        try {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData));
        }
        catch (e) {
            console.warn('Failed to autosave:', e);
        }
    }, [evaluationId, companyId, currentStep, uploadedFiles, importedUrls, submittedTexts, framework, reportType, companyInfo, isInitialized, isFreshEvaluation]);
    // Clear autosave after successful analysis
    var clearAutosave = react_1.useCallback(function () {
        localStorage.removeItem(AUTOSAVE_KEY);
    }, []);
    // Clear all data - uses fresh evaluation start
    var clearAllData = react_1.useCallback(function () {
        startNewEvaluation();
    }, [startNewEvaluation]);
    react_1.useEffect(function () {
        var _a;
        var storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            try {
                var user = JSON.parse(storedUser);
                setRole(((_a = user.role) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'user');
            }
            catch (e) {
                setRole('user');
            }
        }
        else {
            setRole('user');
        }
    }, []);
    var handleRunAnalysis = function () { return __awaiter(_this, void 0, void 0, function () {
        var hasData, companyData, saveError_1, keysToBeforeNewAnalysis, sanitizedCompanyName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hasData = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0 || companyInfo.companyName;
                    // NO MOCK DATA - Require real company data
                    if (!hasData) {
                        toast({
                            variant: 'destructive',
                            title: 'No Data Provided',
                            description: 'Please upload documents or enter company information to run analysis.'
                        });
                        return [2 /*return*/];
                    }
                    if (!companyInfo.companyName) {
                        toast({
                            variant: 'destructive',
                            title: 'Company Name Required',
                            description: 'Please enter a company name before running analysis.'
                        });
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    // Track analysis start
                    tracking_service_1.trackingService.trackAnalysis(evaluationId, 'FULL_ANALYSIS', 'Complete 9-Module Analysis', { companyName: companyInfo.companyName, framework: framework, documentCount: uploadedFiles.length });
                    companyData = {
                        company_id: companyId,
                        evaluation_id: evaluationId,
                        company_name: companyInfo.companyName,
                        legal_name: companyInfo.legalName,
                        website: companyInfo.website,
                        description: companyInfo.companyDescription,
                        one_line_description: companyInfo.oneLineDescription,
                        product_description: companyInfo.productDescription,
                        industry_vertical: companyInfo.industryVertical,
                        development_stage: companyInfo.developmentStage,
                        business_model: companyInfo.businessModel,
                        country: companyInfo.country,
                        state: companyInfo.state,
                        city: companyInfo.city,
                        number_of_employees: companyInfo.numberOfEmployees,
                        framework: framework
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/companies', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(companyData)
                        })];
                case 2:
                    _a.sent();
                    console.log('Company data saved to database');
                    return [3 /*break*/, 4];
                case 3:
                    saveError_1 = _a.sent();
                    console.warn('Failed to save company data to database:', saveError_1);
                    return [3 /*break*/, 4];
                case 4:
                    keysToBeforeNewAnalysis = [
                        'analysisResult',
                        'analysisTrackingInfo',
                        'currentEvaluationId',
                        'currentAnalysisId',
                        'reportApprovalStatus',
                        'analysisCompanyName',
                        'analysisFramework',
                        'analysisEvaluationId',
                        'analysisCompanyId',
                        'uploadedFiles',
                        'importedUrls',
                        'submittedTexts',
                        'companyData'
                    ];
                    keysToBeforeNewAnalysis.forEach(function (key) { return localStorage.removeItem(key); });
                    console.log('🧹 Cleared old analysis data before new evaluation');
                    sanitizedCompanyName = companyInfo.companyName.replace(/[\r\n]+/g, ' ').trim();
                    localStorage.setItem('analysisCompanyName', sanitizedCompanyName);
                    localStorage.setItem('analysisFramework', framework);
                    localStorage.setItem('analysisEvaluationId', evaluationId);
                    localStorage.setItem('analysisCompanyId', companyId);
                    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
                    localStorage.setItem('importedUrls', JSON.stringify(importedUrls));
                    localStorage.setItem('submittedTexts', JSON.stringify(submittedTexts));
                    localStorage.setItem('companyData', JSON.stringify(__assign({ uploadedFiles: uploadedFiles,
                        importedUrls: importedUrls,
                        submittedTexts: submittedTexts, companyName: sanitizedCompanyName, companyDescription: companyInfo.companyDescription || submittedTexts[0] || '' }, companyData)));
                    // Clear autosave before navigating
                    clearAutosave();
                    toast({
                        title: 'Starting Analysis',
                        description: "Redirecting to run all 9 modules for " + sanitizedCompanyName + "..."
                    });
                    // Redirect to the analysis runner page which shows 9-module progress
                    router.push('/analysis/run');
                    return [2 /*return*/];
            }
        });
    }); };
    var isPrivilegedUser = role === 'admin' || role === 'analyst';
    return (React.createElement(evaluation_provider_1.EvaluationProvider, { role: role, reportType: reportType, framework: framework, onFrameworkChangeAction: setFramework, setReportTypeAction: setReportType, isLoading: isLoading, handleRunAnalysisAction: handleRunAnalysis, uploadedFiles: uploadedFiles, setUploadedFilesAction: setUploadedFiles, importedUrls: importedUrls, setImportedUrlsAction: setImportedUrls, submittedTexts: submittedTexts, setSubmittedTextsAction: setSubmittedTexts, companyName: companyInfo.companyName, setCompanyNameAction: function (name) {
            var newName = typeof name === 'function' ? name(companyInfo.companyName) : name;
            setCompanyInfo(function (prev) { return (__assign(__assign({}, prev), { companyName: newName })); });
        }, companyDescription: companyInfo.companyDescription, setCompanyDescriptionAction: function (desc) {
            var newDesc = typeof desc === 'function' ? desc(companyInfo.companyDescription) : desc;
            setCompanyInfo(function (prev) { return (__assign(__assign({}, prev), { companyDescription: newDesc })); });
        }, companyInfo: companyInfo, setCompanyInfoAction: setCompanyInfo },
        React.createElement("main", { className: "bg-background text-foreground" },
            React.createElement("div", { className: "container mx-auto p-4 md:p-8" },
                React.createElement("div", { className: "mb-6 p-4 bg-muted/50 rounded-lg border" },
                    React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-4" },
                        React.createElement("div", { className: "flex items-center gap-6" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_2.User, { className: "h-4 w-4 text-muted-foreground" }),
                                React.createElement("span", { className: "text-sm" },
                                    React.createElement("span", { className: "text-muted-foreground" }, "User: "),
                                    React.createElement("span", { className: "font-medium" }, (userSession === null || userSession === void 0 ? void 0 : userSession.email) || 'Not logged in')),
                                React.createElement("span", { className: "px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize" }, (userSession === null || userSession === void 0 ? void 0 : userSession.role) || role)),
                            companyInfo.companyName && (React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_2.Building2, { className: "h-4 w-4 text-muted-foreground" }),
                                React.createElement("span", { className: "text-sm" },
                                    React.createElement("span", { className: "text-muted-foreground" }, "Active Company: "),
                                    React.createElement("span", { className: "font-medium text-primary" }, companyInfo.companyName))))),
                        React.createElement("div", { className: "text-xs text-muted-foreground" },
                            "Session ID: ",
                            evaluationId))),
                showClearConfirm && (React.createElement(alert_1.Alert, { className: "mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950" },
                    React.createElement(lucide_react_2.AlertTriangle, { className: "h-4 w-4 text-yellow-600" }),
                    React.createElement(alert_1.AlertDescription, { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "text-yellow-700 dark:text-yellow-300" }, "Are you sure you want to clear ALL data? This action cannot be undone."),
                        React.createElement("div", { className: "flex gap-2 ml-4" },
                            React.createElement(button_1.Button, { size: "sm", variant: "outline", onClick: function () { return setShowClearConfirm(false); } }, "Cancel"),
                            React.createElement(button_1.Button, { size: "sm", variant: "destructive", onClick: startNewEvaluation },
                                React.createElement(lucide_react_2.Trash2, { className: "h-4 w-4 mr-1" }),
                                "Clear All & Start Fresh"))))),
                React.createElement("header", { className: "text-center mb-12" },
                    (role === 'admin' || role === 'analyst') && (React.createElement("div", { className: "flex justify-center items-center gap-4 mb-4" },
                        React.createElement(label_1.Label, { htmlFor: "role-switcher", className: !isPrivilegedUser ? 'text-primary' : '' }, "Standard User"),
                        React.createElement(switch_1.Switch, { id: "role-switcher", checked: isPrivilegedUser, onCheckedChange: function (checked) {
                                var newRole = checked ? 'admin' : 'user';
                                setRole(newRole);
                                if (newRole === 'user') {
                                    setReportType('triage');
                                }
                            } }),
                        React.createElement(label_1.Label, { htmlFor: "role-switcher", className: isPrivilegedUser ? 'text-primary' : '' }, "Admin / Analyst"))),
                    React.createElement("div", { className: 'relative' },
                        React.createElement("h1", { className: "text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight" }, "Company Analysis Setup")),
                    React.createElement("p", { className: "mt-4 text-lg text-muted-foreground max-w-2xl mx-auto" }, "Configure the inputs for the company analysis."),
                    React.createElement("div", { className: "mt-4" },
                        React.createElement(button_1.Button, { variant: "outline", onClick: startNewEvaluation, className: "gap-2" },
                            React.createElement(lucide_react_1.RefreshCw, { className: "h-4 w-4" }),
                            "Start New Company Analysis"))),
                isLoading ? (React.createElement("div", { className: "flex items-center justify-center py-12" },
                    React.createElement("div", { className: "text-center" },
                        React.createElement("div", { className: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" }),
                        React.createElement("p", { className: "mt-4 text-muted-foreground" },
                            "Running analysis for ",
                            companyInfo.companyName || 'company',
                            "...")))) : React.createElement(AnalysisSetup, { onClearAllData: clearAllData, onShowClearConfirm: function () { return setShowClearConfirm(true); }, onExtractFromDocuments: handleExtractFromDocuments, isExtracting: isExtracting, extractionComplete: extractionComplete, extractionProgress: extractionProgress, extractionTimeLeft: extractionTimeLeft, extractionStep: extractionStep, currentStep: currentStep, setCurrentStep: setCurrentStep, evaluationId: evaluationId, workflowData: workflowData })))));
}
exports["default"] = EvaluationPage;
