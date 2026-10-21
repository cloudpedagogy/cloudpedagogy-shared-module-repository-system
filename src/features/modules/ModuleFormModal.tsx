import React, { useState, useEffect } from 'react';
import { Module } from '../../types';
import { CanonicalModuleInput, DraftContentInput } from '../../lib/modules/moduleService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (canonical: CanonicalModuleInput, initialDraft?: DraftContentInput) => { success: boolean; errors: string[] };
  editingModule?: Module | null;
  existingModules: Module[];
}

export const ModuleFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  editingModule,
  existingModules
}) => {
  const isEdit = !!editingModule;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [credits, setCredits] = useState<number>(15);
  const [owner, setOwner] = useState('');
  const [tags, setTags] = useState('');

  // Initial draft inputs (used during creation)
  const [initialVersion, setInitialVersion] = useState('1.0.0');
  const [draftDescription, setDraftDescription] = useState('Initial draft release');
  const [outcomesText, setOutcomesText] = useState('');
  const [assessmentType, setAssessmentType] = useState('Coursework');
  const [assessmentWeight, setAssessmentWeight] = useState<number>(100);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingModule) {
      setCode(editingModule.code);
      setName(editingModule.name);
      setDescription(editingModule.description);
      setLevel(editingModule.level);
      setCredits(editingModule.credits);
      setOwner(editingModule.owner || '');
      setTags(editingModule.tags?.join(', ') || '');
      setFormErrors([]);
    } else {
      // Default blank values for creation
      setCode('');
      setName('');
      setDescription('');
      setLevel(1);
      setCredits(15);
      setOwner('');
      setTags('');
      setInitialVersion('1.0.0');
      setDraftDescription('Initial draft release');
      setOutcomesText('');
      setAssessmentType('Coursework');
      setAssessmentWeight(100);
      setFormErrors([]);
    }
  }, [editingModule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const canonical: CanonicalModuleInput = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      level: Number(level),
      credits: Number(credits),
      owner: owner.trim() || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    let initialDraft: DraftContentInput | undefined = undefined;

    if (!isEdit) {
      const outcomes = outcomesText
        .split('\n')
        .map(o => o.trim())
        .filter(Boolean);

      const assessments = assessmentType.trim()
        ? [{ type: assessmentType.trim(), weight: Number(assessmentWeight) }]
        : [];

      initialDraft = {
        version: initialVersion.trim() || '1.0.0',
        description: draftDescription.trim() || 'Initial draft version',
        outcomes,
        assessments,
        dependencies: []
      };
    }

    const result = onSubmit(canonical, initialDraft);
    if (!result.success) {
      setFormErrors(result.errors);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="module-form-title">
      <div className="modal-card" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 id="module-form-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              {isEdit ? `Edit Module Metadata: ${editingModule.code}` : 'Create Canonical Curriculum Module'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {isEdit
                ? 'Update canonical module identity and shared properties.'
                : 'Initialize a new shared module entity with its initial editable draft version.'}
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Policy notice in edit mode */}
        {isEdit && (
          <div style={{
            padding: '0.85rem',
            background: 'var(--bg-secondary)',
            borderLeft: '3px solid var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.45'
          }}>
            <strong>Important Policy Notice on Historical Metadata:</strong> In the current SMRS architecture, Module Code, Title, Credits, and Level are canonical module-level properties shared across all past, present, and future version releases. Editing them here updates the canonical identity for the entire module record across all historical views; it does <em>not</em> preserve previous historical values of code, credits, or level for earlier published releases. (A full version-specific metadata snapshot architecture is scheduled for Batch 2). Substantive curriculum content (Outcomes, Assessments, Dependencies) is version-controlled per release snapshot and remains strictly protected.
          </div>
        )}

        {/* Errors banner */}
        {formErrors.length > 0 && (
          <div style={{
            padding: '0.85rem',
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: '#991b1b', fontWeight: 700 }}>
              Please correct the following:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#b91c1c' }}>
              {formErrors.map((err, i) => (
                <li key={i} style={{ marginBottom: '0.2rem' }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Module Code *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', minWidth: 'auto' }}
                placeholder="e.g. PH101"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Module Title *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', minWidth: 'auto' }}
                placeholder="e.g. Foundations of Public Health"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Level *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="search-input"
                style={{ width: '100%', minWidth: 'auto' }}
                value={level}
                onChange={e => setLevel(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Credits *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                className="search-input"
                style={{ width: '100%', minWidth: 'auto' }}
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Owning Faculty / Department
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', minWidth: 'auto' }}
                placeholder="e.g. Faculty of Health"
                value={owner}
                onChange={e => setOwner(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Description
            </label>
            <textarea
              className="search-input"
              style={{ width: '100%', minHeight: '65px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="High-level summary of the module scope and educational intent..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Tags (comma separated)
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', minWidth: 'auto' }}
              placeholder="e.g. public health, core, quantitative"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          {/* Initial Draft Version Authoring (Creation only) */}
          {!isEdit && (
            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.25rem',
              marginTop: '1.25rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Initial Draft Version (v{initialVersion})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                New modules start in an editable draft state. You can refine learning outcomes and assessments now or later.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Learning Outcomes (one per line)
                </label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', minHeight: '75px', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="e.g. Identify core functions of public health&#10;Evaluate health policy interventions"
                  value={outcomesText}
                  onChange={e => setOutcomesText(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Initial Assessment Type
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: '100%', minWidth: 'auto' }}
                    placeholder="e.g. Essay, Examination, Practical"
                    value={assessmentType}
                    onChange={e => setAssessmentType(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="search-input"
                    style={{ width: '100%', minWidth: 'auto' }}
                    value={assessmentWeight}
                    onChange={e => setAssessmentWeight(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Save Canonical Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
