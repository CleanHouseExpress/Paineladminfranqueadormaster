import { test, expect } from '@playwright/test';
import { login } from '../support/auth';
import { users } from '../support/test-data';
import { openHealthy } from '../support/page-health';

test('@release @portal portal franqueado cobre modulos da unidade Centro sem dados Norte', async ({ page }) => {
  await login(page, users.centro);

  for (const path of [
    '/franchise/dashboard',
    '/franchise/sales',
    '/franchise/financial',
    '/franchise/dre',
    '/franchise/royalties',
    '/franchise/cmv',
    '/franchise/inventory',
    '/franchise/tasks',
  ]) {
    await openHealthy(page, path, { allowBlockedState: true });
    await expect(page.getByText(/Norte/i)).toHaveCount(0);
  }

  await expect(page.getByText(/Centro|Unidade/i).first()).toBeVisible();
  await expect(page.getByText(/todas as unidades|seletor global/i)).toHaveCount(0);
});

