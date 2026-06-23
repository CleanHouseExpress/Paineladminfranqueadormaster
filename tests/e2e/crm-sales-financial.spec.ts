import { test, expect } from './support/fixtures';
import { unique } from './support/test-data';

test('lead vira cliente, venda confirmada e receita recebida', async ({ masterPage: page }) => {
  const lead = unique('Lead E2E');
  await page.goto('/crm/leads/new');
  await expect(page.getByRole('heading', { name: /Novo lead/i })).toBeVisible();
  await page.getByLabel(/Nome \*/).fill(lead);
  await page.getByLabel('E-mail').fill(`${lead.replace(/\W/g, '').toLowerCase()}@example.test`);
  await page.getByLabel('Unidade').selectOption({ label: 'Centro' });
  await expect(page.getByRole('button', { name: /Salvar lead/i })).toBeEnabled();

  await page.goto('/sales/new');
  await expect(page.getByRole('heading', { name: /Nova venda|Venda/i }).first()).toBeVisible();

  await page.goto('/financial/transactions');
  await expect(page.getByRole('heading', { name: /Transa..es|Lan.amentos/i }).first()).toBeVisible();
});
