import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';
import { renderApp } from '@/test/render-app';

const workerProfile = {
  age: null,
  bio: null,
  createdAt: '2026-08-22T12:00:00.000Z',
  email: 'joao@example.com',
  id: '11111111-1111-4111-8111-111111111111',
  name: null,
  phone: null,
  position: null,
  type: 'operator',
};

const ownerProfile = {
  age: null,
  bio: 'Tenho uma pequena padaria no centro.',
  createdAt: '2026-08-22T12:00:00.000Z',
  email: 'maria@example.com',
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Maria Souza',
  phone: '+5535988887777',
  position: null,
  type: 'local_owner',
};

describe('profile flows', () => {
  let mock: AxiosMockAdapter;

  beforeEach(() => {
    mock = new AxiosMockAdapter(httpClient);
    sessionStore.setAccessToken('access-token');
  });

  afterEach(() => {
    mock.restore();
  });

  it('redirects an incomplete worker to onboarding and saves an E.164 phone', async () => {
    const user = userEvent.setup();
    const completedProfile = {
      ...workerProfile,
      bio: '',
      name: 'João da Silva',
      phone: '+5535999999999',
      position: 'Pedreiro',
    };
    mock.onGet('/auth/me').reply(200, { type: 'operator', userId: workerProfile.id });
    mock.onGet('/profile').reply(200, workerProfile);
    mock.onPatch('/profile').reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        bio: '',
        name: 'João da Silva',
        phone: '+5535999999999',
        position: 'Pedreiro',
      });

      return [200, completedProfile];
    });
    mock.onGet('/jobs').reply(200, []);
    const { router } = renderApp('/trabalhos');

    expect(
      await screen.findByRole('heading', { name: 'Conte qual trabalho você faz.' }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/completar-perfil');

    await user.type(screen.getByLabelText('Nome completo'), 'João da Silva');
    await user.type(screen.getByLabelText('Telefone com DDD'), '35999999999');
    await user.type(screen.getByLabelText('Sua profissão'), 'Pedreiro');
    await user.click(screen.getByRole('button', { name: 'Concluir meu perfil' }));

    expect(await screen.findByText('Nenhum trabalho disponível agora')).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe('/trabalhos'));
  });

  it('shows only the fields needed by a contractor during onboarding', async () => {
    mock.onGet('/auth/me').reply(200, { type: 'local_owner', userId: ownerProfile.id });
    mock.onGet('/profile').reply(200, {
      ...ownerProfile,
      bio: null,
      name: null,
      phone: null,
    });
    renderApp('/completar-perfil');

    expect(await screen.findByRole('heading', { name: 'Como podemos chamar você?' })).toBeVisible();
    expect(screen.getByLabelText('Nome completo')).toBeVisible();
    expect(screen.getByLabelText('Telefone com DDD')).toBeVisible();
    expect(screen.queryByLabelText('Sua profissão')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Idade (opcional)')).not.toBeInTheDocument();
  });

  it('shows and edits the authenticated user profile', async () => {
    const user = userEvent.setup();
    mock.onGet('/auth/me').reply(200, { type: 'local_owner', userId: ownerProfile.id });
    mock.onGet('/profile').reply(200, ownerProfile);
    mock.onPatch('/profile').reply((config) => {
      expect(JSON.parse(String(config.data))).toMatchObject({
        name: 'Maria Oliveira',
        phone: '+5535988887777',
      });

      return [200, { ...ownerProfile, name: 'Maria Oliveira' }];
    });
    renderApp('/perfil');

    expect(await screen.findByRole('heading', { name: 'Maria Souza' })).toBeVisible();
    expect(screen.getByText('maria@example.com')).toBeVisible();
    expect(screen.getByText('(35) 98888-7777')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Nome completo'));
    await user.type(screen.getByLabelText('Nome completo'), 'Maria Oliveira');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('heading', { name: 'Maria Oliveira' })).toBeVisible();
  });

  it('renders only safe fields from another user profile', async () => {
    const publicUserId = '33333333-3333-4333-8333-333333333333';
    mock.onGet('/auth/me').reply(200, { type: 'local_owner', userId: ownerProfile.id });
    mock.onGet('/profile').reply(200, ownerProfile);
    mock.onGet(`/profile/${publicUserId}`).reply(200, {
      bio: 'Faço serviços de pintura há cinco anos.',
      email: 'privado@example.com',
      id: publicUserId,
      name: 'Carlos Lima',
      phone: '+5535999999999',
      position: 'Pintor',
      type: 'operator',
    });
    renderApp(`/perfis/${publicUserId}`);

    expect(await screen.findByRole('heading', { name: 'Carlos Lima' })).toBeVisible();
    expect(screen.getByText('Pintor')).toBeVisible();
    expect(screen.getByText('Faço serviços de pintura há cinco anos.')).toBeVisible();
    expect(screen.queryByText('privado@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('(35) 99999-9999')).not.toBeInTheDocument();
  });
});
