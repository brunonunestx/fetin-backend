import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { createQueryClient } from '@/app/query-client';
import { createTestRouter } from '@/app/router';

function renderApp(route: string) {
  const queryClient = createQueryClient();
  const router = createTestRouter([route]);
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...result, queryClient, router };
}

export { renderApp };
