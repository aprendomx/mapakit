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

describe('MapRenderer layer manipulation', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      getLayer: vi.fn((id) => id === 'layer-1'),
      moveLayer: vi.fn(),
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn()
    };
    renderer.map = mockMap;
  });

  it('moveLayer delegates to map.moveLayer', () => {
    renderer.moveLayer('layer-1', 'layer-2');
    expect(mockMap.moveLayer).toHaveBeenCalledWith('layer-1', 'layer-2');
  });

  it('moveLayer does nothing if layer does not exist', () => {
    renderer.moveLayer('nonexistent', 'layer-2');
    expect(mockMap.moveLayer).not.toHaveBeenCalled();
  });

  it('setPaintProperty delegates to map.setPaintProperty', () => {
    renderer.setPaintProperty('layer-1', 'circle-color', '#ff0000');
    expect(mockMap.setPaintProperty).toHaveBeenCalledWith('layer-1', 'circle-color', '#ff0000');
  });

  it('setLayoutProperty delegates to map.setLayoutProperty', () => {
    renderer.setLayoutProperty('layer-1', 'visibility', 'none');
    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith('layer-1', 'visibility', 'none');
  });
});
