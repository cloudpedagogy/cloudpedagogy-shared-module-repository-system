import React, { useState } from 'react';
import { RepositoryDataset } from '../types';
import { storage } from '../lib/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (importedDataset: RepositoryDataset) => void;
}

export const ImportModal: React.FC<Props> = ({ isOpen, onClose, onConfirmImport }) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validatedData, setValidatedData] = useState<RepositoryDataset | null>(null);
  const [warningsAcknowledged, setWarningsAcknowledged] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setWarningsAcknowledged(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      validateContent(text);
    };
    reader.readAsText(file);
  };

  const validateContent = (text: string) => {
    const report = storage.validateImportJSON(text);
    setWarningsAcknowledged(false);
    if (!report.isValid) {
      setErrors(report.errors);
      setWarnings(report.warnings || []);
      setValidatedData(null);
    } else {
      setErrors([]);
      setWarnings(report.warnings || []);
      setValidatedData(report.dataset || null);
    }
  };

  const handleImportSubmit = () => {
    if (!validatedData) return;
    if (warnings.length > 0 && !warningsAcknowledged) return;
    onConfirmImport(validatedData);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setFileContent('');
    setFileName('');
    setErrors([]);
    setWarnings([]);
    setValidatedData(null);
    setWarningsAcknowledged(false);
    onClose();
  };

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isFullyValid = validatedData !== null && !hasErrors && !hasWarnings;
  const isImportEnabled = validatedData !== null && (!hasWarnings || warningsAcknowledged);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 id="import-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Import Repository Dataset
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Select an SMRS JSON export file to restore or load curriculum assets.
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetAndClose}>
            ✕ Close
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Choose JSON file
          </label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.65rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              fontSize: '0.85rem'
            }}
          />
          {fileName && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
              Selected file: {fileName}
            </span>
          )}
        </div>

        {/* State 1: Malformed / Schema Incompatible (Strictly Blocked) */}
        {hasErrors && (
          <div style={{
            padding: '1rem',
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#991b1b', fontWeight: 700 }}>
              Import Blocked: Incompatible Schema or Malformed File ({errors.length})
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#7f1d1d', margin: '0 0 0.5rem 0' }}>
              This file does not match the required SMRS dataset structure and cannot be imported. Existing repository data has been preserved.
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#b91c1c' }}>
              {errors.slice(0, 5).map((err, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{err}</li>
              ))}
              {errors.length > 5 && (
                <li>...and {errors.length - 5} more schema issues.</li>
              )}
            </ul>
          </div>
        )}

        {/* State 2: Structurally Valid with Referential Integrity Warnings */}
        {!hasErrors && validatedData && hasWarnings && (
          <div style={{
            padding: '1rem',
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: '#92400e', fontWeight: 700 }}>
              Structurally Valid with Referential Warnings ({warnings.length})
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#78350f', margin: '0 0 0.5rem 0' }}>
              The dataset structure is valid, but contains references to unresolved modules or version snapshots (such as intentional demonstration warnings):
            </p>
            <ul style={{ margin: '0 0 0.85rem 0', paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#b45309' }}>
              {warnings.map((warn, i) => (
                <li key={i} style={{ marginBottom: '0.2rem' }}>{warn}</li>
              ))}
            </ul>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#92400e', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={warningsAcknowledged}
                onChange={e => setWarningsAcknowledged(e.target.checked)}
                style={{ marginTop: '0.15rem' }}
              />
              <span>I acknowledge that this dataset contains unresolved module or version references and confirm importing it.</span>
            </label>
          </div>
        )}

        {/* State 3: Fully Valid Dataset */}
        {isFullyValid && (
          <div style={{
            padding: '1rem',
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: '#065f46', fontWeight: 700 }}>
              Dataset Fully Validated (0 Issues)
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#047857', margin: 0 }}>
              All modules, versions, and programme relationships satisfy referential and structural integrity checks.
            </p>
          </div>
        )}

        {/* Dataset Summary & Overwrite Notice */}
        {validatedData && (
          <div style={{
            padding: '1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600 }}>
              Dataset Summary
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem' }}>
              <span><strong>{validatedData.modules.length}</strong> Modules</span>
              <span><strong>{validatedData.programmes.length}</strong> Programmes</span>
              <span>Schema v{validatedData.schemaVersion || 1}</span>
            </div>

            <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--border-color)' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#b45309', fontWeight: 500 }}>
                ⚠️ Notice: Importing will replace your current repository dataset in this browser. Ensure any unsaved work has been exported.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handleResetAndClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isImportEnabled}
            onClick={handleImportSubmit}
          >
            {hasWarnings ? 'Acknowledge Warnings & Import Repository' : 'Confirm & Import Repository'}
          </button>
        </div>
      </div>
    </div>
  );
};
