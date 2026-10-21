import { ModuleVersion, Module } from '../../types';

export type ChangeStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffItem<T> {
  value: T;
  status: ChangeStatus;
  oldValue?: T;
}

/**
 * Diff two arrays of strings (Outcomes).
 */
export const diffOutcomes = (oldOutcomes: string[], newOutcomes: string[]): DiffItem<string>[] => {
  const diffs: DiffItem<string>[] = [];
  
  // Find added and unchanged
  newOutcomes.forEach(outcome => {
    if (oldOutcomes.includes(outcome)) {
      diffs.push({ value: outcome, status: 'unchanged' });
    } else {
      diffs.push({ value: outcome, status: 'added' });
    }
  });
  
  // Find removed
  oldOutcomes.forEach(outcome => {
    if (!newOutcomes.includes(outcome)) {
      diffs.push({ value: outcome, status: 'removed' });
    }
  });
  
  return diffs;
};

/**
 * Diff two arrays of assessments.
 */
export interface Assessment {
  type: string;
  weight: number;
}

export const diffAssessments = (oldAssessments: Assessment[], newAssessments: Assessment[]): DiffItem<Assessment>[] => {
  const diffs: DiffItem<Assessment>[] = [];
  
  // Match by type for comparison
  newAssessments.forEach(newAs => {
    const matchedOld = oldAssessments.find(oa => oa.type === newAs.type);
    if (!matchedOld) {
      diffs.push({ value: newAs, status: 'added' });
    } else if (matchedOld.weight !== newAs.weight) {
      diffs.push({ value: newAs, status: 'changed', oldValue: matchedOld });
    } else {
      diffs.push({ value: newAs, status: 'unchanged' });
    }
  });
  
  oldAssessments.forEach(oldAs => {
    if (!newAssessments.find(na => na.type === oldAs.type)) {
      diffs.push({ value: oldAs, status: 'removed' });
    }
  });
  
  return diffs;
};

/**
 * Detailed metadata and academic attribute comparison between versions.
 */
export const diffMetadata = (oldVersion: ModuleVersion, newVersion: ModuleVersion, module?: Module) => {
  const oldTitle = oldVersion.title !== undefined ? oldVersion.title : module?.name;
  const newTitle = newVersion.title !== undefined ? newVersion.title : module?.name;
  const oldCode = oldVersion.code !== undefined ? oldVersion.code : module?.code;
  const newCode = newVersion.code !== undefined ? newVersion.code : module?.code;
  const oldLevel = oldVersion.level !== undefined ? oldVersion.level : module?.level;
  const newLevel = newVersion.level !== undefined ? newVersion.level : module?.level;
  const oldCredits = oldVersion.credits !== undefined ? oldVersion.credits : module?.credits;
  const newCredits = newVersion.credits !== undefined ? newVersion.credits : module?.credits;

  return {
    statusChanged: oldVersion.status !== newVersion.status,
    descriptionChanged: oldVersion.description !== newVersion.description,
    titleChanged: oldTitle !== undefined && newTitle !== undefined && oldTitle !== newTitle,
    oldTitle,
    newTitle,
    codeChanged: oldCode !== undefined && newCode !== undefined && oldCode !== newCode,
    oldCode,
    newCode,
    levelChanged: oldLevel !== undefined && newLevel !== undefined && oldLevel !== newLevel,
    oldLevel,
    newLevel,
    creditsChanged: oldCredits !== undefined && newCredits !== undefined && oldCredits !== newCredits,
    oldCredits,
    newCredits
  };
};
