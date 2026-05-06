import { describe, it, expect, beforeEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('UIManager accessibility', () => {
  let ui;

  beforeEach(() => {
    ui = new UIManager({ container: document.createElement('div'), style: {}, uiLayout: {} });
    ui._injectCSS();
    ui._buildPanel({}, {});
    ui.renderLayerPanel([
      { id: 'layer1', name: 'Test Layer', layer_type: 'circle', visible: true, source_id: 's1', min_zoom: 4, max_zoom: 16 }
    ]);
    ui.buildFilterGroup(
      { id: 'type', label: 'Tipo', field: 'tipo', color: '#f59e0b' },
      [{ label: 'A', value: 'a', count: 5 }]
    );
  });

  it('layer item has role=listitem', () => {
    const item = ui.elements.layerList.querySelector('[data-layer-id="layer1"]');
    expect(item.getAttribute('role')).toBe('listitem');
  });

  it('layer eye toggle has aria-pressed and aria-label', () => {
    const item = ui.elements.layerList.querySelector('[data-layer-id="layer1"]');
    const eye = item.querySelector('.mlf-lp-eye');
    expect(eye.hasAttribute('aria-pressed')).toBe(true);
    expect(eye.getAttribute('aria-label')).toContain('capa');
  });

  it('layer arrow has aria-expanded', () => {
    const item = ui.elements.layerList.querySelector('[data-layer-id="layer1"]');
    const arrow = item.querySelector('.mlf-lp-arrow');
    expect(arrow.getAttribute('aria-expanded')).toBe('false');
    ui.toggleLayerDetails('layer1');
    expect(arrow.getAttribute('aria-expanded')).toBe('true');
  });

  it('filter group has role=group and aria-label', () => {
    const group = ui.elements.filterList.querySelector('.mlf-ic');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Tipo');
  });

  it('filter rows have role=button and aria-pressed', () => {
    const row = ui.elements.filterList.querySelector('.mlf-br');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('aria-pressed')).toBe('false');
  });

  it('search input has role=searchbox', () => {
    expect(ui.elements.searchInput.getAttribute('role')).toBe('searchbox');
  });
});
