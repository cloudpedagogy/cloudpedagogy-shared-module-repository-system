import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RepositoryDataset, Module, ModuleVersion, Programme } from './types';
import { storage, createBlankDataset, loadDemoDataset } from './lib/storage';
import { 
  createModule, 
  updateModuleMetadata, 
  updateDraftVersionContent, 
  createSuccessorDraft,
  publishDraftVersion,
  deprecateVersion,
  archiveVersion,
  discardDraftVersion,
  deleteModuleSafely,
  CanonicalModuleInput, 
  DraftContentInput 
} from './lib/modules/moduleService';
import {
  createProgramme,
  updateProgramme,
  addModuleToProgramme,
  removeModuleFromProgramme,
  reorderProgrammeModules,
  repinProgrammeModuleVersion,
  deleteProgrammeSafely,
  ProgrammeInput
} from './lib/programmes/programmeService';
import { ModuleRegistry } from './features/modules/ModuleRegistry';
import { ProgrammeRegistry } from './features/programmes/ProgrammeRegistry';
import { ModuleInspector } from './features/modules/ModuleInspector';
import { MethodologyDrawer } from './components/MethodologyDrawer';
import { validateDataset } from './lib/validation/validator';
import { BrandHeader } from './components/BrandHeader';
import { CapabilityGovernanceSection } from './components/CapabilityGovernanceSection';
import { FirstUseModal } from './components/FirstUseModal';
import { ImportModal } from './components/ImportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ModuleFormModal } from './features/modules/ModuleFormModal';
import { DraftContentEditorModal } from './features/modules/DraftContentEditorModal';
import { SuccessorDraftModal } from './features/modules/SuccessorDraftModal';
import { PublishConfirmationModal } from './features/modules/PublishConfirmationModal';
import { StatusTransitionModal } from './features/modules/StatusTransitionModal';
import { ProgrammeFormModal } from './features/programmes/ProgrammeFormModal';
import { AddModuleToProgrammeModal } from './features/programmes/AddModuleToProgrammeModal';
import { RepinVersionModal } from './features/programmes/RepinVersionModal';

type View = 'modules' | 'programmes';

function App() {
  // First-use detection
  const [showFirstUse, setShowFirstUse] = useState<boolean>(() => !storage.hasSavedData());

  // Authoritative dataset state initialization (blank-first philosophy)
  const [dataset, setDataset] = useState<RepositoryDataset>(() => {
    if (!storage.hasSavedData()) {
      return createBlankDataset();
    }
    const result = storage.load();
    if (result.success && result.data) {
      return result.data;
    }
    return createBlankDataset();
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
  const [successorModuleTarget, setSuccessorModuleTarget] = useState<Module | null>(null);
  const [publishingTarget, setPublishingTarget] = useState<{ module: Module; version: ModuleVersion } | null>(null);
  const [statusTransitionTarget, setStatusTransitionTarget] = useState<{ module: Module; version: ModuleVersion; targetStatus: 'deprecated' | 'archived' } | null>(null);

  // Confirmation modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'primary' | 'danger';
    onConfirm: () => void;
  } | null>(null);

  // Programme modals state
  const [isCreateProgrammeOpen, setIsCreateProgrammeOpen] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [addModuleProgrammeTarget, setAddModuleProgrammeTarget] = useState<Programme | null>(null);
  const [repinTarget, setRepinTarget] = useState<{ programme: Programme; moduleId: string } | null>(null);

  // User feedback notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Synchronize with authoritative persistence layer
  useEffect(() => {
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
    setConfirmModalConfig({
      isOpen: true,
      title: 'Initialize Blank Repository?',
      message: 'Create a new blank repository? Any unsaved changes in the current session will be replaced. Make sure you have exported your work.',
      confirmLabel: 'Create Blank Repository',
      variant: 'primary',
      onConfirm: () => {
        const blank = createBlankDataset();
        setDataset(blank);
        storage.save(blank);
        setSelectedModuleId(null);
        setConfirmModalConfig(null);
        showNotification('Switched to clean blank repository.', 'info');
      }
    });
  };

  const handleLoadDemoWithConfirm = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Load Demonstration Dataset?',
      message: 'Load the demonstration repository? Any unsaved changes will be replaced. Make sure you have exported your work.',
      confirmLabel: 'Load Demo Dataset',
      variant: 'primary',
      onConfirm: () => {
        const demo = loadDemoDataset();
        setDataset(demo);
        storage.save(demo);
        setSelectedModuleId(null);
        setConfirmModalConfig(null);
        showNotification('Demonstration dataset restored.', 'info');
      }
    });
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

  // Successor Draft Creation Handler
  const handleCreateSuccessorDraftSubmit = (
    sourceVersionId: string,
    bumpType: 'major' | 'minor' | 'patch' | 'custom',
    customVersion?: string,
    description?: string
  ) => {
    if (!successorModuleTarget) {
      return { success: false, errors: ['No module selected for successor draft.'] };
    }

    const result = createSuccessorDraft(successorModuleTarget, sourceVersionId, bumpType, customVersion, description);
    if (!result.success || !result.module) {
      return { success: false, errors: result.errors };
    }

    const updatedModules = dataset.modules.map(m => (m.id === result.module!.id ? result.module! : m));
    setDataset({ ...dataset, modules: updatedModules });
    setSuccessorModuleTarget(null);
    showNotification(`Successor draft created for "${result.module.code}".`, 'success');
    return { success: true, errors: [] };
  };

  // Publishing Handler
  const handleConfirmPublish = (versionId: string) => {
    if (!publishingTarget) {
      return { success: false, errors: ['No target draft selected for publishing.'] };
    }

    const result = publishDraftVersion(publishingTarget.module, versionId);
    if (!result.success || !result.module) {
      return { success: false, errors: result.errors };
    }

    const updatedModules = dataset.modules.map(m => (m.id === result.module!.id ? result.module! : m));
    setDataset({ ...dataset, modules: updatedModules });
    setPublishingTarget(null);
    showNotification(`Version published successfully and locked as immutable snapshot.`, 'success');
    return { success: true, errors: [] };
  };

  // Status Transitions (Deprecate / Archive) Handler
  const handleStatusTransitionConfirm = (versionId: string, targetStatus: 'deprecated' | 'archived') => {
    if (!statusTransitionTarget) {
      return { success: false, errors: ['No version selected for status transition.'] };
    }

    const mod = statusTransitionTarget.module;
    const result = targetStatus === 'deprecated'
      ? deprecateVersion(mod, versionId)
      : archiveVersion(mod, versionId);

    if (!result.success || !result.module) {
      return { success: false, errors: result.errors };
    }

    const updatedModules = dataset.modules.map(m => (m.id === result.module!.id ? result.module! : m));
    setDataset({ ...dataset, modules: updatedModules });
    setStatusTransitionTarget(null);
    showNotification(`Version marked as ${targetStatus}. Historical references remain resolvable.`, 'info');
    return { success: true, errors: [] };
  };

  // Discard Draft Handler
  const handleDiscardDraft = (moduleId: string, versionId: string) => {
    const target = dataset.modules.find(m => m.id === moduleId);
    if (!target) return;
    const ver = target.versions.find(v => v.id === versionId);

    setConfirmModalConfig({
      isOpen: true,
      title: `Discard Draft v${ver?.version || ''}?`,
      message: 'Unsaved draft curriculum changes will be discarded permanently.',
      confirmLabel: 'Discard Draft',
      variant: 'danger',
      onConfirm: () => {
        const result = discardDraftVersion(target, versionId);
        if (!result.success || !result.module) {
          showNotification(result.errors.join('; '), 'error');
          setConfirmModalConfig(null);
          return;
        }

        const updatedModules = dataset.modules.map(m => (m.id === result.module!.id ? result.module! : m));
        setDataset({ ...dataset, modules: updatedModules });
        setConfirmModalConfig(null);
        showNotification(`Draft version discarded.`, 'info');
      }
    });
  };

  // Delete Module Safely Handler
  const handleDeleteModuleSafely = (moduleId: string) => {
    const result = deleteModuleSafely(dataset, moduleId);
    if (!result.success || !result.dataset) {
      showNotification(result.errors.join('; '), 'error');
      return;
    }

    setDataset(result.dataset);
    setSelectedModuleId(null);
    showNotification(`Module removed safely from repository.`, 'success');
  };

  // Programme Authoring & Editing Handlers
  const handleProgrammeFormSubmit = (input: ProgrammeInput) => {
    if (editingProgramme) {
      const result = updateProgramme(editingProgramme, input, dataset.programmes);
      if (!result.success || !result.data) {
        return { success: false, errors: result.errors };
      }

      const updatedProgrammes = dataset.programmes.map(p => (p.id === result.data!.id ? result.data! : p));
      setDataset({ ...dataset, programmes: updatedProgrammes });
      setEditingProgramme(null);
      showNotification(`Programme "${result.data.code}" updated successfully.`, 'success');
      return { success: true, errors: [] };
    } else {
      const result = createProgramme(input, dataset.programmes);
      if (!result.success || !result.data) {
        return { success: false, errors: result.errors };
      }

      setDataset({ ...dataset, programmes: [...dataset.programmes, result.data] });
      setIsCreateProgrammeOpen(false);
      showNotification(`Programme "${result.data.code}: ${result.data.name}" created.`, 'success');
      return { success: true, errors: [] };
    }
  };

  // Add Module to Programme Handler
  const handleAddModuleToProgrammeSubmit = (moduleId: string, versionString: string) => {
    if (!addModuleProgrammeTarget) {
      return { success: false, errors: ['No active programme selected.'] };
    }

    const result = addModuleToProgramme(addModuleProgrammeTarget, moduleId, versionString, dataset);
    if (!result.success || !result.data) {
      return { success: false, errors: result.errors };
    }

    const updatedProgrammes = dataset.programmes.map(p => (p.id === result.data!.id ? result.data! : p));
    setDataset({ ...dataset, programmes: updatedProgrammes });
    setAddModuleProgrammeTarget(null);
    showNotification(`Module added to "${result.data.name}" with explicit version pin v${versionString}.`, 'success');
    return { success: true, errors: [] };
  };

  // Remove Module from Programme Handler
  const handleRemoveModuleFromProgramme = (programmeId: string, moduleId: string) => {
    const prog = dataset.programmes.find(p => p.id === programmeId);
    if (!prog) return;
    const mod = dataset.modules.find(m => m.id === moduleId);

    setConfirmModalConfig({
      isOpen: true,
      title: `Remove Module from ${prog.name}?`,
      message: `Remove "${mod?.name || moduleId}" from ${prog.name}? The module and its historical versions will remain intact in the shared repository.`,
      confirmLabel: 'Remove Module',
      variant: 'danger',
      onConfirm: () => {
        const result = removeModuleFromProgramme(prog, moduleId);
        if (!result.success || !result.data) {
          showNotification(result.errors.join('; '), 'error');
          setConfirmModalConfig(null);
          return;
        }

        const updatedProgrammes = dataset.programmes.map(p => (p.id === result.data!.id ? result.data! : p));
        setDataset({ ...dataset, programmes: updatedProgrammes });
        setConfirmModalConfig(null);
        showNotification(`Module reference removed from "${prog.name}".`, 'info');
      }
    });
  };

  // Reorder Module Sequence Handler
  const handleReorderProgrammeModule = (programmeId: string, fromIndex: number, toIndex: number) => {
    const prog = dataset.programmes.find(p => p.id === programmeId);
    if (!prog) return;

    const result = reorderProgrammeModules(prog, fromIndex, toIndex);
    if (!result.success || !result.data) {
      showNotification(result.errors.join('; '), 'error');
      return;
    }

    const updatedProgrammes = dataset.programmes.map(p => (p.id === result.data!.id ? result.data! : p));
    setDataset({ ...dataset, programmes: updatedProgrammes });
  };

  // Repin Module Version in Programme Handler
  const handleConfirmRepin = (programmeId: string, moduleId: string, newVersionString: string) => {
    const prog = dataset.programmes.find(p => p.id === programmeId);
    if (!prog) {
      return { success: false, errors: ['Programme not found.'] };
    }

    const result = repinProgrammeModuleVersion(prog, moduleId, newVersionString, dataset);
    if (!result.success || !result.data) {
      return { success: false, errors: result.errors };
    }

    const updatedProgrammes = dataset.programmes.map(p => (p.id === result.data!.id ? result.data! : p));
    setDataset({ ...dataset, programmes: updatedProgrammes });
    setRepinTarget(null);
    showNotification(`Version pin for "${prog.name}" deliberately updated to v${newVersionString}.`, 'success');
    return { success: true, errors: [] };
  };

  // Delete Programme Handler
  const handleDeleteProgramme = (programmeId: string) => {
    const prog = dataset.programmes.find(p => p.id === programmeId);
    if (!prog) return;

    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Programme: ${prog.name}?`,
      message: `Are you sure you want to delete programme "${prog.name} (${prog.code})"? All module assignments in this programme will be removed. Shared modules in the repository are preserved.`,
      confirmLabel: 'Delete Programme',
      variant: 'danger',
      onConfirm: () => {
        const result = deleteProgrammeSafely(dataset, programmeId);
        if (!result.success || !result.dataset) {
          showNotification(result.errors.join('; '), 'error');
          setConfirmModalConfig(null);
          return;
        }

        setDataset(result.dataset);
        setConfirmModalConfig(null);
        showNotification(`Programme "${prog.name}" deleted.`, 'info');
      }
    });
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
          className="btn btn-secondary" 
          onClick={() => { setEditingProgramme(null); setIsCreateProgrammeOpen(true); }}
        >
          + Create Programme
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
            onOpenCreateProgramme={() => { setEditingProgramme(null); setIsCreateProgrammeOpen(true); }}
            onOpenEditProgramme={(p) => { setEditingProgramme(p); setIsCreateProgrammeOpen(true); }}
            onOpenAddModule={(p) => setAddModuleProgrammeTarget(p)}
            onOpenRepinVersion={(p, modId) => setRepinTarget({ programme: p, moduleId: modId })}
            onRemoveModule={handleRemoveModuleFromProgramme}
            onReorderModule={handleReorderProgrammeModule}
            onDeleteProgramme={handleDeleteProgramme}
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
        onOpenCreateSuccessorDraft={(mod) => {
          setSuccessorModuleTarget(mod);
        }}
        onOpenPublishConfirm={(mod, ver) => {
          setPublishingTarget({ module: mod, version: ver });
        }}
        onOpenStatusTransition={(mod, ver, targetStatus) => {
          setStatusTransitionTarget({ module: mod, version: ver, targetStatus });
        }}
        onDiscardDraft={handleDiscardDraft}
        onDeleteModule={handleDeleteModuleSafely}
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

      {/* Confirm Modal (Custom UI replacement for window.confirm) */}
      {confirmModalConfig && (
        <ConfirmModal 
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel={confirmModalConfig.confirmLabel}
          variant={confirmModalConfig.variant}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
        />
      )}

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

      {/* Successor Draft Modal */}
      {successorModuleTarget && (
        <SuccessorDraftModal 
          isOpen={!!successorModuleTarget}
          onClose={() => setSuccessorModuleTarget(null)}
          module={successorModuleTarget}
          onSubmit={handleCreateSuccessorDraftSubmit}
        />
      )}

      {/* Publish Confirmation Modal */}
      {publishingTarget && (
        <PublishConfirmationModal 
          isOpen={!!publishingTarget}
          onClose={() => setPublishingTarget(null)}
          module={publishingTarget.module}
          draftVersion={publishingTarget.version}
          onConfirmPublish={handleConfirmPublish}
        />
      )}

      {/* Status Transition Modal */}
      {statusTransitionTarget && (
        <StatusTransitionModal 
          isOpen={!!statusTransitionTarget}
          onClose={() => setStatusTransitionTarget(null)}
          module={statusTransitionTarget.module}
          version={statusTransitionTarget.version}
          targetStatus={statusTransitionTarget.targetStatus}
          onConfirm={handleStatusTransitionConfirm}
        />
      )}

      {/* Programme Create / Edit Modal */}
      <ProgrammeFormModal 
        isOpen={isCreateProgrammeOpen}
        onClose={() => { setIsCreateProgrammeOpen(false); setEditingProgramme(null); }}
        onSubmit={handleProgrammeFormSubmit}
        editingProgramme={editingProgramme}
        existingProgrammes={dataset.programmes}
      />

      {/* Add Module to Programme Modal */}
      {addModuleProgrammeTarget && (
        <AddModuleToProgrammeModal 
          isOpen={!!addModuleProgrammeTarget}
          onClose={() => setAddModuleProgrammeTarget(null)}
          programme={addModuleProgrammeTarget}
          dataset={dataset}
          onAddModule={handleAddModuleToProgrammeSubmit}
        />
      )}

      {/* Repin Version Modal */}
      {repinTarget && (
        <RepinVersionModal 
          isOpen={!!repinTarget}
          onClose={() => setRepinTarget(null)}
          programme={repinTarget.programme}
          moduleId={repinTarget.moduleId}
          dataset={dataset}
          onConfirmRepin={handleConfirmRepin}
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
