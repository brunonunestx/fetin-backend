import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession, workerProfile } from './support/session';

const job = {
  cancelledAt: null,
  createdAt: '2026-09-22T12:00:00.000Z',
  description: 'Separar produtos e organizar as prateleiras por setor.',
  durationMinutes: 240,
  filled: false,
  id: '11111111-aaaa-4111-8111-111111111111',
  local: {
    address: 'Rua das Flores, 120',
    city: 'Pouso Alegre',
    id: '22222222-aaaa-4222-8222-222222222222',
    latitude: null,
    longitude: null,
    name: 'Mercado Central',
    ownerId: '33333333-aaaa-4333-8333-333333333333',
    state: 'MG',
    zipCode: '37550-000',
  },
  localId: '22222222-aaaa-4222-8222-222222222222',
  startsAt: '2099-10-15T12:00:00.000Z',
  title: 'Organizar estoque',
  value: '180.50',
};

test('adapts navigation and job cards from 320px to desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Responsive geometry runs in Chromium');

  await mockAuthenticatedSession(page, workerProfile);
  await page.route('**/api/jobs', async (route) => {
    await route.fulfill({
      body: JSON.stringify(
        Array.from({ length: 6 }, (_, index) => ({
          ...job,
          id: `${index + 1}1111111-aaaa-4111-8111-111111111111`,
          local: { ...job.local, id: `${index + 1}2222222-aaaa-4222-8222-222222222222` },
          localId: `${index + 1}2222222-aaaa-4222-8222-222222222222`,
          title: `${job.title} ${index + 1}`,
        })),
      ),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/trabalhos');

  const navigation = page.getByRole('navigation', { name: 'Navegação principal' });
  const heading = page.getByRole('heading', { name: 'Encontre seu próximo serviço.' });
  const cards = page.getByRole('link', { name: /Ver trabalho:/ });
  await expect(cards).toHaveCount(6);

  const desktopNavigationBox = await navigation.boundingBox();
  const desktopHeadingBox = await heading.boundingBox();
  const firstDesktopCard = await cards.nth(0).boundingBox();
  const secondDesktopCard = await cards.nth(1).boundingBox();

  expect(desktopNavigationBox).not.toBeNull();
  expect(desktopHeadingBox).not.toBeNull();
  expect(desktopNavigationBox!.x).toBeLessThan(desktopHeadingBox!.x);
  expect(desktopNavigationBox!.height).toBeGreaterThan(desktopNavigationBox!.width);
  expect(Math.abs(firstDesktopCard!.y - secondDesktopCard!.y)).toBeLessThan(2);

  await page.setViewportSize({ height: 1024, width: 768 });
  const tabletNavigationBox = await navigation.boundingBox();
  const tabletHeadingBox = await heading.boundingBox();
  const firstTabletCard = await cards.nth(0).boundingBox();
  const secondTabletCard = await cards.nth(1).boundingBox();

  expect(tabletNavigationBox!.y).toBeGreaterThan(tabletHeadingBox!.y);
  expect(tabletNavigationBox!.width).toBeGreaterThan(tabletNavigationBox!.height);
  expect(tabletNavigationBox!.y + tabletNavigationBox!.height).toBeLessThanOrEqual(1025);
  expect(Math.abs(firstTabletCard!.y - secondTabletCard!.y)).toBeLessThan(2);

  await page.setViewportSize({ height: 800, width: 320 });
  const mobileNavigationBox = await navigation.boundingBox();
  const firstMobileCard = await cards.nth(0).boundingBox();
  const secondMobileCard = await cards.nth(1).boundingBox();
  const dimensions = await page.evaluate(() => ({
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(mobileNavigationBox!.y + mobileNavigationBox!.height).toBeLessThanOrEqual(801);
  expect(secondMobileCard!.y).toBeGreaterThan(firstMobileCard!.y + firstMobileCard!.height);
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});
