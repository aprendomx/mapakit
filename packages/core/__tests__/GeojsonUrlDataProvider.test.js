import { describe, it, expect, vi } from 'vitest';
import { GeojsonUrlDataProvider } from '../src/plugins/providers/GeojsonUrlDataProvider.js';

describe('GeojsonUrlDataProvider', () => {
  it('supports geojson sources', () => {
    const provider = new GeojsonUrlDataProvider();
    expect(provider.supports({ source_type: 'geojson', url: 'test.geojson' })).toBe(true);
    expect(provider.supports({ source_type: 'json_points' })).toBe(false);
  });

  it('fetches and returns geojson', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: 'FeatureCollection', features: [] })
    });

    const provider = new GeojsonUrlDataProvider();
    const data = await provider.load({ url: 'http://test.geojson', source_type: 'geojson' });
    
    expect(data.type).toBe('FeatureCollection');
  });
});
