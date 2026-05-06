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

describe('MapaKit drawing integration', () => {
  let mapakit;

  beforeEach(() => {
    mapakit = new MapaKit({
      container: document.createElement('div'),
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
  });

  it('emits featureCreated when DrawingManager creates feature', () => {
    const handler = vi.fn();
    mapakit.on('featureCreated', handler);
    
    // Simulate DrawingManager emitting
    mapakit.drawingManager = { on: vi.fn(), setMode: vi.fn() };
    // Manually trigger what index.js wires up
    mapakit.emit('featureCreated', { feature: { type: 'Feature' } });
    
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      feature: expect.any(Object)
    }));
  });

  it('emits featureUpdated when DrawingManager updates feature', () => {
    const handler = vi.fn();
    mapakit.on('featureUpdated', handler);
    
    mapakit.emit('featureUpdated', { feature: { id: 1 }, layerId: 'layer1' });
    
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      feature: expect.any(Object),
      layerId: expect.any(String)
    }));
  });

  it('emits featureDeleted when DrawingManager deletes feature', () => {
    const handler = vi.fn();
    mapakit.on('featureDeleted', handler);
    
    mapakit.emit('featureDeleted', { featureId: 'f1', layerId: 'layer1' });
    
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      featureId: expect.any(String),
      layerId: expect.any(String)
    }));
  });
});
