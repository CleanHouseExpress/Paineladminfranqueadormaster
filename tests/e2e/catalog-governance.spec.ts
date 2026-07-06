import { expect, request, test } from '@playwright/test';
import { apiUrl, unique, users } from './support/test-data';

type ApiContext = Awaited<ReturnType<typeof request.newContext>>;
const tenantHost = new URL(apiUrl).host;
const nodeApiUrl = apiUrl.replace(/^http:\/\/orchestra-e2e\.localhost(?::\d+)?/, 'http://127.0.0.1:8000');

async function login(email: string, password: string) {
  const context = await request.newContext({
    baseURL: nodeApiUrl,
    extraHTTPHeaders: {
      Host: tenantHost,
      Accept: 'application/json',
    },
  });
  const response = await context.post('/api/company/login', { data: { email, password } });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  return request.newContext({
    baseURL: nodeApiUrl,
    extraHTTPHeaders: {
      Host: tenantHost,
      Authorization: `Bearer ${body.token}`,
      Accept: 'application/json',
    },
  });
}

async function getUnits(api: ApiContext) {
  const response = await api.get('/api/company/units/options');
  expect(response.status(), await response.text()).toBe(200);
  const units = await response.json();
  return {
    centro: units.find((unit: Record<string, unknown>) => String(unit.label).includes('Centro')),
    norte: units.find((unit: Record<string, unknown>) => String(unit.label).includes('Norte')),
  };
}

test('@smoke governanca de catalogo por unidade aplica aprovacao, visibilidade e preco local', async () => {
  const master = await login(users.master.email, users.master.password);
  const centro = await login(users.centro.email, users.centro.password);
  const norte = await login(users.norte.email, users.norte.password);

  const units = await getUnits(master);
  expect(units.centro?.id ?? units.centro?.value).toBeTruthy();
  expect(units.norte?.id ?? units.norte?.value).toBeTruthy();

  const centroUnitId = Number(units.centro.id ?? units.centro.value);
  const itemName = unique('Sorvete governanca E2E');
  const sku = `CAT-GOV-${Date.now()}`;

  const settings = await master.put('/api/company/catalog/settings', {
    data: {
      allow_unit_local_items: true,
      allow_unit_edit_price: true,
      allow_unit_create_products: true,
      allow_unit_create_services: true,
      local_items_require_approval: true,
      allow_promote_local_items: true,
    },
  });
  expect(settings.status(), await settings.text()).toBe(200);
  expect((await settings.json()).data.allow_unit_local_items).toBe(true);

  const created = await centro.post('/api/company/catalog/items', {
    data: {
      name: itemName,
      description: 'Item local criado pelo franqueado no E2E',
      item_type: 'product',
      status: 'active',
      base_price: 50,
      sku,
      unit_of_measure: 'kg',
      metadata: {},
      product_detail: {
        track_stock: false,
      },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const localItem = (await created.json()).data;
  expect(localItem.scope).toBe('local');
  expect(localItem.approval_status).toBe('pending');

  const pendingOptions = await centro.get('/api/company/catalog/items/options');
  expect(pendingOptions.status(), await pendingOptions.text()).toBe(200);
  expect((await pendingOptions.json()).map((item: Record<string, unknown>) => item.label)).not.toContain(itemName);

  const forbiddenApprove = await centro.patch(`/api/company/catalog/items/${localItem.id}/approve`, { data: {} });
  expect(forbiddenApprove.status()).toBe(403);

  const approved = await master.patch(`/api/company/catalog/items/${localItem.id}/approve`, { data: {} });
  expect(approved.status(), await approved.text()).toBe(200);
  expect((await approved.json()).data.approval_status).toBe('approved');

  const centroOptions = await centro.get('/api/company/catalog/items/options');
  expect(centroOptions.status(), await centroOptions.text()).toBe(200);
  const centroCatalog = await centroOptions.json();
  expect(centroCatalog.map((item: Record<string, unknown>) => item.label)).toContain(itemName);

  const norteOptions = await norte.get('/api/company/catalog/items/options');
  expect(norteOptions.status(), await norteOptions.text()).toBe(200);
  expect((await norteOptions.json()).map((item: Record<string, unknown>) => item.label)).not.toContain(itemName);

  const price = await centro.put(`/api/company/catalog/items/${localItem.id}/unit-price`, {
    data: { price: 77.7, active: true },
  });
  expect(price.status(), await price.text()).toBe(200);
  expect(Number((await price.json()).data.price)).toBe(77.7);

  const sale = await master.post('/api/company/sales/orders', {
    data: {
      unit_id: centroUnitId,
      sale_date: '2026-07-06',
      payment_status: 'unpaid',
      notes: 'Venda E2E para validar preco local do catalogo',
      items: [{
        catalog_item_id: localItem.id,
        description: itemName,
        quantity: 2,
        unit_price: 0,
        discount: 0,
      }],
    },
  });
  expect(sale.status(), await sale.text()).toBe(201);
  const order = (await sale.json()).data;
  expect(Number(order.items[0].unit_price)).toBe(77.7);
  expect(Number(order.total)).toBe(155.4);

  await master.dispose();
  await centro.dispose();
  await norte.dispose();
});
