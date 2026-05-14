export const TRIAGE_SECTION_MODULE_MAP: Record<string, string[]> = {
  'executive-summary': ['executive-summary', 'quick-summary'],
  'quick-summary': ['quick-summary'],
  'tca-scorecard': ['tca-scorecard'],
  'risk-flags': ['risk-flags'],
  'macro-trend-alignment': ['macro-trend-alignment'],
  'benchmark-comparison': ['benchmark-comparison'],
  'growth-classifier': ['growth-classifier'],
  'gap-analysis': ['gap-analysis'],
  'team-assessment': ['team-assessment'],
  'funder-fit-analysis': ['funder-fit-analysis'],
  'strategic-fit-matrix': ['strategic-fit-matrix'],
  'regulatory-compliance': ['regulatory-compliance'],
  'clinical-pathway': ['clinical-pathway'],
  'competitive-landscape': ['competitive-landscape'],
  'ip-technology-review': ['ip-technology-review'],
  'financials-burn-rate': ['financials-burn-rate'],
  'gtm-strategy': ['gtm-strategy'],
  'exit-strategy-roadmap': ['exit-strategy-roadmap'],
};

export const DD_SECTION_MODULE_MAP: Record<string, string[]> = {
  'quick-summary': ['quick-summary'],
  'executive-summary': ['executive-summary', 'quick-summary'],
  'tca-scorecard': ['tca-scorecard'],
  'risk-flags': ['risk-flags'],
  'macro-trend-alignment': ['macro-trend-alignment'],
  'benchmark-comparison': ['benchmark-comparison'],
  'growth-classifier': ['growth-classifier'],
  'gap-analysis': ['gap-analysis'],
  'team-assessment': ['team-assessment'],
  'funder-fit-analysis': ['funder-fit-analysis'],
  'strategic-fit-matrix': ['strategic-fit-matrix'],
  'regulatory-compliance': ['regulatory-compliance'],
  'clinical-pathway': ['clinical-pathway'],
  'competitive-landscape': ['competitive-landscape'],
  'ip-technology-review': ['ip-technology-review'],
  'financials-burn-rate': ['financials-burn-rate'],
  'gtm-strategy': ['gtm-strategy'],
  'exit-strategy-roadmap': ['exit-strategy-roadmap'],
};

const DEFAULT_MANAGED_MODULE_IDS = [
  'quick-summary',
  'executive-summary',
  'tca-scorecard',
  'risk-flags',
  'macro-trend-alignment',
  'benchmark-comparison',
  'growth-classifier',
  'gap-analysis',
  'team-assessment',
  'funder-fit-analysis',
  'strategic-fit-matrix',
  'regulatory-compliance',
  'clinical-pathway',
];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function collectModuleIds(value: unknown, output: Set<string>, depth = 0): void {
  if (!value || depth > 4) {
    return;
  }

  if (typeof value === 'string') {
    if (value.includes('-') || DEFAULT_MANAGED_MODULE_IDS.includes(value)) {
      output.add(value);
    }
    return;
  }

  if (isStringArray(value)) {
    value.forEach((item) => output.add(item));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectModuleIds(item, output, depth + 1));
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'moduleId' || key === 'id' || key === 'managedModuleId') {
        collectModuleIds(nestedValue, output, depth + 1);
        continue;
      }

      if (key === 'moduleIds' || key === 'managedModuleIds' || key === 'selectedModules' || key === 'activeModules') {
        collectModuleIds(nestedValue, output, depth + 1);
        continue;
      }

      collectModuleIds(nestedValue, output, depth + 1);
    }
  }
}

export function getActiveManagedModuleIds(input: unknown): string[] {
  const collected = new Set<string>();
  collectModuleIds(input, collected);
  return Array.from(collected);
}
