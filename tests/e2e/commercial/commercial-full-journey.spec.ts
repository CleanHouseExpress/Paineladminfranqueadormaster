import { test, expect } from '../support/fixtures';
import { unique } from '../support/test-data';
import { openHealthy } from '../support/page-health';

test('@release @commercial jornada comercial atravessa lead, venda e financeiro', async ({ masterPage: page }) => {
  const lead = unique('Lead Release');

  await page.goto('/crm/leads/new');
  await expect(page.getByRole('heading', { name: /Novo lead/i })).toBeVisible();
  await page.getByLabel(/Nome \*/).fill(lead);
  await page.getByLabel('E-mail').fill(`${lead.replace(/\W/g, '').toLowerCase()}@example.test`);
  await page.getByLabel('Unidade').selectOption({ label: 'Centro' });
  await expect(page.getByRole('button', { name: /Salvar lead/i })).toBeEnabled();

  for (const path of ['/crm', '/crm/kanban', '/crm/leads', '/customers', '/sales/new', '/sales', '/financial/transactions', '/financial']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }

  await expect(page.getByText(/Receitas|Recebido|Saldo|Resultado/i).first()).toBeVisible();
});

