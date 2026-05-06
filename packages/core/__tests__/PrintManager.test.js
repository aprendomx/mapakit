import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrintManager } from '../src/PrintManager.js';

describe('PrintManager', () => {
  let mockMapRenderer;
  let mockUiManager;

  beforeEach(() => {
    document.body.innerHTML = '';
    mockMapRenderer = {
      map: {
        getCanvas: vi.fn(() => ({
          toDataURL: vi.fn(() => 'data:image/png;base64,abc123')
        })),
        getZoom: vi.fn(() => 10)
      }
    };
    mockUiManager = {
      showToast: vi.fn()
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('constructs with mapRenderer and uiManager', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    expect(pm).toBeDefined();
    expect(pm.isOpen()).toBe(false);
  });

  it('captures canvas and opens preview modal', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    expect(mockMapRenderer.map.getCanvas).toHaveBeenCalled();
    expect(pm.isOpen()).toBe(true);
    expect(document.querySelector('.mlf-print-modal')).toBeTruthy();
    pm.closePreview();
  });

  it('shows error toast on canvas capture failure', () => {
    mockMapRenderer.map.getCanvas.mockImplementation(() => {
      throw new Error('WebGL lost');
    });
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    expect(mockUiManager.showToast).toHaveBeenCalledWith('No se pudo capturar el mapa. Intenta de nuevo.', '#ef4444');
    expect(pm.isOpen()).toBe(false);
  });

  it('renders options panel with paper size and orientation', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const card = document.querySelector('.mlf-print-card');
    expect(card.textContent).toContain('A4');
    expect(card.textContent).toContain('Retrato');
    expect(card.textContent).toContain('Incluir leyenda');
    expect(card.textContent).toContain('Incluir escala');
    pm.closePreview();
  });

  it('updates preview aspect ratio on orientation change', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const paper = document.querySelector('.mlf-print-paper');
    const portraitRatio = parseFloat(paper.style.aspectRatio);
    expect(portraitRatio).toBeCloseTo(0.707, 2);
    const landscapeRadio = document.querySelector('input[name="mlf-print-orientation"][value="landscape"]');
    landscapeRadio.checked = true;
    landscapeRadio.dispatchEvent(new Event('change'));
    expect(pm.options.orientation).toBe('landscape');
    const landscapeRatio = parseFloat(paper.style.aspectRatio);
    expect(landscapeRatio).toBeCloseTo(1.414, 2);
    pm.closePreview();
  });

  it('toggles legend visibility on checkbox change', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const legendCheckbox = document.querySelector('input[name="mlf-print-legend"]');
    legendCheckbox.checked = false;
    legendCheckbox.dispatchEvent(new Event('change'));
    const legend = document.querySelector('.mlf-print-legend');
    expect(legend.style.display).toBe('none');
    pm.closePreview();
  });

  it('toggles scale visibility on checkbox change', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const scaleCheckbox = document.querySelector('input[name="mlf-print-scale"]');
    scaleCheckbox.checked = false;
    scaleCheckbox.dispatchEvent(new Event('change'));
    const scale = document.querySelector('.mlf-print-scale');
    expect(scale.style.display).toBe('none');
    pm.closePreview();
  });

  it('renders legend with visible layer names and colors', () => {
    const layerConfig = [
      { id: 'layer1', name: 'Restaurantes', color: '#ff0000', visible: true },
      { id: 'layer2', name: 'Hoteles', color: '#00ff00', visible: false }
    ];
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig });
    pm.openPreview();
    const legend = document.querySelector('.mlf-print-legend');
    expect(legend.textContent).toContain('Restaurantes');
    expect(legend.textContent).not.toContain('Hoteles');
    pm.closePreview();
  });

  it('renders scale text based on zoom', () => {
    mockMapRenderer.map.getZoom.mockReturnValue(12);
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const scale = document.querySelector('.mlf-print-scale');
    expect(scale.textContent).toBe('Escala 1:50,000');
    pm.closePreview();
  });

  it('generates print HTML with correct paper size CSS', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.canvasDataUrl = 'data:image/png;base64,test';
    const html = pm._generatePrintHTML();
    expect(html).toContain('@page');
    expect(html).toContain('size: A4 portrait');
    expect(html).toContain('data:image/png;base64,test');
  });

  it('creates hidden iframe on print', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    pm._doPrint();
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const img = doc.querySelector('img.print-map');
    expect(img).toBeTruthy();
    expect(img.src).toBe(pm.canvasDataUrl);
    pm.closePreview();
  });

  it('escapes HTML in legend content for print', () => {
    const layerConfig = [
      { id: 'layer1', name: '<script>alert(1)</script>', color: 'red" onload="alert(1)', visible: true }
    ];
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig });
    const html = pm._buildLegendContentForPrint();
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onload="');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;');
  });

  it('focuses cancel button on open', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const cancelBtn = document.querySelector('.mlf-print-cancel');
    expect(document.activeElement).toBe(cancelBtn);
    pm.closePreview();
  });

  it('traps focus within modal', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const card = document.querySelector('.mlf-print-card');
    const focusable = card.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const last = focusable[focusable.length - 1];
    const first = focusable[0];
    last.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    card.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(first);
    pm.closePreview();
  });

  it('closes preview on Escape key', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    expect(pm.isOpen()).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(pm.isOpen()).toBe(false);
    expect(document.querySelector('.mlf-print-modal')).toBeFalsy();
  });

  it('does not open duplicate modals on double call', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const modalsBefore = document.querySelectorAll('.mlf-print-modal').length;
    pm.openPreview();
    const modalsAfter = document.querySelectorAll('.mlf-print-modal').length;
    expect(modalsBefore).toBe(1);
    expect(modalsAfter).toBe(1);
    pm.closePreview();
  });

  it('restores focus to previous element on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    expect(document.activeElement).not.toBe(trigger);
    pm.closePreview();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('traps focus on shift+tab from first element', () => {
    const pm = new PrintManager({ mapRenderer: mockMapRenderer, uiManager: mockUiManager, layerConfig: [] });
    pm.openPreview();
    const card = document.querySelector('.mlf-print-card');
    const focusable = card.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    // After shift+tab from first element, focus should wrap to last focusable
    expect(document.activeElement).toBe(last);
    pm.closePreview();
  });
});
