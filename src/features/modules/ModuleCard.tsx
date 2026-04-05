import React from 'react';
import { Module } from '../../types';

interface Props {
  module: Module;
  isSelected: boolean;
  onClick: () => void;
  usageCount: number;
  isIndependent: boolean;
  hasVersionLag: boolean;
}

export const ModuleCard: React.FC<Props> = ({ 
  module, 
  isSelected, 
  onClick, 
  usageCount, 
  isIndependent,
  hasVersionLag 
}) => {
  const isUnused = usageCount === 0;
  const isHighlyReused = usageCount > 1;

  return (
    <div 
      className={`summary-card module-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className="badge badge-level">Level {module.level}</span>
          {isHighlyReused && <span className="badge badge-purple">Reused</span>}
          {isIndependent && <span className="badge badge-success">Independent</span>}
          {isUnused && <span className="badge badge-warning">Unused</span>}
          {hasVersionLag && <span className="badge badge-outdated" title="Some programmes are using older versions">Update Available</span>}
        </div>
        <span className="badge badge-version">{module.versions.length} Versions</span>
      </div>
      
      <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>{module.name}</h3>
      <code style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>{module.code}</code>
      
      <p style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-secondary)', 
        marginTop: '1rem',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {module.description}
      </p>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {module.credits} Credits
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: usageCount > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
          {usageCount} {usageCount === 1 ? 'Programme' : 'Programmes'}
        </div>
      </div>
    </div>
  );
};
