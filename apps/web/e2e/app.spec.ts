import { expect, test } from '@playwright/test';

test('opens the TrampoFácil application', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('TrampoFácil');
  await expect(page.getByRole('heading', { name: 'TrampoFácil' })).toBeVisible();
});
