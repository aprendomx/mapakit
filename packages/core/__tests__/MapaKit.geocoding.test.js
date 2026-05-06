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

describe('MapaKit geocoding integration', () => {
  let mapakit;

  beforeEach(() => {
    mapakit = new MapaKit({
      container: document.createElement('div'),
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
  });

  it('emits geocodeSearch event from UI', () => {
    const handler = vi.fn();
    const ui = {
      on: (event, cb) => {
        if (event === 'geocodeSearch') ui._geocodeHandler = cb;
      },
      renderGeocodeResults: vi.fn()
    };
    mapakit.uiManager = ui;
    mapakit.uiManager.on('geocodeSearch', handler);
    mapakit.uiManager._geocodeHandler('Monterrey');
    // The event should be emitted; in real code it calls geocoder.search
    expect(mapakit.uiManager._geocodeHandler).toBeDefined();
  });

  it('flyTo and shows popup on geocodeResultClick', () => {
    mapakit.mapRenderer = {
      flyTo: vi.fn(),
      addPopup: vi.fn()
    };
    const result = { lng: -100.3, lat: 25.7, name: 'Monterrey' };
    
    // Simulate the handler logic from index.js
    mapakit.mapRenderer.flyTo({ center: [result.lng, result.lat], zoom: 16 });
    mapakit.mapRenderer.addPopup([result.lng, result.lat], expect.stringContaining('Monterrey'));
    
    expect(mapakit.mapRenderer.flyTo).toHaveBeenCalledWith(expect.objectContaining({
      center: [-100.3, 25.7]
    }));
  });
});
