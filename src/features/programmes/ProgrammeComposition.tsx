import React from 'react';
import { Programme, RepositoryDataset } from '../../types';
import { resolveProgrammeModules } from './programmeUtils';
import { getProgrammeConflicts } from '../dependencies/dependencyUtils';

interface Props {
  programme: Programme | null;
  dataset: RepositoryDataset;
  onModuleClick: (moduleId: string) => void;
}

export const ProgrammeComposition: React.FC<Props> = ({ programme, dataset, onModuleClick }) => {
  if (!programme) {
    return (
      <div className="programme-detail" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        Select a programme to view its module composition.
      </div>
    );
  }

  const resolvedModules = resolveProgrammeModules(programme, dataset);
  const conflicts = getProgrammeConflicts(programme, dataset);
  const errors = conflicts.filter(c => c.severity === 'error');
  const warnings = conflicts.filter(c => c.severity === 'warning');

  return (
    <div className="programme-detail">
      <div className="section-header" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {programme.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '800px' }}>{programme.description}</p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <code style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{programme.code}</code>
        </div>
      </div>

      {/* CONFLICT MONITOR BANNER */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.25rem', 
          borderRadius: 'var(--radius-md)', 
          background: errors.length > 0 ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${errors.length > 0 ? '#ef4444' : '#f59e0b'}`
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: errors.length > 0 ? '#991b1b' : '#92400e' }}>
            {errors.length > 0 ? 'Versioning Integrity Errors' : 'Dependency Warnings'}
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
            {conflicts.map((c, i) => (
              <li key={i} style={{ marginBottom: '0.4rem', color: c.severity === 'error' ? '#b91c1c' : '#b45309' }}>
                <strong>{c.moduleName}:</strong> {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="composition-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 className="section-title">
          Module Sequence
        </h4>
        
        {resolvedModules.map((m, index) => {
          const modConflicts = conflicts.filter(c => c.moduleId === m.moduleId);
          const hasError = modConflicts.some(c => c.severity === 'error');
          const hasWarning = modConflicts.some(c => c.severity === 'warning');

          const metadata = [
            `v${m.version}`,
            m.isShared ? 'Shared Asset' : null,
            m.isOutdated ? `Registry Update Available (Registry at v${m.latestVersion})` : null,
            `Level ${m.level}`,
            `${m.credits} Credits`
          ].filter(Boolean);

          return (
            <div 
              key={`${m.moduleId}-${index}`} 
              className="composition-item"
              onClick={() => onModuleClick(m.moduleId)}
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1.25rem',
                border: hasError ? '1.5px solid #ef4444' : hasWarning ? '1.5px solid #f59e0b' : undefined,
                background: hasError ? '#fef2f2' : hasWarning ? '#fffbeb' : undefined
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{m.name}</span>
                  {hasError && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>VER-ERROR</span>}
                  {hasWarning && <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>DEP-WARN</span>}
                </div>
                <div className="metadata-row" style={{ marginTop: '0.2rem' }}>
                  {metadata.map((item, i) => (
                    <React.Fragment key={i}>
                      <span className="metadata-label" style={{ fontSize: '0.75rem' }}>{item}</span>
                      {i < metadata.length - 1 && <span className="metadata-dot">·</span>}
                    </React.Fragment>
                  ))}
                </div>
                <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{m.code}</code>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

