import { createContext } from 'react';

type InstallMode = 'android' | 'ios' | null;
type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

type PwaInstallContextValue = {
  installMode: InstallMode;
  requestInstall: () => Promise<InstallOutcome>;
};

const PwaInstallContext = createContext<PwaInstallContextValue>({
  installMode: null,
  requestInstall: () => Promise.resolve('unavailable'),
});

export { PwaInstallContext };
export type { InstallMode, InstallOutcome, PwaInstallContextValue };
