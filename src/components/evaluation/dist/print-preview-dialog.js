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
exports.pageSizes = exports.defaultConfig = exports.type = exports.PrintPreviewDialog = void 0;
var React = require("react");
var react_1 = require("react");
var dialog_1 = require("@/components/ui/dialog");
var button_1 = require("@/components/ui/button");
var label_1 = require("@/components/ui/label");
var slider_1 = require("@/components/ui/slider");
var select_1 = require("@/components/ui/select");
var checkbox_1 = require("@/components/ui/checkbox");
var lucide_react_1 = require("lucide-react");
var use_toast_1 = require("@/hooks/use-toast");
var jspdf_1 = require("jspdf");
var jspdf_autotable_1 = require("jspdf-autotable");
// Default page setup configuration
var defaultConfig = {
    pageSize: 'a4',
    orientation: 'portrait',
    margins: {
        top: 25,
        right: 25,
        bottom: 25,
        left: 25
    },
    fontSize: {
        title: 20,
        heading: 14,
        body: 10,
        small: 8
    },
    lineSpacing: 1.5,
    fontFamily: 'helvetica',
    includeHeader: true,
    includeFooter: true,
    includeCoverPage: true,
    includeTableOfContents: true,
    colorMode: 'color',
    headerText: '',
    footerText: 'Page {page} of {pages}'
};
exports.defaultConfig = defaultConfig;
// Page size dimensions in mm
var pageSizes = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
    legal: { width: 215.9, height: 355.6 }
};
exports.pageSizes = pageSizes;
function PrintPreviewDialog(_a) {
    var data = _a.data, _b = _a.companyName, companyName = _b === void 0 ? 'Analysis Report' : _b, _c = _a.reportType, reportType = _c === void 0 ? 'triage' : _c, _d = _a.role, role = _d === void 0 ? 'reviewer' : _d, trigger = _a.trigger;
    var toast = use_toast_1.useToast().toast;
    var _e = react_1.useState(defaultConfig), config = _e[0], setConfig = _e[1];
    var _f = react_1.useState(false), isOpen = _f[0], setIsOpen = _f[1];
    var _g = react_1.useState(null), previewUrl = _g[0], setPreviewUrl = _g[1];
    // Generate preview PDF
    var generatePreview = react_1.useCallback(function () {
        try {
            var analysisData = data || getStoredAnalysisData();
            if (!analysisData) {
                toast({
                    variant: 'destructive',
                    title: 'No Data',
                    description: 'No analysis data available for preview.'
                });
                return;
            }
            var doc = createPDFWithConfig(analysisData, config, companyName, reportType, role);
            var pdfBlob = doc.output('blob');
            var url = URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
        }
        catch (error) {
            console.error('Preview generation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Preview Failed',
                description: 'Could not generate preview.'
            });
        }
    }, [config, data, companyName, reportType, role, toast]);
    // Export PDF with current config
    var handleExport = react_1.useCallback(function () {
        try {
            var analysisData = data || getStoredAnalysisData();
            if (!analysisData) {
                toast({
                    variant: 'destructive',
                    title: 'No Data',
                    description: 'No analysis data available for export.'
                });
                return;
            }
            var doc = createPDFWithConfig(analysisData, config, companyName, reportType, role);
            var filename = companyName.replace(/\s+/g, '-') + "-" + reportType + "-Report-" + new Date().toISOString().split('T')[0] + ".pdf";
            doc.save(filename);
            toast({
                title: 'Export Successful',
                description: "Report exported as " + filename
            });
            setIsOpen(false);
        }
        catch (error) {
            console.error('Export failed:', error);
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: 'Could not export report.'
            });
        }
    }, [config, data, companyName, reportType, role, toast]);
    // Handle print
    var handlePrint = react_1.useCallback(function () {
        if (previewUrl) {
            var printWindow_1 = window.open(previewUrl, '_blank');
            if (printWindow_1) {
                printWindow_1.onload = function () {
                    printWindow_1.print();
                };
            }
        }
    }, [previewUrl]);
    // Update config helper
    var updateConfig = function (key, value) {
        setConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    };
    var updateMargin = function (side, value) {
        setConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { margins: __assign(__assign({}, prev.margins), (_a = {}, _a[side] = value, _a)) }));
        });
    };
    var updateFontSize = function (type, value) {
        setConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { fontSize: __assign(__assign({}, prev.fontSize), (_a = {}, _a[type] = value, _a)) }));
        });
    };
    return (React.createElement(dialog_1.Dialog, { open: isOpen, onOpenChange: setIsOpen },
        React.createElement(dialog_1.DialogTrigger, { asChild: true }, trigger || (React.createElement(button_1.Button, { variant: "outline", size: "sm", className: "flex items-center gap-2" },
            React.createElement(lucide_react_1.Settings2, { className: "size-4" }),
            "Print Preview"))),
        React.createElement(dialog_1.DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto" },
            React.createElement(dialog_1.DialogHeader, null,
                React.createElement(dialog_1.DialogTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.Printer, { className: "size-5" }),
                    "Print Preview & Page Setup"),
                React.createElement(dialog_1.DialogDescription, null, "Configure page layout, margins, fonts, and export settings for your report.")),
            React.createElement("div", { className: "grid grid-cols-2 gap-6 py-4" },
                React.createElement("div", { className: "space-y-6" },
                    React.createElement("div", { className: "space-y-3" },
                        React.createElement("h4", { className: "font-medium text-sm" }, "Page Layout"),
                        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "pageSize" }, "Page Size"),
                                React.createElement(select_1.Select, { value: config.pageSize, onValueChange: function (v) { return updateConfig('pageSize', v); } },
                                    React.createElement(select_1.SelectTrigger, { id: "pageSize" },
                                        React.createElement(select_1.SelectValue, null)),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "a4" }, "A4 (210 \u00D7 297 mm)"),
                                        React.createElement(select_1.SelectItem, { value: "letter" }, "Letter (8.5 \u00D7 11 in)"),
                                        React.createElement(select_1.SelectItem, { value: "legal" }, "Legal (8.5 \u00D7 14 in)")))),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "orientation" }, "Orientation"),
                                React.createElement(select_1.Select, { value: config.orientation, onValueChange: function (v) { return updateConfig('orientation', v); } },
                                    React.createElement(select_1.SelectTrigger, { id: "orientation" },
                                        React.createElement(select_1.SelectValue, null)),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "portrait" }, "Portrait"),
                                        React.createElement(select_1.SelectItem, { value: "landscape" }, "Landscape")))))),
                    React.createElement("div", { className: "space-y-3" },
                        React.createElement("h4", { className: "font-medium text-sm" }, "Margins (mm)"),
                        React.createElement("div", { className: "grid grid-cols-2 gap-4" }, ['top', 'right', 'bottom', 'left'].map(function (side) { return (React.createElement("div", { key: side, className: "space-y-2" },
                            React.createElement("div", { className: "flex justify-between" },
                                React.createElement(label_1.Label, { className: "capitalize" }, side),
                                React.createElement("span", { className: "text-sm text-muted-foreground" },
                                    config.margins[side],
                                    "mm")),
                            React.createElement(slider_1.Slider, { value: [config.margins[side]], onValueChange: function (_a) {
                                    var v = _a[0];
                                    return updateMargin(side, v);
                                }, min: 10, max: 50, step: 1 }))); }))),
                    React.createElement("div", { className: "space-y-3" },
                        React.createElement("h4", { className: "font-medium text-sm" }, "Typography"),
                        React.createElement("div", { className: "space-y-3" },
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, null, "Font Family"),
                                React.createElement(select_1.Select, { value: config.fontFamily, onValueChange: function (v) { return updateConfig('fontFamily', v); } },
                                    React.createElement(select_1.SelectTrigger, null,
                                        React.createElement(select_1.SelectValue, null)),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "helvetica" }, "Helvetica (Sans-serif)"),
                                        React.createElement(select_1.SelectItem, { value: "times" }, "Times New Roman (Serif)"),
                                        React.createElement(select_1.SelectItem, { value: "courier" }, "Courier (Monospace)")))),
                            React.createElement("div", { className: "grid grid-cols-2 gap-3" }, [
                                { key: 'title', label: 'Title', min: 16, max: 28 },
                                { key: 'heading', label: 'Heading', min: 12, max: 20 },
                                { key: 'body', label: 'Body', min: 8, max: 14 },
                                { key: 'small', label: 'Small', min: 6, max: 10 },
                            ].map(function (_a) {
                                var key = _a.key, label = _a.label, min = _a.min, max = _a.max;
                                return (React.createElement("div", { key: key, className: "space-y-2" },
                                    React.createElement("div", { className: "flex justify-between" },
                                        React.createElement(label_1.Label, null, label),
                                        React.createElement("span", { className: "text-sm text-muted-foreground" },
                                            config.fontSize[key],
                                            "pt")),
                                    React.createElement(slider_1.Slider, { value: [config.fontSize[key]], onValueChange: function (_a) {
                                            var v = _a[0];
                                            return updateFontSize(key, v);
                                        }, min: min, max: max, step: 1 })));
                            })),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement("div", { className: "flex justify-between" },
                                    React.createElement(label_1.Label, null, "Line Spacing"),
                                    React.createElement("span", { className: "text-sm text-muted-foreground" }, config.lineSpacing.toFixed(1))),
                                React.createElement(slider_1.Slider, { value: [config.lineSpacing], onValueChange: function (_a) {
                                        var v = _a[0];
                                        return updateConfig('lineSpacing', v);
                                    }, min: 1, max: 2.5, step: 0.1 })))),
                    React.createElement("div", { className: "space-y-3" },
                        React.createElement("h4", { className: "font-medium text-sm" }, "Document Options"),
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement(checkbox_1.Checkbox, { id: "coverPage", checked: config.includeCoverPage, onCheckedChange: function (checked) { return updateConfig('includeCoverPage', checked); } }),
                                React.createElement(label_1.Label, { htmlFor: "coverPage" }, "Include Cover Page")),
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement(checkbox_1.Checkbox, { id: "toc", checked: config.includeTableOfContents, onCheckedChange: function (checked) { return updateConfig('includeTableOfContents', checked); } }),
                                React.createElement(label_1.Label, { htmlFor: "toc" }, "Include Table of Contents")),
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement(checkbox_1.Checkbox, { id: "header", checked: config.includeHeader, onCheckedChange: function (checked) { return updateConfig('includeHeader', checked); } }),
                                React.createElement(label_1.Label, { htmlFor: "header" }, "Include Header")),
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement(checkbox_1.Checkbox, { id: "footer", checked: config.includeFooter, onCheckedChange: function (checked) { return updateConfig('includeFooter', checked); } }),
                                React.createElement(label_1.Label, { htmlFor: "footer" }, "Include Page Numbers in Footer")),
                            React.createElement("div", { className: "flex items-center space-x-2" },
                                React.createElement(checkbox_1.Checkbox, { id: "colorMode", checked: config.colorMode === 'grayscale', onCheckedChange: function (checked) { return updateConfig('colorMode', checked ? 'grayscale' : 'color'); } }),
                                React.createElement(label_1.Label, { htmlFor: "colorMode" }, "Grayscale (Print-optimized)"))))),
                React.createElement("div", { className: "space-y-3" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("h4", { className: "font-medium text-sm" }, "Preview"),
                        React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: generatePreview }, "Refresh Preview")),
                    React.createElement("div", { className: "border rounded-lg overflow-hidden bg-gray-100 aspect-[0.707] flex items-center justify-center" }, previewUrl ? (React.createElement("iframe", { src: previewUrl, className: "w-full h-full", title: "PDF Preview" })) : (React.createElement("div", { className: "text-center text-muted-foreground p-4" },
                        React.createElement(lucide_react_1.Printer, { className: "size-12 mx-auto mb-3 opacity-50" }),
                        React.createElement("p", null, "Click \"Refresh Preview\" to generate a preview"),
                        React.createElement("p", { className: "text-sm" }, "with your current settings")))))),
            React.createElement(dialog_1.DialogFooter, { className: "gap-2" },
                React.createElement(button_1.Button, { variant: "outline", onClick: function () { return setConfig(defaultConfig); } }, "Reset to Defaults"),
                React.createElement(button_1.Button, { variant: "outline", onClick: handlePrint, disabled: !previewUrl },
                    React.createElement(lucide_react_1.Printer, { className: "size-4 mr-2" }),
                    "Print"),
                React.createElement(button_1.Button, { onClick: handleExport },
                    React.createElement(lucide_react_1.FileDown, { className: "size-4 mr-2" }),
                    "Export PDF")))));
}
exports.PrintPreviewDialog = PrintPreviewDialog;
// Helper function to get stored analysis data
function getStoredAnalysisData() {
    try {
        var storedData = localStorage.getItem('analysisResult');
        if (!storedData)
            return null;
        return JSON.parse(storedData);
    }
    catch (_a) {
        return null;
    }
}
// Create PDF with configuration
function createPDFWithConfig(data, config, companyName, reportType, role) {
    var pageSize = pageSizes[config.pageSize];
    var isLandscape = config.orientation === 'landscape';
    var doc = new jspdf_1["default"]({
        orientation: config.orientation,
        unit: 'mm',
        format: config.pageSize
    });
    doc.setFont(config.fontFamily);
    var pageWidth = isLandscape ? pageSize.height : pageSize.width;
    var pageHeight = isLandscape ? pageSize.width : pageSize.height;
    var contentWidth = pageWidth - config.margins.left - config.margins.right;
    var startX = config.margins.left;
    var currentY = config.margins.top;
    // Helper: Add header to page
    var addHeader = function () {
        if (config.includeHeader) {
            doc.setFontSize(config.fontSize.small);
            doc.setTextColor(128, 128, 128);
            var headerText = config.headerText || companyName + " - " + reportType.toUpperCase() + " Report";
            doc.text(headerText, startX, 10);
            doc.line(startX, 12, pageWidth - config.margins.right, 12);
            doc.setTextColor(0, 0, 0);
        }
    };
    // Helper: Add footer to page
    var addFooter = function (pageNum, totalPages) {
        if (config.includeFooter) {
            doc.setFontSize(config.fontSize.small);
            doc.setTextColor(128, 128, 128);
            var footerText = config.footerText
                .replace('{page}', String(pageNum))
                .replace('{pages}', String(totalPages));
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(new Date().toLocaleDateString(), pageWidth - config.margins.right, pageHeight - 10, { align: 'right' });
            doc.setTextColor(0, 0, 0);
        }
    };
    // Helper: Check page break
    var checkPageBreak = function (neededSpace) {
        if (currentY + neededSpace > pageHeight - config.margins.bottom) {
            doc.addPage();
            currentY = config.margins.top;
            addHeader();
            return true;
        }
        return false;
    };
    // Cover Page
    if (config.includeCoverPage) {
        doc.setFontSize(config.fontSize.title + 4);
        doc.text('COMPREHENSIVE ANALYSIS REPORT', pageWidth / 2, pageHeight / 3, { align: 'center' });
        doc.setFontSize(config.fontSize.title);
        doc.text(companyName, pageWidth / 2, pageHeight / 3 + 20, { align: 'center' });
        doc.setFontSize(config.fontSize.heading);
        doc.text("Report Type: " + reportType.toUpperCase(), pageWidth / 2, pageHeight / 3 + 40, { align: 'center' });
        doc.setFontSize(config.fontSize.body);
        doc.text("Generated: " + new Date().toLocaleDateString(), pageWidth / 2, pageHeight / 3 + 55, { align: 'center' });
        doc.text("Analyst: " + role, pageWidth / 2, pageHeight / 3 + 65, { align: 'center' });
        // Score box
        if (data.tcaData) {
            var score = data.tcaData.compositeScore;
            var rating = score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK';
            doc.setDrawColor(0, 0, 0);
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(startX + 30, pageHeight / 2 + 20, contentWidth - 60, 50, 3, 3, 'DF');
            doc.setFontSize(config.fontSize.heading);
            doc.text('INVESTMENT SCORE', pageWidth / 2, pageHeight / 2 + 38, { align: 'center' });
            doc.setFontSize(config.fontSize.title);
            doc.text(score.toFixed(2) + "/10 (" + rating + ")", pageWidth / 2, pageHeight / 2 + 55, { align: 'center' });
        }
        doc.addPage();
        currentY = config.margins.top;
    }
    addHeader();
    // Table of Contents
    if (config.includeTableOfContents) {
        doc.setFontSize(config.fontSize.title);
        doc.text('TABLE OF CONTENTS', startX, currentY);
        currentY += config.fontSize.title * 0.5;
        doc.line(startX, currentY, startX + 60, currentY);
        currentY += 10;
        doc.setFontSize(config.fontSize.body);
        var tocItems = [
            '1. Executive Summary',
            '2. TCA Scorecard Analysis',
            '3. Risk Assessment & Mitigation',
            '4. Market & Competitive Analysis',
            '5. Financial Health',
            '6. Investment Recommendation',
        ];
        tocItems.forEach(function (item) {
            doc.text(item, startX, currentY);
            currentY += config.fontSize.body * config.lineSpacing * 0.5;
        });
        doc.addPage();
        currentY = config.margins.top;
        addHeader();
    }
    // Executive Summary
    doc.setFontSize(config.fontSize.title);
    doc.text('1. EXECUTIVE SUMMARY', startX, currentY);
    currentY += config.fontSize.title * 0.5;
    doc.line(startX, currentY, startX + 80, currentY);
    currentY += 10;
    if (data.tcaData) {
        doc.setFontSize(config.fontSize.body);
        var score = data.tcaData.compositeScore;
        doc.text("Overall TCA Score: " + score.toFixed(2) + "/10", startX, currentY);
        currentY += config.fontSize.body * config.lineSpacing * 0.5;
        var summaryLines = doc.splitTextToSize(data.tcaData.summary || '', contentWidth);
        doc.text(summaryLines, startX, currentY);
        currentY += summaryLines.length * config.fontSize.body * config.lineSpacing * 0.4 + 10;
    }
    // TCA Scorecard
    checkPageBreak(80);
    doc.setFontSize(config.fontSize.title);
    doc.text('2. TCA SCORECARD ANALYSIS', startX, currentY);
    currentY += 15;
    if (data.tcaData) {
        var tableData = data.tcaData.categories.map(function (c) { return [
            c.category,
            c.rawScore.toString(),
            c.weight + "%",
            ((c.rawScore * c.weight) / 100).toFixed(2),
            c.flag.toUpperCase(),
        ]; });
        jspdf_autotable_1["default"](doc, {
            startY: currentY,
            head: [['Category', 'Score', 'Weight', 'Weighted', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [41, 128, 185],
                textColor: 255,
                fontSize: config.fontSize.body
            },
            styles: {
                fontSize: config.fontSize.body - 1,
                cellPadding: 3
            },
            margin: { left: startX, right: config.margins.right }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }
    // Risk Assessment
    checkPageBreak(80);
    doc.setFontSize(config.fontSize.title);
    doc.text('3. RISK ASSESSMENT', startX, currentY);
    currentY += 15;
    if (data.riskData) {
        var riskTableData = data.riskData.riskFlags.map(function (r) {
            var _a;
            return [
                r.domain,
                r.flag.toUpperCase(),
                r.trigger.substring(0, 50) + (r.trigger.length > 50 ? '...' : ''),
                (r.mitigation || 'TBD').substring(0, 40) + ((((_a = r.mitigation) === null || _a === void 0 ? void 0 : _a.length) || 0) > 40 ? '...' : ''),
            ];
        });
        jspdf_autotable_1["default"](doc, {
            startY: currentY,
            head: [['Domain', 'Level', 'Trigger', 'Mitigation']],
            body: riskTableData,
            theme: 'grid',
            headStyles: {
                fillColor: config.colorMode === 'grayscale' ? [80, 80, 80] : [192, 57, 43],
                textColor: 255,
                fontSize: config.fontSize.body
            },
            styles: {
                fontSize: config.fontSize.body - 1,
                cellPadding: 2
            },
            margin: { left: startX, right: config.margins.right }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }
    // Investment Recommendation
    checkPageBreak(60);
    doc.setFontSize(config.fontSize.title);
    doc.text('4. INVESTMENT RECOMMENDATION', startX, currentY);
    currentY += 15;
    if (data.tcaData) {
        var score = data.tcaData.compositeScore;
        var recommendation = score >= 7 ? 'RECOMMEND: Proceed to Due Diligence' :
            score >= 5 ? 'CONDITIONAL: Address concerns and reassess' :
                'DECLINE: Significant risks identified';
        doc.setFontSize(config.fontSize.heading);
        doc.text(recommendation, startX, currentY);
        currentY += config.fontSize.heading * config.lineSpacing * 0.6;
        doc.setFontSize(config.fontSize.body);
        doc.text("Confidence Level: " + (score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low'), startX, currentY);
        currentY += config.fontSize.body * config.lineSpacing * 0.5;
        doc.text("Risk Profile: " + (score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk'), startX, currentY);
    }
    // Add footers to all pages
    var totalPages = doc.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
    }
    return doc;
}
