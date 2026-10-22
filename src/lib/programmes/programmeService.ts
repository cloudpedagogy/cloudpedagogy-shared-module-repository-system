import { Programme, RepositoryDataset } from '../../types';
import { ServiceResult } from '../modules/moduleService';

export interface ProgrammeInput {
  code: string;
  name: string;
  description?: string;
}

/**
 * Generate a collision-resistant programme ID.
 */
export const generateProgrammeId = (existingProgrammes: Programme[] = []): string => {
  const existingIds = new Set(existingProgrammes.map(p => p.id));
  let candidate = '';
  do {
    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 10);
    candidate = `prog-${randomSuffix}`;
  } while (existingIds.has(candidate));
  return candidate;
};

/**
 * Validate programme inputs.
 */
export const validateProgrammeInputs = (
  input: ProgrammeInput,
  currentProgrammeId?: string,
  existingProgrammes: Programme[] = []
): string[] => {
  const errors: string[] = [];

  if (!input.code || !input.code.trim()) {
    errors.push('Programme code is required (e.g. BSC-PH).');
  } else {
    const normCode = input.code.trim().toUpperCase();
    const isDuplicate = existingProgrammes.some(
      p => p.id !== currentProgrammeId && p.code.trim().toUpperCase() === normCode
    );
    if (isDuplicate) {
      errors.push(`Programme code "${input.code.trim()}" is already in use by another programme.`);
    }
  }

  if (!input.name || !input.name.trim()) {
    errors.push('Programme name is required.');
  }

  return errors;
};

/**
 * Create a new empty programme.
 */
export const createProgramme = (
  input: ProgrammeInput,
  existingProgrammes: Programme[] = []
): ServiceResult<Programme> => {
  const errors = validateProgrammeInputs(input, undefined, existingProgrammes);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const newProgramme: Programme = {
    id: generateProgrammeId(existingProgrammes),
    code: input.code.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || '',
    modules: []
  };

  return { success: true, data: newProgramme, errors: [] };
};

/**
 * Update programme metadata (code, name, description).
 */
export const updateProgramme = (
  programme: Programme,
  updates: Partial<ProgrammeInput>,
  existingProgrammes: Programme[] = []
): ServiceResult<Programme> => {
  const merged: ProgrammeInput = {
    code: updates.code !== undefined ? updates.code : programme.code,
    name: updates.name !== undefined ? updates.name : programme.name,
    description: updates.description !== undefined ? updates.description : programme.description
  };

  const errors = validateProgrammeInputs(merged, programme.id, existingProgrammes);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const updatedProgramme: Programme = {
    ...programme,
    code: merged.code.trim(),
    name: merged.name.trim(),
    description: merged.description?.trim() || ''
  };

  return { success: true, data: updatedProgramme, errors: [] };
};

/**
 * Add a shared module with explicit version pinning to a programme.
 * Prevents accidental duplicate assignments.
 */
export const addModuleToProgramme = (
  programme: Programme,
  moduleId: string,
  versionString: string,
  dataset: RepositoryDataset
): ServiceResult<Programme> => {
  const targetModule = dataset.modules.find(m => m.id === moduleId);
  if (!targetModule) {
    return { success: false, errors: [`Module id "${moduleId}" not found in repository.`] };
  }

  // Prevent accidental duplicates
  if (programme.modules.some(pm => pm.moduleId === moduleId)) {
    return {
      success: false,
      errors: [`Module "${targetModule.name} (${targetModule.code})" is already included in "${programme.name}". Accidental duplicate assignments are prevented.`]
    };
  }

  // Verify target version exists in target module
  const targetVersion = targetModule.versions.find(v => v.version === versionString);
  if (!targetVersion) {
    return {
      success: false,
      errors: [`Version "${versionString}" does not exist in module "${targetModule.name}".`]
    };
  }

  // Pinning drafts to programmes is prohibited
  if (targetVersion.status === 'draft') {
    return {
      success: false,
      errors: [`Cannot pin draft version v${versionString} to programme. Only published or deprecated releases may be assembled into academic programmes.`]
    };
  }

  // Pinning archived versions to programmes is prohibited
  if (targetVersion.status === 'archived') {
    return {
      success: false,
      errors: [`Cannot pin archived version v${versionString} to programme. Archived versions are retired and cannot be assigned to programmes.`]
    };
  }

  const updatedProgramme: Programme = {
    ...programme,
    modules: [...programme.modules, { moduleId, version: versionString }]
  };

  return { success: true, data: updatedProgramme, errors: [] };
};

/**
 * Safely remove a module reference from a programme.
 */
export const removeModuleFromProgramme = (
  programme: Programme,
  moduleId: string
): ServiceResult<Programme> => {
  const exists = programme.modules.some(pm => pm.moduleId === moduleId);
  if (!exists) {
    return { success: false, errors: [`Module id "${moduleId}" is not in programme "${programme.name}".`] };
  }

  const updatedProgramme: Programme = {
    ...programme,
    modules: programme.modules.filter(pm => pm.moduleId !== moduleId)
  };

  return { success: true, data: updatedProgramme, errors: [] };
};

/**
 * Reorder module sequence in a programme.
 */
export const reorderProgrammeModules = (
  programme: Programme,
  fromIndex: number,
  toIndex: number
): ServiceResult<Programme> => {
  if (fromIndex < 0 || fromIndex >= programme.modules.length || toIndex < 0 || toIndex >= programme.modules.length) {
    return { success: false, errors: ['Invalid reorder indices.'] };
  }

  if (fromIndex === toIndex) {
    return { success: true, data: programme, errors: [] };
  }

  const updatedModules = [...programme.modules];
  const [moved] = updatedModules.splice(fromIndex, 1);
  updatedModules.splice(toIndex, 0, moved);

  return {
    success: true,
    data: { ...programme, modules: updatedModules },
    errors: []
  };
};

/**
 * Explicitly re-pin a programme's module reference to a new version.
 * Leaves all other programmes and published versions completely untouched.
 */
export const repinProgrammeModuleVersion = (
  programme: Programme,
  moduleId: string,
  newVersionString: string,
  dataset: RepositoryDataset
): ServiceResult<Programme> => {
  const moduleRefIndex = programme.modules.findIndex(pm => pm.moduleId === moduleId);
  if (moduleRefIndex === -1) {
    return { success: false, errors: [`Module id "${moduleId}" not found in programme "${programme.name}".`] };
  }

  const targetModule = dataset.modules.find(m => m.id === moduleId);
  if (!targetModule) {
    return { success: false, errors: [`Module id "${moduleId}" not found in repository.`] };
  }

  const targetVersion = targetModule.versions.find(v => v.version === newVersionString);
  if (!targetVersion) {
    return { success: false, errors: [`Version "${newVersionString}" not found in module "${targetModule.name}".`] };
  }

  if (targetVersion.status === 'draft') {
    return { success: false, errors: ['Cannot pin draft version to a programme. Only published or deprecated releases are eligible.'] };
  }

  if (targetVersion.status === 'archived') {
    return { success: false, errors: [`Cannot re-pin to archived version v${newVersionString}. Archived versions are retired and ineligible for programme assignment.`] };
  }

  const currentVersion = programme.modules[moduleRefIndex].version;
  if (currentVersion === newVersionString) {
    return { success: false, errors: [`Programme is already pinned to version v${newVersionString}.`] };
  }

  const updatedModules = [...programme.modules];
  updatedModules[moduleRefIndex] = {
    ...updatedModules[moduleRefIndex],
    version: newVersionString
  };

  return {
    success: true,
    data: { ...programme, modules: updatedModules },
    errors: []
  };
};

/**
 * Safely delete a programme from the repository dataset.
 */
export const deleteProgrammeSafely = (
  dataset: RepositoryDataset,
  programmeId: string
): ServiceResult<RepositoryDataset> => {
  const target = dataset.programmes.find(p => p.id === programmeId);
  if (!target) {
    return { success: false, errors: [`Programme id "${programmeId}" not found.`] };
  }

  const remaining = dataset.programmes.filter(p => p.id !== programmeId);
  const updatedDataset: RepositoryDataset = {
    ...dataset,
    programmes: remaining,
    lastUpdated: new Date().toISOString()
  };

  return { success: true, data: updatedDataset, dataset: updatedDataset, errors: [] };
};
