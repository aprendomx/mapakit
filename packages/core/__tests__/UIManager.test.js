import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../src/UIManager.js';

// Polyfill DragEvent for jsdom
if (typeof DragEvent === 'undefined') {
  global.DragEvent = class DragEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.dataTransfer = init.dataTransfer || null;
    }
  };
}

describe('UIManager layer panel', () => {
  let ui;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    ui = new UIManager({ container: '#test-container', style: {}, uiLayout: { panel: { enabled: true } } });
  });

  afterEach(() => {
    ui.destroy();
    container.remove();
  });

  it('renderLayerPanel creates draggable layer items', () => {
    ui.init({ name: 'Test' }, {});
    const layers = [
      { id: 'l1', layer_type: 'circle', paint: { 'circle-color': '#f59e0b' }, is_visible: true },
      { id: 'l2', layer_type: 'line', paint: { 'line-color': '#6ee7b7' }, is_visible: true }
    ];
    ui.renderLayerPanel(layers);
    const items = container.querySelectorAll('.mlf-lp-item');
    expect(items.length).toBe(2);
    expect(items[0].draggable).toBe(true);
    expect(items[0].dataset.layerId).toBe('l1');
  });

  it('emits layerChange order on drop', () => {
    const handler = vi.fn();
    ui.on('layerChange', handler);
    ui.init({ name: 'Test' }, {});
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: {}, is_visible: true },
      { id: 'l2', layer_type: 'line', paint: {}, is_visible: true }
    ]);

    const item1 = container.querySelector('[data-layer-id="l1"]');
    const list = container.querySelector('.mlf-lp-list');

    const dragStartEvent = new DragEvent('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', { value: { setData: vi.fn(), getData: vi.fn(() => 'l1') } });
    item1.dispatchEvent(dragStartEvent);

    const dropEvent = new DragEvent('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: { getData: vi.fn(() => 'l1') } });
    Object.defineProperty(dropEvent, 'target', { value: list });
    list.dispatchEvent(dropEvent);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'order', layerId: 'l1' }));
  });

  it('emits layerChange color on color input change', () => {
    const handler = vi.fn();
    ui.on('layerChange', handler);
    ui.init({ name: 'Test' }, {});
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: { 'circle-color': '#f59e0b' }, is_visible: true }
    ]);

    const colorInput = container.querySelector('.mlf-lp-color-input');
    colorInput.value = '#ff0000';
    colorInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(handler).toHaveBeenCalledWith({ type: 'color', layerId: 'l1', value: '#ff0000' });
  });

  it('emits layerChange visibility on eye toggle', () => {
    const handler = vi.fn();
    ui.on('layerChange', handler);
    ui.init({ name: 'Test' }, {});
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: {}, is_visible: true }
    ]);

    const eyeBtn = container.querySelector('.mlf-lp-eye');
    eyeBtn.click();

    expect(handler).toHaveBeenCalledWith({ type: 'visibility', layerId: 'l1', value: false });
  });

  it('renderLayerPanel is idempotent (does not duplicate panel)', () => {
    ui.init({ name: 'Test' }, {});
    const layers = [{ id: 'l1', layer_type: 'circle', paint: {}, is_visible: true }];
    ui.renderLayerPanel(layers);
    ui.renderLayerPanel(layers);
    const panels = container.querySelectorAll('.mlf-layer-panel');
    expect(panels.length).toBe(1);
    const items = container.querySelectorAll('.mlf-lp-item');
    expect(items.length).toBe(1);
  });

  it('updateLayerColor updates dot and input', () => {
    ui.init({ name: 'Test' }, {});
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: { 'circle-color': '#f59e0b' }, is_visible: true }
    ]);

    ui.updateLayerColor('l1', '#00ff00');
    const dot = container.querySelector('[data-layer-id="l1"] .mlf-lp-dot');
    const input = container.querySelector('[data-layer-id="l1"] .mlf-lp-color-input');
    expect(dot.style.background).toBe('rgb(0, 255, 0)');
    expect(input.value).toBe('#00ff00');
  });

  it('updateLayerVisibility toggles eye button', () => {
    ui.init({ name: 'Test' }, {});
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: {}, is_visible: true }
    ]);

    ui.updateLayerVisibility('l1', false);
    const eye = container.querySelector('[data-layer-id="l1"] .mlf-lp-eye');
    expect(eye.classList.contains('hidden')).toBe(true);

    ui.updateLayerVisibility('l1', true);
    expect(eye.classList.contains('hidden')).toBe(false);
  });
});

describe('UIManager layer panel enhancements', () => {
  let ui;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    ui = new UIManager({ container: '#test-container', style: { primary: '#f59e0b' }, uiLayout: { panel: { enabled: true } } });
    ui.init({ name: 'Test' }, {});
  });

  afterEach(() => {
    ui.destroy();
    container.remove();
  });

  it('renderLayerPanel shows feature count badge', () => {
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: { 'circle-color': '#f59e0b' }, is_visible: true }
    ]);
    const count = container.querySelector('.mlf-lp-count');
    expect(count).toBeTruthy();
    expect(count.textContent).toBe('0');
  });

  it('updateLayerCount updates the badge and details feature count', () => {
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: {}, is_visible: true }
    ]);
    ui.updateLayerCount('l1', 42);
    const count = container.querySelector('.mlf-lp-count');
    expect(count.textContent).toBe('42');
    const detailCount = container.querySelector('.mlf-lp-fc');
    expect(detailCount.textContent).toBe('42');
  });

  it('toggleLayerDetails expands and collapses and rotates arrow', () => {
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: {}, is_visible: true, min_zoom: 4, max_zoom: 16 }
    ]);
    const details = container.querySelector('.mlf-lp-details');
    const arrow = container.querySelector('.mlf-lp-arrow');
    expect(details.classList.contains('open')).toBe(false);
    expect(arrow.style.transform).toBe('');
    ui.toggleLayerDetails('l1');
    expect(details.classList.contains('open')).toBe(true);
    expect(arrow.style.transform).toBe('rotate(90deg)');
    ui.toggleLayerDetails('l1');
    expect(details.classList.contains('open')).toBe(false);
    expect(arrow.style.transform).toBe('rotate(0deg)');
  });

  it('renderLayerPanel renders details content with legend sample, type and zoom range', () => {
    ui.renderLayerPanel([
      { id: 'l1', layer_type: 'circle', paint: { 'circle-color': '#f59e0b' }, is_visible: true, min_zoom: 4, max_zoom: 16 }
    ]);
    const details = container.querySelector('.mlf-lp-details');
    const legendSample = details.querySelector('.mlf-lp-lg-sample');
    expect(legendSample).toBeTruthy();
    expect(legendSample.style.background).toBe('rgb(245, 158, 11)');
    expect(details.textContent).toContain('circle');
    expect(details.textContent).toContain('Zoom: 4–16');
    expect(details.textContent).toContain('Features:');
  });
});

describe('UIManager skeleton', () => {
  let ui;
  let container;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    ui = new UIManager({ container: '#test-container', style: {}, uiLayout: { panel: { enabled: true } } });
  });

  afterEach(() => {
    ui.destroy();
    container.remove();
    vi.useRealTimers();
  });

  it('showSkeleton creates skeleton element', () => {
    ui.showSkeleton();
    const skeleton = container.querySelector('.mlf-skeleton');
    expect(skeleton).toBeTruthy();
    expect(skeleton.style.display).toBe('block');
  });

  it('hideSkeleton removes skeleton after fade', () => {
    ui.showSkeleton();
    expect(container.querySelector('.mlf-skeleton')).toBeTruthy();
    ui.hideSkeleton();
    vi.advanceTimersByTime(350);
    expect(container.querySelector('.mlf-skeleton')).toBeFalsy();
  });

  it('showSkeleton during fade-out restores visibility', () => {
    ui.showSkeleton();
    ui.hideSkeleton();
    // Skeleton should be fading out (opacity: 0)
    expect(ui.elements.skeleton.style.opacity).toBe('0');
    // Call showSkeleton again during fade
    ui.showSkeleton();
    expect(ui.elements.skeleton.style.opacity).toBe('1');
    expect(ui.elements.skeleton.style.display).toBe('block');
  });
});
