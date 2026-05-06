import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('UIManager layer details animation', () => {
  let ui;

  beforeEach(() => {
    ui = new UIManager({ container: document.createElement('div'), style: {}, uiLayout: { panel: { layerPanel: true } } });
    ui._injectCSS();
    ui._buildPanel({}, {});
    ui.renderLayerPanel([
      { id: 'layer1', name: 'Test Layer', layer_type: 'circle', visible: true, source_id: 's1', min_zoom: 4, max_zoom: 16 }
    ]);
  });

  it('toggles open class on details', () => {
    const item = ui.elements.layerList.querySelector('[data-layer-id="layer1"]');
    const details = item.querySelector('.mlf-lp-details');
    expect(details.classList.contains('open')).toBe(false);
    ui.toggleLayerDetails('layer1');
    expect(details.classList.contains('open')).toBe(true);
    ui.toggleLayerDetails('layer1');
    expect(details.classList.contains('open')).toBe(false);
  });

  it('rotates arrow when toggling', () => {
    const item = ui.elements.layerList.querySelector('[data-layer-id="layer1"]');
    const arrow = item.querySelector('.mlf-lp-arrow');
    expect(arrow.style.transform).toBe('');
    ui.toggleLayerDetails('layer1');
    expect(arrow.style.transform).toBe('rotate(90deg)');
    ui.toggleLayerDetails('layer1');
    expect(arrow.style.transform).toBe('rotate(0deg)');
  });
});
