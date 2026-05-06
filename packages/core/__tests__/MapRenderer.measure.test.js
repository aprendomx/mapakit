import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: class MockMaplibreGL {
    static Map = class MockMap {}
    static Popup = class MockPopup {
      setLngLat() { return this; }
      setHTML() { return this; }
      addTo() { return this; }
      remove() {}
    }
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

import { MapRenderer } from '../src/MapRenderer.js';

describe('MapRenderer measure tool', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      on: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      getSource: vi.fn(() => ({ setData: vi.fn() })),
      getCanvas: vi.fn(() => ({ style: {} }))
    };
    renderer.map = mockMap;
  });

  it('toggles measure mode', () => {
    expect(renderer.measureMode).toBe(false);
    renderer.toggleMeasureMode(true);
    expect(renderer.measureMode).toBe(true);
    renderer.toggleMeasureMode(false);
    expect(renderer.measureMode).toBe(false);
  });

  it('calculates haversine distance correctly', () => {
    // Distance between two known points
    const d = renderer._haversineDistance([-99.13, 19.43], [-99.14, 19.44]);
    expect(d).toBeGreaterThan(1000); // > 1km
    expect(d).toBeLessThan(2000);    // < 2km
  });

  it('clears measure on toggle off', () => {
    renderer.toggleMeasureMode(true);
    renderer.measurePoints = [[0, 0], [1, 1]];
    renderer.toggleMeasureMode(false);
    expect(renderer.measurePoints).toEqual([]);
  });
});
