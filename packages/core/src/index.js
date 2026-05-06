import { createClient } from '@supabase/supabase-js';
import { createDefaultRegistry } from './plugins/index.js';
import { MapRenderer } from './MapRenderer.js';
import { FilterEngine } from './FilterEngine.js';
import { UIManager } from './UIManager.js';
import { StateManager } from './StateManager.js';
import { convertToGeoJSON } from './utils/geojson.js';
import { AuthManager } from './AuthManager.js';
import { NominatimGeocoder } from './services/NominatimGeocoder.js';
import { ExportService } from './services/ExportService.js';
import { DrawingManager } from './DrawingManager.js';
import { PrintManager } from './PrintManager.js';
import { OfflineStore } from './offline/OfflineStore.js';
import { registerServiceWorker } from './offline/registerSW.js';

export class MapaKit {
  constructor(options) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    this.configId = options.configId;
    this.options = options;

    // Plugin system
    this.pluginRegistry = options.pluginRegistry || createDefaultRegistry(options);

    // Legacy support: if supabaseUrl is provided, use Supabase provider
    if (!options.configProvider && options.supabaseUrl) {
      options.configProvider = 'supabase';
    }

    this.events = {};
    this.config = null;
    this.geojsonData = new Map();
    this.searchQuery = '';
    this.isDestroyed = false;
    this.authManager = null;

    this._syncUrlDebounced = this._debounce(() => this._syncUrl(), 300);
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    (this.events[event] || []).forEach(cb => cb(data));
  }

  _emitError(type, message, recoverable = true) {
    this.emit('error', { type, message, recoverable });
  }

  _debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  _syncUrl() {
    if (!this.stateManager || !this.mapRenderer?.map || !this.config) return;
    const center = this.mapRenderer.map.getCenter();
    const zoom = this.mapRenderer.map.getZoom();
    const bearing = this.mapRenderer.map.getBearing();
    const pitch = this.mapRenderer.map.getPitch();

    const filters = {};
    if (this.filterEngine) {
      for (const [filterId, value] of this.filterEngine.activeFilters) {
        filters[filterId] = value;
      }
    }

    const layers = {};
    for (const layer of this.config.layers) {
      layers[layer.id] = layer.is_visible !== false;
    }

    this.stateManager.setUrlParams({
      center: [center.lng, center.lat],
      zoom,
      bearing,
      pitch,
      filters,
      layers
    });
  }

  async init() {
    try {
      // Show skeleton while loading
      const loadingStyle = this.config?.map?.style || {};
      const loadingUiLayout = this.config?.map?.ui_layout || {};
      if (!this.uiManager) {
        this.uiManager = new UIManager({ container: this.container, style: loadingStyle, uiLayout: loadingUiLayout });
      }
      this.uiManager.showSkeleton();

      // Offline support
      this.offlineStore = new OfflineStore();
      await this.offlineStore.init();

      // Register SW if available
      if (this.options.offline !== false) {
        registerServiceWorker(this.options.swPath || '/sw.js');
      }

      // 1. Set up auth
      const supabaseOptions = {};
      if (this.options.authToken) {
        supabaseOptions.global = {
          headers: { Authorization: `Bearer ${this.options.authToken}` }
        };
      }
      const originalToken = this.options.authToken;
      let supabase = createClient(this.options.supabaseUrl, this.options.supabaseKey, supabaseOptions);
      this.authManager = new AuthManager(supabase);

      // Verificar sesión existente
      const session = await this.authManager.getSession().catch(() => null);
      if (session) {
        this.authManager.user = session.user;
        this.options.authToken = session.access_token;
      }
      // Recreate client with auth headers if token changed
      if (this.options.authToken !== originalToken) {
        supabaseOptions.global = {
          headers: { Authorization: `Bearer ${this.options.authToken}` }
        };
        supabase = createClient(this.options.supabaseUrl, this.options.supabaseKey, supabaseOptions);
        this.authManager = new AuthManager(supabase);
      }

      // 2. Resolve config provider
      let configProvider;
      if (this.options.configProvider) {
        configProvider = this.pluginRegistry.getConfigProvider(this.options.configProvider);
      } else {
        configProvider = this.pluginRegistry.detectConfigProvider(this.options);
      }

      // Update supabase client on provider if needed so auth is respected
      if (configProvider.id === 'supabase' && supabase) {
        configProvider.supabase = supabase;
      }

      // 3. Load configuration
      this.config = await configProvider.load(this.configId);
      this.offlineStore?.saveConfig(this.configId, this.config).catch(() => {});

      // 2. Create UIManager and MapRenderer
      const style = this.config.map.style || {};
      const uiLayout = this.config.map.ui_layout || {};
      if (!this.uiManager) {
        this.uiManager = new UIManager({ container: this.container, style, uiLayout });
      } else {
        // Update style on existing instance
        this.uiManager.style = style;
        this.uiManager.uiLayout = uiLayout;
      }
      this.mapRenderer = new MapRenderer({ container: this.container, style });

      // 3. Init MapLibre with saved or configured initial view
      this.stateManager = new StateManager({ mapId: this.configId });
      const urlParams = this.stateManager.getUrlParams();
      const savedView = this.stateManager.getMapState();
      const initialView = {
        center: urlParams.center || savedView?.center || this.config.map.initial_center,
        zoom: urlParams.zoom ?? savedView?.zoom ?? this.config.map.initial_zoom,
        bearing: urlParams.bearing ?? savedView?.bearing ?? this.config.map.initial_bearing,
        pitch: urlParams.pitch ?? savedView?.pitch ?? this.config.map.initial_pitch
      };
      await this.mapRenderer.init(initialView);

      // Store initial view for reset control
      this.mapRenderer.initialView = initialView;

      // Create DrawingManager
      this.drawingManager = new DrawingManager(this.mapRenderer);

      this.drawingManager.on('featureCreated', ({ feature }) => {
        this.emit('featureCreated', { feature });
      });

      this.drawingManager.on('featureUpdated', ({ feature, layerId }) => {
        this.emit('featureUpdated', { feature, layerId });
      });

      this.drawingManager.on('featureDeleted', ({ featureId, layerId }) => {
        this.emit('featureDeleted', { featureId, layerId });
      });

      this.printManager = new PrintManager({
        mapRenderer: this.mapRenderer,
        uiManager: this.uiManager,
        layerConfig: this.config?.layers || []
      });

      // Add custom controls from config
      if (this.config.controls?.length) {
        this.mapRenderer.addControls(this.config.controls);
      }

      // Save view state on moveend
      this.mapRenderer.map.on('moveend', () => {
        const center = this.mapRenderer.map.getCenter();
        const zoom = this.mapRenderer.map.getZoom();
        const bearing = this.mapRenderer.map.getBearing();
        const pitch = this.mapRenderer.map.getPitch();
        this.stateManager.setMapState([center.lng, center.lat], zoom, bearing, pitch);
        this._syncUrlDebounced();
      });

      // 4. Fetch all data sources via appropriate providers
      for (const source of this.config.sources) {
        try {
          const provider = this.pluginRegistry.getDataProviderForSource(source);
          let data = await provider.load(source);

          // Convert JSON to GeoJSON if needed
          if (source.source_type !== 'geojson') {
            data = convertToGeoJSON(data, source.source_type, source.properties_mapping);
          }

          this.geojsonData.set(source.id, data);
          // Save to IndexedDB for offline
          this.offlineStore?.saveData(source.id, data).catch(() => {});
        } catch (err) {
          // Try IndexedDB fallback
          try {
            const cached = await this.offlineStore?.getData(source.id);
            if (cached) {
              this.geojsonData.set(source.id, cached);
              console.log(`Using cached data for source ${source.id}`);
            } else {
              this._emitError('dataLoad', `Failed to load source ${source.id}: ${err.message}`, true);
              this.uiManager.showErrorState?.(err.message);
            }
          } catch {
            this._emitError('dataLoad', `Failed to load source ${source.id}: ${err.message}`, true);
            this.uiManager.showErrorState?.(err.message);
          }
        }
      }

      // 5. Add sources and layers to MapRenderer
      for (const source of this.config.sources) {
        const geojson = this.geojsonData.get(source.id);
        if (geojson) {
          const layer = this.config.layers.find(l => l.source_id === source.id);
          this.mapRenderer.addSource(source.id, geojson, {
            layer_type: layer?.layer_type,
            layer_config: source.layer_config
          });
        }
      }
      for (const layer of this.config.layers) {
        if (layer.layer_type === 'cluster') continue; // clusters rendered by MapRenderer
        this.mapRenderer.addLayer({
          id: layer.id,
          source: layer.source_id,
          type: layer.layer_type,
          paint: layer.paint,
          layout: layer.layout,
          minzoom: layer.min_zoom,
          maxzoom: layer.max_zoom,
          filter: layer.filter_expression
        });
      }

      // Apply layer visibility from URL
      if (urlParams.layers && Object.keys(urlParams.layers).length > 0) {
        for (const layer of this.config.layers) {
          const visibleFromUrl = urlParams.layers[layer.id];
          if (visibleFromUrl !== undefined) {
            this.setLayerVisible(layer.id, visibleFromUrl);
          }
        }
      }

      // 6. Set up clustering redraw on moveend
      // Already handled internally by MapRenderer.init()

      // 7. Set up FilterEngine with config filters
      this.filterEngine = new FilterEngine();
      this.filterEngine.setFilterConfig(this.config.filters);

      // 8. Apply URL state filters
      for (const [filterId, value] of Object.entries(urlParams.filters)) {
        this.filterEngine.setFilter(filterId, value);
      }

      // 9. Render UI panel with filters and stats
      const totalFeatures = Array.from(this.geojsonData.values())
        .reduce((sum, g) => sum + (g.features?.length || 0), 0);
      const stats = this._computeStats(totalFeatures);
      this.uiManager.init(this.config.map, stats);

      for (const filterConfig of this.config.filters) {
        const options = this._getFilterOptions(filterConfig);
        this.uiManager.buildFilterGroup(filterConfig, options);
      }

      // Sync UI filter selections with URL state
      for (const [filterId, value] of Object.entries(urlParams.filters)) {
        const container = this.uiManager.elements.filterLists?.[filterId];
        if (container) {
          container.querySelectorAll('.mlf-br').forEach(row => {
            row.classList.toggle('on', row.dataset.value === String(value));
          });
        }
      }

      // Render layer panel
      if (this.config.layers?.length && this.uiLayout?.panel?.layerPanel !== false) {
        this.uiManager.renderLayerPanel(this.config.layers);
        this.uiManager.on('layerChange', ({ type, layerId, beforeLayerId, value }) => {
          if (type === 'order') this.moveLayer(layerId, beforeLayerId);
          else if (type === 'color') this.setLayerColor(layerId, value);
          else if (type === 'visibility') this.setLayerVisible(layerId, value);
        });

        // Hover highlight events
        this.uiManager.on('highlightFilter', ({ filterId, value }) => {
          const filterConfig = this.config.filters.find(f => f.id === filterId);
          if (!filterConfig) return;
          const highlightedFeatures = [];
          for (const source of this.config.sources) {
            const geojson = this.geojsonData.get(source.id);
            if (!geojson) continue;
            const matching = geojson.features.filter(f => {
              const propVal = f.properties?.[filterConfig.field];
              return String(propVal) === String(value);
            });
            highlightedFeatures.push(...matching);
          }
          if (highlightedFeatures.length) {
            this.mapRenderer.highlightFeatures({
              type: 'FeatureCollection',
              features: highlightedFeatures
            });
          }
        });

        this.uiManager.on('highlightLayer', ({ layerId }) => {
          const layer = this.config.layers.find(l => l.id === layerId);
          if (!layer) return;
          const geojson = this.geojsonData.get(layer.source_id);
          if (geojson) this.mapRenderer.highlightFeatures(geojson);
        });

        this.uiManager.on('unhighlight', () => {
          this.mapRenderer.unhighlightFeatures();
        });

        this.uiManager.on('highlightSearchResult', ({ feature }) => {
          this.mapRenderer.highlightFeatures({
            type: 'FeatureCollection',
            features: [feature]
          });
        });

        // Geocoding
        const geocoder = new NominatimGeocoder();
        this.uiManager.on('geocodeSearch', async (query) => {
          const results = await geocoder.search(query);
          this.uiManager.renderGeocodeResults(results);
        });

        this.uiManager.on('geocodeResultClick', ({ lng, lat, name }) => {
          this.mapRenderer.flyTo({ center: [lng, lat], zoom: 16 });
          // Add temporary marker
          this.mapRenderer.addPopup([lng, lat], `<div style="font-size:13px;font-weight:600">${name}</div>`);
        });

        this.uiManager.on('clearFilters', () => {
          this.clearFilters();
        });

        this.uiManager.on('escape', () => {
          this.mapRenderer.removePopup();
        });

        this.uiManager.on('keyboardClearFilters', () => {
          this.clearFilters();
        });

        this.uiManager.on('shareMap', () => {
          this._shareMapState();
        });

        this.uiManager.on('exportData', () => {
          this._exportVisibleFeatures();
        });

        this.uiManager.on('printMap', () => {
          this.printManager.openPreview();
        });

        this.uiManager.on('toggleMeasure', ({ active }) => {
          this.mapRenderer.toggleMeasureMode(active);
        });

        this.uiManager.on('retry', () => {
          this.destroy();
          this.init();
        });
      }

      // Wire up drawing tool buttons
      this.uiManager.on('toolChange', ({ tool }) => {
        this.drawingManager.setMode(tool);
      });

      // Wire up auth events
      this.uiManager.on('authLogin', async ({ email, password, onError }) => {
        try {
          const session = await this.authManager.signIn(email, password);
          this.options.authToken = session.access_token;
          this.uiManager.updateAuthState(session.user);
          // Reload config with auth — destroy first to avoid duplicates
          this.destroy();
          await this.init();
        } catch (err) {
          onError(err.message);
        }
      });

      this.uiManager.on('authLogout', async () => {
        await this.authManager.signOut();
        this.options.authToken = null;
        this.uiManager.updateAuthState(null);
      });

      // Mostrar estado inicial
      this.uiManager.updateAuthState(this.authManager.user);

      // Wire up theme change
      this.uiManager.on('themeChange', ({ theme }) => {
        this.emit('themeChange', { theme });
      });

      // Online/offline events
      const updateOnlineStatus = () => {
        const status = navigator.onLine ? 'online' : 'offline';
        this.uiManager.updateConnectivity?.(status);
        if (navigator.onLine) {
          this.uiManager.showToast?.('Conexión restaurada', '#22c55e');
        } else {
          this.uiManager.showToast?.('Sin conexión - usando cache', '#f59e0b');
        }
      };
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      updateOnlineStatus();

      // Sync button
      this.uiManager.on('syncData', () => {
        this.uiManager.showToast?.('Sincronizando...', '#f59e0b');
        this.destroy();
        this.init().then(() => {
          this.uiManager.showToast?.('Sincronización completa', '#22c55e');
        });
      });

      // 10. Wire up events (filterChange → apply filters → sync URL → update stats)
      this.uiManager.on('filterChange', ({ filterId, value }) => {
        this.filterEngine.setFilter(filterId, value);
        this.emit('filterChange', { filterId, value });
        this._applyFiltersDebounced();
      });

      // 11. Wire up search
      this.uiManager.on('search', (query) => {
        this.searchQuery = query;
        this._applyFiltersDebounced();
      });

      // 12. Wire up featureClick → popup
      this.mapRenderer.on('featureClick', ({ feature, properties, lngLat }) => {
        this.emit('featureClick', { feature, properties, lngLat });
        const imageConfig = this.config.images?.[0];
        let html;

        if (this.drawingManager?.mode === 'edit') {
          // Editable popup
          html = this.uiManager.createEditablePopupContent(properties, (updates) => {
            Object.assign(feature.properties, updates);
            this.drawingManager.emit('featureUpdated', { feature, layerId: feature.layer?.id });
            this.mapRenderer.removePopup();
            this.uiManager.showToast?.('Feature actualizada', '#22c55e');
          });
        } else {
          html = this.uiManager.createPopupContent(properties, imageConfig);
        }

        this.mapRenderer.addPopup(lngLat, html);
      });

      // Hide skeleton
      this.uiManager.hideSkeleton();
      this.uiManager.hideErrorState?.();

      // Apply initial filters before marking ready
      this._applyFiltersAndUpdate();

      // 13. Emit 'ready' event
      this.emit('ready', { config: this.config });
    } catch (err) {
      this._emitError('init', err.message, false);
      throw err;
    }
  }

  _applyFiltersDebounced() {
    if (this._filterTimer) clearTimeout(this._filterTimer);
    this._filterTimer = setTimeout(() => {
      this._applyFiltersAndUpdate();
    }, 150);
  }

  _applyFiltersAndUpdate() {
    if (!this.filterEngine || !this.mapRenderer || !this.config) return;

    let totalVisible = 0;

    for (const source of this.config.sources) {
      const originalGeojson = this.geojsonData.get(source.id);
      if (!originalGeojson) continue;

      let filteredFeatures = this.filterEngine.apply(originalGeojson.features);

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        filteredFeatures = filteredFeatures.filter(f => {
          return Object.values(f.properties || {}).some(v =>
            String(v).toLowerCase().includes(q)
          );
        });
      }

      totalVisible += filteredFeatures.length;

      // Update layer feature counts
      const layer = this.config.layers.find(l => l.source_id === source.id);
      if (layer) {
        this.uiManager.updateLayerCount(layer.id, filteredFeatures.length);
      }

      const filteredGeojson = {
        type: 'FeatureCollection',
        features: filteredFeatures
      };

      this.mapRenderer.animatedFilterUpdate(source.id, filteredGeojson);
    }

    // Render search results in panel
    if (this.searchQuery && this.uiManager) {
      const searchResults = [];
      for (const source of this.config.sources) {
        const originalGeojson = this.geojsonData.get(source.id);
        if (!originalGeojson) continue;
        let filteredFeatures = this.filterEngine.apply(originalGeojson.features);
        const q = this.searchQuery.toLowerCase();
        const matching = filteredFeatures.filter(f =>
          Object.values(f.properties || {}).some(v =>
            String(v).toLowerCase().includes(q)
          )
        );
        searchResults.push(...matching);
      }
      this.uiManager.renderSearchResults(searchResults);
    } else {
      this.uiManager?.renderSearchResults([]);
    }

    // Check for empty state
    const visibleLayerCount = this.config.layers.filter(l => l.is_visible !== false).length;
    if (totalVisible === 0 && visibleLayerCount > 0) {
      this.uiManager.showEmptyState(visibleLayerCount);
    } else {
      this.uiManager.hideEmptyState();
    }

    const stats = this._computeStats(totalVisible);
    this.uiManager.updateStats(stats);

    this._syncUrlDebounced();
  }

  _computeStats(visibleCount) {
    const totalFeatures = Array.from(this.geojsonData.values())
      .reduce((sum, g) => sum + (g.features?.length || 0), 0);
    return {
      Total: totalFeatures,
      Visible: visibleCount !== undefined ? visibleCount : totalFeatures
    };
  }

  _shareMapState() {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.uiManager.showToast?.('¡Enlace copiado al portapapeles!', '#22c55e');
      }).catch(() => {
        this.uiManager.showToast?.('No se pudo copiar el enlace', '#ef4444');
      });
    } else {
      this.uiManager.showToast?.('Copia manual: ' + url, '#f59e0b');
    }
  }

  _exportVisibleFeatures() {
    if (!this.config) return;
    const allFeatures = [];
    for (const source of this.config.sources) {
      const geojson = this.geojsonData.get(source.id);
      if (!geojson) continue;
      let filtered = this.filterEngine ? this.filterEngine.apply(geojson.features) : geojson.features;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        filtered = filtered.filter(f =>
          Object.values(f.properties || {}).some(v => String(v).toLowerCase().includes(q))
        );
      }
      allFeatures.push(...filtered);
    }
    if (allFeatures.length === 0) {
      this.uiManager.showToast?.('No hay features visibles para exportar', '#ef4444');
      return;
    }
    // Default to GeoJSON
    const geojson = ExportService.toGeoJSON(allFeatures);
    ExportService.download(geojson, 'mapakit-export.geojson', 'application/geo+json');
    this.uiManager.showToast?.(`${allFeatures.length} features exportados`, '#22c55e');
  }

  _getFilterOptions(filterConfig) {
    const values = new Map();
    for (const source of this.config.sources) {
      const geojson = this.geojsonData.get(source.id);
      if (!geojson) continue;
      for (const feature of geojson.features) {
        const val = feature.properties?.[filterConfig.field];
        if (val === undefined || val === null) continue;
        const key = String(val);
        if (!values.has(key)) {
          values.set(key, { label: key, value: key, count: 0, color: filterConfig.color });
        }
        values.get(key).count++;
      }
    }
    return Array.from(values.values()).sort((a, b) => b.count - a.count);
  }

  moveLayer(layerId, beforeLayerId) {
    if (this.isDestroyed || !this.mapRenderer) return;
    this.mapRenderer.moveLayer(layerId, beforeLayerId);
    const idx = this.config.layers.findIndex(l => l.id === layerId);
    if (idx === -1) return;
    const [layer] = this.config.layers.splice(idx, 1);
    if (beforeLayerId) {
      const beforeIdx = this.config.layers.findIndex(l => l.id === beforeLayerId);
      this.config.layers.splice(beforeIdx, 0, layer);
    } else {
      this.config.layers.push(layer);
    }
    this.emit('layerChange', { type: 'order', layerId, beforeLayerId });
    this._syncUrlDebounced();
  }

  setLayerColor(layerId, color) {
    if (this.isDestroyed || !this.mapRenderer) return;
    const layer = this.config.layers.find(l => l.id === layerId);
    if (!layer) return;
    const type = layer.layer_type;
    const paintProp = {
      circle: 'circle-color',
      line: 'line-color',
      fill: 'fill-color'
    }[type];
    if (paintProp) {
      this.mapRenderer.setPaintProperty(layerId, paintProp, color);
      layer.paint = layer.paint || {};
      layer.paint[paintProp] = color;
      this.emit('layerChange', { type: 'color', layerId, value: color });
    }
  }

  setLayerVisible(layerId, visible) {
    if (this.isDestroyed || !this.mapRenderer) return;
    const layer = this.config.layers.find(l => l.id === layerId);
    if (!layer) return;
    this.mapRenderer.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    layer.is_visible = visible;
    this.emit('layerChange', { type: 'visibility', layerId, value: visible });
    this._syncUrlDebounced();
  }

  setFilter(filterId, value) {
    if (this.isDestroyed || !this.filterEngine) return;
    this.filterEngine.setFilter(filterId, value);

    // Sync UI selection
    const container = this.uiManager?.elements.filterLists?.[filterId];
    if (container) {
      container.querySelectorAll('.mlf-br').forEach(row => {
        row.classList.toggle('on', row.dataset.value === String(value));
      });
    }

    this._applyFiltersDebounced();
  }

  clearFilters() {
    if (this.isDestroyed || !this.filterEngine) return;
    this.filterEngine.clearFilters();
    this.uiManager?.clearFilters();
    this.searchQuery = '';
    if (this.uiManager?.elements.searchInput) {
      this.uiManager.elements.searchInput.value = '';
    }
    this._applyFiltersDebounced();
  }

  flyTo(options) {
    if (this.isDestroyed || !this.mapRenderer) return;
    this.mapRenderer.flyTo(options);
  }

  destroy() {
    this.isDestroyed = true;
    this.printManager?.closePreview();
    if (this.mapRenderer) {
      this.mapRenderer.destroy();
      this.mapRenderer = null;
    }
    if (this.uiManager) {
      this.uiManager.destroy();
      this.uiManager = null;
    }
    this.geojsonData.clear();
    this.events = {};
    this.config = null;
  }
}
