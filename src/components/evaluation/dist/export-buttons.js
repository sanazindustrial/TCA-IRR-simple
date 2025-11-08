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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.ExportButtons = void 0;
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var dropdown_menu_1 = require("@/components/ui/dropdown-menu");
var use_toast_1 = require("@/hooks/use-toast");
var jszip_1 = require("jszip");
var file_saver_1 = require("file-saver");
var jspdf_autotable_1 = require("jspdf-autotable");
var docx_1 = require("docx");
var pptxgenjs_1 = require("pptxgenjs");
var evaluation_provider_1 = require("./evaluation-provider");
function ExportButtons() {
    var _this = this;
    var toast = use_toast_1.useToast().toast;
    var _a = evaluation_provider_1.useEvaluationContext(), role = _a.role, reportType = _a.reportType;
    var getAnalysisData = function () {
        try {
            var storedData = localStorage.getItem('analysisResult');
            if (!storedData) {
                toast({
                    variant: 'destructive',
                    title: 'No Data Found',
                    description: 'Please run an analysis before exporting data.'
                });
                return null;
            }
            return JSON.parse(storedData);
        }
        catch (error) {
            console.error("Failed to parse analysis data from localStorage:", error);
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: 'Could not read analysis data.'
            });
            return null;
        }
    };
    var getCompanyName = function () {
        // Try to get company name from stored data or use default
        try {
            var data = getAnalysisData();
            return (data === null || data === void 0 ? void 0 : data.companyName) || "Startup Analysis";
        }
        catch (_a) {
            return "Startup Analysis";
        }
    };
    // Two-Page Triage Report (PDF)
    var handleExportTriageTwoPage = function () {
        var _a, _b;
        var data = getAnalysisData();
        if (!data)
            return;
        var doc = new jsPDF();
        var companyName = getCompanyName();
        // PAGE 1: Executive Summary & TCA Scorecard
        doc.setFontSize(20);
        doc.text("Triage Report: " + companyName, 14, 25);
        doc.setFontSize(11);
        doc.text("Generated: " + new Date().toLocaleDateString(), 14, 35);
        doc.setLineWidth(0.5);
        doc.line(14, 40, 196, 40);
        // Executive Summary
        doc.setFontSize(14);
        doc.text('Executive Summary', 14, 55);
        doc.setFontSize(10);
        if (data.tcaData) {
            var compositeScore = data.tcaData.compositeScore.toFixed(1);
            doc.text("Overall TCA Score: " + compositeScore + "/10", 14, 65);
            doc.text("Assessment: " + (compositeScore >= 7 ? 'Strong candidate for investment' : compositeScore >= 5 ? 'Moderate potential, requires further analysis' : 'High risk investment'), 14, 75);
        }
        // TCA Scorecard Table
        if (data.tcaData) {
            jspdf_autotable_1["default"](doc, {
                startY: 85,
                head: [['Category', 'Score', 'Weight', 'Status']],
                body: data.tcaData.categories.slice(0, 8).map(function (c) { return [
                    c.category,
                    c.rawScore.toString(),
                    c.weight + "%",
                    c.flag === 'green' ? '✓ Good' : c.flag === 'yellow' ? '⚠ Caution' : '✗ Risk'
                ]; }),
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 9 }
            });
        }
        // Top 3 Risks Summary
        if (data.riskData) {
            var finalY_1 = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.text('Key Risk Areas', 14, finalY_1);
            doc.setFontSize(9);
            var highRisks = data.riskData.riskFlags.filter(function (r) { return r.flag === 'red'; }).slice(0, 3);
            highRisks.forEach(function (risk, index) {
                doc.text(index + 1 + ". " + risk.domain + ": " + risk.trigger, 14, finalY_1 + 10 + (index * 8));
            });
        }
        // PAGE 2: Detailed Analysis & Recommendations
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Detailed Analysis & Recommendations', 14, 25);
        doc.line(14, 30, 196, 30);
        // Strengths & Opportunities
        doc.setFontSize(12);
        doc.text('Key Strengths', 14, 45);
        doc.setFontSize(9);
        if (data.tcaData) {
            var strengths = data.tcaData.categories.filter(function (c) { return c.flag === 'green'; }).slice(0, 3);
            strengths.forEach(function (strength, index) {
                doc.text("\u2022 " + strength.category + ": " + (strength.strengths || 'Strong performance'), 14, 55 + (index * 8));
            });
        }
        // Investment Recommendation
        doc.setFontSize(12);
        doc.text('Investment Recommendation', 14, 90);
        doc.setFontSize(9);
        var recommendation = ((_a = data.tcaData) === null || _a === void 0 ? void 0 : _a.compositeScore) >= 7 ?
            'RECOMMEND: Proceed to due diligence phase' :
            ((_b = data.tcaData) === null || _b === void 0 ? void 0 : _b.compositeScore) >= 5 ?
                'CONDITIONAL: Address key risks before proceeding' :
                'NOT RECOMMENDED: Significant concerns identified';
        doc.text(recommendation, 14, 100);
        // Next Steps
        doc.setFontSize(12);
        doc.text('Recommended Next Steps', 14, 120);
        doc.setFontSize(9);
        var nextSteps = [
            '1. Conduct management team interviews',
            '2. Verify financial projections',
            '3. Assess market opportunity size',
            '4. Review competitive positioning'
        ];
        nextSteps.forEach(function (step, index) {
            doc.text(step, 14, 130 + (index * 8));
        });
        doc.save(companyName + "-Triage-Report-" + new Date().toISOString().split('T')[0] + ".pdf");
        toast({
            title: 'Two-Page Triage Report Exported',
            description: 'Your concise triage report has been downloaded.'
        });
    };
    // Two-Page DD Report (PDF)
    var handleExportDDTwoPage = function () {
        var _a, _b, _c, _d;
        var data = getAnalysisData();
        if (!data)
            return;
        var doc = new jsPDF();
        var companyName = getCompanyName();
        // PAGE 1: Comprehensive Analysis Summary
        doc.setFontSize(20);
        doc.text("Due Diligence Report: " + companyName, 14, 25);
        doc.setFontSize(11);
        doc.text("Generated: " + new Date().toLocaleDateString() + " | Analyst: " + role, 14, 35);
        doc.setLineWidth(0.5);
        doc.line(14, 40, 196, 40);
        // Investment Synopsis
        doc.setFontSize(14);
        doc.text('Investment Synopsis', 14, 55);
        doc.setFontSize(10);
        if (data.tcaData) {
            var score = data.tcaData.compositeScore;
            doc.text("Overall Investment Score: " + score.toFixed(2) + "/10", 14, 65);
            doc.text("Risk-Adjusted Rating: " + (score >= 8 ? 'HIGH CONFIDENCE' : score >= 6 ? 'MODERATE CONFIDENCE' : 'LOW CONFIDENCE'), 14, 75);
        }
        // Detailed TCA Analysis
        if (data.tcaData) {
            jspdf_autotable_1["default"](doc, {
                startY: 85,
                head: [['Analysis Category', 'Score', 'Weight', 'Assessment', 'Key Concerns']],
                body: data.tcaData.categories.map(function (c) {
                    var _a;
                    return [
                        c.category,
                        c.rawScore.toString(),
                        c.weight + "%",
                        c.flag === 'green' ? 'Strong' : c.flag === 'yellow' ? 'Moderate' : 'Weak',
                        ((_a = c.concerns) === null || _a === void 0 ? void 0 : _a.slice(0, 50)) + '...' || 'None identified'
                    ];
                }),
                theme: 'grid',
                headStyles: { fillColor: [52, 73, 94] },
                styles: { fontSize: 8 },
                columnStyles: {
                    4: { cellWidth: 40 }
                }
            });
        }
        // Critical Risk Assessment
        if (data.riskData) {
            var finalY_2 = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.text('Critical Risk Assessment', 14, finalY_2);
            doc.setFontSize(9);
            var criticalRisks = data.riskData.riskFlags.filter(function (r) { return r.flag === 'red'; });
            doc.text(criticalRisks.length + " Critical Risk(s) Identified", 14, finalY_2 + 10);
        }
        // PAGE 2: Investment Decision & Strategic Analysis
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Investment Decision Framework', 14, 25);
        doc.line(14, 30, 196, 30);
        // Financial Analysis Summary
        doc.setFontSize(12);
        doc.text('Financial Health Assessment', 14, 45);
        doc.setFontSize(9);
        if (data.financialsData) {
            doc.text("Revenue Growth: " + (data.financialsData.revenueGrowth || 'Under Review'), 14, 55);
            doc.text("Burn Rate: " + (data.financialsData.burnRate || 'Under Analysis'), 14, 65);
            doc.text("Runway: " + (data.financialsData.runway || 'To be determined'), 14, 75);
        }
        // Strategic Fit Analysis
        if (data.strategicFitData) {
            jspdf_autotable_1["default"](doc, {
                startY: 85,
                head: [['Strategic Factor', 'Alignment', 'Impact', 'Priority']],
                body: ((_a = data.strategicFitData.factors) === null || _a === void 0 ? void 0 : _a.slice(0, 5).map(function (f) { return [
                    f.factor || 'Market Alignment',
                    f.alignment || 'Strong',
                    f.impact || 'High',
                    f.priority || 'Critical'
                ]; })) || [['Market Opportunity', 'Strong', 'High', 'Critical']],
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96] },
                styles: { fontSize: 9 }
            });
        }
        // Final Investment Recommendation
        var finalY = ((_b = doc.lastAutoTable) === null || _b === void 0 ? void 0 : _b.finalY) + 15 || 140;
        doc.setFontSize(14);
        doc.text('Final Investment Recommendation', 14, finalY);
        doc.setFontSize(10);
        var investmentDecision = ((_c = data.tcaData) === null || _c === void 0 ? void 0 : _c.compositeScore) >= 7.5 ?
            'STRONG BUY: High confidence investment opportunity' :
            ((_d = data.tcaData) === null || _d === void 0 ? void 0 : _d.compositeScore) >= 6 ?
                'CONDITIONAL BUY: Proceed with specific conditions' :
                'PASS: Risk/reward profile not aligned with investment criteria';
        doc.text(investmentDecision, 14, finalY + 10);
        // Investment Terms & Valuation
        doc.setFontSize(12);
        doc.text('Proposed Investment Terms', 14, finalY + 25);
        doc.setFontSize(9);
        doc.text('• Valuation: $[To be negotiated based on analysis]', 14, finalY + 35);
        doc.text('• Investment Amount: $[As per fund allocation]', 14, finalY + 43);
        doc.text('• Board Representation: [As per investment tier]', 14, finalY + 51);
        doc.save(companyName + "-DD-Report-" + new Date().toISOString().split('T')[0] + ".pdf");
        toast({
            title: 'Two-Page DD Report Exported',
            description: 'Your comprehensive due diligence report has been downloaded.'
        });
    };
    // Comprehensive Full Report (PDF) - ENHANCED VERSION
    var handleExportFullReport = function () {
        var _a, _b, _c, _d, _e;
        var data = getAnalysisData();
        if (!data)
            return;
        var doc = new jsPDF();
        var companyName = getCompanyName();
        // TITLE PAGE
        doc.setFontSize(24);
        doc.text("COMPREHENSIVE ANALYSIS REPORT", 105, 50, { align: 'center' });
        doc.setFontSize(20);
        doc.text("" + companyName, 105, 70, { align: 'center' });
        doc.setFontSize(14);
        doc.text("Report Type: " + reportType.toUpperCase(), 105, 90, { align: 'center' });
        doc.text("Generated: " + new Date().toLocaleDateString() + " | Analyst: " + role, 105, 100, { align: 'center' });
        doc.setFontSize(12);
        doc.text("Confidential & Proprietary Analysis", 105, 120, { align: 'center' });
        // Executive Summary Box
        doc.setDrawColor(0, 0, 0);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(20, 140, 170, 60, 3, 3, 'DF');
        doc.setFontSize(14);
        doc.text('EXECUTIVE SUMMARY', 105, 155, { align: 'center' });
        doc.setFontSize(11);
        if (data.tcaData) {
            var score_1 = data.tcaData.compositeScore;
            var rating = score_1 >= 8 ? 'EXCELLENT' : score_1 >= 7 ? 'STRONG' : score_1 >= 6 ? 'GOOD' : score_1 >= 5 ? 'MODERATE' : 'WEAK';
            doc.text("Overall Investment Score: " + score_1.toFixed(2) + "/10 (" + rating + ")", 105, 170, { align: 'center' });
            doc.text("Investment Recommendation: " + (score_1 >= 7 ? 'PROCEED TO DD' : score_1 >= 5 ? 'CONDITIONAL REVIEW' : 'DECLINE'), 105, 185, { align: 'center' });
        }
        // TABLE OF CONTENTS
        doc.addPage();
        doc.setFontSize(16);
        doc.text('TABLE OF CONTENTS', 14, 25);
        doc.setFontSize(11);
        var tocItems = [
            '1. Executive Summary ..................................... 3',
            '2. TCA Scorecard Analysis ................................. 4',
            '3. Risk Assessment & Mitigation .......................... 6',
            '4. Market & Competitive Analysis ......................... 8',
            '5. Financial Health & Projections ........................ 10',
            '6. Technology & IP Assessment ............................ 12',
            '7. Team & Leadership Evaluation .......................... 14',
            '8. Strategic Fit Matrix .................................. 16',
            '9. Growth Potential Analysis ............................. 18',
            '10. Investment Recommendation ............................ 20',
            '11. Due Diligence Checklist .............................. 22',
            '12. Appendix: Raw Data & Calculations ................... 24'
        ];
        tocItems.forEach(function (item, index) {
            doc.text(item, 20, 45 + (index * 10));
        });
        // PAGE 3: DETAILED EXECUTIVE SUMMARY
        doc.addPage();
        doc.setFontSize(16);
        doc.text('1. EXECUTIVE SUMMARY', 14, 25);
        doc.setLineWidth(0.5);
        doc.line(14, 30, 196, 30);
        if (data.tcaData) {
            // Key Metrics Summary Table
            doc.setFontSize(12);
            doc.text('Key Performance Metrics', 14, 45);
            jspdf_autotable_1["default"](doc, {
                startY: 50,
                head: [['Metric', 'Value', 'Industry Benchmark', 'Percentile Rank']],
                body: [
                    ['TCA Composite Score', data.tcaData.compositeScore.toFixed(2), '6.5', Math.round(data.tcaData.compositeScore * 10) + "th"],
                    ['Technology Readiness', ((_a = data.tcaData.categories.find(function (c) { return c.category.includes('Technology'); })) === null || _a === void 0 ? void 0 : _a.rawScore) || 'N/A', '7.0', 'TBD'],
                    ['Market Opportunity', ((_b = data.tcaData.categories.find(function (c) { return c.category.includes('Market'); })) === null || _b === void 0 ? void 0 : _b.rawScore) || 'N/A', '6.8', 'TBD'],
                    ['Team Strength', ((_c = data.tcaData.categories.find(function (c) { return c.category.includes('Team'); })) === null || _c === void 0 ? void 0 : _c.rawScore) || 'N/A', '7.2', 'TBD'],
                    ['Financial Health', ((_d = data.tcaData.categories.find(function (c) { return c.category.includes('Financial'); })) === null || _d === void 0 ? void 0 : _d.rawScore) || 'N/A', '6.0', 'TBD']
                ],
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 9 }
            });
            // Investment Synopsis
            var currentY_1 = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(12);
            doc.text('Investment Synopsis', 14, currentY_1);
            doc.setFontSize(10);
            var synopsis = [
                companyName + " presents a " + (data.tcaData.compositeScore >= 7 ? 'compelling' : data.tcaData.compositeScore >= 5 ? 'moderate' : 'challenging') + " investment opportunity with a composite TCA score of " + data.tcaData.compositeScore.toFixed(2) + "/10.",
                "Key strengths include strong performance in " + data.tcaData.categories.filter(function (c) { return c.flag === 'green'; }).map(function (c) { return c.category.toLowerCase(); }).slice(0, 2).join(' and ') + ".",
                "Primary concerns center around " + data.tcaData.categories.filter(function (c) { return c.flag === 'red'; }).map(function (c) { return c.category.toLowerCase(); }).slice(0, 2).join(' and ') + ".",
                data.tcaData.summary
            ];
            synopsis.forEach(function (line, index) {
                var lines = doc.splitTextToSize(line, 180);
                doc.text(lines, 14, currentY_1 + 10 + (index * 15));
            });
        }
        // PAGE 4-5: DETAILED TCA SCORECARD ANALYSIS
        doc.addPage();
        doc.setFontSize(16);
        doc.text('2. TCA SCORECARD ANALYSIS', 14, 25);
        doc.line(14, 30, 196, 30);
        if (data.tcaData) {
            // Comprehensive TCA Table
            jspdf_autotable_1["default"](doc, {
                startY: 40,
                head: [['Category', 'Raw Score', 'Weight', 'Weighted Score', 'Flag', 'Confidence']],
                body: data.tcaData.categories.map(function (c) { return [
                    c.category,
                    c.rawScore.toString(),
                    c.weight + "%",
                    ((c.rawScore * c.weight) / 100).toFixed(2),
                    c.flag.toUpperCase(),
                    c.confidence || 'High'
                ]; }),
                theme: 'grid',
                headStyles: { fillColor: [52, 73, 94], textColor: 255 },
                styles: { fontSize: 9 },
                columnStyles: {
                    4: {
                        cellWidth: 15,
                        halign: 'center'
                    }
                }
            });
            // Detailed Category Analysis
            var currentY_2 = doc.lastAutoTable.finalY + 15;
            data.tcaData.categories.forEach(function (category, index) {
                if (currentY_2 > 250) {
                    doc.addPage();
                    currentY_2 = 25;
                }
                doc.setFontSize(12);
                doc.text(index + 1 + ". " + category.category, 14, currentY_2);
                doc.setFontSize(10);
                // Score and status
                doc.text("Score: " + category.rawScore + "/10 | Weight: " + category.weight + "% | Status: " + category.flag.toUpperCase(), 14, currentY_2 + 8);
                // Strengths
                if (category.strengths) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Strengths:', 14, currentY_2 + 18);
                    doc.setFont('helvetica', 'normal');
                    var strengthLines = doc.splitTextToSize(category.strengths, 170);
                    doc.text(strengthLines, 14, currentY_2 + 26);
                    currentY_2 += 8 + strengthLines.length * 4;
                }
                // Concerns
                if (category.concerns) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Concerns:', 14, currentY_2 + 8);
                    doc.setFont('helvetica', 'normal');
                    var concernLines = doc.splitTextToSize(category.concerns, 170);
                    doc.text(concernLines, 14, currentY_2 + 16);
                    currentY_2 += 16 + concernLines.length * 4;
                }
                currentY_2 += 10; // Space between categories
            });
        }
        // PAGE 6-7: COMPREHENSIVE RISK ASSESSMENT
        doc.addPage();
        doc.setFontSize(16);
        doc.text('3. RISK ASSESSMENT & MITIGATION', 14, 25);
        doc.line(14, 30, 196, 30);
        if (data.riskData) {
            // Risk Summary
            doc.setFontSize(12);
            doc.text('Risk Assessment Summary', 14, 45);
            doc.setFontSize(10);
            var riskSummaryLines = doc.splitTextToSize(data.riskData.riskSummary, 180);
            doc.text(riskSummaryLines, 14, 55);
            // Risk Matrix
            var riskCounts = {
                red: data.riskData.riskFlags.filter(function (r) { return r.flag === 'red'; }).length,
                yellow: data.riskData.riskFlags.filter(function (r) { return r.flag === 'yellow'; }).length,
                green: data.riskData.riskFlags.filter(function (r) { return r.flag === 'green'; }).length
            };
            jspdf_autotable_1["default"](doc, {
                startY: 80,
                head: [['Risk Level', 'Count', 'Percentage', 'Impact']],
                body: [
                    ['Critical (Red)', riskCounts.red.toString(), ((riskCounts.red / data.riskData.riskFlags.length) * 100).toFixed(1) + "%", 'High'],
                    ['Moderate (Yellow)', riskCounts.yellow.toString(), ((riskCounts.yellow / data.riskData.riskFlags.length) * 100).toFixed(1) + "%", 'Medium'],
                    ['Low (Green)', riskCounts.green.toString(), ((riskCounts.green / data.riskData.riskFlags.length) * 100).toFixed(1) + "%", 'Low']
                ],
                theme: 'grid',
                headStyles: { fillColor: [231, 76, 60], textColor: 255 },
                styles: { fontSize: 10 }
            });
            // Detailed Risk Analysis
            jspdf_autotable_1["default"](doc, {
                head: [['Risk Domain', 'Level', 'Risk Trigger', 'Mitigation Strategy', 'Priority']],
                body: data.riskData.riskFlags.map(function (r) {
                    var _a;
                    return [
                        r.domain,
                        r.flag.toUpperCase(),
                        r.trigger,
                        ((_a = r.mitigation) === null || _a === void 0 ? void 0 : _a.slice(0, 60)) + '...' || 'Under development',
                        r.priority || 'High'
                    ];
                }),
                theme: 'grid',
                headStyles: { fillColor: [192, 57, 43], textColor: 255 },
                styles: { fontSize: 8 },
                columnStyles: {
                    2: { cellWidth: 35 },
                    3: { cellWidth: 40 }
                }
            });
        }
        // Additional analysis sections for truly comprehensive report
        var sectionsToAdd = [
            { data: data.benchmarkData, title: '4. MARKET & COMPETITIVE ANALYSIS', key: 'benchmarkData' },
            { data: data.financialsData, title: '5. FINANCIAL HEALTH & PROJECTIONS', key: 'financialsData' },
            { data: data.teamData, title: '6. TEAM & LEADERSHIP EVALUATION', key: 'teamData' },
            { data: data.strategicFitData, title: '7. STRATEGIC FIT MATRIX', key: 'strategicFitData' },
            { data: data.growthData, title: '8. GROWTH POTENTIAL ANALYSIS', key: 'growthData' }
        ];
        sectionsToAdd.forEach(function (section) {
            var _a, _b;
            if (section.data) {
                doc.addPage();
                doc.setFontSize(16);
                doc.text(section.title, 14, 25);
                doc.line(14, 30, 196, 30);
                // Add specific content based on data type
                if (section.key === 'benchmarkData' && data.benchmarkData) {
                    jspdf_autotable_1["default"](doc, {
                        startY: 40,
                        head: [['Metric', 'Company Value', 'Industry Average', 'Percentile Rank', 'Assessment']],
                        body: ((_a = data.benchmarkData.comparisons) === null || _a === void 0 ? void 0 : _a.map(function (comp) { return [
                            comp.metric || 'Revenue Growth',
                            comp.companyValue || 'TBD',
                            comp.industryAverage || 'TBD',
                            comp.percentile || 'TBD',
                            comp.assessment || 'Under Review'
                        ]; })) || [['Revenue Growth', 'TBD', 'Industry Avg', 'TBD', 'Pending Analysis']],
                        theme: 'grid',
                        headStyles: { fillColor: [46, 125, 50] }
                    });
                }
                if (section.key === 'financialsData' && data.financialsData) {
                    var financialMetrics = [
                        ['Revenue Growth Rate', data.financialsData.revenueGrowth || 'Under Analysis', '25% (Industry)', 'Target: >30%'],
                        ['Monthly Burn Rate', data.financialsData.burnRate || 'Under Review', '$50K (Avg)', 'Monitor closely'],
                        ['Runway (Months)', data.financialsData.runway || 'TBD', '18 months', 'Adequate if >12mo'],
                        ['Gross Margin', data.financialsData.grossMargin || 'Pending', '70%', 'Target: >60%'],
                        ['CAC:LTV Ratio', data.financialsData.cacLtv || 'TBD', '1:3', 'Target: 1:3 or better']
                    ];
                    jspdf_autotable_1["default"](doc, {
                        startY: 40,
                        head: [['Financial Metric', 'Current Value', 'Industry Benchmark', 'Assessment']],
                        body: financialMetrics,
                        theme: 'grid',
                        headStyles: { fillColor: [76, 175, 80] }
                    });
                }
                if (section.key === 'growthData' && data.growthData) {
                    jspdf_autotable_1["default"](doc, {
                        startY: 40,
                        head: [['Growth Factor', 'Assessment', 'Score', 'Trend Direction', 'Time Horizon']],
                        body: ((_b = data.growthData.factors) === null || _b === void 0 ? void 0 : _b.map(function (factor) {
                            var _a;
                            return [
                                factor.name || 'Market Expansion',
                                factor.assessment || 'Positive',
                                ((_a = factor.score) === null || _a === void 0 ? void 0 : _a.toString()) || '7.5',
                                factor.trend || 'Increasing',
                                factor.timeHorizon || '12-18 months'
                            ];
                        })) || [['Market Growth', 'Strong', '8.5', 'Accelerating', '12 months']],
                        theme: 'grid',
                        headStyles: { fillColor: [103, 58, 183] }
                    });
                }
            }
        });
        // FINAL PAGE: INVESTMENT RECOMMENDATION & DUE DILIGENCE
        doc.addPage();
        doc.setFontSize(16);
        doc.text('10. INVESTMENT RECOMMENDATION & NEXT STEPS', 14, 25);
        doc.line(14, 30, 196, 30);
        // Investment Decision Matrix
        var score = ((_e = data.tcaData) === null || _e === void 0 ? void 0 : _e.compositeScore) || 0;
        var recommendation = score >= 8 ? 'STRONG BUY' : score >= 7 ? 'BUY' : score >= 6 ? 'CONDITIONAL BUY' : score >= 4 ? 'HOLD FOR REVIEW' : 'PASS';
        var confidence = score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low';
        jspdf_autotable_1["default"](doc, {
            startY: 40,
            head: [['Decision Framework', 'Assessment', 'Rationale']],
            body: [
                ['Investment Recommendation', recommendation, "Based on comprehensive TCA score of " + score.toFixed(2)],
                ['Confidence Level', confidence, 'Derived from analysis completeness and data quality'],
                ['Risk Profile', score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk', 'Based on risk assessment matrix'],
                ['Strategic Alignment', 'Under Review', 'Requires fund strategy alignment analysis'],
                ['Valuation Range', 'TBD - Pending Financial DD', 'Requires detailed financial model review']
            ],
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] }
        });
        // Due Diligence Checklist
        var currentY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.text('Due Diligence Checklist', 14, currentY);
        var ddChecklist = [
            '□ Management presentation and Q&A session',
            '□ Financial model validation and projections review',
            '□ Customer reference calls and market validation',
            '□ Technical architecture and IP assessment',
            '□ Competitive landscape deep dive',
            '□ Legal and regulatory compliance review',
            '□ Background checks on key personnel',
            '□ Reference checks with previous investors',
            '□ Market size and TAM validation',
            '□ Unit economics and scalability analysis'
        ];
        doc.setFontSize(10);
        ddChecklist.forEach(function (item, index) {
            doc.text(item, 20, currentY + 15 + (index * 8));
        });
        // Footer on all pages
        var pageCount = doc.internal.getNumberOfPages();
        for (var i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(companyName + " - " + reportType.toUpperCase() + " Analysis Report | Page " + i + " of " + pageCount + " | Generated: " + new Date().toLocaleDateString(), 105, 285, { align: 'center' });
        }
        doc.save(companyName + "-COMPREHENSIVE-Analysis-Report-" + new Date().toISOString().split('T')[0] + ".pdf");
        toast({
            title: 'Comprehensive Full Report Exported',
            description: "Complete " + pageCount + "-page analysis report with all modules and detailed assessments downloaded."
        });
    };
    // Enhanced DOCX Export with Comprehensive Content
    var handleExportDocx = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, companyName, sections, score_2, rating, risksByLevel, score, recommendation, doc, blob;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    data = getAnalysisData();
                    if (!data)
                        return [2 /*return*/];
                    companyName = getCompanyName();
                    sections = [];
                    // TITLE PAGE
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.TITLE,
                        children: [new docx_1.TextRun({ text: "COMPREHENSIVE ANALYSIS REPORT", size: 28, bold: true })]
                    }), new docx_1.Paragraph({
                        children: [new docx_1.TextRun({ text: "" + companyName, size: 24, bold: true })],
                        alignment: 'center'
                    }), new docx_1.Paragraph({
                        children: [new docx_1.TextRun({ text: reportType.toUpperCase() + " Analysis | Generated: " + new Date().toLocaleDateString(), size: 14 })],
                        alignment: 'center'
                    }), new docx_1.Paragraph({
                        children: [new docx_1.TextRun({ text: "Analyst: " + role + " | Confidential & Proprietary", size: 12, italics: true })],
                        alignment: 'center'
                    }), new docx_1.Paragraph(""), new docx_1.Paragraph(""));
                    // EXECUTIVE SUMMARY
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_1,
                        children: [new docx_1.TextRun({ text: "EXECUTIVE SUMMARY", bold: true })]
                    }));
                    if (data.tcaData) {
                        score_2 = data.tcaData.compositeScore;
                        rating = score_2 >= 8 ? 'EXCELLENT' : score_2 >= 7 ? 'STRONG' : score_2 >= 6 ? 'GOOD' : score_2 >= 5 ? 'MODERATE' : 'WEAK';
                        sections.push(new docx_1.Paragraph("Overall Investment Score: " + score_2.toFixed(2) + "/10 (" + rating + ")"), new docx_1.Paragraph("Investment Recommendation: " + (score_2 >= 7 ? 'PROCEED TO DUE DILIGENCE' : score_2 >= 5 ? 'CONDITIONAL REVIEW REQUIRED' : 'DECLINE INVESTMENT')), new docx_1.Paragraph(""), new docx_1.Paragraph(data.tcaData.summary), new docx_1.Paragraph(""));
                    }
                    // TABLE OF CONTENTS
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_1,
                        children: [new docx_1.TextRun({ text: "TABLE OF CONTENTS", bold: true })]
                    }), new docx_1.Paragraph("1. Executive Summary"), new docx_1.Paragraph("2. TCA Scorecard Analysis"), new docx_1.Paragraph("3. Risk Assessment & Mitigation Strategy"), new docx_1.Paragraph("4. Market & Competitive Analysis"), new docx_1.Paragraph("5. Financial Health & Projections"), new docx_1.Paragraph("6. Technology & Intellectual Property"), new docx_1.Paragraph("7. Team & Leadership Assessment"), new docx_1.Paragraph("8. Strategic Fit Analysis"), new docx_1.Paragraph("9. Growth Potential & Scalability"), new docx_1.Paragraph("10. Investment Recommendation & Terms"), new docx_1.Paragraph("11. Due Diligence Checklist"), new docx_1.Paragraph("12. Risk Mitigation Strategies"), new docx_1.Paragraph("13. Appendices & Supporting Data"), new docx_1.Paragraph(""));
                    // DETAILED TCA SCORECARD ANALYSIS
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_1,
                        children: [new docx_1.TextRun({ text: "TCA SCORECARD ANALYSIS", bold: true })]
                    }));
                    if (data.tcaData) {
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Overall Performance Metrics", bold: true })]
                        }));
                        sections.push(new docx_1.Paragraph("Composite TCA Score: " + data.tcaData.compositeScore.toFixed(2) + "/10"), new docx_1.Paragraph("Total Categories Analyzed: " + data.tcaData.categories.length), new docx_1.Paragraph("Categories with Green Flag: " + data.tcaData.categories.filter(function (c) { return c.flag === 'green'; }).length), new docx_1.Paragraph("Categories with Yellow Flag: " + data.tcaData.categories.filter(function (c) { return c.flag === 'yellow'; }).length), new docx_1.Paragraph("Categories with Red Flag: " + data.tcaData.categories.filter(function (c) { return c.flag === 'red'; }).length), new docx_1.Paragraph(""));
                        // Detailed category analysis
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Detailed Category Analysis", bold: true })]
                        }));
                        data.tcaData.categories.forEach(function (category, index) {
                            sections.push(new docx_1.Paragraph({
                                heading: docx_1.HeadingLevel.HEADING_3,
                                children: [new docx_1.TextRun({ text: index + 1 + ". " + category.category, bold: true })]
                            }), new docx_1.Paragraph("Score: " + category.rawScore + "/10 | Weight: " + category.weight + "% | Status: " + category.flag.toUpperCase()), new docx_1.Paragraph(""));
                            if (category.strengths) {
                                sections.push(new docx_1.Paragraph({
                                    children: [new docx_1.TextRun({ text: "Strengths:", bold: true })]
                                }), new docx_1.Paragraph(category.strengths), new docx_1.Paragraph(""));
                            }
                            if (category.concerns) {
                                sections.push(new docx_1.Paragraph({
                                    children: [new docx_1.TextRun({ text: "Areas of Concern:", bold: true })]
                                }), new docx_1.Paragraph(category.concerns), new docx_1.Paragraph(""));
                            }
                            if (category.recommendations) {
                                sections.push(new docx_1.Paragraph({
                                    children: [new docx_1.TextRun({ text: "Recommendations:", bold: true })]
                                }), new docx_1.Paragraph(category.recommendations), new docx_1.Paragraph(""));
                            }
                        });
                    }
                    // COMPREHENSIVE RISK ASSESSMENT
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_1,
                        children: [new docx_1.TextRun({ text: "RISK ASSESSMENT & MITIGATION", bold: true })]
                    }));
                    if (data.riskData) {
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Risk Assessment Summary", bold: true })]
                        }), new docx_1.Paragraph(data.riskData.riskSummary), new docx_1.Paragraph(""));
                        risksByLevel = {
                            red: data.riskData.riskFlags.filter(function (r) { return r.flag === 'red'; }),
                            yellow: data.riskData.riskFlags.filter(function (r) { return r.flag === 'yellow'; }),
                            green: data.riskData.riskFlags.filter(function (r) { return r.flag === 'green'; })
                        };
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Risk Level Distribution", bold: true })]
                        }), new docx_1.Paragraph("Critical Risks (Red): " + risksByLevel.red.length), new docx_1.Paragraph("Moderate Risks (Yellow): " + risksByLevel.yellow.length), new docx_1.Paragraph("Low Risks (Green): " + risksByLevel.green.length), new docx_1.Paragraph(""));
                        // Detailed risk analysis
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Detailed Risk Analysis", bold: true })]
                        }));
                        data.riskData.riskFlags.forEach(function (risk, index) {
                            sections.push(new docx_1.Paragraph({
                                heading: docx_1.HeadingLevel.HEADING_3,
                                children: [new docx_1.TextRun({ text: "Risk " + (index + 1) + ": " + risk.domain, bold: true })]
                            }), new docx_1.Paragraph("Level: " + risk.flag.toUpperCase()), new docx_1.Paragraph("Trigger: " + risk.trigger), new docx_1.Paragraph("Mitigation Strategy: " + (risk.mitigation || 'Under development')), new docx_1.Paragraph("Priority: " + (risk.priority || 'High')), new docx_1.Paragraph(""));
                        });
                    }
                    // MARKET & COMPETITIVE ANALYSIS
                    if (data.benchmarkData) {
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_1,
                            children: [new docx_1.TextRun({ text: "MARKET & COMPETITIVE ANALYSIS", bold: true })]
                        }), new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Benchmark Comparison", bold: true })]
                        }));
                        (_a = data.benchmarkData.comparisons) === null || _a === void 0 ? void 0 : _a.forEach(function (comp, index) {
                            sections.push(new docx_1.Paragraph(index + 1 + ". " + (comp.metric || 'Market Metric')), new docx_1.Paragraph("   Company Value: " + (comp.companyValue || 'Under Analysis')), new docx_1.Paragraph("   Industry Average: " + (comp.industryAverage || 'TBD')), new docx_1.Paragraph("   Percentile Rank: " + (comp.percentile || 'TBD')), new docx_1.Paragraph(""));
                        });
                    }
                    // FINANCIAL HEALTH ANALYSIS
                    if (data.financialsData) {
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_1,
                            children: [new docx_1.TextRun({ text: "FINANCIAL HEALTH & PROJECTIONS", bold: true })]
                        }), new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Key Financial Metrics", bold: true })]
                        }), new docx_1.Paragraph("Revenue Growth Rate: " + (data.financialsData.revenueGrowth || 'Under Analysis')), new docx_1.Paragraph("Monthly Burn Rate: " + (data.financialsData.burnRate || 'Under Review')), new docx_1.Paragraph("Cash Runway: " + (data.financialsData.runway || 'To be determined')), new docx_1.Paragraph("Gross Margin: " + (data.financialsData.grossMargin || 'Pending analysis')), new docx_1.Paragraph("Customer Acquisition Cost: " + (data.financialsData.cac || 'Under review')), new docx_1.Paragraph("Lifetime Value: " + (data.financialsData.ltv || 'Under calculation')), new docx_1.Paragraph(""));
                    }
                    // TEAM & LEADERSHIP ASSESSMENT
                    if (data.teamData) {
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_1,
                            children: [new docx_1.TextRun({ text: "TEAM & LEADERSHIP ASSESSMENT", bold: true })]
                        }), new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Leadership Team Analysis", bold: true })]
                        }));
                        if (data.teamData.teamMembers) {
                            data.teamData.teamMembers.forEach(function (member, index) {
                                sections.push(new docx_1.Paragraph(index + 1 + ". " + (member.name || "Team Member " + (index + 1))), new docx_1.Paragraph("   Role: " + (member.role || 'Key Team Member')), new docx_1.Paragraph("   Experience: " + (member.experience || 'Extensive background')), new docx_1.Paragraph("   Assessment: " + (member.assessment || 'Strong contributor')), new docx_1.Paragraph(""));
                            });
                        }
                    }
                    // STRATEGIC FIT ANALYSIS
                    if (data.strategicFitData) {
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_1,
                            children: [new docx_1.TextRun({ text: "STRATEGIC FIT ANALYSIS", bold: true })]
                        }), new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Investment Alignment Assessment", bold: true })]
                        }));
                        (_b = data.strategicFitData.factors) === null || _b === void 0 ? void 0 : _b.forEach(function (factor, index) {
                            sections.push(new docx_1.Paragraph(index + 1 + ". " + (factor.factor || 'Strategic Factor')), new docx_1.Paragraph("   Alignment: " + (factor.alignment || 'Strong')), new docx_1.Paragraph("   Impact: " + (factor.impact || 'High')), new docx_1.Paragraph("   Priority: " + (factor.priority || 'Critical')), new docx_1.Paragraph(""));
                        });
                    }
                    // GROWTH POTENTIAL ANALYSIS
                    if (data.growthData) {
                        sections.push(new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_1,
                            children: [new docx_1.TextRun({ text: "GROWTH POTENTIAL & SCALABILITY", bold: true })]
                        }), new docx_1.Paragraph({
                            heading: docx_1.HeadingLevel.HEADING_2,
                            children: [new docx_1.TextRun({ text: "Growth Factor Analysis", bold: true })]
                        }));
                        (_c = data.growthData.factors) === null || _c === void 0 ? void 0 : _c.forEach(function (factor, index) {
                            sections.push(new docx_1.Paragraph(index + 1 + ". " + (factor.name || 'Growth Driver')), new docx_1.Paragraph("   Assessment: " + (factor.assessment || 'Positive')), new docx_1.Paragraph("   Score: " + (factor.score || '7.5') + "/10"), new docx_1.Paragraph("   Trend: " + (factor.trend || 'Increasing')), new docx_1.Paragraph("   Time Horizon: " + (factor.timeHorizon || '12-18 months')), new docx_1.Paragraph(""));
                        });
                    }
                    // INVESTMENT RECOMMENDATION
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_1,
                        children: [new docx_1.TextRun({ text: "INVESTMENT RECOMMENDATION", bold: true })]
                    }), new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_2,
                        children: [new docx_1.TextRun({ text: "Final Assessment", bold: true })]
                    }));
                    score = ((_d = data.tcaData) === null || _d === void 0 ? void 0 : _d.compositeScore) || 0;
                    recommendation = score >= 8 ? 'STRONG BUY - Proceed immediately' :
                        score >= 7 ? 'BUY - Recommended investment' :
                            score >= 6 ? 'CONDITIONAL BUY - Address specific concerns' :
                                score >= 4 ? 'HOLD - Requires significant improvements' :
                                    'PASS - Does not meet investment criteria';
                    sections.push(new docx_1.Paragraph("Investment Decision: " + recommendation), new docx_1.Paragraph("Confidence Level: " + (score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low')), new docx_1.Paragraph("Risk Profile: " + (score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk')), new docx_1.Paragraph(""));
                    // DUE DILIGENCE CHECKLIST
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_1,
                        children: [new docx_1.TextRun({ text: "DUE DILIGENCE CHECKLIST", bold: true })]
                    }), new docx_1.Paragraph("□ Management presentation and leadership interviews"), new docx_1.Paragraph("□ Financial model validation and projection review"), new docx_1.Paragraph("□ Customer reference calls and market validation"), new docx_1.Paragraph("□ Technical architecture and IP assessment"), new docx_1.Paragraph("□ Competitive landscape analysis"), new docx_1.Paragraph("□ Legal and regulatory compliance review"), new docx_1.Paragraph("□ Background checks on key personnel"), new docx_1.Paragraph("□ Reference checks with previous investors"), new docx_1.Paragraph("□ Market size and TAM validation"), new docx_1.Paragraph("□ Unit economics and scalability analysis"), new docx_1.Paragraph("□ Technology risk assessment"), new docx_1.Paragraph("□ Business model validation"), new docx_1.Paragraph(""));
                    // APPENDICES
                    sections.push(new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_1,
                        children: [new docx_1.TextRun({ text: "APPENDICES", bold: true })]
                    }), new docx_1.Paragraph({
                        heading: docx_1.HeadingLevel.HEADING_2,
                        children: [new docx_1.TextRun({ text: "Data Sources & Methodology", bold: true })]
                    }), new docx_1.Paragraph("This comprehensive analysis was conducted using the TCA-IRR Platform's 9-module assessment framework."), new docx_1.Paragraph("Data sources include company-provided materials, public market research, and proprietary analysis tools."), new docx_1.Paragraph("All scores and assessments are based on standardized evaluation criteria and industry benchmarks."), new docx_1.Paragraph(""));
                    doc = new docx_1.Document({
                        sections: [{
                                children: sections,
                                properties: {
                                    page: {
                                        margin: {
                                            top: 720,
                                            right: 720,
                                            bottom: 720,
                                            left: 720
                                        }
                                    }
                                }
                            }]
                    });
                    return [4 /*yield*/, docx_1.Packer.toBlob(doc)];
                case 1:
                    blob = _e.sent();
                    file_saver_1.saveAs(blob, companyName + "-COMPREHENSIVE-" + reportType + "-Analysis.docx");
                    toast({
                        title: 'Comprehensive DOCX Report Exported',
                        description: "Complete " + reportType + " analysis report with detailed sections has been downloaded as Word document."
                    });
                    return [2 /*return*/];
            }
        });
    }); };
    // Enhanced Comprehensive PowerPoint Export
    var handleExportPptx = function () {
        var _a, _b;
        var data = getAnalysisData();
        if (!data)
            return;
        var companyName = getCompanyName();
        var pptx = new pptxgenjs_1["default"]();
        pptx.layout = 'LAYOUT_WIDE';
        // SLIDE 1: Title Slide
        var titleSlide = pptx.addSlide();
        titleSlide.addText("" + companyName, {
            x: 1, y: 1.5, w: 8, h: 1, fontSize: 32, bold: true, align: 'center', color: '1f4e79'
        });
        titleSlide.addText("COMPREHENSIVE INVESTMENT ANALYSIS", {
            x: 1, y: 2.5, w: 8, h: 0.8, fontSize: 24, align: 'center', color: '2e5d93'
        });
        titleSlide.addText(reportType.toUpperCase() + " REPORT", {
            x: 1, y: 3.3, w: 8, h: 0.6, fontSize: 18, align: 'center', color: '5b8bb5'
        });
        titleSlide.addText("Generated: " + new Date().toLocaleDateString() + " | Analyst: " + role, {
            x: 1, y: 4.5, w: 8, h: 0.5, fontSize: 14, align: 'center', italics: true
        });
        // SLIDE 2: Executive Summary
        var execSlide = pptx.addSlide();
        execSlide.addText('Executive Summary', { x: 0.5, y: 0.25, fontSize: 24, bold: true, color: '1f4e79' });
        if (data.tcaData) {
            var score_3 = data.tcaData.compositeScore;
            var rating = score_3 >= 8 ? 'EXCELLENT' : score_3 >= 7 ? 'STRONG' : score_3 >= 6 ? 'GOOD' : score_3 >= 5 ? 'MODERATE' : 'WEAK';
            execSlide.addText("Overall Investment Score: " + score_3.toFixed(2) + "/10", {
                x: 0.5, y: 1, fontSize: 20, bold: true, color: score_3 >= 7 ? '27ae60' : score_3 >= 5 ? 'f39c12' : 'e74c3c'
            });
            execSlide.addText("Rating: " + rating, {
                x: 0.5, y: 1.5, fontSize: 18, bold: true
            });
            // Key highlights
            execSlide.addText('Key Highlights:', { x: 0.5, y: 2.2, fontSize: 16, bold: true });
            execSlide.addText("\u2022 " + data.tcaData.categories.filter(function (c) { return c.flag === 'green'; }).length + " categories with strong performance", {
                x: 0.5, y: 2.7, fontSize: 14
            });
            execSlide.addText("\u2022 " + data.tcaData.categories.filter(function (c) { return c.flag === 'red'; }).length + " areas requiring attention", {
                x: 0.5, y: 3.1, fontSize: 14
            });
            var recommendation = score_3 >= 7 ? 'RECOMMEND: Proceed to Due Diligence' :
                score_3 >= 5 ? 'CONDITIONAL: Address key concerns' :
                    'PASS: Significant risks identified';
            execSlide.addText("Investment Recommendation: " + recommendation, {
                x: 0.5, y: 4, fontSize: 16, bold: true,
                color: score_3 >= 7 ? '27ae60' : score_3 >= 5 ? 'f39c12' : 'e74c3c'
            });
        }
        // SLIDE 3: TCA Scorecard Overview
        if (data.tcaData) {
            var tcaSlide = pptx.addSlide();
            tcaSlide.addText('TCA Scorecard Analysis', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });
            tcaSlide.addText("Composite Score: " + data.tcaData.compositeScore.toFixed(2) + "/10", {
                x: 0.5, y: 0.75, fontSize: 16, bold: true
            });
            var tableRows = data.tcaData.categories.map(function (c) { return [
                { text: c.category, options: { fontSize: 11 } },
                { text: String(c.rawScore), options: { fontSize: 11, align: 'center' } },
                { text: c.weight + "%", options: { fontSize: 11, align: 'center' } },
                {
                    text: c.flag.toUpperCase(), options: {
                        fontSize: 11,
                        align: 'center',
                        color: c.flag === 'green' ? '27ae60' : c.flag === 'yellow' ? 'f39c12' : 'e74c3c',
                        bold: true
                    }
                },
                { text: ((c.rawScore * c.weight) / 100).toFixed(2), options: { fontSize: 11, align: 'center' } }
            ]; });
            tcaSlide.addTable(__spreadArrays([
                [
                    { text: 'Category', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
                    { text: 'Score', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
                    { text: 'Weight', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
                    { text: 'Status', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
                    { text: 'Contribution', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } }
                ]
            ], tableRows), {
                x: 0.5, y: 1.3, w: 9.0, h: 3.5,
                border: { type: 'solid', color: '333333' },
                fill: { color: 'f8f9fa' }
            });
        }
        // SLIDE 4: Risk Assessment Matrix
        if (data.riskData) {
            var riskSlide = pptx.addSlide();
            riskSlide.addText('Risk Assessment Matrix', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });
            var riskCounts = {
                red: data.riskData.riskFlags.filter(function (r) { return r.flag === 'red'; }).length,
                yellow: data.riskData.riskFlags.filter(function (r) { return r.flag === 'yellow'; }).length,
                green: data.riskData.riskFlags.filter(function (r) { return r.flag === 'green'; }).length
            };
            // Risk distribution chart (text-based)
            riskSlide.addText('Risk Distribution:', { x: 0.5, y: 0.8, fontSize: 16, bold: true });
            riskSlide.addText("Critical Risks: " + riskCounts.red, {
                x: 0.5, y: 1.2, fontSize: 14, color: 'e74c3c', bold: true
            });
            riskSlide.addText("Moderate Risks: " + riskCounts.yellow, {
                x: 0.5, y: 1.5, fontSize: 14, color: 'f39c12', bold: true
            });
            riskSlide.addText("Low Risks: " + riskCounts.green, {
                x: 0.5, y: 1.8, fontSize: 14, color: '27ae60', bold: true
            });
            // Top risks table
            var topRisks = data.riskData.riskFlags
                .filter(function (r) { return r.flag === 'red'; })
                .slice(0, 5)
                .map(function (r) {
                var _a;
                return [
                    { text: r.domain, options: { fontSize: 11 } },
                    { text: r.flag.toUpperCase(), options: { fontSize: 11, color: 'e74c3c', bold: true } },
                    { text: r.trigger.slice(0, 50) + '...', options: { fontSize: 10 } },
                    { text: ((_a = r.mitigation) === null || _a === void 0 ? void 0 : _a.slice(0, 40)) + '...' || 'TBD', options: { fontSize: 10 } }
                ];
            });
            if (topRisks.length > 0) {
                riskSlide.addText('Top Critical Risks:', { x: 0.5, y: 2.5, fontSize: 16, bold: true });
                riskSlide.addTable(__spreadArrays([
                    [
                        { text: 'Domain', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } },
                        { text: 'Level', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } },
                        { text: 'Risk Trigger', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } },
                        { text: 'Mitigation', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } }
                    ]
                ], topRisks), {
                    x: 0.5, y: 2.9, w: 9.0, h: 2.0,
                    border: { type: 'solid', color: '333333' }
                });
            }
        }
        // SLIDE 5: Financial Health Summary
        if (data.financialsData) {
            var finSlide = pptx.addSlide();
            finSlide.addText('Financial Health Assessment', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });
            var financialMetrics = [
                ['Revenue Growth', data.financialsData.revenueGrowth || 'Under Analysis', 'Key Performance Indicator'],
                ['Monthly Burn Rate', data.financialsData.burnRate || 'Under Review', 'Cash Management'],
                ['Cash Runway', data.financialsData.runway || 'To be determined', 'Sustainability Metric'],
                ['Gross Margin', data.financialsData.grossMargin || 'Pending', 'Profitability Indicator'],
                ['Customer Acquisition Cost', data.financialsData.cac || 'Under Review', 'Efficiency Metric']
            ];
            finSlide.addTable(__spreadArrays([
                [
                    { text: 'Financial Metric', options: { bold: true, fontSize: 12, fill: '27ae60', color: 'ffffff' } },
                    { text: 'Current Value', options: { bold: true, fontSize: 12, fill: '27ae60', color: 'ffffff' } },
                    { text: 'Category', options: { bold: true, fontSize: 12, fill: '27ae60', color: 'ffffff' } }
                ]
            ], financialMetrics.map(function (metric) { return [
                { text: metric[0], options: { fontSize: 11 } },
                { text: metric[1], options: { fontSize: 11, bold: true } },
                { text: metric[2], options: { fontSize: 10, italics: true } }
            ]; })), {
                x: 0.5, y: 1.0, w: 9.0, h: 3.0,
                border: { type: 'solid', color: '333333' }
            });
        }
        // SLIDE 6: Team & Leadership Assessment
        if ((_a = data.teamData) === null || _a === void 0 ? void 0 : _a.teamMembers) {
            var teamSlide = pptx.addSlide();
            teamSlide.addText('Team & Leadership Assessment', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });
            var teamTableRows = data.teamData.teamMembers.slice(0, 6).map(function (member) {
                var _a;
                return [
                    { text: member.name || 'Team Member', options: { fontSize: 11, bold: true } },
                    { text: member.role || 'Key Role', options: { fontSize: 11 } },
                    { text: member.experience || 'Experienced Professional', options: { fontSize: 10 } },
                    {
                        text: member.assessment || 'Strong Contributor',
                        options: {
                            fontSize: 11,
                            color: ((_a = member.assessment) === null || _a === void 0 ? void 0 : _a.includes('Strong')) ? '27ae60' : '333333'
                        }
                    }
                ];
            });
            teamSlide.addTable(__spreadArrays([
                [
                    { text: 'Name', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } },
                    { text: 'Role', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } },
                    { text: 'Experience', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } },
                    { text: 'Assessment', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } }
                ]
            ], teamTableRows), {
                x: 0.5, y: 1.0, w: 9.0, h: 3.5,
                border: { type: 'solid', color: '333333' }
            });
        }
        // SLIDE 7: Investment Recommendation
        var recSlide = pptx.addSlide();
        recSlide.addText('Investment Recommendation', { x: 0.5, y: 0.25, fontSize: 24, bold: true, color: '1f4e79' });
        var score = ((_b = data.tcaData) === null || _b === void 0 ? void 0 : _b.compositeScore) || 0;
        var decision = score >= 8 ? 'STRONG BUY' : score >= 7 ? 'BUY' : score >= 6 ? 'CONDITIONAL BUY' : 'PASS';
        var confidence = score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low';
        var decisionColor = score >= 7 ? '27ae60' : score >= 5 ? 'f39c12' : 'e74c3c';
        recSlide.addText("Investment Decision: " + decision, {
            x: 1, y: 1.5, fontSize: 20, bold: true, color: decisionColor
        });
        recSlide.addText("Confidence Level: " + confidence, {
            x: 1, y: 2.0, fontSize: 16, bold: true
        });
        recSlide.addText("Overall TCA Score: " + score.toFixed(2) + "/10", {
            x: 1, y: 2.5, fontSize: 16
        });
        // Key decision factors
        recSlide.addText('Key Decision Factors:', { x: 1, y: 3.2, fontSize: 16, bold: true });
        recSlide.addText('• Technology readiness and competitive advantage', { x: 1.2, y: 3.6, fontSize: 14 });
        recSlide.addText('• Market opportunity size and growth potential', { x: 1.2, y: 3.9, fontSize: 14 });
        recSlide.addText('• Management team experience and execution capability', { x: 1.2, y: 4.2, fontSize: 14 });
        recSlide.addText('• Financial health and capital efficiency', { x: 1.2, y: 4.5, fontSize: 14 });
        recSlide.addText('• Strategic fit with investment criteria', { x: 1.2, y: 4.8, fontSize: 14 });
        // SLIDE 8: Next Steps
        var nextSlide = pptx.addSlide();
        nextSlide.addText('Recommended Next Steps', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });
        var nextSteps = [
            '1. Conduct detailed management presentation and Q&A',
            '2. Perform comprehensive financial model validation',
            '3. Complete customer reference calls and market validation',
            '4. Conduct technical and IP due diligence assessment',
            '5. Validate competitive positioning and market opportunity',
            '6. Review legal structure and regulatory compliance',
            '7. Complete background checks on key personnel',
            '8. Finalize investment terms and valuation discussion'
        ];
        nextSteps.forEach(function (step, index) {
            nextSlide.addText(step, { x: 0.8, y: 1.2 + (index * 0.4), fontSize: 14 });
        });
        // Timeline
        nextSlide.addText('Estimated Timeline: 4-6 weeks for complete due diligence', {
            x: 0.5, y: 4.8, fontSize: 14, bold: true, italics: true
        });
        pptx.writeFile({ fileName: companyName + "-COMPREHENSIVE-" + reportType + "-Analysis.pptx" });
        toast({
            title: 'Comprehensive PowerPoint Exported',
            description: "Complete " + reportType + " presentation with detailed analysis slides has been downloaded."
        });
    };
    // Enhanced ZIP Export with categorized files
    var handleDownloadZip = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, companyName, zip, summary, coreFolder, extendedFolder, configFolder, config, content;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    toast({
                        title: 'Preparing Download',
                        description: 'Generating comprehensive analysis data package.'
                    });
                    data = getAnalysisData();
                    if (!data)
                        return [2 /*return*/];
                    companyName = getCompanyName();
                    zip = new jszip_1["default"]();
                    summary = {
                        companyName: companyName,
                        reportType: reportType,
                        analystRole: role,
                        compositeScore: (_a = data.tcaData) === null || _a === void 0 ? void 0 : _a.compositeScore,
                        riskLevel: ((_b = data.riskData) === null || _b === void 0 ? void 0 : _b.riskFlags.filter(function (r) { return r.flag === 'red'; }).length) || 0,
                        generatedAt: new Date().toISOString(),
                        exportType: 'comprehensive_analysis_package'
                    };
                    zip.file('analysis-summary.json', JSON.stringify(summary, null, 2));
                    coreFolder = zip.folder('core-analysis');
                    if (coreFolder && data.tcaData) {
                        coreFolder.file('tca-scorecard.json', JSON.stringify(data.tcaData, null, 2));
                    }
                    if (coreFolder && data.riskData) {
                        coreFolder.file('risk-analysis.json', JSON.stringify(data.riskData, null, 2));
                    }
                    extendedFolder = zip.folder('extended-analysis');
                    if (extendedFolder) {
                        if (data.benchmarkData)
                            extendedFolder.file('benchmark-comparison.json', JSON.stringify(data.benchmarkData, null, 2));
                        if (data.macroData)
                            extendedFolder.file('macro-trend-alignment.json', JSON.stringify(data.macroData, null, 2));
                        if (data.growthData)
                            extendedFolder.file('growth-classifier.json', JSON.stringify(data.growthData, null, 2));
                        if (data.gapData)
                            extendedFolder.file('gap-analysis.json', JSON.stringify(data.gapData, null, 2));
                        if (data.founderFitData)
                            extendedFolder.file('founder-fit-analysis.json', JSON.stringify(data.founderFitData, null, 2));
                        if (data.teamData)
                            extendedFolder.file('team-assessment.json', JSON.stringify(data.teamData, null, 2));
                        if (data.strategicFitData)
                            extendedFolder.file('strategic-fit-matrix.json', JSON.stringify(data.strategicFitData, null, 2));
                        if (data.financialsData)
                            extendedFolder.file('financial-analysis.json', JSON.stringify(data.financialsData, null, 2));
                    }
                    configFolder = zip.folder('configuration');
                    if (configFolder) {
                        config = {
                            reportType: reportType,
                            role: role,
                            moduleWeights: (_c = data.tcaData) === null || _c === void 0 ? void 0 : _c.categories.map(function (c) { return ({ category: c.category, weight: c.weight }); }),
                            analysisFramework: localStorage.getItem('analysisFramework') || 'general',
                            exportTimestamp: new Date().toISOString()
                        };
                        configFolder.file('analysis-config.json', JSON.stringify(config, null, 2));
                    }
                    return [4 /*yield*/, zip.generateAsync({ type: 'blob' })];
                case 1:
                    content = _d.sent();
                    file_saver_1.saveAs(content, companyName + "-" + reportType + "-Analysis-Package.zip");
                    toast({
                        title: 'Analysis Package Downloaded',
                        description: 'Complete analysis data package with categorized files ready.'
                    });
                    return [2 /*return*/];
            }
        });
    }); };
    // Comprehensive Excel Export with Multiple Sheets
    var handleExportXlsx = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        var data = getAnalysisData();
        if (!data)
            return;
        toast({
            title: 'Excel Export In Progress',
            description: 'Generating comprehensive Excel workbook with multiple analysis sheets...'
        });
        // For now, we'll create a CSV-based data export
        // TODO: Implement actual Excel export with multiple sheets using libraries like xlsx
        var companyName = getCompanyName();
        // Create comprehensive data for Excel export
        var excelData = {
            summary: {
                companyName: companyName,
                reportType: reportType,
                analyst: role,
                generatedDate: new Date().toLocaleDateString(),
                overallScore: ((_a = data.tcaData) === null || _a === void 0 ? void 0 : _a.compositeScore) || 'N/A',
                recommendation: ((_b = data.tcaData) === null || _b === void 0 ? void 0 : _b.compositeScore) >= 7 ? 'RECOMMEND' :
                    ((_c = data.tcaData) === null || _c === void 0 ? void 0 : _c.compositeScore) >= 5 ? 'CONDITIONAL' : 'DECLINE'
            },
            tcaScores: ((_d = data.tcaData) === null || _d === void 0 ? void 0 : _d.categories) || [],
            riskAnalysis: ((_e = data.riskData) === null || _e === void 0 ? void 0 : _e.riskFlags) || [],
            benchmarkData: ((_f = data.benchmarkData) === null || _f === void 0 ? void 0 : _f.comparisons) || [],
            financialMetrics: data.financialsData || {},
            teamAssessment: data.teamData || {},
            growthFactors: ((_g = data.growthData) === null || _g === void 0 ? void 0 : _g.factors) || [],
            strategicFit: ((_h = data.strategicFitData) === null || _h === void 0 ? void 0 : _h.factors) || []
        };
        // Create CSV content for comprehensive analysis
        var csvContent = "COMPREHENSIVE ANALYSIS DATA EXPORT\n\n";
        csvContent += "Company," + companyName + "\n";
        csvContent += "Report Type," + reportType.toUpperCase() + "\n";
        csvContent += "Analyst," + role + "\n";
        csvContent += "Generated," + new Date().toLocaleDateString() + "\n";
        csvContent += "Overall TCA Score," + (((_j = data.tcaData) === null || _j === void 0 ? void 0 : _j.compositeScore) || 'N/A') + "\n\n";
        // TCA Scorecard Data
        csvContent += "TCA SCORECARD ANALYSIS\n";
        csvContent += "Category,Raw Score,Weight %,Weighted Score,Flag,Strengths,Concerns\n";
        if (data.tcaData) {
            data.tcaData.categories.forEach(function (cat) {
                csvContent += "\"" + cat.category + "\"," + cat.rawScore + "," + cat.weight + "," + ((cat.rawScore * cat.weight) / 100).toFixed(2) + ",\"" + cat.flag + "\",\"" + (cat.strengths || 'N/A') + "\",\"" + (cat.concerns || 'None') + "\"\n";
            });
        }
        csvContent += "\n";
        // Risk Analysis Data
        csvContent += "RISK ANALYSIS\n";
        csvContent += "Domain,Risk Level,Trigger,Mitigation Strategy,Priority\n";
        if (data.riskData) {
            data.riskData.riskFlags.forEach(function (risk) {
                csvContent += "\"" + risk.domain + "\",\"" + risk.flag + "\",\"" + risk.trigger + "\",\"" + (risk.mitigation || 'TBD') + "\",\"" + (risk.priority || 'High') + "\"\n";
            });
        }
        csvContent += "\n";
        // Benchmark Analysis
        if ((_k = data.benchmarkData) === null || _k === void 0 ? void 0 : _k.comparisons) {
            csvContent += "BENCHMARK COMPARISON\n";
            csvContent += "Metric,Company Value,Industry Average,Percentile,Assessment\n";
            data.benchmarkData.comparisons.forEach(function (comp) {
                csvContent += "\"" + (comp.metric || 'Metric') + "\",\"" + (comp.companyValue || 'TBD') + "\",\"" + (comp.industryAverage || 'TBD') + "\",\"" + (comp.percentile || 'TBD') + "\",\"" + (comp.assessment || 'Under Review') + "\"\n";
            });
            csvContent += "\n";
        }
        // Financial Health Data
        if (data.financialsData) {
            csvContent += "FINANCIAL HEALTH METRICS\n";
            csvContent += "Metric,Value,Status,Notes\n";
            csvContent += "\"Revenue Growth\",\"" + (data.financialsData.revenueGrowth || 'TBD') + "\",\"Under Analysis\",\"Key growth indicator\"\n";
            csvContent += "\"Monthly Burn Rate\",\"" + (data.financialsData.burnRate || 'TBD') + "\",\"Under Review\",\"Cash efficiency metric\"\n";
            csvContent += "\"Cash Runway\",\"" + (data.financialsData.runway || 'TBD') + "\",\"Critical\",\"Months of operation remaining\"\n";
            csvContent += "\"Gross Margin\",\"" + (data.financialsData.grossMargin || 'TBD') + "\",\"Important\",\"Profitability indicator\"\n";
            csvContent += "\n";
        }
        // Growth Analysis
        if ((_l = data.growthData) === null || _l === void 0 ? void 0 : _l.factors) {
            csvContent += "GROWTH POTENTIAL ANALYSIS\n";
            csvContent += "Growth Factor,Assessment,Score,Trend,Time Horizon\n";
            data.growthData.factors.forEach(function (factor) {
                csvContent += "\"" + (factor.name || 'Growth Factor') + "\",\"" + (factor.assessment || 'Positive') + "\",\"" + (factor.score || '7.5') + "\",\"" + (factor.trend || 'Increasing') + "\",\"" + (factor.timeHorizon || '12-18 months') + "\"\n";
            });
            csvContent += "\n";
        }
        // Team Assessment
        if ((_m = data.teamData) === null || _m === void 0 ? void 0 : _m.teamMembers) {
            csvContent += "TEAM ASSESSMENT\n";
            csvContent += "Name,Role,Experience,Assessment,Notes\n";
            data.teamData.teamMembers.forEach(function (member) {
                csvContent += "\"" + (member.name || 'Team Member') + "\",\"" + (member.role || 'Key Role') + "\",\"" + (member.experience || 'Experienced') + "\",\"" + (member.assessment || 'Strong') + "\",\"" + (member.notes || 'N/A') + "\"\n";
            });
            csvContent += "\n";
        }
        // Strategic Fit Analysis
        if ((_o = data.strategicFitData) === null || _o === void 0 ? void 0 : _o.factors) {
            csvContent += "STRATEGIC FIT MATRIX\n";
            csvContent += "Strategic Factor,Alignment,Impact,Priority,Assessment\n";
            data.strategicFitData.factors.forEach(function (factor) {
                csvContent += "\"" + (factor.factor || 'Strategic Element') + "\",\"" + (factor.alignment || 'Strong') + "\",\"" + (factor.impact || 'High') + "\",\"" + (factor.priority || 'Critical') + "\",\"" + (factor.assessment || 'Positive') + "\"\n";
            });
            csvContent += "\n";
        }
        // Investment Decision Summary
        csvContent += "INVESTMENT DECISION FRAMEWORK\n";
        csvContent += "Decision Factor,Assessment,Rationale\n";
        var score = ((_p = data.tcaData) === null || _p === void 0 ? void 0 : _p.compositeScore) || 0;
        csvContent += "\"Overall Recommendation\",\"" + (score >= 7 ? 'RECOMMEND' : score >= 5 ? 'CONDITIONAL' : 'DECLINE') + "\",\"Based on TCA score of " + score.toFixed(2) + "\"\n";
        csvContent += "\"Confidence Level\",\"" + (score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low') + "\",\"Analysis completeness and data quality\"\n";
        csvContent += "\"Risk Profile\",\"" + (score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk') + "\",\"Based on risk assessment matrix\"\n";
        // Download the comprehensive CSV
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        file_saver_1.saveAs(blob, companyName + "-COMPREHENSIVE-Analysis-Data.csv");
        toast({
            title: 'Comprehensive Data Export Complete',
            description: 'Full analysis data exported as CSV. Excel workbook functionality coming soon.'
        });
    };
    var handleShare = function (type) {
        var reportUrl = window.location.href.replace('/configure', '');
        var companyName = getCompanyName();
        if (type === 'link') {
            navigator.clipboard.writeText(reportUrl);
            toast({
                title: 'Report Link Copied',
                description: "Shareable link for " + companyName + " " + reportType + " report copied to clipboard."
            });
        }
        else {
            var subject = reportType.toUpperCase() + " Analysis Report: " + companyName;
            var body = "Please review the following " + reportType + " analysis report for " + companyName + ":\n\n" + reportUrl + "\n\nGenerated by: " + role + "\nDate: " + new Date().toLocaleDateString();
            window.location.href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        }
    };
    return (React.createElement(dropdown_menu_1.DropdownMenu, null,
        React.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
            React.createElement(button_1.Button, { variant: "outline", size: "sm", className: "flex items-center gap-2" },
                React.createElement(lucide_react_1.Download, { className: "size-4" }),
                "Export & Share")),
        React.createElement(dropdown_menu_1.DropdownMenuContent, { className: "w-64", align: "end" },
            React.createElement(dropdown_menu_1.DropdownMenuLabel, { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider" },
                "Quick Export (",
                reportType.toUpperCase(),
                ")"),
            React.createElement(dropdown_menu_1.DropdownMenuSeparator, null),
            React.createElement(dropdown_menu_1.DropdownMenuSub, null,
                React.createElement(dropdown_menu_1.DropdownMenuSubTrigger, { className: "flex items-center gap-3 py-2" },
                    React.createElement(lucide_react_1.StickyNote, { className: "size-4 text-muted-foreground" }),
                    React.createElement("span", null, "Two-Page Reports")),
                React.createElement(dropdown_menu_1.DropdownMenuSubContent, { className: "w-56" },
                    React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleExportTriageTwoPage, className: "flex items-center gap-3 py-2" },
                        React.createElement(lucide_react_1.FileText, { className: "size-4 text-green-600" }),
                        React.createElement("span", null, "Triage Summary (2 pages)")),
                    (role === 'admin' || role === 'reviewer') && (React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleExportDDTwoPage, className: "flex items-center gap-3 py-2" },
                        React.createElement(lucide_react_1.FileText, { className: "size-4 text-blue-600" }),
                        React.createElement("span", null, "DD Summary (2 pages)"))))),
            React.createElement(dropdown_menu_1.DropdownMenuSub, null,
                React.createElement(dropdown_menu_1.DropdownMenuSubTrigger, { className: "flex items-center gap-3 py-2" },
                    React.createElement(lucide_react_1.FileText, { className: "size-4 text-muted-foreground" }),
                    React.createElement("span", null, "Full Comprehensive Reports")),
                React.createElement(dropdown_menu_1.DropdownMenuSubContent, { className: "w-64" },
                    React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleExportFullReport, className: "flex items-center gap-3 py-2" },
                        React.createElement(lucide_react_1.FileText, { className: "size-4 text-red-600" }),
                        React.createElement("div", { className: "flex flex-col" },
                            React.createElement("span", null, "Complete Analysis PDF"),
                            React.createElement("span", { className: "text-xs text-muted-foreground" }, "20+ pages with all modules"))),
                    React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleExportDocx, className: "flex items-center gap-3 py-2" },
                        React.createElement(lucide_react_1.FileText, { className: "size-4 text-blue-600" }),
                        React.createElement("div", { className: "flex flex-col" },
                            React.createElement("span", null, "Full Word Document"),
                            React.createElement("span", { className: "text-xs text-muted-foreground" }, "Comprehensive with all sections"))),
                    React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleExportPptx, className: "flex items-center gap-3 py-2" },
                        React.createElement(lucide_react_1.Presentation, { className: "size-4 text-orange-600" }),
                        React.createElement("div", { className: "flex flex-col" },
                            React.createElement("span", null, "Full PowerPoint Deck"),
                            React.createElement("span", { className: "text-xs text-muted-foreground" }, "8+ slides with detailed analysis"))))),
            React.createElement(dropdown_menu_1.DropdownMenuSeparator, null),
            React.createElement(dropdown_menu_1.DropdownMenuLabel, { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider" }, "Complete Data & Analytics"),
            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleDownloadZip, className: "flex items-center gap-3 py-2" },
                React.createElement(lucide_react_1.FileJson, { className: "size-4 text-purple-600" }),
                React.createElement("div", { className: "flex flex-col" },
                    React.createElement("span", null, "Complete Analysis Package"),
                    React.createElement("span", { className: "text-xs text-muted-foreground" }, "ZIP with all data & modules"))),
            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: handleExportXlsx, className: "flex items-center gap-3 py-2" },
                React.createElement(lucide_react_1.FileSpreadsheet, { className: "size-4 text-green-600" }),
                React.createElement("div", { className: "flex flex-col" },
                    React.createElement("span", null, "Comprehensive Data Export"),
                    React.createElement("span", { className: "text-xs text-muted-foreground" }, "CSV with all analysis data"))),
            React.createElement(dropdown_menu_1.DropdownMenuSeparator, null),
            React.createElement(dropdown_menu_1.DropdownMenuLabel, { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider" }, "Share & Collaborate"),
            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: function () { return handleShare('link'); }, className: "flex items-center gap-3 py-2" },
                React.createElement(lucide_react_1.Share2, { className: "size-4 text-muted-foreground" }),
                React.createElement("span", null, "Copy Report Link")),
            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: function () { return handleShare('email'); }, className: "flex items-center gap-3 py-2" },
                React.createElement(lucide_react_1.Mail, { className: "size-4 text-muted-foreground" }),
                React.createElement("span", null, "Email Report")))));
}
exports.ExportButtons = ExportButtons;
