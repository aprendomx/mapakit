import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: class MockMaplibreGL {
    static Map = class MockMap {
      constructor(options) { this.options = options; }
      on() {}
      jumpTo() {}
      project() { return { x: 0, y: 0 }; }
      remove() {}
    }
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
      getZoom: () => 10,
      getLayer: () => null,
      removeLayer: vi.fn(),
      getSource: () => null,
      removeSource: vi.fn(),
      removeControl: vi.fn(),
      getCanvas: () => ({ style: {} }),
      remove: vi.fn()
    };
    renderer.map = mockMap;
  });

  it('creates minimap element', () => {
    renderer._initMinimap();
    expect(renderer.minimapEl).not.toBeNull();
    expect(renderer.minimapEl.className).toBe('mlf-minimap');
  });

  it('creates a real, non-interactive MapLibre instance at reduced zoom', () => {
    renderer._styleSpec = { version: 8, sources: {}, layers: [] };
    renderer._initMinimap();
    expect(renderer.minimap).not.toBeNull();
    expect(renderer.minimap.options.interactive).toBe(false);
    // Zoom principal 10 → minimapa 10 - 4 = 6
    expect(renderer.minimap.options.zoom).toBe(6);
    expect(renderer.minimap.options.style).toEqual(renderer._styleSpec);
  });

  it('projects main-map bounds onto the minimap viewport rectangle', () => {
    renderer._initMinimap();
    const box = renderer.minimapEl.querySelector('.mlf-minimap-box');
    Object.defineProperty(box, 'clientWidth', { value: 112 });
    Object.defineProperty(box, 'clientHeight', { value: 60 });
    renderer.minimap.project = vi.fn((p) =>
      p.lng === -100 ? { x: 10, y: 50 } : { x: 90, y: 10 }
    );

    renderer._updateMinimapViewport();

    const viewport = renderer.minimapEl.querySelector('.mlf-minimap-viewport');
    expect(viewport.style.left).toBe('10px');
    expect(viewport.style.top).toBe('10px');
    expect(viewport.style.width).toBe('80px');
    expect(viewport.style.height).toBe('40px');
  });

  it('registers move listener', () => {
    renderer._initMinimap();
    expect(mockMap.on).toHaveBeenCalledWith('move', expect.any(Function));
  });

  it('destroy removes the minimap instance', () => {
    renderer._initMinimap();
    const remove = vi.spyOn(renderer.minimap, 'remove');
    renderer.destroy();
    expect(remove).toHaveBeenCalled();
    expect(renderer.minimap).toBeNull();
  });
});
