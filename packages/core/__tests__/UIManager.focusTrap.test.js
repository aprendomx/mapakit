import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('UIManager focus trap', () => {
  let ui;

  beforeEach(() => {
    ui = new UIManager({ container: document.createElement('div'), style: {}, uiLayout: {} });
    ui._injectCSS();
    ui._buildPanel({}, {});
  });

  it('adds aria attributes to panel', () => {
    const panel = ui.elements.panel;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('aria-label')).toBe('Panel de capas y filtros');
  });

  it('traps focus when drawer opens', () => {
    const addEventListenerSpy = vi.spyOn(ui.elements.panel, 'addEventListener');
    ui.openDrawer();
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('releases focus when drawer closes', () => {
    ui.openDrawer();
    const removeEventListenerSpy = vi.spyOn(ui.elements.panel, 'removeEventListener');
    ui.closeDrawer();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
