import { RepositoryDataset, Module, ModuleVersion, Programme } from '../../types';
import { compareVersions, getLatestPublishedVersion, getHighestVersion } from '../../lib/versioning';

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

export interface ConflictRecord {
  moduleId: string;
  moduleName: string;
  severity: 'error' | 'warning';
  message: string;
  type: 'version_mismatch' | 'missing_dependency' | 'deprecated_usage' | 'circular_dependency';
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
 * Get the latest published version string for a module (using SemVer).
 */
export const getModuleLatestVersion = (moduleId: string, dataset: RepositoryDataset): string => {
  const mod = dataset.modules.find(m => m.id === moduleId);
  if (!mod || !mod.versions || mod.versions.length === 0) return '0.0.0';
  const latest = getLatestPublishedVersion(mod) ?? getHighestVersion(mod);
  return latest ? latest.version : '0.0.0';
};

/**
 * Detect circular prerequisite dependencies across modules.
 */
export const detectCircularPrerequisites = (dataset: RepositoryDataset): { hasCycle: boolean; cyclePath: string[] } => {
  const graph = new Map<string, string[]>();
  dataset.modules.forEach(m => {
    const prereqIds = new Set<string>();
    m.versions.forEach(v => {
      v.dependencies.forEach(d => {
        if (d.type === 'prerequisite' && d.targetId && d.targetId !== m.id) {
          prereqIds.add(d.targetId);
        }
      });
    });
    graph.set(m.id, Array.from(prereqIds));
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  let cycleFound: string[] = [];

  const dfs = (node: string, currentPath: string[]): boolean => {
    visited.add(node);
    recStack.add(node);
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...currentPath, neighbor])) return true;
      } else if (recStack.has(neighbor)) {
        cycleFound = [...currentPath, neighbor];
        return true;
      }
    }
    recStack.delete(node);
    return false;
  };

  for (const modId of graph.keys()) {
    if (!visited.has(modId)) {
      if (dfs(modId, [modId])) {
        return { hasCycle: true, cyclePath: cycleFound };
      }
    }
  }

  return { hasCycle: false, cyclePath: [] };
};

/**
 * Detect conflicts within a programme context.
 */
export const getProgrammeConflicts = (programme: Programme, dataset: RepositoryDataset): ConflictRecord[] => {
  const conflicts: ConflictRecord[] = [];
  
  programme.modules.forEach(pm => {
    const mod = dataset.modules.find(m => m.id === pm.moduleId);
    if (!mod) {
      conflicts.push({
        moduleId: pm.moduleId,
        moduleName: 'Missing Module',
        severity: 'error',
        message: `Module ${pm.moduleId} referenced in programme is missing from repository.`,
        type: 'missing_dependency'
      });
      return;
    }

    const ver = mod.versions.find(v => v.version === pm.version);
    if (!ver) {
      conflicts.push({
        moduleId: pm.moduleId,
        moduleName: mod.name,
        severity: 'error',
        message: `Version ${pm.version} of ${mod.name} is missing from repository.`,
        type: 'missing_dependency'
      });
      return;
    }

    // Check Archived Status
    if (ver.status === 'archived') {
      conflicts.push({
        moduleId: pm.moduleId,
        moduleName: mod.name,
        severity: 'error',
        message: `${mod.name} v${ver.version} is archived. Archived versions must not be used in active programmes.`,
        type: 'deprecated_usage'
      });
    }

    // Check Deprecated Status
    if (ver.status === 'deprecated') {
      conflicts.push({
        moduleId: pm.moduleId,
        moduleName: mod.name,
        severity: 'warning',
        message: `${mod.name} v${ver.version} is deprecated and should be scheduled for review or upgrade.`,
        type: 'deprecated_usage'
      });
    }

    // Check Draft Status
    if (ver.status === 'draft') {
      conflicts.push({
        moduleId: pm.moduleId,
        moduleName: mod.name,
        severity: 'error',
        message: `${mod.name} is pinned to unreleased draft v${ver.version}. Only published releases can be part of active programmes.`,
        type: 'version_mismatch'
      });
    }

    // Check Dependencies (all modules in programme must satisfy peer requirements)
    ver.dependencies.forEach(dep => {
      const peer = programme.modules.find(m => m.moduleId === dep.targetId);
      if (!peer) {
        conflicts.push({
          moduleId: pm.moduleId,
          moduleName: mod.name,
          severity: 'warning',
          message: `${mod.name} has a prerequisite (Module ID: ${dep.targetId}) that is not included in the programme.`,
          type: 'missing_dependency'
        });
      } else if (dep.minVersion && compareVersions(peer.version, dep.minVersion) === -1) {
        conflicts.push({
          moduleId: pm.moduleId,
          moduleName: mod.name,
          severity: 'error',
          message: `${mod.name} requires v${dep.minVersion}+ of ${dep.targetId}, but v${peer.version} is provided.`,
          type: 'version_mismatch'
        });
      }
    });
  });

  return conflicts;
};

/**
 * Check if any programme is using an older version of the module.
 */
export const checkModuleVersionLag = (moduleId: string, dataset: RepositoryDataset): boolean => {
  const latest = getModuleLatestVersion(moduleId, dataset);
  return dataset.programmes.some(p => 
    p.modules.some(m => m.moduleId === moduleId && compareVersions(latest, m.version) > 0)
  );
};
