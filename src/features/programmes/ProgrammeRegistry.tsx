import React, { useState, useEffect } from 'react';
import { ProgrammeCard } from './ProgrammeCard';
import { ProgrammeComposition } from './ProgrammeComposition';
import { Programme, RepositoryDataset } from '../../types';

interface Props {
  programmes: Programme[];
  dataset: RepositoryDataset;
  onModuleClick: (moduleId: string) => void;
  isDrawerOpen: boolean;
  onOpenCreateProgramme?: () => void;
  onOpenEditProgramme?: (programme: Programme) => void;
  onOpenAddModule?: (programme: Programme) => void;
  onOpenRepinVersion?: (programme: Programme, moduleId: string) => void;
  onRemoveModule?: (programmeId: string, moduleId: string) => void;
  onReorderModule?: (programmeId: string, fromIndex: number, toIndex: number) => void;
  onDeleteProgramme?: (programmeId: string) => void;
}

export const ProgrammeRegistry: React.FC<Props> = ({
  programmes,
  dataset,
  onModuleClick,
  isDrawerOpen,
  onOpenCreateProgramme,
  onOpenEditProgramme,
  onOpenAddModule,
  onOpenRepinVersion,
  onRemoveModule,
  onReorderModule,
  onDeleteProgramme
}) => {
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | null>(
    programmes.length > 0 ? programmes[0].id : null
  );

  useEffect(() => {
    if (programmes.length > 0) {
      if (!selectedProgrammeId || !programmes.some(p => p.id === selectedProgrammeId)) {
        setSelectedProgrammeId(programmes[0].id);
      }
    } else {
      setSelectedProgrammeId(null);
    }
  }, [programmes, selectedProgrammeId]);

  const selectedProgramme = programmes.find(p => p.id === selectedProgrammeId) || null;

  return (
    <div className={`registry-layout ${isDrawerOpen ? 'with-drawer' : ''}`}>
      <div className="programme-list-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 className="section-title" style={{ margin: 0 }}>
            Programmes ({programmes.length})
          </h4>
          {onOpenCreateProgramme && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
              onClick={onOpenCreateProgramme}
            >
              + Create Programme
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {programmes.map(p => (
            <ProgrammeCard 
              key={p.id}
              programme={p}
              isSelected={p.id === selectedProgrammeId}
              onClick={() => setSelectedProgrammeId(p.id)}
            />
          ))}
          {programmes.length === 0 && (
            <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                No academic programmes exist yet.
              </p>
              {onOpenCreateProgramme && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onOpenCreateProgramme}
                >
                  Create First Programme
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="programme-detail">
        <ProgrammeComposition 
          programme={selectedProgramme}
          dataset={dataset}
          onModuleClick={onModuleClick}
          onOpenAddModule={onOpenAddModule}
          onOpenEditProgramme={onOpenEditProgramme}
          onOpenRepinVersion={onOpenRepinVersion}
          onRemoveModule={onRemoveModule}
          onReorderModule={onReorderModule}
          onDeleteProgramme={onDeleteProgramme}
        />
      </div>
    </div>
  );
};
