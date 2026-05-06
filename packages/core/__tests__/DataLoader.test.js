import { describe, it, expect, vi } from 'vitest';
import { DataLoader } from '../src/DataLoader.js';

describe('DataLoader', () => {
  it('fetches and caches data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: 'FeatureCollection', features: [] })
    });

    const loader = new DataLoader();
    const data = await loader.load('https://example.com/data.geojson');

    expect(data.type).toBe('FeatureCollection');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Cached on second call
    const data2 = await loader.load('https://example.com/data.geojson');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(data2).toBe(data);
  });

  it('retries on failure and throws after 3 attempts', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const loader = new DataLoader({ retries: 3, retryDelay: 10 });
    await expect(loader.load('https://example.com/data.geojson')).rejects.toThrow('Failed to load data after 3 retries');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('retries on HTTP error and throws after retries exhausted', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const loader = new DataLoader({ retries: 3, retryDelay: 10 });
    await expect(loader.load('https://example.com/data.geojson')).rejects.toThrow('Failed to load data after 3 retries');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('clearCache removes cached data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: 'FeatureCollection', features: [] })
    });

    const loader = new DataLoader();
    await loader.load('https://example.com/data.geojson');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    loader.clearCache();

    await loader.load('https://example.com/data.geojson');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
