'use client';
"use strict";
exports.__esModule = true;
exports.ModuleConfiguration = void 0;
var card_1 = require("@/components/ui/card");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var link_1 = require("next/link");
var button_1 = require("../ui/button");
var generalModules = [
    { id: 'tca', name: 'TCA Scorecard', description: 'Central evaluation across fundamental categories.', status: 'active' },
    { id: 'risk', name: 'Risk Flags', description: 'Risk analysis across 14 domains.', status: 'active' },
    { id: 'benchmark', name: 'Benchmark Comparison', description: 'Performance vs. sector averages.', status: 'active' },
];
var medtechModules = [
    { id: 'tca', name: 'TCA Scorecard (MedTech)', description: 'MedTech-focused category evaluation.', status: 'active' },
    { id: 'risk', name: 'Risk Flags (Regulatory Focus)', description: 'Regulatory and compliance risk.', status: 'active' },
    { id: 'benchmark', name: 'Clinical Trial Benchmark', description: 'Compare against clinical trial data.', status: 'active' },
];
function ModuleConfiguration(_a) {
    var framework = _a.framework;
    var _b = react_1.useState(generalModules), modules = _b[0], setModules = _b[1];
    react_1.useEffect(function () {
        var newModules = framework === 'medtech' ? medtechModules : generalModules;
        setModules(newModules);
    }, [framework]);
    return (react_1["default"].createElement(card_1.Card, { className: "shadow-lg" },
        react_1["default"].createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between" },
            react_1["default"].createElement("div", null,
                react_1["default"].createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    react_1["default"].createElement(lucide_react_1.Settings, { className: "text-primary" }),
                    "Module Configuration"),
                react_1["default"].createElement(card_1.CardDescription, { className: "mt-2" }, "Configure the analysis modules for the selected framework. The following are quick links to the most common modules.")),
            react_1["default"].createElement(button_1.Button, { asChild: true, variant: "outline" },
                react_1["default"].createElement(link_1["default"], { href: "/dashboard/evaluation/modules" },
                    react_1["default"].createElement(lucide_react_1.SlidersHorizontal, { className: "mr-2" }),
                    "Module Control Deck"))),
        react_1["default"].createElement(card_1.CardContent, null,
            react_1["default"].createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" }, modules.map(function (mod) { return (react_1["default"].createElement(link_1["default"], { href: "/analysis/modules/" + mod.id, key: mod.id, className: "block rounded-lg border p-4 transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring" },
                react_1["default"].createElement("div", { className: "flex justify-between items-start" },
                    react_1["default"].createElement("div", { className: 'flex-1' },
                        react_1["default"].createElement("h3", { className: "font-semibold text-sm" }, mod.name),
                        react_1["default"].createElement("p", { className: "text-xs text-muted-foreground mt-1" }, mod.description)),
                    react_1["default"].createElement(lucide_react_1.ChevronRight, { className: "size-5 text-muted-foreground shrink-0 ml-2" })))); })))));
}
exports.ModuleConfiguration = ModuleConfiguration;
