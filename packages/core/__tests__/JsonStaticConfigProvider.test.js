import { describe, it, expect, vi } from 'vitest';
import { JsonStaticConfigProvider } from '../src/plugins/providers/JsonStaticConfigProvider.js';

describe('JsonStaticConfigProvider', () => {
  it('canLoad detects configUrl', () => {
    const provider = new JsonStaticConfigProvider();
    expect(provider.canLoad({ configUrl: '/test.json' })).toBe(true);
    expect(provider.canLoad({ supabaseUrl: 'http://test' })).toBe(false);
  });

  it('loads config from URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        map: { id: 'test', name: 'Test Map' },
        sources: [],
        layers: [],
        filters: [],
        images: []
      })
    });

    const provider = new JsonStaticConfigProvider();
    const config = await provider.load('/test.json');
    
    expect(config.map.name).toBe('Test Map');
  });
});
