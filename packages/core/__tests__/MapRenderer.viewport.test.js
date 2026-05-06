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

import { MapRenderer } from '../src/MapRenderer.js';

describe('MapRenderer viewport filtering', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      getBounds: vi.fn(() => ({
        getWest: () => -100,
        getSouth: () => 18,
        getEast: () => -98,
        getNorth: () => 20
      })),
      getZoom: vi.fn(() => 8)
    };
    renderer.map = mockMap;
  });

  it('gets viewport bbox', () => {
    const bbox = renderer._getViewportBbox();
    expect(bbox).toEqual({ west: -100, south: 18, east: -98, north: 20 });
  });

  it('filters features outside viewport', () => {
    const features = [
      { properties: {}, geometry: { type: 'Point', coordinates: [-99, 19] }, bbox: [-99.1, 18.9, -98.9, 19.1] },
      { properties: {}, geometry: { type: 'Point', coordinates: [-50, 50] }, bbox: [-50.1, 49.9, -49.9, 50.1] }
    ];
    const viewport = { west: -100, south: 18, east: -98, north: 20 };
    const filtered = renderer._filterByViewport(features, viewport);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].geometry.coordinates).toEqual([-99, 19]);
  });

  it('keeps features without bbox', () => {
    const features = [{ properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } }];
    const viewport = { west: -100, south: 18, east: -98, north: 20 };
    const filtered = renderer._filterByViewport(features, viewport);
    expect(filtered).toHaveLength(1);
  });

  it('calculates bbox for Point geometry', () => {
    const geometry = { type: 'Point', coordinates: [-99, 19] };
    const bbox = renderer._calculateBbox(geometry);
    expect(bbox).toEqual([-99, 19, -99, 19]);
  });
});
