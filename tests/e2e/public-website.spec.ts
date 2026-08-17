import { test, expect } from '@playwright/test';

test('homepage institucional em / abre sem autenticacao', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');

  await expect(page.getByRole('banner').getByText('Orchestra')).toBeVisible();
  await expect(page.getByRole('heading', { name: /sua rede inteira/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login');
  await expect(page.getByRole('button', { name: /solicitar demonstra/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /conhecer a plataforma/i })).toHaveAttribute('href', '#plataforma');
  await expect(page.locator('#plataforma')).toBeVisible();

  await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/);
  await expect(page.getByText(/Painel da rede/i)).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasHorizontalOverflow).toBe(false);
  expect(errors).toEqual([]);
});

test('/dashboard continua protegido para o painel administrativo', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});
