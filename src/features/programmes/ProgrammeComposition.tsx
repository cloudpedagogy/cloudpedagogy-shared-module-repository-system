import React from 'react';
import { Programme, RepositoryDataset } from '../../types';
import { resolveProgrammeModules, ResolvedProgrammeModule } from './programmeUtils';

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
        border: '1px dashed var(--glass-border)',
        borderRadius: '16px',
        color: 'var(--text-muted)'
      }}>
        Select a programme to view its module composition.
      </div>
    );
  }

  const resolvedModules = resolveProgrammeModules(programme, dataset);

  return (
    <div className="programme-detail">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          {programme.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>{programme.description}</p>
        <div style={{ marginTop: '1rem' }}>
          <code style={{ fontSize: '1rem', color: 'var(--accent-secondary)' }}>{programme.code}</code>
        </div>
      </div>

      <div className="composition-grid">
        <h4 style={{ 
          fontFamily: 'var(--font-display)', 
          textTransform: 'uppercase', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)',
          marginBottom: '1rem'
        }}>
          Module Sequence
        </h4>
        
        {resolvedModules.map((m, index) => (
          <div 
            key={`${m.moduleId}-${index}`} 
            className="composition-item"
            onClick={() => onModuleClick(m.moduleId)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</span>
                <span className="badge badge-version">v{m.version}</span>
                {m.isShared && <span className="badge badge-shared">Shared Asset</span>}
                {m.isOutdated && (
                  <span className="badge badge-outdated">
                    Update Available (v{m.latestVersion})
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <code>{m.code}</code>
                <span>Level {m.level}</span>
                <span>{m.credits} Credits</span>
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
};
