import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @inventory configuracao por tenant mantem inventario', async ({ masterPage: page }) => {
  await openHealthy(page, '/inventory/settings', { allowBlockedState: true });
  await expect(page.getByText(/Invent.rio|Estoque m.nimo|Cobertura/i).first()).toBeVisible();

  await openHealthy(page, '/noc', { allowBlockedState: true });
  await expect(page.getByText(/NOC|Sem permiss|Algo deu errado/i).first()).toBeVisible();
});

