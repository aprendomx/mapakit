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

describe('MapRenderer minimap', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      on: vi.fn(),
      getBounds: vi.fn(() => ({
        getSouthWest: () => ({ lng: -100, lat: 18 }),
        getNorthEast: () => ({ lng: -98, lat: 20 })
      })),
      getCenter: () => ({ lng: -99, lat: 19 }),
      getZoom: () => 10
    };
    renderer.map = mockMap;
  });

  it('creates minimap element', () => {
    renderer._initMinimap();
    expect(renderer.minimapEl).not.toBeNull();
    expect(renderer.minimapEl.className).toBe('mlf-minimap');
  });

  it('updates viewport size based on zoom', () => {
    renderer._initMinimap();
    const viewport = renderer.minimapEl.querySelector('.mlf-minimap-viewport');
    expect(viewport).not.toBeNull();
    
    // At zoom 10, size should be 100 - 10*5 = 50%
    renderer._updateMinimapViewport();
    expect(viewport.style.width).toBe('50%');
    expect(viewport.style.height).toBe('50%');
  });

  it('registers move listener', () => {
    renderer._initMinimap();
    expect(mockMap.on).toHaveBeenCalledWith('move', expect.any(Function));
  });
});
