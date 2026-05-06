// packages/core/src/plugins/ConfigProvider.js
export class ConfigProvider {
  constructor(options = {}) {
    this.id = options.id || 'unknown';
  }

  async load(configId) {
    throw new Error(`ConfigProvider ${this.id} must implement load(configId)`);
  }

  canLoad(configId) {
    return true;
  }
}
