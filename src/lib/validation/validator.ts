import { RepositoryDataset } from '../../types';

export type ValidationIssueType = 'warning' | 'info' | 'error';

export interface ValidationIssue {
  id: string;
  type: ValidationIssueType;
  category: 'Duplicate ID' | 'Missing Reference' | 'Invalid Version' | 'Incomplete Metadata';
  message: string;
  location: string;
}

/**
 * Validate the entire repository dataset for structural integrity.
 */
export const validateDataset = (dataset: RepositoryDataset): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // 1. Check Duplicate Module IDs
  const moduleIds = new Set<string>();
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
  });

  // 2. Check Duplicate Programme IDs
  const programmeIds = new Set<string>();
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
  });

  // 3. Check Programme References & Versions
  dataset.programmes.forEach(p => {
    p.modules.forEach(mRef => {
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

  // 4. Check Incomplete Metadata
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
