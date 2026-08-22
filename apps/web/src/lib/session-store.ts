const ACCESS_TOKEN_KEY = 'trampofacil.access-token';

type SessionEvent = 'expired' | 'signed-in' | 'signed-out';
type SessionListener = (event: SessionEvent) => void;

const listeners = new Set<SessionListener>();

function getStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function notify(event: SessionEvent) {
  listeners.forEach((listener) => listener(event));
}

const sessionStore = {
  clear(event: Extract<SessionEvent, 'expired' | 'signed-out'> = 'signed-out') {
    getStorage()?.removeItem(ACCESS_TOKEN_KEY);
    notify(event);
  },

  getAccessToken() {
    return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  },

  setAccessToken(accessToken: string) {
    getStorage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
    notify('signed-in');
  },

  subscribe(listener: SessionListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export { sessionStore };
export type { SessionEvent };
