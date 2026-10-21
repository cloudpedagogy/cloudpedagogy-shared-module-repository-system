import { describe, it, expect } from 'vitest';
import { 
  createProgramme, 
  updateProgramme, 
  addModuleToProgramme, 
  removeModuleFromProgramme, 
  reorderProgrammeModules, 
  repinProgrammeModuleVersion,
  deleteProgrammeSafely,
  validateProgrammeInputs
} from '../lib/programmes/programmeService';
import { Programme, Module, RepositoryDataset } from '../types';

describe('Programme Management and Shared Module Reuse', () => {
  const sampleModule: Module = {
    id: 'mod-shared-epid',
    code: 'EPID200',
    name: 'Principles of Epidemiology',
    description: 'Epidemiology fundamentals',
    level: 5,
    credits: 20,
    versions: [
      {
        id: 'v1',
        moduleId: 'mod-shared-epid',
        version: '1.0.0',
        status: 'published',
        releaseDate: '2024-01-01',
        content: '',
        outcomes: ['LO1'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: []
      },
      {
        id: 'v2',
        moduleId: 'mod-shared-epid',
        version: '2.0.0',
        status: 'published',
        releaseDate: '2025-01-01',
        content: '',
        outcomes: ['LO1', 'LO2'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: []
      },
      {
        id: 'v3-draft',
        moduleId: 'mod-shared-epid',
        version: '2.1.0',
        status: 'draft',
        releaseDate: '2025-06-01',
        content: '',
        outcomes: [],
        assessments: [],
        dependencies: []
      }
    ]
  };

  const sampleModule2: Module = {
    id: 'mod-biostat',
    code: 'STAT101',
    name: 'Biostatistics',
    description: 'Basic statistics',
    level: 4,
    credits: 15,
    versions: [
      {
        id: 'bv1',
        moduleId: 'mod-biostat',
        version: '1.0.0',
        status: 'published',
        releaseDate: '2024-01-01',
        content: '',
        outcomes: ['LO1'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: []
      }
    ]
  };

  const sampleDataset: RepositoryDataset = {
    schemaVersion: 1,
    modules: [sampleModule, sampleModule2],
    programmes: [],
    lastUpdated: '2025-01-01'
  };

  it('creates an academic programme with stable id and valid inputs', () => {
    const res = createProgramme({
      code: 'BSC-PH',
      name: 'BSc Public Health',
      description: 'Undergraduate pathway'
    });
    expect(res.success).toBe(true);
    expect(res.data?.id).toMatch(/^prog-/);
    expect(res.data?.code).toBe('BSC-PH');
    expect(res.data?.modules).toHaveLength(0);
  });

  it('validates required fields and enforces case-insensitive programme code uniqueness', () => {
    const existing: Programme = {
      id: 'p1',
      code: 'BSC-PH',
      name: 'Existing Programme',
      description: '',
      modules: []
    };

    const emptyRes = createProgramme({ code: '', name: '' });
    expect(emptyRes.success).toBe(false);
    expect(emptyRes.errors).toHaveLength(2);

    const dupRes = createProgramme({ code: 'bsc-ph', name: 'Duplicate Code' }, [existing]);
    expect(dupRes.success).toBe(false);
    expect(dupRes.errors.some(e => e.includes('already in use'))).toBe(true);
  });

  it('adds a shared module to a programme with explicit published version pinning', () => {
    let prog = createProgramme({ code: 'BSC-PH', name: 'BSc Public Health' }).data!;
    
    // Pin v1.0.0
    const addRes = addModuleToProgramme(prog, 'mod-shared-epid', '1.0.0', sampleDataset);
    expect(addRes.success).toBe(true);
    prog = addRes.data!;
    expect(prog.modules).toHaveLength(1);
    expect(prog.modules[0].moduleId).toBe('mod-shared-epid');
    expect(prog.modules[0].version).toBe('1.0.0');
  });

  it('prevents accidental duplicate module assignments within the same programme', () => {
    let prog = createProgramme({ code: 'BSC-PH', name: 'BSc Public Health' }).data!;
    prog = addModuleToProgramme(prog, 'mod-shared-epid', '1.0.0', sampleDataset).data!;

    // Attempt to add same module again
    const dupRes = addModuleToProgramme(prog, 'mod-shared-epid', '2.0.0', sampleDataset);
    expect(dupRes.success).toBe(false);
    expect(dupRes.errors.some(e => e.includes('already included'))).toBe(true);
  });

  it('blocks pinning draft versions to programmes', () => {
    const prog = createProgramme({ code: 'BSC-PH', name: 'BSc Public Health' }).data!;
    const draftPinRes = addModuleToProgramme(prog, 'mod-shared-epid', '2.1.0', sampleDataset);
    expect(draftPinRes.success).toBe(false);
    expect(draftPinRes.errors.some(e => e.toLowerCase().includes('cannot pin draft'))).toBe(true);
  });

  it('supports shared module reuse with different programmes pinning different versions', () => {
    let progA = createProgramme({ code: 'PROG-A', name: 'Programme Alpha' }).data!;
    let progB = createProgramme({ code: 'PROG-B', name: 'Programme Beta' }).data!;

    progA = addModuleToProgramme(progA, 'mod-shared-epid', '1.0.0', sampleDataset).data!;
    progB = addModuleToProgramme(progB, 'mod-shared-epid', '2.0.0', sampleDataset).data!;

    expect(progA.modules[0].version).toBe('1.0.0');
    expect(progB.modules[0].version).toBe('2.0.0');
  });

  it('allows deliberate, explicit re-pinning of a programme module without affecting other programmes', () => {
    let progA = createProgramme({ code: 'PROG-A', name: 'Programme Alpha' }).data!;
    let progB = createProgramme({ code: 'PROG-B', name: 'Programme Beta' }).data!;

    progA = addModuleToProgramme(progA, 'mod-shared-epid', '1.0.0', sampleDataset).data!;
    progB = addModuleToProgramme(progB, 'mod-shared-epid', '1.0.0', sampleDataset).data!;

    // Explicitly re-pin Programme A to v2.0.0
    const repinRes = repinProgrammeModuleVersion(progA, 'mod-shared-epid', '2.0.0', sampleDataset);
    expect(repinRes.success).toBe(true);
    progA = repinRes.data!;

    expect(progA.modules[0].version).toBe('2.0.0');
    // Programme B remains untouched on v1.0.0
    expect(progB.modules[0].version).toBe('1.0.0');
  });

  it('reorders module sequence in a programme', () => {
    let prog = createProgramme({ code: 'BSC-PH', name: 'BSc Public Health' }).data!;
    prog = addModuleToProgramme(prog, 'mod-shared-epid', '1.0.0', sampleDataset).data!;
    prog = addModuleToProgramme(prog, 'mod-biostat', '1.0.0', sampleDataset).data!;

    expect(prog.modules[0].moduleId).toBe('mod-shared-epid');
    expect(prog.modules[1].moduleId).toBe('mod-biostat');

    const reordered = reorderProgrammeModules(prog, 0, 1).data!;
    expect(reordered.modules[0].moduleId).toBe('mod-biostat');
    expect(reordered.modules[1].moduleId).toBe('mod-shared-epid');
  });

  it('safely removes a module reference from a programme', () => {
    let prog = createProgramme({ code: 'BSC-PH', name: 'BSc Public Health' }).data!;
    prog = addModuleToProgramme(prog, 'mod-shared-epid', '1.0.0', sampleDataset).data!;
    expect(prog.modules).toHaveLength(1);

    const removed = removeModuleFromProgramme(prog, 'mod-shared-epid').data!;
    expect(removed.modules).toHaveLength(0);
  });

  it('guarantees complete programme re-pinning isolation across 3 published releases and persists over JSON roundtrip', () => {
    // 1. One canonical module with three published releases: v1.0.0, v1.1.0, v2.0.0
    const threeVersionModule: Module = {
      id: 'mod-iso-1',
      code: 'ISO101',
      name: 'Isolation Principles',
      description: 'Shared isolation test module',
      level: 4,
      credits: 15,
      versions: [
        { id: 'v100', moduleId: 'mod-iso-1', version: '1.0.0', status: 'published', releaseDate: '2024-01-01', content: 'v1', outcomes: ['O1'], assessments: [{ type: 'Exam', weight: 100 }], dependencies: [] },
        { id: 'v110', moduleId: 'mod-iso-1', version: '1.1.0', status: 'published', releaseDate: '2024-06-01', content: 'v1.1', outcomes: ['O1', 'O2'], assessments: [{ type: 'Exam', weight: 100 }], dependencies: [] },
        { id: 'v200', moduleId: 'mod-iso-1', version: '2.0.0', status: 'published', releaseDate: '2025-01-01', content: 'v2', outcomes: ['O1', 'O2', 'O3'], assessments: [{ type: 'Exam', weight: 100 }], dependencies: [] }
      ]
    };

    const datasetWithThreeVersions: RepositoryDataset = {
      schemaVersion: 1,
      modules: [threeVersionModule],
      programmes: [],
      lastUpdated: '2025-01-01'
    };

    // 2. Programme A initially pinned to v1.0.0, Programme B initially pinned to v1.1.0
    let progA = createProgramme({ code: 'PROG-A', name: 'Programme A' }).data!;
    let progB = createProgramme({ code: 'PROG-B', name: 'Programme B' }).data!;

    progA = addModuleToProgramme(progA, 'mod-iso-1', '1.0.0', datasetWithThreeVersions).data!;
    progB = addModuleToProgramme(progB, 'mod-iso-1', '1.1.0', datasetWithThreeVersions).data!;

    expect(progA.modules[0].version).toBe('1.0.0');
    expect(progB.modules[0].version).toBe('1.1.0');

    // 3. Update Programme A from v1.0.0 to v2.0.0
    const repinRes = repinProgrammeModuleVersion(progA, 'mod-iso-1', '2.0.0', datasetWithThreeVersions);
    expect(repinRes.success).toBe(true);
    progA = repinRes.data!;

    // 4. Verify Programme A is v2.0.0 and Programme B remains v1.1.0
    expect(progA.modules[0].version).toBe('2.0.0');
    expect(progB.modules[0].version).toBe('1.1.0');

    // 5. Verify the underlying published module versions are strictly unchanged
    expect(threeVersionModule.versions).toHaveLength(3);
    expect(threeVersionModule.versions[0].version).toBe('1.0.0');
    expect(threeVersionModule.versions[1].version).toBe('1.1.0');
    expect(threeVersionModule.versions[2].version).toBe('2.0.0');

    // 6. Verify JSON roundtrip preserves the two independent pins
    const fullDataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [threeVersionModule],
      programmes: [progA, progB],
      lastUpdated: '2025-01-01'
    };

    const serialized = JSON.stringify(fullDataset);
    const roundtripped: RepositoryDataset = JSON.parse(serialized);

    const roundProgA = roundtripped.programmes.find(p => p.code === 'PROG-A')!;
    const roundProgB = roundtripped.programmes.find(p => p.code === 'PROG-B')!;

    expect(roundProgA.modules[0].version).toBe('2.0.0');
    expect(roundProgB.modules[0].version).toBe('1.1.0');
  });
});
