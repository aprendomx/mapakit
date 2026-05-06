export class DataLoader {
  constructor(options = {}) {
    this.cache = new Map();
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  async load(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    let lastError;
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        this.cache.set(url, data);
        return data;
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          await this._sleep(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Failed to load data after ${this.retries} retries: ${lastError.message}`);
  }

  clearCache() {
    this.cache.clear();
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
