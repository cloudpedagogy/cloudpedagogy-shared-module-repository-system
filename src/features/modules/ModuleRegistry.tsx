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
  isDrawerOpen
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
      <div className="filter-bar">
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
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            padding: '4rem', 
            textAlign: 'center', 
            color: 'var(--text-muted)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            No modules found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
