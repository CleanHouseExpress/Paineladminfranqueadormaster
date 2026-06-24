import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @inventory inventory supply chain cobre settings transferencias contagens e alertas', async ({ masterPage: page }) => {
  for (const path of ['/inventory/settings', '/inventory/transfers', '/inventory/counts', '/inventory']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }

  await expect(page.getByText(/Transfer.ncias|Invent.rio|Estoque|Cobertura|M.nimo|Alerta/i).first()).toBeVisible();
});

