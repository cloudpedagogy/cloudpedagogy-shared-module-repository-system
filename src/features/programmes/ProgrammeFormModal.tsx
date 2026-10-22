import React, { useState, useEffect } from 'react';
import { Programme } from '../../types';
import { ProgrammeInput, validateProgrammeInputs } from '../../lib/programmes/programmeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ProgrammeInput) => { success: boolean; errors: string[] };
  editingProgramme?: Programme | null;
  existingProgrammes: Programme[];
}

export const ProgrammeFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProgramme,
  existingProgrammes
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingProgramme) {
      setCode(editingProgramme.code);
      setName(editingProgramme.name);
      setDescription(editingProgramme.description || '');
    } else {
      setCode('');
      setName('');
      setDescription('');
    }
    setErrors([]);
  }, [editingProgramme, isOpen]);

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

    const input: ProgrammeInput = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim()
    };

    const clientErrors = validateProgrammeInputs(input, editingProgramme?.id, existingProgrammes);
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    const res = onSubmit(input);
    if (!res.success) {
      setErrors(res.errors);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prog-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="metadata-row" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              <span className="metadata-label">Academic Curriculum</span>
              <span className="metadata-dot">·</span>
              <span className="metadata-label">Programme Architecture</span>
            </div>
            <h2 id="prog-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              {editingProgramme ? `Edit Programme: ${editingProgramme.code}` : 'Create Academic Programme'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Programmes assemble and reuse shared modules with specific, deliberate version pins.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button id="prog-header-submit-btn" type="button" className="btn btn-primary btn-sm" onClick={handleSubmit}>
              {editingProgramme ? 'Save Changes' : 'Create Programme'}
            </button>
            <button id="prog-header-close-btn" type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)' }}>
            {errors.map((err, i) => (
              <p key={i} style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>• {err}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="prog-code-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Programme Code <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="prog-code-input"
              type="text"
              placeholder="e.g. BSC-PH or MSC-EPID"
              className="search-input"
              style={{ width: '100%', minWidth: 'auto' }}
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="prog-name-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Programme Title / Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="prog-name-input"
              type="text"
              placeholder="e.g. BSc (Hons) Public Health Practice"
              className="search-input"
              style={{ width: '100%', minWidth: 'auto' }}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="prog-desc-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Description / Educational Rationale
            </label>
            <textarea
              id="prog-desc-input"
              rows={3}
              placeholder="Overview of programme qualification aims, target student body, or accreditation pathway..."
              className="search-input"
              style={{ width: '100%', minWidth: 'auto', resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button id="prog-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button id="prog-submit-btn" type="submit" className="btn btn-primary">
              {editingProgramme ? 'Save Changes' : 'Create Programme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
