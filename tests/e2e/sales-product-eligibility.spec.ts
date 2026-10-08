import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockSalesSession(page: Page, options: { paginatedCatalog?: boolean } = {}) {
  const commercialCatalogRequests: string[] = [];
  const legacyCatalogRequests: string[] = [];

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
  await page.route('**/api/company/catalog/items/options**', route => {
    legacyCatalogRequests.push(route.request().url());
    return json(route, []);
  });
  await page.route('**/api/company/units/*/commercial-catalog**', route => {
    commercialCatalogRequests.push(route.request().url());
    const pageNumber = new URL(route.request().url()).searchParams.get('page') ?? '1';

    if (options.paginatedCatalog && pageNumber === '2') {
      return json(route, {
        data: [
          {
            catalog_item_id: 99,
            name: 'Produto elegivel da segunda pagina',
            item_type: 'product',
            catalog_visible: true,
            effective_price: 87.65,
            price_source: 'network',
            eligible_for_sale: true,
            blocking_reasons: [],
          },
        ],
        meta: { current_page: 2, last_page: 2, per_page: 1, total: 2 },
      });
    }

    return json(route, {
      data: [
        {
          catalog_item_id: 42,
          name: 'Produto elegivel',
          item_type: 'product',
          catalog_visible: true,
          effective_price: 123.45,
          price_source: 'unit',
          eligible_for_sale: true,
          blocking_reasons: [],
        },
        {
          catalog_item_id: 43,
          name: 'Produto visivel sem preco',
          item_type: 'product',
          catalog_visible: true,
          effective_price: null,
          price_source: 'none',
          eligible_for_sale: false,
          blocking_reasons: ['missing_effective_price'],
        },
      ],
      meta: options.paginatedCatalog
        ? { current_page: 1, last_page: 2, per_page: 1, total: 2 }
        : { current_page: 1, last_page: 1, per_page: 100, total: 2 },
    });
  });

  return { commercialCatalogRequests, legacyCatalogRequests };
}

test('venda usa o catalogo comercial canonico da unidade para preco e elegibilidade', async ({ page }) => {
  const { commercialCatalogRequests, legacyCatalogRequests } = await mockSalesSession(page);
  await page.goto('/sales/new');

  await expect(page.getByRole('heading', { name: 'Nova venda' })).toBeVisible();
  expect(commercialCatalogRequests).toHaveLength(0);
  expect(legacyCatalogRequests).toHaveLength(0);

  await page.getByLabel('Unidade').selectOption('101');
  await expect.poll(() => commercialCatalogRequests.some(
    requestUrl => new URL(requestUrl).pathname === '/api/company/units/101/commercial-catalog',
  )).toBe(true);
  expect(legacyCatalogRequests).toHaveLength(0);

  const catalog = page.locator('select').nth(3);
  await expect(catalog.getByRole('option', { name: 'Produto elegivel' })).toBeEnabled();
  await expect(catalog.getByRole('option', { name: 'Produto visivel sem preco' })).toBeDisabled();

  await catalog.selectOption('42');
  await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('123.45');
});

test('venda carrega todos os produtos elegiveis de um catalogo comercial paginado', async ({ page }) => {
  const { commercialCatalogRequests } = await mockSalesSession(page, { paginatedCatalog: true });
  await page.goto('/sales/new');

  await expect(page.getByRole('heading', { name: 'Nova venda' })).toBeVisible();
  await page.getByLabel('Unidade').selectOption('101');

  const catalog = page.locator('select').nth(3);
  await expect(catalog.getByRole('option', { name: 'Produto elegivel da segunda pagina' })).toBeEnabled();
  expect(commercialCatalogRequests.map(requestUrl => new URL(requestUrl).searchParams.get('page')))
    .toContain('2');
});
