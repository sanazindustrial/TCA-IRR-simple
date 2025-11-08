
'use client';
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
} from 'lucide-react';
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
import { useEvaluationContext } from './evaluation-provider';


export function ExportButtons() {
  const { toast } = useToast();
  const { role, reportType } = useEvaluationContext();

  const getAnalysisData = (): ComprehensiveAnalysisOutput | null => {
    try {
      const storedData = localStorage.getItem('analysisResult');
      if (!storedData) {
        toast({
          variant: 'destructive',
          title: 'No Data Found',
          description: 'Please run an analysis before exporting data.'
        });
        return null;
      }
      return JSON.parse(storedData);
    } catch (error) {
      console.error("Failed to parse analysis data from localStorage:", error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not read analysis data.'
      });
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

  // Two-Page Triage Report (PDF)
  const handleExportTriageTwoPage = () => {
    const data = getAnalysisData();
    if (!data) return;

    const doc = new jsPDF();
    const companyName = getCompanyName();

    // PAGE 1: Executive Summary & TCA Scorecard
    doc.setFontSize(20);
    doc.text(`Triage Report: ${companyName}`, 14, 25);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.setLineWidth(0.5);
    doc.line(14, 40, 196, 40);

    // Executive Summary
    doc.setFontSize(14);
    doc.text('Executive Summary', 14, 55);
    doc.setFontSize(10);

    if (data.tcaData) {
      const compositeScore = data.tcaData.compositeScore.toFixed(1);
      doc.text(`Overall TCA Score: ${compositeScore}/10`, 14, 65);
      doc.text(`Assessment: ${compositeScore >= 7 ? 'Strong candidate for investment' : compositeScore >= 5 ? 'Moderate potential, requires further analysis' : 'High risk investment'}`, 14, 75);
    }

    // TCA Scorecard Table
    if (data.tcaData) {
      autoTable(doc, {
        startY: 85,
        head: [['Category', 'Score', 'Weight', 'Status']],
        body: data.tcaData.categories.slice(0, 8).map(c => [
          c.category,
          c.rawScore.toString(),
          `${c.weight}%`,
          c.flag === 'green' ? '✓ Good' : c.flag === 'yellow' ? '⚠ Caution' : '✗ Risk'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
      });
    }

    // Top 3 Risks Summary
    if (data.riskData) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Key Risk Areas', 14, finalY);
      doc.setFontSize(9);

      const highRisks = data.riskData.riskFlags.filter(r => r.flag === 'red').slice(0, 3);
      highRisks.forEach((risk, index) => {
        doc.text(`${index + 1}. ${risk.domain}: ${risk.trigger}`, 14, finalY + 10 + (index * 8));
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
      const strengths = data.tcaData.categories.filter(c => c.flag === 'green').slice(0, 3);
      strengths.forEach((strength, index) => {
        doc.text(`• ${strength.category}: ${strength.strengths || 'Strong performance'}`, 14, 55 + (index * 8));
      });
    }

    // Investment Recommendation
    doc.setFontSize(12);
    doc.text('Investment Recommendation', 14, 90);
    doc.setFontSize(9);

    const recommendation = data.tcaData?.compositeScore >= 7 ?
      'RECOMMEND: Proceed to due diligence phase' :
      data.tcaData?.compositeScore >= 5 ?
        'CONDITIONAL: Address key risks before proceeding' :
        'NOT RECOMMENDED: Significant concerns identified';

    doc.text(recommendation, 14, 100);

    // Next Steps
    doc.setFontSize(12);
    doc.text('Recommended Next Steps', 14, 120);
    doc.setFontSize(9);
    const nextSteps = [
      '1. Conduct management team interviews',
      '2. Verify financial projections',
      '3. Assess market opportunity size',
      '4. Review competitive positioning'
    ];
    nextSteps.forEach((step, index) => {
      doc.text(step, 14, 130 + (index * 8));
    });

    doc.save(`${companyName}-Triage-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: 'Two-Page Triage Report Exported',
      description: 'Your concise triage report has been downloaded.',
    });
  };

  // Two-Page DD Report (PDF)
  const handleExportDDTwoPage = () => {
    const data = getAnalysisData();
    if (!data) return;

    const doc = new jsPDF();
    const companyName = getCompanyName();

    // PAGE 1: Comprehensive Analysis Summary
    doc.setFontSize(20);
    doc.text(`Due Diligence Report: ${companyName}`, 14, 25);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Analyst: ${role}`, 14, 35);
    doc.setLineWidth(0.5);
    doc.line(14, 40, 196, 40);

    // Investment Synopsis
    doc.setFontSize(14);
    doc.text('Investment Synopsis', 14, 55);
    doc.setFontSize(10);

    if (data.tcaData) {
      const score = data.tcaData.compositeScore;
      doc.text(`Overall Investment Score: ${score.toFixed(2)}/10`, 14, 65);
      doc.text(`Risk-Adjusted Rating: ${score >= 8 ? 'HIGH CONFIDENCE' : score >= 6 ? 'MODERATE CONFIDENCE' : 'LOW CONFIDENCE'}`, 14, 75);
    }

    // Detailed TCA Analysis
    if (data.tcaData) {
      autoTable(doc, {
        startY: 85,
        head: [['Analysis Category', 'Score', 'Weight', 'Assessment', 'Key Concerns']],
        body: data.tcaData.categories.map(c => [
          c.category,
          c.rawScore.toString(),
          `${c.weight}%`,
          c.flag === 'green' ? 'Strong' : c.flag === 'yellow' ? 'Moderate' : 'Weak',
          c.concerns?.slice(0, 50) + '...' || 'None identified'
        ]),
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
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Critical Risk Assessment', 14, finalY);
      doc.setFontSize(9);

      const criticalRisks = data.riskData.riskFlags.filter(r => r.flag === 'red');
      doc.text(`${criticalRisks.length} Critical Risk(s) Identified`, 14, finalY + 10);
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
      doc.text(`Revenue Growth: ${data.financialsData.revenueGrowth || 'Under Review'}`, 14, 55);
      doc.text(`Burn Rate: ${data.financialsData.burnRate || 'Under Analysis'}`, 14, 65);
      doc.text(`Runway: ${data.financialsData.runway || 'To be determined'}`, 14, 75);
    }

    // Strategic Fit Analysis
    if (data.strategicFitData) {
      autoTable(doc, {
        startY: 85,
        head: [['Strategic Factor', 'Alignment', 'Impact', 'Priority']],
        body: data.strategicFitData.factors?.slice(0, 5).map(f => [
          f.factor || 'Market Alignment',
          f.alignment || 'Strong',
          f.impact || 'High',
          f.priority || 'Critical'
        ]) || [['Market Opportunity', 'Strong', 'High', 'Critical']],
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96] },
        styles: { fontSize: 9 },
      });
    }

    // Final Investment Recommendation
    const finalY = (doc as any).lastAutoTable?.finalY + 15 || 140;
    doc.setFontSize(14);
    doc.text('Final Investment Recommendation', 14, finalY);
    doc.setFontSize(10);

    const investmentDecision = data.tcaData?.compositeScore >= 7.5 ?
      'STRONG BUY: High confidence investment opportunity' :
      data.tcaData?.compositeScore >= 6 ?
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

    doc.save(`${companyName}-DD-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: 'Two-Page DD Report Exported',
      description: 'Your comprehensive due diligence report has been downloaded.',
    });
  };

  // Comprehensive Full Report (PDF) - ENHANCED VERSION
  const handleExportFullReport = () => {
    const data = getAnalysisData();
    if (!data) return;

    const doc = new jsPDF();
    const companyName = getCompanyName();

    // TITLE PAGE
    doc.setFontSize(24);
    doc.text(`COMPREHENSIVE ANALYSIS REPORT`, 105, 50, { align: 'center' });
    doc.setFontSize(20);
    doc.text(`${companyName}`, 105, 70, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Report Type: ${reportType.toUpperCase()}`, 105, 90, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Analyst: ${role}`, 105, 100, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Confidential & Proprietary Analysis`, 105, 120, { align: 'center' });

    // Executive Summary Box
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(20, 140, 170, 60, 3, 3, 'DF');
    doc.setFontSize(14);
    doc.text('EXECUTIVE SUMMARY', 105, 155, { align: 'center' });
    doc.setFontSize(11);

    if (data.tcaData) {
      const score = data.tcaData.compositeScore;
      const rating = score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK';
      doc.text(`Overall Investment Score: ${score.toFixed(2)}/10 (${rating})`, 105, 170, { align: 'center' });
      doc.text(`Investment Recommendation: ${score >= 7 ? 'PROCEED TO DD' : score >= 5 ? 'CONDITIONAL REVIEW' : 'DECLINE'}`, 105, 185, { align: 'center' });
    }

    // TABLE OF CONTENTS
    doc.addPage();
    doc.setFontSize(16);
    doc.text('TABLE OF CONTENTS', 14, 25);
    doc.setFontSize(11);

    const tocItems = [
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

    tocItems.forEach((item, index) => {
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

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value', 'Industry Benchmark', 'Percentile Rank']],
        body: [
          ['TCA Composite Score', data.tcaData.compositeScore.toFixed(2), '6.5', `${Math.round(data.tcaData.compositeScore * 10)}th`],
          ['Technology Readiness', data.tcaData.categories.find(c => c.category.includes('Technology'))?.rawScore || 'N/A', '7.0', 'TBD'],
          ['Market Opportunity', data.tcaData.categories.find(c => c.category.includes('Market'))?.rawScore || 'N/A', '6.8', 'TBD'],
          ['Team Strength', data.tcaData.categories.find(c => c.category.includes('Team'))?.rawScore || 'N/A', '7.2', 'TBD'],
          ['Financial Health', data.tcaData.categories.find(c => c.category.includes('Financial'))?.rawScore || 'N/A', '6.0', 'TBD']
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9 },
      });

      // Investment Synopsis
      const currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.text('Investment Synopsis', 14, currentY);
      doc.setFontSize(10);

      const synopsis = [
        `${companyName} presents a ${data.tcaData.compositeScore >= 7 ? 'compelling' : data.tcaData.compositeScore >= 5 ? 'moderate' : 'challenging'} investment opportunity with a composite TCA score of ${data.tcaData.compositeScore.toFixed(2)}/10.`,
        `Key strengths include strong performance in ${data.tcaData.categories.filter(c => c.flag === 'green').map(c => c.category.toLowerCase()).slice(0, 2).join(' and ')}.`,
        `Primary concerns center around ${data.tcaData.categories.filter(c => c.flag === 'red').map(c => c.category.toLowerCase()).slice(0, 2).join(' and ')}.`,
        data.tcaData.summary
      ];

      synopsis.forEach((line, index) => {
        const lines = doc.splitTextToSize(line, 180);
        doc.text(lines, 14, currentY + 10 + (index * 15));
      });
    }

    // PAGE 4-5: DETAILED TCA SCORECARD ANALYSIS
    doc.addPage();
    doc.setFontSize(16);
    doc.text('2. TCA SCORECARD ANALYSIS', 14, 25);
    doc.line(14, 30, 196, 30);

    if (data.tcaData) {
      // Comprehensive TCA Table
      autoTable(doc, {
        startY: 40,
        head: [['Category', 'Raw Score', 'Weight', 'Weighted Score', 'Flag', 'Confidence']],
        body: data.tcaData.categories.map(c => [
          c.category,
          c.rawScore.toString(),
          `${c.weight}%`,
          ((c.rawScore * c.weight) / 100).toFixed(2),
          c.flag.toUpperCase(),
          c.confidence || 'High'
        ]),
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
      let currentY = (doc as any).lastAutoTable.finalY + 15;

      data.tcaData.categories.forEach((category, index) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 25;
        }

        doc.setFontSize(12);
        doc.text(`${index + 1}. ${category.category}`, 14, currentY);
        doc.setFontSize(10);

        // Score and status
        doc.text(`Score: ${category.rawScore}/10 | Weight: ${category.weight}% | Status: ${category.flag.toUpperCase()}`, 14, currentY + 8);

        // Strengths
        if (category.strengths) {
          doc.setFont('helvetica', 'bold');
          doc.text('Strengths:', 14, currentY + 18);
          doc.setFont('helvetica', 'normal');
          const strengthLines = doc.splitTextToSize(category.strengths, 170);
          doc.text(strengthLines, 14, currentY + 26);
          currentY += 8 + strengthLines.length * 4;
        }

        // Concerns
        if (category.concerns) {
          doc.setFont('helvetica', 'bold');
          doc.text('Concerns:', 14, currentY + 8);
          doc.setFont('helvetica', 'normal');
          const concernLines = doc.splitTextToSize(category.concerns, 170);
          doc.text(concernLines, 14, currentY + 16);
          currentY += 16 + concernLines.length * 4;
        }

        currentY += 10; // Space between categories
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
      const riskSummaryLines = doc.splitTextToSize(data.riskData.riskSummary, 180);
      doc.text(riskSummaryLines, 14, 55);

      // Risk Matrix
      const riskCounts = {
        red: data.riskData.riskFlags.filter(r => r.flag === 'red').length,
        yellow: data.riskData.riskFlags.filter(r => r.flag === 'yellow').length,
        green: data.riskData.riskFlags.filter(r => r.flag === 'green').length
      };

      autoTable(doc, {
        startY: 80,
        head: [['Risk Level', 'Count', 'Percentage', 'Impact']],
        body: [
          ['Critical (Red)', riskCounts.red.toString(), `${((riskCounts.red / data.riskData.riskFlags.length) * 100).toFixed(1)}%`, 'High'],
          ['Moderate (Yellow)', riskCounts.yellow.toString(), `${((riskCounts.yellow / data.riskData.riskFlags.length) * 100).toFixed(1)}%`, 'Medium'],
          ['Low (Green)', riskCounts.green.toString(), `${((riskCounts.green / data.riskData.riskFlags.length) * 100).toFixed(1)}%`, 'Low']
        ],
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        styles: { fontSize: 10 }
      });

      // Detailed Risk Analysis
      autoTable(doc, {
        head: [['Risk Domain', 'Level', 'Risk Trigger', 'Mitigation Strategy', 'Priority']],
        body: data.riskData.riskFlags.map(r => [
          r.domain,
          r.flag.toUpperCase(),
          r.trigger,
          r.mitigation?.slice(0, 60) + '...' || 'Under development',
          r.priority || 'High'
        ]),
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
    const sectionsToAdd = [
      { data: data.benchmarkData, title: '4. MARKET & COMPETITIVE ANALYSIS', key: 'benchmarkData' },
      { data: data.financialsData, title: '5. FINANCIAL HEALTH & PROJECTIONS', key: 'financialsData' },
      { data: data.teamData, title: '6. TEAM & LEADERSHIP EVALUATION', key: 'teamData' },
      { data: data.strategicFitData, title: '7. STRATEGIC FIT MATRIX', key: 'strategicFitData' },
      { data: data.growthData, title: '8. GROWTH POTENTIAL ANALYSIS', key: 'growthData' }
    ];

    sectionsToAdd.forEach((section) => {
      if (section.data) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text(section.title, 14, 25);
        doc.line(14, 30, 196, 30);

        // Add specific content based on data type
        if (section.key === 'benchmarkData' && data.benchmarkData) {
          autoTable(doc, {
            startY: 40,
            head: [['Metric', 'Company Value', 'Industry Average', 'Percentile Rank', 'Assessment']],
            body: data.benchmarkData.comparisons?.map(comp => [
              comp.metric || 'Revenue Growth',
              comp.companyValue || 'TBD',
              comp.industryAverage || 'TBD',
              comp.percentile || 'TBD',
              comp.assessment || 'Under Review'
            ]) || [['Revenue Growth', 'TBD', 'Industry Avg', 'TBD', 'Pending Analysis']],
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50] }
          });
        }

        if (section.key === 'financialsData' && data.financialsData) {
          const financialMetrics = [
            ['Revenue Growth Rate', data.financialsData.revenueGrowth || 'Under Analysis', '25% (Industry)', 'Target: >30%'],
            ['Monthly Burn Rate', data.financialsData.burnRate || 'Under Review', '$50K (Avg)', 'Monitor closely'],
            ['Runway (Months)', data.financialsData.runway || 'TBD', '18 months', 'Adequate if >12mo'],
            ['Gross Margin', data.financialsData.grossMargin || 'Pending', '70%', 'Target: >60%'],
            ['CAC:LTV Ratio', data.financialsData.cacLtv || 'TBD', '1:3', 'Target: 1:3 or better']
          ];

          autoTable(doc, {
            startY: 40,
            head: [['Financial Metric', 'Current Value', 'Industry Benchmark', 'Assessment']],
            body: financialMetrics,
            theme: 'grid',
            headStyles: { fillColor: [76, 175, 80] }
          });
        }

        if (section.key === 'growthData' && data.growthData) {
          autoTable(doc, {
            startY: 40,
            head: [['Growth Factor', 'Assessment', 'Score', 'Trend Direction', 'Time Horizon']],
            body: data.growthData.factors?.map(factor => [
              factor.name || 'Market Expansion',
              factor.assessment || 'Positive',
              factor.score?.toString() || '7.5',
              factor.trend || 'Increasing',
              factor.timeHorizon || '12-18 months'
            ]) || [['Market Growth', 'Strong', '8.5', 'Accelerating', '12 months']],
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
    const score = data.tcaData?.compositeScore || 0;
    const recommendation = score >= 8 ? 'STRONG BUY' : score >= 7 ? 'BUY' : score >= 6 ? 'CONDITIONAL BUY' : score >= 4 ? 'HOLD FOR REVIEW' : 'PASS';
    const confidence = score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low';

    autoTable(doc, {
      startY: 40,
      head: [['Decision Framework', 'Assessment', 'Rationale']],
      body: [
        ['Investment Recommendation', recommendation, `Based on comprehensive TCA score of ${score.toFixed(2)}`],
        ['Confidence Level', confidence, 'Derived from analysis completeness and data quality'],
        ['Risk Profile', score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk', 'Based on risk assessment matrix'],
        ['Strategic Alignment', 'Under Review', 'Requires fund strategy alignment analysis'],
        ['Valuation Range', 'TBD - Pending Financial DD', 'Requires detailed financial model review']
      ],
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Due Diligence Checklist
    const currentY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('Due Diligence Checklist', 14, currentY);

    const ddChecklist = [
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
    ddChecklist.forEach((item, index) => {
      doc.text(item, 20, currentY + 15 + (index * 8));
    });

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`${companyName} - ${reportType.toUpperCase()} Analysis Report | Page ${i} of ${pageCount} | Generated: ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
    }

    doc.save(`${companyName}-COMPREHENSIVE-Analysis-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: 'Comprehensive Full Report Exported',
      description: `Complete ${pageCount}-page analysis report with all modules and detailed assessments downloaded.`,
    });
  };

  // Enhanced DOCX Export with Comprehensive Content
  const handleExportDocx = async () => {
    const data = getAnalysisData();
    if (!data) return;

    const companyName = getCompanyName();
    const sections: Paragraph[] = [];

    // TITLE PAGE
    sections.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: `COMPREHENSIVE ANALYSIS REPORT`, size: 28, bold: true })]
      }),
      new Paragraph({
        children: [new TextRun({ text: `${companyName}`, size: 24, bold: true })],
        alignment: 'center'
      }),
      new Paragraph({
        children: [new TextRun({ text: `${reportType.toUpperCase()} Analysis | Generated: ${new Date().toLocaleDateString()}`, size: 14 })],
        alignment: 'center'
      }),
      new Paragraph({
        children: [new TextRun({ text: `Analyst: ${role} | Confidential & Proprietary`, size: 12, italics: true })],
        alignment: 'center'
      }),
      new Paragraph(""),
      new Paragraph("")
    );

    // EXECUTIVE SUMMARY
    sections.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "EXECUTIVE SUMMARY", bold: true })]
    }));

    if (data.tcaData) {
      const score = data.tcaData.compositeScore;
      const rating = score >= 8 ? 'EXCELLENT' : score >= 7 ? 'STRONG' : score >= 6 ? 'GOOD' : score >= 5 ? 'MODERATE' : 'WEAK';

      sections.push(
        new Paragraph(`Overall Investment Score: ${score.toFixed(2)}/10 (${rating})`),
        new Paragraph(`Investment Recommendation: ${score >= 7 ? 'PROCEED TO DUE DILIGENCE' : score >= 5 ? 'CONDITIONAL REVIEW REQUIRED' : 'DECLINE INVESTMENT'}`),
        new Paragraph(""),
        new Paragraph(data.tcaData.summary),
        new Paragraph("")
      );
    }

    // TABLE OF CONTENTS
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "TABLE OF CONTENTS", bold: true })]
      }),
      new Paragraph("1. Executive Summary"),
      new Paragraph("2. TCA Scorecard Analysis"),
      new Paragraph("3. Risk Assessment & Mitigation Strategy"),
      new Paragraph("4. Market & Competitive Analysis"),
      new Paragraph("5. Financial Health & Projections"),
      new Paragraph("6. Technology & Intellectual Property"),
      new Paragraph("7. Team & Leadership Assessment"),
      new Paragraph("8. Strategic Fit Analysis"),
      new Paragraph("9. Growth Potential & Scalability"),
      new Paragraph("10. Investment Recommendation & Terms"),
      new Paragraph("11. Due Diligence Checklist"),
      new Paragraph("12. Risk Mitigation Strategies"),
      new Paragraph("13. Appendices & Supporting Data"),
      new Paragraph("")
    );

    // DETAILED TCA SCORECARD ANALYSIS
    sections.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "TCA SCORECARD ANALYSIS", bold: true })]
    }));

    if (data.tcaData) {
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Overall Performance Metrics", bold: true })]
      }));

      sections.push(
        new Paragraph(`Composite TCA Score: ${data.tcaData.compositeScore.toFixed(2)}/10`),
        new Paragraph(`Total Categories Analyzed: ${data.tcaData.categories.length}`),
        new Paragraph(`Categories with Green Flag: ${data.tcaData.categories.filter(c => c.flag === 'green').length}`),
        new Paragraph(`Categories with Yellow Flag: ${data.tcaData.categories.filter(c => c.flag === 'yellow').length}`),
        new Paragraph(`Categories with Red Flag: ${data.tcaData.categories.filter(c => c.flag === 'red').length}`),
        new Paragraph("")
      );

      // Detailed category analysis
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Detailed Category Analysis", bold: true })]
      }));

      data.tcaData.categories.forEach((category, index) => {
        sections.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: `${index + 1}. ${category.category}`, bold: true })]
          }),
          new Paragraph(`Score: ${category.rawScore}/10 | Weight: ${category.weight}% | Status: ${category.flag.toUpperCase()}`),
          new Paragraph("")
        );

        if (category.strengths) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: "Strengths:", bold: true })]
            }),
            new Paragraph(category.strengths),
            new Paragraph("")
          );
        }

        if (category.concerns) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: "Areas of Concern:", bold: true })]
            }),
            new Paragraph(category.concerns),
            new Paragraph("")
          );
        }

        if (category.recommendations) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: "Recommendations:", bold: true })]
            }),
            new Paragraph(category.recommendations),
            new Paragraph("")
          );
        }
      });
    }

    // COMPREHENSIVE RISK ASSESSMENT
    sections.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "RISK ASSESSMENT & MITIGATION", bold: true })]
    }));

    if (data.riskData) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Risk Assessment Summary", bold: true })]
        }),
        new Paragraph(data.riskData.riskSummary),
        new Paragraph("")
      );

      // Risk breakdown by severity
      const risksByLevel = {
        red: data.riskData.riskFlags.filter(r => r.flag === 'red'),
        yellow: data.riskData.riskFlags.filter(r => r.flag === 'yellow'),
        green: data.riskData.riskFlags.filter(r => r.flag === 'green')
      };

      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Risk Level Distribution", bold: true })]
        }),
        new Paragraph(`Critical Risks (Red): ${risksByLevel.red.length}`),
        new Paragraph(`Moderate Risks (Yellow): ${risksByLevel.yellow.length}`),
        new Paragraph(`Low Risks (Green): ${risksByLevel.green.length}`),
        new Paragraph("")
      );

      // Detailed risk analysis
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Detailed Risk Analysis", bold: true })]
      }));

      data.riskData.riskFlags.forEach((risk, index) => {
        sections.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: `Risk ${index + 1}: ${risk.domain}`, bold: true })]
          }),
          new Paragraph(`Level: ${risk.flag.toUpperCase()}`),
          new Paragraph(`Trigger: ${risk.trigger}`),
          new Paragraph(`Mitigation Strategy: ${risk.mitigation || 'Under development'}`),
          new Paragraph(`Priority: ${risk.priority || 'High'}`),
          new Paragraph("")
        );
      });
    }

    // MARKET & COMPETITIVE ANALYSIS
    if (data.benchmarkData) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "MARKET & COMPETITIVE ANALYSIS", bold: true })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Benchmark Comparison", bold: true })]
        })
      );

      data.benchmarkData.comparisons?.forEach((comp, index) => {
        sections.push(
          new Paragraph(`${index + 1}. ${comp.metric || 'Market Metric'}`),
          new Paragraph(`   Company Value: ${comp.companyValue || 'Under Analysis'}`),
          new Paragraph(`   Industry Average: ${comp.industryAverage || 'TBD'}`),
          new Paragraph(`   Percentile Rank: ${comp.percentile || 'TBD'}`),
          new Paragraph("")
        );
      });
    }

    // FINANCIAL HEALTH ANALYSIS
    if (data.financialsData) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "FINANCIAL HEALTH & PROJECTIONS", bold: true })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Key Financial Metrics", bold: true })]
        }),
        new Paragraph(`Revenue Growth Rate: ${data.financialsData.revenueGrowth || 'Under Analysis'}`),
        new Paragraph(`Monthly Burn Rate: ${data.financialsData.burnRate || 'Under Review'}`),
        new Paragraph(`Cash Runway: ${data.financialsData.runway || 'To be determined'}`),
        new Paragraph(`Gross Margin: ${data.financialsData.grossMargin || 'Pending analysis'}`),
        new Paragraph(`Customer Acquisition Cost: ${data.financialsData.cac || 'Under review'}`),
        new Paragraph(`Lifetime Value: ${data.financialsData.ltv || 'Under calculation'}`),
        new Paragraph("")
      );
    }

    // TEAM & LEADERSHIP ASSESSMENT
    if (data.teamData) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "TEAM & LEADERSHIP ASSESSMENT", bold: true })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Leadership Team Analysis", bold: true })]
        })
      );

      if (data.teamData.teamMembers) {
        data.teamData.teamMembers.forEach((member, index) => {
          sections.push(
            new Paragraph(`${index + 1}. ${member.name || `Team Member ${index + 1}`}`),
            new Paragraph(`   Role: ${member.role || 'Key Team Member'}`),
            new Paragraph(`   Experience: ${member.experience || 'Extensive background'}`),
            new Paragraph(`   Assessment: ${member.assessment || 'Strong contributor'}`),
            new Paragraph("")
          );
        });
      }
    }

    // STRATEGIC FIT ANALYSIS
    if (data.strategicFitData) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "STRATEGIC FIT ANALYSIS", bold: true })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Investment Alignment Assessment", bold: true })]
        })
      );

      data.strategicFitData.factors?.forEach((factor, index) => {
        sections.push(
          new Paragraph(`${index + 1}. ${factor.factor || 'Strategic Factor'}`),
          new Paragraph(`   Alignment: ${factor.alignment || 'Strong'}`),
          new Paragraph(`   Impact: ${factor.impact || 'High'}`),
          new Paragraph(`   Priority: ${factor.priority || 'Critical'}`),
          new Paragraph("")
        );
      });
    }

    // GROWTH POTENTIAL ANALYSIS
    if (data.growthData) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "GROWTH POTENTIAL & SCALABILITY", bold: true })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Growth Factor Analysis", bold: true })]
        })
      );

      data.growthData.factors?.forEach((factor, index) => {
        sections.push(
          new Paragraph(`${index + 1}. ${factor.name || 'Growth Driver'}`),
          new Paragraph(`   Assessment: ${factor.assessment || 'Positive'}`),
          new Paragraph(`   Score: ${factor.score || '7.5'}/10`),
          new Paragraph(`   Trend: ${factor.trend || 'Increasing'}`),
          new Paragraph(`   Time Horizon: ${factor.timeHorizon || '12-18 months'}`),
          new Paragraph("")
        );
      });
    }

    // INVESTMENT RECOMMENDATION
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "INVESTMENT RECOMMENDATION", bold: true })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Final Assessment", bold: true })]
      })
    );

    const score = data.tcaData?.compositeScore || 0;
    const recommendation = score >= 8 ? 'STRONG BUY - Proceed immediately' :
      score >= 7 ? 'BUY - Recommended investment' :
        score >= 6 ? 'CONDITIONAL BUY - Address specific concerns' :
          score >= 4 ? 'HOLD - Requires significant improvements' :
            'PASS - Does not meet investment criteria';

    sections.push(
      new Paragraph(`Investment Decision: ${recommendation}`),
      new Paragraph(`Confidence Level: ${score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low'}`),
      new Paragraph(`Risk Profile: ${score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk'}`),
      new Paragraph("")
    );

    // DUE DILIGENCE CHECKLIST
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "DUE DILIGENCE CHECKLIST", bold: true })]
      }),
      new Paragraph("□ Management presentation and leadership interviews"),
      new Paragraph("□ Financial model validation and projection review"),
      new Paragraph("□ Customer reference calls and market validation"),
      new Paragraph("□ Technical architecture and IP assessment"),
      new Paragraph("□ Competitive landscape analysis"),
      new Paragraph("□ Legal and regulatory compliance review"),
      new Paragraph("□ Background checks on key personnel"),
      new Paragraph("□ Reference checks with previous investors"),
      new Paragraph("□ Market size and TAM validation"),
      new Paragraph("□ Unit economics and scalability analysis"),
      new Paragraph("□ Technology risk assessment"),
      new Paragraph("□ Business model validation"),
      new Paragraph("")
    );

    // APPENDICES
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "APPENDICES", bold: true })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Data Sources & Methodology", bold: true })]
      }),
      new Paragraph("This comprehensive analysis was conducted using the TCA-IRR Platform's 9-module assessment framework."),
      new Paragraph("Data sources include company-provided materials, public market research, and proprietary analysis tools."),
      new Paragraph("All scores and assessments are based on standardized evaluation criteria and industry benchmarks."),
      new Paragraph("")
    );

    const doc = new Document({
      sections: [{
        children: sections,
        properties: {
          page: {
            margin: {
              top: 720,   // 0.5 inch
              right: 720, // 0.5 inch
              bottom: 720, // 0.5 inch
              left: 720,  // 0.5 inch
            }
          }
        }
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${companyName}-COMPREHENSIVE-${reportType}-Analysis.docx`);
    toast({
      title: 'Comprehensive DOCX Report Exported',
      description: `Complete ${reportType} analysis report with detailed sections has been downloaded as Word document.`
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
      x: 1, y: 4.5, w: 8, h: 0.5, fontSize: 14, align: 'center', italics: true
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
        { text: String(c.rawScore), options: { fontSize: 11, align: 'center' } },
        { text: `${c.weight}%`, options: { fontSize: 11, align: 'center' } },
        {
          text: c.flag.toUpperCase(), options: {
            fontSize: 11,
            align: 'center',
            color: c.flag === 'green' ? '27ae60' : c.flag === 'yellow' ? 'f39c12' : 'e74c3c',
            bold: true
          }
        },
        { text: ((c.rawScore * c.weight) / 100).toFixed(2), options: { fontSize: 11, align: 'center' } }
      ]);

      tcaSlide.addTable([
        [
          { text: 'Category', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
          { text: 'Score', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
          { text: 'Weight', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
          { text: 'Status', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } },
          { text: 'Contribution', options: { bold: true, fontSize: 12, fill: '1f4e79', color: 'ffffff' } }
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
            { text: 'Domain', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } },
            { text: 'Level', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } },
            { text: 'Risk Trigger', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } },
            { text: 'Mitigation', options: { bold: true, fontSize: 11, fill: 'e74c3c', color: 'ffffff' } }
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
          { text: 'Financial Metric', options: { bold: true, fontSize: 12, fill: '27ae60', color: 'ffffff' } },
          { text: 'Current Value', options: { bold: true, fontSize: 12, fill: '27ae60', color: 'ffffff' } },
          { text: 'Category', options: { bold: true, fontSize: 12, fill: '27ae60', color: 'ffffff' } }
        ],
        ...financialMetrics.map(metric => [
          { text: metric[0], options: { fontSize: 11 } },
          { text: metric[1], options: { fontSize: 11, bold: true } },
          { text: metric[2], options: { fontSize: 10, italics: true } }
        ])
      ], {
        x: 0.5, y: 1.0, w: 9.0, h: 3.0,
        border: { type: 'solid', color: '333333' }
      });
    }

    // SLIDE 6: Team & Leadership Assessment
    if (data.teamData?.teamMembers) {
      let teamSlide = pptx.addSlide();
      teamSlide.addText('Team & Leadership Assessment', { x: 0.5, y: 0.25, fontSize: 20, bold: true, color: '1f4e79' });

      const teamTableRows = data.teamData.teamMembers.slice(0, 6).map(member => [
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
          { text: 'Name', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } },
          { text: 'Role', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } },
          { text: 'Experience', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } },
          { text: 'Assessment', options: { bold: true, fontSize: 12, fill: '3498db', color: 'ffffff' } }
        ],
        ...teamTableRows
      ], {
        x: 0.5, y: 1.0, w: 9.0, h: 3.5,
        border: { type: 'solid', color: '333333' }
      });
    }

    // SLIDE 7: Investment Recommendation
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

    // SLIDE 8: Next Steps
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
      x: 0.5, y: 4.8, fontSize: 14, bold: true, italics: true
    });

    pptx.writeFile({ fileName: `${companyName}-COMPREHENSIVE-${reportType}-Analysis.pptx` });
    toast({
      title: 'Comprehensive PowerPoint Exported',
      description: `Complete ${reportType} presentation with detailed analysis slides has been downloaded.`
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
        analysisFramework: localStorage.getItem('analysisFramework') || 'general',
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

  // Comprehensive Excel Export with Multiple Sheets
  const handleExportXlsx = () => {
    const data = getAnalysisData();
    if (!data) return;

    toast({
      title: 'Excel Export In Progress',
      description: 'Generating comprehensive Excel workbook with multiple analysis sheets...',
    });

    // For now, we'll create a CSV-based data export
    // TODO: Implement actual Excel export with multiple sheets using libraries like xlsx
    const companyName = getCompanyName();

    // Create comprehensive data for Excel export
    const excelData = {
      summary: {
        companyName,
        reportType,
        analyst: role,
        generatedDate: new Date().toLocaleDateString(),
        overallScore: data.tcaData?.compositeScore || 'N/A',
        recommendation: data.tcaData?.compositeScore >= 7 ? 'RECOMMEND' :
          data.tcaData?.compositeScore >= 5 ? 'CONDITIONAL' : 'DECLINE'
      },
      tcaScores: data.tcaData?.categories || [],
      riskAnalysis: data.riskData?.riskFlags || [],
      benchmarkData: data.benchmarkData?.comparisons || [],
      financialMetrics: data.financialsData || {},
      teamAssessment: data.teamData || {},
      growthFactors: data.growthData?.factors || [],
      strategicFit: data.strategicFitData?.factors || []
    };

    // Create CSV content for comprehensive analysis
    let csvContent = "COMPREHENSIVE ANALYSIS DATA EXPORT\n\n";
    csvContent += `Company,${companyName}\n`;
    csvContent += `Report Type,${reportType.toUpperCase()}\n`;
    csvContent += `Analyst,${role}\n`;
    csvContent += `Generated,${new Date().toLocaleDateString()}\n`;
    csvContent += `Overall TCA Score,${data.tcaData?.compositeScore || 'N/A'}\n\n`;

    // TCA Scorecard Data
    csvContent += "TCA SCORECARD ANALYSIS\n";
    csvContent += "Category,Raw Score,Weight %,Weighted Score,Flag,Strengths,Concerns\n";
    if (data.tcaData) {
      data.tcaData.categories.forEach(cat => {
        csvContent += `"${cat.category}",${cat.rawScore},${cat.weight},${((cat.rawScore * cat.weight) / 100).toFixed(2)},"${cat.flag}","${cat.strengths || 'N/A'}","${cat.concerns || 'None'}"\n`;
      });
    }
    csvContent += "\n";

    // Risk Analysis Data
    csvContent += "RISK ANALYSIS\n";
    csvContent += "Domain,Risk Level,Trigger,Mitigation Strategy,Priority\n";
    if (data.riskData) {
      data.riskData.riskFlags.forEach(risk => {
        csvContent += `"${risk.domain}","${risk.flag}","${risk.trigger}","${risk.mitigation || 'TBD'}","${risk.priority || 'High'}"\n`;
      });
    }
    csvContent += "\n";

    // Benchmark Analysis
    if (data.benchmarkData?.comparisons) {
      csvContent += "BENCHMARK COMPARISON\n";
      csvContent += "Metric,Company Value,Industry Average,Percentile,Assessment\n";
      data.benchmarkData.comparisons.forEach(comp => {
        csvContent += `"${comp.metric || 'Metric'}","${comp.companyValue || 'TBD'}","${comp.industryAverage || 'TBD'}","${comp.percentile || 'TBD'}","${comp.assessment || 'Under Review'}"\n`;
      });
      csvContent += "\n";
    }

    // Financial Health Data
    if (data.financialsData) {
      csvContent += "FINANCIAL HEALTH METRICS\n";
      csvContent += "Metric,Value,Status,Notes\n";
      csvContent += `"Revenue Growth","${data.financialsData.revenueGrowth || 'TBD'}","Under Analysis","Key growth indicator"\n`;
      csvContent += `"Monthly Burn Rate","${data.financialsData.burnRate || 'TBD'}","Under Review","Cash efficiency metric"\n`;
      csvContent += `"Cash Runway","${data.financialsData.runway || 'TBD'}","Critical","Months of operation remaining"\n`;
      csvContent += `"Gross Margin","${data.financialsData.grossMargin || 'TBD'}","Important","Profitability indicator"\n`;
      csvContent += "\n";
    }

    // Growth Analysis
    if (data.growthData?.factors) {
      csvContent += "GROWTH POTENTIAL ANALYSIS\n";
      csvContent += "Growth Factor,Assessment,Score,Trend,Time Horizon\n";
      data.growthData.factors.forEach(factor => {
        csvContent += `"${factor.name || 'Growth Factor'}","${factor.assessment || 'Positive'}","${factor.score || '7.5'}","${factor.trend || 'Increasing'}","${factor.timeHorizon || '12-18 months'}"\n`;
      });
      csvContent += "\n";
    }

    // Team Assessment
    if (data.teamData?.teamMembers) {
      csvContent += "TEAM ASSESSMENT\n";
      csvContent += "Name,Role,Experience,Assessment,Notes\n";
      data.teamData.teamMembers.forEach(member => {
        csvContent += `"${member.name || 'Team Member'}","${member.role || 'Key Role'}","${member.experience || 'Experienced'}","${member.assessment || 'Strong'}","${member.notes || 'N/A'}"\n`;
      });
      csvContent += "\n";
    }

    // Strategic Fit Analysis
    if (data.strategicFitData?.factors) {
      csvContent += "STRATEGIC FIT MATRIX\n";
      csvContent += "Strategic Factor,Alignment,Impact,Priority,Assessment\n";
      data.strategicFitData.factors.forEach(factor => {
        csvContent += `"${factor.factor || 'Strategic Element'}","${factor.alignment || 'Strong'}","${factor.impact || 'High'}","${factor.priority || 'Critical'}","${factor.assessment || 'Positive'}"\n`;
      });
      csvContent += "\n";
    }

    // Investment Decision Summary
    csvContent += "INVESTMENT DECISION FRAMEWORK\n";
    csvContent += "Decision Factor,Assessment,Rationale\n";
    const score = data.tcaData?.compositeScore || 0;
    csvContent += `"Overall Recommendation","${score >= 7 ? 'RECOMMEND' : score >= 5 ? 'CONDITIONAL' : 'DECLINE'}","Based on TCA score of ${score.toFixed(2)}"\n`;
    csvContent += `"Confidence Level","${score >= 8 ? 'Very High' : score >= 7 ? 'High' : score >= 5 ? 'Moderate' : 'Low'}","Analysis completeness and data quality"\n`;
    csvContent += `"Risk Profile","${score >= 7 ? 'Acceptable' : score >= 5 ? 'Elevated' : 'High Risk'}","Based on risk assessment matrix"\n`;

    // Download the comprehensive CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${companyName}-COMPREHENSIVE-Analysis-Data.csv`);

    toast({
      title: 'Comprehensive Data Export Complete',
      description: 'Full analysis data exported as CSV. Excel workbook functionality coming soon.',
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="size-4" />
          Export & Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
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
            {(role === 'admin' || role === 'reviewer') && (
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
                <span className="text-xs text-muted-foreground">20+ pages with all modules</span>
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
                <span className="text-xs text-muted-foreground">8+ slides with detailed analysis</span>
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
            <span className="text-xs text-muted-foreground">CSV with all analysis data</span>
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
  );
}
