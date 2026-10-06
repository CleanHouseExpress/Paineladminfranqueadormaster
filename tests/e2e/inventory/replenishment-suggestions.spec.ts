import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'replenishment-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Gestor Savassi', email: 'gestor@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'unit_manager' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.inventory.view',
    'tenant.procurement.view',
    'tenant.procurement.purchase_orders.create',
  ] }));
  await page.route('**/api/me/units', route => json(route, { data: [{ id: 101, name: 'BH Savassi' }] }));
  await page.route('**/api/company/units/options', route => json(route, [{ value: '101', label: 'BH Savassi' }]));
}

const suggestions = [
  {
    inventory_item_id: 10,
    item_name: 'Leite integral',
    sku: 'LEI-01',
    unit_id: 101,
    unit_name: 'BH Savassi',
    tracks_inventory: true,
    catalog_visible: false,
    sellable: false,
    current_stock: 3,
    minimum_stock: 8,
    target_stock: 17,
    required_quantity: 14,
    offers: [
      { id: 501, supplier_id: 201, supplier_name: 'Laticinios Minas', authorized: true, preferred: true, unit_price: 4.5, lead_time_days: 2, moq: 10, purchase_multiple: 5, package_quantity: 5, suggested_quantity: 15 },
      { id: 502, supplier_id: 202, supplier_name: 'Distribuidora Centro', authorized: true, preferred: false, unit_price: 4.2, lead_time_days: 4, moq: 20, purchase_multiple: 10, package_quantity: 10, suggested_quantity: 20 },
    ],
  },
  {
    inventory_item_id: 11,
    item_name: 'Copos 300 ml',
    sku: 'COP-300',
    unit_id: 101,
    unit_name: 'BH Savassi',
    tracks_inventory: true,
    catalog_visible: true,
    sellable: true,
    current_stock: 0,
    minimum_stock: 50,
    target_stock: 100,
    required_quantity: 100,
    offers: [
      { id: 503, supplier_id: 203, supplier_name: 'Embalagens Brasil', authorized: true, preferred: true, unit_price: 0.4, lead_time_days: 3, moq: 100, purchase_multiple: 50, package_quantity: 50, suggested_quantity: 100 },
    ],
  },
];

async function mockSuggestions(page: Page, data: typeof suggestions | Array<Record<string, unknown>> = suggestions) {
  const reads: string[] = [];
  await page.route('**/api/company/procurement/replenishment-suggestions**', route => {
    reads.push(route.request().url());
    return json(route, { data, meta: { total: data.length } });
  });
  return reads;
}

test.beforeEach(async ({ page }) => {
  await mockAuth(page);
});

test('lista somente candidatos calculados e mostra ofertas autorizadas com as regras de compra', async ({ page }) => {
  const reads = await mockSuggestions(page);

  await page.goto('/inventory/replenishment');

  await expect(page.getByRole('heading', { name: /Sugest(?:o|õ)es de reposi(?:c|ç)(?:a|ã)o/i })).toBeVisible();
  await expect.poll(() => reads.length).toBe(1);
  expect(new URL(reads[0]).searchParams.get('unit_id')).toBe('101');
  const milk = page.getByRole('row', { name: /Leite integral/i });
  await expect(milk).toContainText('3');
  await expect(milk).toContainText('17');
  await expect(milk).toContainText('15');
  await expect(milk).toContainText('Laticinios Minas');
  await expect(milk).toContainText('Distribuidora Centro');
  await expect(milk).toContainText(/MOQ\s*10/i);
  await expect(milk).toContainText(/m[uú]ltiplo\s*5/i);
  await expect(milk).toContainText(/embalagem\s*5/i);
  await expect(page.getByText('Fornecedor sem autorizacao')).toHaveCount(0);
  await expect(page.getByText('Item com saldo suficiente')).toHaveCount(0);
  await expect(page.getByText('Servico sem controle de estoque')).toHaveCount(0);
});

test('identifica item sem oferta e consultar sugestoes nao cria pedido nem movimento', async ({ page }) => {
  const purchaseOrderRequests: string[] = [];
  const movementRequests: string[] = [];
  await mockSuggestions(page, [{
    inventory_item_id: 12,
    item_name: 'Acucar refinado',
    sku: 'ACU-01',
    unit_id: 101,
    unit_name: 'BH Savassi',
    tracks_inventory: true,
    current_stock: 2,
    minimum_stock: 10,
    target_stock: 20,
    required_quantity: 18,
    offers: [],
  }]);
  await page.route('**/api/company/procurement/purchase-orders**', route => {
    purchaseOrderRequests.push(route.request().method());
    return json(route, { data: {} }, 201);
  });
  await page.route('**/api/company/inventory/movements**', route => {
    if (route.request().method() !== 'GET') movementRequests.push(route.request().method());
    return json(route, { data: [], meta: { total: 0 } });
  });

  await page.goto('/inventory/replenishment');

  await expect(page.getByRole('row', { name: /Acucar refinado/i })).toContainText(/Sem oferta autorizada/i);
  expect(purchaseOrderRequests).toEqual([]);
  expect(movementRequests).toEqual([]);
});

test('nova consulta recalcula sugestoes com o saldo atual sem alterar pedidos existentes', async ({ page }) => {
  let consultation = 0;
  const purchaseOrderRequests: string[] = [];
  const existingOrderRequests: string[] = [];

  await page.route('**/api/company/procurement/replenishment-suggestions**', route => {
    consultation += 1;
    const currentStock = consultation === 1 ? 3 : 12;
    return json(route, {
      data: [{
        ...suggestions[0],
        current_stock: currentStock,
        required_quantity: 17 - currentStock,
        offers: [{
          ...suggestions[0].offers[0],
          suggested_quantity: consultation === 1 ? 15 : 5,
        }],
      }],
      meta: { total: 1 },
    });
  });
  await page.route('**/api/company/procurement/purchase-orders**', route => {
    if (route.request().method() === 'GET') existingOrderRequests.push(route.request().method());
    else purchaseOrderRequests.push(route.request().method());
    return json(route, { data: [], meta: { total: 0 } });
  });

  await page.goto('/inventory/replenishment');

  const milk = page.getByRole('row', { name: /Leite integral/i });
  await expect(milk).toContainText('Sugerido 15');
  await page.getByRole('button', { name: /Atualizar sugest(?:o|õ)es/i }).click();
  await expect(milk).toContainText('Sugerido 5');
  await expect.poll(() => consultation).toBe(2);
  expect(purchaseOrderRequests).toEqual([]);
  expect(existingOrderRequests).toEqual([]);
});

test('acao explicita cria pedidos separados por fornecedor com as quantidades ajustadas', async ({ page }) => {
  const payloads: Array<Record<string, unknown>> = [];
  await mockSuggestions(page);
  await page.route('**/api/company/procurement/purchase-orders', async route => {
    payloads.push(route.request().postDataJSON() as Record<string, unknown>);
    return json(route, { data: { id: 900 + payloads.length, status: 'draft' } }, 201);
  });

  await page.goto('/inventory/replenishment');
  await page.getByRole('checkbox', { name: /Leite integral.*Laticinios Minas/i }).check();
  await page.getByRole('spinbutton', { name: /Quantidade.*Leite integral/i }).fill('20');
  await page.getByRole('checkbox', { name: /Copos 300 ml.*Embalagens Brasil/i }).check();

  expect(payloads).toEqual([]);
  await page.getByRole('button', { name: /Criar pedidos de compra/i }).click();

  await expect.poll(() => payloads.length).toBe(2);
  expect(payloads).toEqual(expect.arrayContaining([
    expect.objectContaining({ unit_id: 101, supplier_id: 201, items: [{ inventory_item_id: 10, supplier_offer_id: 501, quantity: 20 }] }),
    expect.objectContaining({ unit_id: 101, supplier_id: 203, items: [{ inventory_item_id: 11, supplier_offer_id: 503, quantity: 100 }] }),
  ]));
});
