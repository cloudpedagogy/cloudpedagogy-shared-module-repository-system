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

  const metadata = [
    `Level ${module.level}`,
    isIndependent ? 'Independent' : null,
    isHighlyReused ? 'Highly Reused' : null,
    isUnused ? 'Unused' : null,
    hasVersionLag ? 'Update Available' : null,
    `${module.versions.length} ${module.versions.length === 1 ? 'version' : 'versions'}`
  ].filter(Boolean);

  return (
    <div 
      className={`module-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="metadata-row">
        {metadata.map((item, index) => (
          <React.Fragment key={index}>
            <span className="metadata-label">{item}</span>
            {index < metadata.length - 1 && <span className="metadata-dot">·</span>}
          </React.Fragment>
        ))}
      </div>
      
      <h3 style={{ marginTop: '0.5rem', fontWeight: 600, fontSize: '1.1rem' }}>{module.name}</h3>
      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{module.code}</code>
      
      <p style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-secondary)', 
        marginTop: '0.75rem',
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
        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {usageCount} {usageCount === 1 ? 'Programme' : 'Programmes'}
        </div>
      </div>
    </div>
  );
};
