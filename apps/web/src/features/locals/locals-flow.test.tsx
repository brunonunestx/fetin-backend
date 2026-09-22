import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Job } from '@/features/jobs/job-types';
import type { WorkLocation } from '@/features/locals/local-types';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';
import { renderApp } from '@/test/render-app';

const ownerId = '11111111-1111-4111-8111-111111111111';
const originalGeolocation = window.navigator.geolocation;

const ownerProfile = {
  age: null,
  bio: 'Tenho uma pequena padaria no centro.',
  createdAt: '2026-08-22T12:00:00.000Z',
  email: 'maria@example.com',
  id: ownerId,
  name: 'Maria Souza',
  phone: '+5535988887777',
  position: null,
  type: 'local_owner',
};

const location: WorkLocation = {
  address: 'Rua das Flores, 120',
  city: 'Pouso Alegre',
  createdAt: '2026-08-22T12:00:00.000Z',
  id: '22222222-2222-4222-8222-222222222222',
  latitude: null,
  longitude: null,
  name: 'Padaria Central',
  ownerId,
  state: 'MG',
  zipCode: '37550-000',
};

const availableJob: Job = {
  cancelledAt: null,
  createdAt: '2026-08-22T12:00:00.000Z',
  description: 'Ajudar na organização do estoque da padaria.',
  durationMinutes: 240,
  filled: false,
  id: '33333333-3333-4333-8333-333333333333',
  local: location,
  localId: location.id,
  startsAt: '2099-09-15T12:00:00.000Z',
  title: 'Organizar o estoque',
  value: '180.50',
};

function setGeolocation(value: Geolocation | undefined) {
  Object.defineProperty(window.navigator, 'geolocation', { configurable: true, value });
}

describe('contractor locations flow', () => {
  let mock: AxiosMockAdapter;

  beforeEach(() => {
    mock = new AxiosMockAdapter(httpClient);
    sessionStore.setAccessToken('owner-token');
    mock.onGet('/auth/me').reply(200, { type: 'local_owner', userId: ownerId });
    mock.onGet('/profile').reply(200, ownerProfile);
  });

  afterEach(() => {
    setGeolocation(originalGeolocation);
    mock.restore();
  });

  it('lists the contractor locations and opens their details', async () => {
    mock.onGet('/locals').reply(200, [
      location,
      {
        ...location,
        city: 'Itajubá',
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Depósito',
      },
    ]);
    mock.onGet(`/locals/${location.id}`).reply(200, location);
    mock.onGet('/jobs').reply(200, []);
    const user = userEvent.setup();
    const { router } = renderApp('/locais');

    expect(await screen.findByRole('heading', { name: 'Locais cadastrados' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Locais' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Padaria Central')).toBeVisible();
    expect(screen.getByText('Depósito')).toBeVisible();

    await user.click(screen.getByRole('link', { name: 'Ver local: Padaria Central' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/locais/${location.id}`));
    expect(await screen.findByRole('heading', { name: 'Padaria Central' })).toBeVisible();
  });

  it('offers a first-location action when the list is empty', async () => {
    const user = userEvent.setup();
    mock.onGet('/locals').reply(200, []);
    const { router } = renderApp('/locais');

    expect(await screen.findByText('Nenhum local cadastrado')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cadastrar meu primeiro local' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/locais/novo'));
    expect(await screen.findByRole('heading', { name: 'Cadastre um local.' })).toBeVisible();
  });

  it('validates, formats and creates a location using mobile-friendly fields', async () => {
    setGeolocation({
      getCurrentPosition: (success) =>
        success({
          coords: { latitude: -22.234567, longitude: -45.987654 },
        } as GeolocationPosition),
    } as Geolocation);
    const user = userEvent.setup();
    mock.onPost('/locals').reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        address: 'Rua das Flores, 120',
        city: 'Pouso Alegre',
        latitude: -22.23457,
        longitude: -45.98765,
        name: 'Padaria Central',
        state: 'MG',
        zipCode: '37550-000',
      });

      return [201, location];
    });
    mock.onGet('/jobs').reply((config) => {
      expect(config.params).toEqual({ localId: location.id });
      return [200, []];
    });
    const { router } = renderApp('/locais/novo');

    const zipCodeInput = await screen.findByLabelText('CEP');
    expect(zipCodeInput).toHaveAttribute('inputmode', 'numeric');
    expect(zipCodeInput).toHaveAttribute('autocomplete', 'postal-code');

    await user.click(screen.getByRole('button', { name: 'Cadastrar local' }));
    expect(await screen.findByText('O nome precisa ter pelo menos 2 caracteres.')).toBeVisible();
    expect(screen.getByText('Digite um CEP com 8 números.')).toBeVisible();

    await user.type(screen.getByLabelText('Nome do local'), 'Padaria Central');
    await user.type(screen.getByLabelText('Endereço'), 'Rua das Flores, 120');
    await user.type(screen.getByLabelText('Cidade'), 'Pouso Alegre');
    await user.type(zipCodeInput, '37550000');
    await user.type(screen.getByLabelText('UF'), 'mg');

    expect(zipCodeInput).toHaveValue('37550-000');
    expect(screen.getByLabelText('UF')).toHaveValue('MG');
    await user.click(screen.getByRole('button', { name: 'Usar localização atual' }));
    expect(await screen.findByText('Localização adicionada ao cadastro.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cadastrar local' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/locais/${location.id}`));
    expect(await screen.findByText('Nenhuma vaga neste local')).toBeVisible();
  });

  it('shows only the jobs returned for the selected location with their statuses', async () => {
    const cancelledJob = {
      ...availableJob,
      cancelledAt: '2026-08-23T12:00:00.000Z',
      id: '55555555-5555-4555-8555-555555555555',
      title: 'Vaga cancelada',
    };
    const filledJob = {
      ...availableJob,
      filled: true,
      id: '66666666-6666-4666-8666-666666666666',
      title: 'Vaga preenchida',
    };
    mock.onGet(`/locals/${location.id}`).reply(200, location);
    mock.onGet('/jobs').reply((config) => {
      expect(config.params).toEqual({ localId: location.id });
      return [200, [availableJob, cancelledJob, filledJob]];
    });
    renderApp(`/locais/${location.id}`);

    expect(await screen.findByRole('heading', { name: 'Vagas cadastradas' })).toBeVisible();
    const availableCard = await screen.findByRole('article', { name: 'Organizar o estoque' });
    expect(availableCard).toBeVisible();
    expect(screen.getByText('Disponível')).toBeVisible();
    expect(screen.getByText('Cancelado')).toBeVisible();
    expect(screen.getByText('Preenchido')).toBeVisible();
    expect(screen.getByText(/Rua das Flores, 120/)).toHaveTextContent(
      'Rua das Flores, 120 — Pouso Alegre/MG · CEP 37550-000',
    );
    expect(screen.queryByRole('button', { name: /editar|excluir/i })).not.toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Organizar o estoque')).toBeVisible();
  });
});
