// packages/core/src/plugins/DataProvider.js
export class DataProvider {
  constructor(options = {}) {
    this.id = options.id || 'unknown';
  }

  async load(source) {
    throw new Error(`DataProvider ${this.id} must implement load(source)`);
  }

  supports(source) {
    return true;
  }
}
