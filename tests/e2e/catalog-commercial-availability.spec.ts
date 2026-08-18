import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockSession(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'commercial-availability-token');
    window.sessionStorage.setItem('catalog-onboarding-invite-seen', '1');
  });

  await page.route('**/api/me', route => json(route, {
    data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' },
  }));
  await page.route('**/api/me/company', route => json(route, {
    data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' },
  }));
  await page.route('**/api/me/modules**', route => json(route, {
    data: [{ module_id: 'catalog', name: 'Catalogo', status: 'active' }],
  }));
  await page.route('**/api/me/roles', route => json(route, {
    data: [{ id: 1, name: 'company_admin' }],
  }));
  await page.route('**/api/me/permissions', route => json(route, {
    data: [
      'tenant.catalog.view',
      'tenant.catalog.availability.view',
      'tenant.catalog.availability.update',
    ],
  }));
  await page.route('**/api/me/units', route => json(route, {
    data: [
      { id: 101, name: 'Unidade Centro' },
      { id: 102, name: 'Unidade Norte' },
    ],
  }));
}

async function mockCatalog(page: Page) {
  await page.route('**/api/metadata/catalog_items', route => json(route, {
    data: {
      singular_label: 'Item',
      plural_label: 'Itens',
      form_schema: [],
      table_schema: [],
      settings: {},
      active: true,
    },
  }));
  await page.route('**/api/company/catalog/items/42', route => json(route, {
    data: {
      id: 42,
      name: 'Cafe especial',
      item_type: 'product',
      status: 'active',
      standard_price: 18.5,
      sku: 'CAFE-42',
      unit_of_measure: 'un',
      tracks_inventory: true,
      catalog_visible: true,
      metadata: {},
      product_detail: { min_stock: 3, cost_price: 8 },
      created_at: '2026-08-01T10:00:00.000Z',
      updated_at: '2026-08-01T10:00:00.000Z',
    },
  }));
  await page.route('**/api/company/catalog/items/42/commercial-availability**', route => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('unit_id')).toBe('102');
    return json(route, {
      data: {
        network_available: false,
        unit_override: null,
        commercially_available: false,
        commercial_availability_source: 'network',
        inherited: true,
      },
    });
  });
}

test('commercial availability exige unidade explicita e mostra valor, origem e heranca da API', async ({ page }) => {
  await mockSession(page);
  await mockCatalog(page);

  await page.goto('/catalog/42');

  const availability = page.getByTestId('commercial-availability-section');
  await expect(availability).toContainText('Disponibilidade comercial');
  await expect(availability).toContainText('Selecione uma unidade');

  await page.getByTestId('commercial-availability-unit-select').selectOption('102');

  await expect(availability).toContainText('Indisponível');
  await expect(availability).toContainText('Herdado da rede');
  await expect(availability.getByRole('button', { name: 'Restaurar herança' })).toHaveCount(0);
});
