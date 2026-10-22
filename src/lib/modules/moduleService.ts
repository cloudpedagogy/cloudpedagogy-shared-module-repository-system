import { Module, ModuleVersion, Dependency, RepositoryDataset } from '../../types';
import { bumpVersion, compareVersions, validateForPublishing } from '../versioning';
import { getModuleInboundDependencies } from '../../features/dependencies/dependencyUtils';

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
  title?: string;
  code?: string;
  level?: number;
  credits?: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  module?: Module;
  dataset?: RepositoryDataset;
  errors: string[];
}

/**
 * Accessors for historical metadata snapshots.
 * If a version contains a snapshot field, that field is authoritative.
 * Otherwise, falls back to the canonical module's current value (for legacy v1 records).
 */
export const getVersionTitle = (version: ModuleVersion | undefined, module: Module): string => {
  return version?.title !== undefined && version.title.trim().length > 0 ? version.title : module.name;
};

export const getVersionCode = (version: ModuleVersion | undefined, module: Module): string => {
  return version?.code !== undefined && version.code.trim().length > 0 ? version.code : module.code;
};

export const getVersionLevel = (version: ModuleVersion | undefined, module: Module): number => {
  return version?.level !== undefined ? version.level : module.level;
};

export const getVersionCredits = (version: ModuleVersion | undefined, module: Module): number => {
  return version?.credits !== undefined ? version.credits : module.credits;
};

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
 * Snapshots the initial metadata into the version record.
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
    dependencies: initialDraft.dependencies || [],
    // Batch 2: Initial snapshot metadata
    title: initialDraft.title?.trim() || canonical.name.trim(),
    code: initialDraft.code?.trim() || canonical.code.trim(),
    level: initialDraft.level !== undefined ? initialDraft.level : canonical.level,
    credits: initialDraft.credits !== undefined ? initialDraft.credits : canonical.credits
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
 * Historical snapshots in `module.versions` are strictly preserved intact.
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
    // Crucial: preserve existing versions snapshots without mutation
    versions: [...module.versions]
  };

  return { success: true, data: updatedModule, module: updatedModule, errors: [] };
};

/**
 * Updates curriculum content and version-specific metadata of an active draft version.
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
        `Cannot edit version ${targetVersion.version}: this version is ${targetVersion.status.toUpperCase()} and locked as an immutable snapshot. Create a successor draft to make further modifications.`
      ]
    };
  }

  // Validate assessments structure if provided
  if (contentUpdates.assessments) {
    for (const a of contentUpdates.assessments) {
      if (!a.type || !a.type.trim()) {
        return { success: false, errors: ['Assessment component must have a type (e.g. Essay, Exam).'] };
      }
      if (typeof a.weight !== 'number' || isNaN(a.weight) || !isFinite(a.weight) || a.weight < 0 || a.weight > 100) {
        return { success: false, errors: ['Assessment weight must be a valid number between 0 and 100.'] };
      }
    }
  }

  // Validate dependencies if provided
  if (contentUpdates.dependencies) {
    const seenTargets = new Set<string>();
    for (const d of contentUpdates.dependencies) {
      if (d.targetId === module.id) {
        return { success: false, errors: ['A module cannot declare a dependency on itself (self-dependency rejected).'] };
      }
      if (seenTargets.has(d.targetId)) {
        return { success: false, errors: [`Duplicate dependency declared on module "${d.targetId}".`] };
      }
      seenTargets.add(d.targetId);
    }
  }

  // Validate metadata overrides if provided
  if (contentUpdates.level !== undefined) {
    if (typeof contentUpdates.level !== 'number' || isNaN(contentUpdates.level) || contentUpdates.level < 1) {
      return { success: false, errors: ['Academic level must be a positive number.'] };
    }
  }

  if (contentUpdates.credits !== undefined) {
    if (typeof contentUpdates.credits !== 'number' || isNaN(contentUpdates.credits) || contentUpdates.credits < 0) {
      return { success: false, errors: ['Credits must be a non-negative number.'] };
    }
  }

  const updatedVersion: ModuleVersion = {
    ...targetVersion,
    description: contentUpdates.description !== undefined ? contentUpdates.description : targetVersion.description,
    content: contentUpdates.content !== undefined ? contentUpdates.content : targetVersion.content,
    outcomes: contentUpdates.outcomes !== undefined ? contentUpdates.outcomes : targetVersion.outcomes,
    assessments: contentUpdates.assessments !== undefined ? contentUpdates.assessments : targetVersion.assessments,
    dependencies: contentUpdates.dependencies !== undefined ? contentUpdates.dependencies : targetVersion.dependencies,
    title: contentUpdates.title !== undefined ? contentUpdates.title.trim() : (targetVersion.title ?? module.name),
    code: contentUpdates.code !== undefined ? contentUpdates.code.trim() : (targetVersion.code ?? module.code),
    level: contentUpdates.level !== undefined ? contentUpdates.level : (targetVersion.level ?? module.level),
    credits: contentUpdates.credits !== undefined ? contentUpdates.credits : (targetVersion.credits ?? module.credits)
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

/**
 * Creates a new successor draft from an existing published release.
 * Enforces single active draft rule and semver ordering.
 */
export const createSuccessorDraft = (
  module: Module,
  sourceVersionId: string,
  bumpType: 'major' | 'minor' | 'patch' | 'custom',
  customVersionString?: string,
  description?: string
): ServiceResult<Module> => {
  // Enforce single active draft rule
  if (hasDraftVersion(module)) {
    return {
      success: false,
      errors: ['Module already has an active draft version. Complete, publish, or discard the current draft before creating a successor draft.']
    };
  }

  const sourceVersion = module.versions.find(v => v.id === sourceVersionId);
  if (!sourceVersion) {
    return { success: false, errors: [`Source version id "${sourceVersionId}" not found.`] };
  }

  let nextVersionStr = '';
  if (bumpType === 'custom') {
    nextVersionStr = customVersionString?.trim() || '';
  } else {
    nextVersionStr = bumpVersion(sourceVersion.version, bumpType);
  }

  if (!nextVersionStr || !/^\d+\.\d+(\.\d+)?$/.test(nextVersionStr)) {
    return { success: false, errors: [`Invalid semantic version format "${nextVersionStr}". Format must be X.Y or X.Y.Z.`] };
  }

  // Prevent duplicate version strings
  if (module.versions.some(v => v.version === nextVersionStr)) {
    return { success: false, errors: [`Duplicate version label "v${nextVersionStr}" already exists for this module.`] };
  }

  // Ensure semantic progression (successor must be > source)
  if (compareVersions(nextVersionStr, sourceVersion.version) <= 0) {
    return {
      success: false,
      errors: [`Successor version (v${nextVersionStr}) must be higher than the source version (v${sourceVersion.version}).`]
    };
  }

  const newDraftId = generateVersionId();
  const successorDraft: ModuleVersion = {
    id: newDraftId,
    moduleId: module.id,
    version: nextVersionStr,
    status: 'draft',
    description: description?.trim() || `Successor draft incremented from v${sourceVersion.version}`,
    releaseDate: new Date().toISOString().split('T')[0],
    content: sourceVersion.content || '',
    // Independent copy of curriculum content
    outcomes: [...(sourceVersion.outcomes || [])],
    assessments: (sourceVersion.assessments || []).map(a => ({ ...a })),
    dependencies: (sourceVersion.dependencies || []).map(d => ({ ...d })),
    // Snapshot historical metadata from source version
    title: getVersionTitle(sourceVersion, module),
    code: getVersionCode(sourceVersion, module),
    level: getVersionLevel(sourceVersion, module),
    credits: getVersionCredits(sourceVersion, module),
    sourceVersionId: sourceVersion.id
  };

  const updatedModule: Module = {
    ...module,
    versions: [...module.versions, successorDraft]
  };

  return { success: true, data: updatedModule, module: updatedModule, errors: [] };
};

/**
 * Transition an active draft version to published status.
 * Validates readiness and creates an immutable snapshot.
 */
export const publishDraftVersion = (
  module: Module,
  versionId: string
): ServiceResult<Module> => {
  const targetIndex = module.versions.findIndex(v => v.id === versionId);
  if (targetIndex === -1) {
    return { success: false, errors: [`Version id "${versionId}" not found.`] };
  }

  const targetVersion = module.versions[targetIndex];
  if (targetVersion.status !== 'draft') {
    return { success: false, errors: [`Version v${targetVersion.version} is already ${targetVersion.status}. Only draft versions can be published.`] };
  }

  // Pre-flight publishing validation
  const validation = validateForPublishing(targetVersion, module);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  // Ensure uniqueness of version string among all versions in module
  const duplicates = module.versions.filter(v => v.id !== versionId && v.version === targetVersion.version);
  if (duplicates.length > 0) {
    return { success: false, errors: [`Version label "v${targetVersion.version}" conflicts with an existing release.`] };
  }

  const frozenTitle = getVersionTitle(targetVersion, module);
  const frozenCode = getVersionCode(targetVersion, module);
  const frozenLevel = getVersionLevel(targetVersion, module);
  const frozenCredits = getVersionCredits(targetVersion, module);

  const publishedVersion: ModuleVersion = {
    ...targetVersion,
    status: 'published',
    releaseDate: new Date().toISOString().split('T')[0],
    title: frozenTitle,
    code: frozenCode,
    level: frozenLevel,
    credits: frozenCredits
  };

  const updatedVersions = [...module.versions];
  updatedVersions[targetIndex] = publishedVersion;

  // Canonical defaults are updated to match this latest publication
  const updatedModule: Module = {
    ...module,
    name: frozenTitle,
    code: frozenCode,
    level: frozenLevel,
    credits: frozenCredits,
    versions: updatedVersions
  };

  return { success: true, data: updatedModule, module: updatedModule, errors: [] };
};

/**
 * Transitions a published version to deprecated status.
 * Historical content and existing programme pins remain resolvable.
 */
export const deprecateVersion = (
  module: Module,
  versionId: string
): ServiceResult<Module> => {
  const targetIndex = module.versions.findIndex(v => v.id === versionId);
  if (targetIndex === -1) {
    return { success: false, errors: [`Version id "${versionId}" not found.`] };
  }

  const targetVersion = module.versions[targetIndex];
  if (targetVersion.status !== 'published') {
    return { success: false, errors: [`Only published versions can be deprecated (current status: ${targetVersion.status}).`] };
  }

  const deprecatedVersion: ModuleVersion = {
    ...targetVersion,
    status: 'deprecated'
  };

  const updatedVersions = [...module.versions];
  updatedVersions[targetIndex] = deprecatedVersion;

  return {
    success: true,
    data: { ...module, versions: updatedVersions },
    module: { ...module, versions: updatedVersions },
    errors: []
  };
};

/**
 * Transitions a published or deprecated version to archived status.
 * Historical content and existing programme pins remain resolvable.
 */
export const archiveVersion = (
  module: Module,
  versionId: string
): ServiceResult<Module> => {
  const targetIndex = module.versions.findIndex(v => v.id === versionId);
  if (targetIndex === -1) {
    return { success: false, errors: [`Version id "${versionId}" not found.`] };
  }

  const targetVersion = module.versions[targetIndex];
  if (targetVersion.status !== 'published' && targetVersion.status !== 'deprecated') {
    return { success: false, errors: [`Only published or deprecated versions can be archived (current status: ${targetVersion.status}).`] };
  }

  const archivedVersion: ModuleVersion = {
    ...targetVersion,
    status: 'archived'
  };

  const updatedVersions = [...module.versions];
  updatedVersions[targetIndex] = archivedVersion;

  return {
    success: true,
    data: { ...module, versions: updatedVersions },
    module: { ...module, versions: updatedVersions },
    errors: []
  };
};

/**
 * Discard an active draft version.
 * Cannot discard if it is the only version in the module.
 */
export const discardDraftVersion = (
  module: Module,
  versionId: string
): ServiceResult<Module> => {
  const target = module.versions.find(v => v.id === versionId);
  if (!target) {
    return { success: false, errors: [`Version id "${versionId}" not found.`] };
  }
  if (target.status !== 'draft') {
    return { success: false, errors: [`Cannot discard version v${target.version}: it is ${target.status}, not a draft.`] };
  }
  if (module.versions.length <= 1) {
    return { success: false, errors: ['Cannot discard the only version of a module. A module must retain at least one version.'] };
  }

  const remaining = module.versions.filter(v => v.id !== versionId);
  const updatedModule = { ...module, versions: remaining };
  return { success: true, data: updatedModule, module: updatedModule, errors: [] };
};

/**
 * Safely delete a canonical module from the repository dataset.
 * Strictly blocks deletion if referenced by any programme or depended on by any other module.
 */
export const deleteModuleSafely = (
  dataset: RepositoryDataset,
  moduleId: string
): ServiceResult<RepositoryDataset> => {
  const target = dataset.modules.find(m => m.id === moduleId);
  if (!target) {
    return { success: false, errors: [`Module id "${moduleId}" not found.`] };
  }

  // 1. Check programme references
  const referencingProgrammes = dataset.programmes.filter(p =>
    p.modules.some(pm => pm.moduleId === moduleId)
  );
  if (referencingProgrammes.length > 0) {
    const names = referencingProgrammes.map(p => `"${p.name} (${p.code})"`).join(', ');
    return {
      success: false,
      errors: [
        `Cannot delete module "${target.name}": it is referenced in programme(s) ${names}. Remove this module from all programmes before deleting.`
      ]
    };
  }

  // 2. Check inbound module dependencies
  const inboundDeps = getModuleInboundDependencies(moduleId, dataset);
  if (inboundDeps.length > 0) {
    const depNames = inboundDeps.map(d => `"${d.moduleName} (${d.moduleCode})"`).join(', ');
    return {
      success: false,
      errors: [
        `Cannot delete module "${target.name}": it is declared as a dependency by ${depNames}. Remove these dependencies before deleting.`
      ]
    };
  }

  const updatedModules = dataset.modules.filter(m => m.id !== moduleId);
  const updatedDataset: RepositoryDataset = {
    ...dataset,
    modules: updatedModules,
    lastUpdated: new Date().toISOString()
  };

  return { success: true, data: updatedDataset, dataset: updatedDataset, errors: [] };
};
