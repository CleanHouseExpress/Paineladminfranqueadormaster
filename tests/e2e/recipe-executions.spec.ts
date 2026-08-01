import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const uomLiter = { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' };
const uomKg = { id: 2, code: 'kg', name: 'Quilograma', symbol: 'kg', dimension: 'mass' };
const unit = { id: 101, name: 'Melten Centro' };
const location = { id: 501, unit_id: 101, name: 'Estoque Principal', code: 'PRINC', active: true };
const recipe = {
  id: 1,
  code: 'REC-SORV-MORANGO',
  name: 'Sorvete de morango',
  recipe_type: 'physical_product',
  active: true,
  active_version_id: 100,
  active_version: { id: 100, recipe_id: 1, version: 1, status: 'published', expected_yield_quantity: '10.000000', expected_yield_uom: uomLiter },
};
const calculation = {
  recipe: { id: 1, code: recipe.code, name: recipe.name, version_id: 100, version: 1, status: 'published' },
  request: { target_quantity: '25.000000', target_uom: uomLiter, unit_id: 101 },
  scale_factor: '2.50000000',
  expected_output: { id: 20, output_type: 'inventory_item', inventory_item_id: 12, description: 'Sorvete de morango', quantity: '25.000000', uom: uomLiter },
  yield: { base_quantity: '10.000000', base_uom: uomLiter, requested_quantity_in_yield_uom: '25.000000' },
  components: [
    { id: 1, inventory_item_id: 10, name: 'Morango', base_quantity: '10.000000', expected_loss_quantity: '0.000000', gross_quantity: '10.000000', uom: uomKg, unit_cost: '18.45', estimated_cost: '184.50', cost_available: true },
  ],
  estimated_total_cost: '184.50',
  estimated_cost_per_output_unit: '7.38',
  currency: 'BRL',
  cost_coverage: { components_total: 1, components_with_cost: 1, complete: true },
  cost_complete: true,
  warnings: [],
  side_effects: { stock_movement_created: false, stock_balance_changed: false, finance_created: false, dre_created: false, simulation_persisted: false, event_published: false },
};

let execution = {
  id: 900,
  number: 'RE-20260801-000900',
  recipe_id: 1,
  recipe,
  recipe_version_id: 100,
  version: { id: 100, version: 1, status: 'published' },
  unit_id: 101,
  unit,
  stock_location_id: 501,
  stock_location: location,
  target_quantity: '25.000000',
  target_uom_id: 4,
  target_uom: uomLiter,
  status: 'confirmed',
  operation_id: '11111111-1111-4111-8111-111111111111',
  idempotency_key: 'recipe-execution-e2e',
  correlation_id: null,
  calculation_snapshot: calculation,
  input_movement_id: 700,
  output_movement_id: 701,
  input_movement: { id: 700, number: 'SM-20260801-000700', movement_type: 'exit', items: calculation.components },
  output_movement: { id: 701, number: 'SM-20260801-000701', movement_type: 'entry', items: [{ inventory_item_id: 12, quantity: '25.000000', uom: 'l' }] },
  executed_at: '2026-08-01T12:00:00.000Z',
  executed_by_name: 'Admin Master',
  notes: 'Producao do turno',
  metadata: {},
  reversed_at: null,
  reversed_by: null,
  reversal_reason: null,
  created_at: '2026-08-01T12:00:00.000Z',
  updated_at: '2026-08-01T12:00:00.000Z',
};

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'recipe-executions-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
    { module_id: 'recipes', name: 'Fichas Tecnicas', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.recipes.view', 'tenant.recipes.simulate',
    'tenant.recipe-executions.view', 'tenant.recipe-executions.create', 'tenant.recipe-executions.reverse',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockRecipeExecutionApi(page: Page) {
  await page.route('**/api/company/units/options', route => json(route, [unit]));
  await page.route('**/api/company/inventory/locations**', route => json(route, { data: [location], meta: { total: 1 } }));
  await page.route('**/api/company/recipes**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/versions/1/calculate')) return json(route, { data: calculation });
    return json(route, { data: [recipe], meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 } });
  });
  await page.route('**/api/company/recipe-executions**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'POST' && path.endsWith('/recipe-executions/900/reverse')) {
      execution = { ...execution, status: 'reversed', reversed_at: '2026-08-01T12:05:00.000Z', reversal_reason: 'Erro operacional' };
      return json(route, { data: execution });
    }
    if (request.method() === 'POST' && path.endsWith('/recipe-executions')) return json(route, { data: execution }, 201);
    if (path.endsWith('/recipe-executions/900')) return json(route, { data: execution });
    return json(route, { data: [execution], meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } });
  });
}

test('@smoke recipe executions calcula, confirma, detalha e reverte execucao manual', async ({ page }) => {
  await mockAuth(page);
  await mockRecipeExecutionApi(page);
  await page.goto('/recipe-executions');
  await expect(page.getByTestId('recipe-executions-page')).toBeVisible();
  await expect(page.getByText('RE-20260801-000900')).toBeVisible();
  await page.getByTestId('recipe-execution-new').click();
  await page.getByTestId('execution-recipe').selectOption('1');
  await page.getByTestId('execution-unit').selectOption('101');
  await page.getByTestId('execution-location').selectOption('501');
  await page.getByTestId('execution-quantity').fill('25');
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/company/recipes/1/versions/1/calculate')),
    page.getByTestId('execution-calculate').click(),
  ]);
  await expect(page.getByTestId('execution-review')).toContainText('Morango');
  await expect(page.getByTestId('execution-review')).toContainText('Esta acao movimentara o estoque.');
  page.once('dialog', dialog => dialog.accept());
  await Promise.all([
    page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/api/company/recipe-executions')),
    page.getByTestId('recipe-execution-confirm').click(),
  ]);
  await expect(page).toHaveURL(/\/recipe-executions\/900$/);
  await expect(page.getByTestId('recipe-execution-detail-page')).toContainText('SM-20260801-000700');
  await expect(page.getByTestId('recipe-execution-detail-page')).toContainText('SM-20260801-000701');
  let reverseDialog = 0;
  page.on('dialog', async dialog => {
    await dialog.accept(reverseDialog === 0 ? 'Erro operacional' : undefined);
    reverseDialog++;
  });
  await Promise.all([
    page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/api/company/recipe-executions/900/reverse')),
    page.getByTestId('recipe-execution-reverse').click(),
  ]);
  await expect(page.getByTestId('recipe-execution-detail-page')).toContainText('Revertida');
});
