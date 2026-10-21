import { describe, it, expect } from 'vitest';
import {
  createModule,
  updateModuleMetadata,
  updateDraftVersionContent,
  generateModuleId,
  hasDraftVersion,
  getActiveDraftVersion
} from '../lib/modules/moduleService';
import { Module } from '../types';

describe('Canonical Module Authoring & Draft Version Protection', () => {
  it('generates collision-resistant module IDs', () => {
    const existing: Module[] = [
      { id: 'mod-abc', code: 'A1', name: 'A', level: 1, credits: 15, description: '', versions: [] }
    ];
    const id1 = generateModuleId(existing);
    const id2 = generateModuleId(existing);
    expect(id1).toMatch(/^mod-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
    expect(id1).not.toBe('mod-abc');
  });

  it('creates a new module with an initial editable draft version', () => {
    const result = createModule(
      {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Foundations of computation and algorithmic problem solving.',
        level: 1,
        credits: 15,
        owner: 'School of Computing',
        tags: ['computing', 'intro']
      },
      {
        outcomes: ['Understand binary representation', 'Implement basic algorithms'],
        assessments: [{ type: 'Exam', weight: 60 }, { type: 'Coursework', weight: 40 }]
      }
    );

    expect(result.success).toBe(true);
    expect(result.module).toBeDefined();
    const mod = result.module!;
    expect(mod.id).toMatch(/^mod-/);
    expect(mod.code).toBe('CS101');
    expect(mod.name).toBe('Introduction to Computer Science');
    expect(mod.level).toBe(1);
    expect(mod.credits).toBe(15);
    expect(mod.owner).toBe('School of Computing');
    expect(mod.tags).toEqual(['computing', 'intro']);

    // Check initial draft version
    expect(mod.versions).toHaveLength(1);
    const initialVer = mod.versions[0];
    expect(initialVer.version).toBe('1.0.0');
    expect(initialVer.status).toBe('draft');
    expect(initialVer.outcomes).toHaveLength(2);
    expect(initialVer.assessments).toHaveLength(2);
    expect(hasDraftVersion(mod)).toBe(true);
    expect(getActiveDraftVersion(mod)?.id).toBe(initialVer.id);
  });

  it('validates required fields and rejects invalid inputs', () => {
    // Missing code
    const r1 = createModule({ code: '', name: 'Test', description: '', level: 1, credits: 15 });
    expect(r1.success).toBe(false);
    expect(r1.errors.some(e => e.includes('code is required'))).toBe(true);

    // Missing title
    const r2 = createModule({ code: 'T1', name: '', description: '', level: 1, credits: 15 });
    expect(r2.success).toBe(false);
    expect(r2.errors.some(e => e.includes('title is required'))).toBe(true);

    // Invalid level
    const r3 = createModule({ code: 'T1', name: 'Test', description: '', level: 0, credits: 15 });
    expect(r3.success).toBe(false);
    expect(r3.errors.some(e => e.includes('level must be a positive number'))).toBe(true);

    // Negative credits
    const r4 = createModule({ code: 'T1', name: 'Test', description: '', level: 1, credits: -5 });
    expect(r4.success).toBe(false);
    expect(r4.errors.some(e => e.includes('Credits must be a non-negative number'))).toBe(true);
  });

  it('prevents duplicate module codes across the repository', () => {
    const existing: Module[] = [
      { id: 'mod-1', code: 'PH101', name: 'Public Health', level: 1, credits: 15, description: '', versions: [] }
    ];

    const result = createModule(
      { code: 'ph101', name: 'Duplicate Code', description: '', level: 2, credits: 20 },
      {},
      existing
    );
    expect(result.success).toBe(false);
    expect(result.errors.some(e => e.includes('already in use'))).toBe(true);
  });

  it('updates canonical metadata without modifying historical version content', () => {
    const created = createModule({ code: 'M1', name: 'Original Name', description: 'Desc', level: 1, credits: 15 }).module!;
    const originalVersionSnapshot = { ...created.versions[0] };

    const updateResult = updateModuleMetadata(created, {
      name: 'Updated Module Name',
      credits: 20
    });

    expect(updateResult.success).toBe(true);
    const updated = updateResult.module!;
    expect(updated.name).toBe('Updated Module Name');
    expect(updated.credits).toBe(20);
    // Version snapshot remains unchanged
    expect(updated.versions[0]).toEqual(originalVersionSnapshot);
  });

  it('allows editing draft version content (outcomes, assessments, description)', () => {
    const mod = createModule({ code: 'M1', name: 'Test', description: '', level: 1, credits: 15 }).module!;
    const draftId = mod.versions[0].id;

    const editResult = updateDraftVersionContent(mod, draftId, {
      description: 'Revised draft description',
      outcomes: ['New outcome 1', 'New outcome 2'],
      assessments: [{ type: 'Practical', weight: 50 }, { type: 'Report', weight: 50 }]
    });

    expect(editResult.success).toBe(true);
    const updatedMod = editResult.module!;
    const ver = updatedMod.versions[0];
    expect(ver.description).toBe('Revised draft description');
    expect(ver.outcomes).toEqual(['New outcome 1', 'New outcome 2']);
    expect(ver.assessments).toHaveLength(2);
  });

  it('STRICTLY BLOCKS editing published, deprecated, or archived version snapshots', () => {
    const publishedModule: Module = {
      id: 'mod-pub',
      code: 'PUB101',
      name: 'Published Module',
      description: '',
      level: 1,
      credits: 15,
      versions: [
        {
          id: 'ver-pub-1',
          moduleId: 'mod-pub',
          version: '1.0.0',
          status: 'published', // PUBLISHED!
          releaseDate: '2025-01-01',
          content: 'Immutable content',
          outcomes: ['Outcome 1'],
          assessments: [{ type: 'Exam', weight: 100 }],
          dependencies: []
        },
        {
          id: 'ver-dep-1',
          moduleId: 'mod-pub',
          version: '0.9.0',
          status: 'deprecated', // DEPRECATED!
          releaseDate: '2024-01-01',
          content: 'Old content',
          outcomes: ['Old Outcome'],
          assessments: [],
          dependencies: []
        }
      ]
    };

    // Attempt to edit published version
    const pubAttempt = updateDraftVersionContent(publishedModule, 'ver-pub-1', {
      outcomes: ['Maliciously changed outcome']
    });
    expect(pubAttempt.success).toBe(false);
    expect(pubAttempt.errors[0]).toContain('locked as an immutable snapshot');

    // Attempt to edit deprecated version
    const depAttempt = updateDraftVersionContent(publishedModule, 'ver-dep-1', {
      description: 'Attempted edit'
    });
    expect(depAttempt.success).toBe(false);
    expect(depAttempt.errors[0]).toContain('locked as an immutable snapshot');

    // Published module should report no editable draft
    expect(hasDraftVersion(publishedModule)).toBe(false);
    expect(getActiveDraftVersion(publishedModule)).toBeUndefined();
  });
});
