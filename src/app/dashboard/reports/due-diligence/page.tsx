
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  FileText,
  UploadCloud,
  BrainCircuit,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Type,
  X,
  Globe,
  FileUp,
  CheckCircle2,
  Loader2,
  Building2,
  Scale,
  Users,
  DollarSign,
  Shield,
  AlertTriangle,
  Check,
  RefreshCw,
  Database,
  Activity,
  FileSearch,
  Briefcase,
  LineChart,
  ClipboardCheck,
  Save,
  Eye,
  Download,
  Settings,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { UploadedFile } from '@/components/analysis/document-submission';
import { runAnalysis } from '@/app/analysis/actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import reportsApi from '@/lib/reports-api';
import { externalSourcesConfig } from '@/lib/external-sources-config';

// Define workflow steps
const WORKFLOW_STEPS = [
  { id: 1, name: 'Company Setup', icon: Building2, description: 'Enter target company information' },
  { id: 2, name: 'Document Upload', icon: FileUp, description: 'Upload relevant documents' },
  { id: 3, name: 'External Data', icon: Database, description: 'Connect external data sources' },
  { id: 4, name: 'Analysis Areas', icon: FileSearch, description: 'Select areas to analyze' },
  { id: 5, name: 'Report Sections', icon: Settings, description: 'Configure report sections' },
  { id: 6, name: 'Review & Generate', icon: BrainCircuit, description: 'Review and generate report' },
  { id: 7, name: 'Preview Report', icon: Eye, description: 'Review generated report' },
  { id: 8, name: 'Storage & Export', icon: Download, description: 'Save & download report' },
  { id: 9, name: 'Report Complete', icon: CheckCircle2, description: 'Due diligence complete' },
];

// Due Diligence analysis areas
const DD_AREAS = [
  { id: 'financial', name: 'Financial Analysis', icon: DollarSign, required: true, items: ['Revenue analysis', 'Cost structure', 'Cash flow', 'Debt/equity', 'Financial projections'] },
  { id: 'legal', name: 'Legal & Compliance', icon: Scale, required: true, items: ['Corporate structure', 'Contracts review', 'IP portfolio', 'Litigation history', 'Regulatory compliance'] },
  { id: 'operational', name: 'Operations', icon: Activity, required: false, items: ['Supply chain', 'Manufacturing', 'Technology stack', 'Key processes', 'Scalability'] },
  { id: 'commercial', name: 'Commercial', icon: Briefcase, required: true, items: ['Market position', 'Customer analysis', 'Competitive landscape', 'Sales pipeline', 'Revenue model'] },
  { id: 'management', name: 'Management Team', icon: Users, required: true, items: ['Leadership assessment', 'Organizational structure', 'Key personnel', 'Compensation', 'Retention risk'] },
  { id: 'technology', name: 'Technology & IP', icon: BrainCircuit, required: false, items: ['Tech stack', 'Patents', 'Trade secrets', 'R&D pipeline', 'Technical debt'] },
  { id: 'risk', name: 'Risk Assessment', icon: Shield, required: true, items: ['Market risks', 'Operational risks', 'Financial risks', 'Regulatory risks', 'ESG factors'] },
  { id: 'valuation', name: 'Valuation', icon: LineChart, required: false, items: ['Comparable analysis', 'DCF model', 'Transaction comps', 'Asset valuation', 'Synergy analysis'] },
];

// External data sources
const EXTERNAL_SOURCES = externalSourcesConfig
  .filter((s) => s.requirementGroup === 'A' || s.requirementGroup === 'B')
  .map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    status: 'available' as const,
    free: s.pricing === 'Free' || s.pricing === 'Freemium',
  }));

interface ExternalDataResult {
  source: string;
  success: boolean;
  data: unknown;
  error?: string;
}

interface ReportSection {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

const DEFAULT_DD_SECTIONS: ReportSection[] = [
  { id: 'dd-exec-summary', title: 'Executive Summary', description: 'High-level overview and key findings', active: true },
  { id: 'dd-company-overview', title: 'Company Overview', description: 'Business model, history, and market position', active: true },
  { id: 'dd-financial-analysis', title: 'Financial Analysis', description: 'Revenue, costs, cash flow, and projections', active: true },
  { id: 'dd-financial-projections', title: 'Financial Projections', description: 'Forward-looking financial models', active: true },
  { id: 'dd-legal-compliance', title: 'Legal & Compliance', description: 'Corporate structure, contracts, and IP', active: true },
  { id: 'dd-ip-analysis', title: 'IP & Patents', description: 'Intellectual property portfolio assessment', active: true },
  { id: 'dd-commercial', title: 'Commercial Analysis', description: 'Market position and competitive landscape', active: true },
  { id: 'dd-customer-analysis', title: 'Customer Analysis', description: 'Customer base, churn, and NPS', active: true },
  { id: 'dd-management', title: 'Management Assessment', description: 'Leadership team and key personnel', active: true },
  { id: 'dd-org-structure', title: 'Organizational Structure', description: 'Team hierarchy and succession planning', active: true },
  { id: 'dd-technology', title: 'Technology Assessment', description: 'Tech stack, scalability, and technical debt', active: true },
  { id: 'dd-operations', title: 'Operational Review', description: 'Processes, supply chain, and efficiency', active: true },
  { id: 'dd-risk-assessment', title: 'Risk Assessment', description: 'Market, operational, and regulatory risks', active: true },
  { id: 'dd-valuation', title: 'Valuation Analysis', description: 'DCF, comparables, and transaction analysis', active: true },
  { id: 'dd-synergies', title: 'Synergy Analysis', description: 'Revenue and cost synergy opportunities', active: true },
  { id: 'dd-esg', title: 'ESG Assessment', description: 'Environmental, social, and governance factors', active: true },
  { id: 'dd-red-flags', title: 'Red Flags & Deal Risks', description: 'Critical issues requiring attention', active: true },
  { id: 'dd-recommendations', title: 'Key Recommendations', description: 'Actionable recommendations and conditions', active: true },
  { id: 'dd-analyst-comments', title: 'Analyst Commentary', description: 'Analyst notes and qualitative observations', active: true },
  { id: 'dd-appendix', title: 'Appendix & Data Sources', description: 'Supporting data and references', active: true },
];

export default function DueDiligenceWorkflowPage() {
  const router = useRouter();

  // Route guard: no access for standard users
  useEffect(() => {
    try {
      const stored = localStorage.getItem('loggedInUser');
      if (stored) {
        const user = JSON.parse(stored);
        const role = user.role?.toLowerCase() || 'user';
        if (role !== 'admin' && role !== 'analyst') {
          router.replace('/unauthorized');
          return;
        }
      } else {
        router.replace('/unauthorized');
      }
    } catch {
      router.replace('/unauthorized');
    }
  }, [router]);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Company selection mode
  const [selectionMode, setSelectionMode] = useState<'new' | 'existing'>('existing');
  const [existingCompanies, setExistingCompanies] = useState<Array<{
    id: string;
    name: string;
    industry: string;
    triageScore: number;
    analysisDate: string;
    evaluationId: string;
  }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedExistingCompany, setSelectedExistingCompany] = useState<string | null>(null);

  // Company info
  const [companyName, setCompanyName] = useState('');
  const [companyTicker, setCompanyTicker] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [dealType, setDealType] = useState('acquisition');
  const [sourceEvaluationId, setSourceEvaluationId] = useState<string | null>(null);

  // Documents
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const [submittedTexts, setSubmittedTexts] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');

  // External data
  const [selectedSources, setSelectedSources] = useState<string[]>(['sec-edgar', 'hackernews']);
  const [externalData, setExternalData] = useState<ExternalDataResult[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Analysis areas
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    DD_AREAS.filter(a => a.required).map(a => a.id)
  );

  // Generation
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Report sections & storage
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'standard'>('standard');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [savedReportId, setSavedReportId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<unknown>(null);

  const isAdminOrAnalyst = userRole === 'admin' || userRole === 'analyst';
  const [showHumanReviewModal, setShowHumanReviewModal] = useState(false);
  const [humanReviewNotes, setHumanReviewNotes] = useState('');
  const [htmlReportContent, setHtmlReportContent] = useState('');
  const [previewEditMode, setPreviewEditMode] = useState<'view' | 'edit'>('view');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Calculate progress
  const progress = Math.round((completedSteps.length / WORKFLOW_STEPS.length) * 100);

  // File handling
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        name: file.name,
        size: file.size,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast({ title: 'Files uploaded', description: `${newFiles.length} file(s) added successfully.` });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportUrls = () => {
    if (urlInput.trim()) {
      const urls = urlInput.split('\n').filter((url) => url.trim() !== '');
      setImportedUrls((prev) => [...prev, ...urls]);
      setUrlInput('');
      toast({ title: 'URLs imported', description: `${urls.length} URL(s) added.` });
    }
  };

  const removeUrl = (index: number) => {
    setImportedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitText = () => {
    if (textInput.trim()) {
      setSubmittedTexts((prev) => [...prev, textInput]);
      setTextInput('');
      toast({ title: 'Text added', description: 'Content saved for analysis.' });
    }
  };

  const removeText = (index: number) => {
    setSubmittedTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Step validation and navigation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return companyName.trim().length > 0;
      case 2:
        return true; // Documents optional
      case 3:
        return selectedSources.length > 0;
      case 4:
        return selectedAreas.length > 0;
      case 5:
        return reportSections.filter((s) => s.active).length > 0;
      case 6:
        return true;
      case 7:
        return true;
      case 8:
        return true;
      case 9:
        return true;
      default:
        return false;
    }
  }, [currentStep, companyName, selectedSources, selectedAreas, reportSections]);

  const nextStep = () => {
    if (canProceed() && currentStep < WORKFLOW_STEPS.length) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= Math.max(...completedSteps, currentStep)) {
      setCurrentStep(step);
    }
  };

  // Fetch external data
  const fetchExternalData = async () => {
    if (!companyName && !companyTicker) {
      toast({ variant: 'destructive', title: 'Enter company info', description: 'Please enter company name or ticker first.' });
      return;
    }

    setFetchingData(true);
    const query = companyTicker || companyName;
    const results: ExternalDataResult[] = [];

    for (const sourceId of selectedSources) {
      try {
        const response = await fetch(`/api/external-data?source=${sourceId}&query=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        results.push({
          source: sourceId,
          success: data.success !== false,
          data: data.data,
          error: data.error
        });
      } catch {
        results.push({
          source: sourceId,
          success: false,
          data: null,
          error: 'Failed to fetch data'
        });
      }
    }

    setExternalData(results);
    setFetchingData(false);

    const successCount = results.filter(r => r.success).length;
    toast({
      title: 'External data fetched',
      description: `Successfully retrieved data from ${successCount}/${selectedSources.length} sources.`
    });
  };

  // Generate report
  const handleGenerateReport = async () => {
    setIsLoading(true);
    toast({
      title: 'Generating Due Diligence Report...',
      description: 'This comprehensive analysis may take a moment.',
    });

    try {
      // Store DD context
      const ddContext = {
        companyName,
        companyTicker,
        companyIndustry,
        companyDescription,
        dealType,
        selectedAreas,
        externalData,
        uploadedFiles,
        importedUrls,
        submittedTexts,
        reportType: 'due-diligence'
      };
      localStorage.setItem('ddContext', JSON.stringify(ddContext));

      const comprehensiveData = await runAnalysis('general', {
        companyName,
        companyTicker,
        companyIndustry,
        companyDescription,
        activeModules: DD_AREAS.filter(a => selectedAreas.includes(a.id)).map(a => ({ module_id: a.id, weight: 10, is_enabled: true }))
      });
      setAnalysisResult(comprehensiveData);
      localStorage.setItem('analysisResult', JSON.stringify(comprehensiveData));
      localStorage.setItem('analysisFramework', 'general');

      // Try to save to backend — non-blocking: proceed even if save fails
      try {
        const savedReport = await reportsApi.createReport({
          company_name: companyName,
          report_type: 'due_diligence',
          analysis_data: comprehensiveData as Record<string, unknown>,
          missing_sections: reportSections.filter((s) => !s.active).map((s) => s.id),
        });
        setSavedReportId(savedReport.id);
      } catch (saveError) {
        console.warn('Report save to backend failed (non-blocking):', saveError);
      }

      if (!completedSteps.includes(6)) setCompletedSteps((prev) => [...prev, 6]);
      setCurrentStep(7);
      toast({ title: 'Report Generated', description: 'Your due diligence report has been generated.' });
    } catch (error) {
      console.error('Failed to run DD analysis:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save draft
  const saveDraft = () => {
    const draft = {
      currentStep,
      completedSteps,
      companyName,
      companyTicker,
      companyIndustry,
      companyDescription,
      dealType,
      selectedAreas,
      selectedSources,
      uploadedFiles,
      importedUrls,
      submittedTexts,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('ddWorkflowDraft', JSON.stringify(draft));
    toast({ title: 'Draft saved', description: 'Your progress has been saved.' });
  };

  // Section config helpers
  const toggleSection = (sectionId: string) => {
    setReportSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, active: !s.active } : s))
    );
  };

  const toggleAllSections = (active: boolean) => {
    setReportSections((prev) => prev.map((s) => ({ ...s, active })));
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await reportsApi.createReport({
        company_name: companyName,
        report_type: 'due_diligence',
        analysis_data: (analysisResult ?? {}) as Record<string, unknown>,
        missing_sections: reportSections.filter((s) => !s.active).map((s) => s.id),
      });
      setSavedReportId(saved.id);
      toast({ title: 'Report saved', description: `Report #${saved.id} saved successfully.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save report.';
      setSaveError(msg);
      toast({ variant: 'destructive', title: 'Save failed', description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `due-diligence-${companyName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const rows: string[][] = [['Section ID', 'Title', 'Description', 'Active']];
    reportSections.forEach((s) => rows.push([s.id, s.title, s.description, String(s.active)]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dd-sections-${companyName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load role and section config on mount
  useEffect(() => {
    const role = (localStorage.getItem('userRole') || 'standard') as 'admin' | 'analyst' | 'standard';
    setUserRole(role);
    const saved = localStorage.getItem('report-config-dd');
    setReportSections(saved ? JSON.parse(saved) : DEFAULT_DD_SECTIONS);
  }, []);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('ddWorkflowDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.companyName) {
          setCompanyName(parsed.companyName);
          setCompanyTicker(parsed.companyTicker || '');
          setCompanyIndustry(parsed.companyIndustry || '');
          setCompanyDescription(parsed.companyDescription || '');
          setDealType(parsed.dealType || 'acquisition');
          setSelectedAreas(parsed.selectedAreas || []);
          setSelectedSources(parsed.selectedSources || ['sec', 'news']);
          setCompletedSteps(parsed.completedSteps || []);
          setCurrentStep(parsed.currentStep || 1);
        }
      } catch {
        console.error('Failed to load draft');
      }
    }
  }, []);

  // Load existing companies with triage reports
  const loadExistingCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      // First check localStorage for recent reports
      const tcaReports = localStorage.getItem('tca_reports');
      const unifiedRecords = localStorage.getItem('unified_records');

      const companies: Array<{
        id: string;
        name: string;
        industry: string;
        triageScore: number;
        analysisDate: string;
        evaluationId: string;
      }> = [];

      // Parse localStorage reports
      if (tcaReports) {
        try {
          const reports = JSON.parse(tcaReports);
          if (Array.isArray(reports)) {
            reports.forEach(report => {
              if (report.reportType === 'triage' && report.companyName) {
                companies.push({
                  id: report.reportId || report.id,
                  name: report.companyName,
                  industry: report.framework === 'medtech' ? 'MedTech/Biotech' : 'Technology',
                  triageScore: report.metadata?.compositeScore || 0,
                  analysisDate: report.createdAt || new Date().toISOString(),
                  evaluationId: report.evaluationId || report.id,
                });
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing tca_reports:', e);
        }
      }

      // Parse unified records
      if (unifiedRecords) {
        try {
          const records = JSON.parse(unifiedRecords);
          if (Array.isArray(records)) {
            records.forEach(record => {
              if (record.analysis?.overallScore && record.company?.name) {
                // Check if company already in list
                if (!companies.find(c => c.name === record.company.name)) {
                  companies.push({
                    id: record.id?.evaluationId || String(Date.now()),
                    name: record.company.name,
                    industry: record.company.industry || 'Technology',
                    triageScore: record.analysis.overallScore,
                    analysisDate: record.id?.createdAt || new Date().toISOString(),
                    evaluationId: record.id?.evaluationId || String(Date.now()),
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing unified_records:', e);
        }
      }

      // Sort by date descending
      companies.sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());

      setExistingCompanies(companies);
    } catch (error) {
      console.error('Error loading existing companies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load existing companies.',
      });
    } finally {
      setLoadingCompanies(false);
    }
  }, [toast]);

  // Load existing companies on mount
  useEffect(() => {
    loadExistingCompanies();
  }, [loadExistingCompanies]);

  // Generate HTML report content when entering step 7
  useEffect(() => {
    if (currentStep !== 7) return;
    const activeSections = reportSections.filter((s) => s.active);
    const result = analysisResult as Record<string, unknown> | null;
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const dealLabel = dealType ? dealType.charAt(0).toUpperCase() + dealType.slice(1) : 'Due Diligence';

    const sectionsHtml = activeSections
      .map((s) => {
        const sectionData =
          result && typeof result === 'object'
            ? (result[s.id] as string) ?? (result['content'] as string) ?? ''
            : '';
        const bodyText = sectionData
          ? sectionData
          : `${s.description} — Pending analyst review.`;
        return `<section style="margin-bottom:2.25rem;page-break-inside:avoid;">
  <h2 style="font-size:1.05rem;font-weight:700;color:#1e3a5f;border-bottom:2px solid #e2e8f0;padding-bottom:0.4rem;margin-bottom:0.75rem;">${s.title}</h2>
  <p style="color:#374151;font-size:0.9rem;line-height:1.75;">${bodyText}</p>
</section>`;
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Due Diligence Report – ${companyName}</title>
</head>
<body style="font-family:Georgia,'Times New Roman',serif;max-width:860px;margin:0 auto;padding:2.5rem 2rem;color:#1e293b;line-height:1.75;">
  <header style="text-align:center;border-bottom:3px solid #1e3a5f;padding-bottom:1.5rem;margin-bottom:2.5rem;">
    <p style="font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;margin:0 0 0.4rem;">Confidential — Not for Distribution</p>
    <h1 style="font-size:1.9rem;font-weight:800;color:#1e3a5f;margin:0 0 0.4rem;">${companyName}</h1>
    <p style="font-size:1rem;color:#475569;margin:0 0 0.5rem;">${dealLabel} Due Diligence Report</p>
    <p style="font-size:0.8rem;color:#94a3b8;margin:0;">${companyIndustry ? companyIndustry + '&nbsp;&middot;&nbsp;' : ''}${now}</p>
  </header>
${sectionsHtml}
  <footer style="border-top:1px solid #e2e8f0;padding-top:1rem;margin-top:2rem;text-align:center;color:#94a3b8;font-size:0.72rem;">
    Confidential &mdash; ${activeSections.length} section${activeSections.length !== 1 ? 's' : ''} &mdash; Generated ${now}
  </footer>
</body>
</html>`;
    setHtmlReportContent(html);
    setPreviewEditMode('view');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Handle selecting an existing company
  const handleSelectExistingCompany = useCallback((companyId: string) => {
    const company = existingCompanies.find(c => c.id === companyId);
    if (company) {
      setSelectedExistingCompany(companyId);
      setCompanyName(company.name);
      setCompanyIndustry(company.industry);
      setSourceEvaluationId(company.evaluationId);

      // Load company data from localStorage
      const tcaReports = localStorage.getItem('tca_reports');
      if (tcaReports) {
        try {
          const reports = JSON.parse(tcaReports);
          const report = reports.find((r: { companyName: string }) => r.companyName === company.name);
          if (report?.data) {
            // Store for later use
            localStorage.setItem('ddSourceAnalysis', JSON.stringify(report.data));
          }
        } catch (e) {
          console.warn('Error loading company data:', e);
        }
      }

      toast({
        title: 'Company Selected',
        description: `${company.name} selected. Previous triage data will be used as foundation.`,
      });
    }
  }, [existingCompanies, toast]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                Company Information
              </CardTitle>
              <CardDescription>Select an existing company or enter details about a new target company for due diligence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Selection Mode */}
              <div className="space-y-4">
                <Label>Company Source</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={selectionMode === 'existing' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectionMode('existing')}
                  >
                    <Database className="mr-2 size-4" />
                    Select from Database
                  </Button>
                  <Button
                    variant={selectionMode === 'new' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectionMode('new')}
                  >
                    <Building2 className="mr-2 size-4" />
                    New Company
                  </Button>
                </div>
              </div>

              {/* Existing Company Selection */}
              {selectionMode === 'existing' && (
                <div className="space-y-4">
                  <Label>Select Company with Triage Report</Label>
                  {loadingCompanies ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin mr-2" />
                      <span>Loading companies...</span>
                    </div>
                  ) : existingCompanies.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-muted/50">
                      <Database className="size-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No companies with completed triage reports found.</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setSelectionMode('new')}
                      >
                        Enter new company instead
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                      {existingCompanies.map((company) => (
                        <div
                          key={company.id}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                            selectedExistingCompany === company.id
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          )}
                          onClick={() => handleSelectExistingCompany(company.id)}
                        >
                          <div className="flex items-center gap-3">
                            {selectedExistingCompany === company.id && (
                              <CheckCircle2 className="size-5 text-primary" />
                            )}
                            <div>
                              <p className="font-semibold">{company.name}</p>
                              <p className="text-sm text-muted-foreground">{company.industry}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={company.triageScore >= 7 ? 'default' : company.triageScore >= 5 ? 'secondary' : 'destructive'}>
                              Score: {company.triageScore.toFixed(1)}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(company.analysisDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedExistingCompany && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-green-600" />
                      <span className="text-green-800">
                        Previous analysis data will be imported. You can add additional documents below.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* New Company Form or Additional Info */}
              {(selectionMode === 'new' || selectedExistingCompany) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="e.g., QuantumLeap AI"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={selectionMode === 'existing' && !!selectedExistingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticker">Stock Ticker (if public)</Label>
                      <Input
                        id="ticker"
                        name="ticker"
                        placeholder="e.g., AAPL"
                        value={companyTicker}
                        onChange={(e) => setCompanyTicker(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </>
              )}

              {selectionMode === 'new' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={companyIndustry} onValueChange={setCompanyIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthcare">Healthcare / MedTech</SelectItem>
                          <SelectItem value="technology">Technology / SaaS</SelectItem>
                          <SelectItem value="fintech">FinTech</SelectItem>
                          <SelectItem value="biotech">Biotechnology</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="retail">Retail / E-commerce</SelectItem>
                          <SelectItem value="energy">Energy / CleanTech</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealType">Deal Type</Label>
                      <Select value={dealType} onValueChange={setDealType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select deal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acquisition">Acquisition</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="merger">Merger</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="ipo">IPO Preparation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the company, its products/services, and market position..."
                      rows={4}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="size-5" />
                Document Submission
              </CardTitle>
              <CardDescription>Upload relevant documents for analysis. These are optional but improve analysis quality.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="file"><UploadCloud className="mr-2 size-4" /> Files</TabsTrigger>
                  <TabsTrigger value="url"><LinkIcon className="mr-2 size-4" /> URLs</TabsTrigger>
                  <TabsTrigger value="text"><Type className="mr-2 size-4" /> Text</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div
                    className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 text-lg font-semibold">Drop files here or click to browse</h3>
                    <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, XLSX, TXT (Max 50MB each)</p>
                    <Input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple accept=".pdf,.docx,.xlsx,.txt,.csv" />
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Uploaded Files ({uploadedFiles.length})</h4>
                      <div className="grid gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md border bg-muted/30 p-2">
                            <div className="flex items-center gap-2">
                              <FileText className="size-4 text-primary" />
                              <span className="font-medium text-sm">{file.name}</span>
                              <Badge variant="secondary" className="text-xs">{formatBytes(file.size)}</Badge>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="size-7">
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">Enter URLs to data rooms, document repositories, or public filings.</p>
                    <Textarea
                      placeholder="https://example.com/data-room/&#10;https://sec.gov/filing/..."
                      rows={4}
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <Button onClick={handleImportUrls} disabled={!urlInput.trim()}>
                      <LinkIcon className="mr-2 size-4" /> Import URLs
                    </Button>
                  </div>

                  {importedUrls.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Imported URLs ({importedUrls.length})</h4>
                      <div className="grid gap-2">
                        {importedUrls.map((url, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md border bg-muted/30 p-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Globe className="size-4 flex-shrink-0 text-primary" />
                              <span className="truncate text-sm">{url}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeUrl(index)} className="size-7">
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">Paste any relevant text, notes, or extracted content.</p>
                    <Textarea
                      placeholder="Paste executive summary, key findings, or other relevant information..."
                      rows={6}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                    <Button onClick={handleSubmitText} disabled={!textInput.trim()}>
                      <Type className="mr-2 size-4" /> Add Text
                    </Button>
                  </div>

                  {submittedTexts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Submitted Texts ({submittedTexts.length})</h4>
                      <div className="grid gap-2">
                        {submittedTexts.map((text, index) => (
                          <div key={index} className="flex items-start justify-between rounded-md border bg-muted/30 p-2">
                            <p className="text-sm line-clamp-2 flex-1 mr-2">{text}</p>
                            <Button variant="ghost" size="icon" onClick={() => removeText(index)} className="size-7 flex-shrink-0">
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                External Data Sources
              </CardTitle>
              <CardDescription>Connect to free external data sources for comprehensive analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {EXTERNAL_SOURCES.map((source) => (
                  <div
                    key={source.id}
                    className={cn(
                      "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      selectedSources.includes(source.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => {
                      setSelectedSources(prev =>
                        prev.includes(source.id)
                          ? prev.filter(s => s !== source.id)
                          : [...prev, source.id]
                      );
                    }}
                  >
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={(checked) => {
                        setSelectedSources(prev =>
                          checked
                            ? [...prev, source.id]
                            : prev.filter(s => s !== source.id)
                        );
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium cursor-pointer">{source.name}</Label>
                        {source.free && <Badge variant="outline" className="text-xs text-green-600 border-green-300">FREE</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{source.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Fetch external data for: <span className="text-primary">{companyName || companyTicker || 'No company set'}</span></p>
                  <p className="text-sm text-muted-foreground">{selectedSources.length} source(s) selected</p>
                </div>
                <Button onClick={fetchExternalData} disabled={fetchingData || !companyName}>
                  {fetchingData ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Fetching...</>
                  ) : (
                    <><RefreshCw className="mr-2 size-4" /> Fetch Data</>
                  )}
                </Button>
              </div>

              {externalData.length > 0 && (
                <Accordion type="multiple" className="w-full">
                  {externalData.map((result) => (
                    <AccordionItem key={result.source} value={result.source}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="size-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="size-4 text-amber-500" />
                          )}
                          <span className="font-medium">{EXTERNAL_SOURCES.find(s => s.id === result.source)?.name || result.source}</span>
                          {result.success && result.data ? (
                            <Badge variant="secondary" className="ml-2">
                              {String(Array.isArray(result.data) ? result.data.length : Object.keys(result.data as object).length)} items
                            </Badge>
                          ) : null}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {result.success ? (
                          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm text-destructive">{result.error || 'Failed to fetch data'}</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="size-5" />
                Analysis Areas
              </CardTitle>
              <CardDescription>Select the areas to include in the due diligence analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DD_AREAS.map((area) => {
                  const Icon = area.icon;
                  const isSelected = selectedAreas.includes(area.id);

                  return (
                    <div
                      key={area.id}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                        area.required && "ring-1 ring-primary/20"
                      )}
                      onClick={() => {
                        if (!area.required || !isSelected) {
                          setSelectedAreas(prev =>
                            isSelected
                              ? prev.filter(a => a !== area.id)
                              : [...prev, area.id]
                          );
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-md",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <Label className="font-semibold cursor-pointer">{area.name}</Label>
                            {area.required && <Badge variant="outline" className="ml-2 text-xs">Required</Badge>}
                          </div>
                        </div>
                        <Checkbox checked={isSelected} disabled={area.required && isSelected} />
                      </div>
                      <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {area.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Check className="size-3 text-primary" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                Configure Report Sections
              </CardTitle>
              <CardDescription>
                Select which sections to include in the due diligence report. All sections are active by default.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  {reportSections.filter((s) => s.active).length} / {reportSections.length} sections active
                </Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAllSections(true)}>
                    Enable All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAllSections(false)}>
                    Disable All
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {reportSections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-0.5 flex-1 mr-4">
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <Switch
                      checked={section.active}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="size-5" />
                  Review Summary
                </CardTitle>
                <CardDescription>Review your due diligence setup before generating the report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">TARGET COMPANY</h4>
                      <p className="text-lg font-semibold">{companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {companyTicker && `Ticker: ${companyTicker} • `}
                        {companyIndustry && `${companyIndustry} • `}
                        {dealType}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">DOCUMENTS</h4>
                      <div className="flex gap-4 text-sm mt-2">
                        <span>{uploadedFiles.length} file(s)</span>
                        <span>{importedUrls.length} URL(s)</span>
                        <span>{submittedTexts.length} text(s)</span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">EXTERNAL DATA</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSources.map(id => (
                          <Badge key={id} variant="secondary">
                            {EXTERNAL_SOURCES.find(s => s.id === id)?.name}
                            {externalData.find(d => d.source === id)?.success && (
                              <CheckCircle2 className="size-3 ml-1 text-green-500" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">ANALYSIS AREAS</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedAreas.map(id => {
                        const area = DD_AREAS.find(a => a.id === id);
                        if (!area) return null;
                        const Icon = area.icon;
                        return (
                          <div key={id} className="flex items-center gap-2 text-sm">
                            <Icon className="size-4 text-primary" />
                            <span>{area.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="mr-2 size-4" /> Save Draft
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="mr-2 size-4" /> Preview
                  </Button>
                  <Button size="lg" onClick={() => isAdminOrAnalyst ? setShowHumanReviewModal(true) : handleGenerateReport()} disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" /> Generating...</>
                    ) : (
                      <><BrainCircuit className="mr-2 size-4" /> Generate Report</>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="size-5" />
                    Preview Report
                  </CardTitle>
                  <CardDescription>Review the generated due diligence analysis before saving.</CardDescription>
                </div>
                {isAdminOrAnalyst && (
                  <div className="flex gap-2">
                    <Button
                      variant={previewEditMode === 'view' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewEditMode('view')}
                    >
                      <Eye className="size-4 mr-1" /> Preview
                    </Button>
                    <Button
                      variant={previewEditMode === 'edit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewEditMode('edit')}
                    >
                      <FileText className="size-4 mr-1" /> Edit HTML
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                  <p className="font-semibold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">{companyIndustry}{companyIndustry && dealType ? ' · ' : ''}{dealType}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Areas Analyzed</p>
                  <p className="font-semibold text-2xl">{selectedAreas.length}</p>
                  <p className="text-sm text-muted-foreground">of {DD_AREAS.length} areas</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Sections</p>
                  <p className="font-semibold text-2xl">{reportSections.filter((s) => s.active).length}</p>
                  <p className="text-sm text-muted-foreground">report sections</p>
                </div>
              </div>

              {/* Report preview / edit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Report Content</p>
                  {analysisResult != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="size-3.5" /> Analysis complete
                    </span>
                  )}
                </div>
                {isAdminOrAnalyst && previewEditMode === 'edit' ? (
                  <Textarea
                    value={htmlReportContent}
                    onChange={(e) => setHtmlReportContent(e.target.value)}
                    rows={26}
                    className="font-mono text-xs leading-relaxed"
                    placeholder="HTML report content..."
                  />
                ) : (
                  <div
                    className="rounded-lg border bg-white shadow-sm overflow-y-auto"
                    style={{ maxHeight: '620px' }}
                    dangerouslySetInnerHTML={{
                      __html: htmlReportContent || '<p style="padding:1.5rem;color:#94a3b8;font-size:0.875rem;">Report preview will appear here after generation.</p>',
                    }}
                  />
                )}
              </div>

              {/* Analyst commentary (admin/analyst only) */}
              {isAdminOrAnalyst && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Analyst Commentary</p>
                  <Textarea
                    placeholder="Add analyst notes, observations, or qualitative commentary..."
                    value={humanReviewNotes}
                    onChange={(e) => setHumanReviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="size-5" />
                Storage & Export
              </CardTitle>
              <CardDescription>
                Your due diligence report has been generated. Save it and download a copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                  <p className="font-semibold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">{companyIndustry}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Areas Analyzed</p>
                  <p className="font-semibold text-2xl">{selectedAreas.length}</p>
                  <p className="text-sm text-muted-foreground">of {DD_AREAS.length} areas</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Sections</p>
                  <p className="font-semibold">{reportSections.filter((s) => s.active).length}</p>
                  <p className="text-sm text-muted-foreground">active sections</p>
                </div>
              </div>

              {savedReportId && (
                <div className="rounded-lg border border-green-300 bg-green-50/40 p-4 flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-green-800">Saved as Report #{savedReportId}</p>
                    <p className="text-xs text-green-700">Due diligence report saved successfully to the database.</p>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="rounded-lg border border-red-300 bg-red-50/40 p-3 text-sm text-red-700">
                  <AlertCircle className="inline size-4 mr-1" />
                  {saveError}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {!savedReportId && (
                  <Button onClick={handleSaveReport} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {isSaving ? 'Saving...' : 'Save Report'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDownloadJSON}
                  className="gap-2"
                  disabled={!analysisResult}
                >
                  <Download className="size-4" />
                  Download JSON
                </Button>
                <Button variant="outline" onClick={handleDownloadCSV} className="gap-2">
                  <Download className="size-4" />
                  Download Sections CSV
                </Button>
                {savedReportId && (
                  <Button variant="outline" asChild className="gap-2">
                    <Link href="/dashboard/reports">
                      <Eye className="size-4" />
                      View All Reports
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 9:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Report Complete
              </CardTitle>
              <CardDescription>Your due diligence report has been generated and processed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-green-300 bg-green-50/40 p-6 text-center space-y-2">
                <CheckCircle2 className="size-10 text-green-600 mx-auto" />
                <p className="font-semibold text-green-800">Due Diligence Complete</p>
                <p className="text-sm text-green-700">{companyName} — {selectedAreas.length} areas analyzed</p>
                {savedReportId && <p className="text-xs text-green-700">Saved as Report #{savedReportId}</p>}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href="/dashboard/reports"><Eye className="mr-2 size-4" />View All Reports</Link>
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Start New Due Diligence
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <header className="mb-8">
        <Link
          href="/dashboard/reports"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" /> Back to Reports
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary tracking-tight">
              Due Diligence Workflow
            </h1>
            <p className="mt-2 text-muted-foreground">
              Complete the steps below to generate a comprehensive due diligence report.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max gap-0">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isAccessible = step.id <= Math.max(...completedSteps, currentStep);

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isAccessible && goToStep(step.id)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isActive && "bg-primary/10",
                    isAccessible && !isActive && "hover:bg-muted cursor-pointer",
                    !isAccessible && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && !isActive && "bg-green-500 text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted && !isActive ? (
                      <Check className="size-5" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </button>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-8 mx-1",
                    completedSteps.includes(step.id) ? "bg-green-500" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 size-4" /> Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {WORKFLOW_STEPS.length}
        </div>

        {currentStep < WORKFLOW_STEPS.length && currentStep !== 6 ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Next <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <div /> // Empty div for flex spacing
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>
              This preview shows the structure of the due diligence report that will be generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Due Diligence Report: {companyName}</h3>
              <p className="text-sm text-muted-foreground mb-4">{companyDescription || 'No description provided.'}</p>

              <h4 className="font-medium mb-2">Report Sections:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Executive Summary</li>
                {selectedAreas.map(id => (
                  <li key={id}>{DD_AREAS.find(a => a.id === id)?.name}</li>
                ))}
                <li>Key Findings & Recommendations</li>
                <li>Risk Matrix</li>
                <li>Appendices</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Human Review Modal */}
      <Dialog open={showHumanReviewModal} onOpenChange={setShowHumanReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Human Review Required</DialogTitle>
            <DialogDescription>
              As an analyst/admin, please confirm you have reviewed all input data before generating the report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Review Notes (optional)</Label>
            <Textarea
              placeholder="Document your pre-generation review observations..."
              value={humanReviewNotes}
              onChange={(e) => setHumanReviewNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHumanReviewModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowHumanReviewModal(false); handleGenerateReport(); }}>
              <BrainCircuit className="mr-2 size-4" /> Confirm & Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
