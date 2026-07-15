import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @inventory inventory foundation expoe settings locais saldos movimentos e capability', async ({ masterPage: page }) => {
  for (const path of ['/inventory/settings', '/inventory/locations', '/inventory/balances', '/inventory/movements', '/inventory']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }

  await page.goto('/inventory/settings');
  await expect(page.getByText(/Capability|Terminologia|Campos customizados/i).first()).toBeVisible();

  await page.goto('/inventory');
  await expect(page.getByText(/Estoque desabilitado|On hand|Disponivel|Movim/i).first()).toBeVisible();
});
