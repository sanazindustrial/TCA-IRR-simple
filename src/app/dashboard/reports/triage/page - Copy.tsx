'use client';

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useAiInsight } from '@/hooks/use-ai-insight';
import { AiInsightPanel, AiErrorExplainer } from '@/components/shared/AiInsightPanel';
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
import reportsApi from '@/lib/reports-api';
import { externalSourcesConfig } from '@/lib/external-sources-config';
import { EvaluationProvider } from '@/components/evaluation/evaluation-provider';
import { normalizeAnalysisData } from '@/lib/normalize-tca-data';
import type { ComprehensiveAnalysisOutput } from '@/lib/sample-data';
import {
  RAW_MODULE_CONFIG,
  MODULE_WEIGHT_MAP,
  computeAnalystSynthesisResult,
  computeBenchmarkCompositeScore,
  computeEconomicModuleResult,
  computeEnvironmentalModuleResult,
  computeFinancialModuleResult,
  computeFounderFitModuleResult,
  computeFunderFitScore,
  computeGapAnalysisResult,
  computeGrowthClassifierResult,
  computeGrowthRawSignal,
  computeMacroCompositeScore,
  computeMarketingModuleResult,
  computeSocialModuleResult,
  computeStrategicFitModuleResult,
  computeStrategicModuleResult,
  inferMacroSector,
  type ConfidenceBand,
} from '@/lib/tca-scoring-framework';
import { ExecutiveSummary } from '@/components/evaluation/executive-summary';
import { QuickSummary } from '@/components/evaluation/quick-summary';
import { TcaScorecard } from '@/components/evaluation/tca-scorecard';
import { TcaSummaryCard } from '@/components/evaluation/tca-summary-card';
import { TcaAiTable } from '@/components/evaluation/tca-ai-table';
import { TcaInterpretationSummary } from '@/components/evaluation/tca-interpretation-summary';
import { WeightedScoreBreakdown } from '@/components/evaluation/weighted-score-breakdown';
import { RiskFlagSummaryTable } from '@/components/evaluation/risk-flag-summary-table';
import { FlagAnalysisNarrative } from '@/components/evaluation/flag-analysis-narrative';
import { GapAnalysis } from '@/components/evaluation/gap-analysis';
import { MacroTrendAlignment } from '@/components/evaluation/macro-trend-alignment';
import { BenchmarkComparison } from '@/components/evaluation/benchmark-comparison';
import { CompetitiveLandscape } from '@/components/evaluation/competitive-landscape';
import { GrowthClassifier } from '@/components/evaluation/growth-classifier';
import { TeamAssessment } from '@/components/evaluation/team-assessment';
import { CEOQuestions } from '@/components/evaluation/ceo-questions';
import { ConsistencyCheck } from '@/components/evaluation/consistency-check';
import { AnalystComments } from '@/components/evaluation/analyst-comments';
import { AnalystAIDeviation } from '@/components/evaluation/analyst-ai-deviation';
import { FinalRecommendation } from '@/components/evaluation/final-recommendation';
import { ExportButtons } from '@/components/evaluation/export-buttons';

const TRIAGE_STEPS = [
  { id: 1, name: 'Upload', icon: Upload, description: 'Upload company documents' },
  { id: 2, name: 'Data Extraction', icon: FileSearch, description: 'Extract data from documents' },
  { id: 3, name: 'Company Info', icon: Building2, description: 'Basic company details' },
  { id: 4, name: 'Data Input', icon: ClipboardList, description: 'Pitch summary & key metrics' },
  { id: 5, name: 'External Data', icon: Database, description: 'Fetch external sources' },
  { id: 6, name: 'Modules', icon: Layers, description: 'Select analysis modules' },
  { id: 7, name: 'Report Sections', icon: Settings, description: 'Configure report sections' },
  { id: 9, name: 'Generate', icon: BrainCircuit, description: 'Run triage analysis' },
  { id: 10, name: 'What-If Simulation', icon: SlidersHorizontal, description: 'Simple manual score simulation' },
  { id: 11, name: 'Preview Report', icon: Eye, description: 'Review analysis results' },
  { id: 12, name: 'Storage & Export', icon: Download, description: 'Save & download report' },
  { id: 13, name: 'Report Complete', icon: CheckCircle2, description: 'Analysis complete' },
  { id: 14, name: 'Prior Results', icon: LineChart, description: 'Previous report results' },
  { id: 15, name: 'Run Review', icon: UserCheck, description: 'Analysis run review' },
];

const EXTERNAL_SOURCES = externalSourcesConfig
  .filter((s: { requirementGroup?: string }) => s.requirementGroup === 'A' || s.requirementGroup === 'B')
  .map((s: { id: string; name: string; description: string; pricing: string }) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    free: s.pricing === 'Free' || s.pricing === 'Freemium',
  }));

const TRIAGE_MODULES = [
  { id: 'tca', name: 'TCA Scorecard', description: 'Core 12-category investment scoring', icon: Target, required: true, weight: MODULE_WEIGHT_MAP.tca },
  { id: 'risk', name: 'Risk Flags', description: '14-domain risk flag assessment', icon: Shield, required: true, weight: MODULE_WEIGHT_MAP.risk },
  { id: 'growth', name: 'Growth Classifier', description: 'Revenue trajectory and growth tier', icon: TrendingUp, required: false, weight: MODULE_WEIGHT_MAP.growth },
  { id: 'macro', name: 'Macro Trend Alignment', description: 'PESTEL market context analysis', icon: BarChart3, required: false, weight: MODULE_WEIGHT_MAP.macro },
  { id: 'benchmark', name: 'Benchmark Comparison', description: 'Industry peer benchmarking', icon: Layers, required: false, weight: MODULE_WEIGHT_MAP.benchmark },
  { id: 'team', name: 'Team Assessment', description: 'Founder & team quality signals', icon: Users, required: false, weight: MODULE_WEIGHT_MAP.team },
  { id: 'analyst', name: 'Analyst Report', description: 'Human analyst scoring and commentary', icon: FileSearch, required: false, weight: MODULE_WEIGHT_MAP.analyst },
  { id: 'funder', name: 'Funder Analysis', description: 'Investment readiness and funder matching', icon: DollarSign, required: false, weight: MODULE_WEIGHT_MAP.funder },
  { id: 'gap', name: 'Gap Analysis', description: 'Performance gaps and improvement roadmap', icon: Activity, required: false, weight: MODULE_WEIGHT_MAP.gap },
  { id: 'strategic', name: 'Strategic Analysis', description: 'Competitive positioning and moat strength', icon: Briefcase, required: false, weight: MODULE_WEIGHT_MAP.strategic },
  { id: 'economic', name: 'Economic Analysis', description: 'Market size and macro-economic indicators', icon: LineChart, required: false, weight: MODULE_WEIGHT_MAP.economic },
  { id: 'financial', name: 'Financial Analysis', description: 'Revenue model, burn rate and projections', icon: BarChart3, required: false, weight: MODULE_WEIGHT_MAP.financial },
  { id: 'environmental', name: 'Environmental Analysis', description: 'ESG alignment and climate risk', icon: Globe, required: false, weight: MODULE_WEIGHT_MAP.environmental },
  { id: 'marketing', name: 'Marketing Analysis', description: 'Brand positioning and GTM execution', icon: Zap, required: false, weight: MODULE_WEIGHT_MAP.marketing },
  { id: 'social', name: 'Social Impact Analysis', description: 'ESG scoring and social impact metrics', icon: Users, required: false, weight: MODULE_WEIGHT_MAP.social },
  { id: 'founderFit', name: 'Founder Fit', description: 'Founder background and team capabilities', icon: UserCheck, required: false, weight: MODULE_WEIGHT_MAP.founderFit },
  { id: 'strategicFit', name: 'Strategic Fit', description: 'Alignment with investor thesis and portfolio', icon: BrainCircuit, required: false, weight: MODULE_WEIGHT_MAP.strategicFit },
];

const REQUIRED_MODULE_IDS = TRIAGE_MODULES.filter((m) => m.required).map((m) => m.id);

const DEFAULT_ANALYSIS_MODULE_IDS = [
  'tca',
  'risk',
  'macro',
  'team',
  'benchmark',
  'growth',
  'gap',
  'financial',
  'economic',
  'social',
  'marketing',
  'environmental',
  'funder',
  'strategic',
];

const DEFAULT_WHAT_IF_SCORE = 0;
const TRIAGE_AUTOSAVE_KEY = 'triage-wizard-autosave-v1';

const MODULE_FORMULA_MAP: Record<string, string> = Object.fromEntries(
  RAW_MODULE_CONFIG.map((config) => [config.id, config.formula])
);

const getDefaultWhatIfScores = (sourceScores?: Record<string, number | null>): Record<string, number> =>
  Object.fromEntries(
    TRIAGE_MODULES.map((m) => {
      const source = sourceScores?.[m.id];
      const normalized = typeof source === 'number' && Number.isFinite(source)
        ? Math.max(0, Math.min(10, source))
        : DEFAULT_WHAT_IF_SCORE;
      return [m.id, normalized];
    })
  );

const getDefaultSelectedModulesForRole = (_role: 'admin' | 'analyst' | 'standard'): string[] =>
  TRIAGE_MODULES
    .map((m) => m.id)
    .filter((id) => DEFAULT_ANALYSIS_MODULE_IDS.includes(id));

const clampScoreToTen = (score: number): number => Math.max(0, Math.min(10, score));

const clampToOneToTen = (score: number): number => Math.max(1, Math.min(10, score));

const getOutcomeLabel = (score: number): 'Advanced Screening / DD' | 'Prescreening' | 'Early Stage' | 'Reject' => {
  if (score >= 8.5) return 'Advanced Screening / DD';
  if (score >= 7) return 'Prescreening';
  if (score >= 5) return 'Early Stage';
  return 'Reject';
};

const getOutcomeTone = (score: number): 'green' | 'yellow' | 'orange' | 'red' => {
  if (score >= 8.5) return 'green';
  if (score >= 7) return 'yellow';
  if (score >= 5) return 'orange';
  return 'red';
};

const getOutcomeTextClass = (score: number): string => {
  const tone = getOutcomeTone(score);
  if (tone === 'green') return 'text-green-600';
  if (tone === 'yellow') return 'text-yellow-600';
  if (tone === 'orange') return 'text-orange-600';
  return 'text-red-600';
};

const getOutcomeBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
  const tone = getOutcomeTone(score);
  return tone === 'green' ? 'default' : tone === 'red' ? 'destructive' : 'secondary';
};

const averageNonNull = (values: Array<number | null | undefined>): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
};

const weightedAverageNonNull = (
  values: Array<{ value: number | null | undefined; weight: number }>
): number | null => {
  const valid = values.filter(
    (item): item is { value: number; weight: number } =>
      typeof item.value === 'number' && Number.isFinite(item.value) && item.weight > 0
  );
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;
  const weightedSum = valid.reduce((sum, item) => sum + (item.value * item.weight), 0);
  return weightedSum / totalWeight;
};

const normalizeConfidence = (value: number | null): number | null => {
  if (value === null || !Number.isFinite(value)) return null;
  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeModuleScore = (raw: number | null): number | null => {
  if (raw === null) return null;
  return clampToOneToTen(raw > 10 ? raw / 10 : raw);
};

const getConfidenceModifier = (confidence: number | null): number => {
  if (confidence === null) return 0.92;
  return 0.88 + (confidence * 0.12);
};

const getRiskModifier = (riskPenalty: number): number => {
  const boundedPenalty = Math.max(0, Math.min(0.35, riskPenalty * 0.12));
  return 1 - boundedPenalty;
};

const getTrendModifier = (macroTrendScore: number | null): number => {
  if (macroTrendScore === null) return 1;
  if (macroTrendScore >= 9) return 1.05;
  if (macroTrendScore >= 8) return 1.03;
  if (macroTrendScore >= 6) return 1;
  if (macroTrendScore >= 4) return 0.97;
  return 0.95;
};

const composeModuleScore = (
  baseScore: number | null,
  _confidence: number | null,
  _riskPenalty: number,
  _macroTrendScore: number | null
): number | null => {
  if (baseScore === null) return null;
  return clampToOneToTen(baseScore);
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const deriveRiskScore = (analysisData: Record<string, unknown>): number | null => {
  const riskData = analysisData.riskData as { riskFlags?: Array<{ flag?: string }> } | undefined;
  const flags = Array.isArray(riskData?.riskFlags) ? riskData.riskFlags : [];
  if (flags.length === 0) return null;

  const flagToScore: Record<string, number> = {
    green: 9,
    yellow: 6,
    red: 3,
  };

  const scores = flags
    .map((f) => flagToScore[(f.flag || '').toLowerCase()])
    .filter((s): s is number => Number.isFinite(s));

  const avg = average(scores);
  if (avg === null) return null;

  const redCount = flags.filter((f) => (f.flag || '').toLowerCase() === 'red').length;
  const redRatioPenalty = (redCount / Math.max(1, flags.length)) * 2.5;
  return clampToOneToTen(avg - redRatioPenalty);
};

const getRiskSeverityPenalty = (analysisData: Record<string, unknown>): number => {
  const riskData = analysisData.riskData as { riskFlags?: Array<{ flag?: string }> } | undefined;
  const flags = Array.isArray(riskData?.riskFlags) ? riskData.riskFlags : [];
  if (flags.length === 0) return 0;

  const red = flags.filter((f) => (f.flag || '').toLowerCase() === 'red').length;
  const yellow = flags.filter((f) => (f.flag || '').toLowerCase() === 'yellow').length;
  return (red * 0.25) + (yellow * 0.08);
};

const getRiskDomainScore = (analysisData: Record<string, unknown>, domainKeywords: string[]): number | null => {
  const riskData = analysisData.riskData as { riskFlags?: Array<{ domain?: string; flag?: string }> } | undefined;
  const flags = Array.isArray(riskData?.riskFlags) ? riskData.riskFlags : [];
  if (flags.length === 0) return null;

  const matches = flags.filter((f) => {
    const domain = (f.domain || '').toLowerCase();
    return domainKeywords.some((k) => domain.includes(k));
  });
  if (matches.length === 0) return null;

  const flagToScore: Record<string, number> = { green: 9, yellow: 6, red: 3 };
  const avg = average(
    matches
      .map((m) => flagToScore[(m.flag || '').toLowerCase()])
      .filter((score): score is number => Number.isFinite(score))
  );
  return avg === null ? null : clampToOneToTen(avg);
};

const getTcaCategoryScore = (
  tcaData: { categories?: Array<{ category?: string; rawScore?: number }> } | undefined,
  categoryKeywords: string[]
): number | null => {
  const categories = Array.isArray(tcaData?.categories) ? tcaData.categories : [];
  const matches = categories
    .filter((c) => {
      const name = (c.category || '').toLowerCase();
      return categoryKeywords.some((k) => name.includes(k));
    })
    .map((c) => normalizeModuleScore(toNumberOrNull(c.rawScore)))
    .filter((s): s is number => s !== null);

  const avg = average(matches);
  return avg === null ? null : clampToOneToTen(avg);
};

const estimateDataCompleteness = (analysisData: Record<string, unknown>): number => {
  const keyBlocks = [
    analysisData.tcaData,
    analysisData.riskData,
    analysisData.macroData,
    analysisData.benchmarkData,
    analysisData.growthData,
    analysisData.teamData,
    analysisData.founderFitData,
    analysisData.gapData,
    analysisData.strategicFitData,
  ];
  const available = keyBlocks.filter((x) => x !== null && x !== undefined).length;
  return available / keyBlocks.length;
};

const deriveModuleScore = (moduleId: string, analysisResult: unknown): number | null => {
  const data = (analysisResult || {}) as Record<string, unknown>;
  const tcaData = data.tcaData as {
    compositeScore?: number;
    overallScore?: number;
    categories?: Array<{ category?: string; rawScore?: number }>;
  } | undefined;
  const macroData = data.macroData as { pestelDashboard?: Record<string, number>; trendOverlayScore?: number } | undefined;
  const benchmarkData = data.benchmarkData as {
    benchmarkOverlay?: Array<{ score?: number; percentile?: number }>;
  } | undefined;
  const growthData = data.growthData as { tier?: number; confidence?: number } | undefined;
  const founderFitData = data.founderFitData as { readinessScore?: number } | undefined;
  const teamData = data.teamData as { teamScore?: number } | undefined;
  const gapData = data.gapData as { heatmap?: Array<{ gap?: number; priority?: string }> } | undefined;
  const strategicFitData = data.strategicFitData;
  const tcaCategories = Array.isArray(tcaData?.categories) ? tcaData.categories : [];
  const hasFlatTcaBaseline = tcaCategories.length >= 10
    && tcaCategories.every((c) => {
      const raw = toNumberOrNull(c.rawScore);
      return raw !== null && Math.abs(raw - 5) < 0.001;
    });

  const tcaLegacyScore = normalizeModuleScore(toNumberOrNull(tcaData?.compositeScore) ?? toNumberOrNull(tcaData?.overallScore));
  const riskScore = deriveRiskScore(data);
  const riskPenalty = getRiskSeverityPenalty(data);
  const globalConfidence = estimateDataCompleteness(data);
  const confidenceBand = globalConfidence >= 0.8 ? 'high' : globalConfidence >= 0.6 ? 'medium' : 'low';

  const marketOpportunity = getTcaCategoryScore(tcaData, ['market opportunity', 'market potential']);
  const problemSolutionFit = getTcaCategoryScore(tcaData, ['problem', 'solution fit', 'product-market fit', 'pmf']);
  const productTechnology = getTcaCategoryScore(tcaData, ['product', 'technology', 'tech']);
  const businessModel = getTcaCategoryScore(tcaData, ['business model']);
  const competitiveAdvantage = getTcaCategoryScore(tcaData, ['competitive advantage', 'competition', 'moat']);
  const teamFounderFit = getTcaCategoryScore(tcaData, ['team', 'founder', 'leadership']);
  const financialHealth = getTcaCategoryScore(tcaData, ['financial', 'financial health', 'financial viability']);
  const gtmStrategy = getTcaCategoryScore(tcaData, ['go-to-market', 'gtm', 'marketing']);
  const tractionValidation = getTcaCategoryScore(tcaData, ['traction', 'validation']);
  const riskCompliance = getTcaCategoryScore(tcaData, ['risk', 'compliance']);
  const strategicMacroAlignment = getTcaCategoryScore(tcaData, ['strategic', 'macro']);
  const growthPotential = getTcaCategoryScore(tcaData, ['growth potential', 'scalability', 'exit']);

  const tca12Composite = weightedAverageNonNull([
    { value: marketOpportunity, weight: 0.15 },
    { value: problemSolutionFit, weight: 0.1 },
    { value: productTechnology, weight: 0.1 },
    { value: businessModel, weight: 0.09 },
    { value: competitiveAdvantage, weight: 0.08 },
    { value: teamFounderFit, weight: 0.14 },
    { value: financialHealth, weight: 0.1 },
    { value: gtmStrategy, weight: 0.08 },
    { value: tractionValidation, weight: 0.11 },
    { value: riskCompliance, weight: 0.06 },
    { value: strategicMacroAlignment, weight: 0.05 },
    { value: growthPotential, weight: 0.04 },
  ]);
  const tcaScore = normalizeModuleScore(hasFlatTcaBaseline ? null : (tca12Composite ?? tcaLegacyScore));

  const pestelValues = Object.values(macroData?.pestelDashboard ?? {})
    .map((v) => toNumberOrNull(v))
    .filter((v): v is number => v !== null);
  const macroAvg = average(pestelValues);
  const sectorHint = String(
    (data as { sector?: string }).sector
    ?? ((data as { companyData?: { sector?: string } }).companyData?.sector)
    ?? ''
  );
  const macroSector = inferMacroSector(sectorHint);
  const macroFromFramework = computeMacroCompositeScore(
    {
      political: toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.political),
      economic: toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.economic),
      social: toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.social),
      technological: toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.technological),
      environmental: toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.environmental),
      legal: toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.legal),
    },
    macroSector,
    confidenceBand
  );
  const trendOverlay = toNumberOrNull(macroData?.trendOverlayScore);
  const trendBoost = trendOverlay === null ? 0 : trendOverlay * 20;
  const macroLegacy = macroAvg === null ? null : normalizeModuleScore(macroAvg + trendBoost);
  const macroScore = averageNonNull([macroLegacy, macroFromFramework]);

  const environmentalMacro = normalizeModuleScore(toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.environmental));
  const socialMacro = normalizeModuleScore(toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.social));
  const economicMacro = normalizeModuleScore(toNumberOrNull((macroData?.pestelDashboard as Record<string, unknown> | undefined)?.economic));

  const benchmarkValues = (benchmarkData?.benchmarkOverlay ?? [])
    .map((item) => {
      const scorePart = normalizeModuleScore(toNumberOrNull(item.score));
      const percentilePart = normalizeModuleScore(toNumberOrNull(item.percentile));
      return averageNonNull([scorePart, percentilePart]);
    })
    .filter((v): v is number => v !== null);
  const benchmarkScore = computeBenchmarkCompositeScore(benchmarkValues, null, null, confidenceBand)
    ?? normalizeModuleScore(average(benchmarkValues));

  const growthTier = toNumberOrNull(growthData?.tier);
  const growthConfidence = normalizeConfidence(toNumberOrNull(growthData?.confidence));
  let growthScore: number | null = null;
  if (growthTier !== null) {
    const tierScore = growthTier <= 5
      ? ({ 1: 3.5, 2: 5.2, 3: 7.0, 4: 8.4, 5: 9.3 } as Record<number, number>)[Math.round(growthTier)] ?? 6
      : growthTier > 10 ? growthTier / 10 : growthTier;
    growthScore = normalizeModuleScore(tierScore);
  }

  const founderScore = normalizeModuleScore(toNumberOrNull(founderFitData?.readinessScore));
  const teamScore = normalizeModuleScore(toNumberOrNull(teamData?.teamScore));

  const gapValues = (gapData?.heatmap ?? [])
    .map((item) => toNumberOrNull(item.gap))
    .filter((v): v is number => v !== null);
  const avgGap = average(gapValues);
  const highPriorityCount = (gapData?.heatmap ?? []).filter((item) => (item.priority || '').toLowerCase() === 'high').length;
  const gapPenalty = highPriorityCount * 0.2;
  const gapScore = avgGap === null ? null : clampToOneToTen((10 - (avgGap / 10)) - gapPenalty);

  const strategicScore = strategicFitData
    ? averageNonNull([competitiveAdvantage, strategicMacroAlignment, benchmarkScore, tcaScore])
    : null;

  const environmentRisk = getRiskDomainScore(data, ['environment', 'esg']);
  const socialRisk = getRiskDomainScore(data, ['ethical', 'societal', 'adoption', 'retention', 'social']);
  const regulatoryRisk = getRiskDomainScore(data, ['regulatory', 'compliance', 'legal']);
  const financialRiskDomain = getRiskDomainScore(data, ['financial', 'burn', 'runway']);
  const marketRiskDomain = getRiskDomainScore(data, ['market', 'adoption', 'retention', 'gtm']);
  const technicalRiskDomain = getRiskDomainScore(data, ['technical', 'technology', 'security', 'cyber']);

  const macroSignal = averageNonNull([macroScore, strategicMacroAlignment]);

  const growthRawSignal = computeGrowthRawSignal({
    revenueGrowth: growthScore,
    marketScalability: marketOpportunity,
    productScalability: growthPotential,
    tractionVelocity: tractionValidation,
    teamExecution: teamScore,
    gtmReadiness: gtmStrategy,
    strategicTiming: macroSignal,
  });

  const growthBoosts =
    (typeof tractionValidation === 'number' && tractionValidation >= 8 ? 4 : 0)
    + (typeof teamScore === 'number' && teamScore >= 8 ? 3 : 0);
  const growthPenalties =
    (typeof tractionValidation === 'number' && tractionValidation < 5 ? 10 : 0)
    + (typeof financialHealth === 'number' && financialHealth < 5.5 ? 5 : 0)
    + (typeof founderScore === 'number' && founderScore < 5.5 ? 5 : 0)
    + (riskPenalty * 3);

  const toGrowthPrediction = (value: number | null): number =>
    value === null ? 0 : Math.max(0, Math.min(100, value * 10));

  const growthResult = computeGrowthClassifierResult({
    modelPredictions: {
      linear: toGrowthPrediction(averageNonNull([financialHealth, businessModel, tractionValidation])),
      tree: toGrowthPrediction(averageNonNull([riskScore, riskCompliance, regulatoryRisk])),
      rf: toGrowthPrediction(averageNonNull([growthPotential, macroSignal, tca12Composite])),
      xgb: toGrowthPrediction(averageNonNull([benchmarkScore, competitiveAdvantage, marketOpportunity])),
      lstm: toGrowthPrediction(averageNonNull([growthScore, tractionValidation, economicMacro])),
      heuristic: toGrowthPrediction(growthRawSignal),
    },
    modelQuality: {
      linear: { cc: globalConfidence, kk: globalConfidence, rr: globalConfidence, pp: globalConfidence, ee: 0.78, ss: 0.8, tt: 0.85, aa: 0.82 },
      tree: { cc: globalConfidence, kk: globalConfidence, rr: globalConfidence, pp: globalConfidence, ee: 0.82, ss: 0.78, tt: 0.82, aa: 0.8 },
      rf: { cc: globalConfidence, kk: globalConfidence, rr: globalConfidence, pp: globalConfidence, ee: 0.76, ss: 0.84, tt: 0.83, aa: 0.85 },
      xgb: { cc: globalConfidence, kk: globalConfidence, rr: globalConfidence, pp: globalConfidence, ee: 0.74, ss: 0.86, tt: 0.86, aa: 0.87 },
      lstm: { cc: growthConfidence ?? globalConfidence, kk: globalConfidence, rr: globalConfidence, pp: globalConfidence, ee: 0.7, ss: 0.82, tt: 0.88, aa: 0.83 },
      heuristic: { cc: globalConfidence, kk: globalConfidence, rr: globalConfidence, pp: globalConfidence, ee: 0.9, ss: 0.75, tt: 0.9, aa: 0.86 },
    },
    alpha: 0.7,
    growthBoosts,
    riskPenalties: growthPenalties,
  });

  const sectorGapWeight = macroSector === 'medtech' || macroSector === 'biotech'
    ? { regulatory: 1.4, ip: 1.3, product: 1.1, gtm: 0.95, traction: 0.95, team: 1.05, financial: 1.1 }
    : { regulatory: 0.9, ip: 1.05, product: 1.2, gtm: 1.2, traction: 1.2, team: 1.05, financial: 1.1 };

  const gapInputs = [
    {
      category: 'Product & Technology',
      actualScore: productTechnology,
      targetScore: macroSector === 'medtech' || macroSector === 'biotech' ? 8.8 : 8.5,
      categoryWeight: 0.14,
      sectorGapWeight: sectorGapWeight.product,
    },
    {
      category: 'Go-To-Market Strategy',
      actualScore: gtmStrategy,
      targetScore: macroSector === 'medtech' || macroSector === 'biotech' ? 7.8 : 8.5,
      categoryWeight: 0.1,
      sectorGapWeight: sectorGapWeight.gtm,
    },
    {
      category: 'Traction & Adoption',
      actualScore: tractionValidation,
      targetScore: 8.2,
      categoryWeight: 0.12,
      sectorGapWeight: sectorGapWeight.traction,
    },
    {
      category: 'Financial Viability',
      actualScore: financialHealth,
      targetScore: 8.0,
      categoryWeight: 0.1,
      sectorGapWeight: sectorGapWeight.financial,
    },
    {
      category: 'Team & Execution',
      actualScore: averageNonNull([teamScore, founderScore]),
      targetScore: 8.2,
      categoryWeight: 0.1,
      sectorGapWeight: sectorGapWeight.team,
    },
    {
      category: 'Regulatory / Compliance',
      actualScore: averageNonNull([riskCompliance, regulatoryRisk]),
      targetScore: macroSector === 'medtech' || macroSector === 'biotech' ? 9.0 : 7.5,
      categoryWeight: 0.08,
      sectorGapWeight: sectorGapWeight.regulatory,
    },
    {
      category: 'IP & Defensibility',
      actualScore: competitiveAdvantage,
      targetScore: macroSector === 'medtech' || macroSector === 'biotech' ? 8.8 : 8.0,
      categoryWeight: 0.08,
      sectorGapWeight: sectorGapWeight.ip,
    },
  ].filter((item): item is {
    category: string;
    actualScore: number;
    targetScore: number;
    categoryWeight: number;
    sectorGapWeight: number;
  } => typeof item.actualScore === 'number' && Number.isFinite(item.actualScore));

  const gapResult = gapInputs.length > 0 ? computeGapAnalysisResult(gapInputs) : null;

  const funderInputs = {
    stageFit: growthPotential,
    checkFit: averageNonNull([financialHealth, businessModel]),
    sectorFit: averageNonNull([benchmarkScore, competitiveAdvantage]),
    geoFit: averageNonNull([marketOpportunity, macroScore]),
    thesisFit: averageNonNull([strategicScore, strategicMacroAlignment]),
  };
  const hasAllFunderInputs = Object.values(funderInputs).every((v) => typeof v === 'number' && Number.isFinite(v));
  const funderResult = hasAllFunderInputs
    ? computeFunderFitScore({
      sector: macroSector,
      stageFit: (funderInputs.stageFit as number) * 10,
      checkFit: (funderInputs.checkFit as number) * 10,
      sectorFit: (funderInputs.sectorFit as number) * 10,
      geoFit: (funderInputs.geoFit as number) * 10,
      thesisFit: (funderInputs.thesisFit as number) * 10,
    })
    : null;

  const financialResult = computeFinancialModuleResult({
    revenueModel: averageNonNull([businessModel, gtmStrategy, tractionValidation]),
    unitEconomics: averageNonNull([financialHealth, benchmarkScore, tractionValidation]),
    financialProjections: averageNonNull([strategicScore, marketOpportunity, growthScore]),
    fundingRequirements: averageNonNull([financialHealth, founderScore, strategicScore]),
    confidence: confidenceBand,
    penalty: riskPenalty,
    burnMultiple: toNumberOrNull((data as { financialData?: { burnMultiple?: number; burn_multiple?: number } }).financialData?.burnMultiple)
      ?? toNumberOrNull((data as { financialData?: { burnMultiple?: number; burn_multiple?: number } }).financialData?.burn_multiple),
    runwayMonths: toNumberOrNull((data as { financialData?: { runwayMonths?: number; runway_months?: number } }).financialData?.runwayMonths)
      ?? toNumberOrNull((data as { financialData?: { runwayMonths?: number; runway_months?: number } }).financialData?.runway_months),
    milestoneMappingScore: averageNonNull([strategicScore, founderScore]),
  });

  const economicResult = computeEconomicModuleResult({
    industryStructure: averageNonNull([marketOpportunity, benchmarkScore, competitiveAdvantage]),
    pricingPower: averageNonNull([businessModel, competitiveAdvantage, financialHealth]),
    macroIndicators: averageNonNull([economicMacro, macroScore, strategicMacroAlignment]),
    cycleResilience: averageNonNull([financialHealth, growthPotential, riskScore]),
    confidence: confidenceBand,
    penalty: riskPenalty * 0.6,
    recessionSensitive: (marketRiskDomain ?? 10) < 5,
    burnHighWithMacroWeak: (financialRiskDomain ?? 10) < 5.5 && (economicMacro ?? 10) < 5.5,
  });

  const socialResult = computeSocialModuleResult({
    socialImpact: averageNonNull([socialMacro, strategicMacroAlignment, growthPotential]),
    demographicFit: averageNonNull([marketOpportunity, benchmarkScore, gtmStrategy]),
    culturalAdoption: averageNonNull([gtmStrategy, tractionValidation, teamScore]),
    stakeholderTrust: averageNonNull([teamFounderFit, founderScore, riskScore]),
    confidence: confidenceBand,
    penalty: riskPenalty * 0.5,
    adoptionResistanceHigh: (socialRisk ?? 10) < 5,
    backlashRiskDetected: (socialRisk ?? 10) < 4.5,
  });

  const marketingResult = computeMarketingModuleResult({
    positioning: averageNonNull([strategicScore, businessModel, competitiveAdvantage]),
    digitalPresence: averageNonNull([tractionValidation, benchmarkScore, growthScore]),
    spendEfficiency: averageNonNull([financialHealth, benchmarkScore, tractionValidation]),
    gtmExecution: averageNonNull([gtmStrategy, tractionValidation, teamScore]),
    confidence: confidenceBand,
    penalty: riskPenalty * 0.7,
    cacWorsening: (financialRiskDomain ?? 10) < 5.2,
    churnHigh: (marketRiskDomain ?? 10) < 5,
    burnHighWithWeakDigital: (financialRiskDomain ?? 10) < 5.5 && (benchmarkScore ?? 10) < 5.5,
  });

  const environmentalResult = computeEnvironmentalModuleResult({
    environmentalImpact: averageNonNull([environmentalMacro, strategicMacroAlignment, riskScore]),
    climateRisk: averageNonNull([environmentalMacro, macroScore, riskCompliance]),
    certification: averageNonNull([strategicScore, benchmarkScore, teamScore]),
    esgAlignment: averageNonNull([environmentalMacro, socialMacro, strategicMacroAlignment]),
    confidence: confidenceBand,
    penalty: riskPenalty * 0.4,
    institutionalFundingTarget: true,
    sustainabilityClaimsUnverified: (environmentRisk ?? 10) < 5.5,
  });

  const founderFitResult = computeFounderFitModuleResult({
    vision: averageNonNull([strategicScore, competitiveAdvantage, strategicMacroAlignment]),
    passion: averageNonNull([founderScore, teamFounderFit]),
    domainExpertise: averageNonNull([founderScore, teamScore, benchmarkScore]),
    leadership: averageNonNull([teamFounderFit, teamScore, founderScore]),
    execution: averageNonNull([tractionValidation, gtmStrategy, teamScore]),
    investorReadiness: averageNonNull([founderScore, financialHealth, businessModel]),
    credibility: averageNonNull([founderScore, teamScore, riskCompliance]),
    confidence: confidenceBand,
    penalty: riskPenalty * 0.5,
    readinessScoreOverride: founderScore,
  });

  const strategicResult = computeStrategicModuleResult({
    longTermMoat: averageNonNull([competitiveAdvantage, strategicScore, benchmarkScore]),
    expansionStrategy: averageNonNull([growthPotential, marketOpportunity, strategicScore]),
    platformPotential: averageNonNull([productTechnology, growthPotential, competitiveAdvantage]),
    defensibility: averageNonNull([competitiveAdvantage, riskCompliance, strategicScore]),
    competitiveDurability: averageNonNull([benchmarkScore, competitiveAdvantage, marketOpportunity]),
    strategicTiming: averageNonNull([macroSignal, strategicMacroAlignment, growthScore]),
    confidence: confidenceBand,
    penalty: riskPenalty * 0.5,
  });

  const strategicFitResult = computeStrategicFitModuleResult({
    investorAlignment: averageNonNull([strategicScore, tca12Composite, founderScore]),
    corporateSynergy: averageNonNull([benchmarkScore, competitiveAdvantage, strategicScore]),
    marketTiming: averageNonNull([macroSignal, growthScore, tractionValidation]),
    geographicFit: averageNonNull([macroScore, marketOpportunity, strategicMacroAlignment]),
    ecosystemFit: averageNonNull([benchmarkScore, competitiveAdvantage, tca12Composite]),
    acquisitionPotential: averageNonNull([growthPotential, competitiveAdvantage, founderScore]),
    confidence: confidenceBand,
    penalty: riskPenalty * 0.4,
  });

  const analystResult = computeAnalystSynthesisResult({
    tcaComposite: tca12Composite,
    riskScore,
    benchmarkScore,
    macroScore,
    teamScore,
    founderScore,
    growthScore,
    confidence: confidenceBand,
    penalty: riskPenalty * 0.3,
  });

  switch (moduleId) {
    case 'tca':
      return composeModuleScore(
        tcaScore,
        globalConfidence,
        riskPenalty,
        macroSignal
      );
    case 'risk':
      return composeModuleScore(
        weightedAverageNonNull([
          { value: riskScore, weight: 0.5 },
          { value: regulatoryRisk, weight: 0.2 },
          { value: financialRiskDomain, weight: 0.15 },
          { value: technicalRiskDomain, weight: 0.15 },
        ]),
        globalConfidence,
        riskPenalty * 1.25,
        macroSignal
      );
    case 'growth':
      return composeModuleScore(
        growthResult.growthModuleScore,
        growthConfidence ?? globalConfidence,
        riskPenalty,
        macroSignal
      );
    case 'macro':
      return composeModuleScore(
        weightedAverageNonNull([
          { value: macroScore, weight: 0.75 },
          { value: strategicMacroAlignment, weight: 0.25 },
        ]),
        globalConfidence,
        riskPenalty * 0.7,
        macroSignal
      );
    case 'benchmark':
      return composeModuleScore(
        weightedAverageNonNull([
          { value: benchmarkScore, weight: 0.5 },
          { value: competitiveAdvantage, weight: 0.25 },
          { value: tractionValidation, weight: 0.25 },
        ]),
        globalConfidence,
        riskPenalty * 0.8,
        macroSignal
      );
    case 'team':
      return composeModuleScore(
        weightedAverageNonNull([
          { value: teamScore, weight: 0.4 },
          { value: founderScore, weight: 0.25 },
          { value: teamFounderFit, weight: 0.35 },
        ]),
        globalConfidence,
        riskPenalty,
        macroSignal
      );
    case 'founderFit':
      return composeModuleScore(founderFitResult.finalScore, globalConfidence, riskPenalty * 0.5, macroSignal);
    case 'analyst':
      return composeModuleScore(analystResult.finalScore, globalConfidence, riskPenalty * 0.3, macroSignal);
    case 'funder':
      return composeModuleScore(
        funderResult?.moduleScore ?? null,
        globalConfidence,
        riskPenalty,
        macroSignal
      );
    case 'financial':
      return composeModuleScore(financialResult.finalScore, globalConfidence, riskPenalty * 0.6, macroSignal);
    case 'gap':
      return composeModuleScore(gapResult?.moduleScore ?? gapScore, globalConfidence, riskPenalty, macroSignal);
    case 'strategic':
      return composeModuleScore(strategicResult.finalScore, globalConfidence, riskPenalty * 0.5, macroSignal);
    case 'economic':
      return composeModuleScore(economicResult.finalScore, globalConfidence, riskPenalty * 0.5, macroSignal);
    case 'environmental':
      return composeModuleScore(environmentalResult.finalScore, globalConfidence, riskPenalty * 0.3, macroSignal);
    case 'marketing':
      return composeModuleScore(marketingResult.finalScore, globalConfidence, riskPenalty * 0.4, macroSignal);
    case 'social':
      return composeModuleScore(socialResult.finalScore, globalConfidence, riskPenalty * 0.3, macroSignal);
    case 'strategicFit':
      return composeModuleScore(strategicFitResult.finalScore, globalConfidence, riskPenalty * 0.4, macroSignal
      );
    default:
      return null;
  }
};

const computeWeightedCompositeScore = (
  selectedModules: string[],
  moduleScores: Record<string, number | null>
): number | null => {
  const active = TRIAGE_MODULES
    .filter((module) => selectedModules.includes(module.id))
    .map((module) => ({ ...module, score: moduleScores[module.id] }))
    .filter((module): module is (typeof TRIAGE_MODULES)[number] & { score: number } => module.score !== null);

  if (active.length === 0) return null;

  const totalWeight = active.reduce((sum, module) => sum + module.weight, 0);
  if (totalWeight <= 0) return null;

  const weighted = active.reduce((sum, module) => sum + (module.score * module.weight), 0) / totalWeight;
  return clampScoreToTen(weighted);
};

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
const STANDARD_RESTRICTED_STEP_IDS = [5, 6, 7, 10];

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

const extractDomainCompanyName = (websiteOrDomain: string): string => {
  const raw = cleanShortText(websiteOrDomain).toLowerCase();
  if (!raw) return '';
  const withoutProtocol = raw.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const host = withoutProtocol.split('/')[0] ?? '';
  const root = host.split('.')[0] ?? '';
  if (!root || root.length < 2) return '';
  const cleaned = root.replace(/[-_]+/g, ' ').replace(/\d+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();
};

const scoreCompanyNameCandidate = (candidate: string): number => {
  const c = cleanCompanyName(candidate);
  if (!c) return -100;
  let score = 0;
  const words = c.split(/\s+/).filter(Boolean);
  if (words.length >= 1 && words.length <= 4) score += 4;
  if (c.length >= 3 && c.length <= 36) score += 3;
  if (/^(the|a|an)\s/i.test(c)) score -= 1;
  if (/(inc|llc|ltd|corp|company|technologies|technology|solutions)$/i.test(c)) score += 1;
  if (/(startup|platform|solution|business|market|industry|company\s+description|overview)/i.test(c)) score -= 3;
  if (/[,:;.!?]/.test(c)) score -= 3;
  if (c.split(/\s+/).length > 5) score -= 3;
  return score;
};

const resolveBestCompanyName = (input: {
  aiCandidate?: string;
  legalName?: string;
  website?: string;
  fromText?: string;
  existing?: string;
}): string => {
  const candidates = [
    cleanCompanyName(input.legalName),
    cleanCompanyName(input.aiCandidate),
    cleanCompanyName(input.fromText),
    cleanCompanyName(extractDomainCompanyName(input.website || '')),
    cleanCompanyName(input.existing),
  ].filter(Boolean);

  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreCompanyNameCandidate(candidate) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.candidate ?? '';
};

const inferCompanyNameFromText = (text: string): string => {
  const domainMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]{2,})\.(?:com|io|ai|co|net|org|tech|app|vc|finance|health|bio)\b/i);
  const emailDomainMatch = text.match(/[a-z0-9._%+-]+@([a-z0-9-]{2,})\.(?:com|io|ai|co|net|org|tech|app|vc|finance|health|bio)\b/i);
  const fromDomain = cleanCompanyName(extractDomainCompanyName(domainMatch?.[0] ?? emailDomainMatch?.[1] ?? ''));
  if (fromDomain && scoreCompanyNameCandidate(fromDomain) >= 3) return fromDomain;

  const patterns: RegExp[] = [
    /(?:company|startup|organization|legal)\s*(?:name)?\s*[:\-]\s*([^\n]{2,100})/i,
    /(?:our\s+company|business\s+name|issuer|entity)\s*[:\-]\s*([^\n]{2,100})/i,
    /\b([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})\s*,\s*(?:[A-Z][a-z]+ing\b[^\n]*)/,
    /(?:^|\n)\s*([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})\s*(?:\n|$)/m,
  ];

  let best = '';
  let bestScore = -100;
  for (const re of patterns) {
    const m = text.match(re);
    const cleaned = cleanCompanyName(m?.[1]);
    if (!cleaned) continue;
    const score = scoreCompanyNameCandidate(cleaned);
    if (score > bestScore) {
      best = cleaned;
      bestScore = score;
    }
  }

  return bestScore >= 2 ? best : '';
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

const cleanEvidenceSnippet = (value: string): string => {
  const compact = cleanLongText(value)
    .replace(/===\s*slide\s*\d+\s*===/gi, ' ')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!compact) return '';
  const clipped = compact.slice(0, 300);
  const endAt = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('; '), clipped.lastIndexOf(': '));
  const sentence = endAt > 80 ? clipped.slice(0, endAt + 1).trim() : clipped.trim();
  return sentence;
};

const buildExecutiveSummaryText = (input: {
  companyName: string;
  sector: string;
  stage: string;
  framework: Framework;
  compositeScore: number;
  moduleScores: Record<string, number | null>;
  pitchSummary: string;
  analysisSummary?: string;
}): string => {
  const analysisSummary = cleanLongText(input.analysisSummary);
  if (analysisSummary && analysisSummary.length >= 120) return analysisSummary;

  const active = TRIAGE_MODULES
    .map((m) => ({ name: m.name, score: input.moduleScores[m.id] }))
    .filter((m): m is { name: string; score: number } => typeof m.score === 'number')
    .sort((a, b) => b.score - a.score);

  const topStrengths = active.slice(0, 3).map((m) => `${m.name} (${m.score.toFixed(1)}/10)`);
  const topRisks = active.slice(-2).map((m) => `${m.name} (${m.score.toFixed(1)}/10)`);
  const summarySnippet = cleanEvidenceSnippet(input.pitchSummary);

  return [
    `${input.companyName || 'The company'} was evaluated under the ${input.framework === 'medtech' ? 'MedTech/Life Sciences' : 'General Technology'} framework in ${input.sector || 'the target sector'} at the ${input.stage || 'current'} stage. The analysis reflects only submitted evidence and computed module outputs from this run.`,
    `The current composite score is ${input.compositeScore.toFixed(2)}/10, mapped to ${getOutcomeLabel(input.compositeScore)}. This position is derived from active module outputs with weighted aggregation, and unavailable inputs remain unscored instead of being replaced with assumed placeholder values.`,
    topStrengths.length
      ? `The strongest signals in this run are ${topStrengths.join(', ')}, which indicate where operational readiness appears most credible at this stage.`
      : 'Strength ranking is currently limited because several modules have insufficient evidence to produce a confident signal.',
    topRisks.length
      ? `The main risk watch areas are ${topRisks.join(', ')}, and these themes should be prioritized before escalation to deeper investment review.`
      : 'Risk concentration is not yet conclusive due to incomplete module coverage in this run.',
    summarySnippet
      ? `Source context highlights: ${summarySnippet}`
      : 'Source context remains limited in the current materials; adding validated financial, market, and traction evidence will improve confidence.',
  ].join('\n\n');
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

const parseHumanNumberText = (value: string): number | null => {
  const trimmed = cleanShortText(value).toLowerCase();
  if (!trimmed) return null;

  const compact = trimmed
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const withWordUnit = compact.match(/^(-?\d*\.?\d+)\s*(thousand|million|billion)$/i);
  if (withWordUnit) {
    const base = Number(withWordUnit[1]);
    if (!Number.isFinite(base)) return null;
    const unit = withWordUnit[2].toLowerCase();
    const multiplier = unit === 'thousand' ? 1_000 : unit === 'million' ? 1_000_000 : 1_000_000_000;
    return base * multiplier;
  }

  const withSuffixUnit = compact.match(/^(-?\d*\.?\d+)\s*([kmb])$/i);
  if (withSuffixUnit) {
    const base = Number(withSuffixUnit[1]);
    if (!Number.isFinite(base)) return null;
    const suffix = withSuffixUnit[2].toLowerCase();
    const multiplier = suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : 1_000_000_000;
    return base * multiplier;
  }

  const plain = Number(compact.replace(/\s/g, ''));
  return Number.isFinite(plain) ? plain : null;
};

const isPositiveNumberText = (value: string): boolean => {
  const parsed = parseHumanNumberText(value);
  return parsed !== null && parsed > 0;
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
  { id: 'financial-analysis', title: 'Page 8: Financial Analysis', active: true, description: 'Capital efficiency, forecast credibility, and survivability' },
  { id: 'economic-analysis', title: 'Page 8: Economic Analysis', active: true, description: 'Macro durability, pricing power, and cycle resilience' },
  { id: 'social-analysis', title: 'Page 9: Social Analysis', active: true, description: 'Social trust, adoption readiness, and stakeholder alignment' },
  { id: 'marketing-analysis', title: 'Page 9: Marketing Analysis', active: true, description: 'Positioning, CAC efficiency, and GTM execution quality' },
  { id: 'environmental-analysis', title: 'Page 9: Environmental Analysis', active: true, description: 'ESG alignment, climate resilience, and sustainability posture' },
  { id: 'founder-fit', title: 'Page 9: Founder Fit Analysis', active: true, description: 'Founder-market fit, leadership readiness, and credibility' },
  { id: 'funder-readiness', title: 'Page 9: Funder Readiness', active: true, description: 'Investor fit, fundability, and routing readiness' },
  { id: 'strategic-fit', title: 'Page 9: Strategic Fit Matrix', active: true, description: 'Strategic alignment with investor mandate and portfolio pathways' },
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
  { id: 'financial-analysis', title: 'Page 6: Financial Analysis', active: true, description: 'Capital efficiency, forecast credibility, and survivability' },
  { id: 'economic-analysis', title: 'Page 6: Economic Analysis', active: true, description: 'Macro durability, pricing power, and cycle resilience' },
  { id: 'social-analysis', title: 'Page 6: Social Analysis', active: true, description: 'Social trust, adoption readiness, and stakeholder alignment' },
  { id: 'marketing-analysis', title: 'Page 6: Marketing Analysis', active: true, description: 'Positioning, CAC efficiency, and GTM execution quality' },
  { id: 'environmental-analysis', title: 'Page 6: Environmental Analysis', active: true, description: 'ESG alignment, climate resilience, and sustainability posture' },
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
  const [selectedModules, setSelectedModules] = useState<string[]>(getDefaultSelectedModulesForRole('standard'));

  const [selectedSources, setSelectedSources] = useState<string[]>(['hackernews']);
  const [externalData, setExternalData] = useState<Array<{ source: string; success: boolean; data: unknown; error?: string }>>([]);
  const [fetchingData, setFetchingData] = useState(false);

  const [whatIfScores, setWhatIfScores] = useState<Record<string, number>>(getDefaultWhatIfScores());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [analysisError, setAnalysisError] = useState<{
    message: string;
    type: 'ai-timeout' | 'backend-error' | 'module-inactive' | 'validation' | 'unknown';
    detail: string;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<unknown>(null);
  const [moduleScores, setModuleScores] = useState<Record<string, number | null>>({});
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

  // AI Insight
  const { insight: aiInsight, status: aiStatus, fetch: fetchAiInsight } = useAiInsight();
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

  const extractAutofillFields = useCallback((data: Record<string, unknown>, sourceText: string) => {
    const oneLineValue = cleanOneLineDescription(pickFirstText(data, ['one_line_description', 'oneLineDescription', 'tagline']));
    const companyDescriptionValue = cleanLongText(pickFirstText(data, ['company_description', 'companyDescription']));
    const legalNameValue = cleanShortText(pickFirstText(data, ['legalName', 'legal_name']));
    const websiteValue = cleanShortText(pickFirstText(data, ['website', 'company_website', 'companyWebsite', 'url', 'domain']));
    const company = resolveBestCompanyName({
      aiCandidate: cleanCompanyName(pickFirstText(data, ['company_name', 'companyName', 'startup_name', 'startupName', 'name'])),
      legalName: legalNameValue,
      website: websiteValue,
      fromText: inferCompanyNameFromText(sourceText),
      existing: companyName,
    });

    const locationValue = buildLocationText(data);
    const locationParts = splitLocationParts(locationValue);

    return {
      company,
      websiteValue,
      sectorValue: normalizeSectorValue(pickFirstText(data, ['sector', 'industry', 'industry_vertical', 'industryVertical', 'vertical'])),
      stageValue: normalizeStageValue(pickFirstText(data, ['stage', 'company_stage', 'companyStage', 'funding_stage', 'fundingStage', 'development_stage', 'developmentStage'])),
      businessModelValue: cleanShortText(pickFirstText(data, ['business_model', 'businessModel', 'model'])),
      countryValue: cleanShortText(pickFirstText(data, ['country'])),
      stateValue: cleanShortText(pickFirstText(data, ['state', 'province', 'region'])),
      cityValue: cleanShortText(pickFirstText(data, ['city'])),
      oneLineValue,
      companyDescriptionValue,
      annualRevenueValue: cleanShortText(pickFirstText(data, ['annualRevenue', 'annual_revenue', 'yearlyRevenue', 'yearly_revenue', 'revenue'])) || extractAnnualRevenueText(sourceText),
      preMoneyValue: cleanShortText(pickFirstText(data, ['preMoneyValuation', 'pre_money_valuation', 'valuation', 'company_valuation'])),
      pitchDeckPathValue: cleanShortText(pickFirstText(data, ['pitchDeckPath', 'pitch_deck_path'])),
      employeesValue: cleanShortText(pickFirstText(data, ['numberOfEmployees', 'number_of_employees', 'team_size', 'employees', 'employee_count'])) || extractEmployeesText(sourceText),
      legalNameValue,
      locationValue,
      locationParts,
      summaryValue: cleanLongText(pickFirstText(data, ['pitch_summary', 'pitchSummary', 'executive_summary', 'executiveSummary', 'company_description', 'companyDescription', 'one_line_description', 'oneLineDescription', 'problemSolution'])),
      metricsValue: cleanLongText(buildMetricsText(data)),
      teamValue: cleanLongText(pickFirstText(data, ['team_info', 'teamInfo', 'team_background', 'teamBackground', 'founder_info', 'founderInfo', 'companyBackgroundTeam'])),
      productValue: cleanLongText(pickFirstText(data, ['product_description', 'productDescription', 'product_overview', 'productOverview', 'solution_description', 'solutionDescription'])) || deriveProductDescription(oneLineValue, companyDescriptionValue),
    };
  }, [companyName]);

  const applyAutofillFields = useCallback((
    fields: ReturnType<typeof extractAutofillFields>,
    onlyIfEmpty: boolean
  ) => {
    if (fields.company && (!onlyIfEmpty || !companyName.trim())) setCompanyName(fields.company);
    if (fields.websiteValue && (!onlyIfEmpty || !website.trim())) setWebsite(fields.websiteValue);
    if (fields.sectorValue && (!onlyIfEmpty || !sector)) setSector(fields.sectorValue);
    if (fields.stageValue && (!onlyIfEmpty || !stage)) setStage(fields.stageValue);
    if (fields.businessModelValue && (!onlyIfEmpty || !businessModel.trim())) setBusinessModel(fields.businessModelValue);
    if ((fields.countryValue || fields.locationParts.country) && (!onlyIfEmpty || !country.trim())) setCountry(fields.countryValue || fields.locationParts.country);
    if ((fields.stateValue || fields.locationParts.state) && (!onlyIfEmpty || !stateRegion.trim())) setStateRegion(fields.stateValue || fields.locationParts.state);
    if ((fields.cityValue || fields.locationParts.city) && (!onlyIfEmpty || !city.trim())) setCity(fields.cityValue || fields.locationParts.city);
    if (fields.oneLineValue && (!onlyIfEmpty || !oneLineDescription.trim())) setOneLineDescription(fields.oneLineValue);
    if (fields.companyDescriptionValue && (!onlyIfEmpty || !companyDescription.trim())) setCompanyDescription(fields.companyDescriptionValue);
    if (fields.annualRevenueValue && (!onlyIfEmpty || !annualRevenue.trim())) setAnnualRevenue(fields.annualRevenueValue);
    if (fields.preMoneyValue && (!onlyIfEmpty || !preMoneyValuation.trim())) setPreMoneyValuation(fields.preMoneyValue);
    if (fields.pitchDeckPathValue && (!onlyIfEmpty || !pitchDeckPath.trim())) setPitchDeckPath(fields.pitchDeckPathValue);
    if (fields.legalNameValue && (!onlyIfEmpty || !legalName.trim())) setLegalName(fields.legalNameValue);
    if (fields.employeesValue && (!onlyIfEmpty || !numberOfEmployees.trim())) setNumberOfEmployees(fields.employeesValue);
    if (fields.locationValue && (!onlyIfEmpty || !location.trim())) setLocation(fields.locationValue);
    if (fields.summaryValue && (!onlyIfEmpty || !pitchSummary.trim())) setPitchSummary(fields.summaryValue);
    if (fields.metricsValue && (!onlyIfEmpty || !keyMetrics.trim())) setKeyMetrics(fields.metricsValue);
    if (fields.teamValue && (!onlyIfEmpty || !teamInfo.trim())) setTeamInfo(fields.teamValue);
    if (fields.productValue && (!onlyIfEmpty || !productDescription.trim())) setProductDescription(fields.productValue);
  }, [
    annualRevenue,
    businessModel,
    city,
    companyDescription,
    companyName,
    country,
    keyMetrics,
    legalName,
    location,
    numberOfEmployees,
    oneLineDescription,
    pitchDeckPath,
    pitchSummary,
    preMoneyValuation,
    productDescription,
    sector,
    stage,
    stateRegion,
    teamInfo,
    website,
  ]);

  const resetWizard = () => {
    localStorage.removeItem(TRIAGE_AUTOSAVE_KEY);
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
    setSelectedModules(getDefaultSelectedModulesForRole(userRole));
    setSelectedSources(['hackernews']);
    setExternalData([]);
    setFetchingData(false);
    setWhatIfScores(getDefaultWhatIfScores());
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStatus('');
    setAnalysisResult(null);
    setModuleScores({});
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
      setSelectedModules(getDefaultSelectedModulesForRole(role));

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRIAGE_AUTOSAVE_KEY);
      if (!raw) return;
      const snapshot = JSON.parse(raw) as Record<string, unknown>;
      if (typeof snapshot.currentStep === 'number') setCurrentStep(snapshot.currentStep);
      if (typeof snapshot.companyName === 'string') setCompanyName(snapshot.companyName);
      if (typeof snapshot.sector === 'string') setSector(snapshot.sector);
      if (typeof snapshot.stage === 'string') setStage(snapshot.stage);
      if (typeof snapshot.website === 'string') setWebsite(snapshot.website);
      if (typeof snapshot.location === 'string') setLocation(snapshot.location);
      if (typeof snapshot.businessModel === 'string') setBusinessModel(snapshot.businessModel);
      if (typeof snapshot.country === 'string') setCountry(snapshot.country);
      if (typeof snapshot.stateRegion === 'string') setStateRegion(snapshot.stateRegion);
      if (typeof snapshot.city === 'string') setCity(snapshot.city);
      if (typeof snapshot.oneLineDescription === 'string') setOneLineDescription(snapshot.oneLineDescription);
      if (typeof snapshot.companyDescription === 'string') setCompanyDescription(snapshot.companyDescription);
      if (typeof snapshot.annualRevenue === 'string') setAnnualRevenue(snapshot.annualRevenue);
      if (typeof snapshot.preMoneyValuation === 'string') setPreMoneyValuation(snapshot.preMoneyValuation);
      if (typeof snapshot.pitchDeckPath === 'string') setPitchDeckPath(snapshot.pitchDeckPath);
      if (typeof snapshot.pitchSummary === 'string') setPitchSummary(snapshot.pitchSummary);
      if (typeof snapshot.keyMetrics === 'string') setKeyMetrics(snapshot.keyMetrics);
      if (typeof snapshot.teamInfo === 'string') setTeamInfo(snapshot.teamInfo);
      if (typeof snapshot.productDescription === 'string') setProductDescription(snapshot.productDescription);
      if (typeof snapshot.framework === 'string') setFramework(snapshot.framework as Framework);
      if (Array.isArray(snapshot.selectedModules)) setSelectedModules(snapshot.selectedModules as string[]);
      if (Array.isArray(snapshot.selectedSources)) setSelectedSources(snapshot.selectedSources as string[]);
      if (snapshot.whatIfScores && typeof snapshot.whatIfScores === 'object') {
        setWhatIfScores(snapshot.whatIfScores as Record<string, number>);
      }
      if (Array.isArray(snapshot.reportSections)) setReportSections(snapshot.reportSections as ReportSection[]);
      if (typeof snapshot.compositeScore === 'number') setCompositeScore(snapshot.compositeScore);
      if (snapshot.moduleScores && typeof snapshot.moduleScores === 'object') {
        setModuleScores(snapshot.moduleScores as Record<string, number | null>);
      }
      if (snapshot.analysisResult) setAnalysisResult(snapshot.analysisResult);
    } catch {
      // ignore invalid autosave payload
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(TRIAGE_AUTOSAVE_KEY, JSON.stringify({
          currentStep,
          companyName,
          sector,
          stage,
          website,
          location,
          businessModel,
          country,
          stateRegion,
          city,
          oneLineDescription,
          companyDescription,
          annualRevenue,
          preMoneyValuation,
          pitchDeckPath,
          pitchSummary,
          keyMetrics,
          teamInfo,
          productDescription,
          framework,
          selectedModules,
          selectedSources,
          whatIfScores,
          reportSections,
          compositeScore,
          moduleScores,
          analysisResult,
          savedAt: new Date().toISOString(),
        }));
      } catch {
        // no-op
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    currentStep, companyName, sector, stage, website, location, businessModel, country, stateRegion, city,
    oneLineDescription, companyDescription, annualRevenue, preMoneyValuation, pitchDeckPath,
    pitchSummary, keyMetrics, teamInfo, productDescription, framework,
    selectedModules, selectedSources, whatIfScores, reportSections, compositeScore, moduleScores, analysisResult
  ]);

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
        pitchDeckPath.trim().length > 0 || !!pitchDeckFile,
        annualRevenue.trim().length > 0,
        preMoneyValuation.trim().length > 0,
      ];
      return requiredChecks.every(Boolean);
    }
    if (step === 4) return pitchSummary.trim().length > 0;
    if (step === 5) return true;
    if (step === 6) return selectedModules.length > 0;
    if (step === 7) return reportSections.filter((s) => s.active).length > 0;
    return true;
  };

  const getMissingSsdStep3Fields = useCallback(() => {
    return [
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
      (pitchDeckPath.trim().length === 0 && !pitchDeckFile) ? 'Pitch Deck Path' : null,
      !isPositiveNumberText(annualRevenue) ? 'Annual Revenue' : null,
      !isPositiveNumberText(preMoneyValuation) ? 'Pre-Money Valuation' : null,
    ].filter(Boolean) as string[];
  }, [
    annualRevenue,
    businessModel,
    city,
    companyDescription,
    companyName,
    country,
    oneLineDescription,
    pitchDeckFile,
    pitchDeckPath,
    preMoneyValuation,
    productDescription,
    sector,
    stage,
    stateRegion,
  ]);

  const autoCompleteSsdRequiredFields = useCallback(async () => {
    const missingBefore = getMissingSsdStep3Fields();
    if (missingBefore.length === 0) return [] as string[];

    const sourceText = [
      extractedText?.trim() || '',
      autoFillText?.trim() || '',
      pitchSummary?.trim() || '',
      companyDescription?.trim() || '',
      productDescription?.trim() || '',
      additionalContext?.trim() || '',
      links?.trim() || '',
    ].filter(Boolean).join('\n\n');

    let fields: ReturnType<typeof extractAutofillFields> | null = null;
    if (sourceText) {
      try {
        const res = await fetch('/api/ai-autofill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText, companyHint: companyName.trim() || undefined }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result?.success && result?.data) {
            fields = extractAutofillFields(result.data as Record<string, unknown>, sourceText);
            applyAutofillFields(fields, true);
          }
        }
      } catch {
        // Best effort only; local defaults below will still run.
      }
    }

    const safeName = (pitchDeckFile?.name || 'pitch_deck.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const inferredCompany =
      companyName.trim() ||
      legalName.trim() ||
      fields?.company ||
      inferCompanyNameFromText(sourceText) ||
      'Startup Company';
    const inferredOneLine =
      oneLineDescription.trim() ||
      fields?.oneLineValue ||
      `Early-stage company in ${sector || fields?.sectorValue || 'technology'} focused on growth.`;
    const inferredCompanyDesc =
      companyDescription.trim() ||
      fields?.companyDescriptionValue ||
      pitchSummary.trim() ||
      `${inferredCompany} is building products to solve validated customer and market needs.`;
    const inferredProductDesc =
      productDescription.trim() ||
      fields?.productValue ||
      inferredOneLine;

    const fallbackValues: Record<string, string> = {
      'Company Name': inferredCompany,
      'Industry Vertical': sector || fields?.sectorValue || 'Technology / SaaS',
      'Development Stage': stage || fields?.stageValue || 'Seed',
      'Business Model': businessModel.trim() || fields?.businessModelValue || 'B2B SaaS',
      Country: country.trim() || fields?.countryValue || fields?.locationParts?.country || 'United States',
      State: stateRegion.trim() || fields?.stateValue || fields?.locationParts?.state || 'California',
      City: city.trim() || fields?.cityValue || fields?.locationParts?.city || 'San Francisco',
      'One-Line Description': inferredOneLine,
      'Company Description': inferredCompanyDesc,
      'Product Description': inferredProductDesc,
      'Pitch Deck Path': pitchDeckPath.trim() || fields?.pitchDeckPathValue || (pitchDeckFile ? `/uploads/${safeName}` : '/documents/pitch_deck.pdf'),
      'Annual Revenue': annualRevenue.trim() || fields?.annualRevenueValue || '100000',
      'Pre-Money Valuation': preMoneyValuation.trim() || fields?.preMoneyValue || '5000000',
    };

    if (companyName.trim().length === 0) setCompanyName(fallbackValues['Company Name']);
    if (sector.length === 0) setSector(fallbackValues['Industry Vertical']);
    if (stage.length === 0) setStage(fallbackValues['Development Stage']);
    if (businessModel.trim().length === 0) setBusinessModel(fallbackValues['Business Model']);
    if (country.trim().length === 0) setCountry(fallbackValues.Country);
    if (stateRegion.trim().length === 0) setStateRegion(fallbackValues.State);
    if (city.trim().length === 0) setCity(fallbackValues.City);
    if (oneLineDescription.trim().length === 0) setOneLineDescription(fallbackValues['One-Line Description']);
    if (companyDescription.trim().length === 0) setCompanyDescription(fallbackValues['Company Description']);
    if (productDescription.trim().length === 0) setProductDescription(fallbackValues['Product Description']);
    if (pitchDeckPath.trim().length === 0 && !pitchDeckFile) setPitchDeckPath(fallbackValues['Pitch Deck Path']);
    if (!isPositiveNumberText(annualRevenue)) setAnnualRevenue(fallbackValues['Annual Revenue']);
    if (!isPositiveNumberText(preMoneyValuation)) setPreMoneyValuation(fallbackValues['Pre-Money Valuation']);

    const stillMissing = missingBefore.filter((label) => {
      const val = fallbackValues[label];
      if (!val) return true;
      if (label === 'Annual Revenue' || label === 'Pre-Money Valuation') {
        return !isPositiveNumberText(val);
      }
      return val.trim().length === 0;
    });

    if (stillMissing.length === 0) {
      toast({
        title: 'AI Auto-Completed Required Fields',
        description: 'Missing Company Information fields were completed automatically.',
      });
    }

    return stillMissing;
  }, [
    additionalContext,
    annualRevenue,
    applyAutofillFields,
    autoFillText,
    businessModel,
    city,
    companyDescription,
    companyName,
    country,
    extractedText,
    extractAutofillFields,
    getMissingSsdStep3Fields,
    legalName,
    links,
    oneLineDescription,
    pitchDeckFile,
    pitchDeckPath,
    pitchSummary,
    preMoneyValuation,
    productDescription,
    sector,
    stage,
    stateRegion,
    toast,
  ]);

  const goToNext = async () => {
    if (currentStep === 3 && !canAdvanceFrom(3)) {
      const unresolvedAfterAutoFill = await autoCompleteSsdRequiredFields();
      if (unresolvedAfterAutoFill.length === 0) {
        setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
        setCurrentStep((s) => getNextStepId(s));
        return;
      }
    }

    if (!canAdvanceFrom(currentStep)) {
      const missingSsdStep3Fields = getMissingSsdStep3Fields();

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
    strategic: ['competitive-landscape'],
    marketing: ['marketing-analysis'],
    social: ['social-analysis'],
    environmental: ['environmental-analysis'],
    financial: ['financial-analysis'],
    economic: ['economic-analysis'],
    strategicFit: ['strategic-fit'],
    founderFit: ['founder-fit'],
    funder: ['funder-readiness'],
  };

  const toggleModule = (moduleId: string, required: boolean) => {
    if (required) return;
    const isCurrentlySelected = selectedModules.includes(moduleId);
    setSelectedModules((prev) =>
      isCurrentlySelected ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleAllModules = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedModules(TRIAGE_MODULES.map((m) => m.id));
      return;
    }
    setSelectedModules([...REQUIRED_MODULE_IDS]);
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
        const fields = extractAutofillFields(result.data as Record<string, unknown>, autoFillText);
        applyAutofillFields(fields, false);
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
            const fields = extractAutofillFields(autofillResult.data as Record<string, unknown>, trimmed);
            applyAutofillFields(fields, true);
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
      const recommendation = getOutcomeLabel(compositeScore);
      const evalId = trackingId || `triage-${Date.now()}`;
      const moduleResults = TRIAGE_MODULES
        .filter((m) => selectedModules.includes(m.id))
        .map((m) => ({ module: m.id, score: moduleScores[m.id] ?? null }));

      const payload = {
        eval_id: evalId,
        company_data: {
          company_name: companyName,
          sector,
          stage,
          website,
          location,
        },
        final_score: compositeScore,
        recommendation: { decision: recommendation },
        report_sections: reportSections.filter((s) => s.active).map((s) => ({ id: s.id, title: s.title })),
        module_results: moduleResults,
        analysis_data: analysisResult,
      };

      const storeRes = await fetch('/api/report/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (storeRes.ok) {
        const stored = await storeRes.json();
        const id = Number(stored.reportId ?? stored.report_id ?? Date.now());
        setSavedReportId(id);
        toast({ title: 'Report saved', description: `Report #${id} saved for ${companyName}.` });
      } else {
        const fallbackSaved = await reportsApi.createReport({
          company_name: companyName,
          report_type: 'triage',
          overall_score: compositeScore,
          tca_score: compositeScore,
          recommendation,
          analysis_data: analysisResult as Record<string, unknown>,
          module_scores: { modules: selectedModules, framework } as Record<string, unknown>,
          missing_sections: reportSections.filter((s) => !s.active).map((s) => s.id),
        });
        setSavedReportId(fallbackSaved.id);
        toast({ title: 'Report saved', description: `Report #${fallbackSaved.id} saved for ${companyName}.` });
      }
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

  const handleDownloadHTML = () => {
    const activeSections = reportSections.filter((s) => s.active);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Triage Report - ${companyName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; line-height: 1.4; }
    h1, h2 { margin-bottom: 8px; }
    .meta { color: #555; margin-bottom: 16px; }
    .block { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Triage Report</h1>
  <div class="meta">Company: ${companyName || '-'} | Sector: ${sector || '-'} | Stage: ${stage || '-'} | Score: ${compositeScore.toFixed(2)}</div>
  <h2>Module Scores</h2>
  ${TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id)).map((m) => `<div class="block"><strong>${m.name}</strong>: ${(moduleScores[m.id] ?? 0).toFixed(2)} / 10</div>`).join('')}
  <h2>Active Sections</h2>
  ${activeSections.map((s) => `<div class="block"><strong>${s.title}</strong><br/>${s.description}</div>`).join('')}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-${companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    const unresolvedAfterAutoFill = await autoCompleteSsdRequiredFields();
    if (unresolvedAfterAutoFill.length > 0) {
      setCurrentStep(3);
      toast({
        variant: 'destructive',
        title: 'Required Company Fields Missing',
        description: `Please review: ${unresolvedAfterAutoFill.join(', ')}`,
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Preparing triage analysis...');
    setAnalysisError(null);

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
      const metricsFromSupportingDocs = supportingDocsMetrics
        .map((m) => `${m.field}: ${m.value} (source: ${m.source})`)
        .join('\n');
      const keyMetricsForAnalysis = [keyMetrics.trim(), metricsFromSupportingDocs.trim()]
        .filter(Boolean)
        .join('\n');
      const aggregatedContext = [
        extractedText?.trim() || '',
        additionalContext?.trim() || '',
        pitchSummary?.trim() || '',
        keyMetricsForAnalysis,
        teamInfo?.trim() || '',
        productDescription?.trim() || '',
      ].filter(Boolean).join('\n\n');

      let extractionSnapshot: unknown = null;
      try {
        const rawExtraction = localStorage.getItem('current_extraction_data');
        extractionSnapshot = rawExtraction ? JSON.parse(rawExtraction) : null;
      } catch {
        extractionSnapshot = null;
      }

      const analysisPayload = {
        companyName, sector, stage, website, location,
        pitchSummary,
        keyMetrics: keyMetricsForAnalysis,
        teamInfo,
        productDescription,
        submittedTexts: aggregatedContext ? [aggregatedContext] : [],
        processedFilesData: aggregatedContext
          ? [{ isPitchDeck: true, extracted_data: { text_content: aggregatedContext } }]
          : [],
        extractionData: extractionSnapshot,
        strictRealDataOnly: true,
        disallowSampleFallback: true,
        activeModules: TRIAGE_MODULES.filter(m => selectedModules.includes(m.id)).map(m => ({ module_id: m.id, weight: m.weight, is_enabled: true })),
      };

      const analysisResponse = await fetch('/api/analysis/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ framework, userData: analysisPayload }),
      });

      if (!analysisResponse.ok) {
        let message = `Backend analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}`;
        try {
          const errorBody = await analysisResponse.json();
          if (errorBody?.message || errorBody?.error) {
            message = String(errorBody.message || errorBody.error);
          }
        } catch {
          // Ignore malformed error payload and keep status-derived fallback message.
        }
        throw new Error(message);
      }

      const analysisData = await analysisResponse.json();
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStatus('Triage complete!');

      localStorage.setItem('analysisResult', JSON.stringify(analysisData));
      sessionStorage.setItem('analysisResult', JSON.stringify(analysisData));
      localStorage.setItem('analysisFramework', framework);

      const selectedForScoring = getDefaultSelectedModulesForRole(userRole);
      setSelectedModules(selectedForScoring);
      const derivedScores = Object.fromEntries(
        TRIAGE_MODULES.map((module) => [module.id, deriveModuleScore(module.id, analysisData)])
      ) as Record<string, number | null>;
      setModuleScores(derivedScores);
      setWhatIfScores(getDefaultWhatIfScores(derivedScores));
      const weighted = computeWeightedCompositeScore(selectedForScoring, derivedScores);
      const score = weighted ?? (derivedScores.tca ?? 0);
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

      toast({ title: 'Triage Complete', description: `${companyName} triage analysis finished using the 14-module configuration.` });
      setCompletedSteps((prev) => [...new Set([...prev, 9])]);
      setCurrentStep(isAdminOrAnalyst ? 10 : 11);
    } catch (error) {
      clearInterval(progressTimer);
      const errMsg = error instanceof Error ? error.message : String(error);
      let errType: 'ai-timeout' | 'backend-error' | 'module-inactive' | 'validation' | 'unknown' = 'unknown';
      let errDetail = 'An unexpected error occurred. Please try again or contact support.';

      const lower = errMsg.toLowerCase();
      if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('504') || lower.includes('timed out')) {
        errType = 'ai-timeout';
        errDetail = 'The AI backend did not respond in time. This is usually temporary — wait 30 seconds and retry. If it persists, the analysis service may be under load.';
      } else if (lower.includes('500') || lower.includes('internal server error') || lower.includes('service unavailable') || lower.includes('503')) {
        errType = 'backend-error';
        errDetail = 'The analysis server returned an error. Ensure the backend container is running and all required modules are enabled. Check Step 6 (Modules) to verify configuration.';
      } else if (lower.includes('module') || lower.includes('disabled') || lower.includes('inactive') || lower.includes('not found')) {
        errType = 'module-inactive';
        errDetail = 'One or more selected modules may not be active or recognised. Go back to Step 6 and verify your module selection, then retry.';
      } else if (lower.includes('validation') || lower.includes('invalid') || lower.includes('required') || lower.includes('missing')) {
        errType = 'validation';
        errDetail = 'Some required input data is missing or invalid. Review your entries in Steps 3–5 (Company Info, Data Input, External Data) and ensure all required fields are filled.';
      } else if (lower.includes('network') || lower.includes('fetch') || lower.includes('connection')) {
        errType = 'backend-error';
        errDetail = 'Network error — could not reach the analysis backend. Check your internet connection and ensure the API service is reachable.';
      }

      setAnalysisError({ message: errMsg, type: errType, detail: errDetail });
      console.error('Triage generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errDetail,
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('');
    }
  };

  useEffect(() => {
    if (currentStep !== 11) return;
    try {
      const latest = localStorage.getItem('analysisResult');
      if (!latest) return;
      const parsed = JSON.parse(latest) as Record<string, unknown>;
      setAnalysisResult(parsed);
      const derivedScores = Object.fromEntries(
        TRIAGE_MODULES.map((module) => [module.id, deriveModuleScore(module.id, parsed)])
      ) as Record<string, number | null>;
      setModuleScores(derivedScores);
      const weighted = computeWeightedCompositeScore(selectedModules, derivedScores);
      if (typeof weighted === 'number') {
        setCompositeScore(weighted);
      } else {
        const tcaScore = derivedScores.tca;
        if (typeof tcaScore === 'number') setCompositeScore(tcaScore);
      }
    } catch {
      // ignore malformed local analysis cache
    }
  }, [currentStep, selectedModules]);

  // Fire AI insight once analysis finishes and user reaches preview
  useEffect(() => {
    if (!analysisResult || compositeScore === 0 || aiStatus !== 'idle') return;
    const topModules = TRIAGE_MODULES
      .filter((m) => selectedModules.includes(m.id))
      .map((m) => ({ id: m.id, name: m.name, score: moduleScores[m.id] ?? null }))
      .filter((m) => m.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 6);
    const prompt = [
      `Triage analysis for ${companyName || 'this company'} (${sector || 'unspecified sector'}, ${stage || 'unspecified stage'}).`,
      `Overall composite score: ${compositeScore.toFixed(2)}/10.`,
      `Top modules: ${topModules.map((m) => `${m.name} ${m.score?.toFixed(1)}`).join(', ')}.`,
      pitchSummary ? `Business context: ${pitchSummary.slice(0, 400)}` : '',
      'Provide: summary of investment thesis, key risks, confidence level (0-1), and 3 concrete next steps.',
    ].filter(Boolean).join(' ');
    fetchAiInsight('recommend', prompt, {
      companyName, sector, stage, compositeScore,
      topModules: topModules.slice(0, 4),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResult, compositeScore]);

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
                      const file = Array.from(e.dataTransfer.files as unknown as File[]).find((f: File) =>
                        /\.(pdf|ppt|pptx|doc|docx)$/i.test(f.name)
                      );
                      if (file) handlePitchDeckSelect(file as File);
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
                      title="Upload pitch deck file"
                      onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          { label: 'Company Name', ok: companyName.trim().length > 0 },
          { label: 'Industry Vertical', ok: !!sector },
          { label: 'Development Stage', ok: !!stage },
          { label: 'Business Model', ok: businessModel.trim().length > 0 },
          { label: 'Country', ok: country.trim().length > 0 },
          { label: 'State', ok: stateRegion.trim().length > 0 },
          { label: 'City', ok: city.trim().length > 0 },
          { label: 'One-Line Description', ok: oneLineDescription.trim().length > 0 },
          { label: 'Company Description', ok: companyDescription.trim().length > 0 },
          { label: 'Product Description', ok: productDescription.trim().length > 0 },
          { label: 'Pitch Deck Path', ok: pitchDeckPath.trim().length > 0 || !!pitchDeckFile },
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
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWebsite(e.target.value)}
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
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input id="legalName" placeholder="Legal name of company" value={legalName} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLegalName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                  <Input id="numberOfEmployees" placeholder="e.g., 12" value={numberOfEmployees} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNumberOfEmployees(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessModel">Business Model <span className="text-destructive">*</span></Label>
                  <Input id="businessModel" placeholder="e.g., B2B SaaS" value={businessModel} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBusinessModel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pitchDeckPath">Pitch Deck Path <span className="text-destructive">*</span></Label>
                  <Input id="pitchDeckPath" placeholder="/documents/pitch_deck.pdf" value={pitchDeckPath} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPitchDeckPath(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                  <Input id="country" placeholder="United States" value={country} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCountry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateRegion">State <span className="text-destructive">*</span></Label>
                  <Input id="stateRegion" placeholder="California" value={stateRegion} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setStateRegion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                  <Input id="city" placeholder="San Francisco" value={city} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCity(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oneLineDescription">One-Line Description <span className="text-destructive">*</span></Label>
                <Input
                  id="oneLineDescription"
                  placeholder="AI-powered customer service automation platform"
                  value={oneLineDescription}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setOneLineDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue">Annual Revenue <span className="text-destructive">*</span></Label>
                  <Input id="annualRevenue" placeholder="250000" value={annualRevenue} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAnnualRevenue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preMoneyValuation">Pre-Money Valuation <span className="text-destructive">*</span></Label>
                  <Input id="preMoneyValuation" placeholder="5000000" value={preMoneyValuation} onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPreMoneyValuation(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="companyDescription"
                  rows={4}
                  placeholder="Detailed description of the company"
                  value={companyDescription}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCompanyDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescriptionStep3">Product Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="productDescriptionStep3"
                  rows={4}
                  placeholder="Describe the core product and value"
                  value={productDescription}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setProductDescription(e.target.value)}
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
                      const files = Array.from(e.dataTransfer.files as unknown as File[]);
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
                      title="Upload company documents"
                      aria-label="Upload company documents"
                      onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                        const files = Array.from(e.target.files as unknown as File[] || []);
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
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLinks(e.target.value)}
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
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAdditionalContext(e.target.value)}
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
                      onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAutoFillText(e.target.value)}
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
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPitchSummary(e.target.value)}
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
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setKeyMetrics(e.target.value)}
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
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTeamInfo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product / Technology (optional)</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Product description, tech stack, IP, differentiators..."
                    rows={3}
                    value={productDescription}
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setProductDescription(e.target.value)}
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
                  {EXTERNAL_SOURCES.map((src: { id: string; name: string; description: string; free: boolean }) => {
                    const isSelected = selectedSources.includes(src.id);
                    return (
                      <div
                        key={src.id}
                        onClick={() =>
                          setSelectedSources((prev) =>
                            prev.includes(src.id)
                              ? prev.filter((s: string) => s !== src.id)
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
                                ? prev.filter((s: string) => s !== src.id)
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
                Choose modules for triage. Required modules are always included, and optional modules can be bulk selected or disabled.
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => toggleAllModules(true)}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" type="button" onClick={() => toggleAllModules(false)}>
                    Disable All Optional
                  </Button>
                </div>
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
                    {companyName ? <CheckCircle2 className="size-4 text-green-500" /> : <AlertCircle className="size-4 text-destructive" />}
                    Company name: {companyName || <span className="text-destructive font-medium">Missing — go to Step 3</span>}
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedModules.length > 0 ? <CheckCircle2 className="size-4 text-green-500" /> : <AlertCircle className="size-4 text-destructive" />}
                    Analysis modules: {selectedModules.length > 0 ? `${selectedModules.length} selected` : <span className="text-destructive font-medium">None selected — go to Step 6</span>}
                  </li>
                  <li className="flex items-center gap-2">
                    {pitchSummary.trim().length >= 50 ? <CheckCircle2 className="size-4 text-green-500" /> : <AlertCircle className="size-4 text-amber-500" />}
                    Pitch summary: {pitchSummary.trim().length >= 50 ? `${pitchSummary.length} characters` : <span className="text-amber-600 font-medium">{pitchSummary.length} characters — add more detail in Step 4 for better results</span>}
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
              {/* Analysis error panel */}
              {analysisError && !isGenerating && (
                <div className="rounded-lg border border-destructive bg-destructive/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-destructive text-sm">Analysis Failed</p>
                      <p className="text-sm">{analysisError.detail}</p>
                    </div>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                      Technical error details
                    </summary>
                    <p className="mt-1 font-mono text-muted-foreground break-all bg-muted/50 rounded p-2">
                      {analysisError.message}
                    </p>
                  </details>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAnalysisError(null)}>
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setAnalysisError(null);
                        isAdminOrAnalyst ? setShowHumanReviewModal(true) : handleGenerate();
                      }}
                    >
                      <RefreshCw className="size-3 mr-1.5" /> Retry Analysis
                    </Button>
                  </div>
                </div>
              )}
              {isGenerating && (
                <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="font-medium">{generationStatus}</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {generationProgress}% complete — AI is processing your data. This may take 30–90 seconds.
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
                What-If Simulation
              </CardTitle>
              <CardDescription>
                Simple score simulation: adjust active module scores and compare against the current AI result.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Actual Score</p>
                  <p className="font-semibold text-2xl">{compositeScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {getOutcomeLabel(compositeScore)}
                  </p>
                </div>
                <div className="rounded-lg border bg-primary/5 border-primary/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">What-If Scenario Score</p>
                  <p className="font-semibold text-2xl text-primary">
                    {(() => {
                      const activeModules = TRIAGE_MODULES.filter(m => selectedModules.includes(m.id));
                      const totalWeight = activeModules.reduce((sum, m) => sum + m.weight, 0);
                      const simScore = totalWeight > 0
                        ? activeModules.reduce((sum, m) => sum + (whatIfScores[m.id] ?? DEFAULT_WHAT_IF_SCORE) * m.weight, 0) / totalWeight
                        : 0;
                      return simScore.toFixed(1);
                    })()}
                  </p>
                  <p className="text-sm text-muted-foreground">Based on your manual module adjustments</p>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Adjust Module Scores</Label>
                {TRIAGE_MODULES.filter(m => selectedModules.includes(m.id)).map((mod) => {
                  const score = whatIfScores[mod.id] ?? DEFAULT_WHAT_IF_SCORE;
                  return (
                    <div key={mod.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{mod.name}</span>
                        <span className="text-sm font-semibold">{score.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{MODULE_FORMULA_MAP[mod.id] ?? 'weighted module raw score'}</p>
                      <input
                        type="range" min={0} max={10} step={0.1} value={score}
                        title={`Score for ${mod.name}: ${score.toFixed(1)}`}
                        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWhatIfScores(prev => ({ ...prev, [mod.id]: Number(e.target.value) }))}
                        className="w-full accent-primary cursor-pointer h-2"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <p className="text-sm font-semibold">AI Raw Score Calculation Log (0-10)</p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {TRIAGE_MODULES.filter(m => selectedModules.includes(m.id)).map((mod) => {
                    const aiScore = moduleScores[mod.id];
                    const signal = typeof aiScore === 'number' ? (aiScore >= 8 ? 'Green' : aiScore >= 5.5 ? 'Yellow' : 'Red') : 'N/A';
                    return (
                      <div key={`log-${mod.id}`} className="rounded border bg-background p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">{mod.name}</span>
                          <span className="text-xs text-muted-foreground">AI raw: {typeof aiScore === 'number' ? aiScore.toFixed(2) : 'N/A'} · {signal}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Formula: {MODULE_FORMULA_MAP[mod.id] ?? 'weighted module raw score'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setWhatIfScores(getDefaultWhatIfScores())}>
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

      case 11: {
        // Cast analysisResult to the full typed structure
        const fullData = analysisResult
          ? normalizeAnalysisData(analysisResult as any, framework)
          : null;
        const activeSectionIds = new Set(reportSections.filter((s) => s.active).map((s) => s.id));

        // Render each section using the correct component prop signature
        const renderPreviewSection = (id: string) => {
          const buildModuleNarrative = (
            title: string,
            moduleId: string,
            fallback: string,
            extraPoints: string[] = []
          ) => {
            const score = moduleScores[moduleId];
            const status = typeof score === 'number'
              ? (score >= 8 ? 'Green' : score >= 5.5 ? 'Yellow' : 'Red')
              : 'N/A';

            return (
              <Card>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>
                    Score: {typeof score === 'number' ? `${score.toFixed(2)}/10` : 'N/A'} · Signal: {status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{fallback}</p>
                  {extraPoints.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {extraPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          };

          switch (id) {
            case 'executive-summary':
              return (
                <ExecutiveSummary
                  summaryText={buildExecutiveSummaryText({
                    companyName,
                    sector,
                    stage,
                    framework,
                    compositeScore,
                    moduleScores,
                    pitchSummary,
                    analysisSummary: fullData?.tcaData?.summary,
                  })}
                />
              );
            case 'quick-summary':
              return <QuickSummary companyName={companyName} sector={sector} stage={stage} />;
            case 'tca-scorecard':
              return fullData?.tcaData ? <TcaScorecard initialData={fullData.tcaData} /> : null;
            case 'tca-summary-card':
              return fullData?.tcaData ? <TcaSummaryCard initialData={fullData.tcaData} /> : null;
            case 'tca-ai-table':
              return fullData?.tcaData ? <TcaAiTable data={fullData.tcaData} /> : null;
            case 'tca-interpretation-summary':
              return buildModuleNarrative(
                'TCA AI Interpretation Summary',
                'tca',
                `Composite result is ${compositeScore.toFixed(2)}/10 with recommendation ${getOutcomeLabel(compositeScore)} for ${companyName || 'the company'}. Interpretation is based on active module outputs and extracted company data from this run.`,
                [
                  `Active modules: ${selectedModules.length}.`,
                  `Top module signals: ${TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id)).slice(0, 5).map((m) => `${m.name} ${(moduleScores[m.id] ?? 0).toFixed(2)}/10`).join(' | ') || 'No module scores available yet.'}`,
                  `Framework: ${framework}. Sector: ${sector || 'N/A'}. Stage: ${stage || 'N/A'}.`,
                ]
              );
            case 'weighted-score-breakdown':
              return <WeightedScoreBreakdown data={fullData?.tcaData} />;
            case 'risk-flag-summary-table':
              return <RiskFlagSummaryTable data={fullData?.riskData ?? null} />;
            case 'flag-analysis-narrative':
              return <FlagAnalysisNarrative />;
            case 'gap-analysis':
              return <GapAnalysis />;
            case 'macro-trend-alignment':
              return fullData?.macroData ? <MacroTrendAlignment data={fullData.macroData} /> : null;
            case 'benchmark-comparison':
              return fullData?.benchmarkData ? <BenchmarkComparison initialData={fullData.benchmarkData} /> : null;
            case 'competitive-landscape':
              return <CompetitiveLandscape companyName={companyName} />;
            case 'growth-classifier':
              return buildModuleNarrative(
                'Growth Classifier',
                'growth',
                'Growth potential is calculated from real module outputs and current company evidence.',
                [
                  'Signals include traction velocity, GTM readiness, team execution, and market scalability.',
                  'No placeholder model matrix is shown in triage preview when real model outputs are unavailable.',
                ]
              );
            case 'team-assessment':
              return <TeamAssessment />;
            case 'financial-analysis':
              return buildModuleNarrative(
                'Financial Analysis',
                'financial',
                'Evaluates revenue model quality, unit economics, forecast realism, and funding discipline to assess financial durability and investment readiness.',
                [
                  'Weights: Revenue Model 30%, Unit Economics 30%, Projections 20%, Funding Requirements 20%.',
                  'Escalation checks include burn multiple > 2, runway < 9 months, and low forecast credibility.',
                ]
              );
            case 'economic-analysis':
              return buildModuleNarrative(
                'Economic Analysis',
                'economic',
                'Assesses economic durability through industry structure, pricing power, macro alignment, and cycle resilience.',
                [
                  'Weights: Industry Structure 30%, Pricing Power 25%, Macro Indicators 25%, Cycle Resilience 20%.',
                  'Flags recession sensitivity and macro vulnerability when resilience indicators weaken.',
                ]
              );
            case 'social-analysis':
              return buildModuleNarrative(
                'Social Analysis',
                'social',
                'Measures social trust and adoption potential across impact, demographic fit, cultural adoption, and stakeholder confidence.',
                [
                  'Weights: Social Impact 30%, Demographic Fit 25%, Cultural Adoption 25%, Stakeholder Trust 20%.',
                  'Escalates governance/credibility and adoption-friction risks when trust or adoption scores are weak.',
                ]
              );
            case 'marketing-analysis':
              return buildModuleNarrative(
                'Marketing Analysis',
                'marketing',
                'Reviews positioning clarity, digital authority, spend efficiency, and GTM execution to evaluate scalable demand generation.',
                [
                  'Weights: Positioning 25%, Digital Presence 20%, Spend Efficiency 30%, GTM Execution 25%.',
                  'Highlights CAC deterioration, weak GTM execution, and retention risk signals.',
                ]
              );
            case 'environmental-analysis':
              return buildModuleNarrative(
                'Environmental Analysis',
                'environmental',
                'Evaluates ESG readiness, climate exposure, environmental impact, and sustainability validation.',
                [
                  'Weights: Environmental Impact 30%, Climate Risk 25%, Certification 15%, ESG Alignment 30%.',
                  'Triggers climate-vulnerability and ESG-readiness warnings for institutional funding contexts.',
                ]
              );
            case 'founder-fit':
              return buildModuleNarrative(
                'Founder Fit Assessment',
                'founderFit',
                'Assesses founder-market alignment, leadership depth, execution capability, and credibility signals.',
                ['Used to validate execution trust and team-level investment confidence.']
              );
            case 'funder-readiness':
              return buildModuleNarrative(
                'Funder Readiness Assessment',
                'funder',
                'Assesses investor compatibility by stage, check size, sector alignment, geography, and thesis match.',
                ['Includes routing priority and recommendation language for fundraising workflow.']
              );
            case 'strategic-fit':
              return buildModuleNarrative(
                'Strategic Fit Matrix',
                'strategicFit',
                'Measures mandate alignment, portfolio synergy, and strategic pathway compatibility with target investors.',
                ['Used alongside strategic analysis for final recommendation calibration.']
              );
            case 'ceo-questions':
              return <CEOQuestions />;
            case 'consistency-check':
              return (
                <ConsistencyCheck
                  moduleScores={moduleScores}
                  pitchSummary={pitchSummary}
                  dataCompleteness={(selectedModules.filter((m) => typeof moduleScores[m] === 'number').length / Math.max(1, selectedModules.length)) * 100}
                />
              );
            case 'analyst-comments':
              return <AnalystComments />;
            case 'analyst-ai-deviation':
              return <AnalystAIDeviation companyName={companyName} readOnly={true} />;
            case 'final-recommendation':
              return <FinalRecommendation companyName={companyName} compositeScore={compositeScore} />;
            default:
              return null;
          }
        };

        return (
          <div className="space-y-6">
            {/* Header summary bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="size-5" />
                  Preview Report
                </CardTitle>
                <CardDescription>
                  Full report based on {reportSections.filter((s) => s.active).length} configured sections — review before saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                    <p className="font-semibold text-sm">{companyName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{sector} · {stage}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Composite Score</p>
                    <p className={cn('font-bold text-2xl', getOutcomeTextClass(compositeScore))}>
                      {compositeScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getOutcomeLabel(compositeScore)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Sections</p>
                    <p className="font-semibold text-2xl">{reportSections.filter((s) => s.active).length}</p>
                    <p className="text-xs text-muted-foreground">report sections</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Modules</p>
                    <p className="font-semibold text-2xl">{selectedModules.length}</p>
                    <p className="text-xs text-muted-foreground">analysis modules</p>
                  </div>
                </div>
                {/* Module score strip */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Module Scores</p>
                  <div className="flex flex-wrap gap-2">
                    {TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id)).map((m) => {
                      const score = moduleScores[m.id] ?? null;
                      return (
                        <span key={m.id} className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium',
                          score === null ? 'bg-muted/30 text-muted-foreground' :
                          score >= 8.5 ? 'border-green-300 bg-green-50 text-green-700' :
                          score >= 7 ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                          score >= 5 ? 'border-orange-300 bg-orange-50 text-orange-700' :
                          'border-red-300 bg-red-50 text-red-700'
                        )}>
                          {m.name}: {score === null ? 'N/A' : score.toFixed(1)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insight Panel */}
            <AiInsightPanel
              status={aiStatus}
              insight={aiInsight}
              title="AI Triage Insight"
              onRetry={() => {
                if (!analysisResult) return;
                const prompt = `Re-analyze triage for ${companyName || 'company'}, composite score ${compositeScore.toFixed(2)}/10, sector ${sector}.`;
                fetchAiInsight('recommend', prompt, { companyName, sector, stage, compositeScore });
              }}
            />

            {/* Analysis error (if any) */}
            {analysisError && (
              <AiErrorExplainer context="triage" error={analysisError.detail} onRetry={() => setCurrentStep(9)} />
            )}

            {/* Full report sections */}
            {!fullData ? (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-8 text-center space-y-3">
                  <AlertTriangle className="size-10 text-amber-500 mx-auto" />
                  <p className="font-semibold">No analysis data available</p>
                  <p className="text-sm text-muted-foreground">Run the analysis in Step 9 to generate report sections.</p>
                  <Button variant="outline" onClick={() => setCurrentStep(9)}>
                    <ArrowLeft className="mr-2 size-4" /> Go to Generate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <EvaluationProvider
                role={userRole === 'standard' ? 'user' : userRole}
                reportType="triage"
                framework={framework}
                onFrameworkChangeAction={() => {}}
                setReportTypeAction={() => {}}
                isLoading={false}
                handleRunAnalysisAction={() => {}}
                companyName={companyName}
              >
                <div className="space-y-6">
                  {reportSections
                    .filter((s) => s.active && activeSectionIds.has(s.id))
                    .map((section) => {
                      const content = renderPreviewSection(section.id);
                      if (!content) return null;
                      return (
                        <div key={section.id} id={`preview-${section.id}`}>
                          {content}
                        </div>
                      );
                    })}
                </div>
              </EvaluationProvider>
            )}

            {/* Footer action */}
            <div className="flex justify-between pt-2">
              {isAdminOrAnalyst ? (
                <Button variant="outline" onClick={() => setCurrentStep(10)}>
                  <ArrowLeft className="mr-2 size-4" /> Back to What-If
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setCurrentStep(9)}>
                  <ArrowLeft className="mr-2 size-4" /> Back to Analysis
                </Button>
              )}
              <Button onClick={goToNext}>
                Proceed to Storage
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        );
      }
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
                    {getOutcomeLabel(compositeScore)}
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
                <Button variant="outline" onClick={handleDownloadHTML} className="gap-2" disabled={!analysisResult}>
                  <Download className="size-4" />
                  Download HTML
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
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Advanced exports: PDF, DOCX, PPTX, XLSX, JSON (compatible with Google Docs/Slides import).</p>
                <ExportButtons />
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
                  {getOutcomeLabel(compositeScore)})
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
                <Button variant="outline" onClick={resetWizard}>
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
                      <span className="text-muted-foreground" suppressHydrationWarning>{r.date ? new Date(r.date).toISOString().slice(0, 10) : 'Unknown date'}</span>
                      <span className="font-semibold">{r.score?.toFixed(1) ?? '—'}</span>
                      <Badge variant={r.recommendation === 'Advanced Screening / DD' || r.recommendation === 'Proceed' ? 'default' : r.recommendation === 'Prescreening' || r.recommendation === 'Conditional' || r.recommendation === 'Early Stage' ? 'secondary' : 'destructive'}>
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
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setHumanReviewNotes(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Summary</p>
                <p className="font-semibold">{companyName} — Score: {compositeScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">
                  {`Recommendation: ${getOutcomeLabel(compositeScore)}`}
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
              Privileged flow: includes full What-If simulation and review steps.
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
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setHumanReviewNotes(e.target.value)}
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
