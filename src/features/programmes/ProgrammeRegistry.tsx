import React, { useState } from 'react';
import { ProgrammeCard } from './ProgrammeCard';
import { ProgrammeComposition } from './ProgrammeComposition';
import { Programme, RepositoryDataset } from '../../types';

interface Props {
  programmes: Programme[];
  dataset: RepositoryDataset;
  onModuleClick: (moduleId: string) => void;
  isDrawerOpen: boolean;
}

export const ProgrammeRegistry: React.FC<Props> = ({ programmes, dataset, onModuleClick, isDrawerOpen }) => {
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | null>(
    programmes.length > 0 ? programmes[0].id : null
  );

  const selectedProgramme = programmes.find(p => p.id === selectedProgrammeId) || null;

  return (
    <div className={`registry-layout ${isDrawerOpen ? 'with-drawer' : ''}`}>
      <div className="programme-list-sidebar">
        <h4 className="section-title" style={{ marginTop: 0 }}>
          Programmes
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {programmes.map(p => (
            <ProgrammeCard 
              key={p.id}
              programme={p}
              isSelected={p.id === selectedProgrammeId}
              onClick={() => setSelectedProgrammeId(p.id)}
            />
          ))}
        </div>
      </div>

      <div className="programme-detail">
        <ProgrammeComposition 
          programme={selectedProgramme}
          dataset={dataset}
          onModuleClick={onModuleClick}
        />
      </div>
    </div>
  );
};
