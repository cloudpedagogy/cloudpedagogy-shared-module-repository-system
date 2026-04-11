import { ModuleVersion } from '../types';

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
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a module version before publishing.
 */
export const validateForPublishing = (version: ModuleVersion): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hard Blockers
  if (!version.outcomes || version.outcomes.length === 0) {
    errors.push('Module must have at least one learning outcome.');
  }

  if (!version.assessments || version.assessments.length === 0) {
    errors.push('Module must have at least one assessment defined.');
  } else {
    const totalWeight = version.assessments.reduce((sum, a) => sum + a.weight, 0);
    if (totalWeight !== 100) {
      errors.push(`Total assessment weight must be exactly 100% (currently ${totalWeight}%).`);
    }
  }

  if (!version.description || version.description.trim().length < 10) {
    errors.push('Module must have a substantive description (min 10 characters).');
  }

  // Warnings
  if (!version.credits || version.credits <= 0) {
    warnings.push('Credits are currently set to 0. Please verify if this is correct.');
  }

  if (!version.level || version.level < 4) {
    warnings.push('Module level is set below HE Level 4. Please verify if this is intentional.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
