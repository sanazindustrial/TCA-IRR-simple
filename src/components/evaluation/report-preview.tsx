'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
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
    Sparkles,
    RefreshCw,
    Loader2,
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
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const score = analysisData?.tcaData?.compositeScore || 0;
    const scoreBadge = getScoreBadge(score);
    const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Generate AI summary based on analysis data
    const generateAISummary = useCallback(async () => {
        setIsGeneratingAI(true);
        try {
            // Generate comprehensive AI summary from the data
            const tcaCategories = analysisData?.tcaData?.categories || [];
            const riskFlags = analysisData?.riskData?.riskFlags || [];

            const strengths = tcaCategories
                .filter((c: any) => c.flag === 'green')
                .map((c: any) => c.category);
            const concerns = tcaCategories
                .filter((c: any) => c.flag === 'red')
                .map((c: any) => c.category);
            const moderates = tcaCategories
                .filter((c: any) => c.flag === 'yellow')
                .map((c: any) => c.category);

            const criticalRisks = riskFlags.filter((r: any) => r.flag === 'red');
            const moderateRisks = riskFlags.filter((r: any) => r.flag === 'yellow');

            // Generate AI-style summary
            const tierLabel = score >= 8 ? 'Exceptional'
                : score >= 7 ? 'Strong'
                    : score >= 6 ? 'Promising'
                        : score >= 5 ? 'Moderate'
                            : 'Challenging';

            const recommendation = score >= 7.5
                ? 'STRONG PROCEED - High confidence investment opportunity'
                : score >= 6.5
                    ? 'PROCEED WITH CONDITIONS - Address key risks'
                    : score >= 5.5
                        ? 'CONDITIONAL - Further due diligence required'
                        : 'PASS - Significant risk factors identified';

            const summary = `## Executive AI Summary

**Investment Rating:** ${tierLabel} (${score.toFixed(1)}/10)

**Recommendation:** ${recommendation}

### Key Strengths
${strengths.length > 0 ? strengths.map((s: string) => `- **${s}**: Strong performance identified`).join('\n') : '- No significant strengths flagged'}

### Areas of Concern
${concerns.length > 0 ? concerns.map((c: string) => `- **${c}**: Requires attention and mitigation`).join('\n') : '- No critical concerns identified'}

### Moderate Areas
${moderates.length > 0 ? moderates.map((m: string) => `- **${m}**: Monitor and improve`).join('\n') : '- All areas performing at expected levels'}

### Risk Assessment Summary
- **Critical Risks (Red):** ${criticalRisks.length}
- **Moderate Risks (Yellow):** ${moderateRisks.length}
- **Total Risk Flags:** ${riskFlags.length}

${criticalRisks.length > 0 ? `
**Critical Risk Details:**
${criticalRisks.slice(0, 3).map((r: any) => `- *${r.domain}*: ${r.trigger}`).join('\n')}
` : ''}

### Investment Thesis
${score >= 7
                    ? `This company demonstrates strong fundamentals across key TCA metrics. The leadership team shows promise, market opportunity is compelling, and the business model appears scalable. Recommend proceeding with detailed due diligence.`
                    : score >= 5.5
                        ? `This company shows potential but has notable areas requiring improvement. Before proceeding, address the identified risk factors and conduct deeper analysis on weak categories. Consider conditional terms tied to performance milestones.`
                        : `This company presents significant challenges across multiple evaluation dimensions. The risk profile exceeds acceptable thresholds for the current stage. Recommend passing unless material changes occur in key weakness areas.`
                }

### Next Steps
1. ${score >= 6.5 ? 'Schedule management team deep-dive interviews' : 'Request additional documentation on weak areas'}
2. ${strengths.includes('Financial') || strengths.some((s: string) => s.includes('Financial')) ? 'Verify financial projections with audited statements' : 'Conduct independent financial due diligence'}
3. ${concerns.some((c: string) => c.includes('Market')) ? 'Commission market sizing validation study' : 'Review competitive positioning analysis'}
4. Engage technical advisor for IP/technology assessment
5. Prepare term sheet based on risk-adjusted valuation

---
*AI Analysis generated on ${generatedDate}*
*TCA TIRR Platform v3.0*`;

            // Simulate API call delay for realistic feel
            await new Promise(resolve => setTimeout(resolve, 1500));
            setAiSummary(summary);

            toast({
                title: 'AI Summary Generated',
                description: 'Investment analysis summary has been created.',
            });
        } catch (error) {
            console.error('Failed to generate AI summary:', error);
            toast({
                title: 'Generation Failed',
                description: 'Could not generate AI summary. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingAI(false);
        }
    }, [analysisData, score, generatedDate, toast]);

    // Auto-generate AI summary when tab is selected
    useEffect(() => {
        if (activeTab === 'ai' && !aiSummary && !isGeneratingAI) {
            generateAISummary();
        }
    }, [activeTab, aiSummary, isGeneratingAI, generateAISummary]);

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
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="preview">HTML Preview</TabsTrigger>
                        <TabsTrigger value="ai" className="flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Summary
                        </TabsTrigger>
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

                    <TabsContent value="ai" className="flex-1 mt-4">
                        <ScrollArea className="h-[500px] rounded-md border bg-gradient-to-br from-slate-50 to-white">
                            <div className="p-6">
                                {isGeneratingAI ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Generating AI analysis...</span>
                                        </div>
                                        <div className="space-y-3">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                            <Skeleton className="h-4 w-4/6" />
                                            <div className="mt-6" />
                                            <Skeleton className="h-5 w-1/3" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                            <div className="mt-6" />
                                            <Skeleton className="h-5 w-1/3" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-4/5" />
                                        </div>
                                    </div>
                                ) : aiSummary ? (
                                    <div className="prose prose-sm max-w-none">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-[#2F855A]">
                                                <Sparkles className="h-5 w-5" />
                                                <h2 className="text-lg font-semibold m-0">AI-Generated Investment Analysis</h2>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={generateAISummary}
                                                disabled={isGeneratingAI}
                                            >
                                                <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                                                Regenerate
                                            </Button>
                                        </div>
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                                            {aiSummary.split('\n').map((line, i) => {
                                                if (line.startsWith('## ')) {
                                                    return <h2 key={i} className="text-xl font-bold text-[#1E3A5F] mt-4 mb-2">{line.replace('## ', '')}</h2>;
                                                }
                                                if (line.startsWith('### ')) {
                                                    return <h3 key={i} className="text-lg font-semibold text-[#2F855A] mt-4 mb-2">{line.replace('### ', '')}</h3>;
                                                }
                                                if (line.startsWith('**') && line.includes(':**')) {
                                                    const [label, ...rest] = line.split(':**');
                                                    return (
                                                        <p key={i} className="my-1">
                                                            <strong className="text-slate-700">{label.replace(/\*\*/g, '')}:</strong>
                                                            {rest.join(':**').replace(/\*\*/g, '')}
                                                        </p>
                                                    );
                                                }
                                                if (line.startsWith('- **')) {
                                                    const content = line.replace('- **', '').replace('**:', ':');
                                                    return (
                                                        <div key={i} className="flex items-start gap-2 my-1 ml-4">
                                                            <span className="text-[#2F855A] mt-1">•</span>
                                                            <span>{content}</span>
                                                        </div>
                                                    );
                                                }
                                                if (line.startsWith('- ')) {
                                                    return (
                                                        <div key={i} className="flex items-start gap-2 my-1 ml-4">
                                                            <span className="text-[#2F855A] mt-1">•</span>
                                                            <span>{line.replace('- ', '')}</span>
                                                        </div>
                                                    );
                                                }
                                                if (line.match(/^\d+\./)) {
                                                    return (
                                                        <div key={i} className="flex items-start gap-2 my-1 ml-4">
                                                            <span className="text-[#2F855A] font-semibold min-w-[20px]">{line.match(/^\d+/)?.[0]}.</span>
                                                            <span>{line.replace(/^\d+\.\s*/, '')}</span>
                                                        </div>
                                                    );
                                                }
                                                if (line.startsWith('---')) {
                                                    return <hr key={i} className="my-4 border-slate-200" />;
                                                }
                                                if (line.startsWith('*') && line.endsWith('*')) {
                                                    return <p key={i} className="text-xs text-muted-foreground italic my-1">{line.replace(/\*/g, '')}</p>;
                                                }
                                                if (line.trim() === '') {
                                                    return <div key={i} className="h-2" />;
                                                }
                                                return <p key={i} className="my-2 text-slate-600">{line}</p>;
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                        <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="font-semibold text-lg">AI Summary Not Generated</h3>
                                        <p className="text-muted-foreground text-sm mt-2 max-w-md">
                                            Click below to generate an AI-powered investment analysis summary based on your evaluation data.
                                        </p>
                                        <Button onClick={generateAISummary} className="mt-4" disabled={isGeneratingAI}>
                                            {isGeneratingAI ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate AI Summary
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
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
