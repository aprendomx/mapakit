import { describe, it, expect, vi } from 'vitest';
import { AuthManager } from '../src/AuthManager.js';

describe('AuthManager', () => {
  it('signs in with email and password', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' }, session: { access_token: 'token-123' } },
          error: null
        })
      }
    };

    const auth = new AuthManager(mockSupabase);
    const session = await auth.signIn('test@test.com', 'password');

    expect(session.access_token).toBe('token-123');
    expect(auth.user).toEqual({ id: 'user-1' });
  });

  it('throws on sign in error', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid credentials' }
        })
      }
    };

    const auth = new AuthManager(mockSupabase);
    await expect(auth.signIn('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('signs out and clears user', async () => {
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null })
      }
    };

    const auth = new AuthManager(mockSupabase);
    auth.user = { id: 'user-1' };
    await auth.signOut();

    expect(auth.user).toBeNull();
  });

  it('gets current session', async () => {
    const mockSession = { access_token: 'token-123' };
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
      }
    };

    const auth = new AuthManager(mockSupabase);
    const session = await auth.getSession();

    expect(session.access_token).toBe('token-123');
  });
});
