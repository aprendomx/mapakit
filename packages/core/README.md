# @mapakit/core

A reusable, config-driven interactive mapping framework powered by MapLibre GL JS. Supports multiple data sources and configuration providers via a plugin architecture.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Configuration Providers](#configuration-providers)
5. [Data Providers](#data-providers)
6. [Events](#events)
7. [Creating Custom Plugins](#creating-custom-plugins)
8. [Advanced Usage](#advanced-usage)
9. [Architecture](#architecture)
10. [Estados Vacío y Error](#estados-vacío-y-error)
11. [Controles del Mapa](#controles-del-mapa)
12. [Hover Highlight](#hover-highlight)
13. [Keyboard Shortcuts](#keyboard-shortcuts)
14. [Compartir Estado del Mapa](#compartir-estado-del-mapa)
15. [Accesibilidad (a11y)](#accesibilidad-a11y)
16. [Tooltip en Features](#tooltip-en-features)
17. [Tema Claro/Oscuro](#tema-clarooscuro)
18. [Minimap](#minimap)
19. [Herramienta de Medición](#herramienta-de-medición)
20. [Geocoding / Búsqueda de Lugares](#geocoding--búsqueda-de-lugares)
21. [Exportar Datos](#exportar-datos)
22. [Optimizaciones de Performance](#optimizaciones-de-performance)
23. [Dibujo y Edición de Features](#dibujo-y-edición-de-features)

---

## Installation

```bash
npm install @mapakit/core
```

**Dependencies (peer):**
- MapLibre GL JS ^4.1.1
- Supercluster ^8.0.1
- @supabase/supabase-js ^2.39.0

---

## Quick Start

### With Supabase (Default)

```js
import { MapaKit } from '@mapakit/core';

const map = new MapaKit({
  container: '#map',
  configId: 'your-map-uuid',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
});

map.on('ready', () => console.log('Map loaded!'));
map.init();
```

### With Static JSON Config

```js
const map = new MapaKit({
  container: '#map',
  configProvider: 'json-static',
  configId: '/config/my-map.json'
});

map.init();
```

### With REST API Config

```js
const map = new MapaKit({
  container: '#map',
  configProvider: 'rest-api',
  configId: 'https://api.example.com/maps/123',
  headers: { 'Authorization': 'Bearer token' }
});

map.init();
```

---

## API Reference

### `MapaKit`

Main class that bootstraps the map, UI, and data layers.

#### Constructor

```js
new MapaKit(options)
```

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `container` | `string \| HTMLElement` | ✅ | CSS selector or DOM element for the map container |
| `configId` | `string` | ✅ | Identifier for the map configuration (UUID for Supabase, URL/path for others) |
| `configProvider` | `string` | ❌ | Provider ID: `'supabase'`, `'json-static'`, `'rest-api'`. Auto-detected if omitted |
| `supabaseUrl` | `string` | ❌ | Supabase project URL (required if using Supabase provider) |
| `supabaseKey` | `string` | ❌ | Supabase anon/public key (required if using Supabase provider) |
| `authToken` | `string` | ❌ | JWT token for authenticated/private maps |
| `pluginRegistry` | `PluginRegistry` | ❌ | Custom plugin registry (advanced) |
| `headers` | `object` | ❌ | Custom HTTP headers for REST API provider |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `init()` | `Promise<void>` | Initialize the map, load config, fetch data, render UI |
| `setFilter(filterId, value)` | `void` | Set a filter value dynamically |
| `clearFilters()` | `void` | Clear all active filters |
| `flyTo(options)` | `void` | Fly to a location (MapLibre flyTo options) |
| `moveLayer(layerId, beforeLayerId)` | `void` | Reorder a layer in the map stack |
| `setLayerColor(layerId, color)` | `void` | Change the color of a layer (auto-detects type) |
| `setLayerVisible(layerId, visible)` | `void` | Show or hide a layer |
| `destroy()` | `void` | Cleanup: remove map, DOM, event listeners |
| `on(event, callback)` | `void` | Subscribe to an event |
| `emit(event, data)` | `void` | Emit an event (internal use) |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `config` | `object` | Loaded map configuration (map, sources, layers, filters, images) |
| `isDestroyed` | `boolean` | Whether the framework has been destroyed |

---

## Configuration Providers

Configuration providers load the map specification (styles, layers, filters, data sources) from different backends.

### `supabase` (Default)

Loads configuration from Supabase tables: `map_configurations`, `map_data_sources`, `map_layers`, `map_filters`, `map_images`.

**Auto-detected when:** `supabaseUrl` is provided

```js
const map = new MapaKit({
  container: '#map',
  configId: 'uuid',
  supabaseUrl: 'https://project.supabase.co',
  supabaseKey: 'anon-key',
  authToken: 'jwt-token' // optional, for private maps
});
```

### `json-static`

Loads configuration from a static JSON file (local or remote).

**Auto-detected when:** `configUrl` ends with `.json`

```js
const map = new MapaKit({
  container: '#map',
  configProvider: 'json-static',
  configId: '/config/my-map.json'
});
```

**JSON Schema:**

```json
{
  "map": {
    "id": "map-id",
    "name": "Map Name",
    "slug": "map-slug",
    "is_public": true,
    "style": {
      "basemap": "carto-dark",
      "colors": { "primary": "#f59e0b", "panel": "#0c1018" },
      "typography": { "heading": "IBM Plex Mono", "body": "Outfit" }
    },
    "initial_view": {
      "center": [-99.13, 23.5],
      "zoom": 4.8
    }
  },
  "sources": [...],
  "layers": [...],
  "filters": [...],
  "images": [...]
}
```

### `rest-api`

Loads configuration from a generic REST API endpoint.

**Auto-detected when:** `configUrl` starts with `http` and is not `.json`

```js
const map = new MapaKit({
  container: '#map',
  configProvider: 'rest-api',
  configId: 'https://api.example.com/maps/123',
  headers: { 'Authorization': 'Bearer token' }
});
```

---

## Data Providers

Data providers load the actual GeoJSON/feature data for each configured source.

### `geojson-url`

Fetches GeoJSON data from a remote URL. Supports caching and retry logic.

**Used when:** `source.source_type === 'geojson'` and `source.url` is provided

```json
{
  "source_type": "geojson",
  "url": "https://example.com/data.geojson"
}
```

### `static-json`

Returns inline/embedded data directly from the configuration.

**Used when:** `source.data` is provided

```json
{
  "source_type": "geojson",
  "data": {
    "type": "FeatureCollection",
    "features": [
      { "type": "Feature", "geometry": { "type": "Point", "coordinates": [-99, 19] } }
    ]
  }
}
```

### Automatic Provider Selection

The framework automatically selects the appropriate data provider for each source based on the `supports()` method. The selection order is:

1. `static-json` — if `source.data` is present
2. `geojson-url` — if `source.source_type === 'geojson'` and `source.url` is present

---

## Events

Subscribe to events using `map.on(event, callback)`:

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | `{ config }` | Map is fully initialized and interactive |
| `featureClick` | `{ feature, properties, lngLat }` | User clicked on a feature |
| `filterChange` | `{ filterId, value }` | A filter value changed |
| `layerChange` | `{ type, layerId, value, beforeLayerId }` | A layer was reordered, recolored, or toggled |
| `error` | `{ type, message, recoverable }` | An error occurred |

### Example

```js
map.on('ready', () => {
  console.log('Map is ready!');
});

map.on('featureClick', (e) => {
  console.log('Clicked:', e.properties.name);
});

map.on('error', (err) => {
  console.error('Map error:', err.message);
});
```

---

## Layer Management

The framework exposes methods to manage layers programmatically, and the UI panel supports drag & drop reordering, color pickers, and visibility toggles out of the box.

### Programmatic API

```js
// Reorder a layer (beforeLayerId = null moves to end)
map.moveLayer('layer-id', 'before-layer-id');

// Change layer color
map.setLayerColor('layer-id', '#ff0000');

// Toggle layer visibility
map.setLayerVisible('layer-id', false);
```

### Events

Listen to layer changes:

```js
map.on('layerChange', ({ type, layerId, value, beforeLayerId }) => {
  // type: 'order' | 'color' | 'visibility'
  console.log('Layer changed:', type, layerId, value);
});
```

### UI Panel Features

When `config.layers` has entries, the sidebar automatically shows a **Layers** panel with:

- **Drag handle (≡)** — drag & drop to reorder layers
- **Color dot** — click to open a color picker
- **Layer name** — the layer ID
- **Eye icon** — click to toggle visibility

---

## Mobile Experience

On mobile devices (< 768px), the sidebar becomes a slide-out drawer:

- **FAB** (bottom-right, floating action button) opens the drawer with a tap
- **Backdrop** overlay closes the drawer when tapped
- **Tabs** organize content into Layers, Filters, and Search
- **Bottom sheet** for filters with swipe-up to expand and swipe-down to collapse
- **SortableJS** enables touch drag & drop for reordering layers

The panel adapts automatically based on viewport width — no configuration needed.

---

## Animations

Smooth transitions throughout the UI:

- **Filter transitions**: Features fade out and back in when filters change (300ms cubic easing)
- **Popup animation**: Scale + translate on open/close
- **Layer reordering**: Smooth transform transitions
- **Skeleton shimmer**: Pulsing bars during initial load

---

## Estados Vacío y Error

El panel muestra estados amigables cuando no hay datos:

- **Estado vacío**: Aparece cuando ninguna capa está activa o cuando los filtros no devuelven resultados. Incluye un botón "Limpiar filtros" para resetear rápidamente.
- **Estado de error**: Muestra un mensaje descriptivo cuando falla la carga de datos, con un botón "Reintentar".

```javascript
// Los estados se gestionan automáticamente, pero puedes forzarlos:
mapakit.uiManager.showEmptyState(visibleLayerCount);
mapakit.uiManager.hideEmptyState();
mapakit.uiManager.showErrorState('Mensaje de error');
mapakit.uiManager.hideErrorState();
```

---

## Controles del Mapa

MapaKit soporta controles personalizados configurables vía JSON:

```json
{
  "controls": ["geolocate", "fullscreen", "reset", "scale"]
}
```

Controles disponibles:
- **geolocate** (📍): Centra el mapa en la ubicación del usuario
- **fullscreen** (⛶): Activa/desactiva pantalla completa
- **reset** (🏠): Vuelve a la vista inicial configurada
- **scale**: Muestra una barra de escala métrica

```javascript
// También puedes agregar controles programáticamente:
mapakit.mapRenderer.addControls(['geolocate', 'scale']);

// Volver a la vista inicial:
mapakit.mapRenderer.flyToReset();
```

---

## Hover Highlight

Al pasar el cursor sobre filtros, capas o resultados de búsqueda, las features correspondientes se resaltan en el mapa con un brillo amarillo (`#fbbf24`) y borde grueso:

- **Filtros**: Resalta todas las features que coinciden con el valor del filtro
- **Capas**: Resalta todas las features de la capa
- **Búsqueda**: Resalta las features coincidentes

El highlight usa una capa GeoJSON temporal (`mapakit-highlight`) con 3 subcapas (circle, line, fill) para evitar interferir con los datos originales.

---

## Keyboard Shortcuts

Atajos de teclado globales para navegación rápida:

| Atajo | Acción |
|-------|--------|
| `Escape` | Cierra drawer, popup o bottom sheet |
| `Cmd/Ctrl + K` | Enfoca la barra de búsqueda |
| `Cmd/Ctrl + Shift + F` | Limpia todos los filtros |

---

## Compartir Estado del Mapa

Copia al portapapeles una URL con el estado actual del mapa (centro, zoom, filtros y visibilidad de capas):

```javascript
// Click en el botón "🔗 Compartir" del panel
// O programáticamente:
mapakit._shareMapState();
```

La URL incluye:
- `center`, `zoom`, `bearing`, `pitch`
- `filter_*` para cada filtro activo
- `layer_*` para la visibilidad de cada capa

---

## Accesibilidad (a11y)

MapaKit incluye atributos ARIA en todos los controles interactivos:

- **Drawer**: `role="dialog"`, `aria-modal="true"`, focus trap cuando está abierto
- **Capas**: `role="listitem"`, `aria-expanded`, `aria-pressed`, `aria-label`
- **Filtros**: `role="group"`, `role="button"`, `aria-pressed`
- **Búsqueda**: `role="searchbox"`, `aria-label`
- **Estados**: `role="status"` (vacío), `role="alert"` (error)

Además respeta `prefers-reduced-motion`: cuando el usuario tiene activada la preferencia de movimiento reducido, todas las animaciones CSS y JS se desactivan automáticamente.

---

## Deep Linking / URL State

MapaKit sincroniza automáticamente el estado del mapa con la URL, permitiendo compartir vistas exactas mediante un simple enlace.

### Parámetros soportados

| Parámetro | Ejemplo | Descripción |
|-----------|---------|-------------|
| `mk-center` | `-99.123456,19.654321` | Centro del mapa (lng,lat) |
| `mk-zoom` | `12.50` | Nivel de zoom |
| `mk-bearing` | `45.0` | Rotación en grados |
| `mk-pitch` | `30.0` | Inclinación en grados |
| `mk-filter-{id}` | `school` | Valor de un filtro activo |
| `mk-layer-{id}` | `1` o `0` | Visibilidad de capa (1=visible, 0=oculto) |

### Ejemplo de URL completa

```
https://ejemplo.com/mapa?mk-center=-99.123456,19.654321&mk-zoom=12.50&mk-filter-type=school&mk-layer-educacion=1
```

### Sincronización bidireccional

- **URL → Mapa**: Al cargar la página, MapaKit lee los parámetros de la URL y aplica el estado automáticamente
- **Mapa → URL**: Cualquier cambio (mover vista, aplicar filtro, ocultar capa) actualiza la URL en tiempo real con un debounce de 300ms
- **Sin recarga**: Usa `history.replaceState()` para no añadir entradas al historial del navegador

### Compartir

El botón "🔗 Compartir" del panel copia al portapapeles la URL actual, que ya incluye todo el estado:

```javascript
// Programáticamente
mapakit._shareMapState(); // Copia window.location.href
```

---

## Geocoding / Búsqueda de Lugares

MapaKit integra búsqueda de lugares vía Nominatim (OpenStreetMap):

- Escribe 3+ caracteres en la barra de búsqueda
- Aparece una sección "Lugares" con resultados de geocoding
- Click en un resultado → vuela a esa ubicación con zoom 16
- Se muestra un popup temporal con el nombre del lugar

```javascript
// Programáticamente
const geocoder = new NominatimGeocoder();
const results = await geocoder.search('Monterrey');
// [{ name: 'Monterrey, Nuevo León, México', lng: -100.3, lat: 25.7, bbox: [...] }]
```

---

## Exportar Datos

Exporta las features visibles (respetando filtros y búsqueda) en múltiples formatos:

- **GeoJSON** (default)
- **CSV** (con propiedades y coordenadas)
- **KML** (para Google Earth)

```javascript
// Click en "📥 Exportar datos" del panel
// O programáticamente:
const features = [...]; // features filtradas
ExportService.download(
  ExportService.toGeoJSON(features),
  'mapa-export.geojson',
  'application/geo+json'
);
```

---

## Creating Custom Plugins

You can create custom configuration or data providers by extending the base classes.

### Custom Config Provider

```js
import { ConfigProvider } from '@mapakit/core';

export class MyCustomConfigProvider extends ConfigProvider {
  constructor(options = {}) {
    super({ id: 'my-custom' });
    this.apiKey = options.apiKey;
  }

  canLoad(options) {
    return !!options.myCustomEndpoint;
  }

  async load(configId) {
    const response = await fetch(configId, {
      headers: { 'X-API-Key': this.apiKey }
    });
    const data = await response.json();

    return {
      map: data.map,
      sources: data.sources,
      layers: data.layers,
      filters: data.filters,
      images: data.images
    };
  }
}
```

### Custom Data Provider

```js
import { DataProvider } from '@mapakit/core';

export class WMSDataProvider extends DataProvider {
  constructor() {
    super({ id: 'wms' });
  }

  supports(source) {
    return source.source_type === 'wms';
  }

  async load(source) {
    // Fetch WMS layer and convert to GeoJSON
    const response = await fetch(source.url);
    const wmsData = await response.json();
    return this.convertWMSToGeoJSON(wmsData);
  }

  convertWMSToGeoJSON(data) {
    // Conversion logic...
  }
}
```

### Registering Custom Plugins

```js
import { MapaKit, PluginRegistry } from '@mapakit/core';
import { MyCustomConfigProvider } from './MyCustomConfigProvider';
import { WMSDataProvider } from './WMSDataProvider';

const registry = new PluginRegistry();
registry.registerConfigProvider(new MyCustomConfigProvider({ apiKey: 'abc' }));
registry.registerDataProvider(new WMSDataProvider());

const map = new MapaKit({
  container: '#map',
  configProvider: 'my-custom',
  configId: 'https://api.example.com/map/123',
  pluginRegistry: registry
});
```

---

## Advanced Usage

### Multi-Provider Maps

You can mix configuration sources. For example, config from Supabase but with some inline data sources:

```js
// In Supabase, a source can have:
{
  "source_type": "geojson",
  "data": { "type": "FeatureCollection", "features": [...] }
}
```

The `static-json` data provider will handle this source, while `geojson-url` handles others.

### URL Sync / Deep Linking

El estado completo del mapa se sincroniza automáticamente con la URL:

```
http://localhost:5173/?mk-center=-99.12,19.65&mk-zoom=10&mk-filter-type=school&mk-layer-educacion=1
```

Esto incluye: centro, zoom, rotación, inclinación, filtros activos y visibilidad de capas. Al recargar la página o compartir el enlace, el receptor verá exactamente la misma vista.

### Session Storage

Map view state (center, zoom, bearing, pitch) is persisted in `sessionStorage` and restored on reload.

### Authentication Flow

```js
const map = new MapaKit({
  container: '#map',
  configId: 'uuid',
  supabaseUrl: '...',
  supabaseKey: '...'
});

// User clicks login → framework shows auth panel
// On successful login → framework reloads with JWT token
// Private maps become accessible via RLS policies
```

---

## Tooltip en Features

Al pasar el cursor sobre una feature en el mapa, aparece un tooltip con su nombre o título:

```javascript
// Se muestra automáticamente al hacer hover
// Usa las propiedades: name > title > nombre > 'Feature'
```

---

## Tema Claro/Oscuro

MapaKit soporta cambio entre tema oscuro y claro:

- **Botón 🌙/☀️** en el panel para alternar
- Cambia el panel UI entre fondos oscuros y claros
- Soporte para basemap `carto-light` además de `carto-dark`
- Emite evento `themeChange` para que el desarrollador pueda recrear el mapa con el basemap adecuado

```javascript
mapakit.on('themeChange', ({ theme }) => {
  console.log('Tema activo:', theme); // 'dark' | 'light'
});
```

---

## Minimap

Una vista general del viewport aparece en la esquina inferior derecha del mapa:

- Muestra un rectángulo indicador que cambia de tamaño según el zoom
- Se actualiza en tiempo real al mover el mapa
- Pura referencia visual, sin interacción

---

## Herramienta de Medición

Mide distancias entre dos puntos en el mapa:

1. Click en el botón "📏 Medir" del panel
2. Click en el punto inicial
3. Click en el punto final
4. Aparece una línea punteada y un popup con la distancia
5. Click nuevamente para medir otra distancia

La distancia se calcula con la fórmula de Haversine (superficie de la Tierra) y se muestra en metros o kilómetros.

---

## Optimizaciones de Performance

MapaKit incluye varias optimizaciones para manejar datasets grandes:

### Paginación de Capas

El panel de capas muestra máximo 20 capas por página. Navega con "Anterior/Siguiente" para listas largas.

### Simplificación de Geometrías

Features de tipo LineString y Polygon se simplifican automáticamente según el zoom:
- **Zoom < 6**: Simplificación agresiva (tolerancia ~1km)
- **Zoom 6-10**: Simplificación moderada (tolerancia ~100m)
- **Zoom > 10**: Sin simplificación (datos originales)

Usa el algoritmo Douglas-Peucker para reducir vértices sin perder forma.

### Filtrado por Viewport

Para datasets con >1000 features, solo se renderizan las que están dentro del viewport visible (+ un buffer de 1 viewport). Esto reduce drásticamente la carga de renderizado en mapas con muchos datos.

Los bounding boxes de features se precalculan al cargar para evitar recalcular en cada movimiento.

### Debounce en Filtros

La aplicación de filtros tiene un debounce de 150ms para evitar recálculos intermedios mientras el usuario escribe o selecciona opciones rápidamente.

---

## Dibujo y Edición de Features

MapaKit incluye herramientas de dibujo y edición integradas.

### Herramientas de Dibujo

Botones en el panel:
- **📍 Punto** — Click en el mapa para crear un punto
- **/ Línea** — Clicks sucesivos para vértices, doble click o Enter para terminar
- **⬡ Polígono** — Clicks sucesivos para vértices, doble click o Enter para cerrar

Durante el dibujo se muestra una preview punteada en naranja. Escape cancela la operación.

### Edición de Vértices

Activa el modo "✏️ Editar" y haz click en una feature:
- Aparecen markers arrastrables en cada vértice
- Mueve los vértices para cambiar la forma
- Click fuera o cambia de modo para terminar

### Borrar Features

Activa el modo "🗑️ Borrar" y haz click en una feature para eliminarla (con confirmación).

### Editar Propiedades

Haz click en una feature para abrir su popup. En modo edición, el popup muestra campos editables:
- **Nombre**
- **Descripción**

Guarda los cambios con el botón "Guardar".

### Eventos

```javascript
mapakit.on('featureCreated', ({ feature }) => {
  console.log('Nueva feature:', feature);
  // Persistir en tu backend
});

mapakit.on('featureUpdated', ({ feature, layerId }) => {
  console.log('Feature actualizada:', feature);
});

mapakit.on('featureDeleted', ({ featureId, layerId }) => {
  console.log('Feature eliminada:', featureId);
});
```

---

## Architecture

```
MapaKit
├── ConfigProvider (plugin)
│   ├── SupabaseConfigProvider
│   ├── JsonStaticConfigProvider
│   └── RestApiConfigProvider
├── DataProvider (plugin)
│   ├── StaticJsonDataProvider
│   └── GeojsonUrlDataProvider
├── MapRenderer (MapLibre GL JS)
├── FilterEngine
├── UIManager (panel, popups, auth)
├── StateManager (URL sync, sessionStorage)
└── AuthManager (Supabase Auth)
```

---

## License

MIT
