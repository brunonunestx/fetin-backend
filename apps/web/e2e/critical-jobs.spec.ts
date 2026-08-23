import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession, ownerProfile, workerProfile } from './support/session';

const location = {
  address: 'Rua das Flores, 120',
  city: 'Pouso Alegre',
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Padaria Central',
  ownerId: ownerProfile.id,
  state: 'MG',
  zipCode: '37550-000',
};

const job = {
  cancelledAt: null,
  createdAt: '2026-08-22T12:00:00.000Z',
  description: 'Preparar e pintar duas paredes da sala.',
  durationMinutes: 240,
  filled: false,
  id: '44444444-4444-4444-8444-444444444444',
  local: location,
  localId: location.id,
  startsAt: '2099-09-15T12:00:00.000Z',
  title: 'Pintura residencial',
  value: '180.50',
};

test('tells a worker when another person wins the job', async ({ page }) => {
  await mockAuthenticatedSession(page, workerProfile);
  await page.route(`**/api/jobs/${job.id}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify(job),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${job.id}/accept`, async (route) => {
    await route.fulfill({ body: '', status: 201 });
  });
  await page.route(`**/api/jobs/${job.id}/accepted`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ operatorId: 'another-worker', status: 'finished' }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto(`/trabalhos/${job.id}`);
  await page.getByRole('button', { name: 'Quero este trabalho' }).click();
  await page.getByRole('button', { name: 'Sim, quero este trabalho' }).click();

  await expect(
    page.getByRole('heading', { name: 'Outra pessoa conseguiu primeiro' }),
  ).toBeVisible();
});

test('lets a contractor open the winning worker profile', async ({ page }) => {
  const filledJob = { ...job, filled: true };
  const publicWorkerProfile = {
    bio: workerProfile.bio,
    id: workerProfile.id,
    name: workerProfile.name,
    position: workerProfile.position,
    type: workerProfile.type,
  };
  await mockAuthenticatedSession(page, ownerProfile);
  await page.route(`**/api/jobs/${job.id}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify(filledJob),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/jobs/${job.id}/accepted`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ operatorId: workerProfile.id, status: 'finished' }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route(`**/api/profile/${workerProfile.id}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify(publicWorkerProfile),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto(`/painel/vagas/${job.id}`);
  const winner = page.getByRole('article', { name: 'Trabalhador confirmado' });
  await expect(winner.getByText('João da Silva')).toBeVisible();
  await winner.getByRole('link', { name: 'Ver perfil completo' }).click();

  await expect(page).toHaveURL(new RegExp(`/perfis/${workerProfile.id}$`));
  await expect(page.getByRole('heading', { name: 'João da Silva' })).toBeVisible();
  await expect(page.getByText('Pedreiro com experiência em reformas.')).toBeVisible();
  await expect(page.getByText(workerProfile.email)).not.toBeVisible();
});
