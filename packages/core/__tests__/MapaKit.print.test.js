import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: class MockMaplibreGL {
    static Map = class MockMap {
      on() {}
      once(event, cb) { if (event === 'load') cb(); }
      getCenter() { return { lng: 0, lat: 0 }; }
      getZoom() { return 10; }
      getBearing() { return 0; }
      getPitch() { return 0; }
      getBounds() {
        return {
          getSouthWest: () => ({ lng: -1, lat: -1 }),
          getNorthEast: () => ({ lng: 1, lat: 1 })
        };
      }
      getCanvas() {
        return {
          toDataURL: () => 'data:image/png;base64, mock'
        };
      }
      getLayer() { return null; }
      getSource() { return null; }
      addControl() {}
      removeControl() {}
      addSource() {}
      addLayer() {}
      moveLayer() {}
      setLayoutProperty() {}
      setPaintProperty() {}
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

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } })
    }
  })
}));

vi.mock('../src/offline/OfflineStore.js', () => ({
  OfflineStore: class MockOfflineStore {
    async init() {}
    async saveConfig() {}
    async saveData() {}
    async getData() { return null; }
  }
}));

import { MapaKit } from '../src/index.js';

describe('MapaKit print integration', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          map: { style: {}, ui_layout: {}, initial_center: [0, 0], initial_zoom: 10 },
          sources: [],
          layers: [{ id: 'l1', source_id: 's1', layer_type: 'circle', paint: {}, layout: {} }],
          filters: []
        })
      })
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('wires printMap event to PrintManager', async () => {
    const kit = new MapaKit({
      container: container,
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
    await kit.init();
    // Simulate clicking the print button via UIManager
    kit.uiManager.emit('printMap');
    expect(kit.printManager.isOpen()).toBe(true);
    kit.printManager.closePreview();
    kit.destroy();
  });
});
