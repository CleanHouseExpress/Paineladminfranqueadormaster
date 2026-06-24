import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @financial DRE metas historico e projecao nao quebram', async ({ masterPage: page }) => {
  for (const path of ['/dre/goals', '/financial/dre', '/dre/history', '/dre/projection']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }

  await expect(page.getByText(/Meta|Realizado|Varia|Proje/i).first()).toBeVisible();
});

