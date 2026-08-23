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

test('lets a contractor create a location and publish its first job', async ({ page }) => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const startsAtLocal = '2099-09-15T09:30';
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
  const createdJob = {
    cancelledAt: null,
    createdAt: '2026-08-22T12:00:00.000Z',
    description: 'Ajudar na organização do estoque da padaria.',
    durationMinutes: 240,
    id: '33333333-3333-4333-8333-333333333333',
    localId: location.id,
    startsAt: new Date(startsAtLocal).toISOString(),
    title: 'Organizar o estoque',
    value: '180.50',
  };
  const job = { ...createdJob, filled: false, local: location };
  let locationCreated = false;

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
      locationCreated = true;
      return;
    }

    await route.fulfill({
      body: JSON.stringify(locationCreated ? [location] : []),
      contentType: 'application/json',
      status: 200,
    });
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
    await route.fulfill({ body: '[]', contentType: 'application/json', status: 200 });
  });
  await page.route('**/api/jobs', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      description: createdJob.description,
      durationMinutes: createdJob.durationMinutes,
      localId: location.id,
      startsAt: createdJob.startsAt,
      title: createdJob.title,
      value: 180.5,
    });
    await route.fulfill({
      body: JSON.stringify(createdJob),
      contentType: 'application/json',
      status: 201,
    });
  });
  await page.route(`**/api/jobs/${job.id}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify(job),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${job.id}/accepted`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ status: 'pending' }),
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
  await page.getByRole('link', { name: 'Publicar vaga neste local' }).click();

  await expect(page.getByRole('radio', { name: /Padaria Central/ })).toBeChecked();
  await page.getByLabel('Título do trabalho').fill(createdJob.title);
  await page.getByLabel('O que precisa ser feito?').fill(createdJob.description);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Data e horário').fill(startsAtLocal);
  await page.getByLabel('Duração estimada em horas').fill('4');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Valor total').fill('180,50');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Publicar vaga' }).click();

  await expect(page).toHaveURL(new RegExp(`/painel/vagas/${job.id}$`));
  await expect(page.getByRole('heading', { name: job.title })).toBeVisible();
});

test('lets a contractor publish, review and cancel a job', async ({ page }) => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const jobId = '33333333-3333-4333-8333-333333333333';
  const startsAtLocal = '2099-09-15T09:30';
  const startsAt = new Date(startsAtLocal).toISOString();
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
  const createdJob = {
    cancelledAt: null,
    createdAt: '2026-08-22T12:00:00.000Z',
    description: 'Carregar e organizar os sacos no depósito.',
    durationMinutes: 150,
    id: jobId,
    localId: location.id,
    startsAt,
    title: 'Carregar sacos',
    value: '250.50',
  };
  let postRequests = 0;

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
    await route.fulfill({
      body: JSON.stringify([location]),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/jobs', async (route) => {
    if (route.request().method() === 'POST') {
      postRequests += 1;
      expect(route.request().postDataJSON()).toEqual({
        description: createdJob.description,
        durationMinutes: createdJob.durationMinutes,
        localId: location.id,
        startsAt,
        title: createdJob.title,
        value: 250.5,
      });
      await route.fulfill({
        body: JSON.stringify(createdJob),
        contentType: 'application/json',
        status: 201,
      });
      return;
    }

    await route.fulfill({ body: '[]', contentType: 'application/json', status: 200 });
  });
  await page.route(`**/api/jobs/${jobId}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ ...createdJob, filled: false, local: location }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${jobId}/accepted`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ status: 'pending' }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${jobId}/cancel`, async (route) => {
    expect(route.request().method()).toBe('PATCH');
    await route.fulfill({
      body: JSON.stringify({ ...createdJob, cancelledAt: '2026-08-23T12:00:00.000Z' }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/painel/vagas/nova');

  await expect(page.getByRole('radio', { name: /Padaria Central/ })).toBeChecked();
  await page.getByLabel('Título do trabalho').fill(createdJob.title);
  await page.getByLabel('O que precisa ser feito?').fill(createdJob.description);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Data e horário').fill(startsAtLocal);
  await page.getByLabel('Duração estimada em horas').fill('2.5');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Valor total').fill('250,50');
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByRole('heading', { name: 'Revise antes de publicar.' })).toBeVisible();
  await expect(page.getByText('2 horas e 30 minutos')).toBeVisible();
  expect(postRequests).toBe(0);
  await page.getByRole('button', { name: 'Publicar vaga' }).click();

  await expect(page).toHaveURL(new RegExp(`/painel/vagas/${jobId}$`));
  await expect(page.getByRole('heading', { name: createdJob.title })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar vaga' }).click();
  await expect(page.getByRole('heading', { name: 'Cancelar esta vaga?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sim, cancelar vaga' }).click();
  await expect(page.getByText('Cancelado')).toBeVisible();
});

test('serves an offline app shell without caching API responses', async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Service worker inspection is covered in the Chromium mobile project',
  );

  await page.goto('/boas-vindas');

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return response.json() as Promise<Record<string, unknown>>;
  });
  expect(manifest).toMatchObject({
    background_color: '#f8f6f0',
    display: 'standalone',
    id: '/',
    name: 'TrampoFácil',
    start_url: '/',
    theme_color: '#0b6b61',
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192' }),
      expect.objectContaining({ purpose: 'any', sizes: '512x512' }),
      expect.objectContaining({ purpose: 'maskable', sizes: '512x512' }),
    ]),
  );

  await expect.poll(() => context.serviceWorkers().length).toBeGreaterThan(0);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await page.evaluate(async () => {
    const cache = await caches.open('e2e-stale-api-response');
    await cache.put(
      '/api/jobs',
      new Response(JSON.stringify([{ id: 'stale-job' }]), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  try {
    await context.setOffline(true);
    expect(
      await page.evaluate(async () => {
        try {
          await fetch('/api/jobs', { cache: 'no-store' });
          return false;
        } catch {
          return true;
        }
      }),
    ).toBe(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Você está sem internet' })).toBeVisible();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByText('Ainda não encontramos uma conexão.')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await page.evaluate(() => caches.delete('e2e-stale-api-response'));
  }
});

test('guides installation from the iPhone Share menu', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-safari', 'iPhone-only installation guidance');
  await page.goto('/boas-vindas');

  await page.getByRole('button', { name: 'Ver como instalar no iPhone' }).click();

  await expect(page.getByRole('heading', { name: 'Instalar no iPhone' })).toBeVisible();
  await expect(page.getByText('Compartilhar → Adicionar à Tela de Início')).toBeVisible();
});
