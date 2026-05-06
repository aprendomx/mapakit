import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineStore } from '../src/offline/OfflineStore.js';

describe('OfflineStore', () => {
  let store;

  beforeEach(async () => {
    store = new OfflineStore('MapaKitTestDB');
    await store.init();
    await store.clear();
  });

  it('saves and retrieves config', async () => {
    const config = { map: { style: {} }, layers: [] };
    await store.saveConfig('test-map', config);
    const result = await store.getConfig('test-map');
    expect(result).toEqual(config);
  });

  it('saves and retrieves data', async () => {
    const data = { type: 'FeatureCollection', features: [] };
    await store.saveData('source1', data);
    const result = await store.getData('source1');
    expect(result).toEqual(data);
  });

  it('saves and retrieves lastSync timestamp', async () => {
    const ts = Date.now();
    await store.setLastSync(ts);
    const result = await store.getLastSync();
    expect(result).toBe(ts);
  });

  it('returns undefined for missing keys', async () => {
    const result = await store.getConfig('nonexistent');
    expect(result).toBeUndefined();
  });
});
