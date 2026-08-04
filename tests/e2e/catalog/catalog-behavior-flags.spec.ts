import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

type ApiCatalogItem = {
  id: number;
  name: string;
  item_type: string;
  status: string;
  base_price: number;
  sku: string | null;
  unit_of_measure: string;
  tracks_inventory: boolean;
  catalog_visible: boolean;
  metadata: Record<string, unknown>;
  product_detail?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const baseItem = (
  id: number,
  name: string,
  tracks_inventory: boolean,
  catalog_visible: boolean,
  item_type = 'product',
): ApiCatalogItem => ({
  id,
  name,
  item_type,
  status: 'active',
  base_price: 24,
  sku: `CAT-${id}`,
  unit_of_measure: 'un',
  tracks_inventory,
  catalog_visible,
  metadata: {},
  product_detail: item_type === 'product' ? { min_stock: 3, cost_price: 12 } : null,
  created_at: '2026-08-04T10:00:00.000Z',
  updated_at: '2026-08-04T10:00:00.000Z',
});

async function mockAuth(page: Page, permissions: string[]) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'catalog-behavior-token');
    window.sessionStorage.setItem('catalog-onboarding-invite-seen', '1');
  });
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'catalog', name: 'Catalogo', status: 'active' },
    { module_id: 'sales', name: 'Vendas', status: 'active' },
    { module_id: 'pricing', name: 'Precos', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockCatalogConfig(page: Page) {
  await page.route('**/api/metadata/catalog_items', route => json(route, {
    data: {
      singular_label: 'Item',
      plural_label: 'Itens',
      description: 'Catalogo',
      form_schema: [
        { key: 'name', label: 'Nome', field_type: 'text', required: true, visible: true, order: 1 },
      ],
      table_schema: [],
      settings: {
        module_title: 'Catalogo',
        new_item_label: 'Novo Item',
        enabled_types: ['product', 'internal_supply', 'service', 'custom'],
      },
      active: true,
    },
  }));
  await page.route('**/api/company/catalog/onboarding**', route => json(route, {
    data: {
      version: 1,
      context: 'network',
      started: true,
      completed: false,
      dismissed: true,
      current_step: 'first_item',
      suggested_next_module: null,
      progress: { percent: 0, completed_steps: [], skipped_steps: [], pending_steps: [], auto_completed_steps: [] },
      steps: [],
      completed_at: null,
      status: 'dismissed',
    },
  }));
}

async function mockCatalogApi(page: Page, initialItems = [
  baseItem(1, 'Produto Comercial', true, true),
  baseItem(2, 'Servico Comercial', false, true, 'service'),
  baseItem(3, 'Insumo Interno', true, false),
  baseItem(4, 'Item Administrativo', false, false, 'custom'),
]) {
  let items = [...initialItems];
  const mutations: Array<Record<string, unknown>> = [];
  const listQueries: string[] = [];

  await mockCatalogConfig(page);
  await page.route('**/api/company/catalog/settings', route => json(route, { data: {} }));
  await page.route('**/api/company/catalog/items**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const idMatch = url.pathname.match(/\/catalog\/items\/(\d+)$/);

    if (url.pathname.endsWith('/metrics')) {
      return json(route, {
        total: items.length,
        active: items.filter(item => item.status === 'active').length,
        inactive: 0,
        archived: 0,
        average_price: 24,
      });
    }

    if (request.method() === 'POST') {
      const payload = request.postDataJSON() as Record<string, unknown>;
      mutations.push(payload);
      const created = baseItem(
        items.length + 10,
        String(payload.name),
        Boolean(payload.tracks_inventory),
        Boolean(payload.catalog_visible),
        String(payload.item_type ?? 'service'),
      );
      items = [...items, created];
      return json(route, { data: created }, 201);
    }

    if (request.method() === 'PUT' && idMatch) {
      const payload = request.postDataJSON() as Record<string, unknown>;
      mutations.push(payload);
      items = items.map(item => item.id === Number(idMatch[1])
        ? {
          ...item,
          name: String(payload.name ?? item.name),
          item_type: String(payload.item_type ?? item.item_type),
          status: String(payload.status ?? item.status),
          tracks_inventory: Boolean(payload.tracks_inventory),
          catalog_visible: Boolean(payload.catalog_visible),
          updated_at: '2026-08-04T12:00:00.000Z',
        }
        : item);
      return json(route, { data: items.find(item => item.id === Number(idMatch[1])) });
    }

    if (request.method() === 'GET' && idMatch) {
      return json(route, { data: items.find(item => item.id === Number(idMatch[1])) });
    }

    listQueries.push(url.search);
    const tracks = url.searchParams.get('tracks_inventory');
    const visible = url.searchParams.get('catalog_visible');
    const filtered = items.filter(item =>
      (tracks === null || item.tracks_inventory === (tracks === 'true')) &&
      (visible === null || item.catalog_visible === (visible === 'true')));
    return json(route, { data: filtered, meta: { total: filtered.length } });
  });

  return { mutations, listQueries };
}

async function fillNameAndSave(page: Page, name: string) {
  await page.getByPlaceholder(/Nome do item/i).fill(name);
  await page.getByRole('button', { name: /Salvar Item/i }).click();
  await expect(page).toHaveURL(/\/catalog\/\d+$/);
}

test('@smoke catalog separa controle de estoque e visibilidade comercial', async ({ page }) => {
  await mockAuth(page, ['tenant.catalog.view', 'tenant.catalog.create', 'tenant.catalog.update']);
  const api = await mockCatalogApi(page);

  const cases = [
    ['Produto E2E com estoque', true, true],
    ['Servico E2E sem estoque', false, true],
    ['Insumo E2E interno', true, false],
    ['Administrativo E2E', false, false],
  ] as const;

  for (const [name, tracksInventory, catalogVisible] of cases) {
    await page.goto('/catalog/new');
    if (tracksInventory) await page.getByTestId('catalog-tracks-inventory-switch').click();
    if (!catalogVisible) await page.getByTestId('catalog-visible-switch').click();
    await fillNameAndSave(page, name);
  }

  expect(api.mutations.slice(0, 4).map(payload => ({
    tracks_inventory: payload.tracks_inventory,
    catalog_visible: payload.catalog_visible,
    legacy_track_stock: (payload.product_detail as Record<string, unknown> | undefined)?.track_stock,
  }))).toEqual([
    { tracks_inventory: true, catalog_visible: true, legacy_track_stock: undefined },
    { tracks_inventory: false, catalog_visible: true, legacy_track_stock: undefined },
    { tracks_inventory: true, catalog_visible: false, legacy_track_stock: undefined },
    { tracks_inventory: false, catalog_visible: false, legacy_track_stock: undefined },
  ]);

  await page.goto('/catalog/1/edit');
  await page.getByTestId('catalog-visible-switch').click();
  await page.getByRole('button', { name: /Salvar Item/i }).click();
  await expect(page).toHaveURL(/\/catalog\/1$/);
  expect(api.mutations.at(-1)).toMatchObject({ catalog_visible: false, tracks_inventory: true });

  await page.goto('/catalog/1/edit');
  await page.getByTestId('catalog-tracks-inventory-switch').click();
  await expect(page.getByTestId('catalog-inventory-disable-warning')).toContainText('historico existente sera preservado');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /Salvar Item/i }).click();
  await expect(page).toHaveURL(/\/catalog\/1$/);
  expect(api.mutations.at(-1)).toMatchObject({ catalog_visible: false, tracks_inventory: false });

  await page.goto('/catalog/3/edit');
  await page.getByTestId('catalog-tracks-inventory-switch').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: /Salvar Item/i }).click();
  await expect(page.getByTestId('catalog-tracks-inventory-switch')).toHaveAttribute('aria-checked', 'true');

  await page.goto('/catalog');
  await expect(page.getByRole('row', { name: /Insumo Interno/i })).toContainText('Controla estoque');
  await expect(page.getByRole('row', { name: /Insumo Interno/i })).toContainText('Oculto no catalogo');
  await page.getByTestId('catalog-filter-tracks-inventory').selectOption('false');
  await page.getByTestId('catalog-filter-visible').selectOption('true');
  await expect.poll(() => api.listQueries.some(query =>
    query.includes('tracks_inventory=false') && query.includes('catalog_visible=true'))).toBeTruthy();
  await expect(page.getByText('Servico Comercial')).toBeVisible();
  await page.getByRole('button', { name: /Limpar filtros/i }).click();
  await expect(page.getByTestId('catalog-filter-tracks-inventory')).toHaveValue('');
  await expect(page.getByTestId('catalog-filter-visible')).toHaveValue('');

  await page.goto('/catalog/3');
  await expect(page.getByTestId('catalog-behavior-section')).toContainText('Controla estoque');
  await expect(page.getByTestId('catalog-behavior-section')).toContainText('Oculto no catalogo');
  await expect(page.getByTestId('catalog-behavior-section')).toContainText('controla estoque, mas nao aparece no catalogo comercial');
  await expect(page.getByText('track_stock')).toHaveCount(0);
});

test('catalog exibe flags para usuario somente leitura sem liberar edicao', async ({ page }) => {
  await mockAuth(page, ['tenant.catalog.view']);
  await mockCatalogApi(page);

  await page.goto('/catalog/1');

  await expect(page.getByTestId('catalog-behavior-section')).toContainText('Controla estoque');
  await expect(page.getByTestId('catalog-behavior-section')).toContainText('Visivel no catalogo');
  await expect(page.getByRole('button', { name: /^Editar$/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Editar Item/i })).toHaveCount(0);
});

test('pricing continua administrando item apos alteracao das flags do catalogo', async ({ page }) => {
  await mockAuth(page, ['tenant.catalog.view', 'tenant.catalog.update', 'tenant.pricing.view']);
  await mockCatalogApi(page, [baseItem(11, 'Acai Bowl', false, false)]);
  const pricingMutations: string[] = [];
  await page.route('**/api/company/pricing/products**', route => {
    pricingMutations.push(route.request().method());
    return json(route, {
      data: [
        {
          id: 50,
          catalog_item_id: 11,
          catalog_item: { id: 11, name: 'Acai Bowl', sku: 'CAT-11', item_type: 'product', unit_of_measure: 'un' },
          sale_price: 19.9,
          cost_price: 8,
          currency: 'BRL',
          active: true,
          created_at: '2026-08-04T10:00:00.000Z',
          updated_at: '2026-08-04T10:00:00.000Z',
        },
      ],
      meta: { total: 1 },
    });
  });

  await page.goto('/pricing/products');

  await expect(page.getByText('Acai Bowl')).toBeVisible();
  await expect(page.getByText('R$ 19,90')).toBeVisible();
  expect(pricingMutations).toEqual(['GET']);
});
