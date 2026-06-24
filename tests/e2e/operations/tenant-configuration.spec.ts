import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @inventory configuracao por tenant exibe controles de transferencias e inventario', async ({ masterPage: page }) => {
  await openHealthy(page, '/inventory/settings', { allowBlockedState: true });
  await expect(page.getByText(/Transfer.ncias|Invent.rio|Estoque m.nimo|Cobertura/i).first()).toBeVisible();

  await openHealthy(page, '/inventory/transfers', { allowBlockedState: true });
  await expect(page.getByText(/Transfer.ncias|Sem permiss|Algo deu errado/i).first()).toBeVisible();

  await openHealthy(page, '/noc', { allowBlockedState: true });
  await expect(page.getByText(/NOC|Sem permiss|Algo deu errado/i).first()).toBeVisible();
});

