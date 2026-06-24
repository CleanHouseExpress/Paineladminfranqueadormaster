import { test, expect } from './support/fixtures';
import { login, logout } from './support/auth';
import { ids } from './support/selectors';
import { users } from './support/test-data';

test('@smoke company_admin entra, ve o dashboard, sai e nao acessa rota protegida', async ({ page }) => {
  await login(page, users.master);
  await expect(page.getByTestId(ids.dashboardTitle)).toBeVisible();
  await expect(page.getByTestId(ids.sidebar)).toBeVisible();
  await logout(page);
  await page.goto('/financial');
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});
