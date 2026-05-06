import { describe, it, expect } from 'vitest';
import { convertToGeoJSON } from '../src/utils/geojson.js';

describe('convertToGeoJSON', () => {
  it('returns geojson as-is when source_type is geojson', () => {
    const geojson = { type: 'FeatureCollection', features: [] };
    const result = convertToGeoJSON(geojson, 'geojson');
    expect(result).toEqual(geojson);
  });

  it('converts json_points to GeoJSON', () => {
    const data = [
      { latitude: 16.89, longitude: -99.83, name: 'School A' },
      { latitude: 16.88, longitude: -99.94, name: 'School B' }
    ];
    const mapping = { lat: 'latitude', lng: 'longitude' };
    const result = convertToGeoJSON(data, 'json_points', mapping);
    expect(result.type).toBe('FeatureCollection');
    expect(result.features.length).toBe(2);
    expect(result.features[0].geometry.coordinates).toEqual([-99.83, 16.89]);
    expect(result.features[0].properties.name).toBe('School A');
  });

  it('converts json_lines to GeoJSON LineString', () => {
    const data = [
      { path: [[-99, 16], [-98, 17]], name: 'Route 1' }
    ];
    const mapping = { geometry: 'path' };
    const result = convertToGeoJSON(data, 'json_lines', mapping);
    expect(result.features[0].geometry.type).toBe('LineString');
    expect(result.features[0].geometry.coordinates).toEqual([[-99, 16], [-98, 17]]);
  });

  it('converts json_polygons to GeoJSON Polygon', () => {
    const data = [
      { area: [[[-99, 16], [-98, 16], [-98, 17], [-99, 17], [-99, 16]]], name: 'Zone A' }
    ];
    const mapping = { geometry: 'area' };
    const result = convertToGeoJSON(data, 'json_polygons', mapping);
    expect(result.features[0].geometry.type).toBe('Polygon');
  });

  it('throws on unsupported sourceType', () => {
    expect(() => convertToGeoJSON([], 'unknown_type')).toThrow('Unsupported sourceType: unknown_type');
    expect(() => convertToGeoJSON([], 'unknown_type')).toThrow();
  });
});
