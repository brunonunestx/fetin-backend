import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router';
import { AuthContext, type AuthStatus } from '@/features/auth/auth-context';
import { getCurrentUser } from '@/features/auth/auth-api';
import { authQueryKeys } from '@/features/auth/auth-query-keys';
import { getOwnProfile } from '@/features/profile/profile-api';
import { profileQueryKeys } from '@/features/profile/profile-query-keys';
import { sessionStore } from '@/lib/session-store';

function AuthProvider() {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => Boolean(sessionStore.getAccessToken()));
  const [exitReason, setExitReason] = useState<'expired' | 'signed-out' | null>(null);
  const sessionQuery = useQuery({
    enabled: hasToken,
    queryFn: getCurrentUser,
    queryKey: authQueryKeys.session(),
  });
  const shouldLoadProfile = hasToken && Boolean(sessionQuery.data);
  const profileQuery = useQuery({
    enabled: shouldLoadProfile,
    queryFn: getOwnProfile,
    queryKey: profileQueryKeys.own(),
  });

  useEffect(
    () =>
      sessionStore.subscribe((event) => {
        if (event === 'signed-in') {
          setExitReason(null);
          setHasToken(true);
          return;
        }

        setExitReason(event);
        setHasToken(false);
        queryClient.clear();
      }),
    [queryClient],
  );

  const logout = useCallback(() => sessionStore.clear('signed-out'), []);
  const retrySession = useCallback(() => {
    void sessionQuery.refetch();
    void profileQuery.refetch();
  }, [profileQuery, sessionQuery]);

  let status: AuthStatus = 'anonymous';

  if (hasToken && (sessionQuery.isPending || (shouldLoadProfile && profileQuery.isPending))) {
    status = 'loading';
  } else if (hasToken && (sessionQuery.isError || profileQuery.isError)) {
    status = 'error';
  } else if (hasToken && sessionQuery.data && profileQuery.data) {
    status = 'authenticated';
  }

  const value = useMemo(
    () => ({
      exitReason,
      logout,
      profile: hasToken ? (profileQuery.data ?? null) : null,
      retrySession,
      status,
      user: hasToken ? (sessionQuery.data ?? null) : null,
    }),
    [exitReason, hasToken, logout, profileQuery.data, retrySession, sessionQuery.data, status],
  );

  return (
    <AuthContext.Provider value={value}>
      <Outlet />
    </AuthContext.Provider>
  );
}

export { AuthProvider };
