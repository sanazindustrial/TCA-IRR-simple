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
                React.createElement("p", { className: "text-2xl font-bold text-primary" }, average.toFixed(2))),
            React.createElement("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50" },
                React.createElement("p", { className: "font-medium" }, "Average Score"),
                React.createElement("p", { className: "text-xl font-bold" }, average.toFixed(2))),
            React.createElement("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/50" },
                React.createElement("p", { className: "font-medium" }, "Standard Deviation"),
                React.createElement("p", { className: "text-xl font-bold" }, stdDev.toFixed(2))))));
};
function WhatIfAnalysisPage() {
    var _a = react_1.useState(null), analysisData = _a[0], setAnalysisData = _a[1];
    var _b = react_1.useState({}), editableScores = _b[0], setEditableScores = _b[1];
    var _c = react_1.useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = react_1.useState(false), showWelcome = _d[0], setShowWelcome = _d[1];
    var router = navigation_1.useRouter();
    var toast = use_toast_1.useToast().toast;
    react_1.useEffect(function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var storedData = localStorage.getItem('analysisResult');
        if (storedData) {
            var data = JSON.parse(storedData);
            setAnalysisData(data);
            var initialScores = {};
            if ((_a = data.tcaData) === null || _a === void 0 ? void 0 : _a.categories) {
                initialScores['tca'] = data.tcaData.categories.map(function (c) { return ({ id: c.category, category: c.category, score: c.rawScore }); });
            }
            if ((_b = data.riskData) === null || _b === void 0 ? void 0 : _b.riskFlags) {
                initialScores['risk'] = data.riskData.riskFlags.map(function (r) { return ({ id: r.domain, category: r.domain, score: r.flag === 'green' ? 8 : r.flag === 'yellow' ? 6 : 4 }); });
            }
            if ((_c = data.macroData) === null || _c === void 0 ? void 0 : _c.pestelDashboard) {
                initialScores['macro'] = Object.entries(data.macroData.pestelDashboard).map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return ({ id: k, category: k, score: v });
                });
            }
            if ((_d = data.benchmarkData) === null || _d === void 0 ? void 0 : _d.benchmarkOverlay) {
                initialScores['benchmark'] = data.benchmarkData.benchmarkOverlay.map(function (b) { return ({ id: b.category, category: b.category, score: b.score }); });
            }
            if (data.growthData && Object.keys(data.growthData).length > 0) {
                initialScores['growth'] = [{ id: 'growth-tier', category: 'Growth Tier', score: 8 }];
            }
            if ((_e = data.gapData) === null || _e === void 0 ? void 0 : _e.heatmap) {
                initialScores['gap'] = data.gapData.heatmap.map(function (g) { return ({ id: g.category, category: g.category, score: 10 - (g.gap / 5) }); });
            }
            if ((_f = data.founderFitData) === null || _f === void 0 ? void 0 : _f.readinessScore) {
                initialScores['founderFit'] = [{ id: 'readiness', category: 'Funding Readiness', score: data.founderFitData.readinessScore / 10 }];
            }
            if ((_g = data.teamData) === null || _g === void 0 ? void 0 : _g.members) {
                initialScores['team'] = data.teamData.members.map(function (m) { return ({ id: m.id, category: m.name, score: 8.5 }); });
            }
            if ((_h = data.strategicFitData) === null || _h === void 0 ? void 0 : _h.data) {
                initialScores['strategicFit'] = data.strategicFitData.data.map(function (s) { return ({ id: s.pathway, category: s.pathway, score: s.signal === 'green' ? 8 : s.signal === 'yellow' ? 6 : 4 }); });
            }
            setEditableScores(initialScores);
            setShowWelcome(true);
        }
        else {
            toast({
                variant: 'destructive',
                title: 'No analysis data found',
                description: 'Please run an analysis first.'
            });
            router.push('/dashboard/evaluation');
        }
        setIsLoading(false);
    }, [router, toast]);
    var handleScoreChange = function (moduleId, rowId, newScore) {
        setEditableScores(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[moduleId] = prev[moduleId].map(function (row) { return row.id === rowId ? __assign(__assign({}, row), { score: newScore }) : row; }), _a)));
        });
    };
    var handleProceed = function () {
        // Here, you would update the main analysisData object with the new scores.
        // This is a simplified example of that logic.
        if (analysisData) {
            var updatedData = __assign({}, analysisData);
            if (updatedData.tcaData) {
                updatedData.tcaData.categories.forEach(function (cat) {
                    var _a;
                    var newScore = (_a = editableScores.tca.find(function (s) { return s.id === cat.category; })) === null || _a === void 0 ? void 0 : _a.score;
                    if (newScore !== undefined)
                        cat.rawScore = newScore;
                });
                var newScores = updatedData.tcaData.categories.map(function (c) { return c.rawScore * (c.weight / 100); });
                var newCompositeScore = newScores.reduce(function (a, b) { return a + b; }, 0);
                updatedData.tcaData.compositeScore = newCompositeScore;
            }
            localStorage.setItem('analysisResult', JSON.stringify(updatedData));
            toast({
                title: 'Scores Locked',
                description: 'Your changes have been saved. Redirecting to reports dashboard.'
            });
            router.push('/dashboard/reports');
        }
    };
    var allScores = Object.values(editableScores).flat().map(function (s) { return s.score; });
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
                        React.createElement("p", { className: "mt-2 text-lg text-muted-foreground max-w-3xl" }, "Adjust scores from active modules to simulate outcomes before finalizing your report.")),
                    React.createElement(button_1.Button, { size: "lg", onClick: handleProceed },
                        React.createElement(lucide_react_1.Lock, { className: "mr-2" }),
                        " Lock Score & Proceed to Reports"))),
            React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8" },
                React.createElement("div", { className: "lg:col-span-2 space-y-8" },
                    editableScores.tca && React.createElement(EditableScoreTable, { title: "TCA Scorecard", data: editableScores.tca, onScoreChange: function (id, score) { return handleScoreChange('tca', id, score); } }),
                    editableScores.risk && React.createElement(EditableScoreTable, { title: "Risk Flags", data: editableScores.risk, onScoreChange: function (id, score) { return handleScoreChange('risk', id, score); } }),
                    editableScores.macro && React.createElement(EditableScoreTable, { title: "Macro Trend Alignment", data: editableScores.macro, onScoreChange: function (id, score) { return handleScoreChange('macro', id, score); } }),
                    editableScores.benchmark && React.createElement(EditableScoreTable, { title: "Benchmark Comparison", data: editableScores.benchmark, onScoreChange: function (id, score) { return handleScoreChange('benchmark', id, score); } }),
                    editableScores.growth && React.createElement(EditableScoreTable, { title: "Growth Classifier", data: editableScores.growth, onScoreChange: function (id, score) { return handleScoreChange('growth', id, score); } }),
                    editableScores.gap && React.createElement(EditableScoreTable, { title: "Gap Analysis", data: editableScores.gap, onScoreChange: function (id, score) { return handleScoreChange('gap', id, score); } }),
                    editableScores.founderFit && React.createElement(EditableScoreTable, { title: "Founder Fit Analysis", data: editableScores.founderFit, onScoreChange: function (id, score) { return handleScoreChange('founderFit', id, score); } }),
                    editableScores.team && React.createElement(EditableScoreTable, { title: "Team Assessment", data: editableScores.team, onScoreChange: function (id, score) { return handleScoreChange('team', id, score); } }),
                    editableScores.strategicFit && React.createElement(EditableScoreTable, { title: "Strategic Fit Matrix", data: editableScores.strategicFit, onScoreChange: function (id, score) { return handleScoreChange('strategicFit', id, score); } })),
                React.createElement("div", null,
                    React.createElement(SummaryCard, { scores: allScores })))),
        React.createElement(alert_dialog_1.AlertDialog, { open: showWelcome, onOpenChange: setShowWelcome },
            React.createElement(alert_dialog_1.AlertDialogContent, null,
                React.createElement(alert_dialog_1.AlertDialogHeader, null,
                    React.createElement(alert_dialog_1.AlertDialogTitle, { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Eye, null),
                        " Welcome to What-If Analysis"),
                    React.createElement(alert_dialog_1.AlertDialogDescription, null, "This page allows you to experiment with the analysis results. You can manually override the AI-generated scores for any category to see how it impacts the overall evaluation. Your changes here will be reflected in the final report.")),
                React.createElement(alert_dialog_1.AlertDialogFooter, null,
                    React.createElement(alert_dialog_1.AlertDialogAction, { onClick: function () { return setShowWelcome(false); } },
                        React.createElement(lucide_react_1.Check, { className: "mr-2" }),
                        " Got it, let's start!"))))));
}
exports["default"] = WhatIfAnalysisPage;
