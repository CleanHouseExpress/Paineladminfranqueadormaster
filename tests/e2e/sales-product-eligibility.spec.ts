import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockSalesSession(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'sales-eligibility-token');
  });

  await page.route('**/api/me', route => json(route, {
    data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' },
  }));
  await page.route('**/api/me/company', route => json(route, {
    data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' },
  }));
  await page.route('**/api/me/modules**', route => json(route, {
    data: [{ module_id: 'sales', name: 'Vendas', status: 'active' }],
  }));
  await page.route('**/api/me/roles', route => json(route, {
    data: [{ id: 1, name: 'company_admin' }],
  }));
  await page.route('**/api/me/permissions', route => json(route, {
    data: ['tenant.sales.view', 'tenant.sales.create'],
  }));

  await page.route('**/api/company/customers/options', route => json(route, []));
  await page.route('**/api/company/units/options', route => json(route, [
    { value: 101, label: 'Unidade Centro' },
  ]));
  await page.route('**/api/company/contracts/options', route => json(route, []));
  await page.route('**/api/company/catalog/items/options', route => json(route, [
    {
      value: 42,
      label: 'Produto elegivel',
      type: 'product',
      price: 100,
      eligible_for_sale: true,
      blocking_reasons: [],
    },
    {
      value: 43,
      label: 'Produto sem preco',
      type: 'product',
      price: null,
      eligible_for_sale: false,
      blocking_reasons: ['missing_effective_price'],
    },
  ]));
}

test('venda impede selecionar produto que o backend marcou como inelegivel', async ({ page }) => {
  await mockSalesSession(page);
  await page.goto('/sales/new');

  await expect(page.getByRole('heading', { name: 'Nova venda' })).toBeVisible();

  const catalog = page.locator('select').nth(3);
  await expect(catalog.getByRole('option', { name: 'Produto elegivel' })).toBeEnabled();
  await expect(catalog.getByRole('option', { name: 'Produto sem preco' })).toBeDisabled();
});
