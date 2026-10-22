import React, { useState } from 'react';
import { Module, RepositoryDataset, ModuleVersion } from '../../types';
import { 
  getModuleUsage, 
  getModuleInboundDependencies, 
  getModuleOutboundDependencies,
  getModuleLatestVersion
} from '../dependencies/dependencyUtils';
import { VersionComparator } from './VersionComparator';
import { validateForPublishing, ValidationResult, sortVersionsDescending } from '../../lib/versioning';
import { 
  getVersionTitle, 
  getVersionCode, 
  getVersionLevel, 
  getVersionCredits, 
  hasDraftVersion,
  getActiveDraftVersion 
} from '../../lib/modules/moduleService';

interface Props {
  module: Module | null;
  isOpen: boolean;
  onClose: () => void;
  dataset: RepositoryDataset;
  onOpenEditMetadata?: (module: Module) => void;
  onOpenEditDraftContent?: (module: Module, version: ModuleVersion) => void;
  onOpenCreateSuccessorDraft?: (module: Module) => void;
  onOpenPublishConfirm?: (module: Module, version: ModuleVersion) => void;
  onOpenStatusTransition?: (module: Module, version: ModuleVersion, targetStatus: 'deprecated' | 'archived') => void;
  onDiscardDraft?: (moduleId: string, versionId: string) => void;
  onDeleteModule?: (moduleId: string) => void;
}

export const ModuleInspector: React.FC<Props> = ({
  module,
  isOpen,
  onClose,
  dataset,
  onOpenEditMetadata,
  onOpenEditDraftContent,
  onOpenCreateSuccessorDraft,
  onOpenPublishConfirm,
  onOpenStatusTransition,
  onDiscardDraft,
  onDeleteModule
}) => {
  const [comparisonVersionId, setComparisonVersionId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setValidationResult(null);
        setComparisonVersionId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!module) return null;

  const usage = getModuleUsage(module.id, dataset);
  const inbound = getModuleInboundDependencies(module.id, dataset);
  const latestVersionStr = getModuleLatestVersion(module.id, dataset);
  const sortedVersions = sortVersionsDescending(module.versions);
  const latestVersion = sortedVersions[0];
  const outbound = latestVersion ? getModuleOutboundDependencies(latestVersion, dataset) : [];

  const comparisonOldVersion = module.versions.find(v => v.id === comparisonVersionId);
  const comparisonNewVersion = latestVersion;

  const hasDraft = hasDraftVersion(module);
  const activeDraft = getActiveDraftVersion(module);

  const handleCheckReadiness = (v: ModuleVersion) => {
    const result = validateForPublishing(v, module);
    setValidationResult(result);
  };

  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <button 
        className="btn btn-secondary" 
        onClick={() => { onClose(); setValidationResult(null); setComparisonVersionId(null); }}
        style={{ position: 'absolute', top: '1rem', right: '1.5rem', padding: '0.4rem 0.8rem' }}
      >
        ✕ Close
      </button>

      <div style={{ marginTop: '2rem' }}>
        <div className="metadata-row" style={{ marginTop: 0 }}>
          <span className="metadata-label">Level {module.level}</span>
          <span className="metadata-dot">·</span>
          <span className="metadata-label">{module.credits} Credits</span>
          <span className="metadata-dot">·</span>
          <span className="metadata-label">v{latestVersionStr}</span>
          {hasDraft && (
            <>
              <span className="metadata-dot">·</span>
              <span className="metadata-label" style={{ color: '#10b981', fontWeight: 700 }}>Active Draft v{activeDraft?.version}</span>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.45rem', margin: 0 }}>{module.name}</h2>
            <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
              {module.code}
            </code>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {onOpenEditMetadata && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenEditMetadata(module)}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', whiteSpace: 'nowrap' }}
              >
                Edit Metadata
              </button>
            )}
            {onDeleteModule && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onDeleteModule(module.id)}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#ef4444', whiteSpace: 'nowrap' }}
              >
                Delete Module
              </button>
            )}
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: '1.5' }}>
          {module.description || 'No module description provided.'}
        </p>

        {module.owner && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Faculty / Owner: <strong>{module.owner}</strong>
          </div>
        )}

        {module.tags && module.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {module.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: '0.7rem', background: 'var(--bg-tertiary)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Governance / Lifecycle Status Banner */}
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: '1.25rem', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Governance Status
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {hasDraft ? `Active Draft (v${activeDraft?.version}) in authoring` : `Latest Release: v${latestVersion?.version} (${latestVersion?.status})`}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              background: hasDraft ? '#eff6ff' : latestVersion?.status === 'published' ? '#ecfdf5' : '#fef2f2',
              color: hasDraft ? '#1e40af' : latestVersion?.status === 'published' ? '#065f46' : '#991b1b'
            }}>
              {hasDraft ? 'Draft Active' : latestVersion?.status}
            </span>
          </div>

          {/* DIRECT DRAFT ACTIONS OR SUCCESSOR DRAFT BUTTON */}
          <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            {hasDraft && activeDraft ? (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {onOpenEditDraftContent && (
                    <button
                      type="button"
                      id="drawer-edit-draft-btn"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => onOpenEditDraftContent(module, activeDraft)}
                    >
                      ✎ Edit Draft Content
                    </button>
                  )}
                  <button
                    type="button"
                    id="drawer-check-readiness-btn"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => handleCheckReadiness(activeDraft)}
                  >
                    Check Readiness
                  </button>
                  {onOpenPublishConfirm && (
                    <button
                      type="button"
                      id="drawer-publish-release-btn"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: '#059669', borderColor: '#047857' }}
                      onClick={() => onOpenPublishConfirm(module, activeDraft)}
                    >
                      Publish Release
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Single active draft policy in effect.
                </span>
              </>
            ) : (
              onOpenCreateSuccessorDraft && (
                <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    id="drawer-create-successor-btn"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => onOpenCreateSuccessorDraft(module)}
                  >
                    + Create Successor Draft
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* VALIDATION FEEDBACK BANNER */}
        {validationResult && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            background: validationResult.isValid ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${validationResult.isValid ? '#10b981' : '#ef4444'}`
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: validationResult.isValid ? '#065f46' : '#991b1b' }}>
              {validationResult.isValid ? 'Pre-flight Validation Passed' : 'Publishing Blocked'}
            </h5>
            {validationResult.errors.map((err, i) => (
              <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#b91c1c' }}>• {err}</p>
            ))}
            {validationResult.warnings.map((warn, i) => (
              <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#92400e' }}>• {warn}</p>
            ))}
          </div>
        )}

        {/* COMPARISON VIEW */}
        {comparisonOldVersion && comparisonNewVersion && (
          <VersionComparator 
            oldVersion={comparisonOldVersion}
            newVersion={comparisonNewVersion}
            module={module}
            onClose={() => setComparisonVersionId(null)}
          />
        )}

        {/* VERSION HISTORY & SNAPSHOTS */}
        <div className="dependency-section" style={{ borderTop: '2px solid var(--border-color)', marginTop: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="section-title">Version History & Snapshots</h4>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {sortedVersions.map(v => {
              const isLatest = v.version === latestVersionStr;
              const isDraft = v.status === 'draft';
              const isPublished = v.status === 'published';
              const isDeprecated = v.status === 'deprecated';
              const isArchived = v.status === 'archived';

              const snapTitle = getVersionTitle(v, module);
              const snapCode = getVersionCode(v, module);
              const snapLevel = getVersionLevel(v, module);
              const snapCredits = getVersionCredits(v, module);

              const sourceVer = v.sourceVersionId ? module.versions.find(sv => sv.id === v.sourceVersionId) : undefined;

              return (
                <div key={v.id} className="card" style={{ padding: '1rem', marginBottom: '1rem', border: comparisonVersionId === v.id ? '1.5px solid var(--text-primary)' : isDraft ? '1.5px solid #3b82f6' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>v{v.version}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        color: isDraft ? '#1e40af' : isPublished ? '#065f46' : isDeprecated ? '#92400e' : '#475569',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '3px',
                        background: isDraft ? '#eff6ff' : isPublished ? '#ecfdf5' : isDeprecated ? '#fef3c7' : '#f1f5f9'
                      }}>
                        {isDraft ? 'Draft — Editable' : `${v.status} — Immutable`}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.releaseDate}</span>
                  </div>

                  {/* SNAPSHOT METADATA */}
                  <div className="metadata-row" style={{ marginTop: '0.2rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Level {snapLevel}</span>
                    <span className="metadata-dot">·</span>
                    <span>{snapCredits} Credits</span>
                    {(snapTitle !== module.name || snapCode !== module.code) && (
                      <>
                        <span className="metadata-dot">·</span>
                        <span>{snapCode}: {snapTitle}</span>
                      </>
                    )}
                    {sourceVer && (
                      <>
                        <span className="metadata-dot">·</span>
                        <span style={{ fontStyle: 'italic' }}>Branched from v{sourceVer.version}</span>
                      </>
                    )}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                    {v.description || 'No release description provided.'}
                  </p>
                  
                  <div className="metadata-row" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className="metadata-label">{v.outcomes?.length || 0} Outcomes</span>
                    <span className="metadata-dot">·</span>
                    <span className="metadata-label">{v.assessments?.length || 0} Assessments</span>
                    <span className="metadata-dot">·</span>
                    <span className="metadata-label">{v.dependencies?.length || 0} Dependencies</span>
                  </div>

                  {/* ACTIONS BAR */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
                    {isDraft && onOpenEditDraftContent && (
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => onOpenEditDraftContent(module, v)}
                      >
                        Edit Draft Content
                      </button>
                    )}
                    {isDraft && (
                      <button 
                        type="button"
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => handleCheckReadiness(v)}
                      >
                        Check Readiness
                      </button>
                    )}
                    {isDraft && onOpenPublishConfirm && (
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#059669', borderColor: '#047857' }}
                        onClick={() => onOpenPublishConfirm(module, v)}
                      >
                        Publish Release
                      </button>
                    )}
                    {isDraft && onDiscardDraft && module.versions.length > 1 && (
                      <button 
                        type="button"
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#ef4444' }}
                        onClick={() => onDiscardDraft(module.id, v.id)}
                      >
                        Discard Draft
                      </button>
                    )}

                    {/* STATUS TRANSITIONS FOR PUBLISHED / DEPRECATED */}
                    {isPublished && onOpenStatusTransition && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => onOpenStatusTransition(module, v, 'deprecated')}
                      >
                        Mark Deprecated
                      </button>
                    )}
                    {(isPublished || isDeprecated) && onOpenStatusTransition && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => onOpenStatusTransition(module, v, 'archived')}
                      >
                        Archive Version
                      </button>
                    )}

                    {!isLatest && (
                      <button 
                        type="button"
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => { setComparisonVersionId(v.id); setValidationResult(null); }}
                      >
                        Compare with Latest
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RELATIONAL IMPACT & DEPENDENCY ANALYSIS (COLLAPSIBLE) */}
        {!comparisonVersionId && (
          <details style={{
            marginTop: '2rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            background: 'var(--bg-secondary)'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              ▸ Relational Impact & Dependencies ({usage.length} Programme{usage.length === 1 ? '' : 's'}, {inbound.length + outbound.length} Dependencies)
            </summary>

            <div style={{ marginTop: '1rem' }}>
              <div className="dependency-section" style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                  Impact Analysis: Used by Academic Programmes ({usage.length})
                </h5>
                {usage.length > 0 ? (
                  usage.map((u, i) => {
                    const isOutdated = u.versionReferenced !== latestVersionStr;
                    const isDeprecated = module.versions.find(v => v.version === u.versionReferenced)?.status === 'deprecated';
                    const isArchived = module.versions.find(v => v.version === u.versionReferenced)?.status === 'archived';
                    return (
                      <div key={i} className="dependency-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.programmeName}</span>
                          <span style={{ fontSize: '0.85rem', color: (isDeprecated || isArchived) ? '#ef4444' : 'var(--text-muted)' }}>
                            v{u.versionReferenced}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: (isDeprecated || isArchived) ? '#ef4444' : isOutdated ? '#777' : 'var(--text-muted)', fontStyle: (isOutdated || isDeprecated || isArchived) ? 'italic' : 'normal' }}>
                          {isArchived ? 'Using archived version' : isDeprecated ? 'Using deprecated version' : isOutdated ? `Outdated reference (Registry is v${latestVersionStr})` : 'Current registry version'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not referenced by any programme.</p>
                )}
              </div>

              <div className="dependency-section" style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                  Inbound Dependencies: Modules Depending on This ({inbound.length})
                </h5>
                {inbound.length > 0 ? (
                  inbound.map((d, i) => (
                    <div key={i} className="dependency-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>{d.moduleName} ({d.moduleCode})</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.type} (v{d.versionConstraint || '1.0.0'}+)</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No other modules depend on this module.</p>
                )}
              </div>

              <div className="dependency-section">
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                  Outbound Dependencies: Declared Prerequisites (v{latestVersion?.version}) ({outbound.length})
                </h5>
                {outbound.length > 0 ? (
                  outbound.map((d, i) => (
                    <div key={i} className="dependency-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>{d.moduleName}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.type} (v{d.versionConstraint}+)</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No outbound dependencies defined.</p>
                )}
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};
