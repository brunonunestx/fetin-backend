import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router';
import { AuthContext, type AuthStatus } from '@/features/auth/auth-context';
import { getCurrentUser } from '@/features/auth/auth-api';
import { authQueryKeys } from '@/features/auth/auth-query-keys';
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
        queryClient.removeQueries({ queryKey: authQueryKeys.all });
      }),
    [queryClient],
  );

  const logout = useCallback(() => sessionStore.clear('signed-out'), []);
  const retrySession = useCallback(() => {
    void sessionQuery.refetch();
  }, [sessionQuery]);

  let status: AuthStatus = 'anonymous';

  if (hasToken && sessionQuery.isPending) {
    status = 'loading';
  } else if (hasToken && sessionQuery.isError) {
    status = 'error';
  } else if (hasToken && sessionQuery.data) {
    status = 'authenticated';
  }

  const value = useMemo(
    () => ({
      exitReason,
      logout,
      retrySession,
      status,
      user: hasToken ? (sessionQuery.data ?? null) : null,
    }),
    [exitReason, hasToken, logout, retrySession, sessionQuery.data, status],
  );

  return (
    <AuthContext.Provider value={value}>
      <Outlet />
    </AuthContext.Provider>
  );
}

export { AuthProvider };
