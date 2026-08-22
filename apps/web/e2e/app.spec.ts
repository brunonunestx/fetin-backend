import { expect, test } from '@playwright/test';

test('offers both role paths on the welcome screen', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('TrampoFácil');
  await expect(page.getByRole('heading', { name: 'Trabalho perto de você.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Buscar um serviço/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Contratar alguém/ })).toBeVisible();
});

test('opens registration with the role selected from the welcome screen', async ({ page }) => {
  await page.goto('/boas-vindas');

  await page.getByRole('link', { name: /Buscar um serviço/ }).click();

  await expect(page).toHaveURL(/\/cadastro\?tipo=trabalhador$/);
  await expect(page.getByRole('radio', { name: 'Quero trabalhar' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Criar minha conta' })).toBeVisible();
});

test('redirects anonymous users from a protected route to login', async ({ page }) => {
  await page.goto('/painel');

  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole('heading', { name: 'Bom ter você de volta.' })).toBeVisible();
});

test('guides an incomplete worker through profile setup', async ({ page }) => {
  const incompleteProfile = {
    age: null,
    bio: null,
    createdAt: '2026-08-22T12:00:00.000Z',
    email: 'trabalhador@example.com',
    id: '11111111-1111-4111-8111-111111111111',
    name: null,
    phone: null,
    position: null,
    type: 'operator',
  };

  await page.addInitScript({
    content: "globalThis.localStorage.setItem('trampofacil.access-token', 'worker-token');",
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ type: 'operator', userId: incompleteProfile.id }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/profile', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        body: JSON.stringify({
          ...incompleteProfile,
          bio: '',
          name: 'João da Silva',
          phone: '+5535999999999',
          position: 'Pedreiro',
        }),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify(incompleteProfile),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/jobs', async (route) => {
    await route.fulfill({
      body: '[]',
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/trabalhos');

  await expect(page).toHaveURL(/\/completar-perfil$/);
  await page.getByLabel('Nome completo').fill('João da Silva');
  await page.getByLabel('Telefone com DDD').fill('35999999999');
  await page.getByLabel('Sua profissão').fill('Pedreiro');
  await page.getByRole('button', { name: 'Concluir meu perfil' }).click();

  await expect(page).toHaveURL(/\/trabalhos$/);
  await expect(page.getByText('Nenhum trabalho disponível agora')).toBeVisible();
});

test('lets a worker discover and accept an available job', async ({ page }) => {
  const workerId = '11111111-1111-4111-8111-111111111111';
  const job = {
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
  let statusRequests = 0;

  await page.addInitScript({
    content: "globalThis.localStorage.setItem('trampofacil.access-token', 'worker-token');",
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ type: 'operator', userId: workerId }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/profile', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        age: 34,
        bio: 'Pedreiro com experiência em reformas.',
        createdAt: '2026-08-22T12:00:00.000Z',
        email: 'joao@example.com',
        id: workerId,
        name: 'João da Silva',
        phone: '+5535999999999',
        position: 'Pedreiro',
        type: 'operator',
      }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/jobs', async (route) => {
    await route.fulfill({
      body: JSON.stringify([job]),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${job.id}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify(job),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${job.id}/accept`, async (route) => {
    await route.fulfill({
      body: '',
      status: 201,
    });
  });
  await page.route(`**/api/jobs/${job.id}/accepted`, async (route) => {
    statusRequests += 1;
    await route.fulfill({
      body: JSON.stringify(
        statusRequests === 1 ? { status: 'pending' } : { operatorId: workerId, status: 'finished' },
      ),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/trabalhos');

  await expect(page.getByRole('link', { name: 'Ver trabalho: Pintura residencial' })).toBeVisible();
  await page.getByRole('link', { name: 'Ver trabalho: Pintura residencial' }).click();
  await expect(page.getByText(/Rua das Flores, 120/)).toBeVisible();
  await page.getByRole('button', { name: 'Quero este trabalho' }).click();
  await expect(page.getByRole('heading', { name: 'Quer aceitar este trabalho?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sim, quero este trabalho' }).click();

  await expect(page.getByRole('heading', { name: 'A vaga é sua' })).toBeVisible();
});

test('shows the worker accepted-jobs history', async ({ page }) => {
  const workerId = '11111111-1111-4111-8111-111111111111';
  const upcomingJob = {
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
  const previousJob = {
    ...upcomingJob,
    jobId: 'job-2',
    startsAt: '2020-06-10T13:00:00.000Z',
    title: 'Reparo em muro',
  };

  await page.addInitScript({
    content: "globalThis.localStorage.setItem('trampofacil.access-token', 'worker-token');",
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ type: 'operator', userId: workerId }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/profile', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        age: 34,
        bio: 'Pedreiro com experiência em reformas.',
        createdAt: '2026-08-22T12:00:00.000Z',
        email: 'joao@example.com',
        id: workerId,
        name: 'João da Silva',
        phone: '+5535999999999',
        position: 'Pedreiro',
        type: 'operator',
      }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/me/accepted-jobs', async (route) => {
    await route.fulfill({
      body: JSON.stringify([previousJob, upcomingJob]),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${upcomingJob.jobId}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        ...upcomingJob,
        createdAt: '2026-08-22T12:00:00.000Z',
        filled: true,
        id: upcomingJob.jobId,
      }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/historico');

  await expect(page.getByRole('heading', { name: 'Próximos trabalhos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Trabalhos anteriores' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Histórico' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page
    .getByRole('article', { name: upcomingJob.title })
    .getByRole('link', { name: 'Detalhes' })
    .click();

  await expect(page).toHaveURL(new RegExp(`/trabalhos/${upcomingJob.jobId}$`));
  await expect(page.getByRole('heading', { name: upcomingJob.title })).toBeVisible();
});

test('lets a contractor create a location and see its jobs', async ({ page }) => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const location = {
    address: 'Rua das Flores, 120',
    city: 'Pouso Alegre',
    createdAt: '2026-08-22T12:00:00.000Z',
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Padaria Central',
    ownerId,
    state: 'MG',
    zipCode: '37550-000',
  };
  const job = {
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

  await page.addInitScript({
    content: "globalThis.localStorage.setItem('trampofacil.access-token', 'owner-token');",
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ type: 'local_owner', userId: ownerId }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/profile', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        age: null,
        bio: 'Tenho uma pequena padaria no centro.',
        createdAt: '2026-08-22T12:00:00.000Z',
        email: 'maria@example.com',
        id: ownerId,
        name: 'Maria Souza',
        phone: '+5535988887777',
        position: null,
        type: 'local_owner',
      }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/locals', async (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        address: location.address,
        city: location.city,
        name: location.name,
        state: location.state,
        zipCode: location.zipCode,
      });
      await route.fulfill({
        body: JSON.stringify(location),
        contentType: 'application/json',
        status: 201,
      });
      return;
    }

    await route.fulfill({ body: '[]', contentType: 'application/json', status: 200 });
  });
  await page.route(`**/api/locals/${location.id}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify(location),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/jobs?*', async (route) => {
    expect(new URL(route.request().url()).searchParams.get('localId')).toBe(location.id);
    await route.fulfill({
      body: JSON.stringify([job]),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/locais');

  await expect(page.getByText('Nenhum local cadastrado')).toBeVisible();
  await page.getByRole('button', { name: 'Cadastrar meu primeiro local' }).click();
  await expect(page.getByLabel('CEP')).toHaveAttribute('inputmode', 'numeric');
  await page.getByLabel('Nome do local').fill(location.name);
  await page.getByLabel('Endereço').fill(location.address);
  await page.getByLabel('Cidade').fill(location.city);
  await page.getByLabel('CEP').fill('37550000');
  await page.getByLabel('UF').fill('mg');
  await page.getByRole('button', { name: 'Cadastrar local' }).click();

  await expect(page).toHaveURL(new RegExp(`/locais/${location.id}$`));
  await expect(page.getByRole('heading', { name: location.name })).toBeVisible();
  await expect(page.getByRole('article', { name: job.title })).toBeVisible();
  await expect(page.getByText('Disponível')).toBeVisible();
});
