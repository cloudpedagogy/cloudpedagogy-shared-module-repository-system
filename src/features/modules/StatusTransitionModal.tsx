import React from 'react';
import { Module, ModuleVersion } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  module: Module;
  version: ModuleVersion;
  targetStatus: 'deprecated' | 'archived';
  onConfirm: (versionId: string, status: 'deprecated' | 'archived') => { success: boolean; errors: string[] };
}

export const StatusTransitionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  module,
  version,
  targetStatus,
  onConfirm
}) => {
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
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

  const isDeprecate = targetStatus === 'deprecated';

  const handleConfirm = () => {
    setErrors([]);
    const res = onConfirm(version.id, targetStatus);
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
      aria-labelledby="status-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="metadata-row" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              <span className="metadata-label">{module.code} v{version.version}</span>
              <span className="metadata-dot">·</span>
              <span className="metadata-label">Lifecycle Governance</span>
            </div>
            <h2 id="status-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              {isDeprecate ? `Mark v${version.version} as Deprecated` : `Archive Version v${version.version}`}
            </h2>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        {errors.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)' }}>
            {errors.map((err, i) => (
              <p key={i} style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>• {err}</p>
            ))}
          </div>
        )}

        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: isDeprecate ? '#fffbeb' : '#f8fafc',
          border: `1px solid ${isDeprecate ? '#f59e0b' : '#cbd5e1'}`,
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          {isDeprecate ? (
            <>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#92400e' }}>
                Governance Significance of Deprecation:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#78350f' }}>
                <li>Existing programmes pinned to v{version.version} will remain fully resolvable and continue to display this curriculum.</li>
                <li>Programme compositions using this release will display a visible governance notice advising an upgrade.</li>
                <li>Historical records and curriculum definitions remain immutable and non-destructive.</li>
              </ul>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#334155' }}>
                Governance Significance of Archiving:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#475569' }}>
                <li>This version is permanently retired from active curriculum assembly.</li>
                <li>Existing programme references remain resolvable for historical reporting, audits, and export.</li>
                <li>Programmes actively referencing this version will surface an integrity signal.</li>
                <li>Archiving does NOT delete historical records.</li>
              </ul>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{
              background: isDeprecate ? '#d97706' : '#475569',
              borderColor: isDeprecate ? '#b45309' : '#334155'
            }}
          >
            {isDeprecate ? 'Confirm Deprecation' : 'Confirm Archival'}
          </button>
        </div>
      </div>
    </div>
  );
};
