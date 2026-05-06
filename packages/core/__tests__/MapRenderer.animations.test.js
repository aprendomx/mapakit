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

describe('MapRenderer animations', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      getLayer: vi.fn((id) => id === 'l1' ? { type: 'circle' } : null),
      getPaintProperty: vi.fn(() => 1),
      setPaintProperty: vi.fn()
    };
    renderer.map = mockMap;
  });

  it('_setLayerOpacity interpolates opacity with rAF', async () => {
    const promise = renderer._setLayerOpacity('l1', 0, 50);
    // Let rAF run a few frames
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 10));
    }
    await promise;
    expect(mockMap.setPaintProperty).toHaveBeenCalled();
    const lastCall = mockMap.setPaintProperty.mock.calls[mockMap.setPaintProperty.mock.calls.length - 1];
    expect(lastCall[0]).toBe('l1');
    expect(lastCall[1]).toBe('circle-opacity');
    expect(lastCall[2]).toBeCloseTo(0, 1);
  });

  it('uses requestAnimationFrame for interpolation', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 5));
    const promise = renderer._setLayerOpacity('l1', 0, 50);
    await new Promise(r => setTimeout(r, 100));
    await promise;
    expect(rafSpy).toHaveBeenCalled();
    rafSpy.mockRestore();
  });
});
