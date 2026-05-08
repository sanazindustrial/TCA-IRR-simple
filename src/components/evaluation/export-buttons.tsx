
'use client';
import React, { useState } from 'react';
import {
  FileText,
  FileJson,
  FileSpreadsheet,
  FileImage,
  Download,
  Share2,
  Mail,
  StickyNote,
  Presentation,
  Eye,
} from 'lucide-react';
import { ReportPreview } from './report-preview';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Packer, Document, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { useEvaluationContextSafe } from './evaluation-provider';

// Extended type to handle runtime data that may include additional properties
interface ExtendedAnalysisData extends ComprehensiveAnalysisOutput {
  companyName?: string;
  financialsData?: {
    revenueGrowth?: string;
    burnRate?: string;
    runway?: string;
    grossMargin?: string;
    cac?: string;
    ltv?: string;
    cacLtv?: string;
    overallHealth?: string;
    strengths?: string;
    concerns?: string;
  };
}

// Helper function to get team members, handling both old and new property names
const getTeamMembers = (data: ExtendedAnalysisData | null) => {
  if (!data?.teamData) return undefined;
  // Runtime data may use 'teamMembers' but schema uses 'members'
  const teamData = data.teamData as { members?: Array<{ id?: string; name?: string; role?: string; experience?: string; skills?: string; avatarId?: string; assessment?: string; strengths?: string; areasForDevelopment?: string; notes?: string }> };
  return teamData.members;
};

// Helper function to get strategic factors, handling possibly undefined structure
const getStrategicFactors = (data: ExtendedAnalysisData | null): Array<{ factor?: string; alignment?: string; impact?: string; priority?: string; assessment?: string; actionRequired?: string }> | undefined => {
  if (!data?.strategicFitData) return undefined;
  const stratData = data.strategicFitData as { factors?: Array<{ factor?: string; alignment?: string; impact?: string; priority?: string; assessment?: string; actionRequired?: string }> };
  return stratData.factors;
};

// Helper function to get growth factors
const getGrowthFactors = (data: ExtendedAnalysisData | null): Array<{ name?: string; assessment?: string; score?: string; trend?: string; timeHorizon?: string; impact?: string; confidence?: string }> | undefined => {
  if (!data?.growthData) return undefined;
  const growthData = data.growthData as { factors?: Array<{ name?: string; assessment?: string; score?: string; trend?: string; timeHorizon?: string; impact?: string; confidence?: string }> };
  return growthData.factors;
};

// Helper function to get benchmark comparisons
const getBenchmarkComparisons = (data: ExtendedAnalysisData | null): Array<{ metric?: string; companyValue?: string; industryAverage?: string; percentile?: string; assessment?: string; variance?: string; notes?: string }> | undefined => {
  if (!data?.benchmarkData) return undefined;
  const benchData = data.benchmarkData as { comparisons?: Array<{ metric?: string; companyValue?: string; industryAverage?: string; percentile?: string; assessment?: string; variance?: string; notes?: string }> };
  return benchData.comparisons;
};


export function ExportButtons() {
  const { toast } = useToast();
  const evalContext = useEvaluationContextSafe();
  const role = evalContext?.role ?? 'user';
  const reportType = evalContext?.reportType ?? 'triage';
  const [showPreview, setShowPreview] = useState(false);

  const getAnalysisData = (): ExtendedAnalysisData | null => {
    // Guard: Only access localStorage in browser environment
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const storedData = localStorage.getItem('analysisResult');
      if (!storedData) {
        return null;
      }
      return JSON.parse(storedData);
    } catch (error) {
      console.error("Failed to parse analysis data from localStorage:", error);
      return null;
    }
  }

  const getCompanyName = (): string => {
    // Try to get company name from stored data or use default
    try {
      const data = getAnalysisData();
      return data?.companyName || "Startup Analysis";
    } catch {
      return "Startup Analysis";
    }
  }

  // Helper function to add consistent page header
  const addPageHeader = (doc: jsPDF, companyName: string, pageTitle: string) => {
    // Header bar
    doc.setFillColor(31, 78, 121);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(pageTitle, 196, 13, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // Helper function to add consistent page footer
  const addPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 15, 210, 15, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${pageNum} of ${totalPages}`, 105, pageHeight - 5, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, pageHeight - 5);
    doc.text('TCA-IRR Platform', 196, pageHeight - 5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // Helper function for section titles
  const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
    doc.setFillColor(236, 240, 241);
    doc.rect(14, y - 6, 182, 10, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);
    doc.text(title, 18, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    return y + 12;
  };

  // Two-Page Triage Report (PDF) - CLEANED UP
  const handleExportTriageTwoPage = () => {
    const data = getAnalysisData();
    if (!data) return;

    const doc = new jsPDF();
    const companyName = getCompanyName();

    // PAGE 1: Executive Summary & TCA Scorecard
    addPageHeader(doc, companyName, 'TRIAGE REPORT');

    // Title section
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);
    doc.text('Investment Triage Report', 105, 38, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Executive Summary Box
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(14, 48, 182, 35, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 20, 58);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    if (data.tcaData) {
      const compositeScore = data.tcaData.compositeScore.toFixed(1);
      const scoreColor = parseFloat(compositeScore) >= 7 ? [39, 174, 96] : parseFloat(compositeScore) >= 5 ? [243, 156, 18] : [231, 76, 60];

      doc.text('Overall TCA Score:', 20, 68);
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${compositeScore}/10`, 60, 68);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      const assessment = parseFloat(compositeScore) >= 7 ? 'Strong candidate for investment' :
        parseFloat(compositeScore) >= 5 ? 'Moderate potential - requires further analysis' : 'High risk - not recommended';
      doc.text(`Assessment: ${assessment}`, 20, 78);
    }

    // TCA Scorecard Table
    let currentY = addSectionTitle(doc, 'TCA SCORECARD', 98);

    if (data.tcaData) {
      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Score', 'Weight', 'Status']],
        body: data.tcaData.categories.slice(0, 10).map(c => [
          c.category,
          c.rawScore.toFixed(1),
          `${c.weight}%`,
          c.flag === 'green' ? 'Strong' : c.flag === 'yellow' ? 'Moderate' : 'At Risk'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [31, 78, 121],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3.5
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
    }

    // Key Risks Summary
    if (data.riskData) {
      const tableEndY = (doc as any).lastAutoTable.finalY + 12;
      currentY = addSectionTitle(doc, 'KEY RISKS IDENTIFIED', tableEndY);

      const highRisks = data.riskData.riskFlags.filter(r => r.flag === 'red').slice(0, 3);
      doc.setFontSize(10);
      highRisks.forEach((risk, index) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(231, 76, 60);
        doc.text(`${index + 1}.`, 18, currentY + (index * 12));
        doc.setTextColor(0, 0, 0);
        doc.text(`${risk.domain}:`, 24, currentY + (index * 12));
        doc.setFont('helvetica', 'normal');
        doc.text(risk.trigger.slice(0, 80), 24, currentY + (index * 12) + 5);
      });
    }

    addPageFooter(doc, 1, 2);

    // PAGE 2: Detailed Analysis & Recommendations
    doc.addPage();
    addPageHeader(doc, companyName, 'TRIAGE REPORT');

    currentY = addSectionTitle(doc, 'KEY STRENGTHS', 32);
    doc.setFontSize(10);

    if (data.tcaData) {
      const strengths = data.tcaData.categories.filter(c => c.flag === 'green').slice(0, 4);
      strengths.forEach((strength, index) => {
        doc.setTextColor(39, 174, 96);
        doc.text('●', 18, currentY + (index * 10));
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${strength.category}:`, 24, currentY + (index * 10));
        doc.setFont('helvetica', 'normal');
        doc.text(strength.strengths?.slice(0, 60) || 'Strong performance', 24, currentY + (index * 10) + 4.5);
      });
    }

    // Investment Recommendation
    currentY = addSectionTitle(doc, 'INVESTMENT RECOMMENDATION', 80);

    const recommendationScore = data.tcaData?.compositeScore ?? 0;
    const recommendation = recommendationScore >= 7 ?
      'RECOMMEND: Proceed to due diligence phase' :
      recommendationScore >= 5 ?
        'CONDITIONAL: Address key risks before proceeding' :
        'NOT RECOMMENDED: Significant concerns identified';

    const recColor = recommendationScore >= 7 ? [39, 174, 96] :
      recommendationScore >= 5 ? [243, 156, 18] : [231, 76, 60];

    doc.setFillColor(recColor[0], recColor[1], recColor[2]);
    doc.roundedRect(14, currentY - 2, 182, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(recommendation, 105, currentY + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // Next Steps
    currentY = addSectionTitle(doc, 'RECOMMENDED NEXT STEPS', currentY + 22);
    doc.setFontSize(10);

    const nextSteps = [
      { step: 'Conduct management team interviews', priority: 'High' },
      { step: 'Verify financial projections and assumptions', priority: 'Critical' },
      { step: 'Assess market opportunity and TAM validation', priority: 'High' },
      { step: 'Review competitive positioning and moat', priority: 'Medium' },
      { step: 'Conduct customer reference calls', priority: 'High' }
    ];

    nextSteps.forEach((item, index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, 18, currentY + (index * 9));
      doc.setFont('helvetica', 'normal');
      doc.text(item.step, 26, currentY + (index * 9));
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`[${item.priority}]`, 180, currentY + (index * 9));
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    });

    addPageFooter(doc, 2, 2);

    doc.save(`${companyName}-Triage-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: 'Triage Report Exported',
      description: 'Your professional triage report has been downloaded.',
    });
  };

  // Two-Page DD Report (PDF) - CLEANED UP
  const handleExportDDTwoPage = () => {
    const data = getAnalysisData();
    if (!data) return;

    const doc = new jsPDF();
    const companyName = getCompanyName();

    // PAGE 1: Comprehensive Analysis Summary
    addPageHeader(doc, companyName, 'DUE DILIGENCE REPORT');

    // Title section
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);
    doc.text('Due Diligence Report', 105, 38, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Analyst: ${role}`, 105, 46, { align: 'center' });

    // Investment Synopsis Box
    let currentY = addSectionTitle(doc, 'INVESTMENT SYNOPSIS', 58);

    if (data.tcaData) {
      const score = data.tcaData.compositeScore;
      const scoreColor = score >= 7 ? [39, 174, 96] : score >= 5 ? [243, 156, 18] : [231, 76, 60];
      const rating = score >= 8 ? 'HIGH CONFIDENCE' : score >= 6 ? 'MODERATE CONFIDENCE' : 'LOW CONFIDENCE';

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(14, currentY - 2, 90, 22, 2, 2, 'F');
      doc.roundedRect(106, currentY - 2, 90, 22, 2, 2, 'F');

      doc.setFontSize(10);
      doc.text('Overall Investment Score', 20, currentY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.setFontSize(16);
      doc.text(`${score.toFixed(1)}/10`, 20, currentY + 15);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Risk-Adjusted Rating', 112, currentY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(rating, 112, currentY + 15);
      doc.setFont('helvetica', 'normal');
    }

    // Detailed TCA Analysis
    currentY = addSectionTitle(doc, 'TCA ANALYSIS BREAKDOWN', currentY + 32);

    if (data.tcaData) {
      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Score', 'Weight', 'Assessment', 'Key Concerns']],
        body: data.tcaData.categories.map(c => [
          c.category,
          c.rawScore.toFixed(1),
          `${c.weight}%`,
          c.flag === 'green' ? 'Strong' : c.flag === 'yellow' ? 'Moderate' : 'At Risk',
          c.concerns?.slice(0, 40) || 'None identified'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [31, 78, 121],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2.5
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 55 }
        },
        margin: { left: 14, right: 14 }
      });
    }

    // Critical Risk Assessment
    if (data.riskData) {
      const tableEndY = (doc as any).lastAutoTable.finalY + 8;
      currentY = addSectionTitle(doc, 'CRITICAL RISKS', tableEndY);

      const criticalRisks = data.riskData.riskFlags.filter(r => r.flag === 'red');
      doc.setFontSize(10);

      if (criticalRisks.length > 0) {
        doc.setTextColor(231, 76, 60);
        doc.setFont('helvetica', 'bold');
        doc.text(`${criticalRisks.length} Critical Risk(s) Require Attention`, 18, currentY);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        criticalRisks.slice(0, 2).forEach((risk, index) => {
          doc.text(`• ${risk.domain}: ${risk.trigger.slice(0, 65)}`, 18, currentY + 8 + (index * 6));
        });
      } else {
        doc.setTextColor(39, 174, 96);
        doc.text('No critical risks identified', 18, currentY);
        doc.setTextColor(0, 0, 0);
      }
    }

    addPageFooter(doc, 1, 2);

    // PAGE 2: Investment Decision & Strategic Analysis
    doc.addPage();
    addPageHeader(doc, companyName, 'DUE DILIGENCE REPORT');

    // Financial Analysis Summary
    currentY = addSectionTitle(doc, 'FINANCIAL HEALTH ASSESSMENT', 32);

    doc.setFontSize(10);
    const financialMetrics = [
      { label: 'Revenue Growth', value: data.financialsData?.revenueGrowth || 'Under Review' },
      { label: 'Monthly Burn Rate', value: data.financialsData?.burnRate || 'Under Analysis' },
      { label: 'Cash Runway', value: data.financialsData?.runway || 'To be determined' },
      { label: 'Gross Margin', value: data.financialsData?.grossMargin || 'Pending' }
    ];

    financialMetrics.forEach((metric, index) => {
      const xPos = index % 2 === 0 ? 18 : 110;
      const yPos = currentY + Math.floor(index / 2) * 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(metric.label, xPos, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(metric.value, xPos, yPos + 6);
    });

    // Strategic Fit Analysis
    currentY = addSectionTitle(doc, 'STRATEGIC FIT MATRIX', currentY + 38);

    const ddStrategicFactors = getStrategicFactors(data);
    if (data.strategicFitData || ddStrategicFactors) {
      autoTable(doc, {
        startY: currentY,
        head: [['Strategic Factor', 'Alignment', 'Impact', 'Priority']],
        body: ddStrategicFactors?.slice(0, 5).map((f: { factor?: string; alignment?: string; impact?: string; priority?: string }) => [
          f.factor || 'Market Alignment',
          f.alignment || 'Strong',
          f.impact || 'High',
          f.priority || 'Critical'
        ]) || [
            ['Market Opportunity', 'Strong', 'High', 'Critical'],
            ['Technology Fit', 'Moderate', 'Medium', 'High'],
            ['Team Capability', 'Strong', 'High', 'Critical']
          ],
        theme: 'striped',
        headStyles: {
          fillColor: [39, 174, 96],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3.5
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 14, right: 14 }
      });
    }

    // Final Investment Recommendation
    const tableEndY2 = (doc as any).lastAutoTable?.finalY + 15 || 140;
    currentY = addSectionTitle(doc, 'FINAL INVESTMENT RECOMMENDATION', tableEndY2);

    const investmentScore = data.tcaData?.compositeScore ?? 0;
    const investmentDecision = investmentScore >= 7.5 ?
      'STRONG BUY: High confidence investment opportunity' :
      investmentScore >= 6 ?
        'CONDITIONAL BUY: Proceed with specific conditions' :
        'PASS: Risk/reward profile not aligned with investment criteria';

    const decisionColor = investmentScore >= 7 ? [39, 174, 96] :
      investmentScore >= 5 ? [243, 156, 18] : [231, 76, 60];

    doc.setFillColor(decisionColor[0], decisionColor[1], decisionColor[2]);
    doc.roundedRect(14, currentY - 2, 182, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(investmentDecision, 105, currentY + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // Investment Terms & Valuation
    currentY = addSectionTitle(doc, 'PROPOSED INVESTMENT TERMS', currentY + 22);
    doc.setFontSize(10);

    const terms = [
      { label: 'Valuation', value: '$[To be negotiated based on analysis]' },
      { label: 'Investment Amount', value: '$[As per fund allocation]' },
      { label: 'Board Representation', value: '[As per investment tier]' },
      { label: 'Expected Timeline', value: '4-6 weeks due diligence' }
    ];

    terms.forEach((term, index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${term.label}:`, 18, currentY + (index * 8));
      doc.setFont('helvetica', 'normal');
      doc.text(term.value, 65, currentY + (index * 8));
    });

    addPageFooter(doc, 2, 2);

    doc.save(`${companyName}-DD-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: 'DD Report Exported',
      description: 'Your professional due diligence report has been downloaded.',
    });
  };

  // Comprehensive Full Report (PDF) - PROFESSIONAL VERSION
  const handleExportFullReport = () => {
    const data = getAnalysisData();
    if (!data) return;

    const doc = new jsPDF();
    const companyName = getCompanyName();
    const score = data.tcaData?.compositeScore || 0;
    const scoreColor = score >= 7 ? [39, 174, 96] : score >= 5 ? [243, 156, 18] : [231, 76, 60];
    const totalPages = 9; // Estimated total pages (added Macro, Benchmark, Growth, Gap, Founder Fit)

    // ========== TITLE PAGE ==========
    // Background gradient effect
    doc.setFillColor(31, 78, 121);
    doc.rect(0, 0, 210, 297, 'F');

    // White content box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 60, 170, 180, 8, 8, 'F');

    // Company name
    doc.setTextColor(31, 78, 121);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 105, 100, { align: 'center' });

    // Report title
    doc.setFontSize(18);
    doc.setTextColor(100, 100, 100);
    doc.text('COMPREHENSIVE', 105, 120, { align: 'center' });
    doc.text('INVESTMENT ANALYSIS', 105, 132, { align: 'center' });

    // Report type badge
    doc.setFillColor(31, 78, 121);
    doc.roundedRect(65, 145, 80, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`${reportType.toUpperCase()} REPORT`, 105, 154, { align: 'center' });

    // Score display
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(75, 170, 60, 30, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`${score.toFixed(1)}/10`, 105, 190, { align: 'center' });

    // Meta info
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 215, { align: 'center' });
    doc.text(`Analyst: ${role}`, 105, 225, { align: 'center' });

    // Footer
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.text('CONFIDENTIAL & PROPRIETARY', 105, 250, { align: 'center' });
    doc.text('TCA-IRR Investment Analysis Platform', 105, 258, { align: 'center' });

    // ========== PAGE 2: TABLE OF CONTENTS ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'TABLE OF CONTENTS');

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 78, 121);
    doc.text('TABLE OF CONTENTS', 105, 45, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const tocItems = [
      { title: 'Executive Summary', page: 3 },
      { title: 'TCA Scorecard Analysis', page: 3 },
      { title: 'Risk Assessment Matrix', page: 4 },
      { title: 'Financial Health Overview', page: 4 },
      { title: 'Team & Leadership Assessment', page: 5 },
      { title: 'Strategic Fit Analysis', page: 5 },
      { title: 'Macro Trend & Benchmark Analysis', page: 6 },
      { title: 'Growth Classification & Gap Analysis', page: 7 },
      { title: 'Founder Fit & CEO Questions', page: 8 },
      { title: 'Investment Recommendation', page: 9 },
      { title: 'Due Diligence Checklist', page: 9 }
    ];

    doc.setFontSize(12);
    tocItems.forEach((item, index) => {
      const yPos = 70 + (index * 16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, 30, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(item.title, 40, yPos);

      // Dotted line
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(40 + doc.getTextWidth(item.title) + 5, yPos, 165, yPos);
      doc.setLineDashPattern([], 0);

      doc.text(`${item.page}`, 175, yPos);
    });

    addPageFooter(doc, 2, totalPages);

    // ========== PAGE 3: EXECUTIVE SUMMARY & TCA ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'EXECUTIVE SUMMARY');

    let currentY = addSectionTitle(doc, 'EXECUTIVE SUMMARY', 32);

    // Key metrics boxes
    const metrics = [
      { label: 'TCA Score', value: score.toFixed(1), color: scoreColor },
      { label: 'Risk Level', value: data.riskData?.riskFlags.filter(r => r.flag === 'red').length || 0, suffix: ' Critical' },
      { label: 'Rating', value: score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 5 ? 'MODERATE' : 'WEAK' }
    ];

    metrics.forEach((metric, index) => {
      const xPos = 14 + (index * 62);
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(xPos, currentY, 58, 28, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(metric.label, xPos + 29, currentY + 8, { align: 'center' });

      if (metric.color) {
        doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      } else {
        doc.setTextColor(31, 78, 121);
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${metric.value}${metric.suffix || ''}`, xPos + 29, currentY + 21, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    });

    // TCA Scorecard
    currentY = addSectionTitle(doc, 'TCA SCORECARD', currentY + 40);

    if (data.tcaData) {
      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Score', 'Weight', 'Contribution', 'Status']],
        body: data.tcaData.categories.map(c => [
          c.category,
          c.rawScore.toFixed(1),
          `${c.weight}%`,
          ((c.rawScore * c.weight) / 100).toFixed(2),
          c.flag === 'green' ? 'Strong' : c.flag === 'yellow' ? 'Moderate' : 'At Risk'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [31, 78, 121],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 2.5
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
    }

    addPageFooter(doc, 3, totalPages);

    // ========== PAGE 4: RISK ASSESSMENT & FINANCIALS ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'RISK & FINANCIAL ANALYSIS');

    currentY = addSectionTitle(doc, 'RISK ASSESSMENT MATRIX', 32);

    if (data.riskData) {
      // Risk counts summary
      const riskCounts = {
        red: data.riskData.riskFlags.filter(r => r.flag === 'red').length,
        yellow: data.riskData.riskFlags.filter(r => r.flag === 'yellow').length,
        green: data.riskData.riskFlags.filter(r => r.flag === 'green').length
      };

      // Risk indicator boxes
      const riskIndicators = [
        { label: 'Critical', count: riskCounts.red, color: [231, 76, 60] },
        { label: 'Moderate', count: riskCounts.yellow, color: [243, 156, 18] },
        { label: 'Low', count: riskCounts.green, color: [39, 174, 96] }
      ];

      riskIndicators.forEach((indicator, index) => {
        const xPos = 14 + (index * 62);
        doc.setFillColor(indicator.color[0], indicator.color[1], indicator.color[2]);
        doc.roundedRect(xPos, currentY, 58, 20, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(indicator.label, xPos + 29, currentY + 8, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${indicator.count}`, xPos + 29, currentY + 17, { align: 'center' });
        doc.setFont('helvetica', 'normal');
      });
      doc.setTextColor(0, 0, 0);

      // Risk details table
      autoTable(doc, {
        startY: currentY + 28,
        head: [['Domain', 'Level', 'Risk Trigger', 'Mitigation']],
        body: data.riskData.riskFlags.slice(0, 8).map(r => [
          r.domain,
          r.flag.toUpperCase(),
          r.trigger.slice(0, 45),
          r.mitigation?.slice(0, 40) || 'Under review'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [231, 76, 60],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2.5
        },
        alternateRowStyles: {
          fillColor: [254, 243, 242]
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 55 },
          3: { cellWidth: 50 }
        },
        margin: { left: 14, right: 14 }
      });
    }

    // Financial Health Section
    const riskTableEndY = (doc as any).lastAutoTable?.finalY + 12 || currentY + 100;
    currentY = addSectionTitle(doc, 'FINANCIAL HEALTH OVERVIEW', riskTableEndY);

    doc.setFontSize(10);
    const financialMetrics = [
      { label: 'Revenue Growth', value: data.financialsData?.revenueGrowth || 'Under Analysis', benchmark: '25%+ Strong' },
      { label: 'Monthly Burn', value: data.financialsData?.burnRate || 'Under Review', benchmark: '$50K Avg' },
      { label: 'Cash Runway', value: data.financialsData?.runway || 'TBD', benchmark: '18+ months' },
      { label: 'Gross Margin', value: data.financialsData?.grossMargin || 'Pending', benchmark: '60%+ target' }
    ];

    financialMetrics.forEach((metric, index) => {
      const xPos = 14 + ((index % 2) * 92);
      const yPos = currentY + Math.floor(index / 2) * 22;

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(xPos, yPos - 2, 88, 18, 2, 2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(metric.label, xPos + 4, yPos + 4);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(metric.value, xPos + 4, yPos + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Benchmark: ${metric.benchmark}`, xPos + 50, yPos + 12);
    });
    doc.setTextColor(0, 0, 0);

    addPageFooter(doc, 4, totalPages);

    // ========== PAGE 5: TEAM & STRATEGIC FIT ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'TEAM & STRATEGY');

    currentY = addSectionTitle(doc, 'TEAM & LEADERSHIP ASSESSMENT', 32);

    const teamMembers = getTeamMembers(data);
    if (teamMembers) {
      autoTable(doc, {
        startY: currentY,
        head: [['Name', 'Role', 'Experience', 'Assessment']],
        body: teamMembers.slice(0, 6).map((member: { name?: string; role?: string; experience?: string; assessment?: string }) => [
          member.name || 'Team Member',
          member.role || 'Key Role',
          member.experience || 'Experienced',
          member.assessment || 'Strong Contributor'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 14, right: 14 }
      });
    }

    // Strategic Fit
    const teamTableEndY = (doc as any).lastAutoTable?.finalY + 12 || currentY + 60;
    currentY = addSectionTitle(doc, 'STRATEGIC FIT ANALYSIS', teamTableEndY);

    const strategicFactors = getStrategicFactors(data);
    if (data.strategicFitData || strategicFactors) {
      autoTable(doc, {
        startY: currentY,
        head: [['Strategic Factor', 'Alignment', 'Impact', 'Priority']],
        body: strategicFactors?.slice(0, 6).map((f: { factor?: string; alignment?: string; impact?: string; priority?: string }) => [
          f.factor || 'Strategic Element',
          f.alignment || 'Strong',
          f.impact || 'High',
          f.priority || 'Critical'
        ]) || [
            ['Market Opportunity', 'Strong', 'High', 'Critical'],
            ['Technology Fit', 'Moderate', 'Medium', 'High'],
            ['Team Capability', 'Strong', 'High', 'Critical'],
            ['Competitive Position', 'Strong', 'High', 'Critical']
          ],
        theme: 'striped',
        headStyles: {
          fillColor: [39, 174, 96],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3.5
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 14, right: 14 }
      });
    }

    addPageFooter(doc, 5, totalPages);

    // ========== PAGE 6: MACRO TREND & BENCHMARK ANALYSIS ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'MARKET ANALYSIS');

    currentY = addSectionTitle(doc, 'MACRO TREND ALIGNMENT', 32);

    if (data.macroData) {
      // Display PESTEL and trend signals
      doc.setFontSize(10);
      doc.text(`Sector Outlook: ${data.macroData.sectorOutlook || 'Under Analysis'}`, 18, currentY);
      doc.text(`Trend Overlay Score: ${data.macroData.trendOverlayScore || 'N/A'}`, 120, currentY);

      const trendSignals = data.macroData.trendSignals || [];
      if (trendSignals.length > 0) {
        autoTable(doc, {
          startY: currentY + 10,
          head: [['Trend Signal', 'Alignment']],
          body: trendSignals.slice(0, 5).map((signal: string) => [
            signal,
            'Aligned'
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [155, 89, 182],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4
          },
          bodyStyles: { fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          margin: { left: 14, right: 14 }
        });
      }
    } else {
      doc.setFontSize(10);
      doc.text('Macro trend analysis data pending review.', 18, currentY);
    }

    const macroTableEndY = (doc as any).lastAutoTable?.finalY + 15 || currentY + 50;
    currentY = addSectionTitle(doc, 'BENCHMARK COMPARISON', macroTableEndY);

    const benchmarkComparisons = getBenchmarkComparisons(data);
    if (benchmarkComparisons && benchmarkComparisons.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Company', 'Industry Avg', 'Percentile', 'Status']],
        body: benchmarkComparisons.slice(0, 6).map((b: { metric?: string; companyValue?: string; industryAverage?: string; percentile?: string; assessment?: string }) => [
          b.metric || 'Performance Metric',
          b.companyValue || 'TBD',
          b.industryAverage || 'TBD',
          b.percentile || 'Top 50%',
          b.assessment || 'On Track'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        margin: { left: 14, right: 14 }
      });
    } else {
      doc.setFontSize(10);
      doc.text('Benchmark comparison data under analysis.', 18, currentY);
    }

    addPageFooter(doc, 6, totalPages);

    // ========== PAGE 7: GROWTH CLASSIFIER & GAP ANALYSIS ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'GROWTH & GAP ANALYSIS');

    currentY = addSectionTitle(doc, 'GROWTH CLASSIFICATION', 32);

    if (data.growthData) {
      // Growth tier display
      const growthTier = data.growthData.tier || 2;
      const growthConfidence = data.growthData.confidence || 75;

      doc.setFillColor(growthTier === 1 ? 39 : growthTier === 2 ? 243 : 231,
        growthTier === 1 ? 174 : growthTier === 2 ? 156 : 76,
        growthTier === 1 ? 96 : growthTier === 2 ? 18 : 60);
      doc.roundedRect(14, currentY, 88, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Tier ${growthTier} Growth`, 58, currentY + 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${growthConfidence}% Confidence`, 58, currentY + 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      // Growth scenarios
      const scenarios = data.growthData.scenarios || [];
      if (scenarios.length > 0) {
        autoTable(doc, {
          startY: currentY + 35,
          head: [['Scenario', 'Growth Rate', 'Probability']],
          body: scenarios.map((s: { name?: string; growth?: number; probability?: string }) => [
            s.name || 'Scenario',
            `${s.growth || 0}x YoY`,
            s.probability || '33%'
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [46, 204, 113],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4
          },
          bodyStyles: { fontSize: 10, cellPadding: 3 },
          margin: { left: 14, right: 100 }
        });
      }
    } else {
      doc.setFontSize(10);
      doc.text('Growth classification pending analysis.', 18, currentY);
    }

    const growthTableEndY = (doc as any).lastAutoTable?.finalY + 15 || currentY + 70;
    currentY = addSectionTitle(doc, 'GAP ANALYSIS', growthTableEndY);

    if (data.gapData && data.gapData.heatmap) {
      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Gap Score', 'Priority', 'Trend', 'Direction']],
        body: data.gapData.heatmap.slice(0, 5).map((g: { category: string; gap: number; priority: "High" | "Medium" | "Low"; trend: number; direction: "up" | "down" | "stable" }) => [
          g.category || 'Business Area',
          g.gap?.toFixed(1) || '0',
          g.priority || 'Medium',
          g.trend?.toFixed(1) || '0',
          g.direction || 'stable'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [230, 126, 34],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 3
        },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [254, 243, 231] },
        margin: { left: 14, right: 14 }
      });
    } else {
      doc.setFontSize(10);
      doc.text('Gap analysis data under review.', 18, currentY);
    }

    addPageFooter(doc, 7, totalPages);

    // ========== PAGE 8: FOUNDER FIT & CEO QUESTIONS ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'FOUNDER & LEADERSHIP');

    currentY = addSectionTitle(doc, 'FOUNDER FIT ANALYSIS', 32);

    if (data.founderFitData) {
      const founderScore = data.founderFitData.readinessScore || 7.5;
      const founderScoreColor = founderScore >= 7 ? [39, 174, 96] : founderScore >= 5 ? [243, 156, 18] : [231, 76, 60];

      // Founder fit score display
      doc.setFillColor(founderScoreColor[0], founderScoreColor[1], founderScoreColor[2]);
      doc.roundedRect(14, currentY, 60, 28, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Readiness Score', 44, currentY + 8, { align: 'center' });
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${founderScore.toFixed(1)}/10`, 44, currentY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      // Investor list
      const investors = data.founderFitData.investorList || [];
      if (investors.length > 0) {
        autoTable(doc, {
          startY: currentY + 38,
          head: [['Investor', 'Thesis', 'Match %', 'Stage']],
          body: investors.slice(0, 6).map((inv: { name?: string; thesis?: string; match?: number; stage?: string }) => [
            inv.name || 'Investor',
            inv.thesis || 'Growth',
            `${inv.match || 0}%`,
            inv.stage || 'Series A'
          ]),
          headStyles: {
            fillColor: [142, 68, 173],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 3
          },
          bodyStyles: { fontSize: 9, cellPadding: 2.5 },
          alternateRowStyles: { fillColor: [248, 243, 252] },
          margin: { left: 14, right: 14 }
        });
      }
    } else {
      doc.setFontSize(10);
      doc.text('Founder fit analysis pending evaluation.', 18, currentY);
    }

    const founderTableEndY = (doc as any).lastAutoTable?.finalY + 15 || currentY + 80;
    currentY = addSectionTitle(doc, 'KEY CEO QUESTIONS', founderTableEndY);

    // CEO Questions - generated based on analysis
    const ceoQuestions = [
      'What is your 18-month roadmap for product-market fit expansion?',
      'How do you plan to address the identified competitive threats?',
      'What is your strategy for reducing customer acquisition cost?',
      'How will you scale the team while maintaining culture?',
      'What are your key milestones before the next funding round?'
    ];

    doc.setFontSize(10);
    ceoQuestions.forEach((question, index) => {
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(14, currentY + (index * 12), 182, 10, 2, 2, 'F');
      doc.text(`${index + 1}. ${question}`, 18, currentY + (index * 12) + 7);
    });

    addPageFooter(doc, 8, totalPages);

    // ========== PAGE 9: INVESTMENT RECOMMENDATION ==========
    doc.addPage();
    addPageHeader(doc, companyName, 'INVESTMENT RECOMMENDATION');

    currentY = addSectionTitle(doc, 'INVESTMENT DECISION', 32);

    // Decision box
    const decision = score >= 8 ? 'STRONG BUY' : score >= 7 ? 'BUY' : score >= 6 ? 'CONDITIONAL BUY' : score >= 5 ? 'HOLD' : 'PASS';
    const confidence = score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low';

    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(14, currentY, 182, 35, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(decision, 105, currentY + 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Confidence Level: ${confidence} | Score: ${score.toFixed(1)}/10`, 105, currentY + 28, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Key decision factors
    currentY = addSectionTitle(doc, 'KEY DECISION FACTORS', currentY + 50);

    const factors = [
      { factor: 'Technology & IP', assessment: data.tcaData?.categories.find(c => c.category.includes('Technology'))?.flag || 'yellow' },
      { factor: 'Market Opportunity', assessment: data.tcaData?.categories.find(c => c.category.includes('Market'))?.flag || 'yellow' },
      { factor: 'Team Capability', assessment: data.tcaData?.categories.find(c => c.category.includes('Team'))?.flag || 'yellow' },
      { factor: 'Financial Health', assessment: data.tcaData?.categories.find(c => c.category.includes('Financial'))?.flag || 'yellow' }
    ];

    factors.forEach((item, index) => {
      const flagColor = item.assessment === 'green' ? [39, 174, 96] : item.assessment === 'yellow' ? [243, 156, 18] : [231, 76, 60];
      doc.setFillColor(flagColor[0], flagColor[1], flagColor[2]);
      doc.circle(22, currentY + (index * 10) - 1, 3, 'F');
      doc.setFontSize(10);
      doc.text(item.factor, 28, currentY + (index * 10));
    });

    // Due Diligence Checklist
    currentY = addSectionTitle(doc, 'DUE DILIGENCE CHECKLIST', currentY + 50);
    doc.setFontSize(10);

    const checklist = [
      { item: 'Management presentation and Q&A', status: 'Pending' },
      { item: 'Financial model validation', status: 'Pending' },
      { item: 'Customer reference calls', status: 'Pending' },
      { item: 'Technical architecture review', status: 'Pending' },
      { item: 'Competitive analysis', status: 'Pending' },
      { item: 'Legal and regulatory review', status: 'Pending' }
    ];

    checklist.forEach((item, index) => {
      doc.setFontSize(10);
      doc.text(`☐ ${item.item}`, 18, currentY + (index * 8));
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`[${item.status}]`, 180, currentY + (index * 8));
      doc.setTextColor(0, 0, 0);
    });

    addPageFooter(doc, 9, totalPages);

    doc.save(`${companyName}-Comprehensive-${reportType}-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: 'Full Report Exported',
      description: 'Your comprehensive professional report has been downloaded.',
    });
  };

  // Enhanced DOCX Export with Professional Styling
  const handleExportDocx = async () => {
    const data = getAnalysisData();
    if (!data) return;

    const companyName = getCompanyName();
    const score = data.tcaData?.compositeScore || 0;
    const rating = score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK';
    const sections: Paragraph[] = [];

    // TITLE PAGE
    sections.push(
      new Paragraph(""),
      new Paragraph(""),
      new Paragraph({
        children: [new TextRun({ text: companyName.toUpperCase(), size: 56, bold: true, color: "1F4E79" })],
        alignment: 'center',
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "COMPREHENSIVE INVESTMENT ANALYSIS", size: 32, color: "666666" })],
        alignment: 'center',
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `${reportType.toUpperCase()} REPORT`, size: 24, bold: true, color: "1F4E79" })],
        alignment: 'center',
        spacing: { after: 600 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `TCA Score: ${score.toFixed(1)}/10 (${rating})`, size: 28, bold: true, color: score >= 7 ? "27AE60" : score >= 5 ? "F39C12" : "E74C3C" })],
        alignment: 'center',
        spacing: { after: 800 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 20, italics: true, color: "888888" })],
        alignment: 'center'
      }),
      new Paragraph({
        children: [new TextRun({ text: `Analyst: ${role}`, size: 20, italics: true, color: "888888" })],
        alignment: 'center',
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "CONFIDENTIAL & PROPRIETARY", size: 16, color: "AAAAAA" })],
        alignment: 'center'
      }),
      new Paragraph(""),
      new Paragraph("")
    );

    // EXECUTIVE SUMMARY
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "EXECUTIVE SUMMARY", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (data.tcaData) {
      const recommendation = score >= 7 ? 'PROCEED TO DUE DILIGENCE' : score >= 5 ? 'CONDITIONAL REVIEW REQUIRED' : 'DECLINE INVESTMENT';

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Overall Investment Score: ", bold: true, size: 24 }),
            new TextRun({ text: `${score.toFixed(1)}/10`, size: 24, bold: true, color: score >= 7 ? "27AE60" : score >= 5 ? "F39C12" : "E74C3C" })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Rating: ", bold: true, size: 22 }),
            new TextRun({ text: rating, size: 22, bold: true })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Recommendation: ", bold: true, size: 22 }),
            new TextRun({ text: recommendation, size: 22, color: score >= 7 ? "27AE60" : score >= 5 ? "F39C12" : "E74C3C" })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: data.tcaData.summary || `${companyName} presents a ${score >= 7 ? 'compelling' : score >= 5 ? 'moderate' : 'challenging'} investment opportunity based on comprehensive TCA analysis.`, size: 22 })],
          spacing: { after: 300 }
        })
      );
    }

    // TCA SCORECARD ANALYSIS
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "TCA SCORECARD ANALYSIS", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Performance Overview", bold: true, size: 26 })],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Composite Score: ${score.toFixed(1)}/10`, size: 22, bold: true })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Categories Analyzed: ${data.tcaData?.categories?.length || 0}`, size: 22 })],
        spacing: { after: 50 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Strong (Green): ${data.tcaData?.categories?.filter(c => c.flag === 'green').length || 0}`, size: 22, color: "27AE60" }),
          new TextRun({ text: "  |  ", size: 22 }),
          new TextRun({ text: `Moderate (Yellow): ${data.tcaData?.categories?.filter(c => c.flag === 'yellow').length || 0}`, size: 22, color: "F39C12" }),
          new TextRun({ text: "  |  ", size: 22 }),
          new TextRun({ text: `At Risk (Red): ${data.tcaData?.categories?.filter(c => c.flag === 'red').length || 0}`, size: 22, color: "E74C3C" })
        ],
        spacing: { after: 200 }
      })
    );

    // Category Details
    if (data.tcaData?.categories) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Category Breakdown", bold: true, size: 26 })],
          spacing: { before: 200, after: 150 }
        })
      );

      data.tcaData.categories.forEach((cat, index) => {
        const flagColor = cat.flag === 'green' ? "27AE60" : cat.flag === 'yellow' ? "F39C12" : "E74C3C";
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. ${cat.category}`, bold: true, size: 22 }),
              new TextRun({ text: `  —  Score: ${cat.rawScore.toFixed(1)}/10`, size: 22 }),
              new TextRun({ text: `  (${cat.weight}% weight)`, size: 20, color: "888888" }),
              new TextRun({ text: `  [${cat.flag.toUpperCase()}]`, size: 20, bold: true, color: flagColor })
            ],
            spacing: { after: 80 }
          })
        );
        if (cat.strengths) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "    Strengths: ", italics: true, size: 20 }),
                new TextRun({ text: cat.strengths.slice(0, 100), size: 20, color: "27AE60" })
              ],
              spacing: { after: 50 }
            })
          );
        }
        if (cat.concerns) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "    Concerns: ", italics: true, size: 20 }),
                new TextRun({ text: cat.concerns.slice(0, 100), size: 20, color: "E74C3C" })
              ],
              spacing: { after: 100 }
            })
          );
        }
      });
    }

    // RISK ASSESSMENT
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "RISK ASSESSMENT", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (data.riskData) {
      const riskCounts = {
        red: data.riskData.riskFlags.filter(r => r.flag === 'red').length,
        yellow: data.riskData.riskFlags.filter(r => r.flag === 'yellow').length,
        green: data.riskData.riskFlags.filter(r => r.flag === 'green').length
      };

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Critical Risks: ${riskCounts.red}`, size: 22, bold: true, color: "E74C3C" }),
            new TextRun({ text: "  |  ", size: 22 }),
            new TextRun({ text: `Moderate Risks: ${riskCounts.yellow}`, size: 22, bold: true, color: "F39C12" }),
            new TextRun({ text: "  |  ", size: 22 }),
            new TextRun({ text: `Low Risks: ${riskCounts.green}`, size: 22, bold: true, color: "27AE60" })
          ],
          spacing: { after: 200 }
        })
      );

      // Critical risks detail
      const criticalRisks = data.riskData.riskFlags.filter(r => r.flag === 'red');
      if (criticalRisks.length > 0) {
        sections.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Critical Risks Requiring Attention", bold: true, size: 26, color: "E74C3C" })],
            spacing: { before: 150, after: 100 }
          })
        );

        criticalRisks.slice(0, 5).forEach((risk, index) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. ${risk.domain}: `, bold: true, size: 22 }),
                new TextRun({ text: risk.trigger, size: 22 })
              ],
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "   Mitigation: ", italics: true, size: 20 }),
                new TextRun({ text: risk.mitigation || 'Under development', size: 20, color: "666666" })
              ],
              spacing: { after: 100 }
            })
          );
        });
      }
    }

    // MACRO TREND ALIGNMENT
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "MACRO TREND ALIGNMENT", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (data.macroData) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Sector Outlook: ", bold: true, size: 22 }),
            new TextRun({ text: data.macroData.sectorOutlook || 'Under Analysis', size: 22 })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Trend Overlay Score: ", bold: true, size: 22 }),
            new TextRun({ text: `${data.macroData.trendOverlayScore || 'N/A'}`, size: 22, color: "27AE60" })
          ],
          spacing: { after: 150 }
        })
      );

      const trendSignals = data.macroData.trendSignals || [];
      if (trendSignals.length > 0) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Trend Signals:", bold: true, size: 22 })],
            spacing: { after: 100 }
          })
        );
        trendSignals.slice(0, 5).forEach((signal: string, index: number) => {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `${index + 1}. ${signal}`, size: 22 })],
              spacing: { after: 50 }
            })
          );
        });
      }
    } else {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "Macro trend analysis data pending review.", size: 22, italics: true, color: "888888" })],
          spacing: { after: 100 }
        })
      );
    }

    // BENCHMARK COMPARISON
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "BENCHMARK COMPARISON", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    const docxBenchmarkComparisons = getBenchmarkComparisons(data);
    if (docxBenchmarkComparisons && docxBenchmarkComparisons.length > 0) {
      docxBenchmarkComparisons.slice(0, 6).forEach((comp: { metric?: string; companyValue?: string; industryAverage?: string; percentile?: string; assessment?: string }, index: number) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${comp.metric || 'Metric'}: `, bold: true, size: 22 }),
              new TextRun({ text: `Company: ${comp.companyValue || 'TBD'} `, size: 22 }),
              new TextRun({ text: `| Industry: ${comp.industryAverage || 'TBD'} `, size: 20, color: "666666" }),
              new TextRun({ text: `| ${comp.percentile || 'Top 50%'}`, size: 20, color: "27AE60" })
            ],
            spacing: { after: 100 }
          })
        );
      });
    } else {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "Benchmark comparison data under analysis.", size: 22, italics: true, color: "888888" })],
          spacing: { after: 100 }
        })
      );
    }

    // GROWTH CLASSIFICATION
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "GROWTH CLASSIFICATION", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (data.growthData) {
      const growthTier = data.growthData.tier || 2;
      const growthConfidence = data.growthData.confidence || 75;
      const tierColor = growthTier === 1 ? "27AE60" : growthTier === 2 ? "F39C12" : "E74C3C";

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Growth Tier: ${growthTier}`, size: 28, bold: true, color: tierColor }),
            new TextRun({ text: ` (${growthConfidence}% confidence)`, size: 22, color: "666666" })
          ],
          spacing: { after: 150 }
        })
      );

      if (data.growthData.scenarios) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Growth Scenarios:", bold: true, size: 22 })],
            spacing: { after: 100 }
          })
        );
        data.growthData.scenarios.forEach((scenario: { name?: string; growth?: number }, index: number) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `  • ${scenario.name || 'Scenario'}: `, size: 22 }),
                new TextRun({ text: `${scenario.growth || 0}x YoY Growth`, size: 22, bold: true })
              ],
              spacing: { after: 50 }
            })
          );
        });
      }
    } else {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "Growth classification pending analysis.", size: 22, italics: true, color: "888888" })],
          spacing: { after: 100 }
        })
      );
    }

    // GAP ANALYSIS
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "GAP ANALYSIS", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (data.gapData && data.gapData.heatmap) {
      data.gapData.heatmap.slice(0, 5).forEach((item: { category: string; gap: number; priority: "High" | "Medium" | "Low"; trend: number; direction: "up" | "down" | "stable" }, index: number) => {
        const priorityColor = item.priority === 'High' ? "E74C3C" : item.priority === 'Medium' ? "F39C12" : "27AE60";
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. ${item.category || 'Category'}: `, bold: true, size: 22 }),
              new TextRun({ text: `Gap Score: ${item.gap || 0}%`, size: 20 }),
              new TextRun({ text: ` | Trend: ${item.trend || 'Stable'} ${item.direction || ''}`, size: 20, color: "666666" })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `   Priority: ${item.priority || 'Medium'}`, size: 20, bold: true, color: priorityColor })
            ],
            spacing: { after: 100 }
          })
        );
      });
    } else {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "Gap analysis data under review.", size: 22, italics: true, color: "888888" })],
          spacing: { after: 100 }
        })
      );
    }

    // FOUNDER FIT ANALYSIS
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "FOUNDER FIT ANALYSIS", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (data.founderFitData) {
      const founderScore = data.founderFitData.readinessScore || 75;
      const founderColor = founderScore >= 70 ? "27AE60" : founderScore >= 50 ? "F39C12" : "E74C3C";

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Founder Readiness Score: ${founderScore}%`, size: 28, bold: true, color: founderColor })
          ],
          spacing: { after: 150 }
        })
      );

      if (data.founderFitData.investorList) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Top Investor Matches:", bold: true, size: 22 })],
            spacing: { after: 100 }
          })
        );
        data.founderFitData.investorList.slice(0, 5).forEach((investor: { name?: string; thesis?: string; match?: number; stage?: string }, index: number) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. ${investor.name || 'Investor'}: `, bold: true, size: 22 }),
                new TextRun({ text: `${investor.match || 0}% match`, size: 22 }),
                new TextRun({ text: ` | Stage: ${investor.stage || 'Seed'}`, size: 20, color: "666666" })
              ],
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `   Thesis: ${investor.thesis || 'Investment focus'}`, size: 20, italics: true, color: "666666" })
              ],
              spacing: { after: 80 }
            })
          );
        });
      }
    } else {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "Founder fit analysis pending evaluation.", size: 22, italics: true, color: "888888" })],
          spacing: { after: 100 }
        })
      );
    }

    // CEO QUESTIONS
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "KEY CEO QUESTIONS", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    const docxCeoQuestions = [
      'What is your 18-month roadmap for product-market fit expansion?',
      'How do you plan to address the identified competitive threats?',
      'What is your strategy for reducing customer acquisition cost?',
      'How will you scale the team while maintaining culture?',
      'What are your key milestones before the next funding round?'
    ];

    docxCeoQuestions.forEach((question, index) => {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `${index + 1}. ${question}`, size: 22 })],
          spacing: { after: 100 }
        })
      );
    });

    // INVESTMENT RECOMMENDATION
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "INVESTMENT RECOMMENDATION", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    const decision = score >= 8 ? 'STRONG BUY' : score >= 7 ? 'BUY' : score >= 6 ? 'CONDITIONAL BUY' : score >= 5 ? 'HOLD' : 'PASS';
    const confidence = score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low';

    sections.push(
      new Paragraph({
        children: [new TextRun({ text: decision, size: 36, bold: true, color: score >= 7 ? "27AE60" : score >= 5 ? "F39C12" : "E74C3C" })],
        alignment: 'center',
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Confidence Level: ${confidence}`, size: 24 })],
        alignment: 'center',
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Risk Profile: ${score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk'}`, size: 24 })],
        alignment: 'center',
        spacing: { after: 300 }
      })
    );

    // DUE DILIGENCE CHECKLIST
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "DUE DILIGENCE CHECKLIST", bold: true, size: 32, color: "1F4E79" })],
        spacing: { before: 400, after: 200 }
      })
    );

    const checklist = [
      'Management presentation and leadership interviews',
      'Financial model validation and projection review',
      'Customer reference calls and market validation',
      'Technical architecture and IP assessment',
      'Competitive landscape analysis',
      'Legal and regulatory compliance review',
      'Background checks on key personnel',
      'Reference checks with previous investors',
      'Market size and TAM validation',
      'Unit economics and scalability analysis'
    ];

    checklist.forEach((item, index) => {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `☐ ${item}`, size: 22 })],
          spacing: { after: 80 }
        })
      );
    });

    const doc = new Document({
      sections: [{
        children: sections,
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            }
          }
        }
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${companyName}-${reportType}-Analysis-Report.docx`);
    toast({
      title: 'Word Report Exported',
      description: 'Your professional Word document has been downloaded.'
    });
  };

  // Enhanced Comprehensive PowerPoint Export
  const handleExportPptx = () => {
    const data = getAnalysisData();
    if (!data) return;

    const companyName = getCompanyName();
    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    // SLIDE 1: Title Slide
    let titleSlide = pptx.addSlide();
    titleSlide.addText(`${companyName}`, {
      x: 1, y: 1.5, w: 8, h: 1, fontSize: 32, bold: true, align: 'center', color: '1f4e79'
    });
    titleSlide.addText(`COMPREHENSIVE INVESTMENT ANALYSIS`, {
      x: 1, y: 2.5, w: 8, h: 0.8, fontSize: 24, align: 'center', color: '2e5d93'
    });
    titleSlide.addText(`${reportType.toUpperCase()} REPORT`, {
      x: 1, y: 3.3, w: 8, h: 0.6, fontSize: 18, align: 'center', color: '5b8bb5'
    });
    titleSlide.addText(`Generated: ${new Date().toLocaleDateString()} | Analyst: ${role}`, {
      x: 1, y: 4.5, w: 8, h: 0.5, fontSize: 14, align: 'center', italic: true
    });

    // SLIDE 2: Executive Summary
    let execSlide = pptx.addSlide();
    execSlide.addText('Executive Summary', { x: 0.5, y: 0.25, fontSize: 24, bold: true, color: '1f4e79' });

    if (data.tcaData) {
      const score = data.tcaData.compositeScore;
      const rating = score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK';

      execSlide.addText(`Overall Investment Score: ${score.toFixed(2)}/10`, {
        x: 0.5, y: 1, fontSize: 20, bold: true, color: score >= 7 ? '27ae60' : score >= 5 ? 'f39c12' : 'e74c3c'
      });
      execSlide.addText(`Rating: ${rating}`, {
        x: 0.5, y: 1.5, fontSize: 18, bold: true
      });

      // Key highlights
      execSlide.addText('Key Highlights:', { x: 0.5, y: 2.2, fontSize: 16, bold: true });
      execSlide.addText(`• ${data.tcaData.categories.filter(c => c.flag === 'green').length} categories with strong performance`, {
        x: 0.5, y: 2.7, fontSize: 14
      });
      execSlide.addText(`• ${data.tcaData.categories.filter(c => c.flag === 'red').length} areas requiring attention`, {
        x: 0.5, y: 3.1, fontSize: 14
      });

      const recommendation = score >= 7 ? 'RECOMMEND: Proceed to Due Diligence' :
        score >= 5 ? 'CONDITIONAL: Address key concerns' :
          'PASS: Significant risks identified';
      execSlide.addText(`Investment Recommendation: ${recommendation}`, {
        x: 0.5, y: 4, fontSize: 16, bold: true,
        color: score >= 7 ? '27ae60' : score >= 5 ? 'f39c12' : 'e74c3c'
      });
    }

    // SLIDE 3: TCA Scorecard Overview
    if (data.tcaData) {
      let tcaSlide = pptx.addSlide();
      tcaSlide.addText('TCA Scorecard Analysis', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });
      tcaSlide.addText(`Composite Score: ${data.tcaData.compositeScore.toFixed(2)}/10`, {
        x: 0.5, y: 0.75, fontSize: 16, bold: true
      });

      const tableRows = data.tcaData.categories.map(c => [
        { text: c.category, options: { fontSize: 11 } },
        { text: String(c.rawScore), options: { fontSize: 11, align: 'center' as const } },
        { text: `${c.weight}%`, options: { fontSize: 11, align: 'center' as const } },
        {
          text: c.flag.toUpperCase(), options: {
            fontSize: 11,
            align: 'center' as const,
            color: c.flag === 'green' ? '27ae60' : c.flag === 'yellow' ? 'f39c12' : 'e74c3c',
            bold: true
          }
        },
        { text: ((c.rawScore * c.weight) / 100).toFixed(2), options: { fontSize: 11, align: 'center' as const } }
      ]);

      tcaSlide.addTable([
        [
          { text: 'Category', options: { bold: true, fontSize: 12, fill: { color: '1f4e79' }, color: 'ffffff' } },
          { text: 'Score', options: { bold: true, fontSize: 12, fill: { color: '1f4e79' }, color: 'ffffff' } },
          { text: 'Weight', options: { bold: true, fontSize: 12, fill: { color: '1f4e79' }, color: 'ffffff' } },
          { text: 'Status', options: { bold: true, fontSize: 12, fill: { color: '1f4e79' }, color: 'ffffff' } },
          { text: 'Contribution', options: { bold: true, fontSize: 12, fill: { color: '1f4e79' }, color: 'ffffff' } }
        ],
        ...tableRows
      ], {
        x: 0.5, y: 1.3, w: 9.0, h: 3.5,
        border: { type: 'solid', color: '333333' },
        fill: { color: 'f8f9fa' }
      });
    }

    // SLIDE 4: Risk Assessment Matrix
    if (data.riskData) {
      let riskSlide = pptx.addSlide();
      riskSlide.addText('Risk Assessment Matrix', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

      const riskCounts = {
        red: data.riskData.riskFlags.filter(r => r.flag === 'red').length,
        yellow: data.riskData.riskFlags.filter(r => r.flag === 'yellow').length,
        green: data.riskData.riskFlags.filter(r => r.flag === 'green').length
      };

      // Risk distribution chart (text-based)
      riskSlide.addText('Risk Distribution:', { x: 0.5, y: 0.8, fontSize: 16, bold: true });
      riskSlide.addText(`Critical Risks: ${riskCounts.red}`, {
        x: 0.5, y: 1.2, fontSize: 14, color: 'e74c3c', bold: true
      });
      riskSlide.addText(`Moderate Risks: ${riskCounts.yellow}`, {
        x: 0.5, y: 1.5, fontSize: 14, color: 'f39c12', bold: true
      });
      riskSlide.addText(`Low Risks: ${riskCounts.green}`, {
        x: 0.5, y: 1.8, fontSize: 14, color: '27ae60', bold: true
      });

      // Top risks table
      const topRisks = data.riskData.riskFlags
        .filter(r => r.flag === 'red')
        .slice(0, 5)
        .map(r => [
          { text: r.domain, options: { fontSize: 11 } },
          { text: r.flag.toUpperCase(), options: { fontSize: 11, color: 'e74c3c', bold: true } },
          { text: r.trigger.slice(0, 50) + '...', options: { fontSize: 10 } },
          { text: r.mitigation?.slice(0, 40) + '...' || 'TBD', options: { fontSize: 10 } }
        ]);

      if (topRisks.length > 0) {
        riskSlide.addText('Top Critical Risks:', { x: 0.5, y: 2.5, fontSize: 16, bold: true });
        riskSlide.addTable([
          [
            { text: 'Domain', options: { bold: true, fontSize: 11, fill: { color: 'e74c3c' }, color: 'ffffff' } },
            { text: 'Level', options: { bold: true, fontSize: 11, fill: { color: 'e74c3c' }, color: 'ffffff' } },
            { text: 'Risk Trigger', options: { bold: true, fontSize: 11, fill: { color: 'e74c3c' }, color: 'ffffff' } },
            { text: 'Mitigation', options: { bold: true, fontSize: 11, fill: { color: 'e74c3c' }, color: 'ffffff' } }
          ],
          ...topRisks
        ], {
          x: 0.5, y: 2.9, w: 9.0, h: 2.0,
          border: { type: 'solid', color: '333333' }
        });
      }
    }

    // SLIDE 5: Financial Health Summary
    if (data.financialsData) {
      let finSlide = pptx.addSlide();
      finSlide.addText('Financial Health Assessment', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

      const financialMetrics = [
        ['Revenue Growth', data.financialsData.revenueGrowth || 'Under Analysis', 'Key Performance Indicator'],
        ['Monthly Burn Rate', data.financialsData.burnRate || 'Under Review', 'Cash Management'],
        ['Cash Runway', data.financialsData.runway || 'To be determined', 'Sustainability Metric'],
        ['Gross Margin', data.financialsData.grossMargin || 'Pending', 'Profitability Indicator'],
        ['Customer Acquisition Cost', data.financialsData.cac || 'Under Review', 'Efficiency Metric']
      ];

      finSlide.addTable([
        [
          { text: 'Financial Metric', options: { bold: true, fontSize: 12, fill: { color: '27ae60' }, color: 'ffffff' } },
          { text: 'Current Value', options: { bold: true, fontSize: 12, fill: { color: '27ae60' }, color: 'ffffff' } },
          { text: 'Category', options: { bold: true, fontSize: 12, fill: { color: '27ae60' }, color: 'ffffff' } }
        ],
        ...financialMetrics.map(metric => [
          { text: metric[0], options: { fontSize: 11 } },
          { text: metric[1], options: { fontSize: 11, bold: true } },
          { text: metric[2], options: { fontSize: 10, italic: true } }
        ])
      ], {
        x: 0.5, y: 1.0, w: 9.0, h: 3.0,
        border: { type: 'solid', color: '333333' }
      });
    }

    // SLIDE 6: Team & Leadership Assessment
    const pptxTeamMembers = getTeamMembers(data);
    if (pptxTeamMembers) {
      let teamSlide = pptx.addSlide();
      teamSlide.addText('Team & Leadership Assessment', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

      const teamTableRows = pptxTeamMembers.slice(0, 6).map((member: { name?: string; role?: string; experience?: string; assessment?: string }) => [
        { text: member.name || 'Team Member', options: { fontSize: 11, bold: true } },
        { text: member.role || 'Key Role', options: { fontSize: 11 } },
        { text: member.experience || 'Experienced Professional', options: { fontSize: 10 } },
        {
          text: member.assessment || 'Strong Contributor', options: {
            fontSize: 11,
            color: member.assessment?.includes('Strong') ? '27ae60' : '333333'
          }
        }
      ]);

      teamSlide.addTable([
        [
          { text: 'Name', options: { bold: true, fontSize: 12, fill: { color: '3498db' }, color: 'ffffff' } },
          { text: 'Role', options: { bold: true, fontSize: 12, fill: { color: '3498db' }, color: 'ffffff' } },
          { text: 'Experience', options: { bold: true, fontSize: 12, fill: { color: '3498db' }, color: 'ffffff' } },
          { text: 'Assessment', options: { bold: true, fontSize: 12, fill: { color: '3498db' }, color: 'ffffff' } }
        ],
        ...teamTableRows
      ], {
        x: 0.5, y: 1.0, w: 9.0, h: 3.5,
        border: { type: 'solid', color: '333333' }
      });
    }

    // SLIDE 7: Macro Trend & Benchmark Analysis
    let macroSlide = pptx.addSlide();
    macroSlide.addText('Macro Trend & Benchmark Analysis', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

    if (data.macroData) {
      macroSlide.addText(`Sector Outlook: ${data.macroData.sectorOutlook || 'Under Analysis'}`, { x: 0.5, y: 0.8, fontSize: 14, bold: true });
      macroSlide.addText(`Trend Score: ${data.macroData.trendOverlayScore || 'N/A'}`, { x: 0.5, y: 1.1, fontSize: 12, color: '27ae60' });

      const trendSignals = data.macroData.trendSignals || [];
      if (trendSignals.length > 0) {
        const trendRows = trendSignals.slice(0, 4).map((signal: string, idx: number) => [
          { text: `${idx + 1}`, options: { fontSize: 11, bold: true } },
          { text: signal, options: { fontSize: 11 } }
        ]);

        macroSlide.addText('Trend Signals:', { x: 0.5, y: 1.5, fontSize: 12, bold: true });
        macroSlide.addTable([
          [
            { text: '#', options: { bold: true, fontSize: 11, fill: { color: '9b59b6' }, color: 'ffffff' } },
            { text: 'Signal', options: { bold: true, fontSize: 11, fill: { color: '9b59b6' }, color: 'ffffff' } }
          ],
          ...trendRows
        ], {
          x: 0.5, y: 1.8, w: 4.2, h: 1.5,
          border: { type: 'solid', color: '333333' }
        });
      }
    }

    const pptxBenchmarkComparisons = getBenchmarkComparisons(data);
    if (pptxBenchmarkComparisons && pptxBenchmarkComparisons.length > 0) {
      const benchRows = pptxBenchmarkComparisons.slice(0, 4).map((b: { metric?: string; companyValue?: string; industryAverage?: string; percentile?: string }) => [
        { text: b.metric || 'Metric', options: { fontSize: 11 } },
        { text: b.companyValue || 'TBD', options: { fontSize: 11, bold: true } },
        { text: b.industryAverage || 'TBD', options: { fontSize: 11 } },
        { text: b.percentile || 'Top 50%', options: { fontSize: 11, color: '27ae60' } }
      ]);

      macroSlide.addText('Benchmark Comparison:', { x: 5.0, y: 0.8, fontSize: 14, bold: true });
      macroSlide.addTable([
        [
          { text: 'Metric', options: { bold: true, fontSize: 10, fill: { color: '34495e' }, color: 'ffffff' } },
          { text: 'Company', options: { bold: true, fontSize: 10, fill: { color: '34495e' }, color: 'ffffff' } },
          { text: 'Industry', options: { bold: true, fontSize: 10, fill: { color: '34495e' }, color: 'ffffff' } },
          { text: 'Percentile', options: { bold: true, fontSize: 10, fill: { color: '34495e' }, color: 'ffffff' } }
        ],
        ...benchRows
      ], {
        x: 5.0, y: 1.1, w: 4.5, h: 1.8,
        border: { type: 'solid', color: '333333' }
      });
    }

    // SLIDE 8: Growth Classification & Gap Analysis
    let growthSlide = pptx.addSlide();
    growthSlide.addText('Growth Classification & Gap Analysis', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

    if (data.growthData) {
      const growthTier = data.growthData.tier || 2;
      const growthConfidence = data.growthData.confidence || 75;
      const tierColor = growthTier === 1 ? '27ae60' : growthTier === 2 ? 'f39c12' : 'e74c3c';

      growthSlide.addText(`Growth Tier: ${growthTier}`, { x: 0.5, y: 0.8, fontSize: 18, bold: true, color: tierColor });
      growthSlide.addText(`Confidence: ${growthConfidence}%`, { x: 2.5, y: 0.8, fontSize: 14 });

      if (data.growthData.scenarios) {
        const scenarioRows = data.growthData.scenarios.map((s: { name?: string; growth?: number }) => [
          { text: s.name || 'Scenario', options: { fontSize: 11 } },
          { text: `${s.growth || 0}x YoY`, options: { fontSize: 11, bold: true } }
        ]);

        growthSlide.addTable([
          [
            { text: 'Scenario', options: { bold: true, fontSize: 11, fill: { color: '2ecc71' }, color: 'ffffff' } },
            { text: 'Growth Rate', options: { bold: true, fontSize: 11, fill: { color: '2ecc71' }, color: 'ffffff' } }
          ],
          ...scenarioRows
        ], {
          x: 0.5, y: 1.2, w: 3.5, h: 1.5,
          border: { type: 'solid', color: '333333' }
        });
      }
    }

    if (data.gapData && data.gapData.heatmap) {
      const gapRows = data.gapData.heatmap.slice(0, 4).map((g: { category: string; gap: number; priority: "High" | "Medium" | "Low"; trend: number; direction: "up" | "down" | "stable" }) => [
        { text: g.category || 'Category', options: { fontSize: 11 } },
        { text: `${g.gap || 0}%`, options: { fontSize: 11 } },
        { text: g.priority || 'Medium', options: { fontSize: 11, color: g.priority === 'High' ? 'e74c3c' : g.priority === 'Medium' ? 'f39c12' : '27ae60' } }
      ]);

      growthSlide.addText('Gap Analysis:', { x: 5.0, y: 0.8, fontSize: 14, bold: true });
      growthSlide.addTable([
        [
          { text: 'Category', options: { bold: true, fontSize: 11, fill: { color: 'e67e22' }, color: 'ffffff' } },
          { text: 'Gap', options: { bold: true, fontSize: 11, fill: { color: 'e67e22' }, color: 'ffffff' } },
          { text: 'Priority', options: { bold: true, fontSize: 11, fill: { color: 'e67e22' }, color: 'ffffff' } }
        ],
        ...gapRows
      ], {
        x: 5.0, y: 1.1, w: 4.5, h: 1.8,
        border: { type: 'solid', color: '333333' }
      });
    }

    // SLIDE 9: Founder Fit & CEO Questions
    let founderSlide = pptx.addSlide();
    founderSlide.addText('Founder Fit & CEO Questions', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

    if (data.founderFitData) {
      const founderScore = data.founderFitData.readinessScore || 75;
      const founderColor = founderScore >= 70 ? '27ae60' : founderScore >= 50 ? 'f39c12' : 'e74c3c';

      founderSlide.addText(`Founder Readiness Score: ${founderScore}%`, { x: 0.5, y: 0.8, fontSize: 18, bold: true, color: founderColor });

      if (data.founderFitData.investorList) {
        const investorRows = data.founderFitData.investorList.slice(0, 5).map((inv: { name?: string; match?: number; stage?: string }) => [
          { text: inv.name || 'Investor', options: { fontSize: 11 } },
          { text: `${inv.match || 0}%`, options: { fontSize: 11, bold: true } },
          { text: inv.stage || 'Seed', options: { fontSize: 11 } }
        ]);

        founderSlide.addTable([
          [
            { text: 'Investor', options: { bold: true, fontSize: 11, fill: { color: '8e44ad' }, color: 'ffffff' } },
            { text: 'Match', options: { bold: true, fontSize: 11, fill: { color: '8e44ad' }, color: 'ffffff' } },
            { text: 'Stage', options: { bold: true, fontSize: 11, fill: { color: '8e44ad' }, color: 'ffffff' } }
          ],
          ...investorRows
        ], {
          x: 0.5, y: 1.2, w: 4.5, h: 2.2,
          border: { type: 'solid', color: '333333' }
        });
      }
    }

    // CEO Questions
    const pptxCeoQuestions = [
      '1. 18-month product-market fit roadmap?',
      '2. Strategy to address competitive threats?',
      '3. Plan for reducing customer acquisition cost?',
      '4. Team scaling while maintaining culture?',
      '5. Key milestones before next funding round?'
    ];

    founderSlide.addText('Key CEO Questions:', { x: 5.5, y: 0.8, fontSize: 14, bold: true });
    pptxCeoQuestions.forEach((q, index) => {
      founderSlide.addText(q, { x: 5.5, y: 1.2 + (index * 0.4), fontSize: 12 });
    });

    // SLIDE 10: Investment Recommendation
    let recSlide = pptx.addSlide();
    recSlide.addText('Investment Recommendation', { x: 0.5, y: 0.25, fontSize: 24, bold: true, color: '1f4e79' });

    const score = data.tcaData?.compositeScore || 0;
    const decision = score >= 8 ? 'STRONG BUY' : score >= 7 ? 'BUY' : score >= 6 ? 'CONDITIONAL BUY' : 'PASS';
    const confidence = score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low';
    const decisionColor = score >= 7 ? '27ae60' : score >= 5 ? 'f39c12' : 'e74c3c';

    recSlide.addText(`Investment Decision: ${decision}`, {
      x: 1, y: 1.5, fontSize: 20, bold: true, color: decisionColor
    });
    recSlide.addText(`Confidence Level: ${confidence}`, {
      x: 1, y: 2.0, fontSize: 16, bold: true
    });
    recSlide.addText(`Overall TCA Score: ${score.toFixed(2)}/10`, {
      x: 1, y: 2.5, fontSize: 16
    });

    // Key decision factors
    recSlide.addText('Key Decision Factors:', { x: 1, y: 3.2, fontSize: 16, bold: true });
    recSlide.addText('• Technology readiness and competitive advantage', { x: 1.2, y: 3.6, fontSize: 14 });
    recSlide.addText('• Market opportunity size and growth potential', { x: 1.2, y: 3.9, fontSize: 14 });
    recSlide.addText('• Management team experience and execution capability', { x: 1.2, y: 4.2, fontSize: 14 });
    recSlide.addText('• Financial health and capital efficiency', { x: 1.2, y: 4.5, fontSize: 14 });
    recSlide.addText('• Strategic fit with investment criteria', { x: 1.2, y: 4.8, fontSize: 14 });

    // SLIDE 11: Next Steps
    let nextSlide = pptx.addSlide();
    nextSlide.addText('Recommended Next Steps', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

    const nextSteps = [
      '1. Conduct detailed management presentation and Q&A',
      '2. Perform comprehensive financial model validation',
      '3. Complete customer reference calls and market validation',
      '4. Conduct technical and IP due diligence assessment',
      '5. Validate competitive positioning and market opportunity',
      '6. Review legal structure and regulatory compliance',
      '7. Complete background checks on key personnel',
      '8. Finalize investment terms and valuation discussion'
    ];

    nextSteps.forEach((step, index) => {
      nextSlide.addText(step, { x: 0.8, y: 1.2 + (index * 0.4), fontSize: 14 });
    });

    // Timeline
    nextSlide.addText('Estimated Timeline: 4-6 weeks for complete due diligence', {
      x: 0.5, y: 4.8, fontSize: 14, bold: true, italic: true
    });

    pptx.writeFile({ fileName: `${companyName}-COMPREHENSIVE-${reportType}-Analysis.pptx` });
    toast({
      title: 'Comprehensive PowerPoint Exported',
      description: `Complete ${reportType} presentation with 11 detailed analysis slides has been downloaded.`
    });
  };

  // Enhanced ZIP Export with categorized files
  const handleDownloadZip = async () => {
    toast({
      title: 'Preparing Download',
      description: 'Generating comprehensive analysis data package.',
    });

    const data = getAnalysisData();
    if (!data) return;

    const companyName = getCompanyName();
    const zip = new JSZip();

    // Summary file with metadata
    const summary = {
      companyName,
      reportType,
      analystRole: role,
      compositeScore: data.tcaData?.compositeScore,
      riskLevel: data.riskData?.riskFlags.filter(r => r.flag === 'red').length || 0,
      generatedAt: new Date().toISOString(),
      exportType: 'comprehensive_analysis_package'
    };
    zip.file('analysis-summary.json', JSON.stringify(summary, null, 2));

    // Core analysis data
    const coreFolder = zip.folder('core-analysis');
    if (coreFolder && data.tcaData) {
      coreFolder.file('tca-scorecard.json', JSON.stringify(data.tcaData, null, 2));
    }
    if (coreFolder && data.riskData) {
      coreFolder.file('risk-analysis.json', JSON.stringify(data.riskData, null, 2));
    }

    // Extended analysis data
    const extendedFolder = zip.folder('extended-analysis');
    if (extendedFolder) {
      if (data.benchmarkData) extendedFolder.file('benchmark-comparison.json', JSON.stringify(data.benchmarkData, null, 2));
      if (data.macroData) extendedFolder.file('macro-trend-alignment.json', JSON.stringify(data.macroData, null, 2));
      if (data.growthData) extendedFolder.file('growth-classifier.json', JSON.stringify(data.growthData, null, 2));
      if (data.gapData) extendedFolder.file('gap-analysis.json', JSON.stringify(data.gapData, null, 2));
      if (data.founderFitData) extendedFolder.file('founder-fit-analysis.json', JSON.stringify(data.founderFitData, null, 2));
      if (data.teamData) extendedFolder.file('team-assessment.json', JSON.stringify(data.teamData, null, 2));
      if (data.strategicFitData) extendedFolder.file('strategic-fit-matrix.json', JSON.stringify(data.strategicFitData, null, 2));
      if (data.financialsData) extendedFolder.file('financial-analysis.json', JSON.stringify(data.financialsData, null, 2));
    }

    // Configuration and metadata
    const configFolder = zip.folder('configuration');
    if (configFolder) {
      const config = {
        reportType,
        role,
        moduleWeights: data.tcaData?.categories.map(c => ({ category: c.category, weight: c.weight })),
        analysisFramework: typeof window !== 'undefined' ? localStorage.getItem('analysisFramework') || 'general' : 'general',
        exportTimestamp: new Date().toISOString()
      };
      configFolder.file('analysis-config.json', JSON.stringify(config, null, 2));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${companyName}-${reportType}-Analysis-Package.zip`);

    toast({
      title: 'Analysis Package Downloaded',
      description: 'Complete analysis data package with categorized files ready.',
    });
  };

  // Comprehensive Excel Export with Multiple Sheets using xlsx library
  const handleExportXlsx = () => {
    const data = getAnalysisData();
    if (!data) return;

    toast({
      title: 'Excel Export In Progress',
      description: 'Generating comprehensive Excel workbook with multiple analysis sheets...',
    });

    const companyName = getCompanyName();
    const score = data.tcaData?.compositeScore || 0;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // ========== SHEET 1: Executive Summary ==========
    const summaryData = [
      ['COMPREHENSIVE INVESTMENT ANALYSIS REPORT'],
      [''],
      ['Company Name', companyName],
      ['Report Type', reportType.toUpperCase()],
      ['Analyst', role],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Generated Time', new Date().toLocaleTimeString()],
      [''],
      ['EXECUTIVE SUMMARY'],
      ['Overall TCA Score', data.tcaData?.compositeScore?.toFixed(2) || 'N/A'],
      ['Score Rating', score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK'],
      ['Investment Recommendation', score >= 7 ? 'RECOMMEND - Proceed to Due Diligence' : score >= 5 ? 'CONDITIONAL - Address Key Concerns' : 'DECLINE - Does Not Meet Criteria'],
      ['Confidence Level', score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low'],
      ['Risk Profile', score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk'],
      [''],
      ['ANALYSIS SUMMARY'],
      ['Categories Analyzed', data.tcaData?.categories?.length || 0],
      ['Green Flags', data.tcaData?.categories?.filter(c => c.flag === 'green').length || 0],
      ['Yellow Flags', data.tcaData?.categories?.filter(c => c.flag === 'yellow').length || 0],
      ['Red Flags', data.tcaData?.categories?.filter(c => c.flag === 'red').length || 0],
      ['Total Risk Factors', data.riskData?.riskFlags?.length || 0],
      ['Critical Risks', data.riskData?.riskFlags?.filter(r => r.flag === 'red').length || 0]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

    // ========== SHEET 2: TCA Scorecard ==========
    const tcaHeader = ['Category', 'Raw Score', 'Weight %', 'Weighted Score', 'Flag', 'Confidence', 'Strengths', 'Concerns', 'Recommendations'];
    const tcaRows = data.tcaData?.categories?.map(cat => [
      cat.category,
      cat.rawScore,
      cat.weight,
      ((cat.rawScore * cat.weight) / 100).toFixed(2),
      cat.flag?.toUpperCase() || 'N/A',
      'High', // Confidence level inferred from flag status
      cat.strengths || 'N/A',
      cat.concerns || 'None identified',
      cat.aiRecommendation || 'Continue monitoring'
    ]) || [];
    const tcaData = [tcaHeader, ...tcaRows];
    const wsTCA = XLSX.utils.aoa_to_sheet(tcaData);
    wsTCA['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsTCA, 'TCA Scorecard');

    // ========== SHEET 3: Risk Analysis ==========
    const riskHeader = ['Domain', 'Risk Level', 'Trigger', 'Mitigation Strategy', 'Priority', 'Impact', 'Likelihood', 'Status'];
    const riskRows = data.riskData?.riskFlags?.map(risk => [
      risk.domain,
      risk.flag?.toUpperCase() || 'N/A',
      risk.trigger,
      risk.mitigation || 'Under development',
      risk.flag === 'red' ? 'Critical' : risk.flag === 'yellow' ? 'High' : 'Medium', // Priority inferred from flag
      risk.impact || 'Significant',
      risk.flag === 'red' ? 'High' : risk.flag === 'yellow' ? 'Medium' : 'Low', // Likelihood inferred from flag
      'Active' // Default status
    ]) || [];
    const riskData = [riskHeader, ...riskRows];
    const wsRisk = XLSX.utils.aoa_to_sheet(riskData);
    wsRisk['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 45 }, { wch: 45 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsRisk, 'Risk Analysis');

    // ========== SHEET 4: Benchmark Comparison ==========
    const xlsxBenchmarkComparisons = getBenchmarkComparisons(data);
    const benchmarkHeader = ['Metric', 'Company Value', 'Industry Average', 'Percentile Rank', 'Assessment', 'Variance', 'Notes'];
    const benchmarkRows = xlsxBenchmarkComparisons?.map((comp: { metric?: string; companyValue?: string; industryAverage?: string; percentile?: string; assessment?: string; variance?: string; notes?: string }) => [
      comp.metric || 'Metric',
      comp.companyValue || 'TBD',
      comp.industryAverage || 'TBD',
      comp.percentile || 'TBD',
      comp.assessment || 'Under Review',
      comp.variance || 'N/A',
      comp.notes || ''
    ]) || [['No benchmark data available', '', '', '', '', '', '']];
    const benchmarkData = [benchmarkHeader, ...benchmarkRows];
    const wsBenchmark = XLSX.utils.aoa_to_sheet(benchmarkData);
    wsBenchmark['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsBenchmark, 'Benchmark Comparison');

    // ========== SHEET 5: Financial Analysis ==========
    const financialData = [
      ['FINANCIAL HEALTH ANALYSIS'],
      [''],
      ['Metric', 'Value', 'Assessment', 'Industry Benchmark', 'Notes'],
      ['Revenue Growth Rate', data.financialsData?.revenueGrowth || 'Under Analysis', 'Key Performance Indicator', '25%+ Strong', 'Primary growth metric'],
      ['Monthly Burn Rate', data.financialsData?.burnRate || 'Under Review', 'Cash Efficiency', '$50K Average', 'Monitor closely'],
      ['Cash Runway (Months)', data.financialsData?.runway || 'To be determined', 'Sustainability', '18 months ideal', 'Critical metric'],
      ['Gross Margin', data.financialsData?.grossMargin || 'Pending', 'Profitability', '60%+ target', 'Efficiency indicator'],
      ['Customer Acquisition Cost', data.financialsData?.cac || 'Under Review', 'Efficiency', 'Varies by sector', 'Growth efficiency'],
      ['Lifetime Value (LTV)', data.financialsData?.ltv || 'Under Calculation', 'Unit Economics', 'LTV > 3x CAC', 'Customer value'],
      ['LTV:CAC Ratio', data.financialsData?.cacLtv || 'TBD', 'Unit Economics', '3:1 or better', 'Business viability'],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Overall Financial Health', data.financialsData?.overallHealth || 'Requires Analysis'],
      ['Key Financial Strengths', data.financialsData?.strengths || 'To be identified'],
      ['Key Financial Concerns', data.financialsData?.concerns || 'To be assessed']
    ];
    const wsFinancial = XLSX.utils.aoa_to_sheet(financialData);
    wsFinancial['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financial Analysis');

    // ========== SHEET 6: Team Assessment ==========
    const xlsxTeamMembers = getTeamMembers(data);
    const teamHeader = ['Name', 'Role', 'Experience', 'Assessment', 'Strengths', 'Areas for Development', 'Notes'];
    const teamRows = xlsxTeamMembers?.map((member: { name?: string; role?: string; experience?: string; assessment?: string; strengths?: string; areasForDevelopment?: string; notes?: string }) => [
      member.name || 'Team Member',
      member.role || 'Key Role',
      member.experience || 'Experienced Professional',
      member.assessment || 'Strong Contributor',
      member.strengths || 'To be assessed',
      member.areasForDevelopment || 'N/A',
      member.notes || ''
    ]) || [['No team data available', '', '', '', '', '', '']];
    const teamData = [teamHeader, ...teamRows];
    const wsTeam = XLSX.utils.aoa_to_sheet(teamData);
    wsTeam['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsTeam, 'Team Assessment');

    // ========== SHEET 7: Growth Analysis ==========
    const xlsxGrowthFactors = getGrowthFactors(data);
    const growthHeader = ['Growth Factor', 'Assessment', 'Score', 'Trend', 'Time Horizon', 'Impact', 'Confidence'];
    const growthRows = xlsxGrowthFactors?.map((factor: { name?: string; assessment?: string; score?: string; trend?: string; timeHorizon?: string; impact?: string; confidence?: string }) => [
      factor.name || 'Growth Driver',
      factor.assessment || 'Positive',
      factor.score || '7.5',
      factor.trend || 'Increasing',
      factor.timeHorizon || '12-18 months',
      factor.impact || 'High',
      factor.confidence || 'Medium'
    ]) || [['No growth data available', '', '', '', '', '', '']];
    const growthData = [growthHeader, ...growthRows];
    const wsGrowth = XLSX.utils.aoa_to_sheet(growthData);
    wsGrowth['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsGrowth, 'Growth Analysis');

    // ========== SHEET 8: Strategic Fit ==========
    const xlsxStrategicFactors = getStrategicFactors(data);
    const strategicHeader = ['Strategic Factor', 'Alignment', 'Impact', 'Priority', 'Assessment', 'Action Required'];
    const strategicRows = xlsxStrategicFactors?.map((factor: { factor?: string; alignment?: string; impact?: string; priority?: string; assessment?: string; actionRequired?: string }) => [
      factor.factor || 'Strategic Element',
      factor.alignment || 'Strong',
      factor.impact || 'High',
      factor.priority || 'Critical',
      factor.assessment || 'Positive',
      factor.actionRequired || 'Monitor'
    ]) || [['No strategic fit data available', '', '', '', '', '']];
    const strategicData = [strategicHeader, ...strategicRows];
    const wsStrategic = XLSX.utils.aoa_to_sheet(strategicData);
    wsStrategic['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsStrategic, 'Strategic Fit');

    // ========== SHEET 9: Investment Decision ==========
    const decisionData = [
      ['INVESTMENT DECISION FRAMEWORK'],
      [''],
      ['Decision Factor', 'Assessment', 'Rationale'],
      ['Overall Recommendation', score >= 7 ? 'RECOMMEND' : score >= 5 ? 'CONDITIONAL' : 'DECLINE', `Based on TCA score of ${score.toFixed(2)}`],
      ['Confidence Level', score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low', 'Analysis completeness and data quality'],
      ['Risk Profile', score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk', 'Based on risk assessment matrix'],
      ['Strategic Alignment', 'Review Required', 'Requires fund strategy alignment analysis'],
      ['Valuation Assessment', 'TBD', 'Pending detailed financial due diligence'],
      [''],
      ['DUE DILIGENCE CHECKLIST'],
      ['Action Item', 'Status', 'Priority'],
      ['Management presentation and Q&A', 'Pending', 'High'],
      ['Financial model validation', 'Pending', 'Critical'],
      ['Customer reference calls', 'Pending', 'High'],
      ['Technical architecture review', 'Pending', 'Medium'],
      ['Competitive analysis deep dive', 'Pending', 'Medium'],
      ['Legal and regulatory review', 'Pending', 'High'],
      ['Background checks', 'Pending', 'Medium'],
      ['Market size validation', 'Pending', 'High'],
      ['Unit economics analysis', 'Pending', 'Critical']
    ];
    const wsDecision = XLSX.utils.aoa_to_sheet(decisionData);
    wsDecision['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsDecision, 'Investment Decision');

    // ========== SHEET 10: Raw Data (JSON) ==========
    const summaryTeamMembers = getTeamMembers(data);
    const summaryGrowthFactors = getGrowthFactors(data);
    const summaryStrategicFactors = getStrategicFactors(data);
    const summaryBenchmarkComparisons = getBenchmarkComparisons(data);
    const rawDataForSheet = [
      ['RAW ANALYSIS DATA'],
      [''],
      ['Data Source', 'Status', 'Record Count'],
      ['TCA Data', data.tcaData ? 'Available' : 'Not Available', data.tcaData?.categories?.length || 0],
      ['Risk Data', data.riskData ? 'Available' : 'Not Available', data.riskData?.riskFlags?.length || 0],
      ['Benchmark Data', data.benchmarkData ? 'Available' : 'Not Available', summaryBenchmarkComparisons?.length || 0],
      ['Financial Data', data.financialsData ? 'Available' : 'Not Available', 'N/A'],
      ['Team Data', data.teamData ? 'Available' : 'Not Available', summaryTeamMembers?.length || 0],
      ['Growth Data', data.growthData ? 'Available' : 'Not Available', summaryGrowthFactors?.length || 0],
      ['Strategic Fit Data', data.strategicFitData ? 'Available' : 'Not Available', summaryStrategicFactors?.length || 0],
      [''],
      ['Export Metadata'],
      ['Export Format', 'Microsoft Excel Workbook (.xlsx)'],
      ['Total Sheets', '10'],
      ['Generator', 'TCA-IRR Analysis Platform'],
      ['Version', '2.0']
    ];
    const wsRawData = XLSX.utils.aoa_to_sheet(rawDataForSheet);
    wsRawData['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsRawData, 'Data Summary');

    // Write the workbook and trigger download
    const fileName = `${companyName}-COMPREHENSIVE-Analysis-${reportType.toUpperCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: 'Excel Workbook Exported Successfully',
      description: `Complete 10-sheet Excel workbook with all analysis modules has been downloaded.`,
    });
  };

  const handleShare = (type: 'link' | 'email') => {
    const reportUrl = window.location.href.replace('/configure', '');
    const companyName = getCompanyName();

    if (type === 'link') {
      navigator.clipboard.writeText(reportUrl);
      toast({
        title: 'Report Link Copied',
        description: `Shareable link for ${companyName} ${reportType} report copied to clipboard.`,
      });
    } else {
      const subject = `${reportType.toUpperCase()} Analysis Report: ${companyName}`;
      const body = `Please review the following ${reportType} analysis report for ${companyName}:\n\n${reportUrl}\n\nGenerated by: ${role}\nDate: ${new Date().toLocaleDateString()}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <>
      {showPreview && (
        <ReportPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          analysisData={getAnalysisData() || {} as any}
          companyName={getCompanyName()}
          onExportPDF={handleExportFullReport}
          onExportJSON={handleDownloadZip}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="size-4" />
            Export & Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          {/* Preview Report Button */}
          <DropdownMenuItem onClick={() => {
            if (!localStorage.getItem('analysisResult')) {
              toast({ variant: 'destructive', title: 'No Data Found', description: 'Please run an analysis before previewing the report.' });
              return;
            }
            setShowPreview(true);
          }} className="flex items-center gap-3 py-2 text-primary font-medium">
            <Eye className="size-4" />
            <span>Preview Report</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Export ({reportType.toUpperCase()})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Two-Page Reports */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-3 py-2">
              <StickyNote className="size-4 text-muted-foreground" />
              <span>Two-Page Reports</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuItem onClick={handleExportTriageTwoPage} className="flex items-center gap-3 py-2">
                <FileText className="size-4 text-green-600" />
                <span>Triage Summary (2 pages)</span>
              </DropdownMenuItem>
              {(role === 'admin' || role === 'analyst') && (
                <DropdownMenuItem onClick={handleExportDDTwoPage} className="flex items-center gap-3 py-2">
                  <FileText className="size-4 text-blue-600" />
                  <span>DD Summary (2 pages)</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Full Comprehensive Reports */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-3 py-2">
              <FileText className="size-4 text-muted-foreground" />
              <span>Full Comprehensive Reports</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuItem onClick={handleExportFullReport} className="flex items-center gap-3 py-2">
                <FileText className="size-4 text-red-600" />
                <div className="flex flex-col">
                  <span>Complete Analysis PDF</span>
                  <span className="text-xs text-muted-foreground">9 pages with all modules</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDocx} className="flex items-center gap-3 py-2">
                <FileText className="size-4 text-blue-600" />
                <div className="flex flex-col">
                  <span>Full Word Document</span>
                  <span className="text-xs text-muted-foreground">Comprehensive with all sections</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPptx} className="flex items-center gap-3 py-2">
                <Presentation className="size-4 text-orange-600" />
                <div className="flex flex-col">
                  <span>Full PowerPoint Deck</span>
                  <span className="text-xs text-muted-foreground">11 slides with detailed analysis</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Comprehensive Data Downloads */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Complete Data & Analytics
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={handleDownloadZip} className="flex items-center gap-3 py-2">
            <FileJson className="size-4 text-purple-600" />
            <div className="flex flex-col">
              <span>Complete Analysis Package</span>
              <span className="text-xs text-muted-foreground">ZIP with all data & modules</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportXlsx} className="flex items-center gap-3 py-2">
            <FileSpreadsheet className="size-4 text-green-600" />
            <div className="flex flex-col">
              <span>Comprehensive Data Export</span>
              <span className="text-xs text-muted-foreground">Excel workbook (10 sheets)</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sharing Options */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Share & Collaborate
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleShare('link')} className="flex items-center gap-3 py-2">
            <Share2 className="size-4 text-muted-foreground" />
            <span>Copy Report Link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')} className="flex items-center gap-3 py-2">
            <Mail className="size-4 text-muted-foreground" />
            <span>Email Report</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
