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
import { ExportService } from '../src/services/ExportService.js';

describe('MapaKit export integration', () => {
  let mapakit;

  beforeEach(() => {
    mapakit = new MapaKit({
      container: document.createElement('div'),
      configProvider: 'json-static',
      configId: 'mapa-agenda'
    });
  });

  it('_exportVisibleFeatures shows toast when no features', () => {
    mapakit.config = { sources: [] };
    mapakit.geojsonData = new Map();
    mapakit.filterEngine = { apply: (f) => f };
    mapakit.searchQuery = '';
    mapakit.uiManager = { showToast: vi.fn() };
    
    mapakit._exportVisibleFeatures();
    
    expect(mapakit.uiManager.showToast).toHaveBeenCalledWith(
      'No hay features visibles para exportar',
      '#ef4444'
    );
  });

  it('_exportVisibleFeatures exports filtered features', () => {
    mapakit.config = { sources: [{ id: 's1' }] };
    mapakit.geojsonData = new Map([['s1', {
      features: [
        { type: 'Feature', properties: { name: 'A' }, geometry: { type: 'Point', coordinates: [0, 0] } },
        { type: 'Feature', properties: { name: 'B' }, geometry: { type: 'Point', coordinates: [1, 1] } }
      ]
    }]]);
    mapakit.filterEngine = { apply: (f) => f.filter(x => x.properties.name === 'A') };
    mapakit.searchQuery = '';
    mapakit.uiManager = { showToast: vi.fn() };
    
    const downloadSpy = vi.spyOn(ExportService, 'download').mockImplementation(() => {});
    
    mapakit._exportVisibleFeatures();
    
    expect(downloadSpy).toHaveBeenCalled();
    const exportedData = downloadSpy.mock.calls[0][0];
    expect(exportedData.type).toBe('FeatureCollection');
    expect(exportedData.features).toHaveLength(1);
    expect(exportedData.features[0].properties.name).toBe('A');
    
    downloadSpy.mockRestore();
  });
});
