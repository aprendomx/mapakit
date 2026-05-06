export function convertToGeoJSON(data, sourceType, propertiesMapping = {}) {
  if (sourceType === 'geojson') {
    return data;
  }

  const validTypes = ['json_points', 'json_lines', 'json_polygons'];
  if (!validTypes.includes(sourceType)) {
    throw new Error(`Unsupported sourceType: ${sourceType}`);
  }

  const features = [];

  for (const item of data) {
    let geometry;

    if (sourceType === 'json_points') {
      const latField = propertiesMapping.lat || 'lat';
      const lngField = propertiesMapping.lng || 'lng';
      geometry = {
        type: 'Point',
        coordinates: [parseFloat(item[lngField]), parseFloat(item[latField])]
      };
    } else if (sourceType === 'json_lines') {
      const geomField = propertiesMapping.geometry || 'geometry';
      geometry = {
        type: 'LineString',
        coordinates: item[geomField]
      };
    } else if (sourceType === 'json_polygons') {
      const geomField = propertiesMapping.geometry || 'geometry';
      geometry = {
        type: 'Polygon',
        coordinates: item[geomField]
      };
    }

    features.push({
      type: 'Feature',
      geometry,
      properties: { ...item }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}
