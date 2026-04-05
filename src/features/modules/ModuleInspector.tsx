import React, { useState } from 'react';
import { Module, RepositoryDataset, ModuleVersion } from '../../types';
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
        <span className="badge badge-level">Level {module.level}</span>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '1rem 0 0.5rem 0' }}>{module.name}</h2>
        <code style={{ fontSize: '1rem', color: '#06b6d4' }}>{module.code}</code>
        
        <div style={{ padding: '0.8rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', marginTop: '1rem', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Registry Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span className="badge badge-version" style={{ fontSize: '0.9rem' }}>Current Release: v{latestVersionStr}</span>
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
              <h4>Used by Programmes</h4>
              {usage.length > 0 ? (
                usage.map((u, i) => {
                  const isOutdated = u.versionReferenced !== latestVersionStr;
                  return (
                    <div key={i} className="dependency-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span className="label" style={{ fontWeight: 600 }}>{u.programmeName}</span>
                        <span className="value badge badge-version">v{u.versionReferenced}</span>
                      </div>
                      <span className={`badge ${isOutdated ? 'badge-outdated' : 'badge-success'}`} style={{ alignSelf: 'flex-start' }}>
                        {isOutdated ? `Using Older Version (Registry at v${latestVersionStr})` : 'Current Version'}
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
              <h4>Depends on Modules</h4>
              {outbound.length > 0 ? (
                outbound.map((d, i) => (
                  <div key={i} className="dependency-row">
                    <span className="label">{d.moduleName}</span>
                    <span className="value">{d.type} (v{d.versionConstraint}+)</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No outbound dependencies defined for latest version.</p>
              )}
            </div>

            {/* INBOUND DEPENDENCIES */}
            <div className="dependency-section">
              <h4>Referenced by Modules</h4>
              {inbound.length > 0 ? (
                inbound.map((d, i) => (
                  <div key={i} className="dependency-row">
                    <span className="label">{d.moduleName}</span>
                    <span className="value">{d.type} (v{d.versionConstraint}+)</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No other modules depend on this module.</p>
              )}
            </div>
          </>
        )}

        {/* VERSION HISTORY */}
        <div className="dependency-section" style={{ borderTop: '2px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Version History</h4>
            {comparisonVersionId && <span className="badge badge-purple">In Comparison Mode</span>}
          </div>
          <div className="glass-panel" style={{ padding: 0, marginTop: '1rem' }}>
            {[...module.versions].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)).map(v => {
              const isCurrent = v.version === latestVersionStr;
              return (
                <div key={v.id} className={`version-item ${comparisonVersionId === v.id ? 'active' : ''}`} style={{ padding: '1.2rem', background: comparisonVersionId === v.id ? 'rgba(168, 85, 247, 0.05)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge badge-version">v{v.version}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.releaseDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className={`badge ${v.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {v.status.toUpperCase()}
                    </div>
                    { !isCurrent && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}
                        onClick={() => setComparisonVersionId(v.id)}
                      >
                        Compare with v{latestVersionStr}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
                    {v.content}
                  </p>
                  
                  {/* Summary of outcomes/assessments in list */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{v.outcomes.length} Outcomes</span>
                    <span>{v.assessments.length} Assessments</span>
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
