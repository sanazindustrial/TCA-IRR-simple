'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Globe,
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
  Upload,
  X,
  Plus,
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
import { cn } from '@/lib/utils';
import { runAnalysis } from '@/app/analysis/actions';
import reportsApi from '@/lib/reports-api';

const API_BASE = 'https://tcairrapiccontainer.azurewebsites.net';

// ── Heartbeat for AI/extraction agents ────────────────────────────────────────
let _agentHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
function startAgentHeartbeat() {
  if (_agentHeartbeatTimer) return;
  _agentHeartbeatTimer = setInterval(() => {
    // Ping extraction and AI endpoints to prevent cold starts
    const endpoints = [
      `${API_BASE}/api/v1/files/extract-text`,
      `${API_BASE}/api/v1/ai/extract`,
    ];
    endpoints.forEach(ep => {
      fetch(ep, { method: 'HEAD' }).catch(() => {/* silent */});
    });
  }, 30_000);
}
function stopAgentHeartbeat() {
  if (_agentHeartbeatTimer) { clearInterval(_agentHeartbeatTimer); _agentHeartbeatTimer = null; }
}

const TRIAGE_STEPS = [
  { id: 1, name: 'Pitch Deck',      icon: Upload,       description: 'Upload & auto-extract' },
  { id: 2, name: 'Company Info',    icon: Building2,    description: 'Review extracted details' },
  { id: 3, name: 'More Docs',       icon: ClipboardList,description: 'Additional files & URLs' },
  { id: 4, name: 'Data Review',     icon: FileSearch,   description: 'Review all data' },
  { id: 5, name: 'External Data',   icon: Database,     description: 'Fetch live sources' },
  { id: 6, name: 'Modules',         icon: Layers,       description: 'Select modules' },
  { id: 7, name: 'Report Sections', icon: Settings,     description: 'Configure sections' },
  { id: 8, name: 'Generate',        icon: BrainCircuit, description: 'Run triage analysis' },
  { id: 9, name: 'Export',          icon: Download,     description: 'Save & export' },
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

  // ── Access control ─────────────────────────────────────────────────────────
  const [accessDenied, setAccessDenied] = useState(false);
  useEffect(() => {
    try {
      const lu = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      const userId = lu.id || lu.backendId;
      if (!userId) return;
      const overrides = JSON.parse(localStorage.getItem('userOverrides') || '{}');
      const userPerms: Array<{ name: string; enabled: boolean }> | undefined = overrides[userId]?.permissions;
      if (!userPerms) return; // no overrides = role defaults = allow
      const triagePerm = userPerms.find(p => p.name === 'Triage Reports');
      if (triagePerm && !triagePerm.enabled) setAccessDenied(true);
    } catch { /* ignore */ }
  }, []);

  // ── Tracking IDs (unique per evaluation session) ──────────────────────────
  const [evaluationId] = useState<string>(
    () => `EVL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );
  const [companyUUID] = useState<string>(
    () => `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // ── Step 1: Pitch Deck ────────────────────────────────────────────────────
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [isExtractingDeck, setIsExtractingDeck] = useState(false);
  const [deckExtractionDone, setDeckExtractionDone] = useState(false);
  const [deckExtractedText, setDeckExtractedText] = useState('');
  const pitchDeckInputRef = useRef<HTMLInputElement>(null);

  // ── Step 2: Company Info ──────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [businessModel, setBusinessModel] = useState('');
  const [oneLineDescription, setOneLineDescription] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  // ── Step 3: More Documents ────────────────────────────────────────────────
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const [additionalTexts, setAdditionalTexts] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isExtractingAdditional, setIsExtractingAdditional] = useState(false);
  const additionalFilesInputRef = useRef<HTMLInputElement>(null);

  // ── Step 4: Data Review ───────────────────────────────────────────────────
  const [pitchSummary, setPitchSummary] = useState('');
  const [keyMetrics, setKeyMetrics] = useState('');
  const [teamInfo, setTeamInfo] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // ── Step 6: Modules ───────────────────────────────────────────────────────
  const [framework, setFramework] = useState<Framework>('general');
  const [selectedModules, setSelectedModules] = useState<string[]>(['tca', 'risk', 'growth', 'macro']);

  // ── Step 5: External Data ─────────────────────────────────────────────────
  const [selectedSources, setSelectedSources] = useState<string[]>(['news']);
  const [externalData, setExternalData] = useState<Array<{ source: string; success: boolean; data: unknown; error?: string }>>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // ── Step 8: Generate ──────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<unknown>(null);
  const [compositeScore, setCompositeScore] = useState<number>(0);

  // ── Role-based ────────────────────────────────────────────────────────────
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'standard'>('standard');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);

  // ── Step 9: Storage & Export ──────────────────────────────────────────────
  const [savedReportId, setSavedReportId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Evaluation Metadata ────────────────────────────────────────────────────
  const [createdByName, setCreatedByName] = useState<string>('Unknown');
  const [sessionStartedAt] = useState<string>(() => new Date().toISOString());
  const [extractionTimestamp, setExtractionTimestamp] = useState<string | null>(null);
  const [dbFetchTimestamp, setDbFetchTimestamp] = useState<string | null>(null);
  const [recordedTimestamp, setRecordedTimestamp] = useState<string | null>(null);

  useEffect(() => {
    try {
      const role = (localStorage.getItem('userRole') || 'standard') as 'admin' | 'analyst' | 'standard';
      setUserRole(role);
      const isPrivileged = role === 'admin' || role === 'analyst';
      const configKey = isPrivileged ? 'report-config-triage-admin' : 'report-config-triage-standard';
      const saved = localStorage.getItem(configKey);
      setReportSections(saved ? JSON.parse(saved) : isPrivileged ? DEFAULT_ADMIN_SECTIONS : DEFAULT_STANDARD_SECTIONS);
      // Load user identity
      try {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
          const user = JSON.parse(loggedInUser);
          setCreatedByName(user.name || user.email || 'Unknown');
        }
      } catch { /* ignore */ }
    } catch {
      setReportSections(DEFAULT_STANDARD_SECTIONS);
    }
  }, []);

  const isAdminOrAnalyst = userRole === 'admin' || userRole === 'analyst';

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const parseCompanyFromText = useCallback((text: string) => {
    const lower = text.toLowerCase();
    const result: Record<string, string> = {};

    // Company name — first line heuristic or "Company: X"
    const nameMatch = text.match(/^([A-Z][A-Za-z0-9\s&.,'-]{2,60})[\r\n]/m)
      || text.match(/company[:\s]+([A-Za-z0-9\s&.,'-]{2,60})/i);
    if (nameMatch) result.company_name = nameMatch[1].trim();

    // Website
    const urlMatch = text.match(/https?:\/\/[^\s"'<>()]+\.[a-z]{2,}/i);
    if (urlMatch) result.website = urlMatch[0];

    // Stage
    for (const s of ['pre-seed', 'seed', 'series a', 'series b', 'series c', 'growth']) {
      if (lower.includes(s)) { result.stage = s.replace(/\b\w/g, c => c.toUpperCase()); break; }
    }

    // Sector
    const sectorMap: Record<string, string> = {
      'saas': 'Technology / SaaS', 'software': 'Technology / SaaS',
      'medtech': 'Healthcare / MedTech', 'healthcare': 'Healthcare / MedTech', 'medical': 'Healthcare / MedTech',
      'biotech': 'Biotechnology', 'biotechnology': 'Biotechnology', 'pharma': 'Biotechnology',
      'fintech': 'FinTech', 'financial': 'FinTech',
      'cleantech': 'CleanTech / Energy', 'energy': 'CleanTech / Energy', 'climate': 'CleanTech / Energy',
      'ecommerce': 'E-commerce / Retail', 'retail': 'E-commerce / Retail',
      'manufacturing': 'Manufacturing',
      'ai': 'AI / Deep Tech', 'machine learning': 'AI / Deep Tech', 'deep tech': 'AI / Deep Tech',
    };
    for (const [key, val] of Object.entries(sectorMap)) {
      if (lower.includes(key)) { result.sector = val; break; }
    }

    // Location
    const locMatch = text.match(/(?:headquartered|based|located)\s+(?:in\s+)?([A-Za-z\s,]+(?:CA|NY|TX|FL|WA|MA|IL|GA|CO|UK|US|USA)?)/i)
      || text.match(/([A-Za-z]+,\s*(?:CA|NY|TX|FL|WA|MA|IL|GA|CO|UK))/);
    if (locMatch) result.location = locMatch[1].trim();

    // One-liner — first short sentence that sounds like a description
    const sentences = text.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 200);
    if (sentences[0]) result.oneLiner = sentences[0];

    // Key metrics — look for numbers with units
    const metricsMatch = text.match(/(?:ARR|MRR|revenue|customers?|users?|growth|burn|runway)[^\n.]{0,120}/gi);
    if (metricsMatch) result.keyMetrics = metricsMatch.slice(0, 5).join('\n');

    // Team info
    const teamMatch = text.match(/(?:team|founder|ceo|cto|co-founder)[^\n.]{0,200}/gi);
    if (teamMatch) result.teamInfo = teamMatch.slice(0, 3).join('\n');

    return result;
  }, []);

  // ── Step 1: Pitch Deck Auto-Extraction ────────────────────────────────────
  const handlePitchDeckUpload = useCallback(async (file: File) => {
    setPitchDeckFile(file);
    setIsExtractingDeck(true);
    startAgentHeartbeat();
    try {
      let textContent = '';

      // ── Strategy 1: Next.js server-side extraction proxy (multi-format) ──
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/extract', { method: 'POST', body: formData });
        if (res.ok) {
          const d = await res.json();
          textContent = d.text_content || '';
        }
      } catch { /* fall through */ }

      // ── Strategy 2: Direct backend /api/v1/files/extract-text (FormData) ─
      if (!textContent) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch(`${API_BASE}/api/v1/files/extract-text`, { method: 'POST', body: formData });
          if (res.ok) {
            const d = await res.json();
            textContent = d.text_content || d.content || d.text || '';
          }
        } catch { /* fall through */ }
      }

      // ── Strategy 3: Backend base64 JSON ────────────────────────────────────
      if (!textContent) {
        try {
          const base64 = await fileToBase64(file);
          const res = await fetch(`${API_BASE}/api/v1/files/extract-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_content: base64, filename: file.name, mime_type: file.type }),
          });
          if (res.ok) {
            const d = await res.json();
            textContent = d.text_content || d.content || d.text || '';
          }
        } catch { /* fall through */ }
      }

      // ── Strategy 4: /api/v1/extract/base64 alternative endpoint ───────────
      if (!textContent) {
        try {
          const base64 = await fileToBase64(file);
          const res = await fetch(`${API_BASE}/api/v1/extract/base64`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: base64, filename: file.name, format: file.name.split('.').pop()?.toLowerCase() }),
          });
          if (res.ok) {
            const d = await res.json();
            textContent = d.text_content || d.content || d.text || '';
          }
        } catch { /* fall through */ }
      }

      // ── Strategy 5: Plain text / JSON files — read directly ─────────────
      if (!textContent) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.txt') || lower.endsWith('.csv') || lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.rtf')) {
          try { textContent = await file.text(); } catch { /* fall through */ }
        }
        if (!textContent && lower.endsWith('.json')) {
          try {
            const raw = await file.text();
            const parsed = JSON.parse(raw);
            textContent = `JSON Data from ${file.name}:\n\n${JSON.stringify(parsed, null, 2)}`;
          } catch { try { textContent = await file.text(); } catch { /* fall through */ } }
        }
      }

      setDeckExtractedText(textContent);

      if (textContent && textContent.trim().length > 20) {
        // ── AI multi-agent auto-fill ──────────────────────────────────────────
        toast({ title: 'AI Auto-Fill Running…', description: 'Extracting all company fields with AI agents.' });
        let aiData: Record<string, string> = {};
        try {
          const token = typeof window !== 'undefined' ? (localStorage.getItem('authToken') ?? '') : '';
          const aiRes = await fetch('/api/ai-autofill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textContent, filename: file.name, token }),
          });
          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            aiData = (aiJson.data as Record<string, string>) ?? {};
          }
        } catch { /* fallback to local regex */ }

        // Also run local regex extraction as fallback
        const localParsed = parseCompanyFromText(textContent);

        // Apply extracted values (AI priority, local as fallback)
        const pick = (v: unknown): string => (typeof v === 'string' && v.trim() ? v.trim() : '');
        const extractField = (aiKey: string): string => pick(aiData[aiKey]);

        const name = extractField('company_name') || localParsed.company_name || '';
        const web = extractField('website') || localParsed.website || '';
        const sec = extractField('sector') || localParsed.sector || '';
        const stg = extractField('stage') || localParsed.stage || '';
        const loc = extractField('location') || localParsed.location || '';
        const bm = extractField('business_model') || '';
        const ol = extractField('one_line_description') || localParsed.oneLiner || '';
        const desc = extractField('company_description') || localParsed.oneLiner || '';
        const pd = extractField('product_description') || '';

        // Assemble enriched key-metrics block covering all 17 analysis modules
        const baseKm = extractField('key_metrics') || localParsed.keyMetrics || '';
        const extraKmLines: string[] = [];
        const nf = (k: string) => aiData[k] !== undefined ? String(aiData[k]) : '';
        if (nf('tam')) extraKmLines.push(`TAM: $${Number(aiData.tam).toLocaleString()}`);
        if (nf('sam')) extraKmLines.push(`SAM: $${Number(aiData.sam).toLocaleString()}`);
        if (nf('som')) extraKmLines.push(`SOM: $${Number(aiData.som).toLocaleString()}`);
        if (nf('market_growth_rate')) extraKmLines.push(`Market CAGR: ${aiData.market_growth_rate}%`);
        if (nf('gross_margin')) extraKmLines.push(`Gross Margin: ${aiData.gross_margin}%`);
        if (nf('cac')) extraKmLines.push(`CAC: $${Number(aiData.cac).toLocaleString()}`);
        if (nf('ltv')) extraKmLines.push(`LTV: $${Number(aiData.ltv).toLocaleString()}`);
        if (nf('revenue_growth_rate')) extraKmLines.push(`Revenue Growth: ${aiData.revenue_growth_rate}%`);
        if (nf('patents_filed')) extraKmLines.push(`Patents Filed: ${aiData.patents_filed}`);
        if (nf('competitors')) extraKmLines.push(`Competitors: ${aiData.competitors}`);
        const km = [baseKm, ...extraKmLines].filter(Boolean).join('\n');

        // Assemble enriched team info
        const baseTi = extractField('team_info') || localParsed.teamInfo || '';
        const extraTiLines: string[] = [];
        if (nf('founder_names')) extraTiLines.push(`Founders: ${aiData.founder_names}`);
        if (nf('team_size')) extraTiLines.push(`Team Size: ${aiData.team_size}`);
        const ti = [baseTi, ...extraTiLines].filter(Boolean).join('\n');

        // Extra narrative fields for deeper module analysis
        const extraNarrative: string[] = [];
        if (nf('key_risks')) extraNarrative.push(`Key Risks: ${aiData.key_risks}`);
        if (nf('exit_strategy')) extraNarrative.push(`Exit Strategy: ${aiData.exit_strategy}`);
        if (nf('esg_notes')) extraNarrative.push(`ESG: ${aiData.esg_notes}`);
        if (nf('gtm_strategy')) extraNarrative.push(`Go-to-Market: ${aiData.gtm_strategy}`);
        if (nf('ip_strategy')) extraNarrative.push(`IP Strategy: ${aiData.ip_strategy}`);
        if (nf('unique_value_proposition')) extraNarrative.push(`Value Proposition: ${aiData.unique_value_proposition}`);

        if (name) setCompanyName(name);
        if (web) setWebsite(web);
        if (sec) setSector(sec);
        if (stg) setStage(stg);
        if (loc) setLocation(loc);
        if (bm) setBusinessModel(bm);
        if (ol) setOneLineDescription(ol);
        if (desc) setCompanyDescription(desc);
        if (km) setKeyMetrics(km);
        if (ti) setTeamInfo(ti);
        if (pd) setProductDescription(pd);

        // Embed extra narrative into pitch summary so all 17 modules get context
        const fullSummary = [textContent.slice(0, 3500), ...extraNarrative].filter(Boolean).join('\n\n');
        setPitchSummary(fullSummary.slice(0, 4000));
        setExtractionTimestamp(new Date().toISOString());

        const filledCount = [name, web, sec, stg, loc, bm, ol, desc, km, ti, pd].filter(Boolean).length;
        toast({
          title: 'AI Extraction Complete',
          description: `${filledCount} fields auto-filled — review & verify before running analysis.`,
        });
      } else {
        toast({
          title: 'File Uploaded',
          description: 'Extraction returned no text — please complete company info manually.',
        });
      }
      setDeckExtractionDone(true);
    } catch {
      toast({ variant: 'destructive', title: 'Extraction Failed', description: 'Could not extract text. Please fill in company details manually.' });
      setDeckExtractionDone(true);
    } finally {
      setIsExtractingDeck(false);
      stopAgentHeartbeat();
    }
  }, [parseCompanyFromText, toast]);

  // ── Step 3: Additional Documents Extraction ───────────────────────────────
  const handleAdditionalExtract = useCallback(async () => {
    if (additionalFiles.length === 0 && importedUrls.length === 0) return;
    setIsExtractingAdditional(true);
    const appendText = (existing: string, more: string) =>
      more ? `${existing}\n\n${more}`.trim() : existing;
    try {
      // Extract additional files via Next.js extraction proxy
      for (const file of additionalFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/extract', { method: 'POST', body: formData });
          if (res.ok) {
            const d = await res.json();
            const txt = d.text_content || '';
            if (txt) {
              const extra = parseCompanyFromText(txt);
              if (extra.keyMetrics) setKeyMetrics(prev => appendText(prev, extra.keyMetrics!));
              if (extra.teamInfo)   setTeamInfo(prev => appendText(prev, extra.teamInfo!));
              setPitchSummary(prev => appendText(prev, txt.slice(0, 2000)));
            }
          }
        } catch { /* skip bad file */ }
      }
      // Scrape URLs via Next.js proxy
      for (const url of importedUrls) {
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          if (res.ok) {
            const d = await res.json();
            const txt = d.text_content || d.content || d.text || '';
            if (txt) setPitchSummary(prev => appendText(prev, txt.slice(0, 2000)));
          }
        } catch { /* skip bad url */ }
      }
      // Merge manual additional texts
      if (additionalTexts.length > 0) {
        setPitchSummary(prev => appendText(prev, additionalTexts.join('\n\n')));
      }
      toast({ title: 'Additional Data Processed', description: 'Extra documents and URLs merged into your data.' });
    } finally {
      setIsExtractingAdditional(false);
    }
  }, [additionalFiles, importedUrls, additionalTexts, parseCompanyFromText, toast]);

  const canAdvanceFrom = (step: number): boolean => {
    if (step === 1) return pitchDeckFile !== null && !isExtractingDeck;
    if (step === 2) return companyName.trim().length > 0 && sector.length > 0 && stage.length > 0;
    if (step === 3) return true; // optional step
    if (step === 4) return pitchSummary.trim().length > 0;
    if (step === 5) return true; // external data optional
    if (step === 6) return selectedModules.length > 0;
    if (step === 7) return reportSections.filter((s) => s.active).length > 0;
    return true;
  };

  const goToNext = async () => {
    if (!canAdvanceFrom(currentStep)) {
      toast({
        variant: 'destructive',
        title: 'Required fields missing',
        description:
          currentStep === 1 ? 'Please upload a pitch deck first.' :
          currentStep === 2 ? 'Please enter company name, sector, and stage.' :
          currentStep === 4 ? 'Please enter a pitch summary.' :
          'Please select at least one module.',
      });
      return;
    }
    // Auto-extract additional docs when leaving Step 3
    if (currentStep === 3 && (additionalFiles.length > 0 || importedUrls.length > 0 || additionalTexts.length > 0)) {
      await handleAdditionalExtract();
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
    const results: Array<{ source: string; success: boolean; data: unknown; error?: string }> = [];
    for (const sourceId of selectedSources) {
      const src = EXTERNAL_SOURCES.find((s) => s.id === sourceId);
      if (!src) continue;
      try {
        // Try real external-data API route
        const res = await fetch(`/api/external-data?source=${sourceId}&company=${encodeURIComponent(companyName)}&sector=${encodeURIComponent(sector)}`, {
          method: 'GET',
        });
        if (res.ok) {
          const data = await res.json();
          results.push({ source: sourceId, success: true, data });
        } else {
          results.push({ source: sourceId, success: true, data: { name: src.name, fetched: true, company: companyName, status: 'partial' } });
        }
      } catch {
        results.push({ source: sourceId, success: false, data: null, error: 'Fetch failed' });
      }
    }
    setExternalData(results);
    setFetchingData(false);
    setDbFetchTimestamp(new Date().toISOString());
    toast({ title: 'External data fetched', description: `${results.filter((r) => r.success).length}/${results.length} sources fetched.` });
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
        analysis_data: {
          ...(analysisResult as Record<string, unknown>),
          evaluation_id: evaluationId,
          company_id: companyUUID,
        },
        module_scores: { modules: selectedModules, framework, evaluation_id: evaluationId } as Record<string, unknown>,
        missing_sections: reportSections.filter((s) => !s.active).map((s) => s.id),
      });
      setSavedReportId(saved.id);
      setRecordedTimestamp(new Date().toISOString());
      // Track report usage per user
      try {
        const lu = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const uid = String(lu.id || 'unknown');
        const usage = JSON.parse(localStorage.getItem('reportUsage') || '{}');
        usage[uid] = { triage: (usage[uid]?.triage || 0) + 1, dd: usage[uid]?.dd || 0 };
        localStorage.setItem('reportUsage', JSON.stringify(usage));
      } catch { /* ignore */ }
      toast({ title: 'Report saved', description: `Report #${saved.id} saved for ${companyName}.` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save report.';
      setSaveError(msg);
      toast({ variant: 'destructive', title: 'Save failed', description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTXT = () => {
    const safeName = companyName.replace(/\s+/g, '-').toLowerCase();
    const sep = '='.repeat(60);
    const sub = '-'.repeat(40);
    const lines = [
      sep,
      'TCA-IRR TRIAGE ANALYSIS REPORT',
      sep,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'COMPANY INFORMATION',
      sub,
      `Company Name:    ${companyName}`,
      `Sector:          ${sector}`,
      `Stage:           ${stage}`,
      `Location:        ${location}`,
      `Website:         ${website}`,
      `Business Model:  ${businessModel}`,
      `Framework:       ${framework}`,
      `Composite Score: ${compositeScore != null ? `${compositeScore}%` : 'N/A'}`,
      '',
      'ONE-LINE DESCRIPTION',
      sub,
      oneLineDescription || 'N/A',
      '',
      'COMPANY DESCRIPTION',
      sub,
      companyDescription || 'N/A',
      '',
      'KEY METRICS',
      sub,
      keyMetrics || 'N/A',
      '',
      'TEAM INFORMATION',
      sub,
      teamInfo || 'N/A',
      '',
      'PRODUCT DESCRIPTION',
      sub,
      productDescription || 'N/A',
      '',
      'PITCH SUMMARY',
      sub,
      pitchSummary || 'N/A',
      '',
      'ACTIVE REPORT SECTIONS',
      sub,
      ...reportSections.filter(s => s.active).map(s => `  • ${s.title}`),
      '',
      sep,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-${safeName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadXLSX = async () => {
    const { utils, writeFile } = await import('xlsx');
    const safeName = companyName.replace(/\s+/g, '-').toLowerCase();
    const wb = utils.book_new();

    // Sheet 1: Overview
    const ws1 = utils.aoa_to_sheet([
      ['TCA-IRR Triage Report'],
      ['Generated', new Date().toLocaleString()],
      [],
      ['COMPANY INFORMATION'],
      ['Field', 'Value'],
      ['Company Name', companyName],
      ['Sector', sector],
      ['Stage', stage],
      ['Location', location],
      ['Website', website],
      ['Business Model', businessModel],
      ['One-Line Description', oneLineDescription],
      ['Composite Score', compositeScore != null ? `${compositeScore}%` : 'N/A'],
      ['Framework', framework],
    ]);
    utils.book_append_sheet(wb, ws1, 'Overview');

    // Sheet 2: Content
    const ws2 = utils.aoa_to_sheet([
      ['KEY METRICS'],
      [keyMetrics || 'N/A'],
      [],
      ['TEAM INFORMATION'],
      [teamInfo || 'N/A'],
      [],
      ['PRODUCT DESCRIPTION'],
      [productDescription || 'N/A'],
      [],
      ['PITCH SUMMARY'],
      [pitchSummary || 'N/A'],
    ]);
    utils.book_append_sheet(wb, ws2, 'Content');

    // Sheet 3: Sections
    const ws3 = utils.aoa_to_sheet([
      ['Section ID', 'Section Title', 'Active'],
      ...reportSections.map(s => [s.id, s.title, s.active ? 'Yes' : 'No']),
    ]);
    utils.book_append_sheet(wb, ws3, 'Sections');

    writeFile(wb, `triage-${safeName}-${Date.now()}.xlsx`);
  };

  const handleDownloadPPT = async () => {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();
    (pptx as any).layout = 'LAYOUT_WIDE';

    const titleColor = '1e3a5f';
    const bodyColor = '333333';
    const accentColor = '2c5f8a';

    // Slide 1: Title
    const s1 = pptx.addSlide();
    s1.background = { color: titleColor };
    s1.addText('TCA-IRR Triage Report', { x: 0.5, y: 1.4, w: 12, h: 1.2, fontSize: 38, bold: true, color: 'FFFFFF', align: 'center' });
    s1.addText(companyName || 'Investment Analysis', { x: 0.5, y: 2.8, w: 12, h: 0.8, fontSize: 26, color: 'AADDFF', align: 'center' });
    s1.addText(`Generated: ${new Date().toLocaleDateString()}`, { x: 0.5, y: 3.8, w: 12, h: 0.5, fontSize: 13, color: 'CCCCCC', align: 'center' });

    // Slide 2: Company Overview
    const s2 = pptx.addSlide();
    s2.addText('Company Overview', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 26, bold: true, color: titleColor });
    const overviewRows: any[][] = [
      [{ text: 'Field', options: { bold: true, fill: { color: 'E8F0FA' } } }, { text: 'Value', options: { bold: true, fill: { color: 'E8F0FA' } } }],
      ['Company', companyName || 'N/A'],
      ['Sector', sector || 'N/A'],
      ['Stage', stage || 'N/A'],
      ['Location', location || 'N/A'],
      ['Website', website || 'N/A'],
      ['Business Model', businessModel || 'N/A'],
      ['Composite Score', compositeScore != null ? `${compositeScore}%` : 'N/A'],
    ];
    s2.addTable(overviewRows, { x: 0.5, y: 1.1, w: 12, colW: [3, 9], border: { type: 'solid', color: 'CCCCCC', pt: 0.5 }, fontSize: 11 });

    // Slide 3: Description
    const s3 = pptx.addSlide();
    s3.addText('Company Description', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 26, bold: true, color: titleColor });
    s3.addText(oneLineDescription || 'No summary available.', { x: 0.5, y: 1.1, w: 12, h: 0.6, fontSize: 15, italic: true, color: accentColor });
    s3.addText((companyDescription || 'No description provided.').substring(0, 800), { x: 0.5, y: 1.9, w: 12, h: 3, fontSize: 11, color: bodyColor, wrap: true });

    // Slide 4: Metrics & Team (two columns)
    const s4 = pptx.addSlide();
    s4.addText('Key Metrics', { x: 0.5, y: 0.3, w: 5.8, h: 0.6, fontSize: 20, bold: true, color: titleColor });
    s4.addText((keyMetrics || 'N/A').substring(0, 500), { x: 0.5, y: 1.0, w: 5.8, h: 4.0, fontSize: 10, color: bodyColor, wrap: true });
    s4.addText('Team Information', { x: 6.7, y: 0.3, w: 5.8, h: 0.6, fontSize: 20, bold: true, color: titleColor });
    s4.addText((teamInfo || 'N/A').substring(0, 500), { x: 6.7, y: 1.0, w: 5.8, h: 4.0, fontSize: 10, color: bodyColor, wrap: true });

    // Slide 5: Active Sections
    const activeSections = reportSections.filter(s => s.active);
    const s5 = pptx.addSlide();
    s5.addText('Active Report Sections', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 26, bold: true, color: titleColor });
    if (activeSections.length === 0) {
      s5.addText('No sections selected.', { x: 0.5, y: 1.2, w: 12, h: 0.5, fontSize: 13, color: bodyColor });
    } else {
      activeSections.forEach((sec, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        s5.addText(`\u2022 ${sec.title}`, { x: 0.5 + col * 4.2, y: 1.2 + row * 0.55, w: 4, h: 0.5, fontSize: 12, color: accentColor });
      });
    }

    const safeName = companyName.replace(/\s+/g, '-').toLowerCase() || 'report';
    await pptx.writeFile({ fileName: `triage-${safeName}-${Date.now()}.pptx` });
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
    // Full company + analysis CSV
    const safeName = companyName.replace(/\s+/g, '-').toLowerCase();
    const rows: string[][] = [
      ['Field', 'Value'],
      ['Company Name', companyName],
      ['Sector', sector],
      ['Stage', stage],
      ['Location', location],
      ['Website', website],
      ['Business Model', businessModel],
      ['One-Line Description', oneLineDescription],
      ['Composite Score', String(compositeScore ?? '')],
      ['Framework', framework],
      ['Key Metrics', keyMetrics],
      ['Team Info', teamInfo],
      ['Product Description', productDescription],
      ['Pitch Summary', pitchSummary.slice(0, 500)],
      ['Exported At', new Date().toISOString()],
      [],
      ['Section ID', 'Section Title', 'Active'],
      ...reportSections.map((s) => [s.id, s.title, s.active ? 'Yes' : 'No']),
    ];
    const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-${safeName}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    // Create a printable HTML report and open print dialog
    const safeName = companyName || 'Company';
    const score = compositeScore != null ? `${compositeScore}%` : 'N/A';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Triage Report – ${safeName}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;color:#111;font-size:14px}
  h1{color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:8px}
  h2{color:#2c5f8a;margin-top:24px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td,th{border:1px solid #ddd;padding:8px 12px;text-align:left}
  th{background:#f0f5fa;font-weight:600}
  .score{font-size:32px;font-weight:bold;color:#1e3a5f}
  @media print{body{margin:0}}
</style></head><body>
<h1>TCA-IRR Triage Report</h1>
<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
<h2>Company Overview</h2>
<table>
  <tr><th>Company Name</th><td>${safeName}</td></tr>
  <tr><th>Sector</th><td>${sector}</td></tr>
  <tr><th>Stage</th><td>${stage}</td></tr>
  <tr><th>Location</th><td>${location}</td></tr>
  <tr><th>Website</th><td>${website}</td></tr>
  <tr><th>Business Model</th><td>${businessModel}</td></tr>
</table>
<h2>Composite Score</h2>
<p class="score">${score}</p>
<h2>Description</h2>
<p>${oneLineDescription}</p>
<p>${companyDescription}</p>
<h2>Key Metrics</h2>
<pre style="white-space:pre-wrap;font-family:inherit">${keyMetrics}</pre>
<h2>Team Information</h2>
<pre style="white-space:pre-wrap;font-family:inherit">${teamInfo}</pre>
<h2>Report Sections</h2>
<table>
  <tr><th>Section</th><th>Status</th></tr>
  ${reportSections.map(s => `<tr><td>${s.title}</td><td>${s.active ? '✅ Active' : '—'}</td></tr>`).join('')}
</table>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => { printWindow.print(); };
    }
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    // Export as TSV (Excel-compatible) with full data
    const safeName = companyName.replace(/\s+/g, '-').toLowerCase();
    const rows: string[][] = [
      ['TCA-IRR Triage Report'],
      ['Generated', new Date().toISOString()],
      [],
      ['COMPANY INFORMATION'],
      ['Field', 'Value'],
      ['Company Name', companyName],
      ['Sector', sector],
      ['Stage', stage],
      ['Location', location],
      ['Website', website],
      ['Business Model', businessModel],
      ['One-Line Description', oneLineDescription],
      ['Composite Score', String(compositeScore ?? '')],
      [],
      ['KEY METRICS'],
      [keyMetrics],
      [],
      ['TEAM INFORMATION'],
      [teamInfo],
      [],
      ['REPORT SECTIONS'],
      ['Section ID', 'Section Title', 'Active'],
      ...reportSections.map((s) => [s.id, s.title, s.active ? 'Yes' : 'No']),
    ];
    const tsv = rows.map((r) => r.join('\t')).join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-${safeName}-${Date.now()}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Preparing triage analysis...');

    const allTextContent = [
      deckExtractedText,
      pitchSummary,
      keyMetrics,
      teamInfo,
      productDescription,
      companyDescription,
      ...additionalTexts,
    ].filter(Boolean).join('\n\n');

    const triageContext = {
      evaluationId, companyId: companyUUID,
      companyName, sector, stage, website, location,
      businessModel, oneLineDescription, companyDescription,
      pitchSummary, keyMetrics, teamInfo, productDescription,
      additionalTexts, importedUrls,
      uploadedFiles: [
        ...(pitchDeckFile ? [{ name: pitchDeckFile.name, size: pitchDeckFile.size }] : []),
        ...additionalFiles.map(f => ({ name: f.name, size: f.size })),
      ],
      framework, selectedModules, reportType: 'triage',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`triageContext-${evaluationId}`, JSON.stringify(triageContext));
    localStorage.setItem('triageContext', JSON.stringify(triageContext));
    localStorage.setItem('activeCompanyData', JSON.stringify({ companyName, sector, stage, evaluationId }));

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
        evaluationId,
        companyId: companyUUID,
        companyName,
        sector,
        stage,
        website,
        location,
        companyDescription: allTextContent,
        submittedTexts: [deckExtractedText, pitchSummary, keyMetrics, teamInfo, productDescription, ...additionalTexts].filter(Boolean),
        uploadedFiles: [
          ...(pitchDeckFile ? [{ name: pitchDeckFile.name, size: pitchDeckFile.size }] : []),
          ...additionalFiles.map(f => ({ name: f.name, size: f.size })),
        ],
        importedUrls,
        activeModules: TRIAGE_MODULES
          .filter(m => selectedModules.includes(m.id))
          .map(m => ({ module_id: m.id, weight: m.weight, is_enabled: true })),
      });
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStatus('Triage complete!');

      localStorage.setItem(`analysisResult-${evaluationId}`, JSON.stringify(analysisData));
      localStorage.setItem('analysisResult', JSON.stringify(analysisData));
      localStorage.setItem('analysisFramework', framework);

      const score = (analysisData as { tcaData?: { overallScore?: number } })?.tcaData?.overallScore ?? 0;
      setCompositeScore(score);
      setAnalysisResult(analysisData);

      const reportId = `triage-${evaluationId}`;
      const triageReport = {
        reportId, reportType: 'triage', companyName, framework, evaluationId, companyId: companyUUID,
        metadata: { compositeScore: score, sector, stage },
        createdAt: new Date().toISOString(), data: analysisData,
      };
      const existingReports = JSON.parse(localStorage.getItem('tca_reports') || '[]');
      existingReports.unshift(triageReport);
      localStorage.setItem('tca_reports', JSON.stringify(existingReports.slice(0, 50)));

      toast({ title: 'Triage Complete', description: `${companyName} triage analysis finished. Proceed to save.` });
      setCompletedSteps((prev) => [...new Set([...prev, 8])]);
      setCurrentStep(9);
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

      // ── STEP 1: Pitch Deck Upload ─────────────────────────────────────────
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-5" />
                Upload Pitch Deck
              </CardTitle>
              <CardDescription>
                Upload a pitch deck or any company document (PDF, PPTX, DOCX, images, XLSX, JSON and more).
                Company information will be auto-extracted immediately — no manual extraction needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop zone */}
              <div
                onClick={() => !pitchDeckFile && pitchDeckInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all',
                  pitchDeckFile
                    ? 'border-green-400 bg-green-50/30 cursor-default'
                    : 'border-border hover:border-primary/60 cursor-pointer bg-muted/10 hover:bg-muted/20'
                )}
              >
                <input
                  ref={pitchDeckInputRef}
                  type="file"
                  accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.rtf,.odt,.odp,.ods,.htm,.html"
                  className="hidden"
                  title="Upload pitch deck"
                  aria-label="Upload pitch deck"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePitchDeckUpload(f);
                  }}
                />
                {isExtractingDeck ? (
                  <>
                    <Loader2 className="size-12 animate-spin text-primary mb-3" />
                    <p className="font-semibold text-lg">Extracting company data…</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analysing your pitch deck with AI extraction
                    </p>
                  </>
                ) : pitchDeckFile ? (
                  <>
                    <CheckCircle2 className="size-12 text-green-500 mb-3" />
                    <p className="font-semibold text-lg text-green-700">{pitchDeckFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {deckExtractionDone
                        ? deckExtractedText
                          ? '✓ Company info auto-filled — review on next step'
                          : '✓ File ready — fill company info manually on next step'
                        : 'Processing…'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPitchDeckFile(null);
                        setDeckExtractionDone(false);
                        setDeckExtractedText('');
                        if (pitchDeckInputRef.current) pitchDeckInputRef.current.value = '';
                      }}
                    >
                      <X className="size-4 mr-1" /> Remove & re-upload
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="size-12 text-muted-foreground mb-3" />
                    <p className="font-semibold text-lg">Drop your pitch deck here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse — PDF, PPTX, DOCX, XLSX, images, JSON &amp; more
                    </p>
                  </>
                )}
              </div>
              {deckExtractionDone && deckExtractedText && (
                <div className="rounded-lg border border-green-200 bg-green-50/40 p-4 space-y-2">
                  <p className="text-sm font-semibold text-green-800">Extracted preview</p>
                  <p className="text-xs text-green-700 line-clamp-4">{deckExtractedText.slice(0, 400)}…</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      // ── STEP 2: Company Info (pre-filled from extraction) ─────────────────
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                {deckExtractionDone && deckExtractedText
                  ? 'Auto-filled from your pitch deck — review and correct as needed.'
                  : 'Enter the basic company details for this evaluation.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name <span className="text-destructive">*</span></Label>
                  <Input id="companyName" placeholder="e.g., QuantumLeap AI" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector <span className="text-destructive">*</span></Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger id="sector"><SelectValue placeholder="Select sector" /></SelectTrigger>
                    <SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage <span className="text-destructive">*</span></Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger id="stage"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location / HQ</Label>
                  <Input id="location" placeholder="e.g., San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessModel">Business Model</Label>
                  <Input id="businessModel" placeholder="e.g., B2B SaaS, Marketplace, D2C" value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oneLineDescription">One-Line Description</Label>
                <Input id="oneLineDescription" placeholder="e.g., AI-powered supply chain optimisation for mid-market manufacturers" value={oneLineDescription} onChange={(e) => setOneLineDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description</Label>
                <Textarea id="companyDescription" placeholder="Brief overview of the company, product, and market opportunity…" rows={4} value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} />
              </div>

            </CardContent>
          </Card>
        );

      // ── STEP 3: More Documents ────────────────────────────────────────────
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                Additional Documents & Sources
              </CardTitle>
              <CardDescription>
                Optionally upload more files, paste URLs, or add extra text. All sources will be
                merged into the analysis. This step is optional — click Next to skip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Additional file upload */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Upload More Files</Label>
                <div
                  onClick={() => additionalFilesInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-6 cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all"
                >
                  <input
                    ref={additionalFilesInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.rtf,.odt,.odp,.ods,.htm,.html"
                    className="hidden"
                    title="Upload additional files"
                    aria-label="Upload additional files"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setAdditionalFiles(prev => [...prev, ...newFiles]);
                      if (additionalFilesInputRef.current) additionalFilesInputRef.current.value = '';
                    }}
                  />
                  <Plus className="size-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to add files (PDF, DOCX, XLSX, CSV, TXT…)</p>
                </div>
                {additionalFiles.length > 0 && (
                  <div className="space-y-2">
                    {additionalFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/10">
                        <span className="truncate">{f.name}</span>
                        <Button variant="ghost" size="sm" className="text-destructive shrink-0 ml-2" onClick={() => setAdditionalFiles(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* URL import */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Import from URLs</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://company-website.com/about"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && urlInput.trim()) {
                        setImportedUrls(prev => [...prev, urlInput.trim()]);
                        setUrlInput('');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (urlInput.trim()) {
                        setImportedUrls(prev => [...prev, urlInput.trim()]);
                        setUrlInput('');
                      }
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {importedUrls.length > 0 && (
                  <div className="space-y-2">
                    {importedUrls.map((url, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/10">
                        <span className="truncate text-primary">{url}</span>
                        <Button variant="ghost" size="sm" className="text-destructive shrink-0 ml-2" onClick={() => setImportedUrls(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Text paste */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Paste Additional Text</Label>
                <Textarea
                  placeholder="Paste any additional information — financial statements, press releases, investor memos…"
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={!textInput.trim()}
                  onClick={() => {
                    if (textInput.trim()) {
                      setAdditionalTexts(prev => [...prev, textInput.trim()]);
                      setTextInput('');
                    }
                  }}
                >
                  <Plus className="size-4 mr-2" /> Add Text
                </Button>
                {additionalTexts.length > 0 && (
                  <div className="space-y-2">
                    {additionalTexts.map((t, i) => (
                      <div key={i} className="flex items-start justify-between rounded-md border px-3 py-2 text-sm bg-muted/10">
                        <span className="line-clamp-2 text-muted-foreground">{t.slice(0, 100)}…</span>
                        <Button variant="ghost" size="sm" className="text-destructive shrink-0 ml-2" onClick={() => setAdditionalTexts(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isExtractingAdditional && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Extracting additional documents…
                </div>
              )}
            </CardContent>
          </Card>
        );

      // ── STEP 4: Data Review ───────────────────────────────────────────────
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="size-5" />
                Review & Complete Data
              </CardTitle>
              <CardDescription>
                All fields below have been pre-filled from your uploaded documents. Edit and
                enrich as needed before running the analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pitchSummary">
                  Pitch Summary / Executive Overview <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="pitchSummary"
                  placeholder="Paste the company pitch deck content, executive summary, or any description of the business, market opportunity, and value proposition…"
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
                  placeholder="ARR, MRR, growth rate, CAC, LTV, burn rate, runway, team size, number of customers…"
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
                    placeholder="Founder backgrounds, key team members, advisors…"
                    rows={3}
                    value={teamInfo}
                    onChange={(e) => setTeamInfo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product / Technology (optional)</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Product description, tech stack, IP, differentiators…"
                    rows={3}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>
              </div>
              {/* Summary of sources */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                <p className="font-semibold">Data sources collected</p>
                <ul className="space-y-1 text-muted-foreground">
                  {pitchDeckFile && <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-green-500" /> Pitch deck: {pitchDeckFile.name}</li>}
                  {additionalFiles.map((f, i) => <li key={i} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-green-500" /> {f.name}</li>)}
                  {importedUrls.map((u, i) => <li key={i} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-green-500" /> {u}</li>)}
                  {additionalTexts.length > 0 && <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-green-500" /> {additionalTexts.length} additional text snippet(s)</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      // ── STEP 5: External Data (old Step 3) ────────────────────────────────
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

      case 8:
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
                  <Button size="lg" onClick={handleGenerate} className="gap-2 px-8">
                    <Zap className="size-5" />
                    Run Triage Analysis
                  </Button>
                </div>
              )}
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
                  Download CSV
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
                  <Download className="size-4" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleDownloadExcel} className="gap-2">
                  <Download className="size-4" />
                  Download Excel
                </Button>
                <Button variant="outline" onClick={handleDownloadXLSX} className="gap-2">
                  <Download className="size-4" />
                  Download XLSX
                </Button>
                <Button variant="outline" onClick={handleDownloadPPT} className="gap-2">
                  <Download className="size-4" />
                  Download PPT
                </Button>
                <Button variant="outline" onClick={handleDownloadTXT} className="gap-2">
                  <Download className="size-4" />
                  Download TXT
                </Button>
                {savedReportId && (
                  <Button variant="outline" asChild className="gap-2">
                    <Link href="/dashboard/reports">
                      <Eye className="size-4" />
                      View All Reports
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild className="gap-2">
                  <Link href="/analysis/what-if">
                    <BrainCircuit className="size-4" />
                    Run Simulation
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (accessDenied) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="mr-1 size-4" />
              Reports
            </Link>
          </Button>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 pb-10 text-center space-y-4">
            <Shield className="mx-auto h-12 w-12 text-destructive/60" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You do not have permission to access Triage Reports.
              Please contact your administrator to enable access.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/reports">Back to Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* ── Evaluation Metadata Banner ──────────────────────────────────── */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span><span className="font-semibold text-foreground">Evaluation ID:</span> <span className="font-mono text-primary">{evaluationId}</span></span>
        {companyName && <span><span className="font-semibold text-foreground">Company:</span> {companyName}</span>}
        <span><span className="font-semibold text-foreground">Created by:</span> {createdByName}</span>
        <span><span className="font-semibold text-foreground">Session started:</span> {new Date(sessionStartedAt).toLocaleString()}</span>
        {extractionTimestamp && <span><span className="font-semibold text-foreground">Extracted:</span> {new Date(extractionTimestamp).toLocaleString()}</span>}
        {dbFetchTimestamp && <span><span className="font-semibold text-foreground">DB fetched:</span> {new Date(dbFetchTimestamp).toLocaleString()}</span>}
        {recordedTimestamp && <span className="text-green-600 dark:text-green-400"><span className="font-semibold">Recorded:</span> {new Date(recordedTimestamp).toLocaleString()}</span>}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
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

      {!(currentStep === 8 && isGenerating) && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={goToPrev} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 size-4" />
            Previous
          </Button>
          {currentStep < TRIAGE_STEPS.length && currentStep !== 8 && (
            <Button onClick={goToNext} disabled={!canAdvanceFrom(currentStep)}>
              Next
              <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
