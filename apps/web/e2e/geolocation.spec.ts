import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession, workerProfile } from './support/session';

const baseJob = {
  cancelledAt: null,
  createdAt: '2026-08-22T12:00:00.000Z',
  description: 'Ajudar na organização do estoque. Mantenha os produtos separados por setor.',
  durationMinutes: 240,
  filled: false,
  id: '11111111-aaaa-4111-8111-111111111111',
  local: {
    address: 'Rua das Flores, 120',
    city: 'Pouso Alegre',
    id: '22222222-aaaa-4222-8222-222222222222',
    latitude: -22.23,
    longitude: -45.98,
    name: 'Mercado Central',
    ownerId: '33333333-aaaa-4333-8333-333333333333',
    state: 'MG',
    zipCode: '37550-000',
  },
  localId: '22222222-aaaa-4222-8222-222222222222',
  startsAt: '2099-09-15T12:00:00.000Z',
  title: 'Organizar estoque',
  value: '180.50',
};

test('orders jobs by distance only after the worker requests location', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -22.234567, longitude: -45.987654 });
  await mockAuthenticatedSession(page, workerProfile);
  let proximityRequest: URL | undefined;

  await page.route(/\/api\/jobs(?:\?.*)?$/, async (route) => {
    const requestUrl = new URL(route.request().url());

    if (requestUrl.searchParams.has('lat')) {
      proximityRequest = requestUrl;
      await route.fulfill({
        body: JSON.stringify([
          { ...baseJob, distanceKm: 2.36 },
          {
            ...baseJob,
            distanceKm: 12,
            id: '44444444-aaaa-4444-8444-444444444444',
            local: {
              ...baseJob.local,
              id: '55555555-aaaa-4555-8555-555555555555',
              name: 'Depósito',
            },
            localId: '55555555-aaaa-4555-8555-555555555555',
            title: 'Descarregar caminhão',
          },
        ]),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify([baseJob]),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/trabalhos');

  await expect(page.getByText('Organizar estoque')).toBeVisible();
  await page.getByRole('button', { name: 'Mais perto de mim' }).click();

  await expect(page.getByRole('heading', { name: 'Mais perto primeiro' })).toBeVisible();
  await expect(page.getByText('A 2,4 km')).toBeVisible();
  await expect(page.getByText('A 12 km')).toBeVisible();
  expect(proximityRequest?.searchParams.get('lat')).toBe('-22.23457');
  expect(proximityRequest?.searchParams.get('lng')).toBe('-45.98765');

  await page.getByRole('button', { name: 'Ver todas as vagas' }).click();
  await expect(page.getByRole('heading', { name: 'Disponíveis agora' })).toBeVisible();
});
