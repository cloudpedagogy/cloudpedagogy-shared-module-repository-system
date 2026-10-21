import { describe, it, expect } from 'vitest';
import { Module, ModuleVersion } from '../types';
import { 
  createModule, 
  createSuccessorDraft, 
  publishDraftVersion, 
  deprecateVersion, 
  archiveVersion,
  discardDraftVersion,
  updateDraftVersionContent
} from '../lib/modules/moduleService';
import { 
  bumpVersion, 
  compareVersions, 
  getLatestPublishedVersion, 
  getHighestVersion,
  validateForPublishing
} from '../lib/versioning';

describe('Module Version Lifecycle', () => {
  const baseCanonical = {
    code: 'EPID101',
    name: 'Epidemiological Methods',
    description: 'Foundations of population health surveillance',
    level: 4,
    credits: 15
  };

  const completeCurriculum = {
    description: 'Compliant curriculum with 100% assessments',
    content: 'Full 10-unit syllabus outline',
    outcomes: ['Understand incidence and prevalence', 'Interpret odds ratios'],
    assessments: [
      { type: 'Exam', weight: 60, description: 'Final written exam' },
      { type: 'Practical', weight: 40, description: 'Data analysis task' }
    ]
  };

  it('creates an initial draft version with semantic version 1.0.0', () => {
    const res = createModule(baseCanonical, completeCurriculum);
    expect(res.success).toBe(true);
    const mod = res.module!;
    expect(mod.versions).toHaveLength(1);
    expect(mod.versions[0].version).toBe('1.0.0');
    expect(mod.versions[0].status).toBe('draft');
  });

  it('validates pre-flight conditions and transitions an initial draft to published', () => {
    const createRes = createModule(baseCanonical, completeCurriculum);
    const mod = createRes.module!;
    const draftId = mod.versions[0].id;

    const pubRes = publishDraftVersion(mod, draftId);
    expect(pubRes.success).toBe(true);
    const publishedMod = pubRes.module!;
    const publishedVer = publishedMod.versions.find(v => v.id === draftId)!;
    expect(publishedVer.status).toBe('published');
    expect(publishedVer.releaseDate).toBeTruthy();
  });

  it('blocks publishing if assessment weights do not equal 100%', () => {
    const createRes = createModule(baseCanonical, {
      ...completeCurriculum,
      assessments: [{ type: 'Essay', weight: 50 }]
    });
    const mod = createRes.module!;
    const draftId = mod.versions[0].id;

    const pubRes = publishDraftVersion(mod, draftId);
    expect(pubRes.success).toBe(false);
    expect(pubRes.errors.some(e => e.includes('100%'))).toBe(true);
  });

  it('strictly locks published versions as immutable snapshots', () => {
    const createRes = createModule(baseCanonical, completeCurriculum);
    const pubRes = publishDraftVersion(createRes.module!, createRes.module!.versions[0].id);
    const publishedMod = pubRes.module!;
    const verId = publishedMod.versions[0].id;

    // Attempt direct content edit on published version
    const editRes = updateDraftVersionContent(publishedMod, verId, {
      description: 'Illegal edit attempt'
    });
    expect(editRes.success).toBe(false);
    expect(editRes.errors.some(e => e.toLowerCase().includes('immutable'))).toBe(true);
  });

  it('creates successor drafts from published releases with minor, major, patch SemVer increments', () => {
    const createRes = createModule(baseCanonical, completeCurriculum);
    const pubRes = publishDraftVersion(createRes.module!, createRes.module!.versions[0].id);
    let mod = pubRes.module!;
    const sourceVerId = mod.versions[0].id; // 1.0.0

    // Minor bump
    const minorRes = createSuccessorDraft(mod, sourceVerId, 'minor');
    expect(minorRes.success).toBe(true);
    const minorDraft = minorRes.module!.versions.find(v => v.status === 'draft')!;
    expect(minorDraft.version).toBe('1.1.0');
    expect(minorDraft.sourceVersionId).toBe(sourceVerId);
    expect(minorDraft.outcomes).toEqual(mod.versions[0].outcomes); // Independent copy

    // Discard draft to test major bump
    mod = discardDraftVersion(minorRes.module!, minorDraft.id).module!;

    // Major bump
    const majorRes = createSuccessorDraft(mod, sourceVerId, 'major');
    expect(majorRes.success).toBe(true);
    expect(majorRes.module!.versions.find(v => v.status === 'draft')!.version).toBe('2.0.0');

    // Patch bump
    mod = discardDraftVersion(majorRes.module!, majorRes.module!.versions.find(v => v.status === 'draft')!.id).module!;
    const patchRes = createSuccessorDraft(mod, sourceVerId, 'patch');
    expect(patchRes.success).toBe(true);
    expect(patchRes.module!.versions.find(v => v.status === 'draft')!.version).toBe('1.0.1');
  });

  it('enforces single active draft rule per module', () => {
    const createRes = createModule(baseCanonical, completeCurriculum);
    const pubRes = publishDraftVersion(createRes.module!, createRes.module!.versions[0].id);
    const mod = pubRes.module!;

    // Create first successor draft
    const draft1Res = createSuccessorDraft(mod, mod.versions[0].id, 'minor');
    expect(draft1Res.success).toBe(true);

    // Attempt second successor draft while first is active
    const draft2Res = createSuccessorDraft(draft1Res.module!, mod.versions[0].id, 'patch');
    expect(draft2Res.success).toBe(false);
    expect(draft2Res.errors.some(e => e.includes('already has an active draft'))).toBe(true);
  });

  it('prevents duplicate version labels within a module', () => {
    const createRes = createModule(baseCanonical, completeCurriculum);
    const pubRes = publishDraftVersion(createRes.module!, createRes.module!.versions[0].id);
    const mod = pubRes.module!;

    // Attempt custom version bump with already existing 1.0.0
    const dupRes = createSuccessorDraft(mod, mod.versions[0].id, 'custom', '1.0.0');
    expect(dupRes.success).toBe(false);
    expect(dupRes.errors.some(e => e.includes('Duplicate version') || e.includes('must be higher'))).toBe(true);
  });

  it('manages deprecation and archiving transitions without rewriting historical content', () => {
    const createRes = createModule(baseCanonical, completeCurriculum);
    const pubRes = publishDraftVersion(createRes.module!, createRes.module!.versions[0].id);
    let mod = pubRes.module!;
    const verId = mod.versions[0].id;

    // Deprecate
    const depRes = deprecateVersion(mod, verId);
    expect(depRes.success).toBe(true);
    expect(depRes.module!.versions[0].status).toBe('deprecated');
    expect(depRes.module!.versions[0].outcomes).toEqual(completeCurriculum.outcomes);

    // Archive
    mod = depRes.module!;
    const archRes = archiveVersion(mod, verId);
    expect(archRes.success).toBe(true);
    expect(archRes.module!.versions[0].status).toBe('archived');
  });

  it('selects latest published version accurately using semantic version sorting', () => {
    const mod: Module = {
      id: 'mod-test',
      code: 'TEST100',
      name: 'Test Module',
      description: 'Desc',
      level: 4,
      credits: 15,
      versions: [
        { id: 'v1', moduleId: 'mod-test', version: '1.0.0', status: 'published', releaseDate: '2025-01-01', content: '', outcomes: [], assessments: [], dependencies: [] },
        { id: 'v2', moduleId: 'mod-test', version: '1.10.0', status: 'published', releaseDate: '2025-03-01', content: '', outcomes: [], assessments: [], dependencies: [] },
        { id: 'v3', moduleId: 'mod-test', version: '1.2.0', status: 'published', releaseDate: '2025-02-01', content: '', outcomes: [], assessments: [], dependencies: [] },
        { id: 'v4', moduleId: 'mod-test', version: '2.0.0', status: 'draft', releaseDate: '2025-04-01', content: '', outcomes: [], assessments: [], dependencies: [] }
      ]
    };

    const latestPub = getLatestPublishedVersion(mod);
    expect(latestPub?.version).toBe('1.10.0'); // 1.10.0 > 1.2.0 SemVer
    const highest = getHighestVersion(mod);
    expect(highest?.version).toBe('2.0.0');
  });
});
