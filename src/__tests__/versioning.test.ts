import { describe, it, expect } from 'vitest';
import { validateForPublishing, normalizeVersion, compareVersions } from '../lib/versioning';
import { Module, ModuleVersion } from '../types';

describe('Versioning & Publishing Pre-flight Checks', () => {
  const sampleModule: Module = {
    id: 'mod-1',
    code: 'M1',
    name: 'Module 1',
    description: 'Description',
    level: 1,
    credits: 15,
    versions: []
  };

  const validVersion: ModuleVersion = {
    id: 'ver-1',
    moduleId: 'mod-1',
    version: '1.0.0',
    status: 'draft',
    description: 'Comprehensive release description for this module.',
    releaseDate: '2026-01-01',
    content: 'Valid content',
    outcomes: ['Analyze public health systems'],
    assessments: [{ type: 'Essay', weight: 60 }, { type: 'Report', weight: 40 }],
    dependencies: []
  };

  it('validates a complete, compliant version as ready for publishing', () => {
    const result = validateForPublishing(validVersion, sampleModule);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('blocks publishing if assessment weights do not total 100%', () => {
    const incompleteVer: ModuleVersion = {
      ...validVersion,
      assessments: [{ type: 'Essay', weight: 70 }] // only 70%
    };
    const result = validateForPublishing(incompleteVer, sampleModule);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('must be exactly 100%'))).toBe(true);
  });

  it('blocks publishing if outcomes are missing or description is too short', () => {
    const noOutcomes: ModuleVersion = {
      ...validVersion,
      outcomes: []
    };
    const r1 = validateForPublishing(noOutcomes, sampleModule);
    expect(r1.isValid).toBe(false);
    expect(r1.errors.some(e => e.includes('at least one learning outcome'))).toBe(true);

    const shortDesc: ModuleVersion = {
      ...validVersion,
      description: 'Too short'
    };
    const r2 = validateForPublishing(shortDesc, sampleModule);
    expect(r2.isValid).toBe(false);
    expect(r2.errors.some(e => e.includes('substantive description'))).toBe(true);
  });

  it('correctly compares semantic versions', () => {
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });

  it('normalizes simplified version strings', () => {
    expect(normalizeVersion('1')).toBe('1.0.0');
    expect(normalizeVersion('1.2')).toBe('1.2.0');
    expect(normalizeVersion('2.0.1')).toBe('2.0.1');
  });
});
