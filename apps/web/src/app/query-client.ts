import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api/api-error';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.statusCode && error.statusCode < 500) {
            return false;
          }

          return failureCount < 1;
        },
        staleTime: 30_000,
      },
    },
  });
}

const queryClient = createQueryClient();

export { createQueryClient, queryClient };
