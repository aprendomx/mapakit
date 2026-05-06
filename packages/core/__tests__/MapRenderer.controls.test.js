import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: class MockMaplibreGL {
    static Map = class MockMap {}
    static Popup = class MockPopup {}
    static Marker = class MockMarker {}
    static NavigationControl = class MockNavigationControl {}
    static ScaleControl = class MockScaleControl {}
  }
}));

vi.mock('supercluster', () => ({
  default: class MockSupercluster {
    load() {}
    getClusters() { return []; }
    getClusterExpansionZoom() { return 0; }
  }
}));

import { MapRenderer } from '../src/MapRenderer.js';

describe('MapRenderer controls', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      getContainer: vi.fn(() => document.createElement('div')),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
      getZoom: vi.fn(() => 10),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      flyTo: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      getLayer: vi.fn(() => null),
      getSource: vi.fn(() => null)
    };
    renderer.map = mockMap;
    renderer.initialView = { center: [0, 0], zoom: 10, bearing: 0, pitch: 0 };
  });

  it('adds custom controls when addControls is called', () => {
    renderer.addControls(['geolocate', 'fullscreen', 'reset', 'scale']);
    expect(mockMap.addControl).toHaveBeenCalledTimes(4);
  });

  it('adds only specified controls', () => {
    renderer.addControls(['geolocate']);
    expect(mockMap.addControl).toHaveBeenCalledTimes(1);
  });

  it('flyToReset flies to initial view', () => {
    renderer.flyToReset();
    expect(mockMap.flyTo).toHaveBeenCalledWith(expect.objectContaining({
      center: [0, 0],
      zoom: 10,
      bearing: 0,
      pitch: 0
    }));
  });

  it('removes controls on destroy', () => {
    renderer.addControls(['geolocate', 'fullscreen']);
    renderer.destroy();
    expect(mockMap.removeControl).toHaveBeenCalledTimes(2);
  });
});
