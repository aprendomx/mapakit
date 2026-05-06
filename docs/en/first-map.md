# My First Map with MapaKit

Step-by-step tutorial to create your first interactive map using a static JSON configuration.

---

## Goal

By the end of this tutorial you will have a working map that displays points of interest with category filters, click popups, and URL state synchronization.

## Step 1: Create the project structure

```bash
mkdir my-first-map
cd my-first-map
npm init -y
```

## Step 2: Install dependencies

```bash
npm install @mapakit/core maplibre-gl supercluster
```

## Step 3: Create the JSON configuration file

Create the folder `public/config/` and inside it the file `map.json`:

```json
{
  "map": {
    "id": "example-map",
    "name": "Points of Interest",
    "slug": "points-of-interest",
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
      "id": "points",
      "source_type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {
              "name": "El Sabor Restaurant",
              "category": "restaurant",
              "description": "Traditional Mexican food"
            },
            "geometry": {
              "type": "Point",
              "coordinates": [-99.13, 19.43]
            }
          },
          {
            "type": "Feature",
            "properties": {
              "name": "Central Cafe",
              "category": "cafe",
              "description": "Specialty coffee"
            },
            "geometry": {
              "type": "Point",
              "coordinates": [-99.14, 19.44]
            }
          },
          {
            "type": "Feature",
            "properties": {
              "name": "Art Museum",
              "category": "museum",
              "description": "Contemporary art"
            },
            "geometry": {
              "type": "Point",
              "coordinates": [-99.12, 19.42]
            }
          }
        ]
      }
    }
  ],
  "layers": [
    {
      "id": "points-layer",
      "source_id": "points",
      "type": "circle",
      "paint": {
        "circle-radius": 8,
        "circle-color": "#f59e0b",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
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

## Step 4: Create the HTML file

Create `index.html` in the root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First Map — MapaKit</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script type="module">
    import { MapaKit } from '@mapakit/core';

    const map = new MapaKit({
      container: '#map',
      configProvider: 'json-static',
      configId: '/config/map.json'
    });

    map.on('ready', () => {
      console.log('Map ready!');
    });

    map.on('featureClick', (e) => {
      console.log('Clicked:', e.properties.name);
    });

    map.on('error', (err) => {
      console.error('Error:', err.message);
    });

    map.init();
  </script>
</body>
</html>
```

## Step 5: Serve the project

Use Vite to serve the static files:

```bash
npm install -D vite
npx vite
```

Open http://localhost:5173 in your browser.

## Result

You will see:
- A dark map centered on Mexico City
- 3 orange dots representing places
- A side panel with a category dropdown filter
- A popup with name and description when clicking a point
- Controls for geolocation, fullscreen, reset, and scale

## Next Steps

- [Advanced JSON Configuration](./json-config.md) — Learn all schema options
- [Custom Plugins](./custom-plugins.md) — Connect your own data
- [System Architecture](./architecture.md) — Understand how it works internally
