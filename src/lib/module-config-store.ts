/**
 * Module Configuration Store
 * Persists module configurations to localStorage with full version history.
 * Each save creates a new immutable version entry.
 */

export interface ModuleConfigVersion {
  id: string;
  moduleId: string;
  moduleName: string;
  versionNumber: number;
  savedAt: string;
  config: Record<string, unknown>;
  note?: string;
}

const STORE_KEY = 'tca-module-config-versions';
const MAX_VERSIONS_PER_MODULE = 20;

function readStore(): ModuleConfigVersion[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORE_KEY);
    return stored ? (JSON.parse(stored) as ModuleConfigVersion[]) : [];
  } catch {
    return [];
  }
}

function writeStore(versions: ModuleConfigVersion[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORE_KEY, JSON.stringify(versions));
}

/**
 * Save a module configuration and return the new version entry.
 * Keeps the most recent MAX_VERSIONS_PER_MODULE versions per module.
 */
export function saveModuleConfig(
  moduleId: string,
  moduleName: string,
  config: Record<string, unknown>,
  note?: string
): ModuleConfigVersion {
  const all = readStore();
  const moduleVersions = all.filter((v) => v.moduleId === moduleId);
  const nextVersion =
    moduleVersions.length > 0
      ? Math.max(...moduleVersions.map((v) => v.versionNumber)) + 1
      : 1;

  const newVersion: ModuleConfigVersion = {
    id: `${moduleId}-${Date.now()}`,
    moduleId,
    moduleName,
    versionNumber: nextVersion,
    savedAt: new Date().toISOString(),
    config,
    note,
  };

  // Insert new version and prune oldest for this module if over limit
  const updated = [...all, newVersion];
  const pruned = updated.filter((v) => {
    if (v.moduleId !== moduleId) return true;
    const sortedForModule = updated
      .filter((x) => x.moduleId === moduleId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return sortedForModule.indexOf(v) < MAX_VERSIONS_PER_MODULE;
  });

  writeStore(pruned);
  return newVersion;
}

/**
 * Get the most recently saved configuration for a module, or null if none.
 */
export function getLatestModuleConfig(moduleId: string): ModuleConfigVersion | null {
  const all = readStore();
  const moduleVersions = all
    .filter((v) => v.moduleId === moduleId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
  return moduleVersions[0] ?? null;
}

/**
 * Get the full version history for a module, newest first.
 */
export function getModuleHistory(moduleId: string): ModuleConfigVersion[] {
  return readStore()
    .filter((v) => v.moduleId === moduleId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

/**
 * Get all saved versions across all modules, newest first.
 */
export function getAllVersions(): ModuleConfigVersion[] {
  return readStore().sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

/**
 * Get the latest saved version for every module that has been saved.
 */
export function getAllLatestConfigs(): ModuleConfigVersion[] {
  const all = readStore();
  const byModule = new Map<string, ModuleConfigVersion>();
  for (const v of all) {
    const existing = byModule.get(v.moduleId);
    if (!existing || v.versionNumber > existing.versionNumber) {
      byModule.set(v.moduleId, v);
    }
  }
  return Array.from(byModule.values()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

/**
 * Delete all saved versions for a module.
 */
export function clearModuleHistory(moduleId: string): void {
  const filtered = readStore().filter((v) => v.moduleId !== moduleId);
  writeStore(filtered);
}
