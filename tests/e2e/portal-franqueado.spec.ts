import { test, expect } from '@playwright/test';
import { login } from './support/auth';
import { users } from './support/test-data';

test('portal Centro mostra somente dados e modulos da unidade', async ({ page }) => {
  await login(page, users.centro);
  await expect(page.getByText('Admin Centro').first()).toBeVisible();
  for (const item of ['Vendas', 'Financeiro', 'DRE', 'Royalties', 'CMV']) {
    await expect(page.getByText(new RegExp(item, 'i')).first()).toBeVisible();
  }
});
