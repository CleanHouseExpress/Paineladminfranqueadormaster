import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @inventory checklist inventory e CMV permanecem integrados', async ({ masterPage: page }) => {
  for (const path of ['/checklists/templates', '/checklists/executions', '/inventory/movements', '/cmv', '/noc']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }

  await expect(page.getByText(/Checklist|Movimenta|CMV|NOC|Tarefa|Ajuste/i).first()).toBeVisible();
});

