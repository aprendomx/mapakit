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

import { MapaKit } from '../src/index.js';

describe('MapaKit layer management', () => {
  let framework;
  let mockRenderer;

  beforeEach(() => {
    mockRenderer = {
      moveLayer: vi.fn(),
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn()
    };

    framework = new MapaKit({
      container: document.createElement('div'),
      configId: 'test',
      configProvider: 'json-static'
    });
    framework.mapRenderer = mockRenderer;
    framework.config = {
      layers: [
        { id: 'l1', layer_type: 'circle', paint: { 'circle-color': '#f59e0b' }, is_visible: true },
        { id: 'l2', layer_type: 'line', paint: { 'line-color': '#6ee7b7' }, is_visible: true },
        { id: 'l3', layer_type: 'fill', paint: { 'fill-color': '#a5b4fc' }, is_visible: true }
      ]
    };
  });

  it('moveLayer calls renderer.moveLayer and reorders config.layers', () => {
    const handler = vi.fn();
    framework.on('layerChange', handler);
    framework.moveLayer('l1', 'l3');
    expect(mockRenderer.moveLayer).toHaveBeenCalledWith('l1', 'l3');
    expect(framework.config.layers.map(l => l.id)).toEqual(['l2', 'l1', 'l3']);
    expect(handler).toHaveBeenCalledWith({ type: 'order', layerId: 'l1', beforeLayerId: 'l3' });
  });

  it('moveLayer to end when beforeLayerId is null', () => {
    framework.moveLayer('l1', null);
    expect(framework.config.layers.map(l => l.id)).toEqual(['l2', 'l3', 'l1']);
  });

  it('setLayerColor auto-detects circle-color and emits event', () => {
    const handler = vi.fn();
    framework.on('layerChange', handler);
    framework.setLayerColor('l1', '#ff0000');
    expect(mockRenderer.setPaintProperty).toHaveBeenCalledWith('l1', 'circle-color', '#ff0000');
    expect(framework.config.layers[0].paint['circle-color']).toBe('#ff0000');
    expect(handler).toHaveBeenCalledWith({ type: 'color', layerId: 'l1', value: '#ff0000' });
  });

  it('setLayerColor auto-detects line-color', () => {
    framework.setLayerColor('l2', '#00ff00');
    expect(mockRenderer.setPaintProperty).toHaveBeenCalledWith('l2', 'line-color', '#00ff00');
  });

  it('setLayerVisible toggles visibility layout', () => {
    const handler = vi.fn();
    framework.on('layerChange', handler);
    framework.setLayerVisible('l1', false);
    expect(mockRenderer.setLayoutProperty).toHaveBeenCalledWith('l1', 'visibility', 'none');
    expect(framework.config.layers[0].is_visible).toBe(false);
    expect(handler).toHaveBeenCalledWith({ type: 'visibility', layerId: 'l1', value: false });
  });
});
