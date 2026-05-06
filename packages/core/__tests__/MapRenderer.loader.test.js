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

describe('MapRenderer loading spinner', () => {
  let renderer;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
  });

  it('creates loader element on show', () => {
    renderer._showLoader();
    expect(renderer.loaderEl).not.toBeNull();
    expect(renderer.loaderEl.className).toBe('mlf-map-loader');
    expect(renderer.loaderEl.querySelector('.mlf-map-loader-ring')).not.toBeNull();
  });

  it('hides loader with fade out', () => {
    renderer._showLoader();
    vi.useFakeTimers();
    renderer._hideLoader();
    expect(renderer.loaderEl.style.opacity).toBe('0');
    vi.advanceTimersByTime(300);
    expect(renderer.loaderEl).toBeNull();
    vi.useRealTimers();
  });

  it('does not crash if hide called without show', () => {
    expect(() => renderer._hideLoader()).not.toThrow();
  });
});
