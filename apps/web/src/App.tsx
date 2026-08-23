import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { queryClient } from '@/app/query-client';
import { router } from '@/app/router';
import { ConnectionGuard } from '@/features/pwa/components/connection-guard';
import { PwaUpdatePrompt } from '@/features/pwa/components/pwa-update-prompt';
import { PwaInstallProvider } from '@/features/pwa/pwa-install-provider';

function App() {
  return (
    <PwaInstallProvider>
      <QueryClientProvider client={queryClient}>
        <ConnectionGuard>
          <RouterProvider router={router} />
        </ConnectionGuard>
      </QueryClientProvider>
      <PwaUpdatePrompt />
    </PwaInstallProvider>
  );
}

export { App };
