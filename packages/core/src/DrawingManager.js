export class DrawingManager {
  constructor(mapRenderer) {
    this.mapRenderer = mapRenderer;
    this.mode = null; // 'point' | 'line' | 'polygon' | 'edit' | 'delete' | null
    this.vertices = [];
    this.events = {};
    this._clickHandler = null;
    this._mousemoveHandler = null;
    this._dblclickHandler = null;
    this._keydownHandler = null;
    this.editingFeature = null;
    this.editingLayerId = null;
    this.editMarkers = [];
    this._featureClickHandler = null;
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    (this.events[event] || []).forEach(cb => cb(data));
  }

  setMode(mode) {
    if (this.mode === mode) {
      this.setMode(null);
      return;
    }
    this._cleanup();
    this._cleanupEdit();
    this.mode = mode;
    this.vertices = [];
    if (mode === 'edit' || mode === 'delete') {
      this._attachFeatureClickListener();
      this.mapRenderer.map.getCanvas().style.cursor = mode === 'delete' ? 'not-allowed' : 'pointer';
    } else if (mode) {
      this._attachListeners();
      this.mapRenderer.map.getCanvas().style.cursor = 'crosshair';
    } else {
      this.mapRenderer.map.getCanvas().style.cursor = '';
    }
  }

  _attachListeners() {
    const map = this.mapRenderer.map;
    this._clickHandler = (e) => this._onClick(e);
    this._mousemoveHandler = (e) => this._onMouseMove(e);
    this._dblclickHandler = (e) => this._onDblClick(e);
    this._keydownHandler = (e) => this._onKeyDown(e);
    
    map.on('click', this._clickHandler);
    map.on('mousemove', this._mousemoveHandler);
    map.on('dblclick', this._dblclickHandler);
    document.addEventListener('keydown', this._keydownHandler);
  }

  _attachFeatureClickListener() {
    const map = this.mapRenderer.map;
    this._featureClickHandler = (e) => {
      const features = map.queryRenderedFeatures(e.point);
      if (features.length === 0) return;
      const feature = features[0];
      if (this.mode === 'edit') {
        this.startEditing(feature, feature.layer?.id);
      } else if (this.mode === 'delete') {
        if (confirm('¿Eliminar esta feature?')) {
          this.deleteFeature(feature.id || feature.properties?.id, feature.layer?.id);
        }
        this.setMode(null);
      }
    };
    map.on('click', this._featureClickHandler);
  }

  startEditing(feature, layerId) {
    this._cleanupEdit();
    this.editingFeature = feature;
    this.editingLayerId = layerId;
    this._createEditMarkers(feature);
  }

  _createEditMarkers(feature) {
    const map = this.mapRenderer.map;
    const coords = this._getCoordinates(feature.geometry);
    
    for (let i = 0; i < coords.length; i++) {
      const el = document.createElement('div');
      el.className = 'mapakit-edit-marker';
      el.style.cssText = 'width:12px;height:12px;background:#f59e0b;border:2px solid #fff;border-radius:50%;cursor:move;box-shadow:0 2px 8px rgba(0,0,0,0.5);';
      
      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat(coords[i])
        .addTo(map);
      
      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        coords[i] = [newLngLat.lng, newLngLat.lat];
        this._updateEditingFeature(coords);
      });
      
      this.editMarkers.push(marker);
    }
  }

  _getCoordinates(geometry) {
    if (geometry.type === 'Point') return [geometry.coordinates];
    if (geometry.type === 'LineString') return geometry.coordinates;
    if (geometry.type === 'Polygon') return geometry.coordinates[0].slice(0, -1); // Exclude closing point
    return [];
  }

  _setCoordinates(geometry, coords) {
    if (geometry.type === 'Point') geometry.coordinates = coords[0];
    if (geometry.type === 'LineString') geometry.coordinates = coords;
    if (geometry.type === 'Polygon') geometry.coordinates = [coords.concat([coords[0]])];
  }

  _updateEditingFeature(coords) {
    if (!this.editingFeature) return;
    this._setCoordinates(this.editingFeature.geometry, coords);
    this.emit('featureUpdated', {
      feature: this.editingFeature,
      layerId: this.editingLayerId
    });
    // Refresh markers
    this._cleanupEdit();
    this._createEditMarkers(this.editingFeature);
  }

  _cleanupEdit() {
    for (const marker of this.editMarkers) {
      marker.remove();
    }
    this.editMarkers = [];
    this.editingFeature = null;
    this.editingLayerId = null;
  }

  deleteFeature(featureId, layerId) {
    this.emit('featureDeleted', { featureId, layerId });
  }

  _cleanup() {
    const map = this.mapRenderer.map;
    if (this._clickHandler) map.off('click', this._clickHandler);
    if (this._mousemoveHandler) map.off('mousemove', this._mousemoveHandler);
    if (this._dblclickHandler) map.off('dblclick', this._dblclickHandler);
    if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler);
    if (this._featureClickHandler) map.off('click', this._featureClickHandler);
    this._clickHandler = null;
    this._mousemoveHandler = null;
    this._dblclickHandler = null;
    this._keydownHandler = null;
    this._featureClickHandler = null;
    this._clearPreview();
  }

  _onClick(e) {
    if (!this.mode) return;
    e.preventDefault();
    
    const coords = [e.lngLat.lng, e.lngLat.lat];
    
    if (this.mode === 'point') {
      this.emit('featureCreated', {
        feature: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: { name: 'New Point' }
        }
      });
      this.setMode(null);
      return;
    }
    
    this.vertices.push(coords);
    this._updatePreview();
  }

  _onMouseMove(e) {
    if (!this.mode || this.mode === 'point' || this.vertices.length === 0) return;
    this._updatePreview(e.lngLat);
  }

  _onDblClick(e) {
    if (!this.mode || this.mode === 'point') return;
    e.preventDefault();
    this._finishDrawing();
  }

  _onKeyDown(e) {
    if (e.key === 'Escape' && this.mode) {
      this.setMode(null);
    }
    if (e.key === 'Enter' && this.mode && this.mode !== 'point' && this.vertices.length >= 2) {
      this._finishDrawing();
    }
  }

  _updatePreview(cursorLngLat) {
    const map = this.mapRenderer.map;
    let previewCoords = [...this.vertices];
    if (cursorLngLat) previewCoords.push([cursorLngLat.lng, cursorLngLat.lat]);
    
    let geometry;
    if (this.mode === 'line') {
      geometry = { type: 'LineString', coordinates: previewCoords };
    } else if (this.mode === 'polygon') {
      if (previewCoords.length >= 3) {
        geometry = { type: 'Polygon', coordinates: [[...previewCoords, previewCoords[0]]] };
      } else {
        geometry = { type: 'LineString', coordinates: previewCoords };
      }
    } else {
      return;
    }
    
    const previewFeature = {
      type: 'Feature',
      geometry,
      properties: {}
    };
    
    let source = map.getSource('mapakit-drawing-preview');
    if (!source) {
      map.addSource('mapakit-drawing-preview', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'mapakit-drawing-preview-line',
        source: 'mapakit-drawing-preview',
        type: 'line',
        paint: { 'line-color': '#f59e0b', 'line-width': 2, 'line-dasharray': [4, 2] }
      });
      map.addLayer({
        id: 'mapakit-drawing-preview-fill',
        source: 'mapakit-drawing-preview',
        type: 'fill',
        paint: { 'fill-color': 'rgba(245, 158, 11, 0.1)', 'fill-outline-color': '#f59e0b' },
        filter: ['==', ['geometry-type'], 'Polygon']
      });
      source = map.getSource('mapakit-drawing-preview');
    }
    source.setData({ type: 'FeatureCollection', features: [previewFeature] });
  }

  _clearPreview() {
    const map = this.mapRenderer.map;
    if (map.getLayer('mapakit-drawing-preview-line')) map.removeLayer('mapakit-drawing-preview-line');
    if (map.getLayer('mapakit-drawing-preview-fill')) map.removeLayer('mapakit-drawing-preview-fill');
    if (map.getSource('mapakit-drawing-preview')) map.removeSource('mapakit-drawing-preview');
  }

  _finishDrawing() {
    if (this.mode === 'line' && this.vertices.length >= 2) {
      this.emit('featureCreated', {
        feature: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: this.vertices },
          properties: { name: 'New Line' }
        }
      });
    } else if (this.mode === 'polygon' && this.vertices.length >= 3) {
      this.emit('featureCreated', {
        feature: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[...this.vertices, this.vertices[0]]] },
          properties: { name: 'New Polygon' }
        }
      });
    }
    this.setMode(null);
  }

  destroy() {
    this.setMode(null);
    this.events = {};
  }
}
