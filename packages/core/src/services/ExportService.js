export class ExportService {
  static toGeoJSON(features) {
    return {
      type: 'FeatureCollection',
      features: features || []
    };
  }

  static toCSV(features) {
    if (!features || features.length === 0) return '';
    
    // Collect all unique property keys
    const keys = new Set();
    for (const f of features) {
      if (f.properties) {
        Object.keys(f.properties).forEach(k => keys.add(k));
      }
    }
    const headers = ['geometry_type', 'longitude', 'latitude', ...Array.from(keys)];
    
    const rows = features.map(f => {
      const geomType = f.geometry?.type || '';
      const coords = f.geometry?.coordinates || [];
      const lng = coords[0] || '';
      const lat = coords[1] || '';
      const vals = Array.from(keys).map(k => {
        const val = f.properties?.[k];
        if (val === undefined || val === null) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (/[",\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      return [geomType, lng, lat, ...vals].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  static toKML(features) {
    const placemarks = (features || []).map(f => {
      const name = this._escapeXml(f.properties?.name || f.properties?.title || 'Feature');
      const coords = f.geometry?.coordinates || [];
      const coordStr = `${coords[0]},${coords[1]},0`;
      return `
        <Placemark>
          <name>${name}</name>
          <Point><coordinates>${coordStr}</coordinates></Point>
        </Placemark>`;
    }).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>MapaKit Export</name>
    ${placemarks}
  </Document>
</kml>`;
  }

  static _escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static download(data, filename, mimeType) {
    const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
