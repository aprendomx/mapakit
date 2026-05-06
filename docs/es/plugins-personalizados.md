# Plugins Personalizados

Aprende a crear proveedores de configuración y datos personalizados para conectar MapaKit con cualquier backend.

---

## Arquitectura de Plugins

MapaKit usa dos tipos de plugins:

| Tipo | Clase base | Propósito |
|------|------------|-----------|
| **Config Provider** | `ConfigProvider` | Carga la especificación del mapa (estilos, capas, filtros) |
| **Data Provider** | `DataProvider` | Carga los datos GeoJSON/feature de cada fuente |

Ambos se registran en `PluginRegistry` y se seleccionan automáticamente.

---

## Proveedor de Configuración Personalizado

Extiende `ConfigProvider` para cargar configuración desde tu propio backend.

### Ejemplo: Proveedor GraphQL

```javascript
import { ConfigProvider } from '@mapakit/core';

export class GraphQLConfigProvider extends ConfigProvider {
  constructor(options = {}) {
    super({ id: 'graphql' });
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
  }

  /**
   * MapaKit llama a este método para determinar si este proveedor
   * puede cargar la configuración solicitada.
   */
  canLoad(options) {
    return !!options.graphqlEndpoint;
  }

  /**
   * Carga la configuración desde el endpoint GraphQL.
   */
  async load(configId) {
    const query = `
      query GetMap($id: ID!) {
        map(id: $id) {
          id
          name
          slug
          style
          initialView { center zoom bearing pitch }
          sources { id sourceType url data }
          layers { id sourceId type filter paint layout }
          filters { id label type property options min max step }
          images { id url }
        }
      }
    `;

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ query, variables: { id: configId } })
    });

    const { data } = await response.json();
    const map = data.map;

    // Transformar al formato que espera MapaKit
    return {
      map: {
        id: map.id,
        name: map.name,
        slug: map.slug,
        style: map.style,
        initial_view: map.initialView,
        controls: map.controls || []
      },
      sources: map.sources,
      layers: map.layers,
      filters: map.filters,
      images: map.images
    };
  }
}
```

### Uso

```javascript
import { MapaKit, PluginRegistry } from '@mapakit/core';
import { GraphQLConfigProvider } from './GraphQLConfigProvider';

const registry = new PluginRegistry();
registry.registerConfigProvider(
  new GraphQLConfigProvider({
    endpoint: 'https://api.tusitio.com/graphql',
    apiKey: 'tu-api-key'
  })
);

const map = new MapaKit({
  container: '#map',
  configProvider: 'graphql',
  configId: 'mapa-123',
  graphqlEndpoint: 'https://api.tusitio.com/graphql',
  pluginRegistry: registry
});

map.init();
```

---

## Proveedor de Datos Personalizado

Extiende `DataProvider` para cargar datos desde fuentes no estándar.

### Ejemplo: Proveedor WMS

```javascript
import { DataProvider } from '@mapakit/core';

export class WMSDataProvider extends DataProvider {
  constructor() {
    super({ id: 'wms' });
  }

  /**
   * Determina si este proveedor puede manejar la fuente.
   */
  supports(source) {
    return source.source_type === 'wms';
  }

  /**
   * Carga la capa WMS y la convierte a GeoJSON.
   */
  async load(source) {
    const bbox = source.bbox || '-180,-90,180,90';
    const url = `${source.url}?SERVICE=WMS&REQUEST=GetFeatureInfo&LAYERS=${source.layer}&BBOX=${bbox}&FORMAT=application/json`;

    const response = await fetch(url);
    const wmsData = await response.json();

    return this.convertWMSToGeoJSON(wmsData);
  }

  convertWMSToGeoJSON(wmsData) {
    // Implementa la conversión según el formato de tu WMS
    return {
      type: 'FeatureCollection',
      features: wmsData.features.map((f) => ({
        type: 'Feature',
        properties: f.properties,
        geometry: f.geometry
      }))
    };
  }
}
```

### Ejemplo: Proveedor de CSV

```javascript
import { DataProvider } from '@mapakit/core';

export class CSVDataProvider extends DataProvider {
  constructor() {
    super({ id: 'csv' });
  }

  supports(source) {
    return source.source_type === 'csv' || source.url?.endsWith('.csv');
  }

  async load(source) {
    const response = await fetch(source.url);
    const csvText = await response.text();

    return this.parseCSVToGeoJSON(csvText, source);
  }

  parseCSVToGeoJSON(csvText, source) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());
    const latField = source.latField || 'lat';
    const lngField = source.lngField || 'lng';

    const features = lines.slice(1).map((line) => {
      const values = line.split(',');
      const properties = {};
      headers.forEach((h, i) => {
        properties[h] = values[i]?.trim();
      });

      return {
        type: 'Feature',
        properties,
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(properties[lngField]),
            parseFloat(properties[latField])
          ]
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }
}
```

### Uso

```javascript
import { MapaKit, PluginRegistry } from '@mapakit/core';
import { CSVDataProvider } from './CSVDataProvider';

const registry = new PluginRegistry();
registry.registerDataProvider(new CSVDataProvider());

const map = new MapaKit({
  container: '#map',
  configProvider: 'json-static',
  configId: '/config/mapa.csv.json',
  pluginRegistry: registry
});

map.init();
```

Con configuración:

```json
{
  "sources": [
    {
      "id": "datos-csv",
      "source_type": "csv",
      "url": "https://ejemplo.com/datos.csv",
      "latField": "latitude",
      "lngField": "longitude"
    }
  ]
}
```

---

## Registro múltiple de plugins

Puedes registrar varios proveedores al mismo tiempo:

```javascript
import { MapaKit, PluginRegistry } from '@mapakit/core';
import { GraphQLConfigProvider } from './GraphQLConfigProvider';
import { CSVDataProvider } from './CSVDataProvider';
import { WMSDataProvider } from './WMSDataProvider';

const registry = new PluginRegistry();

registry.registerConfigProvider(
  new GraphQLConfigProvider({ endpoint: '...', apiKey: '...' })
);

registry.registerDataProvider(new CSVDataProvider());
registry.registerDataProvider(new WMSDataProvider());

const map = new MapaKit({
  container: '#map',
  configProvider: 'graphql',
  configId: 'mapa-123',
  pluginRegistry: registry
});

map.init();
```

MapaKit seleccionará automáticamente el proveedor de datos adecuado para cada fuente usando el método `supports()`.

---

## Buenas prácticas

1. **Id único**: Cada proveedor debe tener un `id` único.
2. **Manejo de errores**: Siempre envuelve las peticiones en `try/catch` y emite errores descriptivos.
3. **Transformación de datos**: Asegúrate de que la salida cumpla con el formato esperado por MapaKit.
4. **Caché**: Para fuentes pesadas, considera implementar caché en el proveedor.
5. **Validación**: Valida los datos antes de devolverlos para evitar errores en el renderizado.

---

## Referencia de la API de Plugins

### `ConfigProvider`

| Método | Retorna | Descripción |
|--------|---------|-------------|
| `constructor({ id })` | — | Crea el proveedor con un ID único |
| `canLoad(options)` | `boolean` | ¿Puede este proveedor cargar la config dada? |
| `load(configId)` | `Promise<object>` | Carga y devuelve la configuración |

### `DataProvider`

| Método | Retorna | Descripción |
|--------|---------|-------------|
| `constructor({ id })` | — | Crea el proveedor con un ID único |
| `supports(source)` | `boolean` | ¿Puede este proveedor manejar esta fuente? |
| `load(source)` | `Promise<GeoJSON>` | Carga y devuelve los datos como GeoJSON |

### `PluginRegistry`

| Método | Descripción |
|--------|-------------|
| `registerConfigProvider(provider)` | Registra un proveedor de configuración |
| `registerDataProvider(provider)` | Registra un proveedor de datos |
| `getConfigProvider(options)` | Obtiene el proveedor de config adecuado |
| `getDataProvider(source)` | Obtiene el proveedor de datos adecuado |
