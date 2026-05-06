import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('UIManager print', () => {
  let ui;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    ui = new UIManager({ container, uiLayout: { panel: { enabled: true } } });
    ui.init({ name: 'Test' }, {});
  });

  afterEach(() => {
    ui.destroy?.();
    container.remove();
    document.querySelector('style#mapakit-ui')?.remove();
  });

  it('renders print button in panel', () => {
    const btn = container.querySelector('.mlf-print-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Imprimir');
    expect(ui.elements.printBtn).toBe(btn);
  });

  it('emits printMap event on button click', () => {
    const handler = vi.fn();
    ui.on('printMap', handler);
    const btn = container.querySelector('.mlf-print-btn');
    btn.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('injects print modal styles', () => {
    const styleTags = Array.from(document.querySelectorAll('style'));
    const hasPrintStyles = styleTags.some(s => s.textContent.includes('.mlf-print-modal'));
    expect(hasPrintStyles).toBe(true);
  });
});
