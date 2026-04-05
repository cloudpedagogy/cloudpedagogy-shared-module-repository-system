import React from 'react';
import { Programme } from '../../types';

interface Props {
  programme: Programme;
  isSelected: boolean;
  onClick: () => void;
}

export const ProgrammeCard: React.FC<Props> = ({ programme, isSelected, onClick }) => {
  return (
    <div 
      className={`summary-card programme-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <code style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>{programme.code}</code>
        <span className="badge badge-version">{programme.modules.length} Modules</span>
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
        {programme.name}
      </h3>
      <p style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-secondary)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {programme.description}
      </p>
    </div>
  );
};
