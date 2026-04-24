'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  FileText,
  BrainCircuit,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building2,
  Shield,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Zap,
  ClipboardList,
  Layers,
  Database,
  RefreshCw,
  Globe,
  AlertTriangle,
  Check,
  DollarSign,
  Activity,
  Briefcase,
  LineChart,
  FileSearch,
  UserCheck,
  Download,
  Save,
  Eye,
  Settings,
  AlertCircle,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { runAnalysis } from '@/app/analysis/actions';
import reportsApi from '@/lib/reports-api';

const TRIAGE_STEPS = [
  { id: 1, name: 'Company Info', icon: Building2, description: 'Basic company details' },
  { id: 2, name: 'Data Input', icon: ClipboardList, description: 'Pitch summary & key metrics' },
  { id: 3, name: 'External Data', icon: Database, description: 'Fetch external sources' },
  { id: 4, name: 'Modules', icon: Layers, description: 'Select analysis modules' },
  { id: 5, name: 'Report Sections', icon: Settings, description: 'Configure report sections' },
  { id: 6, name: 'Simulation', icon: SlidersHorizontal, description: 'Adjust module scores' },
  { id: 7, name: 'Generate', icon: BrainCircuit, description: 'Run triage analysis' },
  { id: 8, name: 'Preview Report', icon: Eye, description: 'Review analysis results' },
  { id: 9, name: 'Storage & Export', icon: Download, description: 'Save & download report' },
  { id: 10, name: 'Report Complete', icon: CheckCircle2, description: 'Analysis complete' },
  { id: 11, name: 'Prior Results', icon: LineChart, description: 'Previous report results' },
  { id: 12, name: 'Run Review', icon: UserCheck, description: 'Analysis run review' },
];

const EXTERNAL_SOURCES = [
  { id: 'sec', name: 'SEC EDGAR', description: 'Financial filings and regulatory disclosures for US public companies', free: true },
  { id: 'clinical-trials', name: 'ClinicalTrials.gov', description: 'Medical/clinical trial data from NIH registry', free: true },
  { id: 'fda', name: 'OpenFDA', description: 'FDA drug, device, and adverse event database', free: true },
  { id: 'github', name: 'GitHub', description: 'Public repository activity, stars, contributors, and code metrics', free: true },
  { id: 'news', name: 'Hacker News', description: 'Startup mentions, funding news, and tech trends', free: true },
  { id: 'patents', name: 'USPTO Patents', description: 'Patent filings and intellectual property data', free: true },
];

const TRIAGE_MODULES = [
  { id: 'tca', name: 'TCA Scorecard', description: 'Core 12-category investment scoring', icon: Target, required: true, weight: 20 },
  { id: 'risk', name: 'Risk Flags', description: '14-domain risk flag assessment', icon: Shield, required: true, weight: 15 },
  { id: 'growth', name: 'Growth Classifier', description: 'Revenue trajectory and growth tier', icon: TrendingUp, required: false, weight: 10 },
  { id: 'macro', name: 'Macro Trend Alignment', description: 'PESTEL market context analysis', icon: BarChart3, required: false, weight: 8 },
  { id: 'benchmark', name: 'Benchmark Comparison', description: 'Industry peer benchmarking', icon: Layers, required: false, weight: 5 },
  { id: 'team', name: 'Team Assessment', description: 'Founder & team quality signals', icon: Users, required: false, weight: 5 },
  { id: 'analyst', name: 'Analyst Report', description: 'Human analyst scoring and commentary', icon: FileSearch, required: false, weight: 5 },
  { id: 'funder', name: 'Funder Analysis', description: 'Investment readiness and funder matching', icon: DollarSign, required: false, weight: 5 },
  { id: 'gap', name: 'Gap Analysis', description: 'Performance gaps and improvement roadmap', icon: Activity, required: false, weight: 5 },
  { id: 'strategic', name: 'Strategic Analysis', description: 'Competitive positioning and moat strength', icon: Briefcase, required: false, weight: 5 },
  { id: 'economic', name: 'Economic Analysis', description: 'Market size and macro-economic indicators', icon: LineChart, required: false, weight: 4 },
  { id: 'financial', name: 'Financial Analysis', description: 'Revenue model, burn rate and projections', icon: BarChart3, required: false, weight: 4 },
  { id: 'environmental', name: 'Environmental Analysis', description: 'ESG alignment and climate risk', icon: Globe, required: false, weight: 3 },
  { id: 'marketing', name: 'Marketing Analysis', description: 'Brand positioning and GTM execution', icon: Zap, required: false, weight: 3 },
  { id: 'social', name: 'Social Impact Analysis', description: 'ESG scoring and social impact metrics', icon: Users, required: false, weight: 3 },
  { id: 'founderFit', name: 'Founder Fit', description: 'Founder background and team capabilities', icon: UserCheck, required: false, weight: 3 },
  { id: 'strategicFit', name: 'Strategic Fit', description: 'Alignment with investor thesis and portfolio', icon: BrainCircuit, required: false, weight: 2 },
];

const SECTORS = [
  'Technology / SaaS',
  'Healthcare / MedTech',
  'Biotechnology',
  'FinTech',
  'CleanTech / Energy',
  'E-commerce / Retail',
  'Manufacturing',
  'AI / Deep Tech',
  'Other',
];

const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'];

type Framework = 'general' | 'medtech';

interface ReportSection {
  id: string;
  title: string;
  active: boolean;
  description: string;
}

const DEFAULT_ADMIN_SECTIONS: ReportSection[] = [
  { id: 'executive-summary', title: 'Page 1: Executive Summary', active: true, description: 'Overall investment recommendation, key highlights, and company overview' },
  { id: 'quick-summary', title: 'Page 2: Quick Summary', active: true, description: 'One-page snapshot of key findings and scores' },
  { id: 'tca-scorecard', title: 'Page 2: TCA Scorecard', active: true, description: 'Composite score with category breakdown' },
  { id: 'tca-summary-card', title: 'Page 3: TCA Summary Card', active: true, description: 'Condensed TCA overview card with top strengths and concerns' },
  { id: 'tca-ai-table', title: 'Page 3: TCA AI Analysis Table', active: true, description: 'Detailed AI-powered analysis across all 12 TCA categories' },
  { id: 'tca-interpretation-summary', title: 'Page 4: TCA AI Interpretation', active: true, description: 'AI interpretation and insights summary' },
  { id: 'weighted-score-breakdown', title: 'Page 4: Weighted Score Breakdown', active: true, description: 'Weighted score breakdown by category' },
  { id: 'risk-flag-summary-table', title: 'Page 5: Risk Flag Summary', active: true, description: 'Risk flag summary table with severity levels' },
  { id: 'flag-analysis-narrative', title: 'Page 5: Flag Analysis Narrative', active: true, description: 'Detailed narrative analysis of risk flags' },
  { id: 'gap-analysis', title: 'Page 6: Gap Analysis', active: true, description: 'Performance gap heatmap and improvement roadmap' },
  { id: 'macro-trend-alignment', title: 'Page 6: Macro Trend Alignment', active: true, description: 'PESTEL analysis and market trend signals' },
  { id: 'benchmark-comparison', title: 'Page 7: Benchmark Comparison', active: true, description: 'Performance vs sector benchmarks and percentile rank' },
  { id: 'competitive-landscape', title: 'Page 7: Competitive Landscape', active: true, description: 'Competitor positioning and market differentiation' },
  { id: 'growth-classifier', title: 'Page 8: Growth Classifier', active: true, description: 'Growth tier classification and trajectory projection' },
  { id: 'team-assessment', title: 'Page 8: Team Assessment', active: true, description: 'Founder profiles, team completeness, and leadership gaps' },
  { id: 'ceo-questions', title: 'Page 9: CEO Questions', active: true, description: 'Strategic questions for the CEO and leadership team' },
  { id: 'consistency-check', title: 'Page 9: Consistency Check', active: true, description: 'Cross-validation of data consistency across modules' },
  { id: 'analyst-comments', title: 'Page 9: Analyst Comments', active: true, description: 'Human analyst review, sentiment, and qualitative notes' },
  { id: 'analyst-ai-deviation', title: 'Page 10: Analyst\u2013AI Score Deviation', active: true, description: 'Variance analysis between AI scores and analyst ratings' },
  { id: 'final-recommendation', title: 'Page 10: Final Recommendation', active: true, description: 'Investment decision and next steps' },
];

const DEFAULT_STANDARD_SECTIONS: ReportSection[] = [
  { id: 'executive-summary', title: 'Page 1: Executive Summary', active: true, description: 'Overall investment recommendation, key highlights, and company overview' },
  { id: 'quick-summary', title: 'Page 2: Quick Summary', active: true, description: 'One-page snapshot of key findings and scores' },
  { id: 'tca-scorecard', title: 'Page 2: TCA Scorecard', active: true, description: 'Composite score with category breakdown' },
  { id: 'tca-summary-card', title: 'Page 3: TCA Summary Card', active: true, description: 'Condensed TCA overview card with top strengths and concerns' },
  { id: 'tca-ai-table', title: 'Page 3: TCA AI Analysis Table', active: true, description: 'Detailed AI-powered analysis across all 12 TCA categories' },
  { id: 'tca-interpretation-summary', title: 'Page 4: TCA AI Interpretation', active: true, description: 'AI interpretation and insights summary' },
  { id: 'weighted-score-breakdown', title: 'Page 4: Weighted Score Breakdown', active: true, description: 'Weighted score breakdown by category' },
  { id: 'risk-flag-summary-table', title: 'Page 5: Risk Flag Summary', active: true, description: 'Risk flag summary table with severity levels' },
  { id: 'flag-analysis-narrative', title: 'Page 5: Flag Analysis Narrative', active: true, description: 'Detailed narrative analysis of risk flags' },
  { id: 'gap-analysis', title: 'Page 6: Gap Analysis', active: true, description: 'Performance gap heatmap and improvement roadmap' },
  { id: 'macro-trend-alignment', title: 'Page 6: Macro Trend Alignment', active: true, description: 'PESTEL analysis and market trend signals' },
  { id: 'benchmark-comparison', title: 'Page 7: Benchmark Comparison', active: true, description: 'Performance vs sector benchmarks and percentile rank' },
  { id: 'competitive-landscape', title: 'Page 7: Competitive Landscape', active: true, description: 'Competitor positioning and market differentiation' },
  { id: 'growth-classifier', title: 'Page 8: Growth Classifier', active: true, description: 'Growth tier classification and trajectory projection' },
  { id: 'team-assessment', title: 'Page 8: Team Assessment', active: true, description: 'Founder profiles, team completeness, and leadership gaps' },
  { id: 'ceo-questions', title: 'Page 9: CEO Questions', active: true, description: 'Strategic questions for the CEO and leadership team' },
  { id: 'consistency-check', title: 'Page 9: Consistency Check', active: true, description: 'Cross-validation of data consistency across modules' },
  { id: 'final-recommendation', title: 'Page 10: Final Recommendation', active: true, description: 'Investment decision and next steps' },
];

export default function TriageReportWizardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');

  const [pitchSummary, setPitchSummary] = useState('');
  const [keyMetrics, setKeyMetrics] = useState('');
  const [teamInfo, setTeamInfo] = useState('');
  const [productDescription, setProductDescription] = useState('');

  const [framework, setFramework] = useState<Framework>('general');
  const [selectedModules, setSelectedModules] = useState<string[]>(['tca', 'risk', 'growth', 'macro']);

  const [selectedSources, setSelectedSources] = useState<string[]>(['news']);
  const [externalData, setExternalData] = useState<Array<{ source: string; success: boolean; data: unknown; error?: string }>>([]);
  const [fetchingData, setFetchingData] = useState(false);

  const [simulatedScores, setSimulatedScores] = useState<Record<string, number>>(
    Object.fromEntries(TRIAGE_MODULES.map(m => [m.id, 50]))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<unknown>(null);
  const [compositeScore, setCompositeScore] = useState<number>(0);

  // Role-based
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'standard'>('standard');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);

  // Storage & Export
  const [savedReportId, setSavedReportId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showHumanReviewModal, setShowHumanReviewModal] = useState(false);
  const [humanReviewNotes, setHumanReviewNotes] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillText, setAutoFillText] = useState('');
  const [showAutoFill, setShowAutoFill] = useState(false);

  useEffect(() => {
    try {
      const role = (localStorage.getItem('userRole') || 'standard') as 'admin' | 'analyst' | 'standard';
      setUserRole(role);
      const isPrivileged = role === 'admin' || role === 'analyst';
      const configKey = isPrivileged ? 'report-config-triage-admin' : 'report-config-triage-standard';
      const saved = localStorage.getItem(configKey);
      setReportSections(saved ? JSON.parse(saved) : isPrivileged ? DEFAULT_ADMIN_SECTIONS : DEFAULT_STANDARD_SECTIONS);
    } catch {
      setReportSections(DEFAULT_STANDARD_SECTIONS);
    }
  }, []);

  const isAdminOrAnalyst = userRole === 'admin' || userRole === 'analyst';

  const canAdvanceFrom = (step: number): boolean => {
    if (step === 1) return companyName.trim().length > 0 && sector.length > 0 && stage.length > 0;
    if (step === 2) return pitchSummary.trim().length > 0;
    if (step === 3) return true;
    if (step === 4) return selectedModules.length > 0;
    if (step === 5) return reportSections.filter((s) => s.active).length > 0;
    return true;
  };

  const goToNext = () => {
    if (!canAdvanceFrom(currentStep)) {
      toast({
        variant: 'destructive',
        title: 'Required fields missing',
        description:
          currentStep === 1
            ? 'Please enter company name, sector, and stage.'
            : currentStep === 2
            ? 'Please enter a pitch summary.'
            : 'Please select at least one module.',
      });
      return;
    }
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((s) => Math.min(s + 1, TRIAGE_STEPS.length));
  };

  const goToPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const toggleModule = (moduleId: string, required: boolean) => {
    if (required) return;
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleSection = (sectionId: string) => {
    setReportSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, active: !s.active } : s))
    );
  };

  const toggleAllSections = (active: boolean) => {
    setReportSections((prev) => prev.map((s) => ({ ...s, active })));
  };

  const fetchExternalData = async () => {
    if (selectedSources.length === 0) return;
    setFetchingData(true);
    try {
      const response = await fetch('/api/external-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName, sources: selectedSources }),
      });
      const result = await response.json();
      const results = selectedSources.map((sourceId) => ({
        source: sourceId,
        success: result.data?.[sourceId]?.success ?? false,
        data: result.data?.[sourceId]?.data ?? null,
        error: result.data?.[sourceId]?.error,
      }));
      setExternalData(results);
      toast({ title: 'External data fetched', description: `${results.filter((r) => r.success).length}/${results.length} sources fetched.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Fetch failed', description: e instanceof Error ? e.message : 'Failed to fetch external data' });
    } finally {
      setFetchingData(false);
    }
  };

  const handleAutoFill = async () => {
    if (!autoFillText.trim()) return;
    setIsAutoFilling(true);
    try {
      const res = await fetch('/api/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: autoFillText }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        if (d.company_name) setCompanyName(d.company_name);
        if (d.website) setWebsite(d.website);
        if (d.sector) setSector(d.sector);
        if (d.stage) setStage(d.stage);
        if (d.location) setLocation(d.location);
        if (d.pitchSummary) setPitchSummary(d.pitchSummary);
        if (d.keyMetrics) setKeyMetrics(d.keyMetrics);
        if (d.teamInfo) setTeamInfo(d.teamInfo);
        if (d.productDescription) setProductDescription(d.productDescription);
        setShowAutoFill(false);
        setAutoFillText('');
        toast({ title: 'Auto-fill complete', description: `${result.fieldsExtracted || 'Fields'} extracted successfully.` });
      } else {
        toast({ variant: 'destructive', title: 'Auto-fill failed', description: 'Could not extract fields from text.' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Auto-fill failed', description: e instanceof Error ? e.message : 'Could not extract fields from text.' });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const recommendation = compositeScore >= 7 ? 'Proceed' : compositeScore >= 5.5 ? 'Conditional' : 'Pass';
      const saved = await reportsApi.createReport({
        company_name: companyName,
        report_type: 'triage',
        overall_score: compositeScore,
        tca_score: compositeScore,
        recommendation,
        analysis_data: analysisResult as Record<string, unknown>,
        module_scores: { modules: selectedModules, framework } as Record<string, unknown>,
        missing_sections: reportSections.filter((s) => !s.active).map((s) => s.id),
      });
      setSavedReportId(saved.id);
      toast({ title: 'Report saved', description: `Report #${saved.id} saved for ${companyName}.` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save report.';
      setSaveError(msg);
      toast({ variant: 'destructive', title: 'Save failed', description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJSON = () => {
    const data = {
      company: companyName, sector, stage, framework,
      compositeScore, analysisResult,
      reportSections: reportSections.filter((s) => s.active).map((s) => s.id),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-${companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const activeSections = reportSections.filter((s) => s.active);
    const rows = [['Section ID', 'Section Title', 'Active']].concat(
      reportSections.map((s) => [s.id, s.title, s.active ? 'Yes' : 'No'])
    );
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-sections-${companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    void activeSections;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Preparing triage analysis...');

    const triageContext = {
      companyName, sector, stage, website, location,
      pitchSummary, keyMetrics, teamInfo, productDescription,
      framework, selectedModules, reportType: 'triage',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('triageContext', JSON.stringify(triageContext));
    localStorage.setItem('activeCompanyData', JSON.stringify({ companyName, sector, stage }));

    const progressSteps = [
      { pct: 8,  msg: 'Initializing TCA framework...' },
      { pct: 18, msg: 'Running TCA Scorecard (12 categories)...' },
      { pct: 28, msg: 'Assessing risk flags (14 domains)...' },
      { pct: 38, msg: 'Classifying growth trajectory...' },
      { pct: 48, msg: 'Aligning macro & PESTEL trends...' },
      { pct: 55, msg: 'Running benchmark comparison...' },
      { pct: 62, msg: 'Evaluating team & founder fit...' },
      { pct: 68, msg: 'Analyzing funder readiness...' },
      { pct: 74, msg: 'Performing gap analysis...' },
      { pct: 80, msg: 'Running strategic & economic analysis...' },
      { pct: 86, msg: 'Computing weighted composite score...' },
      { pct: 92, msg: 'Applying report section configuration...' },
      { pct: 97, msg: 'Finalizing triage report...' },
    ];

    let stepIdx = 0;
    const progressTimer = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setGenerationProgress(progressSteps[stepIdx].pct);
        setGenerationStatus(progressSteps[stepIdx].msg);
        stepIdx++;
      }
    }, 1500);

    try {
      const analysisData = await runAnalysis(framework, {
        companyName, sector, stage, website, location,
        pitchSummary, keyMetrics, teamInfo, productDescription,
        activeModules: TRIAGE_MODULES.filter(m => selectedModules.includes(m.id)).map(m => ({ module_id: m.id, weight: m.weight, is_enabled: true }))
      });
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStatus('Triage complete!');

      localStorage.setItem('analysisResult', JSON.stringify(analysisData));
      localStorage.setItem('analysisFramework', framework);

      const score = (analysisData as { tcaData?: { overallScore?: number } })?.tcaData?.overallScore ?? 0;
      setCompositeScore(score);
      setAnalysisResult(analysisData);
      sessionStorage.setItem('companyData', JSON.stringify({
        companyName, sector, stage, website, location,
        pitchSummary, keyMetrics, teamInfo, productDescription
      }));
      localStorage.setItem('analysisCompanyName', companyName);

      const reportId = `triage-${Date.now()}`;
      const triageReport = {
        reportId, reportType: 'triage', companyName, framework,
        metadata: { compositeScore: score, sector, stage },
        createdAt: new Date().toISOString(), data: analysisData,
      };
      const existingReports = JSON.parse(localStorage.getItem('tca_reports') || '[]');
      existingReports.unshift(triageReport);
      localStorage.setItem('tca_reports', JSON.stringify(existingReports.slice(0, 50)));

      toast({ title: 'Triage Complete', description: `${companyName} triage analysis finished. Proceed to save.` });
      setCompletedSteps((prev) => [...new Set([...prev, 7])]);
      setCurrentStep(8);
    } catch (error) {
      clearInterval(progressTimer);
      console.error('Triage generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Triage Failed',
        description: error instanceof Error ? error.message : 'An error occurred during triage.',
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('');
    }
  };

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
              <CardDescription>
                Basic details about the company being screened for investment consideration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., QuantumLeap AI"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">
                    Sector <span className="text-destructive">*</span>
                  </Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger id="sector">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">
                    Stage <span className="text-destructive">*</span>
                  </Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger id="stage">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location / HQ</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setShowAutoFill(!showAutoFill)}>
                  <Sparkles className="size-4" />
                  {showAutoFill ? 'Hide' : 'Auto-Fill from Pitch Deck'}
                </Button>
                {showAutoFill && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Paste your pitch deck or company description here..."
                      value={autoFillText}
                      onChange={(e) => setAutoFillText(e.target.value)}
                      rows={5}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAutoFill}
                      disabled={isAutoFilling || !autoFillText.trim()}
                      className="gap-2"
                    >
                      {isAutoFilling ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                      {isAutoFilling ? 'Extracting...' : 'Extract & Fill Fields'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                Quick Data Input
              </CardTitle>
              <CardDescription>
                Paste the pitch summary and any available metrics. More context improves triage
                accuracy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pitchSummary">
                  Pitch Summary / Executive Overview{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="pitchSummary"
                  placeholder="Paste the company pitch deck content, executive summary, or any description of the business, market opportunity, and value proposition..."
                  rows={6}
                  value={pitchSummary}
                  onChange={(e) => setPitchSummary(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{pitchSummary.length} characters</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="keyMetrics">Key Metrics (optional)</Label>
                <Textarea
                  id="keyMetrics"
                  placeholder="ARR, MRR, growth rate, CAC, LTV, burn rate, runway, team size, number of customers..."
                  rows={4}
                  value={keyMetrics}
                  onChange={(e) => setKeyMetrics(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamInfo">Team Background (optional)</Label>
                  <Textarea
                    id="teamInfo"
                    placeholder="Founder backgrounds, key team members, advisors..."
                    rows={3}
                    value={teamInfo}
                    onChange={(e) => setTeamInfo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product / Technology (optional)</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Product description, tech stack, IP, differentiators..."
                    rows={3}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Fetch External Data
              </CardTitle>
              <CardDescription>
                Pull data from external sources to enrich the triage. All sources are optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Data Sources</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EXTERNAL_SOURCES.map((src) => {
                    const isSelected = selectedSources.includes(src.id);
                    return (
                      <div
                        key={src.id}
                        onClick={() =>
                          setSelectedSources((prev) =>
                            prev.includes(src.id)
                              ? prev.filter((s) => s !== src.id)
                              : [...prev, src.id]
                          )
                        }
                        className={cn(
                          'flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            setSelectedSources((prev) =>
                              prev.includes(src.id)
                                ? prev.filter((s) => s !== src.id)
                                : [...prev, src.id]
                            )
                          }
                        />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm">{src.name}</p>
                          <p className="text-xs text-muted-foreground">{src.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={fetchExternalData}
                  disabled={fetchingData || selectedSources.length === 0}
                  className="gap-2"
                >
                  {fetchingData ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Database className="size-4" />
                  )}
                  {fetchingData ? 'Fetching...' : `Fetch ${selectedSources.length} Source(s)`}
                </Button>
                {externalData.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    {externalData.filter((d) => d.success).length}/{externalData.length} fetched
                  </Badge>
                )}
              </div>
              {externalData.length > 0 && (
                <div className="space-y-2">
                  {externalData.map((d) => (
                    <div
                      key={d.source}
                      className={cn(
                        'flex items-center gap-2 rounded-md border p-3 text-sm',
                        d.success ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'
                      )}
                    >
                      {d.success ? (
                        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                      ) : (
                        <AlertCircle className="size-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium capitalize">{d.source}</span>
                      <span className="text-muted-foreground ml-auto text-xs">
                        {d.success ? 'OK' : d.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-5" />
                Select Analysis Modules
              </CardTitle>
              <CardDescription>
                Choose the modules to include in the triage. Required modules are always included.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Analysis Framework</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFramework('general')}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all',
                      framework === 'general'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <Zap className="size-4" />
                      General Tech
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SaaS, AI, FinTech, and general technology companies
                    </p>
                  </button>
                  <button
                    onClick={() => setFramework('medtech')}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all',
                      framework === 'medtech'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <Shield className="size-4" />
                      MedTech / Life Sciences
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Healthcare, biotech, medical devices, and regulated industries
                    </p>
                  </button>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Triage Modules ({selectedModules.length} selected)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TRIAGE_MODULES.map((mod) => {
                    const Icon = mod.icon;
                    const isSelected = selectedModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id, mod.required)}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border-2 p-4 transition-all',
                          mod.required ? 'cursor-not-allowed opacity-90' : 'cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={mod.required}
                          onCheckedChange={() => toggleModule(mod.id, mod.required)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-primary" />
                            <span className="font-medium text-sm">{mod.name}</span>
                            {mod.required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Weight: {mod.weight}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                {isAdminOrAnalyst
                  ? 'Admin/Analyst view: full section set including analyst comments and AI score deviation.'
                  : 'Select which sections to include in your triage report.'}
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

      case 6: {
        const selectedModulesData = TRIAGE_MODULES.filter(m => selectedModules.includes(m.id));
        const totalWeight = selectedModulesData.reduce((sum, m) => sum + m.weight, 0);
        const simulatedComposite = totalWeight > 0
          ? selectedModulesData.reduce((sum, m) => sum + (simulatedScores[m.id] ?? 50) * m.weight, 0) / totalWeight / 10
          : 0;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-5" />
                Module Score Simulation
              </CardTitle>
              <CardDescription>
                Adjust expected scores per module to preview the composite result before running AI analysis. Scores range 0–100.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Simulated Composite Score</p>
                  <p className="text-3xl font-bold text-primary">
                    {simulatedComposite.toFixed(2)} <span className="text-lg font-normal text-muted-foreground">/ 10</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={simulatedComposite >= 7 ? 'default' : simulatedComposite >= 5.5 ? 'secondary' : 'destructive'}
                    className="text-sm px-3 py-1"
                  >
                    {simulatedComposite >= 7 ? 'Proceed' : simulatedComposite >= 5.5 ? 'Conditional' : 'Pass'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{selectedModulesData.length} modules · combined weight {totalWeight}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedModulesData.map((mod) => {
                  const Icon = mod.icon;
                  const score = simulatedScores[mod.id] ?? 50;
                  const contribution = totalWeight > 0 ? (score * mod.weight / totalWeight / 10) : 0;
                  return (
                    <div key={mod.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-primary shrink-0" />
                          <span className="font-medium text-sm">{mod.name}</span>
                          <span className="text-xs text-muted-foreground">(wt:{mod.weight})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">{score}</span>
                          <span className="text-xs text-muted-foreground ml-1">+{contribution.toFixed(2)}</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={score}
                        aria-label={`Score for ${mod.name}`}
                        title={`Score for ${mod.name}: ${score}`}
                        onChange={(e) =>
                          setSimulatedScores((prev) => ({ ...prev, [mod.id]: Number(e.target.value) }))
                        }
                        className="w-full accent-primary cursor-pointer h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSimulatedScores(Object.fromEntries(TRIAGE_MODULES.map(m => [m.id, 50])))
                  }
                >
                  <RefreshCw className="size-4 mr-2" />
                  Reset All to 50
                </Button>
                <Button onClick={goToNext} className="gap-2 px-8" size="lg">
                  <BrainCircuit className="size-4" />
                  Finalize &amp; Continue to Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="size-5" />
                Review & Generate Triage Report
              </CardTitle>
              <CardDescription>
                Confirm the configuration and run the AI analysis. This typically takes 30–60
                seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                  <p className="font-semibold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">{sector}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stage</p>
                  <p className="font-semibold">{stage}</p>
                  <p className="text-sm text-muted-foreground">
                    {location || 'Location not set'}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Framework
                  </p>
                  <p className="font-semibold capitalize">{framework}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedModules.length} modules · {reportSections.filter((s) => s.active).length} sections
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Modules to run:</Label>
                <div className="flex flex-wrap gap-2">
                  {TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id)).map((m) => (
                    <Badge key={m.id} variant="secondary" className="gap-1">
                      <m.icon className="size-3" />
                      {m.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-semibold">Input data summary:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-500" />
                    Pitch summary: {pitchSummary.length} characters
                  </li>
                  {keyMetrics && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Key metrics provided
                    </li>
                  )}
                  {teamInfo && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Team information provided
                    </li>
                  )}
                  {productDescription && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Product description provided
                    </li>
                  )}
                </ul>
              </div>
              {isGenerating && (
                <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="font-medium">{generationStatus}</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {generationProgress}% complete
                  </p>
                </div>
              )}
              {!isGenerating && (
                <div className="flex justify-center pt-2">
                  <Button size="lg" onClick={() => isAdminOrAnalyst ? setShowHumanReviewModal(true) : handleGenerate()} className="gap-2 px-8">
                    <Zap className="size-5" />
                    Run Triage Analysis
                  </Button>
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
                <Eye className="size-5" />
                Preview Report
              </CardTitle>
              <CardDescription>
                Review the analysis results before saving and exporting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                  <p className="font-semibold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">{sector} · {stage}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Composite Score</p>
                  <p className="font-semibold text-2xl">{compositeScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {compositeScore >= 7 ? 'Proceed' : compositeScore >= 5.5 ? 'Conditional' : 'Pass'}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Sections</p>
                  <p className="font-semibold">{reportSections.filter((s) => s.active).length}</p>
                  <p className="text-sm text-muted-foreground">report sections</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Active Modules</p>
                <div className="flex flex-wrap gap-2">
                  {TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id)).map((m) => (
                    <span key={m.id} className="rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
              {analysisResult && (analysisResult as { tcaData?: { categories?: Array<{ name: string; score: number; maxScore: number }> } })?.tcaData?.categories && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">TCA Category Breakdown</p>
                  <div className="space-y-1">
                    {(analysisResult as { tcaData: { categories: Array<{ name: string; score: number; maxScore: number }> } }).tcaData.categories.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <span className="text-muted-foreground">{cat.name}</span>
                        <span className="font-semibold">{cat.score?.toFixed(1)} / {cat.maxScore ?? 10}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysisResult && (analysisResult as { keyFindings?: string[] })?.keyFindings && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Findings</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {(analysisResult as { keyFindings: string[] }).keyFindings.slice(0, 5).map((finding, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={goToNext}>
                  Proceed to Storage
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 9:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="size-5" />
                Storage & Export
              </CardTitle>
              <CardDescription>
                Save your triage report to the database and download the results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                  <p className="font-semibold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">{sector}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Score</p>
                  <p className="font-semibold text-2xl">{compositeScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {compositeScore >= 7 ? 'Proceed' : compositeScore >= 5.5 ? 'Conditional' : 'Pass'}
                  </p>
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
                    <p className="font-semibold text-sm text-green-800">
                      Saved as Report #{savedReportId}
                    </p>
                    <p className="text-xs text-green-700">
                      Report saved successfully to the database.
                    </p>
                  </div>
                </div>
              )}
              {saveError && (
                <div className="rounded-lg border border-red-300 bg-red-50/40 p-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {!savedReportId && (
                  <Button onClick={handleSaveReport} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
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
      case 10:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Report Complete
              </CardTitle>
              <CardDescription>
                Your triage report has been generated and processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-green-300 bg-green-50/40 p-6 text-center space-y-2">
                <CheckCircle2 className="size-10 text-green-600 mx-auto" />
                <p className="font-semibold text-green-800">Analysis Complete</p>
                <p className="text-sm text-green-700">
                  {companyName} — Score: {compositeScore.toFixed(1)} (
                  {compositeScore >= 7 ? 'Proceed' : compositeScore >= 5.5 ? 'Conditional' : 'Pass'})
                </p>
                {savedReportId && (
                  <p className="text-xs text-green-700">Saved as Report #{savedReportId}</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href="/dashboard/reports">
                    <Eye className="mr-2 size-4" />
                    View All Reports
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Start New Triage
                </Button>
                <Button variant="secondary" onClick={() => { window.location.href = '/analysis/what-if'; }}>
                  <LineChart className="mr-2 size-4" />
                  Run What-If Simulation
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 11: {
        const historicalReports: Array<{ id: number; score: number; recommendation: string; date: string }> = [];
        try {
          const stored = localStorage.getItem('tca_reports');
          if (stored) {
            const all = JSON.parse(stored) as Array<{ company_name: string; id: number; overall_score: number; recommendation: string; created_at: string }>;
            all.filter((r) => r.company_name?.toLowerCase() === companyName.toLowerCase()).forEach((r) => {
              historicalReports.push({ id: r.id, score: r.overall_score, recommendation: r.recommendation, date: r.created_at });
            });
          }
        } catch { /* ignore */ }
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="size-5" />
                Previous Report Results
              </CardTitle>
              <CardDescription>Historical triage results for {companyName || 'this company'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {historicalReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No previous reports found for this company.</p>
              ) : (
                <div className="space-y-2">
                  {historicalReports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span className="text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString() : 'Unknown date'}</span>
                      <span className="font-semibold">{r.score?.toFixed(1) ?? '—'}</span>
                      <Badge variant={r.recommendation === 'Proceed' ? 'default' : r.recommendation === 'Conditional' ? 'secondary' : 'destructive'}>
                        {r.recommendation}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={goToNext}>
                  Continue to Review <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 12:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="size-5" />
                Analysis Run Review
              </CardTitle>
              <CardDescription>Final analyst sign-off before archiving this triage run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Run Notes</Label>
                <Textarea
                  placeholder="Add any final observations, caveats, or follow-up actions for this triage run..."
                  value={humanReviewNotes}
                  onChange={(e) => setHumanReviewNotes(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Summary</p>
                <p className="font-semibold">{companyName} — Score: {compositeScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">
                  {compositeScore >= 7 ? 'Recommendation: Proceed' : compositeScore >= 5.5 ? 'Recommendation: Conditional' : 'Recommendation: Pass'}
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast({ title: 'Review saved', description: 'Analysis run review notes have been recorded.' })}>
                  <CheckCircle2 className="mr-2 size-4" /> Confirm &amp; Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reports">
                <ArrowLeft className="mr-1 size-4" />
                Reports
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="size-6 text-primary" />
            Triage Report Wizard
          </h1>
          <p className="text-muted-foreground text-sm">
            Quick AI-powered screening to identify investment-worthy companies
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Step {currentStep} of {TRIAGE_STEPS.length}
        </Badge>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-12 gap-2">
        {TRIAGE_STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all',
                isCurrent
                  ? 'border-primary bg-primary/5'
                  : isCompleted
                  ? 'border-green-500/30 bg-green-50/30'
                  : 'border-border bg-muted/20 opacity-60'
              )}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full',
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold">{step.name}</p>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {renderStepContent()}

      {!(currentStep === 7 && isGenerating) && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={goToPrev} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 size-4" />
            Previous
          </Button>
          {currentStep < TRIAGE_STEPS.length && currentStep !== 6 && currentStep !== 7 && (
            <Button onClick={goToNext} disabled={!canAdvanceFrom(currentStep)}>
              Next
              <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
      )}
      <Dialog open={showHumanReviewModal} onOpenChange={setShowHumanReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Human Review Required</DialogTitle>
            <DialogDescription>
              As an analyst/admin, please confirm you have reviewed all input data before running the triage analysis.
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
            <Button onClick={() => { setShowHumanReviewModal(false); handleGenerate(); }}>
              <BrainCircuit className="mr-2 size-4" /> Confirm &amp; Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
