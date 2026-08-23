import { useContext } from 'react';
import { PwaInstallContext } from '@/features/pwa/pwa-install-context';

function usePwaInstall() {
  return useContext(PwaInstallContext);
}

export { usePwaInstall };
