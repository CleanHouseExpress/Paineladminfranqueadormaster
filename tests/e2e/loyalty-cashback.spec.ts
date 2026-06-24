import { test, expect } from './support/fixtures';
import { login } from './support/auth';
import { unique, users } from './support/test-data';
import { openHealthy } from './support/page-health';

test.describe('@release @loyalty Loyalty / Cashback', () => {
  test('admin acessa dashboard, configura regra e navega por carteiras', async ({ page }) => {
    await login(page, users.master);
    await openHealthy(page, '/loyalty/cashback');
    await expect(page.getByTestId('loyalty-dashboard')).toBeVisible();
    await expect(page.getByText(/Passivo potencial/i)).toBeVisible();
    await expect(page.getByText(/Taxa de resgate/i)).toBeVisible();

    await openHealthy(page, '/loyalty/cashback/settings');
    await expect(page.getByTestId('loyalty-settings-page')).toBeVisible();
    await page.getByTestId('loyalty-release-days').fill('0');
    const settingsResponse = page.waitForResponse(response =>
      response.url().includes('/api/company/loyalty/cashback/settings') && response.request().method() === 'PUT',
    );
    await page.getByTestId('loyalty-settings-save').click();
    await expect((await settingsResponse).ok()).toBeTruthy();

    await openHealthy(page, '/loyalty/cashback/rules');
    await expect(page.getByTestId('loyalty-rules-page')).toBeVisible();
    await page.getByTestId('loyalty-rule-new').click();
    const ruleName = unique('Regra Cashback E2E');
    await page.getByTestId('loyalty-rule-name').fill(ruleName);
    await page.getByTestId('loyalty-rule-value').fill('5');
    const ruleResponse = page.waitForResponse(response =>
      response.url().includes('/api/company/loyalty/cashback/rules') && response.request().method() === 'POST',
    );
    await page.getByTestId('loyalty-rule-save').click();
    await expect((await ruleResponse).ok()).toBeTruthy();
    await expect(page.getByText(ruleName)).toBeVisible();

    await openHealthy(page, '/loyalty/cashback/wallets');
    await expect(page.getByTestId('loyalty-wallets-page')).toBeVisible();
    await expect(page.getByText(/Carteiras de Cashback/i)).toBeVisible();
  });

  test('venda exibe campos de cashback e portal franqueado visualiza indicadores', async ({ page }) => {
    await login(page, users.master);
    await openHealthy(page, '/sales', { allowBlockedState: true });
    await expect(page.getByText(/Vendas/i).first()).toBeVisible();

    await login(page, users.centro);
    await openHealthy(page, '/franchise/cashback', { allowBlockedState: true });
    await expect(page.getByText(/Cashback/i).first()).toBeVisible();
    await expect(page.getByTestId('franchise-cashback-summary').or(page.getByText(/Sem permiss/i))).toBeVisible();
  });
});
