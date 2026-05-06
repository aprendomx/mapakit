import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: class MockMaplibreGL {
    static Map = class MockMap {}
    static Popup = class MockPopup {}
    static Marker = class MockMarker {}
    static NavigationControl = class MockNavigationControl {}
  }
}));

vi.mock('supercluster', () => ({
  default: class MockSupercluster {
    load() {}
    getClusters() { return []; }
    getClusterExpansionZoom() { return 0; }
  }
}));

import { MapaKit } from '../src/index.js';

describe('MapaKit performance optimizations', () => {
  let mapakit;

  beforeEach(() => {
    mapakit = new MapaKit({
      container: document.createElement('div'),
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
  });

  it('debounces filter application', () => {
    vi.useFakeTimers();
    mapakit.filterEngine = { setFilter: vi.fn(), activeFilters: new Map() };
    mapakit._applyFiltersAndUpdate = vi.fn();
    
    mapakit._applyFiltersDebounced();
    expect(mapakit._applyFiltersAndUpdate).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(150);
    expect(mapakit._applyFiltersAndUpdate).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('cancels previous debounced call', () => {
    vi.useFakeTimers();
    mapakit._applyFiltersAndUpdate = vi.fn();
    
    mapakit._applyFiltersDebounced();
    mapakit._applyFiltersDebounced();
    mapakit._applyFiltersDebounced();
    
    vi.advanceTimersByTime(150);
    expect(mapakit._applyFiltersAndUpdate).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });
});
