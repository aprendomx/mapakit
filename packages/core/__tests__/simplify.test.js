import { describe, it, expect } from 'vitest';
import { douglasPeucker, simplifyFeature } from '../src/utils/simplify.js';

describe('Douglas-Peucker simplification', () => {
  it('returns original points for 2 or fewer points', () => {
    const points = [[0, 0], [1, 1]];
    expect(douglasPeucker(points, 0.1)).toEqual(points);
  });

  it('simplifies collinear points to endpoints', () => {
    const points = [[0, 0], [1, 1], [2, 2], [3, 3]];
    const result = douglasPeucker(points, 0.001);
    expect(result).toEqual([[0, 0], [3, 3]]);
  });

  it('preserves significant deviations', () => {
    const points = [[0, 0], [1, 1], [2, 0], [3, 1]];
    const result = douglasPeucker(points, 0.1);
    // Should keep the point at [2, 0] since deviation is significant
    expect(result.length).toBeGreaterThan(2);
  });

  it('simplifies LineString feature at low zoom', () => {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]]
      }
    };
    const simplified = simplifyFeature(feature, 4);
    expect(simplified.geometry.coordinates.length).toBe(2);
  });

  it('does not simplify Point feature', () => {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    };
    const simplified = simplifyFeature(feature, 4);
    expect(simplified.geometry.coordinates).toEqual([0, 0]);
  });

  it('does not simplify at high zoom', () => {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]]
      }
    };
    const simplified = simplifyFeature(feature, 12);
    expect(simplified.geometry.coordinates.length).toBe(4);
  });
});
