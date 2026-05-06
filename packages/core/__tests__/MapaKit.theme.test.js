import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('Theme toggle', () => {
  let ui;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    ui = new UIManager({ container, style: {}, uiLayout: {} });
    ui._injectCSS();
    ui._buildPanel({}, {});
  });

  it('toggles mlf-light class on container', () => {
    expect(container.classList.contains('mlf-light')).toBe(false);
    ui.elements.themeBtn.click();
    expect(container.classList.contains('mlf-light')).toBe(true);
    ui.elements.themeBtn.click();
    expect(container.classList.contains('mlf-light')).toBe(false);
  });

  it('emits themeChange event', () => {
    const handler = vi.fn();
    ui.on('themeChange', handler);
    ui.elements.themeBtn.click();
    expect(handler).toHaveBeenCalledWith({ theme: 'light' });
    ui.elements.themeBtn.click();
    expect(handler).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('updates button icon and aria-label', () => {
    const btn = ui.elements.themeBtn;
    expect(btn.innerHTML).toBe('🌙');
    btn.click();
    expect(btn.innerHTML).toBe('☀️');
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a tema oscuro');
  });
});
