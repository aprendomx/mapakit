// packages/core/src/plugins/index.js
export { ConfigProvider } from './ConfigProvider.js';
export { DataProvider } from './DataProvider.js';
export { PluginRegistry } from './PluginRegistry.js';

import { PluginRegistry } from './PluginRegistry.js';
import { SupabaseConfigProvider } from './providers/SupabaseConfigProvider.js';
import { JsonStaticConfigProvider } from './providers/JsonStaticConfigProvider.js';
import { RestApiConfigProvider } from './providers/RestApiConfigProvider.js';
import { GeojsonUrlDataProvider } from './providers/GeojsonUrlDataProvider.js';
import { StaticJsonDataProvider } from './providers/StaticJsonDataProvider.js';

export function createDefaultRegistry(options = {}) {
  const registry = new PluginRegistry();

  // Config providers
  registry.registerConfigProvider(new SupabaseConfigProvider(options));
  registry.registerConfigProvider(new JsonStaticConfigProvider(options));
  registry.registerConfigProvider(new RestApiConfigProvider(options));

  // Data providers (order matters: more specific first)
  registry.registerDataProvider(new StaticJsonDataProvider());
  registry.registerDataProvider(new GeojsonUrlDataProvider(options));

  return registry;
}
