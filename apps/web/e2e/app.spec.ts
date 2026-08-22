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
