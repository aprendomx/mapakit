# Configuración JSON Avanzada

Referencia completa del schema de configuración que MapaKit espera recibir.

---

## Estructura general

```json
{
  "map": { ... },
  "sources": [ ... ],
  "layers": [ ... ],
  "filters": [ ... ],
  "images": [ ... ]
}
```

---

## `map`

Configuración general del mapa.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | Sí | Identificador único del mapa |
| `name` | `string` | Sí | Nombre visible del mapa |
| `slug` | `string` | Sí | Slug para URLs amigables |
| `is_public` | `boolean` | No | Si el mapa es público (default: `true`) |
| `style` | `object` | No | Estilos visuales |
| `style.basemap` | `string` | No | Basemap: `carto-dark`, `carto-light`, `osm` |
| `style.colors` | `object` | No | Colores del tema |
| `style.colors.primary` | `string` | No | Color primario (hex) |
| `style.colors.panel` | `string` | No | Color de fondo del panel |
| `style.typography` | `object` | No | Fuentes tipográficas |
| `style.typography.heading` | `string` | No | Fuente para títulos |
| `style.typography.body` | `string` | No | Fuente para cuerpo |
| `initial_view` | `object` | No | Vista inicial del mapa |
| `initial_view.center` | `[lng, lat]` | No | Coordenadas del centro `[longitud, latitud]` |
| `initial_view.zoom` | `number` | No | Nivel de zoom inicial (0–22) |
| `initial_view.bearing` | `number` | No | Rotación en grados (default: `0`) |
| `initial_view.pitch` | `number` | No | Inclinación en grados (default: `0`) |
| `controls` | `string[]` | No | Controles del mapa: `geolocate`, `fullscreen`, `reset`, `scale` |

### Ejemplo

```json
{
  "map": {
    "id": "mapa-ejemplo",
    "name": "Mapa de Ejemplo",
    "slug": "mapa-ejemplo",
    "is_public": true,
    "style": {
      "basemap": "carto-dark",
      "colors": {
        "primary": "#f59e0b",
        "panel": "#0c1018"
      },
      "typography": {
        "heading": "IBM Plex Mono",
        "body": "Outfit"
      }
    },
    "initial_view": {
      "center": [-99.13, 19.43],
      "zoom": 12,
      "bearing": 0,
      "pitch": 0
    },
    "controls": ["geolocate", "fullscreen", "reset", "scale"]
  }
}
```

---

## `sources`

Fuentes de datos GeoJSON.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | Sí | Identificador único de la fuente |
| `source_type` | `string` | Sí | Tipo de fuente: `geojson` |
| `url` | `string` | Condicional | URL remota del GeoJSON |
| `data` | `object` | Condicional | GeoJSON inline |

> **Nota:** Debe proporcionarse `url` **o** `data`, pero no ambos.

### Ejemplo con datos inline

```json
{
  "sources": [
    {
      "id": "puntos",
      "source_type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": { "name": "Lugar 1" },
            "geometry": {
              "type": "Point",
              "coordinates": [-99.13, 19.43]
            }
          }
        ]
      }
    }
  ]
}
```

### Ejemplo con URL

```json
{
  "sources": [
    {
      "id": "estaciones",
      "source_type": "geojson",
      "url": "https://api.ejemplo.com/estaciones.geojson"
    }
  ]
}
```

---

## `layers`

Capas que visualizan las fuentes de datos.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | Sí | Identificador único de la capa |
| `source_id` | `string` | Sí | ID de la fuente asociada |
| `type` | `string` | Sí | Tipo: `circle`, `line`, `fill`, `symbol` |
| `filter` | `array` | No | Expresión de filtro MapLibre (opcional) |
| `paint` | `object` | No | Propiedades de pintura MapLibre |
| `layout` | `object` | No | Propiedades de layout MapLibre |

### Tipos de capa

#### `circle` — Puntos

```json
{
  "id": "puntos",
  "source_id": "puntos",
  "type": "circle",
  "paint": {
    "circle-radius": 8,
    "circle-color": "#f59e0b",
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff"
  }
}
```

#### `line` — Líneas

```json
{
  "id": "rutas",
  "source_id": "rutas",
  "type": "line",
  "paint": {
    "line-color": "#3b82f6",
    "line-width": 3,
    "line-dasharray": [2, 2]
  }
}
```

#### `fill` — Polígonos

```json
{
  "id": "zonas",
  "source_id": "zonas",
  "type": "fill",
  "paint": {
    "fill-color": "#10b981",
    "fill-opacity": 0.5,
    "fill-outline-color": "#065f46"
  }
}
```

#### `symbol` — Texto / Iconos

```json
{
  "id": "etiquetas",
  "source_id": "puntos",
  "type": "symbol",
  "layout": {
    "text-field": ["get", "name"],
    "text-size": 12,
    "text-offset": [0, 1.5],
    "text-anchor": "top"
  },
  "paint": {
    "text-color": "#ffffff",
    "text-halo-color": "#000000",
    "text-halo-width": 1
  }
}
```

---

## `filters`

Filtros interactivos que aparecen en el panel lateral.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | Sí | Identificador del filtro |
| `label` | `string` | Sí | Texto visible en el panel |
| `type` | `string` | Sí | Tipo: `select`, `checkbox`, `search`, `range` |
| `property` | `string` | Sí | Propiedad GeoJSON a filtrar |
| `options` | `array` | Condicional | Opciones para `select` y `checkbox` |
| `min` | `number` | Condicional | Valor mínimo para `range` |
| `max` | `number` | Condicional | Valor máximo para `range` |
| `step` | `number` | Condicional | Paso para `range` |

### `select` — Desplegable

```json
{
  "id": "categoria",
  "label": "Categoría",
  "type": "select",
  "property": "category",
  "options": [
    { "value": "restaurante", "label": "Restaurante" },
    { "value": "cafe", "label": "Café" },
    { "value": "museo", "label": "Museo" }
  ]
}
```

### `checkbox` — Casillas

```json
{
  "id": "tipos",
  "label": "Tipos",
  "type": "checkbox",
  "property": "type",
  "options": [
    { "value": "publico", "label": "Público" },
    { "value": "privado", "label": "Privado" }
  ]
}
```

### `search` — Búsqueda de texto

```json
{
  "id": "busqueda",
  "label": "Buscar",
  "type": "search",
  "property": "name"
}
```

### `range` — Rango numérico

```json
{
  "id": "calificacion",
  "label": "Calificación mínima",
  "type": "range",
  "property": "rating",
  "min": 0,
  "max": 5,
  "step": 0.5
}
```

---

## `images`

Imágenes personalizadas para usar como iconos en capas `symbol`.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | Sí | Identificador de la imagen |
| `url` | `string` | Sí | URL de la imagen |

### Ejemplo

```json
{
  "images": [
    {
      "id": "icono-restaurante",
      "url": "https://ejemplo.com/icono-restaurante.png"
    }
  ]
}
```

Luego úsala en una capa:

```json
{
  "id": "iconos",
  "source_id": "puntos",
  "type": "symbol",
  "layout": {
    "icon-image": "icono-restaurante",
    "icon-size": 0.5
  }
}
```

---

## Configuración completa de ejemplo

```json
{
  "map": {
    "id": "mapa-completo",
    "name": "Mapa Completo",
    "slug": "mapa-completo",
    "is_public": true,
    "style": {
      "basemap": "carto-dark",
      "colors": {
        "primary": "#f59e0b",
        "panel": "#0c1018"
      },
      "typography": {
        "heading": "IBM Plex Mono",
        "body": "Outfit"
      }
    },
    "initial_view": {
      "center": [-99.13, 19.43],
      "zoom": 12
    },
    "controls": ["geolocate", "fullscreen", "reset", "scale"]
  },
  "sources": [
    {
      "id": "lugares",
      "source_type": "geojson",
      "url": "https://api.ejemplo.com/lugares.geojson"
    }
  ],
  "layers": [
    {
      "id": "lugares-puntos",
      "source_id": "lugares",
      "type": "circle",
      "paint": {
        "circle-radius": 8,
        "circle-color": "#f59e0b",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    },
    {
      "id": "lugares-etiquetas",
      "source_id": "lugares",
      "type": "symbol",
      "layout": {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-offset": [0, 1.5],
        "text-anchor": "top"
      },
      "paint": {
        "text-color": "#ffffff"
      }
    }
  ],
  "filters": [
    {
      "id": "categoria",
      "label": "Categoría",
      "type": "select",
      "property": "category",
      "options": [
        { "value": "restaurante", "label": "Restaurante" },
        { "value": "cafe", "label": "Café" },
        { "value": "museo", "label": "Museo" }
      ]
    }
  ],
  "images": []
}
```

---

## Validación

MapaKit valida la configuración en tiempo de carga. Si falta un campo requerido o el tipo es incorrecto, se emitirá un evento `error` con detalles del problema.

```javascript
map.on('error', (err) => {
  console.error('Error de configuración:', err.message);
});
```
