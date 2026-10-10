import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(
  page: Page,
  permissions: string[],
  units = [{ id: 101, name: 'BH Savassi' }],
) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'replenishment-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Gestor Savassi', email: 'gestor@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'unit_manager' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions }));
  await page.route('**/api/me/units', route => json(route, units));
  await page.route('**/api/company/units/options', route => json(route, units.map(unit => ({ value: String(unit.id), label: unit.name }))));
}

const legacyFrontendPermissions = [
  'tenant.inventory.view',
  'tenant.procurement.view',
  'tenant.procurement.purchase_orders.create',
];

const canonicalPermissions = [
  'tenant.inventory.view',
  'tenant.procurement.purchase_orders.view',
  'tenant.procurement.purchase_orders.manage',
];

// Mirrors ReplenishmentSuggestionService serialization from orchestra-api.
const suggestions = [
  {
    inventory_item_id: 10,
    name: 'Leite integral',
    unit_id: 101,
    current_stock: 7,
    minimum_stock: 5,
    target_stock: 20,
    needed_quantity: 13,
    offers: [
      {
        supplier_offer_id: 501,
        supplier_id: 201,
        supplier: { id: 201, name: 'Laticinios Minas' },
        purchase_uom: 'caixa', package_uom: 'unidade', package_quantity: 6,
        inventory_uom: 'unidade', conversion_factor: 6, unit_price: 27, currency: 'BRL',
        minimum_order_quantity: 2, purchase_multiple: 1, lead_time_min: 2, lead_time_max: 3,
        availability_status: 'available', suggested_purchase_quantity: 3, suggested_inventory_quantity: 18,
      },
      {
        supplier_offer_id: 502,
        supplier_id: 202,
        supplier: { id: 202, name: 'Distribuidora Centro' },
        purchase_uom: 'caixa', package_uom: 'unidade', package_quantity: 10,
        inventory_uom: 'unidade', conversion_factor: 10, unit_price: 40, currency: 'BRL',
        minimum_order_quantity: 2, purchase_multiple: 2, lead_time_min: 4, lead_time_max: 5,
        availability_status: 'available', suggested_purchase_quantity: 2, suggested_inventory_quantity: 20,
      },
    ],
  },
  {
    inventory_item_id: 11,
    name: 'Copos 300 ml',
    unit_id: 101,
    current_stock: 0,
    minimum_stock: 50,
    target_stock: 100,
    needed_quantity: 100,
    offers: [{
      supplier_offer_id: 503,
      supplier_id: 203,
      supplier: { id: 203, name: 'Embalagens Brasil' },
      purchase_uom: 'fardo', package_uom: 'unidade', package_quantity: 50,
      inventory_uom: 'unidade', conversion_factor: 50, unit_price: 20, currency: 'BRL',
      minimum_order_quantity: 2, purchase_multiple: 1, lead_time_min: 3, lead_time_max: 3,
      availability_status: 'available', suggested_purchase_quantity: 2, suggested_inventory_quantity: 100,
    }],
  },
];

async function mockSuggestions(page: Page, data: Array<Record<string, unknown>> = suggestions) {
  const reads: string[] = [];
  await page.route('**/api/company/procurement/replenishment-suggestions?*', route => {
    reads.push(route.request().url());
    return json(route, { data });
  });
  return reads;
}

test('renderiza o contrato real com nome, alvo ideal e ofertas selecionaveis distintas', async ({ page }) => {
  await mockAuth(page, legacyFrontendPermissions);
  const reads = await mockSuggestions(page);

  await page.goto('/inventory/replenishment');

  await expect(page.getByRole('heading', { name: /Sugest(?:o|õ)es de reposi(?:c|ç)(?:a|ã)o/i })).toBeVisible();
  await expect.poll(() => reads.length).toBe(1);
  expect(new URL(reads[0]).searchParams.get('unit_id')).toBe('101');
  const milk = page.getByRole('row', { name: /Leite integral/i });
  await expect(milk).toContainText('7');
  await expect(milk).toContainText('20');
  await expect(milk).toContainText('Laticinios Minas');
  await expect(milk).toContainText('Distribuidora Centro');
  await expect(milk).toContainText(/Sugerido\s*3/i);
  await expect(milk).toContainText(/MOQ\s*2/i);
  await expect(milk).toContainText(/m[uú]ltiplo\s*1/i);
  await expect(milk).toContainText(/embalagem\s*6/i);

  const firstOffer = page.getByRole('checkbox', { name: /Leite integral.*Laticinios Minas/i });
  const secondOffer = page.getByRole('checkbox', { name: /Leite integral.*Distribuidora Centro/i });
  await firstOffer.check();
  await expect(firstOffer).toBeChecked();
  await expect(secondOffer).not.toBeChecked();
  await expect(page.getByRole('spinbutton', { name: /Quantidade.*Leite integral/i })).toHaveValue('3');
});

test('permite consultar e criar com as permissoes canonicas dos seeders', async ({ page }) => {
  await mockAuth(page, canonicalPermissions);
  await mockSuggestions(page);

  await page.goto('/inventory/replenishment');

  await expect(page.getByRole('heading', { name: /Sugest(?:o|õ)es de reposi(?:c|ç)(?:a|ã)o/i })).toBeVisible();
  await page.getByRole('checkbox', { name: /Leite integral.*Laticinios Minas/i }).check();
  await expect(page.getByRole('button', { name: /Criar pedidos de compra/i })).toBeEnabled();
});

test('permite escolher entre unidades acessiveis e limpa a selecao ao trocar de unidade', async ({ page }) => {
  await mockAuth(page, canonicalPermissions, [
    { id: 101, name: 'BH Savassi' },
    { id: 202, name: 'SP Centro' },
  ]);
  const requestedUnits: string[] = [];
  const orderPayloads: Array<Record<string, unknown>> = [];
  await page.route('**/api/company/procurement/replenishment-suggestions?*', route => {
    const unitId = new URL(route.request().url()).searchParams.get('unit_id') ?? '';
    requestedUnits.push(unitId);
    return json(route, { data: suggestions.map(item => ({ ...item, unit_id: Number(unitId) })) });
  });
  await page.route('**/api/company/procurement/replenishment-suggestions/purchase-orders', route => {
    orderPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
    return json(route, { data: [{ id: 901, status: 'draft' }] }, 201);
  });

  await page.goto('/inventory/replenishment');

  const unitSelector = page.getByRole('combobox', { name: /Unidade/i });
  await expect(unitSelector).toHaveValue('101');
  await expect(page.getByText('BH Savassi', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: /Leite integral.*Laticinios Minas/i }).check();

  await unitSelector.selectOption('202');

  await expect.poll(() => requestedUnits).toEqual(['101', '202']);
  await expect(unitSelector).toHaveValue('202');
  await expect(page.getByText('SP Centro', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Leite integral.*Laticinios Minas/i })).not.toBeChecked();
  await expect(page.getByRole('button', { name: /Criar pedidos de compra/i })).toBeDisabled();

  await page.getByRole('checkbox', { name: /Leite integral.*Laticinios Minas/i }).check();
  await page.getByRole('button', { name: /Criar pedidos de compra/i }).click();
  await expect.poll(() => orderPayloads.length).toBe(1);
  expect(orderPayloads[0]).toMatchObject({ unit_id: 202 });
});

test('consulta sugestoes com UnitAccess sem depender da permissao administrativa de unidades', async ({ page }) => {
  await mockAuth(page, canonicalPermissions, [{ id: 101, name: 'BH Savassi' }]);
  await page.unroute('**/api/company/units/options');
  let administrativeUnitDiscoveryCalls = 0;
  await page.route('**/api/company/units/options', route => {
    administrativeUnitDiscoveryCalls += 1;
    return json(route, { message: 'This action is unauthorized.' }, 403);
  });
  const reads = await mockSuggestions(page);

  await page.goto('/inventory/replenishment');

  await expect(page.getByRole('heading', { name: /Sugest(?:o|õ)es de reposi(?:c|ç)(?:a|ã)o/i })).toBeVisible();
  await expect(page.getByRole('row', { name: /Leite integral/i })).toBeVisible();
  await expect.poll(() => reads.length).toBe(1);
  expect(new URL(reads[0]).searchParams.get('unit_id')).toBe('101');
  expect(administrativeUnitDiscoveryCalls).toBe(0);
});

test('identifica item sem oferta sem criar pedido ou movimento durante a consulta', async ({ page }) => {
  await mockAuth(page, legacyFrontendPermissions);
  const writes: string[] = [];
  await mockSuggestions(page, [{
    inventory_item_id: 12, name: 'Acucar refinado', unit_id: 101,
    current_stock: 2, minimum_stock: 10, target_stock: 20, needed_quantity: 18, offers: [],
  }]);
  await page.route('**/api/company/procurement/replenishment-suggestions/purchase-orders', route => {
    writes.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return json(route, { data: [] }, 201);
  });
  await page.route('**/api/company/procurement/purchase-orders', route => {
    writes.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return json(route, { data: [] }, 201);
  });
  await page.route('**/api/company/inventory/movements**', route => {
    if (route.request().method() !== 'GET') writes.push(`${route.request().method()} inventory-movement`);
    return json(route, { data: [] });
  });

  await page.goto('/inventory/replenishment');

  await expect(page.getByRole('row', { name: /Acucar refinado/i })).toContainText(/Sem oferta autorizada/i);
  expect(writes).toEqual([]);
});

test('envia uma unica criacao agrupada e atomica para ofertas de fornecedores diferentes', async ({ page }) => {
  await mockAuth(page, legacyFrontendPermissions);
  await mockSuggestions(page);
  const groupedPayloads: Array<Record<string, unknown>> = [];
  const individualRequests: Array<Record<string, unknown>> = [];
  await page.route('**/api/company/procurement/replenishment-suggestions/purchase-orders', route => {
    groupedPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
    return json(route, { message: 'The given data was invalid.', errors: { 'items.1.quantity': ['Quantidade invalida.'] } }, 422);
  });
  await page.route('**/api/company/procurement/purchase-orders', route => {
    individualRequests.push(route.request().postDataJSON() as Record<string, unknown>);
    return json(route, { data: { id: 901, status: 'draft' } }, 201);
  });

  await page.goto('/inventory/replenishment');
  await page.getByRole('checkbox', { name: /Leite integral.*Laticinios Minas/i }).check();
  await page.getByRole('checkbox', { name: /Copos 300 ml.*Embalagens Brasil/i }).check();
  await page.getByRole('button', { name: /Criar pedidos de compra/i }).click();

  await expect.poll(() => groupedPayloads.length).toBe(1);
  expect(groupedPayloads).toEqual([{
    unit_id: 101,
    items: [
      { supplier_offer_id: 501, quantity: 3 },
      { supplier_offer_id: 503, quantity: 2 },
    ],
  }]);
  expect(individualRequests).toEqual([]);
});
