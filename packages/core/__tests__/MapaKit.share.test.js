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

describe('MapaKit share map state', () => {
  let mapakit;

  beforeEach(() => {
    mapakit = new MapaKit({
      container: document.createElement('div'),
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
  });

  it('emits shareMap event when button clicked', async () => {
    const handler = vi.fn();
    const { UIManager } = await import('../src/UIManager.js');
    const ui = new UIManager({ container: document.createElement('div'), style: {}, uiLayout: {} });
    ui._injectCSS();
    ui._buildPanel({}, {});
    ui.on('shareMap', handler);
    ui.elements.shareBtn?.click();
    expect(handler).toHaveBeenCalled();
  });

  it('_shareMapState copies window.location.href to clipboard', async () => {
    mapakit.uiManager = {
      showToast: vi.fn()
    };

    const originalClipboard = navigator.clipboard;
    navigator.clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    mapakit._shareMapState();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);

    navigator.clipboard = originalClipboard;
  });
});
