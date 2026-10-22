import { describe, it, expect } from 'vitest';
import { addModuleToProgramme, repinProgrammeModuleVersion } from '../lib/programmes/programmeService';
import { updateDraftVersionContent } from '../lib/modules/moduleService';
import { validateForPublishing } from '../lib/versioning';
import { validateDataset } from '../lib/validation/validator';
import { detectCircularPrerequisites } from '../features/dependencies/dependencyUtils';
import { validateDatasetSchema } from '../lib/storage';
import { RepositoryDataset, Module, Programme, ModuleVersion } from '../types';

describe('Batch 3 Educational Integrity & Quality Assurance', () => {
  const sampleModuleA: Module = {
    id: 'mod-a',
    code: 'CS101',
    name: 'Computer Systems',
    description: 'Introduction to computer systems',
    level: 4,
    credits: 15,
    versions: [
      {
        id: 'ver-a1',
        moduleId: 'mod-a',
        version: '1.0.0',
        status: 'published',
        releaseDate: '2026-01-01',
        content: 'Content 1',
        outcomes: ['Understand CPU architecture'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: []
      },
      {
        id: 'ver-a2',
        moduleId: 'mod-a',
        version: '2.0.0',
        status: 'archived',
        releaseDate: '2026-02-01',
        content: 'Content 2',
        outcomes: ['Understand distributed systems'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: []
      },
      {
        id: 'ver-a3',
        moduleId: 'mod-a',
        version: '3.0.0',
        status: 'draft',
        releaseDate: '',
        content: 'Draft content',
        outcomes: ['Understand cloud systems'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: []
      }
    ]
  };

  const sampleModuleB: Module = {
    id: 'mod-b',
    code: 'CS102',
    name: 'Programming Fundamentals',
    description: 'Introduction to programming',
    level: 4,
    credits: 15,
    versions: [
      {
        id: 'ver-b1',
        moduleId: 'mod-b',
        version: '1.0.0',
        status: 'published',
        releaseDate: '2026-01-01',
        content: 'Programming content',
        outcomes: ['Write programs'],
        assessments: [{ type: 'Coursework', weight: 100 }],
        dependencies: []
      }
    ]
  };

  const sampleProgramme: Programme = {
    id: 'prog-1',
    code: 'BSC-CS',
    name: 'BSc Computer Science',
    description: 'Computer Science degree',
    modules: [{ moduleId: 'mod-a', version: '1.0.0' }]
  };

  const sampleDataset: RepositoryDataset = {
    schemaVersion: 2,
    modules: [sampleModuleA, sampleModuleB],
    programmes: [sampleProgramme],
    lastUpdated: '2026-01-01'
  };

  describe('Programme Pinning Safeguards', () => {
    it('blocks adding an archived module version to a programme', () => {
      const emptyProg: Programme = { ...sampleProgramme, modules: [] };
      const result = addModuleToProgramme(emptyProg, 'mod-a', '2.0.0', sampleDataset);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Cannot pin archived version'))).toBe(true);
      expect(result.errors.some(e => e.includes('retired'))).toBe(true);
    });

    it('blocks adding a draft module version to a programme', () => {
      const emptyProg: Programme = { ...sampleProgramme, modules: [] };
      const result = addModuleToProgramme(emptyProg, 'mod-a', '3.0.0', sampleDataset);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Cannot pin draft version'))).toBe(true);
    });

    it('blocks repinning to an archived module version', () => {
      const result = repinProgrammeModuleVersion(sampleProgramme, 'mod-a', '2.0.0', sampleDataset);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Cannot re-pin to archived version'))).toBe(true);
    });

    it('blocks repinning to a draft module version', () => {
      const result = repinProgrammeModuleVersion(sampleProgramme, 'mod-a', '3.0.0', sampleDataset);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Cannot pin draft version'))).toBe(true);
    });
  });

  describe('Draft Content & Boundary Validation', () => {
    it('rejects self-dependencies in updateDraftVersionContent', () => {
      const result = updateDraftVersionContent(
        sampleModuleA,
        'ver-a3',
        {
          dependencies: [{ targetId: 'mod-a', type: 'prerequisite' }]
        }
      );
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('cannot declare a dependency on itself'))).toBe(true);
    });

    it('rejects duplicate dependencies in updateDraftVersionContent', () => {
      const result = updateDraftVersionContent(
        sampleModuleA,
        'ver-a3',
        {
          dependencies: [
            { targetId: 'mod-b', type: 'prerequisite' },
            { targetId: 'mod-b', type: 'corequisite' }
          ]
        }
      );
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate dependency declared on module'))).toBe(true);
    });

    it('rejects non-finite, negative, or over-100 assessment weights in updateDraftVersionContent', () => {
      const resNegative = updateDraftVersionContent(
        sampleModuleA,
        'ver-a3',
        {
          assessments: [{ type: 'Exam', weight: -10 }]
        }
      );
      expect(resNegative.success).toBe(false);
      expect(resNegative.errors.some(e => e.includes('between 0 and 100'))).toBe(true);

      const resNaN = updateDraftVersionContent(
        sampleModuleA,
        'ver-a3',
        {
          assessments: [{ type: 'Exam', weight: NaN }]
        }
      );
      expect(resNaN.success).toBe(false);
      expect(resNaN.errors.some(e => e.includes('valid number'))).toBe(true);

      const resEmptyType = updateDraftVersionContent(
        sampleModuleA,
        'ver-a3',
        {
          assessments: [{ type: '   ', weight: 50 }]
        }
      );
      expect(resEmptyType.success).toBe(false);
      expect(resEmptyType.errors.some(e => e.includes('must have a type'))).toBe(true);
    });
  });

  describe('Publishing Validation Enhancements', () => {
    it('blocks publishing when version contains duplicate dependencies', () => {
      const verWithDup: ModuleVersion = {
        id: 'v-dup',
        moduleId: 'mod-a',
        version: '1.1.0',
        status: 'draft',
        description: 'Comprehensive description that meets length requirements.',
        releaseDate: '2026-01-01',
        content: 'Content',
        outcomes: ['LO1'],
        assessments: [{ type: 'Exam', weight: 100 }],
        dependencies: [
          { targetId: 'mod-b', type: 'prerequisite' },
          { targetId: 'mod-b', type: 'corequisite' }
        ]
      };

      const result = validateForPublishing(verWithDup, sampleModuleA);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate dependency'))).toBe(true);
    });

    it('blocks publishing when assessment weight is non-finite or out of bounds', () => {
      const verBadWeight: ModuleVersion = {
        id: 'v-bad-wt',
        moduleId: 'mod-a',
        version: '1.1.0',
        status: 'draft',
        description: 'Comprehensive description that meets length requirements.',
        releaseDate: '2026-01-01',
        content: 'Content',
        outcomes: ['LO1'],
        assessments: [{ type: 'Exam', weight: 150 }],
        dependencies: []
      };

      const result = validateForPublishing(verBadWeight, sampleModuleA);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('between 0% and 100%'))).toBe(true);
    });
  });

  describe('Dataset Validation & Prerequisite Cycle Detection', () => {
    it('detects duplicate module codes in dataset', () => {
      const dataset: RepositoryDataset = {
        schemaVersion: 2,
        modules: [
          sampleModuleA,
          { ...sampleModuleB, code: 'cs101' } // Case-insensitive duplicate code
        ],
        programmes: [],
        lastUpdated: '2026-01-01'
      };

      const issues = validateDataset(dataset);
      expect(issues.some(i => i.category === 'Duplicate Code' && i.message.toLowerCase().includes('cs101'))).toBe(true);
    });

    it('detects duplicate programme codes in dataset', () => {
      const dataset: RepositoryDataset = {
        schemaVersion: 2,
        modules: [sampleModuleA],
        programmes: [
          sampleProgramme,
          { ...sampleProgramme, id: 'prog-2', name: 'Second CS' }
        ],
        lastUpdated: '2026-01-01'
      };

      const issues = validateDataset(dataset);
      expect(issues.some(i => i.category === 'Duplicate Code' && i.message.includes('BSC-CS'))).toBe(true);
    });

    it('detects duplicate module assignments within the same programme', () => {
      const dataset: RepositoryDataset = {
        schemaVersion: 2,
        modules: [sampleModuleA],
        programmes: [
          {
            ...sampleProgramme,
            modules: [
              { moduleId: 'mod-a', version: '1.0.0' },
              { moduleId: 'mod-a', version: '1.0.0' }
            ]
          }
        ],
        lastUpdated: '2026-01-01'
      };

      const issues = validateDataset(dataset);
      expect(issues.some(i => i.message.includes('Duplicate module assignment in programme'))).toBe(true);
    });

    it('detects multi-step circular prerequisite dependencies', () => {
      const mod1: Module = {
        id: 'm1',
        code: 'M1',
        name: 'Mod 1',
        description: 'D1',
        level: 4,
        credits: 15,
        versions: [{
          id: 'v1', moduleId: 'm1', version: '1.0.0', status: 'published', releaseDate: '2026-01-01', content: '', outcomes: [], assessments: [],
          dependencies: [{ targetId: 'm2', type: 'prerequisite' }]
        }]
      };
      const mod2: Module = {
        id: 'm2',
        code: 'M2',
        name: 'Mod 2',
        description: 'D2',
        level: 4,
        credits: 15,
        versions: [{
          id: 'v2', moduleId: 'm2', version: '1.0.0', status: 'published', releaseDate: '2026-01-01', content: '', outcomes: [], assessments: [],
          dependencies: [{ targetId: 'm3', type: 'prerequisite' }]
        }]
      };
      const mod3: Module = {
        id: 'm3',
        code: 'M3',
        name: 'Mod 3',
        description: 'D3',
        level: 4,
        credits: 15,
        versions: [{
          id: 'v3', moduleId: 'm3', version: '1.0.0', status: 'published', releaseDate: '2026-01-01', content: '', outcomes: [], assessments: [],
          dependencies: [{ targetId: 'm1', type: 'prerequisite' }]
        }]
      };

      const datasetWithCycle: RepositoryDataset = {
        schemaVersion: 2,
        modules: [mod1, mod2, mod3],
        programmes: [],
        lastUpdated: '2026-01-01'
      };

      const cycle = detectCircularPrerequisites(datasetWithCycle);
      expect(cycle.hasCycle).toBe(true);
      expect(cycle.cyclePath.length).toBeGreaterThanOrEqual(3);
    });

    it('rejects unsupported future schema versions in validateDatasetSchema', () => {
      const futureDataset = {
        schemaVersion: 99,
        modules: [],
        programmes: [],
        lastUpdated: '2026-01-01'
      };

      const result = validateDatasetSchema(futureDataset);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported schema version "99"'))).toBe(true);
    });
  });

  describe('Component Rendering Protection (SSR)', () => {
    it('safely renders ModuleInspector and ModuleRegistry with newly created single-draft module', async () => {
      const { renderToString } = await import('react-dom/server');
      const { createBlankDataset } = await import('../lib/storage/index');
      const { createModule } = await import('../lib/modules/moduleService');
      const { ModuleRegistry } = await import('../features/modules/ModuleRegistry');
      const { ModuleInspector } = await import('../features/modules/ModuleInspector');
      const React = await import('react');

      const dataset = createBlankDataset();
      const res = createModule({
        code: 'CS101',
        name: 'Introductory Computer Science',
        description: 'Fundamental programming concepts and problem solving.',
        level: 4,
        credits: 15
      }, {
        version: '1.0.0',
        description: 'Initial draft version',
        outcomes: ['Apply core algorithmic thinking to solve problems.', 'Write and test structured computer programs.'],
        assessments: [{ type: 'Coursework', weight: 100 }],
        dependencies: []
      }, dataset.modules);

      expect(res.success).toBe(true);
      dataset.modules.push(res.module!);

      // Test ModuleRegistry render
      const regHtml = renderToString(React.createElement(ModuleRegistry, {
        modules: dataset.modules,
        dataset,
        searchQuery: '',
        onSearchChange: () => {},
        levelFilter: 'all',
        onLevelChange: () => {},
        onResetFilters: () => {},
        selectedModuleId: res.module!.id,
        onSelectModule: () => {},
        isDrawerOpen: true,
        onOpenCreateModule: () => {},
      }));

      expect(regHtml).toContain('CS101');
      expect(regHtml).toContain('Introductory Computer Science');

      // Test ModuleInspector render
      const inspHtml = renderToString(React.createElement(ModuleInspector, {
        module: res.module!,
        isOpen: true,
        onClose: () => {},
        dataset,
      }));

      expect(inspHtml).toContain('CS101');
      expect(inspHtml).toContain('Active Draft');

      // Test ModuleInspector with demo module 0
      const { demoDataset } = await import('../data/demo/index');
      const demoInspHtml = renderToString(React.createElement(ModuleInspector, {
        module: demoDataset.modules[0],
        isOpen: true,
        onClose: () => {},
        dataset: demoDataset,
      }));
      expect(demoInspHtml).toContain('Foundations of Public Health');
    });
  });
});
