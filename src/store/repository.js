/**
 * Shared Module Repository System - Store
 * Handles persistence, versioning, and state management.
 */

class RepositoryStore {
  constructor(dbName = 'SMRS_DB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.ready = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('modules')) {
          db.createObjectStore('modules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('programmes')) {
          db.createObjectStore('programmes', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getAllModules() {
    await this.ready;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['modules'], 'readonly');
      const store = transaction.objectStore('modules');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveModule(module) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['modules'], 'readwrite');
      const store = transaction.objectStore('modules');
      const request = store.put(module);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getModuleVersions(name) {
    const all = await this.getAllModules();
    return all.filter(m => m.name === name).sort((a, b) => this.compareVersions(b.version, a.version));
  }

  /**
   * Simple SemVer comparison (ascending)
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (parts1[i] > parts2[i]) return 1;
        if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }

  /**
   * Create a new version of a module.
   * @param {Object} baseModule - The module to version from.
   * @param {string} versionType - 'patch', 'minor', 'major'.
   */
  async createNewVersion(baseModule, versionType = 'patch') {
    const parts = baseModule.version.split('.').map(Number);
    if (versionType === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
    else if (versionType === 'minor') { parts[1]++; parts[2] = 0; }
    else { parts[2]++; }

    const newVersion = parts.join('.');
    const newModule = {
      ...baseModule,
      id: crypto.randomUUID(),
      version: newVersion,
      parentVersionId: baseModule.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLatest: true
    };

    // Mark old as not latest
    const updatedBase = { ...baseModule, isLatest: false };
    await this.saveModule(updatedBase);
    await this.saveModule(newModule);
    return newModule;
  }

  // Programmes Logic
  async getAllProgrammes() {
    await this.ready;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['programmes'], 'readonly');
      const store = transaction.objectStore('programmes');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProgramme(programme) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['programmes'], 'readwrite');
      const store = transaction.objectStore('programmes');
      const request = store.put(programme);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const store = new RepositoryStore();
