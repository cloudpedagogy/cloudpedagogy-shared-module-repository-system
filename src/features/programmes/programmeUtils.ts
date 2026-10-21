import { RepositoryDataset, Programme } from '../../types';
import { 
  getVersionTitle, 
  getVersionCode, 
  getVersionLevel, 
  getVersionCredits 
} from '../../lib/modules/moduleService';
import { getLatestPublishedVersion, getHighestVersion, compareVersions } from '../../lib/versioning';

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
  versionStatus?: 'draft' | 'published' | 'deprecated' | 'archived';
  isMissingModule?: boolean;
  isMissingVersion?: boolean;
}

/**
 * Resolve programme module references into full, version-accurate metadata.
 * Uses the pinned release's historical snapshot values rather than mutating canonical defaults.
 */
export const resolveProgrammeModules = (
  programme: Programme, 
  dataset: RepositoryDataset
): ResolvedProgrammeModule[] => {
  // Map module usage count across all programmes to determine if shared
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
        name: 'Missing Module Reference',
        code: ref.moduleId,
        level: 0,
        credits: 0,
        isShared: false,
        isOutdated: false,
        latestVersion: ref.version,
        isMissingModule: true
      };
    }

    const pinnedVersion = original.versions.find(v => v.version === ref.version);
    const latestPublished = getLatestPublishedVersion(original) ?? getHighestVersion(original);
    const latestVersionStr = latestPublished ? latestPublished.version : ref.version;
    const isOutdated = latestPublished ? compareVersions(latestPublished.version, ref.version) > 0 : false;

    return {
      moduleId: ref.moduleId,
      version: ref.version,
      // Metadata resolved from pinned version snapshot (or canonical fallback if legacy)
      name: getVersionTitle(pinnedVersion, original),
      code: getVersionCode(pinnedVersion, original),
      level: getVersionLevel(pinnedVersion, original),
      credits: getVersionCredits(pinnedVersion, original),
      isShared: (moduleUsageMap[ref.moduleId] || 0) > 1,
      isOutdated,
      latestVersion: latestVersionStr,
      versionStatus: pinnedVersion ? pinnedVersion.status : undefined,
      isMissingVersion: !pinnedVersion
    };
  });
};
