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

describe('MapRenderer reduced motion', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      getLayer: vi.fn(() => ({ type: 'circle' })),
      getPaintProperty: vi.fn(() => 1),
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} }))
    };
    renderer.map = mockMap;
  });

  it('skips rAF animation when prefers-reduced-motion is enabled', async () => {
    // Mock matchMedia
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    await renderer._setLayerOpacity('layer1', 0, 300);

    // Should call setPaintProperty directly without rAF
    expect(mockMap.setPaintProperty).toHaveBeenCalledWith('layer1', 'circle-opacity', 0);

    window.matchMedia = originalMatchMedia;
  });

  it('sets will-change on highlightFeatures', () => {
    const canvasMock = { style: {} };
    mockMap.getCanvas = vi.fn(() => canvasMock);
    renderer._createHighlightLayer = vi.fn(() => {
      // simulate source created
    });
    mockMap.getSource = vi.fn(() => ({ setData: vi.fn() }));
    renderer.highlightFeatures({ type: 'FeatureCollection', features: [] });
    expect(canvasMock.style.willChange).toBe('opacity');
  });

  it('clears will-change on unhighlightFeatures', () => {
    const canvasMock = { style: { willChange: 'opacity' } };
    mockMap.getCanvas = vi.fn(() => canvasMock);
    renderer.unhighlightFeatures();
    expect(canvasMock.style.willChange).toBe('');
  });
});
