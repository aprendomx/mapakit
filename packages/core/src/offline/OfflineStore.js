export class OfflineStore {
  constructor(dbName = 'MapaKitDB') {
    this.dbName = dbName;
    this.db = null;
  }

  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('config')) db.createObjectStore('config');
        if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
    });
  }

  async saveConfig(configId, config) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('config', 'readwrite');
      const store = tx.objectStore('config');
      const req = store.put(config, configId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getConfig(configId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('config', 'readonly');
      const store = tx.objectStore('config');
      const req = store.get(configId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async saveData(sourceId, data) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('data', 'readwrite');
      const store = tx.objectStore('data');
      const req = store.put(data, sourceId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getData(sourceId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('data', 'readonly');
      const store = tx.objectStore('data');
      const req = store.get(sourceId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async setLastSync(timestamp) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      const req = store.put(timestamp, 'lastSync');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getLastSync() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('meta', 'readonly');
      const store = tx.objectStore('meta');
      const req = store.get('lastSync');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async clear() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['config', 'data', 'meta'], 'readwrite');
      tx.objectStore('config').clear();
      tx.objectStore('data').clear();
      tx.objectStore('meta').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
