import { RepositoryDataset } from '../../types';
import { detectCircularPrerequisites } from '../../features/dependencies/dependencyUtils';

export type ValidationIssueType = 'warning' | 'info' | 'error';

export interface ValidationIssue {
  id: string;
  type: ValidationIssueType;
  category: 'Duplicate ID' | 'Duplicate Code' | 'Missing Reference' | 'Invalid Version' | 'Incomplete Metadata' | 'Circular Dependency';
  message: string;
  location: string;
}

/**
 * Validate the entire repository dataset for structural integrity.
 */
export const validateDataset = (dataset: RepositoryDataset): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // 1. Check Duplicate Module IDs and Duplicate Codes
  const moduleIds = new Set<string>();
  const moduleCodes = new Set<string>();
  dataset.modules.forEach(m => {
    if (moduleIds.has(m.id)) {
      issues.push({
        id: `dup-mod-${m.id}`,
        type: 'warning',
        category: 'Duplicate ID',
        message: `Duplicate Module ID detected: ${m.id}`,
        location: `Module: ${m.name} (${m.code})`
      });
    }
    moduleIds.add(m.id);

    const normCode = m.code.trim().toUpperCase();
    if (moduleCodes.has(normCode)) {
      issues.push({
        id: `dup-mod-code-${normCode}`,
        type: 'warning',
        category: 'Duplicate Code',
        message: `Duplicate Module Code detected: ${m.code}`,
        location: `Module: ${m.name}`
      });
    }
    moduleCodes.add(normCode);
  });

  // 2. Check Duplicate Programme IDs and Duplicate Codes
  const programmeIds = new Set<string>();
  const programmeCodes = new Set<string>();
  dataset.programmes.forEach(p => {
    if (programmeIds.has(p.id)) {
      issues.push({
        id: `dup-prog-${p.id}`,
        type: 'warning',
        category: 'Duplicate ID',
        message: `Duplicate Programme ID detected: ${p.id}`,
        location: `Programme: ${p.name} (${p.code})`
      });
    }
    programmeIds.add(p.id);

    const normCode = p.code.trim().toUpperCase();
    if (programmeCodes.has(normCode)) {
      issues.push({
        id: `dup-prog-code-${normCode}`,
        type: 'warning',
        category: 'Duplicate Code',
        message: `Duplicate Programme Code detected: ${p.code}`,
        location: `Programme: ${p.name}`
      });
    }
    programmeCodes.add(normCode);
  });

  // 3. Check Programme References & Duplicate Assignments
  dataset.programmes.forEach(p => {
    const seenInProg = new Set<string>();
    p.modules.forEach((mRef, mIdx) => {
      if (seenInProg.has(mRef.moduleId)) {
        issues.push({
          id: `dup-in-prog-${p.id}-${mRef.moduleId}-${mIdx}`,
          type: 'warning',
          category: 'Duplicate ID',
          message: `Duplicate module assignment in programme: Module ID ${mRef.moduleId} is assigned more than once.`,
          location: `Programme: ${p.name} (${p.code})`
        });
      }
      seenInProg.add(mRef.moduleId);

      const targetModule = dataset.modules.find(m => m.id === mRef.moduleId);
      if (!targetModule) {
        issues.push({
          id: `missing-mod-${p.id}-${mRef.moduleId}`,
          type: 'warning',
          category: 'Missing Reference',
          message: `Programme references non-existent Module ID: ${mRef.moduleId}`,
          location: `Programme: ${p.name} (${p.code})`
        });
      } else {
        const targetVersion = targetModule.versions.find(v => v.version === mRef.version);
        if (!targetVersion) {
          issues.push({
            id: `missing-ver-${p.id}-${mRef.moduleId}-${mRef.version}`,
            type: 'warning',
            category: 'Invalid Version',
            message: `Version v${mRef.version} not found in Module registry for ${targetModule.name}`,
            location: `Programme: ${p.name} (${p.code})`
          });
        }
      }
    });
  });

  // 4. Circular Prerequisite Dependencies Check
  const cycle = detectCircularPrerequisites(dataset);
  if (cycle.hasCycle) {
    issues.push({
      id: `cycle-${cycle.cyclePath.join('-')}`,
      type: 'warning',
      category: 'Circular Dependency',
      message: `Circular prerequisite dependency chain detected: ${cycle.cyclePath.join(' -> ')}`,
      location: 'Repository Dependency Graph'
    });
  }

  // 5. Check Incomplete Metadata
  dataset.modules.forEach(m => {
    if (!m.description || m.description.length < 10) {
      issues.push({
        id: `meta-desc-${m.id}`,
        type: 'info',
        category: 'Incomplete Metadata',
        message: 'Module description is missing or too short.',
        location: `Module: ${m.name} (${m.code})`
      });
    }
    if (m.credits === 0) {
      issues.push({
        id: `meta-credits-${m.id}`,
        type: 'info',
        category: 'Incomplete Metadata',
        message: 'Module credits are set to zero.',
        location: `Module: ${m.name} (${m.code})`
      });
    }
  });

  return issues;
};
