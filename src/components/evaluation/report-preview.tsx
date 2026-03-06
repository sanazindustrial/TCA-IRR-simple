'use client';

import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Eye,
    Download,
    FileText,
    FileJson,
    Printer,
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingUp,
    Building2,
    Users,
    DollarSign,
    Target,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ReportPreviewProps = {
    isOpen: boolean;
    onClose: () => void;
    analysisData: any;
    companyName?: string;
    onExportPDF?: () => void;
    onExportJSON?: () => void;
};

// Score interpretation
function getScoreColor(score: number): string {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
}

function getScoreBadge(score: number): { color: string; text: string } {
    if (score >= 8) return { color: 'bg-green-100 text-green-800', text: 'STRONG BUY' };
    if (score >= 7) return { color: 'bg-blue-100 text-blue-800', text: 'PROCEED' };
    if (score >= 5.5) return { color: 'bg-yellow-100 text-yellow-800', text: 'CONDITIONAL' };
    return { color: 'bg-red-100 text-red-800', text: 'PASS' };
}

export function ReportPreview({
    isOpen,
    onClose,
    analysisData,
    companyName = 'Company Analysis',
    onExportPDF,
    onExportJSON,
}: ReportPreviewProps) {
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('preview');

    const score = analysisData?.tcaData?.compositeScore || 0;
    const scoreBadge = getScoreBadge(score);
    const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handlePrint = () => {
        if (printRef.current) {
            const printContent = printRef.current.innerHTML;
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>TCA TIRR Report - ${companyName}</title>
                        <style>
                            body { 
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                padding: 40px; 
                                max-width: 800px; 
                                margin: 0 auto;
                                color: #1a1a1a;
                            }
                            h1 { color: #1E3A5F; border-bottom: 2px solid #2F855A; padding-bottom: 10px; }
                            h2 { color: #2F855A; margin-top: 30px; }
                            h3 { color: #1E3A5F; }
                            .score-box { 
                                background: linear-gradient(135deg, #1E3A5F 0%, #2F855A 100%);
                                color: white;
                                padding: 20px;
                                border-radius: 12px;
                                text-align: center;
                                margin: 20px 0;
                            }
                            .score-number { font-size: 48px; font-weight: bold; }
                            .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                            .badge { 
                                display: inline-block; 
                                padding: 4px 12px; 
                                border-radius: 20px; 
                                font-size: 12px;
                                font-weight: 600;
                            }
                            .badge-green { background: #d4edda; color: #155724; }
                            .badge-yellow { background: #fff3cd; color: #856404; }
                            .badge-red { background: #f8d7da; color: #721c24; }
                            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
                            th { background: #f1f3f5; font-weight: 600; }
                            .page-break { page-break-before: always; }
                            .footer { 
                                margin-top: 40px; 
                                padding-top: 20px; 
                                border-top: 1px solid #dee2e6; 
                                text-align: center;
                                color: #6c757d;
                                font-size: 12px;
                            }
                            @media print {
                                body { padding: 20px; }
                                .page-break { page-break-before: always; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Report Preview
                    </DialogTitle>
                    <DialogDescription>
                        Preview your TCA TIRR Report before exporting to PDF or other formats.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preview">HTML Preview</TabsTrigger>
                        <TabsTrigger value="json">JSON Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="flex-1 mt-4">
                        <ScrollArea className="h-[500px] rounded-md border">
                            <div ref={printRef} className="p-6 space-y-6 bg-white">
                                {/* Page 1: Executive Summary */}
                                <div>
                                    <h1 className="text-2xl font-bold text-[#1E3A5F] border-b-2 border-[#2F855A] pb-2">
                                        TCA Investment Risk Rating Report
                                    </h1>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Generated: {generatedDate} | Company: {companyName}
                                    </p>

                                    <div className="mt-6 p-6 bg-gradient-to-r from-[#1E3A5F] to-[#2F855A] rounded-xl text-white text-center">
                                        <p className="text-sm uppercase tracking-wide mb-2">Overall TCA Score</p>
                                        <p className="text-5xl font-bold">{score.toFixed(1)}</p>
                                        <p className="text-lg mt-2">/10</p>
                                        <Badge className={`mt-4 ${scoreBadge.color}`}>
                                            {scoreBadge.text}
                                        </Badge>
                                    </div>
                                </div>

                                <Separator />

                                {/* Page 2: Company Profile */}
                                <div>
                                    <h2 className="text-xl font-semibold text-[#2F855A] flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Company Profile
                                    </h2>
                                    <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Company Name</p>
                                            <p className="font-medium">{analysisData.companyName || companyName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Industry</p>
                                            <p className="font-medium">{analysisData.industry || 'Technology'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Stage</p>
                                            <p className="font-medium">{analysisData.stage || 'Growth'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Business Model</p>
                                            <p className="font-medium">{analysisData.businessModel || 'B2B SaaS'}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Page 3: TCA Scorecard */}
                                <div>
                                    <h2 className="text-xl font-semibold text-[#2F855A] flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        TCA Scorecard
                                    </h2>
                                    <div className="mt-4">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="p-3 text-left">Category</th>
                                                    <th className="p-3 text-center">Score</th>
                                                    <th className="p-3 text-center">Weight</th>
                                                    <th className="p-3 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analysisData.tcaData?.categories?.slice(0, 9).map((cat: any, idx: number) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="p-3">{cat.category}</td>
                                                        <td className="p-3 text-center font-semibold">
                                                            <span className={getScoreColor(cat.rawScore)}>
                                                                {cat.rawScore.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">{cat.weight}%</td>
                                                        <td className="p-3 text-center">
                                                            {cat.flag === 'green' && <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />}
                                                            {cat.flag === 'yellow' && <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto" />}
                                                            {cat.flag === 'red' && <XCircle className="h-5 w-5 text-red-600 mx-auto" />}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <Separator />

                                {/* Page 4: Risk Assessment */}
                                <div>
                                    <h2 className="text-xl font-semibold text-[#2F855A] flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Risk Assessment
                                    </h2>
                                    <div className="mt-4 space-y-3">
                                        {analysisData.riskData?.riskFlags?.slice(0, 5).map((risk: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                                                <Badge className={
                                                    risk.flag === 'red' ? 'bg-red-100 text-red-800' :
                                                        risk.flag === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                }>
                                                    {risk.domain}
                                                </Badge>
                                                <div>
                                                    <p className="font-medium">{risk.trigger}</p>
                                                    <p className="text-sm text-muted-foreground">{risk.aiRecommendation || risk.mitigation}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Page 5-10: Additional sections */}
                                <div>
                                    <h2 className="text-xl font-semibold text-[#2F855A] flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Financial Summary
                                    </h2>
                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground">Revenue</p>
                                            <p className="text-xl font-bold text-green-600">
                                                ${((analysisData as any).revenue || 1000000).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground">Burn Rate</p>
                                            <p className="text-xl font-bold text-orange-600">
                                                ${((analysisData as any).burnRate || 50000).toLocaleString()}/mo
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground">Runway</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                {(analysisData as any).runway || 18} months
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Investment Recommendation */}
                                <div>
                                    <h2 className="text-xl font-semibold text-[#2F855A] flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Investment Recommendation
                                    </h2>
                                    <div className="mt-4 p-6 border-2 border-[#2F855A] rounded-xl">
                                        <div className="text-center">
                                            <Badge className={`text-lg px-4 py-2 ${scoreBadge.color}`}>
                                                {scoreBadge.text}
                                            </Badge>
                                            <p className="mt-4 text-lg">
                                                {score >= 7
                                                    ? 'This company shows strong potential for investment. Proceed with due diligence.'
                                                    : score >= 5.5
                                                        ? 'This company has moderate potential. Address key risks before proceeding.'
                                                        : 'Significant concerns identified. Not recommended for investment at this time.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div className="mt-6">
                                    <h3 className="font-semibold">Recommended Next Steps:</h3>
                                    <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
                                        <li>Conduct management team interviews and reference checks</li>
                                        <li>Verify financial projections with audited statements</li>
                                        <li>Commission independent market sizing analysis</li>
                                        <li>Perform detailed competitive landscape mapping</li>
                                        <li>Engage technical due diligence on IP and architecture</li>
                                        <li>Negotiate term sheet based on analysis findings</li>
                                    </ol>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                                    <p>Confidential — TCA TIRR Platform</p>
                                    <p>Generated by TCA TIRR Analysis Engine v3.0</p>
                                    <p>Report consists of 10 pages when exported to PDF</p>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="json" className="flex-1 mt-4">
                        <ScrollArea className="h-[500px] rounded-md border bg-slate-950">
                            <pre className="p-4 text-sm text-green-400 font-mono">
                                {JSON.stringify(analysisData, null, 2)}
                            </pre>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button variant="outline" onClick={onExportJSON}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Export JSON
                    </Button>
                    <Button onClick={onExportPDF}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
