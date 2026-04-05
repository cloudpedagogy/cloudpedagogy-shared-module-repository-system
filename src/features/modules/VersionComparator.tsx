import React from 'react';
import { ModuleVersion } from '../../types';
import { diffOutcomes, diffAssessments, diffMetadata, DiffItem } from './comparisonUtils';

interface Props {
  oldVersion: ModuleVersion;
  newVersion: ModuleVersion;
  onClose: () => void;
}

export const VersionComparator: React.FC<Props> = ({ oldVersion, newVersion, onClose }) => {
  const outcomes = diffOutcomes(oldVersion.outcomes || [], newVersion.outcomes || []);
  const assessments = diffAssessments(oldVersion.assessments || [], newVersion.assessments || []);
  const metadata = diffMetadata(oldVersion, newVersion);

  return (
    <div className="version-comparator" style={{ 
      marginTop: '2rem', 
      paddingTop: '2rem', 
      borderTop: '2px solid var(--accent-primary)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
          Comparing v{oldVersion.version} → v{newVersion.version}
        </h3>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Exit Comparison</button>
      </div>

      {/* OUTCOMES DIFF */}
      <div className="dependency-section">
        <h4>Learning Outcomes</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {outcomes.map((item, i) => (
            <div key={i} className={`comparison-card ${item.status}`}>
              <span className={`diff-label badge-${item.status}`}>{item.status}</span>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ASSESSMENTS DIFF */}
      <div className="dependency-section">
        <h4>Assessments</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {assessments.map((item, i) => (
            <div key={i} className={`comparison-card ${item.status}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={`diff-label badge-${item.status}`}>{item.status}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.value.type}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.value.weight}%</div>
                  {item.status === 'changed' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      Was {item.oldValue?.weight}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* METADATA DIFF */}
      <div className="dependency-section">
        <h4>Structural Metadata</h4>
        <div className="comparison-card">
          <div className="dependency-row">
            <span className="label">Status</span>
            <span className={`value ${metadata.statusChanged ? 'badge-changed' : 'badge-unchanged'}`}>
              {newVersion.status.toUpperCase()}
              {metadata.statusChanged && ` (was ${oldVersion.status})`}
            </span>
          </div>
          <div className="dependency-row">
            <span className="label">Release Date</span>
            <span className="value">{newVersion.releaseDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
