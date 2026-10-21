import { describe, it, expect } from 'vitest';
import { deleteModuleSafely } from '../lib/modules/moduleService';
import { detectCircularPrerequisites, getProgrammeConflicts } from '../features/dependencies/dependencyUtils';
import { validateForPublishing } from '../lib/versioning';
import { storage } from '../lib/storage';
import { RepositoryDataset, Module, Programme } from '../types';

// Mock localStorage for Node test runner
const memoryStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string) => { memoryStore.set(key, String(value)); },
  removeItem: (key: string) => { memoryStore.delete(key); },
  clear: () => { memoryStore.clear(); },
  key: (index: number) => Array.from(memoryStore.keys())[index] ?? null,
  get length() { return memoryStore.size; }
};
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.setItem) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
  });
}

describe('Safe Relationships & Integrity Guards', () => {
  const modA: Module = {
    id: 'mod-a',
    code: 'MODA',
    name: 'Module Alpha',
    description: 'Alpha',
    level: 4,
    credits: 15,
    versions: [
      {
        id: 'va1',
        moduleId: 'mod-a',
        version: '1.0.0',
        status: 'published',
        releaseDate: '2025-01-01',
        content: '',
        outcomes: ['LO1'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: [{ targetId: 'mod-b', type: 'prerequisite', minVersion: '1.0.0' }]
      }
    ]
  };

  const modB: Module = {
    id: 'mod-b',
    code: 'MODB',
    name: 'Module Beta',
    description: 'Beta',
    level: 4,
    credits: 15,
    versions: [
      {
        id: 'vb1',
        moduleId: 'mod-b',
        version: '1.0.0',
        status: 'published',
        releaseDate: '2025-01-01',
        content: '',
        outcomes: ['LO1'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: []
      }
    ]
  };

  const prog1: Programme = {
    id: 'prog-1',
    code: 'PROG1',
    name: 'Programme One',
    description: '',
    modules: [{ moduleId: 'mod-a', version: '1.0.0' }]
  };

  it('blocks deletion of a module if it is referenced by a programme', () => {
    const dataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [modA, modB],
      programmes: [prog1],
      lastUpdated: '2025-01-01'
    };

    const res = deleteModuleSafely(dataset, 'mod-a');
    expect(res.success).toBe(false);
    expect(res.errors[0]).toContain('referenced in programme');
    expect(res.errors[0]).toContain('Programme One');
  });

  it('blocks deletion of a module if it is an inbound dependency of another module', () => {
    // modA depends on modB, but prog1 does not directly reference modB
    const dataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [modA, modB],
      programmes: [],
      lastUpdated: '2025-01-01'
    };

    const res = deleteModuleSafely(dataset, 'mod-b');
    expect(res.success).toBe(false);
    expect(res.errors[0]).toContain('declared as a dependency');
    expect(res.errors[0]).toContain('Module Alpha');
  });

  it('allows safe deletion when a module has no programme references or inbound dependencies', () => {
    const standaloneMod: Module = {
      id: 'mod-c',
      code: 'MODC',
      name: 'Module Gamma',
      description: 'Gamma',
      level: 4,
      credits: 15,
      versions: [
        {
          id: 'vc1',
          moduleId: 'mod-c',
          version: '1.0.0',
          status: 'published',
          releaseDate: '2025-01-01',
          content: '',
          outcomes: ['LO1'],
          assessments: [{ type: 'Exam', weight: 100 }],
          dependencies: []
        }
      ]
    };

    const dataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [modA, modB, standaloneMod],
      programmes: [],
      lastUpdated: '2025-01-01'
    };

    const res = deleteModuleSafely(dataset, 'mod-c');
    expect(res.success).toBe(true);
    expect(res.dataset?.modules.some(m => m.id === 'mod-c')).toBe(false);
  });

  it('rejects self-dependencies during publishing validation', () => {
    const invalidVer = {
      id: 'v-self',
      moduleId: 'mod-a',
      version: '1.0.0',
      status: 'draft' as const,
      description: 'Valid substantive description text here',
      releaseDate: '2025-01-01',
      content: 'Outline',
      outcomes: ['LO1'],
      assessments: [{ type: 'Exam', weight: 100 }],
      dependencies: [{ targetId: 'mod-a', type: 'prerequisite' as const }]
    };

    const res = validateForPublishing(invalidVer, modA);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('dependency on itself'))).toBe(true);
  });

  it('detects circular prerequisite relationships across module dependencies', () => {
    const cycleModA: Module = {
      id: 'mod-c1',
      code: 'C1',
      name: 'Cycle 1',
      description: '',
      level: 4,
      credits: 15,
      versions: [{
        id: 'vc1', moduleId: 'mod-c1', version: '1.0.0', status: 'published', releaseDate: '2025-01-01', content: '', outcomes: [], assessments: [],
        dependencies: [{ targetId: 'mod-c2', type: 'prerequisite' }]
      }]
    };

    const cycleModB: Module = {
      id: 'mod-c2',
      code: 'C2',
      name: 'Cycle 2',
      description: '',
      level: 4,
      credits: 15,
      versions: [{
        id: 'vc2', moduleId: 'mod-c2', version: '1.0.0', status: 'published', releaseDate: '2025-01-01', content: '', outcomes: [], assessments: [],
        dependencies: [{ targetId: 'mod-c1', type: 'prerequisite' }]
      }]
    };

    const dataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [cycleModA, cycleModB],
      programmes: [],
      lastUpdated: '2025-01-01'
    };

    const cycleCheck = detectCircularPrerequisites(dataset);
    expect(cycleCheck.hasCycle).toBe(true);
  });

  it('flags archived module versions referenced in programmes as critical conflicts', () => {
    const archivedMod: Module = {
      id: 'mod-arch',
      code: 'ARCH1',
      name: 'Archived Module',
      description: '',
      level: 4,
      credits: 15,
      versions: [{
        id: 'va1', moduleId: 'mod-arch', version: '1.0.0', status: 'archived', releaseDate: '2024-01-01', content: '', outcomes: [], assessments: [], dependencies: []
      }]
    };

    const prog: Programme = {
      id: 'prog-test',
      code: 'TEST',
      name: 'Test Programme',
      description: '',
      modules: [{ moduleId: 'mod-arch', version: '1.0.0' }]
    };

    const dataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [archivedMod],
      programmes: [prog],
      lastUpdated: '2025-01-01'
    };

    const conflicts = getProgrammeConflicts(prog, dataset);
    expect(conflicts.some(c => c.severity === 'error' && c.message.includes('archived'))).toBe(true);
  });

  it('preserves full repository state through storage save and reload', () => {
    const fullDataset: RepositoryDataset = {
      schemaVersion: 1,
      modules: [modA, modB],
      programmes: [prog1],
      lastUpdated: '2025-01-01'
    };

    const saveRes = storage.save(fullDataset);
    expect(saveRes.success).toBe(true);

    const loadRes = storage.load();
    expect(loadRes.success).toBe(true);
    expect(loadRes.data?.modules).toHaveLength(2);
    expect(loadRes.data?.programmes).toHaveLength(1);
    expect(loadRes.data?.programmes[0].modules[0].version).toBe('1.0.0');
  });
});
