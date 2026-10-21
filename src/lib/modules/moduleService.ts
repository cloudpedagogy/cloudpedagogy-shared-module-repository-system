import { Module, ModuleVersion, Dependency, RepositoryDataset } from '../../types';

export interface CanonicalModuleInput {
  code: string;
  name: string;
  description: string;
  level: number;
  credits: number;
  owner?: string;
  tags?: string[];
}

export interface DraftContentInput {
  version?: string;
  description?: string;
  releaseDate?: string;
  content?: string;
  outcomes?: string[];
  assessments?: { type: string; weight: number; description?: string }[];
  dependencies?: Dependency[];
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  module?: Module;
  errors: string[];
}

/**
 * Generate a collision-resistant module ID.
 */
export const generateModuleId = (existingModules: Module[] = []): string => {
  const existingIds = new Set(existingModules.map(m => m.id));
  let candidate = '';
  do {
    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 10);
    candidate = `mod-${randomSuffix}`;
  } while (existingIds.has(candidate));
  return candidate;
};

/**
 * Generate a collision-resistant version ID.
 */
export const generateVersionId = (): string => {
  const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).substring(2, 10);
  return `ver-${randomSuffix}`;
};

/**
 * Validates canonical module inputs.
 */
export const validateCanonicalInputs = (
  input: CanonicalModuleInput,
  currentModuleId?: string,
  existingModules: Module[] = []
): string[] => {
  const errors: string[] = [];

  if (!input.code || !input.code.trim()) {
    errors.push('Module code is required (e.g. PH101).');
  } else {
    const normCode = input.code.trim().toUpperCase();
    const isDuplicate = existingModules.some(
      m => m.id !== currentModuleId && m.code.trim().toUpperCase() === normCode
    );
    if (isDuplicate) {
      errors.push(`Module code "${input.code.trim()}" is already in use by another module.`);
    }
  }

  if (!input.name || !input.name.trim()) {
    errors.push('Module title is required.');
  }

  if (typeof input.level !== 'number' || isNaN(input.level) || input.level < 1) {
    errors.push('Academic level must be a positive number (e.g. 1, 2, 4, 7).');
  }

  if (typeof input.credits !== 'number' || isNaN(input.credits) || input.credits < 0) {
    errors.push('Credits must be a non-negative number (e.g. 15, 20).');
  }

  return errors;
};

/**
 * Create a new canonical module with an initial editable draft version.
 */
export const createModule = (
  canonical: CanonicalModuleInput,
  initialDraft: DraftContentInput = {},
  existingModules: Module[] = []
): ServiceResult<Module> => {
  const validationErrors = validateCanonicalInputs(canonical, undefined, existingModules);
  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  const moduleId = generateModuleId(existingModules);
  const versionId = generateVersionId();

  const draftVersion: ModuleVersion = {
    id: versionId,
    moduleId,
    version: initialDraft.version?.trim() || '1.0.0',
    status: 'draft',
    description: initialDraft.description || 'Initial draft version',
    releaseDate: initialDraft.releaseDate || new Date().toISOString().split('T')[0],
    content: initialDraft.content || 'Initial draft content',
    outcomes: initialDraft.outcomes || [],
    assessments: initialDraft.assessments || [],
    dependencies: initialDraft.dependencies || []
  };

  const newModule: Module = {
    id: moduleId,
    code: canonical.code.trim(),
    name: canonical.name.trim(),
    description: canonical.description?.trim() || '',
    level: canonical.level,
    credits: canonical.credits,
    owner: canonical.owner?.trim() || undefined,
    tags: canonical.tags?.map(t => t.trim()).filter(Boolean) || [],
    versions: [draftVersion]
  };

  return { success: true, data: newModule, module: newModule, errors: [] };
};

/**
 * Updates canonical module metadata.
 * Historical snapshots in `module.versions` are preserved intact.
 */
export const updateModuleMetadata = (
  module: Module,
  updates: Partial<CanonicalModuleInput>,
  existingModules: Module[] = []
): ServiceResult<Module> => {
  const merged: CanonicalModuleInput = {
    code: updates.code !== undefined ? updates.code : module.code,
    name: updates.name !== undefined ? updates.name : module.name,
    description: updates.description !== undefined ? updates.description : module.description,
    level: updates.level !== undefined ? updates.level : module.level,
    credits: updates.credits !== undefined ? updates.credits : module.credits,
    owner: updates.owner !== undefined ? updates.owner : module.owner,
    tags: updates.tags !== undefined ? updates.tags : module.tags
  };

  const errors = validateCanonicalInputs(merged, module.id, existingModules);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const updatedModule: Module = {
    ...module,
    code: merged.code.trim(),
    name: merged.name.trim(),
    description: merged.description.trim(),
    level: merged.level,
    credits: merged.credits,
    owner: merged.owner?.trim() || undefined,
    tags: merged.tags?.map(t => t.trim()).filter(Boolean) || [],
    // Crucial: preserve existing versions snapshots without modification
    versions: [...module.versions]
  };

  return { success: true, data: updatedModule, module: updatedModule, errors: [] };
};

/**
 * Updates curriculum content of an initial draft version.
 * Published, deprecated, or archived versions are strictly protected from modification.
 */
export const updateDraftVersionContent = (
  module: Module,
  versionId: string,
  contentUpdates: Partial<DraftContentInput>
): ServiceResult<Module> => {
  const targetIndex = module.versions.findIndex(v => v.id === versionId);
  if (targetIndex === -1) {
    return { success: false, errors: [`Version id "${versionId}" not found in module "${module.name}".`] };
  }

  const targetVersion = module.versions[targetIndex];

  // Mandatory published-version protection
  if (targetVersion.status !== 'draft') {
    return {
      success: false,
      errors: [
        `Cannot edit version ${targetVersion.version}: this version is ${targetVersion.status.toUpperCase()} and locked as an immutable snapshot. Creating successor drafts will be available in Batch 2.`
      ]
    };
  }

  // Validate assessments structure if provided
  if (contentUpdates.assessments) {
    for (const a of contentUpdates.assessments) {
      if (!a.type || !a.type.trim()) {
        return { success: false, errors: ['Assessment component must have a type (e.g. Essay, Exam).'] };
      }
      if (typeof a.weight !== 'number' || isNaN(a.weight) || a.weight < 0 || a.weight > 100) {
        return { success: false, errors: ['Assessment weight must be a number between 0 and 100.'] };
      }
    }
  }

  const updatedVersion: ModuleVersion = {
    ...targetVersion,
    description: contentUpdates.description !== undefined ? contentUpdates.description : targetVersion.description,
    content: contentUpdates.content !== undefined ? contentUpdates.content : targetVersion.content,
    outcomes: contentUpdates.outcomes !== undefined ? contentUpdates.outcomes : targetVersion.outcomes,
    assessments: contentUpdates.assessments !== undefined ? contentUpdates.assessments : targetVersion.assessments,
    dependencies: contentUpdates.dependencies !== undefined ? contentUpdates.dependencies : targetVersion.dependencies
  };

  const updatedVersions = [...module.versions];
  updatedVersions[targetIndex] = updatedVersion;

  const updatedModule: Module = {
    ...module,
    versions: updatedVersions
  };

  return { success: true, data: updatedModule, module: updatedModule, errors: [] };
};

/**
 * Check if a module has an editable draft version.
 */
export const hasDraftVersion = (module: Module): boolean => {
  return module.versions.some(v => v.status === 'draft');
};

/**
 * Get the active draft version for a module, if any.
 */
export const getActiveDraftVersion = (module: Module): ModuleVersion | undefined => {
  return module.versions.find(v => v.status === 'draft');
};
