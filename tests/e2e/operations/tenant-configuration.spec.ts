import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @inventory configuracao por tenant oculta transferencia antiga e mantem inventario', async ({ masterPage: page }) => {
  await openHealthy(page, '/inventory/settings', { allowBlockedState: true });
  await expect(page.getByText(/Invent.rio|Estoque m.nimo|Cobertura/i).first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Transfer.ncias/i);

  await openHealthy(page, '/inventory/transfers', { allowBlockedState: true });
  await expect(page.getByTestId('inventory-transfers-unavailable')).toBeVisible();
  await expect(page.getByText(/temporariamente indispon/i).first()).toBeVisible();

  await openHealthy(page, '/noc', { allowBlockedState: true });
  await expect(page.getByText(/NOC|Sem permiss|Algo deu errado/i).first()).toBeVisible();
});

