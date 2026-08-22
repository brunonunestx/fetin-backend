import { createBrowserRouter, createMemoryRouter, Navigate, type RouteObject } from 'react-router';
import { AuthProvider } from '@/features/auth/auth-provider';
import {
  PublicOnlyRoute,
  RequireAuthentication,
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

async function loadAuthenticatedPlaceholder(
  page: 'CompleteProfilePage' | 'OwnerHomePage' | 'WorkerHomePage',
) {
  const module = await import('@/features/auth/pages/authenticated-placeholders');
  return { Component: module[page] };
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
            path: 'completar-perfil',
            lazy: () => loadAuthenticatedPlaceholder('CompleteProfilePage'),
          },
          {
            element: <RequireRole allow="operator" />,
            children: [
              {
                path: 'trabalhos',
                lazy: () => loadAuthenticatedPlaceholder('WorkerHomePage'),
              },
            ],
          },
          {
            element: <RequireRole allow="local_owner" />,
            children: [
              {
                path: 'painel',
                lazy: () => loadAuthenticatedPlaceholder('OwnerHomePage'),
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
