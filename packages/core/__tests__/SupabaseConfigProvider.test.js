import { describe, it, expect, vi } from 'vitest';
import { SupabaseConfigProvider } from '../src/plugins/providers/SupabaseConfigProvider.js';

describe('SupabaseConfigProvider', () => {
  it('loads config from Supabase', async () => {
    const mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn().mockResolvedValue({
        data: { id: 'map-1', name: 'Test Map' },
        error: null
      }),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    };

    const provider = new SupabaseConfigProvider({ supabaseClient: mockSupabase });
    const config = await provider.load('map-1');

    expect(config.map.id).toBe('map-1');
    expect(config.sources).toEqual([]);
  });

  it('canLoad detects supabase options', () => {
    const provider = new SupabaseConfigProvider({});
    expect(provider.canLoad({ supabaseUrl: 'http://test' })).toBe(true);
    expect(provider.canLoad({ configUrl: '/test.json' })).toBe(false);
  });
});
