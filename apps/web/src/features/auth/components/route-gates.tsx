import { Navigate, Outlet, useLocation } from 'react-router';
import {
  SessionErrorScreen,
  SessionLoadingScreen,
} from '@/features/auth/components/session-screen';
import { homeRouteByUserType, type UserType } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';

function RootRedirect() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (status === 'error') {
    return <SessionErrorScreen />;
  }

  return <Navigate replace to={user ? homeRouteByUserType[user.type] : '/boas-vindas'} />;
}

function PublicOnlyRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (status === 'error') {
    return <SessionErrorScreen />;
  }

  if (!user) {
    return <Outlet />;
  }

  const destination =
    location.pathname === '/cadastro' ? '/completar-perfil' : homeRouteByUserType[user.type];

  return <Navigate replace to={destination} />;
}

function RequireAuthentication() {
  const { exitReason, status, user } = useAuth();

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (status === 'error') {
    return <SessionErrorScreen />;
  }

  if (user) {
    return <Outlet />;
  }

  const destination =
    exitReason === 'expired'
      ? '/entrar?motivo=sessao-expirada'
      : exitReason === 'signed-out'
        ? '/boas-vindas'
        : '/entrar';

  return <Navigate replace to={destination} />;
}

function RequireRole({ allow }: { allow: UserType }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate replace to="/entrar" />;
  }

  return user.type === allow ? (
    <Outlet />
  ) : (
    <Navigate replace to={homeRouteByUserType[user.type]} />
  );
}

export { PublicOnlyRoute, RequireAuthentication, RequireRole, RootRedirect };
