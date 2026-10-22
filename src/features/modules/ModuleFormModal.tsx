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

  const [activeStep, setActiveStep] = useState<'basic' | 'curriculum'>('basic');
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
      setActiveStep('basic');
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
      setActiveStep('basic');
    }
  }, [editingModule, isOpen]);

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
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button id="module-header-submit-btn" type="button" className="btn btn-primary btn-sm" onClick={handleSubmit}>
              {isEdit ? 'Save Changes' : 'Create Module'}
            </button>
            <button id="module-header-close-btn" type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              ✕ Close
            </button>
          </div>
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
            <strong>Canonical Module Governance:</strong> Updating canonical module metadata establishes the default baseline identity for this module. Historical published version releases preserve their frozen, version-specific metadata snapshots (title, code, credits, and level) as recorded at time of publication, ensuring past programme pins and audit trails remain historically accurate.
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

        {/* STAGED PROGRESSIVE DISCLOSURE TABS (Creation only) */}
        {!isEdit && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              id="step-basic-btn"
              onClick={() => setActiveStep('basic')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeStep === 'basic' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: activeStep === 'basic' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              1. Basic Details & Credits
            </button>
            <button
              type="button"
              id="step-curriculum-btn"
              onClick={() => setActiveStep('curriculum')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeStep === 'curriculum' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: activeStep === 'curriculum' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              2. Initial Outcomes & Assessment (Optional)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* STEP 1: BASIC DETAILS (Always shown in edit mode, shown in create mode if activeStep === 'basic') */}
          {(isEdit || activeStep === 'basic') && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="module-code-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Module Code *
                  </label>
                  <input
                    id="module-code-input"
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
                  <label htmlFor="module-name-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Module Title *
                  </label>
                  <input
                    id="module-name-input"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="module-level-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Academic Level *
                  </label>
                  <input
                    id="module-level-input"
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
                  <label htmlFor="module-credits-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Credit Rating *
                  </label>
                  <input
                    id="module-credits-input"
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
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="module-desc-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Description / Educational Overview
                </label>
                <textarea
                  id="module-desc-input"
                  className="search-input"
                  style={{ width: '100%', minHeight: '65px', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="High-level summary of the module scope and educational intent..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* COLLAPSIBLE OPTIONAL SETTINGS */}
              <details style={{
                marginBottom: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-secondary)'
              }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ▸ Optional Details: Owning Faculty & Tags
                </summary>
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="module-owner-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Owning Faculty / Department
                    </label>
                    <input
                      id="module-owner-input"
                      type="text"
                      className="search-input"
                      style={{ width: '100%', minWidth: 'auto' }}
                      placeholder="e.g. Faculty of Health"
                      value={owner}
                      onChange={e => setOwner(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="module-tags-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Tags (comma separated)
                    </label>
                    <input
                      id="module-tags-input"
                      type="text"
                      className="search-input"
                      style={{ width: '100%', minWidth: 'auto' }}
                      placeholder="e.g. public health, core, quantitative"
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                    />
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* STEP 2: INITIAL CURRICULUM (Creation only, shown when activeStep === 'curriculum') */}
          {!isEdit && activeStep === 'curriculum' && (
            <div>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <strong>Optional Initial Curriculum:</strong> New modules initialize in an editable draft state (v{initialVersion}). You can enter initial intended learning outcomes and assessment components now, or refine them later in the Draft Content Editor.
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="module-draft-outcomes-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Learning Outcomes (one per line)
                </label>
                <textarea
                  id="module-draft-outcomes-input"
                  className="search-input"
                  style={{ width: '100%', minHeight: '85px', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="e.g. Identify core functions of public health&#10;Evaluate health policy interventions"
                  value={outcomesText}
                  onChange={e => setOutcomesText(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="module-draft-assessment-type-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Initial Assessment Type
                  </label>
                  <input
                    id="module-draft-assessment-type-input"
                    type="text"
                    className="search-input"
                    style={{ width: '100%', minWidth: 'auto' }}
                    placeholder="e.g. Essay, Examination, Coursework"
                    value={assessmentType}
                    onChange={e => setAssessmentType(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="module-draft-assessment-weight-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Weight (%)
                  </label>
                  <input
                    id="module-draft-assessment-weight-input"
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

          {/* FOOTER ACTIONS */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
            position: 'sticky',
            bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 10
          }}>
            <div>
              {!isEdit && activeStep === 'curriculum' && (
                <button
                  type="button"
                  id="module-prev-step-btn"
                  className="btn btn-secondary"
                  onClick={() => setActiveStep('basic')}
                >
                  ← Back to Basic Details
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button id="module-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              {!isEdit && activeStep === 'basic' && (
                <button
                  type="button"
                  id="module-next-step-btn"
                  className="btn btn-secondary"
                  onClick={() => setActiveStep('curriculum')}
                >
                  Next: Initial Outcomes (Optional) →
                </button>
              )}
              <button id="module-submit-btn" type="submit" className="btn btn-primary">
                {isEdit ? 'Save Canonical Changes' : 'Create Module'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
