import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import type { Job, JobCandidate, JobMutationResult } from '@/features/jobs/job-types';
import type { WorkLocation } from '@/features/locals/local-types';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';
import { renderApp } from '@/test/render-app';

const ownerId = '11111111-1111-4111-8111-111111111111';
const workerId = '99999999-9999-4999-8999-999999999999';
const otherWorkerId = '88888888-8888-4888-8888-888888888888';

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

const openJob: Job = {
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

function toMutationResult(job: Job): JobMutationResult {
  return {
    cancelledAt: job.cancelledAt,
    createdAt: job.createdAt,
    description: job.description,
    durationMinutes: job.durationMinutes,
    id: job.id,
    localId: job.localId,
    startsAt: job.startsAt,
    title: job.title,
    value: job.value,
  };
}

describe('contractor jobs flow', () => {
  let mock: AxiosMockAdapter;
  let candidates: JobCandidate[];

  beforeEach(() => {
    candidates = [];
    mock = new AxiosMockAdapter(httpClient);
    sessionStore.setAccessToken('owner-token');
    mock.onGet('/auth/me').reply(200, { type: 'local_owner', userId: ownerId });
    mock.onGet('/profile').reply(200, ownerProfile);
    mock.onGet(/\/jobs\/[^/]+\/candidates$/).reply(() => [200, candidates]);
  });

  afterEach(() => {
    mock.restore();
  });

  it('shows indicators and filters only jobs that belong to the contractor', async () => {
    const filledJob = {
      ...openJob,
      filled: true,
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Vaga preenchida',
    };
    const cancelledJob = {
      ...openJob,
      cancelledAt: '2026-08-23T12:00:00.000Z',
      id: '55555555-5555-4555-8555-555555555555',
      title: 'Vaga cancelada',
    };
    const anotherOwnerJob = {
      ...openJob,
      id: '66666666-6666-4666-8666-666666666666',
      local: { ...location, ownerId: '77777777-7777-4777-8777-777777777777' },
      title: 'Vaga de outra conta',
    };
    mock.onGet('/jobs').reply(200, [openJob, filledJob, cancelledJob, anotherOwnerJob]);
    const user = userEvent.setup();
    renderApp('/painel');

    const summary = await screen.findByRole('region', { name: 'Resumo das vagas' });
    expect(within(summary).getByText('Abertas').parentElement).toHaveTextContent('1Abertas');
    expect(within(summary).getByText('Preenchidas').parentElement).toHaveTextContent(
      '1Preenchidas',
    );
    expect(within(summary).getByText('Canceladas').parentElement).toHaveTextContent('1Canceladas');
    expect(screen.queryByText('Vaga de outra conta')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Canceladas' }));

    expect(screen.getByText('Vaga cancelada')).toBeVisible();
    expect(screen.queryByText('Organizar o estoque')).not.toBeInTheDocument();
    expect(screen.queryByText('Vaga preenchida')).not.toBeInTheDocument();
  });

  it('publishes a job through short steps and reviews the payload first', async () => {
    const user = userEvent.setup();
    const startsAtLocal = '2099-09-15T09:30';
    const startsAt = new Date(startsAtLocal).toISOString();
    const createdJob: JobMutationResult = {
      ...toMutationResult(openJob),
      description: 'Carregar e organizar os sacos no depósito.',
      durationMinutes: 150,
      startsAt,
      title: 'Carregar sacos',
      value: '250.50',
    };
    mock.onGet('/locals').reply(200, [location]);
    mock.onPost('/jobs').reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        description: 'Carregar e organizar os sacos no depósito.',
        durationMinutes: 150,
        localId: location.id,
        startsAt,
        title: 'Carregar sacos',
        value: 250.5,
      });
      return [201, createdJob];
    });
    mock.onGet(`/jobs/${openJob.id}/accepted`).reply(200, { status: 'pending' });
    const { queryClient, router } = renderApp('/painel/vagas/nova');

    expect(
      await screen.findByRole('heading', { name: 'Qual trabalho você precisa?' }),
    ).toBeVisible();
    expect(screen.getByRole('radio', { name: /Padaria Central/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('O título precisa ter pelo menos 3 caracteres.')).toBeVisible();

    await user.type(screen.getByLabelText('Título do trabalho'), 'Carregar sacos');
    await user.type(
      screen.getByLabelText('O que precisa ser feito?'),
      'Carregar e organizar os sacos no depósito.',
    );
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('heading', { name: 'Quando será o serviço?' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Data e horário'), { target: { value: startsAtLocal } });
    await user.type(screen.getByLabelText('Duração estimada em horas'), '2.5');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('heading', { name: 'Quanto será pago?' })).toBeVisible();
    await user.type(screen.getByLabelText('Valor total'), '250,50');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('heading', { name: 'Revise antes de publicar.' })).toBeVisible();
    expect(screen.getByText('Carregar sacos')).toBeVisible();
    expect(screen.getByText(/250,50/)).toBeVisible();
    expect(mock.history.post).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Publicar vaga' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/painel/vagas/${openJob.id}`));
    expect(await screen.findByRole('heading', { name: 'Carregar sacos' })).toBeVisible();
    expect(queryClient.getQueryData<Job[]>(jobsQueryKeys.ownerList(ownerId))?.[0]).toMatchObject({
      id: openJob.id,
      title: 'Carregar sacos',
    });
  });

  it('cancels an open job only after confirmation and updates cached lists', async () => {
    const user = userEvent.setup();
    const cancelledAt = '2026-08-23T12:00:00.000Z';
    mock.onGet(`/jobs/${openJob.id}`).reply(200, openJob);
    mock.onGet(`/jobs/${openJob.id}/accepted`).reply(200, { status: 'pending' });
    mock
      .onPatch(`/jobs/${openJob.id}/cancel`)
      .reply(200, { ...toMutationResult(openJob), cancelledAt });
    const { queryClient } = renderApp(`/painel/vagas/${openJob.id}`);
    queryClient.setQueryData(jobsQueryKeys.ownerList(ownerId), [openJob]);

    await user.click(await screen.findByRole('button', { name: 'Cancelar vaga' }));
    expect(await screen.findByRole('heading', { name: 'Cancelar esta vaga?' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sim, cancelar vaga' }));

    expect(await screen.findByText('Cancelado')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Cancelar vaga' })).not.toBeInTheDocument();
    expect(
      queryClient.getQueryData<Job[]>(jobsQueryKeys.ownerList(ownerId))?.[0]?.cancelledAt,
    ).toBe(cancelledAt);
  });

  it('shows the winner profile when a job is filled', async () => {
    const filledJob = { ...openJob, filled: true };
    mock.onGet(`/jobs/${filledJob.id}`).reply(200, filledJob);
    mock
      .onGet(`/jobs/${filledJob.id}/accepted`)
      .reply(200, { operatorId: workerId, status: 'finished' });
    mock.onGet(`/profile/${workerId}`).reply(200, {
      bio: 'Pedreiro com experiência em reformas.',
      id: workerId,
      name: 'João da Silva',
      position: 'Pedreiro',
      type: 'operator',
    });
    renderApp(`/painel/vagas/${filledJob.id}`);

    const workerCard = await screen.findByRole('article', { name: 'Trabalhador confirmado' });
    expect(within(workerCard).getByText('João da Silva')).toBeVisible();
    expect(within(workerCard).getByText('Pedreiro')).toBeVisible();
    expect(within(workerCard).getByRole('link', { name: 'Ver perfil completo' })).toHaveAttribute(
      'href',
      `/perfis/${workerId}`,
    );
  });

  it('lists each worker once and lets the contractor choose a candidate', async () => {
    const user = userEvent.setup();
    let acceptanceStatus: { status: 'pending' } | { operatorId: string; status: 'finished' } = {
      status: 'pending',
    };
    candidates = [
      {
        createdAt: '2026-08-23T12:00:00.000Z',
        operatorId: workerId,
        status: 'pending',
      },
      {
        createdAt: '2026-08-23T12:05:00.000Z',
        operatorId: otherWorkerId,
        status: 'pending',
      },
    ];
    mock.onGet(`/jobs/${openJob.id}`).reply(200, openJob);
    mock.onGet(`/jobs/${openJob.id}/accepted`).reply(() => [200, acceptanceStatus]);
    mock.onGet(`/profile/${workerId}`).reply(200, {
      bio: 'Pedreiro com experiência em reformas.',
      id: workerId,
      name: 'João da Silva',
      position: 'Pedreiro',
      type: 'operator',
    });
    mock.onGet(`/profile/${otherWorkerId}`).reply(200, {
      bio: 'Auxiliar com experiência em estoque.',
      id: otherWorkerId,
      name: 'Ana Lima',
      position: 'Auxiliar de estoque',
      type: 'operator',
    });
    mock.onPost(`/jobs/${openJob.id}/candidates/${workerId}/confirm`).reply(() => {
      candidates = [
        { ...candidates[0], status: 'confirmed' },
        { ...candidates[1], status: 'rejected' },
      ];
      acceptanceStatus = { operatorId: workerId, status: 'finished' };
      return [201];
    });
    renderApp(`/painel/vagas/${openJob.id}`);

    const candidateCard = await screen.findByRole('article', { name: 'Candidato: João da Silva' });
    expect(within(candidateCard).getByText('Pedreiro')).toBeVisible();
    await user.click(within(candidateCard).getByRole('button', { name: 'Escolher trabalhador' }));
    expect(await screen.findByRole('heading', { name: 'Escolher João da Silva?' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sim, escolher trabalhador' }));

    expect(await screen.findByRole('article', { name: 'Trabalhador confirmado' })).toBeVisible();
    const rejectedCandidate = await screen.findByRole('article', { name: 'Candidato: Ana Lima' });
    expect(within(rejectedCandidate).getByText('Não escolhido')).toBeVisible();
    expect(mock.history.post).toHaveLength(1);
  });
});
