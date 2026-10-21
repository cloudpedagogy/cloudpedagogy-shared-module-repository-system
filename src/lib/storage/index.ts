import { RepositoryDataset, Module, ModuleVersion, Programme } from '../../types';
import { demoDataset } from '../../data/demo';

export const STORAGE_KEY = 'smrs_repository_health_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the schema and referential integrity of a repository dataset.
 */
export const validateDatasetSchema = (input: unknown): ValidationReport => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Dataset must be a non-null object.'], warnings: [] };
  }

  const data = input as Partial<RepositoryDataset>;

  // 1. Modules validation
  if (!Array.isArray(data.modules)) {
    errors.push('Dataset must contain a "modules" array.');
  } else {
    const seenModuleIds = new Set<string>();
    const seenModuleCodes = new Set<string>();

    data.modules.forEach((mod, idx) => {
      const prefix = `Module [${idx}]`;
      if (!mod || typeof mod !== 'object') {
        errors.push(`${prefix}: Must be an object.`);
        return;
      }
      if (!mod.id || typeof mod.id !== 'string') {
        errors.push(`${prefix}: Missing or invalid "id".`);
      } else {
        if (seenModuleIds.has(mod.id)) {
          errors.push(`${prefix}: Duplicate module id "${mod.id}".`);
        }
        seenModuleIds.add(mod.id);
      }

      if (!mod.name || typeof mod.name !== 'string') {
        errors.push(`${prefix} (${mod.id || 'unknown'}): Missing or invalid "name".`);
      }
      if (!mod.code || typeof mod.code !== 'string') {
        errors.push(`${prefix} (${mod.id || 'unknown'}): Missing or invalid "code".`);
      } else {
        const normalizedCode = mod.code.trim().toUpperCase();
        if (seenModuleCodes.has(normalizedCode)) {
          warnings.push(`${prefix}: Module code "${mod.code}" appears more than once.`);
        }
        seenModuleCodes.add(normalizedCode);
      }

      if (typeof mod.level !== 'number' || isNaN(mod.level)) {
        errors.push(`${prefix} (${mod.id || 'unknown'}): "level" must be a valid number.`);
      }
      if (typeof mod.credits !== 'number' || isNaN(mod.credits)) {
        errors.push(`${prefix} (${mod.id || 'unknown'}): "credits" must be a valid number.`);
      }

      // Versions validation
      if (!Array.isArray(mod.versions) || mod.versions.length === 0) {
        errors.push(`${prefix} (${mod.id || 'unknown'}): Must contain at least one version snapshot.`);
      } else {
        const seenVersions = new Set<string>();
        mod.versions.forEach((ver, vIdx) => {
          const vPrefix = `${prefix} version [${vIdx}]`;
          if (!ver || typeof ver !== 'object') {
            errors.push(`${vPrefix}: Must be an object.`);
            return;
          }
          if (!ver.id || typeof ver.id !== 'string') {
            errors.push(`${vPrefix}: Missing or invalid version id.`);
          }
          if (!ver.version || typeof ver.version !== 'string') {
            errors.push(`${vPrefix}: Missing or invalid version string.`);
          } else {
            if (seenVersions.has(ver.version)) {
              errors.push(`${vPrefix}: Duplicate version string "${ver.version}".`);
            }
            seenVersions.add(ver.version);
          }
          if (ver.moduleId !== mod.id) {
            errors.push(`${vPrefix}: "moduleId" ("${ver.moduleId}") does not match parent module id ("${mod.id}").`);
          }
          if (!['draft', 'published', 'deprecated', 'archived'].includes(ver.status)) {
            errors.push(`${vPrefix}: Invalid status "${ver.status}". Must be draft, published, deprecated, or archived.`);
          }
          if (!Array.isArray(ver.outcomes)) {
            errors.push(`${vPrefix}: "outcomes" must be an array.`);
          }
          if (!Array.isArray(ver.assessments)) {
            errors.push(`${vPrefix}: "assessments" must be an array.`);
          }
          if (!Array.isArray(ver.dependencies)) {
            errors.push(`${vPrefix}: "dependencies" must be an array.`);
          }
        });
      }
    });
  }

  // 2. Programmes validation
  if (!Array.isArray(data.programmes)) {
    errors.push('Dataset must contain a "programmes" array.');
  } else {
    const seenProgIds = new Set<string>();
    const moduleMap = new Map<string, Module>();
    if (Array.isArray(data.modules)) {
      data.modules.forEach(m => {
        if (m && m.id) moduleMap.set(m.id, m);
      });
    }

    data.programmes.forEach((prog, pIdx) => {
      const prefix = `Programme [${pIdx}]`;
      if (!prog || typeof prog !== 'object') {
        errors.push(`${prefix}: Must be an object.`);
        return;
      }
      if (!prog.id || typeof prog.id !== 'string') {
        errors.push(`${prefix}: Missing or invalid "id".`);
      } else {
        if (seenProgIds.has(prog.id)) {
          errors.push(`${prefix}: Duplicate programme id "${prog.id}".`);
        }
        seenProgIds.add(prog.id);
      }

      if (!Array.isArray(prog.modules)) {
        errors.push(`${prefix} (${prog.id || 'unknown'}): "modules" must be an array.`);
      } else {
        prog.modules.forEach((pm, mIdx) => {
          if (!pm || !pm.moduleId || !pm.version) {
            errors.push(`${prefix} module ref [${mIdx}]: Must have moduleId and version.`);
            return;
          }
          const targetMod = moduleMap.get(pm.moduleId);
          if (!targetMod) {
            warnings.push(`${prefix} (${prog.name || prog.id}): References nonexistent module id "${pm.moduleId}".`);
          } else {
            const hasVer = targetMod.versions?.some(v => v.version === pm.version);
            if (!hasVer) {
              warnings.push(`${prefix} (${prog.name || prog.id}): References version "${pm.version}" not found in module "${targetMod.name}".`);
            }
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Creates an empty, pristine RepositoryDataset with 0 modules and 0 programmes.
 */
export const createBlankDataset = (): RepositoryDataset => {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    modules: [],
    programmes: [],
    lastUpdated: new Date().toISOString(),
    capabilityNotes: '',
    governanceNotes: ''
  };
};

/**
 * Returns a deep copy of the demonstration dataset.
 */
export const loadDemoDataset = (): RepositoryDataset => {
  const cloned = JSON.parse(JSON.stringify(demoDataset)) as RepositoryDataset;
  cloned.schemaVersion = CURRENT_SCHEMA_VERSION;
  cloned.lastUpdated = new Date().toISOString();
  return cloned;
};

/**
 * Authoritative persistence service.
 */
export const storage = {
  getStorageKey: () => STORAGE_KEY,

  /**
   * Check if saved repository data exists in localStorage.
   */
  hasSavedData: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },

  /**
   * Loads repository data from localStorage with full schema validation.
   */
  load: (): StorageResult<RepositoryDataset> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { success: false, error: 'No saved repository found in storage.' };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        return {
          success: false,
          error: `Saved repository JSON is malformed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
        };
      }

      const report = validateDatasetSchema(parsed);
      if (!report.isValid) {
        return {
          success: false,
          error: `Saved repository failed schema validation: ${report.errors.join('; ')}`
        };
      }

      const dataset = parsed as RepositoryDataset;
      if (!dataset.schemaVersion) {
        dataset.schemaVersion = CURRENT_SCHEMA_VERSION;
      }

      return { success: true, data: dataset };
    } catch (err) {
      return {
        success: false,
        error: `Unexpected error reading repository from storage: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  },

  /**
   * Saves dataset to localStorage, validating schema and handling storage exceptions.
   */
  save: (dataset: RepositoryDataset): StorageResult<void> => {
    try {
      const report = validateDatasetSchema(dataset);
      if (!report.isValid) {
        return {
          success: false,
          error: `Cannot save invalid dataset: ${report.errors.join('; ')}`
        };
      }

      const toSave: RepositoryDataset = {
        ...dataset,
        schemaVersion: dataset.schemaVersion || CURRENT_SCHEMA_VERSION,
        lastUpdated: new Date().toISOString()
      };

      const serialized = JSON.stringify(toSave);
      localStorage.setItem(STORAGE_KEY, serialized);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isQuota = message.toLowerCase().includes('quota') || message.toLowerCase().includes('storage full');
      return {
        success: false,
        error: isQuota
          ? 'Storage quota exceeded. Please export your data and free up browser storage.'
          : `Failed to save repository to browser storage: ${message}`
      };
    }
  },

  /**
   * Clears saved repository data from localStorage.
   */
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Export repository dataset as downloadable JSON file.
   */
  exportJSON: (dataset: RepositoryDataset, filename?: string): void => {
    const toExport: RepositoryDataset = {
      ...dataset,
      schemaVersion: dataset.schemaVersion || CURRENT_SCHEMA_VERSION,
      lastUpdated: new Date().toISOString()
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const name = filename || `smrs_repository_export_${dateStr}.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(toExport, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', name);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Parses and validates raw JSON text for import.
   */
  validateImportJSON: (jsonString: string): { isValid: boolean; dataset?: RepositoryDataset; errors: string[]; warnings: string[] } => {
    try {
      const parsed = JSON.parse(jsonString);
      const report = validateDatasetSchema(parsed);
      if (!report.isValid) {
        return { isValid: false, errors: report.errors, warnings: report.warnings };
      }
      return { isValid: true, dataset: parsed as RepositoryDataset, errors: [], warnings: report.warnings };
    } catch (parseErr) {
      return {
        isValid: false,
        errors: [`JSON syntax error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`],
        warnings: []
      };
    }
  }
};
