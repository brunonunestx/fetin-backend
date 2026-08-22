import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';
import { renderApp } from '@/test/render-app';

describe('authentication flows', () => {
  let mock: AxiosMockAdapter;

  beforeEach(() => {
    mock = new AxiosMockAdapter(httpClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('registers a worker, logs in automatically and opens onboarding', async () => {
    const user = userEvent.setup();
    mock.onPost('/auth/register').reply(201, {
      createdAt: '2026-08-22T12:00:00.000Z',
      email: 'trabalhador@example.com',
      id: 'user-1',
      type: 'operator',
    });
    mock.onPost('/auth/login').reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        email: 'trabalhador@example.com',
        password: 'senha-segura',
      });

      return [200, { accessToken: 'worker-token' }];
    });
    mock.onGet('/auth/me').reply(200, { type: 'operator', userId: 'user-1' });
    const { router } = renderApp('/cadastro?tipo=trabalhador');

    expect(await screen.findByRole('radio', { name: 'Quero trabalhar' })).toBeChecked();
    await user.type(screen.getByLabelText('E-mail'), 'trabalhador@example.com');
    await user.type(screen.getByLabelText('Crie uma senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Criar minha conta' }));

    expect(await screen.findByRole('heading', { name: 'Agora falta seu perfil.' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/completar-perfil');
    expect(sessionStore.getAccessToken()).toBe('worker-token');
  });

  it('explains when the account exists but automatic login fails', async () => {
    const user = userEvent.setup();
    mock.onPost('/auth/register').reply(201, {
      createdAt: '2026-08-22T12:00:00.000Z',
      email: 'trabalhador@example.com',
      id: 'user-1',
      type: 'operator',
    });
    mock.onPost('/auth/login').reply(500, {
      code: 'INTERNAL_SERVER_ERROR',
      correlationId: 'request-123',
      message: 'Internal server error',
      statusCode: 500,
    });
    renderApp('/cadastro?tipo=trabalhador');

    await user.type(await screen.findByLabelText('E-mail'), 'trabalhador@example.com');
    await user.type(screen.getByLabelText('Crie uma senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Criar minha conta' }));

    expect(
      await screen.findByText(
        'Sua conta foi criada, mas não conseguimos entrar automaticamente. Entre com o mesmo e-mail e senha.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Código de atendimento: request-123')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Entrar na conta criada' })).toHaveAttribute(
      'href',
      '/entrar',
    );
  });

  it('logs in a contractor and performs local logout', async () => {
    const user = userEvent.setup();
    mock.onPost('/auth/login').reply(200, { accessToken: 'owner-token' });
    mock.onGet('/auth/me').reply(200, { type: 'local_owner', userId: 'owner-1' });
    const { router } = renderApp('/entrar');

    await user.type(await screen.findByLabelText('E-mail'), 'contratante@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Área do contratante')).toBeVisible();
    expect(router.state.location.pathname).toBe('/painel');
    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));

    expect(await screen.findByRole('heading', { name: 'Trabalho perto de você.' })).toBeVisible();
    expect(sessionStore.getAccessToken()).toBeNull();
  });

  it('clears an invalid token and explains the redirect', async () => {
    sessionStore.setAccessToken('invalid-token');
    mock.onGet('/auth/me').reply(401, {
      code: 'INVALID_TOKEN',
      message: 'Token de autenticação inválido ou expirado',
      statusCode: 401,
    });
    const { router } = renderApp('/trabalhos');

    expect(
      await screen.findByText('Sua sessão venceu. Entre novamente para continuar.'),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/entrar');
    expect(sessionStore.getAccessToken()).toBeNull();
  });

  it('redirects a contractor away from worker-only routes', async () => {
    sessionStore.setAccessToken('owner-token');
    mock.onGet('/auth/me').reply(200, { type: 'local_owner', userId: 'owner-1' });
    const { router } = renderApp('/trabalhos');

    expect(await screen.findByText('Área do contratante')).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe('/painel'));
  });
});
