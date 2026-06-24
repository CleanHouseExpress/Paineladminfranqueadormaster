import { test, expect } from '@playwright/test';
import { login } from '../support/auth';
import { users } from '../support/test-data';
import { openHealthy } from '../support/page-health';

test('@release @security admin Centro nao ve dados Norte nas jornadas criticas', async ({ page }) => {
  await login(page, users.centro);

  for (const path of [
    '/sales',
    '/financial',
    '/franchise/documents',
    '/tasks',
    '/analytics',
    '/inventory/transfers',
    '/dre',
    '/royalties',
  ]) {
    await test.step(path, async () => {
      await openHealthy(page, path, { allowBlockedState: true });
      await expect(page.getByText(/Norte/i)).toHaveCount(0);
    });
  }
});

test('@release @security admin Centro recebe bloqueio ao acessar gestao global de unidades', async ({ page }) => {
  await login(page, users.centro);
  await page.goto('/units');
  await expect(page.getByRole('heading', { name: /Sem permiss/i })).toBeVisible();
});

