import { describe, it, expect } from 'vitest';
import { PluginRegistry } from '../src/plugins/PluginRegistry.js';
import { ConfigProvider } from '../src/plugins/ConfigProvider.js';
import { DataProvider } from '../src/plugins/DataProvider.js';

describe('PluginRegistry', () => {
  it('registers and retrieves config providers', () => {
    const registry = new PluginRegistry();
    const provider = new ConfigProvider({ id: 'test' });
    registry.registerConfigProvider(provider);
    expect(registry.getConfigProvider('test')).toBe(provider);
  });

  it('registers and finds data provider for source', () => {
    const registry = new PluginRegistry();
    const provider = new DataProvider({ id: 'geojson' });
    provider.supports = (s) => s.source_type === 'geojson';
    registry.registerDataProvider(provider);
    
    const source = { source_type: 'geojson', url: 'test.geojson' };
    expect(registry.getDataProviderForSource(source)).toBe(provider);
  });

  it('auto-detects config provider from options', () => {
    const registry = new PluginRegistry();
    const jsonProvider = new ConfigProvider({ id: 'json-static' });
    jsonProvider.canLoad = (opts) => !!opts.configUrl;
    registry.registerConfigProvider(jsonProvider);
    
    const supabaseProvider = new ConfigProvider({ id: 'supabase' });
    supabaseProvider.canLoad = (opts) => !!opts.supabaseUrl;
    registry.registerConfigProvider(supabaseProvider);
    
    const detected = registry.detectConfigProvider({ configUrl: '/test.json' });
    expect(detected.id).toBe('json-static');
  });
});
