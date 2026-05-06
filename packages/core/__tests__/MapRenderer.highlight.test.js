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

describe('MapRenderer highlight', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    const sources = new Map();
    const layers = new Map();
    mockMap = {
      getLayer: vi.fn((id) => layers.get(id) || null),
      getSource: vi.fn((id) => sources.get(id) || null),
      addSource: vi.fn((id, spec) => sources.set(id, { setData: vi.fn() })),
      addLayer: vi.fn((spec) => layers.set(spec.id, spec)),
      setLayoutProperty: vi.fn(),
      setPaintProperty: vi.fn()
    };
    renderer.map = mockMap;
  });

  it('creates highlight source and layers on init', () => {
    renderer._createHighlightLayer();
    expect(mockMap.addSource).toHaveBeenCalledWith('mapakit-highlight', expect.objectContaining({ type: 'geojson' }));
    expect(mockMap.addLayer).toHaveBeenCalledTimes(3);
  });

  it('highlightFeatures sets data and makes layers visible', () => {
    renderer._createHighlightLayer();
    const geojson = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }] };
    renderer.highlightFeatures(geojson);
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('mapakit-highlight-circle', 'visibility', 'visible');
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('mapakit-highlight-line', 'visibility', 'visible');
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('mapakit-highlight-fill', 'visibility', 'visible');
  });

  it('unhighlightFeatures hides all highlight layers', () => {
    renderer._createHighlightLayer();
    renderer.unhighlightFeatures();
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('mapakit-highlight-circle', 'visibility', 'none');
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('mapakit-highlight-line', 'visibility', 'none');
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('mapakit-highlight-fill', 'visibility', 'none');
  });
});
