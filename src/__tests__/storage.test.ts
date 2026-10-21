import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateDatasetSchema,
  createBlankDataset,
  loadDemoDataset,
  storage,
  STORAGE_KEY
} from '../lib/storage';
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

describe('Authoritative Storage & Schema Validation', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('validates a standard demo dataset successfully', () => {
    const report = validateDatasetSchema(demoDataset);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('validates a blank dataset successfully', () => {
    const blank = createBlankDataset();
    expect(blank.modules).toHaveLength(0);
    expect(blank.programmes).toHaveLength(0);
    expect(blank.schemaVersion).toBe(1);

    const report = validateDatasetSchema(blank);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('rejects malformed datasets with descriptive errors', () => {
    // Non-object
    expect(validateDatasetSchema(null).isValid).toBe(false);
    expect(validateDatasetSchema('invalid').isValid).toBe(false);

    // Missing modules or programmes
    expect(validateDatasetSchema({}).isValid).toBe(false);
    expect(validateDatasetSchema({ modules: [] }).isValid).toBe(false);

    // Invalid module properties
    const invalidMod = {
      modules: [
        { id: '', name: 'Test', code: 'T101', level: 'four', credits: -5, versions: [] }
      ],
      programmes: []
    };
    const report = validateDatasetSchema(invalidMod);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Missing or invalid "id"'))).toBe(true);
    expect(report.errors.some(e => e.includes('"level" must be a valid number'))).toBe(true);
    expect(report.errors.some(e => e.includes('Must contain at least one version snapshot'))).toBe(true);
  });

  it('rejects duplicate module IDs and version mismatch in parent module', () => {
    const dataset = {
      modules: [
        {
          id: 'mod-1',
          name: 'Mod 1',
          code: 'M1',
          level: 1,
          credits: 15,
          versions: [
            {
              id: 'v1',
              moduleId: 'mod-DIFFERENT', // mismatch!
              version: '1.0.0',
              status: 'published',
              outcomes: [],
              assessments: [],
              dependencies: []
            }
          ]
        },
        {
          id: 'mod-1', // duplicate ID!
          name: 'Mod 1 Duplicate',
          code: 'M2',
          level: 1,
          credits: 15,
          versions: [
            {
              id: 'v2',
              moduleId: 'mod-1',
              version: '1.0.0',
              status: 'published',
              outcomes: [],
              assessments: [],
              dependencies: []
            }
          ]
        }
      ],
      programmes: []
    };

    const report = validateDatasetSchema(dataset);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Duplicate module id "mod-1"'))).toBe(true);
    expect(report.errors.some(e => e.includes('does not match parent module id'))).toBe(true);
  });

  it('saves and loads dataset through authoritative storage service', () => {
    const initialBlank = createBlankDataset();
    initialBlank.capabilityNotes = 'Test capability';
    initialBlank.governanceNotes = 'Test governance';

    const saveResult = storage.save(initialBlank);
    expect(saveResult.success).toBe(true);

    const loadResult = storage.load();
    expect(loadResult.success).toBe(true);
    expect(loadResult.data?.capabilityNotes).toBe('Test capability');
    expect(loadResult.data?.governanceNotes).toBe('Test governance');
    expect(loadResult.data?.modules).toHaveLength(0);
  });

  it('handles malformed JSON in localStorage safely without throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid json here');
    const loadResult = storage.load();
    expect(loadResult.success).toBe(false);
    expect(loadResult.error).toContain('malformed');
  });

  it('preserves existing demonstration data structure on loadDemoDataset', () => {
    const demo = loadDemoDataset();
    expect(demo.modules.length).toBeGreaterThan(0);
    expect(demo.programmes.length).toBeGreaterThan(0);
    // Mutating loaded copy should not mutate original demoDataset export
    demo.modules[0].name = 'Mutated Name';
    expect(demoDataset.modules[0].name).not.toBe('Mutated Name');
  });

  it('validates import JSON strings and detects syntax/schema errors', () => {
    // Malformed JSON string
    const badSyntax = storage.validateImportJSON('{ not json }');
    expect(badSyntax.isValid).toBe(false);
    expect(badSyntax.errors[0]).toContain('JSON syntax error');

    // Valid JSON but invalid schema
    const badSchema = storage.validateImportJSON(JSON.stringify({ random: 'data' }));
    expect(badSchema.isValid).toBe(false);
    expect(badSchema.errors.length).toBeGreaterThan(0);

    // Valid dataset
    const valid = storage.validateImportJSON(JSON.stringify(createBlankDataset()));
    expect(valid.isValid).toBe(true);
    expect(valid.dataset).toBeDefined();
  });
});
