import { ConfigProvider } from '../ConfigProvider.js';
import { createClient } from '@supabase/supabase-js';

export class SupabaseConfigProvider extends ConfigProvider {
  constructor(options = {}) {
    super({ id: 'supabase' });
    this.supabaseUrl = options.supabaseUrl;
    this.supabaseKey = options.supabaseKey;
    this.authToken = options.authToken;
    
    if (options.supabaseClient) {
      this.supabase = options.supabaseClient;
    } else if (this.supabaseUrl && this.supabaseKey) {
      const opts = {};
      if (this.authToken) {
        opts.global = { headers: { Authorization: `Bearer ${this.authToken}` } };
      }
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey, opts);
    }
  }

  canLoad(options) {
    return !!(options.supabaseUrl || options.supabaseClient);
  }

  async load(configId) {
    if (!this.supabase) {
      throw new Error('SupabaseConfigProvider requires supabaseClient or supabaseUrl+supabaseKey');
    }

    const { data: map, error: mapError } = await this.supabase
      .from('map_configurations')
      .select('*')
      .eq('id', configId)
      .single();

    if (mapError || !map) {
      throw new Error(`Map configuration not found: ${configId}`);
    }

    const [sourcesRes, layersRes, filtersRes, imagesRes] = await Promise.all([
      this.supabase.from('map_data_sources').select('*').eq('map_id', configId),
      this.supabase.from('map_layers').select('*').eq('map_id', configId),
      this.supabase.from('map_filters').select('*').eq('map_id', configId),
      this.supabase.from('map_images').select('*').eq('map_id', configId)
    ]);

    return {
      map,
      sources: sourcesRes.data || [],
      layers: layersRes.data || [],
      filters: filtersRes.data || [],
      images: imagesRes.data || []
    };
  }
}
