import React, { useMemo } from 'react';
import { ModuleCard } from './ModuleCard';
import { Module, RepositoryDataset } from '../../types';
import { checkModuleVersionLag } from '../dependencies/dependencyUtils';

interface Props {
  modules: Module[];
  dataset: RepositoryDataset;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  levelFilter: string;
  onLevelChange: (level: string) => void;
  onResetFilters: () => void;
  selectedModuleId: string | null;
  onSelectModule: (id: string | null) => void;
  isDrawerOpen: boolean;
  onOpenCreateModule: () => void;
  onOpenImport?: () => void;
  onLoadDemo?: () => void;
}

export const ModuleRegistry: React.FC<Props> = ({
  modules,
  dataset,
  searchQuery,
  onSearchChange,
  levelFilter,
  onLevelChange,
  onResetFilters,
  selectedModuleId,
  onSelectModule,
  isDrawerOpen,
  onOpenCreateModule,
  onOpenImport,
  onLoadDemo
}) => {
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLevel = levelFilter === 'all' || m.level.toString() === levelFilter;
      
      return matchesSearch && matchesLevel;
    });
  }, [modules, searchQuery, levelFilter]);

  // Calculate usage and independence for each module
  const moduleUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    dataset.programmes.forEach(p => {
      p.modules.forEach(m => {
        map[m.moduleId] = (map[m.moduleId] || 0) + 1;
      });
    });
    return map;
  }, [dataset.programmes]);

  return (
    <div className={`registry-main ${isDrawerOpen ? 'with-drawer' : ''}`}>
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            type="text" 
            className="search-input"
            placeholder="Search by keyword, code, or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <select 
            className="level-select"
            value={levelFilter}
            onChange={(e) => onLevelChange(e.target.value)}
          >
            <option value="all">All Levels</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
              <option key={l} value={l.toString()}>Level {l}</option>
            ))}
          </select>
          <button 
            className="btn btn-secondary" 
            onClick={onResetFilters}
            disabled={searchQuery === '' && levelFilter === 'all'}
          >
            Reset Filters
          </button>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={onOpenCreateModule}
          style={{ whiteSpace: 'nowrap' }}
        >
          + Create Module
        </button>
      </div>

      <div className="module-grid">
        {filteredModules.length > 0 ? (
          filteredModules.map(m => {
            const usageCount = moduleUsageMap[m.id] || 0;
            // Independent = 0 module-to-module dependencies in newest version
            const latestVersion = m.versions[m.versions.length - 1];
            const isIndependent = latestVersion?.dependencies.length === 0;
            const hasVersionLag = checkModuleVersionLag(m.id, dataset);

            return (
              <ModuleCard 
                key={m.id}
                module={m}
                isSelected={selectedModuleId === m.id}
                onClick={() => onSelectModule(m.id === selectedModuleId ? null : m.id)}
                usageCount={usageCount}
                isIndependent={isIndependent}
                hasVersionLag={hasVersionLag}
              />
            );
          })
        ) : modules.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            padding: '3.5rem 2rem', 
            textAlign: 'center', 
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Repository is Empty
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
              No modules have been created in this repository yet. Create your first canonical module or import an existing curriculum repository.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={onOpenCreateModule}>
                + Create First Module
              </button>
              {onOpenImport && (
                <button className="btn btn-secondary" onClick={onOpenImport}>
                  Import Repository JSON
                </button>
              )}
              {onLoadDemo && (
                <button className="btn btn-secondary" onClick={onLoadDemo}>
                  Load Demonstration Dataset
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-muted)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <p style={{ margin: '0 0 1rem 0' }}>No modules found matching your search and filter criteria.</p>
            <button className="btn btn-secondary btn-sm" onClick={onResetFilters}>
              Clear Search & Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
