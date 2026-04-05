import { ModuleVersion } from '../../types';

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
  
  // Match by type for simple comparison
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
 * Simple metadata comparison.
 */
export const diffMetadata = (oldVersion: ModuleVersion, newVersion: ModuleVersion) => {
  return {
    statusChanged: oldVersion.status !== newVersion.status,
    descriptionChanged: oldVersion.description !== newVersion.description,
  };
};
