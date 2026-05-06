import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateManager } from '../src/StateManager.js';

describe('StateManager URL params', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager({ mapId: 'test-map' });
    // Reset URL
    window.history.replaceState({}, '', window.location.pathname);
  });

  afterEach(() => {
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('getUrlParams parses center', () => {
    window.history.replaceState({}, '', '?mk-center=-99.123456,19.654321');
    const params = stateManager.getUrlParams();
    expect(params.center).toEqual([-99.123456, 19.654321]);
  });

  it('getUrlParams parses zoom, bearing, pitch', () => {
    window.history.replaceState({}, '', '?mk-zoom=12.50&mk-bearing=45.0&mk-pitch=30.0');
    const params = stateManager.getUrlParams();
    expect(params.zoom).toBe(12.5);
    expect(params.bearing).toBe(45);
    expect(params.pitch).toBe(30);
  });

  it('getUrlParams parses filters', () => {
    window.history.replaceState({}, '', '?mk-filter-type=school');
    const params = stateManager.getUrlParams();
    expect(params.filters).toEqual({ type: 'school' });
  });

  it('getUrlParams parses layer visibility', () => {
    window.history.replaceState({}, '', '?mk-layer-layer1=1&mk-layer-layer2=0');
    const params = stateManager.getUrlParams();
    expect(params.layers).toEqual({ layer1: true, layer2: false });
  });

  it('setUrlParams writes all params', () => {
    stateManager.setUrlParams({
      center: [-99.123456, 19.654321],
      zoom: 12.5,
      bearing: 45,
      pitch: 30,
      filters: { type: 'school' },
      layers: { layer1: true, layer2: false }
    });
    const url = new URL(window.location.href);
    expect(url.searchParams.get('mk-center')).toBe('-99.123456,19.654321');
    expect(url.searchParams.get('mk-zoom')).toBe('12.50');
    expect(url.searchParams.get('mk-bearing')).toBe('45.0');
    expect(url.searchParams.get('mk-pitch')).toBe('30.0');
    expect(url.searchParams.get('mk-filter-type')).toBe('school');
    expect(url.searchParams.get('mk-layer-layer1')).toBe('1');
    expect(url.searchParams.get('mk-layer-layer2')).toBe('0');
  });

  it('parseCenter handles invalid input', () => {
    expect(stateManager.parseCenter('')).toBeNull();
    expect(stateManager.parseCenter('invalid')).toBeNull();
    expect(stateManager.parseCenter('1.0')).toBeNull();
  });

  it('serializeCenter formats correctly', () => {
    expect(stateManager.serializeCenter([-99.123456789, 19.654321])).toBe('-99.123457,19.654321');
  });
});
