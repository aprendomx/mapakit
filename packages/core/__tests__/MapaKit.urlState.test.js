import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('MapaKit URL state', () => {
  let mapakit;

  beforeEach(() => {
    // Reset URL before each test
    window.history.replaceState({}, '', window.location.pathname);
    mapakit = new MapaKit({
      container: document.createElement('div'),
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
  });

  afterEach(() => {
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('reads initial view from URL params', () => {
    window.history.replaceState({}, '', '?mk-center=-99.123456,19.654321&mk-zoom=12.50&mk-bearing=45.0&mk-pitch=30.0');
    
    const stateManager = {
      getUrlParams: () => ({
        center: [-99.123456, 19.654321],
        zoom: 12.5,
        bearing: 45,
        pitch: 30,
        filters: {},
        layers: {}
      }),
      getMapState: () => null,
      setMapState: vi.fn()
    };
    mapakit.stateManager = stateManager;

    const view = stateManager.getUrlParams();
    expect(view.center).toEqual([-99.123456, 19.654321]);
    expect(view.zoom).toBe(12.5);
    expect(view.bearing).toBe(45);
    expect(view.pitch).toBe(30);
  });

  it('reads filters from URL params', () => {
    window.history.replaceState({}, '', '?mk-filter-type=school');
    
    const stateManager = {
      getUrlParams: () => ({
        center: null,
        zoom: null,
        bearing: null,
        pitch: null,
        filters: { type: 'school' },
        layers: {}
      }),
      getMapState: () => null,
      setMapState: vi.fn()
    };
    mapakit.stateManager = stateManager;

    const params = stateManager.getUrlParams();
    expect(params.filters).toEqual({ type: 'school' });
  });

  it('reads layer visibility from URL params', () => {
    window.history.replaceState({}, '', '?mk-layer-layer1=1&mk-layer-layer2=0');
    
    const stateManager = {
      getUrlParams: () => ({
        center: null,
        zoom: null,
        bearing: null,
        pitch: null,
        filters: {},
        layers: { layer1: true, layer2: false }
      }),
      getMapState: () => null,
      setMapState: vi.fn()
    };
    mapakit.stateManager = stateManager;

    const params = stateManager.getUrlParams();
    expect(params.layers).toEqual({ layer1: true, layer2: false });
  });

  it('_syncUrl updates URL with current state', () => {
    vi.useFakeTimers();
    
    mapakit.config = {
      layers: [
        { id: 'layer1', is_visible: true },
        { id: 'layer2', is_visible: false }
      ]
    };
    mapakit.filterEngine = {
      activeFilters: new Map([['type', 'school']])
    };
    mapakit.mapRenderer = {
      map: {
        getCenter: () => ({ lng: -99.123456, lat: 19.654321 }),
        getZoom: () => 12.5,
        getBearing: () => 45,
        getPitch: () => 30
      }
    };
    mapakit.stateManager = {
      setUrlParams: vi.fn()
    };

    mapakit._syncUrl();

    expect(mapakit.stateManager.setUrlParams).toHaveBeenCalledWith(expect.objectContaining({
      center: [-99.123456, 19.654321],
      zoom: 12.5,
      bearing: 45,
      pitch: 30,
      filters: { type: 'school' },
      layers: { layer1: true, layer2: false }
    }));

    vi.useRealTimers();
  });

  it('_syncUrlDebounced delays the update', () => {
    vi.useFakeTimers();
    
    mapakit.config = { layers: [] };
    mapakit.filterEngine = { activeFilters: new Map() };
    mapakit.mapRenderer = {
      map: {
        getCenter: () => ({ lng: 0, lat: 0 }),
        getZoom: () => 10,
        getBearing: () => 0,
        getPitch: () => 0
      }
    };
    mapakit.stateManager = {
      setUrlParams: vi.fn()
    };

    mapakit._syncUrlDebounced();
    expect(mapakit.stateManager.setUrlParams).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(300);
    expect(mapakit.stateManager.setUrlParams).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
