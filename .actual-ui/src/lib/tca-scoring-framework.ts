/**
 * TCA Scoring Framework — scoring helper functions used by analysis/actions.ts
 * These compute derived financial/growth/gap/funder metrics from raw category scores.
 */

// ─── Growth Raw Signal ────────────────────────────────────────────────────────

interface GrowthRawSignalInput {
  revenueGrowth: number | null;
  marketScalability: number | null;
  productScalability: number | null;
  tractionVelocity: number | null;
  teamExecution: number | null;
  gtmReadiness: number | null;
  strategicTiming: number | null;
}

/**
 * Weighted average of available growth signal dimensions (0–10 scale).
 * Skips null/undefined dimensions and redistributes weight proportionally.
 */
export function computeGrowthRawSignal(params: GrowthRawSignalInput): number {
  const dimensions: Array<{ value: number | null; weight: number }> = [
    { value: params.revenueGrowth,      weight: 0.25 },
    { value: params.marketScalability,  weight: 0.20 },
    { value: params.productScalability, weight: 0.15 },
    { value: params.tractionVelocity,   weight: 0.15 },
    { value: params.teamExecution,      weight: 0.10 },
    { value: params.gtmReadiness,       weight: 0.10 },
    { value: params.strategicTiming,    weight: 0.05 },
  ];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const dim of dimensions) {
    if (dim.value !== null && Number.isFinite(dim.value)) {
      const clamped = Math.max(0, Math.min(10, dim.value));
      weightedSum += clamped * dim.weight;
      totalWeight += dim.weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// ─── Growth Classifier ────────────────────────────────────────────────────────

interface ModelPredictions {
  linear: number;
  tree: number;
  rf: number;
  xgb: number;
  lstm: number;
  heuristic: number;
}

interface ModelQualityMetrics {
  cc: number; kk: number; rr: number; pp: number;
  ee: number; ss: number; tt: number; aa: number;
}

interface GrowthClassifierInput {
  modelPredictions: ModelPredictions;
  modelQuality: Record<string, ModelQualityMetrics>;
  sectorPriorWeights?: ModelPredictions;
  alpha: number;
  growthBoosts: number;
  riskPenalties: number;
}

interface GrowthClassifierResult {
  compositeGrowthScore: number;
  riskAdjustment: number;
  finalGrowthScore: number;
  growthModuleScore: number;
  tier: string;
  meaning: string;
  modelWeights: ModelPredictions;
  interpretation: string;
}

/**
 * Ensemble growth classifier: blends model predictions using quality-weighted
 * sector priors, then applies boost/penalty adjustments.
 */
export function computeGrowthClassifierResult(params: GrowthClassifierInput): GrowthClassifierResult {
  const { modelPredictions, modelQuality, alpha, growthBoosts, riskPenalties } = params;
  const defaultPriors: ModelPredictions = { linear: 1/6, tree: 1/6, rf: 1/6, xgb: 1/6, lstm: 1/6, heuristic: 1/6 };
  const sectorPriorWeights: ModelPredictions = params.sectorPriorWeights ?? defaultPriors;

  const models = Object.keys(sectorPriorWeights) as Array<keyof ModelPredictions>;

  // Average quality score per model (mean of its 8 quality metrics)
  const modelQualityAvg: Partial<ModelPredictions> = {};
  for (const m of models) {
    const q = modelQuality[m];
    if (q) {
      const vals = [q.cc, q.kk, q.rr, q.pp, q.ee, q.ss, q.tt, q.aa];
      modelQualityAvg[m] = vals.reduce((a, b) => a + b, 0) / vals.length;
    } else {
      modelQualityAvg[m] = 0.7;
    }
  }

  // Posterior weights = prior × quality, then normalise
  const raw: Partial<ModelPredictions> = {};
  let rawTotal = 0;
  for (const m of models) {
    raw[m] = (sectorPriorWeights[m] ?? 0) * (modelQualityAvg[m] ?? 0.7);
    rawTotal += raw[m]!;
  }

  const modelWeights = { linear: 0, tree: 0, rf: 0, xgb: 0, lstm: 0, heuristic: 0 } as ModelPredictions;
  for (const m of models) {
    modelWeights[m] = rawTotal > 0 ? (raw[m]! / rawTotal) : 1 / models.length;
  }

  // Composite = weighted average of model predictions
  let compositeGrowthScore = 0;
  for (const m of models) {
    compositeGrowthScore += (modelPredictions[m] ?? 0) * modelWeights[m];
  }
  compositeGrowthScore = Math.max(0, Math.min(100, compositeGrowthScore));

  // Apply alpha blending: compositeGrowthScore blended with max-model score
  const maxPrediction = Math.max(...models.map(m => modelPredictions[m] ?? 0));
  const blended = alpha * compositeGrowthScore + (1 - alpha) * maxPrediction;

  // Risk adjustment: growth boosts (+) and risk penalties (-)
  const riskAdjustment = growthBoosts - riskPenalties;
  const finalGrowthScore = Math.max(0, Math.min(100, blended + riskAdjustment));

  // Module score on 0–10 scale
  const growthModuleScore = Math.max(0, Math.min(10, finalGrowthScore / 10));

  // Tier classification
  let tier: string;
  let meaning: string;
  if (finalGrowthScore >= 75) {
    tier = 'Tier 1';
    meaning = 'High Growth Potential';
  } else if (finalGrowthScore >= 50) {
    tier = 'Tier 2';
    meaning = 'Moderate Growth Potential';
  } else {
    tier = 'Tier 3';
    meaning = 'Low Growth Potential';
  }

  return {
    compositeGrowthScore: Math.round(compositeGrowthScore * 100) / 100,
    riskAdjustment: Math.round(riskAdjustment * 100) / 100,
    finalGrowthScore: Math.round(finalGrowthScore * 100) / 100,
    growthModuleScore: Math.round(growthModuleScore * 100) / 100,
    tier,
    meaning,
    modelWeights,
    interpretation: `Composite growth score ${finalGrowthScore.toFixed(1)}/100 — ${meaning}.`,
  };
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

interface GapInputCategory {
  category: string;
  actualScore: number;
  targetScore: number;
  categoryWeight: number;
  sectorGapWeight: number;
}

interface GapCategory {
  category: string;
  actualScore: number;
  targetScore: number;
  delta: number;
  severity: 'Critical' | 'Major' | 'Minor' | 'On Track';
  weightedGap: number;
  mitigationRequired: boolean;
}

interface GapAnalysisResult {
  categories: GapCategory[];
  criticalCount: number;
  majorCount: number;
  gapComposite: number;
  readinessIndex: number;
  readiness: string;
  moduleScore: number;
}

/**
 * Per-category gap analysis: computes delta vs. target, severity, and readiness index.
 */
export function computeGapAnalysisResult(categories: GapInputCategory[]): GapAnalysisResult {
  const processed: GapCategory[] = categories.map((cat) => {
    const delta = cat.targetScore - cat.actualScore;
    const weightedGap = Math.max(0, delta) * cat.categoryWeight * cat.sectorGapWeight;

    let severity: GapCategory['severity'];
    if (delta <= 0) {
      severity = 'On Track';
    } else if (delta >= 3) {
      severity = 'Critical';
    } else if (delta >= 1.5) {
      severity = 'Major';
    } else {
      severity = 'Minor';
    }

    return {
      category: cat.category,
      actualScore: Math.round(cat.actualScore * 100) / 100,
      targetScore: Math.round(cat.targetScore * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      severity,
      weightedGap: Math.round(weightedGap * 100) / 100,
      mitigationRequired: severity === 'Critical' || severity === 'Major',
    };
  });

  const criticalCount = processed.filter(c => c.severity === 'Critical').length;
  const majorCount = processed.filter(c => c.severity === 'Major').length;

  const totalWeightedGap = processed.reduce((sum, c) => sum + c.weightedGap, 0);
  const maxPossibleGap = categories.reduce((sum, c) => sum + c.targetScore * c.categoryWeight * c.sectorGapWeight, 0);
  const gapComposite = maxPossibleGap > 0 ? Math.max(0, Math.min(100, (totalWeightedGap / maxPossibleGap) * 100)) : 0;

  const readinessIndex = Math.max(0, Math.min(100, 100 - gapComposite));

  let readiness: string;
  if (readinessIndex >= 80) {
    readiness = 'High';
  } else if (readinessIndex >= 60) {
    readiness = 'Moderate';
  } else if (readinessIndex >= 40) {
    readiness = 'Low';
  } else {
    readiness = 'Very Low';
  }

  const moduleScore = Math.max(0, Math.min(10, readinessIndex / 10));

  return {
    categories: processed,
    criticalCount,
    majorCount,
    gapComposite: Math.round(gapComposite * 100) / 100,
    readinessIndex: Math.round(readinessIndex * 100) / 100,
    readiness,
    moduleScore: Math.round(moduleScore * 100) / 100,
  };
}

// ─── Funder Fit Score ─────────────────────────────────────────────────────────

interface FunderFitInput {
  sector: string;
  stageFit: number;
  checkFit: number;
  sectorFit: number;
  geoFit: number;
  thesisFit: number;
}

interface FunderFitResult {
  funderFitScore: number;
  fitLevel: 'Strong Fit' | 'Moderate Fit' | 'Weak Fit';
  recommendationLanguage: string;
  moduleScore: number;
}

/**
 * Weighted composite of funder-fit dimensions on a 0–100 scale.
 * MedTech tilts more weight toward sectorFit and thesisFit.
 */
export function computeFunderFitScore(params: FunderFitInput): FunderFitResult {
  const isMedtech = params.sector === 'medtech';

  const weights = isMedtech
    ? { stageFit: 0.20, checkFit: 0.15, sectorFit: 0.30, geoFit: 0.10, thesisFit: 0.25 }
    : { stageFit: 0.25, checkFit: 0.20, sectorFit: 0.25, geoFit: 0.10, thesisFit: 0.20 };

  const funderFitScore = Math.max(
    0,
    Math.min(
      100,
      params.stageFit  * weights.stageFit  +
      params.checkFit  * weights.checkFit  +
      params.sectorFit * weights.sectorFit +
      params.geoFit    * weights.geoFit    +
      params.thesisFit * weights.thesisFit,
    )
  );

  let fitLevel: FunderFitResult['fitLevel'];
  let recommendationLanguage: string;

  if (funderFitScore >= 70) {
    fitLevel = 'Strong Fit';
    recommendationLanguage = `Strong investor fit (${funderFitScore.toFixed(0)}/100) — proceed with targeted outreach.`;
  } else if (funderFitScore >= 45) {
    fitLevel = 'Moderate Fit';
    recommendationLanguage = `Moderate investor fit (${funderFitScore.toFixed(0)}/100) — refine positioning before outreach.`;
  } else {
    fitLevel = 'Weak Fit';
    recommendationLanguage = `Weak investor fit (${funderFitScore.toFixed(0)}/100) — address gaps in stage/sector alignment first.`;
  }

  return {
    funderFitScore: Math.round(funderFitScore * 100) / 100,
    fitLevel,
    recommendationLanguage,
    moduleScore: Math.max(0, Math.min(10, funderFitScore / 10)),
  };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

export type ConfidenceBand = 'high' | 'medium' | 'low';

function clamp10(v: number | null): number | null {
  if (v === null || !Number.isFinite(v)) return null;
  return Math.max(1, Math.min(10, v));
}

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function applyConfidencePenalty(score: number, band: ConfidenceBand): number {
  if (band === 'low') return score * 0.88;
  if (band === 'medium') return score * 0.94;
  return score;
}

// ─── RAW_MODULE_CONFIG & MODULE_WEIGHT_MAP ────────────────────────────────────

export const RAW_MODULE_CONFIG: Array<{ id: string; formula: string }> = [
  { id: 'tca',          formula: 'Weighted average of 12 TCA categories (market, problem-solution, product, business model, competition, team, financial, GTM, traction, risk, strategic, growth)' },
  { id: 'risk',         formula: 'Risk flag severity index: red flags × 0.25 + yellow flags × 0.08; inverted to score' },
  { id: 'growth',       formula: 'Ensemble growth classifier: 6-model prediction blend with quality-weighted sector priors' },
  { id: 'macro',        formula: 'PESTEL composite with sector-weighted political/regulatory loading + trend overlay' },
  { id: 'benchmark',    formula: 'Industry percentile composite blended with competitive advantage and traction validation' },
  { id: 'team',         formula: 'Weighted blend of team score (0.4), founder score (0.25), team-founder fit (0.35)' },
  { id: 'analyst',      formula: 'Analyst synthesis: TCA + risk + benchmark + macro + team/founder/growth confidence blend' },
  { id: 'funder',       formula: 'Funder fit score: stage, check, sector, geo, thesis fit with sector prior weighting' },
  { id: 'gap',          formula: 'Readiness index derived from per-category delta vs target, weighted by severity and sector gap weight' },
  { id: 'strategic',    formula: 'Long-term moat, expansion, platform potential, defensibility, competitive durability, strategic timing' },
  { id: 'economic',     formula: 'Industry structure, pricing power, macro indicators, cycle resilience; recession & burn adjustments' },
  { id: 'financial',    formula: 'Revenue model, unit economics, projections, funding requirements; burn/runway/milestone adjustments' },
  { id: 'environmental',formula: 'Environmental impact, climate risk, certification, ESG alignment; greenwashing penalty if claims unverified' },
  { id: 'marketing',    formula: 'Positioning, digital presence, spend efficiency, GTM execution; CAC/churn/burn penalties' },
  { id: 'social',       formula: 'Social impact, demographic fit, cultural adoption, stakeholder trust; adoption resistance and backlash penalties' },
  { id: 'founderFit',   formula: 'Vision, passion, domain expertise, leadership, execution, investor readiness, credibility' },
  { id: 'strategicFit', formula: 'Investor alignment, corporate synergy, market timing, geographic fit, ecosystem fit, acquisition potential' },
];

export const MODULE_WEIGHT_MAP: Record<string, number> = {
  tca:           0.22,
  risk:          0.14,
  growth:        0.10,
  macro:         0.06,
  benchmark:     0.06,
  team:          0.08,
  analyst:       0.06,
  funder:        0.04,
  gap:           0.05,
  strategic:     0.05,
  economic:      0.04,
  financial:     0.04,
  environmental: 0.02,
  marketing:     0.02,
  social:        0.02,
  founderFit:    0.03,
  strategicFit:  0.03,
};

// ─── inferMacroSector ─────────────────────────────────────────────────────────

/**
 * Maps a freeform sector/industry string to a canonical macro-sector key.
 */
export function inferMacroSector(hint: string): string {
  const h = hint.toLowerCase();
  if (/medtech|medical device|med tech|health tech|healthtech|digital health|life science/.test(h)) return 'medtech';
  if (/biotech|biopharma|pharma|therapeutics|genomics|biomedical/.test(h)) return 'biotech';
  if (/fintech|financial tech|insurtech|regtech|wealthtech|payments|lending/.test(h)) return 'fintech';
  if (/cleantech|clean tech|climate|renewabl|energy|greentech|sustainability/.test(h)) return 'cleantech';
  if (/ai|artificial intelligence|machine learning|deep tech|deep-tech/.test(h)) return 'ai';
  if (/saas|software|cloud|cybersecurity|cyber security|devops|enterprise tech/.test(h)) return 'saas';
  if (/ecommerce|e-commerce|retail|d2c|direct.to.consumer|marketplace/.test(h)) return 'ecommerce';
  if (/manufacturing|industrials|hardware|robotics|iot|internet of things/.test(h)) return 'manufacturing';
  return 'general';
}

// ─── computeMacroCompositeScore ───────────────────────────────────────────────

interface PestelInput {
  political: number | null;
  economic: number | null;
  social: number | null;
  technological: number | null;
  environmental: number | null;
  legal: number | null;
}

/**
 * Sector-weighted PESTEL composite (0–10 scale).
 */
export function computeMacroCompositeScore(
  pestel: PestelInput,
  sector: string,
  confidence: ConfidenceBand
): number | null {
  // Default PESTEL weights
  const weights: Record<keyof PestelInput, number> = {
    political:     0.15,
    economic:      0.20,
    social:        0.15,
    technological: 0.20,
    environmental: 0.15,
    legal:         0.15,
  };

  // Sector overrides
  if (sector === 'medtech' || sector === 'biotech') {
    weights.legal        = 0.25;
    weights.political    = 0.20;
    weights.technological = 0.20;
    weights.economic     = 0.15;
    weights.social       = 0.10;
    weights.environmental = 0.10;
  } else if (sector === 'fintech') {
    weights.legal        = 0.25;
    weights.political    = 0.20;
    weights.economic     = 0.25;
    weights.technological = 0.15;
    weights.social       = 0.10;
    weights.environmental = 0.05;
  } else if (sector === 'cleantech') {
    weights.environmental = 0.30;
    weights.political     = 0.20;
    weights.economic      = 0.20;
    weights.technological = 0.15;
    weights.social        = 0.10;
    weights.legal         = 0.05;
  }

  const keys = Object.keys(weights) as Array<keyof PestelInput>;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const k of keys) {
    const v = pestel[k];
    if (v !== null && Number.isFinite(v)) {
      const normalised = v > 10 ? v / 10 : v;
      weightedSum += Math.max(0, Math.min(10, normalised)) * weights[k];
      totalWeight += weights[k];
    }
  }

  if (totalWeight === 0) return null;
  const raw = weightedSum / totalWeight;
  return Math.round(applyConfidencePenalty(raw, confidence) * 100) / 100;
}

// ─── computeBenchmarkCompositeScore ──────────────────────────────────────────

/**
 * Averages benchmark overlay values with an optional confidence adjustment.
 * Extra arguments (p1, p2) are accepted for forward-compatibility but unused.
 */
export function computeBenchmarkCompositeScore(
  values: Array<number | null>,
  _p1: unknown,
  _p2: unknown,
  confidence: ConfidenceBand
): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
  const clamped = Math.max(1, Math.min(10, mean));
  return Math.round(applyConfidencePenalty(clamped, confidence) * 100) / 100;
}

// ─── Module result types & helpers ───────────────────────────────────────────

interface ModuleResult {
  finalScore: number | null;
}

function buildModuleResult(components: Array<number | null | undefined>, confidence: ConfidenceBand, penalty: number): ModuleResult {
  const base = avg(components);
  if (base === null) return { finalScore: null };
  const withConf = applyConfidencePenalty(base, confidence);
  const withPenalty = Math.max(1, withConf - penalty);
  return { finalScore: Math.round(clamp10(withPenalty)! * 100) / 100 };
}

// ─── computeFinancialModuleResult ─────────────────────────────────────────────

interface FinancialModuleInput {
  revenueModel: number | null;
  unitEconomics: number | null;
  financialProjections: number | null;
  fundingRequirements: number | null;
  confidence: ConfidenceBand;
  penalty: number;
  burnMultiple?: number | null;
  runwayMonths?: number | null;
  milestoneMappingScore?: number | null;
}

export function computeFinancialModuleResult(params: FinancialModuleInput): ModuleResult {
  const components = [params.revenueModel, params.unitEconomics, params.financialProjections, params.fundingRequirements, params.milestoneMappingScore];
  const result = buildModuleResult(components, params.confidence, params.penalty);
  if (result.finalScore === null) return result;

  let adjusted = result.finalScore;
  if (params.burnMultiple !== null && params.burnMultiple !== undefined && params.burnMultiple > 3) {
    adjusted = Math.max(1, adjusted - (params.burnMultiple - 3) * 0.3);
  }
  if (params.runwayMonths !== null && params.runwayMonths !== undefined && params.runwayMonths < 6) {
    adjusted = Math.max(1, adjusted - 1.5);
  }
  return { finalScore: Math.round(clamp10(adjusted)! * 100) / 100 };
}

// ─── computeEconomicModuleResult ─────────────────────────────────────────────

interface EconomicModuleInput {
  industryStructure: number | null;
  pricingPower: number | null;
  macroIndicators: number | null;
  cycleResilience: number | null;
  confidence: ConfidenceBand;
  penalty: number;
  recessionSensitive?: boolean;
  burnHighWithMacroWeak?: boolean;
}

export function computeEconomicModuleResult(params: EconomicModuleInput): ModuleResult {
  const components = [params.industryStructure, params.pricingPower, params.macroIndicators, params.cycleResilience];
  const result = buildModuleResult(components, params.confidence, params.penalty);
  if (result.finalScore === null) return result;

  let adjusted = result.finalScore;
  if (params.recessionSensitive) adjusted = Math.max(1, adjusted - 0.8);
  if (params.burnHighWithMacroWeak) adjusted = Math.max(1, adjusted - 0.6);
  return { finalScore: Math.round(clamp10(adjusted)! * 100) / 100 };
}

// ─── computeSocialModuleResult ───────────────────────────────────────────────

interface SocialModuleInput {
  socialImpact: number | null;
  demographicFit: number | null;
  culturalAdoption: number | null;
  stakeholderTrust: number | null;
  confidence: ConfidenceBand;
  penalty: number;
  adoptionResistanceHigh?: boolean;
  backlashRiskDetected?: boolean;
}

export function computeSocialModuleResult(params: SocialModuleInput): ModuleResult {
  const components = [params.socialImpact, params.demographicFit, params.culturalAdoption, params.stakeholderTrust];
  const result = buildModuleResult(components, params.confidence, params.penalty);
  if (result.finalScore === null) return result;

  let adjusted = result.finalScore;
  if (params.adoptionResistanceHigh) adjusted = Math.max(1, adjusted - 0.7);
  if (params.backlashRiskDetected) adjusted = Math.max(1, adjusted - 1.0);
  return { finalScore: Math.round(clamp10(adjusted)! * 100) / 100 };
}

// ─── computeMarketingModuleResult ────────────────────────────────────────────

interface MarketingModuleInput {
  positioning: number | null;
  digitalPresence: number | null;
  spendEfficiency: number | null;
  gtmExecution: number | null;
  confidence: ConfidenceBand;
  penalty: number;
  cacWorsening?: boolean;
  churnHigh?: boolean;
  burnHighWithWeakDigital?: boolean;
}

export function computeMarketingModuleResult(params: MarketingModuleInput): ModuleResult {
  const components = [params.positioning, params.digitalPresence, params.spendEfficiency, params.gtmExecution];
  const result = buildModuleResult(components, params.confidence, params.penalty);
  if (result.finalScore === null) return result;

  let adjusted = result.finalScore;
  if (params.cacWorsening) adjusted = Math.max(1, adjusted - 0.8);
  if (params.churnHigh) adjusted = Math.max(1, adjusted - 0.6);
  if (params.burnHighWithWeakDigital) adjusted = Math.max(1, adjusted - 0.5);
  return { finalScore: Math.round(clamp10(adjusted)! * 100) / 100 };
}

// ─── computeEnvironmentalModuleResult ────────────────────────────────────────

interface EnvironmentalModuleInput {
  environmentalImpact: number | null;
  climateRisk: number | null;
  certification: number | null;
  esgAlignment: number | null;
  confidence: ConfidenceBand;
  penalty: number;
  institutionalFundingTarget?: boolean;
  sustainabilityClaimsUnverified?: boolean;
}

export function computeEnvironmentalModuleResult(params: EnvironmentalModuleInput): ModuleResult {
  const components = [params.environmentalImpact, params.climateRisk, params.certification, params.esgAlignment];
  const result = buildModuleResult(components, params.confidence, params.penalty);
  if (result.finalScore === null) return result;

  let adjusted = result.finalScore;
  if (params.sustainabilityClaimsUnverified) adjusted = Math.max(1, adjusted - 0.9);
  // Institutional funding target is a positive signal
  if (params.institutionalFundingTarget) adjusted = Math.min(10, adjusted + 0.3);
  return { finalScore: Math.round(clamp10(adjusted)! * 100) / 100 };
}

// ─── computeFounderFitModuleResult ───────────────────────────────────────────

interface FounderFitModuleInput {
  vision: number | null;
  passion: number | null;
  domainExpertise: number | null;
  leadership: number | null;
  execution: number | null;
  investorReadiness: number | null;
  credibility: number | null;
  confidence: ConfidenceBand;
  penalty: number;
  readinessScoreOverride?: number | null;
}

export function computeFounderFitModuleResult(params: FounderFitModuleInput): ModuleResult {
  const components = [params.vision, params.passion, params.domainExpertise, params.leadership, params.execution, params.investorReadiness, params.credibility];
  const result = buildModuleResult(components, params.confidence, params.penalty);

  // Allow override from a direct readiness score if available
  if (params.readinessScoreOverride !== null && params.readinessScoreOverride !== undefined && Number.isFinite(params.readinessScoreOverride)) {
    const overrideScore = clamp10(params.readinessScoreOverride)!;
    if (result.finalScore === null) return { finalScore: Math.round(overrideScore * 100) / 100 };
    return { finalScore: Math.round(((result.finalScore + overrideScore) / 2) * 100) / 100 };
  }

  return result;
}

// ─── computeStrategicModuleResult ────────────────────────────────────────────

interface StrategicModuleInput {
  longTermMoat: number | null;
  expansionStrategy: number | null;
  platformPotential: number | null;
  defensibility: number | null;
  competitiveDurability: number | null;
  strategicTiming: number | null;
  confidence: ConfidenceBand;
  penalty: number;
}

export function computeStrategicModuleResult(params: StrategicModuleInput): ModuleResult {
  const components = [params.longTermMoat, params.expansionStrategy, params.platformPotential, params.defensibility, params.competitiveDurability, params.strategicTiming];
  return buildModuleResult(components, params.confidence, params.penalty);
}

// ─── computeStrategicFitModuleResult ─────────────────────────────────────────

interface StrategicFitModuleInput {
  investorAlignment: number | null;
  corporateSynergy: number | null;
  marketTiming: number | null;
  geographicFit: number | null;
  ecosystemFit: number | null;
  acquisitionPotential: number | null;
  confidence: ConfidenceBand;
  penalty: number;
}

export function computeStrategicFitModuleResult(params: StrategicFitModuleInput): ModuleResult {
  const components = [params.investorAlignment, params.corporateSynergy, params.marketTiming, params.geographicFit, params.ecosystemFit, params.acquisitionPotential];
  return buildModuleResult(components, params.confidence, params.penalty);
}

// ─── computeAnalystSynthesisResult ───────────────────────────────────────────

interface AnalystSynthesisInput {
  tcaComposite: number | null;
  riskScore: number | null;
  benchmarkScore: number | null;
  macroScore: number | null;
  teamScore: number | null;
  founderScore: number | null;
  growthScore: number | null;
  confidence: ConfidenceBand;
  penalty: number;
}

export function computeAnalystSynthesisResult(params: AnalystSynthesisInput): ModuleResult {
  const components = [
    params.tcaComposite,
    params.riskScore,
    params.benchmarkScore,
    params.macroScore,
    params.teamScore,
    params.founderScore,
    params.growthScore,
  ];
  return buildModuleResult(components, params.confidence, params.penalty);
}

