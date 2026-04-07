import React from 'react';
import { Programme, RepositoryDataset } from '../../types';
import { resolveProgrammeModules } from './programmeUtils';

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

  return (
    <div className="programme-detail">
      <div className="section-header" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {programme.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '800px' }}>{programme.description}</p>
        <div style={{ marginTop: '0.75rem' }}>
          <code style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{programme.code}</code>
        </div>
      </div>

      <div className="composition-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 className="section-title">
          Module Sequence
        </h4>
        
        {resolvedModules.map((m, index) => {
          const metadata = [
            `v${m.version}`,
            m.isShared ? 'Shared Asset' : null,
            m.isOutdated ? `Update Available (Registry at v${m.latestVersion})` : null,
            `Level ${m.level}`,
            `${m.credits} Credits`
          ].filter(Boolean);

          return (
            <div 
              key={`${m.moduleId}-${index}`} 
              className="composition-item"
              onClick={() => onModuleClick(m.moduleId)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{m.name}</span>
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
