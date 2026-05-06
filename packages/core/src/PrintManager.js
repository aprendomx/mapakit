const scaleDenominators = {
  0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
  6: 3000000, 7: 1500000, 8: 750000, 9: 400000,
  10: 200000, 11: 100000, 12: 50000, 13: 25000,
  14: 15000, 15: 8000, 16: 4000, 17: 2000,
  18: 1000, 19: 500, 20: 250
};

export class PrintManager {
  constructor({ mapRenderer, uiManager, layerConfig }) {
    this.mapRenderer = mapRenderer;
    this.uiManager = uiManager;
    this.layerConfig = layerConfig || [];
    this.open = false;
    this.options = {
      paperSize: 'A4',
      orientation: 'portrait',
      includeLegend: true,
      includeScale: true
    };
    this.modalEl = null;
    this.iframeEl = null;
  }

  isOpen() {
    return this.open;
  }

  openPreview() {
    if (this.isOpen()) return;
    try {
      const canvas = this.mapRenderer.map.getCanvas();
      this.canvasDataUrl = canvas.toDataURL('image/png');
    } catch (err) {
      this.uiManager.showToast?.('No se pudo capturar el mapa. Intenta de nuevo.', '#ef4444');
      return;
    }
    this.previousFocus = document.activeElement;
    this.open = true;
    this._buildModal();
  }

  closePreview() {
    this.open = false;
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
    if (this.iframeEl) {
      this.iframeEl.remove();
      this.iframeEl = null;
    }
    this.canvasDataUrl = null;
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  _setupFocusTrap(container) {
    const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  _buildModal() {
    const modal = document.createElement('div');
    modal.className = 'mlf-print-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'mlf-print-backdrop';

    const card = document.createElement('div');
    card.className = 'mlf-print-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'mlf-print-title');

    const title = document.createElement('h2');
    title.id = 'mlf-print-title';
    title.style.margin = '0 0 12px';
    title.style.fontSize = '16px';
    title.style.color = 'var(--mlf-t1)';
    title.textContent = 'Vista previa de impresión';

    const body = document.createElement('div');
    body.className = 'mlf-print-body';

    const previewPane = document.createElement('div');
    previewPane.className = 'mlf-print-preview-pane';

    const paper = document.createElement('div');
    paper.className = 'mlf-print-paper';

    const img = document.createElement('img');
    img.src = this.canvasDataUrl;
    img.alt = 'Mapa';
    img.className = 'mlf-print-map-img';

    const legend = document.createElement('div');
    legend.className = 'mlf-print-legend';

    const scale = document.createElement('div');
    scale.className = 'mlf-print-scale';

    paper.appendChild(img);
    paper.appendChild(legend);
    paper.appendChild(scale);
    previewPane.appendChild(paper);

    const optionsPane = document.createElement('div');
    optionsPane.className = 'mlf-print-options-pane';

    const paperOption = document.createElement('div');
    paperOption.className = 'mlf-print-option';
    const paperLabel = document.createElement('label');
    paperLabel.textContent = 'Tamaño de papel';
    const paperGroup = document.createElement('div');
    paperGroup.className = 'mlf-print-radio-group';
    [['A4', true], ['Letter', false], ['A3', false]].forEach(([value, checked]) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'mlf-print-paper';
      input.value = value;
      if (checked) input.checked = true;
      label.appendChild(input);
      label.appendChild(document.createTextNode(value === 'Letter' ? 'Carta' : value));
      paperGroup.appendChild(label);
    });
    paperOption.appendChild(paperLabel);
    paperOption.appendChild(paperGroup);

    const orientationOption = document.createElement('div');
    orientationOption.className = 'mlf-print-option';
    const orientationLabel = document.createElement('label');
    orientationLabel.textContent = 'Orientación';
    const orientationGroup = document.createElement('div');
    orientationGroup.className = 'mlf-print-radio-group';
    [['portrait', 'Retrato', true], ['landscape', 'Horizontal', false]].forEach(([value, text, checked]) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'mlf-print-orientation';
      input.value = value;
      if (checked) input.checked = true;
      label.appendChild(input);
      label.appendChild(document.createTextNode(text));
      orientationGroup.appendChild(label);
    });
    orientationOption.appendChild(orientationLabel);
    orientationOption.appendChild(orientationGroup);

    const legendOption = document.createElement('div');
    legendOption.className = 'mlf-print-option';
    const legendLabel = document.createElement('label');
    const legendInput = document.createElement('input');
    legendInput.type = 'checkbox';
    legendInput.name = 'mlf-print-legend';
    legendInput.checked = true;
    legendLabel.appendChild(legendInput);
    legendLabel.appendChild(document.createTextNode('Incluir leyenda'));
    legendOption.appendChild(legendLabel);

    const scaleOption = document.createElement('div');
    scaleOption.className = 'mlf-print-option';
    const scaleLabel = document.createElement('label');
    const scaleInput = document.createElement('input');
    scaleInput.type = 'checkbox';
    scaleInput.name = 'mlf-print-scale';
    scaleInput.checked = true;
    scaleLabel.appendChild(scaleInput);
    scaleLabel.appendChild(document.createTextNode('Incluir escala'));
    scaleOption.appendChild(scaleLabel);

    optionsPane.appendChild(paperOption);
    optionsPane.appendChild(orientationOption);
    optionsPane.appendChild(legendOption);
    optionsPane.appendChild(scaleOption);

    body.appendChild(previewPane);
    body.appendChild(optionsPane);

    const actions = document.createElement('div');
    actions.className = 'mlf-print-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'mlf-print-cancel';
    cancelBtn.textContent = 'Cancelar';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'mlf-print-confirm';
    confirmBtn.textContent = '🖨️ Imprimir';
    confirmBtn.addEventListener('click', () => this._doPrint());

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    modal.appendChild(backdrop);
    modal.appendChild(card);
    document.body.appendChild(modal);
    this.modalEl = modal;

    // Focus first focusable element
    const focusTarget = modal.querySelector('.mlf-print-cancel');
    if (focusTarget) focusTarget.focus();

    // Focus trap
    this._setupFocusTrap(modal.querySelector('.mlf-print-card'));

    // Escape key
    this._keydownHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closePreview();
      }
    };
    document.addEventListener('keydown', this._keydownHandler);

    this._bindOptionEvents();
    this._updatePreview();
  }

  _bindOptionEvents() {
    const card = this.modalEl.querySelector('.mlf-print-card');
    card.querySelectorAll('input[name="mlf-print-paper"]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.options.paperSize = e.target.value;
        this._updatePreview();
      });
    });
    card.querySelectorAll('input[name="mlf-print-orientation"]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.options.orientation = e.target.value;
        this._updatePreview();
      });
    });
    card.querySelector('input[name="mlf-print-legend"]').addEventListener('change', (e) => {
      this.options.includeLegend = e.target.checked;
      this._updatePreview();
    });
    card.querySelector('input[name="mlf-print-scale"]').addEventListener('change', (e) => {
      this.options.includeScale = e.target.checked;
      this._updatePreview();
    });
    card.querySelector('.mlf-print-cancel').addEventListener('click', () => this.closePreview());
  }

  _updatePreview() {
    if (!this.modalEl) return;
    const paper = this.modalEl.querySelector('.mlf-print-paper');
    const ratios = { A4: 210 / 297, Letter: 216 / 279, A3: 297 / 420 };
    let ratio = ratios[this.options.paperSize] || ratios.A4;
    if (this.options.orientation === 'landscape') ratio = 1 / ratio;
    paper.style.aspectRatio = ratio;

    const legend = paper.querySelector('.mlf-print-legend');
    const scale = paper.querySelector('.mlf-print-scale');
    if (legend) {
      legend.style.display = this.options.includeLegend ? 'block' : 'none';
      if (this.options.includeLegend) {
        legend.innerHTML = '';
        this._buildLegendContent(legend);
      }
    }
    if (scale) {
      scale.style.display = this.options.includeScale ? 'block' : 'none';
      scale.textContent = this._getScaleText();
    }
  }

  _buildLegendContent(container) {
    const visible = this.layerConfig.filter(l => l.visible !== false);
    if (visible.length === 0) return;

    const title = document.createElement('div');
    title.className = 'mlf-print-legend-title';
    title.textContent = 'Leyenda';
    container.appendChild(title);

    visible.forEach(l => {
      const item = document.createElement('div');
      item.className = 'mlf-print-legend-item';

      const swatch = document.createElement('span');
      swatch.className = 'mlf-print-legend-swatch';
      swatch.style.background = l.color || '#888';

      const name = document.createElement('span');
      name.textContent = l.name || l.id;

      item.appendChild(swatch);
      item.appendChild(name);
      container.appendChild(item);
    });
  }

  _getScaleText() {
    const zoom = this.mapRenderer.map.getZoom();
    const z = Math.round(zoom);
    const denom = scaleDenominators[z] || scaleDenominators[10];
    return `Escala 1:${denom.toLocaleString('en-US')}`;
  }

  _doPrint() {
    const html = this._generatePrintHTML();
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;visibility:hidden;';
    document.body.appendChild(iframe);
    this.iframeEl = iframe;

    const cleanup = () => {
      if (iframe.parentNode) iframe.remove();
      this.iframeEl = null;
    };

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      const img = doc.querySelector ? doc.querySelector('img') : null;
      const triggerPrint = () => {
        try {
          iframe.contentWindow.print();
        } catch (e) {
          // ignore
        }
        iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(cleanup, 60000);
      };

      if (img && !img.complete) {
        img.onload = triggerPrint;
        img.onerror = cleanup;
      } else {
        triggerPrint();
      }
    } catch (err) {
      cleanup();
    }
  }

  _generatePrintHTML() {
    const sizeName = this.options.paperSize;
    const orient = this.options.orientation;
    const pageSize = `${sizeName} ${orient}`;

    const legendHTML = this.options.includeLegend ? this._buildLegendContentForPrint() : '';
    const scaleText = this.options.includeScale ? this._getScaleText() : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: ${pageSize}; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    .print-page { width: 100%; height: 100vh; position: relative; overflow: hidden; }
    .print-map { width: 100%; height: 100%; object-fit: contain; display: block; }
    .print-legend { position: absolute; bottom: 12mm; left: 12mm; background: rgba(255,255,255,0.95); padding: 8px 12px; border-radius: 6px; font-size: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    .print-legend-title { font-weight: 600; margin-bottom: 6px; font-size: 11px; }
    .print-legend-item { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
    .print-legend-swatch { width: 12px; height: 12px; border-radius: 2px; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.2); }
    .print-scale { position: absolute; bottom: 12mm; right: 12mm; background: rgba(255,255,255,0.95); padding: 6px 10px; border-radius: 6px; font-size: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-page">
    <img class="print-map" src="${this.canvasDataUrl}" alt="Mapa" />
    ${legendHTML ? `<div class="print-legend">${legendHTML}</div>` : ''}
    ${scaleText ? `<div class="print-scale">${scaleText}</div>` : ''}
  </div>
</body>
</html>`;
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _buildLegendContentForPrint() {
    const visible = this.layerConfig.filter(l => l.visible !== false);
    if (visible.length === 0) return '';
    const items = visible.map(l => {
      const color = this._escapeHtml(l.color || '#888');
      const name = this._escapeHtml(l.name || l.id);
      return `<div class="print-legend-item"><span class="print-legend-swatch" style="background:${color}"></span><span>${name}</span></div>`;
    }).join('');
    return `<div class="print-legend-title">Leyenda</div>${items}`;
  }
}
