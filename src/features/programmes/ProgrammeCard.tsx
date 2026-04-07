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
      className={`programme-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ padding: '1rem', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
        <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{programme.code}</code>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{programme.modules.length} Modules</span>
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        {programme.name}
      </h3>
      <p style={{ 
        fontSize: '0.8rem', 
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
