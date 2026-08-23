import { useEffect, useState, useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return window.navigator.onLine;
}

function useOnlineStatus() {
  const browserIsOnline = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const [canReachApp, setCanReachApp] = useState(browserIsOnline);

  useEffect(() => {
    if (!browserIsOnline) {
      return;
    }

    if (!window.navigator.serviceWorker?.controller) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    void fetch('/manifest.webmanifest', {
      cache: 'no-store',
      method: 'HEAD',
      signal: controller.signal,
    })
      .then(() => {
        if (isActive) {
          setCanReachApp(true);
        }
      })
      .catch(() => {
        if (isActive) {
          setCanReachApp(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [browserIsOnline]);

  return browserIsOnline && canReachApp;
}

export { useOnlineStatus };
