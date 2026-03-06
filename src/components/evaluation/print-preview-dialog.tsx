'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer, FileDown, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';

// Page setup configuration types
export interface PageSetupConfig {
    pageSize: 'a4' | 'letter' | 'legal';
    orientation: 'portrait' | 'landscape';
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    fontSize: {
        title: number;
        heading: number;
        body: number;
        small: number;
    };
    lineSpacing: number;
    fontFamily: 'helvetica' | 'times' | 'courier';
    includeHeader: boolean;
    includeFooter: boolean;
    includeCoverPage: boolean;
    includeTableOfContents: boolean;
    colorMode: 'color' | 'grayscale';
    headerText: string;
    footerText: string;
}

// Default page setup configuration
const defaultConfig: PageSetupConfig = {
    pageSize: 'a4',
    orientation: 'portrait',
    margins: {
        top: 25,
        right: 25,
        bottom: 25,
        left: 25,
    },
    fontSize: {
        title: 20,
        heading: 14,
        body: 10,
        small: 8,
    },
    lineSpacing: 1.5,
    fontFamily: 'helvetica',
    includeHeader: true,
    includeFooter: true,
    includeCoverPage: true,
    includeTableOfContents: true,
    colorMode: 'color',
    headerText: '',
    footerText: 'Page {page} of {pages}',
};

// Page size dimensions in mm
const pageSizes = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
    legal: { width: 215.9, height: 355.6 },
};

interface PrintPreviewDialogProps {
    data?: ComprehensiveAnalysisOutput | null;
    companyName?: string;
    reportType?: string;
    role?: string;
    trigger?: React.ReactNode;
}

export function PrintPreviewDialog({
    data,
    companyName = 'Analysis Report',
    reportType = 'triage',
    role = 'reviewer',
    trigger,
}: PrintPreviewDialogProps) {
    const { toast } = useToast();
    const [config, setConfig] = useState<PageSetupConfig>(defaultConfig);
    const [isOpen, setIsOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Generate preview PDF
    const generatePreview = useCallback(() => {
        try {
            const analysisData = data || getStoredAnalysisData();
            if (!analysisData) {
                toast({
                    variant: 'destructive',
                    title: 'No Data',
                    description: 'No analysis data available for preview.',
                });
                return;
            }

            const doc = createPDFWithConfig(analysisData, config, companyName, reportType, role);
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
        } catch (error) {
            console.error('Preview generation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Preview Failed',
                description: 'Could not generate preview.',
            });
        }
    }, [config, data, companyName, reportType, role, toast]);

    // Export PDF with current config
    const handleExport = useCallback(() => {
        try {
            const analysisData = data || getStoredAnalysisData();
            if (!analysisData) {
                toast({
                    variant: 'destructive',
                    title: 'No Data',
                    description: 'No analysis data available for export.',
                });
                return;
            }

            const doc = createPDFWithConfig(analysisData, config, companyName, reportType, role);
            const filename = `${companyName.replace(/\s+/g, '-')}-${reportType}-Report-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            toast({
                title: 'Export Successful',
                description: `Report exported as ${filename}`,
            });
            setIsOpen(false);
        } catch (error) {
            console.error('Export failed:', error);
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: 'Could not export report.',
            });
        }
    }, [config, data, companyName, reportType, role, toast]);

    // Handle print
    const handlePrint = useCallback(() => {
        if (previewUrl) {
            const printWindow = window.open(previewUrl, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        }
    }, [previewUrl]);

    // Update config helper
    const updateConfig = <K extends keyof PageSetupConfig>(
        key: K,
        value: PageSetupConfig[K]
    ) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    const updateMargin = (side: keyof PageSetupConfig['margins'], value: number) => {
        setConfig((prev) => ({
            ...prev,
            margins: { ...prev.margins, [side]: value },
        }));
    };

    const updateFontSize = (type: keyof PageSetupConfig['fontSize'], value: number) => {
        setConfig((prev) => ({
            ...prev,
            fontSize: { ...prev.fontSize, [type]: value },
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Settings2 className="size-4" />
                        Print Preview
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="size-5" />
                        Print Preview & Page Setup
                    </DialogTitle>
                    <DialogDescription>
                        Configure page layout, margins, fonts, and export settings for your report.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    {/* Left Column: Settings */}
                    <div className="space-y-6">
                        {/* Page Size & Orientation */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm">Page Layout</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="pageSize">Page Size</Label>
                                    <Select
                                        value={config.pageSize}
                                        onValueChange={(v) => updateConfig('pageSize', v as PageSetupConfig['pageSize'])}
                                    >
                                        <SelectTrigger id="pageSize">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                                            <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                                            <SelectItem value="legal">Legal (8.5 × 14 in)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orientation">Orientation</Label>
                                    <Select
                                        value={config.orientation}
                                        onValueChange={(v) => updateConfig('orientation', v as PageSetupConfig['orientation'])}
                                    >
                                        <SelectTrigger id="orientation">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="portrait">Portrait</SelectItem>
                                            <SelectItem value="landscape">Landscape</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Margins */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm">Margins (mm)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                                    <div key={side} className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label className="capitalize">{side}</Label>
                                            <span className="text-sm text-muted-foreground">{config.margins[side]}mm</span>
                                        </div>
                                        <Slider
                                            value={[config.margins[side]]}
                                            onValueChange={([v]) => updateMargin(side, v)}
                                            min={10}
                                            max={50}
                                            step={1}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Font Settings */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm">Typography</h4>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Font Family</Label>
                                    <Select
                                        value={config.fontFamily}
                                        onValueChange={(v) => updateConfig('fontFamily', v as PageSetupConfig['fontFamily'])}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="helvetica">Helvetica (Sans-serif)</SelectItem>
                                            <SelectItem value="times">Times New Roman (Serif)</SelectItem>
                                            <SelectItem value="courier">Courier (Monospace)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'title', label: 'Title', min: 16, max: 28 },
                                        { key: 'heading', label: 'Heading', min: 12, max: 20 },
                                        { key: 'body', label: 'Body', min: 8, max: 14 },
                                        { key: 'small', label: 'Small', min: 6, max: 10 },
                                    ].map(({ key, label, min, max }) => (
                                        <div key={key} className="space-y-2">
                                            <div className="flex justify-between">
                                                <Label>{label}</Label>
                                                <span className="text-sm text-muted-foreground">
                                                    {config.fontSize[key as keyof PageSetupConfig['fontSize']]}pt
                                                </span>
                                            </div>
                                            <Slider
                                                value={[config.fontSize[key as keyof PageSetupConfig['fontSize']]]}
                                                onValueChange={([v]) => updateFontSize(key as keyof PageSetupConfig['fontSize'], v)}
                                                min={min}
                                                max={max}
                                                step={1}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Line Spacing</Label>
                                        <span className="text-sm text-muted-foreground">{config.lineSpacing.toFixed(1)}</span>
                                    </div>
                                    <Slider
                                        value={[config.lineSpacing]}
                                        onValueChange={([v]) => updateConfig('lineSpacing', v)}
                                        min={1}
                                        max={2.5}
                                        step={0.1}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document Options */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm">Document Options</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="coverPage"
                                        checked={config.includeCoverPage}
                                        onCheckedChange={(checked) => updateConfig('includeCoverPage', checked as boolean)}
                                    />
                                    <Label htmlFor="coverPage">Include Cover Page</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="toc"
                                        checked={config.includeTableOfContents}
                                        onCheckedChange={(checked) => updateConfig('includeTableOfContents', checked as boolean)}
                                    />
                                    <Label htmlFor="toc">Include Table of Contents</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="header"
                                        checked={config.includeHeader}
                                        onCheckedChange={(checked) => updateConfig('includeHeader', checked as boolean)}
                                    />
                                    <Label htmlFor="header">Include Header</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="footer"
                                        checked={config.includeFooter}
                                        onCheckedChange={(checked) => updateConfig('includeFooter', checked as boolean)}
                                    />
                                    <Label htmlFor="footer">Include Page Numbers in Footer</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="colorMode"
                                        checked={config.colorMode === 'grayscale'}
                                        onCheckedChange={(checked) => updateConfig('colorMode', checked ? 'grayscale' : 'color')}
                                    />
                                    <Label htmlFor="colorMode">Grayscale (Print-optimized)</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Preview</h4>
                            <Button variant="outline" size="sm" onClick={generatePreview}>
                                Refresh Preview
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-gray-100 aspect-[0.707] flex items-center justify-center">
                            {previewUrl ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <Printer className="size-12 mx-auto mb-3 opacity-50" />
                                    <p>Click &quot;Refresh Preview&quot; to generate a preview</p>
                                    <p className="text-sm">with your current settings</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
                        Reset to Defaults
                    </Button>
                    <Button variant="outline" onClick={handlePrint} disabled={!previewUrl}>
                        <Printer className="size-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={handleExport}>
                        <FileDown className="size-4 mr-2" />
                        Export PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper function to get stored analysis data
function getStoredAnalysisData(): ComprehensiveAnalysisOutput | null {
    try {
        const storedData = localStorage.getItem('analysisResult');
        if (!storedData) return null;
        return JSON.parse(storedData);
    } catch {
        return null;
    }
}

// Create PDF with configuration
function createPDFWithConfig(
    data: ComprehensiveAnalysisOutput,
    config: PageSetupConfig,
    companyName: string,
    reportType: string,
    role: string
): jsPDF {
    const pageSize = pageSizes[config.pageSize];
    const isLandscape = config.orientation === 'landscape';

    const doc = new jsPDF({
        orientation: config.orientation,
        unit: 'mm',
        format: config.pageSize,
    });

    doc.setFont(config.fontFamily);

    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;
    const contentWidth = pageWidth - config.margins.left - config.margins.right;
    const startX = config.margins.left;
    let currentY = config.margins.top;

    // Helper: Add header to page
    const addHeader = () => {
        if (config.includeHeader) {
            doc.setFontSize(config.fontSize.small);
            doc.setTextColor(128, 128, 128);
            const headerText = config.headerText || `${companyName} - ${reportType.toUpperCase()} Report`;
            doc.text(headerText, startX, 10);
            doc.line(startX, 12, pageWidth - config.margins.right, 12);
            doc.setTextColor(0, 0, 0);
        }
    };

    // Helper: Add footer to page
    const addFooter = (pageNum: number, totalPages: number) => {
        if (config.includeFooter) {
            doc.setFontSize(config.fontSize.small);
            doc.setTextColor(128, 128, 128);
            const footerText = config.footerText
                .replace('{page}', String(pageNum))
                .replace('{pages}', String(totalPages));
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(new Date().toLocaleDateString(), pageWidth - config.margins.right, pageHeight - 10, { align: 'right' });
            doc.setTextColor(0, 0, 0);
        }
    };

    // Helper: Check page break
    const checkPageBreak = (neededSpace: number) => {
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
        doc.text(`Report Type: ${reportType.toUpperCase()}`, pageWidth / 2, pageHeight / 3 + 40, { align: 'center' });

        doc.setFontSize(config.fontSize.body);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight / 3 + 55, { align: 'center' });
        doc.text(`Analyst: ${role}`, pageWidth / 2, pageHeight / 3 + 65, { align: 'center' });

        // Score box
        if (data.tcaData) {
            const score = data.tcaData.compositeScore;
            const rating = score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK';

            doc.setDrawColor(0, 0, 0);
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(startX + 30, pageHeight / 2 + 20, contentWidth - 60, 50, 3, 3, 'DF');

            doc.setFontSize(config.fontSize.heading);
            doc.text('INVESTMENT SCORE', pageWidth / 2, pageHeight / 2 + 38, { align: 'center' });
            doc.setFontSize(config.fontSize.title);
            doc.text(`${score.toFixed(2)}/10 (${rating})`, pageWidth / 2, pageHeight / 2 + 55, { align: 'center' });
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
        const tocItems = [
            '1. Executive Summary',
            '2. TCA Scorecard Analysis',
            '3. Risk Assessment & Mitigation',
            '4. Market & Competitive Analysis',
            '5. Financial Health',
            '6. Investment Recommendation',
        ];

        tocItems.forEach((item) => {
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
        const score = data.tcaData.compositeScore;
        doc.text(`Overall TCA Score: ${score.toFixed(2)}/10`, startX, currentY);
        currentY += config.fontSize.body * config.lineSpacing * 0.5;

        const summaryLines = doc.splitTextToSize(data.tcaData.summary || '', contentWidth);
        doc.text(summaryLines, startX, currentY);
        currentY += summaryLines.length * config.fontSize.body * config.lineSpacing * 0.4 + 10;
    }

    // TCA Scorecard
    checkPageBreak(80);
    doc.setFontSize(config.fontSize.title);
    doc.text('2. TCA SCORECARD ANALYSIS', startX, currentY);
    currentY += 15;

    if (data.tcaData) {
        const tableData = data.tcaData.categories.map((c) => [
            c.category,
            c.rawScore.toString(),
            `${c.weight}%`,
            ((c.rawScore * c.weight) / 100).toFixed(2),
            c.flag.toUpperCase(),
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Category', 'Score', 'Weight', 'Weighted', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [41, 128, 185],
                textColor: 255,
                fontSize: config.fontSize.body,
            },
            styles: {
                fontSize: config.fontSize.body - 1,
                cellPadding: 3,
            },
            margin: { left: startX, right: config.margins.right },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Risk Assessment
    checkPageBreak(80);
    doc.setFontSize(config.fontSize.title);
    doc.text('3. RISK ASSESSMENT', startX, currentY);
    currentY += 15;

    if (data.riskData) {
        const riskTableData = data.riskData.riskFlags.map((r) => [
            r.domain,
            r.flag.toUpperCase(),
            r.trigger.substring(0, 50) + (r.trigger.length > 50 ? '...' : ''),
            (r.mitigation || 'TBD').substring(0, 40) + ((r.mitigation?.length || 0) > 40 ? '...' : ''),
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Domain', 'Level', 'Trigger', 'Mitigation']],
            body: riskTableData,
            theme: 'grid',
            headStyles: {
                fillColor: config.colorMode === 'grayscale' ? [80, 80, 80] : [192, 57, 43],
                textColor: 255,
                fontSize: config.fontSize.body,
            },
            styles: {
                fontSize: config.fontSize.body - 1,
                cellPadding: 2,
            },
            margin: { left: startX, right: config.margins.right },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Investment Recommendation
    checkPageBreak(60);
    doc.setFontSize(config.fontSize.title);
    doc.text('4. INVESTMENT RECOMMENDATION', startX, currentY);
    currentY += 15;

    if (data.tcaData) {
        const score = data.tcaData.compositeScore;
        const recommendation = score >= 7 ? 'RECOMMEND: Proceed to Due Diligence' :
            score >= 5 ? 'CONDITIONAL: Address concerns and reassess' :
                'DECLINE: Significant risks identified';

        doc.setFontSize(config.fontSize.heading);
        doc.text(recommendation, startX, currentY);
        currentY += config.fontSize.heading * config.lineSpacing * 0.6;

        doc.setFontSize(config.fontSize.body);
        doc.text(`Confidence Level: ${score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low'}`, startX, currentY);
        currentY += config.fontSize.body * config.lineSpacing * 0.5;
        doc.text(`Risk Profile: ${score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk'}`, startX, currentY);
    }

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
    }

    return doc;
}

export { type PageSetupConfig, defaultConfig, pageSizes };
