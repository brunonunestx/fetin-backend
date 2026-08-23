import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { PwaUpdateBanner } from '@/features/pwa/components/pwa-update-banner';

function PwaUpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) {
    return null;
  }

  const applyUpdate = async () => {
    setIsUpdating(true);

    try {
      await updateServiceWorker(true);
    } catch {
      setIsUpdating(false);
    }
  };

  return (
    <PwaUpdateBanner
      isUpdating={isUpdating}
      onDismiss={() => setNeedRefresh(false)}
      onUpdate={() => void applyUpdate()}
    />
  );
}

export { PwaUpdatePrompt };
