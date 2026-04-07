import React, { useState, useEffect, useMemo } from 'react';
import { RepositoryDataset, Module } from './types';
import { demoDataset } from './data/demo';
import { ModuleRegistry } from './features/modules/ModuleRegistry';
import { ProgrammeRegistry } from './features/programmes/ProgrammeRegistry';
import { ModuleInspector } from './features/modules/ModuleInspector';
import { MethodologyDrawer } from './components/MethodologyDrawer';
import { validateDataset, ValidationIssue } from './lib/validation/validator';
import { BrandHeader } from './components/BrandHeader';

type View = 'modules' | 'programmes';

const STORAGE_KEY = 'smrs_repository_health_v1';

function App() {
  const [dataset, setDataset] = useState<RepositoryDataset>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : demoDataset;
  });

  const [currentView, setCurrentView] = useState<View>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  }, [dataset]);

  // Validation
  const validationIssues = useMemo(() => validateDataset(dataset), [dataset]);
  const hasCriticalWarnings = validationIssues.some(i => i.type === 'warning');

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data to the demo repository?')) {
      setDataset(demoDataset);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "smrs_repository_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const selectedModule = dataset.modules.find(m => m.id === selectedModuleId) || null;

  return (
    <div className="app-container">
      {/* BRANDING */}
      <BrandHeader appName="Shared Module Repository System" />

      {/* ACTIONS */}
      <div className="header-actions" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          className={`btn ${isMethodologyOpen ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
          style={{ position: 'relative' }}
        >
          Principles & Integrity
          {hasCriticalWarnings && (
            <span style={{ 
              position: 'absolute', top: '-5px', right: '-5px', 
              backgroundColor: '#111', color: 'white', 
              borderRadius: '50%', width: '18px', height: '18px', 
              fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>!</span>
          )}
        </button>
        <button className="btn btn-secondary" onClick={handleExport}>Export JSON</button>
        <button className="btn btn-secondary" onClick={handleResetData}>Reset Data</button>
      </div>

      {/* INTEGRITY BANNER */}
      <div className="integrity-banner">
        <span>This tool provides structural visibility; it does not perform automated alignment or success simulation.</span>
        <span style={{ fontWeight: 600 }}>
          {validationIssues.length} Structural Integrity Signals
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="nav-container">
        <button 
          className={`nav-item ${currentView === 'modules' ? 'active' : ''}`}
          onClick={() => setCurrentView('modules')}
        >
          Module Registry
        </button>
        <button 
          className={`nav-item ${currentView === 'programmes' ? 'active' : ''}`}
          onClick={() => setCurrentView('programmes')}
        >
          Programme Composition
        </button>
      </nav>

      {/* VIEW CONTENT */}
      <main className="content">
        {currentView === 'modules' ? (
          <ModuleRegistry 
            modules={dataset.modules}
            dataset={dataset}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            levelFilter={levelFilter}
            onLevelChange={setLevelFilter}
            onResetFilters={() => {
              setSearchQuery('');
              setLevelFilter('all');
            }}
            selectedModuleId={selectedModuleId}
            onSelectModule={setSelectedModuleId}
            isDrawerOpen={!!selectedModuleId}
          />
        ) : (
          <ProgrammeRegistry 
            programmes={dataset.programmes}
            dataset={dataset}
            onModuleClick={setSelectedModuleId}
            isDrawerOpen={!!selectedModuleId}
          />
        )}
      </main>

      {/* DRAWER LAYER */}
      <ModuleInspector 
        module={selectedModule}
        isOpen={!!selectedModuleId}
        onClose={() => setSelectedModuleId(null)}
        dataset={dataset}
      />

      <MethodologyDrawer 
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        issues={validationIssues}
      />

      {/* FOOTER */}
      <footer className="footer">
        <p className="footer-text">CloudPedagogy · Governance-ready AI and curriculum systems</p>
      </footer>
    </div>
  );
}

export default App;
