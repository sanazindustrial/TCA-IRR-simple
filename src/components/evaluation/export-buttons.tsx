
'use client';
import {
  FileText,
  FileJson,
  FileSpreadsheet,
  FileImage,
  Download,
  Share2,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Packer, Document, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';


export function ExportButtons() {
  const { toast } = useToast();

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

  const handleExportPdf = () => {
    const data = getAnalysisData();
    if (!data) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Startup Compass Analysis Report: Innovate Inc.", 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

    if (data.tcaData) {
      autoTable(doc, {
        startY: 40,
        head: [['TCA Scorecard Summary']],
        body: [
          [`Composite Score: ${data.tcaData.compositeScore.toFixed(2)}`],
          [`Summary: ${data.tcaData.summary}`]
        ]
      });
      autoTable(doc, {
        head: [['Category', 'Score', 'Weight', 'Flag']],
        body: data.tcaData.categories.map(c => [c.category, c.rawScore, `${c.weight}%`, c.flag]),
      });
    }

    if (data.riskData) {
      autoTable(doc, {
        head: [['Risk Analysis Summary']],
        body: [[data.riskData.riskSummary]]
      });
      autoTable(doc, {
        head: [['Domain', 'Flag', 'Trigger']],
        body: data.riskData.riskFlags.map(r => [r.domain, r.flag, r.trigger]),
      });
    }

    doc.save('StartupCompass-Report.pdf');
    toast({
      title: 'Exporting PDF',
      description: 'Your report is being downloaded.',
    });
  };

  const handleExportDocx = async () => {
    const data = getAnalysisData();
    if (!data) return;


    const sections: Paragraph[] = [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Startup Compass Analysis Report")] }),
      new Paragraph(`Date: ${new Date().toLocaleDateString()}`),
    ];

    if (data.tcaData) {
      sections.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("TCA Scorecard")] }));
      sections.push(new Paragraph(`Composite Score: ${data.tcaData.compositeScore.toFixed(2)}`));
      sections.push(new Paragraph(data.tcaData.summary));
    }

    const doc = new Document({ sections: [{ children: sections }] });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'StartupCompass-Report.docx');
    toast({ title: 'Exporting DOCX', description: 'Your report is being downloaded.' });
  };

  const handleExportPptx = () => {
    const data = getAnalysisData();
    if (!data) return;

    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    let slide = pptx.addSlide();
    slide.addText("Startup Compass Analysis Report", { x: 0.5, y: 0.5, fontSize: 24, bold: true });

    if (data.tcaData) {
      let tcaSlide = pptx.addSlide();
      tcaSlide.addText('TCA Scorecard', { x: 0.5, y: 0.25, fontSize: 18, bold: true });
      tcaSlide.addText(`Composite Score: ${data.tcaData.compositeScore.toFixed(2)}`, { x: 0.5, y: 0.75 });
      const tableRows = data.tcaData.categories.map(c => [
        { text: c.category },
        { text: String(c.rawScore) },
        { text: String(c.weight) },
        { text: c.flag }
      ]);
      tcaSlide.addTable([
        [{ text: 'Category' }, { text: 'Score' }, { text: 'Weight' }, { text: 'Flag' }],
        ...tableRows
      ], { x: 0.5, y: 1.2, w: 9.0 });
    }

    if (data.riskData) {
      let riskSlide = pptx.addSlide();
      riskSlide.addText('Risk Analysis', { x: 0.5, y: 0.25, fontSize: 18, bold: true });
      riskSlide.addText(data.riskData.riskSummary, { x: 0.5, y: 0.75, w: 9.0, h: 1.0 });
    }

    pptx.writeFile({ fileName: 'StartupCompass-Report.pptx' });
    toast({ title: 'Exporting PPTX', description: 'Your report is being downloaded.' });
  };

  const handleDownloadZip = async () => {
    toast({
      title: 'Preparing Download',
      description: 'Generating and downloading analysis data as a ZIP file.',
    });

    const data = getAnalysisData();
    if (!data) return;

    const zip = new JSZip();

    const summary = {
      companyName: "Innovate Inc.",
      compositeScore: data.tcaData?.compositeScore,
      riskSummary: data.riskData?.riskSummary,
      generatedAt: new Date().toISOString(),
    };
    zip.file('summary.json', JSON.stringify(summary, null, 2));

    const dataFolder = zip.folder('detailed_data');
    if (dataFolder) {
      if (data.tcaData) dataFolder.file('tca_scorecard.json', JSON.stringify(data.tcaData, null, 2));
      if (data.riskData) dataFolder.file('risk_analysis.json', JSON.stringify(data.riskData, null, 2));
      if (data.benchmarkData) dataFolder.file('benchmark_comparison.json', JSON.stringify(data.benchmarkData, null, 2));
      if (data.macroData) dataFolder.file('macro_trend_alignment.json', JSON.stringify(data.macroData, null, 2));
      if (data.growthData) dataFolder.file('growth_classifier.json', JSON.stringify(data.growthData, null, 2));
      if (data.gapData) dataFolder.file('gap_analysis.json', JSON.stringify(data.gapData, null, 2));
      if (data.founderFitData) dataFolder.file('funder_fit_analysis.json', JSON.stringify(data.founderFitData, null, 2));
      if (data.teamData) dataFolder.file('team_assessment.json', JSON.stringify(data.teamData, null, 2));
      if (data.strategicFitData) dataFolder.file('strategic_fit_matrix.json', JSON.stringify(data.strategicFitData, null, 2));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'StartupCompass-Analysis-Export.zip');
  };

  const handleShare = (type: 'link' | 'email') => {
    const reportUrl = window.location.href.replace('/configure', '');
    if (type === 'link') {
      navigator.clipboard.writeText(reportUrl);
      toast({
        title: 'Link Copied',
        description: 'A shareable link to the report has been copied to your clipboard.',
      });
    } else {
      const subject = "Review: Startup Compass Analysis Report";
      const body = `Please review the following analysis report:\n\n${reportUrl}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleExportXlsx = () => {
    toast({
      title: 'Exporting XLSX',
      description: 'This feature is coming soon!',
    });
    console.log("Placeholder for XLSX export.");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="size-4" />
          Export & Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Export Report
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPdf} className="flex items-center gap-3 py-2">
          <FileText className="size-4 text-muted-foreground" />
          <span>PDF Report</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportDocx} className="flex items-center gap-3 py-2">
          <FileText className="size-4 text-muted-foreground" />
          <span>Word Document</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPptx} className="flex items-center gap-3 py-2">
          <FileImage className="size-4 text-muted-foreground" />
          <span>PowerPoint</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Download Data
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={handleDownloadZip} className="flex items-center gap-3 py-2">
          <FileJson className="size-4 text-muted-foreground" />
          <span>Raw Data (.zip)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportXlsx} className="flex items-center gap-3 py-2">
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          <span>Excel Spreadsheet</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Share
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleShare('link')} className="flex items-center gap-3 py-2">
          <Share2 className="size-4 text-muted-foreground" />
          <span>Copy Share Link</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')} className="flex items-center gap-3 py-2">
          <Mail className="size-4 text-muted-foreground" />
          <span>Email Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
