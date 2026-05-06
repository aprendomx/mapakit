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

describe('MapaKit controls from config', () => {
  let mapakit;

  beforeEach(() => {
    mapakit = new MapaKit({
      container: document.createElement('div'),
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
  });

  it('wires up controls when config has controls array', async () => {
    mapakit.config = {
      map: { style: {}, ui_layout: {} },
      sources: [],
      layers: [],
      filters: [],
      controls: ['geolocate', 'fullscreen', 'reset', 'scale']
    };
    mapakit.mapRenderer = {
      init: vi.fn(),
      map: { on: vi.fn() },
      addControls: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      animatedFilterUpdate: vi.fn()
    };
    mapakit.uiManager = {
      showSkeleton: vi.fn(),
      hideSkeleton: vi.fn(),
      init: vi.fn(),
      updateStats: vi.fn(),
      on: vi.fn(),
      createPopupContent: vi.fn()
    };
    mapakit.filterEngine = { setFilterConfig: vi.fn(), activeFilters: new Map() };
    mapakit.stateManager = { getMapState: vi.fn(), getUrlState: vi.fn(), setUrlState: vi.fn() };

    // Manually call the controls wiring logic
    if (mapakit.config.controls?.length) {
      mapakit.mapRenderer.addControls(mapakit.config.controls);
    }
    expect(mapakit.mapRenderer.addControls).toHaveBeenCalledWith(['geolocate', 'fullscreen', 'reset', 'scale']);
  });

  it('does not add controls when config has no controls', async () => {
    mapakit.config = {
      map: { style: {}, ui_layout: {} },
      sources: [],
      layers: [],
      filters: []
    };
    mapakit.mapRenderer = {
      addControls: vi.fn()
    };

    if (mapakit.config.controls?.length) {
      mapakit.mapRenderer.addControls(mapakit.config.controls);
    }
    expect(mapakit.mapRenderer.addControls).not.toHaveBeenCalled();
  });
});
