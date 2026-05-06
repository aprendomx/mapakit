import { describe, it, expect, vi } from 'vitest';
import { ConfigLoader } from '../src/ConfigLoader.js';

describe('ConfigLoader', () => {
  function createMockSupabase(overrides = {}) {
    const mapData = overrides.map !== undefined ? overrides.map : { id: 'map-1', name: 'Test Map' };
    const sourcesData = overrides.sources !== undefined ? overrides.sources : [{ id: 's1', map_id: 'map-1', url: 'https://example.com/data.json' }];
    const layersData = overrides.layers !== undefined ? overrides.layers : [{ id: 'l1', map_id: 'map-1', type: 'fill' }];
    const filtersData = overrides.filters !== undefined ? overrides.filters : [{ id: 'f1', map_id: 'map-1', field: 'category' }];
    const imagesData = overrides.images !== undefined ? overrides.images : [{ id: 'i1', map_id: 'map-1', url: 'https://example.com/icon.png' }];

    const from = vi.fn((table) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() => {
          if (table === 'map_configurations') {
            return overrides.mapError
              ? { data: null, error: overrides.mapError }
              : { data: mapData, error: null };
          }
          return { data: null, error: null };
        }),
        data: null,
        error: null
      };

      // For non-single queries, simulate the final resolution
      if (table !== 'map_configurations') {
        let resultData;
        switch (table) {
          case 'map_data_sources': resultData = sourcesData; break;
          case 'map_layers': resultData = layersData; break;
          case 'map_filters': resultData = filtersData; break;
          case 'map_images': resultData = imagesData; break;
          default: resultData = [];
        }
        chain.data = resultData;
        chain.error = null;
      }

      return chain;
    });

    return { from };
  }

  it('loads map configuration and related data', async () => {
    const supabase = createMockSupabase();
    const loader = new ConfigLoader(supabase);

    const result = await loader.load('map-1');

    expect(result.map).toEqual({ id: 'map-1', name: 'Test Map' });
    expect(result.sources).toEqual([{ id: 's1', map_id: 'map-1', url: 'https://example.com/data.json' }]);
    expect(result.layers).toEqual([{ id: 'l1', map_id: 'map-1', type: 'fill' }]);
    expect(result.filters).toEqual([{ id: 'f1', map_id: 'map-1', field: 'category' }]);
    expect(result.images).toEqual([{ id: 'i1', map_id: 'map-1', url: 'https://example.com/icon.png' }]);
  });

  it('throws when map configuration is not found', async () => {
    const supabase = createMockSupabase({ mapError: new Error('Not found') });
    const loader = new ConfigLoader(supabase);

    await expect(loader.load('missing-id')).rejects.toThrow('Map configuration not found: missing-id');
  });

  it('throws when map data is null', async () => {
    const supabase = createMockSupabase({ map: null });
    const loader = new ConfigLoader(supabase);

    await expect(loader.load('map-null')).rejects.toThrow('Map configuration not found: map-null');
  });

  it('returns empty arrays when related data is missing', async () => {
    const supabase = createMockSupabase({
      sources: null,
      layers: null,
      filters: null,
      images: null
    });
    const loader = new ConfigLoader(supabase);

    const result = await loader.load('map-1');

    expect(result.sources).toEqual([]);
    expect(result.layers).toEqual([]);
    expect(result.filters).toEqual([]);
    expect(result.images).toEqual([]);
  });
});
