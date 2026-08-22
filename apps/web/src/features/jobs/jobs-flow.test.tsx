import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import type { Job } from '@/features/jobs/job-types';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';
import { renderApp } from '@/test/render-app';

const workerId = '11111111-1111-4111-8111-111111111111';
const otherWorkerId = '22222222-2222-4222-8222-222222222222';

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

describe('worker job flow', () => {
  let mock: AxiosMockAdapter;

  beforeEach(() => {
    setOnline(true);
    mock = new AxiosMockAdapter(httpClient);
    sessionStore.setAccessToken('worker-token');
    mock.onGet('/auth/me').reply(200, { type: 'operator', userId: workerId });
    mock.onGet('/profile').reply(200, workerProfile);
  });

  afterEach(() => {
    setOnline(true);
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

  it('confirms the acceptance, announces a win and updates cached jobs', async () => {
    const user = userEvent.setup();
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    mock.onPost(`/jobs/${availableJob.id}/accept`).reply(201);
    mock.onGet(`/jobs/${availableJob.id}/accepted`).replyOnce(200, { status: 'pending' });
    mock
      .onGet(`/jobs/${availableJob.id}/accepted`)
      .reply(200, { operatorId: workerId, status: 'finished' });
    const { queryClient } = renderApp(`/trabalhos/${availableJob.id}`);
    queryClient.setQueryData(jobsQueryKeys.list(), [availableJob]);

    await user.click(await screen.findByRole('button', { name: 'Quero este trabalho' }));
    expect(
      await screen.findByRole('heading', { name: 'Quer aceitar este trabalho?' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sim, quero este trabalho' }));

    expect(await screen.findByRole('heading', { name: 'Confirmando seu aceite' })).toBeVisible();
    expect(
      await screen.findByRole('heading', { name: 'A vaga é sua' }, { timeout: 4_000 }),
    ).toBeVisible();
    await waitFor(() =>
      expect(queryClient.getQueryData<Job[]>(jobsQueryKeys.list())?.[0]?.filled).toBe(true),
    );
  });

  it('announces when another worker gets the job first', async () => {
    const user = userEvent.setup();
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    mock.onPost(`/jobs/${availableJob.id}/accept`).reply(201);
    mock
      .onGet(`/jobs/${availableJob.id}/accepted`)
      .reply(200, { operatorId: otherWorkerId, status: 'finished' });
    renderApp(`/trabalhos/${availableJob.id}`);

    await user.click(await screen.findByRole('button', { name: 'Quero este trabalho' }));
    await user.click(screen.getByRole('button', { name: 'Sim, quero este trabalho' }));

    expect(
      await screen.findByRole('heading', { name: 'Outra pessoa conseguiu primeiro' }),
    ).toBeVisible();
  });

  it('stops checking the result after leaving the details screen', async () => {
    const user = userEvent.setup();
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    mock.onPost(`/jobs/${availableJob.id}/accept`).reply(201);
    mock.onGet(`/jobs/${availableJob.id}/accepted`).reply(200, { status: 'pending' });
    const renderedApp = renderApp(`/trabalhos/${availableJob.id}`);

    await user.click(await screen.findByRole('button', { name: 'Quero este trabalho' }));
    await user.click(screen.getByRole('button', { name: 'Sim, quero este trabalho' }));
    expect(await screen.findByRole('heading', { name: 'Confirmando seu aceite' })).toBeVisible();
    await waitFor(() =>
      expect(mock.history.get.filter((request) => request.url?.endsWith('/accepted'))).toHaveLength(
        1,
      ),
    );

    renderedApp.unmount();
    await new Promise((resolve) => window.setTimeout(resolve, 1_700));

    expect(mock.history.get.filter((request) => request.url?.endsWith('/accepted'))).toHaveLength(
      1,
    );
  });

  it('pauses result checks when the device loses its connection', async () => {
    const user = userEvent.setup();
    mock.onGet(`/jobs/${availableJob.id}`).reply(200, availableJob);
    mock.onPost(`/jobs/${availableJob.id}/accept`).reply(201);
    mock.onGet(`/jobs/${availableJob.id}/accepted`).reply(200, { status: 'pending' });
    renderApp(`/trabalhos/${availableJob.id}`);

    await user.click(await screen.findByRole('button', { name: 'Quero este trabalho' }));
    await user.click(screen.getByRole('button', { name: 'Sim, quero este trabalho' }));
    await waitFor(() =>
      expect(mock.history.get.filter((request) => request.url?.endsWith('/accepted'))).toHaveLength(
        1,
      ),
    );

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(await screen.findByRole('heading', { name: 'Você está sem conexão' })).toBeVisible();
    await new Promise((resolve) => window.setTimeout(resolve, 1_700));
    expect(mock.history.get.filter((request) => request.url?.endsWith('/accepted'))).toHaveLength(
      1,
    );
  });
});
