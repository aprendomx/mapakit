import { describe, it, expect } from 'vitest';
import { StaticJsonDataProvider } from '../src/plugins/providers/StaticJsonDataProvider.js';

describe('StaticJsonDataProvider', () => {
  it('supports sources with inline data', () => {
    const provider = new StaticJsonDataProvider();
    expect(provider.supports({ data: { type: 'FeatureCollection' } })).toBe(true);
    expect(provider.supports({ url: 'http://test.geojson' })).toBe(false);
  });

  it('returns inline data directly', async () => {
    const provider = new StaticJsonDataProvider();
    const geojson = { type: 'FeatureCollection', features: [] };
    const data = await provider.load({ data: geojson });
    expect(data).toBe(geojson);
  });
});
