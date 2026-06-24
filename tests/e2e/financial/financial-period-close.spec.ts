import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @financial fechamento financeiro expoe DRE royalties e bloqueios de competencia', async ({ masterPage: page }) => {
  for (const path of ['/sales', '/financial/transactions', '/financial/dre', '/financial/royalties', '/royalties/periods']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }

  await expect(page.getByText(/Compet.ncia|Fechamento|Royalties|Pago|Pendente|Aprovar/i).first()).toBeVisible();
});

