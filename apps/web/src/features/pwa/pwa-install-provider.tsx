import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  PwaInstallContext,
  type InstallOutcome,
  type PwaInstallContextValue,
} from '@/features/pwa/pwa-install-context';
import { isIosDevice, isStandaloneApp } from '@/features/pwa/pwa-install-rules';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function getDisplayModeQuery() {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)')
    : null;
}

function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    const displayModeQuery = getDisplayModeQuery();
    const standalone = (window.navigator as NavigatorWithStandalone).standalone;
    return isStandaloneApp(displayModeQuery?.matches ?? false, standalone);
  });
  const [isIos] = useState(() =>
    isIosDevice({
      maxTouchPoints: window.navigator.maxTouchPoints,
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    }),
  );

  useEffect(() => {
    const displayModeQuery = getDisplayModeQuery();
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };
    const handleDisplayModeChange = () => {
      const standalone = (window.navigator as NavigatorWithStandalone).standalone;
      setIsInstalled(isStandaloneApp(displayModeQuery?.matches ?? false, standalone));
    };

    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    displayModeQuery?.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      displayModeQuery?.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const requestInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!installPrompt) {
      return 'unavailable';
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }

      return outcome;
    } catch {
      setInstallPrompt(null);
      return 'unavailable';
    }
  }, [installPrompt]);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      installMode: isInstalled ? null : installPrompt ? 'android' : isIos ? 'ios' : null,
      requestInstall,
    }),
    [installPrompt, isInstalled, isIos, requestInstall],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export { PwaInstallProvider };
