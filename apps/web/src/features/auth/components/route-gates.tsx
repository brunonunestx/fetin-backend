import { Navigate, Outlet } from 'react-router';
import {
  SessionErrorScreen,
  SessionLoadingScreen,
} from '@/features/auth/components/session-screen';
import { homeRouteByUserType, type UserType } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';
import { isProfileComplete } from '@/features/profile/profile-types';

function getAuthenticatedDestination(user: { type: UserType }, profileComplete: boolean) {
  return profileComplete ? homeRouteByUserType[user.type] : '/completar-perfil';
}

function RootRedirect() {
  const { profile, status, user } = useAuth();

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (status === 'error') {
    return <SessionErrorScreen />;
  }

  return (
    <Navigate
      replace
      to={
        user && profile
          ? getAuthenticatedDestination(user, isProfileComplete(profile))
          : '/boas-vindas'
      }
    />
  );
}

function PublicOnlyRoute() {
  const { profile, status, user } = useAuth();

  if (status === 'loading') {
    return <SessionLoadingScreen />;
  }

  if (status === 'error') {
    return <SessionErrorScreen />;
  }

  if (!user || !profile) {
    return <Outlet />;
  }

  return <Navigate replace to={getAuthenticatedDestination(user, isProfileComplete(profile))} />;
}

function RequireCompleteProfile() {
  const { profile, user } = useAuth();

  if (!user || !profile) {
    return <Navigate replace to="/entrar" />;
  }

  return isProfileComplete(profile) ? <Outlet /> : <Navigate replace to="/completar-perfil" />;
}

function RequireIncompleteProfile() {
  const { profile, user } = useAuth();

  if (!user || !profile) {
    return <Navigate replace to="/entrar" />;
  }

  return isProfileComplete(profile) ? (
    <Navigate replace to={homeRouteByUserType[user.type]} />
  ) : (
    <Outlet />
  );
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

export {
  PublicOnlyRoute,
  RequireAuthentication,
  RequireCompleteProfile,
  RequireIncompleteProfile,
  RequireRole,
  RootRedirect,
};
