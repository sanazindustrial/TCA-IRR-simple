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
  Upload,
  X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { runAnalysis } from '@/app/analysis/actions';
import reportsApi from '@/lib/reports-api';
import { externalSourcesConfig } from '@/lib/external-sources-config';

const TRIAGE_STEPS = [
  { id: 1, name: 'Upload', icon: Upload, description: 'Upload company documents' },
  { id: 2, name: 'Data Extraction', icon: FileSearch, description: 'Extract data from documents' },
  { id: 3, name: 'Company Info', icon: Building2, description: 'Basic company details' },
  { id: 4, name: 'Data Input', icon: ClipboardList, description: 'Pitch summary & key metrics' },
  { id: 5, name: 'External Data', icon: Database, description: 'Fetch external sources' },
  { id: 6, name: 'Modules', icon: Layers, description: 'Select analysis modules' },
  { id: 7, name: 'Report Sections', icon: Settings, description: 'Configure report sections' },
  { id: 8, name: 'Simulation', icon: SlidersHorizontal, description: 'Adjust module scores' },
  { id: 9, name: 'Generate', icon: BrainCircuit, description: 'Run triage analysis' },
  { id: 10, name: 'What-If', icon: SlidersHorizontal, description: 'What-if scenario analysis' },
  { id: 11, name: 'Preview Report', icon: Eye, description: 'Review analysis results' },
  { id: 12, name: 'Storage & Export', icon: Download, description: 'Save & download report' },
  { id: 13, name: 'Report Complete', icon: CheckCircle2, description: 'Analysis complete' },
  { id: 14, name: 'Prior Results', icon: LineChart, description: 'Previous report results' },
  { id: 15, name: 'Run Review', icon: UserCheck, description: 'Analysis run review' },
];

const EXTERNAL_SOURCES = externalSourcesConfig
  .filter((s) => s.requirementGroup === 'A' || s.requirementGroup === 'B')
  .map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    free: s.pricing === 'Free' || s.pricing === 'Freemium',
  }));

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
const STANDARD_RESTRICTED_STEP_IDS = [5, 6, 7, 8, 10];

const cleanShortText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

const cleanLongText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const cleanCompanyName = (value: unknown): string => {
  const raw = cleanShortText(value);
  if (!raw) return '';

  let candidate = raw.split('\n')[0].trim();
  for (const sep of [' | ', ' - ', ' -- ', ' : ']) {
    const idx = candidate.indexOf(sep);
    if (idx > 2) {
      const left = candidate.slice(0, idx).trim();
      if (left) {
        candidate = left;
        break;
      }
    }
  }

  candidate = candidate.split(/[.!?]/)[0].trim();
  if (candidate.includes(',')) {
    const [left, right = ''] = candidate.split(',', 2).map((part) => part.trim());
    if (left.length >= 2 && (right.split(/\s+/).length <= 2 || /ing$/i.test(right))) {
      candidate = left;
    }
  }
  candidate = candidate.replace(/\s+we\b.*$/i, '').trim();

  const invalidSentenceHint = /(specializing|delivering|transforming|platform|solution|that\s+deliver|we\s+|our\s+)/i;
  if (invalidSentenceHint.test(candidate) && candidate.split(/\s+/).length > 4) {
    const titleLead = candidate.match(/^[A-Z0-9][A-Za-z0-9&.'-]*(?:\s+[A-Z0-9][A-Za-z0-9&.'-]*){0,3}/)?.[0] ?? '';
    candidate = titleLead || '';
  }

  if (candidate.length > 60) {
    const shortened = candidate.slice(0, 60);
    const safe = shortened.slice(0, shortened.lastIndexOf(' ')).trim();
    candidate = safe || shortened.trim();
  }

  if (candidate.includes(',')) {
    const concise = candidate.split(',')[0].trim();
    if (concise.length >= 2) {
      candidate = concise;
    }
  }

  return candidate;
};

const inferCompanyNameFromText = (text: string): string => {
  const patterns: RegExp[] = [
    /(?:company|startup|organization|legal)\s*(?:name)?\s*[:\-]\s*([^\n]{2,100})/i,
    /\b([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})\s*,\s*(?:[A-Z][a-z]+ing\b[^\n]*)/,
    /(?:^|\n)\s*([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})\s*(?:\n|$)/m,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    const cleaned = cleanCompanyName(m?.[1]);
    if (cleaned) return cleaned;
  }

  return '';
};

const cleanOneLineDescription = (value: unknown): string => {
  const text = cleanShortText(value);
  if (!text) return '';
  return text
    .replace(/^company\s+name\s*:\s*/i, '')
    .replace(/^startup\s+name\s*:\s*/i, '')
    .trim();
};

const pickFirstText = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = cleanLongText(obj[key]);
    if (value) return value;
  }
  return '';
};

const buildLocationText = (obj: Record<string, unknown>): string => {
  const direct = cleanShortText(
    pickFirstText(obj, ['location', 'hq', 'headquarters', 'headquarter_location', 'headquarterLocation'])
  );
  if (direct) return direct;

  const city = cleanShortText(pickFirstText(obj, ['city']));
  const state = cleanShortText(pickFirstText(obj, ['state', 'province', 'region']));
  const country = cleanShortText(pickFirstText(obj, ['country']));
  const parts = [city, state, country].filter(Boolean);
  return parts.join(', ');
};

const buildMetricsText = (obj: Record<string, unknown>): string => {
  const existing = cleanLongText(
    pickFirstText(obj, ['key_metrics', 'keyMetrics', 'metrics', 'traction_metrics', 'tractionMetrics', 'cashFlow', 'fundingHistory'])
  );
  if (existing) return existing;

  const metrics: string[] = [];
  const annualRevenue = cleanShortText(pickFirstText(obj, ['annualRevenue', 'annual_revenue', 'yearlyRevenue', 'yearly_revenue']));
  const preMoney = cleanShortText(pickFirstText(obj, ['preMoneyValuation', 'pre_money_valuation']));
  const mrr = cleanShortText(pickFirstText(obj, ['monthlyRecurringRevenue', 'mrr']));
  const burn = cleanShortText(pickFirstText(obj, ['burnRate', 'burn_rate']));
  if (annualRevenue) metrics.push(`Annual Revenue: ${annualRevenue}`);
  if (preMoney) metrics.push(`Pre-money Valuation: ${preMoney}`);
  if (mrr) metrics.push(`MRR: ${mrr}`);
  if (burn) metrics.push(`Burn Rate: ${burn}`);
  return metrics.join('\n');
};

const extractAnnualRevenueText = (sourceText: string): string => {
  const match = sourceText.match(/(?:annual\s+revenue|revenue)[:\s]*\$?([\d,.]+)\s*(million|m|k|thousand|billion|b)?/i);
  if (!match) return '';
  const amount = match[1].replace(/\s+/g, '');
  const unit = (match[2] ?? '').toUpperCase();
  if (!unit) return `$${amount}`;
  if (unit === 'MILLION') return `$${amount}M`;
  if (unit === 'THOUSAND') return `$${amount}K`;
  if (unit === 'BILLION') return `$${amount}B`;
  return `$${amount}${unit}`;
};

const extractEmployeesText = (sourceText: string): string => {
  const match = sourceText.match(/(?:team\s+size|employees?|headcount|staff)[:\s]*(\d{1,6})/i);
  return match?.[1] ?? '';
};

const splitLocationParts = (locationText: string): { city: string; state: string; country: string } => {
  const parts = cleanShortText(locationText).split(',').map((p) => p.trim()).filter(Boolean);
  return {
    city: parts[0] ?? '',
    state: parts[1] ?? '',
    country: parts[2] ?? '',
  };
};

const deriveProductDescription = (oneLine: string, companyDesc: string): string => {
  if (cleanLongText(oneLine)) return cleanLongText(oneLine);
  const firstSentence = cleanLongText(companyDesc).split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length >= 20) ?? '';
  return firstSentence;
};

const normalizeStageValue = (value: unknown): string => {
  const raw = cleanShortText(value);
  if (!raw) return '';

  const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byCanonical = STAGES.find((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '') === compact);
  if (byCanonical) return byCanonical;

  const aliases: Record<string, string> = {
    preseed: 'Pre-seed',
    preseedstage: 'Pre-seed',
    seedstage: 'Seed',
    seriesa: 'Series A',
    seriesb: 'Series B',
    seriesc: 'Series C+',
    seriescplus: 'Series C+',
    growthstage: 'Growth',
    late: 'Growth',
  };

  return aliases[compact] ?? '';
};

const normalizeSectorValue = (value: unknown): string => {
  const raw = cleanShortText(value);
  if (!raw) return '';

  const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byCanonical = SECTORS.find((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '') === compact);
  if (byCanonical) return byCanonical;

  const aliases: Record<string, string> = {
    saas: 'Technology / SaaS',
    technology: 'Technology / SaaS',
    tech: 'Technology / SaaS',
    medtech: 'Healthcare / MedTech',
    healthcare: 'Healthcare / MedTech',
    biotech: 'Biotechnology',
    fintech: 'FinTech',
    cleantech: 'CleanTech / Energy',
    ecommerce: 'E-commerce / Retail',
    ai: 'AI / Deep Tech',
    deeptech: 'AI / Deep Tech',
  };

  return aliases[compact] ?? '';
};

const isPositiveNumberText = (value: string): boolean => {
  const normalized = value.replace(/[$,\s]/g, '');
  const num = Number(normalized);
  return Number.isFinite(num) && num > 0;
};

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
  { id: 'ceo-questions', title: 'Page 6: CEO Questions', active: true, description: 'Strategic questions for the CEO and leadership team' },
  { id: 'final-recommendation', title: 'Page 7: Final Recommendation & Conclusion', active: true, description: 'Investment decision, deep analysis conclusion, and next steps based on company data.' },
];

interface ExtractedMetric {
  field: string;
  value: string;
  source: string;
  verified: boolean;
}

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
  const [businessModel, setBusinessModel] = useState('');
  const [country, setCountry] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [city, setCity] = useState('');
  const [oneLineDescription, setOneLineDescription] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');
  const [pitchDeckPath, setPitchDeckPath] = useState('');
  const [legalName, setLegalName] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');

  const [pitchSummary, setPitchSummary] = useState('');
  const [keyMetrics, setKeyMetrics] = useState('');
  const [teamInfo, setTeamInfo] = useState('');
  const [productDescription, setProductDescription] = useState('');

  const [framework, setFramework] = useState<Framework>('general');
  const [selectedModules, setSelectedModules] = useState<string[]>(['tca', 'risk', 'growth', 'macro']);

  const [selectedSources, setSelectedSources] = useState<string[]>(['hackernews']);
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
  const [reportOwner, setReportOwner] = useState('Unknown User');
  const [trackingId, setTrackingId] = useState('TRIAGE-LOADING');
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

  // Upload & Extraction
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [links, setLinks] = useState('');
  
  // Supporting docs extraction metrics
  const [supportingDocsMetrics, setSupportingDocsMetrics] = useState<ExtractedMetric[]>([]);
  const [supportingDocsExtractionStatus, setSupportingDocsExtractionStatus] = useState('');
  const [supportingDocsExtractionError, setSupportingDocsExtractionError] = useState<string | null>(null);

  const resetWizard = () => {
    setCurrentStep(firstStepId);
    setCompletedSteps([]);
    setCompanyName('');
    setSector('');
    setStage('');
    setWebsite('');
    setLocation('');
    setBusinessModel('');
    setCountry('');
    setStateRegion('');
    setCity('');
    setOneLineDescription('');
    setCompanyDescription('');
    setAnnualRevenue('');
    setPreMoneyValuation('');
    setPitchDeckPath('');
    setLegalName('');
    setNumberOfEmployees('');
    setPitchSummary('');
    setKeyMetrics('');
    setTeamInfo('');
    setProductDescription('');
    setFramework('general');
    setSelectedModules(['tca', 'risk', 'growth', 'macro']);
    setSelectedSources(['hackernews']);
    setExternalData([]);
    setFetchingData(false);
    setSimulatedScores(Object.fromEntries(TRIAGE_MODULES.map((m) => [m.id, 50])));
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStatus('');
    setAnalysisResult(null);
    setCompositeScore(0);
    setSavedReportId(null);
    setIsSaving(false);
    setSaveError(null);
    setShowHumanReviewModal(false);
    setHumanReviewNotes('');
    setIsAutoFilling(false);
    setAutoFillText('');
    setShowAutoFill(false);
    setUploadedFiles([]);
    setIsExtracting(false);
    setExtractionProgress(0);
    setExtractionStatus('');
    setExtractionError(null);
    setExtractedText('');
    setPitchDeckFile(null);
    setSupportingFiles([]);
    setAdditionalContext('');
    setLinks('');
    setSupportingDocsMetrics([]);
    setSupportingDocsExtractionStatus('');
    setSupportingDocsExtractionError(null);
    setReportSections(isAdminOrAnalyst ? DEFAULT_ADMIN_SECTIONS : DEFAULT_STANDARD_SECTIONS);
    toast({ title: 'Fresh start ready', description: 'Wizard has been reset. You can begin again from upload.' });
  };

  useEffect(() => {
    try {
      // Generate client-only tracking ID to avoid SSR/CSR hydration mismatch.
      setTrackingId(`TRIAGE-${Date.now().toString(36).toUpperCase()}`);

      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const name = cleanShortText(parsed?.name || parsed?.fullName || parsed?.username || parsed?.email);
        if (name) setReportOwner(name);
      }
      const parsedRole = storedUser
        ? (JSON.parse(storedUser)?.role?.toLowerCase() ?? 'user')
        : (localStorage.getItem('userRole') || 'user').toLowerCase();

      const role: 'admin' | 'analyst' | 'standard' =
        parsedRole === 'admin' ? 'admin' : parsedRole === 'analyst' ? 'analyst' : 'standard';

      setUserRole(role);

      const isPrivileged = role === 'admin' || role === 'analyst';
      if (isPrivileged) {
        const saved = localStorage.getItem('report-config-triage-admin');
        setReportSections(saved ? JSON.parse(saved) : DEFAULT_ADMIN_SECTIONS);
      } else {
        setReportSections(DEFAULT_STANDARD_SECTIONS);
      }
    } catch {
      setUserRole('standard');
      setReportOwner('Unknown User');
      setReportSections(DEFAULT_STANDARD_SECTIONS);
    }
  }, []);

    // Auto-set modules for standard users: only TCA and Risk (required modules only)
    useEffect(() => {
      if (userRole === 'standard') {
        setSelectedModules(['tca', 'risk']);
      }
    }, [userRole]);

  const isAdminOrAnalyst = userRole === 'admin' || userRole === 'analyst';
  const visibleSteps = isAdminOrAnalyst
    ? TRIAGE_STEPS
    : TRIAGE_STEPS.filter((s) => !STANDARD_RESTRICTED_STEP_IDS.includes(s.id));
  const firstStepId = visibleSteps[0]?.id ?? 1;
  const lastStepId = visibleSteps[visibleSteps.length - 1]?.id ?? 1;
  const currentStepPosition = Math.max(1, visibleSteps.findIndex((s) => s.id === currentStep) + 1);
  const currentStepMeta = visibleSteps.find((s) => s.id === currentStep);

  const getNextStepId = (stepId: number): number => {
    const idx = visibleSteps.findIndex((s) => s.id === stepId);
    if (idx < 0) {
      return firstStepId;
    }
    return visibleSteps[Math.min(idx + 1, visibleSteps.length - 1)]?.id ?? stepId;
  };

  const getPrevStepId = (stepId: number): number => {
    const idx = visibleSteps.findIndex((s) => s.id === stepId);
    if (idx < 0) {
      return firstStepId;
    }
    return visibleSteps[Math.max(idx - 1, 0)]?.id ?? stepId;
  };

  useEffect(() => {
    if (!visibleSteps.some((s) => s.id === currentStep)) {
      setCurrentStep(firstStepId);
    }
  }, [currentStep, firstStepId, visibleSteps]);

  const canAdvanceFrom = (step: number): boolean => {
    if (step === 1) return !!pitchDeckFile; // Pitch deck is required for triage flow
    if (step === 2) return true; // Data Extraction is optional
    if (step === 3) {
      const requiredChecks = [
        companyName.trim().length > 0,
        sector.length > 0,
        stage.length > 0,
        businessModel.trim().length > 0,
        country.trim().length > 0,
        stateRegion.trim().length > 0,
        city.trim().length > 0,
        oneLineDescription.trim().length > 0,
        companyDescription.trim().length > 0,
        productDescription.trim().length > 0,
        pitchDeckPath.trim().length > 0,
        isPositiveNumberText(annualRevenue),
        isPositiveNumberText(preMoneyValuation),
      ];
      return requiredChecks.every(Boolean);
    }
    if (step === 4) return pitchSummary.trim().length > 0;
    if (step === 5) return true;
    if (step === 6) return selectedModules.length > 0;
    if (step === 7) return reportSections.filter((s) => s.active).length > 0;
    return true;
  };

  const goToNext = () => {
    if (!canAdvanceFrom(currentStep)) {
      const missingSsdStep3Fields = [
        companyName.trim().length === 0 ? 'Company Name' : null,
        sector.length === 0 ? 'Industry Vertical' : null,
        stage.length === 0 ? 'Development Stage' : null,
        businessModel.trim().length === 0 ? 'Business Model' : null,
        country.trim().length === 0 ? 'Country' : null,
        stateRegion.trim().length === 0 ? 'State' : null,
        city.trim().length === 0 ? 'City' : null,
        oneLineDescription.trim().length === 0 ? 'One-Line Description' : null,
        companyDescription.trim().length === 0 ? 'Company Description' : null,
        productDescription.trim().length === 0 ? 'Product Description' : null,
        pitchDeckPath.trim().length === 0 ? 'Pitch Deck Path' : null,
        !isPositiveNumberText(annualRevenue) ? 'Annual Revenue' : null,
        !isPositiveNumberText(preMoneyValuation) ? 'Pre-Money Valuation' : null,
      ].filter(Boolean) as string[];

      toast({
        variant: 'destructive',
        title: 'Required fields missing',
        description:
          currentStep === 1
            ? 'Please upload the pitch deck first.'
            :
          currentStep === 3
            ? `Missing SSD fields: ${missingSsdStep3Fields.slice(0, 5).join(', ')}${missingSsdStep3Fields.length > 5 ? '...' : ''}`
            : currentStep === 4
            ? 'Please enter a pitch summary.'
            : 'Please select at least one module.',
      });
      return;
    }
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((s) => getNextStepId(s));
  };

  const goToPrev = () => setCurrentStep((s) => getPrevStepId(s));

  const moduleToSections: Record<string, string[]> = {
    tca: ['tca-scorecard', 'tca-summary-card', 'tca-ai-table', 'tca-interpretation-summary', 'weighted-score-breakdown'],
    risk: ['risk-flag-summary-table', 'flag-analysis-narrative'],
    gap: ['gap-analysis'],
    macro: ['macro-trend-alignment'],
    benchmark: ['benchmark-comparison', 'competitive-landscape'],
    growth: ['growth-classifier'],
    team: ['team-assessment'],
    analyst: ['analyst-comments', 'analyst-ai-deviation'],
    founderFit: ['team-assessment'],
    strategic: ['competitive-landscape'],
    marketing: ['competitive-landscape'],
    social: ['macro-trend-alignment'],
    environmental: ['macro-trend-alignment'],
    strategicFit: ['final-recommendation'],
    funder: ['final-recommendation'],
  };

  const toggleModule = (moduleId: string, required: boolean) => {
    if (required) return;
    const isCurrentlySelected = selectedModules.includes(moduleId);
    setSelectedModules((prev) =>
      isCurrentlySelected ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  // For admin/analyst users, keep module-driven sections synced with selected modules.
  useEffect(() => {
    if (!isAdminOrAnalyst) return;

    const managedSectionIds = new Set(Object.values(moduleToSections).flat());
    const activeManagedIds = new Set(
      selectedModules.flatMap((moduleId) => moduleToSections[moduleId] ?? [])
    );

    setReportSections((prev) =>
      prev.map((section) => {
        if (!managedSectionIds.has(section.id)) return section;
        return { ...section, active: activeManagedIds.has(section.id) };
      })
    );
  }, [isAdminOrAnalyst, selectedModules]);

  const toggleSection = (sectionId: string) => {
    if (!isAdminOrAnalyst) return;

    const managedSectionIds = new Set(Object.values(moduleToSections).flat());
    const activeManagedIds = new Set(
      selectedModules.flatMap((moduleId) => moduleToSections[moduleId] ?? [])
    );

    if (managedSectionIds.has(sectionId) && !activeManagedIds.has(sectionId)) {
      return;
    }

    setReportSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, active: !s.active } : s))
    );
  };

  const toggleAllSections = (active: boolean) => {
    if (!isAdminOrAnalyst) return;

    const managedSectionIds = new Set(Object.values(moduleToSections).flat());
    const activeManagedIds = new Set(
      selectedModules.flatMap((moduleId) => moduleToSections[moduleId] ?? [])
    );

    setReportSections((prev) =>
      prev.map((s) => {
        if (!active) return { ...s, active: false };
        if (managedSectionIds.has(s.id) && !activeManagedIds.has(s.id)) {
          return { ...s, active: false };
        }
        return { ...s, active: true };
      })
    );
  };

  const fetchExternalData = async () => {
    if (!isAdminOrAnalyst) {
      toast({
        variant: 'destructive',
        title: 'Restricted step',
        description: 'External data fetching is only available for admin/analyst users.',
      });
      return;
    }
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
        body: JSON.stringify({ text: autoFillText, companyHint: companyName.trim() || undefined }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data as Record<string, unknown>;
        const company = cleanCompanyName(pickFirstText(d, ['company_name', 'companyName', 'startup_name', 'startupName', 'name', 'legalName', 'legal_name'])) || inferCompanyNameFromText(autoFillText);
        const websiteValue = cleanShortText(pickFirstText(d, ['website', 'company_website', 'companyWebsite', 'url', 'domain']));
        const sectorValue = normalizeSectorValue(pickFirstText(d, ['sector', 'industry', 'industry_vertical', 'industryVertical', 'vertical']));
        const stageValue = normalizeStageValue(pickFirstText(d, ['stage', 'company_stage', 'companyStage', 'funding_stage', 'fundingStage', 'development_stage', 'developmentStage']));
        const businessModelValue = cleanShortText(pickFirstText(d, ['business_model', 'businessModel', 'model']));
        const countryValue = cleanShortText(pickFirstText(d, ['country']));
        const stateValue = cleanShortText(pickFirstText(d, ['state', 'province', 'region']));
        const cityValue = cleanShortText(pickFirstText(d, ['city']));
        const oneLineValue = cleanOneLineDescription(pickFirstText(d, ['one_line_description', 'oneLineDescription', 'tagline']));
        const companyDescriptionValue = cleanLongText(pickFirstText(d, ['company_description', 'companyDescription']));
        const annualRevenueValue = cleanShortText(pickFirstText(d, ['annualRevenue', 'annual_revenue', 'yearlyRevenue', 'yearly_revenue'])) || extractAnnualRevenueText(autoFillText);
        const preMoneyValue = cleanShortText(pickFirstText(d, ['preMoneyValuation', 'pre_money_valuation']));
        const pitchDeckPathValue = cleanShortText(pickFirstText(d, ['pitchDeckPath', 'pitch_deck_path']));
        const legalNameValue = cleanShortText(pickFirstText(d, ['legalName', 'legal_name']));
        const employeesValue = cleanShortText(pickFirstText(d, ['numberOfEmployees', 'number_of_employees', 'team_size'])) || extractEmployeesText(autoFillText);
        const locationValue = buildLocationText(d);
        const locationParts = splitLocationParts(locationValue);
        const summaryValue = cleanLongText(pickFirstText(d, ['pitch_summary', 'pitchSummary', 'executive_summary', 'executiveSummary', 'company_description', 'companyDescription', 'one_line_description', 'oneLineDescription', 'problemSolution']));
        const metricsValue = cleanLongText(buildMetricsText(d));
        const teamValue = cleanLongText(pickFirstText(d, ['team_info', 'teamInfo', 'team_background', 'teamBackground', 'founder_info', 'founderInfo', 'companyBackgroundTeam']));
        const productValue = cleanLongText(pickFirstText(d, ['product_description', 'productDescription', 'product_overview', 'productOverview', 'solution_description', 'solutionDescription'])) || deriveProductDescription(oneLineValue, companyDescriptionValue);

        if (company) setCompanyName(company);
        if (websiteValue) setWebsite(websiteValue);
        if (sectorValue) setSector(sectorValue);
        if (stageValue) setStage(stageValue);
        if (businessModelValue) setBusinessModel(businessModelValue);
        if (countryValue || locationParts.country) setCountry(countryValue || locationParts.country);
        if (stateValue || locationParts.state) setStateRegion(stateValue || locationParts.state);
        if (cityValue || locationParts.city) setCity(cityValue || locationParts.city);
        if (oneLineValue) setOneLineDescription(oneLineValue);
        if (companyDescriptionValue) setCompanyDescription(companyDescriptionValue);
        if (annualRevenueValue) setAnnualRevenue(annualRevenueValue);
        if (preMoneyValue) setPreMoneyValuation(preMoneyValue);
        if (pitchDeckPathValue) setPitchDeckPath(pitchDeckPathValue);
        if (legalNameValue) setLegalName(legalNameValue);
        if (employeesValue) setNumberOfEmployees(employeesValue);
        if (locationValue) setLocation(locationValue);
        if (summaryValue) setPitchSummary(summaryValue);
        if (metricsValue) setKeyMetrics(metricsValue);
        if (teamValue) setTeamInfo(teamValue);
        if (productValue) setProductDescription(productValue);
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

  const handleExtractFiles = async (filesToExtract?: File[]) => {
    const files = filesToExtract ?? uploadedFiles;
    const hasLinks = isAdminOrAnalyst && links.trim().length > 0;
    const hasContext = additionalContext.trim().length > 0;
    if (files.length === 0 && !hasLinks && !hasContext) return;
    setIsExtracting(true);
    setExtractionError(null);
    setExtractionProgress(0);
    setExtractionStatus('Preparing to extract text...');
    let combined = '';
    let extractionIssues = 0;

    // Prepend additional context provided by user
    if (hasContext) {
      combined += `Additional Context:\n${additionalContext.trim()}\n\n`;
    }

    // Extract text from each uploaded file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setExtractionStatus(`Extracting: ${file.name} (${i + 1}/${files.length})`);
      setExtractionProgress(Math.round((i / Math.max(files.length, 1)) * 55));
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const result = await res.json();
          const txt = result.text_content ?? result.text ?? result.extracted_text ?? '';
          if (txt) {
            combined += txt + '\n\n';
          } else {
            extractionIssues += 1;
          }
        } else {
          extractionIssues += 1;
        }
      } catch {
        extractionIssues += 1;
      }
    }

    // Extract text from any provided links
    if (hasLinks) {
      setExtractionStatus('Fetching linked resources...');
      setExtractionProgress(60);
      const linkList = links.split(/[\n,]+/).map((l) => l.trim()).filter((l) => l.startsWith('http'));
      for (const link of linkList) {
        try {
          const res = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_url: link, filename: 'linked-resource' }),
          });
          if (res.ok) {
            const result = await res.json();
            const txt = result.text_content ?? result.text ?? '';
            if (txt) {
              combined += `From ${link}:\n${txt}\n\n`;
            } else {
              extractionIssues += 1;
            }
          } else {
            extractionIssues += 1;
          }
        } catch {
          extractionIssues += 1;
        }
      }
    }

    setExtractionProgress(75);
    setExtractionStatus('Auto-filling fields from extracted text...');
    const trimmed = cleanLongText(combined);
    setExtractedText(trimmed);

    if (trimmed) {
      setAutoFillText(trimmed);
      // Auto-trigger AI autofill for high-quality structured field extraction
      try {
        const autofillRes = await fetch('/api/ai-autofill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, companyHint: companyName.trim() || undefined }),
        });
        if (autofillRes.ok) {
          const autofillResult = await autofillRes.json();
          if (autofillResult.success && autofillResult.data) {
            const d = autofillResult.data as Record<string, unknown>;
            const company = cleanCompanyName(pickFirstText(d, ['company_name', 'companyName', 'startup_name', 'startupName', 'name', 'legalName', 'legal_name'])) || inferCompanyNameFromText(trimmed);
            const websiteValue = cleanShortText(pickFirstText(d, ['website', 'company_website', 'companyWebsite', 'url', 'domain']));
            const sectorValue = normalizeSectorValue(pickFirstText(d, ['sector', 'industry', 'industry_vertical', 'industryVertical', 'vertical']));
            const stageValue = normalizeStageValue(pickFirstText(d, ['stage', 'company_stage', 'companyStage', 'funding_stage', 'fundingStage', 'development_stage', 'developmentStage']));
            const businessModelValue = cleanShortText(pickFirstText(d, ['business_model', 'businessModel', 'model']));
            const countryValue = cleanShortText(pickFirstText(d, ['country']));
            const stateValue = cleanShortText(pickFirstText(d, ['state', 'province', 'region']));
            const cityValue = cleanShortText(pickFirstText(d, ['city']));
            const oneLineValue = cleanOneLineDescription(pickFirstText(d, ['one_line_description', 'oneLineDescription', 'tagline']));
            const companyDescriptionValue = cleanLongText(pickFirstText(d, ['company_description', 'companyDescription']));
            const annualRevenueValue = cleanShortText(pickFirstText(d, ['annualRevenue', 'annual_revenue', 'yearlyRevenue', 'yearly_revenue'])) || extractAnnualRevenueText(trimmed);
            const preMoneyValue = cleanShortText(pickFirstText(d, ['preMoneyValuation', 'pre_money_valuation']));
            const pitchDeckPathValue = cleanShortText(pickFirstText(d, ['pitchDeckPath', 'pitch_deck_path']));
            const legalNameValue = cleanShortText(pickFirstText(d, ['legalName', 'legal_name']));
            const employeesValue = cleanShortText(pickFirstText(d, ['numberOfEmployees', 'number_of_employees', 'team_size'])) || extractEmployeesText(trimmed);
            const locationValue = buildLocationText(d);
            const locationParts = splitLocationParts(locationValue);
            const summaryValue = cleanLongText(pickFirstText(d, ['pitch_summary', 'pitchSummary', 'executive_summary', 'executiveSummary', 'company_description', 'companyDescription', 'one_line_description', 'oneLineDescription', 'problemSolution']));
            const metricsValue = cleanLongText(buildMetricsText(d));
            const teamValue = cleanLongText(pickFirstText(d, ['team_info', 'teamInfo', 'team_background', 'teamBackground', 'founder_info', 'founderInfo', 'companyBackgroundTeam']));
            const productValue = cleanLongText(pickFirstText(d, ['product_description', 'productDescription', 'product_overview', 'productOverview', 'solution_description', 'solutionDescription'])) || deriveProductDescription(oneLineValue, companyDescriptionValue);

            if (company && !companyName.trim()) setCompanyName(company);
            if (websiteValue && !website.trim()) setWebsite(websiteValue);
            if (sectorValue && !sector) setSector(sectorValue);
            if (stageValue && !stage) setStage(stageValue);
            if (businessModelValue && !businessModel.trim()) setBusinessModel(businessModelValue);
            if ((countryValue || locationParts.country) && !country.trim()) setCountry(countryValue || locationParts.country);
            if ((stateValue || locationParts.state) && !stateRegion.trim()) setStateRegion(stateValue || locationParts.state);
            if ((cityValue || locationParts.city) && !city.trim()) setCity(cityValue || locationParts.city);
            if (oneLineValue && !oneLineDescription.trim()) setOneLineDescription(oneLineValue);
            if (companyDescriptionValue && !companyDescription.trim()) setCompanyDescription(companyDescriptionValue);
            if (annualRevenueValue && !annualRevenue.trim()) setAnnualRevenue(annualRevenueValue);
            if (preMoneyValue && !preMoneyValuation.trim()) setPreMoneyValuation(preMoneyValue);
            if (pitchDeckPathValue && !pitchDeckPath.trim()) setPitchDeckPath(pitchDeckPathValue);
            if (legalNameValue && !legalName.trim()) setLegalName(legalNameValue);
            if (employeesValue && !numberOfEmployees.trim()) setNumberOfEmployees(employeesValue);
            if (locationValue && !location.trim()) setLocation(locationValue);
            if (summaryValue) setPitchSummary(summaryValue);
            if (metricsValue && !keyMetrics.trim()) setKeyMetrics(metricsValue);
            if (teamValue && !teamInfo.trim()) setTeamInfo(teamValue);
            if (productValue && !productDescription.trim()) setProductDescription(productValue);
          }
        }
      } catch { /* ignore autofill errors — fields still pre-filled from raw text */ }
      if (!pitchSummary.trim()) setPitchSummary(trimmed.slice(0, 2000));
      toast({ title: 'Extraction complete', description: `Text extracted from ${files.length} file(s). Fields pre-filled.` });
    } else {
      setExtractionError('Could not extract readable text from the uploaded file(s). You can continue manually or try another file format (PDF usually works best).');
      if (!pitchSummary.trim() && hasContext) {
        setPitchSummary(additionalContext.trim().slice(0, 2000));
      }
      toast({
        variant: 'destructive',
        title: 'Extraction failed',
        description: 'No text was extracted. Continue manually or try Re-run Extraction.',
      });
    }
    if (extractionIssues > 0 && trimmed) {
      toast({
        title: 'Partial extraction',
        description: `Some sources could not be parsed (${extractionIssues}), but extracted text is available.`,
      });
    }
    setExtractionProgress(100);
    setExtractionStatus('Extraction complete!');
    setIsExtracting(false);
  };

  // Extract metrics from supporting documents and build metrics table
  const extractSupportingDocsMetrics = async (filesToExtract: File[]) => {
    if (filesToExtract.length === 0) {
      setSupportingDocsMetrics([]);
      setSupportingDocsExtractionStatus('');
      return;
    }

    setSupportingDocsExtractionStatus('Extracting from supporting documents...');
    setSupportingDocsExtractionError(null);
    const metrics: ExtractedMetric[] = [];

    try {
      for (let i = 0; i < filesToExtract.length; i++) {
        const file = filesToExtract[i];
        setSupportingDocsExtractionStatus(`Processing: ${file.name} (${i + 1}/${filesToExtract.length})`);

        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/extract', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const result = await res.json();
            const txt = result.text_content ?? result.text ?? result.extracted_text ?? '';

            if (txt) {
              // Extract key metrics from the text
              const patterns = [
                { field: 'Annual Revenue', regex: /(?:annual\s+revenue|arr)[:\s]*\$?([\d,.]+[km]?|[\d,]+)/i },
                { field: 'Monthly Recurring Revenue', regex: /(?:mrr|monthly\s+recurring\s+revenue)[:\s]*\$?([\d,.]+[km]?)/i },
                { field: 'Burn Rate', regex: /(?:burn\s+rate|monthly\s+burn)[:\s]*\$?([\d,.]+[km]?)/i },
                { field: 'Runway', regex: /(?:runway|cash\s+runway)[:\s]*(\d+\s*(?:months?|years?))/i },
                { field: 'Customers', regex: /(?:customers?|clients?)[:\s]*(\d+[km]?)/i },
                { field: 'Team Size', regex: /(?:team\s+size|employees?|headcount)[:\s]*(\d+)/i },
                { field: 'Market Size', regex: /(?:tam|market\s+size)[:\s]*\$?([\d,.]+[bm]?)/i },
                { field: 'CAC', regex: /(?:cac|customer\s+acquisition\s+cost)[:\s]*\$?([\d,.]+)/i },
                { field: 'LTV', regex: /(?:ltv|lifetime\s+value)[:\s]*\$?([\d,.]+)/i },
                { field: 'Churn Rate', regex: /(?:churn\s+rate)[:\s]*(\d+\.?\d*%?)/i },
              ];

              patterns.forEach(({ field, regex }) => {
                const match = txt.match(regex);
                if (match && match[1]) {
                  const value = match[1].trim();
                  metrics.push({
                    field,
                    value,
                    source: file.name,
                    verified: true,
                  });
                }
              });
            }
          }
        } catch {
          // Continue processing other files
        }
      }

      if (metrics.length > 0) {
        setSupportingDocsMetrics(metrics);
        setSupportingDocsExtractionStatus(`✓ Extracted ${metrics.length} metrics from supporting documents`);
        toast({
          title: 'Metrics extracted',
          description: `Found ${metrics.length} key metrics in supporting documents`,
        });
      } else {
        setSupportingDocsExtractionStatus('No structured metrics found. You can manually add them below.');
        setSupportingDocsExtractionError(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setSupportingDocsExtractionError(`Failed to extract: ${errorMsg}`);
      setSupportingDocsExtractionStatus('');
      toast({
        variant: 'destructive',
        title: 'Extraction error',
        description: errorMsg,
      });
    }
  };

  // Auto-trigger extraction when new supporting files are added
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (supportingFiles.length === 0 || isExtracting) return;
    const allFiles = pitchDeckFile ? [pitchDeckFile, ...supportingFiles] : [...supportingFiles];
    handleExtractFiles(allFiles);
    // Also extract metrics specifically from supporting files
    extractSupportingDocsMetrics(supportingFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportingFiles]);

  const handlePitchDeckSelect = async (file: File) => {
    setPitchDeckFile(file);
    setPitchDeckPath(file.name);
    setUploadedFiles([file]);
    setCurrentStep(2);
    await handleExtractFiles([file]);
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
        strictRealDataOnly: true,
        disallowSampleFallback: true,
        activeModules: TRIAGE_MODULES.filter(m => selectedModules.includes(m.id)).map(m => ({ module_id: m.id, weight: m.weight, is_enabled: true })),
        ...(isAdminOrAnalyst && Object.keys(simulatedScores).length > 0 && { scoreOverrides: simulatedScores }),
      });
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStatus('Triage complete!');

      localStorage.setItem('analysisResult', JSON.stringify(analysisData));
      sessionStorage.setItem('analysisResult', JSON.stringify(analysisData));
      localStorage.setItem('analysisFramework', framework);

      const scoreData = (analysisData as { tcaData?: { overallScore?: number; compositeScore?: number } })?.tcaData;
      const score = scoreData?.compositeScore ?? scoreData?.overallScore ?? 0;
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
      setCompletedSteps((prev) => [...new Set([...prev, 9])]);
      setCurrentStep(isAdminOrAnalyst ? 10 : 11);
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
                <Upload className="size-5" />
                Upload Pitch Deck
              </CardTitle>
              <CardDescription>
                First upload: pitch deck only (single file). This starts extraction before company details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pitch Deck */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Pitch Deck <span className="text-destructive">*</span>
                  <span className="text-xs font-normal text-muted-foreground ml-1">(PDF, PPT, PPTX, DOC, DOCX — triggers auto-extraction)</span>
                </Label>
                {pitchDeckFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 p-3">
                    <FileText className="size-4 text-primary shrink-0" />
                    <span className="text-sm flex-1 truncate">{pitchDeckFile.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{(pitchDeckFile.size / 1024).toFixed(0)} KB</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0"
                      onClick={() => { setPitchDeckFile(null); setUploadedFiles([]); setExtractedText(''); }}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('pitch-deck-input')?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = Array.from(e.dataTransfer.files).find(f =>
                        /\.(pdf|ppt|pptx|doc|docx)$/i.test(f.name)
                      );
                      if (file) handlePitchDeckSelect(file);
                    }}
                  >
                    <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Drag & drop or click to select pitch deck</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PPT, PPTX, DOC, DOCX</p>
                    <input
                      id="pitch-deck-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePitchDeckSelect(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                )}
              </div>

              {!pitchDeckFile ? (
                <p className="text-xs text-muted-foreground">
                  Upload one pitch deck file to continue to extraction.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pitch deck selected. Continue to step 2 to review extracted data.
                </p>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="size-5" />
                Data Extraction
              </CardTitle>
              <CardDescription>
                Extract text from the pitch deck first and pre-fill key data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {pitchDeckFile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 p-3">
                    <FileText className="size-4 text-primary shrink-0" />
                    <span className="text-sm flex-1 truncate">{pitchDeckFile.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{(pitchDeckFile.size / 1024).toFixed(0)} KB</Badge>
                  </div>
                  {isExtracting && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{extractionStatus}</p>
                      </div>
                      <Progress value={extractionProgress} className="h-2" />
                    </div>
                  )}
                  {extractionError && !isExtracting && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-3 flex items-start gap-2">
                        <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">Extraction did not return text</p>
                          <p className="text-xs text-amber-800">{extractionError}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={goToNext}>
                          Continue Manually
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExtractFiles([pitchDeckFile])}>
                          <RefreshCw className="mr-2 size-4" />
                          Re-run Extraction
                        </Button>
                      </div>
                    </div>
                  )}
                  {extractedText && !isExtracting && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-green-300 bg-green-50/40 p-3 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                        <p className="text-sm text-green-800">Extraction complete. Fields have been pre-filled from document content.</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Extracted text preview</Label>
                        <Textarea
                          value={extractedText.slice(0, 500) + (extractedText.length > 500 ? '...' : '')}
                          readOnly
                          rows={4}
                          className="text-xs font-mono bg-muted/30"
                        />
                      </div>
                    </div>
                  )}
                  {!isExtracting && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExtractFiles([pitchDeckFile])}>
                        <RefreshCw className="mr-2 size-4" />
                        Re-run Extraction
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPitchDeckFile(null);
                          setUploadedFiles([]);
                          setExtractedText('');
                          setExtractionProgress(0);
                          setExtractionStatus('');
                          setCurrentStep(1);
                        }}
                      >
                        Choose Different File
                      </Button>
                    </div>
                  )}
                </div>
              ) : uploadedFiles.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-2">
                  <FileSearch className="size-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No files uploaded. You can proceed manually or go back to upload files.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Files to extract ({uploadedFiles.length})</Label>
                    <div className="space-y-1">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <FileText className="size-4 text-primary shrink-0" />
                          <span className="truncate flex-1">{file.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {(file.size / 1024).toFixed(0)} KB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => handleExtractFiles()} disabled={isExtracting} className="gap-2">
                    {isExtracting ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}
                    {isExtracting ? 'Extracting...' : 'Extract Text from Files'}
                  </Button>
                  {isExtracting && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{extractionStatus}</p>
                      <Progress value={extractionProgress} className="h-2" />
                    </div>
                  )}
                  {extractedText && !isExtracting && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-green-300 bg-green-50/40 p-3 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                        <p className="text-sm text-green-800">Extraction complete. Fields have been pre-filled from document content.</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Extracted text preview</Label>
                        <Textarea
                          value={extractedText.slice(0, 500) + (extractedText.length > 500 ? '...' : '')}
                          readOnly
                          rows={4}
                          className="text-xs font-mono bg-muted/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        {
        const ssdMandatoryItems = [
          { label: 'Industry Vertical', ok: !!sector },
          { label: 'Development Stage', ok: !!stage },
          { label: 'Business Model', ok: businessModel.trim().length > 0 },
          { label: 'Country', ok: country.trim().length > 0 },
          { label: 'State', ok: stateRegion.trim().length > 0 },
          { label: 'City', ok: city.trim().length > 0 },
          { label: 'One-Line Description', ok: oneLineDescription.trim().length > 0 },
          { label: 'Company Description', ok: companyDescription.trim().length > 0 },
          { label: 'Product Description', ok: productDescription.trim().length > 0 },
          { label: 'Pitch Deck Path', ok: pitchDeckPath.trim().length > 0 },
          { label: 'Annual Revenue', ok: isPositiveNumberText(annualRevenue) },
          { label: 'Pre-Money Valuation', ok: isPositiveNumberText(preMoneyValuation) },
        ];
        const ssdMissingItems = ssdMandatoryItems.filter((item) => !item.ok).map((item) => item.label);

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                Company Information (Startup Steroid)
              </CardTitle>
              <CardDescription>
                Startup Steroid aligned company details. Then upload additional company documents as second upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Mandatory SSD Fields Completeness</Label>
                  <Badge variant={ssdMissingItems.length === 0 ? 'default' : 'secondary'}>
                    {ssdMandatoryItems.length - ssdMissingItems.length}/{ssdMandatoryItems.length} complete
                  </Badge>
                </div>
                {ssdMissingItems.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Missing: {ssdMissingItems.join(', ')}
                  </p>
                ) : (
                  <p className="text-xs text-green-700">All mandatory SSD fields are complete.</p>
                )}
              </div>

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
                    Industry Vertical <span className="text-destructive">*</span>
                  </Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger id="sector">
                      <SelectValue placeholder="Select industry vertical" />
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
                    Development Stage <span className="text-destructive">*</span>
                  </Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger id="stage">
                      <SelectValue placeholder="Select development stage" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input id="legalName" placeholder="Legal name of company" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                  <Input id="numberOfEmployees" placeholder="e.g., 12" value={numberOfEmployees} onChange={(e) => setNumberOfEmployees(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessModel">Business Model <span className="text-destructive">*</span></Label>
                  <Input id="businessModel" placeholder="e.g., B2B SaaS" value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pitchDeckPath">Pitch Deck Path <span className="text-destructive">*</span></Label>
                  <Input id="pitchDeckPath" placeholder="/documents/pitch_deck.pdf" value={pitchDeckPath} onChange={(e) => setPitchDeckPath(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                  <Input id="country" placeholder="United States" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateRegion">State <span className="text-destructive">*</span></Label>
                  <Input id="stateRegion" placeholder="California" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                  <Input id="city" placeholder="San Francisco" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oneLineDescription">One-Line Description <span className="text-destructive">*</span></Label>
                <Input
                  id="oneLineDescription"
                  placeholder="AI-powered customer service automation platform"
                  value={oneLineDescription}
                  onChange={(e) => setOneLineDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue">Annual Revenue <span className="text-destructive">*</span></Label>
                  <Input id="annualRevenue" placeholder="250000" value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preMoneyValuation">Pre-Money Valuation <span className="text-destructive">*</span></Label>
                  <Input id="preMoneyValuation" placeholder="5000000" value={preMoneyValuation} onChange={(e) => setPreMoneyValuation(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="companyDescription"
                  rows={4}
                  placeholder="Detailed description of the company"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescriptionStep3">Product Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="productDescriptionStep3"
                  rows={4}
                  placeholder="Describe the core product and value"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </div>

              <Separator />

              <Tabs defaultValue="documents" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="online-search">Online Search</TabsTrigger>
                  <TabsTrigger value="extra-info">Extra Information</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-2 pt-3">
                  <Label className="text-sm font-semibold">
                    Upload Company Documents (Second Upload)
                    <span className="text-xs font-normal text-muted-foreground ml-1">(optional — financials, data sheets, market docs)</span>
                  </Label>
                  <div
                    className="border border-dashed border-border rounded-lg p-4 text-center hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('supporting-files-input')?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) setSupportingFiles(prev => [...prev, ...files]);
                    }}
                  >
                    <p className="text-xs text-muted-foreground">Click or drag to add supporting documents</p>
                    <input
                      id="supporting-files-input"
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSupportingFiles(prev => [...prev, ...files]);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  {supportingFiles.length > 0 && (
                    <div className="space-y-1">
                      {supportingFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <FileText className="size-4 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0"
                            onClick={() => setSupportingFiles(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Extraction Status & Metrics Table */}
                  {(supportingDocsExtractionStatus || supportingDocsExtractionError || supportingDocsMetrics.length > 0) && (
                    <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                      {/* Status Indicator */}
                      {supportingDocsExtractionStatus && (
                        <div className="flex items-center gap-2">
                          <Check className="size-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">{supportingDocsExtractionStatus}</span>
                        </div>
                      )}
                      
                      {supportingDocsExtractionError && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="size-4" />
                          <span className="text-sm">{supportingDocsExtractionError}</span>
                        </div>
                      )}
                      
                      {/* Metrics Table */}
                      {supportingDocsMetrics.length > 0 && (
                        <div className="mt-3">
                          <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Extracted Metrics</Label>
                          <div className="border rounded-md overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Field</th>
                                    <th className="px-3 py-2 text-left font-semibold">Value</th>
                                    <th className="px-3 py-2 text-left font-semibold">Source</th>
                                    <th className="px-3 py-2 text-center font-semibold">Verified</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {supportingDocsMetrics.map((metric, idx) => (
                                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/20">
                                      <td className="px-3 py-2 text-muted-foreground">{metric.field}</td>
                                      <td className="px-3 py-2 font-medium">{metric.value}</td>
                                      <td className="px-3 py-2 text-xs text-muted-foreground truncate">{metric.source}</td>
                                      <td className="px-3 py-2 text-center">
                                        {metric.verified ? (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            ✓
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                            ⚠
                                          </Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {supportingDocsMetrics.length} metrics extracted and verified from {new Set(supportingDocsMetrics.map(m => m.source)).size} document(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="online-search" className="space-y-2 pt-3">
                  <Label htmlFor="links-input" className="text-sm font-semibold">
                    Links for Scan & Online Search
                    <span className="text-xs font-normal text-muted-foreground ml-1">(website, LinkedIn, Crunchbase, news URLs)</span>
                  </Label>
                  <Input
                    id="links-input"
                    placeholder="https://example.com, https://linkedin.com/company/..."
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">These links are scanned during extraction to enrich company information.</p>
                </TabsContent>

                <TabsContent value="extra-info" className="space-y-2 pt-3">
                  <Label htmlFor="additional-context" className="text-sm font-semibold">
                    Additional Context
                    <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
                  </Label>
                  <Textarea
                    id="additional-context"
                    placeholder="Add notes, focus areas, known concerns, or deal thesis for the analysis..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={4}
                  />
                </TabsContent>
              </Tabs>

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
        }

      case 4:
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

      case 5:
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

      case 6:
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

      case 7:
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
                    {(() => {
                      const managedSectionIds = new Set(Object.values(moduleToSections).flat());
                      const activeManagedIds = new Set(
                        selectedModules.flatMap((moduleId) => moduleToSections[moduleId] ?? [])
                      );
                      const lockedByModule = managedSectionIds.has(section.id) && !activeManagedIds.has(section.id);
                      return (
                    <Switch
                      checked={section.active}
                      disabled={lockedByModule}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                      );
                    })()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 8: {
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

      case 9:
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

      case 10:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-5" />
                What-If Scenario Analysis
              </CardTitle>
              <CardDescription>
                Adjust module scores to explore alternative investment scenarios before finalizing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Actual Score</p>
                  <p className="font-semibold text-2xl">{compositeScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {compositeScore >= 7 ? 'Proceed' : compositeScore >= 5.5 ? 'Conditional' : 'Pass'}
                  </p>
                </div>
                <div className="rounded-lg border bg-primary/5 border-primary/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Simulated Score</p>
                  <p className="font-semibold text-2xl text-primary">
                    {(() => {
                      const activeModules = TRIAGE_MODULES.filter(m => selectedModules.includes(m.id));
                      const totalWeight = activeModules.reduce((sum, m) => sum + m.weight, 0);
                      const simScore = totalWeight > 0
                        ? activeModules.reduce((sum, m) => sum + (simulatedScores[m.id] ?? 50) * m.weight, 0) / totalWeight / 10
                        : 0;
                      return simScore.toFixed(1);
                    })()}
                  </p>
                  <p className="text-sm text-muted-foreground">Based on adjusted sliders</p>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Adjust Module Scores</Label>
                {TRIAGE_MODULES.filter(m => selectedModules.includes(m.id)).map((mod) => {
                  const score = simulatedScores[mod.id] ?? 50;
                  return (
                    <div key={mod.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{mod.name}</span>
                        <span className="text-sm font-semibold">{score}</span>
                      </div>
                      <input
                        type="range" min={0} max={100} value={score}
                        title={`Score for ${mod.name}: ${score}`}
                        onChange={(e) => setSimulatedScores(prev => ({ ...prev, [mod.id]: Number(e.target.value) }))}
                        className="w-full accent-primary cursor-pointer h-2"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSimulatedScores(Object.fromEntries(TRIAGE_MODULES.map(m => [m.id, 50])))}>
                    <RefreshCw className="size-4 mr-2" />Reset All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/analysis/what-if', '_blank')}>
                    <LineChart className="size-4 mr-2" />Full What-If Tool
                  </Button>
                </div>
                <Button onClick={goToNext} className="gap-2 px-8" size="lg">
                  Continue to Preview
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 11:
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
              {(() => {
                const tcaCategories = (analysisResult as { tcaData?: { categories?: Array<{ name?: string; score?: number; maxScore?: number; category?: string; rawScore?: number }> } } | null)?.tcaData?.categories;
                const activeModules = TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id));
                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">TCA Category Breakdown</p>
                    <div className="space-y-1">
                      {activeModules.map((m) => {
                        const backendCat = tcaCategories?.find((c) => {
                          const label = (c.name ?? c.category ?? '').toLowerCase();
                          return label === m.name.toLowerCase();
                        });
                        const score = backendCat?.score ?? backendCat?.rawScore ?? (simulatedScores[m.id] ?? 50) / 10;
                        const maxScore = backendCat?.maxScore ?? 10;
                        return (
                          <div key={m.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                            <span className="text-muted-foreground">{m.name}</span>
                            <span className="font-semibold">{score.toFixed(1)} / {maxScore}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {(() => {
                const keyFindings = (analysisResult as { keyFindings?: string[] } | null)?.keyFindings;
                if (!keyFindings) return null;
                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Key Findings</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {keyFindings.slice(0, 5).map((finding, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{finding}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
              <div className="flex justify-end">
                <Button onClick={goToNext}>
                  Proceed to Storage
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 12:
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
      case 13:
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
                {isAdminOrAnalyst && (
                  <Button variant="secondary" onClick={() => { router.push('/analysis/what-if'); }}>
                    <LineChart className="mr-2 size-4" />
                    Run What-If Simulation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 14: {
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

      case 15:
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
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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
          {isAdminOrAnalyst && (
            <p className="text-xs text-muted-foreground">
              Privileged flow: includes Simulation and full review steps.
            </p>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          <Badge variant="secondary" className="text-sm">
            Step {currentStepPosition} of {visibleSteps.length}
          </Badge>
          <Button variant="outline" size="sm" onClick={resetWizard}>
            <RefreshCw className="mr-2 size-4" />
            Fresh Start
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/reports">
              Cancel
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tracker ID</p>
              <p className="font-semibold">{trackingId}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
              <p className="font-semibold">{companyName.trim() || 'Not set yet'}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Report Owner</p>
              <p className="font-semibold">{reportOwner}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Step</p>
              <p className="font-semibold">{currentStepMeta?.name || `Step ${currentStep}`}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 md:grid-cols-12 gap-2">
        {visibleSteps.map((step) => {
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

      {!(currentStep === 9 && isGenerating) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToPrev} disabled={currentStep === firstStepId}>
              <ArrowLeft className="mr-2 size-4" />
              Previous
            </Button>
            <Button variant="secondary" onClick={resetWizard}>
              <RefreshCw className="mr-2 size-4" />
              Fresh Start
            </Button>
          </div>
          {currentStep < lastStepId && currentStep !== 8 && currentStep !== 9 && currentStep !== 10 && (
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
