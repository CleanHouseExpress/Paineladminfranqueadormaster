import { expect, test, type Page, type Request, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuthenticatedInventoryUser(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'internal-transfer-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Gestor de estoque', email: 'estoque@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Rede Orchestra', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [{ module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' }] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'inventory_manager' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.inventory.view',
    'tenant.inventory.transfer',
    'tenant.inventory.transfer.approve',
    'tenant.inventory.transfer.receive',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

test('@release @inventory solicita abastecimento interno sem fornecedor ou pedido de compra', async ({ page }) => {
  await mockAuthenticatedInventoryUser(page);

  const origin = { id: 101, name: 'Centro de Distribuicao' };
  const destination = { id: 202, name: 'Unidade Savassi' };
  const originLocation = { id: 501, unit_id: origin.id, name: 'Expedicao CD', code: 'CD-EXP', type: 'main', is_default: true, active: true };
  const destinationLocation = { id: 502, unit_id: destination.id, name: 'Estoque Savassi', code: 'SAV-EST', type: 'main', is_default: true, active: true };
  const item = { id: 301, name: 'Copo 300 ml', sku: 'COPO-300', unit_of_measure: 'unit', active: true, track_inventory: true };

  await page.route('**/api/company/inventory/transfers**', route => {
    if (route.request().method() === 'GET') return json(route, { data: [], meta: { total: 0 } });
    return route.fallback();
  });
  await page.route('**/api/company/units/options', route => json(route, [
    { value: String(origin.id), label: origin.name },
    { value: String(destination.id), label: destination.name },
  ]));
  await page.route('**/api/company/inventory/locations**', route => json(route, { data: [originLocation, destinationLocation], meta: { total: 2 } }));
  await page.route('**/api/company/inventory/items**', route => json(route, { data: [item], meta: { total: 1 } }));

  await page.goto('/inventory/transfers');
  await expect(page.getByRole('heading', { name: 'Transferências' })).toBeVisible();
  await page.getByRole('button', { name: /nova transfer[eê]ncia/i }).click();

  await page.getByLabel(/unidade de origem/i).selectOption(String(origin.id));
  await page.getByLabel(/local de origem/i).selectOption(String(originLocation.id));
  await page.getByLabel(/unidade de destino/i).selectOption(String(destination.id));
  await page.getByLabel(/local de destino/i).selectOption(String(destinationLocation.id));
  await page.getByLabel(/item/i).selectOption(String(item.id));
  await page.getByLabel(/quantidade/i).fill('12');

  const creation = page.waitForRequest(request => (
    request.method() === 'POST'
    && new URL(request.url()).pathname === '/api/company/inventory/transfers'
  ));
  await page.getByRole('button', { name: /solicitar transfer[eê]ncia/i }).click();
  const request: Request = await creation;
  const payload = request.postDataJSON() as Record<string, unknown>;

  expect(payload).toMatchObject({
    origin_unit_id: origin.id,
    destination_unit_id: destination.id,
    origin_stock_location_id: originLocation.id,
    destination_stock_location_id: destinationLocation.id,
    items: [{ inventory_item_id: item.id, quantity: 12 }],
  });
  expect(payload).not.toHaveProperty('supplier_id');
  expect(payload).not.toHaveProperty('purchase_order_id');
});
