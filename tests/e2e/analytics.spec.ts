import { test, expect } from './support/fixtures';
import { unique } from './support/test-data';

test('widget de Analytics e criado, renderizado e salvo no dashboard', async ({ masterPage: page }) => {
  const title = unique('Widget E2E');
  await page.goto('/analytics');
  await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible();
  const personalize = page.getByRole('button', { name: /Personalizar/i });
  if (await personalize.isVisible()) await personalize.click();
  await page.getByRole('button', { name: /Adicionar.*widget/i }).click();
  await page.getByRole('button', { name: /Faturamento bruto/i }).click();
  await page.locator('input').last().fill(title);
  await page.getByRole('button', { name: /Contador|Barras|Linhas|Tabela/i }).first().click();
  await expect(page.locator('input').last()).toHaveValue(title);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: /Adicionar widget/i })).toHaveCount(0);
});
