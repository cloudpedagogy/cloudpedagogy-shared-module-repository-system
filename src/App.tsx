import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RepositoryDataset, Module, ModuleVersion } from './types';
import { storage, createBlankDataset, loadDemoDataset } from './lib/storage';
import { 
  createModule, 
  updateModuleMetadata, 
  updateDraftVersionContent, 
  CanonicalModuleInput, 
  DraftContentInput 
} from './lib/modules/moduleService';
import { ModuleRegistry } from './features/modules/ModuleRegistry';
import { ProgrammeRegistry } from './features/programmes/ProgrammeRegistry';
import { ModuleInspector } from './features/modules/ModuleInspector';
import { MethodologyDrawer } from './components/MethodologyDrawer';
import { validateDataset } from './lib/validation/validator';
import { BrandHeader } from './components/BrandHeader';
import { CapabilityGovernanceSection } from './components/CapabilityGovernanceSection';
import { FirstUseModal } from './components/FirstUseModal';
import { ImportModal } from './components/ImportModal';
import { ModuleFormModal } from './features/modules/ModuleFormModal';
import { DraftContentEditorModal } from './features/modules/DraftContentEditorModal';

type View = 'modules' | 'programmes';

function App() {
  // First-use detection
  const [showFirstUse, setShowFirstUse] = useState<boolean>(() => !storage.hasSavedData());

  // Dataset state initialization
  const [dataset, setDataset] = useState<RepositoryDataset>(() => {
    if (!storage.hasSavedData()) {
      return loadDemoDataset();
    }
    const result = storage.load();
    if (result.success && result.data) {
      return result.data;
    }
    // Fallback if saved data was malformed
    return loadDemoDataset();
  });

  const [currentView, setCurrentView] = useState<View>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingDraftTarget, setEditingDraftTarget] = useState<{ module: Module; version: ModuleVersion } | null>(null);

  // User notification feedback
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Synchronize with authoritative persistence layer
  useEffect(() => {
    // Only save if first-use modal is resolved or user has interactively chosen
    if (!showFirstUse) {
      const saveRes = storage.save(dataset);
      if (!saveRes.success) {
        showNotification(saveRes.error || 'Failed to save repository to browser storage.', 'error');
      }
    }
  }, [dataset, showFirstUse, showNotification]);

  // Structural Validation
  const validationIssues = useMemo(() => validateDataset(dataset), [dataset]);
  const hasCriticalWarnings = validationIssues.some(i => i.type === 'warning');

  // First-use actions
  const handleFirstUseBlank = () => {
    const blank = createBlankDataset();
    setDataset(blank);
    storage.save(blank);
    setShowFirstUse(false);
    showNotification('Blank repository initialized. Click "+ Create Module" to add your first module.', 'success');
  };

  const handleFirstUseDemo = () => {
    const demo = loadDemoDataset();
    setDataset(demo);
    storage.save(demo);
    setShowFirstUse(false);
    showNotification('Demonstration repository loaded with sample public health assets.', 'info');
  };

  const handleFirstUseImport = () => {
    setShowFirstUse(false);
    setIsImportOpen(true);
  };

  // Reset or Switch Dataset
  const handleLoadBlankWithConfirm = () => {
    if (window.confirm('Create a new blank repository? Any unsaved changes will be replaced. Make sure you have exported your work.')) {
      const blank = createBlankDataset();
      setDataset(blank);
      storage.save(blank);
      setSelectedModuleId(null);
      showNotification('Switched to clean blank repository.', 'info');
    }
  };

  const handleLoadDemoWithConfirm = () => {
    if (window.confirm('Load the demonstration repository? Any unsaved changes will be replaced. Make sure you have exported your work.')) {
      const demo = loadDemoDataset();
      setDataset(demo);
      storage.save(demo);
      setSelectedModuleId(null);
      showNotification('Demonstration dataset restored.', 'info');
    }
  };

  // Export JSON
  const handleExport = () => {
    storage.exportJSON(dataset);
    showNotification('Repository exported successfully as JSON.', 'success');
  };

  // Confirm Import
  const handleConfirmImport = (importedDataset: RepositoryDataset) => {
    setDataset(importedDataset);
    storage.save(importedDataset);
    setSelectedModuleId(null);
    showNotification(`Successfully imported repository with ${importedDataset.modules.length} modules and ${importedDataset.programmes.length} programmes.`, 'success');
  };

  // Canonical Module Authoring & Editing Handlers
  const handleModuleFormSubmit = (canonical: CanonicalModuleInput, initialDraft?: DraftContentInput) => {
    if (editingModule) {
      // Edit mode
      const result = updateModuleMetadata(editingModule, canonical, dataset.modules);
      if (!result.success || !result.module) {
        return { success: false, errors: result.errors };
      }

      const updatedModules = dataset.modules.map(m => (m.id === result.module!.id ? result.module! : m));
      setDataset({ ...dataset, modules: updatedModules });
      setEditingModule(null);
      showNotification(`Canonical metadata for "${result.module.code}" updated successfully.`, 'success');
      return { success: true, errors: [] };
    } else {
      // Create mode
      const result = createModule(canonical, initialDraft, dataset.modules);
      if (!result.success || !result.module) {
        return { success: false, errors: result.errors };
      }

      setDataset({ ...dataset, modules: [...dataset.modules, result.module] });
      setSelectedModuleId(result.module.id);
      setIsCreateModuleOpen(false);
      showNotification(`Module "${result.module.code}: ${result.module.name}" created with initial draft version.`, 'success');
      return { success: true, errors: [] };
    }
  };

  // Draft Content Editor Handler
  const handleSaveDraftContent = (versionId: string, updates: Partial<DraftContentInput>) => {
    if (!editingDraftTarget) {
      return { success: false, errors: ['No active draft version selected.'] };
    }

    const result = updateDraftVersionContent(editingDraftTarget.module, versionId, updates);
    if (!result.success || !result.module) {
      return { success: false, errors: result.errors };
    }

    const updatedModules = dataset.modules.map(m => (m.id === result.module!.id ? result.module! : m));
    setDataset({ ...dataset, modules: updatedModules });
    setEditingDraftTarget(null);
    showNotification(`Draft curriculum content for "${result.module.code}" saved successfully.`, 'success');
    return { success: true, errors: [] };
  };

  const selectedModule = dataset.modules.find(m => m.id === selectedModuleId) || null;

  return (
    <div className="app-container">
      {/* BRANDING */}
      <BrandHeader appName="Shared Module Repository System" />

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'error' ? '#fef2f2' : notification.type === 'success' ? '#ecfdf5' : '#eff6ff',
          border: `1px solid ${notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#10b981' : '#3b82f6'}`,
          color: notification.type === 'error' ? '#991b1b' : notification.type === 'success' ? '#065f46' : '#1e40af',
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ACTIONS */}
      <div className="header-actions" style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => { setEditingModule(null); setIsCreateModuleOpen(true); }}
        >
          + Create Module
        </button>

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

        <button className="btn btn-secondary" onClick={() => setIsImportOpen(true)}>
          Import JSON
        </button>

        <button className="btn btn-secondary" onClick={handleExport}>
          Export JSON
        </button>

        <button className="btn btn-secondary" onClick={handleLoadBlankWithConfirm}>
          New Blank Repository
        </button>

        <button className="btn btn-secondary" onClick={handleLoadDemoWithConfirm}>
          Load Demo Dataset
        </button>
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
          Module Registry ({dataset.modules.length})
        </button>
        <button 
          className={`nav-item ${currentView === 'programmes' ? 'active' : ''}`}
          onClick={() => setCurrentView('programmes')}
        >
          Programme Composition ({dataset.programmes.length})
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
            onOpenCreateModule={() => { setEditingModule(null); setIsCreateModuleOpen(true); }}
            onOpenImport={() => setIsImportOpen(true)}
            onLoadDemo={handleLoadDemoWithConfirm}
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
        onOpenEditMetadata={(mod) => {
          setEditingModule(mod);
          setIsCreateModuleOpen(true);
        }}
        onOpenEditDraftContent={(mod, ver) => {
          setEditingDraftTarget({ module: mod, version: ver });
        }}
      />

      <MethodologyDrawer 
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        issues={validationIssues}
      />

      {/* First Use Modal */}
      <FirstUseModal 
        isOpen={showFirstUse}
        onCreateBlank={handleFirstUseBlank}
        onExploreDemo={handleFirstUseDemo}
        onOpenImport={handleFirstUseImport}
      />

      {/* Import Modal */}
      <ImportModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onConfirmImport={handleConfirmImport}
      />

      {/* Module Create / Edit Metadata Modal */}
      <ModuleFormModal 
        isOpen={isCreateModuleOpen}
        onClose={() => { setIsCreateModuleOpen(false); setEditingModule(null); }}
        onSubmit={handleModuleFormSubmit}
        editingModule={editingModule}
        existingModules={dataset.modules}
      />

      {/* Draft Content Editor Modal */}
      {editingDraftTarget && (
        <DraftContentEditorModal 
          isOpen={!!editingDraftTarget}
          onClose={() => setEditingDraftTarget(null)}
          module={editingDraftTarget.module}
          draftVersion={editingDraftTarget.version}
          availableModules={dataset.modules}
          onSaveDraftContent={handleSaveDraftContent}
        />
      )}

      {/* Capability and Governance Section */}
      <CapabilityGovernanceSection 
        dataset={dataset}
        onUpdate={(updates) => setDataset({ ...dataset, ...updates })}
      />

      {/* FOOTER */}
      <footer className="footer">
        <p className="footer-text">CloudPedagogy · Governance-ready AI and curriculum systems</p>
      </footer>
    </div>
  );
}

export default App;
