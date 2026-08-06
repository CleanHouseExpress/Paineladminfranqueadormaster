import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const catalogItems = [
  { id: 10, name: 'Cafe Gelado', item_type: 'product', status: 'active', sku: 'CAF-001', unit_of_measure: 'un', metadata: { categoria: 'Bebidas' }, base_price: null, created_at: '2026-08-01T10:00:00.000Z', updated_at: '2026-08-01T10:00:00.000Z' },
  { id: 11, name: 'Acai Bowl', item_type: 'product', status: 'active', sku: 'ACA-002', unit_of_measure: 'un', metadata: { categoria: 'Alimentos' }, base_price: null, created_at: '2026-08-01T10:00:00.000Z', updated_at: '2026-08-01T10:00:00.000Z' },
];

const units = [
  { id: 101, name: 'Centro', code: 'CTR', status: 'active', address_city: 'Sao Paulo', address_state: 'SP' },
  { id: 102, name: 'Norte', code: 'NRT', status: 'active', address_city: 'Sao Paulo', address_state: 'SP' },
];

async function mockAuth(page: Page, permissions: string[]) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'pricing-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test', role: 'company_admin' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
    { module_id: 'sales', name: 'Vendas', status: 'active' },
    { module_id: 'catalog', name: 'Catalogo', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockPricingApi(page: Page, options: { restoreError?: boolean } = {}) {
  let prices = [
    { id: 1, tenant_id: 1, catalog_item_id: 11, catalog_item: { id: 11, name: 'Acai Bowl', sku: 'ACA-002', item_type: 'product', unit_of_measure: 'un' }, sale_price: 19.9, cost_price: 8, currency: 'BRL', active: true, created_at: '2026-08-02T10:00:00.000Z', updated_at: '2026-08-02T10:00:00.000Z' },
  ];
  let unitPrices: Array<Record<string, unknown>> = [];
  let restoreRequests = 0;

  await page.route('**/api/company/catalog/items**', route => json(route, { data: catalogItems }));
  await page.route('**/api/company/units?**', route => json(route, { data: units, meta: { current_page: 1, last_page: 1, per_page: 100, total: units.length } }));

  await page.route('**/api/company/pricing/products**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const parts = url.pathname.split('/').filter(Boolean);
    const pricingIndex = parts.findIndex(part => part === 'pricing');
    const productId = pricingIndex >= 0 ? parts[pricingIndex + 2] : undefined;

    if (request.method() === 'POST' && url.pathname.endsWith('/pricing/products')) {
      const payload = request.postDataJSON();
      const catalog = catalogItems.find(item => item.id === Number(payload.catalog_item_id));
      const created = { id: 2, tenant_id: 1, catalog_item_id: payload.catalog_item_id, catalog_item: { id: catalog?.id, name: catalog?.name, sku: catalog?.sku, item_type: catalog?.item_type, unit_of_measure: catalog?.unit_of_measure }, sale_price: payload.sale_price, cost_price: payload.cost_price, currency: 'BRL', active: true, created_at: '2026-08-04T10:00:00.000Z', updated_at: '2026-08-04T10:00:00.000Z' };
      prices = [...prices, created];
      return json(route, { data: created }, 201);
    }

    if (request.method() === 'PUT' && productId && !url.pathname.includes('/units/')) {
      const payload = request.postDataJSON();
      prices = prices.map(price => String(price.id) === String(productId) ? { ...price, sale_price: payload.sale_price, cost_price: payload.cost_price, active: payload.active, updated_at: '2026-08-04T11:00:00.000Z' } : price);
      return json(route, { data: prices.find(price => String(price.id) === String(productId)) });
    }

    if (url.pathname.endsWith('/effective')) {
      const catalogItemId = Number(productId);
      const unitId = url.searchParams.get('unit_id');
      const network = prices.find(price => Number(price.catalog_item_id) === catalogItemId && price.active);
      const unitOverride = unitId ? unitPrices.find(price => Number(price.catalog_item_id) === catalogItemId && Number(price.unit_id) === Number(unitId) && price.active !== false) : null;
      return json(route, { data: { effective_price: unitOverride?.sale_price ?? network?.sale_price ?? null, price_origin: unitOverride ? 'unit' : network ? 'network' : null, network_price: network?.sale_price ?? null, unit_price: unitOverride?.sale_price ?? null, currency: 'BRL' } });
    }

    if (url.pathname.endsWith('/units') && request.method() === 'GET') {
      return json(route, { data: unitPrices.filter(price => Number(price.catalog_item_id) === Number(productId)) });
    }

    if (url.pathname.includes('/units/') && request.method() === 'DELETE') {
      restoreRequests += 1;
      const unitId = Number(parts.at(-1));
      const network = prices.find(price => Number(price.catalog_item_id) === Number(productId) && price.active);
      const unit = units.find(item => item.id === unitId);
      if (options.restoreError) {
        return json(route, { message: 'Configure o preco padrao da rede antes de restaurar a heranca desta unidade.', errors: { sale_price: ['Configure o preco padrao da rede antes de restaurar a heranca desta unidade.'] } }, 422);
      }
      unitPrices = unitPrices.filter(price => !(Number(price.catalog_item_id) === Number(productId) && Number(price.unit_id) === unitId));
      return json(route, { data: { tenant_id: 1, catalog_item_id: Number(productId), unit_id: unitId, unit, default_price: network?.sale_price ?? null, effective_price: network?.sale_price ?? null, price_origin: network ? 'network' : null, has_override: false, network_price: network?.sale_price ?? null, unit_price: null, currency: 'BRL' } });
    }

    if (url.pathname.includes('/units/') && request.method() === 'PUT') {
      const unitId = Number(parts.at(-1));
      const payload = request.postDataJSON();
      const unit = units.find(item => item.id === unitId);
      const existing = unitPrices.find(price => Number(price.catalog_item_id) === Number(productId) && Number(price.unit_id) === unitId);
      const next = { id: existing?.id ?? 7, tenant_id: 1, catalog_item_id: Number(productId), unit_id: unitId, unit, sale_price: payload.sale_price, active: payload.active, created_at: '2026-08-04T10:00:00.000Z', updated_at: '2026-08-04T10:00:00.000Z' };
      unitPrices = [...unitPrices.filter(price => !(Number(price.catalog_item_id) === Number(productId) && Number(price.unit_id) === unitId)), next];
      return json(route, { data: next });
    }

    return json(route, { data: prices, meta: { current_page: 1, last_page: 1, per_page: 100, total: prices.length } });
  });

  return {
    get restoreRequests() {
      return restoreRequests;
    },
  };
}

test('@smoke pricing gerencia preco padrao e personalizacao por unidade', async ({ page }) => {
  await mockAuth(page, ['tenant.pricing.view', 'tenant.pricing.create', 'tenant.pricing.update', 'tenant.pricing.unit.update']);
  const api = await mockPricingApi(page);

  await page.goto('/pricing/products');

  await expect(page.getByTestId('pricing-products-page')).toBeVisible();
  await expect(page.getByTestId('sidebar-pricing')).toContainText('Precos');
  await expect(page.getByRole('heading', { name: 'Precos' })).toBeVisible();
  await expect(page.getByText('Cafe Gelado')).toBeVisible();
  await expect(page.getByRole('row', { name: /Cafe Gelado/i }).getByRole('cell', { name: 'Sem preco' }).first()).toBeVisible();

  await page.getByRole('button', { name: /Novo preco/i }).click();
  await page.getByLabel('Preco de venda padrao').fill('12,50');
  await page.getByLabel('Preco de custo').fill('5,20');
  await page.getByRole('button', { name: /Salvar preco/i }).click();
  await expect(page.getByRole('row', { name: /Cafe Gelado/i })).toContainText('R$ 12,50');

  await page.getByRole('row', { name: /Cafe Gelado/i }).getByRole('button', { name: /Detalhes/i }).click();
  await expect(page.getByTestId('pricing-details-panel')).toContainText('Herdado');
  await expect(page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Restaurar preco padrao/i })).toHaveCount(0);

  await page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Personalizar/i }).click();
  await page.getByLabel('Preco personalizado').fill('14,99');
  await page.getByRole('button', { name: /Salvar personalizacao/i }).click();
  await expect(page.getByTestId('pricing-details-panel')).toContainText('Personalizado');
  await expect(page.getByTestId('pricing-details-panel')).toContainText('R$ 14,99');
  await expect(page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Restaurar preco padrao/i })).toBeVisible();

  await page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Restaurar preco padrao/i }).click();
  await expect(page.getByRole('dialog', { name: /Restaurar preco padrao/i })).toBeVisible();
  await expect(page.getByTestId('pricing-restore-confirmation')).toContainText('Centro');
  await expect(page.getByTestId('pricing-restore-confirmation')).toContainText('R$ 14,99');
  await page.getByRole('button', { name: /Cancelar/i }).click();
  expect(api.restoreRequests).toBe(0);
  await expect(page.getByRole('row', { name: /Centro/i })).toContainText('Personalizado');

  await page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Restaurar preco padrao/i }).click();
  await page.getByRole('dialog', { name: /Restaurar preco padrao/i }).getByRole('button', { name: /^Restaurar preco padrao$/i }).click();
  await expect(page.getByRole('row', { name: /Centro/i })).toContainText('Herdado');
  await expect(page.getByRole('row', { name: /Centro/i })).toContainText('R$ 12,50');
  await expect(page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Restaurar preco padrao/i })).toHaveCount(0);
  expect(api.restoreRequests).toBe(1);

  await page.getByRole('button', { name: /Fechar/i }).click();
  await page.getByRole('row', { name: /Cafe Gelado/i }).getByRole('button', { name: /Editar/i }).click();
  await page.getByLabel('Preco de venda padrao').fill('13,50');
  await page.getByRole('button', { name: /Salvar preco/i }).click();
  await page.getByRole('row', { name: /Cafe Gelado/i }).getByRole('button', { name: /Detalhes/i }).click();
  await expect(page.getByRole('row', { name: /Centro/i })).toContainText('Herdado');
  await expect(page.getByRole('row', { name: /Centro/i })).toContainText('R$ 13,50');
});

test('pricing edita preco padrao e mantem heranca resolvida pelo backend', async ({ page }) => {
  await mockAuth(page, ['tenant.pricing.view', 'tenant.pricing.update']);
  await mockPricingApi(page);

  await page.goto('/pricing/products');

  await page.getByRole('row', { name: /Acai Bowl/i }).getByRole('button', { name: /Editar/i }).click();
  await page.getByLabel('Preco de venda padrao').fill('21,00');
  await page.getByRole('button', { name: /Salvar preco/i }).click();
  await expect(page.getByRole('row', { name: /Acai Bowl/i })).toContainText('R$ 21,00');

  await page.getByRole('row', { name: /Acai Bowl/i }).getByRole('button', { name: /Detalhes/i }).click();
  await expect(page.getByTestId('pricing-details-panel')).toContainText('Herdado');
  await expect(page.getByTestId('pricing-details-panel')).toContainText('R$ 21,00');
});

test('pricing bloqueia preco invalido antes de salvar', async ({ page }) => {
  await mockAuth(page, ['tenant.pricing.view', 'tenant.pricing.create']);
  await mockPricingApi(page);

  await page.goto('/pricing/products');

  await page.getByRole('button', { name: /Novo preco/i }).click();
  await page.getByLabel('Preco de venda padrao').fill('-1');
  await page.getByRole('button', { name: /Salvar preco/i }).click();
  await expect(page.getByRole('alert')).toContainText('Informe um preco de venda valido');
});
test('pricing respeita usuario somente leitura', async ({ page }) => {
  await mockAuth(page, ['tenant.pricing.view']);
  await mockPricingApi(page);

  await page.goto('/pricing/products');

  await expect(page.getByTestId('pricing-products-page')).toBeVisible();
  await expect(page.getByRole('button', { name: /Novo preco/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Editar/i })).toHaveCount(0);
  await page.getByRole('row', { name: /Acai Bowl/i }).getByRole('button', { name: /Detalhes/i }).click();
  await expect(page.getByText('Somente leitura').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Restaurar preco padrao/i })).toHaveCount(0);
});

test('pricing mantem personalizacao quando restauracao falha', async ({ page }) => {
  await mockAuth(page, ['tenant.pricing.view', 'tenant.pricing.unit.update']);
  await mockPricingApi(page, { restoreError: true });

  await page.goto('/pricing/products');

  await page.getByRole('row', { name: /Acai Bowl/i }).getByRole('button', { name: /Detalhes/i }).click();
  await page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Personalizar/i }).click();
  await page.getByLabel('Preco personalizado').fill('22,00');
  await page.getByRole('button', { name: /Salvar personalizacao/i }).click();
  await page.getByRole('row', { name: /Centro/i }).getByRole('button', { name: /Restaurar preco padrao/i }).click();
  await page.getByRole('dialog', { name: /Restaurar preco padrao/i }).getByRole('button', { name: /^Restaurar preco padrao$/i }).click();

  await expect(page.getByRole('alert')).toContainText('Configure o preco padrao');
  await page.getByRole('button', { name: /Cancelar/i }).click();
  await expect(page.getByRole('row', { name: /Centro/i })).toContainText('Personalizado');
  await expect(page.getByRole('row', { name: /Centro/i })).toContainText('R$ 22,00');
});
