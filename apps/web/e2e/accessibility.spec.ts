import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mockAuthenticatedSession, ownerProfile, workerProfile } from './support/session';

async function expectNoAccessibilityViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(
    violations.map(({ help, id, nodes }) => ({
      help,
      id,
      targets: nodes.flatMap((node) => node.target),
    })),
  ).toEqual([]);
}

test('passes automated accessibility checks on public screens', async ({ page }) => {
  const routes = ['/boas-vindas', '/entrar', '/cadastro?tipo=trabalhador'];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await expectNoAccessibilityViolations(page);
  }
});

test('passes automated accessibility checks on the worker home', async ({ page }) => {
  await mockAuthenticatedSession(page, workerProfile);
  await page.route('**/api/jobs', async (route) => {
    await route.fulfill({ body: '[]', contentType: 'application/json', status: 200 });
  });

  await page.goto('/trabalhos');
  await expect(page.getByText('Nenhum trabalho disponível agora')).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('passes automated accessibility checks on the contractor home', async ({ page }) => {
  await mockAuthenticatedSession(page, ownerProfile);
  await page.route('**/api/jobs', async (route) => {
    await route.fulfill({ body: '[]', contentType: 'application/json', status: 200 });
  });

  await page.goto('/painel');
  await expect(page.getByText('Nenhuma vaga publicada')).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('supports keyboard focus and reduced motion', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Keyboard focus behavior is covered once in Chromium',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/boas-vindas');
  const workerLink = page.getByRole('link', { name: /Buscar um serviço/ });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reachedWorkerLink = await workerLink.evaluate(
      (element) => element === document.activeElement,
    );

    if (reachedWorkerLink) {
      break;
    }

    await page.keyboard.press('Tab');
  }

  await expect(workerLink).toBeFocused();
  const focusStyles = await workerLink.evaluate((element) => {
    const styles = getComputedStyle(element);
    const transitionMilliseconds = styles.transitionDuration.split(',').map((duration) => {
      const value = Number.parseFloat(duration);
      return duration.trim().endsWith('ms') ? value : value * 1000;
    });

    return {
      boxShadow: styles.boxShadow,
      maximumTransitionMilliseconds: Math.max(...transitionMilliseconds),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  expect(focusStyles.reducedMotion).toBe(true);
  expect(focusStyles.boxShadow).not.toBe('none');
  expect(focusStyles.maximumTransitionMilliseconds).toBeLessThanOrEqual(0.1);

  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/cadastro\?tipo=trabalhador$/);
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeFocused();
});
