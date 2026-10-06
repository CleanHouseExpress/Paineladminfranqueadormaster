import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(page: Page, permissions = [
  'tenant.inventory.view',
  'tenant.procurement.suppliers.manage',
]) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'global-suppliers-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 10, name: 'Rede A', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions }));
  await page.route('**/api/me/units', route => json(route, []));
}

test('master habilita e desabilita fornecedor Orchestra explicitamente para sua rede', async ({ page }) => {
  await mockAuth(page);

  let enabled = false;
  let enablePayload: unknown = null;
  const localSupplier = {
    id: 901,
    name: 'Cafes Orchestra',
    document: '12.345.678/0001-90',
    phone: null,
    email: 'pedidos@cafesorchestra.test',
    contact_name: null,
    active: true,
    global_supplier_id: 51,
    metadata: {},
  };

  await page.route('**/api/company/inventory/items**', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/inventory/categories**', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/inventory/suppliers?per_page=100', route => json(route, {
    data: enabled ? [localSupplier] : [],
    meta: { total: enabled ? 1 : 0 },
  }));
  await page.route('**/api/company/inventory/global-suppliers**', route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (request.method() === 'POST' && pathname.endsWith('/51/enable')) {
      const body = request.postData();
      enablePayload = body ? JSON.parse(body) : null;
      enabled = true;
      return json(route, { data: localSupplier }, 201);
    }
    if (request.method() === 'DELETE' && pathname.endsWith('/51/enable')) {
      enabled = false;
      return json(route, null, 204);
    }

    return json(route, { data: [{
      id: 51,
      name: 'Cafes Orchestra',
      document: '12.345.678/0001-90',
      active: true,
      enabled,
      offers: [
        { id: 71, name: 'Cafe Especial 1kg', active: true },
        { id: 72, name: 'Cafe Tradicional 1kg', active: true },
      ],
    }] });
  });

  await page.goto('/inventory/suppliers');

  await expect(page.getByRole('heading', { name: 'Fornecedores' })).toBeVisible();
  const globalCatalog = page.getByTestId('global-suppliers-catalog');
  await expect(globalCatalog).toContainText('Cafes Orchestra');
  await expect(globalCatalog).toContainText('Cafe Especial 1kg');
  await expect(page.getByTestId('tenant-supplier-list')).not.toContainText('Cafes Orchestra');

  await page.getByRole('checkbox', { name: 'Cafe Especial 1kg' }).check();
  await page.getByRole('button', { name: 'Habilitar para a rede' }).click();
  expect(enablePayload).toEqual({ offer_ids: [71] });
  await expect(page.getByTestId('tenant-supplier-list')).toContainText('Cafes Orchestra');
  await expect(page.getByRole('button', { name: 'Desabilitar da rede' })).toBeVisible();

  await page.getByRole('button', { name: 'Desabilitar da rede' }).click();
  await expect(page.getByTestId('tenant-supplier-list')).not.toContainText('Cafes Orchestra');
  await expect(page.getByRole('button', { name: 'Habilitar para a rede' })).toBeVisible();
});

test('usuario sem a permissao de procurement nao recebe controles de habilitacao', async ({ page }) => {
  await mockAuth(page, [
    'tenant.inventory.view',
    'tenant.inventory.suppliers.manage',
  ]);

  await page.route('**/api/company/inventory/items**', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/inventory/categories**', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/inventory/suppliers?per_page=100', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/inventory/global-suppliers**', route => json(route, { data: [{
    id: 51,
    name: 'Cafes Orchestra',
    document: '12.345.678/0001-90',
    active: true,
    enabled: false,
    offers: [{ id: 71, name: 'Cafe Especial 1kg', active: true }],
  }] }));

  await page.goto('/inventory/suppliers');

  await expect(page.getByTestId('global-suppliers-catalog')).toContainText('Cafes Orchestra');
  await expect(page.getByRole('button', { name: 'Habilitar para a rede' })).toHaveCount(0);
});
