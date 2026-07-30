import maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { simplifyGeoJSON } from './utils/simplify.js';

export class MapRenderer {
  constructor({ container, style }) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.style = style || {};
    this.events = {};
    this.map = null;
    this.markers = [];
    this.sources = new Map();
    this.layers = new Map();
    this.clusterIndex = new Map();
    this.clusterMarkers = [];
    this.activePopup = null;
    this.tooltipEl = null;
    this.loaderEl = null;
    this.minimapEl = null;
    this.measureMode = false;
    this.measurePoints = [];
    this.measurePopup = null;
  }

  async init(initialView) {
    this._showLoader();
    if (!this.container) {
      throw new Error('MapRenderer: container not found');
    }

    const basemap = this.style.basemap || 'carto-dark';
    let styleSpec;

    if (basemap === 'carto-dark') {
      styleSpec = {
        version: 8,
        sources: {
          'basemap': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'basemap',
            type: 'raster',
            source: 'basemap'
          }
        ],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
      };
    } else if (basemap === 'carto-light') {
      styleSpec = {
        version: 8,
        sources: {
          'basemap': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
      };
    } else {
      throw new Error(`MapRenderer: unsupported basemap "${basemap}"`);
    }

    // El minimapa reutiliza el mismo estilo base (ver _initMinimap).
    this._styleSpec = styleSpec;

    this.map = new maplibregl.Map({
      container: this.container,
      style: styleSpec,
      center: initialView?.center || [-99.13, 23.5],
      zoom: initialView?.zoom ?? 4.8,
      bearing: initialView?.bearing || 0,
      pitch: initialView?.pitch || 0,
      maxZoom: initialView?.maxZoom || 18,
      minZoom: initialView?.minZoom || 0
    });

    this.initialView = { center: initialView?.center || [-99.13, 23.5], zoom: initialView?.zoom ?? 4.8, bearing: initialView?.bearing || 0, pitch: initialView?.pitch || 0 };

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this._injectCSS();
    this._setupFeatureTooltip();
    this._setupMeasureTool();

    return new Promise((resolve) => {
      this.map.once('load', () => {
        this._hideLoader();
        this.map.on('moveend', () => this._onMoveEnd());
        this._initMinimap();
        resolve(this.map);
      });
    });
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    (this.events[event] || []).forEach(cb => cb(data));
  }

  addSource(sourceId, geojson, layerConfig = {}) {
    if (!this.map) return;

    // Precompute bboxes for viewport filtering
    this._precomputeFeatureBboxes(geojson);

    const isCluster = layerConfig.layer_type === 'cluster';
    const clusterConfig = layerConfig.layer_config || {};

    if (isCluster) {
      const radius = clusterConfig.clusterRadius ?? 55;
      const maxZoom = clusterConfig.clusterMaxZoom ?? 15;
      const sc = new Supercluster({ radius, maxZoom });
      sc.load(geojson.features || []);
      this.clusterIndex.set(sourceId, { index: sc, layerConfig, geojson });
      this._drawClustersForSource(sourceId);
    } else {
      if (this.map.getSource(sourceId)) {
        this.map.getSource(sourceId).setData(geojson);
      } else {
        this.map.addSource(sourceId, {
          type: 'geojson',
          data: geojson
        });
      }
      this.sources.set(sourceId, { type: 'geojson', data: geojson });
    }
  }

  addLayer(layerConfig) {
    if (!this.map) return;

    const id = layerConfig.id;
    const sourceId = layerConfig.source;
    const type = layerConfig.type;

    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }

    const baseLayer = {
      id,
      source: sourceId,
      type,
      paint: layerConfig.paint || {},
      layout: layerConfig.layout || {}
    };

    if (layerConfig.filter) {
      baseLayer.filter = layerConfig.filter;
    }

    if (type === 'circle') {
      baseLayer.paint = {
        'circle-radius': layerConfig.paint?.['circle-radius'] ?? 6,
        'circle-color': layerConfig.paint?.['circle-color'] ?? this.style.primary ?? '#f59e0b',
        'circle-opacity': layerConfig.paint?.['circle-opacity'] ?? 0.9,
        'circle-stroke-width': layerConfig.paint?.['circle-stroke-width'] ?? 1,
        'circle-stroke-color': layerConfig.paint?.['circle-stroke-color'] ?? '#ffffff',
        ...layerConfig.paint
      };
    } else if (type === 'heatmap') {
      baseLayer.paint = {
        'heatmap-radius': layerConfig.paint?.['heatmap-radius'] ?? 25,
        'heatmap-color': layerConfig.paint?.['heatmap-color'] ?? [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, '#1b2435',
          0.4, '#374151',
          0.6, '#f59e0b',
          0.8, '#fbbf24',
          1, '#ffffff'
        ],
        'heatmap-opacity': layerConfig.paint?.['heatmap-opacity'] ?? 0.7,
        ...layerConfig.paint
      };
    } else if (type === 'fill') {
      baseLayer.paint = {
        'fill-color': layerConfig.paint?.['fill-color'] ?? this.style.primary ?? '#f59e0b',
        'fill-opacity': layerConfig.paint?.['fill-opacity'] ?? 0.3,
        ...layerConfig.paint
      };
      // Add outline if not present
      if (!this.map.getLayer(`${id}-outline`)) {
        const outlineLayer = {
          id: `${id}-outline`,
          source: sourceId,
          type: 'line',
          paint: {
            // El contorno hereda el color declarado para el borde del fill
            // antes de caer al color de acento por defecto.
            'line-color': layerConfig.paint?.['line-color']
              ?? layerConfig.paint?.['fill-outline-color']
              ?? '#f59e0b',
            'line-width': layerConfig.paint?.['line-width'] ?? 1
          }
        };
        // "filter: undefined" hace que el validador de MapLibre rechace la
        // capa completa ("array expected, undefined found"); solo se incluye
        // la clave cuando hay un filtro real.
        if (layerConfig.filter) outlineLayer.filter = layerConfig.filter;
        this.map.addLayer(outlineLayer);
      }
    } else if (type === 'line') {
      baseLayer.paint = {
        'line-color': layerConfig.paint?.['line-color'] ?? this.style.primary ?? '#f59e0b',
        'line-width': layerConfig.paint?.['line-width'] ?? 2,
        ...layerConfig.paint
      };
    } else if (type === 'symbol') {
      baseLayer.layout = {
        'text-field': layerConfig.layout?.['text-field'] ?? ['get', 'name'],
        'text-font': layerConfig.layout?.['text-font'] ?? ['Open Sans Regular'],
        'text-size': layerConfig.layout?.['text-size'] ?? 12,
        ...layerConfig.layout
      };
    }

    this.map.addLayer(baseLayer);
    this.layers.set(id, { ...layerConfig, isCluster: false });

    // Click handler for non-cluster features
    if (type !== 'heatmap') {
      this.map.on('click', id, (e) => {
        const feature = e.features?.[0];
        if (feature) {
          this.emit('featureClick', {
            feature,
            properties: feature.properties,
            lngLat: e.lngLat
          });
        }
      });
      this.map.on('mouseenter', id, () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', id, () => {
        this.map.getCanvas().style.cursor = '';
      });
    }
  }

  updateSourceData(sourceId, geojson) {
    if (!this.map) return;

    const clusterInfo = this.clusterIndex.get(sourceId);
    if (clusterInfo) {
      clusterInfo.geojson = geojson;
      clusterInfo.index.load(geojson.features || []);
      this._drawClustersForSource(sourceId);
    } else {
      const source = this.map.getSource(sourceId);
      if (source && source.setData) {
        source.setData(geojson);
      }
      if (this.sources.has(sourceId)) {
        this.sources.get(sourceId).data = geojson;
      }
    }
  }

  drawClusters() {
    this._clearClusterMarkers();
    for (const sourceId of this.clusterIndex.keys()) {
      this._drawClustersForSource(sourceId);
    }
  }

  addPopup(lngLat, html) {
    if (!this.map) return;
    // Remove existing popup immediately if animating
    if (this.activePopup) {
      const oldPopup = this.activePopup;
      this.activePopup = null;
      oldPopup.remove();
    }
    this.activePopup = new maplibregl.Popup({
      offset: 12,
      closeButton: true,
      maxWidth: '320px'
    })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(this.map);
    return this.activePopup;
  }

  removePopup() {
    if (!this.activePopup) return;
    const popup = this.activePopup;
    const content = popup.getElement()?.querySelector('.maplibregl-popup-content');
    if (content) {
      content.classList.add('leaving');
      setTimeout(() => {
        popup.remove();
        if (this.activePopup === popup) {
          this.activePopup = null;
        }
      }, 150);
    } else {
      popup.remove();
      this.activePopup = null;
    }
  }

  flyTo(options) {
    if (!this.map) return;
    this.map.flyTo(options);
  }

  fitBounds(bounds, options) {
    if (!this.map) return;
    this.map.fitBounds(bounds, options);
  }

  getZoom() {
    return this.map ? this.map.getZoom() : 0;
  }

  getBounds() {
    return this.map ? this.map.getBounds() : null;
  }

  moveLayer(layerId, beforeLayerId) {
    if (!this.map || !this.map.getLayer(layerId)) return;
    this.map.moveLayer(layerId, beforeLayerId);
  }

  setPaintProperty(layerId, property, value) {
    if (!this.map || !this.map.getLayer(layerId)) return;
    this.map.setPaintProperty(layerId, property, value);
  }

  setLayoutProperty(layerId, property, value) {
    if (!this.map || !this.map.getLayer(layerId)) return;
    this.map.setLayoutProperty(layerId, property, value);
  }

  async _setLayerOpacity(layerId, targetOpacity, duration) {
    if (!this.map || !this.map.getLayer(layerId)) return;

    // Skip animation if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const type = this.map.getLayer(layerId).type;
      const prop = { circle: 'circle-opacity', line: 'line-opacity', fill: 'fill-opacity', heatmap: 'heatmap-opacity' }[type];
      if (prop) this.map.setPaintProperty(layerId, prop, targetOpacity);
      return Promise.resolve();
    }

    const type = this.map.getLayer(layerId).type;
    const prop = { circle: 'circle-opacity', line: 'line-opacity', fill: 'fill-opacity', heatmap: 'heatmap-opacity' }[type];
    if (!prop) return;
    const startOpacity = this.map.getPaintProperty(layerId, prop) ?? 1;
    const startTime = performance.now();
    return new Promise((resolve) => {
      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = startOpacity + (targetOpacity - startOpacity) * ease;
        this.map.setPaintProperty(layerId, prop, current);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  _getViewportBbox() {
    if (!this.map) return null;
    const bounds = this.map.getBounds();
    return {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth()
    };
  }

  _precomputeFeatureBboxes(geojson) {
    if (!geojson.features) return;
    for (const feature of geojson.features) {
      if (!feature.bbox) {
        feature.bbox = this._calculateBbox(feature.geometry);
      }
    }
  }

  _calculateBbox(geometry) {
    if (!geometry) return null;
    const coords = geometry.coordinates;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    const updateMinMax = (c) => {
      if (c[0] < minLng) minLng = c[0];
      if (c[0] > maxLng) maxLng = c[0];
      if (c[1] < minLat) minLat = c[1];
      if (c[1] > maxLat) maxLat = c[1];
    };

    if (geometry.type === 'Point') {
      updateMinMax(coords);
    } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
      coords.forEach(updateMinMax);
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
      coords.flat().forEach(updateMinMax);
    } else if (geometry.type === 'MultiPolygon') {
      coords.flat(2).forEach(updateMinMax);
    }

    return [minLng, minLat, maxLng, maxLat];
  }

  _filterByViewport(features, viewportBbox, bufferFactor = 1.0) {
    if (!viewportBbox || !features) return features;
    const { west, south, east, north } = viewportBbox;
    const width = east - west;
    const height = north - south;
    const bufWest = west - width * bufferFactor;
    const bufEast = east + width * bufferFactor;
    const bufSouth = south - height * bufferFactor;
    const bufNorth = north + height * bufferFactor;

    return features.filter(f => {
      const bbox = f.bbox;
      if (!bbox) return true; // Include if no bbox
      // Check if feature bbox intersects buffered viewport
      return bbox[0] <= bufEast && bbox[2] >= bufWest && bbox[1] <= bufNorth && bbox[3] >= bufSouth;
    });
  }

  async animatedFilterUpdate(layerId, geojson, duration = 300) {
    // Viewport filtering for performance (only if >1000 features)
    let workingGeojson = geojson;
    if (geojson.features && geojson.features.length > 1000) {
      const viewport = this._getViewportBbox();
      if (viewport) {
        workingGeojson = {
          ...geojson,
          features: this._filterByViewport(geojson.features, viewport)
        };
      }
    }

    // Simplify geometries based on current zoom for performance
    const zoom = this.map.getZoom();
    const simplifiedGeojson = simplifyGeoJSON(workingGeojson, zoom);

    const layer = this.map?.getLayer(layerId);
    if (!layer) return this.updateSourceData(layerId, simplifiedGeojson);

    // Skip animation if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.updateSourceData(layerId, simplifiedGeojson);
      return Promise.resolve();
    }

    await this._setLayerOpacity(layerId, 0, duration / 2);
    if (layer.type === 'fill' && this.map.getLayer(`${layerId}-outline`)) {
      await this._setLayerOpacity(`${layerId}-outline`, 0, duration / 2);
    }
    this.updateSourceData(layerId, simplifiedGeojson);
    await this._setLayerOpacity(layerId, 1, duration / 2);
    if (layer.type === 'fill' && this.map.getLayer(`${layerId}-outline`)) {
      await this._setLayerOpacity(`${layerId}-outline`, 1, duration / 2);
    }
  }

  addControls(controlList) {
    if (!this.map) return;
    this._controls = this._controls || [];
    const ControlClasses = {
      geolocate: () => {
        const btn = document.createElement('button');
        btn.className = 'maplibregl-ctrl-icon mapakit-ctrl-geolocate';
        btn.innerHTML = '📍';
        btn.title = 'Mi ubicación';
        btn.addEventListener('click', () => this._geolocate());
        return { onAdd: () => btn, onRemove: () => {} };
      },
      fullscreen: () => {
        const btn = document.createElement('button');
        btn.className = 'maplibregl-ctrl-icon mapakit-ctrl-fullscreen';
        btn.innerHTML = '⛶';
        btn.title = 'Pantalla completa';
        btn.addEventListener('click', () => this._toggleFullscreen());
        return { onAdd: () => btn, onRemove: () => {} };
      },
      reset: () => {
        const btn = document.createElement('button');
        btn.className = 'maplibregl-ctrl-icon mapakit-ctrl-reset';
        btn.innerHTML = '🏠';
        btn.title = 'Vista inicial';
        btn.addEventListener('click', () => this.flyToReset());
        return { onAdd: () => btn, onRemove: () => {} };
      },
      scale: () => {
        // Use maplibregl ScaleControl if available
        if (window.maplibregl?.ScaleControl) {
          return new window.maplibregl.ScaleControl({ maxWidth: 80, unit: 'metric' });
        }
        const el = document.createElement('div');
        el.className = 'maplibregl-ctrl mapakit-ctrl-scale';
        el.style.cssText = 'background:rgba(6,9,15,0.8);color:#d4d4d8;padding:4px 8px;border-radius:4px;font-size:11px;';
        el.textContent = 'Escala';
        return { onAdd: () => el, onRemove: () => {} };
      }
    };
    for (const name of controlList) {
      const factory = ControlClasses[name];
      if (!factory) continue;
      const control = factory();
      this._controls.push(control);
      this.map.addControl(control, 'bottom-right');
    }
  }

  _geolocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.map.flyTo({ center: [longitude, latitude], zoom: 14 });
      },
      () => {}
    );
  }

  _toggleFullscreen() {
    const container = this.map.getContainer();
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  flyToReset() {
    if (!this.map || !this.initialView) return;
    this.map.flyTo({
      center: this.initialView.center,
      zoom: this.initialView.zoom,
      bearing: this.initialView.bearing,
      pitch: this.initialView.pitch
    });
  }

  _createHighlightLayer() {
    if (!this.map || this.map.getLayer('mapakit-highlight-circle')) return;
    this.map.addSource('mapakit-highlight', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    ['circle', 'line', 'fill'].forEach(type => {
      const id = `mapakit-highlight-${type}`;
      if (this.map.getLayer(id)) return;
      this.map.addLayer({
        id,
        source: 'mapakit-highlight',
        type,
        filter: ['==', ['geometry-type'], type === 'circle' ? 'Point' : type === 'line' ? 'LineString' : 'Polygon'],
        paint: {
          circle: {
            'circle-radius': 10,
            'circle-color': '#fbbf24',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9
          },
          line: {
            'line-width': 4,
            'line-color': '#fbbf24',
            'line-opacity': 1
          },
          fill: {
            'fill-color': 'rgba(251, 191, 36, 0.3)',
            'fill-outline-color': '#fbbf24'
          }
        }[type],
        layout: { visibility: 'none' }
      });
    });
  }

  highlightFeatures(geojson) {
    if (!this.map) return;
    const source = this.map.getSource('mapakit-highlight');
    if (!source) this._createHighlightLayer();
    this.map.getSource('mapakit-highlight')?.setData(geojson);
    ['circle', 'line', 'fill'].forEach(type => {
      if (this.map.getLayer(`mapakit-highlight-${type}`)) {
        this.map.setLayoutProperty(`mapakit-highlight-${type}`, 'visibility', 'visible');
      }
    });
    // Add will-change for performance on highlight layers
    const canvas = this.map.getCanvasContainer?.() || this.map.getCanvas?.();
    if (canvas) canvas.style.willChange = 'opacity';
  }

  unhighlightFeatures() {
    if (!this.map) return;
    ['circle', 'line', 'fill'].forEach(type => {
      if (this.map.getLayer(`mapakit-highlight-${type}`)) {
        this.map.setLayoutProperty(`mapakit-highlight-${type}`, 'visibility', 'none');
      }
    });
    // Remove will-change when not highlighting
    const canvas = this.map.getCanvasContainer?.() || this.map.getCanvas?.();
    if (canvas) canvas.style.willChange = '';
  }

  toggleMeasureMode(enabled) {
    this.measureMode = enabled;
    if (!enabled) {
      this._clearMeasure();
    } else {
      this.map.getCanvas().style.cursor = 'crosshair';
    }
  }

  _clearMeasure() {
    this.measurePoints = [];
    if (this.measurePopup) {
      this.measurePopup.remove();
      this.measurePopup = null;
    }
    const source = this.map.getSource('mapakit-measure');
    if (source) source.setData({ type: 'FeatureCollection', features: [] });
  }

  _setupMeasureTool() {
    if (!this.map) return;

    // Add source and layer for measure line
    this.map.addSource('mapakit-measure', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    this.map.addLayer({
      id: 'mapakit-measure-line',
      source: 'mapakit-measure',
      type: 'line',
      paint: {
        'line-color': '#f59e0b',
        'line-width': 2,
        'line-dasharray': [4, 2]
      }
    });

    this.map.on('click', (e) => {
      if (!this.measureMode) return;

      const coords = [e.lngLat.lng, e.lngLat.lat];
      this.measurePoints.push(coords);

      if (this.measurePoints.length === 2) {
        // Calculate distance using Haversine formula
        const dist = this._haversineDistance(this.measurePoints[0], this.measurePoints[1]);
        const distText = dist >= 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist.toFixed(0)} m`;

        // Draw line
        const source = this.map.getSource('mapakit-measure');
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: this.measurePoints }
          }]
        });

        // Show popup with distance
        const midPoint = [
          (this.measurePoints[0][0] + this.measurePoints[1][0]) / 2,
          (this.measurePoints[0][1] + this.measurePoints[1][1]) / 2
        ];
        this.measurePopup = new maplibregl.Popup()
          .setLngLat(midPoint)
          .setHTML(`<div style="font-size:12px;font-weight:600;color:#f59e0b">${distText}</div>`)
          .addTo(this.map);

        // Reset for next measurement
        this.measurePoints = [];
      }
    });
  }

  _haversineDistance([lng1, lat1], [lng2, lat2]) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _initMinimap() {
    if (!this.container) return;
    const mm = document.createElement('div');
    mm.className = 'mlf-minimap';
    mm.innerHTML = `
      <div class="mlf-minimap-title">Vista general</div>
      <div class="mlf-minimap-box"></div>
      <div class="mlf-minimap-viewport"></div>
    `;
    this.container.appendChild(mm);
    this.minimapEl = mm;

    // Mapa de contexto real: instancia MapLibre no interactiva con el mismo
    // estilo base, centrada donde el mapa principal a zoom reducido. El
    // estilo se clona porque MapLibre toma posesión del objeto que recibe.
    this.minimap = new maplibregl.Map({
      container: mm.querySelector('.mlf-minimap-box'),
      style: structuredClone(this._styleSpec),
      center: this.map.getCenter(),
      zoom: Math.max(this.map.getZoom() - 4, 0),
      interactive: false,
      attributionControl: false,
    });

    this.map.on('move', () => this._updateMinimapViewport());
    this.minimap.on('load', () => this._updateMinimapViewport());
  }

  _updateMinimapViewport() {
    if (!this.minimapEl || !this.map || !this.minimap) return;
    const viewport = this.minimapEl.querySelector('.mlf-minimap-viewport');
    if (!viewport) return;

    this.minimap.jumpTo({
      center: this.map.getCenter(),
      zoom: Math.max(this.map.getZoom() - 4, 0),
    });

    // Rectángulo del viewport: los límites del mapa principal proyectados
    // sobre el minimapa, recortados a su caja.
    const box = this.minimapEl.querySelector('.mlf-minimap-box');
    const bounds = this.map.getBounds();
    const sw = this.minimap.project(bounds.getSouthWest());
    const ne = this.minimap.project(bounds.getNorthEast());
    const clampX = (v) => Math.min(Math.max(v, 0), box.clientWidth);
    const clampY = (v) => Math.min(Math.max(v, 0), box.clientHeight);
    const left = clampX(Math.min(sw.x, ne.x));
    const right = clampX(Math.max(sw.x, ne.x));
    const top = clampY(Math.min(sw.y, ne.y));
    const bottom = clampY(Math.max(sw.y, ne.y));
    // La caja está desplazada 16px/4px dentro de .mlf-minimap; el rectángulo
    // vive en .mlf-minimap para no quedar debajo del canvas del minimapa.
    viewport.style.left = box.offsetLeft + left + 'px';
    viewport.style.top = box.offsetTop + top + 'px';
    viewport.style.width = Math.max(right - left, 2) + 'px';
    viewport.style.height = Math.max(bottom - top, 2) + 'px';
  }

  _setupFeatureTooltip() {
    if (!this.map) return;

    // Create tooltip element
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'mlf-map-tooltip';
    this.tooltipEl.style.display = 'none';
    this.container.appendChild(this.tooltipEl);

    this.map.on('mousemove', (e) => {
      const features = this.map.queryRenderedFeatures(e.point);
      if (features.length > 0) {
        const feature = features[0];
        const title = feature.properties?.name || feature.properties?.title || feature.properties?.nombre || 'Feature';
        this.tooltipEl.textContent = title;
        this.tooltipEl.style.display = 'block';
        // Position tooltip near cursor
        this.tooltipEl.style.left = (e.point.x + 12) + 'px';
        this.tooltipEl.style.top = (e.point.y - 30) + 'px';
        this.map.getCanvas().style.cursor = 'pointer';
      } else {
        this.tooltipEl.style.display = 'none';
        this.map.getCanvas().style.cursor = '';
      }
    });

    this.map.on('mouseleave', () => {
      this.tooltipEl.style.display = 'none';
      this.map.getCanvas().style.cursor = '';
    });
  }

  destroy() {
    this._clearClusterMarkers();
    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
    }
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
    if (this.loaderEl) {
      this.loaderEl.remove();
      this.loaderEl = null;
    }
    if (this.minimap) {
      this.minimap.remove();
      this.minimap = null;
    }
    if (this.minimapEl) {
      this.minimapEl.remove();
      this.minimapEl = null;
    }
    if (this._controls) {
      for (const control of this._controls) {
        this.map.removeControl(control);
      }
      this._controls = [];
    }
    if (this.map) {
      if (this.map.getLayer('mapakit-measure-line')) {
        this.map.removeLayer('mapakit-measure-line');
      }
      if (this.map.getSource('mapakit-measure')) {
        this.map.removeSource('mapakit-measure');
      }
      this.map.remove();
      this.map = null;
    }
    this.events = {};
    this.sources.clear();
    this.layers.clear();
    this.clusterIndex.clear();
  }

  _showLoader() {
    if (!this.container || this.loaderEl) return;
    this.loaderEl = document.createElement('div');
    this.loaderEl.className = 'mlf-map-loader';
    this.loaderEl.innerHTML = '<div class="mlf-map-loader-ring"></div>';
    this.container.appendChild(this.loaderEl);
  }

  _hideLoader() {
    if (!this.loaderEl) return;
    this.loaderEl.style.opacity = '0';
    this.loaderEl.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      this.loaderEl?.remove();
      this.loaderEl = null;
    }, 300);
  }

  // --- Private ---

  _injectCSS() {
    if (document.getElementById('mapakit-map')) return;
    const css = `
      .mlf-cm{display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-family:'IBM Plex Mono',monospace;font-weight:700;cursor:pointer;transition:transform .15s;border:2.5px solid rgba(255,255,255,.25);box-shadow:0 4px 20px rgba(0,0,0,.5);pointer-events:auto;z-index:10}
      .mlf-cm:hover{transform:scale(1.15)}
      .mlf-dm{width:11px;height:11px;border-radius:3px;cursor:pointer;border:2px solid rgba(255,255,255,.4);box-shadow:0 2px 8px rgba(0,0,0,.35);transition:transform .12s;pointer-events:auto;z-index:10}
      .mlf-dm:hover{transform:scale(1.5)}
      .mlf-map-loader{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:5;background:rgba(6,9,15,0.5);pointer-events:none}
      .mlf-map-loader-ring{width:48px;height:48px;border:3px solid rgba(245,158,11,0.2);border-top-color:#f59e0b;border-radius:50%;animation:mlf-rotate 1s linear infinite}
      @keyframes mlf-rotate{to{transform:rotate(360deg)}}
      .mlf-minimap{position:absolute;bottom:24px;right:24px;width:120px;height:80px;background:rgba(6,9,15,0.8);border:1px solid var(--mlf-bd);border-radius:8px;z-index:5;overflow:hidden}
      .mlf-minimap-title{position:absolute;top:2px;left:4px;font-size:8px;color:var(--mlf-t3);text-transform:uppercase;letter-spacing:0.5px}
      .mlf-minimap-box{position:absolute;inset:16px 4px 4px;border:1px solid rgba(255,255,255,0.1);border-radius:4px;overflow:hidden}
      .mlf-minimap-box .maplibregl-canvas{position:absolute;inset:0}
      .mlf-minimap-viewport{position:absolute;border:1px solid #f59e0b;background:rgba(245,158,11,0.1);border-radius:2px;pointer-events:none;z-index:2}
    `;
    const styleEl = document.createElement('style');
      styleEl.id = 'mapakit-map';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  _onMoveEnd() {
    this.drawClusters();
  }

  _clearClusterMarkers() {
    for (const m of this.clusterMarkers) {
      m.remove();
    }
    this.clusterMarkers = [];
  }

  _drawClustersForSource(sourceId) {
    const info = this.clusterIndex.get(sourceId);
    if (!info || !this.map) return;

    const { index, layerConfig } = info;
    const bounds = this.map.getBounds();
    const zoom = Math.floor(this.map.getZoom());
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

    const clusters = index.getClusters(bbox, zoom);
    const primaryColor = this.style.primary || '#f59e0b';

    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates;
      const props = cluster.properties;

      if (props.cluster) {
        const count = props.point_count;
        const sz = Math.min(26 + Math.sqrt(count) * 4.5, 60);
        const color = props.color || primaryColor;

        const el = document.createElement('div');
        el.className = 'mlf-cm';
        el.style.cssText = `width:${sz}px;height:${sz}px;background:${color};font-size:${sz < 36 ? 10 : 13}px`;
        el.textContent = count;
        el.title = `${count} puntos`;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const expansionZoom = Math.min(index.getClusterExpansionZoom(props.cluster_id) + 1, 16);
          this.map.flyTo({ center: [lng, lat], zoom: expansionZoom });
        });

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(this.map);
        this.clusterMarkers.push(marker);
      } else {
        const p = props;
        const color = p.color || p.cl || primaryColor;

        const el = document.createElement('div');
        el.className = 'mlf-dm';
        el.style.background = color;
        el.addEventListener('click', () => {
          this.emit('featureClick', {
            feature: cluster,
            properties: p,
            lngLat: { lng, lat }
          });
        });

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(this.map);
        this.clusterMarkers.push(marker);
      }
    });
  }
}
