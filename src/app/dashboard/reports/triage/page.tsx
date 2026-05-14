'use client';

import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react';
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
  UploadCloud,
  X,
  Link as LinkIcon,
  Type,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ExportButtons } from '@/components/evaluation/export-buttons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import reportsApi from '@/lib/reports-api';
import { azureStorage } from '@/lib/azure-storage-service';
import { externalSourcesConfig } from '@/lib/external-sources-config';
import { getActiveManagedModuleIds, TRIAGE_SECTION_MODULE_MAP } from '@/lib/module-deck';
import { settingsApi } from '@/lib/settings-api';
import TriageWizard from '@/components/triage/TriageWizard';
import { WorkflowStepWithStatus, formatEta, withInvestorTerminology } from '@/components/triage/Evaluationsteps';

const TRIAGE_STEPS = withInvestorTerminology([
  { id: 1, name: 'Upload', icon: Upload, description: 'Upload company documents' },
  { id: 2, name: 'Data Extraction', icon: FileSearch, description: 'Extract data from uploaded materials' },
  { id: 3, name: 'Company Info', icon: Building2, description: 'Basic company details' },
  { id: 5, name: 'External Data', icon: Database, description: 'Fetch external sources' },
  { id: 6, name: 'Modules', icon: Layers, description: 'Configure analysis engines and weighting scope' },
  { id: 7, name: 'Report Sections', icon: Settings, description: 'Configure report sections' },
  { id: 9, name: 'Generate', icon: BrainCircuit, description: 'Run institutional investment analysis' },
  { id: 10, name: 'What-If Analysis', icon: LineChart, description: 'Simulate scenario outcomes before finalizing' },
  { id: 11, name: 'Preview Report', icon: Eye, description: 'Review analysis results' },
  { id: 13, name: 'Report Complete', icon: CheckCircle2, description: 'Analysis complete' },
  { id: 14, name: 'Prior Results', icon: LineChart, description: 'Previous report results' },
  { id: 15, name: 'Run Review', icon: UserCheck, description: 'Analysis run review' },
]);

const TRIAGE_WORKFLOW_STEPS = [
  { id: 101, name: 'Document Upload', icon: Upload, description: 'Add company documents and source material.', stepIds: [1, 2] },
  { id: 102, name: 'Company Setup', icon: Building2, description: 'Complete company details and required investment inputs.', stepIds: [3] },
  { id: 103, name: 'External Data', icon: Database, description: 'Pull external company and market context.', stepIds: [5] },
  { id: 104, name: 'Evaluation Setup', icon: Layers, description: 'Choose engines and report scope.', stepIds: [6, 7] },
  { id: 105, name: 'Review & Generate', icon: BrainCircuit, description: 'Run the triage analysis and validate real AI output.', stepIds: [9] },
  { id: 106, name: 'Preview Report', icon: Eye, description: 'Review, export, and access completed results.', stepIds: [10, 11, 13, 14, 15] },
];

const EXTERNAL_SOURCES = externalSourcesConfig
  .filter((s) => s.requirementGroup === 'A' || s.requirementGroup === 'B')
  .map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    free: s.pricing === 'Free' || s.pricing === 'Freemium',
  }));

const PREFERRED_EXTERNAL_SOURCE_IDS = ['angellist-venture', 'gust'];

const getPreferredExternalSourceSelection = (allowedIds: string[]): string[] => {
  const preferred = PREFERRED_EXTERNAL_SOURCE_IDS.filter((id) => allowedIds.includes(id));
  if (preferred.length > 0) return preferred;
  return allowedIds.slice(0, Math.min(2, allowedIds.length));
};

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

const inferSectionArtifacts = (title: string): string => {
  const lower = title.toLowerCase();
  const hasTable = lower.includes('table') || lower.includes('matrix') || lower.includes('scorecard');
  const hasDiagram = lower.includes('chart') || lower.includes('diagram') || lower.includes('trend') || lower.includes('comparison');
  if (hasTable && hasDiagram) return 'Table + Diagram';
  if (hasTable) return 'Table';
  if (hasDiagram) return 'Diagram';
  return 'Narrative';
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
const STANDARD_RESTRICTED_STEP_IDS = [5, 6, 7, 8, 10];
const TRIAGE_AUTOSAVE_KEY = 'triage-wizard-autosave-v2';

const formatBytes = (bytes: number, decimals = 1) => {
  if (bytes === 0) return '0 B';
  const unit = 1024;
  const precision = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(unit));
  return `${parseFloat((bytes / Math.pow(unit, index)).toFixed(precision))} ${sizes[index]}`;
};

const cleanShortText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeScoreToTen = (score: number | null): number | null => {
  if (score === null) return null;
  const normalized = score > 10 ? score / 10 : score;
  return Math.max(0, Math.min(10, normalized));
};

const averageNumbers = (values: Array<number | null | undefined>): number | null => {
  const valid = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const tierToScore = (tier: number | null): number | null => {
  if (tier === null) return null;
  if (tier > 10) return normalizeScoreToTen(tier);
  if (tier <= 5) {
    const mapped: Record<number, number> = { 1: 3.5, 2: 5.2, 3: 7.0, 4: 8.4, 5: 9.3 };
    return mapped[Math.round(tier)] ?? 6;
  }
  return tier;
};

const deriveModuleScoresFromAnalysis = (analysisData: unknown): Record<string, number | null> => {
  const data = (analysisData ?? {}) as Record<string, unknown>;
  const tcaData = data.tcaData as {
    compositeScore?: number;
    overallScore?: number;
    categories?: Array<{ rawScore?: number; weightedScore?: number; weight?: number }>;
  } | undefined;
  const riskData = data.riskData as { riskFlags?: Array<{ flag?: string }> } | undefined;
  const macroData = data.macroData as { pestelDashboard?: Record<string, number>; trendOverlayScore?: number } | undefined;
  const benchmarkData = data.benchmarkData as {
    benchmarkOverlay?: Array<{ score?: number; percentile?: number }>;
    overlayScore?: number;
  } | undefined;
  const growthData = data.growthData as { tier?: number } | undefined;
  const founderFitData = data.founderFitData as { readinessScore?: number } | undefined;
  const teamData = data.teamData as { interpretation?: string } | undefined;
  const gapData = data.gapData as { heatmap?: Array<{ gap?: number; priority?: string }> } | undefined;

  const tcaCategories = Array.isArray(tcaData?.categories) ? tcaData.categories : [];
  const tcaFromWeighted = tcaCategories.length > 0
    ? tcaCategories.reduce((sum, cat) => {
      const weighted = toNumberOrNull(cat.weightedScore);
      if (weighted !== null) return sum + weighted;
      const raw = toNumberOrNull(cat.rawScore);
      const weight = toNumberOrNull(cat.weight);
      if (raw === null || weight === null) return sum;
      return sum + (raw * (weight / 100));
    }, 0)
    : null;
  const tcaScore = normalizeScoreToTen(
    tcaFromWeighted ?? toNumberOrNull(tcaData?.compositeScore) ?? toNumberOrNull(tcaData?.overallScore)
  );

  const riskFlagMap: Record<string, number> = { green: 9, yellow: 6, red: 3 };
  const riskFlags = Array.isArray(riskData?.riskFlags) ? riskData.riskFlags : [];
  const riskBase = averageNumbers(
    riskFlags.map((f) => riskFlagMap[(f.flag || '').toLowerCase()])
  );
  const redCount = riskFlags.filter((f) => (f.flag || '').toLowerCase() === 'red').length;
  const riskScore = normalizeScoreToTen(
    riskBase === null ? null : Math.max(0, riskBase - ((redCount / Math.max(1, riskFlags.length)) * 2.5))
  );

  const pestelValues = Object.values(macroData?.pestelDashboard ?? {})
    .map((v) => toNumberOrNull(v))
    .filter((v): v is number => v !== null);
  const macroBase = averageNumbers(pestelValues);
  const trendOverlay = toNumberOrNull(macroData?.trendOverlayScore);
  const macroScore = normalizeScoreToTen(
    macroBase === null
      ? null
      : macroBase + ((trendOverlay === null ? 0 : trendOverlay) * 20)
  );

  const benchmarkValues = (benchmarkData?.benchmarkOverlay ?? [])
    .map((item) => averageNumbers([
      normalizeScoreToTen(toNumberOrNull(item.score)),
      normalizeScoreToTen(toNumberOrNull(item.percentile)),
    ]))
    .filter((v): v is number => v !== null);
  const benchmarkOverlay = toNumberOrNull(benchmarkData?.overlayScore);
  const benchmarkScore = normalizeScoreToTen(
    averageNumbers([
      averageNumbers(benchmarkValues),
      benchmarkOverlay === null ? null : 5 + (benchmarkOverlay * 10),
    ])
  );

  const growthScore = normalizeScoreToTen(tierToScore(toNumberOrNull(growthData?.tier)));
  const founderScore = normalizeScoreToTen(toNumberOrNull(founderFitData?.readinessScore));

  const teamCompletenessMatch = teamData?.interpretation?.match(/team completeness:\s*(\d+(?:\.\d+)?)%/i);
  const teamScore = normalizeScoreToTen(toNumberOrNull(teamCompletenessMatch?.[1]));

  const gapValues = (gapData?.heatmap ?? [])
    .map((item) => toNumberOrNull(item.gap))
    .filter((v): v is number => v !== null);
  const highPriorityCount = (gapData?.heatmap ?? [])
    .filter((item) => (item.priority || '').toLowerCase() === 'high').length;
  const gapPenalty = highPriorityCount * 0.2;
  const gapScore = normalizeScoreToTen(
    gapValues.length > 0 ? (10 - ((averageNumbers(gapValues) ?? 0) / 10) - gapPenalty) : null
  );

  const moduleScores: Record<string, number | null> = {
    tca: tcaScore,
    risk: riskScore,
    growth: growthScore,
    macro: macroScore,
    benchmark: benchmarkScore,
    team: teamScore,
    founderFit: founderScore,
    gap: gapScore,
  };

  const fallback = averageNumbers([tcaScore, riskScore, macroScore, benchmarkScore, growthScore]);
  TRIAGE_MODULES.forEach((m) => {
    if (!(m.id in moduleScores) || moduleScores[m.id] === null) {
      moduleScores[m.id] = fallback;
    }
  });

  return moduleScores;
};

const computeWeightedCompositeScore = (
  selectedModuleIds: string[],
  moduleScores: Record<string, number | null>,
  weightOverrides?: Record<string, number>
): number | null => {
  const activeModules = TRIAGE_MODULES
    .filter((m) => selectedModuleIds.includes(m.id))
    .map((m) => ({
      ...m,
      weight: (weightOverrides && typeof weightOverrides[m.id] === 'number' && weightOverrides[m.id] > 0)
        ? weightOverrides[m.id]
        : m.weight,
      score: moduleScores[m.id],
    }))
    .filter((m): m is (typeof TRIAGE_MODULES)[number] & { score: number } => typeof m.score === 'number' && Number.isFinite(m.score));

  if (activeModules.length === 0) return null;
  const totalWeight = activeModules.reduce((sum, m) => sum + m.weight, 0);
  if (totalWeight <= 0) return null;

  const weighted = activeModules.reduce((sum, m) => sum + (m.score * m.weight), 0) / totalWeight;
  return Math.max(0, Math.min(10, weighted));
};

type ModuleQualityAssessment = {
  moduleId: string;
  moduleName: string;
  score: number | null;
  quality: 'high' | 'standard' | 'low' | 'missing';
  penalty: number;
};

type QualityTier = 'high' | 'standard' | 'low';

type TriageQualityAssessment = {
  hasComputedAnalysis: boolean;
  evidenceCoveragePct: number;
  moduleCoveragePct: number;
  moduleQualityDetails: ModuleQualityAssessment[];
  averageModuleQuality: number;
  verificationScore: number;
  consistencyScore: number;
  qualityScore: number;
  qualityTier: QualityTier;
  gatePassed: boolean;
  canExport: boolean;
  blockers: string[];
  recommendationLabel: string;
  reportNarrative: {
    executiveSummary: string;
    analysisNarrative: string;
    recommendationNarrative: string;
  };
};

const getModuleQualityTier = (score: number | null): 'high' | 'standard' | 'low' | 'missing' => {
  if (score === null || score === 0) return 'missing';
  if (score >= 7.5) return 'high';
  if (score >= 5.5) return 'standard';
  return 'low';
};

const getRecommendationLabel = (score: number, qualityTier: QualityTier): string => {
  if (!Number.isFinite(score) || score <= 0) return 'Not computed';
  if (qualityTier === 'high') {
    if (score >= 7) return 'Proceed';
    if (score >= 5.5) return 'Conditional';
    return 'Pass';
  }
  if (qualityTier === 'standard') {
    if (score >= 7) return 'Conditional';
    return 'Pass';
  }
  return 'Manual Review Required';
};

const evaluateTriageQuality = (params: {
  analysisData: unknown;
  selectedModuleIds: string[];
  moduleScores: Record<string, number | null>;
  compositeScore: number;
  companyName: string;
  sector: string;
  stage: string;
  website: string;
  country: string;
  stateRegion: string;
  city: string;
  pitchSummary: string;
  keyMetrics: string;
  teamInfo: string;
  productDescription: string;
  annualRevenue: string;
  preMoneyValuation: string;
  allModulesMetadata?: typeof TRIAGE_MODULES;
}): TriageQualityAssessment => {
  const {
    analysisData,
    selectedModuleIds,
    moduleScores,
    compositeScore,
    companyName,
    sector,
    stage,
    website,
    country,
    stateRegion,
    city,
    pitchSummary,
    keyMetrics,
    teamInfo,
    productDescription,
    annualRevenue,
    preMoneyValuation,
  } = params;

  const requiredEvidenceFields = [
    companyName,
    sector,
    stage,
    website,
    country,
    stateRegion,
    city,
    pitchSummary,
    keyMetrics,
    teamInfo,
    productDescription,
    annualRevenue,
    preMoneyValuation,
  ];
  const requiredEvidenceFilled = requiredEvidenceFields.filter((value) => value.trim().length > 0).length;
  const evidenceCoveragePct = Math.round((requiredEvidenceFilled / Math.max(requiredEvidenceFields.length, 1)) * 100);

  const activeModuleCount = Math.max(selectedModuleIds.length, 1);
  const scoredModuleCount = selectedModuleIds.filter((id) => {
    const score = moduleScores[id];
    return typeof score === 'number' && Number.isFinite(score) && score > 0;
  }).length;
  const moduleCoveragePct = Math.round((scoredModuleCount / activeModuleCount) * 100);

  const moduleMetadata = params.allModulesMetadata ?? TRIAGE_MODULES;
  const moduleQualityDetails: ModuleQualityAssessment[] = selectedModuleIds.map((modId) => {
    const moduleMeta = moduleMetadata.find((m) => m.id === modId);
    const moduleScore = moduleScores[modId];
    const quality = getModuleQualityTier(moduleScore);
    let penalty = 0;
    if (quality === 'low') penalty = 15;
    if (quality === 'standard') penalty = 5;
    if (quality === 'missing') penalty = 25;
    return {
      moduleId: modId,
      moduleName: moduleMeta?.name || modId,
      score: moduleScore ?? null,
      quality,
      penalty,
    };
  });
  const totalModulePenalty = moduleQualityDetails.reduce((sum, m) => sum + m.penalty, 0);
  const averageModuleQuality = Math.max(0, 100 - (totalModulePenalty / Math.max(selectedModuleIds.length, 1)));

  const parsed = (analysisData ?? {}) as {
    keyFindings?: string[];
    riskData?: { riskFlags?: unknown[] };
  };
  const keyFindingsCount = Array.isArray(parsed.keyFindings) ? parsed.keyFindings.length : 0;
  const hasRiskSignals = Array.isArray(parsed.riskData?.riskFlags) && parsed.riskData.riskFlags.length > 0;

  const scoredValues = Object.values(moduleScores)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  const maxScore = scoredValues.length > 0 ? Math.max(...scoredValues) : 0;
  const minScore = scoredValues.length > 0 ? Math.min(...scoredValues) : 0;
  const scoreSpread = maxScore - minScore;

  const verificationChecks = [
    compositeScore >= 5.5,
    evidenceCoveragePct >= 100,
    moduleCoveragePct >= 100,
    keyFindingsCount >= 5,
    hasRiskSignals,
  ];
  const verificationScore = Math.round(
    (verificationChecks.filter(Boolean).length / Math.max(verificationChecks.length, 1)) * 100
  );

  let consistencyPenalty = 0;
  if (compositeScore <= 0) consistencyPenalty += 35;
  if (moduleCoveragePct < 100) consistencyPenalty += 25;
  if (evidenceCoveragePct < 100) consistencyPenalty += 22;
  if (keyFindingsCount < 5) consistencyPenalty += 15;
  if (!hasRiskSignals) consistencyPenalty += 12;
  if (scoreSpread > 3.0) consistencyPenalty += 15;
  if (averageModuleQuality < 90) consistencyPenalty += 18;
  const consistencyScore = Math.max(0, 100 - consistencyPenalty);

  const qualityScore = Math.round(
    (evidenceCoveragePct * 0.25)
    + (moduleCoveragePct * 0.25)
    + (averageModuleQuality * 0.20)
    + (verificationScore * 0.15)
    + (consistencyScore * 0.15)
  );

  const qualityTier: QualityTier = qualityScore >= 90 ? 'high' : qualityScore >= 75 ? 'standard' : 'low';

  const hasComputedAnalysis = Boolean(analysisData)
    || compositeScore > 0
    || scoredValues.length > 0;

  const blockers: string[] = [];
  const warnings: string[] = [];
  if (hasComputedAnalysis) {
    if (evidenceCoveragePct < 100) blockers.push(`Evidence coverage ${evidenceCoveragePct}% below 100% minimum; complete all required company fields.`);
    if (moduleCoveragePct < 100) blockers.push(`Module coverage ${moduleCoveragePct}% below 100% minimum; rerun analysis to ensure every selected engine scores.`);
    if (verificationScore < 80) warnings.push(`Verification score ${verificationScore}% is below 80%; improve findings and risk data quality.`);
    if (consistencyScore < 75) blockers.push(`Consistency score ${consistencyScore}% is weak; module disagreement or scoring gaps detected.`);
    if (compositeScore <= 0) blockers.push('Composite score is not available from analysis output.');
    if (averageModuleQuality < 90) blockers.push(`Average module quality ${Math.round(averageModuleQuality)}% is below 90%; improve individual module scoring.`);
    if (qualityTier !== 'high') warnings.push(`Quality tier is ${qualityTier}; analysis may require manual review before final recommendation.`);
  }

  const canExport = hasComputedAnalysis && blockers.length === 0 && qualityTier === 'high';
  const gatePassed = hasComputedAnalysis && blockers.length === 0 && qualityTier === 'high';
  const recommendationLabel = !hasComputedAnalysis
    ? 'Not computed'
    : gatePassed
    ? getRecommendationLabel(compositeScore, qualityTier)
    : 'Manual Review Required';

  const executiveSummary = !hasComputedAnalysis
    ? 'Analysis has not been executed yet. Complete generation to produce an evidence-backed executive summary.'
    : `${companyName || 'This company'} received a composite score of ${compositeScore.toFixed(1)}/10 with ${qualityTier} quality (${qualityScore}%). Evidence: ${evidenceCoveragePct}% | Modules: ${moduleCoveragePct}% | Avg Module Quality: ${Math.round(averageModuleQuality)}%. ${canExport ? `Recommendation: ${recommendationLabel}` : 'Quality gates require manual analyst review before final recommendation.'}`

  const analysisNarrative = !hasComputedAnalysis
    ? 'No analytical narrative is available before engines run. Upload evidence and execute analysis to generate validated module findings.'
    : `Analysis produced ${qualityTier.toUpperCase()} quality (${qualityScore}%) based on: Evidence Coverage ${evidenceCoveragePct}%, Module Coverage ${moduleCoveragePct}%, Verification ${verificationScore}%, Consistency ${consistencyScore}%, Avg Module Quality ${Math.round(averageModuleQuality)}%. Sector (${sector || 'Not set'}) · Stage (${stage || 'Not set'}) · Location (${[city, stateRegion, country].filter((v) => v.trim().length > 0).join(', ') || 'Not set'}). Key Findings: ${keyFindingsCount} | Risk Signals: ${hasRiskSignals ? 'Yes' : 'No'}. ${moduleQualityDetails.filter((m) => m.quality === 'high').length}/${selectedModuleIds.length} modules at high quality.`

  const recommendationNarrative = gatePassed
    ? `Final recommendation: ${recommendationLabel}. 100% quality gate passed: High tier (${qualityScore}%) with full evidence backing, complete module coverage, and strong cross-module consistency. Safe to export and archive.`
    : `Final recommendation is withheld pending manual review. Quality blockers: ${blockers.join(' ')} Warnings: ${warnings.join(' ')} To reach 100% quality: maximize evidence coverage to 100%, ensure 100% module completion, strengthen module agreement, and achieve 90%+ average module quality.`;

  return {
    hasComputedAnalysis,
    evidenceCoveragePct,
    moduleCoveragePct,
    moduleQualityDetails,
    averageModuleQuality,
    verificationScore,
    consistencyScore,
    qualityScore,
    qualityTier,
    gatePassed,
    canExport,
    blockers,
    recommendationLabel,
    reportNarrative: {
      executiveSummary,
      analysisNarrative,
      recommendationNarrative,
    },
  };
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

  if (/\b(pitch\s*deck|deck|executive\s*summary|company\s*overview|financials?|problem\s*&?\s*solution|confidential)\b/i.test(candidate)) {
    return '';
  }

  const genericTokens = new Set([
    'company', 'startup', 'overview', 'summary', 'introduction', 'information', 'details', 'required', 'review', 'extracted', 'fields',
    'pitch', 'deck', 'problem', 'solution', 'traction', 'financial', 'financials', 'market', 'team',
  ]);
  const normalized = candidate.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 0 && words.every((w) => genericTokens.has(w))) {
    return '';
  }

  if (/\b(company\s*information|required\s*company\s*fields|review\s*extracted\s*company\s*details|company\s*details|company\s+info)\b/i.test(candidate)) {
    return '';
  }

  if (/^[A-Z\s0-9&.'-]{3,}$/.test(candidate) && candidate.split(/\s+/).length >= 3) {
    return '';
  }

  return candidate;
};

const isLikelyInvalidExistingCompanyName = (value: unknown): boolean => {
  const text = cleanShortText(value);
  if (!text) return true;
  if (!cleanCompanyName(text)) return true;

  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 1 && new Set(['review', 'details', 'information', 'required', 'company']).has(words[0])) {
    return true;
  }

  return false;
};

const isCompanyMismatchedWithWebsite = (companyValue: unknown, websiteValue: unknown): boolean => {
  const cleanedCompany = cleanCompanyName(companyValue);
  const fromWebsite = extractDomainCompanyName(websiteValue);
  if (!cleanedCompany || !fromWebsite) return false;
  return cleanedCompany.toLowerCase() !== fromWebsite.toLowerCase();
};

const extractDomainCompanyName = (websiteValue: unknown): string => {
  const website = cleanShortText(websiteValue);
  if (!website) return '';

  try {
    const parsed = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const base = host.split('.')[0] ?? '';
    if (!base) return '';

    const generic = new Set(['app', 'web', 'site', 'home', 'portal', 'company', 'startup']);
    if (generic.has(base)) return '';

    const words = base
      .replace(/[-_]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

    return cleanCompanyName(words.join(' '));
  } catch {
    return '';
  }
};

const resolveCompanyNameCandidate = (input: {
  aiCandidate?: unknown;
  legalName?: unknown;
  website?: unknown;
  inferredFromText?: string;
  existing?: string;
}): string => {
  const options = [
    cleanCompanyName(input.aiCandidate),
    cleanCompanyName(input.legalName),
    cleanCompanyName(input.inferredFromText),
    extractDomainCompanyName(input.website),
    cleanCompanyName(input.existing),
  ].filter(Boolean);

  return options[0] ?? '';
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

const cleanBusinessModelValue = (value: unknown): string => {
  const text = cleanShortText(value);
  if (!text) return '';
  if (/\b(pitch\s*deck|company\s*overview|financials?|executive\s*summary|problem\s*&?\s*solution)\b/i.test(text)) return '';
  return text;
};

const cleanMoneyValue = (value: unknown): string => {
  const text = cleanShortText(value);
  if (!text) return '';
  const match = text.match(/\$?\s*([\d,.]+)\s*(million|billion|thousand|m|b|k)?/i);
  if (!match) return '';
  const amount = match[1].replace(/,/g, '');
  const unit = (match[2] ?? '').toLowerCase();
  if (!unit) return `$${amount}`;
  if (unit === 'million' || unit === 'm') return `$${amount}M`;
  if (unit === 'billion' || unit === 'b') return `$${amount}B`;
  if (unit === 'thousand' || unit === 'k') return `$${amount}K`;
  return `$${amount}`;
};

const cleanPitchDeckPathValue = (value: unknown): string => {
  const text = cleanShortText(value);
  if (!text) return '';
  if (/\b(pitch\s*deck|deck)\b/i.test(text) && !/[\\/.]/.test(text)) return '';
  if (/(\.pdf|\.pptx?|\.docx?|\.key)$/i.test(text) || /[\\/]/.test(text)) return text;
  return '';
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

const extractPreMoneyValuationText = (sourceText: string): string => {
  const match = sourceText.match(/(?:pre[-\s]?money\s+valuation|valuation|company\s+valuation)[:\s]*\$?([\d,.]+)\s*(million|m|k|thousand|billion|b)?/i);
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
  const stateCandidate = parts[1] ?? '';
  const isUsStateLike = /^[A-Z]{2}$/.test(stateCandidate) || /^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)$/i.test(stateCandidate);
  const fallbackCountry = parts[2] ?? (isUsStateLike ? 'United States' : '');

  return {
    city: parts[0] ?? '',
    state: stateCandidate,
    country: fallbackCountry,
  };
};

const inferStageFromText = (sourceText: string): string => {
  const lower = sourceText.toLowerCase();
  if (/pre[-\s]?seed/.test(lower)) return 'Pre-seed';
  if (/\bseed\b/.test(lower)) return 'Seed';
  if (/series\s*a\b/.test(lower)) return 'Series A';
  if (/series\s*b\b/.test(lower)) return 'Series B';
  if (/series\s*c\b|series\s*d\b|series\s*e\b|late\s*stage/.test(lower)) return 'Series C+';
  if (/\bgrowth\b/.test(lower)) return 'Growth';
  return '';
};

const inferSectorFromText = (sourceText: string): string => {
  const lower = sourceText.toLowerCase();
  if (/\bsaas\b|software|technology|enterprise\s+software/.test(lower)) return 'Technology / SaaS';
  if (/medtech|healthcare|medical/.test(lower)) return 'Healthcare / MedTech';
  if (/biotech|biotechnology|pharma/.test(lower)) return 'Biotechnology';
  if (/fintech|financial\s+technology|payments/.test(lower)) return 'FinTech';
  if (/cleantech|clean\s+energy|climate\s+tech|renewable/.test(lower)) return 'CleanTech / Energy';
  if (/e-?commerce|retail|marketplace/.test(lower)) return 'E-commerce / Retail';
  if (/manufacturing|industrial/.test(lower)) return 'Manufacturing';
  if (/\bai\b|machine\s+learning|deep\s+tech/.test(lower)) return 'AI / Deep Tech';
  return '';
};

const deriveProductDescription = (oneLine: string, companyDesc: string): string => {
  if (cleanLongText(oneLine)) return cleanLongText(oneLine);
  const firstSentence = cleanLongText(companyDesc).split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length >= 20) ?? '';
  return firstSentence;
};

const inferBusinessModelFromText = (sourceText: string): string => {
  const lower = sourceText.toLowerCase();
  if (/subscription|arr|mrr|saas|license/.test(lower)) return 'B2B SaaS subscription';
  if (/marketplace|take\s*rate|buyer|seller/.test(lower)) return 'Marketplace';
  if (/enterprise|pilot|contracts|procurement|credit\s*union|bank/.test(lower)) return 'B2B enterprise sales';
  if (/consumer|d2c|direct-to-consumer|retail/.test(lower)) return 'D2C / Consumer';
  return '';
};

const buildComprehensiveCompanyDescription = (sourceText: string, oneLine: string, sectorValue: string, stageValue: string): string => {
  const normalized = cleanLongText(sourceText).replace(/\s+/g, ' ').trim();
  const excerpt = normalized.slice(0, 900);
  const summary = cleanOneLineDescription(oneLine) || 'The company is building a focused solution for a well-defined market need.';
  const sectorText = sectorValue || 'N/A';
  const stageText = stageValue || 'N/A';

  const paragraphs = [
    `Overview: ${summary}`,
    `Context: This startup operates in ${sectorText} and is currently at the ${stageText} stage. It demonstrates execution momentum, product-market direction, and a go-to-market narrative based on available deck evidence.`,
    `Evidence Extract: ${excerpt || 'N/A'}`,
  ];

  return cleanLongText(paragraphs.join('\n\n')).slice(0, 1800);
};

const buildComprehensiveProductDescription = (sourceText: string, oneLine: string, companyDesc: string): string => {
  const normalized = cleanLongText(sourceText).replace(/\s+/g, ' ').trim();
  const productHint = cleanLongText(
    normalized.match(/(?:solution|product|platform|how\s+it\s+works)[:\s-]*([^.!?]{40,300})/i)?.[1] ?? ''
  );
  const companySentence = cleanLongText(companyDesc)
    .split(/[.!?\n]/)
    .map((sentence) => sentence.trim())
    .find((sentence) => sentence.length >= 30 && !/(revenue|valuation|funding|raising|asking|arr|mrr)/i.test(sentence)) ?? '';
  const baseline = [productHint, deriveProductDescription(oneLine, companyDesc), companySentence]
    .map((value) => cleanLongText(value))
    .find((value) => value.length >= 24 && !/(revenue|valuation|funding|raising|asking|arr|mrr)/i.test(value)) ?? '';
  const detail = normalized
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 24 && !/(revenue|valuation|funding|raising|asking|arr|mrr)/i.test(sentence))
    .slice(0, 3)
    .join('. ');

  const paragraphs = [
    `Product Summary (AI-generated): ${baseline || 'The company offers a focused product built to solve a concrete customer workflow problem with practical operational value.'}`,
    'Functional Detail: The product is positioned as a workflow-oriented solution that helps users complete critical tasks faster, with lower friction, stronger consistency, and clearer measurable outcomes. Its value comes from usability, embedded automation, and fit within the customer\'s existing operating environment.',
    'Value Proposition: The solution is designed to improve customer efficiency, reduce manual effort, and create repeatable business value through easier adoption, stronger engagement, and scalable expansion over time. The product narrative supports commercial adoption rather than serving only as a conceptual technology showcase.',
    `Supporting Evidence: ${detail || cleanLongText(companyDesc).slice(0, 500) || 'N/A'}`,
  ];

  return cleanLongText(paragraphs.join('\n\n')).slice(0, 1800);
};

const normalizeRequiredText = (value: string, fallback = 'N/A'): string => {
  const text = cleanLongText(value);
  return text || fallback;
};

const normalizeRequiredShortText = (value: string, fallback = 'N/A'): string => {
  const text = cleanShortText(value);
  return text || fallback;
};

const normalizeRequiredMoneyText = (value: string, fallback = 'N/A'): string => {
  const text = cleanShortText(value);
  if (!text) return fallback;
  if (/^n\/?a$/i.test(text)) return 'N/A';
  return cleanMoneyValue(text) || text;
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

const parseMoneyToNumber = (value: string): number | null => {
  const input = value.trim();
  if (!input) return null;

  const match = input.match(/^\$?\s*([\d,.]+)\s*([kmb])?$/i);
  if (!match) return null;

  const base = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(base)) return null;

  const unit = (match[2] ?? '').toLowerCase();
  const multiplier = unit === 'k' ? 1_000 : unit === 'm' ? 1_000_000 : unit === 'b' ? 1_000_000_000 : 1;
  return base * multiplier;
};

const isPositiveNumberText = (value: string): boolean => {
  const num = parseMoneyToNumber(value);
  return num !== null && Number.isFinite(num) && num > 0;
};

const isProvidedMoneyOrNA = (value: string): boolean => {
  const text = cleanShortText(value);
  if (!text) return false;
  if (/^n\/?a$/i.test(text)) return true;
  if (/^\$?\s*0+(?:\.0+)?$/.test(text.replace(/,/g, ''))) return true;
  return isPositiveNumberText(text);
};

const MIN_AUTOFILL_CONFIDENCE = 0.68;
const MIN_REQUIREMENT_MATCH_SCORE = 0.65;
const MIN_EMPTY_REQUIRED_CONFIDENCE = 0.58;
const MIN_EMPTY_REQUIRED_REQUIREMENT_SCORE = 0.35;
const MIN_LOCATION_FIELD_CONFIDENCE = 0.35; // Location fields: more lenient
const MIN_FINANCIAL_FIELD_CONFIDENCE = 0.40; // Financial fields: more lenient

const confidenceForKeys = (map: unknown, keys: string[]): number => {
  if (!map || typeof map !== 'object') return 0;
  const rec = map as Record<string, unknown>;
  return keys.reduce((best, key) => {
    const val = rec[key];
    return typeof val === 'number' && Number.isFinite(val) ? Math.max(best, val) : best;
  }, 0);
};

const shouldApplyByConfidence = (map: unknown, keys: string[], min = MIN_AUTOFILL_CONFIDENCE): boolean => {
  return confidenceForKeys(map, keys) >= min;
};

const shouldApplyLocationField = (confidenceMap: unknown, keys: string[]): boolean => {
  // For location fields (country, state, city), use much lower confidence threshold when field is empty
  return confidenceForKeys(confidenceMap, keys) >= MIN_LOCATION_FIELD_CONFIDENCE;
};

const shouldApplyFinancialField = (confidenceMap: unknown, keys: string[]): boolean => {
  // For financial fields (revenue, valuation), use lower confidence threshold when field is empty
  return confidenceForKeys(confidenceMap, keys) >= MIN_FINANCIAL_FIELD_CONFIDENCE;
};

const requirementScoreForKeys = (map: unknown, keys: string[]): number => {
  if (!map || typeof map !== 'object') return 0;
  const rec = map as Record<string, unknown>;
  return keys.reduce((best, key) => {
    const entry = rec[key];
    if (!entry || typeof entry !== 'object') return best;
    const score = (entry as Record<string, unknown>).score;
    return typeof score === 'number' && Number.isFinite(score) ? Math.max(best, score) : best;
  }, 0);
};

const shouldApplyByRequirement = (map: unknown, keys: string[], min = MIN_REQUIREMENT_MATCH_SCORE): boolean => {
  return requirementScoreForKeys(map, keys) >= min;
};

const shouldApplyField = (confidenceMap: unknown, requirementMap: unknown, keys: string[]): boolean => {
  return shouldApplyByConfidence(confidenceMap, keys) && shouldApplyByRequirement(requirementMap, keys);
};

const shouldApplyFieldForEmptyRequired = (confidenceMap: unknown, requirementMap: unknown, keys: string[]): boolean => {
  return shouldApplyField(confidenceMap, requirementMap, keys)
    || (
      shouldApplyByConfidence(confidenceMap, keys, MIN_EMPTY_REQUIRED_CONFIDENCE)
      && shouldApplyByRequirement(requirementMap, keys, MIN_EMPTY_REQUIRED_REQUIREMENT_SCORE)
    );
};

const hasLowConfidenceCriticalFields = (map: unknown): boolean => {
  const critical: string[][] = [
    ['company_name', 'companyName', 'legal_name', 'legalName'],
    ['website'],
    ['sector', 'industryVertical'],
    ['stage', 'developmentStage'],
    ['business_model', 'businessModel'],
    ['country'],
    ['state'],
    ['city'],
    ['annual_revenue', 'annualRevenue'],
    ['pre_money_valuation', 'preMoneyValuation'],
  ];
  return critical.some((keys) => confidenceForKeys(map, keys) > 0 && !shouldApplyByConfidence(map, keys));
};

const hasWeakRequirementCriticalFields = (map: unknown): boolean => {
  const critical: string[][] = [
    ['company_name', 'companyName', 'legal_name', 'legalName'],
    ['website'],
    ['sector', 'industryVertical'],
    ['stage', 'developmentStage'],
    ['business_model', 'businessModel'],
    ['country'],
    ['state'],
    ['city'],
    ['annual_revenue', 'annualRevenue'],
    ['pre_money_valuation', 'preMoneyValuation'],
  ];
  return critical.some((keys) => requirementScoreForKeys(map, keys) > 0 && !shouldApplyByRequirement(map, keys));
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

const ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS = new Set([
  'analyst-comments',
  'analyst-ai-deviation',
  'final-recommendation',
]);

const ensureAlwaysAvailableTriageSections = (sections: ReportSection[]): ReportSection[] =>
  sections.map((section) =>
    ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS.has(section.id)
      ? { ...section, active: true }
      : section
  );

const getDefaultSelectedModulesForRole = (role: 'admin' | 'analyst' | 'standard'): string[] => {
  const triageModuleIds = new Set(TRIAGE_MODULES.map((module) => module.id));
  const activeManaged = getActiveManagedModuleIds().filter((id: string) => triageModuleIds.has(id));

  if (role === 'standard') {
    const standardModules = activeManaged.filter((id: string) => id === 'tca' || id === 'risk');
    return standardModules.length > 0 ? standardModules : ['tca', 'risk'];
  }

  return activeManaged.length > 0 ? activeManaged : ['tca', 'risk', 'growth', 'macro'];
};

const applyModuleStateToTriageSections = (
  sections: ReportSection[],
  selectedModules: string[]
): ReportSection[] => {
  const selectedSet = new Set(selectedModules);
  return ensureAlwaysAvailableTriageSections(sections).map((section) => {
    if (ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS.has(section.id)) {
      return section;
    }

    const mappedModules = Object.entries(TRIAGE_SECTION_MODULE_MAP as Record<string, string[]>)
      .filter(([, sectionIds]) => sectionIds.includes(section.id))
      .map(([moduleId]) => moduleId);

    if (mappedModules.length === 0) {
      return section;
    }

    const shouldDisable = mappedModules.every((moduleId) => !selectedSet.has(moduleId));
    return shouldDisable ? { ...section, active: false } : section;
  });
};

interface ExtractedMetric {
  field: string;
  value: string;
  source: string;
  verified: boolean;
}

const applyStringValue =
  (setter: (value: string) => void) =>
  (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
  };

export default function TriageReportWizardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isClientReady, setIsClientReady] = useState(false);

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

  const [selectedSources, setSelectedSources] = useState<string[]>(
    getPreferredExternalSourceSelection(EXTERNAL_SOURCES.map((source) => source.id))
  );
  const [activeExternalSourceIds, setActiveExternalSourceIds] = useState<string[]>(
    EXTERNAL_SOURCES.map((s) => s.id)
  );
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
  const [derivedModuleScores, setDerivedModuleScores] = useState<Record<string, number | null>>({});
  const [savedModuleWeights, setSavedModuleWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    settingsApi.getActiveVersion().then((version) => {
      if (cancelled || !version?.module_settings) return;
      const weights: Record<string, number> = {};
      for (const setting of version.module_settings) {
        const w = Number(setting.weight);
        if (Number.isFinite(w) && w > 0 && setting.is_enabled !== false) {
          weights[setting.module_id] = w;
        }
      }
      setSavedModuleWeights(weights);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Role-based
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'standard'>('standard');
  const [reportOwner, setReportOwner] = useState('Unknown User');
  const [trackingId, setTrackingId] = useState('TRIAGE-LOADING');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);

  // Storage & Export
  const [savedReportId, setSavedReportId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [humanReviewNotes, setHumanReviewNotes] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillText, setAutoFillText] = useState('');
  const lastAutoFetchedExternalKeyRef = useRef('');
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasRestoredAutosave, setHasRestoredAutosave] = useState(false);

  const qualityAssessment = useMemo(() => evaluateTriageQuality({
    analysisData: analysisResult,
    selectedModuleIds: selectedModules,
    moduleScores: derivedModuleScores,
    compositeScore,
    companyName,
    sector,
    stage,
    website,
    country,
    stateRegion,
    city,
    pitchSummary,
    keyMetrics,
    teamInfo,
    productDescription,
    annualRevenue,
    preMoneyValuation,
  }), [
    analysisResult,
    selectedModules,
    derivedModuleScores,
    compositeScore,
    companyName,
    sector,
    stage,
    website,
    country,
    stateRegion,
    city,
    pitchSummary,
    keyMetrics,
    teamInfo,
    productDescription,
    annualRevenue,
    preMoneyValuation,
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
    setSelectedModules(['tca', 'risk', 'growth', 'macro']);
    setSelectedSources(getPreferredExternalSourceSelection(activeExternalSourceIds));
    setExternalData([]);
    setFetchingData(false);
    setSimulatedScores(Object.fromEntries(TRIAGE_MODULES.map((m) => [m.id, 50])));
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStatus('');
    setAnalysisResult(null);
    setCompositeScore(0);
    setDerivedModuleScores({});
    setSavedReportId(null);
    setIsSaving(false);
    setSaveError(null);
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
    setReportSections(
      ensureAlwaysAvailableTriageSections(
        isAdminOrAnalyst ? DEFAULT_ADMIN_SECTIONS : DEFAULT_STANDARD_SECTIONS
      )
    );
    toast({ title: 'Fresh start ready', description: 'Wizard has been reset. You can begin again from upload.' });
  };

  const visibleExternalSources = EXTERNAL_SOURCES.filter((src) => activeExternalSourceIds.includes(src.id));
  const selectedExternalSourceIds = selectedSources.filter((id) => activeExternalSourceIds.includes(id));
  const selectedExternalSourceSignature = selectedExternalSourceIds.slice().sort().join('|');

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
      const defaultModules = getDefaultSelectedModulesForRole(role);
      setSelectedModules(defaultModules);

      if (isPrivileged) {
        const saved = localStorage.getItem('report-config-triage-admin');
        const baseSections = ensureAlwaysAvailableTriageSections(
          saved ? JSON.parse(saved) : DEFAULT_ADMIN_SECTIONS
        );
        setReportSections(applyModuleStateToTriageSections(baseSections, defaultModules));
      } else {
        setReportSections(applyModuleStateToTriageSections(DEFAULT_STANDARD_SECTIONS, defaultModules));
      }
    } catch {
      setUserRole('standard');
      setReportOwner('Unknown User');
      const fallbackModules = getDefaultSelectedModulesForRole('standard');
      setSelectedModules(fallbackModules);
      setReportSections(applyModuleStateToTriageSections(DEFAULT_STANDARD_SECTIONS, fallbackModules));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadManagedDataSources = async () => {
      const stored = await azureStorage.getItem<unknown>('data-sources-config');
      if (!Array.isArray(stored)) {
        return;
      }

      const configuredActive = stored
        .filter((item) => typeof item === 'object' && item !== null)
        .map((item) => item as { id?: string; active?: boolean })
        .filter((item) => item.id && item.active)
        .map((item) => item.id as string);

      const allowed = EXTERNAL_SOURCES
        .map((src) => src.id)
        .filter((id) => configuredActive.includes(id));

      if (cancelled || allowed.length === 0) {
        return;
      }

      setActiveExternalSourceIds(allowed);
      setSelectedSources((prev) => {
        const filtered = prev.filter((id) => allowed.includes(id));
        return filtered.length > 0 ? filtered : getPreferredExternalSourceSelection(allowed);
      });
    };

    void loadManagedDataSources();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRIAGE_AUTOSAVE_KEY);
      if (!raw) {
        return;
      }

      const snapshot = JSON.parse(raw) as Record<string, unknown>;
      if (typeof snapshot.currentStep === 'number') setCurrentStep(snapshot.currentStep);
      if (Array.isArray(snapshot.completedSteps)) setCompletedSteps(snapshot.completedSteps as number[]);
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
      if (typeof snapshot.legalName === 'string') setLegalName(snapshot.legalName);
      if (typeof snapshot.numberOfEmployees === 'string') setNumberOfEmployees(snapshot.numberOfEmployees);
      if (typeof snapshot.pitchSummary === 'string') setPitchSummary(snapshot.pitchSummary);
      if (typeof snapshot.keyMetrics === 'string') setKeyMetrics(snapshot.keyMetrics);
      if (typeof snapshot.teamInfo === 'string') setTeamInfo(snapshot.teamInfo);
      if (typeof snapshot.productDescription === 'string') setProductDescription(snapshot.productDescription);
      if (typeof snapshot.framework === 'string') setFramework(snapshot.framework as Framework);
      if (Array.isArray(snapshot.selectedModules)) setSelectedModules(snapshot.selectedModules as string[]);
      if (Array.isArray(snapshot.selectedSources)) setSelectedSources(snapshot.selectedSources as string[]);
      if (snapshot.simulatedScores && typeof snapshot.simulatedScores === 'object') {
        setSimulatedScores(snapshot.simulatedScores as Record<string, number>);
      }
      if (snapshot.derivedModuleScores && typeof snapshot.derivedModuleScores === 'object') {
        setDerivedModuleScores(snapshot.derivedModuleScores as Record<string, number | null>);
      }
      if (Array.isArray(snapshot.reportSections)) setReportSections(snapshot.reportSections as ReportSection[]);
      if (typeof snapshot.compositeScore === 'number') setCompositeScore(snapshot.compositeScore);
      if (snapshot.analysisResult) setAnalysisResult(snapshot.analysisResult);
      if (typeof snapshot.extractedText === 'string') setExtractedText(snapshot.extractedText);
      if (typeof snapshot.additionalContext === 'string') setAdditionalContext(snapshot.additionalContext);
      if (typeof snapshot.links === 'string') setLinks(snapshot.links);
      if (typeof snapshot.autoFillText === 'string') setAutoFillText(snapshot.autoFillText);

      toast({ title: 'Restored draft', description: 'Your triage draft was restored automatically.' });
    } catch {
      // Ignore invalid autosave payload.
    } finally {
      setHasRestoredAutosave(true);
    }
  }, []);

  // Safety net: ensure reportSections is populated if empty after hydration/autosave restore
  useEffect(() => {
    if (!hasRestoredAutosave) return;

    // If reportSections is empty, initialize it based on user role
    if (!reportSections || reportSections.length === 0) {
      const isPrivileged = userRole === 'admin' || userRole === 'analyst';
      const defaultModules = getDefaultSelectedModulesForRole(userRole);
      const baseSections = isPrivileged 
        ? ensureAlwaysAvailableTriageSections(DEFAULT_ADMIN_SECTIONS)
        : DEFAULT_STANDARD_SECTIONS;
      setReportSections(applyModuleStateToTriageSections(baseSections, defaultModules));
    }
  }, [hasRestoredAutosave, userRole]);

    // Keep standard user module set constrained to managed defaults.
    useEffect(() => {
      if (userRole === 'standard') {
        const defaultModules = getDefaultSelectedModulesForRole('standard');
        setSelectedModules(defaultModules);
        setReportSections((prev) => applyModuleStateToTriageSections(prev, defaultModules));
      }
    }, [userRole]);

  useEffect(() => {
    if (!hasRestoredAutosave) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(TRIAGE_AUTOSAVE_KEY, JSON.stringify({
          currentStep,
          completedSteps,
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
          legalName,
          numberOfEmployees,
          pitchSummary,
          keyMetrics,
          teamInfo,
          productDescription,
          framework,
          selectedModules,
          selectedSources,
          simulatedScores,
          reportSections,
          compositeScore,
          derivedModuleScores,
          analysisResult,
          extractedText,
          additionalContext,
          links,
          autoFillText,
          savedAt: new Date().toISOString(),
        }));
      } catch {
        // no-op
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    hasRestoredAutosave,
    currentStep,
    completedSteps,
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
    legalName,
    numberOfEmployees,
    pitchSummary,
    keyMetrics,
    teamInfo,
    productDescription,
    framework,
    selectedModules,
    selectedSources,
    simulatedScores,
    reportSections,
    compositeScore,
    derivedModuleScores,
    analysisResult,
    extractedText,
    additionalContext,
    links,
    autoFillText,
  ]);

  const isAdminOrAnalyst = userRole === 'admin' || userRole === 'analyst';
  const visibleSteps = isAdminOrAnalyst
    ? TRIAGE_STEPS
    : TRIAGE_STEPS.filter((s) => !STANDARD_RESTRICTED_STEP_IDS.includes(s.id));
  const displaySteps = TRIAGE_WORKFLOW_STEPS
    .map((step) => ({
      ...step,
      stepIds: step.stepIds.filter((stepId) => visibleSteps.some((visibleStep) => visibleStep.id === stepId)),
    }))
    .filter((step) => step.stepIds.length > 0);
  const firstStepId = visibleSteps[0]?.id ?? 1;
  const lastStepId = visibleSteps[visibleSteps.length - 1]?.id ?? 1;
  const lastDisplayStepId = displaySteps[displaySteps.length - 1]?.id ?? 101;
  const displayedCurrentStepId = displaySteps.find((step) => step.stepIds.includes(currentStep))?.id ?? displaySteps[0]?.id ?? 101;
  const currentStepPosition = Math.max(1, displaySteps.findIndex((s) => s.id === displayedCurrentStepId) + 1);
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
    if (currentStep === 4) {
      setCurrentStep(5);
      return;
    }

    if (currentStep === 8) {
      setCurrentStep(9);
      return;
    }

    if (!visibleSteps.some((s) => s.id === currentStep)) {
      setCurrentStep(firstStepId);
    }
  }, [currentStep, firstStepId, visibleSteps]);

  const canAdvanceFrom = (step: number): boolean => {
    if (step === 1) return !!pitchDeckFile; // Pitch deck is required for triage flow
    if (step === 2) return true; // Data Extraction is optional
    if (step === 3) {
      const pitchDeckReady = pitchDeckPath.trim().length > 0 || !!pitchDeckFile;
      const requiredChecks = [
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
        isProvidedMoneyOrNA(annualRevenue),
        isProvidedMoneyOrNA(preMoneyValuation),
      ];
      return requiredChecks.every(Boolean);
    }
    if (step === 4) return true;
    if (step === 5) return true;
    if (step === 6) return selectedModules.length > 0;
    if (step === 7) return reportSections.filter((s) => s.active).length > 0;
    if (step === 11) return !!savedReportId;
    return true;
  };

  const getMissingSsdStep3Fields = (): string[] => {
    const pitchDeckReady = pitchDeckPath.trim().length > 0 || !!pitchDeckFile;
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
      !pitchDeckReady ? 'Pitch Deck Path' : null,
      !isPositiveNumberText(annualRevenue) ? 'Annual Revenue' : null,
      !isPositiveNumberText(preMoneyValuation) ? 'Pre-Money Valuation' : null,
    ].filter(Boolean) as string[];
  };

  const autoCompleteSsdRequiredFields = async (): Promise<string[]> => {
    const missingBefore = getMissingSsdStep3Fields();
    if (missingBefore.length === 0) return [];

    const sourceText = [
      extractedText?.trim() || '',
      autoFillText?.trim() || '',
      pitchSummary?.trim() || '',
      companyDescription?.trim() || '',
      productDescription?.trim() || '',
      additionalContext?.trim() || '',
      links?.trim() || '',
    ].filter(Boolean).join('\n\n');

    const nextValues = {
      companyName: companyName.trim(),
      sector,
      stage,
      businessModel: businessModel.trim(),
      country: country.trim(),
      stateRegion: stateRegion.trim(),
      city: city.trim(),
      oneLineDescription: oneLineDescription.trim(),
      companyDescription: companyDescription.trim(),
      productDescription: productDescription.trim(),
      pitchDeckPath: pitchDeckPath.trim(),
      annualRevenue: annualRevenue.trim(),
      preMoneyValuation: preMoneyValuation.trim(),
    };

    if (sourceText) {
      try {
        const res = await fetch('/api/ai-autofill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText, companyHint: nextValues.companyName || undefined }),
        });
        const result = await res.json();
        if (res.ok && result?.success && result?.data) {
          const d = result.data as Record<string, unknown>;
          const websiteValue = cleanShortText(pickFirstText(d, ['website', 'company_website', 'companyWebsite', 'url', 'domain']));
          const sectorValue = normalizeSectorValue(pickFirstText(d, ['sector', 'industry', 'industry_vertical', 'industryVertical', 'vertical']));
          const stageValue = normalizeStageValue(pickFirstText(d, ['stage', 'company_stage', 'companyStage', 'funding_stage', 'fundingStage', 'development_stage', 'developmentStage']));
          const businessModelValue = cleanShortText(pickFirstText(d, ['business_model', 'businessModel', 'model']));
          const countryValue = cleanShortText(pickFirstText(d, ['country']));
          const stateValue = cleanShortText(pickFirstText(d, ['state', 'province', 'region']));
          const cityValue = cleanShortText(pickFirstText(d, ['city']));
          const oneLineValue = cleanOneLineDescription(pickFirstText(d, ['one_line_description', 'oneLineDescription', 'tagline']));
          const companyDescriptionValue = cleanLongText(pickFirstText(d, ['company_description', 'companyDescription']));
          const annualRevenueValue = cleanShortText(pickFirstText(d, ['annualRevenue', 'annual_revenue', 'yearlyRevenue', 'yearly_revenue'])) || extractAnnualRevenueText(sourceText);
          const preMoneyValue = cleanShortText(pickFirstText(d, ['preMoneyValuation', 'pre_money_valuation']));
          const pitchDeckPathValue = cleanShortText(pickFirstText(d, ['pitchDeckPath', 'pitch_deck_path']));
          const locationValue = buildLocationText(d);
          const locationParts = splitLocationParts(locationValue);
          const productValue = cleanLongText(pickFirstText(d, ['product_description', 'productDescription', 'product_overview', 'productOverview', 'solution_description', 'solutionDescription'])) || deriveProductDescription(oneLineValue, companyDescriptionValue);
          const inferredCompany =
            cleanCompanyName(pickFirstText(d, ['company_name', 'companyName', 'startup_name', 'startupName', 'name', 'legalName', 'legal_name'])) ||
            inferCompanyNameFromText(sourceText);

          if (!nextValues.companyName && inferredCompany) nextValues.companyName = inferredCompany;
          if (!nextValues.sector && sectorValue) nextValues.sector = sectorValue;
          if (!nextValues.stage && stageValue) nextValues.stage = stageValue;
          if (!nextValues.businessModel && businessModelValue) nextValues.businessModel = businessModelValue;
          if (!nextValues.country) nextValues.country = countryValue || locationParts.country;
          if (!nextValues.stateRegion) nextValues.stateRegion = stateValue || locationParts.state;
          if (!nextValues.city) nextValues.city = cityValue || locationParts.city;
          if (!nextValues.oneLineDescription && oneLineValue) nextValues.oneLineDescription = oneLineValue;
          if (!nextValues.companyDescription && companyDescriptionValue) nextValues.companyDescription = companyDescriptionValue;
          if (!nextValues.productDescription && productValue) nextValues.productDescription = productValue;
          if (!nextValues.pitchDeckPath && pitchDeckPathValue) nextValues.pitchDeckPath = pitchDeckPathValue;
          if (!nextValues.annualRevenue && annualRevenueValue) nextValues.annualRevenue = annualRevenueValue;
          if (!nextValues.preMoneyValuation && preMoneyValue) nextValues.preMoneyValuation = preMoneyValue;
          if (!website.trim() && websiteValue) setWebsite(websiteValue);
        }
      } catch {
        // best effort
      }
    }

    if (!nextValues.companyName) nextValues.companyName = inferCompanyNameFromText(sourceText) || legalName.trim() || 'Startup Company';
    if (!nextValues.sector) nextValues.sector = 'Technology / SaaS';
    if (!nextValues.stage) nextValues.stage = 'Seed';
    if (!nextValues.businessModel) nextValues.businessModel = 'B2B SaaS';
    if (!nextValues.country) nextValues.country = 'United States';
    if (!nextValues.stateRegion) nextValues.stateRegion = 'California';
    if (!nextValues.city) nextValues.city = 'San Francisco';
    if (!nextValues.oneLineDescription) nextValues.oneLineDescription = `Early-stage company in ${nextValues.sector} focused on growth.`;
    if (!nextValues.companyDescription) nextValues.companyDescription = `${nextValues.companyName} is building products to solve validated customer and market needs.`;
    if (!nextValues.productDescription) nextValues.productDescription = nextValues.oneLineDescription;
    if (!nextValues.pitchDeckPath && !pitchDeckFile) {
      const safeName = 'pitch_deck.pdf';
      nextValues.pitchDeckPath = `/uploads/${safeName}`;
    }
    if (!isPositiveNumberText(nextValues.annualRevenue)) nextValues.annualRevenue = '100000';
    if (!isPositiveNumberText(nextValues.preMoneyValuation)) nextValues.preMoneyValuation = '5000000';

    setCompanyName(nextValues.companyName);
    setSector(nextValues.sector);
    setStage(nextValues.stage);
    setBusinessModel(nextValues.businessModel);
    setCountry(nextValues.country);
    setStateRegion(nextValues.stateRegion);
    setCity(nextValues.city);
    setOneLineDescription(nextValues.oneLineDescription);
    setCompanyDescription(nextValues.companyDescription);
    setProductDescription(nextValues.productDescription);
    if (!pitchDeckFile) setPitchDeckPath(nextValues.pitchDeckPath);
    setAnnualRevenue(nextValues.annualRevenue);
    setPreMoneyValuation(nextValues.preMoneyValuation);

    const stillMissing = [
      !nextValues.companyName ? 'Company Name' : null,
      !nextValues.sector ? 'Industry Vertical' : null,
      !nextValues.stage ? 'Development Stage' : null,
      !nextValues.businessModel ? 'Business Model' : null,
      !nextValues.country ? 'Country' : null,
      !nextValues.stateRegion ? 'State' : null,
      !nextValues.city ? 'City' : null,
      !nextValues.oneLineDescription ? 'One-Line Description' : null,
      !nextValues.companyDescription ? 'Company Description' : null,
      !nextValues.productDescription ? 'Product Description' : null,
      !(nextValues.pitchDeckPath || !!pitchDeckFile) ? 'Pitch Deck Path' : null,
      !isPositiveNumberText(nextValues.annualRevenue) ? 'Annual Revenue' : null,
      !isPositiveNumberText(nextValues.preMoneyValuation) ? 'Pre-Money Valuation' : null,
    ].filter(Boolean) as string[];

    if (stillMissing.length === 0) {
      toast({
        title: 'Auto-filled and ready for review',
        description: 'Required company fields were completed. Please review and continue.',
      });
    }

    return stillMissing;
  };

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
      const missingSsdStep3Fields = [
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
        !isProvidedMoneyOrNA(annualRevenue) ? 'Annual Revenue' : null,
        !isProvidedMoneyOrNA(preMoneyValuation) ? 'Pre-Money Valuation' : null,
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
            : currentStep === 11
            ? 'Save Report is required before proceeding to Report Complete.'
            : currentStep === 4
            ? 'Please enter a pitch summary.'
            : 'Please complete the required information and try again.',
      });
      return;
    }
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((s) => getNextStepId(s));
  };

  const goToPrev = () => setCurrentStep((s) => getPrevStepId(s));

  const moduleToSections: Record<string, string[]> = {};

  const toggleModule = (moduleId: string) => {
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
        if (ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS.has(section.id)) return section;
        return { ...section, active: activeManagedIds.has(section.id) };
      })
    );
  }, [isAdminOrAnalyst, selectedModules]);

  // Auto-populate pitch summary with fallback if empty on review step
  useEffect(() => {
    if (currentStep !== 9) return;

    setPitchSummary((prev) => {
      if (prev.trim().length > 0) return prev;

      let fallback = '';
      if (additionalContext?.trim().length > 0) {
        fallback = additionalContext.trim().slice(0, 500);
      } else if (productDescription?.trim().length > 0) {
        fallback = productDescription.trim().slice(0, 500);
      } else if (companyDescription?.trim().length > 0) {
        fallback = companyDescription.trim().slice(0, 500);
      } else if (extractedText?.trim().length > 0) {
        fallback = extractedText.trim().slice(0, 500);
      } else {
        fallback = 'N/A';
      }

      return fallback;
    });
  }, [currentStep, additionalContext, productDescription, companyDescription, extractedText]);

  const toggleSection = (sectionId: string) => {
    if (!isAdminOrAnalyst) return;

    if (ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS.has(sectionId)) {
      return;
    }

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

    setReportSections((prev) =>
      prev.map((s) => {
        if (ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS.has(s.id)) {
          return { ...s, active: true };
        }
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
    const effectiveSources = selectedSources.filter((id) => activeExternalSourceIds.includes(id));
    if (effectiveSources.length === 0) return;
    setFetchingData(true);
    try {
      const response = await fetch('/api/external-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName, sources: effectiveSources }),
      });
      const result = await response.json();
      const results = effectiveSources.map((sourceId) => ({
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

  useEffect(() => {
    if (currentStep !== 5 || !isAdminOrAnalyst || !companyName.trim() || !selectedExternalSourceSignature || fetchingData) {
      return;
    }

    const requestKey = `${companyName.trim().toLowerCase()}::${selectedExternalSourceSignature}`;
    if (lastAutoFetchedExternalKeyRef.current === requestKey) {
      return;
    }

    lastAutoFetchedExternalKeyRef.current = requestKey;
    void fetchExternalData();
  }, [currentStep, isAdminOrAnalyst, companyName, selectedExternalSourceSignature, fetchingData]);

  const handleAutoFill = async () => {
    if (!autoFillText.trim()) return;
    setIsAutoFilling(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      const res = await fetch('/api/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: autoFillText, companyHint: companyName.trim() || undefined }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data as Record<string, unknown>;
        const fieldConfidence = result.fieldConfidence;
        const requirementMatch = result.requirementMatch;
        const websiteValue = cleanShortText(pickFirstText(d, ['website', 'company_website', 'companyWebsite', 'url', 'domain']));
        const company = resolveCompanyNameCandidate({
          aiCandidate: pickFirstText(d, ['company_name', 'companyName', 'startup_name', 'startupName', 'name']),
          legalName: pickFirstText(d, ['legalName', 'legal_name']),
          website: websiteValue,
          inferredFromText: inferCompanyNameFromText(autoFillText),
          existing: companyName,
        });
        const sectorValue = normalizeSectorValue(pickFirstText(d, ['sector', 'industry', 'industry_vertical', 'industryVertical', 'vertical'])) || inferSectorFromText(autoFillText);
        const stageValue = normalizeStageValue(pickFirstText(d, ['stage', 'company_stage', 'companyStage', 'funding_stage', 'fundingStage', 'development_stage', 'developmentStage'])) || inferStageFromText(autoFillText);
        const businessModelValue = cleanBusinessModelValue(pickFirstText(d, ['business_model', 'businessModel', 'model']));
        const countryValue = cleanShortText(pickFirstText(d, ['country']));
        const stateValue = cleanShortText(pickFirstText(d, ['state', 'province', 'region']));
        const cityValue = cleanShortText(pickFirstText(d, ['city']));
        const oneLineValue = cleanOneLineDescription(pickFirstText(d, ['one_line_description', 'oneLineDescription', 'tagline']));
        const companyDescriptionValue = cleanLongText(pickFirstText(d, ['company_description', 'companyDescription']));
        const annualRevenueValue = cleanMoneyValue(pickFirstText(d, ['annualRevenue', 'annual_revenue', 'yearlyRevenue', 'yearly_revenue'])) || extractAnnualRevenueText(autoFillText);
        const preMoneyValue = cleanMoneyValue(pickFirstText(d, ['preMoneyValuation', 'pre_money_valuation'])) || extractPreMoneyValuationText(autoFillText);
        const pitchDeckPathValue = cleanPitchDeckPathValue(pickFirstText(d, ['pitchDeckPath', 'pitch_deck_path']));
        const legalNameValue = cleanShortText(pickFirstText(d, ['legalName', 'legal_name']));
        const employeesValue = cleanShortText(pickFirstText(d, ['numberOfEmployees', 'number_of_employees', 'team_size'])) || extractEmployeesText(autoFillText);
        const locationValue = buildLocationText(d);
        const locationParts = splitLocationParts(locationValue);
        const summaryValue = cleanLongText(pickFirstText(d, ['pitch_summary', 'pitchSummary', 'executive_summary', 'executiveSummary', 'company_description', 'companyDescription', 'one_line_description', 'oneLineDescription', 'problemSolution']));
        const metricsValue = cleanLongText(buildMetricsText(d));
        const teamValue = cleanLongText(pickFirstText(d, ['team_info', 'teamInfo', 'team_background', 'teamBackground', 'founder_info', 'founderInfo', 'companyBackgroundTeam']));
        const productValue = cleanLongText(pickFirstText(d, ['product_description', 'productDescription', 'product_overview', 'productOverview', 'solution_description', 'solutionDescription'])) || deriveProductDescription(oneLineValue, companyDescriptionValue);

        const shouldReplaceExistingCompany =
          isLikelyInvalidExistingCompanyName(companyName)
          || isCompanyMismatchedWithWebsite(companyName, websiteValue);
        if (company && (shouldReplaceExistingCompany
          ? shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['company_name', 'companyName', 'legal_name', 'legalName'])
          : shouldApplyField(fieldConfidence, requirementMatch, ['company_name', 'companyName', 'legal_name', 'legalName']))) setCompanyName(company);
        if (websiteValue && (website.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['website'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['website']))) setWebsite(websiteValue);
        if (sectorValue && (sector
          ? shouldApplyField(fieldConfidence, requirementMatch, ['sector', 'industryVertical'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['sector', 'industryVertical']))) setSector(sectorValue);
        if (stageValue && (stage
          ? shouldApplyField(fieldConfidence, requirementMatch, ['stage', 'developmentStage'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['stage', 'developmentStage']))) setStage(stageValue);
        if (businessModelValue && (businessModel.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['business_model', 'businessModel'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['business_model', 'businessModel']))) setBusinessModel(businessModelValue);
        if ((countryValue || locationParts.country) && (country.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['country'])
          : shouldApplyLocationField(fieldConfidence, ['country', 'location']))) setCountry(countryValue || locationParts.country);
        if ((stateValue || locationParts.state) && (stateRegion.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['state'])
          : shouldApplyLocationField(fieldConfidence, ['state', 'location']))) setStateRegion(stateValue || locationParts.state);
        if ((cityValue || locationParts.city) && (city.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['city'])
          : shouldApplyLocationField(fieldConfidence, ['city', 'location']))) setCity(cityValue || locationParts.city);
        if (oneLineValue && (oneLineDescription.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['one_line_description', 'oneLineDescription'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['one_line_description', 'oneLineDescription']))) setOneLineDescription(oneLineValue);
        if (companyDescriptionValue && (companyDescription.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['company_description', 'companyDescription'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['company_description', 'companyDescription']))) setCompanyDescription(companyDescriptionValue);
        if (annualRevenueValue && (annualRevenue.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['annual_revenue', 'annualRevenue'])
          : shouldApplyFinancialField(fieldConfidence, ['annual_revenue', 'annualRevenue']))) setAnnualRevenue(annualRevenueValue);
        if (preMoneyValue && (preMoneyValuation.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['pre_money_valuation', 'preMoneyValuation'])
          : shouldApplyFinancialField(fieldConfidence, ['pre_money_valuation', 'preMoneyValuation']))) setPreMoneyValuation(preMoneyValue);
        if (pitchDeckPathValue && (pitchDeckPath.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['pitch_deck_path', 'pitchDeckPath'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['pitch_deck_path', 'pitchDeckPath']))) setPitchDeckPath(pitchDeckPathValue);
        if (legalNameValue && shouldApplyField(fieldConfidence, requirementMatch, ['legal_name', 'legalName'])) setLegalName(legalNameValue);
        if (employeesValue && shouldApplyField(fieldConfidence, requirementMatch, ['number_of_employees', 'numberOfEmployees'])) setNumberOfEmployees(employeesValue);
        if (locationValue) setLocation(locationValue);
        if (summaryValue) setPitchSummary(summaryValue);
        if (metricsValue) setKeyMetrics(metricsValue);
        if (teamValue) setTeamInfo(teamValue);
        if (productValue && (productDescription.trim()
          ? shouldApplyField(fieldConfidence, requirementMatch, ['product_description', 'productDescription', 'product_overview', 'productOverview'])
          : shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['product_description', 'productDescription', 'product_overview', 'productOverview']))) setProductDescription(productValue);

        // Hard fallback to ensure all required company fields are populated.
        const richCompanyDescription = buildComprehensiveCompanyDescription(
          autoFillText,
          oneLineValue || oneLineDescription,
          sectorValue || sector,
          stageValue || stage
        );
        const richProductDescription = buildComprehensiveProductDescription(
          autoFillText,
          oneLineValue || oneLineDescription,
          companyDescriptionValue || richCompanyDescription
        );

        if (!companyName.trim()) setCompanyName(normalizeRequiredShortText(company || extractDomainCompanyName(websiteValue), 'N/A'));
        if (!businessModel.trim()) setBusinessModel(normalizeRequiredShortText(businessModelValue || inferBusinessModelFromText(autoFillText), 'N/A'));
        if (!country.trim()) setCountry(normalizeRequiredShortText(countryValue || locationParts.country, 'N/A'));
        if (!stateRegion.trim()) setStateRegion(normalizeRequiredShortText(stateValue || locationParts.state, 'N/A'));
        if (!city.trim()) setCity(normalizeRequiredShortText(cityValue || locationParts.city, 'N/A'));
        if (!oneLineDescription.trim()) setOneLineDescription(normalizeRequiredText(oneLineValue || inferCompanyNameFromText(autoFillText) || 'N/A', 'N/A'));
        if (!companyDescription.trim() || companyDescription.trim().length < 120) setCompanyDescription(normalizeRequiredText(companyDescriptionValue || richCompanyDescription, 'N/A'));
        const productFallback = productValue.trim().length >= 120 ? productValue : richProductDescription;
        if (!productDescription.trim() || productDescription.trim().length < 120) setProductDescription(normalizeRequiredText(productFallback, 'N/A'));
        if (!isProvidedMoneyOrNA(annualRevenue)) setAnnualRevenue(normalizeRequiredMoneyText(annualRevenueValue, 'N/A'));
        if (!isProvidedMoneyOrNA(preMoneyValuation)) setPreMoneyValuation(normalizeRequiredMoneyText(preMoneyValue, 'N/A'));

        setShowAutoFill(false);
        setAutoFillText('');
        const lowConfidenceNotice = hasLowConfidenceCriticalFields(fieldConfidence) || hasWeakRequirementCriticalFields(requirementMatch)
          ? ' Low-confidence or weak-match fields were left unchanged for your review.'
          : '';
        toast({ title: 'Auto-fill complete', description: `${result.fieldsExtracted || 'Fields'} extracted successfully.${lowConfidenceNotice}` });
      } else {
        toast({ variant: 'destructive', title: 'Auto-fill failed', description: 'Could not extract fields from text.' });
      }
    } catch (e) {
      const description = e instanceof Error && e.name === 'AbortError'
        ? 'Auto-fill timed out. Please try again.'
        : e instanceof Error
        ? e.message
        : 'Could not extract fields from text.';
      toast({ variant: 'destructive', title: 'Auto-fill failed', description });
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
    let hasLowConfidenceFromExtraction = false;

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
            const fieldConfidence = autofillResult.fieldConfidence;
            const requirementMatch = autofillResult.requirementMatch;
            hasLowConfidenceFromExtraction = hasLowConfidenceCriticalFields(fieldConfidence) || hasWeakRequirementCriticalFields(requirementMatch);
            const websiteValue = cleanShortText(pickFirstText(d, ['website', 'company_website', 'companyWebsite', 'url', 'domain']));
            const company = resolveCompanyNameCandidate({
              aiCandidate: pickFirstText(d, ['company_name', 'companyName', 'startup_name', 'startupName', 'name']),
              legalName: pickFirstText(d, ['legalName', 'legal_name']),
              website: websiteValue,
              inferredFromText: inferCompanyNameFromText(trimmed),
              existing: companyName,
            });
            const sectorValue = normalizeSectorValue(pickFirstText(d, ['sector', 'industry', 'industry_vertical', 'industryVertical', 'vertical'])) || inferSectorFromText(trimmed);
            const stageValue = normalizeStageValue(pickFirstText(d, ['stage', 'company_stage', 'companyStage', 'funding_stage', 'fundingStage', 'development_stage', 'developmentStage'])) || inferStageFromText(trimmed);
            const businessModelValue = cleanBusinessModelValue(pickFirstText(d, ['business_model', 'businessModel', 'model']));
            const countryValue = cleanShortText(pickFirstText(d, ['country']));
            const stateValue = cleanShortText(pickFirstText(d, ['state', 'province', 'region']));
            const cityValue = cleanShortText(pickFirstText(d, ['city']));
            const oneLineValue = cleanOneLineDescription(pickFirstText(d, ['one_line_description', 'oneLineDescription', 'tagline']));
            const companyDescriptionValue = cleanLongText(pickFirstText(d, ['company_description', 'companyDescription']));
            const annualRevenueValue = cleanMoneyValue(pickFirstText(d, ['annualRevenue', 'annual_revenue', 'yearlyRevenue', 'yearly_revenue'])) || extractAnnualRevenueText(trimmed);
            const preMoneyValue = cleanMoneyValue(pickFirstText(d, ['preMoneyValuation', 'pre_money_valuation'])) || extractPreMoneyValuationText(trimmed);
            const pitchDeckPathValue = cleanPitchDeckPathValue(pickFirstText(d, ['pitchDeckPath', 'pitch_deck_path']));
            const legalNameValue = cleanShortText(pickFirstText(d, ['legalName', 'legal_name']));
            const employeesValue = cleanShortText(pickFirstText(d, ['numberOfEmployees', 'number_of_employees', 'team_size'])) || extractEmployeesText(trimmed);
            const locationValue = buildLocationText(d);
            const locationParts = splitLocationParts(locationValue);
            const summaryValue = cleanLongText(pickFirstText(d, ['pitch_summary', 'pitchSummary', 'executive_summary', 'executiveSummary', 'company_description', 'companyDescription', 'one_line_description', 'oneLineDescription', 'problemSolution']));
            const metricsValue = cleanLongText(buildMetricsText(d));
            const teamValue = cleanLongText(pickFirstText(d, ['team_info', 'teamInfo', 'team_background', 'teamBackground', 'founder_info', 'founderInfo', 'companyBackgroundTeam']));
            const productValue = cleanLongText(pickFirstText(d, ['product_description', 'productDescription', 'product_overview', 'productOverview', 'solution_description', 'solutionDescription'])) || deriveProductDescription(oneLineValue, companyDescriptionValue);

            if (
              company
              && (isLikelyInvalidExistingCompanyName(companyName) || isCompanyMismatchedWithWebsite(companyName, websiteValue))
              && shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['company_name', 'companyName', 'legal_name', 'legalName'])
            ) setCompanyName(company);
            if (websiteValue && !website.trim() && shouldApplyField(fieldConfidence, requirementMatch, ['website'])) setWebsite(websiteValue);
            if (sectorValue && !sector && shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['sector', 'industryVertical'])) setSector(sectorValue);
            if (stageValue && !stage && shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['stage', 'developmentStage'])) setStage(stageValue);
            if (businessModelValue && !businessModel.trim() && shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['business_model', 'businessModel'])) setBusinessModel(businessModelValue);
            if ((countryValue || locationParts.country) && !country.trim() && shouldApplyLocationField(fieldConfidence, ['country', 'location'])) setCountry(countryValue || locationParts.country);
            if ((stateValue || locationParts.state) && !stateRegion.trim() && shouldApplyLocationField(fieldConfidence, ['state', 'location'])) setStateRegion(stateValue || locationParts.state);
            if ((cityValue || locationParts.city) && !city.trim() && shouldApplyLocationField(fieldConfidence, ['city', 'location'])) setCity(cityValue || locationParts.city);
            if (oneLineValue && !oneLineDescription.trim() && shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['one_line_description', 'oneLineDescription'])) setOneLineDescription(oneLineValue);
            if (companyDescriptionValue && !companyDescription.trim() && shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['company_description', 'companyDescription'])) setCompanyDescription(companyDescriptionValue);
            if (annualRevenueValue && !annualRevenue.trim() && isPositiveNumberText(annualRevenueValue) && shouldApplyFinancialField(fieldConfidence, ['annual_revenue', 'annualRevenue'])) setAnnualRevenue(annualRevenueValue);
            if (preMoneyValue && !preMoneyValuation.trim() && isPositiveNumberText(preMoneyValue) && shouldApplyFinancialField(fieldConfidence, ['pre_money_valuation', 'preMoneyValuation'])) setPreMoneyValuation(preMoneyValue);
            if (pitchDeckPathValue && !pitchDeckPath.trim() && shouldApplyField(fieldConfidence, requirementMatch, ['pitch_deck_path', 'pitchDeckPath'])) setPitchDeckPath(pitchDeckPathValue);
            if (legalNameValue && !legalName.trim() && shouldApplyField(fieldConfidence, requirementMatch, ['legal_name', 'legalName'])) setLegalName(legalNameValue);
            if (employeesValue && !numberOfEmployees.trim() && shouldApplyField(fieldConfidence, requirementMatch, ['number_of_employees', 'numberOfEmployees'])) setNumberOfEmployees(employeesValue);
            if (locationValue && !location.trim()) setLocation(locationValue);
            if (summaryValue) setPitchSummary(summaryValue);
            if (metricsValue && !keyMetrics.trim()) setKeyMetrics(metricsValue);
            if (teamValue && !teamInfo.trim()) setTeamInfo(teamValue);
            if (productValue && !productDescription.trim() && shouldApplyFieldForEmptyRequired(fieldConfidence, requirementMatch, ['product_description', 'productDescription', 'product_overview', 'productOverview'])) setProductDescription(productValue);

            // Hard fallback to ensure all required company fields are populated.
            const richCompanyDescription = buildComprehensiveCompanyDescription(
              trimmed,
              oneLineValue || oneLineDescription,
              sectorValue || sector,
              stageValue || stage
            );
            const richProductDescription = buildComprehensiveProductDescription(
              trimmed,
              oneLineValue || oneLineDescription,
              companyDescriptionValue || richCompanyDescription
            );

            if (!companyName.trim()) setCompanyName(normalizeRequiredShortText(company || extractDomainCompanyName(websiteValue), 'N/A'));
            if (!businessModel.trim()) setBusinessModel(normalizeRequiredShortText(businessModelValue || inferBusinessModelFromText(trimmed), 'N/A'));
            if (!country.trim()) setCountry(normalizeRequiredShortText(countryValue || locationParts.country, 'N/A'));
            if (!stateRegion.trim()) setStateRegion(normalizeRequiredShortText(stateValue || locationParts.state, 'N/A'));
            if (!city.trim()) setCity(normalizeRequiredShortText(cityValue || locationParts.city, 'N/A'));
            if (!oneLineDescription.trim()) setOneLineDescription(normalizeRequiredText(oneLineValue || inferCompanyNameFromText(trimmed) || 'N/A', 'N/A'));
            if (!companyDescription.trim() || companyDescription.trim().length < 120) setCompanyDescription(normalizeRequiredText(companyDescriptionValue || richCompanyDescription, 'N/A'));
            const productFallback = productValue.trim().length >= 120 ? productValue : richProductDescription;
            if (!productDescription.trim() || productDescription.trim().length < 120) setProductDescription(normalizeRequiredText(productFallback, 'N/A'));
            if (!isProvidedMoneyOrNA(annualRevenue)) setAnnualRevenue(normalizeRequiredMoneyText(annualRevenueValue, 'N/A'));
            if (!isProvidedMoneyOrNA(preMoneyValuation)) setPreMoneyValuation(normalizeRequiredMoneyText(preMoneyValue, 'N/A'));
          }
        }
      } catch { /* ignore autofill errors — fields still pre-filled from raw text */ }
      if (!pitchSummary.trim()) setPitchSummary(trimmed.slice(0, 2000));
      const lowConfidenceNotice = hasLowConfidenceFromExtraction
        ? ' Low-confidence fields were left unchanged for review.'
        : '';
      toast({ title: 'Extraction complete', description: `Text extracted from ${files.length} file(s). Fields pre-filled.${lowConfidenceNotice}` });
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
      if (!qualityAssessment.canExport) {
        const blocker = qualityAssessment.blockers[0] || `Quality tier is ${qualityAssessment.qualityTier}, not High (required 80+ score)`;
        setSaveError(`Cannot export: ${blocker}`);
        toast({
          variant: 'destructive',
          title: 'Export blocked',
          description: blocker,
        });
        return;
      }

      const recommendation = qualityAssessment.recommendationLabel;
      const enrichedAnalysis = {
        ...(analysisResult as Record<string, unknown>),
        qualityAssessment,
        reportNarrative: qualityAssessment.reportNarrative,
      };
      const saved = await reportsApi.createReport({
        company_name: companyName,
        report_type: 'triage',
        overall_score: compositeScore,
        tca_score: compositeScore,
        recommendation,
        analysis_data: enrichedAnalysis,
        module_scores: { modules: selectedModules, framework } as Record<string, unknown>,
        missing_sections: reportSections.filter((s) => !s.active).map((s) => s.id),
      });
      setSavedReportId(saved.id);
      toast({ title: '100% Quality Report Saved', description: `Report #${saved.id} saved for ${companyName}. High-quality analysis archived.` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save report.';
      setSaveError(msg);
      toast({ variant: 'destructive', title: 'Save failed', description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!qualityAssessment.canExport) {
      toast({
        variant: 'destructive',
        title: 'Export blocked',
        description: qualityAssessment.blockers[0] || 'Quality gates not passed; improve analysis to High tier before export.',
      });
      return;
    }
    const data = {
      company: companyName, sector, stage, framework,
      compositeScore, analysisResult,
      qualityAssessment,
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
    if (!qualityAssessment.canExport) {
      toast({
        variant: 'destructive',
        title: 'Export blocked',
        description: qualityAssessment.blockers[0] || 'Quality gates not passed; improve analysis to High tier before export.',
      });
      return;
    }
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
    const hasMinimumAnalysisInput = [
      companyName,
      companyDescription,
      pitchSummary,
      keyMetrics,
      teamInfo,
      productDescription,
      additionalContext,
      extractedText,
    ].some((value) => value.trim().length > 0);

    if (!hasMinimumAnalysisInput) {
      toast({
        variant: 'destructive',
        title: 'Input required',
        description: 'Add a company name, uploaded/extracted text, or summary details before running triage analysis.',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Preparing triage analysis...');

    const activeTriageSections = reportSections.filter((s) => s.active);
    const triageContext = {
      companyName, sector, stage, website, location,
      pitchSummary, keyMetrics, teamInfo, productDescription,
      framework, selectedModules, reportType: 'triage',
      reportSections: activeTriageSections,
      activeSectionIds: activeTriageSections.map((s) => s.id),
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
      const analysisPayload = {
        companyName: companyName.trim(), sector, stage, website, location,
        companyDescription: companyDescription.trim() || additionalContext.trim() || extractedText.trim().slice(0, 1200),
        pitchSummary, keyMetrics, teamInfo, productDescription,
        submittedTexts: [additionalContext, teamInfo, keyMetrics].filter((value) => value.trim().length > 0),
        strictRealDataOnly: true,
        disallowSampleFallback: true,
        activeModules: TRIAGE_MODULES.filter(m => selectedModules.includes(m.id)).map(m => ({ module_id: m.id, weight: m.weight, is_enabled: true })),
      };
      const analysisResponse = await fetch('/api/analysis/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          framework,
          userData: analysisPayload,
        }),
      });

      if (!analysisResponse.ok) {
        const errorBody = await analysisResponse.json().catch(() => null);
        throw new Error(
          errorBody?.message
          || errorBody?.error
          || `Analysis request failed with status ${analysisResponse.status}`
        );
      }

      const analysisData = await analysisResponse.json();
      const analysisWithReportContext = {
        ...(analysisData as Record<string, unknown>),
        _triageReportContext: {
          reportType: 'triage',
          role: userRole,
          framework,
          selectedModules: [...selectedModules],
          activeSectionIds: activeTriageSections.map((s) => s.id),
          sections: activeTriageSections,
        },
      };
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStatus('Triage complete!');

      localStorage.setItem('analysisResult', JSON.stringify(analysisWithReportContext));
      sessionStorage.setItem('analysisResult', JSON.stringify(analysisWithReportContext));
      localStorage.setItem('analysisFramework', framework);
      localStorage.setItem('currentReportType', 'triage');
      localStorage.setItem('triageSelectedModules', JSON.stringify(effectiveSelectedModules));
      localStorage.setItem('triageReportSections', JSON.stringify(reportSections));
      localStorage.setItem(
        isAdminOrAnalyst ? 'report-config-triage-admin' : 'report-config-triage-standard',
        JSON.stringify(reportSections)
      );

      const scoreData = (analysisWithReportContext as { tcaData?: { overallScore?: number; compositeScore?: number } })?.tcaData;
      const tcaScore = scoreData?.compositeScore ?? scoreData?.overallScore ?? 0;
      const aiModuleScores = deriveModuleScoresFromAnalysis(analysisWithReportContext);
      const weightedComposite = computeWeightedCompositeScore(selectedModules, aiModuleScores, savedModuleWeights);
      const score = weightedComposite ?? tcaScore;
      const generatedQuality = evaluateTriageQuality({
        analysisData: analysisWithReportContext,
        selectedModuleIds: selectedModules,
        moduleScores: aiModuleScores,
        compositeScore: score,
        companyName,
        sector,
        stage,
        website,
        country,
        stateRegion,
        city,
        pitchSummary,
        keyMetrics,
        teamInfo,
        productDescription,
        annualRevenue,
        preMoneyValuation,
      });

      setCompositeScore(score);
      setDerivedModuleScores(aiModuleScores);
      setAnalysisResult(analysisWithReportContext);
      sessionStorage.setItem('companyData', JSON.stringify({
        companyName, sector, stage, website, location,
        pitchSummary, keyMetrics, teamInfo, productDescription
      }));
      localStorage.setItem('analysisCompanyName', companyName);

      const reportId = `triage-${Date.now()}`;
      const triageReport = {
        reportId, reportType: 'triage', companyName, framework,
        metadata: { compositeScore: score, sector, stage },
        createdAt: new Date().toISOString(), data: analysisWithReportContext,
      };
      const existingReports = JSON.parse(localStorage.getItem('tca_reports') || '[]');
      existingReports.unshift(triageReport);
      localStorage.setItem('tca_reports', JSON.stringify(existingReports.slice(0, 50)));

      if (!generatedQuality.gatePassed) {
        toast({
          variant: 'destructive',
          title: 'Quality gate triggered',
          description: generatedQuality.blockers[0] || 'Manual review is required before final recommendation.',
        });
      }

      toast({ title: 'Triage Complete', description: `${companyName} triage analysis finished. Proceed to save.` });
      setCompletedSteps((prev) => [...new Set([...prev, 9])]);
      setCurrentStep(10);
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
                      title="Select pitch deck file"
                      className="hidden"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      title="Upload pitch deck"
                      aria-label="Upload pitch deck"
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
          { label: 'Annual Revenue', ok: isProvidedMoneyOrNA(annualRevenue) },
          { label: 'Pre-Money Valuation', ok: isProvidedMoneyOrNA(preMoneyValuation) },
        ];
        const ssdMissingItems = ssdMandatoryItems.filter((item) => !item.ok).map((item) => item.label);

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Review extracted company details, complete required fields, and add supporting sources if needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Required Company Fields</Label>
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
                    onChange={applyStringValue(setCompanyName)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={website}
                    onChange={applyStringValue(setWebsite)}
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
                  onChange={applyStringValue(setLocation)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input id="legalName" placeholder="Legal name of company" value={legalName} onChange={applyStringValue(setLegalName)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                  <Input id="numberOfEmployees" placeholder="e.g., 12" value={numberOfEmployees} onChange={applyStringValue(setNumberOfEmployees)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessModel">Business Model <span className="text-destructive">*</span></Label>
                  <Input id="businessModel" placeholder="e.g., B2B SaaS" value={businessModel} onChange={applyStringValue(setBusinessModel)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pitchDeckPath">Pitch Deck Path <span className="text-destructive">*</span></Label>
                  <Input id="pitchDeckPath" placeholder="/documents/pitch_deck.pdf" value={pitchDeckPath} onChange={applyStringValue(setPitchDeckPath)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                  <Input id="country" placeholder="United States" value={country} onChange={applyStringValue(setCountry)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateRegion">State <span className="text-destructive">*</span></Label>
                  <Input id="stateRegion" placeholder="California" value={stateRegion} onChange={applyStringValue(setStateRegion)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                  <Input id="city" placeholder="San Francisco" value={city} onChange={applyStringValue(setCity)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oneLineDescription">One-Line Description <span className="text-destructive">*</span></Label>
                <Input
                  id="oneLineDescription"
                  placeholder="AI-powered customer service automation platform"
                  value={oneLineDescription}
                  onChange={applyStringValue(setOneLineDescription)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue">Annual Revenue <span className="text-destructive">*</span></Label>
                  <Input id="annualRevenue" placeholder="250000" value={annualRevenue} onChange={applyStringValue(setAnnualRevenue)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preMoneyValuation">Pre-Money Valuation <span className="text-destructive">*</span></Label>
                  <Input id="preMoneyValuation" placeholder="5000000" value={preMoneyValuation} onChange={applyStringValue(setPreMoneyValuation)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="companyDescription"
                  rows={4}
                  placeholder="Detailed description of the company"
                  value={companyDescription}
                  onChange={applyStringValue(setCompanyDescription)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescriptionStep3">Product Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="productDescriptionStep3"
                  rows={4}
                  placeholder="Describe the core product and value"
                  value={productDescription}
                  onChange={applyStringValue(setProductDescription)}
                />
              </div>

              <Separator />

              <div className="rounded-xl border-2 border-primary/20 bg-white shadow-sm">
                <div className="border-b px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full border border-primary/30 text-sm font-semibold text-primary">
                      2
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-900">Document Submission</h3>
                      <p className="text-sm text-muted-foreground">
                        Add supporting files, online sources, or extra notes to strengthen the triage review.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <Tabs defaultValue="documents" className="w-full">
                    <TabsList className="grid h-10 w-full grid-cols-3 bg-muted/70 p-1">
                      <TabsTrigger value="documents" className="gap-2"><UploadCloud className="size-4" /> File Upload</TabsTrigger>
                      <TabsTrigger value="online-search" className="gap-2"><LinkIcon className="size-4" /> URL Import</TabsTrigger>
                      <TabsTrigger value="extra-info" className="gap-2"><Type className="size-4" /> Text Input</TabsTrigger>
                    </TabsList>

                    <TabsContent value="documents" className="space-y-4 pt-4">
                      <div
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center transition-colors hover:border-primary/40 hover:bg-slate-50"
                        onClick={() => document.getElementById('supporting-files-input')?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 0) setSupportingFiles((prev) => [...prev, ...files]);
                        }}
                      >
                        <UploadCloud className="mb-3 size-10 text-slate-500" />
                        <p className="text-base font-semibold text-slate-900">Drop your files here or click to browse</p>
                        <p className="mt-1 text-sm text-muted-foreground">Supported: PDF, DOCX, PPTX, XLSX, TXT, CSV</p>
                        <input
                          id="supporting-files-input"
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv"
                          title="Upload supporting company documents"
                          aria-label="Upload supporting company documents"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setSupportingFiles((prev) => [...prev, ...files]);
                            e.target.value = '';
                          }}
                        />
                      </div>

                      {supportingFiles.length > 0 && (
                        <div className="space-y-2">
                          {supportingFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5 text-sm">
                              <div className="flex min-w-0 items-center gap-2">
                                <FileText className="size-4 shrink-0 text-primary" />
                                <span className="truncate font-medium">{file.name}</span>
                                <Badge variant="secondary" className="shrink-0 text-[10px]">{formatBytes(file.size)}</Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => setSupportingFiles((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {(supportingDocsExtractionStatus || supportingDocsExtractionError || supportingDocsMetrics.length > 0) && (
                        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
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

                          {supportingDocsMetrics.length > 0 && (
                            <div className="mt-3">
                              <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Extracted Metrics</Label>
                              <div className="overflow-hidden rounded-md border">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/50">
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
                                          <td className="truncate px-3 py-2 text-xs text-muted-foreground">{metric.source}</td>
                                          <td className="px-3 py-2 text-center">
                                            {metric.verified ? (
                                              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">✓</Badge>
                                            ) : (
                                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">⚠</Badge>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="online-search" className="space-y-3 pt-4">
                      <Label htmlFor="links-input" className="text-sm font-semibold">
                        Company Links
                        <span className="ml-1 text-xs font-normal text-muted-foreground">(website, LinkedIn, Crunchbase, news URLs)</span>
                      </Label>
                      <Input
                        id="links-input"
                        placeholder="https://example.com, https://linkedin.com/company/..."
                        value={links}
                        onChange={applyStringValue(setLinks)}
                      />
                      <p className="text-xs text-muted-foreground">These links are scanned during extraction to enrich company information.</p>
                    </TabsContent>

                    <TabsContent value="extra-info" className="space-y-3 pt-4">
                      <Label htmlFor="additional-context" className="text-sm font-semibold">
                        Additional Context
                        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                      </Label>
                      <Textarea
                        id="additional-context"
                        placeholder="Add notes, focus areas, known concerns, or deal thesis for the analysis..."
                        value={additionalContext}
                        onChange={applyStringValue(setAdditionalContext)}
                        rows={4}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setShowAutoFill(!showAutoFill);
                    setIsAutoFilling(false);
                  }}
                >
                  <Sparkles className="size-4" />
                  {showAutoFill ? 'Hide' : 'Auto-Fill from Pitch Deck'}
                </Button>
                {showAutoFill && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Paste your pitch deck or company description here..."
                      value={autoFillText}
                      onChange={applyStringValue(setAutoFillText)}
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
                  onChange={applyStringValue(setPitchSummary)}
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
                  onChange={applyStringValue(setKeyMetrics)}
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
                    onChange={applyStringValue(setTeamInfo)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product / Technology (optional)</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Product description, tech stack, IP, differentiators..."
                    rows={3}
                    value={productDescription}
                    onChange={applyStringValue(setProductDescription)}
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
                External Data Sources
              </CardTitle>
              <CardDescription>
                Connect to free external data sources for comprehensive analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Data Sources</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleExternalSources.map((src) => {
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{src.name}</p>
                            {src.free && <Badge variant="outline" className="text-xs text-green-600 border-green-300">FREE</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{src.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <p className="font-medium">Auto-fetch external data for: <span className="text-primary">{companyName || 'No company set'}</span></p>
                  <p className="text-sm text-muted-foreground">
                    {selectedExternalSourceIds.length} source(s) selected. Data fetch starts automatically when you select a source.
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  {fetchingData ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                  {fetchingData ? 'Auto-fetching' : `${externalData.filter((d) => d.success).length}/${Math.max(externalData.length, selectedExternalSourceIds.length)} fetched`}
                </Badge>
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
                        onClick={() => toggleModule(mod.id)}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border-2 p-4 transition-all',
                          'cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleModule(mod.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-primary" />
                            <span className="font-medium text-sm">{mod.name}</span>
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
                      const lockedByModule =
                        !ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS.has(section.id)
                        && managedSectionIds.has(section.id)
                        && !activeManagedIds.has(section.id);
                      return (
                    <Switch
                      checked={section.active}
                      disabled={lockedByModule || ALWAYS_AVAILABLE_TRIAGE_SECTION_IDS.has(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
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
                  <Button size="lg" onClick={() => handleGenerate()} className="gap-2 px-8">
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
                    {qualityAssessment.recommendationLabel}
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
                    <p className="text-sm font-medium">Active Module Scores (Real AI, 0-10)</p>
                    <div className="space-y-1">
                      {activeModules.map((m) => {
                        const backendCat = tcaCategories?.find((c) => {
                          const label = (c.name ?? c.category ?? '').toLowerCase();
                          return label === m.name.toLowerCase();
                        });
                        const score = derivedModuleScores[m.id]
                          ?? backendCat?.score
                          ?? backendCat?.rawScore;
                        const maxScore = backendCat?.maxScore ?? 10;
                        return (
                          <div key={m.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                            <span className="text-muted-foreground">{m.name}</span>
                            <span className="font-semibold">{typeof score === 'number' ? `${score.toFixed(1)} / ${maxScore}` : 'N/A'}</span>
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
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Quality Gate & Report Narrative</p>
                  <Badge variant={qualityAssessment.gatePassed ? 'default' : 'secondary'}>
                    {qualityAssessment.gatePassed ? 'Gate Passed' : 'Manual Review Required'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Evidence {qualityAssessment.evidenceCoveragePct}% · Module Coverage {qualityAssessment.moduleCoveragePct}% · Verification {qualityAssessment.verificationScore}% · Consistency {qualityAssessment.consistencyScore}% · Quality {qualityAssessment.qualityScore}%
                </p>
                {!qualityAssessment.gatePassed && qualityAssessment.blockers.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1">
                    {qualityAssessment.blockers.map((blocker) => (
                      <li key={blocker} className="text-sm text-muted-foreground">{blocker}</li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Executive Summary</p>
                  <p className="text-sm text-muted-foreground leading-6">{qualityAssessment.reportNarrative.executiveSummary}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Analysis Narrative</p>
                  <p className="text-sm text-muted-foreground leading-6">{qualityAssessment.reportNarrative.analysisNarrative}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Final Recommendation Narrative</p>
                  <p className="text-sm text-muted-foreground leading-6">{qualityAssessment.reportNarrative.recommendationNarrative}</p>
                </div>
              </div>
              {(() => {
                const activePreviewSections = reportSections.filter((s) => s.active);
                const fallbackSections = applyModuleStateToTriageSections(DEFAULT_STANDARD_SECTIONS, selectedModules)
                  .filter((s) => s.active);
                const sectionsForPreview = activePreviewSections.length > 0 ? activePreviewSections : fallbackSections;

                return (
                  <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Configured Report Sections (Preview Coverage)</p>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Section</th>
                          <th className="px-3 py-2 text-left font-medium">Output Type</th>
                          <th className="px-3 py-2 text-left font-medium">Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionsForPreview.map((section) => (
                            <tr key={section.id} className="border-t">
                              <td className="px-3 py-2">{section.title}</td>
                              <td className="px-3 py-2 text-muted-foreground">{inferSectionArtifacts(section.title)}</td>
                              <td className="px-3 py-2 text-muted-foreground">{isAdminOrAnalyst ? 'Editable (Admin/Analyst)' : 'Read-only'}</td>
                            </tr>
                        ))}
                        {sectionsForPreview.length === 0 && (
                          <tr className="border-t">
                            <td className="px-3 py-3 text-muted-foreground" colSpan={3}>
                              No sections are active yet. Go back to Report Sections and enable at least one section.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/help/understanding-your-report" target="_blank">
                      <FileText className="mr-2 size-4" />
                      Help: Full Report Sections
                    </Link>
                  </Button>
                  <Button onClick={goToNext} disabled={!savedReportId}>
                    Complete Report
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
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
                {!savedReportId && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-3 text-sm text-amber-800">
                    Save Report is required before proceeding to Report Complete.
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
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Advanced export options: PDF, DOCX, PPTX, XLSX, PNG/JPG, and JSON.
                  </p>
                  <ExportButtons />
                </div>
              </div>
                );
              })()}
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
                    {qualityAssessment.recommendationLabel}
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
              {!savedReportId && (
                <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-3 text-sm text-amber-800">
                  Save Report is required before proceeding to Report Complete.
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
                    <Link href="/dashboard/reports" prefetch={false}>
                      <Eye className="size-4" />
                      View All Reports
                    </Link>
                  </Button>
                )}
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Advanced export options: PDF, DOCX, PPTX, XLSX, PNG/JPG, and JSON.
                </p>
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
                  {qualityAssessment.recommendationLabel})
                </p>
                {savedReportId && (
                  <p className="text-xs text-green-700">Saved as Report #{savedReportId}</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href="/dashboard/reports" prefetch={false}>
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
                      <span className="text-muted-foreground" suppressHydrationWarning>{r.date ? new Date(r.date).toISOString().slice(0, 10) : 'Unknown date'}</span>
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
                  onChange={applyStringValue(setHumanReviewNotes)}
                  rows={5}
                />
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Summary</p>
                <p className="font-semibold">{companyName} — Score: {compositeScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">
                  Recommendation: {qualityAssessment.recommendationLabel}
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

  if (!isHydrated) {
    return <div className="p-4 md:p-6" suppressHydrationWarning />;
  }

  const roleLabel = userRole === 'admin' ? 'Admin Control' : userRole === 'analyst' ? 'Reviewer Workspace' : 'User Summary Flow';
  const currentWorkflowIndex = Math.max(0, displaySteps.findIndex((workflowStep) => workflowStep.id === displayedCurrentStepId));
  const completedCount = Math.max(0, currentStepPosition - 1);
  const workflowProgressPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(((completedCount + (displayedCurrentStepId === lastDisplayStepId ? 1 : 0.35)) / Math.max(displaySteps.length, 1)) * 100)
    )
  );
  const remainingSteps = Math.max(displaySteps.length - completedCount - (displayedCurrentStepId === lastDisplayStepId ? 1 : 0), 0);
  const estimatedSecondsRemaining = (remainingSteps * 45) + (isGenerating ? 140 : 0) + (isExtracting ? 70 : 0);

  const confidenceBase = averageNumbers([
    averageNumbers(Object.values(derivedModuleScores).map((value) => (typeof value === 'number' && value > 0 ? value : null))),
    compositeScore > 0 ? compositeScore : null,
  ]);
  const extractionConfidenceInputs = [
    sector,
    stage,
    businessModel,
    country,
    stateRegion,
    city,
    oneLineDescription,
    companyDescription,
    productDescription,
    pitchDeckPath,
    annualRevenue,
    preMoneyValuation,
    pitchSummary,
  ];
  const extractionCoveragePct = Math.round(
    (extractionConfidenceInputs.filter((value) => cleanShortText(value).length > 0).length / extractionConfidenceInputs.length) * 100
  );
  const hasConfidenceEvidence = qualityAssessment.hasComputedAnalysis && qualityAssessment.moduleCoveragePct > 0;
  const hasExtractionEvidence = autoFillText.trim().length > 0 || extractedText.trim().length > 0 || extractionCoveragePct > 0;
  const extractionConfidenceScore = hasExtractionEvidence
    ? Math.max(
      35,
      Math.min(
        94,
        Math.round(
          (extractionCoveragePct * 0.78)
          + (autoFillText.trim().length > 0 ? 8 : 0)
          + (extractedText.trim().length > 0 ? 8 : 0)
          + (selectedExternalSourceIds.length > 0 ? 4 : 0)
        )
      )
    )
    : null;
  const confidenceScore = hasConfidenceEvidence
    ? (qualityAssessment.gatePassed
      ? 100
      : Math.max(
        1,
        Math.min(
          99,
          Math.round((((confidenceBase ?? 0) * 10) * 0.7) + (qualityAssessment.evidenceCoveragePct * 0.3))
        )
      ))
    : extractionConfidenceScore;

  const currentEngine = (() => {
    if (isExtracting) return 'AI Extraction Engine';
    if (isGenerating) {
      const selected = TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id));
      const idx = Math.min(selected.length - 1, Math.max(0, Math.floor((generationProgress / 100) * Math.max(1, selected.length))));
      return selected[idx]?.name || 'Composite Investment Engine';
    }
    if (currentStep === 8) return 'Scenario Simulation Engine';
    if (currentStep === 10) return 'What-If Engine';
    if (currentStep === 2) return 'Signal Detection Engine';
    return currentStepMeta?.name || 'Evaluation Engine';
  })();

  const currentAiStage = isGenerating
    ? generationStatus || 'Running investment analysis engines'
    : isExtracting
    ? extractionStatus || 'Analyzing uploaded material'
    : `Current step: ${currentStepMeta?.name || `Step ${currentStep}`}`;

  const riskScore = typeof derivedModuleScores.risk === 'number' ? derivedModuleScores.risk : null;
  const riskLevel = riskScore === null ? 'Pending' : riskScore <= 4 ? 'High' : riskScore <= 7 ? 'Medium' : 'Low';
  const reviewerStatus = humanReviewNotes.trim().length > 0 ? 'Completed' : 'Pending';

  const workflowMetrics = [
    { label: 'TCA Score', value: Number.isFinite(compositeScore) && compositeScore > 0 ? compositeScore.toFixed(1) : '' },
    { label: 'Risk Level', value: riskLevel === 'Pending' ? '' : riskLevel },
    { label: 'Reviewer Status', value: reviewerStatus === 'Pending' ? '' : reviewerStatus },
    { label: 'AI Confidence', value: typeof confidenceScore === 'number' ? `${confidenceScore}%` : '' },
  ];

  const workflowStepsWithStatus: WorkflowStepWithStatus[] = displaySteps.map((step) => {
    const workflowIndex = displaySteps.findIndex((workflowStep) => workflowStep.id === step.id);
    const isCurrent = step.id === displayedCurrentStepId;
    const status = workflowIndex < currentWorkflowIndex
      ? 'completed'
      : isCurrent
      ? (canAdvanceFrom(currentStep) ? 'active' : 'warning')
      : 'pending';
    return { ...step, status };
  });

  const goToWorkflowStep = (workflowStepId: number) => {
    const targetWorkflowStep = displaySteps.find((step) => step.id === workflowStepId);
    const targetStepId = targetWorkflowStep?.stepIds[0];

    if (typeof targetStepId === 'number') {
      setCurrentStep(targetStepId);
    }
  };

  const aiActivityItems: Array<{ id: string; text: string; tone: 'success' | 'warning' | 'info' }> = [
    {
      id: 'extract',
      text: extractionProgress >= 100
        ? 'Extracted business signals, KPIs, and investment indicators from uploaded material.'
        : isExtracting
        ? `Extraction in progress (${extractionProgress}%).`
        : 'Awaiting document extraction.',
      tone: extractionProgress >= 100 ? 'success' : isExtracting ? 'info' : 'warning',
    },
    {
      id: 'engines',
      text: `Activated ${selectedModules.length} evaluation engine${selectedModules.length === 1 ? '' : 's'} for this run.`,
      tone: selectedModules.length > 0 ? 'success' : 'warning',
    },
    {
      id: 'simulation',
      text: currentStep === 8
        ? 'Scenario simulation is live. Adjust weights and observe score deltas.'
        : 'Simulation engine standing by for scenario tuning.',
      tone: currentStep === 8 ? 'info' : 'success',
    },
    {
      id: 'consistency',
      text: riskLevel === 'High'
        ? 'Regulatory or execution risk signals detected. DD escalation suggested.'
        : 'Risk scan completed with no high-severity escalation triggers.',
      tone: riskLevel === 'High' ? 'warning' : 'success',
    },
    {
      id: 'benchmark',
      text: `Benchmark context loaded for ${sector || 'selected'} sector analysis.`,
      tone: sector ? 'success' : 'info',
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reports" prefetch={false}>
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
              Privileged flow: includes What-If and full review steps.
            </p>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          <Badge variant="secondary" className="text-sm">
            Step {currentStepPosition} of {displaySteps.length}
          </Badge>
          <Button variant="outline" size="sm" onClick={resetWizard}>
            <RefreshCw className="mr-2 size-4" />
            Fresh Start
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/reports" prefetch={false}>
              Cancel
            </Link>
          </Button>
        </div>
      </div>

      <TriageWizard
        trackingId={trackingId}
        companyName={companyName.trim() || 'Not set yet'}
        owner={reportOwner}
        roleLabel={roleLabel}
        progressPercent={workflowProgressPercent}
        eta={formatEta(estimatedSecondsRemaining)}
        stage={currentAiStage}
        engine={currentEngine}
        confidencePercent={confidenceScore}
        metrics={workflowMetrics}
        steps={workflowStepsWithStatus}
        currentStepId={displayedCurrentStepId}
        onStepSelect={goToWorkflowStep}
        activityItems={aiActivityItems}
      >
        {renderStepContent()}
      </TriageWizard>

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
          {currentStep < lastStepId && currentStep !== 8 && currentStep !== 9 && currentStep !== 10 && currentStep !== 11 && (
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

