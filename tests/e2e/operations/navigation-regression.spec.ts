import { test, expect } from '../support/fixtures';
import { login } from '../support/auth';
import { users } from '../support/test-data';
import { openHealthy } from '../support/page-health';

test('@release navegacao completa abre rotas criticas sem erro tecnico', async ({ page }) => {
  await login(page, users.master);

  for (const path of [
    '/dashboard',
    '/crm',
    '/sales',
    '/financial',
    '/inventory',
    '/inventory/transfers',
    '/inventory/counts',
    '/dre',
    '/dre/goals',
    '/dre/history',
    '/dre/projection',
    '/royalties',
    '/royalties/periods',
    '/analytics',
    '/analytics/templates',
    '/noc',
    '/automation',
    '/tasks',
  ]) {
    await test.step(path, async () => {
      await openHealthy(page, path, { allowBlockedState: true });
    });
  }
});

test('@release @portal rota do portal franqueado renderiza dashboard da unidade', async ({ page }) => {
  await login(page, users.centro);
  await openHealthy(page, '/franchise/dashboard');
  await expect(page.getByRole('heading', { name: /Dashboard da Franquia/i })).toBeVisible();
});

