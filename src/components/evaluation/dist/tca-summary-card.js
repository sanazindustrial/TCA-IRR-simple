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
exports.TcaSummaryCard = void 0;
var react_1 = require("react");
var dashboard_card_1 = require("@/components/shared/dashboard-card");
var utils_1 = require("@/lib/utils");
var lucide_react_1 = require("lucide-react");
var evaluation_provider_1 = require("./evaluation-provider");
var badge_1 = require("../ui/badge");
var textarea_1 = require("../ui/textarea");
var getScoreColor = function (score) {
    if (score >= 8.0)
        return 'text-success';
    if (score >= 6.5)
        return 'text-warning';
    return 'text-destructive';
};
var getTier = function (score) {
    if (score >= 8.0)
        return { tier: 'Strong & Investable', badge: 'success' };
    if (score >= 6.5)
        return { tier: 'Moderate; needs traction', badge: 'warning' };
    return { tier: 'High risk / weak readiness', badge: 'destructive' };
};
function TcaSummaryCard(_a) {
    var initialData = _a.initialData;
    var _b = evaluation_provider_1.useEvaluationContext(), isPrivilegedUser = _b.isPrivilegedUser, isEditable = _b.isEditable;
    var _c = react_1.useState(initialData), data = _c[0], setData = _c[1];
    if (!data)
        return null;
    var scoreTier = getTier(data.compositeScore);
    var scoreAvg = data.compositeScore * 0.98; // Mocked
    var stdDev = 0.25; // Mocked
    var confidenceInterval = [scoreAvg - stdDev, scoreAvg + stdDev];
    var handleSummaryChange = function (value) {
        setData(function (prev) { return (__assign(__assign({}, prev), { summary: value })); });
    };
    return (react_1["default"].createElement(dashboard_card_1.DashboardCard, { title: "TCA Summary Score Card: Triage Classification", icon: lucide_react_1.ClipboardList, description: "High-level evaluation results and statistical analysis." },
        react_1["default"].createElement("div", { className: "space-y-6" },
            react_1["default"].createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
                react_1["default"].createElement("div", { className: "score-display" },
                    react_1["default"].createElement("p", { className: "text-sm text-muted-foreground mb-2" }, "Total Score"),
                    react_1["default"].createElement("div", { className: "flex items-baseline justify-center gap-1" },
                        react_1["default"].createElement("span", { className: utils_1.cn('score-large', getScoreColor(data.compositeScore)) }, data.compositeScore.toFixed(2)),
                        react_1["default"].createElement("span", { className: "text-2xl text-muted-foreground" }, "/10")),
                    react_1["default"].createElement("p", { className: "score-subtitle" },
                        "Average (30 runs): ",
                        react_1["default"].createElement("span", { className: "font-semibold text-foreground/80" },
                            scoreAvg.toFixed(2),
                            "/10"))),
                isPrivilegedUser ? (react_1["default"].createElement("div", { className: "lg:col-span-2 p-6 bg-muted/30 rounded-lg" },
                    react_1["default"].createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6 h-full" },
                        react_1["default"].createElement("div", { className: 'text-center' },
                            react_1["default"].createElement("p", { className: "text-sm text-muted-foreground mb-3" }, "Tier Level"),
                            react_1["default"].createElement(badge_1.Badge, { variant: scoreTier.badge, className: "text-sm px-3 py-1" }, scoreTier.tier)),
                        react_1["default"].createElement("div", { className: 'text-center' },
                            react_1["default"].createElement("p", { className: "text-sm text-muted-foreground mb-3" }, "Standard Deviation"),
                            react_1["default"].createElement("p", { className: 'text-2xl font-bold text-foreground' }, stdDev.toFixed(2))),
                        react_1["default"].createElement("div", { className: 'text-center' },
                            react_1["default"].createElement("p", { className: "text-sm text-muted-foreground mb-3 flex items-center justify-center gap-1" },
                                react_1["default"].createElement(lucide_react_1.Lock, { className: 'size-3' }),
                                "Confidence Interval"),
                            react_1["default"].createElement("p", { className: 'text-lg font-bold text-foreground' },
                                "[",
                                confidenceInterval[0].toFixed(2),
                                " - ",
                                confidenceInterval[1].toFixed(2),
                                "]"))))) : (react_1["default"].createElement("div", { className: "lg:col-span-2 p-6 bg-muted/30 rounded-lg flex items-center justify-center" },
                    react_1["default"].createElement("div", { className: "text-center" },
                        react_1["default"].createElement("p", { className: "text-sm text-muted-foreground" }, "Additional statistical analysis is available for reviewers and admins."))))),
            react_1["default"].createElement("div", { className: "border-t pt-6" },
                react_1["default"].createElement("h4", { className: "font-semibold text-base mb-3" }, "AI Interpretation Summary"),
                isEditable ? (react_1["default"].createElement(textarea_1.Textarea, { value: data.summary, onChange: function (e) { return handleSummaryChange(e.target.value); }, rows: 3, className: "text-sm leading-relaxed resize-none", placeholder: "Enter AI interpretation summary..." })) : (react_1["default"].createElement("p", { className: "text-sm text-muted-foreground leading-relaxed" }, data.summary))))));
}
exports.TcaSummaryCard = TcaSummaryCard;
