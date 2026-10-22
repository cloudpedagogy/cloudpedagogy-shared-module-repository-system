import React, { useState, useEffect } from 'react';
import { Module, ModuleVersion, Dependency } from '../../types';
import { DraftContentInput } from '../../lib/modules/moduleService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  module: Module;
  draftVersion: ModuleVersion;
  availableModules: Module[];
  onSaveDraftContent: (versionId: string, updates: Partial<DraftContentInput>) => { success: boolean; errors: string[] };
}

export const DraftContentEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  module,
  draftVersion,
  availableModules,
  onSaveDraftContent
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState<number>(module.level);
  const [credits, setCredits] = useState<number>(module.credits);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [assessments, setAssessments] = useState<{ type: string; weight: number; description?: string }[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  type DraftTab = 'outcomes' | 'assessments' | 'dependencies' | 'snapshot';
  const [activeTab, setActiveTab] = useState<DraftTab>('outcomes');

  const tabOrder: DraftTab[] = ['outcomes', 'assessments', 'dependencies', 'snapshot'];
  const currentTabIndex = tabOrder.indexOf(activeTab);

  const handlePrevTab = () => {
    if (currentTabIndex > 0) setActiveTab(tabOrder[currentTabIndex - 1]);
  };

  const handleNextTab = () => {
    if (currentTabIndex < tabOrder.length - 1) setActiveTab(tabOrder[currentTabIndex + 1]);
  };

  useEffect(() => {
    if (draftVersion) {
      setTitle(draftVersion.title !== undefined ? draftVersion.title : module.name);
      setCode(draftVersion.code !== undefined ? draftVersion.code : module.code);
      setLevel(draftVersion.level !== undefined ? draftVersion.level : module.level);
      setCredits(draftVersion.credits !== undefined ? draftVersion.credits : module.credits);
      setDescription(draftVersion.description || '');
      setContent(draftVersion.content || '');
      setOutcomes([...(draftVersion.outcomes || [])]);
      setAssessments(draftVersion.assessments ? draftVersion.assessments.map(a => ({ ...a })) : []);
      setDependencies(draftVersion.dependencies ? draftVersion.dependencies.map(d => ({ ...d })) : []);
      setFormErrors([]);
      setActiveTab('outcomes');
    }
  }, [draftVersion, module, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Outcomes helpers
  const handleAddOutcome = () => {
    setOutcomes([...outcomes, '']);
  };

  const handleUpdateOutcome = (index: number, val: string) => {
    const updated = [...outcomes];
    updated[index] = val;
    setOutcomes(updated);
  };

  const handleRemoveOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  // Assessments helpers
  const handleAddAssessment = () => {
    setAssessments([...assessments, { type: 'Coursework', weight: 50, description: '' }]);
  };

  const handleUpdateAssessment = (index: number, field: 'type' | 'weight' | 'description', val: any) => {
    const updated = [...assessments];
    updated[index] = {
      ...updated[index],
      [field]: field === 'weight' ? Number(val) : val
    };
    setAssessments(updated);
  };

  const handleRemoveAssessment = (index: number) => {
    setAssessments(assessments.filter((_, i) => i !== index));
  };

  // Dependencies helpers
  const handleAddDependency = () => {
    const candidate = availableModules.find(m => m.id !== module.id);
    if (!candidate) return;
    setDependencies([...dependencies, { targetId: candidate.id, type: 'prerequisite', minVersion: '1.0.0' }]);
  };

  const handleUpdateDependency = (index: number, field: keyof Dependency, val: any) => {
    const updated = [...dependencies];
    updated[index] = { ...updated[index], [field]: val };
    setDependencies(updated);
  };

  const handleRemoveDependency = (index: number) => {
    setDependencies(dependencies.filter((_, i) => i !== index));
  };

  const totalWeight = assessments.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    // Validate dependencies
    const seenDeps = new Set<string>();
    for (const d of dependencies) {
      if (d.targetId === module.id) {
        setActiveTab('dependencies');
        setFormErrors(['[Dependencies] A module cannot depend on itself (self-dependency is rejected).']);
        return;
      }
      if (seenDeps.has(d.targetId)) {
        setActiveTab('dependencies');
        setFormErrors(['[Dependencies] Duplicate dependency declared on the same module.']);
        return;
      }
      seenDeps.add(d.targetId);
    }

    // Validate assessments
    for (const a of assessments) {
      if (!a.type || !a.type.trim()) {
        setActiveTab('assessments');
        setFormErrors(['[Assessments] All assessment components must specify an assessment type (e.g. Exam, Coursework).']);
        return;
      }
      if (typeof a.weight !== 'number' || isNaN(a.weight) || !isFinite(a.weight) || a.weight < 0 || a.weight > 100) {
        setActiveTab('assessments');
        setFormErrors(['[Assessments] Assessment weights must be valid numbers between 0% and 100%.']);
        return;
      }
    }

    const cleanedOutcomes = outcomes.map(o => o.trim()).filter(Boolean);
    const cleanedAssessments = assessments.filter(a => a.type.trim().length > 0);

    const updates: Partial<DraftContentInput> = {
      title: title.trim(),
      code: code.trim(),
      level: Number(level),
      credits: Number(credits),
      description: description.trim(),
      content: content.trim(),
      outcomes: cleanedOutcomes,
      assessments: cleanedAssessments,
      dependencies
    };

    const result = onSaveDraftContent(draftVersion.id, updates);
    if (!result.success) {
      setFormErrors(result.errors);
    } else {
      onClose();
    }
  };

  const otherModules = availableModules.filter(m => m.id !== module.id);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-editor-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="metadata-row" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              <span className="metadata-label" style={{ fontWeight: 700, color: '#10b981' }}>DRAFT — IN PROGRESS</span>
              <span className="metadata-dot">·</span>
              <span className="metadata-label">{module.code} v{draftVersion.version}</span>
            </div>
            <h2 id="draft-editor-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              Edit Draft Curriculum Content
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Author learning outcomes, assessment components, version-specific metadata snapshots, and dependencies.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button id="draft-header-save-btn" type="button" className="btn btn-primary btn-sm" onClick={handleSubmit}>
              Save Draft
            </button>
            <button id="draft-header-close-btn" type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {formErrors.length > 0 && (
          <div style={{
            padding: '0.85rem',
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem'
          }}>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#b91c1c' }}>
              {formErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* STAGED PROGRESSIVE DISCLOSURE TABS */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            id="draft-tab-outcomes"
            onClick={() => setActiveTab('outcomes')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'outcomes' ? 'var(--text-primary)' : 'var(--bg-secondary)',
              color: activeTab === 'outcomes' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            1. Learning Outcomes ({outcomes.filter(o => o.trim()).length})
          </button>
          <button
            type="button"
            id="draft-tab-assessments"
            onClick={() => setActiveTab('assessments')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'assessments' ? 'var(--text-primary)' : 'var(--bg-secondary)',
              color: activeTab === 'assessments' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            2. Assessments ({totalWeight}%)
          </button>
          <button
            type="button"
            id="draft-tab-dependencies"
            onClick={() => setActiveTab('dependencies')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'dependencies' ? 'var(--text-primary)' : 'var(--bg-secondary)',
              color: activeTab === 'dependencies' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            3. Dependencies ({dependencies.length})
          </button>
          <button
            type="button"
            id="draft-tab-snapshot"
            onClick={() => setActiveTab('snapshot')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'snapshot' ? 'var(--text-primary)' : 'var(--bg-secondary)',
              color: activeTab === 'snapshot' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            4. Snapshot Metadata & Outline (Advanced)
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* TAB 1: LEARNING OUTCOMES */}
          {activeTab === 'outcomes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Intended Learning Outcomes (ILOs)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Define what students will know, understand, or demonstrate. Minimum 1 outcome is required to publish.
                  </p>
                </div>
                <button id="btn-add-outcome" type="button" className="btn btn-secondary btn-sm" onClick={handleAddOutcome}>
                  + Add Outcome
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {outcomes.map((outcome, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '24px' }}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      className="search-input"
                      style={{ flex: 1, minWidth: 'auto' }}
                      placeholder="e.g. Critically evaluate epidemiological indicators for disease surveillance"
                      value={outcome}
                      onChange={e => handleUpdateOutcome(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRemoveOutcome(idx)}
                      style={{ padding: '0.35rem 0.6rem', color: '#ef4444' }}
                      aria-label={`Remove outcome ${idx + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {outcomes.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      No learning outcomes defined yet. Click <strong>"+ Add Outcome"</strong> to add the first intended outcome.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSESSMENTS & WEIGHTING */}
          {activeTab === 'assessments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Assessment Strategy & Component Weights
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Define assessment methods. If assessed, component weights must sum to exactly 100% for publication.
                  </p>
                </div>
                <button id="btn-add-assessment" type="button" className="btn btn-secondary btn-sm" onClick={handleAddAssessment}>
                  + Add Assessment
                </button>
              </div>

              {/* Weight indicator banner */}
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                background: totalWeight === 100 ? '#ecfdf5' : '#fffbeb',
                border: `1px solid ${totalWeight === 100 ? '#10b981' : '#f59e0b'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: totalWeight === 100 ? '#065f46' : '#92400e' }}>
                  Total Component Weight: {totalWeight}%
                </span>
                <span style={{ fontSize: '0.8rem', color: totalWeight === 100 ? '#065f46' : '#92400e' }}>
                  {totalWeight === 100 ? '✓ Ready for publishing' : '⚠ Must total 100% before publishing'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {assessments.map((a, idx) => (
                  <div key={idx} className="card" style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        Type
                      </label>
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%', minWidth: 'auto', padding: '0.4rem' }}
                        placeholder="e.g. Written Exam, Coursework"
                        value={a.type}
                        onChange={e => handleUpdateAssessment(idx, 'type', e.target.value)}
                      />
                    </div>
                    <div style={{ width: '90px' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        Weight (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="search-input"
                        style={{ width: '100%', minWidth: 'auto', padding: '0.4rem' }}
                        value={a.weight}
                        onChange={e => handleUpdateAssessment(idx, 'weight', e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 3 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%', minWidth: 'auto', padding: '0.4rem' }}
                        placeholder="e.g. 2,500 word case report"
                        value={a.description || ''}
                        onChange={e => handleUpdateAssessment(idx, 'description', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRemoveAssessment(idx)}
                      style={{ marginTop: '1.1rem', color: '#ef4444', padding: '0.4rem 0.6rem' }}
                      aria-label={`Remove assessment ${a.type || idx + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {assessments.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      No assessments defined. Add assessment components totaling 100%, or leave unassessed for an advisory unit.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CURRICULUM DEPENDENCIES */}
          {activeTab === 'dependencies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Curriculum Dependencies & Prerequisites
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Declare modules students must complete before or alongside this release. Optional: leave empty if none.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddDependency}
                  disabled={otherModules.length === 0}
                >
                  + Add Dependency
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {dependencies.map((dep, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="search-input"
                      style={{ flex: 3, minWidth: 'auto', padding: '0.4rem' }}
                      value={dep.targetId}
                      onChange={e => handleUpdateDependency(idx, 'targetId', e.target.value)}
                    >
                      {otherModules.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.code}: {m.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="search-input"
                      style={{ flex: 2, minWidth: 'auto', padding: '0.4rem' }}
                      value={dep.type}
                      onChange={e => handleUpdateDependency(idx, 'type', e.target.value)}
                    >
                      <option value="prerequisite">Prerequisite</option>
                      <option value="corequisite">Corequisite</option>
                      <option value="optional">Optional / Recommended</option>
                    </select>

                    <input
                      type="text"
                      className="search-input"
                      style={{ width: '90px', minWidth: 'auto', padding: '0.4rem' }}
                      placeholder="Min v (e.g. 1.0.0)"
                      value={dep.minVersion || ''}
                      onChange={e => handleUpdateDependency(idx, 'minVersion', e.target.value)}
                    />

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRemoveDependency(idx)}
                      style={{ color: '#ef4444', padding: '0.4rem 0.6rem' }}
                      aria-label={`Remove dependency ${idx + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {dependencies.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      No prerequisite dependencies declared for this release.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VERSION SNAPSHOT & OUTLINE */}
          {activeTab === 'snapshot' && (
            <div>
              <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-color)'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Release Snapshot Metadata Overrides
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  These values freeze permanently with this version snapshot at publication, ensuring past programme pins retain exact historical credit and level ratings.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Release Title Override
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ width: '100%', minWidth: 'auto' }}
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Release Code Override
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ width: '100%', minWidth: 'auto' }}
                      value={code}
                      onChange={e => setCode(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Academic Level Override
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="search-input"
                      style={{ width: '100%', minWidth: 'auto' }}
                      value={level}
                      onChange={e => setLevel(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Credit Rating Override
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="search-input"
                      style={{ width: '100%', minWidth: 'auto' }}
                      value={credits}
                      onChange={e => setCredits(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Release Description / Change Summary
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', minWidth: 'auto' }}
                  placeholder="e.g. Updated learning outcomes for modern public health practice"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Learning Units / Content Outline
                </label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', minHeight: '85px', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Overview of syllabus, modules, or thematic units covered in this release..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DRAFT PROGRESS & READINESS STRIP */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.85rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.78rem',
            marginTop: '1.25rem',
            marginBottom: '0.5rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>
                <strong>Outcomes:</strong>{' '}
                <span style={{ color: outcomes.filter(o => o.trim()).length > 0 ? '#059669' : '#dc2626' }}>
                  {outcomes.filter(o => o.trim()).length > 0 ? `✓ ${outcomes.filter(o => o.trim()).length} defined` : '⚠ None'}
                </span>
              </span>
              <span>
                <strong>Assessments:</strong>{' '}
                <span style={{ color: totalWeight === 100 ? '#059669' : '#d97706' }}>
                  {totalWeight === 100 ? '✓ 100% allocated' : `${totalWeight}% (100% required)`}
                </span>
              </span>
              <span>
                <strong>Dependencies:</strong> {dependencies.length} declared
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {outcomes.filter(o => o.trim()).length > 0 && totalWeight === 100 ? '✓ Ready to publish' : 'Draft in progress'}
            </span>
          </div>

          {/* ACTIONS */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
            position: 'sticky',
            bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {currentTabIndex > 0 && (
                <button
                  type="button"
                  id="draft-prev-step-btn"
                  className="btn btn-secondary"
                  onClick={handlePrevTab}
                >
                  ← Previous Section
                </button>
              )}
              {currentTabIndex < tabOrder.length - 1 && (
                <button
                  type="button"
                  id="draft-next-step-btn"
                  className="btn btn-secondary"
                  onClick={handleNextTab}
                >
                  Next Section →
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button id="draft-content-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button id="draft-content-save-btn" type="submit" className="btn btn-primary">
                Save Draft Content
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
