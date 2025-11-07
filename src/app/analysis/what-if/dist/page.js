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
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var table_1 = require("@/components/ui/table");
var input_1 = require("@/components/ui/input");
var use_toast_1 = require("@/hooks/use-toast");
var loading_1 = require("@/app/loading");
var lucide_react_1 = require("lucide-react");
var link_1 = require("next/link");
var alert_dialog_1 = require("@/components/ui/alert-dialog");
var actions_1 = require("../actions");
;
var EditableScoreTable = function (_a) {
    var title = _a.title, data = _a.data, onScoreChange = _a.onScoreChange;
    return (React.createElement(card_1.Card, null,
        React.createElement(card_1.CardHeader, null,
            React.createElement(card_1.CardTitle, { className: "text-lg flex items-center gap-2" },
                React.createElement(lucide_react_1.SlidersHorizontal, { className: "text-primary size-5" }),
                title)),
        React.createElement(card_1.CardContent, null,
            React.createElement(table_1.Table, null,
                React.createElement(table_1.TableHeader, null,
                    React.createElement(table_1.TableRow, null,
                        React.createElement(table_1.TableHead, null, "Category"),
                        React.createElement(table_1.TableHead, { className: "w-[120px] text-right" }, "Score (0-10)"))),
                React.createElement(table_1.TableBody, null, data.map(function (row) { return (React.createElement(table_1.TableRow, { key: row.id },
                    React.createElement(table_1.TableCell, { className: "font-medium" }, row.category),
                    React.createElement(table_1.TableCell, { className: "text-right" },
                        React.createElement(input_1.Input, { type: "number", value: row.score, onChange: function (e) { return onScoreChange(row.id, parseFloat(e.target.value)); }, min: "0", max: "10", step: "0.1", className: "h-8 text-right" })))); }))))));
};
var SummaryCard = function (_a) {
    var scores = _a.scores;
    var sum = scores.reduce(function (a, b) { return a + b; }, 0);
    var average = scores.length > 0 ? sum / scores.length : 0;
    var stdDev = scores.length > 0 ? Math.sqrt(scores.map(function (x) { return Math.pow(x - average, 2); }).reduce(function (a, b) { return a + b; }) / scores.length) : 0;
    return (React.createElement(card_1.Card, { className: "sticky top-4" },
        React.createElement(card_1.CardHeader, null,
            React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                React.createElement(lucide_react_1.Calculator, null),
                " What-If Summary"),
            React.createElement(card_1.CardDescription, null, "Scores update in real-time as you edit.")),
        React.createElement(card_1.CardContent, { className: "space-y-4" },
            React.createElement("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50" },
                React.createElement("p", { className: "font-medium" }, "Composite Score"),
                React.createElement("p", { className: "text-2xl font-bold text-primary" },
                    average.toFixed(2),
                    "/10")),
            React.createElement("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50" },
                React.createElement("p", { className: "font-medium" }, "Average Score"),
                React.createElement("p", { className: "text-xl font-bold" }, average.toFixed(2))),
            React.createElement("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50" },
                React.createElement("p", { className: "font-medium" }, "Standard Deviation"),
                React.createElement("p", { className: "text-xl font-bold" }, stdDev.toFixed(2))),
            React.createElement("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50" },
                React.createElement("p", { className: "font-medium" }, "Total Modules"),
                React.createElement("p", { className: "text-xl font-bold" }, Math.ceil(scores.length / 3))))));
};
function WhatIfAnalysisPage() {
    var _this = this;
    var _a = react_1.useState(null), analysisData = _a[0], setAnalysisData = _a[1];
    var _b = react_1.useState({}), editableScores = _b[0], setEditableScores = _b[1];
    var _c = react_1.useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = react_1.useState(false), showWelcome = _d[0], setShowWelcome = _d[1];
    var router = navigation_1.useRouter();
    var toast = use_toast_1.useToast().toast;
    react_1.useEffect(function () {
        var loadAnalysisData = function () { return __awaiter(_this, void 0, void 0, function () {
            var storedData, data, companySessionData, userData, error_1, initialScores, riskScore, avgTcaScore, riskScore, baseScore, benchmarkEntries, error_2;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        _l.trys.push([0, 5, 6, 7]);
                        setIsLoading(true);
                        storedData = localStorage.getItem('analysisResult');
                        data = null;
                        if (storedData) {
                            try {
                                data = JSON.parse(storedData);
                                console.log('Found stored analysis data:', data);
                            }
                            catch (e) {
                                console.warn('Failed to parse stored analysis data:', e);
                            }
                        }
                        if (!(!data || !((_a = data.tcaData) === null || _a === void 0 ? void 0 : _a.categories) || data.tcaData.categories.length === 0)) return [3 /*break*/, 4];
                        console.log('No valid TCA data found, fetching fresh analysis...');
                        _l.label = 1;
                    case 1:
                        _l.trys.push([1, 3, , 4]);
                        companySessionData = sessionStorage.getItem('companyData');
                        userData = companySessionData ? JSON.parse(companySessionData) : {
                            companyName: 'TechCorp Solutions',
                            companyDescription: 'SaaS technology startup with proven revenue model',
                            sector: 'technology',
                            team_size: 12,
                            monthly_revenue: 85000,
                            monthly_burn: 65000,
                            cash_balance: 800000,
                            market_size: 5000000000,
                            founder_experience: true,
                            technical_team: true,
                            customer_validation: true,
                            revenue_traction: true,
                            patents: false,
                            technical_innovation: true
                        };
                        console.log('Fetching fresh analysis with data:', userData);
                        return [4 /*yield*/, actions_1.runAnalysis('general', userData)];
                    case 2:
                        data = _l.sent();
                        // Store the fresh data
                        localStorage.setItem('analysisResult', JSON.stringify(data));
                        console.log('Fresh analysis data fetched and stored:', data);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _l.sent();
                        console.error('Failed to fetch fresh analysis:', error_1);
                        toast({
                            title: 'Analysis Required',
                            description: 'Unable to load analysis data. Please run a new analysis first.',
                            variant: 'destructive'
                        });
                        router.push('/analysis');
                        return [2 /*return*/];
                    case 4:
                        if (data) {
                            setAnalysisData(data);
                            initialScores = {};
                            // Module 1: TCA Scorecard - Use REAL data from analysis
                            if (((_b = data.tcaData) === null || _b === void 0 ? void 0 : _b.categories) && data.tcaData.categories.length > 0) {
                                initialScores['tca'] = data.tcaData.categories.map(function (c) { return ({
                                    id: c.category,
                                    category: c.category,
                                    score: c.rawScore || c.score || 5.0
                                }); });
                                console.log("Loaded " + initialScores.tca.length + " TCA categories with real scores");
                            }
                            else {
                                console.error('No TCA categories found in analysis data');
                                toast({
                                    title: 'Invalid Analysis Data',
                                    description: 'TCA scorecard data is missing. Please run a new analysis.',
                                    variant: 'destructive'
                                });
                                router.push('/analysis');
                                return [2 /*return*/];
                            }
                            // Module 2: Risk Assessment - Use REAL risk data
                            if (((_c = data.riskData) === null || _c === void 0 ? void 0 : _c.riskFlags) && data.riskData.riskFlags.length > 0) {
                                initialScores['risk'] = data.riskData.riskFlags.map(function (r, index) { return ({
                                    id: r.domain || r.category || "risk_" + index,
                                    category: r.domain || r.category || "Risk " + (index + 1),
                                    score: r.flag === 'green' ? 8 : r.flag === 'yellow' ? 6 : 4
                                }); });
                                console.log("Loaded " + initialScores.risk.length + " risk factors");
                            }
                            else if ((_d = data.riskData) === null || _d === void 0 ? void 0 : _d.riskLevel) {
                                riskScore = data.riskData.riskLevel === 'LOW' ? 8 :
                                    data.riskData.riskLevel === 'MEDIUM' ? 6 : 4;
                                initialScores['risk'] = [
                                    { id: 'overall-risk', category: 'Overall Risk Assessment', score: riskScore }
                                ];
                            }
                            else {
                                avgTcaScore = initialScores.tca.reduce(function (sum, cat) { return sum + cat.score; }, 0) / initialScores.tca.length;
                                riskScore = avgTcaScore >= 8 ? 8 : avgTcaScore >= 6.5 ? 6 : 4;
                                initialScores['risk'] = [
                                    { id: 'calculated-risk', category: 'Calculated Risk Level', score: riskScore }
                                ];
                            }
                            // Module 3: Macro Trend Analysis - Calculate from TCA base
                            if ((_e = data.macroData) === null || _e === void 0 ? void 0 : _e.pestelDashboard) {
                                initialScores['macro'] = Object.entries(data.macroData.pestelDashboard).map(function (_a) {
                                    var k = _a[0], v = _a[1];
                                    return ({
                                        id: k,
                                        category: k.charAt(0).toUpperCase() + k.slice(1),
                                        score: typeof v === 'number' ? v : 7.0
                                    });
                                });
                            }
                            else {
                                baseScore = Math.min((((_f = data.tcaData) === null || _f === void 0 ? void 0 : _f.compositeScore) || 50) / 10, 10);
                                initialScores['macro'] = [
                                    { id: 'political', category: 'Political', score: Math.max(0, baseScore * 0.9) },
                                    { id: 'economic', category: 'Economic', score: Math.max(0, baseScore * 0.85) },
                                    { id: 'social', category: 'Social', score: Math.max(0, baseScore * 1.1) },
                                    { id: 'technological', category: 'Technological', score: Math.max(0, baseScore * 1.15) },
                                    { id: 'environmental', category: 'Environmental', score: Math.max(0, baseScore) },
                                    { id: 'legal', category: 'Legal', score: Math.max(0, baseScore * 0.95) }
                                ];
                            }
                            // Additional modules based on available analysis data
                            if (data.benchmarkData && Object.keys(data.benchmarkData).length > 0) {
                                benchmarkEntries = Object.entries(data.benchmarkData);
                                if (benchmarkEntries.length > 0) {
                                    initialScores['benchmark'] = benchmarkEntries.map(function (_a) {
                                        var k = _a[0], v = _a[1];
                                        return ({
                                            id: k,
                                            category: k.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }),
                                            score: typeof v === 'number' ? Math.min(Math.max(v, 0), 10) : 7.0
                                        });
                                    });
                                }
                            }
                            if ((_g = data.growthData) === null || _g === void 0 ? void 0 : _g.growthTier) {
                                initialScores['growth'] = [
                                    { id: 'growth-tier', category: 'Growth Classification', score: data.growthData.growthTier }
                                ];
                            }
                            if ((_h = data.gapData) === null || _h === void 0 ? void 0 : _h.heatmap) {
                                initialScores['gap'] = data.gapData.heatmap.map(function (g) { return ({
                                    id: g.category,
                                    category: g.category,
                                    score: Math.max(0, 10 - (g.gap / 5))
                                }); });
                            }
                            if ((_j = data.founderFitData) === null || _j === void 0 ? void 0 : _j.readinessScore) {
                                initialScores['founderFit'] = [
                                    { id: 'funding-readiness', category: 'Funding Readiness', score: data.founderFitData.readinessScore / 10 }
                                ];
                            }
                            if ((_k = data.teamData) === null || _k === void 0 ? void 0 : _k.teamScore) {
                                initialScores['team'] = [
                                    { id: 'team-effectiveness', category: 'Team Assessment', score: data.teamData.teamScore }
                                ];
                            }
                            // Set the scores and show the analysis
                            setEditableScores(initialScores);
                            setShowWelcome(false);
                            console.log('Analysis data loaded successfully with', Object.keys(initialScores).length, 'modules');
                        }
                        else {
                            console.error('No analysis data available');
                            toast({
                                title: 'No Analysis Data',
                                description: 'Please run an analysis first to use What-If scenarios.',
                                variant: 'destructive'
                            });
                            router.push('/analysis');
                        }
                        return [3 /*break*/, 7];
                    case 5:
                        error_2 = _l.sent();
                        console.error('Error loading analysis data:', error_2);
                        toast({
                            title: 'Data Loading Error',
                            description: 'Failed to load analysis data. Please try running a new analysis.',
                            variant: 'destructive'
                        });
                        router.push('/analysis');
                        return [3 /*break*/, 7];
                    case 6:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        loadAnalysisData();
    }, [router, toast]);
    var handleScoreChange = function (moduleId, rowId, newScore) {
        setEditableScores(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[moduleId] = prev[moduleId].map(function (row) { return row.id === rowId ? __assign(__assign({}, row), { score: newScore }) : row; }), _a)));
        });
    };
    var handleProceed = function () { return __awaiter(_this, void 0, void 0, function () {
        var updatedData, newCompositeScore, pestelUpdates_1, allModuleScores, overallScore, finalData;
        return __generator(this, function (_a) {
            if (!analysisData)
                return [2 /*return*/];
            setIsLoading(true);
            try {
                updatedData = __assign({}, analysisData);
                // Update TCA scores
                if (updatedData.tcaData && editableScores.tca) {
                    updatedData.tcaData.categories = updatedData.tcaData.categories.map(function (cat) {
                        var _a;
                        var newScore = (_a = editableScores.tca.find(function (s) { return s.id === cat.category; })) === null || _a === void 0 ? void 0 : _a.score;
                        return newScore !== undefined ? __assign(__assign({}, cat), { rawScore: newScore, weightedScore: newScore * (cat.weight / 100) }) : cat;
                    });
                    newCompositeScore = updatedData.tcaData.categories.reduce(function (sum, c) { return sum + (c.rawScore * (c.weight / 100)); }, 0) * 10;
                    updatedData.tcaData.compositeScore = newCompositeScore;
                }
                // Update Risk scores
                if (updatedData.riskData && editableScores.risk) {
                    updatedData.riskData.riskFlags = updatedData.riskData.riskFlags.map(function (flag) {
                        var _a;
                        var newScore = (_a = editableScores.risk.find(function (s) { return s.id === flag.domain; })) === null || _a === void 0 ? void 0 : _a.score;
                        if (newScore !== undefined) {
                            return __assign(__assign({}, flag), { flag: (newScore >= 7 ? 'green' : newScore >= 5 ? 'yellow' : 'red') });
                        }
                        return flag;
                    });
                }
                // Update Macro scores
                if (updatedData.macroData && editableScores.macro) {
                    pestelUpdates_1 = {};
                    editableScores.macro.forEach(function (item) {
                        pestelUpdates_1[item.id] = item.score;
                    });
                    updatedData.macroData.pestelDashboard = __assign(__assign({}, updatedData.macroData.pestelDashboard), pestelUpdates_1);
                }
                // Update Benchmark scores
                if (updatedData.benchmarkData && editableScores.benchmark) {
                    updatedData.benchmarkData.benchmarkOverlay = updatedData.benchmarkData.benchmarkOverlay.map(function (item) {
                        var _a;
                        var newScore = (_a = editableScores.benchmark.find(function (s) { return s.id === item.category; })) === null || _a === void 0 ? void 0 : _a.score;
                        return newScore !== undefined ? __assign(__assign({}, item), { score: newScore * 10 }) : item;
                    });
                }
                allModuleScores = Object.values(editableScores).flat().map(function (s) { return s.score; });
                overallScore = allModuleScores.length > 0 ? allModuleScores.reduce(function (a, b) { return a + b; }, 0) / allModuleScores.length : 0;
                finalData = __assign(__assign({}, updatedData), { whatIfAnalysis: {
                        adjustedScores: editableScores,
                        overallCompositeScore: overallScore,
                        timestamp: new Date().toISOString(),
                        modulesAnalyzed: Object.keys(editableScores).length,
                        locked: true
                    } });
                // Save to localStorage
                localStorage.setItem('analysisResult', JSON.stringify(finalData));
                localStorage.setItem('whatIfAdjusted', 'true');
                localStorage.setItem('triageReportReady', 'true');
                toast({
                    title: '✅ Scores Locked Successfully',
                    description: "All " + Object.keys(editableScores).length + " modules adjusted. Composite: " + overallScore.toFixed(2) + "/10. Generating triage report..."
                });
                // Redirect to result page to show the triage report
                setTimeout(function () {
                    router.push('/analysis/result');
                }, 1500);
            }
            catch (error) {
                console.error('Error saving what-if analysis:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to save analysis. Please try again.'
                });
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    var allScores = Object.values(editableScores).flat().map(function (s) { return s.score; });
    var moduleCount = Object.keys(editableScores).length;
    if (isLoading) {
        return React.createElement(loading_1["default"], null);
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "container mx-auto p-4 md:p-8" },
            React.createElement("header", { className: "mb-8" },
                React.createElement(link_1["default"], { href: "/dashboard/evaluation", className: "flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4" },
                    React.createElement(lucide_react_1.ArrowLeft, { className: "size-4" }),
                    "Back to Analysis Setup"),
                React.createElement("div", { className: "flex justify-between items-center" },
                    React.createElement("div", null,
                        React.createElement("h1", { className: "text-4xl font-bold font-headline text-primary tracking-tight" }, "What-If Analysis"),
                        React.createElement("p", { className: "mt-2 text-lg text-muted-foreground max-w-3xl" },
                            "Adjust scores from ",
                            moduleCount,
                            " active modules to simulate outcomes before generating your triage report.")),
                    React.createElement(button_1.Button, { size: "lg", onClick: handleProceed, disabled: isLoading },
                        React.createElement(lucide_react_1.Lock, { className: "mr-2" }),
                        " Lock Scores & Generate Triage Report"))),
            React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8" },
                React.createElement("div", { className: "lg:col-span-2 space-y-8" },
                    editableScores.tca && React.createElement(EditableScoreTable, { title: "Module 1: TCA Scorecard", data: editableScores.tca, onScoreChange: function (id, score) { return handleScoreChange('tca', id, score); } }),
                    editableScores.risk && React.createElement(EditableScoreTable, { title: "Module 2: Risk Assessment", data: editableScores.risk, onScoreChange: function (id, score) { return handleScoreChange('risk', id, score); } }),
                    editableScores.macro && React.createElement(EditableScoreTable, { title: "Module 3: Macro Trend Analysis", data: editableScores.macro, onScoreChange: function (id, score) { return handleScoreChange('macro', id, score); } }),
                    editableScores.benchmark && React.createElement(EditableScoreTable, { title: "Module 4: Benchmark Comparison", data: editableScores.benchmark, onScoreChange: function (id, score) { return handleScoreChange('benchmark', id, score); } }),
                    editableScores.growth && React.createElement(EditableScoreTable, { title: "Module 5: Growth Classification", data: editableScores.growth, onScoreChange: function (id, score) { return handleScoreChange('growth', id, score); } }),
                    editableScores.gap && React.createElement(EditableScoreTable, { title: "Module 6: Gap Analysis", data: editableScores.gap, onScoreChange: function (id, score) { return handleScoreChange('gap', id, score); } }),
                    editableScores.founderFit && React.createElement(EditableScoreTable, { title: "Module 7: Founder Fit Analysis", data: editableScores.founderFit, onScoreChange: function (id, score) { return handleScoreChange('founderFit', id, score); } }),
                    editableScores.team && React.createElement(EditableScoreTable, { title: "Module 8: Team Assessment", data: editableScores.team, onScoreChange: function (id, score) { return handleScoreChange('team', id, score); } }),
                    editableScores.strategicFit && React.createElement(EditableScoreTable, { title: "Module 9: Strategic Fit Matrix", data: editableScores.strategicFit, onScoreChange: function (id, score) { return handleScoreChange('strategicFit', id, score); } })),
                React.createElement("div", null,
                    React.createElement(SummaryCard, { scores: allScores })))),
        React.createElement(alert_dialog_1.AlertDialog, { open: showWelcome, onOpenChange: setShowWelcome },
            React.createElement(alert_dialog_1.AlertDialogContent, null,
                React.createElement(alert_dialog_1.AlertDialogHeader, null,
                    React.createElement(alert_dialog_1.AlertDialogTitle, { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Eye, null),
                        " Welcome to What-If Analysis"),
                    React.createElement(alert_dialog_1.AlertDialogDescription, null,
                        "This page displays all ",
                        moduleCount,
                        " analysis modules that were run. You can manually adjust any scores to simulate different scenarios. When ready, click \"Lock Scores & Generate Triage Report\" to finalize your analysis and view the comprehensive triage report.")),
                React.createElement(alert_dialog_1.AlertDialogFooter, null,
                    React.createElement(alert_dialog_1.AlertDialogAction, { onClick: function () { return setShowWelcome(false); } },
                        React.createElement(lucide_react_1.Check, { className: "mr-2" }),
                        " Got it, let's start!"))))));
}
exports["default"] = WhatIfAnalysisPage;
