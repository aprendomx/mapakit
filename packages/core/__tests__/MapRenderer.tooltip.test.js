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

describe('MapRenderer feature tooltip', () => {
  let renderer;
  let mockMap;

  beforeEach(() => {
    renderer = new MapRenderer({ container: document.createElement('div'), style: {} });
    mockMap = {
      on: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} })),
      queryRenderedFeatures: vi.fn()
    };
    renderer.map = mockMap;
  });

  it('creates tooltip element on setup', () => {
    renderer._setupFeatureTooltip();
    expect(renderer.tooltipEl).not.toBeNull();
    expect(renderer.tooltipEl.className).toBe('mlf-map-tooltip');
  });

  it('shows tooltip on feature hover', () => {
    renderer._setupFeatureTooltip();
    const features = [{ properties: { name: 'School A' } }];
    mockMap.queryRenderedFeatures.mockReturnValue(features);
    
    // Simulate mousemove
    const mousemoveHandler = mockMap.on.mock.calls.find(c => c[0] === 'mousemove')[1];
    mousemoveHandler({ point: { x: 100, y: 200 } });
    
    expect(renderer.tooltipEl.style.display).toBe('block');
    expect(renderer.tooltipEl.textContent).toBe('School A');
  });

  it('hides tooltip when no feature under cursor', () => {
    renderer._setupFeatureTooltip();
    mockMap.queryRenderedFeatures.mockReturnValue([]);
    
    const mousemoveHandler = mockMap.on.mock.calls.find(c => c[0] === 'mousemove')[1];
    mousemoveHandler({ point: { x: 100, y: 200 } });
    
    expect(renderer.tooltipEl.style.display).toBe('none');
  });
});
