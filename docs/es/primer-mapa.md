# Mi Primer Mapa con MapaKit

Tutorial paso a paso para crear tu primer mapa interactivo usando una configuración JSON estática.

---

## Objetivo

Al finalizar este tutorial tendrás un mapa funcional que muestra puntos de interés con filtros por categoría, popups al hacer click y sincronización de estado con la URL.

## Paso 1: Crear la estructura del proyecto

```bash
mkdir mi-primer-mapa
cd mi-primer-mapa
npm init -y
```

## Paso 2: Instalar dependencias

```bash
npm install @mapakit/core maplibre-gl supercluster
```

## Paso 3: Crear el archivo de configuración JSON

Crea la carpeta `public/config/` y dentro el archivo `mapa.json`:

```json
{
  "map": {
    "id": "mapa-ejemplo",
    "name": "Puntos de Interés",
    "slug": "puntos-interes",
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
      "id": "puntos",
      "source_type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {
              "name": "Restaurante El Sabor",
              "category": "restaurante",
              "description": "Comida mexicana tradicional"
            },
            "geometry": {
              "type": "Point",
              "coordinates": [-99.13, 19.43]
            }
          },
          {
            "type": "Feature",
            "properties": {
              "name": "Café Central",
              "category": "cafe",
              "description": "Café de especialidad"
            },
            "geometry": {
              "type": "Point",
              "coordinates": [-99.14, 19.44]
            }
          },
          {
            "type": "Feature",
            "properties": {
              "name": "Museo de Arte",
              "category": "museo",
              "description": "Arte contemporáneo"
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
      "id": "puntos-layer",
      "source_id": "puntos",
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

## Paso 4: Crear el archivo HTML

Crea `index.html` en la raíz:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Primer Mapa — MapaKit</title>
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
      configId: '/config/mapa.json'
    });

    map.on('ready', () => {
      console.log('¡Mapa listo!');
    });

    map.on('featureClick', (e) => {
      console.log('Click en:', e.properties.name);
    });

    map.on('error', (err) => {
      console.error('Error:', err.message);
    });

    map.init();
  </script>
</body>
</html>
```

## Paso 5: Servir el proyecto

Usa Vite para servir los archivos estáticos:

```bash
npm install -D vite
npx vite
```

Abre http://localhost:5173 en tu navegador.

## Resultado

Verás:
- Un mapa oscuro centrado en la Ciudad de México
- 3 puntos naranjas representando lugares
- Un panel lateral con un filtro desplegable por categoría
- Al hacer click en un punto aparece un popup con su nombre y descripción
- Los controles de geolocalización, pantalla completa, reset y escala

## Siguientes pasos

- [Configuración JSON avanzada](./configuracion-json.md) — Conoce todas las opciones del schema
- [Plugins personalizados](./plugins-personalizados.md) — Conecta tus propios datos
- [Arquitectura del sistema](./arquitectura.md) — Entiende cómo funciona internamente
