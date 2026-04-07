import React, { useState } from 'react';
import { Module, RepositoryDataset } from '../../types';
import { 
  getModuleUsage, 
  getModuleInboundDependencies, 
  getModuleOutboundDependencies,
  getModuleLatestVersion
} from '../dependencies/dependencyUtils';
import { VersionComparator } from './VersionComparator';

interface Props {
  module: Module | null;
  isOpen: boolean;
  onClose: () => void;
  dataset: RepositoryDataset;
}

export const ModuleInspector: React.FC<Props> = ({ module, isOpen, onClose, dataset }) => {
  const [comparisonVersionId, setComparisonVersionId] = useState<string | null>(null);

  if (!module) return null;

  const usage = getModuleUsage(module.id, dataset);
  const inbound = getModuleInboundDependencies(module.id, dataset);
  const latestVersionStr = getModuleLatestVersion(module.id, dataset);
  const latestVersion = module.versions[module.versions.length - 1];
  const outbound = latestVersion ? getModuleOutboundDependencies(latestVersion, dataset) : [];

  const comparisonOldVersion = module.versions.find(v => v.id === comparisonVersionId);
  const comparisonNewVersion = latestVersion;

  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <button 
        className="btn btn-secondary" 
        onClick={onClose}
        style={{ position: 'absolute', top: '1rem', right: '1.5rem', padding: '0.4rem 0.8rem' }}
      >
        ✕ Close
      </button>

      <div style={{ marginTop: '2rem' }}>
        <div className="metadata-row">
          <span className="metadata-label">Level {module.level}</span>
          <span className="metadata-dot">·</span>
          <span className="metadata-label">Registry Release v{latestVersionStr}</span>
        </div>
        
        <h2 style={{ fontWeight: 700, marginTop: '0.5rem', fontSize: '1.5rem' }}>{module.name}</h2>
        <code style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{module.code}</code>
        
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: '1.5rem', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Governance Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>Published Registry Release</span>
          </div>
        </div>

        {/* COMPARISON VIEW */}
        {comparisonOldVersion && comparisonNewVersion && (
          <VersionComparator 
            oldVersion={comparisonOldVersion}
            newVersion={comparisonNewVersion}
            onClose={() => setComparisonVersionId(null)}
          />
        )}

        {/* STRUCTURAL USAGE SECTION */}
        {!comparisonVersionId && (
          <>
            <div className="dependency-section">
              <h4 className="section-title">Used by Programmes</h4>
              {usage.length > 0 ? (
                usage.map((u, i) => {
                  const isOutdated = u.versionReferenced !== latestVersionStr;
                  return (
                    <div key={i} className="dependency-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.programmeName}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>v{u.versionReferenced}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: isOutdated ? '#777' : 'var(--text-muted)', fontStyle: isOutdated ? 'italic' : 'normal' }}>
                        {isOutdated ? `Outdated reference (Registry is v${latestVersionStr})` : 'Current registry version'}
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
              <h4 className="section-title">Module Dependencies</h4>
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

            {/* INBOUND DEPENDENCIES */}
            <div className="dependency-section">
              <h4 className="section-title">Referenced by</h4>
              {inbound.length > 0 ? (
                inbound.map((d, i) => (
                  <div key={i} className="dependency-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 500 }}>{d.moduleName}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.type} (v{d.versionConstraint}+)</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No incoming dependencies.</p>
              )}
            </div>
          </>
        )}

        {/* VERSION HISTORY */}
        <div className="dependency-section" style={{ borderTop: '2px solid var(--border-color)', marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="section-title">Version History</h4>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {[...module.versions].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)).map(v => {
              const isCurrent = v.version === latestVersionStr;
              return (
                <div key={v.id} className="card" style={{ padding: '1rem', marginBottom: '1rem', border: comparisonVersionId === v.id ? '1.5px solid var(--text-primary)' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>v{v.version}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.releaseDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{v.status}</span>
                    { !isCurrent && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => setComparisonVersionId(v.id)}
                      >
                        Compare with latest
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                    {v.content}
                  </p>
                  
                  <div className="metadata-row" style={{ marginTop: '1rem' }}>
                    <span className="metadata-label">{v.outcomes.length} Outcomes</span>
                    <span className="metadata-dot">·</span>
                    <span className="metadata-label">{v.assessments.length} Assessments</span>
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
