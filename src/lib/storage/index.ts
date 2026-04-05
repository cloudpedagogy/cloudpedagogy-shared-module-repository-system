import { RepositoryDataset } from '../../types';
import { demoDataset } from '../../data/demo';

const STORAGE_KEY = 'smrs_repository_data';

export const storage = {
  save: (data: RepositoryDataset) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  
  load: (): RepositoryDataset | null => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },
  
  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    return demoDataset;
  },
  
  exportJSON: (data: RepositoryDataset) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smrs-repository-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  saveFilters: (filters: { query: string; level: string; selection: string | null }) => {
    localStorage.setItem('smrs_registry_filters', JSON.stringify(filters));
  },

  loadFilters: () => {
    const saved = localStorage.getItem('smrs_registry_filters');
    return saved ? JSON.parse(saved) : { query: '', level: 'all', selection: null };
  }
};
