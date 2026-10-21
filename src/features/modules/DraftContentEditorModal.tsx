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
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [assessments, setAssessments] = useState<{ type: string; weight: number; description?: string }[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    if (draftVersion) {
      setDescription(draftVersion.description || '');
      setContent(draftVersion.content || '');
      setOutcomes([...(draftVersion.outcomes || [])]);
      setAssessments(draftVersion.assessments ? draftVersion.assessments.map(a => ({ ...a })) : []);
      setDependencies(draftVersion.dependencies ? draftVersion.dependencies.map(d => ({ ...d })) : []);
      setFormErrors([]);
    }
  }, [draftVersion, isOpen]);

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

    const cleanedOutcomes = outcomes.map(o => o.trim()).filter(Boolean);
    const cleanedAssessments = assessments.filter(a => a.type.trim().length > 0);

    const updates: Partial<DraftContentInput> = {
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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="draft-editor-title">
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
              Author learning outcomes, assessment components, and dependencies for this draft release.
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕ Close
          </button>
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

        <form onSubmit={handleSubmit}>
          {/* Version Description & Content */}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Learning Units / Content Outline
            </label>
            <textarea
              className="search-input"
              style={{ width: '100%', minHeight: '65px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Overview of syllabus, modules, or thematic units covered in this release..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          {/* Section: Learning Outcomes */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Learning Outcomes ({outcomes.length})
              </h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddOutcome}>
                + Add Outcome
              </button>
            </div>

            {outcomes.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No learning outcomes added yet. Click "+ Add Outcome" to define curriculum outcomes.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {outcomes.map((outcome, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '1.5rem' }}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      className="search-input"
                      style={{ flex: 1, minWidth: 'auto', fontSize: '0.85rem' }}
                      placeholder="Students will be able to..."
                      value={outcome}
                      onChange={e => handleUpdateOutcome(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRemoveOutcome(idx)}
                      title="Remove outcome"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Assessment Components */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Assessment Structure
                </h3>
                <span style={{ fontSize: '0.75rem', color: totalWeight === 100 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                  Total Weighting: {totalWeight}% {totalWeight !== 100 && '(Drafts do not require 100% until publishing)'}
                </span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddAssessment}>
                + Add Assessment
              </button>
            </div>

            {assessments.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No assessment components defined yet. Click "+ Add Assessment" to add exams, essays, or projects.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {assessments.map((a, idx) => (
                  <div key={idx} className="card" style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</label>
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%', minWidth: 'auto', fontSize: '0.85rem' }}
                        value={a.type}
                        onChange={e => handleUpdateAssessment(idx, 'type', e.target.value)}
                        placeholder="e.g. Essay"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weight (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="search-input"
                        style={{ width: '100%', minWidth: 'auto', fontSize: '0.85rem' }}
                        value={a.weight}
                        onChange={e => handleUpdateAssessment(idx, 'weight', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description (optional)</label>
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%', minWidth: 'auto', fontSize: '0.85rem' }}
                        value={a.description || ''}
                        onChange={e => handleUpdateAssessment(idx, 'description', e.target.value)}
                        placeholder="e.g. 2,000 words"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '1rem' }}
                      onClick={() => handleRemoveAssessment(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Module Dependencies */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Module Dependencies ({dependencies.length})
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddDependency}
                disabled={otherModules.length === 0}
              >
                + Add Dependency
              </button>
            </div>

            {dependencies.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No module prerequisites or corequisites defined for this version.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {dependencies.map((dep, idx) => (
                  <div key={idx} className="card" style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Module</label>
                      <select
                        className="level-select"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        value={dep.targetId}
                        onChange={e => handleUpdateDependency(idx, 'targetId', e.target.value)}
                      >
                        {otherModules.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.code} — {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Relation Type</label>
                      <select
                        className="level-select"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        value={dep.type}
                        onChange={e => handleUpdateDependency(idx, 'type', e.target.value)}
                      >
                        <option value="prerequisite">Prerequisite</option>
                        <option value="corequisite">Corequisite</option>
                        <option value="optional">Optional</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min Version</label>
                      <input
                        type="text"
                        className="search-input"
                        style={{ width: '100%', minWidth: 'auto', fontSize: '0.85rem' }}
                        value={dep.minVersion || '1.0.0'}
                        onChange={e => handleUpdateDependency(idx, 'minVersion', e.target.value)}
                        placeholder="1.0.0"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '1rem' }}
                      onClick={() => handleRemoveDependency(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Draft Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
