export class NominatimGeocoder {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://nominatim.openstreetmap.org';
    this.userAgent = options.userAgent || 'MapaKit/1.0';
    this.language = options.language || 'es';
    this.limit = options.limit || 5;
  }

  async search(query, options = {}) {
    if (!query || query.trim().length < 3) return [];
    
    const limit = options.limit || this.limit;
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      limit: String(limit),
      'accept-language': this.language,
      addressdetails: '0',
      extratags: '0'
    });

    const url = `${this.baseUrl}/search?${params.toString()}`;
    
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent }
      });
      
      if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
      
      const data = await res.json();
      return data.map(r => ({
        name: r.display_name,
        lng: parseFloat(r.lon),
        lat: parseFloat(r.lat),
        bbox: r.boundingbox ? [
          parseFloat(r.boundingbox[2]), // west (min lon)
          parseFloat(r.boundingbox[0]), // south (min lat)
          parseFloat(r.boundingbox[3]), // east (max lon)
          parseFloat(r.boundingbox[1])  // north (max lat)
        ] : null
      }));
    } catch (err) {
      console.warn('Nominatim search failed:', err.message);
      return [];
    }
  }
}
