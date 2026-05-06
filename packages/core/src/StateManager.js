export class StateManager {
  constructor({ mapId }) {
    this.mapId = mapId;
    this.prefix = `mf-${mapId}-`;
  }

  getUrlState() {
    const params = new URLSearchParams(window.location.search);
    const state = {};
    for (const [key, value] of params) {
      if (key.startsWith(this.prefix)) {
        const filterId = key.slice(this.prefix.length);
        try {
          state[filterId] = JSON.parse(value);
        } catch {
          state[filterId] = value;
        }
      }
    }
    return state;
  }

  setUrlState(filters) {
    const url = new URL(window.location.href);
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith(this.prefix)) {
        url.searchParams.delete(key);
      }
    }
    for (const [filterId, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(this.prefix + filterId, JSON.stringify(value));
      }
    }
    window.history.replaceState({}, '', url);
  }

  getMapState() {
    const key = `${this.prefix}view`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setMapState(center, zoom, bearing, pitch) {
    const key = `${this.prefix}view`;
    const state = { center, zoom, bearing, pitch };
    sessionStorage.setItem(key, JSON.stringify(state));
  }

  parseCenter(str) {
    if (!str) return null;
    const [lng, lat] = str.split(',').map(Number);
    if (isNaN(lng) || isNaN(lat)) return null;
    return [lng, lat];
  }

  serializeCenter(center) {
    if (!center || center.length < 2) return '';
    return `${center[0].toFixed(6)},${center[1].toFixed(6)}`;
  }

  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {
      center: this.parseCenter(params.get('mk-center')),
      zoom: params.has('mk-zoom') ? parseFloat(params.get('mk-zoom')) : null,
      bearing: params.has('mk-bearing') ? parseFloat(params.get('mk-bearing')) : null,
      pitch: params.has('mk-pitch') ? parseFloat(params.get('mk-pitch')) : null,
      filters: {},
      layers: {}
    };

    // Read filters (backward compatible with mf-{mapId}- prefix AND new mk-filter- prefix)
    for (const [key, value] of params) {
      if (key.startsWith(this.prefix)) {
        const filterId = key.slice(this.prefix.length);
        try {
          result.filters[filterId] = JSON.parse(value);
        } catch {
          result.filters[filterId] = value;
        }
      } else if (key.startsWith('mk-filter-')) {
        const filterId = key.slice('mk-filter-'.length);
        result.filters[filterId] = value;
      }
    }

    // Read layer visibility
    for (const [key, value] of params) {
      if (key.startsWith('mk-layer-')) {
        const layerId = key.slice('mk-layer-'.length);
        result.layers[layerId] = value === '1';
      }
    }

    return result;
  }

  setUrlParams({ center, zoom, bearing, pitch, filters, layers }) {
    const url = new URL(window.location.href);

    // Remove old mk- params
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('mk-')) {
        url.searchParams.delete(key);
      }
    }

    // Write view state
    if (center) url.searchParams.set('mk-center', this.serializeCenter(center));
    if (zoom !== null && zoom !== undefined) url.searchParams.set('mk-zoom', zoom.toFixed(2));
    if (bearing !== null && bearing !== undefined) url.searchParams.set('mk-bearing', bearing.toFixed(1));
    if (pitch !== null && pitch !== undefined) url.searchParams.set('mk-pitch', pitch.toFixed(1));

    // Write filters
    for (const [filterId, value] of Object.entries(filters || {})) {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(`mk-filter-${filterId}`, value);
      }
    }

    // Write layer visibility
    for (const [layerId, visible] of Object.entries(layers || {})) {
      url.searchParams.set(`mk-layer-${layerId}`, visible ? '1' : '0');
    }

    window.history.replaceState({}, '', url);
  }
}
