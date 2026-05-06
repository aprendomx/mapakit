import { ConfigProvider } from '../ConfigProvider.js';

export class JsonStaticConfigProvider extends ConfigProvider {
  constructor(options = {}) {
    super({ id: 'json-static' });
    this.baseUrl = options.baseUrl || '';
  }

  canLoad(options) {
    return !!options.configUrl;
  }

  async load(configUrl) {
    const url = configUrl.startsWith('http') ? configUrl : `${this.baseUrl}${configUrl}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load config: HTTP ${response.status}`);
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
