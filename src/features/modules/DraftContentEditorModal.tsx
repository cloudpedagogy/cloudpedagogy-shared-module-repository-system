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
    }
  }, [draftVersion, module, isOpen]);

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
              Author learning outcomes, assessment components, version-specific metadata snapshots, and dependencies.
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
          {/* VERSION SNAPSHOT METADATA */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
              Release Snapshot Metadata
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Release Title
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
                  Release Code
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
                  Academic Level
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
                  Credit Rating
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

          {/* LEARNING OUTCOMES */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Intended Learning Outcomes (ILOs)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {outcomes.filter(o => o.trim()).length} outcome(s) defined (minimum 1 required for publishing)
                </span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddOutcome}>
                + Add Outcome
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                  No learning outcomes yet. Click "+ Add Outcome" to define the first one.
                </p>
              )}
            </div>
          </div>

          {/* ASSESSMENT STRUCTURE */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Assessment Strategy & Weighting
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: totalWeight === 100 ? '#10b981' : '#f59e0b'
                }}>
                  Total Weight: {totalWeight}% {totalWeight === 100 ? '✓ (Valid 100%)' : '⚠ (Must total exactly 100% to publish)'}
                </span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddAssessment}>
                + Add Assessment
              </button>
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
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                  No assessments defined. Add at least one assessment summing to 100%.
                </p>
              )}
            </div>
          </div>

          {/* DEPENDENCIES */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Curriculum Dependencies
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Prerequisites or corequisites for this module release
                </span>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                  No dependencies declared for this release.
                </p>
              )}
            </div>
          </div>

          {/* ACTIONS */}
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
