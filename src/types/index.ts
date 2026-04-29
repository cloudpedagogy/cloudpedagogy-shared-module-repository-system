export interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  credits: number;
  owner?: string;
  tags?: string[];
  versions: ModuleVersion[];
}

export interface ModuleVersion {
  id: string;
  moduleId: string;
  version: string;
  status: 'draft' | 'published' | 'deprecated' | 'archived';
  description?: string;
  releaseDate: string;
  content: string; // Structured JSON for learning units
  outcomes: string[];
  assessments: { 
    type: string; 
    weight: number; 
    description?: string; 
  }[];
  dependencies: Dependency[];
}

export interface Programme {
  id: string;
  name: string;
  code: string;
  description: string;
  modules: {
    moduleId: string;
    version: string; // The version used in this programme
  }[];
}

export interface Dependency {
  targetId: string; // Module identifier
  type: 'prerequisite' | 'corequisite' | 'optional';
  minVersion?: string;
}

export interface RepositoryDataset {
  modules: Module[];
  programmes: Programme[];
  lastUpdated: string;
  capabilityNotes?: string;
  governanceNotes?: string;
}
