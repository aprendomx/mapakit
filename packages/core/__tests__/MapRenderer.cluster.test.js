import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: class MockMaplibreGL {
    static Map = class MockMap {}
    static Popup = class MockPopup {}
    static Marker = class MockMarker {
      constructor(opts) {
        this._el = opts?.element;
      }
      setLngLat() { return this; }
      addTo() { return this; }
      getElement() { return this._el; }
    }
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

describe('MapRenderer cluster click', () => {
  let renderer;
  let mockMap;
  let mockIndex;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      getBounds: vi.fn(() => ({
        getWest: () => -100,
        getSouth: () => 19,
        getEast: () => -99,
        getNorth: () => 20
      })),
      getZoom: vi.fn(() => 5),
      flyTo: vi.fn()
    };
    mockIndex = {
      getClusters: vi.fn(() => [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-99.1, 19.5] },
          properties: { cluster: true, point_count: 5, cluster_id: 123 }
        }
      ]),
      getClusterExpansionZoom: vi.fn(() => 14)
    };
    renderer.map = mockMap;
    renderer.clusterIndex.set('source1', { index: mockIndex, layerConfig: {}, geojson: {} });
  });

  it('flyTo expansion zoom on cluster click', () => {
    renderer._drawClustersForSource('source1');

    expect(renderer.clusterMarkers.length).toBe(1);
    const markerEl = renderer.clusterMarkers[0].getElement();

    markerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(mockIndex.getClusterExpansionZoom).toHaveBeenCalledWith(123);
    expect(mockMap.flyTo).toHaveBeenCalledWith(expect.objectContaining({
      center: [-99.1, 19.5],
      zoom: 15
    }));
  });

  it('stops event propagation on cluster click', () => {
    renderer._drawClustersForSource('source1');

    const markerEl = renderer.clusterMarkers[0].getElement();
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    markerEl.dispatchEvent(clickEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
