'use client';
"use strict";
exports.__esModule = true;
exports.TcaInterpretationSummary = void 0;
var card_1 = require("@/components/ui/card");
var badge_1 = require("@/components/ui/badge");
var progress_1 = require("@/components/ui/progress");
var lucide_react_1 = require("lucide-react");
var evaluation_provider_1 = require("./evaluation-provider");
var dashboard_card_1 = require("../shared/dashboard-card");
var utils_1 = require("@/lib/utils");
// Sample comprehensive TCA interpretation data
var sampleTcaInterpretation = {
    executiveNarrative: "This technology commercialization analysis reveals a company with strong foundational elements positioned for strategic growth. The composite score of 7.2/10 indicates solid commercial viability with identified areas for accelerated development.",
    triageOutcome: {
        decision: 'PROCEED_WITH_CONDITIONS',
        confidence: 82,
        reasoning: 'Strong market opportunity and technical foundation offset by execution risk and regulatory complexity.',
        nextSteps: [
            'Address regulatory compliance gaps within 90 days',
            'Strengthen go-to-market execution team',
            'Establish strategic partnerships for market entry',
            'Complete IP portfolio assessment'
        ]
    },
    highlights: {
        strengths: [
            'Exceptional product-market fit (9.0/10) with validated customer demand',
            'Strong technical moat with defensible IP position',
            'Experienced leadership team with relevant industry expertise',
            'Solid financial runway and burn rate management'
        ],
        concerns: [
            'Go-to-market execution risk (6.5/10) requires immediate attention',
            'Regulatory pathway complexity may delay commercialization',
            'Limited operational scalability in current structure',
            'Competitive landscape intensifying with well-funded rivals'
        ]
    },
    riskOpportunityBalance: {
        riskScore: 6.2,
        opportunityScore: 8.1,
        balance: 'OPPORTUNITY_FAVORED',
        keyRisks: [
            'Market timing risk due to regulatory delays',
            'Execution risk in scaling operations',
            'Technology risk in next-generation platform'
        ],
        keyOpportunities: [
            'First-mover advantage in emerging market segment',
            'Strategic acquisition potential from incumbents',
            'Platform expansion into adjacent markets'
        ]
    },
    sectorAdjustments: {
        framework: 'medtech',
        adjustmentFactors: [
            { category: 'Regulatory/Compliance', originalWeight: 10, adjustedWeight: 15, rationale: 'Critical for medtech success' },
            { category: 'Product-Market Fit', originalWeight: 10, adjustedWeight: 15, rationale: 'Clinical validation essential' },
            { category: 'Technology & IP', originalWeight: 5, adjustedWeight: 10, rationale: 'Patent protection crucial' }
        ],
        sectorSpecificInsights: [
            'FDA approval pathway clearly defined with 18-24 month timeline',
            'Reimbursement strategy validated with key payers',
            'Clinical evidence package exceeds regulatory requirements'
        ]
    },
    categoryBreakdown: [
        { category: 'Leadership', score: 8.5, weight: 15, contribution: 19.1, trend: 'stable', flag: 'green' },
        { category: 'Regulatory/Compliance', score: 7.0, weight: 15, contribution: 15.7, trend: 'improving', flag: 'yellow' },
        { category: 'Product-Market Fit', score: 9.0, weight: 15, contribution: 20.2, trend: 'improving', flag: 'green' },
        { category: 'Team Strength', score: 7.5, weight: 10, contribution: 11.2, trend: 'stable', flag: 'yellow' },
        { category: 'Technology & IP', score: 8.0, weight: 10, contribution: 12.0, trend: 'improving', flag: 'green' },
        { category: 'Business Model & Financials', score: 7.0, weight: 10, contribution: 10.5, trend: 'stable', flag: 'yellow' },
        { category: 'Go-to-Market Strategy', score: 6.5, weight: 5, contribution: 4.9, trend: 'declining', flag: 'red' },
        { category: 'Competition & Moat', score: 7.8, weight: 5, contribution: 5.8, trend: 'improving', flag: 'yellow' },
        { category: 'Market Potential', score: 8.8, weight: 5, contribution: 6.6, trend: 'improving', flag: 'green' },
        { category: 'Traction', score: 7.2, weight: 5, contribution: 5.4, trend: 'stable', flag: 'yellow' },
        { category: 'Scalability', score: 6.8, weight: 2.5, contribution: 2.5, trend: 'stable', flag: 'yellow' },
        { category: 'Risk Assessment', score: 7.5, weight: 2.5, contribution: 2.8, trend: 'improving', flag: 'yellow' }
    ],
    compositeScoreAnalysis: {
        currentScore: 7.2,
        benchmarkScore: 6.5,
        industryPercentile: 78,
        scoreDistribution: {
            excellent: 25,
            strong: 33,
            adequate: 25,
            weak: 17 // < 5.5
        }
    },
    actionPriorities: [
        {
            priority: 1,
            category: 'Go-to-Market Strategy',
            action: 'Hire VP of Sales with medtech experience',
            impact: 'High',
            timeline: '60 days',
            investment: 'Medium'
        },
        {
            priority: 2,
            category: 'Regulatory/Compliance',
            action: 'Complete FDA pre-submission meeting',
            impact: 'High',
            timeline: '90 days',
            investment: 'Low'
        },
        {
            priority: 3,
            category: 'Scalability',
            action: 'Establish manufacturing partnerships',
            impact: 'Medium',
            timeline: '120 days',
            investment: 'High'
        }
    ]
};
var getDecisionBadge = function (decision) {
    switch (decision) {
        case 'PROCEED':
            return React.createElement(badge_1.Badge, { className: "bg-green-100 text-green-800 border-green-300" }, "Proceed");
        case 'PROCEED_WITH_CONDITIONS':
            return React.createElement(badge_1.Badge, { className: "bg-yellow-100 text-yellow-800 border-yellow-300" }, "Proceed with Conditions");
        case 'HOLD':
            return React.createElement(badge_1.Badge, { className: "bg-orange-100 text-orange-800 border-orange-300" }, "Hold");
        case 'PASS':
            return React.createElement(badge_1.Badge, { className: "bg-red-100 text-red-800 border-red-300" }, "Pass");
        default:
            return React.createElement(badge_1.Badge, { variant: "secondary" }, "Under Review");
    }
};
var getTrendIcon = function (trend) {
    switch (trend) {
        case 'improving':
            return React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4 text-green-600" });
        case 'declining':
            return React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4 text-red-600 rotate-180" });
        case 'stable':
        default:
            return React.createElement(lucide_react_1.Target, { className: "h-4 w-4 text-blue-600" });
    }
};
var getFlagColor = function (flag) {
    switch (flag) {
        case 'green':
            return 'bg-green-500';
        case 'yellow':
            return 'bg-yellow-500';
        case 'red':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};
function TcaInterpretationSummary(_a) {
    var _b = _a.data, data = _b === void 0 ? sampleTcaInterpretation : _b;
    var _c = evaluation_provider_1.useEvaluationContext(), framework = _c.framework, reportType = _c.reportType;
    // Use sample data if none provided or if data is incomplete
    var tcaData = (data && data.triageOutcome) ? data : sampleTcaInterpretation;
    return (React.createElement(dashboard_card_1.DashboardCard, { title: "TCA AI Interpretation Summary", icon: lucide_react_1.Brain, description: "GPT narrative analysis of triage outcomes, highlights, and strategic recommendations" },
        React.createElement("div", { className: "space-y-8" },
            React.createElement("div", { className: "p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500" },
                React.createElement("h3", { className: "font-semibold text-lg mb-3 flex items-center gap-2" },
                    React.createElement(lucide_react_1.Brain, { className: "h-5 w-5 text-blue-600" }),
                    "Executive AI Narrative"),
                React.createElement("p", { className: "text-gray-700 leading-relaxed" }, tcaData.executiveNarrative)),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, { className: "pb-3" },
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement(card_1.CardTitle, { className: "text-lg" }, "Triage Decision"),
                            getDecisionBadge(tcaData.triageOutcome.decision))),
                    React.createElement(card_1.CardContent, { className: "space-y-4" },
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement("span", { className: "text-sm text-muted-foreground" }, "Confidence"),
                            React.createElement("span", { className: "font-bold" },
                                tcaData.triageOutcome.confidence,
                                "%")),
                        React.createElement(progress_1.Progress, { value: tcaData.triageOutcome.confidence, className: "h-2" }),
                        React.createElement("p", { className: "text-sm text-muted-foreground mt-3" }, tcaData.triageOutcome.reasoning))),
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, { className: "pb-3" },
                        React.createElement(card_1.CardTitle, { className: "text-lg flex items-center gap-2" },
                            React.createElement(lucide_react_1.BarChart3, { className: "h-5 w-5" }),
                            "Composite Score Analysis")),
                    React.createElement(card_1.CardContent, { className: "space-y-4" },
                        React.createElement("div", { className: "text-center" },
                            React.createElement("div", { className: "text-3xl font-bold text-primary mb-1" },
                                tcaData.compositeScoreAnalysis.currentScore,
                                "/10"),
                            React.createElement("div", { className: "text-sm text-muted-foreground" },
                                tcaData.compositeScoreAnalysis.industryPercentile,
                                "th percentile")),
                        React.createElement("div", { className: "flex justify-between text-xs text-muted-foreground" },
                            React.createElement("span", null,
                                "Benchmark: ",
                                tcaData.compositeScoreAnalysis.benchmarkScore),
                            React.createElement("span", { className: "font-medium text-primary" },
                                "+",
                                (tcaData.compositeScoreAnalysis.currentScore - tcaData.compositeScoreAnalysis.benchmarkScore).toFixed(1)))))),
            React.createElement("div", { className: "p-6 border rounded-lg" },
                React.createElement("h3", { className: "font-semibold text-lg mb-4 flex items-center gap-2" },
                    React.createElement(lucide_react_1.Shield, { className: "h-5 w-5" }),
                    "Risk-Opportunity Balance"),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
                    React.createElement("div", { className: "text-center" },
                        React.createElement("div", { className: "text-2xl font-bold text-red-600 mb-1" },
                            tcaData.riskOpportunityBalance.riskScore,
                            "/10"),
                        React.createElement("div", { className: "text-sm text-muted-foreground" }, "Risk Score")),
                    React.createElement("div", { className: "text-center" },
                        React.createElement("div", { className: "text-2xl font-bold text-green-600 mb-1" },
                            tcaData.riskOpportunityBalance.opportunityScore,
                            "/10"),
                        React.createElement("div", { className: "text-sm text-muted-foreground" }, "Opportunity Score")),
                    React.createElement("div", { className: "text-center" },
                        React.createElement(badge_1.Badge, { className: utils_1.cn(tcaData.riskOpportunityBalance.balance === 'OPPORTUNITY_FAVORED' ? 'bg-green-100 text-green-800' :
                                tcaData.riskOpportunityBalance.balance === 'BALANCED' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800') }, tcaData.riskOpportunityBalance.balance.replace('_', ' '))))),
            React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, { className: "text-lg flex items-center gap-2 text-green-700" },
                            React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5" }),
                            "Key Strengths")),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("ul", { className: "space-y-3" }, tcaData.highlights.strengths.map(function (strength, index) { return (React.createElement("li", { key: index, className: "flex items-start gap-3" },
                            React.createElement(lucide_react_1.Star, { className: "h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" }),
                            React.createElement("span", { className: "text-sm" }, strength))); })))),
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, { className: "text-lg flex items-center gap-2 text-orange-700" },
                            React.createElement(lucide_react_1.AlertTriangle, { className: "h-5 w-5" }),
                            "Areas of Concern")),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("ul", { className: "space-y-3" }, tcaData.highlights.concerns.map(function (concern, index) { return (React.createElement("li", { key: index, className: "flex items-start gap-3" },
                            React.createElement(lucide_react_1.XCircle, { className: "h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" }),
                            React.createElement("span", { className: "text-sm" }, concern))); }))))),
            React.createElement("div", { className: "space-y-4" },
                React.createElement("h3", { className: "font-semibold text-lg" }, "Detailed Score Breakdown"),
                React.createElement("div", { className: "space-y-3" }, tcaData.categoryBreakdown.map(function (category, index) { return (React.createElement("div", { key: index, className: "flex items-center gap-4 p-3 border rounded-lg" },
                    React.createElement("div", { className: "w-3 h-3 rounded-full " + getFlagColor(category.flag) }),
                    React.createElement("div", { className: "flex-1 min-w-0" },
                        React.createElement("div", { className: "flex items-center justify-between mb-1" },
                            React.createElement("span", { className: "font-medium truncate" }, category.category),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                getTrendIcon(category.trend),
                                React.createElement("span", { className: "font-bold" },
                                    category.score,
                                    "/10"))),
                        React.createElement("div", { className: "flex items-center justify-between text-sm text-muted-foreground" },
                            React.createElement("span", null,
                                "Weight: ",
                                category.weight,
                                "%"),
                            React.createElement("span", null,
                                "Contribution: ",
                                category.contribution.toFixed(1),
                                "%"))))); }))),
            React.createElement("div", { className: "space-y-4" },
                React.createElement("h3", { className: "font-semibold text-lg flex items-center gap-2" },
                    React.createElement(lucide_react_1.Clock, { className: "h-5 w-5" }),
                    "Immediate Action Priorities"),
                React.createElement("div", { className: "space-y-3" }, data.actionPriorities.map(function (action, index) { return (React.createElement("div", { key: index, className: "p-4 border rounded-lg" },
                    React.createElement("div", { className: "flex items-start justify-between mb-2" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(badge_1.Badge, { variant: "outline" },
                                "Priority ",
                                action.priority),
                            React.createElement("span", { className: "font-medium" }, action.category)),
                        React.createElement(badge_1.Badge, { className: utils_1.cn(action.impact === 'High' ? 'bg-red-100 text-red-800' :
                                action.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800') },
                            action.impact,
                            " Impact")),
                    React.createElement("p", { className: "text-sm mb-2" }, action.action),
                    React.createElement("div", { className: "flex items-center gap-4 text-xs text-muted-foreground" },
                        React.createElement("span", null,
                            "Timeline: ",
                            action.timeline),
                        React.createElement("span", null,
                            "Investment: ",
                            action.investment)))); }))),
            reportType === 'triage' && (React.createElement("div", { className: "p-4 bg-primary/5 border border-primary/20 rounded-lg" },
                React.createElement("h4", { className: "font-semibold text-primary mb-3" }, "Next Steps for Due Diligence"),
                React.createElement("ul", { className: "space-y-2" }, data.triageOutcome.nextSteps.map(function (step, index) { return (React.createElement("li", { key: index, className: "flex items-start gap-2" },
                    React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 text-primary mt-0.5 flex-shrink-0" }),
                    React.createElement("span", { className: "text-sm" }, step))); })))))));
}
exports.TcaInterpretationSummary = TcaInterpretationSummary;
