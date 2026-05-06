import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: class MockMaplibreGL {
    static Map = class MockMap {}
    static Popup = class MockPopup {
      constructor() {}
      setLngLat() { return this; }
      setHTML() { return this; }
      addTo() { return this; }
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

describe('MapRenderer popup exit animation', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    const popupEl = document.createElement('div');
    popupEl.innerHTML = '<div class="maplibregl-popup-content"></div>';
    mockMap = {
      on: vi.fn(),
      off: vi.fn()
    };
    renderer.map = mockMap;
    renderer.activePopup = {
      remove: vi.fn(),
      getElement: vi.fn(() => popupEl)
    };
  });

  it('adds leaving class before removing popup', () => {
    vi.useFakeTimers();
    const popup = renderer.activePopup;
    renderer.removePopup();
    const content = popup.getElement().querySelector('.maplibregl-popup-content');
    expect(content.classList.contains('leaving')).toBe(true);
    vi.advanceTimersByTime(150);
    expect(popup.remove).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('removes old popup immediately when adding new one', () => {
    const oldPopup = renderer.activePopup;
    renderer.addPopup([0, 0], '<div>test</div>');
    expect(oldPopup.remove).toHaveBeenCalled();
    expect(renderer.activePopup).not.toBe(oldPopup);
  });
});
