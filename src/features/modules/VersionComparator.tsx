import React from 'react';
import { ModuleVersion, Module } from '../../types';
import { diffOutcomes, diffAssessments, diffMetadata } from './comparisonUtils';

interface Props {
  oldVersion: ModuleVersion;
  newVersion: ModuleVersion;
  module?: Module;
  onClose: () => void;
}

export const VersionComparator: React.FC<Props> = ({ oldVersion, newVersion, module, onClose }) => {
  const outcomes = diffOutcomes(oldVersion.outcomes || [], newVersion.outcomes || []);
  const assessments = diffAssessments(oldVersion.assessments || [], newVersion.assessments || []);
  const metadata = diffMetadata(oldVersion, newVersion, module);

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

      {/* ACADEMIC METADATA SNAPSHOT DIFF */}
      {(metadata.creditsChanged || metadata.levelChanged || metadata.titleChanged || metadata.codeChanged) && (
        <div className="dependency-section">
          <h4 className="section-title">Academic Metadata Evolution</h4>
          <div className="card" style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid var(--border-color)' }}>
            {metadata.creditsChanged && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Credits:</span>
                <span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{metadata.oldCredits}</span>
                  {' → '}
                  <strong style={{ color: '#0284c7' }}>{metadata.newCredits} Credits</strong>
                </span>
              </div>
            )}
            {metadata.levelChanged && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Academic Level:</span>
                <span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>Level {metadata.oldLevel}</span>
                  {' → '}
                  <strong style={{ color: '#0284c7' }}>Level {metadata.newLevel}</strong>
                </span>
              </div>
            )}
            {metadata.titleChanged && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Title:</span>
                <span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{metadata.oldTitle}</span>
                  {' → '}
                  <strong>{metadata.newTitle}</strong>
                </span>
              </div>
            )}
            {metadata.codeChanged && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Code:</span>
                <span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{metadata.oldCode}</span>
                  {' → '}
                  <code>{metadata.newCode}</code>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* DEPENDENCIES DIFF */}
      <div className="dependency-section">
        <h4 className="section-title">Change Log: Dependencies</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {newVersion.dependencies.map((dep, i) => {
            const oldDep = oldVersion.dependencies.find(d => d.targetId === dep.targetId);
            const isNew = !oldDep;
            const isChanged = oldDep && oldDep.minVersion !== dep.minVersion;
            
            if (isNew || isChanged) {
              return (
                <div key={i} className="card" style={{ padding: '0.75rem', borderStyle: isNew ? 'dashed' : 'solid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111' }}>
                        {isNew ? '[+]' : '[Δ]'}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{dep.targetId}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem' }}>
                      v{dep.minVersion}+
                      {isChanged && <span style={{ color: '#777', fontWeight: 400 }}> (Upgraded from v{oldDep.minVersion}+)</span>}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })}
          {oldVersion.dependencies.filter(od => !newVersion.dependencies.find(nd => nd.targetId === od.targetId)).map((dep, i) => (
            <div key={`rem-${i}`} className="card" style={{ padding: '0.75rem', opacity: 0.6 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#777' }}>[-]</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, textDecoration: 'line-through' }}>{dep.targetId}</span>
              </div>
            </div>
          ))}
          {(!newVersion.dependencies.some(nd => !oldVersion.dependencies.find(od => od.targetId === nd.targetId) || oldVersion.dependencies.find(od => od.targetId === nd.targetId)?.minVersion !== nd.minVersion) && 
            !oldVersion.dependencies.some(od => !newVersion.dependencies.find(nd => nd.targetId === od.targetId))) && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No dependency changes detected.</p>
          )}
        </div>
      </div>

      {/* STRUCTURAL SIGNALS */}
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
          {newVersion.sourceVersionId && (
            <div className="dependency-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Source Lineage</span>
              <span style={{ fontSize: '0.85rem' }}>Branch from v{oldVersion.version}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
