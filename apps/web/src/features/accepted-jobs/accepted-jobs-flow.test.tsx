import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AcceptedJob } from '@/features/accepted-jobs/accepted-job-types';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';
import { renderApp } from '@/test/render-app';

const workerId = '11111111-1111-4111-8111-111111111111';

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

const upcomingJob: AcceptedJob = {
  acceptedAt: '2026-08-22T12:00:00.000Z',
  cancelledAt: null,
  description: 'Preparar e pintar duas paredes da sala.',
  durationMinutes: 240,
  jobId: 'job-1',
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

describe('accepted jobs history', () => {
  let mock: AxiosMockAdapter;

  beforeEach(() => {
    mock = new AxiosMockAdapter(httpClient);
    sessionStore.setAccessToken('worker-token');
    mock.onGet('/auth/me').reply(200, { type: 'operator', userId: workerId });
    mock.onGet('/profile').reply(200, workerProfile);
  });

  afterEach(() => {
    mock.restore();
  });

  it('groups jobs and exposes details and contractor profile links', async () => {
    const previousJob = {
      ...upcomingJob,
      jobId: 'job-2',
      startsAt: '2020-06-10T13:00:00.000Z',
      title: 'Reparo em muro',
      value: '250.00',
    };
    const cancelledJob = {
      ...upcomingJob,
      cancelledAt: '2026-08-23T12:00:00.000Z',
      jobId: 'job-3',
      title: 'Serviço cancelado',
    };
    mock.onGet('/me/accepted-jobs').reply(200, [previousJob, cancelledJob, upcomingJob]);

    renderApp('/historico');

    expect(await screen.findByRole('heading', { name: 'Próximos trabalhos' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Trabalhos anteriores' })).toBeVisible();

    const upcomingCard = screen.getByRole('article', { name: 'Pintura residencial' });
    expect(within(upcomingCard).getByText(/180,50/)).toBeVisible();
    expect(within(upcomingCard).getByText('4 horas')).toBeVisible();
    expect(within(upcomingCard).getByText(/Rua das Flores, 120/)).toHaveTextContent(
      'Rua das Flores, 120 — Pouso Alegre/MG · CEP 37550-000',
    );
    expect(within(upcomingCard).getByRole('link', { name: 'Detalhes' })).toHaveAttribute(
      'href',
      `/trabalhos/${upcomingJob.jobId}`,
    );
    expect(within(upcomingCard).getByRole('link', { name: 'Contratante' })).toHaveAttribute(
      'href',
      `/perfis/${upcomingJob.local.ownerId}`,
    );

    const cancelledCard = screen.getByRole('article', { name: 'Serviço cancelado' });
    expect(within(cancelledCard).getByText('Cancelado')).toBeVisible();
  });

  it('offers a direct path to available jobs when history is empty', async () => {
    const user = userEvent.setup();
    mock.onGet('/me/accepted-jobs').reply(200, []);
    mock.onGet('/jobs').reply(200, []);
    const { router } = renderApp('/historico');

    expect(await screen.findByText('Você ainda não tem trabalhos')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Procurar trabalhos' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/trabalhos'));
    expect(await screen.findByText('Nenhum trabalho disponível agora')).toBeVisible();
  });

  it('lets the worker retry after a history request fails', async () => {
    const user = userEvent.setup();
    mock.onGet('/me/accepted-jobs').replyOnce(400, {
      code: 'BAD_REQUEST',
      message: 'Não foi possível buscar o histórico',
      statusCode: 400,
    });
    mock.onGet('/me/accepted-jobs').reply(200, []);
    renderApp('/historico');

    expect(await screen.findByText('Histórico indisponível')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Você ainda não tem trabalhos')).toBeVisible();
  });
});
