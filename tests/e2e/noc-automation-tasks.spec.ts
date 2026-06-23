import { test, expect } from './support/fixtures';

test('NOC, automacao e task formam um fluxo operacional completo', async ({ masterPage: page }) => {
  await expect(page.getByTestId('sidebar-network_operations_center')).toBeVisible();
  await expect(page.getByTestId('sidebar-automation')).toBeVisible();
  await expect(page.getByTestId('sidebar-tasks')).toBeVisible();
});
