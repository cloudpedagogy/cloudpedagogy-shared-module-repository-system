import React from 'react';
import { Programme, RepositoryDataset } from '../../types';
import { resolveProgrammeModules } from './programmeUtils';
import { getProgrammeConflicts } from '../dependencies/dependencyUtils';

interface Props {
  programme: Programme | null;
  dataset: RepositoryDataset;
  onModuleClick: (moduleId: string) => void;
  onOpenAddModule?: (programme: Programme) => void;
  onOpenEditProgramme?: (programme: Programme) => void;
  onOpenRepinVersion?: (programme: Programme, moduleId: string) => void;
  onRemoveModule?: (programmeId: string, moduleId: string) => void;
  onReorderModule?: (programmeId: string, fromIndex: number, toIndex: number) => void;
  onDeleteProgramme?: (programmeId: string) => void;
}

export const ProgrammeComposition: React.FC<Props> = ({
  programme,
  dataset,
  onModuleClick,
  onOpenAddModule,
  onOpenEditProgramme,
  onOpenRepinVersion,
  onRemoveModule,
  onReorderModule,
  onDeleteProgramme
}) => {
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
        Select or create a programme to view and manage its module composition.
      </div>
    );
  }

  const resolvedModules = resolveProgrammeModules(programme, dataset);
  const conflicts = getProgrammeConflicts(programme, dataset);
  const errors = conflicts.filter(c => c.severity === 'error');
  const warnings = conflicts.filter(c => c.severity === 'warning');

  const totalCredits = resolvedModules.reduce((sum, m) => sum + (m.credits || 0), 0);

  return (
    <div className="programme-detail">
      <div className="section-header" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              {programme.name}
            </h2>
            <code style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{programme.code}</code>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', margin: 0 }}>
            {programme.description || 'No programme description provided.'}
          </p>
          <div className="metadata-row" style={{ marginTop: '0.5rem' }}>
            <span className="metadata-label">{resolvedModules.length} Modules</span>
            <span className="metadata-dot">·</span>
            <span className="metadata-label" style={{ fontWeight: 600 }}>{totalCredits} Total Credits</span>
          </div>
        </div>

        {/* PROGRAMME ACTIONS */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onOpenAddModule && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenAddModule(programme)}
            >
              + Add Module
            </button>
          )}
          {onOpenEditProgramme && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onOpenEditProgramme(programme)}
            >
              Edit Programme
            </button>
          )}
          {onDeleteProgramme && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ color: '#ef4444' }}
              onClick={() => onDeleteProgramme(programme.id)}
            >
              Delete
            </button>
          )}
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

      {/* MODULE SEQUENCE LIST */}
      <div className="composition-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 className="section-title" style={{ margin: 0 }}>
            Curriculum Sequence & Version Pins
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Modules can be reordered or individually pinned to available releases
          </span>
        </div>
        
        {resolvedModules.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
              No modules have been added to this programme yet.
            </p>
            {onOpenAddModule && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onOpenAddModule(programme)}
              >
                + Add First Module
              </button>
            )}
          </div>
        ) : (
          resolvedModules.map((m, index) => {
            const modConflicts = conflicts.filter(c => c.moduleId === m.moduleId);
            const hasError = modConflicts.some(c => c.severity === 'error') || m.isMissingModule || m.isMissingVersion;
            const hasWarning = modConflicts.some(c => c.severity === 'warning');

            const metadata = [
              `v${m.version}`,
              m.versionStatus ? `Status: ${m.versionStatus.toUpperCase()}` : null,
              m.isShared ? 'Shared Asset' : null,
              `Level ${m.level}`,
              `${m.credits} Credits`
            ].filter(Boolean);

            return (
              <div 
                key={`${m.moduleId}-${index}`} 
                className="composition-item"
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1.25rem',
                  border: hasError ? '1.5px solid #ef4444' : hasWarning ? '1.5px solid #f59e0b' : undefined,
                  background: hasError ? '#fef2f2' : hasWarning ? '#fffbeb' : undefined,
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                {/* SEQUENCE CONTROLS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                      disabled={index === 0 || !onReorderModule}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderModule?.(programme.id, index, index - 1);
                      }}
                      aria-label={`Move ${m.name} up`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                      disabled={index === resolvedModules.length - 1 || !onReorderModule}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderModule?.(programme.id, index, index + 1);
                      }}
                      aria-label={`Move ${m.name} down`}
                    >
                      ▼
                    </button>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                    #{index + 1}
                  </span>
                </div>

                {/* MODULE DETAILS */}
                <div 
                  style={{ flex: 1, minWidth: '240px', cursor: 'pointer' }}
                  onClick={() => onModuleClick(m.moduleId)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{m.name}</span>
                    {hasError && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>VER-ERROR</span>}
                    {hasWarning && <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>DEP-WARN</span>}
                    {m.isOutdated && (
                      <span style={{ fontSize: '0.7rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        Registry at v{m.latestVersion}
                      </span>
                    )}
                  </div>
                  <div className="metadata-row" style={{ marginTop: '0.2rem' }}>
                    {metadata.map((item, i) => (
                      <React.Fragment key={i}>
                        <span className="metadata-label" style={{ fontSize: '0.75rem' }}>{item}</span>
                        {i < metadata.length - 1 && <span className="metadata-dot">·</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>{m.code}</code>
                </div>

                {/* PINNING & ACTION BUTTONS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {onOpenRepinVersion && (
                    <button
                      type="button"
                      className={`btn ${m.isOutdated ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRepinVersion(programme, m.moduleId);
                      }}
                    >
                      {m.isOutdated ? 'Update Pin (v' + m.latestVersion + ')' : 'Change Pin'}
                    </button>
                  )}
                  {onRemoveModule && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: '#ef4444' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveModule(programme.id, m.moduleId);
                      }}
                      aria-label={`Remove ${m.name} from programme`}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
