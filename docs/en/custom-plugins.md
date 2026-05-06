# Custom Plugins

Learn how to create custom configuration and data providers to connect MapaKit with any backend.

---

## Plugin Architecture

MapaKit uses two types of plugins:

| Type | Base Class | Purpose |
|------|------------|---------|
| **Config Provider** | `ConfigProvider` | Loads the map specification (styles, layers, filters) |
| **Data Provider** | `DataProvider` | Loads the actual GeoJSON/feature data for each source |

Both are registered in `PluginRegistry` and selected automatically.

---

## Custom Config Provider

Extend `ConfigProvider` to load configuration from your own backend.

### Example: GraphQL Provider

```javascript
import { ConfigProvider } from '@mapakit/core';

export class GraphQLConfigProvider extends ConfigProvider {
  constructor(options = {}) {
    super({ id: 'graphql' });
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
  }

  /**
   * MapaKit calls this method to determine if this provider
   * can load the requested configuration.
   */
  canLoad(options) {
    return !!options.graphqlEndpoint;
  }

  /**
   * Loads configuration from the GraphQL endpoint.
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

    // Transform to the format MapaKit expects
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

### Usage

```javascript
import { MapaKit, PluginRegistry } from '@mapakit/core';
import { GraphQLConfigProvider } from './GraphQLConfigProvider';

const registry = new PluginRegistry();
registry.registerConfigProvider(
  new GraphQLConfigProvider({
    endpoint: 'https://api.yoursite.com/graphql',
    apiKey: 'your-api-key'
  })
);

const map = new MapaKit({
  container: '#map',
  configProvider: 'graphql',
  configId: 'map-123',
  graphqlEndpoint: 'https://api.yoursite.com/graphql',
  pluginRegistry: registry
});

map.init();
```

---

## Custom Data Provider

Extend `DataProvider` to load data from non-standard sources.

### Example: WMS Provider

```javascript
import { DataProvider } from '@mapakit/core';

export class WMSDataProvider extends DataProvider {
  constructor() {
    super({ id: 'wms' });
  }

  /**
   * Determines if this provider can handle the source.
   */
  supports(source) {
    return source.source_type === 'wms';
  }

  /**
   * Loads the WMS layer and converts it to GeoJSON.
   */
  async load(source) {
    const bbox = source.bbox || '-180,-90,180,90';
    const url = `${source.url}?SERVICE=WMS&REQUEST=GetFeatureInfo&LAYERS=${source.layer}&BBOX=${bbox}&FORMAT=application/json`;

    const response = await fetch(url);
    const wmsData = await response.json();

    return this.convertWMSToGeoJSON(wmsData);
  }

  convertWMSToGeoJSON(wmsData) {
    // Implement conversion based on your WMS format
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

### Example: CSV Provider

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

### Usage

```javascript
import { MapaKit, PluginRegistry } from '@mapakit/core';
import { CSVDataProvider } from './CSVDataProvider';

const registry = new PluginRegistry();
registry.registerDataProvider(new CSVDataProvider());

const map = new MapaKit({
  container: '#map',
  configProvider: 'json-static',
  configId: '/config/map.csv.json',
  pluginRegistry: registry
});

map.init();
```

With configuration:

```json
{
  "sources": [
    {
      "id": "csv-data",
      "source_type": "csv",
      "url": "https://example.com/data.csv",
      "latField": "latitude",
      "lngField": "longitude"
    }
  ]
}
```

---

## Multiple Plugin Registration

You can register several providers at the same time:

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
  configId: 'map-123',
  pluginRegistry: registry
});

map.init();
```

MapaKit will automatically select the appropriate data provider for each source using the `supports()` method.

---

## Best Practices

1. **Unique ID**: Each provider must have a unique `id`.
2. **Error handling**: Always wrap requests in `try/catch` and emit descriptive errors.
3. **Data transformation**: Make sure the output matches the format MapaKit expects.
4. **Caching**: For heavy sources, consider implementing caching in the provider.
5. **Validation**: Validate data before returning it to avoid rendering errors.

---

## Plugin API Reference

### `ConfigProvider`

| Method | Returns | Description |
|--------|---------|-------------|
| `constructor({ id })` | — | Creates the provider with a unique ID |
| `canLoad(options)` | `boolean` | Can this provider load the given config? |
| `load(configId)` | `Promise<object>` | Loads and returns the configuration |

### `DataProvider`

| Method | Returns | Description |
|--------|---------|-------------|
| `constructor({ id })` | — | Creates the provider with a unique ID |
| `supports(source)` | `boolean` | Can this provider handle this source? |
| `load(source)` | `Promise<GeoJSON>` | Loads and returns data as GeoJSON |

### `PluginRegistry`

| Method | Description |
|--------|-------------|
| `registerConfigProvider(provider)` | Registers a config provider |
| `registerDataProvider(provider)` | Registers a data provider |
| `getConfigProvider(options)` | Gets the appropriate config provider |
| `getDataProvider(source)` | Gets the appropriate data provider |
