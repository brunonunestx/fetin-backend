import { describe, expect, it, vi } from 'vitest';
import { sessionStore } from '@/lib/session-store';

describe('sessionStore', () => {
  it('persists the access token and notifies session changes', () => {
    const listener = vi.fn();
    const unsubscribe = sessionStore.subscribe(listener);

    sessionStore.setAccessToken('access-token');

    expect(sessionStore.getAccessToken()).toBe('access-token');
    expect(window.localStorage.getItem('trampofacil.access-token')).toBe('access-token');
    expect(listener).toHaveBeenLastCalledWith('signed-in');

    sessionStore.clear('expired');

    expect(sessionStore.getAccessToken()).toBeNull();
    expect(listener).toHaveBeenLastCalledWith('expired');
    unsubscribe();
  });

  it('stops notifying listeners after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = sessionStore.subscribe(listener);
    unsubscribe();

    sessionStore.setAccessToken('another-token');

    expect(listener).not.toHaveBeenCalled();
  });
});
