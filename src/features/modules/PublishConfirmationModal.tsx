import React, { useState } from 'react';
import { Module, ModuleVersion } from '../../types';
import { validateForPublishing, ValidationResult } from '../../lib/versioning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  module: Module;
  draftVersion: ModuleVersion;
  onConfirmPublish: (versionId: string) => { success: boolean; errors: string[] };
}

export const PublishConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  module,
  draftVersion,
  onConfirmPublish
}) => {
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  if (!isOpen) return null;

  const validation: ValidationResult = validateForPublishing(draftVersion, module);
  const totalWeight = draftVersion.assessments?.reduce((sum, a) => sum + (Number(a.weight) || 0), 0) || 0;

  const handleConfirm = () => {
    setSubmitErrors([]);
    const res = onConfirmPublish(draftVersion.id);
    if (!res.success) {
      setSubmitErrors(res.errors);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
      <div className="modal-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="metadata-row" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              <span className="metadata-label">{module.code}</span>
              <span className="metadata-dot">·</span>
              <span className="metadata-label">Governance & Publishing</span>
            </div>
            <h2 id="publish-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              Publish Version v{draftVersion.version}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Publishing formalises this curriculum version and locks it as an immutable historical release.
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        {submitErrors.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)' }}>
            {submitErrors.map((err, i) => (
              <p key={i} style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>• {err}</p>
            ))}
          </div>
        )}

        {/* VALIDATION STATUS */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: validation.isValid ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${validation.isValid ? '#10b981' : '#ef4444'}`,
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: validation.isValid ? '#065f46' : '#991b1b' }}>
            {validation.isValid ? 'Pre-flight Validation Passed' : 'Publishing Blocked — Resolve Issues'}
          </h4>
          {validation.errors.map((err, i) => (
            <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#b91c1c' }}>• {err}</p>
          ))}
          {validation.warnings.map((warn, i) => (
            <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#92400e' }}>• Advisory: {warn}</p>
          ))}
        </div>

        {/* SUMMARY OF CONTENT TO BE FROZEN */}
        <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Target Release:</span>
            <strong>v{draftVersion.version}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Historical Snapshot Metadata:</span>
            <span>Level {draftVersion.level ?? module.level} · {draftVersion.credits ?? module.credits} Credits</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Learning Outcomes:</span>
            <span>{draftVersion.outcomes?.length || 0} defined</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Assessments Total Weight:</span>
            <span style={{ fontWeight: totalWeight === 100 ? 700 : 400, color: totalWeight === 100 ? '#059669' : '#dc2626' }}>
              {totalWeight}% ({draftVersion.assessments?.length || 0} components)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>Outbound Dependencies:</span>
            <span>{draftVersion.dependencies?.length || 0} declared</span>
          </div>
        </div>

        {/* IMMUTABILITY NOTICE */}
        <div style={{
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)',
          borderLeft: '3px solid var(--text-primary)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          marginBottom: '1.25rem'
        }}>
          <strong>Immutable Snapshot Notice:</strong> Once published, this version snapshot cannot be reverted to draft or modified directly. Future curriculum changes will require authoring a new successor draft (e.g. minor or major increment).
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!validation.isValid}
            onClick={handleConfirm}
            style={{ opacity: validation.isValid ? 1 : 0.5, cursor: validation.isValid ? 'pointer' : 'not-allowed' }}
          >
            Confirm & Publish Release
          </button>
        </div>
      </div>
    </div>
  );
};
