import { describe, it, expect } from 'vitest';
import { FilterEngine } from '../src/FilterEngine.js';

describe('FilterEngine', () => {
  const sampleFeatures = [
    { properties: { type: 'school', capacity: 100, name: 'A', active: true } },
    { properties: { type: 'hospital', capacity: 200, name: 'B', active: false } },
    { properties: { type: 'school', capacity: 300, name: 'C', active: true } }
  ];

  it('filters by select type', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'type', filter_type: 'select' }]);
    engine.setFilter('f1', 'school');

    const result = engine.apply(sampleFeatures);
    expect(result.length).toBe(2);
    expect(result.every(f => f.properties.type === 'school')).toBe(true);
  });

  it('filters by multiselect type', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'type', filter_type: 'multiselect' }]);
    engine.setFilter('f1', ['school', 'hospital']);

    const result = engine.apply(sampleFeatures);
    expect(result.length).toBe(3);
  });

  it('filters by range type', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'capacity', filter_type: 'range' }]);
    engine.setFilter('f1', { min: 150, max: 250 });

    const result = engine.apply(sampleFeatures);
    expect(result.length).toBe(1);
    expect(result[0].properties.name).toBe('B');
  });

  it('filters by search type', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'name', filter_type: 'search' }]);
    engine.setFilter('f1', 'B');

    const result = engine.apply(sampleFeatures);
    expect(result.length).toBe(1);
    expect(result[0].properties.name).toBe('B');
  });

  it('filters by toggle type', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'active', filter_type: 'toggle' }]);
    engine.setFilter('f1', true);

    const result = engine.apply(sampleFeatures);
    expect(result.length).toBe(2);
    expect(result.every(f => f.properties.active === true)).toBe(true);
  });

  it('clears all filters', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'type', filter_type: 'select' }]);
    engine.setFilter('f1', 'school');
    engine.clearFilters();

    const result = engine.apply(sampleFeatures);
    expect(result.length).toBe(3);
  });

  it('getActiveFilters returns field-value mapping', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([
      { id: 'f1', field: 'type', filter_type: 'select' },
      { id: 'f2', field: 'name', filter_type: 'search' }
    ]);
    engine.setFilter('f1', 'school');
    engine.setFilter('f2', 'A');

    const active = engine.getActiveFilters();
    expect(active).toEqual({ type: 'school', name: 'A' });
  });

  it('setFilter removes filter when value is null, undefined, or empty string', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'type', filter_type: 'select' }]);
    engine.setFilter('f1', 'school');
    expect(engine.activeFilters.has('f1')).toBe(true);

    engine.setFilter('f1', null);
    expect(engine.activeFilters.has('f1')).toBe(false);

    engine.setFilter('f1', 'school');
    engine.setFilter('f1', undefined);
    expect(engine.activeFilters.has('f1')).toBe(false);

    engine.setFilter('f1', 'school');
    engine.setFilter('f1', '');
    expect(engine.activeFilters.has('f1')).toBe(false);
  });

  it('apply returns all features when no active filters', () => {
    const engine = new FilterEngine();
    engine.setFilterConfig([{ id: 'f1', field: 'type', filter_type: 'select' }]);

    const result = engine.apply(sampleFeatures);
    expect(result.length).toBe(3);
  });
});
