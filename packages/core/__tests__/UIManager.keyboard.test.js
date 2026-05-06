import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('UIManager keyboard shortcuts', () => {
  let ui;

  beforeEach(() => {
    ui = new UIManager({ container: document.createElement('div'), style: {}, uiLayout: {} });
    ui._injectCSS();
    ui._buildPanel({}, {});
    ui._initKeyboardShortcuts();
  });

  afterEach(() => {
    ui.destroy?.();
  });

  it('Escape closes drawer when open', () => {
    const closeDrawerSpy = vi.spyOn(ui, 'closeDrawer');
    ui.elements.panel.classList.add('open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeDrawerSpy).toHaveBeenCalled();
  });

  it('Escape emits escape event when drawer closed', () => {
    const handler = vi.fn();
    ui.on('escape', handler);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handler).toHaveBeenCalled();
  });

  it('Cmd+K focuses search input', () => {
    const focusSpy = vi.spyOn(ui.elements.searchInput, 'focus');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    expect(focusSpy).toHaveBeenCalled();
  });

  it('Ctrl+K focuses search input', () => {
    const focusSpy = vi.spyOn(ui.elements.searchInput, 'focus');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(focusSpy).toHaveBeenCalled();
  });

  it('Cmd+Shift+F emits keyboardClearFilters', () => {
    const handler = vi.fn();
    ui.on('keyboardClearFilters', handler);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F', metaKey: true, shiftKey: true }));
    expect(handler).toHaveBeenCalled();
  });

  it('ignores shortcuts when typing in input', () => {
    const handler = vi.fn();
    ui.on('escape', handler);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    // Escape should still work even in input? Actually for Escape it's fine
    // But Cmd+K in input should NOT prevent default
    const kEvent = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    const preventDefaultSpy = vi.spyOn(kEvent, 'preventDefault');
    input.dispatchEvent(kEvent);
    // In our implementation, we only check isInput for some shortcuts
    // Actually our implementation checks isInput at the top and returns early for ALL shortcuts
    // So let's test that Cmd+K doesn't focus search when in input
    const focusSpy = vi.spyOn(ui.elements.searchInput, 'focus');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    expect(focusSpy).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
