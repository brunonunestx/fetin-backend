import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOwnProfile } from '@/features/profile/profile-api';
import { profileQueryKeys } from '@/features/profile/profile-query-keys';
import type { PublicProfile, UpdateProfileInput } from '@/features/profile/profile-types';

function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateOwnProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.own(), profile);
      queryClient.setQueryData<PublicProfile>(profileQueryKeys.public(profile.id), {
        bio: profile.bio,
        id: profile.id,
        name: profile.name,
        position: profile.position,
        type: profile.type,
      });
    },
  });
}

export { useUpdateProfileMutation };
