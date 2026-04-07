import React from 'react';
import { ModuleVersion } from '../../types';
import { diffOutcomes, diffAssessments, diffMetadata } from './comparisonUtils';

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
      paddingTop: '1.5rem', 
      borderTop: '1.5px solid var(--text-primary)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
          Comparison: v{oldVersion.version} → v{newVersion.version}
        </h3>
        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }} onClick={onClose}>Exit Comparison</button>
      </div>

      {/* OUTCOMES DIFF */}
      <div className="dependency-section">
        <h4 className="section-title">Change Log: Outcomes</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {outcomes.map((item, i) => (
            <div key={i} className="card" style={{ padding: '0.75rem', borderStyle: item.status === 'added' ? 'dashed' : 'solid' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  color: item.status === 'added' ? '#111' : '#777',
                  minWidth: '1.5rem'
                }}>
                  {item.status === 'added' ? '[+]' : '[-]'}
                </span>
                <p style={{ 
                  fontSize: '0.85rem', 
                  margin: 0, 
                  textDecoration: item.status === 'removed' ? 'line-through' : 'none',
                  color: item.status === 'removed' ? 'var(--text-muted)' : 'var(--text-primary)'
                }}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
          {outcomes.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No outcome changes detected.</p>}
        </div>
      </div>

      {/* ASSESSMENTS DIFF */}
      <div className="dependency-section">
        <h4 className="section-title">Change Log: Assessments</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {assessments.map((item, i) => (
            <div key={i} className="card" style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111' }}>
                    {item.status === 'added' ? '[+]' : item.status === 'removed' ? '[-]' : '[Δ]'}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.value.type}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{item.value.weight}%</div>
                  {item.status === 'changed' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      Formerly {item.oldValue?.weight}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {assessments.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No assessment changes detected.</p>}
        </div>
      </div>

      {/* METADATA DIFF */}
      <div className="dependency-section">
        <h4 className="section-title">Structural Signals</h4>
        <div className="card" style={{ padding: '0.75rem' }}>
          <div className="dependency-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Release Status</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {newVersion.status.toUpperCase()}
              {metadata.statusChanged && <span style={{ fontWeight: 400, color: '#777' }}> (Changed from {oldVersion.status})</span>}
            </span>
          </div>
          <div className="dependency-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Effective Release Date</span>
            <span style={{ fontSize: '0.85rem' }}>{newVersion.releaseDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
