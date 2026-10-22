import { Module, ModuleVersion } from '../types';

/**
 * Normalize simplified versions (e.g. '1' -> '1.0.0', '1.0' -> '1.0.0')
 */
export const normalizeVersion = (v: string): string => {
  const parts = v.split('.').filter(p => !isNaN(Number(p)));
  while (parts.length < 3) {
    parts.push('0');
  }
  return parts.slice(0, 3).join('.');
};

/**
 * SemVer comparison (ascending)
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = normalizeVersion(v1).split('.').map(Number);
  const parts2 = normalizeVersion(v2).split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = isNaN(parts1[i]) ? 0 : parts1[i];
    const p2 = isNaN(parts2[i]) ? 0 : parts2[i];
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

/**
 * Calculate the next semantic version string given a base version and increment type.
 */
export const bumpVersion = (baseVersion: string, type: 'major' | 'minor' | 'patch'): string => {
  const parts = normalizeVersion(baseVersion).split('.').map(Number);
  let [major = 1, minor = 0, patch = 0] = parts;

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
};

/**
 * Sorts module versions in descending SemVer order (newest first).
 */
export const sortVersionsDescending = (versions: ModuleVersion[]): ModuleVersion[] => {
  return [...versions].sort((a, b) => compareVersions(b.version, a.version));
};

/**
 * Get the latest published version of a module based on SemVer.
 */
export const getLatestPublishedVersion = (module: Module): ModuleVersion | undefined => {
  const published = module.versions.filter(v => v.status === 'published');
  if (published.length === 0) return undefined;
  return sortVersionsDescending(published)[0];
};

/**
 * Get the highest version of a module across all statuses based on SemVer.
 */
export const getHighestVersion = (module: Module): ModuleVersion | undefined => {
  if (!module.versions || module.versions.length === 0) return undefined;
  return sortVersionsDescending(module.versions)[0];
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a module version before publishing.
 */
export const validateForPublishing = (version: ModuleVersion, parentModule?: Module): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hard Blockers
  if (!version.outcomes || version.outcomes.length === 0) {
    errors.push('Module must have at least one learning outcome.');
  }

  if (!version.assessments || version.assessments.length === 0) {
    errors.push('Module must have at least one assessment defined.');
  } else {
    for (const a of version.assessments) {
      if (!a.type || !a.type.trim()) {
        errors.push('All assessment components must specify an assessment type.');
      }
      if (typeof a.weight !== 'number' || isNaN(a.weight) || !isFinite(a.weight) || a.weight < 0 || a.weight > 100) {
        errors.push(`Assessment component "${a.type || 'Unnamed'}" must have a valid weight between 0% and 100%.`);
      }
    }
    const totalWeight = version.assessments.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
    if (totalWeight !== 100) {
      errors.push(`Total assessment weight must be exactly 100% (currently ${totalWeight}%).`);
    }
  }

  if (!version.description || version.description.trim().length < 10) {
    errors.push('Module must have a substantive description (min 10 characters).');
  }

  // Dependencies check
  if (version.dependencies && version.dependencies.length > 0) {
    const parentId = parentModule?.id || version.moduleId;
    const seenTargets = new Set<string>();
    for (const dep of version.dependencies) {
      if (dep.targetId === parentId) {
        errors.push(`Module cannot declare a dependency on itself (${parentId}).`);
      }
      if (!dep.targetId || !dep.targetId.trim()) {
        errors.push('Dependency missing target module identifier.');
      } else {
        if (seenTargets.has(dep.targetId)) {
          errors.push(`Duplicate dependency on module "${dep.targetId}". A module can only declare a dependency on another module once.`);
        }
        seenTargets.add(dep.targetId);
      }
    }
  }

  // Canonical or version-specific credits and level check
  const effectiveCredits = version.credits !== undefined ? version.credits : parentModule?.credits;
  const effectiveLevel = version.level !== undefined ? version.level : parentModule?.level;

  if (effectiveCredits === undefined || typeof effectiveCredits !== 'number' || effectiveCredits <= 0) {
    warnings.push('Module credits are not defined or set to 0. Please verify credit rating before publishing.');
  }
  if (effectiveLevel === undefined || typeof effectiveLevel !== 'number' || effectiveLevel <= 0) {
    warnings.push('Module academic level is not defined or non-positive.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
