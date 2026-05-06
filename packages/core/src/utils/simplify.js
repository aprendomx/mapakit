/**
 * Calculate perpendicular distance from point p to line segment (a, b)
 */
function perpendicularDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2);
  const u = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (mag * mag);
  const clampedU = Math.max(0, Math.min(1, u));
  const projX = a[0] + clampedU * dx;
  const projY = a[1] + clampedU * dy;
  return Math.sqrt((p[0] - projX) ** 2 + (p[1] - projY) ** 2);
}

/**
 * Douglas-Peucker algorithm for simplifying a polyline
 * @param {Array} points - Array of [lng, lat] coordinates
 * @param {number} tolerance - Maximum distance tolerance (in degrees)
 * @returns {Array} Simplified points
 */
export function douglasPeucker(points, tolerance) {
  if (!points || points.length <= 2) return points;
  
  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;
  
  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      index = i;
      maxDist = dist;
    }
  }
  
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[end]];
}

/**
 * Simplify a GeoJSON feature's geometry based on zoom level
 * @param {Object} feature - GeoJSON feature
 * @param {number} zoom - Current map zoom
 * @returns {Object} Feature with simplified geometry (or original if no simplification needed)
 */
export function simplifyFeature(feature, zoom) {
  if (!feature || !feature.geometry) return feature;
  
  const type = feature.geometry.type;
  if (type === 'Point' || type === 'MultiPoint') return feature;
  
  // Determine tolerance based on zoom
  // Lower zoom = more simplification (higher tolerance)
  let tolerance;
  if (zoom < 6) tolerance = 0.01;       // ~1km at equator
  else if (zoom < 10) tolerance = 0.001; // ~100m
  else return feature; // No simplification at high zoom
  
  const simplifyCoords = (coords) => douglasPeucker(coords, tolerance);
  
  let newGeometry;
  if (type === 'LineString') {
    newGeometry = { ...feature.geometry, coordinates: simplifyCoords(feature.geometry.coordinates) };
  } else if (type === 'MultiLineString') {
    newGeometry = { ...feature.geometry, coordinates: feature.geometry.coordinates.map(simplifyCoords) };
  } else if (type === 'Polygon') {
    newGeometry = { ...feature.geometry, coordinates: feature.geometry.coordinates.map(simplifyCoords) };
  } else if (type === 'MultiPolygon') {
    newGeometry = { 
      ...feature.geometry, 
      coordinates: feature.geometry.coordinates.map(polygon => polygon.map(simplifyCoords))
    };
  } else {
    return feature;
  }
  
  return { ...feature, geometry: newGeometry };
}

/**
 * Simplify all features in a GeoJSON collection based on zoom
 */
export function simplifyGeoJSON(geojson, zoom) {
  if (!geojson || !geojson.features) return geojson;
  if (zoom >= 10) return geojson; // No simplification at high zoom
  return {
    ...geojson,
    features: geojson.features.map(f => simplifyFeature(f, zoom))
  };
}
