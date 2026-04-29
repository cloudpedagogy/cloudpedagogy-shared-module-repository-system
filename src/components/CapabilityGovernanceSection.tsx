import React, { useState } from 'react';
import { RepositoryDataset } from '../types';

interface Props {
  dataset: RepositoryDataset;
  onUpdate: (updates: Partial<RepositoryDataset>) => void;
}

export const CapabilityGovernanceSection: React.FC<Props> = ({ dataset, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      borderTop: '1px solid var(--border-color, #e5e7eb)',
      padding: '1rem',
      backgroundColor: 'var(--bg-secondary, #f9fafb)',
      marginTop: 'auto'
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary, #4b5563)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: 0,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
        Capability & Governance Notes (Optional)
      </button>
      
      {isExpanded && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #4b5563)', marginBottom: '0.25rem' }}>
              Capability Support
            </label>
            <textarea
              value={dataset.capabilityNotes || ''}
              onChange={(e) => onUpdate({ capabilityNotes: e.target.value })}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '0.5rem',
                fontSize: '0.8rem',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #111827)',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Optional: What capability this supports, suggested AI use pattern, next steps..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #4b5563)', marginBottom: '0.25rem' }}>
              Governance Notes
            </label>
            <textarea
              value={dataset.governanceNotes || ''}
              onChange={(e) => onUpdate({ governanceNotes: e.target.value })}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '0.5rem',
                fontSize: '0.8rem',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #111827)',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Optional: Visibility of AI use, rationale, risks, assumptions, review notes..."
            />
          </div>
        </div>
      )}
    </div>
  );
};
