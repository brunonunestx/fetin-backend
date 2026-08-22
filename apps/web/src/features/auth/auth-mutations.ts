import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getCurrentUser, login, register } from '@/features/auth/auth-api';
import { authQueryKeys } from '@/features/auth/auth-query-keys';
import type { AuthUser, LoginInput, RegisterInput } from '@/features/auth/auth-types';
import { getOwnProfile } from '@/features/profile/profile-api';
import { profileQueryKeys } from '@/features/profile/profile-query-keys';
import { ApiError, isApiError } from '@/lib/api/api-error';
import { sessionStore } from '@/lib/session-store';

const ACCOUNT_CREATED_LOGIN_FAILED = 'ACCOUNT_CREATED_LOGIN_FAILED';

async function establishSession(input: LoginInput, queryClient: QueryClient): Promise<AuthUser> {
  const accessToken = await login(input);
  sessionStore.setAccessToken(accessToken);

  const user = await queryClient.fetchQuery({
    queryFn: getCurrentUser,
    queryKey: authQueryKeys.session(),
  });

  await queryClient.fetchQuery({
    queryFn: getOwnProfile,
    queryKey: profileQueryKeys.own(),
  });

  return user;
}

function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => establishSession(input, queryClient),
  });
}

function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      await register(input);

      try {
        return await establishSession(
          { email: input.email, password: input.password },
          queryClient,
        );
      } catch (error) {
        const apiError = isApiError(error) ? error : undefined;

        throw new ApiError({
          code: ACCOUNT_CREATED_LOGIN_FAILED,
          correlationId: apiError?.correlationId,
          details: apiError?.details,
          message:
            'Sua conta foi criada, mas não conseguimos entrar automaticamente. Entre com o mesmo e-mail e senha.',
          statusCode: apiError?.statusCode,
        });
      }
    },
  });
}

export { ACCOUNT_CREATED_LOGIN_FAILED, useLoginMutation, useRegisterMutation };
