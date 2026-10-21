import React, { useState } from 'react';
import { Module, RepositoryDataset, ModuleVersion } from '../../types';
import { 
  getModuleUsage, 
  getModuleInboundDependencies, 
  getModuleOutboundDependencies,
  getModuleLatestVersion
} from '../dependencies/dependencyUtils';
import { VersionComparator } from './VersionComparator';
import { validateForPublishing, ValidationResult } from '../../lib/versioning';

interface Props {
  module: Module | null;
  isOpen: boolean;
  onClose: () => void;
  dataset: RepositoryDataset;
  onPublishVersion?: (moduleId: string, versionId: string) => void;
  onOpenEditMetadata?: (module: Module) => void;
  onOpenEditDraftContent?: (module: Module, version: ModuleVersion) => void;
}

export const ModuleInspector: React.FC<Props> = ({
  module,
  isOpen,
  onClose,
  dataset,
  onPublishVersion,
  onOpenEditMetadata,
  onOpenEditDraftContent
}) => {
  const [comparisonVersionId, setComparisonVersionId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  if (!module) return null;

  const usage = getModuleUsage(module.id, dataset);
  const inbound = getModuleInboundDependencies(module.id, dataset);
  const latestVersionStr = getModuleLatestVersion(module.id, dataset);
  const latestVersion = module.versions[module.versions.length - 1];
  const outbound = latestVersion ? getModuleOutboundDependencies(latestVersion, dataset) : [];

  const comparisonOldVersion = module.versions.find(v => v.id === comparisonVersionId);
  const comparisonNewVersion = latestVersion;

  const hasDraft = module.versions.some(v => v.status === 'draft');
  const isPublishedOnly = !hasDraft;

  const handlePublishClick = (v: ModuleVersion) => {
    const result = validateForPublishing(v, module);
    setValidationResult(result);
    if (result.isValid && onPublishVersion) {
      onPublishVersion(module.id, v.id);
    }
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
              <span className="metadata-label" style={{ color: '#10b981', fontWeight: 700 }}>Has Active Draft</span>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.5rem' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.45rem', margin: 0 }}>{module.name}</h2>
            <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
              {module.code}
            </code>
          </div>
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
        
        {/* Governance / Lifecycle Status */}
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: '1.25rem', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Governance Status
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {latestVersion?.status === 'published' ? 'Published Registry Release' : 'Draft / Proposal Under Authoring'}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              background: latestVersion?.status === 'published' ? '#ecfdf5' : '#eff6ff',
              color: latestVersion?.status === 'published' ? '#065f46' : '#1e40af'
            }}>
              {latestVersion?.status}
            </span>
          </div>
        </div>

        {/* Published Historical Protection Notice */}
        {isPublishedOnly && (
          <div style={{
            marginTop: '1rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            borderLeft: '3px solid var(--text-primary)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            <strong>Published Version Locked:</strong> All version releases for this module are currently published and locked as immutable historical records. Creating an editable successor draft will be available in Batch 2 (Version Lifecycle Engine).
          </div>
        )}

        {/* VALIDATION FEEDBACK */}
        {validationResult && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            background: validationResult.isValid ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${validationResult.isValid ? '#10b981' : '#ef4444'}`
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: validationResult.isValid ? '#065f46' : '#991b1b' }}>
              {validationResult.isValid ? 'Ready to Publish' : 'Publishing Blocked'}
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
            onClose={() => setComparisonVersionId(null)}
          />
        )}

        {/* STRUCTURAL USAGE SECTION (Impact Analysis) */}
        {!comparisonVersionId && (
          <>
            <div className="dependency-section">
              <h4 className="section-title">Impact Analysis: Used by Programmes</h4>
              {usage.length > 0 ? (
                usage.map((u, i) => {
                  const isOutdated = u.versionReferenced !== latestVersionStr;
                  const isDeprecated = module.versions.find(v => v.version === u.versionReferenced)?.status === 'deprecated';
                  return (
                    <div key={i} className="dependency-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.programmeName}</span>
                        <span style={{ fontSize: '0.85rem', color: isDeprecated ? '#ef4444' : 'var(--text-muted)' }}>v{u.versionReferenced}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: isDeprecated ? '#ef4444' : isOutdated ? '#777' : 'var(--text-muted)', fontStyle: (isOutdated || isDeprecated) ? 'italic' : 'normal' }}>
                        {isDeprecated ? 'Using deprecated version' : isOutdated ? `Outdated reference (Registry is v${latestVersionStr})` : 'Current registry version'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not referenced by any programme.</p>
              )}
            </div>

            {/* OUTBOUND DEPENDENCIES */}
            <div className="dependency-section">
              <h4 className="section-title">Module Dependencies (v{latestVersion?.version})</h4>
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
          </>
        )}

        {/* VERSION HISTORY */}
        <div className="dependency-section" style={{ borderTop: '2px solid var(--border-color)', marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="section-title">Version History & Snapshots</h4>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {[...module.versions].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)).map(v => {
              const isLatest = v.version === latestVersionStr;
              const isDraft = v.status === 'draft';
              return (
                <div key={v.id} className="card" style={{ padding: '1rem', marginBottom: '1rem', border: comparisonVersionId === v.id ? '1.5px solid var(--text-primary)' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>v{v.version}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        color: isDraft ? '#1e40af' : v.status === 'deprecated' ? '#ef4444' : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '3px',
                        background: isDraft ? '#eff6ff' : 'var(--bg-secondary)'
                      }}>
                        {isDraft ? 'Draft — Editable' : `${v.status} — Locked`}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.releaseDate}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                    {v.description || 'No release description provided.'}
                  </p>
                  
                  <div className="metadata-row" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                    <span className="metadata-label">{v.outcomes?.length || 0} Outcomes</span>
                    <span className="metadata-dot">·</span>
                    <span className="metadata-label">{v.assessments?.length || 0} Assessments</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
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
                        onClick={() => handlePublishClick(v)}
                      >
                        Check Readiness
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
      </div>
    </div>
  );
};
