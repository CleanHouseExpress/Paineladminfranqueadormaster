import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @financial royalties exibem regra competencia aprovacao e financeiro', async ({ masterPage: page }) => {
  for (const path of ['/financial/royalties', '/royalties/periods', '/financial/transactions']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }

  await expect(page.getByText(/Royalty|Compet.ncia|Aprov|Pago|Financeiro/i).first()).toBeVisible();
});

