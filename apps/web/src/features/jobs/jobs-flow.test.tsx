import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { acceptedJobsQueryKeys } from '@/features/accepted-jobs/accepted-jobs-query-keys';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import type { Job, JobCandidate } from '@/features/jobs/job-types';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';
import { renderApp } from '@/test/render-app';

const workerId = '11111111-1111-4111-8111-111111111111';
const originalGeolocation = window.navigator.geolocation;

const workerProfile = {
  age: 34,
  bio: 'Pedreiro com experiência em reformas.',
  createdAt: '2026-08-22T12:00:00.000Z',
  email: 'joao@example.com',
  id: workerId,
  name: 'João da Silva',
  phone: '+5535999999999',
  position: 'Pedreiro',
  type: 'operator',
};

const availableJob: Job = {
  cancelledAt: null,
  createdAt: '2026-08-22T12:00:00.000Z',
  description: 'Preparar e pintar duas paredes da sala.',
  durationMinutes: 240,
  filled: false,
  id: 'job-1',
  local: {
    address: 'Rua das Flores, 120',
    city: 'Pouso Alegre',
    id: 'local-1',
    latitude: null,
    longitude: null,
    name: 'Casa da Maria',
    ownerId: '33333333-3333-4333-8333-333333333333',
    state: 'MG',
    zipCode: '37550-000',
  },
  localId: 'local-1',
  startsAt: '2099-09-15T12:00:00.000Z',
  title: 'Pintura residencial',
  value: '180.50',
};

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });
}

function setGeolocation(value: Geolocation | undefined) {
  Object.defineProperty(window.navigator, 'geolocation', { configurable: true, value });
}

describe('worker job flow', () => {
  let mock: AxiosMockAdapter;
  let ownCandidate: JobCandidate | '';

  beforeEach(() => {
    setOnline(true);
    ownCandidate = '';
    mock = new AxiosMockAdapter(httpClient);
    sessionStore.setAccessToken('worker-token');
    mock.onGet('/auth/me').reply(200, { type: 'operator', userId: workerId });
    mock.onGet('/profile').reply(200, workerProfile);
    mock.onGet(/\/jobs\/[^/]+\/candidates\/me$/).reply(() => [200, ownCandidate]);
  });

  afterEach(() => {
    setOnline(true);
    setGeolocation(originalGeolocation);
    mock.restore();
  });

  it('lists only available jobs and searches locally by city', async () => {
    const user = userEvent.setup();
    const cancelledJob = {
      ...availableJob,
      cancelledAt: '2026-08-23T12:00:00.000Z',
      id: 'cancelled-job',
      title: 'Vaga cancelada',
    };
    const filledJob = {
      ...availableJob,
      filled: true,
      id: 'filled-job',
      title: 'Vaga preenchida',
    };
    const pastJob = {
      ...availableJob,
      id: 'past-job',
      startsAt: '2020-09-15T12:00:00.000Z',
      title: 'Vaga encerrada',
    };
    const otherCityJob = {
      ...availableJob,
      id: 'job-2',
      local: { ...availableJob.local, city: 'Itajubá', id: 'local-2', name: 'Loja Central' },
      localId: 'local-2',
      title: 'Descarregar caminhão',
      value: '120.00',
    };
    mock.onGet('/jobs').reply(200, [availableJob, cancelledJob, filledJob, pastJob, otherCityJob]);

    renderApp('/trabalhos');

    expect(
      await screen.findByRole('link', { name: 'Ver trabalho: Pintura residencial' }),
    ).toBeVisible();
    expect(screen.getByText(/180,50/)).toBeVisible();
    expect(screen.getAllByText(/4 horas/)[0]).toBeVisible();
    expect(screen.queryByText('Vaga cancelada')).not.toBeInTheDocument();
    expect(screen.queryByText('Vaga preenchida')).not.toBeInTheDocument();
    expect(screen.queryByText('Vaga encerrada')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Buscar trabalhos'), 'pouso');

    expect(screen.getByText('Pintura residencial')).toBeVisible();
    expect(screen.queryByText('Descarregar caminhão')).not.toBeInTheDocument();
  });

  it('requests location explicitly and orders geolocated jobs by distance', async () => {
    setGeolocation({
      getCurrentPosition: (success) =>
        success({
          coords: { latitude: -22.234567, longitude: -45.987654 },
        } as GeolocationPosition),
    } as Geolocation);
    const user = userEvent.setup();
    const nearJob = {
      ...availableJob,
      distanceKm: 2.36,
      id: 'near-job',
      local: {
        ...availableJob.local,
        id: 'near-local',
        latitude: -22.23,
        longitude: -45.98,
        name: 'Mercado Central',
      },
      localId: 'near-local',
      title: 'Organizar estoque',
    };
    const farJob = {
      ...availableJob,
      distanceKm: 12,
      id: 'far-job',
      local: {
        ...availableJob.local,
        id: 'far-local',
        latitude: -22.4,
        longitude: -46.1,
        name: 'Depósito',
      },
      localId: 'far-local',
      title: 'Descarregar caminhão',
    };
    mock.onGet('/jobs').reply((config) => {
      const params: unknown = config.params;

      if (typeof params === 'object' && params !== null && 'lat' in params) {
        expect(params).toEqual({ lat: -22.23457, lng: -45.98765 });
        return [200, [farJob, nearJob]];
      }

      return [200, [availableJob]];
    });

    renderApp('/trabalhos');

    expect(
      await screen.findByRole('link', { name: 'Ver trabalho: Pintura residencial' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Mais perto de mim' }));

    expect(await screen.findByRole('heading', { name: 'Mais perto primeiro' })).toBeVisible();
    expect(await screen.findByText('A 2,4 km')).toBeVisible();
    expect(screen.getByText('A 12 km')).toBeVisible();
    const cards = screen.getAllByRole('link', { name: /Ver trabalho:/ });
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual([
      'Ver trabalho: Organizar estoque',
      'Ver trabalho: Descarregar caminhão',
    ]);

    await user.click(screen.getByRole('button', { name: 'Ver todas as vagas' }));
    expect(await screen.findByRole('heading', { name: 'Disponíveis agora' })).toBeVisible();
  });

  it('keeps all jobs visible when location permission is denied', async () => {
    setGeolocation({
      getCurrentPosition: (_success, error) => error?.({ code: 1 } as GeolocationPositionError),
    } as Geolocation);
    const user = userEvent.setup();
    mock.onGet('/jobs').reply(200, [availableJob]);

    renderApp('/trabalhos');

    expect(
      await screen.findByRole('link', { name: 'Ver trabalho: Pintura residencial' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Mais perto de mim' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A localização não foi permitida');
    expect(screen.getByText('Pintura residencial')).toBeVisible();
  });

  it('shows the complete address and a link to the contractor profile', async () => {
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);

    renderApp(`/trabalhos/${availableJob.id}`);

    expect(await screen.findByRole('heading', { name: availableJob.title })).toBeVisible();
    expect(screen.getByText(/Rua das Flores, 120/)).toHaveTextContent(
      'Rua das Flores, 120 — Pouso Alegre/MG · CEP 37550-000',
    );
    expect(screen.getByRole('link', { name: 'Ver perfil do contratante' })).toHaveAttribute(
      'href',
      `/perfis/${availableJob.local.ownerId}`,
    );
  });

  it('confirms the candidacy as soon as the request succeeds', async () => {
    const user = userEvent.setup();
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    mock.onPost(`/jobs/${availableJob.id}/accept`).reply(201);
    renderApp(`/trabalhos/${availableJob.id}`);

    await user.click(await screen.findByRole('button', { name: 'Quero me candidatar' }));
    expect(
      await screen.findByRole('heading', { name: 'Quer se candidatar a este trabalho?' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sim, enviar candidatura' }));

    expect(await screen.findByRole('heading', { name: 'Candidatura enviada' })).toBeVisible();
    expect(mock.history.post).toHaveLength(1);
    expect(mock.history.get.some((request) => request.url?.endsWith('/accepted'))).toBe(false);
  });

  it('restores an existing candidacy and does not allow applying again', async () => {
    ownCandidate = {
      createdAt: '2026-08-23T12:00:00.000Z',
      operatorId: workerId,
      status: 'pending',
    };
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    renderApp(`/trabalhos/${availableJob.id}`);

    expect(await screen.findByRole('heading', { name: 'Candidatura enviada' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Quero me candidatar' })).not.toBeInTheDocument();
    expect(mock.history.post).toHaveLength(0);
  });

  it('updates the job and accepted history when the worker is chosen', async () => {
    ownCandidate = {
      createdAt: '2026-08-23T12:00:00.000Z',
      operatorId: workerId,
      status: 'confirmed',
    };
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    const { queryClient } = renderApp(`/trabalhos/${availableJob.id}`);
    queryClient.setQueryData(jobsQueryKeys.list(), [availableJob]);
    queryClient.setQueryData(acceptedJobsQueryKeys.list(), []);

    expect(await screen.findByRole('heading', { name: 'Você foi escolhido' })).toBeVisible();
    await waitFor(() =>
      expect(queryClient.getQueryData<Job[]>(jobsQueryKeys.list())?.[0]?.filled).toBe(true),
    );
    expect(queryClient.getQueryState(acceptedJobsQueryKeys.list())?.isInvalidated).toBe(true);
  });

  it('removes the filled job from discovery when another worker is chosen', async () => {
    ownCandidate = {
      createdAt: '2026-08-23T12:00:00.000Z',
      operatorId: workerId,
      status: 'rejected',
    };
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    const { queryClient } = renderApp(`/trabalhos/${availableJob.id}`);
    queryClient.setQueryData(jobsQueryKeys.list(), [availableJob]);

    expect(
      await screen.findByRole('heading', { name: 'Outra pessoa foi escolhida' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(queryClient.getQueryData<Job[]>(jobsQueryKeys.list())?.[0]?.filled).toBe(true),
    );
  });

  it('allows retrying when the candidacy request fails', async () => {
    const user = userEvent.setup();
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    mock
      .onPost(`/jobs/${availableJob.id}/accept`)
      .replyOnce(500, { code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao enviar candidatura' })
      .onPost(`/jobs/${availableJob.id}/accept`)
      .reply(201);
    renderApp(`/trabalhos/${availableJob.id}`);

    await user.click(await screen.findByRole('button', { name: 'Quero me candidatar' }));
    await user.click(screen.getByRole('button', { name: 'Sim, enviar candidatura' }));

    expect(
      await screen.findByRole('heading', { name: 'Não foi possível continuar' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Candidatura enviada' })).toBeVisible();
    expect(mock.history.post).toHaveLength(2);
  });
});
