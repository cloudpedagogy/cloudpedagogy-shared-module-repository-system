import React, { useState, useMemo } from 'react';
import { Programme, Module, RepositoryDataset } from '../../types';
import { 
  getVersionTitle, 
  getVersionCode, 
  getVersionLevel, 
  getVersionCredits 
} from '../../lib/modules/moduleService';
import { getLatestPublishedVersion, sortVersionsDescending } from '../../lib/versioning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programme: Programme;
  dataset: RepositoryDataset;
  onAddModule: (moduleId: string, versionString: string) => { success: boolean; errors: string[] };
}

export const AddModuleToProgrammeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  programme,
  dataset,
  onAddModule
}) => {
  // Modules in repository that are NOT yet in this programme
  const availableModules = useMemo(() => {
    const existingIds = new Set(programme.modules.map(m => m.moduleId));
    return dataset.modules.filter(m => !existingIds.has(m.id));
  }, [programme, dataset]);

  const [selectedModuleId, setSelectedModuleId] = useState<string>(availableModules[0]?.id || '');
  const [selectedVersionString, setSelectedVersionString] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  // Selected module object
  const selectedModule = dataset.modules.find(m => m.id === selectedModuleId) || availableModules[0];

  // Eligible versions for selected module (published or deprecated)
  const eligibleVersions = useMemo(() => {
    if (!selectedModule) return [];
    const valid = selectedModule.versions.filter(v => v.status === 'published' || v.status === 'deprecated');
    return sortVersionsDescending(valid);
  }, [selectedModule]);

  // Synchronize version selection when selected module changes
  React.useEffect(() => {
    if (eligibleVersions.length > 0) {
      const latest = eligibleVersions[0];
      setSelectedVersionString(latest.version);
    } else {
      setSelectedVersionString('');
    }
    setErrors([]);
  }, [selectedModuleId, eligibleVersions]);

  // Reset module selection on open
  React.useEffect(() => {
    if (availableModules.length > 0 && (!selectedModuleId || !availableModules.some(m => m.id === selectedModuleId))) {
      setSelectedModuleId(availableModules[0].id);
    }
  }, [availableModules, selectedModuleId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!selectedModuleId) {
      setErrors(['Please select a module to add.']);
      return;
    }

    if (!selectedVersionString) {
      setErrors(['Please select a valid published version to pin.']);
      return;
    }

    const res = onAddModule(selectedModuleId, selectedVersionString);
    if (!res.success) {
      setErrors(res.errors);
    } else {
      onClose();
    }
  };

  const selectedVersionObj = selectedModule?.versions.find(v => v.version === selectedVersionString);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-module-modal-title">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="metadata-row" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              <span className="metadata-label">{programme.code}</span>
              <span className="metadata-dot">·</span>
              <span className="metadata-label">Shared Module Assembly</span>
            </div>
            <h2 id="add-module-modal-title" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              Add Module to {programme.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Select a shared module from the repository and explicitly pin the exact published version required by this programme.
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

        {availableModules.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              All modules currently in the repository are already included in this programme.
            </p>
            <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="module-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Select Shared Module
              </label>
              <select
                id="module-select"
                className="search-input"
                style={{ width: '100%', minWidth: 'auto', padding: '0.5rem' }}
                value={selectedModuleId}
                onChange={e => setSelectedModuleId(e.target.value)}
              >
                {availableModules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code}: {m.name} (Level {m.level}, {m.credits} credits)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="version-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Select Published Version to Pin
              </label>
              {eligibleVersions.length === 0 ? (
                <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#92400e' }}>
                  This module has no published releases yet. Only published releases may be pinned to programmes.
                </div>
              ) : (
                <select
                  id="version-select"
                  className="search-input"
                  style={{ width: '100%', minWidth: 'auto', padding: '0.5rem' }}
                  value={selectedVersionString}
                  onChange={e => setSelectedVersionString(e.target.value)}
                >
                  {eligibleVersions.map(v => (
                    <option key={v.id} value={v.version}>
                      v{v.version} ({v.status.toUpperCase()}) — Released {v.releaseDate}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* PREVIEW PIN RESOLUTION */}
            {selectedModule && selectedVersionObj && (
              <div className="card" style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pinned Release Title:</span>
                  <strong>{getVersionTitle(selectedVersionObj, selectedModule)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Effective Code & Level:</span>
                  <span>{getVersionCode(selectedVersionObj, selectedModule)} · Level {getVersionLevel(selectedVersionObj, selectedModule)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Effective Credit Rating:</span>
                  <span><strong>{getVersionCredits(selectedVersionObj, selectedModule)} Credits</strong></span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={eligibleVersions.length === 0 || !selectedVersionString}
              >
                Add Module to Programme
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
