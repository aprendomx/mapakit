import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

describe('UIManager reduced motion', () => {
  let ui;

  beforeEach(() => {
    ui = new UIManager({ container: document.createElement('div'), style: {}, uiLayout: {} });
    ui._injectCSS();
  });

  it('includes prefers-reduced-motion CSS', () => {
    const styleTag = document.querySelector('style');
    expect(styleTag.textContent).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
