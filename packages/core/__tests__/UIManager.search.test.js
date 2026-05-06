import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('UIManager search results', () => {
  let ui;

  beforeEach(() => {
    ui = new UIManager({ container: document.createElement('div'), style: {}, uiLayout: {} });
    ui._injectCSS();
    ui._buildPanel({}, {});
  });

  it('renderSearchResults shows matching features', () => {
    const features = [
      { type: 'Feature', properties: { name: 'School A' }, geometry: { type: 'Point', coordinates: [0, 0] } },
      { type: 'Feature', properties: { name: 'School B' }, geometry: { type: 'Point', coordinates: [1, 1] } }
    ];
    ui.renderSearchResults(features);
    expect(ui.elements.searchResults.style.display).toBe('block');
    expect(ui.elements.searchResults.children.length).toBe(2);
  });

  it('renderSearchResults hides when empty', () => {
    ui.renderSearchResults([]);
    expect(ui.elements.searchResults.style.display).toBe('none');
  });

  it('emits highlightSearchResult on mouseenter', () => {
    const handler = vi.fn();
    ui.on('highlightSearchResult', handler);
    const features = [{ type: 'Feature', properties: { name: 'School A' }, geometry: { type: 'Point', coordinates: [0, 0] } }];
    ui.renderSearchResults(features);
    ui.elements.searchResults.children[0].dispatchEvent(new MouseEvent('mouseenter'));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ feature: features[0] }));
  });

  it('emits unhighlight on mouseleave', () => {
    const handler = vi.fn();
    ui.on('unhighlight', handler);
    const features = [{ type: 'Feature', properties: { name: 'School A' }, geometry: { type: 'Point', coordinates: [0, 0] } }];
    ui.renderSearchResults(features);
    ui.elements.searchResults.children[0].dispatchEvent(new MouseEvent('mouseleave'));
    expect(handler).toHaveBeenCalled();
  });
});
