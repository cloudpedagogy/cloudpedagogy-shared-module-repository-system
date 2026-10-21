import React from 'react';

interface Props {
  isOpen: boolean;
  onCreateBlank: () => void;
  onExploreDemo: () => void;
  onOpenImport: () => void;
}

export const FirstUseModal: React.FC<Props> = ({
  isOpen,
  onCreateBlank,
  onExploreDemo,
  onOpenImport
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="first-use-title">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Welcome to CloudPedagogy
          </span>
          <h2 id="first-use-title" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            Shared Module Repository System
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
            SMRS provides a reliable, version-controlled library for authoring, tracking, and reusing curriculum modules across academic programmes. Choose how you would like to initialize your workspace:
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <button
            type="button"
            className="card first-use-option"
            onClick={onCreateBlank}
            style={{ padding: '1rem', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Create Blank Repository</strong>
              <span style={{ fontSize: '1.1rem' }}>→</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
              Start with a clean, empty repository. Ideal for authoring your own curriculum modules and programmes from scratch.
            </p>
          </button>

          <button
            type="button"
            className="card first-use-option"
            onClick={onExploreDemo}
            style={{ padding: '1rem', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Explore Demonstration Repository</strong>
              <span style={{ fontSize: '1.1rem' }}>→</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
              Load sample healthcare and public health curriculum assets, illustrating module reuse, version lag, and conflict detection.
            </p>
          </button>

          <button
            type="button"
            className="card first-use-option"
            onClick={onOpenImport}
            style={{ padding: '1rem', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Import Existing Repository</strong>
              <span style={{ fontSize: '1.1rem' }}>→</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
              Upload a previously exported SMRS JSON file to restore your modules, programmes, and governance records.
            </p>
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <small style={{ color: 'var(--text-muted)' }}>
            Your choice will be saved locally in this browser. You can export, reset, or import anytime.
          </small>
        </div>
      </div>
    </div>
  );
};
