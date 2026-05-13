export type TcaModuleId =
  | 'tca'
  | 'risk'
  | 'macro'
  | 'team'
  | 'benchmark'
  | 'growth'
  | 'gap'
  | 'founderFit'
  | 'strategicFit'
  | 'financial'
  | 'economic'
  | 'social'
  | 'marketing'
  | 'environmental'
  | 'funder'
  | 'strategic'
  | 'analyst';

export type ConfidenceBand = 'high' | 'medium' | 'low';

export type MacroSectorKey = 'general' | 'tech' | 'medtech' | 'biotech' | 'fintech';

export type PESTELScoreMap = {
  political?: number | null;
  economic?: number | null;
  social?: number | null;
  technological?: number | null;
  environmental?: number | null;
  legal?: number | null;
};

export interface ModuleRawConfig {
  id: TcaModuleId;
  name: string;
  moduleWeight: number;
  higherIsBetter: boolean;
  formula: string;
  subfactors: string[];
}

export const MODULE_WEIGHT_MAP: Record<TcaModuleId, number> = {
  tca: 20,
  risk: 10,
  team: 10,
  financial: 10,
  growth: 10,
  benchmark: 8,
  founderFit: 7,
  strategic: 7,
  marketing: 5,
  macro: 5,
  strategicFit: 3,
  environmental: 2,
  social: 2,
  economic: 1,
  funder: 0,
  gap: 4,
  analyst: 0,
};

export const RAW_MODULE_CONFIG: ModuleRawConfig[] = [
  {
    id: 'tca',
    name: 'TCA Scorecard',
    moduleWeight: MODULE_WEIGHT_MAP.tca,
    higherIsBetter: true,
    formula: 'sum((subfactor_i * 0.10), i=1..10)',
    subfactors: ['market', 'problem', 'product', 'business_model', 'team', 'traction', 'scalability', 'defensibility', 'financial_viability', 'strategic_timing'],
  },
  {
    id: 'risk',
    name: 'Risk Assessment',
    moduleWeight: MODULE_WEIGHT_MAP.risk,
    higherIsBetter: true,
    formula: '10 - avg(risk_severity_domain_i)',
    subfactors: ['regulatory', 'financial', 'technical', 'legal', 'cyber', 'operational', 'gtm', 'team', 'esg'],
  },
  {
    id: 'macro',
    name: 'Macro Trend Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.macro,
    higherIsBetter: true,
    formula: '(political + economic + social + technological + environmental + legal) / 6',
    subfactors: ['political', 'economic', 'social', 'technological', 'environmental', 'legal'],
  },
  {
    id: 'team',
    name: 'Team Assessment',
    moduleWeight: MODULE_WEIGHT_MAP.team,
    higherIsBetter: true,
    formula: '(founder_market_fit + technical_fit + execution + leadership + resilience + coachability + team_completeness + governance) / 8',
    subfactors: ['founder_market_fit', 'technical_fit', 'execution', 'leadership', 'resilience', 'coachability', 'team_completeness', 'governance'],
  },
  {
    id: 'benchmark',
    name: 'Benchmark Comparison',
    moduleWeight: MODULE_WEIGHT_MAP.benchmark,
    higherIsBetter: true,
    formula: 'percentile_score_normalized_to_0_10',
    subfactors: ['revenue_growth', 'adoption', 'retention', 'ltv_cac', 'burn_multiple', 'runway'],
  },
  {
    id: 'growth',
    name: 'Growth Classifier',
    moduleWeight: MODULE_WEIGHT_MAP.growth,
    higherIsBetter: true,
    formula: 'normalize(sum(model_prediction_i * model_weight_i))',
    subfactors: ['revenue_growth', 'scalability', 'tam_expansion', 'product_scalability', 'hiring_velocity', 'operational_maturity', 'market_timing'],
  },
  {
    id: 'gap',
    name: 'Gap Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.gap,
    higherIsBetter: true,
    formula: '10 - weighted_gap_composite',
    subfactors: ['team_gap', 'product_gap', 'gtm_gap', 'financial_gap', 'compliance_gap', 'data_gap'],
  },
  {
    id: 'founderFit',
    name: 'Founder Fit Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.founderFit,
    higherIsBetter: true,
    formula: '(vision + domain_expertise + leadership + execution + communication + trust + investor_readiness) / 7',
    subfactors: ['vision', 'passion', 'domain_expertise', 'leadership', 'execution', 'investor_readiness', 'credibility'],
  },
  {
    id: 'strategicFit',
    name: 'Strategic Fit Matrix',
    moduleWeight: MODULE_WEIGHT_MAP.strategicFit,
    higherIsBetter: true,
    formula: '(market_alignment + technology_alignment + mandate_fit + esg_fit + exit_fit) / 5 with pathway_multiplier',
    subfactors: ['investor_alignment', 'corporate_synergy', 'market_timing', 'geographic_fit', 'ecosystem_fit', 'acquisition_potential'],
  },
  {
    id: 'financial',
    name: 'Financial Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.financial,
    higherIsBetter: true,
    formula: '(revenue_model*0.30) + (unit_economics*0.30) + (financial_projections*0.20) + (funding_requirements*0.20)',
    subfactors: ['revenue_quality', 'burn_efficiency', 'runway', 'margin_quality', 'forecast_realism', 'cash_flow_stability', 'cac_ltv'],
  },
  {
    id: 'economic',
    name: 'Economic Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.economic,
    higherIsBetter: true,
    formula: '(industry_structure*0.30) + (pricing_power*0.25) + (macro_indicators*0.25) + (cycle_resilience*0.20)',
    subfactors: ['inflation_resilience', 'interest_rate_sensitivity', 'gdp_dependence', 'labor_cost_exposure', 'currency_exposure', 'economic_cycle_resilience'],
  },
  {
    id: 'social',
    name: 'Social Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.social,
    higherIsBetter: true,
    formula: '(social_impact*0.30) + (demographic_fit*0.25) + (cultural_adoption*0.25) + (stakeholder_trust*0.20)',
    subfactors: ['consumer_trust', 'ethical_impact', 'workforce_impact', 'inclusion', 'public_perception', 'social_relevance'],
  },
  {
    id: 'marketing',
    name: 'Marketing Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.marketing,
    higherIsBetter: true,
    formula: '(positioning*0.25) + (digital_presence*0.20) + (spend_efficiency*0.30) + (gtm_execution*0.25)',
    subfactors: ['brand_strength', 'cac_efficiency', 'retention', 'organic_growth', 'conversion_efficiency', 'community_engagement'],
  },
  {
    id: 'environmental',
    name: 'Environmental Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.environmental,
    higherIsBetter: true,
    formula: '(environmental_impact*0.30) + (climate_risk*0.25) + (certification*0.15) + (esg_alignment*0.30)',
    subfactors: ['esg_alignment', 'sustainability', 'carbon_impact', 'resource_efficiency', 'regulatory_environmental_readiness'],
  },
  {
    id: 'funder',
    name: 'Funder Fit',
    moduleWeight: MODULE_WEIGHT_MAP.funder,
    higherIsBetter: true,
    formula: 'weighted(stage_fit + check_fit + sector_fit + geo_fit + thesis_fit) by sector matrix',
    subfactors: ['vc_thesis_match', 'stage_alignment', 'roi_potential', 'risk_compatibility', 'ticket_size_fit', 'exit_attractiveness'],
  },
  {
    id: 'strategic',
    name: 'Strategic Analysis',
    moduleWeight: MODULE_WEIGHT_MAP.strategic,
    higherIsBetter: true,
    formula: '(long_term_moat + expansion_strategy + platform_potential + defensibility + strategic_timing) / 5',
    subfactors: ['long_term_moat', 'expansion_strategy', 'platform_potential', 'defensibility', 'competitive_durability', 'strategic_timing'],
  },
  {
    id: 'analyst',
    name: 'Analyst Synthesis',
    moduleWeight: MODULE_WEIGHT_MAP.analyst,
    higherIsBetter: true,
    formula: 'human reviewer weighted synthesis of all module evidence',
    subfactors: ['ai_human_alignment', 'evidence_quality', 'review_depth', 'decision_consistency'],
  },
];

export const MACRO_SECTOR_WEIGHTS: Record<MacroSectorKey, Record<keyof Required<PESTELScoreMap>, number>> = {
  general: { political: 0.1, economic: 0.2, social: 0.15, technological: 0.35, environmental: 0.05, legal: 0.15 },
  tech: { political: 0.1, economic: 0.2, social: 0.15, technological: 0.35, environmental: 0.05, legal: 0.15 },
  medtech: { political: 0.15, economic: 0.1, social: 0.1, technological: 0.1, environmental: 0.15, legal: 0.4 },
  biotech: { political: 0.15, economic: 0.1, social: 0.1, technological: 0.15, environmental: 0.1, legal: 0.4 },
  fintech: { political: 0.12, economic: 0.24, social: 0.14, technological: 0.22, environmental: 0.03, legal: 0.25 },
};

const CONFIDENCE_MULTIPLIER: Record<ConfidenceBand, number> = {
  high: 1,
  medium: 0.9,
  low: 0.8,
};

export const clampScore = (score: number): number => Math.max(1, Math.min(10, score));

export const averageScores = (scores: Array<number | null | undefined>): number | null => {
  const values = scores.filter((s): s is number => typeof s === 'number' && Number.isFinite(s));
  if (values.length === 0) return null;
  return values.reduce((sum, s) => sum + s, 0) / values.length;
};

export const weightedAverageScores = (
  parts: Array<{ score: number | null | undefined; weight: number }>
): number | null => {
  const valid = parts.filter(
    (p): p is { score: number; weight: number } =>
      typeof p.score === 'number' && Number.isFinite(p.score) && p.weight > 0
  );
  if (valid.length === 0) return null;
  const total = valid.reduce((sum, p) => sum + p.weight, 0);
  if (total <= 0) return null;
  return valid.reduce((sum, p) => sum + (p.score * p.weight), 0) / total;
};

export const normalizeRawScore = (
  raw: number | null,
  confidence: ConfidenceBand,
  consistencyPenalty = 0
): number | null => {
  if (raw === null) return null;
  const adjusted = (raw * CONFIDENCE_MULTIPLIER[confidence]) - Math.max(0, consistencyPenalty);
  return clampScore(adjusted);
};

export const calculateRawScoreFromSubfactors = (
  subfactors: Record<string, number | null | undefined>
): number | null => {
  return averageScores(Object.values(subfactors));
};

export const inferMacroSector = (sectorHint: string | null | undefined): MacroSectorKey => {
  const s = String(sectorHint || '').toLowerCase();
  if (!s) return 'general';
  if (s.includes('med') || s.includes('life')) return 'medtech';
  if (s.includes('bio') || s.includes('pharma')) return 'biotech';
  if (s.includes('fin')) return 'fintech';
  if (s.includes('tech') || s.includes('saas') || s.includes('ai')) return 'tech';
  return 'general';
};

export const computeMacroCompositeScore = (
  pestel: PESTELScoreMap,
  sector: MacroSectorKey,
  confidence: ConfidenceBand
): number | null => {
  const weights = MACRO_SECTOR_WEIGHTS[sector];
  const weighted = weightedAverageScores([
    { score: pestel.political ?? null, weight: weights.political },
    { score: pestel.economic ?? null, weight: weights.economic },
    { score: pestel.social ?? null, weight: weights.social },
    { score: pestel.technological ?? null, weight: weights.technological },
    { score: pestel.environmental ?? null, weight: weights.environmental },
    { score: pestel.legal ?? null, weight: weights.legal },
  ]);
  if (weighted === null) return null;
  return normalizeRawScore(weighted, confidence, 0);
};

export const computeMacroOverlayFromScore = (
  macroScore: number | null,
  overlayLimit = 0.05
): number => {
  if (macroScore === null) return 0;
  if (macroScore >= 9) return overlayLimit;
  if (macroScore >= 8) return Math.min(overlayLimit, 0.03);
  if (macroScore >= 6) return 0;
  if (macroScore >= 4) return Math.max(-overlayLimit, -0.03);
  return -overlayLimit;
};

export const computeBenchmarkOverlay = (
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null,
  zScore: number | null,
  overlayLimit = 0.05
): number => {
  let overlay = 0;
  if (quartile === 'Q1') overlay = 0.05;
  else if (quartile === 'Q2') overlay = 0.025;
  else if (quartile === 'Q4') overlay = -0.025;

  if (typeof zScore === 'number' && Number.isFinite(zScore) && zScore <= -1) {
    overlay = -0.05;
  }
  return Math.max(-overlayLimit, Math.min(overlayLimit, overlay));
};

export const computeBenchmarkCompositeScore = (
  metricScores: Array<number | null | undefined>,
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null,
  zScore: number | null,
  confidence: ConfidenceBand
): number | null => {
  const raw = averageScores(metricScores);
  if (raw === null) return null;
  const overlay = computeBenchmarkOverlay(quartile, zScore, 0.05);
  const normalized = normalizeRawScore(raw, confidence, 0);
  if (normalized === null) return null;
  return clampScore(normalized * (1 + overlay));
};

export const computeTeamAssessmentScore = (
  dimensionScores: Record<string, number | null | undefined>,
  traitScores: Record<string, number | null | undefined>,
  sector: MacroSectorKey,
  consistencyPenalty = 0,
  confidence: ConfidenceBand = 'medium'
): number | null => {
  const techDimensionWeights: Record<string, number> = {
    founder_market_fit: 0.15,
    technical_fit: 0.2,
    execution: 0.25,
    leadership: 0.1,
    resilience: 0.1,
    coachability: 0.05,
    team_completeness: 0.1,
    governance: 0.05,
  };
  const medtechDimensionWeights: Record<string, number> = {
    founder_market_fit: 0.1,
    technical_fit: 0.25,
    execution: 0.2,
    leadership: 0.1,
    resilience: 0.1,
    coachability: 0.05,
    team_completeness: 0.15,
    governance: 0.05,
  };
  const dimensionWeights = sector === 'medtech' || sector === 'biotech'
    ? medtechDimensionWeights
    : techDimensionWeights;

  const dimensionComposite = weightedAverageScores(
    Object.entries(dimensionWeights).map(([key, weight]) => ({ score: dimensionScores[key], weight }))
  );

  const traitWeights: Record<string, number> = {
    grit: 0.25,
    adaptability: 0.25,
    coachability: 0.2,
    clarity: 0.15,
    decisiveness: 0.15,
  };
  const traitComposite = weightedAverageScores(
    Object.entries(traitWeights).map(([key, weight]) => ({ score: traitScores[key], weight }))
  );

  const base = weightedAverageScores([
    { score: dimensionComposite, weight: 0.8 },
    { score: traitComposite, weight: 0.2 },
  ]);
  return normalizeRawScore(base, confidence, consistencyPenalty);
};

export const calculateFinalCompositeFromModules = (
  moduleScores: Partial<Record<TcaModuleId, number | null>>
): number | null => {
  const weighted = RAW_MODULE_CONFIG
    .filter((m) => m.moduleWeight > 0)
    .map((m) => ({ score: moduleScores[m.id] ?? null, weight: m.moduleWeight }));

  const composite = weightedAverageScores(weighted);
  return composite === null ? null : clampScore(composite);
};

export type GrowthModelId = 'linear' | 'tree' | 'rf' | 'xgb' | 'lstm' | 'heuristic';

export type GrowthQualityFactor = {
  cc: number;
  kk: number;
  rr: number;
  pp: number;
  ee: number;
  ss: number;
  tt: number;
  aa: number;
};

export type GrowthClassifierInput = {
  modelPredictions: Partial<Record<GrowthModelId, number | null | undefined>>;
  modelQuality: Partial<Record<GrowthModelId, GrowthQualityFactor>>;
  sectorPriorWeights?: Partial<Record<GrowthModelId, number>>;
  alpha?: number;
  growthBoosts?: number;
  riskPenalties?: number;
};

export type GrowthClassifierResult = {
  modelWeights: Record<GrowthModelId, number>;
  compositeGrowthScore: number;
  riskAdjustment: number;
  finalGrowthScore: number;
  growthModuleScore: number;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  meaning: 'High Growth' | 'Moderate Growth' | 'Low Growth';
};

const GROWTH_MODELS: GrowthModelId[] = ['linear', 'tree', 'rf', 'xgb', 'lstm', 'heuristic'];

const clampZeroToHundred = (score: number): number => Math.max(0, Math.min(100, score));

const normalizeToOne = (value: number): number => Math.max(0, Math.min(1, value));

export const computeGrowthRawSignal = (signals: {
  revenueGrowth?: number | null;
  marketScalability?: number | null;
  productScalability?: number | null;
  tractionVelocity?: number | null;
  teamExecution?: number | null;
  gtmReadiness?: number | null;
  strategicTiming?: number | null;
}): number | null => {
  const weighted = weightedAverageScores([
    { score: signals.revenueGrowth ?? null, weight: 0.2 },
    { score: signals.marketScalability ?? null, weight: 0.2 },
    { score: signals.productScalability ?? null, weight: 0.15 },
    { score: signals.tractionVelocity ?? null, weight: 0.15 },
    { score: signals.teamExecution ?? null, weight: 0.1 },
    { score: signals.gtmReadiness ?? null, weight: 0.1 },
    { score: signals.strategicTiming ?? null, weight: 0.1 },
  ]);
  return weighted === null ? null : clampScore(weighted);
};

export const computeGrowthClassifierResult = (input: GrowthClassifierInput): GrowthClassifierResult => {
  const alpha = normalizeToOne(typeof input.alpha === 'number' ? input.alpha : 0.7);

  const qualityMeanByModel: Record<GrowthModelId, number> = {
    linear: 0,
    tree: 0,
    rf: 0,
    xgb: 0,
    lstm: 0,
    heuristic: 0,
  };

  for (const model of GROWTH_MODELS) {
    const q = input.modelQuality[model];
    if (!q) {
      qualityMeanByModel[model] = 0.8;
      continue;
    }
    qualityMeanByModel[model] = (
      normalizeToOne(q.cc) + normalizeToOne(q.kk) + normalizeToOne(q.rr) + normalizeToOne(q.pp) +
      normalizeToOne(q.ee) + normalizeToOne(q.ss) + normalizeToOne(q.tt) + normalizeToOne(q.aa)
    ) / 8;
  }

  const totalMean = GROWTH_MODELS.reduce((sum, model) => sum + qualityMeanByModel[model], 0) || 1;
  const dynamicWeights: Record<GrowthModelId, number> = {
    linear: qualityMeanByModel.linear / totalMean,
    tree: qualityMeanByModel.tree / totalMean,
    rf: qualityMeanByModel.rf / totalMean,
    xgb: qualityMeanByModel.xgb / totalMean,
    lstm: qualityMeanByModel.lstm / totalMean,
    heuristic: qualityMeanByModel.heuristic / totalMean,
  };

  const priorTotal = GROWTH_MODELS.reduce(
    (sum, model) => sum + Math.max(0, Number(input.sectorPriorWeights?.[model] ?? 0)),
    0
  );

  const blendedWeights: Record<GrowthModelId, number> = {
    linear: 0,
    tree: 0,
    rf: 0,
    xgb: 0,
    lstm: 0,
    heuristic: 0,
  };

  for (const model of GROWTH_MODELS) {
    const prior = priorTotal > 0
      ? Math.max(0, Number(input.sectorPriorWeights?.[model] ?? 0)) / priorTotal
      : dynamicWeights[model];
    blendedWeights[model] = (alpha * dynamicWeights[model]) + ((1 - alpha) * prior);
  }

  const blendedTotal = GROWTH_MODELS.reduce((sum, model) => sum + blendedWeights[model], 0) || 1;
  for (const model of GROWTH_MODELS) {
    blendedWeights[model] = blendedWeights[model] / blendedTotal;
  }

  const compositeGrowthScore = clampZeroToHundred(
    GROWTH_MODELS.reduce((sum, model) => {
      const pred = Number(input.modelPredictions[model] ?? 0);
      const prediction = Number.isFinite(pred) ? clampZeroToHundred(pred) : 0;
      return sum + (prediction * blendedWeights[model]);
    }, 0)
  );

  const riskAdjustment = (Number(input.growthBoosts ?? 0) || 0) - (Number(input.riskPenalties ?? 0) || 0);
  const finalGrowthScore = clampZeroToHundred(compositeGrowthScore + riskAdjustment);
  const growthModuleScore = clampScore(finalGrowthScore / 10);

  const tier: 'Tier 1' | 'Tier 2' | 'Tier 3' =
    finalGrowthScore >= 70 ? 'Tier 1' : finalGrowthScore >= 40 ? 'Tier 2' : 'Tier 3';
  const meaning: 'High Growth' | 'Moderate Growth' | 'Low Growth' =
    tier === 'Tier 1' ? 'High Growth' : tier === 'Tier 2' ? 'Moderate Growth' : 'Low Growth';

  return {
    modelWeights: blendedWeights,
    compositeGrowthScore,
    riskAdjustment,
    finalGrowthScore,
    growthModuleScore,
    tier,
    meaning,
  };
};

export type GapSeverity = 'Critical' | 'Major' | 'Minor' | 'No material gap';

export type GapCategoryScore = {
  category: string;
  actualScore: number;
  targetScore: number;
  categoryWeight: number;
  sectorGapWeight: number;
};

export type GapCategoryResult = GapCategoryScore & {
  delta: number;
  severity: GapSeverity;
  weightedGap: number;
  mitigationRequired: boolean;
};

export type GapReadiness =
  | 'Investment Ready'
  | 'Prescreen Ready'
  | 'Early Stage'
  | 'Reject Candidate';

export type GapAnalysisResult = {
  categories: GapCategoryResult[];
  criticalCount: number;
  majorCount: number;
  gapComposite: number;
  readinessIndex: number;
  readiness: GapReadiness;
  moduleScore: number;
};

const classifyGapSeverity = (delta: number): GapSeverity => {
  if (delta >= 3) return 'Critical';
  if (delta >= 1.5) return 'Major';
  if (delta >= 0.5) return 'Minor';
  return 'No material gap';
};

export const computeGapAnalysisResult = (items: GapCategoryScore[]): GapAnalysisResult => {
  const categories: GapCategoryResult[] = items.map((item) => {
    const delta = Math.max(0, item.targetScore - item.actualScore);
    const severity = classifyGapSeverity(delta);
    const weightedGap = delta * Math.max(0, item.categoryWeight) * Math.max(0, item.sectorGapWeight);
    return {
      ...item,
      delta,
      severity,
      weightedGap,
      mitigationRequired: severity === 'Critical' || severity === 'Major',
    };
  });

  const criticalCount = categories.filter((c) => c.severity === 'Critical').length;
  const majorCount = categories.filter((c) => c.severity === 'Major').length;
  const gapComposite = categories.reduce((sum, c) => sum + c.weightedGap, 0);
  const readinessIndex = clampScore(10 - gapComposite);

  const readiness: GapReadiness =
    criticalCount === 0 && majorCount <= 3
      ? 'Investment Ready'
      : criticalCount <= 2 && majorCount <= 5
        ? 'Prescreen Ready'
        : (criticalCount > 2 || majorCount > 5)
          ? 'Early Stage'
          : 'Reject Candidate';

  const moduleScore = readiness === 'Reject Candidate' ? clampScore(readinessIndex - 2) : readinessIndex;

  return {
    categories,
    criticalCount,
    majorCount,
    gapComposite,
    readinessIndex,
    readiness,
    moduleScore,
  };
};

export type FunderFitLevel = 'Strong Fit' | 'Moderate Fit' | 'Weak Fit';

export type FunderFitInput = {
  sector: MacroSectorKey;
  stageFit: number;
  checkFit: number;
  sectorFit: number;
  geoFit: number;
  thesisFit: number;
};

export type FunderFitResult = {
  funderFitScore: number;
  fitLevel: FunderFitLevel;
  recommendationLanguage:
    | 'Investor aligned - pathway to funding likely'
    | 'Funding possible - address alignment gaps'
    | 'Low alignment - reconsider investor profile';
  affectsScore: false;
  moduleScore: number;
};

export const computeFunderFitScore = (input: FunderFitInput): FunderFitResult => {
  const techWeights = {
    stageFit: 0.3,
    sectorFit: 0.25,
    checkFit: 0.2,
    geoFit: 0.15,
    thesisFit: 0.1,
  };

  const medtechWeights = {
    sectorFit: 0.3,
    checkFit: 0.25,
    stageFit: 0.25,
    geoFit: 0.1,
    thesisFit: 0.1,
  };

  const weights = input.sector === 'medtech' || input.sector === 'biotech' ? medtechWeights : techWeights;

  const funderFitScore = clampZeroToHundred(weightedAverageScores([
    { score: clampZeroToHundred(input.stageFit), weight: weights.stageFit },
    { score: clampZeroToHundred(input.checkFit), weight: weights.checkFit },
    { score: clampZeroToHundred(input.sectorFit), weight: weights.sectorFit },
    { score: clampZeroToHundred(input.geoFit), weight: weights.geoFit },
    { score: clampZeroToHundred(input.thesisFit), weight: weights.thesisFit },
  ]) ?? 0);

  const fitLevel: FunderFitLevel =
    funderFitScore >= 75 ? 'Strong Fit' : funderFitScore >= 50 ? 'Moderate Fit' : 'Weak Fit';

  const recommendationLanguage =
    fitLevel === 'Strong Fit'
      ? 'Investor aligned - pathway to funding likely'
      : fitLevel === 'Moderate Fit'
        ? 'Funding possible - address alignment gaps'
        : 'Low alignment - reconsider investor profile';

  return {
    funderFitScore,
    fitLevel,
    recommendationLanguage,
    affectsScore: false,
    moduleScore: clampScore(funderFitScore / 10),
  };
};

export type ModuleSignal = 'Green' | 'Yellow' | 'Red';

const classifyModuleSignal = (score: number): ModuleSignal => {
  if (score >= 8) return 'Green';
  if (score >= 5.5) return 'Yellow';
  return 'Red';
};

const confidenceToMultiplier = (confidence: ConfidenceBand): number => {
  if (confidence === 'high') return 1;
  if (confidence === 'medium') return 0.9;
  return 0.8;
};

export type WeightedModuleResult = {
  subScores: Record<string, number>;
  rawScore: number;
  finalScore: number;
  signal: ModuleSignal;
  ssrImpact: number;
  confidence: number;
  riskFlags: string[];
};

export type FinancialModuleInput = {
  revenueModel: number | null;
  unitEconomics: number | null;
  financialProjections: number | null;
  fundingRequirements: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
  burnMultiple?: number | null;
  runwayMonths?: number | null;
  milestoneMappingScore?: number | null;
};

export const computeFinancialModuleResult = (input: FinancialModuleInput): WeightedModuleResult => {
  const rawSub = {
    revenue_model: input.revenueModel,
    unit_economics: input.unitEconomics,
    financial_projections: input.financialProjections,
    funding_requirements: input.fundingRequirements,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 4 ? ((4 - presentCount) / 4) * 0.5 : 0;

  const rawScore = weightedAverageScores([
    { score: rawSub.revenue_model, weight: 0.3 },
    { score: rawSub.unit_economics, weight: 0.3 },
    { score: rawSub.financial_projections, weight: 0.2 },
    { score: rawSub.funding_requirements, weight: 0.2 },
  ]) ?? 5;

  const subScores = {
    revenue_model: rawSub.revenue_model !== null ? clampScore(rawSub.revenue_model) : rawScore,
    unit_economics: rawSub.unit_economics !== null ? clampScore(rawSub.unit_economics) : rawScore,
    financial_projections: rawSub.financial_projections !== null ? clampScore(rawSub.financial_projections) : rawScore,
    funding_requirements: rawSub.funding_requirements !== null ? clampScore(rawSub.funding_requirements) : rawScore,
  };

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.05 : finalScore >= 8 ? 0.03 : finalScore < 5.5 ? -0.1 : 0;

  const riskFlags: string[] = [];
  if ((input.burnMultiple ?? 0) > 2) riskFlags.push('Burn multiple above 2 indicates efficiency risk');
  if ((input.runwayMonths ?? 99) < 9) riskFlags.push('Runway below 9 months triggers funding urgency');
  if (subScores.financial_projections < 5) riskFlags.push('Projection credibility review required');
  if ((input.milestoneMappingScore ?? subScores.funding_requirements) < 5) riskFlags.push('Funding request lacks milestone mapping');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete financial data — ${presentCount}/4 subfactors present`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

export type EconomicModuleInput = {
  industryStructure: number | null;
  pricingPower: number | null;
  macroIndicators: number | null;
  cycleResilience: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
  recessionSensitive?: boolean;
  burnHighWithMacroWeak?: boolean;
};

export const computeEconomicModuleResult = (input: EconomicModuleInput): WeightedModuleResult => {
  const rawSub = {
    industry_structure: input.industryStructure,
    pricing_power: input.pricingPower,
    macro_indicators: input.macroIndicators,
    cycle_resilience: input.cycleResilience,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 4 ? ((4 - presentCount) / 4) * 0.4 : 0;

  const rawScore = weightedAverageScores([
    { score: rawSub.industry_structure, weight: 0.3 },
    { score: rawSub.pricing_power, weight: 0.25 },
    { score: rawSub.macro_indicators, weight: 0.25 },
    { score: rawSub.cycle_resilience, weight: 0.2 },
  ]) ?? 5;

  const subScores = {
    industry_structure: rawSub.industry_structure !== null ? clampScore(rawSub.industry_structure) : rawScore,
    pricing_power: rawSub.pricing_power !== null ? clampScore(rawSub.pricing_power) : rawScore,
    macro_indicators: rawSub.macro_indicators !== null ? clampScore(rawSub.macro_indicators) : rawScore,
    cycle_resilience: rawSub.cycle_resilience !== null ? clampScore(rawSub.cycle_resilience) : rawScore,
  };

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.04 : finalScore >= 8 ? 0.02 : finalScore < 5.5 ? -0.06 : 0;

  const riskFlags: string[] = [];
  if (subScores.pricing_power < 5) riskFlags.push('Pricing power below 5 indicates margin sustainability risk');
  if (input.recessionSensitive) riskFlags.push('High recession sensitivity detected');
  if (input.burnHighWithMacroWeak) riskFlags.push('Negative macro alignment with high burn vulnerability');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete economic data — ${presentCount}/4 subfactors present`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

export type SocialModuleInput = {
  socialImpact: number | null;
  demographicFit: number | null;
  culturalAdoption: number | null;
  stakeholderTrust: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
  adoptionResistanceHigh?: boolean;
  backlashRiskDetected?: boolean;
};

export const computeSocialModuleResult = (input: SocialModuleInput): WeightedModuleResult => {
  const rawSub = {
    social_impact: input.socialImpact,
    demographic_fit: input.demographicFit,
    cultural_adoption: input.culturalAdoption,
    stakeholder_trust: input.stakeholderTrust,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 4 ? ((4 - presentCount) / 4) * 0.35 : 0;

  const rawScore = weightedAverageScores([
    { score: rawSub.social_impact, weight: 0.3 },
    { score: rawSub.demographic_fit, weight: 0.25 },
    { score: rawSub.cultural_adoption, weight: 0.25 },
    { score: rawSub.stakeholder_trust, weight: 0.2 },
  ]) ?? 5;

  const subScores = {
    social_impact: rawSub.social_impact !== null ? clampScore(rawSub.social_impact) : rawScore,
    demographic_fit: rawSub.demographic_fit !== null ? clampScore(rawSub.demographic_fit) : rawScore,
    cultural_adoption: rawSub.cultural_adoption !== null ? clampScore(rawSub.cultural_adoption) : rawScore,
    stakeholder_trust: rawSub.stakeholder_trust !== null ? clampScore(rawSub.stakeholder_trust) : rawScore,
  };

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.04 : finalScore >= 8 ? 0.02 : finalScore < 5.5 ? -0.05 : 0;

  const riskFlags: string[] = [];
  if (subScores.stakeholder_trust < 5) riskFlags.push('Stakeholder trust below 5 triggers governance review');
  if (input.adoptionResistanceHigh) riskFlags.push('High cultural adoption resistance detected');
  if (input.backlashRiskDetected) riskFlags.push('Potential social backlash requires ethical review');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete social data — ${presentCount}/4 subfactors present`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

export type MarketingModuleInput = {
  positioning: number | null;
  digitalPresence: number | null;
  spendEfficiency: number | null;
  gtmExecution: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
  cacWorsening?: boolean;
  churnHigh?: boolean;
  burnHighWithWeakDigital?: boolean;
};

export const computeMarketingModuleResult = (input: MarketingModuleInput): WeightedModuleResult => {
  const rawSub = {
    positioning: input.positioning,
    digital_presence: input.digitalPresence,
    spend_efficiency: input.spendEfficiency,
    gtm_execution: input.gtmExecution,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 4 ? ((4 - presentCount) / 4) * 0.45 : 0;

  const rawScore = weightedAverageScores([
    { score: rawSub.positioning, weight: 0.25 },
    { score: rawSub.digital_presence, weight: 0.2 },
    { score: rawSub.spend_efficiency, weight: 0.3 },
    { score: rawSub.gtm_execution, weight: 0.25 },
  ]) ?? 5;

  const subScores = {
    positioning: rawSub.positioning !== null ? clampScore(rawSub.positioning) : rawScore,
    digital_presence: rawSub.digital_presence !== null ? clampScore(rawSub.digital_presence) : rawScore,
    spend_efficiency: rawSub.spend_efficiency !== null ? clampScore(rawSub.spend_efficiency) : rawScore,
    gtm_execution: rawSub.gtm_execution !== null ? clampScore(rawSub.gtm_execution) : rawScore,
  };

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.05 : finalScore >= 8 ? 0.03 : finalScore < 5.5 ? -0.07 : 0;

  const riskFlags: string[] = [];
  if (input.cacWorsening) riskFlags.push('CAC trend worsening rapidly');
  if (subScores.gtm_execution < 5) riskFlags.push('GTM execution below 5 indicates scaling risk');
  if (subScores.positioning < 5 && input.churnHigh) riskFlags.push('Weak positioning with high churn suggests market-fit risk');
  if (input.burnHighWithWeakDigital) riskFlags.push('Weak digital authority with high burn signals marketing inefficiency');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete marketing data — ${presentCount}/4 subfactors present`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

export type EnvironmentalModuleInput = {
  environmentalImpact: number | null;
  climateRisk: number | null;
  certification: number | null;
  esgAlignment: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
  institutionalFundingTarget?: boolean;
  sustainabilityClaimsUnverified?: boolean;
};

export const computeEnvironmentalModuleResult = (input: EnvironmentalModuleInput): WeightedModuleResult => {
  const rawSub = {
    environmental_impact: input.environmentalImpact,
    climate_risk: input.climateRisk,
    certification: input.certification,
    esg_alignment: input.esgAlignment,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 4 ? ((4 - presentCount) / 4) * 0.4 : 0;

  const rawScore = weightedAverageScores([
    { score: rawSub.environmental_impact, weight: 0.3 },
    { score: rawSub.climate_risk, weight: 0.25 },
    { score: rawSub.certification, weight: 0.15 },
    { score: rawSub.esg_alignment, weight: 0.3 },
  ]) ?? 5;

  const subScores = {
    environmental_impact: rawSub.environmental_impact !== null ? clampScore(rawSub.environmental_impact) : rawScore,
    climate_risk: rawSub.climate_risk !== null ? clampScore(rawSub.climate_risk) : rawScore,
    certification: rawSub.certification !== null ? clampScore(rawSub.certification) : rawScore,
    esg_alignment: rawSub.esg_alignment !== null ? clampScore(rawSub.esg_alignment) : rawScore,
  };

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.05 : finalScore >= 8 ? 0.03 : finalScore < 5.5 ? -0.06 : 0;

  const riskFlags: string[] = [];
  if (subScores.climate_risk < 5) riskFlags.push('Climate risk score below 5 requires vulnerability review');
  if (input.institutionalFundingTarget && subScores.esg_alignment < 6) riskFlags.push('Weak ESG alignment for institutional funding profile');
  if (input.sustainabilityClaimsUnverified || subScores.certification < 5) riskFlags.push('Sustainability claims require third-party validation');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete environmental data — ${presentCount}/4 subfactors present`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

// ─── Founder Fit Module (Founder Capabilities) ───────────────────────────────
export type FounderFitModuleInput = {
  vision: number | null;
  passion: number | null;
  domainExpertise: number | null;
  leadership: number | null;
  execution: number | null;
  investorReadiness: number | null;
  credibility: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
  readinessScoreOverride?: number | null; // from founderFitData.readinessScore
};

export const computeFounderFitModuleResult = (input: FounderFitModuleInput): WeightedModuleResult => {
  // If a readiness score override is provided (from AI analysis), blend it in
  const overrideScore = input.readinessScoreOverride !== null && input.readinessScoreOverride !== undefined
    ? clampScore(input.readinessScoreOverride)
    : null;

  const rawSub = {
    vision: input.vision,
    passion: input.passion,
    domain_expertise: input.domainExpertise,
    leadership: input.leadership,
    execution: input.execution,
    investor_readiness: input.investorReadiness,
    credibility: input.credibility,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 7 ? ((7 - presentCount) / 7) * 0.4 : 0;

  // Equal-weight average of all 7 subfactors
  const subfactorScore = averageScores(Object.values(rawSub)) ?? 5;

  // Blend with override if available (override = 40% weight when present)
  const rawScore = overrideScore !== null
    ? clampScore(subfactorScore * 0.6 + overrideScore * 0.4)
    : subfactorScore;

  const subScores: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawSub)) {
    subScores[key] = val !== null ? clampScore(val) : rawScore;
  }

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.04 : finalScore >= 8 ? 0.02 : finalScore < 5.5 ? -0.06 : 0;

  const riskFlags: string[] = [];
  if ((rawSub.investor_readiness ?? 10) < 5) riskFlags.push('Investor readiness below 5 — pitch preparation required');
  if ((rawSub.execution ?? 10) < 5) riskFlags.push('Low execution score — track record review needed');
  if ((rawSub.credibility ?? 10) < 5) riskFlags.push('Credibility gap detected — references and validation required');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete founder profile — ${presentCount}/7 dimensions assessed`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

// ─── Strategic Module (Long-term Moat & Competitive Durability) ───────────────
export type StrategicModuleInput = {
  longTermMoat: number | null;
  expansionStrategy: number | null;
  platformPotential: number | null;
  defensibility: number | null;
  competitiveDurability: number | null;
  strategicTiming: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
};

export const computeStrategicModuleResult = (input: StrategicModuleInput): WeightedModuleResult => {
  const rawSub = {
    long_term_moat: input.longTermMoat,
    expansion_strategy: input.expansionStrategy,
    platform_potential: input.platformPotential,
    defensibility: input.defensibility,
    competitive_durability: input.competitiveDurability,
    strategic_timing: input.strategicTiming,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 6 ? ((6 - presentCount) / 6) * 0.45 : 0;

  // Equal-weight average across all 6 dimensions
  const rawScore = averageScores(Object.values(rawSub)) ?? 5;

  const subScores: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawSub)) {
    subScores[key] = val !== null ? clampScore(val) : rawScore;
  }

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.05 : finalScore >= 8 ? 0.03 : finalScore < 5.5 ? -0.07 : 0;

  const riskFlags: string[] = [];
  if ((rawSub.long_term_moat ?? 10) < 5) riskFlags.push('Weak long-term moat — competitive vulnerability risk');
  if ((rawSub.defensibility ?? 10) < 5) riskFlags.push('Low defensibility — IP or proprietary advantage required');
  if ((rawSub.strategic_timing ?? 10) < 5) riskFlags.push('Poor strategic timing — market readiness review needed');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete strategic data — ${presentCount}/6 dimensions assessed`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

// ─── Strategic Fit Matrix (Investor Thesis Alignment) ───────────────────────
export type StrategicFitModuleInput = {
  investorAlignment: number | null;
  corporateSynergy: number | null;
  marketTiming: number | null;
  geographicFit: number | null;
  ecosystemFit: number | null;
  acquisitionPotential: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
};

export const computeStrategicFitModuleResult = (input: StrategicFitModuleInput): WeightedModuleResult => {
  const rawSub = {
    investor_alignment: input.investorAlignment,
    corporate_synergy: input.corporateSynergy,
    market_timing: input.marketTiming,
    geographic_fit: input.geographicFit,
    ecosystem_fit: input.ecosystemFit,
    acquisition_potential: input.acquisitionPotential,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 6 ? ((6 - presentCount) / 6) * 0.4 : 0;

  // Equal-weight average across all 6 dimensions
  const rawScore = averageScores(Object.values(rawSub)) ?? 5;

  const subScores: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawSub)) {
    subScores[key] = val !== null ? clampScore(val) : rawScore;
  }

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = finalScore >= 9 ? 0.04 : finalScore >= 8 ? 0.02 : finalScore < 5.5 ? -0.05 : 0;

  const riskFlags: string[] = [];
  if ((rawSub.investor_alignment ?? 10) < 5) riskFlags.push('Low investor alignment — thesis compatibility review required');
  if ((rawSub.acquisition_potential ?? 10) < 5) riskFlags.push('Weak acquisition potential — exit path clarification needed');
  if (completenessPenalty > 0) riskFlags.push(`Incomplete strategic fit data — ${presentCount}/6 dimensions assessed`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};

// ─── Analyst Synthesis Module ──────────────────────────────────────────────
export type AnalystSynthesisInput = {
  tcaComposite: number | null;
  riskScore: number | null;
  benchmarkScore: number | null;
  macroScore: number | null;
  teamScore: number | null;
  founderScore: number | null;
  growthScore: number | null;
  confidence?: ConfidenceBand;
  penalty?: number;
};

export const computeAnalystSynthesisResult = (input: AnalystSynthesisInput): WeightedModuleResult => {
  const rawSub = {
    tca_composite: input.tcaComposite,
    risk_score: input.riskScore,
    benchmark_score: input.benchmarkScore,
    macro_score: input.macroScore,
    team_score: input.teamScore,
    founder_score: input.founderScore,
    growth_score: input.growthScore,
  };
  const presentCount = Object.values(rawSub).filter(v => v !== null).length;
  const completenessPenalty = presentCount < 7 ? ((7 - presentCount) / 7) * 0.3 : 0;

  // Analyst synthesis: weighted by evidence reliability
  const rawScore = weightedAverageScores([
    { score: rawSub.tca_composite, weight: 0.35 },
    { score: rawSub.risk_score, weight: 0.15 },
    { score: rawSub.benchmark_score, weight: 0.1 },
    { score: rawSub.macro_score, weight: 0.1 },
    { score: rawSub.team_score, weight: 0.1 },
    { score: rawSub.founder_score, weight: 0.1 },
    { score: rawSub.growth_score, weight: 0.1 },
  ]) ?? 5;

  const subScores: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawSub)) {
    subScores[key] = val !== null ? clampScore(val) : rawScore;
  }

  const confidenceBand = input.confidence ?? 'medium';
  const finalScore = clampScore(
    (rawScore * confidenceToMultiplier(confidenceBand))
    - completenessPenalty
    - Math.max(0, Number(input.penalty ?? 0))
  );
  const signal = classifyModuleSignal(finalScore);
  const ssrImpact = 0; // Analyst synthesis has no SSR adjustment

  const riskFlags: string[] = [];
  if (completenessPenalty > 0) riskFlags.push(`Analyst synthesis incomplete — ${presentCount}/7 module inputs available`);

  return { subScores, rawScore, finalScore, signal, ssrImpact, confidence: confidenceToMultiplier(confidenceBand), riskFlags };
};
