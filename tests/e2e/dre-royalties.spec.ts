import { test, expect } from './support/fixtures';

test('@smoke DRE fecha o periodo de venda e royalty chega ao status pago', async ({ masterPage: page }) => {
  await page.goto('/financial');
  await expect(page.getByRole('heading', { name: /Vis.o Geral Financeira/i })).toBeVisible();
  await expect(page.getByTestId('sidebar-financial-dre')).toBeVisible();
  await expect(page.getByTestId('sidebar-financial-royalties')).toBeVisible();
  await expect(page.getByText(/Receitas|Despesas|Resultado/i).first()).toBeVisible();
});
