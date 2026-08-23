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
  const { OwnerJobsPage } = await import('@/features/jobs/pages/owner-jobs-page');
  return { Component: OwnerJobsPage };
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

async function loadAcceptedJobsPage() {
  const { AcceptedJobsPage } = await import('@/features/accepted-jobs/pages/accepted-jobs-page');
  return { Component: AcceptedJobsPage };
}

async function loadLocationsListPage() {
  const { LocationsListPage } = await import('@/features/locals/pages/locations-list-page');
  return { Component: LocationsListPage };
}

async function loadNewLocationPage() {
  const { NewLocationPage } = await import('@/features/locals/pages/new-location-page');
  return { Component: NewLocationPage };
}

async function loadLocationDetailsPage() {
  const { LocationDetailsPage } = await import('@/features/locals/pages/location-details-page');
  return { Component: LocationDetailsPage };
}

async function loadPublishJobPage() {
  const { PublishJobPage } = await import('@/features/jobs/pages/publish-job-page');
  return { Component: PublishJobPage };
}

async function loadOwnerJobDetailsPage() {
  const { OwnerJobDetailsPage } = await import('@/features/jobs/pages/owner-job-details-page');
  return { Component: OwnerJobDetailsPage };
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
                  { path: 'historico', lazy: loadAcceptedJobsPage },
                ],
              },
              {
                element: <RequireRole allow="local_owner" />,
                children: [
                  {
                    path: 'painel',
                    lazy: loadOwnerHomePage,
                  },
                  { path: 'painel/vagas/nova', lazy: loadPublishJobPage },
                  { path: 'painel/vagas/:jobId', lazy: loadOwnerJobDetailsPage },
                  { path: 'locais', lazy: loadLocationsListPage },
                  { path: 'locais/novo', lazy: loadNewLocationPage },
                  { path: 'locais/:locationId', lazy: loadLocationDetailsPage },
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
