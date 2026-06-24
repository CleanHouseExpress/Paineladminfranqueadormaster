import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release NOC automation e tasks expostos para operacao de release', async ({ masterPage: page }) => {
  await expect(page.getByTestId('sidebar-network_operations_center')).toBeVisible();
  await expect(page.getByTestId('sidebar-automation')).toBeVisible();
  await expect(page.getByTestId('sidebar-tasks')).toBeVisible();

  for (const path of ['/noc', '/automation', '/tasks']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }
});

