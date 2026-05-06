export class ConfigLoader {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async load(configId) {
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
