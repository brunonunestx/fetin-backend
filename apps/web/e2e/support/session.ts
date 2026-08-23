import type { Page } from '@playwright/test';

type UserType = 'local_owner' | 'operator';

type Profile = {
  age: number | null;
  bio: string | null;
  createdAt: string;
  email: string;
  id: string;
  name: string | null;
  phone: string | null;
  position: string | null;
  type: UserType;
};

const workerProfile: Profile = {
  age: 34,
  bio: 'Pedreiro com experiência em reformas.',
  createdAt: '2026-08-22T12:00:00.000Z',
  email: 'joao@example.com',
  id: '11111111-1111-4111-8111-111111111111',
  name: 'João da Silva',
  phone: '+5535999999999',
  position: 'Pedreiro',
  type: 'operator',
};

const ownerProfile: Profile = {
  age: null,
  bio: 'Tenho uma pequena padaria no centro.',
  createdAt: '2026-08-22T12:00:00.000Z',
  email: 'maria@example.com',
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Maria Souza',
  phone: '+5535988887777',
  position: null,
  type: 'local_owner',
};

async function mockSessionRequests(page: Page, profile: Profile) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ type: profile.type, userId: profile.id }),
      contentType: 'application/json',
      status: 200,
    });
  });
  await page.route('**/api/profile', async (route) => {
    await route.fulfill({
      body: JSON.stringify(profile),
      contentType: 'application/json',
      status: 200,
    });
  });
}

async function mockAuthenticatedSession(page: Page, profile: Profile) {
  await page.addInitScript(
    (token) => globalThis.localStorage.setItem('trampofacil.access-token', token),
    `${profile.type}-token`,
  );
  await mockSessionRequests(page, profile);
}

export { mockAuthenticatedSession, mockSessionRequests, ownerProfile, workerProfile };
export type { Profile, UserType };
