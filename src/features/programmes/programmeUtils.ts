import { RepositoryDataset, Module, Programme } from '../../types';

export interface ResolvedProgrammeModule {
  moduleId: string;
  version: string;
  name: string;
  code: string;
  level: number;
  credits: number;
  isShared: boolean;
  isOutdated: boolean;
  latestVersion: string;
}

/**
 * Resolve programme module references into full metadata.
 */
export const resolveProgrammeModules = (
  programme: Programme, 
  dataset: RepositoryDataset
): ResolvedProgrammeModule[] => {
  // Map module usage count across all programmes
  const moduleUsageMap: Record<string, number> = {};
  dataset.programmes.forEach(p => {
    p.modules.forEach(m => {
      moduleUsageMap[m.moduleId] = (moduleUsageMap[m.moduleId] || 0) + 1;
    });
  });

  return programme.modules.map(ref => {
    const original = dataset.modules.find(m => m.id === ref.moduleId);
    if (!original) {
      return {
        moduleId: ref.moduleId,
        version: ref.version,
        name: 'Unknown Module',
        code: ref.moduleId,
        level: 0,
        credits: 0,
        isShared: false,
        isOutdated: false,
        latestVersion: ref.version
      };
    }

    const latest = original.versions[original.versions.length - 1];
    const isOutdated = latest ? latest.version !== ref.version : false;

    return {
      moduleId: ref.moduleId,
      version: ref.version,
      name: original.name,
      code: original.code,
      level: original.level,
      credits: original.credits,
      isShared: (moduleUsageMap[ref.moduleId] || 0) > 1,
      isOutdated,
      latestVersion: latest ? latest.version : ref.version
    };
  });
};
