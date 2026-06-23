import { test, expect } from '@playwright/test';
import { login } from './support/auth';
import { users } from './support/test-data';

test('admin Centro fica restrito a sua unidade', async ({ page }) => {
  await login(page, users.centro);
  await expect(page.getByText('Admin Centro').first()).toBeVisible();
  await expect(page.getByText(/seletor.*unidade|todas as unidades/i)).toHaveCount(0);
  await page.goto('/units');
  await expect(page).toHaveURL(/\/units/);
  await expect(page.getByRole('heading', { name: /Sem permiss/i }).first()).toBeVisible();
});
