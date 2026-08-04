export class UIManager {
  constructor({ container, style, uiLayout }) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.style = style || {};
    this.uiLayout = uiLayout || {};
    this.events = {};
    this.elements = {};
    this.toastTimer = null;
    this._skeletonHideTimer = null;
    this.layersPerPage = 20;
    this.currentLayerPage = 0;
  }

  init(config, stats) {
    if (!this.container) return;

    this._injectFonts();
    this._injectCSS();

    if (this.uiLayout.panel?.enabled) {
      this._buildPanel(config, stats);
      this.renderAuthPanel(this.elements.panel);
    }

    this._initKeyboardShortcuts();
    this._buildToast();
    this.initMobileDrawer();
    this.renderMobileTabs();
    this.initBottomSheet();
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    (this.events[event] || []).forEach(cb => cb(data));
  }

  showToast(message, color) {
    const toast = this.elements.toast;
    const dot = this.elements.toastDot;
    const text = this.elements.toastText;
    if (!toast || !text) return;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    text.innerHTML = message;
    if (dot && color) dot.style.background = color;

    toast.classList.add('show');

    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  hideToast() {
    const toast = this.elements.toast;
    if (!toast) return;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    toast.classList.remove('show');
  }

  createEditablePopupContent(properties, onSave) {
    const container = document.createElement('div');
    container.className = 'mlf-popup-editor';

    const title = document.createElement('div');
    title.className = 'mlf-popup-title';
    title.textContent = properties?.name || 'Feature';
    container.appendChild(title);

    const form = document.createElement('div');
    form.className = 'mlf-popup-form';

    // Editable fields
    const fields = [
      { key: 'name', label: 'Nombre', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' }
    ];

    const inputs = {};
    for (const field of fields) {
      const row = document.createElement('div');
      row.className = 'mlf-popup-field';

      const label = document.createElement('label');
      label.textContent = field.label;
      row.appendChild(label);

      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
      } else {
        input = document.createElement('input');
        input.type = field.type;
      }
      input.value = properties?.[field.key] || '';
      input.className = 'mlf-popup-input';
      inputs[field.key] = input;
      row.appendChild(input);

      form.appendChild(row);
    }

    container.appendChild(form);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'mlf-popup-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'mlf-popup-save';
    saveBtn.textContent = 'Guardar';
    saveBtn.addEventListener('click', () => {
      const updates = {};
      for (const [key, input] of Object.entries(inputs)) {
        if (input.value !== (properties?.[key] || '')) {
          updates[key] = input.value;
        }
      }
      onSave(updates);
    });
    actions.appendChild(saveBtn);

    container.appendChild(actions);

    return container;
  }

  createPopupContent(properties, imageConfig) {
    const keys = Object.keys(properties);
    const mainProps = keys.slice(0, 4);
    const extraLines = keys.slice(4);

    let html = '<div class="pp">';

    if (properties.name || properties.nombre || properties.title || properties.n) {
      const name = properties.name || properties.nombre || properties.title || properties.n;
      html += `<div class="pp-nm">${this._escapeHtml(name)}</div>`;
    }

    if (properties.id || properties.cct || properties.c || properties.code) {
      const code = properties.id || properties.cct || properties.c || properties.code;
      html += `<div class="pp-cct">${this._escapeHtml(code)}</div>`;
    }

    if (mainProps.length) {
      html += '<div class="pp-grid">';
      mainProps.forEach(key => {
        const val = properties[key];
        if (val === undefined || val === null) return;
        html += `<div class="pp-c"><div class="pv">${this._escapeHtml(String(val))}</div><div class="pl">${this._escapeHtml(key)}</div></div>`;
      });
      html += '</div>';
    }

    if (extraLines.length) {
      html += '<div class="pp-f">';
      extraLines.forEach(key => {
        const val = properties[key];
        if (val === undefined || val === null) return;
        html += `${this._escapeHtml(key)}: <b>${this._escapeHtml(String(val))}</b><br>`;
      });
      html += '</div>';
    }

    if (imageConfig && imageConfig.source_field) {
      const imgUrl = properties[imageConfig.source_field];
      if (imgUrl) {
        const caption = imageConfig.caption_fields
          ? imageConfig.caption_fields.map(f => properties[f]).filter(Boolean).join(' · ')
          : '';
        html += `<div class="pp-img" style="margin-top:10px"><img src="${this._escapeHtml(imgUrl)}" style="width:100%;border-radius:8px;display:block" alt="">${caption ? `<div style="font-size:10px;color:var(--t3);margin-top:4px">${this._escapeHtml(caption)}</div>` : ''}</div>`;
      }
    }

    html += '</div>';
    return html;
  }

  updateStats(stats) {
    if (!this.elements.stats || !stats) return;
    const entries = Object.entries(stats);
    entries.forEach(([key, value], i) => {
      const el = this.elements.stats[i];
      if (el) {
        el.querySelector('.v').textContent = value != null ? String(value) : '—';
        el.querySelector('.l').textContent = key;
      }
    });
  }

  updateConnectivity(status) {
    const dot = this.elements.connDot;
    if (!dot) return;
    dot.className = 'mlf-conn-dot ' + status;
    dot.title = status === 'online' ? 'Online' : status === 'offline' ? 'Offline - usando cache' : 'Offline';
  }

  updateFilterOptions(filterId, options) {
    const container = this.elements.filterLists?.[filterId];
    if (!container || !Array.isArray(options)) return;
    container.innerHTML = '';
    options.forEach(opt => {
      const row = document.createElement('div');
      row.className = 'br';
      row.setAttribute('role', 'button');
      row.setAttribute('aria-pressed', 'false');
      row.dataset.value = opt.value;
      row.innerHTML = `
        <div class="bd" style="background:${opt.color || this.style.primary || '#f59e0b'}"></div>
        <span class="bi">${this._escapeHtml(opt.label)}</span>
        <span class="bs"><b>${opt.count != null ? opt.count : ''}</b></span>
      `;
      row.addEventListener('click', () => {
        container.querySelectorAll('.br').forEach(r => {
          r.classList.remove('on');
          r.setAttribute('aria-pressed', 'false');
        });
        row.classList.add('on');
        row.setAttribute('aria-pressed', 'true');
        this.emit('filterChange', { filterId, value: opt.value });
      });
      row.addEventListener('mouseenter', () => {
        this.emit('highlightFilter', { filterId, value: opt.value });
      });
      row.addEventListener('mouseleave', () => {
        this.emit('unhighlight');
      });
      container.appendChild(row);
    });
  }

  clearFilters() {
    Object.values(this.elements.filterLists || {}).forEach(container => {
      container?.querySelectorAll('.br').forEach(r => r.classList.remove('on'));
    });
  }

  deactivateTools() {
    this.elements.tools?.querySelectorAll('.mlf-tool-btn').forEach(b => b.classList.remove('active'));
  }

  renderLayerPanel(layers) {
    if (!this.elements.panel || !Array.isArray(layers)) return;

    // Store all layers and reset page only on fresh layer list
    if (layers !== this._allLayers) {
      this._allLayers = layers;
      this.currentLayerPage = 0;
    }

    // Remove existing panel if present (idempotent)
    if (this.elements.layerPanel) {
      this.elements.layerPanel.remove();
      this.elements.layerPanel = null;
      this.elements.layerList = null;
      this.elements.layerDropIndicator = null;
    }

    const panel = document.createElement('div');
    panel.className = 'mlf-layer-panel';
    panel.innerHTML = `<div class="mlf-lp-h">Capas</div>`;

    const list = document.createElement('div');
    list.className = 'mlf-lp-list';
    panel.appendChild(list);

    // Insert before filter list
    const filterList = this.elements.filterList;
    if (filterList) {
      filterList.parentNode.insertBefore(panel, filterList);
    } else {
      this.elements.panel.appendChild(panel);
    }

    this.elements.layerList = list;
    this.elements.layerPanel = panel;

    // Reusable drop indicator
    const indicator = document.createElement('div');
    indicator.className = 'mlf-lp-drop-indicator';
    this.elements.layerDropIndicator = indicator;

    // Render only current page
    const start = this.currentLayerPage * this.layersPerPage;
    const end = start + this.layersPerPage;
    const visibleLayers = layers.slice(start, end);

    for (const layer of visibleLayers) {
      this._createLayerItem(layer, list);
    }

    // Add pagination controls if needed
    if (layers.length > this.layersPerPage) {
      const pagination = document.createElement('div');
      pagination.className = 'mlf-lp-pagination';

      if (this.currentLayerPage > 0) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'mlf-lp-page-btn';
        prevBtn.textContent = '← Anterior';
        prevBtn.addEventListener('click', () => {
          this.currentLayerPage--;
          this.renderLayerPanel(this._allLayers);
        });
        pagination.appendChild(prevBtn);
      }

      const pageInfo = document.createElement('span');
      pageInfo.className = 'mlf-lp-page-info';
      pageInfo.textContent = `${this.currentLayerPage + 1} / ${Math.ceil(layers.length / this.layersPerPage)}`;
      pagination.appendChild(pageInfo);

      if (end < layers.length) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'mlf-lp-page-btn';
        nextBtn.textContent = 'Siguiente →';
        nextBtn.addEventListener('click', () => {
          this.currentLayerPage++;
          this.renderLayerPanel(this._allLayers);
        });
        pagination.appendChild(nextBtn);
      }

      list.appendChild(pagination);
    }

    // Touch DnD: use SortableJS on mobile/touch devices
    if ('ontouchstart' in window && window.innerWidth < 768) {
      import('sortablejs').then(({ default: Sortable }) => {
        new Sortable(list, {
          handle: '.mlf-lp-handle',
          animation: 200,
          ghostClass: 'dragging',
          onEnd: (e) => {
            const layerId = e.item.dataset.layerId;
            const beforeLayerId = e.to.children[e.newIndex + 1]?.dataset.layerId || null;
            this.emit('layerChange', { type: 'order', layerId, beforeLayerId });
          }
        });
      });
    } else {
      // Desktop: HTML5 DnD nativo
      list.addEventListener('dragover', (e) => this._onLayerDragOver(e, list));
      list.addEventListener('drop', (e) => this._onLayerDrop(e, list));
      list.addEventListener('dragend', () => this._onLayerDragEnd(list));
    }
  }

  updateLayerColor(layerId, color) {
    const item = this.elements.layerList?.querySelector(`[data-layer-id="${layerId}"]`);
    if (!item) return;
    const dot = item.querySelector('.mlf-lp-dot');
    const input = item.querySelector('.mlf-lp-color-input');
    if (dot) dot.style.background = color;
    if (input) input.value = color;
  }

  updateLayerVisibility(layerId, visible) {
    const item = this.elements.layerList?.querySelector(`[data-layer-id="${layerId}"]`);
    if (!item) return;
    const eye = item.querySelector('.mlf-lp-eye');
    if (eye) eye.classList.toggle('hidden', !visible);
  }

  updateLayerCount(layerId, count) {
    const item = this.elements.layerList?.querySelector(`[data-layer-id="${layerId}"]`);
    if (!item) return;
    const badge = item.querySelector('.mlf-lp-count');
    const detailCount = item.querySelector('.mlf-lp-fc');
    if (badge) {
      badge.textContent = count;
      badge.style.color = count > 0 ? 'var(--mlf-t1)' : 'var(--mlf-t3)';
    }
    if (detailCount) detailCount.textContent = count;
  }

  renderSearchResults(features) {
    const container = this.elements.searchResults;
    if (!container) return;
    container.innerHTML = '';
    if (!features || features.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    features.slice(0, 20).forEach(feature => {
      const row = document.createElement('div');
      row.className = 'mlf-search-row';
      const title = feature.properties?.name || feature.properties?.title || feature.properties?.nombre || 'Sin nombre';
      row.textContent = title;
      row.addEventListener('mouseenter', () => {
        this.emit('highlightSearchResult', { feature });
      });
      row.addEventListener('mouseleave', () => {
        this.emit('unhighlight');
      });
      row.addEventListener('click', () => {
        this.emit('searchResultClick', { feature });
      });
      container.appendChild(row);
    });
  }

  renderGeocodeResults(results) {
    const container = this.elements.geocodeResults;
    if (!container) return;
    container.innerHTML = '';
    if (!results || results.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    const header = document.createElement('div');
    header.className = 'mlf-geocode-header';
    header.textContent = 'Lugares';
    container.appendChild(header);
    results.forEach(result => {
      const row = document.createElement('div');
      row.className = 'mlf-geocode-row';
      row.textContent = result.name;
      row.addEventListener('click', () => {
        this.emit('geocodeResultClick', result);
        this.elements.searchInput.value = result.name;
        this.renderGeocodeResults([]);
        this.renderSearchResults([]);
      });
      container.appendChild(row);
    });
  }

  toggleLayerDetails(layerId) {
    const item = this.elements.layerList?.querySelector(`[data-layer-id="${layerId}"]`);
    if (!item) return;
    const details = item.querySelector('.mlf-lp-details');
    const arrow = item.querySelector('.mlf-lp-arrow');
    if (!details) return;
    const isOpen = details.classList.contains('open');
    if (isOpen) {
      details.classList.remove('open');
    } else {
      details.classList.add('open');
    }
    if (arrow) {
      arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
      arrow.setAttribute('aria-expanded', String(!isOpen));
    }
  }

  showSkeleton() {
    if (this._skeletonHideTimer) {
      clearTimeout(this._skeletonHideTimer);
      this._skeletonHideTimer = null;
    }
    if (this.elements.skeleton) {
      this.elements.skeleton.style.opacity = '1';
      this.elements.skeleton.style.display = 'block';
      return;
    }
    this._injectCSS();
    const sk = document.createElement('div');
    sk.className = 'mlf-skeleton';
    sk.innerHTML = `
      <div class="mlf-sk-bar" style="width:60%"></div>
      <div class="mlf-sk-bar" style="width:40%"></div>
      <div class="mlf-sk-stats">
        <div class="mlf-sk-box"></div><div class="mlf-sk-box"></div>
        <div class="mlf-sk-box"></div><div class="mlf-sk-box"></div>
      </div>
      <div class="mlf-sk-row"></div>
      <div class="mlf-sk-row"></div>
      <div class="mlf-sk-row"></div>
    `;
    sk.style.display = 'block';
    this.container.appendChild(sk);
    this.elements.skeleton = sk;
  }

  hideSkeleton() {
    if (!this.elements.skeleton) return;
    this.elements.skeleton.style.opacity = '0';
    this.elements.skeleton.style.transition = 'opacity .3s';
    this._skeletonHideTimer = setTimeout(() => {
      this.elements.skeleton?.remove();
      this.elements.skeleton = null;
      this._skeletonHideTimer = null;
    }, 300);
  }

  initMobileDrawer() {
    if (window.innerWidth >= 768) return;
    // El drawer móvil solo existe para abrir el panel; sin panel construido
    // el FAB no despliega nada (y _trapFocus(undefined) lanza), así que no
    // se crean ni el botón ni el backdrop.
    if (!this.elements.panel) return;

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'mlf-backdrop';
    backdrop.addEventListener('click', () => this.closeDrawer());
    this.container.appendChild(backdrop);
    this.elements.backdrop = backdrop;

    // FAB
    const fab = document.createElement('button');
    fab.className = 'mlf-fab';
    fab.innerHTML = '&#9776;';
    fab.setAttribute('aria-label', 'Abrir panel');
    fab.addEventListener('click', () => this.openDrawer());
    this.container.appendChild(fab);
    this.elements.fab = fab;

    // Remove desktop mobile toggle if exists
    if (this.elements.mobileToggle) {
      this.elements.mobileToggle.remove();
      this.elements.mobileToggle = null;
    }
  }

  openDrawer() {
    if (!this.elements.panel) return;
    this.elements.panel.classList.add('open');
    if (this.elements.backdrop) this.elements.backdrop.classList.add('show');
    if (this.elements.fab) this.elements.fab.style.display = 'none';
    this._trapFocus(this.elements.panel);
  }

  closeDrawer() {
    if (this.elements.panel) this.elements.panel.classList.remove('open');
    if (this.elements.backdrop) this.elements.backdrop.classList.remove('show');
    if (this.elements.fab) this.elements.fab.style.display = 'flex';
    this._releaseFocus(this.elements.panel);
  }

  _trapFocus(drawer) {
    const focusable = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    this._focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    drawer.addEventListener('keydown', this._focusTrapHandler);
    first?.focus();
  }

  _releaseFocus(drawer) {
    if (this._focusTrapHandler) {
      drawer.removeEventListener('keydown', this._focusTrapHandler);
      this._focusTrapHandler = null;
    }
  }

  renderMobileTabs() {
    if (window.innerWidth >= 768) return;
    const panel = this.elements.panel;
    if (!panel || panel.querySelector('.mlf-tabs')) return;

    const tabs = document.createElement('div');
    tabs.className = 'mlf-tabs';
    tabs.innerHTML = `
      <button class="mlf-tab active" data-tab="layers">Capas</button>
      <button class="mlf-tab" data-tab="filters">Filtros</button>
      <button class="mlf-tab" data-tab="search">Buscar</button>
    `;
    tabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('mlf-tab')) {
        this.switchTab(e.target.dataset.tab);
      }
    });

    // Wrap existing content in tab containers
    const content = document.createElement('div');
    content.className = 'mlf-tab-content active';
    content.id = 'tab-layers';

    // Move layer panel and filter list into tab content
    const layerPanel = panel.querySelector('.mlf-layer-panel');
    const filterList = panel.querySelector('#mlf-il');
    const searchWrap = panel.querySelector('.mlf-sw');
    const statsEl = panel.querySelector('.mlf-ks');

    if (layerPanel) content.appendChild(layerPanel);

    const filtersContent = document.createElement('div');
    filtersContent.className = 'mlf-tab-content';
    filtersContent.id = 'tab-filters';
    if (searchWrap) filtersContent.appendChild(searchWrap);
    if (filterList) filtersContent.appendChild(filterList);

    const searchContent = document.createElement('div');
    searchContent.className = 'mlf-tab-content';
    searchContent.id = 'tab-search';
    if (searchWrap) {
      const searchClone = searchWrap.cloneNode(true);
      searchContent.appendChild(searchClone);
    }

    // Insert after stats (keep header and stats always visible)
    if (statsEl) {
      statsEl.parentNode.insertBefore(tabs, statsEl.nextSibling);
      tabs.parentNode.insertBefore(content, tabs.nextSibling);
      tabs.parentNode.insertBefore(filtersContent, content.nextSibling);
      tabs.parentNode.insertBefore(searchContent, filtersContent.nextSibling);
    }
  }

  switchTab(tabId) {
    const panel = this.elements.panel;
    if (!panel) return;
    panel.querySelectorAll('.mlf-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    panel.querySelectorAll('.mlf-tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
  }

  initBottomSheet() {
    if (window.innerWidth >= 768) return;
    const sheet = document.createElement('div');
    sheet.className = 'mlf-bottom-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML = `<div class="mlf-bs-handle"></div><div class="mlf-bs-content"></div>`;
    // La hoja nace vacía: permanece oculta hasta que alguien la pueble vía
    // setBottomSheetContent(); mostrarla vacía solo tapa el mapa en móvil.
    sheet.style.display = 'none';
    this.container.appendChild(sheet);
    this.elements.bottomSheet = sheet;

    let startY = 0;
    let startTransform = 0;
    const handle = sheet.querySelector('.mlf-bs-handle');

    const onStart = (y) => { startY = y; startTransform = this._getSheetTransform(sheet); };
    const onMove = (y) => {
      const delta = y - startY;
      sheet.style.transition = 'none';
      sheet.style.transform = `translateY(${startTransform + delta}px)`;
    };
    const onEnd = (y) => {
      sheet.style.transition = 'transform .3s ease';
      const delta = y - startY;
      if (delta < -50) this.expandBottomSheet();
      else if (delta > 50) this.collapseBottomSheet();
      else sheet.style.transform = '';
    };

    handle.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY));
    handle.addEventListener('touchmove', (e) => onMove(e.touches[0].clientY));
    handle.addEventListener('touchend', (e) => onEnd(e.changedTouches[0].clientY));
  }

  _getSheetTransform(sheet) {
    const style = sheet.style.transform;
    const match = style.match(/translateY\(([^)]+)\)/);
    return match ? parseInt(match[1]) : 0;
  }

  expandBottomSheet() {
    if (this.elements.bottomSheet) this.elements.bottomSheet.classList.add('full');
  }

  collapseBottomSheet() {
    if (this.elements.bottomSheet) this.elements.bottomSheet.classList.remove('full');
  }

  /**
   * Puebla la hoja inferior móvil y la muestra; con contenido vacío
   * (null, '' o nodo sin hijos) la colapsa y la vuelve a ocultar.
   * Acepta un string HTML o un Node.
   */
  setBottomSheetContent(contenido) {
    const sheet = this.elements.bottomSheet;
    if (!sheet) return;
    const cuerpo = sheet.querySelector('.mlf-bs-content');
    if (typeof contenido === 'string') {
      cuerpo.innerHTML = contenido;
    } else {
      cuerpo.replaceChildren(...(contenido ? [contenido] : []));
    }
    const vacia = cuerpo.childNodes.length === 0;
    if (vacia) this.collapseBottomSheet();
    sheet.style.display = vacia ? 'none' : '';
  }

  destroy() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    if (this._skeletonHideTimer) {
      clearTimeout(this._skeletonHideTimer);
      this._skeletonHideTimer = null;
    }
    if (this._keyboardHandler) {
      document.removeEventListener('keydown', this._keyboardHandler);
      this._keyboardHandler = null;
    }
    Object.values(this.elements).forEach(el => {
      if (el && el.remove) el.remove();
    });
    this.elements = {};
    this.events = {};
  }

  renderAuthPanel(container) {
    const authPanel = document.createElement('div');
    authPanel.className = 'mf-auth';
    authPanel.innerHTML = `
      <div class="mf-auth-form" style="display:none; padding: 16px; border-top: 1px solid rgba(255,255,255,.05);">
        <input type="email" placeholder="Email" class="mf-auth-email" style="width:100%; padding:8px 12px; margin-bottom:8px; border-radius:6px; border:1px solid rgba(255,255,255,.1); background:#141a24; color:#eceff5; font-size:12px;">
        <input type="password" placeholder="Contraseña" class="mf-auth-password" style="width:100%; padding:8px 12px; margin-bottom:12px; border-radius:6px; border:1px solid rgba(255,255,255,.1); background:#141a24; color:#eceff5; font-size:12px;">
        <button class="mf-auth-login" style="width:100%; padding:10px; border-radius:6px; border:none; background:${this.style.colors?.primary || '#f59e0b'}; color:#000; font-weight:700; font-size:12px; cursor:pointer;">Iniciar Sesión</button>
        <div class="mf-auth-error" style="color:#ef4444; font-size:11px; margin-top:8px; display:none;"></div>
      </div>
      <div class="mf-auth-status" style="padding: 12px 16px; border-top: 1px solid rgba(255,255,255,.05); display:flex; align-items:center; justify-content:space-between;">
        <span class="mf-auth-text" style="font-size:11px; color:#8a94a6;">No autenticado</span>
        <button class="mf-auth-toggle" style="background:none; border:1px solid rgba(255,255,255,.1); color:#8a94a6; padding:4px 10px; border-radius:6px; font-size:11px; cursor:pointer;">Login</button>
      </div>
    `;

    const form = authPanel.querySelector('.mf-auth-form');
    const emailInput = authPanel.querySelector('.mf-auth-email');
    const passwordInput = authPanel.querySelector('.mf-auth-password');
    const loginBtn = authPanel.querySelector('.mf-auth-login');
    const errorDiv = authPanel.querySelector('.mf-auth-error');
    const statusText = authPanel.querySelector('.mf-auth-text');
    const toggleBtn = authPanel.querySelector('.mf-auth-toggle');

    toggleBtn.addEventListener('click', () => {
      const isVisible = form.style.display !== 'none';
      form.style.display = isVisible ? 'none' : 'block';
      toggleBtn.textContent = isVisible ? 'Login' : 'Cancelar';
    });

    loginBtn.addEventListener('click', async () => {
      errorDiv.style.display = 'none';
      this.emit('authLogin', {
        email: emailInput.value,
        password: passwordInput.value,
        onError: (msg) => {
          errorDiv.textContent = msg;
          errorDiv.style.display = 'block';
        }
      });
    });

    container.appendChild(authPanel);
    this.elements.authPanel = authPanel;
    this.elements.authStatusText = statusText;
    this.elements.authToggleBtn = toggleBtn;
  }

  updateAuthState(user) {
    if (!this.elements.authStatusText) return;
    if (user) {
      this.elements.authStatusText.textContent = user.email;
      this.elements.authToggleBtn.textContent = 'Logout';
      this.elements.authToggleBtn.onclick = () => this.emit('authLogout');
      if (this.elements.authPanel) {
        this.elements.authPanel.querySelector('.mf-auth-form').style.display = 'none';
      }
    } else {
      this.elements.authStatusText.textContent = 'No autenticado';
      this.elements.authToggleBtn.textContent = 'Login';
      this.elements.authToggleBtn.onclick = () => {
        const form = this.elements.authPanel?.querySelector('.mf-auth-form');
        if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
      };
    }
  }

  showEmptyState(layerCount) {
    const panel = this.elements.panel || document.querySelector('.mlf-panel');
    if (!panel) return;
    let emptyEl = panel.querySelector('.mlf-empty-state');
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'mlf-empty-state';
      panel.appendChild(emptyEl);
    }
    emptyEl.setAttribute('role', 'status');
    emptyEl.style.display = 'flex';
    emptyEl.innerHTML = `
      <div class="mlf-empty-icon">🗺️</div>
      <div class="mlf-empty-title">${layerCount === 0 ? 'No hay capas activas' : 'Sin resultados para los filtros aplicados'}</div>
      <div class="mlf-empty-subtitle">${layerCount === 0 ? 'Habilita al menos una capa para ver el mapa' : 'Prueba ajustando los filtros para encontrar lo que buscas'}</div>
      ${layerCount > 0 ? '<button class="mlf-empty-action mlf-clear-filters">Limpiar filtros</button>' : ''}
    `;
    const clearBtn = emptyEl.querySelector('.mlf-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.emit('clearFilters');
      });
    }
  }

  hideEmptyState() {
    const panel = this.elements.panel || document.querySelector('.mlf-panel');
    if (!panel) return;
    const emptyEl = panel.querySelector('.mlf-empty-state');
    if (emptyEl) emptyEl.style.display = 'none';
  }

  showErrorState(message) {
    const panel = this.elements.panel || document.querySelector('.mlf-panel');
    if (!panel) return;
    let errorEl = panel.querySelector('.mlf-error-state');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'mlf-error-state';
      panel.appendChild(errorEl);
    }
    errorEl.setAttribute('role', 'alert');
    errorEl.style.display = 'flex';
    errorEl.innerHTML = `
      <div class="mlf-error-icon">⚠️</div>
      <div class="mlf-error-title">Error al cargar datos</div>
      <div class="mlf-error-subtitle">${message || 'Inténtalo de nuevo'}</div>
      <button class="mlf-error-action mlf-retry">Reintentar</button>
    `;
    const retryBtn = errorEl.querySelector('.mlf-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.emit('retry');
      });
    }
  }

  hideErrorState() {
    const panel = this.elements.panel || document.querySelector('.mlf-panel');
    if (!panel) return;
    const errorEl = panel.querySelector('.mlf-error-state');
    if (errorEl) errorEl.style.display = 'none';
  }

  _initKeyboardShortcuts() {
    this._keyboardHandler = (e) => {
      // Ignore if user is typing in an input
      const tag = e.target.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (isInput) return;

      // Escape: close drawer, popup, bottom sheet
      if (e.key === 'Escape') {
        if (this.elements.bottomSheet?.classList.contains('full') || this.elements.bottomSheet?.classList.contains('half')) {
          this.collapseBottomSheet();
          return;
        }
        if (this.elements.panel?.classList.contains('open')) {
          this.closeDrawer();
          return;
        }
        this.emit('escape');
        return;
      }

      // Cmd/Ctrl + K: focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (this.elements.searchInput) {
          this.elements.searchInput.focus();
        }
        return;
      }

      // Cmd/Ctrl + Shift + F: clear filters
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.emit('keyboardClearFilters');
        return;
      }
    };
    document.addEventListener('keydown', this._keyboardHandler);
  }

  // --- Private ---

  _injectFonts() {
    if (document.getElementById('mapakit-fonts')) return;
    const link = document.createElement('link');
    link.id = 'mapakit-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  _injectCSS() {
    if (document.getElementById('mapakit-ui')) return;
    const s = this.style;
    const bg = s.background || '#06090f';
    const pn = s.panel || '#0c1018';
    const cd = s.card || '#141a24';
    const hv = s.hover || '#1b2435';
    const bd = 'rgba(255,255,255,.05)';
    const bh = 'rgba(255,255,255,.12)';
    const t1 = s.textPrimary || '#eceff5';
    const t2 = s.textSecondary || '#8a94a6';
    const t3 = s.textMuted || '#4f5b6e';
    const ac = s.primary || '#f59e0b';

    const css = `
      :root{--mlf-bg:${bg};--mlf-pn:${pn};--mlf-cd:${cd};--mlf-hv:${hv};--mlf-bd:${bd};--mlf-bh:${bh};--mlf-t1:${t1};--mlf-t2:${t2};--mlf-t3:${t3};--mlf-ac:${ac};--mlf-m:'IBM Plex Mono',monospace;--mlf-s:'Outfit',sans-serif}
      .mlf-ui *{margin:0;padding:0;box-sizing:border-box}
      .mlf-ui{font-family:var(--mlf-s);background:var(--mlf-bg);color:var(--mlf-t1);height:100vh;overflow:hidden}

      .mlf-panel{position:absolute;top:0;left:0;bottom:0;width:${this.uiLayout.panel?.width || 380}px;z-index:10;background:var(--mlf-pn);border-right:1px solid var(--mlf-bd);display:flex;flex-direction:column;transition:transform .3s cubic-bezier(.4,0,.2,1)}
      .mlf-panel.hid{transform:translateX(-100%)}

      .mlf-hd{padding:20px 20px 14px;border-bottom:1px solid var(--mlf-bd);flex-shrink:0;background:linear-gradient(180deg,rgba(255,255,255,.015) 0%,transparent 100%)}
      .mlf-hd h1{font-family:var(--mlf-m);font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#f8fafc;display:flex;align-items:center;gap:8px}
      .mlf-hd h1::before{content:'';width:8px;height:8px;background:${ac};border-radius:2px;box-shadow:0 0 12px ${ac};animation:mlf-pulse 2s ease infinite}
      @keyframes mlf-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      .mlf-hd .sub{font-size:11px;color:var(--mlf-t3);margin-top:5px;line-height:1.4}
      .mlf-hd .tags{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}
      .mlf-hd .tg{font-size:8px;font-weight:600;padding:3px 8px;border-radius:12px;letter-spacing:.3px}
      .tg-a{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.15)}
      .tg-b{background:rgba(129,140,248,.08);color:#a5b4fc;border:1px solid rgba(129,140,248,.12)}
      .tg-c{background:rgba(52,211,153,.08);color:#6ee7b7;border:1px solid rgba(52,211,153,.12)}

      .mlf-ks{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--mlf-bd);border-bottom:1px solid var(--mlf-bd);flex-shrink:0}
      .mlf-k{background:var(--mlf-pn);padding:12px 0;text-align:center}
      .mlf-k .v{font-family:var(--mlf-m);font-size:17px;font-weight:700}
      .mlf-k .l{font-size:7px;text-transform:uppercase;letter-spacing:1px;color:var(--mlf-t3);margin-top:2px}

      .mlf-share-btn{width:100%;padding:8px 12px;margin:8px 0;border-radius:6px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t2);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s}
      .mlf-share-btn:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-measure-btn{width:100%;padding:8px 12px;margin:4px 0;border-radius:6px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t2);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
      .mlf-measure-btn:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-measure-btn.active{background:rgba(245,158,11,0.15);border-color:#f59e0b;color:#f59e0b}

      .mlf-sw{padding:8px 14px;flex-shrink:0;border-bottom:1px solid var(--mlf-bd)}
      .mlf-sw input{width:100%;padding:8px 12px;border-radius:7px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t1);font:12px var(--mlf-s);outline:none;transition:border-color .2s}
      .mlf-sw input:focus{border-color:rgba(245,158,11,.3)}
      .mlf-sw input::placeholder{color:var(--mlf-t3)}
      .mlf-search-results{max-height:200px;overflow-y:auto;margin-top:4px;border-radius:6px;background:var(--mlf-cd);border:1px solid var(--mlf-bd)}
      .mlf-search-row{padding:8px 12px;font-size:12px;color:var(--mlf-t2);cursor:pointer;border-bottom:1px solid var(--mlf-bd);transition:background .1s}
      .mlf-search-row:last-child{border-bottom:none}
      .mlf-search-row:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-geocode-results{max-height:200px;overflow-y:auto;margin-top:4px;border-radius:6px;background:var(--mlf-cd);border:1px solid var(--mlf-bd)}
      .mlf-geocode-header{padding:6px 12px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--mlf-t3);border-bottom:1px solid var(--mlf-bd)}
      .mlf-geocode-row{padding:8px 12px;font-size:12px;color:var(--mlf-t2);cursor:pointer;border-bottom:1px solid var(--mlf-bd);transition:background .1s}
      .mlf-geocode-row:last-child{border-bottom:none}
      .mlf-geocode-row:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-print-btn{width:100%;padding:8px 12px;margin:4px 0;border-radius:6px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t2);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s}
      .mlf-print-btn:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-export-btn{width:100%;padding:8px 12px;margin:4px 0;border-radius:6px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t2);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s}
      .mlf-export-btn:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-conn-dot{position:absolute;top:12px;right:12px;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,0.3)}
      .mlf-conn-dot.offline{background:#ef4444;box-shadow:0 0 0 2px rgba(239,68,68,0.3)}
      .mlf-conn-dot.offline-cache{background:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,0.3)}
      .mlf-sync-btn{width:100%;padding:8px 12px;margin:4px 0;border-radius:6px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t2);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s}
      .mlf-sync-btn:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-tools{display:flex;gap:4px;padding:8px 12px;border-bottom:1px solid var(--mlf-bd)}
      .mlf-tool-btn{flex:1;padding:6px 4px;border-radius:6px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t2);font-size:11px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:4px}
      .mlf-tool-btn:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-tool-btn.active{background:rgba(245,158,11,0.15);border-color:#f59e0b;color:#f59e0b}

      .mlf-il{flex:1;overflow-y:auto;padding:8px}
      .mlf-il::-webkit-scrollbar{width:4px}
      .mlf-il::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:4px}

      .mlf-ic{margin-bottom:6px;border-radius:10px;border:1px solid var(--mlf-bd);overflow:hidden;transition:border-color .15s}
      .mlf-ic:hover{border-color:var(--mlf-bh)}.mlf-ic.open{border-color:var(--mlf-bh)}
      .mlf-ic-h{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;user-select:none;transition:background .1s}
      .mlf-ic-h:hover{background:var(--mlf-hv)}
      .mlf-ic-dot{width:14px;height:14px;border-radius:4px;flex-shrink:0;position:relative}
      .mlf-ic-dot::after{content:'';position:absolute;inset:-3px;border-radius:6px;background:inherit;opacity:.2;filter:blur(6px)}
      .mlf-ic-nm{font-size:12px;font-weight:700;flex:1}.mlf-ic-bg{display:flex;gap:3px}
      .mlf-ic-ba{font-family:var(--mlf-m);font-size:8px;font-weight:600;padding:1px 6px;border-radius:10px}
      .ba-b{color:#a5b4fc;background:rgba(129,140,248,.08)}
      .ba-e{color:var(--mlf-t2);background:rgba(255,255,255,.03)}
      .ba-d{color:#f59e0b;background:rgba(245,158,11,.06)}
      .mlf-ic-ar{font-size:8px;color:var(--mlf-t3);transition:transform .2s}.mlf-ic.open .mlf-ic-ar{transform:rotate(90deg)}

      .mlf-bl{display:none;padding:4px 8px 8px 20px;max-height:300px;overflow-y:auto}
      .mlf-bl::-webkit-scrollbar{width:3px}.mlf-bl::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);border-radius:2px}
      .mlf-ic.open .mlf-bl{display:block}
      .mlf-br{display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:5px;cursor:pointer;transition:all .1s;margin-bottom:1px}
      .mlf-br:hover{background:var(--mlf-hv)}.mlf-br.on{background:rgba(245,158,11,.06);outline:1px solid rgba(245,158,11,.15)}
      .mlf-bd{width:8px;height:8px;border-radius:2px;flex-shrink:0}.mlf-bi{font-family:var(--mlf-m);font-size:8px;color:var(--mlf-t2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .mlf-bs{font-size:8px;color:var(--mlf-t3);white-space:nowrap}.mlf-bs b{color:var(--mlf-t2)}

      .mlf-mb{position:absolute;top:12px;left:12px;z-index:11;width:36px;height:36px;border-radius:8px;border:1px solid var(--mlf-bd);background:rgba(12,16,24,.9);backdrop-filter:blur(8px);color:var(--mlf-t1);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center}
      .mlf-mb:hover{background:var(--mlf-hv)}
      @media(min-width:768px){.mlf-mb{display:none}}

      .maplibregl-popup-content{background:var(--mlf-pn)!important;border:1px solid var(--mlf-bh)!important;border-radius:14px!important;padding:0!important;color:var(--mlf-t1)!important;font-family:var(--mlf-s);box-shadow:0 20px 60px rgba(0,0,0,.7)!important;max-width:320px!important}
      @keyframes mlf-popup-in{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
      .maplibregl-popup-content{animation:mlf-popup-in .2s cubic-bezier(.4,0,.2,1) forwards}
      @keyframes mlf-popup-out{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-10px) scale(.95)}}
      .maplibregl-popup-content.leaving{animation:mlf-popup-out .15s cubic-bezier(.4,0,.2,1) forwards}
      .maplibregl-popup-tip{border-top-color:var(--mlf-pn)!important}.maplibregl-popup-close-button{color:var(--mlf-t3)!important;font-size:20px;right:6px!important;top:4px!important}

      .mlf-skeleton{position:absolute;top:0;left:0;bottom:0;width:${this.uiLayout.panel?.width || 380}px;z-index:10;background:var(--mlf-pn);padding:20px;display:none}
      .mlf-sk-bar{height:12px;background:var(--mlf-cd);border-radius:4px;margin-bottom:8px;animation:mlf-shimmer 1.5s infinite}
      .mlf-sk-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--mlf-bd);margin:16px 0}
      .mlf-sk-box{height:40px;background:var(--mlf-cd);animation:mlf-shimmer 1.5s infinite}
      .mlf-sk-row{height:32px;background:var(--mlf-cd);border-radius:4px;margin-bottom:6px;animation:mlf-shimmer 1.5s infinite}
      @keyframes mlf-shimmer{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
      @media(max-width:767px){
        .mlf-panel{left:auto;right:0;transform:translateX(100%);width:85vw;max-width:360px}
        .mlf-panel.open{transform:translateX(0)}
        .mlf-fab{position:fixed;bottom:24px;right:24px;z-index:20;width:56px;height:56px;border-radius:50%;background:var(--mlf-ac);color:#000;border:none;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(245,158,11,.4);transition:transform .1s}
        .mlf-fab:active{transform:scale(.9)}
        .mlf-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9;opacity:0;transition:opacity .2s;pointer-events:none}
        .mlf-backdrop.show{opacity:1;pointer-events:auto}
        .mlf-tabs{display:flex;border-bottom:1px solid var(--mlf-bd);margin:0 16px}
        .mlf-tab{flex:1;padding:10px 0;background:none;border:none;border-bottom:2px solid transparent;color:var(--mlf-t3);font-size:11px;font-family:var(--mlf-s);cursor:pointer}
        .mlf-tab.active{color:var(--mlf-ac);border-bottom-color:var(--mlf-ac)}
        .mlf-tab-content{display:none;padding:12px 16px}
        .mlf-tab-content.active{display:block}
        .mlf-bottom-sheet{position:fixed;bottom:0;left:0;right:0;background:var(--mlf-pn);border-radius:16px 16px 0 0;z-index:30;transform:translateY(calc(100% - 120px));transition:transform .3s ease;max-height:70vh;overflow-y:auto}
        .mlf-bottom-sheet.half{transform:translateY(30%)}
        .mlf-bottom-sheet.full{transform:translateY(0)}
        .mlf-bs-handle{width:40px;height:4px;background:var(--mlf-t3);border-radius:2px;margin:12px auto;cursor:grab}
        .mlf-bs-content{padding:0 16px 16px}
      }
      @media(min-width:768px){.mlf-fab,.mlf-backdrop{display:none}}

      .pp{padding:16px}.pp-tag{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:10px}
      .pp-tag .pp-dt{width:8px;height:8px;border-radius:3px}
      .pp-nm{font-size:14px;font-weight:700;line-height:1.35;margin-bottom:3px}
      .pp-cct{font-family:var(--mlf-m);font-size:11px;color:var(--mlf-t2);margin-bottom:12px}
      .pp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
      .pp-c{background:var(--mlf-cd);border-radius:7px;padding:7px 4px;text-align:center}
      .pp-c .pv{font-family:var(--mlf-m);font-size:14px;font-weight:700}
      .pp-c .pl{font-size:6px;text-transform:uppercase;letter-spacing:.6px;color:var(--mlf-t3);margin-top:2px}
      .pp-f{margin-top:10px;font-size:10px;color:var(--mlf-t3);line-height:1.5}

      .mlf-toast{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:12;background:var(--mlf-pn);border:1px solid var(--mlf-bh);border-radius:10px;padding:9px 18px;font-size:11px;color:var(--mlf-t2);display:none;align-items:center;gap:8px;box-shadow:0 8px 28px rgba(0,0,0,.5);max-width:90vw}
      .mlf-toast.show{display:flex}.mlf-toast .td{width:10px;height:10px;border-radius:3px;flex-shrink:0}.mlf-toast .tc{margin-left:6px;cursor:pointer;color:var(--mlf-t3);font-size:15px;background:none;border:none;line-height:1}.mlf-toast .tc:hover{color:var(--mlf-t1)}
      .mlf-layer-panel{padding:12px 16px;border-bottom:1px solid var(--mlf-bd);flex-shrink:0}
      .mlf-lp-h{font-family:var(--mlf-m);font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--mlf-t3);margin-bottom:8px}
      .mlf-lp-list{display:flex;flex-direction:column;gap:4px}
      .mlf-lp-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:var(--mlf-cd);cursor:grab;transition:background .1s,opacity .15s;border:1px solid transparent}
      .mlf-lp-item:hover{background:var(--mlf-hv)}
      .mlf-lp-item.dragging{opacity:0.4;border:1px dashed var(--mlf-ac)}
      .mlf-lp-handle{color:var(--mlf-t3);font-size:12px;cursor:grab;user-select:none}
      .mlf-lp-color-wrapper{position:relative;display:flex;align-items:center}
      .mlf-lp-dot{width:12px;height:12px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.2);cursor:pointer;transition:transform .1s}
      .mlf-lp-dot:hover{transform:scale(1.2)}
      .mlf-lp-color-input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0}
      .mlf-lp-name{font-size:11px;color:var(--mlf-t1);flex:1}
      .mlf-lp-eye{background:none;border:none;color:var(--mlf-t2);font-size:13px;cursor:pointer;padding:2px;opacity:0.7;transition:opacity .15s}
      .mlf-lp-eye:hover{opacity:1}
      .mlf-lp-eye.hidden{opacity:0.3}
      .mlf-lp-drop-indicator{height:2px;background:var(--mlf-ac);border-radius:1px;margin:2px 0;pointer-events:none}
      .mlf-lp-item.dragging{opacity:.3;border:1px dashed var(--mlf-ac);background:transparent}
      .mlf-lp-arrow{color:var(--mlf-t3);font-size:8px;cursor:pointer;transition:transform .2s;margin-right:2px}
      .mlf-lp-count{font-family:var(--mlf-m);font-size:9px;color:var(--mlf-t3);margin-right:4px;min-width:18px;text-align:right}
      .mlf-lp-details{max-height:0;opacity:0;overflow:hidden;transition:max-height .2s ease,opacity .2s ease}
      .mlf-lp-details.open{max-height:200px;opacity:1}
      .mlf-lp-meta{font-size:10px;color:var(--mlf-t2);line-height:1.6}
      .mlf-lp-legend{display:flex;align-items:center;gap:6px;margin-bottom:2px}
      .mlf-lp-lg-sample{display:inline-block;flex-shrink:0}
      .mlf-lp-zoom,.mlf-lp-features{color:var(--mlf-t3)}
      .mlf-lp-pagination{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid var(--mlf-bd);margin-top:4px}
      .mlf-lp-page-btn{background:none;border:1px solid var(--mlf-bd);color:var(--mlf-t2);padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;transition:all .1s}
      .mlf-lp-page-btn:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-lp-page-info{font-size:11px;color:var(--mlf-t3)}

      .mlf-popup-editor{min-width:200px}
      .mlf-popup-title{font-size:14px;font-weight:600;margin-bottom:10px;color:var(--mlf-t1)}
      .mlf-popup-form{display:flex;flex-direction:column;gap:8px}
      .mlf-popup-field label{font-size:11px;color:var(--mlf-t3);margin-bottom:2px;display:block}
      .mlf-popup-input{width:100%;padding:6px 8px;border-radius:5px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t1);font-size:12px;resize:vertical}
      .mlf-popup-input:focus{outline:none;border-color:#f59e0b}
      .mlf-popup-actions{display:flex;justify-content:flex-end;margin-top:10px}
      .mlf-popup-save{padding:6px 12px;border-radius:5px;border:none;background:#f59e0b;color:#06090f;font-size:12px;font-weight:600;cursor:pointer}
      .mlf-popup-save:hover{background:#fbbf24}

      .mlf-empty-state, .mlf-error-state {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px 24px;
        color: #d4d4d8;
      }
      .mlf-empty-icon, .mlf-error-icon { font-size: 48px; margin-bottom: 16px; }
      .mlf-empty-title, .mlf-error-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #f59e0b; }
      .mlf-empty-subtitle, .mlf-error-subtitle { font-size: 13px; color: #a1a1aa; margin-bottom: 20px; }
      .mlf-empty-action, .mlf-error-action {
        background: #f59e0b;
        color: #06090f;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .mlf-empty-action:hover, .mlf-error-action:hover { background: #fbbf24; }
      .mlf-map-tooltip{position:absolute;background:rgba(6,9,15,0.9);color:#d4d4d8;padding:6px 10px;border-radius:6px;font-size:12px;pointer-events:none;z-index:10;border:1px solid var(--mlf-bd);white-space:nowrap}

      @media (prefers-reduced-motion: reduce) {
        .mlf-lp-details, .mlf-bottom-sheet, .mlf-panel, .mlf-fab, .mlf-search-row, .mlf-lp-item, .maplibregl-popup-content, .mlf-sk-bar, .mlf-sk-box, .mlf-sk-row {
          transition: none !important;
          animation: none !important;
        }
      }

      .mlf-light{--mlf-pn:#ffffff;--mlf-cd:#f4f4f5;--mlf-bd:#e4e4e7;--mlf-t1:#18181b;--mlf-t2:#52525b;--mlf-t3:#a1a1aa;--mlf-hv:#f4f4f5}
      .mlf-light .mlf-panel{background:var(--mlf-pn);border-right:1px solid var(--mlf-bd)}
      .mlf-light .mlf-sw input{background:#fff;border-color:var(--mlf-bd);color:var(--mlf-t1)}
      .mlf-light .mlf-ic-h:hover{background:var(--mlf-hv)}
      .mlf-light .mlf-br:hover{background:var(--mlf-hv)}
      .mlf-light .mlf-empty-title,.mlf-light .mlf-error-title{color:var(--mlf-t1)}
      .mlf-light .mlf-search-results{background:#fff;border-color:var(--mlf-bd)}
      .mlf-print-modal *{box-sizing:border-box}
      .mlf-print-modal{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center}
      .mlf-print-backdrop{position:absolute;inset:0;background:rgba(6,9,15,0.85)}
      .mlf-print-card{position:relative;background:var(--mlf-cd);border:1px solid var(--mlf-bd);border-radius:12px;padding:20px;width:90%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
      .mlf-print-body{display:flex;flex:1;gap:16px;min-height:0}
      .mlf-print-preview-pane{flex:1.5;background:var(--mlf-hv);border-radius:8px;padding:12px;display:flex;align-items:center;justify-content:center;overflow:auto}
      .mlf-print-paper{background:#fff;border:1px dashed #444;position:relative;overflow:hidden;width:100%;max-height:100%}
      .mlf-print-map-img{width:100%;height:100%;object-fit:cover;display:block}
      .mlf-print-legend{position:absolute;bottom:8px;left:8px;background:rgba(255,255,255,0.95);padding:6px 10px;border-radius:4px;font-size:10px;color:#222;max-width:40%}
      .mlf-print-legend-title{font-weight:600;margin-bottom:4px;font-size:11px}
      .mlf-print-legend-item{display:flex;align-items:center;gap:4px;margin:2px 0}
      .mlf-print-legend-swatch{width:10px;height:10px;border-radius:2px;flex-shrink:0;border:1px solid rgba(0,0,0,0.2)}
      .mlf-print-scale{position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,0.95);padding:4px 8px;border-radius:4px;font-size:10px;color:#222}
      .mlf-print-options-pane{flex:1;overflow-y:auto;padding-right:4px}
      .mlf-print-option{margin-bottom:14px}
      .mlf-print-option label{display:block;font-size:12px;color:var(--mlf-t2);margin-bottom:6px}
      .mlf-print-option input[type="radio"],.mlf-print-option input[type="checkbox"]{margin-right:6px}
      .mlf-print-radio-group{display:flex;flex-direction:column;gap:4px}
      .mlf-print-radio-group label{color:var(--mlf-t1);font-size:12px;cursor:pointer;display:flex;align-items:center}
      .mlf-print-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;padding-top:12px;border-top:1px solid var(--mlf-bd)}
      .mlf-print-cancel{padding:8px 16px;border-radius:6px;border:1px solid var(--mlf-bd);background:var(--mlf-cd);color:var(--mlf-t2);font-size:13px;cursor:pointer}
      .mlf-print-cancel:hover{background:var(--mlf-hv);color:var(--mlf-t1)}
      .mlf-print-confirm{padding:8px 16px;border-radius:6px;border:none;background:#f59e0b;color:#06090f;font-size:13px;cursor:pointer;font-weight:600}
      .mlf-print-confirm:hover{background:#fbbf24}
      @media (max-width:768px){
        .mlf-print-card{width:100%;height:100%;max-width:none;max-height:none;border-radius:0}
        .mlf-print-body{flex-direction:column}
        .mlf-print-preview-pane{flex:none;height:50vh}
        .mlf-print-options-pane{flex:1;overflow-y:auto}
      }
      @media (prefers-reduced-motion:reduce){
        .mlf-print-modal *{transition:none!important;animation:none!important}
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'mapakit-ui';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  _buildPanel(config, stats) {
    const panel = document.createElement('div');
    panel.className = 'mlf-panel';
    panel.id = 'mlf-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Panel de capas y filtros');

    // Header
    const header = document.createElement('div');
    header.className = 'mlf-hd';
    let headerHtml = `<h1>${this._escapeHtml(config.name || 'Mapa')}</h1>`;
    if (config.subtitle) {
      headerHtml += `<p class="sub">${this._escapeHtml(config.subtitle)}</p>`;
    }
    if (Array.isArray(config.tags) && config.tags.length) {
      headerHtml += '<div class="tags">' + config.tags.map((t, i) => {
        const cls = ['tg-a', 'tg-b', 'tg-c'][i % 3];
        return `<span class="tg ${cls}">${this._escapeHtml(t)}</span>`;
      }).join('') + '</div>';
    }
    header.innerHTML = headerHtml;
    panel.appendChild(header);

    // Connectivity indicator
    const connDot = document.createElement('div');
    connDot.className = 'mlf-conn-dot online';
    connDot.title = 'Online';
    panel.appendChild(connDot);
    this.elements.connDot = connDot;

    // Stats
    const statsEl = document.createElement('div');
    statsEl.className = 'mlf-ks';
    this.elements.stats = [];
    if (stats && typeof stats === 'object') {
      Object.entries(stats).forEach(([key, value]) => {
        const k = document.createElement('div');
        k.className = 'mlf-k';
        k.innerHTML = `<div class="v">${value != null ? String(value) : '—'}</div><div class="l">${this._escapeHtml(key)}</div>`;
        statsEl.appendChild(k);
        this.elements.stats.push(k);
      });
    }
    panel.appendChild(statsEl);

    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.className = 'mlf-theme-btn';
    themeBtn.innerHTML = '🌙';
    themeBtn.setAttribute('aria-label', 'Cambiar tema');
    themeBtn.addEventListener('click', () => {
      const isLight = this.container.classList.toggle('mlf-light');
      themeBtn.innerHTML = isLight ? '☀️' : '🌙';
      themeBtn.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
      this.emit('themeChange', { theme: isLight ? 'light' : 'dark' });
    });
    panel.appendChild(themeBtn);
    this.elements.themeBtn = themeBtn;

    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'mlf-share-btn';
    shareBtn.innerHTML = '&#128279; Compartir';
    shareBtn.setAttribute('aria-label', 'Compartir estado del mapa');
    shareBtn.addEventListener('click', () => {
      this.emit('shareMap');
    });
    panel.appendChild(shareBtn);
    this.elements.shareBtn = shareBtn;

    // Measure tool button
    const measureBtn = document.createElement('button');
    measureBtn.className = 'mlf-measure-btn';
    measureBtn.innerHTML = '📏 Medir';
    measureBtn.setAttribute('aria-label', 'Activar herramienta de medición');
    measureBtn.addEventListener('click', () => {
      const isActive = measureBtn.classList.toggle('active');
      this.emit('toggleMeasure', { active: isActive });
    });
    panel.appendChild(measureBtn);
    this.elements.measureBtn = measureBtn;

    // Print button
    const printBtn = document.createElement('button');
    printBtn.className = 'mlf-print-btn';
    printBtn.innerHTML = '🖨️ Imprimir';
    printBtn.setAttribute('aria-label', 'Abrir vista previa de impresión');
    printBtn.addEventListener('click', () => {
      this.emit('printMap');
    });
    panel.appendChild(printBtn);
    this.elements.printBtn = printBtn;

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'mlf-export-btn';
    exportBtn.innerHTML = '📥 Exportar datos';
    exportBtn.setAttribute('aria-label', 'Exportar features visibles');
    exportBtn.addEventListener('click', () => {
      this.emit('exportData');
    });
    panel.appendChild(exportBtn);
    this.elements.exportBtn = exportBtn;

    // Sync button
    const syncBtn = document.createElement('button');
    syncBtn.className = 'mlf-sync-btn';
    syncBtn.innerHTML = '🔄 Sincronizar';
    syncBtn.setAttribute('aria-label', 'Sincronizar datos');
    syncBtn.addEventListener('click', () => {
      this.emit('syncData');
    });
    panel.appendChild(syncBtn);
    this.elements.syncBtn = syncBtn;

    // Drawing tools
    const toolsEl = document.createElement('div');
    toolsEl.className = 'mlf-tools';

    const tools = [
      { id: 'point', icon: '📍', label: 'Punto' },
      { id: 'line', icon: '/', label: 'Línea' },
      { id: 'polygon', icon: '⬡', label: 'Polígono' }
    ];

    for (const tool of tools) {
      const btn = document.createElement('button');
      btn.className = 'mlf-tool-btn';
      btn.dataset.tool = tool.id;
      btn.innerHTML = `${tool.icon} ${tool.label}`;
      btn.setAttribute('aria-label', `Dibujar ${tool.label}`);
      btn.addEventListener('click', () => {
        // Toggle active state
        const isActive = btn.classList.contains('active');
        toolsEl.querySelectorAll('.mlf-tool-btn').forEach(b => b.classList.remove('active'));
        if (!isActive) btn.classList.add('active');
        this.emit('toolChange', { tool: isActive ? null : tool.id });
      });
      toolsEl.appendChild(btn);
    }

    panel.appendChild(toolsEl);
    this.elements.tools = toolsEl;

    // Search
    const searchWrap = document.createElement('div');
    searchWrap.className = 'mlf-sw';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = this.uiLayout.panel?.searchPlaceholder || 'Buscar lugares o features…';
    searchInput.setAttribute('role', 'searchbox');
    searchInput.setAttribute('aria-label', 'Buscar en el mapa');
    let geocodeDebounce;
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      this.emit('search', q);
      // Geocode for longer queries
      clearTimeout(geocodeDebounce);
      if (q.trim().length >= 3) {
        geocodeDebounce = setTimeout(() => {
          this.emit('geocodeSearch', q.trim());
        }, 400);
      } else {
        this.renderGeocodeResults([]);
      }
    });
    searchWrap.appendChild(searchInput);

    // Geocode results container
    const geocodeResults = document.createElement('div');
    geocodeResults.className = 'mlf-geocode-results';
    geocodeResults.style.display = 'none';
    searchWrap.appendChild(geocodeResults);
    this.elements.geocodeResults = geocodeResults;

    const searchResults = document.createElement('div');
    searchResults.className = 'mlf-search-results';
    searchResults.style.display = 'none';
    searchWrap.appendChild(searchResults);
    this.elements.searchResults = searchResults;

    panel.appendChild(searchWrap);
    this.elements.searchInput = searchInput;

    // Filter list container
    const filterList = document.createElement('div');
    filterList.className = 'mlf-il';
    filterList.id = 'mlf-il';
    this.elements.filterList = filterList;
    this.elements.filterLists = {};
    panel.appendChild(filterList);

    // Mobile toggle
    const mb = document.createElement('button');
    mb.className = 'mlf-mb';
    mb.innerHTML = '&#9776;';
    mb.addEventListener('click', () => panel.classList.toggle('hid'));
    this.elements.mobileToggle = mb;

    this.container.appendChild(panel);
    this.container.appendChild(mb);
    this.elements.panel = panel;
  }

  buildFilterGroup(filterConfig, options) {
    if (!this.elements.filterList) return;
    const container = this.elements.filterList;

    const ic = document.createElement('div');
    ic.className = 'mlf-ic';
    ic.dataset.filterId = filterConfig.id;
    ic.setAttribute('role', 'group');
    ic.setAttribute('aria-label', filterConfig.label || filterConfig.id);

    const color = filterConfig.color || this.style.primary || '#f59e0b';
    const header = document.createElement('div');
    header.className = 'mlf-ic-h';
    header.innerHTML = `
      <div class="mlf-ic-dot" style="background:${color}"></div>
      <span class="mlf-ic-nm">${this._escapeHtml(filterConfig.label || filterConfig.id)}</span>
      <span class="mlf-ic-ar">&#9654;</span>
    `;
    header.addEventListener('click', () => ic.classList.toggle('open'));
    ic.appendChild(header);

    const bl = document.createElement('div');
    bl.className = 'mlf-bl';
    ic.appendChild(bl);
    this.elements.filterLists[filterConfig.id] = bl;

    if (Array.isArray(options)) {
      options.forEach(opt => {
        const row = document.createElement('div');
        row.className = 'mlf-br';
        row.setAttribute('role', 'button');
        row.setAttribute('aria-pressed', 'false');
        row.dataset.value = opt.value;
        row.innerHTML = `
          <div class="mlf-bd" style="background:${opt.color || color}"></div>
          <span class="mlf-bi">${this._escapeHtml(opt.label)}</span>
          <span class="mlf-bs"><b>${opt.count != null ? opt.count : ''}</b></span>
        `;
        row.addEventListener('click', () => {
          bl.querySelectorAll('.mlf-br').forEach(r => {
            r.classList.remove('on');
            r.setAttribute('aria-pressed', 'false');
          });
          row.classList.add('on');
          row.setAttribute('aria-pressed', 'true');
          this.emit('filterChange', { filterId: filterConfig.id, value: opt.value });
        });
        bl.appendChild(row);
      });
    }

    container.appendChild(ic);
  }

  _buildToast() {
    const toast = document.createElement('div');
    toast.className = 'mlf-toast';
    toast.innerHTML = '<span class="td" id="mlf-tdot"></span><span id="mlf-ttxt"></span><button class="tc" id="mlf-tclose">&times;</button>';
    this.container.appendChild(toast);

    this.elements.toast = toast;
    this.elements.toastDot = toast.querySelector('#mlf-tdot');
    this.elements.toastText = toast.querySelector('#mlf-ttxt');

    toast.querySelector('#mlf-tclose').addEventListener('click', () => this.hideToast());
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _createLayerItem(layer, list) {
    const primaryColor = this.style?.primary || '#f59e0b';
    const type = layer.layer_type;
    const paintProp = {
      circle: 'circle-color',
      line: 'line-color',
      fill: 'fill-color'
    }[type];
    const currentColor = layer.paint?.[paintProp] || primaryColor;
    const isVisible = layer.is_visible !== false;

    const item = document.createElement('div');
    item.className = 'mlf-lp-item';
    item.setAttribute('role', 'listitem');
    item.draggable = true;
    item.dataset.layerId = layer.id;

    item.innerHTML = `
      <span class="mlf-lp-handle">≡</span>
      <label class="mlf-lp-color-wrapper">
        <div class="mlf-lp-dot" style="background:${this._escapeHtml(currentColor)}"></div>
        <input type="color" class="mlf-lp-color-input" value="${this._escapeHtml(currentColor)}">
      </label>
      <span class="mlf-lp-arrow">&#9654;</span>
      <span class="mlf-lp-name">${this._escapeHtml(layer.id)}</span>
      <span class="mlf-lp-count">0</span>
      <button class="mlf-lp-eye ${!isVisible ? 'hidden' : ''}" title="Toggle visibilidad">&#128065;</button>
    `;

    // Drag start
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', layer.id);
      item.classList.add('dragging');
    });

    // Color change
    const colorInput = item.querySelector('.mlf-lp-color-input');
    colorInput.setAttribute('aria-label', `Cambiar color de capa ${layer.name || layer.id}`);
    colorInput.addEventListener('change', (e) => {
      const color = e.target.value;
      item.querySelector('.mlf-lp-dot').style.background = color;
      this.emit('layerChange', { type: 'color', layerId: layer.id, value: color });
    });

    // Click on dot triggers color input
    item.querySelector('.mlf-lp-dot').addEventListener('click', () => {
      colorInput.click();
    });

    // Visibility toggle
    const eyeBtn = item.querySelector('.mlf-lp-eye');
    eyeBtn.setAttribute('aria-pressed', String(isVisible));
    eyeBtn.setAttribute('aria-label', `${isVisible ? 'Ocultar' : 'Mostrar'} capa ${layer.name || layer.id}`);
    eyeBtn.addEventListener('click', () => {
      const currentlyVisible = !eyeBtn.classList.contains('hidden');
      const newVisible = !currentlyVisible;
      eyeBtn.classList.toggle('hidden', !newVisible);
      eyeBtn.setAttribute('aria-pressed', String(newVisible));
      eyeBtn.setAttribute('aria-label', `${newVisible ? 'Ocultar' : 'Mostrar'} capa ${layer.name || layer.id}`);
      this.emit('layerChange', { type: 'visibility', layerId: layer.id, value: newVisible });
    });

    // Hover highlight
    item.addEventListener('mouseenter', () => {
      this.emit('highlightLayer', { layerId: layer.id });
    });
    item.addEventListener('mouseleave', () => {
      this.emit('unhighlight');
    });

    // Toggle details on arrow or name click
    const arrow = item.querySelector('.mlf-lp-arrow');
    arrow.setAttribute('aria-expanded', 'false');
    arrow.setAttribute('aria-label', `Expandir detalles de ${layer.name || layer.id}`);
    const toggleDetails = () => this.toggleLayerDetails(layer.id);
    arrow.addEventListener('click', toggleDetails);
    item.querySelector('.mlf-lp-name').addEventListener('click', toggleDetails);

    // Details container
    const details = document.createElement('div');
    details.className = 'mlf-lp-details';
    const zoomRange = [];
    if (layer.min_zoom != null) zoomRange.push(layer.min_zoom);
    if (layer.max_zoom != null) zoomRange.push(layer.max_zoom);
    const legendType = {
      circle: `<div class="mlf-lp-lg-sample" style="width:12px;height:12px;border-radius:50%;background:${this._escapeHtml(currentColor)}"></div>`,
      line: `<div class="mlf-lp-lg-sample" style="width:20px;height:2px;background:${this._escapeHtml(currentColor)}"></div>`,
      fill: `<div class="mlf-lp-lg-sample" style="width:12px;height:12px;background:${this._escapeHtml(currentColor)}"></div>`
    }[type] || '';
    details.innerHTML = `
      <div class="mlf-lp-meta">
        <div class="mlf-lp-legend">${legendType}<span>${this._escapeHtml(type)}</span></div>
        ${zoomRange.length ? `<div class="mlf-lp-zoom">Zoom: ${zoomRange.join('–')}</div>` : ''}
        <div class="mlf-lp-features">Features: <span class="mlf-lp-fc">0</span></div>
      </div>
    `;
    item.appendChild(details);

    list.appendChild(item);
  }

  _onLayerDragOver(e, list) {
    e.preventDefault();
    const indicator = this.elements.layerDropIndicator;
    if (!indicator) return;

    const afterElement = this._getDragAfterElement(list, e.clientY);

    // Only move if position actually changed
    if (indicator.nextElementSibling === afterElement) return;

    if (afterElement) {
      list.insertBefore(indicator, afterElement);
    } else {
      list.appendChild(indicator);
    }
  }

  _onLayerDrop(e, list) {
    e.preventDefault();
    const layerId = e.dataTransfer.getData('text/plain');
    const draggedItem = list.querySelector(`[data-layer-id="${layerId}"]`);
    if (!draggedItem) return;

    const afterElement = this._getDragAfterElement(list, e.clientY);
    const beforeLayerId = afterElement ? afterElement.dataset.layerId : null;

    // Remove indicator before calculating final position
    const indicator = this.elements.layerDropIndicator;
    if (indicator && indicator.parentNode) {
      indicator.remove();
    }

    if (afterElement) {
      list.insertBefore(draggedItem, afterElement);
    } else {
      list.appendChild(draggedItem);
    }

    this.emit('layerChange', { type: 'order', layerId, beforeLayerId });
  }

  _onLayerDragEnd(list) {
    list.querySelectorAll('.mlf-lp-item').forEach(item => item.classList.remove('dragging'));
    const indicator = this.elements.layerDropIndicator;
    if (indicator && indicator.parentNode) {
      indicator.remove();
    }
  }

  _getDragAfterElement(list, y) {
    const draggableElements = [...list.querySelectorAll('.mlf-lp-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}
