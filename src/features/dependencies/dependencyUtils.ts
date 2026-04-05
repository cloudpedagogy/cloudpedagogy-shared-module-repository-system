import { RepositoryDataset, Module, ModuleVersion } from '../../types';

export interface UsageReference {
  programmeName: string;
  programmeCode: string;
  versionReferenced: string;
}

export interface DependencyReference {
  moduleName: string;
  moduleCode: string;
  versionConstraint?: string;
  type?: string;
}

/**
 * Get all programmes that use a specific module.
 */
export const getModuleUsage = (moduleId: string, dataset: RepositoryDataset): UsageReference[] => {
  return dataset.programmes
    .filter(p => p.modules.some(m => m.moduleId === moduleId))
    .map(p => {
      const ref = p.modules.find(m => m.moduleId === moduleId);
      return {
        programmeName: p.name,
        programmeCode: p.code,
        versionReferenced: ref ? ref.version : 'Unknown'
      };
    });
};

/**
 * Get all modules that depend ON this module (Inbound).
 */
export const getModuleInboundDependencies = (moduleId: string, dataset: RepositoryDataset): DependencyReference[] => {
  const inbound: DependencyReference[] = [];
  
  dataset.modules.forEach(m => {
    m.versions.forEach(v => {
      if (v.dependencies.some(d => d.targetId === moduleId)) {
        const dep = v.dependencies.find(d => d.targetId === moduleId);
        inbound.push({
          moduleName: m.name,
          moduleCode: m.code,
          versionConstraint: dep ? dep.minVersion : undefined,
          type: dep ? dep.type : undefined
        });
      }
    });
  });
  
  return inbound;
};

/**
 * Get all modules that THIS specific version depends on (Outbound).
 */
export const getModuleOutboundDependencies = (version: ModuleVersion, dataset: RepositoryDataset): DependencyReference[] => {
  return version.dependencies.map(d => {
    const target = dataset.modules.find(m => m.id === d.targetId);
    return {
      moduleName: target ? target.name : 'Unknown Module',
      moduleCode: target ? target.code : d.targetId,
      versionConstraint: d.minVersion,
      type: d.type
    };
  });
};

/**
 * Get the latest version string for a module.
 */
export const getModuleLatestVersion = (moduleId: string, dataset: RepositoryDataset): string => {
  const mod = dataset.modules.find(m => m.id === moduleId);
  if (!mod || mod.versions.length === 0) return '0.0.0';
  return mod.versions[mod.versions.length - 1].version;
};

/**
 * Check if any programme is using an older version of the module.
 */
export const checkModuleVersionLag = (moduleId: string, dataset: RepositoryDataset): boolean => {
  const latest = getModuleLatestVersion(moduleId, dataset);
  return dataset.programmes.some(p => 
    p.modules.some(m => m.moduleId === moduleId && m.version !== latest)
  );
};
