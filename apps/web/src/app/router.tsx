import { createBrowserRouter, createMemoryRouter, Navigate, type RouteObject } from 'react-router';
import { AuthProvider } from '@/features/auth/auth-provider';
import {
  PublicOnlyRoute,
  RequireAuthentication,
  RequireCompleteProfile,
  RequireIncompleteProfile,
  RequireRole,
  RootRedirect,
} from '@/features/auth/components/route-gates';
import { SessionLoadingScreen } from '@/features/auth/components/session-screen';

async function loadWelcomePage() {
  const { WelcomePage } = await import('@/features/auth/pages/welcome-page');
  return { Component: WelcomePage };
}

async function loadLoginPage() {
  const { LoginPage } = await import('@/features/auth/pages/login-page');
  return { Component: LoginPage };
}

async function loadRegisterPage() {
  const { RegisterPage } = await import('@/features/auth/pages/register-page');
  return { Component: RegisterPage };
}

async function loadOwnerHomePage() {
  const module = await import('@/features/auth/pages/authenticated-placeholders');
  return { Component: module.OwnerHomePage };
}

async function loadOnboardingPage() {
  const { OnboardingPage } = await import('@/features/profile/pages/onboarding-page');
  return { Component: OnboardingPage };
}

async function loadMyProfilePage() {
  const { MyProfilePage } = await import('@/features/profile/pages/my-profile-page');
  return { Component: MyProfilePage };
}

async function loadPublicProfilePage() {
  const { PublicProfilePage } = await import('@/features/profile/pages/public-profile-page');
  return { Component: PublicProfilePage };
}

async function loadJobsListPage() {
  const { JobsListPage } = await import('@/features/jobs/pages/jobs-list-page');
  return { Component: JobsListPage };
}

async function loadJobDetailsPage() {
  const { JobDetailsPage } = await import('@/features/jobs/pages/job-details-page');
  return { Component: JobDetailsPage };
}

const routes: RouteObject[] = [
  {
    element: <AuthProvider />,
    HydrateFallback: SessionLoadingScreen,
    children: [
      { index: true, element: <RootRedirect /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: 'boas-vindas', lazy: loadWelcomePage },
          { path: 'cadastro', lazy: loadRegisterPage },
          { path: 'entrar', lazy: loadLoginPage },
        ],
      },
      {
        element: <RequireAuthentication />,
        children: [
          {
            element: <RequireIncompleteProfile />,
            children: [{ path: 'completar-perfil', lazy: loadOnboardingPage }],
          },
          {
            element: <RequireCompleteProfile />,
            children: [
              { path: 'perfil', lazy: loadMyProfilePage },
              { path: 'perfis/:userId', lazy: loadPublicProfilePage },
              {
                element: <RequireRole allow="operator" />,
                children: [
                  {
                    path: 'trabalhos',
                    lazy: loadJobsListPage,
                  },
                  { path: 'trabalhos/:jobId', lazy: loadJobDetailsPage },
                ],
              },
              {
                element: <RequireRole allow="local_owner" />,
                children: [
                  {
                    path: 'painel',
                    lazy: loadOwnerHomePage,
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate replace to="/" /> },
    ],
  },
];

const router = createBrowserRouter(routes);

function createTestRouter(initialEntries: string[]) {
  return createMemoryRouter(routes, { initialEntries });
}

export { createTestRouter, router };
