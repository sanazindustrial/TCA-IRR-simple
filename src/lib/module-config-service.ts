/**
 * Module Configuration Versioning Service
 *
 * Provides persistent, versioned storage for analysis module configurations.
 * - Admin/analyst can save their own versions and restore defaults.
 * - Default configs are hardcoded per framework (general / medtech).
 * - Up to MAX_VERSIONS saved per module per role in localStorage.
 */

export type Framework = 'general' | 'medtech';

export type ConfigVersion<T = unknown> = {
  version: number;
  timestamp: string;
  label: string;
  config: T;
  isDefault: boolean;
  savedBy?: string; // user email
};

const MAX_VERSIONS = 20;

function versionKey(module: string): string {
  return `module-config-versions-${module}`;
}

function getStoredVersions<T>(module: string): ConfigVersion<T>[] {
  try {
    const raw = localStorage.getItem(versionKey(module));
    if (!raw) return [];
    return JSON.parse(raw) as ConfigVersion<T>[];
  } catch {
    return [];
  }
}

function persistVersions<T>(module: string, versions: ConfigVersion<T>[]): void {
  try {
    // Keep only the latest MAX_VERSIONS entries (newest first)
    const trimmed = versions.slice(0, MAX_VERSIONS);
    localStorage.setItem(versionKey(module), JSON.stringify(trimmed));
  } catch (e) {
    console.warn('module-config-service: localStorage write failed', e);
  }
}

/** Save a new version for a module config. Returns the version number assigned. */
export function saveConfigVersion<T>(
  module: string,
  config: T,
  options: { label?: string; savedBy?: string; isDefault?: boolean } = {}
): number {
  const existing = getStoredVersions<T>(module);
  const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;
  const entry: ConfigVersion<T> = {
    version: nextVersion,
    timestamp: new Date().toISOString(),
    label: options.label ?? `v${nextVersion}`,
    config,
    isDefault: options.isDefault ?? false,
    savedBy: options.savedBy,
  };
  persistVersions(module, [entry, ...existing]);
  return nextVersion;
}

/** Get the latest (most recently saved) config for a module, or null if none. */
export function getLatestConfig<T>(module: string): T | null {
  const versions = getStoredVersions<T>(module);
  return versions.length > 0 ? versions[0].config : null;
}

/** Get full version history for a module (newest first). */
export function getVersionHistory<T>(module: string): ConfigVersion<T>[] {
  return getStoredVersions<T>(module);
}

/** Get a specific version by number. */
export function getConfigByVersion<T>(module: string, version: number): T | null {
  const versions = getStoredVersions<T>(module);
  const found = versions.find(v => v.version === version);
  return found ? found.config : null;
}

/** Delete all saved versions for a module (effectively "restore default" on next load). */
export function clearConfigVersions(module: string): void {
  try {
    localStorage.removeItem(versionKey(module));
  } catch (_) { /* ignore */ }
}

// ─── TCA Scorecard Default Configs ────────────────────────────────────────────

export type TcaCategory = {
  id: string;
  name: string;
  general: number;
  medtech: number;
  generalNA: boolean;
  medtechNA: boolean;
};

export type ScoringTier = {
  id: string;
  color: string;
  tier: string;
  range: string;
  risk: string;
};

export type TcaConfig = {
  categories: TcaCategory[];
  scoringLogic: ScoringTier[];
  formula: string;
  example: string;
};

export const DEFAULT_TCA_CONFIG: TcaConfig = {
  categories: [
    { id: 'leadership',   name: 'Leadership',                          general: 20,  medtech: 15,    generalNA: false, medtechNA: false },
    { id: 'pmf',          name: 'Product-Market Fit / Product Quality', general: 20,  medtech: 15,    generalNA: false, medtechNA: false },
    { id: 'team',         name: 'Team Strength',                        general: 10,  medtech: 10,    generalNA: false, medtechNA: false },
    { id: 'tech',         name: 'Technology & IP',                      general: 10,  medtech: 10,    generalNA: false, medtechNA: false },
    { id: 'financials',   name: 'Business Model & Financials',          general: 10,  medtech: 10,    generalNA: false, medtechNA: false },
    { id: 'gtm',          name: 'Go-to-Market Strategy',                general: 10,  medtech: 5,     generalNA: false, medtechNA: false },
    { id: 'competition',  name: 'Competition & Moat',                   general: 5,   medtech: 5,     generalNA: false, medtechNA: false },
    { id: 'market',       name: 'Market Potential',                     general: 5,   medtech: 5,     generalNA: false, medtechNA: false },
    { id: 'traction',     name: 'Traction',                             general: 5,   medtech: 5,     generalNA: false, medtechNA: false },
    { id: 'scalability',  name: 'Scalability',                          general: 2.5, medtech: 0,     generalNA: false, medtechNA: true  },
    { id: 'risk',         name: 'Risk Assessment',                      general: 2.5, medtech: 0,     generalNA: false, medtechNA: true  },
    { id: 'exit',         name: 'Exit Potential',                       general: 0,   medtech: 0,     generalNA: true,  medtechNA: true  },
    { id: 'regulatory',   name: 'Regulatory',                           general: 0,   medtech: 15,    generalNA: true,  medtechNA: false },
  ],
  scoringLogic: [
    { id: 'green',  color: '🟩', tier: 'Strong & Investable',       range: '8.0 – 10.0', risk: 'Low/Medium' },
    { id: 'yellow', color: '🟨', tier: 'Moderate; needs traction',  range: '6.5 – 7.9',  risk: 'Medium'     },
    { id: 'red',    color: '🟥', tier: 'High risk / weak readiness', range: '< 6.5',      risk: 'High'       },
  ],
  formula: '∑ (Category Weight × Category Score)',
  example: '(20% × 8.0) + (20% × 7.0) + … = 7.5',
};
