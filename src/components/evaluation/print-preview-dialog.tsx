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
    role = 'analyst',
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

// Create PDF with configuration - Comprehensive version matching all UI sections
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
    let sectionNumber = 1;

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

    // Helper: Add section title
    const addSectionTitle = (title: string) => {
        checkPageBreak(30);
        doc.setFontSize(config.fontSize.title);
        doc.setTextColor(0, 0, 0);
        doc.text(`${sectionNumber}. ${title}`, startX, currentY);
        currentY += config.fontSize.title * 0.5;
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(startX, currentY, startX + 80, currentY);
        currentY += 10;
        sectionNumber++;
    };

    // Helper: Add subsection title
    const addSubsectionTitle = (title: string) => {
        checkPageBreak(20);
        doc.setFontSize(config.fontSize.heading);
        doc.setTextColor(60, 60, 60);
        doc.text(title, startX, currentY);
        currentY += 8;
    };

    // Helper: Add paragraph text
    const addParagraph = (text: string, indent: number = 0) => {
        if (!text) return;
        doc.setFontSize(config.fontSize.body);
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        checkPageBreak(lines.length * config.fontSize.body * 0.5);
        doc.text(lines, startX + indent, currentY);
        currentY += lines.length * config.fontSize.body * config.lineSpacing * 0.4 + 5;
    };

    // Helper: Get flag color
    const getFlagColor = (flag: string): [number, number, number] => {
        if (config.colorMode === 'grayscale') {
            return flag === 'green' ? [100, 100, 100] : flag === 'yellow' ? [150, 150, 150] : [50, 50, 50];
        }
        return flag === 'green' ? [39, 174, 96] : flag === 'yellow' ? [241, 196, 15] : [231, 76, 60];
    };

    // Cover Page
    if (config.includeCoverPage) {
        doc.setFontSize(config.fontSize.title + 6);
        doc.setTextColor(41, 128, 185);
        doc.text('COMPREHENSIVE ANALYSIS REPORT', pageWidth / 2, pageHeight / 4, { align: 'center' });

        doc.setFontSize(config.fontSize.title + 2);
        doc.setTextColor(0, 0, 0);
        doc.text(companyName, pageWidth / 2, pageHeight / 4 + 20, { align: 'center' });

        doc.setFontSize(config.fontSize.heading);
        doc.setTextColor(100, 100, 100);
        doc.text(`Report Type: ${reportType.toUpperCase()} ${reportType === 'dd' ? '(Due Diligence)' : '(Triage)'}`, pageWidth / 2, pageHeight / 4 + 35, { align: 'center' });

        doc.setFontSize(config.fontSize.body);
        doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, pageHeight / 4 + 50, { align: 'center' });
        doc.text(`Prepared by: ${role.charAt(0).toUpperCase() + role.slice(1)}`, pageWidth / 2, pageHeight / 4 + 60, { align: 'center' });

        // Score box
        if (data.tcaData) {
            const score = data.tcaData.compositeScore;
            const rating = score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK';
            const scoreColor = score >= 7 ? [39, 174, 96] : score >= 5 ? [241, 196, 15] : [231, 76, 60];

            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(startX + 40, pageHeight / 2, contentWidth - 80, 60, 5, 5, 'DF');

            doc.setFontSize(config.fontSize.heading);
            doc.setTextColor(100, 100, 100);
            doc.text('INVESTMENT READINESS SCORE', pageWidth / 2, pageHeight / 2 + 18, { align: 'center' });

            doc.setFontSize(config.fontSize.title + 8);
            doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
            doc.text(`${score.toFixed(2)}/10`, pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });

            doc.setFontSize(config.fontSize.heading);
            doc.text(rating, pageWidth / 2, pageHeight / 2 + 52, { align: 'center' });

            // Risk flags summary
            if (data.riskData?.riskFlags) {
                const redFlags = data.riskData.riskFlags.filter(r => r.flag === 'red').length;
                const yellowFlags = data.riskData.riskFlags.filter(r => r.flag === 'yellow').length;
                const greenFlags = data.riskData.riskFlags.filter(r => r.flag === 'green').length;

                doc.setFontSize(config.fontSize.small);
                doc.setTextColor(100, 100, 100);
                doc.text(`Risk Flags: ${redFlags} Red | ${yellowFlags} Yellow | ${greenFlags} Green`, pageWidth / 2, pageHeight / 2 + 70, { align: 'center' });
            }
        }

        doc.addPage();
        currentY = config.margins.top;
    }

    addHeader();

    // Table of Contents
    if (config.includeTableOfContents) {
        doc.setFontSize(config.fontSize.title);
        doc.setTextColor(0, 0, 0);
        doc.text('TABLE OF CONTENTS', startX, currentY);
        currentY += config.fontSize.title * 0.5;
        doc.setDrawColor(41, 128, 185);
        doc.line(startX, currentY, startX + 60, currentY);
        currentY += 12;

        doc.setFontSize(config.fontSize.body);
        const tocItems = [
            '1. Executive Summary',
            '2. TCA Scorecard Analysis',
            '3. TCA AI Analysis & Interpretation',
            '4. Weighted Score Breakdown',
            '5. Risk Assessment & Mitigation',
            '6. Gap Analysis & Roadmap',
            '7. Macro Trend Alignment (PESTEL)',
            '8. Benchmark Comparison',
            '9. Growth Analysis',
            '10. Funder Fit Analysis',
            '11. Team Assessment',
            '12. Investment Recommendation',
        ];

        tocItems.forEach((item, index) => {
            doc.text(item, startX, currentY);
            // Add dotted line to page number placeholder
            doc.setDrawColor(200, 200, 200);
            // Draw short line segments to simulate dashed effect
            for (let x = startX + 70; x < pageWidth - config.margins.right - 20; x += 4) {
                doc.line(x, currentY - 1, x + 2, currentY - 1);
            }
            currentY += config.fontSize.body * config.lineSpacing * 0.6;
        });

        doc.addPage();
        currentY = config.margins.top;
        addHeader();
    }

    // 1. Executive Summary
    addSectionTitle('EXECUTIVE SUMMARY');

    if (data.tcaData) {
        const score = data.tcaData.compositeScore;
        const rating = score >= 8 ? 'Excellent' : score >= 7 ? 'Strong' : score >= 6 ? 'Good' : score >= 5 ? 'Moderate' : 'Weak';

        // Quick metrics box
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(startX, currentY, contentWidth, 25, 3, 3, 'F');
        doc.setFontSize(config.fontSize.body);
        doc.setTextColor(0, 0, 0);
        doc.text(`Overall Score: ${score.toFixed(2)}/10 (${rating})`, startX + 5, currentY + 10);

        const greenCount = data.tcaData.categories.filter(c => c.flag === 'green').length;
        const yellowCount = data.tcaData.categories.filter(c => c.flag === 'yellow').length;
        const redCount = data.tcaData.categories.filter(c => c.flag === 'red').length;
        doc.text(`Categories: ${greenCount} Green | ${yellowCount} Yellow | ${redCount} Red`, startX + 5, currentY + 18);
        currentY += 35;

        addParagraph(data.tcaData.summary || 'No summary available.');
    }

    // 2. TCA Scorecard Analysis
    addSectionTitle('TCA SCORECARD ANALYSIS');

    if (data.tcaData) {
        // Main scorecard table
        const tableData = data.tcaData.categories.map((c) => [
            c.category,
            c.rawScore.toFixed(1),
            `${c.weight}%`,
            c.weightedScore.toFixed(2),
            c.flag.toUpperCase(),
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Category', 'Raw Score', 'Weight', 'Weighted Score', 'Flag']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [41, 128, 185],
                textColor: 255,
                fontSize: config.fontSize.body,
                fontStyle: 'bold',
            },
            styles: {
                fontSize: config.fontSize.body - 1,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 45 },
                4: { cellWidth: 20, halign: 'center' },
            },
            didParseCell: function (hookData) {
                if (hookData.section === 'body' && hookData.column.index === 4) {
                    const flag = hookData.cell.raw?.toString().toLowerCase();
                    if (flag === 'green') hookData.cell.styles.fillColor = [39, 174, 96];
                    else if (flag === 'yellow') hookData.cell.styles.fillColor = [241, 196, 15];
                    else if (flag === 'red') hookData.cell.styles.fillColor = [231, 76, 60];
                    hookData.cell.styles.textColor = 255;
                }
            },
            margin: { left: startX, right: config.margins.right },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Composite score summary
        doc.setFillColor(41, 128, 185);
        doc.roundedRect(startX, currentY, contentWidth, 12, 2, 2, 'F');
        doc.setFontSize(config.fontSize.body);
        doc.setTextColor(255, 255, 255);
        doc.text(`COMPOSITE SCORE: ${data.tcaData.compositeScore.toFixed(2)} / 10.00`, startX + 5, currentY + 8);
        doc.setTextColor(0, 0, 0);
        currentY += 20;
    }

    // 3. TCA AI Analysis & Interpretation
    addSectionTitle('TCA AI ANALYSIS & INTERPRETATION');

    if (data.tcaData?.categories) {
        data.tcaData.categories.forEach((category, index) => {
            checkPageBreak(60);

            // Category header with flag indicator
            const flagColor = getFlagColor(category.flag);
            doc.setFillColor(flagColor[0], flagColor[1], flagColor[2]);
            doc.roundedRect(startX, currentY, 4, 20, 1, 1, 'F');

            doc.setFontSize(config.fontSize.heading);
            doc.setTextColor(0, 0, 0);
            doc.text(`${category.category} (Score: ${category.rawScore.toFixed(1)}/10)`, startX + 8, currentY + 6);

            doc.setFontSize(config.fontSize.small);
            doc.setTextColor(100, 100, 100);
            doc.text(category.pestel || '', startX + 8, currentY + 14);
            currentY += 22;

            // Description
            if (category.description) {
                doc.setFontSize(config.fontSize.body - 1);
                doc.setTextColor(60, 60, 60);
                addParagraph(category.description, 8);
            }

            // Strengths & Concerns
            if (category.strengths || category.concerns) {
                const colWidth = (contentWidth - 16) / 2;

                doc.setFontSize(config.fontSize.small);
                doc.setTextColor(39, 174, 96);
                doc.text('Strengths:', startX + 8, currentY);
                doc.setTextColor(231, 76, 60);
                doc.text('Concerns:', startX + 8 + colWidth + 8, currentY);
                currentY += 5;

                doc.setFontSize(config.fontSize.body - 1);
                doc.setTextColor(0, 0, 0);
                const strengthLines = doc.splitTextToSize(category.strengths || 'None identified', colWidth);
                const concernLines = doc.splitTextToSize(category.concerns || 'None identified', colWidth);

                const maxLines = Math.max(strengthLines.length, concernLines.length);
                doc.text(strengthLines, startX + 8, currentY);
                doc.text(concernLines, startX + 8 + colWidth + 8, currentY);
                currentY += maxLines * config.fontSize.body * 0.4 + 5;
            }

            // AI Recommendation
            if (category.aiRecommendation) {
                doc.setFontSize(config.fontSize.small);
                doc.setTextColor(41, 128, 185);
                doc.text('AI Recommendation:', startX + 8, currentY);
                currentY += 5;
                doc.setFontSize(config.fontSize.body - 1);
                doc.setTextColor(0, 0, 0);
                addParagraph(category.aiRecommendation, 8);
            }

            currentY += 5;
        });
    }

    // 4. Weighted Score Breakdown
    addSectionTitle('WEIGHTED SCORE BREAKDOWN');

    if (data.tcaData?.categories) {
        // Visual bar chart representation
        const maxBarWidth = contentWidth - 60;
        data.tcaData.categories.forEach((category) => {
            checkPageBreak(12);

            doc.setFontSize(config.fontSize.small);
            doc.setTextColor(0, 0, 0);
            doc.text(category.category.substring(0, 20), startX, currentY + 4);

            // Background bar
            doc.setFillColor(230, 230, 230);
            doc.rect(startX + 55, currentY, maxBarWidth, 6, 'F');

            // Score bar
            const barWidth = (category.rawScore / 10) * maxBarWidth;
            const flagColor = getFlagColor(category.flag);
            doc.setFillColor(flagColor[0], flagColor[1], flagColor[2]);
            doc.rect(startX + 55, currentY, barWidth, 6, 'F');

            // Score text
            doc.text(`${category.rawScore.toFixed(1)} (${category.weight}%)`, startX + 55 + maxBarWidth + 3, currentY + 4);
            currentY += 10;
        });
        currentY += 10;
    }

    // 5. Risk Assessment
    addSectionTitle('RISK ASSESSMENT & MITIGATION');

    if (data.riskData) {
        // Risk summary
        if (data.riskData.riskSummary) {
            addParagraph(data.riskData.riskSummary);
        }

        // Risk flags table
        const riskTableData = data.riskData.riskFlags.map((r) => [
            r.domain,
            r.flag.toUpperCase(),
            r.trigger,
            r.impact || 'TBD',
            r.mitigation || 'TBD',
        ]);

        checkPageBreak(60);
        autoTable(doc, {
            startY: currentY,
            head: [['Domain', 'Level', 'Trigger', 'Impact', 'Mitigation']],
            body: riskTableData,
            theme: 'grid',
            headStyles: {
                fillColor: config.colorMode === 'grayscale' ? [80, 80, 80] : [192, 57, 43],
                textColor: 255,
                fontSize: config.fontSize.body - 1,
                fontStyle: 'bold',
            },
            styles: {
                fontSize: config.fontSize.body - 2,
                cellPadding: 2,
                overflow: 'linebreak',
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 15, halign: 'center' },
                2: { cellWidth: 40 },
                3: { cellWidth: 35 },
                4: { cellWidth: 45 },
            },
            didParseCell: function (hookData) {
                if (hookData.section === 'body' && hookData.column.index === 1) {
                    const flag = hookData.cell.raw?.toString().toLowerCase();
                    if (flag === 'green') hookData.cell.styles.fillColor = [39, 174, 96];
                    else if (flag === 'yellow') hookData.cell.styles.fillColor = [241, 196, 15];
                    else if (flag === 'red') hookData.cell.styles.fillColor = [231, 76, 60];
                    hookData.cell.styles.textColor = 255;
                }
            },
            margin: { left: startX, right: config.margins.right },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 6. Gap Analysis
    if (data.gapData) {
        addSectionTitle('GAP ANALYSIS & ROADMAP');

        if (data.gapData.interpretation) {
            addParagraph(data.gapData.interpretation);
        }

        // Gap heatmap table
        if (data.gapData.heatmap?.length > 0) {
            addSubsectionTitle('Gap Heatmap');
            const gapTableData = data.gapData.heatmap.map((g) => [
                g.category,
                g.gap.toFixed(1),
                g.priority,
                g.direction || 'N/A',
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Category', 'Gap Score', 'Priority', 'Trend']],
                body: gapTableData,
                theme: 'grid',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [155, 89, 182],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Roadmap
        if (data.gapData.roadmap?.length > 0) {
            addSubsectionTitle('Recommended Actions');
            const roadmapData = data.gapData.roadmap.map((r) => [
                r.area,
                r.action,
                r.type,
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Area', 'Action', 'Type']],
                body: roadmapData,
                theme: 'striped',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [46, 204, 113],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // 7. Macro Trend Alignment (PESTEL)
    if (data.macroData) {
        addSectionTitle('MACRO TREND ALIGNMENT (PESTEL)');

        if (data.macroData.summary) {
            addParagraph(data.macroData.summary);
        }

        // PESTEL Dashboard scores
        if (data.macroData.pestelDashboard) {
            addSubsectionTitle('PESTEL Dashboard');
            const pestel = data.macroData.pestelDashboard;
            const pestelData = [
                ['Political', pestel.political?.toFixed(1) || 'N/A'],
                ['Economic', pestel.economic?.toFixed(1) || 'N/A'],
                ['Social', pestel.social?.toFixed(1) || 'N/A'],
                ['Technological', pestel.technological?.toFixed(1) || 'N/A'],
                ['Environmental', pestel.environmental?.toFixed(1) || 'N/A'],
                ['Legal', pestel.legal?.toFixed(1) || 'N/A'],
            ];

            autoTable(doc, {
                startY: currentY,
                head: [['Factor', 'Score']],
                body: pestelData,
                theme: 'grid',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [52, 73, 94],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 30, halign: 'center' },
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Trend signals
        if (data.macroData.trendSignals?.length > 0) {
            addSubsectionTitle('Trend Signals');
            data.macroData.trendSignals.forEach((signal) => {
                doc.setFontSize(config.fontSize.body - 1);
                doc.text(`• ${signal}`, startX + 5, currentY);
                currentY += config.fontSize.body * 0.5;
            });
            currentY += 10;
        }

        // Sector outlook
        if (data.macroData.sectorOutlook) {
            addSubsectionTitle('Sector Outlook');
            addParagraph(data.macroData.sectorOutlook);
        }
    }

    // 8. Benchmark Comparison
    if (data.benchmarkData) {
        addSectionTitle('BENCHMARK COMPARISON');

        if (data.benchmarkData.performanceSummary) {
            addParagraph(data.benchmarkData.performanceSummary);
        }

        // Benchmark overlay table
        if (data.benchmarkData.benchmarkOverlay?.length > 0) {
            addSubsectionTitle('Performance vs Industry Average');
            const benchmarkTableData = data.benchmarkData.benchmarkOverlay.map((b) => [
                b.category,
                b.score.toFixed(1),
                b.avg.toFixed(1),
                `${b.percentile}%`,
                b.deviation > 0 ? `+${b.deviation.toFixed(1)}` : b.deviation.toFixed(1),
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Category', 'Score', 'Avg', 'Percentile', 'Deviation']],
                body: benchmarkTableData,
                theme: 'grid',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [230, 126, 34],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Competitor analysis
        if (data.benchmarkData.competitorAnalysis?.length > 0) {
            addSubsectionTitle('Competitive Analysis');
            const compTableData = data.benchmarkData.competitorAnalysis.map((c) => [
                c.metric,
                c.startup.toString(),
                c.competitorA.toString(),
                c.competitorB.toString(),
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Metric', 'Startup', 'Competitor A', 'Competitor B']],
                body: compTableData,
                theme: 'striped',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [142, 68, 173],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // 9. Growth Analysis
    if (data.growthData) {
        addSectionTitle('GROWTH ANALYSIS');

        // Growth tier and confidence
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(startX, currentY, contentWidth, 20, 3, 3, 'F');
        doc.setFontSize(config.fontSize.body);
        doc.setTextColor(0, 0, 0);
        doc.text(`Growth Tier: ${data.growthData.tier} | Confidence: ${(data.growthData.confidence * 100).toFixed(0)}%`, startX + 5, currentY + 12);
        currentY += 28;

        if (data.growthData.analysis) {
            addParagraph(data.growthData.analysis);
        }

        // Growth scenarios
        if (data.growthData.scenarios && data.growthData.scenarios.length > 0) {
            addSubsectionTitle('Growth Scenarios');
            const scenarioData = data.growthData.scenarios.map((s: { name: string; growth: number }) => [
                s.name,
                `${(s.growth * 100).toFixed(0)}%`,
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Scenario', 'Growth Rate']],
                body: scenarioData,
                theme: 'grid',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [26, 188, 156],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Model contributions
        if (data.growthData.models && data.growthData.models.length > 0) {
            addSubsectionTitle('Model Analysis');
            const modelData = data.growthData.models.map((m: { name: string; score: number; contribution: string }) => [
                m.name,
                m.score.toFixed(2),
                m.contribution,
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Model', 'Score', 'Contribution']],
                body: modelData,
                theme: 'striped',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [52, 152, 219],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // 10. Funder Fit Analysis
    if (data.founderFitData) {
        addSectionTitle('FUNDER FIT ANALYSIS');

        // Readiness Score
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(startX, currentY, contentWidth, 15, 3, 3, 'F');
        doc.setFontSize(config.fontSize.body);
        doc.setTextColor(0, 0, 0);
        doc.text(`Investment Readiness Score: ${data.founderFitData.readinessScore?.toFixed(1) || 'N/A'}/10`, startX + 5, currentY + 10);
        currentY += 22;

        if (data.founderFitData.interpretation) {
            addParagraph(data.founderFitData.interpretation);
        }

        // Investor matches
        if (data.founderFitData.investorList?.length > 0) {
            addSubsectionTitle('Potential Investor Matches');
            const investorData = data.founderFitData.investorList.map((inv) => [
                inv.name,
                inv.thesis,
                `${inv.match}%`,
                inv.stage,
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Investor', 'Thesis', 'Match', 'Stage']],
                body: investorData,
                theme: 'grid',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [155, 89, 182],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // 11. Team Assessment
    if (data.teamData) {
        addSectionTitle('TEAM ASSESSMENT');

        // Team score
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(startX, currentY, contentWidth, 15, 3, 3, 'F');
        doc.setFontSize(config.fontSize.body);
        doc.setTextColor(0, 0, 0);
        doc.text(`Team Score: ${data.teamData.teamScore?.toFixed(1) || 'N/A'}/10`, startX + 5, currentY + 10);
        currentY += 22;

        if (data.teamData.interpretation) {
            addParagraph(data.teamData.interpretation);
        }

        // Team members
        if (data.teamData.members?.length > 0) {
            addSubsectionTitle('Key Team Members');
            const teamTableData = data.teamData.members.map((m) => [
                m.name,
                m.role,
                m.experience,
                m.skills,
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Name', 'Role', 'Experience', 'Skills']],
                body: teamTableData,
                theme: 'grid',
                headStyles: {
                    fillColor: config.colorMode === 'grayscale' ? [100, 100, 100] : [52, 73, 94],
                    textColor: 255,
                    fontSize: config.fontSize.body - 1,
                },
                styles: {
                    fontSize: config.fontSize.body - 1,
                    cellPadding: 3,
                    overflow: 'linebreak',
                },
                margin: { left: startX, right: config.margins.right },
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // 12. Investment Recommendation
    addSectionTitle('INVESTMENT RECOMMENDATION');

    if (data.tcaData) {
        const score = data.tcaData.compositeScore;
        let recommendation: string;
        let recommendationColor: [number, number, number];
        let confidenceLevel: string;
        let riskProfile: string;
        let nextSteps: string[];

        if (score >= 7) {
            recommendation = 'RECOMMEND: Proceed to Due Diligence';
            recommendationColor = [39, 174, 96];
            confidenceLevel = score >= 8 ? 'Very High' : 'High';
            riskProfile = 'Acceptable';
            nextSteps = [
                'Initiate comprehensive due diligence process',
                'Schedule management team meetings',
                'Request detailed financial projections',
                'Begin legal and technical review',
            ];
        } else if (score >= 5) {
            recommendation = 'CONDITIONAL: Address concerns and reassess';
            recommendationColor = [241, 196, 15];
            confidenceLevel = 'Moderate';
            riskProfile = 'Elevated';
            nextSteps = [
                'Address identified red and yellow flags',
                'Request additional documentation',
                'Schedule follow-up assessment in 30-60 days',
                'Consider conditional term sheet with milestones',
            ];
        } else {
            recommendation = 'DECLINE: Significant risks identified';
            recommendationColor = [231, 76, 60];
            confidenceLevel = 'Low';
            riskProfile = 'High Risk';
            nextSteps = [
                'Document specific reasons for decline',
                'Provide constructive feedback to founders',
                'Consider revisiting if major concerns addressed',
                'Archive for future reference',
            ];
        }

        // Recommendation box
        doc.setFillColor(recommendationColor[0], recommendationColor[1], recommendationColor[2]);
        doc.roundedRect(startX, currentY, contentWidth, 25, 3, 3, 'F');
        doc.setFontSize(config.fontSize.heading);
        doc.setTextColor(255, 255, 255);
        doc.text(recommendation, pageWidth / 2, currentY + 15, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        currentY += 35;

        // Metrics summary
        doc.setFontSize(config.fontSize.body);
        doc.text(`Final Score: ${score.toFixed(2)}/10`, startX, currentY);
        currentY += 7;
        doc.text(`Confidence Level: ${confidenceLevel}`, startX, currentY);
        currentY += 7;
        doc.text(`Risk Profile: ${riskProfile}`, startX, currentY);
        currentY += 15;

        // Next steps
        addSubsectionTitle('Recommended Next Steps');
        nextSteps.forEach((step, index) => {
            checkPageBreak(8);
            doc.setFontSize(config.fontSize.body);
            doc.text(`${index + 1}. ${step}`, startX + 5, currentY);
            currentY += 7;
        });
    }

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
    }

    return doc;
}

export { defaultConfig, pageSizes };
