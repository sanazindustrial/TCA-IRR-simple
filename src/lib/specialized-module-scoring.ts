/**
 * Specialized module scoring utilities for Financial, Economic, Social, Marketing, and Environmental analysis.
 */

export type SignalColour = 'green' | 'yellow' | 'red';

const GREEN_THRESHOLD = 8.0;
const YELLOW_THRESHOLD = 5.5;

function toSignal(score: number): SignalColour {
  if (score >= GREEN_THRESHOLD) return 'green';
  if (score >= YELLOW_THRESHOLD) return 'yellow';
  return 'red';
}

// ---------------------------------------------------------------------------
// Individual module score calculators
// ---------------------------------------------------------------------------

export interface FinancialSubscores {
  revenue_model: number;
  unit_economics: number;
  projections: number;
  funding_requirements: number;
}

export function scoreFinancial(subscores: FinancialSubscores): { score: number; signal: SignalColour } {
  const score =
    subscores.revenue_model * 0.30 +
    subscores.unit_economics * 0.30 +
    subscores.projections * 0.20 +
    subscores.funding_requirements * 0.20;
  return { score, signal: toSignal(score) };
}

export interface EconomicSubscores {
  industry_structure: number;
  pricing_power: number;
  macro_indicators: number;
  cycle_resilience: number;
}

export function scoreEconomic(subscores: EconomicSubscores): { score: number; signal: SignalColour } {
  const score =
    subscores.industry_structure * 0.30 +
    subscores.pricing_power * 0.25 +
    subscores.macro_indicators * 0.25 +
    subscores.cycle_resilience * 0.20;
  return { score, signal: toSignal(score) };
}

export interface SocialSubscores {
  social_impact: number;
  demographic_fit: number;
  cultural_adoption: number;
  stakeholder_trust: number;
}

export function scoreSocial(subscores: SocialSubscores): { score: number; signal: SignalColour } {
  const score =
    subscores.social_impact * 0.30 +
    subscores.demographic_fit * 0.25 +
    subscores.cultural_adoption * 0.25 +
    subscores.stakeholder_trust * 0.20;
  return { score, signal: toSignal(score) };
}

export interface MarketingSubscores {
  positioning: number;
  digital_presence: number;
  spend_efficiency: number;
  gtm_execution: number;
}

export function scoreMarketing(subscores: MarketingSubscores): { score: number; signal: SignalColour } {
  const score =
    subscores.positioning * 0.25 +
    subscores.digital_presence * 0.20 +
    subscores.spend_efficiency * 0.30 +
    subscores.gtm_execution * 0.25;
  return { score, signal: toSignal(score) };
}

export interface EnvironmentalSubscores {
  impact: number;
  climate_risk: number;
  certification: number;
  esg_alignment: number;
}

export function scoreEnvironmental(subscores: EnvironmentalSubscores): { score: number; signal: SignalColour } {
  const score =
    subscores.impact * 0.30 +
    subscores.climate_risk * 0.25 +
    subscores.certification * 0.15 +
    subscores.esg_alignment * 0.30;
  return { score, signal: toSignal(score) };
}

// ---------------------------------------------------------------------------
// Expanded Readiness Score (sector-aware)
// ---------------------------------------------------------------------------

export type Sector = 'general' | 'tech' | 'medlife';

export interface ReadinessInputScores {
  strategicFit: number;
  founderFit: number;
  financial: number;
  economic: number;
  social: number;
  marketing: number;
  environmental: number;
}

interface SectorWeights {
  strategicFit: number;
  founderFit: number;
  financial: number;
  economic: number;
  social: number;
  marketing: number;
  environmental: number;
}

const SECTOR_WEIGHTS: Record<Sector, SectorWeights> = {
  general: {
    strategicFit: 0.20,
    founderFit: 0.20,
    financial: 0.20,
    economic: 0.10,
    social: 0.10,
    marketing: 0.10,
    environmental: 0.10,
  },
  tech: {
    strategicFit: 0.22,
    founderFit: 0.20,
    financial: 0.18,
    economic: 0.08,
    social: 0.07,
    marketing: 0.15,
    environmental: 0.10,
  },
  medlife: {
    strategicFit: 0.18,
    founderFit: 0.18,
    financial: 0.16,
    economic: 0.10,
    social: 0.12,
    marketing: 0.06,
    environmental: 0.20,
  },
};

/**
 * Compute the expanded investment readiness score weighted by sector.
 * All input scores are expected in the 0–10 range.
 * Returns a score in the 0–10 range and the corresponding signal.
 */
export function computeExpandedReadiness(
  scores: ReadinessInputScores,
  sector: Sector = 'general'
): { score: number; signal: SignalColour } {
  const w = SECTOR_WEIGHTS[sector];
  const score =
    scores.strategicFit * w.strategicFit +
    scores.founderFit * w.founderFit +
    scores.financial * w.financial +
    scores.economic * w.economic +
    scores.social * w.social +
    scores.marketing * w.marketing +
    scores.environmental * w.environmental;
  return { score, signal: toSignal(score) };
}
