import { describe, it, expect } from 'vitest';
import { ExportService } from '../src/services/ExportService.js';

describe('ExportService', () => {
  const features = [
    { type: 'Feature', properties: { name: 'School A', type: 'school' }, geometry: { type: 'Point', coordinates: [-99.1, 19.5] } },
    { type: 'Feature', properties: { name: 'School B', type: 'school' }, geometry: { type: 'Point', coordinates: [-99.2, 19.6] } }
  ];

  it('toGeoJSON returns FeatureCollection', () => {
    const geojson = ExportService.toGeoJSON(features);
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(2);
  });

  it('toCSV generates correct headers and rows', () => {
    const csv = ExportService.toCSV(features);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('geometry_type,longitude,latitude,name,type');
    expect(lines[1]).toBe('Point,-99.1,19.5,School A,school');
    expect(lines[2]).toBe('Point,-99.2,19.6,School B,school');
  });

  it('toCSV escapes commas and quotes', () => {
    const f = [{ type: 'Feature', properties: { name: 'A,B', desc: 'Say "hello"' }, geometry: { type: 'Point', coordinates: [0, 0] } }];
    const csv = ExportService.toCSV(f);
    expect(csv).toContain('"A,B"');
    expect(csv).toContain('"Say ""hello"""');
  });

  it('toKML generates valid KML', () => {
    const kml = ExportService.toKML(features);
    expect(kml).toContain('<?xml version="1.0"');
    expect(kml).toContain('<kml');
    expect(kml).toContain('<Placemark>');
    expect(kml).toContain('<name>School A</name>');
    expect(kml).toContain('<coordinates>-99.1,19.5,0</coordinates>');
  });

  it('toKML escapes XML special chars', () => {
    const f = [{ type: 'Feature', properties: { name: 'A & B' }, geometry: { type: 'Point', coordinates: [0, 0] } }];
    const kml = ExportService.toKML(f);
    expect(kml).toContain('A &amp; B');
  });

  it('returns empty string for empty features in CSV', () => {
    expect(ExportService.toCSV([])).toBe('');
    expect(ExportService.toCSV(null)).toBe('');
  });

  it('returns empty KML for empty features', () => {
    const kml = ExportService.toKML([]);
    expect(kml).toContain('<Document>');
    expect(kml).not.toContain('<Placemark>');
  });
});
