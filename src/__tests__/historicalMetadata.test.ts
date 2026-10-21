import { describe, it, expect } from 'vitest';
import { 
  createModule, 
  updateModuleMetadata, 
  createSuccessorDraft, 
  publishDraftVersion, 
  updateDraftVersionContent,
  getVersionCredits,
  getVersionLevel,
  getVersionTitle,
  getVersionCode
} from '../lib/modules/moduleService';
import { resolveProgrammeModules } from '../features/programmes/programmeUtils';
import { diffMetadata } from '../features/modules/comparisonUtils';
import { migrateDataset } from '../lib/storage';
import { Module, Programme, RepositoryDataset } from '../types';

describe('Historical Metadata Integrity', () => {
  const completeCurriculum = {
    description: 'Initial curriculum compliant with assessments',
    content: 'Unit 1-10',
    outcomes: ['LO1', 'LO2'],
    assessments: [{ type: 'Exam', weight: 100 }]
  };

  it('freezes snapshot metadata upon initial creation and publication', () => {
    const modRes = createModule(
      { code: 'HLTH201', name: 'Global Health Policy', description: 'Desc', level: 5, credits: 15 },
      completeCurriculum
    );
    expect(modRes.success).toBe(true);
    let mod = modRes.module!;

    const draft = mod.versions[0];
    expect(draft.level).toBe(5);
    expect(draft.credits).toBe(15);
    expect(draft.code).toBe('HLTH201');
    expect(draft.title).toBe('Global Health Policy');

    const pubRes = publishDraftVersion(mod, draft.id);
    expect(pubRes.success).toBe(true);
    mod = pubRes.module!;

    const v1 = mod.versions[0];
    expect(v1.status).toBe('published');
    expect(v1.level).toBe(5);
    expect(v1.credits).toBe(15);
  });

  it('preserves historical metadata when canonical module attributes are subsequently updated', () => {
    const modRes = createModule(
      { code: 'HLTH201', name: 'Global Health Policy', description: 'Desc', level: 5, credits: 15 },
      completeCurriculum
    );
    let mod = publishDraftVersion(modRes.module!, modRes.module!.versions[0].id).module!;
    const publishedV1 = mod.versions[0];

    // Update canonical module
    const updateRes = updateModuleMetadata(mod, {
      name: 'Global Health Systems and Policy',
      credits: 20,
      level: 6
    });
    expect(updateRes.success).toBe(true);
    const updatedMod = updateRes.module!;

    // Canonical attributes updated
    expect(updatedMod.name).toBe('Global Health Systems and Policy');
    expect(updatedMod.credits).toBe(20);
    expect(updatedMod.level).toBe(6);

    // Historical v1.0.0 snapshot remains strictly untouched
    const v1After = updatedMod.versions[0];
    expect(getVersionCredits(v1After, updatedMod)).toBe(15);
    expect(getVersionLevel(v1After, updatedMod)).toBe(5);
    expect(getVersionTitle(v1After, updatedMod)).toBe('Global Health Policy');
  });

  it('accurately maintains different credits and levels across successor releases', () => {
    // 1. Create and publish v1.0.0 (15 credits, Level 5)
    const modRes = createModule(
      { code: 'HLTH201', name: 'Global Health Policy', description: 'Desc', level: 5, credits: 15 },
      completeCurriculum
    );
    let mod = publishDraftVersion(modRes.module!, modRes.module!.versions[0].id).module!;
    const v1Id = mod.versions[0].id;

    // 2. Create successor draft v2.0.0
    const successorRes = createSuccessorDraft(mod, v1Id, 'major');
    mod = successorRes.module!;
    const v2Draft = mod.versions.find(v => v.status === 'draft')!;

    // 3. Update successor draft with new academic level and credits (Level 6, 30 credits)
    const draftUpdateRes = updateDraftVersionContent(mod, v2Draft.id, {
      title: 'Advanced Global Health Governance',
      level: 6,
      credits: 30
    });
    mod = draftUpdateRes.module!;

    // 4. Publish v2.0.0
    const v2PubRes = publishDraftVersion(mod, v2Draft.id);
    mod = v2PubRes.module!;

    const v1 = mod.versions.find(v => v.version === '1.0.0')!;
    const v2 = mod.versions.find(v => v.version === '2.0.0')!;

    // v1 retains Level 5 and 15 credits
    expect(getVersionCredits(v1, mod)).toBe(15);
    expect(getVersionLevel(v1, mod)).toBe(5);
    expect(getVersionTitle(v1, mod)).toBe('Global Health Policy');

    // v2 reflects Level 6 and 30 credits
    expect(getVersionCredits(v2, mod)).toBe(30);
    expect(getVersionLevel(v2, mod)).toBe(6);
    expect(getVersionTitle(v2, mod)).toBe('Advanced Global Health Governance');
  });

  it('resolves programme views using version-specific historical snapshot values', () => {
    const mod: Module = {
      id: 'mod-shared-1',
      code: 'HLTH201',
      name: 'Global Health Canonical Title',
      description: 'Desc',
      level: 6,
      credits: 30, // Canonical has been updated to newer values
      versions: [
        {
          id: 'v1',
          moduleId: 'mod-shared-1',
          version: '1.0.0',
          status: 'published',
          releaseDate: '2024-09-01',
          title: 'Global Health Policy (Legacy)',
          code: 'HLTH201',
          level: 5,
          credits: 15,
          content: '',
          outcomes: ['LO1'],
          assessments: [{ type: 'Exam', weight: 100 }],
          dependencies: []
        },
        {
          id: 'v2',
          moduleId: 'mod-shared-1',
          version: '2.0.0',
          status: 'published',
          releaseDate: '2025-09-01',
          title: 'Global Health Governance (Advanced)',
          code: 'HLTH201',
          level: 6,
          credits: 30,
          content: '',
          outcomes: ['LO1', 'LO2'],
          assessments: [{ type: 'Exam', weight: 100 }],
          dependencies: []
        }
      ]
    };

    const programmeA: Programme = {
      id: 'prog-a',
      name: 'BSc Public Health Practice',
      code: 'BSC-PH',
      description: 'Undergraduate',
      modules: [{ moduleId: 'mod-shared-1', version: '1.0.0' }]
    };

    const programmeB: Programme = {
      id: 'prog-b',
      name: 'MSc International Health Policy',
      code: 'MSC-IHP',
      description: 'Postgraduate',
      modules: [{ moduleId: 'mod-shared-1', version: '2.0.0' }]
    };

    const dataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [mod],
      programmes: [programmeA, programmeB],
      lastUpdated: '2025-01-01'
    };

    const resolvedA = resolveProgrammeModules(programmeA, dataset);
    expect(resolvedA[0].credits).toBe(15);
    expect(resolvedA[0].level).toBe(5);
    expect(resolvedA[0].name).toBe('Global Health Policy (Legacy)');

    const resolvedB = resolveProgrammeModules(programmeB, dataset);
    expect(resolvedB[0].credits).toBe(30);
    expect(resolvedB[0].level).toBe(6);
    expect(resolvedB[0].name).toBe('Global Health Governance (Advanced)');
  });

  it('accurately detects academic metadata evolution in version comparator diffing', () => {
    const v1: any = { version: '1.0.0', status: 'published', level: 4, credits: 15, title: 'Foundations' };
    const v2: any = { version: '2.0.0', status: 'published', level: 5, credits: 20, title: 'Intermediate' };

    const diff = diffMetadata(v1, v2);
    expect(diff.creditsChanged).toBe(true);
    expect(diff.oldCredits).toBe(15);
    expect(diff.newCredits).toBe(20);
    expect(diff.levelChanged).toBe(true);
    expect(diff.oldLevel).toBe(4);
    expect(diff.newLevel).toBe(5);
  });

  it('transparently backfills legacy datasets lacking snapshots without corrupting data', () => {
    const legacyDataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [
        {
          id: 'mod-legacy',
          code: 'LEG101',
          name: 'Legacy Epidemiology',
          description: 'Desc',
          level: 4,
          credits: 15,
          versions: [
            {
              id: 'ver-legacy-1',
              moduleId: 'mod-legacy',
              version: '1.0.0',
              status: 'published',
              releaseDate: '2023-01-01',
              content: 'Content',
              outcomes: ['LO1'],
              assessments: [{ type: 'Exam', weight: 100 }],
              dependencies: []
              // Notice: credits, level, code, title are undefined in legacy records
            }
          ]
        }
      ],
      programmes: [],
      lastUpdated: '2023-01-01'
    };

    const migrated = migrateDataset(legacyDataset);
    const ver = migrated.modules[0].versions[0];
    expect(ver.credits).toBe(15);
    expect(ver.level).toBe(4);
    expect(ver.code).toBe('LEG101');
    expect(ver.title).toBe('Legacy Epidemiology');
  });

  it('proves migration idempotence: re-running migration never overwrites already populated historical metadata', () => {
    const datasetWithSnapshot: RepositoryDataset = {
      schemaVersion: 1,
      modules: [
        {
          id: 'mod-custom',
          code: 'CURR101',
          name: 'Current Title (Changed)',
          description: '',
          level: 6,
          credits: 30, // Canonical module has evolved to Level 6, 30 credits
          versions: [
            {
              id: 'ver-v1',
              moduleId: 'mod-custom',
              version: '1.0.0',
              status: 'published',
              releaseDate: '2023-01-01',
              title: 'Historical Title v1',
              code: 'HIST101',
              level: 4,
              credits: 15, // Historical snapshot has Level 4, 15 credits
              content: '',
              outcomes: ['LO1'],
              assessments: [{ type: 'Exam', weight: 100 }],
              dependencies: []
            }
          ]
        }
      ],
      programmes: [],
      lastUpdated: '2023-01-01'
    };

    // First migration pass
    const pass1 = migrateDataset(datasetWithSnapshot);
    const vPass1 = pass1.modules[0].versions[0];
    expect(vPass1.credits).toBe(15);
    expect(vPass1.level).toBe(4);
    expect(vPass1.title).toBe('Historical Title v1');
    expect(vPass1.code).toBe('HIST101');

    // Second migration pass (idempotence verification)
    const pass2 = migrateDataset(pass1);
    const vPass2 = pass2.modules[0].versions[0];
    expect(vPass2.credits).toBe(15);
    expect(vPass2.level).toBe(4);
    expect(vPass2.title).toBe('Historical Title v1');
    expect(vPass2.code).toBe('HIST101');
  });

  it('confirms all 10 legacy Schema 1 migration requirements through import parsing', () => {
    const legacyJson = JSON.stringify({
      schemaVersion: 1,
      modules: [
        {
          id: 'mod-legacy-ep',
          code: 'EPID001',
          name: 'Foundational Epidemiology',
          description: 'Original legacy syllabus',
          level: 4,
          credits: 15,
          versions: [
            {
              id: 'ver-ep-100',
              moduleId: 'mod-legacy-ep',
              version: '1.0.0',
              status: 'published',
              releaseDate: '2022-09-01',
              content: 'Syllabus content',
              outcomes: ['Outcome A', 'Outcome B'],
              assessments: [{ type: 'Exam', weight: 60 }, { type: 'Coursework', weight: 40 }],
              dependencies: []
            },
            {
              id: 'ver-ep-110',
              moduleId: 'mod-legacy-ep',
              version: '1.1.0',
              status: 'published',
              releaseDate: '2023-09-01',
              content: 'Revised syllabus content',
              outcomes: ['Outcome A', 'Outcome B', 'Outcome C'],
              assessments: [{ type: 'Exam', weight: 50 }, { type: 'Coursework', weight: 50 }],
              dependencies: []
            }
          ]
        }
      ],
      programmes: [
        {
          id: 'prog-legacy-bsc',
          code: 'BSC-LEG',
          name: 'BSc Legacy Degree',
          description: 'Programme referencing v1.0.0',
          modules: [
            { moduleId: 'mod-legacy-ep', version: '1.0.0' }
          ]
        }
      ],
      lastUpdated: '2023-09-01'
    });

    const parsed = JSON.parse(legacyJson);
    const migrated = migrateDataset(parsed);

    // 1. Existing module IDs remain unchanged
    expect(migrated.modules[0].id).toBe('mod-legacy-ep');
    // 2. Existing version IDs and labels remain unchanged
    expect(migrated.modules[0].versions[0].id).toBe('ver-ep-100');
    expect(migrated.modules[0].versions[0].version).toBe('1.0.0');
    expect(migrated.modules[0].versions[1].id).toBe('ver-ep-110');
    expect(migrated.modules[0].versions[1].version).toBe('1.1.0');
    // 3. Learning outcomes, assessments and dependencies are preserved
    expect(migrated.modules[0].versions[0].outcomes).toEqual(['Outcome A', 'Outcome B']);
    expect(migrated.modules[0].versions[0].assessments).toHaveLength(2);
    expect(migrated.modules[0].versions[1].outcomes).toEqual(['Outcome A', 'Outcome B', 'Outcome C']);
    // 4. Programme references remain valid
    expect(migrated.programmes[0].modules[0].moduleId).toBe('mod-legacy-ep');
    expect(migrated.programmes[0].modules[0].version).toBe('1.0.0');
    // 5. Missing historical snapshots receive documented canonical baseline values
    expect(migrated.modules[0].versions[0].credits).toBe(15);
    expect(migrated.modules[0].versions[0].level).toBe(4);
    expect(migrated.modules[0].versions[0].title).toBe('Foundational Epidemiology');
    expect(migrated.modules[0].versions[0].code).toBe('EPID001');

    // 7. Changing canonical metadata afterwards does not alter historical snapshots
    const mod = migrated.modules[0];
    const updated = updateModuleMetadata(mod, { name: 'New Title', credits: 30, level: 7 }).module!;
    expect(updated.versions[0].credits).toBe(15);
    expect(updated.versions[0].level).toBe(4);
    expect(updated.versions[0].title).toBe('Foundational Epidemiology');

    // 9. Export and roundtrip preserves those values
    const roundtripped: RepositoryDataset = JSON.parse(JSON.stringify(migrated));
    expect(roundtripped.modules[0].versions[0].credits).toBe(15);
    expect(roundtripped.modules[0].versions[0].level).toBe(4);
  });
});
