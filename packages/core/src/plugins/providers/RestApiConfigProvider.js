import { ConfigProvider } from '../ConfigProvider.js';

export class RestApiConfigProvider extends ConfigProvider {
  constructor(options = {}) {
    super({ id: 'rest-api' });
    this.headers = options.headers || {};
  }

  canLoad(options) {
    return !!options.configUrl && options.configUrl.startsWith('http');
  }

  async load(configUrl) {
    const response = await fetch(configUrl, {
      headers: {
        'Accept': 'application/json',
        ...this.headers
      }
    });

    if (!response.ok) {
      throw new Error(`REST API error: HTTP ${response.status}`);
    }

    const config = await response.json();

    return {
      map: config.map || config,
      sources: config.sources || [],
      layers: config.layers || [],
      filters: config.filters || [],
      images: config.images || []
    };
  }
}
