# Advanced JSON Configuration

Complete reference of the configuration schema that MapaKit expects.

---

## General Structure

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

General map configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique map identifier |
| `name` | `string` | Yes | Visible map name |
| `slug` | `string` | Yes | URL-friendly slug |
| `is_public` | `boolean` | No | Whether the map is public (default: `true`) |
| `style` | `object` | No | Visual styles |
| `style.basemap` | `string` | No | Basemap: `carto-dark`, `carto-light`, `osm` |
| `style.colors` | `object` | No | Theme colors |
| `style.colors.primary` | `string` | No | Primary color (hex) |
| `style.colors.panel` | `string` | No | Panel background color |
| `style.typography` | `object` | No | Typography fonts |
| `style.typography.heading` | `string` | No | Heading font |
| `style.typography.body` | `string` | No | Body font |
| `initial_view` | `object` | No | Initial map view |
| `initial_view.center` | `[lng, lat]` | No | Center coordinates `[longitude, latitude]` |
| `initial_view.zoom` | `number` | No | Initial zoom level (0–22) |
| `initial_view.bearing` | `number` | No | Rotation in degrees (default: `0`) |
| `initial_view.pitch` | `number` | No | Tilt in degrees (default: `0`) |
| `controls` | `string[]` | No | Map controls: `geolocate`, `fullscreen`, `reset`, `scale` |

### Example

```json
{
  "map": {
    "id": "example-map",
    "name": "Example Map",
    "slug": "example-map",
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

GeoJSON data sources.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique source identifier |
| `source_type` | `string` | Yes | Source type: `geojson` |
| `url` | `string` | Conditional | Remote GeoJSON URL |
| `data` | `object` | Conditional | Inline GeoJSON |

> **Note:** Either `url` **or** `data` must be provided, but not both.

### Example with inline data

```json
{
  "sources": [
    {
      "id": "points",
      "source_type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": { "name": "Place 1" },
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

### Example with URL

```json
{
  "sources": [
    {
      "id": "stations",
      "source_type": "geojson",
      "url": "https://api.example.com/stations.geojson"
    }
  ]
}
```

---

## `layers`

Layers that visualize data sources.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique layer identifier |
| `source_id` | `string` | Yes | Associated source ID |
| `type` | `string` | Yes | Type: `circle`, `line`, `fill`, `symbol` |
| `filter` | `array` | No | MapLibre filter expression (optional) |
| `paint` | `object` | No | MapLibre paint properties |
| `layout` | `object` | No | MapLibre layout properties |

### Layer Types

#### `circle` — Points

```json
{
  "id": "points",
  "source_id": "points",
  "type": "circle",
  "paint": {
    "circle-radius": 8,
    "circle-color": "#f59e0b",
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff"
  }
}
```

#### `line` — Lines

```json
{
  "id": "routes",
  "source_id": "routes",
  "type": "line",
  "paint": {
    "line-color": "#3b82f6",
    "line-width": 3,
    "line-dasharray": [2, 2]
  }
}
```

#### `fill` — Polygons

```json
{
  "id": "zones",
  "source_id": "zones",
  "type": "fill",
  "paint": {
    "fill-color": "#10b981",
    "fill-opacity": 0.5,
    "fill-outline-color": "#065f46"
  }
}
```

#### `symbol` — Text / Icons

```json
{
  "id": "labels",
  "source_id": "points",
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

Interactive filters that appear in the side panel.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Filter identifier |
| `label` | `string` | Yes | Visible label in the panel |
| `type` | `string` | Yes | Type: `select`, `checkbox`, `search`, `range` |
| `property` | `string` | Yes | GeoJSON property to filter by |
| `options` | `array` | Conditional | Options for `select` and `checkbox` |
| `min` | `number` | Conditional | Minimum value for `range` |
| `max` | `number` | Conditional | Maximum value for `range` |
| `step` | `number` | Conditional | Step for `range` |

### `select` — Dropdown

```json
{
  "id": "category",
  "label": "Category",
  "type": "select",
  "property": "category",
  "options": [
    { "value": "restaurant", "label": "Restaurant" },
    { "value": "cafe", "label": "Cafe" },
    { "value": "museum", "label": "Museum" }
  ]
}
```

### `checkbox` — Checkboxes

```json
{
  "id": "types",
  "label": "Types",
  "type": "checkbox",
  "property": "type",
  "options": [
    { "value": "public", "label": "Public" },
    { "value": "private", "label": "Private" }
  ]
}
```

### `search` — Text search

```json
{
  "id": "search",
  "label": "Search",
  "type": "search",
  "property": "name"
}
```

### `range` — Numeric range

```json
{
  "id": "rating",
  "label": "Minimum Rating",
  "type": "range",
  "property": "rating",
  "min": 0,
  "max": 5,
  "step": 0.5
}
```

---

## `images`

Custom images to use as icons in `symbol` layers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Image identifier |
| `url` | `string` | Yes | Image URL |

### Example

```json
{
  "images": [
    {
      "id": "restaurant-icon",
      "url": "https://example.com/restaurant-icon.png"
    }
  ]
}
```

Then use it in a layer:

```json
{
  "id": "icons",
  "source_id": "points",
  "type": "symbol",
  "layout": {
    "icon-image": "restaurant-icon",
    "icon-size": 0.5
  }
}
```

---

## Complete Example Configuration

```json
{
  "map": {
    "id": "complete-map",
    "name": "Complete Map",
    "slug": "complete-map",
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
      "id": "places",
      "source_type": "geojson",
      "url": "https://api.example.com/places.geojson"
    }
  ],
  "layers": [
    {
      "id": "places-points",
      "source_id": "places",
      "type": "circle",
      "paint": {
        "circle-radius": 8,
        "circle-color": "#f59e0b",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    },
    {
      "id": "places-labels",
      "source_id": "places",
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
      "id": "category",
      "label": "Category",
      "type": "select",
      "property": "category",
      "options": [
        { "value": "restaurant", "label": "Restaurant" },
        { "value": "cafe", "label": "Cafe" },
        { "value": "museum", "label": "Museum" }
      ]
    }
  ],
  "images": []
}
```

---

## Validation

MapaKit validates the configuration at load time. If a required field is missing or the type is incorrect, an `error` event will be emitted with details.

```javascript
map.on('error', (err) => {
  console.error('Configuration error:', err.message);
});
```
