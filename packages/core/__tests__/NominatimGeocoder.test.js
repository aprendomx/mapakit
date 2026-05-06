import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NominatimGeocoder } from '../src/services/NominatimGeocoder.js';

describe('NominatimGeocoder', () => {
  let geocoder;

  beforeEach(() => {
    geocoder = new NominatimGeocoder();
    global.fetch = vi.fn();
  });

  it('returns empty array for short query', async () => {
    const results = await geocoder.search('ab');
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns empty array for empty query', async () => {
    const results = await geocoder.search('');
    expect(results).toEqual([]);
  });

  it('parses Nominatim response correctly', async () => {
    const mockResponse = [
      {
        display_name: 'Monterrey, Nuevo León, México',
        lon: '-100.3161',
        lat: '25.6866',
        boundingbox: ['25.4', '25.9', '-100.5', '-100.1']
      }
    ];
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const results = await geocoder.search('Monterrey');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'Monterrey, Nuevo León, México',
      lng: -100.3161,
      lat: 25.6866
    });
    expect(results[0].bbox).toEqual([-100.5, 25.4, -100.1, 25.9]);
  });

  it('returns empty array on fetch error', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    const results = await geocoder.search('Monterrey');
    expect(results).toEqual([]);
  });

  it('uses custom options', async () => {
    const custom = new NominatimGeocoder({ language: 'en', limit: 3 });
    fetch.mockResolvedValue({ ok: true, json: async () => [] });
    await custom.search('test');
    expect(fetch).toHaveBeenCalled();
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('accept-language=en');
    expect(url).toContain('limit=3');
  });
});
