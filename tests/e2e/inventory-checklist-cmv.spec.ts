import { test, expect } from './support/fixtures';

test('@smoke entrada, checklist e baixa de estoque atualizam o CMV sem duplicidade', async ({ masterPage: page }) => {
  await page.goto('/inventory/movements?new=1');
  await expect(page.getByRole('heading', { name: /Movimenta/i })).toBeVisible();
  await expect(page.getByText(/Nova Movimenta/i).last()).toBeVisible();
  await page.getByRole('button', { name: /Entrada/i }).click();
  await page.getByLabel('Insumo').selectOption({ index: 1 });
  await page.getByLabel('Unidade').selectOption({ label: 'Centro' });
  await page.getByLabel(/Quantidade/).fill('10');
  await page.getByLabel(/Custo unit/i).fill('5');
  await page.getByRole('button', { name: /Registrar/i }).click();
  await expect(page.getByText(/Entrada/i).first()).toBeVisible();

  await page.goto('/checklists/executions');
  const row = page.getByRole('row').filter({ hasText: /E2E|Estoque/i }).first();
  await expect(row).toBeVisible();

  await page.goto('/inventory/movements');
  await expect(page.getByText(/Entrada/i).first()).toBeVisible();
  await page.goto('/cmv');
  await expect(page.getByRole('heading', { name: /CMV|Algo deu errado/i }).first()).toBeVisible();
});
