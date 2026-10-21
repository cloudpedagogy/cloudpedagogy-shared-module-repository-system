import React, { useState, useMemo } from 'react';
import { Module, ModuleVersion } from '../../types';
import { bumpVersion, compareVersions, getLatestPublishedVersion } from '../../lib/versioning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  module: Module;
  onSubmit: (sourceVersionId: string, bumpType: 'major' | 'minor' | 'patch' | 'custom', customVersion?: string, description?: string) => { success: boolean; errors: string[] };
}

export const SuccessorDraftModal: React.FC<Props> = ({
  isOpen,
  onClose,
  module,
  onSubmit
}) => {
  const publishedVersions = useMemo(() => {
    return module.versions.filter(v => v.status === 'published' || v.status === 'deprecated');
  }, [module]);

  const defaultSource = useMemo(() => {
    const latestPub = getLatestPublishedVersion(module);
    if (latestPub) return latestPub;
    return publishedVersions[publishedVersions.length - 1] || module.versions[module.versions.length - 1];
  }, [module, publishedVersions]);

  const [sourceVersionId, setSourceVersionId] = useState<string>(defaultSource?.id || '');
  const [bumpType, setBumpType] = useState<'major' | 'minor' | 'patch' | 'custom'>('minor');
  const [customVersion, setCustomVersion] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Update source if module changes
  React.useEffect(() => {
    if (defaultSource) {
      setSourceVersionId(defaultSource.id);
      setDescription(`Successor draft based on v${defaultSource.version}`);
    }
  }, [defaultSource]);

  if (!isOpen) return null;

  const selectedSource = module.versions.find(v => v.id === sourceVersionId) || defaultSource;

  const predictedVersion = selectedSource
    ? bumpType === 'custom'
      ? customVersion
      : bumpVersion(selectedSource.version, bumpType)
    : '1.0.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!selectedSource) {
      setErrors(['Please select a valid base source version.']);
      return;
    }

    if (bumpType === 'custom') {
      if (!customVersion.trim()) {
        setErrors(['Custom semantic version is required.']);
        return;
      }
      if (!/^\d+\.\d+(\.\d+)?$/.test(customVersion.trim())) {
        setErrors(['Version string must follow semantic version format (e.g. 1.2.0 or 2.0).']);
        return;
      }
      if (compareVersions(customVersion.trim(), selectedSource.version) <= 0) {
        setErrors([`Custom version (v${customVersion.trim()}) must be higher than base version (v${selectedSource.version}).`]);
        return;
      }
    }

    // Check duplicate
    if (module.versions.some(v => v.version === predictedVersion)) {
      setErrors([`Version label "v${predictedVersion}" already exists for this module.`]);
      return;
    }

    const res = onSubmit(selectedSource.id, bumpType, customVersion, description);
    if (!res.success) {
      setErrors(res.errors);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="successor-modal-title">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="metadata-row" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              <span className="metadata-label">{module.code}</span>
              <span className="metadata-dot">·</span>
              <span className="metadata-label">Module Versioning</span>
            </div>
            <h2 id="successor-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              Create Successor Draft
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Branch a new independent draft version from a published historical release. Content is cloned safely without altering published records.
            </p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="source-version-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Base Source Version
            </label>
            <select
              id="source-version-select"
              value={sourceVersionId}
              onChange={(e) => {
                setSourceVersionId(e.target.value);
                const src = module.versions.find(v => v.id === e.target.value);
                if (src) {
                  setDescription(`Successor draft based on v${src.version}`);
                }
              }}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
            >
              {publishedVersions.map(v => (
                <option key={v.id} value={v.id}>
                  v{v.version} ({v.status.toUpperCase()}) — Released {v.releaseDate} ({v.outcomes?.length || 0} outcomes, {v.assessments?.length || 0} assessments)
                </option>
              ))}
              {publishedVersions.length === 0 && module.versions.map(v => (
                <option key={v.id} value={v.id}>
                  v{v.version} ({v.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Semantic Version Increment
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {(['minor', 'major', 'patch', 'custom'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBumpType(type)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: bumpType === type ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                    background: bumpType === type ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    fontWeight: bumpType === type ? 700 : 500,
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {bumpType === 'custom' && (
            <div>
              <label htmlFor="custom-version-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Custom Semantic Version (e.g. 2.1.0)
              </label>
              <input
                id="custom-version-input"
                type="text"
                value={customVersion}
                onChange={(e) => setCustomVersion(e.target.value)}
                placeholder="e.g. 2.0.0"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>
          )}

          {/* PREVIEW BANNER */}
          <div style={{ padding: '0.75rem 1rem', background: '#eff6ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: 700 }}>New Draft Version</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
                v{predictedVersion || '...'}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#1e40af' }}>
              Source: <strong>v{selectedSource?.version}</strong>
            </div>
          </div>

          <div>
            <label htmlFor="draft-description" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Draft Purpose / Release Description
            </label>
            <textarea
              id="draft-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the educational purpose of this new curriculum revision..."
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Successor Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
