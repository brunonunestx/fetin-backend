import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLocation } from '@/features/locals/locals-api';
import { localsQueryKeys } from '@/features/locals/locals-query-keys';
import type { CreateLocationInput, WorkLocation } from '@/features/locals/local-types';

function useCreateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLocationInput) => createLocation(input),
    onSuccess: (location) => {
      queryClient.setQueryData(localsQueryKeys.detail(location.id), location);
      queryClient.setQueryData<WorkLocation[]>(localsQueryKeys.list(), (locations) =>
        locations ? [location, ...locations] : [location],
      );
    },
  });
}

export { useCreateLocationMutation };
