import { describe, it, expect, beforeEach } from 'vitest';
import { storage, createBlankDataset } from '../lib/storage';
import { createModule, updateDraftVersionContent } from '../lib/modules/moduleService';
import { RepositoryDataset } from '../types';
import { demoDataset } from '../data/demo';

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
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('JSON Export/Import Roundtrip & Referential Integrity', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('performs flawless roundtrip export and import for user-created modules', () => {
    const dataset = createBlankDataset();
    dataset.capabilityNotes = 'User capability note';
    dataset.governanceNotes = 'User governance note';

    // Create module 1
    const m1 = createModule(
      {
        code: 'ENG101',
        name: 'Systems Engineering Principles',
        description: 'Core concepts of engineering complex socio-technical systems.',
        level: 1,
        credits: 20,
        owner: 'Faculty of Engineering',
        tags: ['systems', 'engineering', 'core']
      },
      {
        version: '1.0.0',
        description: 'First draft iteration',
        outcomes: ['Analyze system architecture', 'Specify functional requirements'],
        assessments: [
          { type: 'Technical Design Portfolio', weight: 70, description: 'Design dossier' },
          { type: 'Peer Review', weight: 30 }
        ]
      }
    ).module!;

    dataset.modules.push(m1);

    // Save through storage service
    const saveRes = storage.save(dataset);
    expect(saveRes.success).toBe(true);

    // Simulate export JSON text
    const serialized = JSON.stringify(dataset, null, 2);

    // Validate import JSON
    const importValidation = storage.validateImportJSON(serialized);
    expect(importValidation.isValid).toBe(true);
    expect(importValidation.dataset).toBeDefined();

    const imported = importValidation.dataset!;
    expect(imported.modules).toHaveLength(1);
    expect(imported.modules[0].id).toBe(m1.id);
    expect(imported.modules[0].code).toBe('ENG101');
    expect(imported.modules[0].name).toBe('Systems Engineering Principles');
    expect(imported.modules[0].versions[0].outcomes).toEqual([
      'Analyze system architecture',
      'Specify functional requirements'
    ]);
    expect(imported.capabilityNotes).toBe('User capability note');
  });

  it('preserves referential relationships between programmes and modules', () => {
    const dataset = createBlankDataset();
    const mod = createModule(
      { code: 'MATH100', name: 'Mathematics for Data', description: '', level: 1, credits: 15 },
      { version: '1.0.0' }
    ).module!;

    dataset.modules.push(mod);
    dataset.programmes.push({
      id: 'prog-eng',
      name: 'BSc Software Engineering',
      code: 'BSE-2026',
      description: 'Undergraduate engineering award',
      modules: [{ moduleId: mod.id, version: '1.0.0' }]
    });

    const validation = storage.validateImportJSON(JSON.stringify(dataset));
    expect(validation.isValid).toBe(true);
    // Should have 0 warnings because referential integrity is preserved
    expect(validation.warnings).toHaveLength(0);
  });

  it('warns when programme references nonexistent module or nonexistent version', () => {
    const dataset = createBlankDataset();
    dataset.programmes.push({
      id: 'prog-broken',
      name: 'Broken Programme',
      code: 'BP-1',
      description: '',
      modules: [{ moduleId: 'mod-nonexistent', version: '1.0.0' }]
    });

    const validation = storage.validateImportJSON(JSON.stringify(dataset));
    expect(validation.isValid).toBe(true); // structurally valid, but surfaces referential warning
    expect(validation.warnings.some(w => w.includes('References nonexistent module'))).toBe(true);
  });

  it('migrates legacy dataset lacking schemaVersion to CURRENT_SCHEMA_VERSION', () => {
    const legacy = {
      modules: [],
      programmes: [],
      lastUpdated: '2025-01-01T00:00:00.000Z'
      // No schemaVersion
    };

    mockLocalStorage.setItem(storage.getStorageKey(), JSON.stringify(legacy));
    const loaded = storage.load();
    expect(loaded.success).toBe(true);
    expect(loaded.data?.schemaVersion).toBe(1);
  });

  it('accurately surfaces intentional integrity warnings on the original demonstration dataset', () => {
    const demo = storage.validateImportJSON(JSON.stringify(createBlankDataset()));
    expect(demo.isValid).toBe(true);
    expect(demo.warnings).toHaveLength(0);

    // Validate demoDataset with its intentional DHIP v0.9.0 broken version link
    const demoValidation = storage.validateImportJSON(JSON.stringify(demoDataset));
    expect(demoValidation.isValid).toBe(true);
    expect(demoValidation.warnings.length).toBeGreaterThan(0);
    expect(demoValidation.warnings.some(w => w.includes('References version "0.9.0"'))).toBe(true);
  });
});
