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

  await page.goto('/trabalhos');

  await expect(page).toHaveURL(/\/completar-perfil$/);
  await page.getByLabel('Nome completo').fill('João da Silva');
  await page.getByLabel('Telefone com DDD').fill('35999999999');
  await page.getByLabel('Sua profissão').fill('Pedreiro');
  await page.getByRole('button', { name: 'Concluir meu perfil' }).click();

  await expect(page).toHaveURL(/\/trabalhos$/);
  await expect(page.getByText('Área do trabalhador')).toBeVisible();
});
