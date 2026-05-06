// packages/core/src/plugins/PluginRegistry.js
export class PluginRegistry {
  constructor() {
    this.configProviders = new Map();
    this.dataProviders = [];
  }

  registerConfigProvider(provider) {
    this.configProviders.set(provider.id, provider);
  }

  registerDataProvider(provider) {
    this.dataProviders.push(provider);
  }

  getConfigProvider(id) {
    const provider = this.configProviders.get(id);
    if (!provider) {
      throw new Error(`ConfigProvider '${id}' not found. Registered: ${Array.from(this.configProviders.keys()).join(', ')}`);
    }
    return provider;
  }

  getDataProviderForSource(source) {
    for (const provider of this.dataProviders) {
      if (provider.supports(source)) {
        return provider;
      }
    }
    throw new Error(`No DataProvider found for source: ${JSON.stringify(source)}`);
  }

  detectConfigProvider(options) {
    for (const provider of this.configProviders.values()) {
      if (provider.canLoad && provider.canLoad(options)) {
        return provider;
      }
    }
    const first = this.configProviders.values().next().value;
    if (first) return first;
    throw new Error('No ConfigProvider registered');
  }
}
