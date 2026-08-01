import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const strawberry = { id: 10, name: 'Morango', unit_of_measure: 'kg', active: true, track_inventory: true, minimum_stock: 0, stock_balances: [] };
const milk = { id: 11, name: 'Leite', unit_of_measure: 'l', active: true, track_inventory: true, minimum_stock: 0, stock_balances: [] };
const output = { id: 12, name: 'Sorvete de morango', unit_of_measure: 'l', active: true, track_inventory: true, minimum_stock: 0, stock_balances: [] };

let recipe = {
  id: 1,
  code: 'REC-SORV-MORANGO',
  name: 'Sorvete de morango',
  description: 'Base padrao Melten',
  recipe_type: 'physical_product',
  catalog_item_id: null,
  catalog_item: null,
  active: true,
  active_version_id: null,
  active_version: null,
  metadata: {},
};

let version = {
  id: 100,
  recipe_id: 1,
  version: 1,
  status: 'draft',
  effective_from: null,
  effective_until: null,
  base_quantity: 1,
  base_uom_id: 4,
  base_uom: { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' },
  expected_yield_quantity: 10,
  expected_yield_uom_id: 4,
  expected_yield_uom: { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' },
  expected_waste_percent: null,
  governance: {},
  settings: {},
  metadata: {},
  published_at: null,
  published_by: null,
  components: [],
  outputs: [],
};

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'recipes-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
    { module_id: 'recipes', name: 'Fichas Tecnicas', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.recipes.view', 'tenant.recipes.create', 'tenant.recipes.update', 'tenant.recipes.publish', 'tenant.recipes.archive', 'tenant.recipes.simulate',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockRecipeApi(page: Page) {
  await page.route('**/api/metadata/recipes', route => json(route, { data: { form_schema: [], table_schema: [] } }));
  await page.route('**/api/metadata/recipe_versions', route => json(route, { data: { form_schema: [], table_schema: [] } }));
  await page.route('**/api/company/catalog/items**', route => json(route, { data: [] }));
  await page.route('**/api/company/units/options', route => json(route, [{ id: 101, name: 'Melten Centro' }]));
  await page.route('**/api/company/inventory/items**', route => json(route, { data: [strawberry, milk, output], meta: { total: 3 } }));
  await page.route('**/api/company/recipes**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path.endsWith('/versions/1/calculate')) return json(route, { data: {
      recipe: { id: 1, code: recipe.code, name: recipe.name, version: 1, status: 'published' },
      request: { target_quantity: '25.000000', target_uom: { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' }, unit_id: null },
      scale_factor: '2.50000000',
      expected_output: { quantity: '25.000000', uom: { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' }, output_type: 'inventory_item' },
      yield: { base_quantity: '10.000000', base_uom: { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' }, requested_quantity_in_yield_uom: '25.000000' },
      components: [{ id: 1, inventory_item_id: 10, name: 'Morango', base_quantity: '10.000000', expected_loss_quantity: '0.000000', gross_quantity: '10.000000', uom: { id: 2, code: 'kg', name: 'Quilograma', symbol: 'kg', dimension: 'mass' }, estimated_cost: '184.50', cost_available: true }],
      estimated_total_cost: '184.50', estimated_cost_per_output_unit: '7.38', currency: 'BRL', cost_coverage: { components_total: 1, components_with_cost: 1, complete: true }, cost_complete: true, warnings: [], side_effects: { stock_movement_created: false, stock_balance_changed: false, finance_created: false },
    } });
    if (path.endsWith('/versions/1/publish')) { version = { ...version, status: 'published', published_at: '2026-08-01T12:00:00.000Z' }; recipe = { ...recipe, active_version_id: 100, active_version: version }; return json(route, { data: version }); }
    if (path.endsWith('/versions/1/validate')) return json(route, { data: { valid: true, recipe_id: 1, recipe_version_id: 100, version: 1 } });
    if (path.endsWith('/versions/1') && request.method() === 'PUT') { const payload = await request.postDataJSON(); version = { ...version, ...payload, components: payload.components, outputs: payload.outputs }; return json(route, { data: version }); }
    if (path.endsWith('/versions/1')) return json(route, { data: version });
    if (path.endsWith('/versions')) return json(route, { data: [version] });
    if (request.method() === 'POST' && path.endsWith('/recipes')) return json(route, { data: recipe }, 201);
    if (path.endsWith('/recipes/1')) return json(route, { data: recipe });
    return json(route, { data: [recipe], meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 } });
  });
}

test('@smoke recipes cria ficha, publica versao e calcula previa oficial', async ({ page }) => {
  await mockAuth(page);
  await mockRecipeApi(page);
  await page.goto('/recipes');
  await expect(page.getByTestId('recipes-page')).toBeVisible();
  await expect(page.getByText('Sorvete de morango')).toBeVisible();
  await page.getByTestId('recipe-new-button').click();
  await page.getByTestId('recipe-code').fill('REC-SORV-MORANGO');
  await page.getByTestId('recipe-name').fill('Sorvete de morango');
  await page.getByTestId('recipe-save-button').click();
  await expect(page.getByTestId('recipe-version-editor')).toBeVisible();
  await page.getByTestId('recipe-add-component').click();
  await page.getByTestId('recipe-component-item-0').selectOption('10');
  await page.getByTestId('recipe-output-item').selectOption('12');
  await Promise.all([
    page.waitForResponse(response => response.request().method() === 'PUT' && response.url().includes('/api/company/recipes/1/versions/1')),
    page.getByTestId('recipe-version-save').click(),
  ]);
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/company/recipes/1/versions/1/validate')),
    page.getByTestId('recipe-version-validate').click(),
  ]);
  page.once('dialog', dialog => dialog.accept());
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/company/recipes/1/versions/1/publish')),
    page.getByTestId('recipe-version-publish').click(),
  ]);
  await expect(page.getByTestId('recipe-calculate-button')).toBeVisible();
  await page.getByTestId('recipe-preview-quantity').fill('25');
  await page.getByTestId('recipe-calculate-button').click();
  await expect(page.getByTestId('recipe-calculation-result')).toContainText('Morango');
  await expect(page.getByTestId('recipe-calculation-result')).toContainText('R$ 184,50');
});


