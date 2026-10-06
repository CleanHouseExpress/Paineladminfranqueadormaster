import { expect, test, type Page, type Request, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuthenticatedInventoryUser(page: Page, permissions: string[] = [
  'tenant.inventory.view',
  'tenant.inventory.transfer',
  'tenant.inventory.transfer.approve',
  'tenant.inventory.transfer.receive',
]) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'internal-transfer-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Gestor de estoque', email: 'estoque@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Rede Orchestra', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [{ module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' }] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'inventory_manager' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions }));
  await page.route('**/api/me/units', route => json(route, []));
}

function inventorySettings(enableTransfers = true) {
  return {
    data: {
      inventory_enabled: true,
      inventory_mode: 'advanced',
      enable_transfers: enableTransfers,
      capabilities: { enabled: true, transfers: enableTransfers },
    },
  };
}

test('@release @inventory solicita abastecimento interno sem fornecedor ou pedido de compra', async ({ page }) => {
  await mockAuthenticatedInventoryUser(page);
  const origin = { id: 101, name: 'Centro de Distribuicao' };
  const destination = { id: 202, name: 'Unidade Savassi' };
  const item = { id: 301, name: 'Copo 300 ml', sku: 'COPO-300', unit_of_measure: 'unit', active: true, track_inventory: true };

  await page.route('**/api/company/inventory/settings', route => json(route, inventorySettings(true)));
  await page.route('**/api/company/inventory/transfers**', route => {
    if (route.request().method() === 'GET') return json(route, { data: [], meta: { total: 0 } });
    if (route.request().method() === 'POST') {
      return json(route, { data: {
        id: 1,
        origin_unit_id: origin.id,
        origin_unit_name: origin.name,
        destination_unit_id: destination.id,
        destination_unit_name: destination.name,
        status: 'requested',
        items: [{ id: 1, inventory_item_id: item.id, item_name: item.name, quantity: 12, unit_cost: 0 }],
      } }, 201);
    }
    return route.fallback();
  });
  await page.route('**/api/company/units/options', route => json(route, [
    { value: String(origin.id), label: origin.name },
    { value: String(destination.id), label: destination.name },
  ]));
  await page.route('**/api/company/inventory/items**', route => json(route, { data: [item], meta: { total: 1 } }));

  await page.goto('/inventory/transfers');
  await expect(page.getByRole('heading', { name: 'Transferências' })).toBeVisible();
  await page.getByRole('button', { name: /nova transfer[eê]ncia/i }).click();
  await page.getByLabel(/unidade de origem/i).selectOption(String(origin.id));
  await page.getByLabel(/unidade de destino/i).selectOption(String(destination.id));
  await page.getByLabel(/item/i).selectOption(String(item.id));
  await page.getByLabel(/quantidade/i).fill('12');

  const creation = page.waitForRequest(request => request.method() === 'POST' && new URL(request.url()).pathname === '/api/company/inventory/transfers');
  await page.getByRole('button', { name: /solicitar transfer[eê]ncia/i }).click();
  const request: Request = await creation;
  const payload = request.postDataJSON() as Record<string, unknown>;

  expect(payload).toMatchObject({
    origin_unit_id: origin.id,
    destination_unit_id: destination.id,
    items: [{ inventory_item_id: item.id, quantity: 12 }],
  });
  expect(payload).not.toHaveProperty('origin_stock_location_id');
  expect(payload).not.toHaveProperty('destination_stock_location_id');
  expect(payload).not.toHaveProperty('supplier_id');
  expect(payload).not.toHaveProperty('purchase_order_id');
});

test('@release @inventory usa PATCH e endpoints canonicos nas acoes da transferencia', async ({ page }) => {
  await mockAuthenticatedInventoryUser(page);
  await page.route('**/api/company/inventory/settings', route => json(route, inventorySettings(true)));

  let status = 'requested';
  const seen: string[] = [];
  const transfer = () => ({ data: {
    id: 196,
    origin_unit_id: 101,
    origin_unit_name: 'CD Central',
    destination_unit_id: 202,
    destination_unit_name: 'Unidade Centro',
    status,
    requested_at: '2026-10-06T09:00:00.000Z',
    items: [{ id: 1, inventory_item_id: 10, item_name: 'Cafe em graos', quantity: 12, unit_cost: 20 }],
  } });

  await page.route('**/api/company/inventory/transfers/196**', route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'GET' && path.endsWith('/196')) return json(route, transfer());
    if (request.method() === 'PATCH' && path.endsWith('/approve')) status = 'approved';
    else if (request.method() === 'PATCH' && path.endsWith('/ship')) status = 'in_transit';
    else if (request.method() === 'PATCH' && path.endsWith('/receive')) status = 'received';
    else return route.fallback();
    seen.push(`${request.method()} ${path}`);
    return json(route, transfer());
  });

  await page.goto('/inventory/transfers/196');
  await page.getByRole('button', { name: 'Aprovar' }).click();
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('button', { name: 'Receber' })).toBeVisible();
  await page.getByRole('button', { name: 'Receber' }).click();

  expect(seen).toEqual([
    'PATCH /api/company/inventory/transfers/196/approve',
    'PATCH /api/company/inventory/transfers/196/ship',
    'PATCH /api/company/inventory/transfers/196/receive',
  ]);
});

test('@release @inventory oculta custo sem permissao financeira', async ({ page }) => {
  await mockAuthenticatedInventoryUser(page, ['tenant.inventory.view', 'tenant.inventory.transfer']);
  await page.route('**/api/company/inventory/settings', route => json(route, inventorySettings(true)));
  await page.route('**/api/company/inventory/transfers/196', route => json(route, { data: {
    id: 196,
    origin_unit_id: 101,
    origin_unit_name: 'CD Central',
    destination_unit_id: 202,
    destination_unit_name: 'Unidade Centro',
    status: 'approved',
    requested_at: '2026-10-06T09:00:00.000Z',
    items: [{ id: 1, inventory_item_id: 10, item_name: 'Cafe em graos', quantity: 12, unit_cost: 987.65 }],
  } }));

  await page.goto('/inventory/transfers/196');
  await expect(page.getByRole('columnheader', { name: /custo unit.rio/i })).toHaveCount(0);
  await expect(page.getByText(/987[,.]65/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enviar' })).toHaveCount(0);
});

test('@release @inventory nao consulta transferencias quando recurso esta desativado', async ({ page }) => {
  await mockAuthenticatedInventoryUser(page);
  let transferRequests = 0;
  await page.route('**/api/company/inventory/settings', route => json(route, inventorySettings(false)));
  await page.route('**/api/company/inventory/transfers**', route => {
    transferRequests += 1;
    return json(route, { data: [] });
  });

  await page.goto('/inventory/transfers');
  await expect(page.getByText(/desativadas para esta rede/i)).toBeVisible();
  expect(transferRequests).toBe(0);
  await expect(page.getByRole('link', { name: 'Transferencias' })).toHaveCount(0);
});
