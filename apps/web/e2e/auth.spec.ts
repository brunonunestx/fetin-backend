import { expect, test } from '@playwright/test';
import { mockSessionRequests, ownerProfile, workerProfile, type Profile } from './support/session';

const scenarios: {
  emptyHeading: string;
  homePath: string;
  onboardingHeading: string;
  profile: Profile;
  roleLabel: string;
}[] = [
  {
    emptyHeading: 'Nenhum trabalho disponível agora',
    homePath: '/trabalhos',
    onboardingHeading: 'Conte qual trabalho você faz.',
    profile: workerProfile,
    roleLabel: 'Quero trabalhar',
  },
  {
    emptyHeading: 'Nenhuma vaga publicada',
    homePath: '/painel',
    onboardingHeading: 'Como podemos chamar você?',
    profile: ownerProfile,
    roleLabel: 'Quero contratar',
  },
];

for (const scenario of scenarios) {
  const roleName = scenario.profile.type === 'operator' ? 'worker' : 'contractor';

  test(`registers and signs in a ${roleName}`, async ({ page }) => {
    const incompleteProfile = {
      ...scenario.profile,
      age: null,
      bio: null,
      name: null,
      phone: null,
      position: null,
    };
    await page.route('**/api/auth/register', async (route) => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toEqual({
        email: scenario.profile.email,
        password: 'senha-segura',
        type: scenario.profile.type,
      });
      await route.fulfill({
        body: JSON.stringify({
          createdAt: incompleteProfile.createdAt,
          email: incompleteProfile.email,
          id: incompleteProfile.id,
          type: incompleteProfile.type,
        }),
        contentType: 'application/json',
        status: 201,
      });
    });
    await page.route('**/api/auth/login', async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        email: scenario.profile.email,
        password: 'senha-segura',
      });
      await route.fulfill({
        body: JSON.stringify({ accessToken: `${scenario.profile.type}-token` }),
        contentType: 'application/json',
        status: 200,
      });
    });
    await mockSessionRequests(page, incompleteProfile);

    await page.goto('/cadastro');
    await page.getByText(scenario.roleLabel, { exact: true }).click();
    await expect(page.getByRole('radio', { name: scenario.roleLabel })).toBeChecked();
    await page.getByLabel('E-mail').fill(scenario.profile.email);
    await page.getByLabel('Crie uma senha').fill('senha-segura');
    await page.getByRole('button', { name: 'Criar minha conta' }).click();

    await expect(page).toHaveURL(/\/completar-perfil$/);
    await expect(page.getByRole('heading', { name: scenario.onboardingHeading })).toBeVisible();
  });

  test(`logs in a ${roleName} and opens the correct home`, async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toEqual({
        email: scenario.profile.email,
        password: 'senha-segura',
      });
      await route.fulfill({
        body: JSON.stringify({ accessToken: `${scenario.profile.type}-token` }),
        contentType: 'application/json',
        status: 200,
      });
    });
    await mockSessionRequests(page, scenario.profile);
    await page.route('**/api/jobs', async (route) => {
      await route.fulfill({ body: '[]', contentType: 'application/json', status: 200 });
    });

    await page.goto('/entrar');
    await page.getByLabel('E-mail').fill(scenario.profile.email);
    await page.getByLabel('Senha', { exact: true }).fill('senha-segura');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`${scenario.homePath}$`));
    await expect(page.getByText(scenario.emptyHeading)).toBeVisible();
  });
}
