import React, { useState, useMemo } from 'react';
import { Programme, Module, RepositoryDataset } from '../../types';
import {
  getVersionTitle,
  getVersionCode,
  getVersionLevel,
  getVersionCredits
} from '../../lib/modules/moduleService';
import { sortVersionsDescending, compareVersions } from '../../lib/versioning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programme: Programme;
  moduleId: string;
  dataset: RepositoryDataset;
  onConfirmRepin: (programmeId: string, moduleId: string, newVersionString: string) => { success: boolean; errors: string[] };
}

export const RepinVersionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  programme,
  moduleId,
  dataset,
  onConfirmRepin
}) => {
  const currentRef = programme.modules.find(pm => pm.moduleId === moduleId);
  const targetModule = dataset.modules.find(m => m.id === moduleId);

  const availableVersions = useMemo(() => {
    if (!targetModule) return [];
    // Only published or deprecated releases can be pinned
    const releases = targetModule.versions.filter(v => v.status === 'published' || v.status === 'deprecated');
    return sortVersionsDescending(releases);
  }, [targetModule]);

  const [proposedVersionString, setProposedVersionString] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  // Default proposed version to the first available version that differs from the current pin
  React.useEffect(() => {
    if (availableVersions.length > 0) {
      const alternate = availableVersions.find(v => v.version !== currentRef?.version);
      setProposedVersionString(alternate ? alternate.version : availableVersions[0].version);
    }
    setErrors([]);
  }, [availableVersions, currentRef?.version, isOpen]);

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

  if (!isOpen || !targetModule || !currentRef) return null;

  const currentVersionObj = targetModule.versions.find(v => v.version === currentRef.version);
  const proposedVersionObj = targetModule.versions.find(v => v.version === proposedVersionString);

  const handleConfirm = () => {
    setErrors([]);
    if (!proposedVersionString) {
      setErrors(['Please select a target version to pin.']);
      return;
    }
    if (proposedVersionString === currentRef.version) {
      setErrors([`Programme "${programme.name}" is already pinned to v${currentRef.version}.`]);
      return;
    }

    const res = onConfirmRepin(programme.id, moduleId, proposedVersionString);
    if (!res.success) {
      setErrors(res.errors);
    } else {
      onClose();
    }
  };

  const currentCredits = getVersionCredits(currentVersionObj, targetModule);
  const proposedCredits = getVersionCredits(proposedVersionObj, targetModule);
  const currentLevel = getVersionLevel(currentVersionObj, targetModule);
  const proposedLevel = getVersionLevel(proposedVersionObj, targetModule);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repin-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="metadata-row" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              <span className="metadata-label">{programme.code}</span>
              <span className="metadata-dot">·</span>
              <span className="metadata-label">Explicit Version Pinning</span>
            </div>
            <h2 id="repin-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              Update Version Pin: {targetModule.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Review differences and explicitly update the pinned version for <strong>{programme.name}</strong>. Other academic programmes and historical releases are untouched.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              id="repin-header-confirm-btn"
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!proposedVersionString || proposedVersionString === currentRef.version}
              onClick={handleConfirm}
            >
              Update Pin
            </button>
            <button id="repin-header-close-btn" type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
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

        {/* VERSION SELECTOR */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="target-repin-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Select Target Release to Pin
          </label>
          <select
            id="target-repin-select"
            className="search-input"
            style={{ width: '100%', minWidth: 'auto', padding: '0.5rem' }}
            value={proposedVersionString}
            onChange={e => setProposedVersionString(e.target.value)}
          >
            {availableVersions.map(v => (
              <option key={v.id} value={v.version}>
                v{v.version} ({v.status.toUpperCase()}) — Released {v.releaseDate} {v.version === currentRef.version ? '(Currently Pinned)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* SIDE BY SIDE COMPARISON */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          {/* CURRENT PIN */}
          <div className="card" style={{ padding: '0.85rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Current Programme Pin
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
              v{currentRef.version}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              <div>Status: <strong>{currentVersionObj?.status?.toUpperCase() || 'UNKNOWN'}</strong></div>
              <div>Level: <strong>Level {currentLevel}</strong></div>
              <div>Credits: <strong>{currentCredits} Credits</strong></div>
              <div>Outcomes: <strong>{currentVersionObj?.outcomes?.length || 0}</strong></div>
              <div>Assessments: <strong>{currentVersionObj?.assessments?.length || 0}</strong></div>
            </div>
          </div>

          {/* PROPOSED PIN */}
          <div className="card" style={{ padding: '0.85rem', border: '1.5px solid #0284c7', background: '#f0f9ff' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#0369a1', fontWeight: 700 }}>
              Proposed New Pin
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1', marginTop: '0.25rem' }}>
              v{proposedVersionString}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#0c4a6e', marginTop: '0.5rem' }}>
              <div>Status: <strong>{proposedVersionObj?.status?.toUpperCase()}</strong></div>
              <div>
                Level: <strong>Level {proposedLevel}</strong>
                {proposedLevel !== currentLevel && <span style={{ color: '#0284c7', fontWeight: 700 }}> (Changed)</span>}
              </div>
              <div>
                Credits: <strong>{proposedCredits} Credits</strong>
                {proposedCredits !== currentCredits && <span style={{ color: '#0284c7', fontWeight: 700 }}> (Changed)</span>}
              </div>
              <div>Outcomes: <strong>{proposedVersionObj?.outcomes?.length || 0}</strong></div>
              <div>Assessments: <strong>{proposedVersionObj?.assessments?.length || 0}</strong></div>
            </div>
          </div>
        </div>

        {/* DELIBERATE PINNING EXPLANATION */}
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
          <strong>Deliberate Governance Guarantee:</strong> Updating this pin affects only programme <strong>"{programme.name}"</strong>. Any other programmes pinning <em>{targetModule.name}</em> remain on their current versions without silent propagation.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button id="repin-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            id="repin-confirm-btn"
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!proposedVersionString || proposedVersionString === currentRef.version}
          >
            Confirm & Update Pin for This Programme
          </button>
        </div>
      </div>
    </div>
  );
};
