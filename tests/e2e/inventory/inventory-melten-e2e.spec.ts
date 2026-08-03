import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const unit = { id: 101, name: 'Melten Centro' };
const location = { id: 501, unit_id: 101, name: 'Estoque principal', code: 'MEL-CEN-EST', type: 'main', is_default: true, active: true };
const uomLiter = { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' };
const recipe = {
  id: 1,
  code: 'MELTEN-SORV-MORANGO',
  name: 'Sorvete de morango',
  recipe_type: 'physical_product',
  active: true,
  active_version_id: 100,
  active_version: { id: 100, recipe_id: 1, version: 1, status: 'published', expected_yield_quantity: '10.000000', expected_yield_uom: uomLiter },
};

const balances = [
  ['Morango', 39, 20, 'kg'],
  ['Leite', 85, 5, 'l'],
  ['Acucar', 25, 4, 'kg'],
  ['Embalagem 1 litro', 75, 1.5, 'unit'],
  ['Sorvete de morango', 23, 13.3, 'l'],
].map(([name, onHand, cost, uom], index) => ({
  id: index + 1,
  inventory_item_id: index + 10,
  item: { id: index + 10, name, unit_of_measure: uom },
  unit_id: unit.id,
  unit,
  stock_location_id: location.id,
  location,
  on_hand: onHand,
  reserved: 0,
  blocked: 0,
  available: onHand,
  average_cost: cost,
}));

const movements = [
  {
    id: 900,
    number: 'SM-20260803-000900',
    movement_type: 'exit',
    status: 'confirmed',
    unit_id: unit.id,
    unit,
    source_location_id: location.id,
    source_location: location,
    quantity: 55,
    total_cost: 332.5,
    source_type: 'recipe_execution',
    reference: 'RE-20260803-000100',
    confirmed_at: '2026-08-03T10:00:00.000Z',
    items: [
      { inventory_item_id: 10, item: { name: 'Morango', unit_of_measure: 'kg' }, quantity: 10, unit_cost: 20, total_cost: 200 },
      { inventory_item_id: 11, item: { name: 'Leite', unit_of_measure: 'l' }, quantity: 15, unit_cost: 5, total_cost: 75 },
      { inventory_item_id: 12, item: { name: 'Acucar', unit_of_measure: 'kg' }, quantity: 5, unit_cost: 4, total_cost: 20 },
      { inventory_item_id: 13, item: { name: 'Embalagem 1 litro', unit_of_measure: 'unit' }, quantity: 25, unit_cost: 1.5, total_cost: 37.5 },
    ],
  },
  {
    id: 901,
    number: 'SM-20260803-000901',
    movement_type: 'entry',
    status: 'confirmed',
    unit_id: unit.id,
    unit,
    destination_location_id: location.id,
    destination_location: location,
    quantity: 25,
    unit_cost: 13.3,
    total_cost: 332.5,
    source_type: 'recipe_execution',
    reference: 'RE-20260803-000100',
    confirmed_at: '2026-08-03T10:00:02.000Z',
    items: [{ inventory_item_id: 14, item: { name: 'Sorvete de morango', unit_of_measure: 'l' }, quantity: 25, unit_cost: 13.3, total_cost: 332.5 }],
  },
  {
    id: 902,
    number: 'SM-20260803-000902',
    movement_type: 'loss',
    status: 'confirmed',
    unit_id: unit.id,
    unit,
    source_location_id: location.id,
    source_location: location,
    quantity: 2,
    unit_cost: 13.3,
    total_cost: 26.6,
    source_type: 'manual',
    reason: 'Perda operacional controlada Melten',
    confirmed_at: '2026-08-03T10:05:00.000Z',
    items: [{ inventory_item_id: 14, item: { name: 'Sorvete de morango', unit_of_measure: 'l' }, quantity: 2, unit_cost: 13.3, total_cost: 26.6 }],
  },
  {
    id: 903,
    number: 'SM-20260803-000903',
    movement_type: 'negative_adjustment',
    status: 'confirmed',
    unit_id: unit.id,
    unit,
    source_location_id: location.id,
    source_location: location,
    quantity: 1,
    unit_cost: 20,
    total_cost: 20,
    source_type: 'stock_count',
    reference: 'SC-20260803-000001',
    confirmed_at: '2026-08-03T10:10:00.000Z',
    items: [{ inventory_item_id: 10, item: { name: 'Morango', unit_of_measure: 'kg' }, quantity: 1, unit_cost: 20, total_cost: 20 }],
  },
];

const count = {
  id: 700,
  number: 'SC-20260803-000001',
  unit_id: unit.id,
  unit,
  stock_location_id: location.id,
  stock_location: location,
  status: 'confirmed',
  counted_at: '2026-08-03T10:08:00.000Z',
  confirmed_at: '2026-08-03T10:10:00.000Z',
  created_by_name: 'Admin Master',
  items_count: 1,
  divergent_items_count: 1,
  items: [{ id: 1, inventory_item_id: 10, item: { name: 'Morango', unit_of_measure: 'kg' }, system_quantity: 40, counted_quantity: 39, difference_quantity: -1, reason: 'Divergencia controlada' }],
  movements: [{ id: 903, number: 'SM-20260803-000903', movement_type: 'negative_adjustment' }],
};

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'melten-mvp-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Melten', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' },
    { module_id: 'recipes', name: 'Fichas Tecnicas', status: 'active' },
    { module_id: 'checklists', name: 'Checklists', status: 'active' },
    { module_id: 'financial', name: 'Financeiro', status: 'active' },
    { module_id: 'dre', name: 'DRE Gerencial', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.inventory.view', 'tenant.inventory.configure', 'tenant.inventory.entry.create', 'tenant.inventory.exit.create', 'tenant.inventory.adjust.create', 'tenant.inventory.reverse', 'tenant.inventory.cost.view',
    'tenant.inventory.stock_counts.view', 'tenant.inventory.stock_counts.create', 'tenant.inventory.stock_counts.update', 'tenant.inventory.stock_counts.confirm', 'tenant.inventory.stock_counts.reverse',
    'tenant.recipes.view', 'tenant.recipes.create', 'tenant.recipes.update', 'tenant.recipes.publish', 'tenant.recipes.simulate',
    'tenant.recipe-executions.view', 'tenant.recipe-executions.create', 'tenant.recipe-executions.reverse',
    'tenant.checklists.view', 'tenant.checklists.execute', 'tenant.automation.view', 'tenant.automation.manage',
    'tenant.finance.view', 'tenant.dre.view', 'tenant.finance.managerial_effects.view',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockMeltenApi(page: Page) {
  await page.route('**/api/company/units/options', route => json(route, [{ value: String(unit.id), label: unit.name }]));
  await page.route('**/api/company/inventory/settings', route => json(route, { data: { inventory_enabled: true, inventory_mode: 'advanced', terminology_json: {}, capabilities: { enabled: true, locations: true, balances: true, movements: true, counts: true } } }));
  await page.route('**/api/company/inventory/items**', route => json(route, { data: balances.map(balance => ({ id: balance.inventory_item_id, name: balance.item.name, unit_of_measure: balance.item.unit_of_measure, track_inventory: true })), meta: { total: balances.length } }));
  await page.route('**/api/company/inventory/locations**', route => json(route, { data: [location], meta: { total: 1 } }));
  await page.route('**/api/company/inventory/balances**', route => json(route, { data: balances, meta: { total: balances.length } }));
  await page.route('**/api/company/inventory/movements**', route => json(route, { data: movements, meta: { total: movements.length } }));
  await page.route('**/api/company/inventory/counts/700', route => json(route, { data: count }));
  await page.route('**/api/company/inventory/counts**', route => json(route, { data: [count], meta: { total: 1 } }));
  await page.route('**/api/company/recipes**', route => json(route, { data: [recipe], meta: { total: 1 } }));
  await page.route('**/api/company/recipe-executions**', route => json(route, { data: [{
    id: 100,
    number: 'RE-20260803-000100',
    recipe_id: recipe.id,
    recipe,
    recipe_version_id: 100,
    version: { id: 100, version: 1, status: 'published' },
    unit_id: unit.id,
    unit,
    stock_location_id: location.id,
    stock_location: location,
    target_quantity: '25.000000',
    target_uom_id: 4,
    target_uom: uomLiter,
    status: 'confirmed',
    operation_id: '11111111-1111-4111-8111-111111111111',
    idempotency_key: 'melten-recipe-execution',
    calculation_snapshot: { estimated_total_cost: '332.50', estimated_cost_per_output_unit: '13.30', components: movements[0].items },
    input_movement_id: 900,
    output_movement_id: 901,
    input_movement: movements[0],
    output_movement: movements[1],
    executed_at: '2026-08-03T10:00:00.000Z',
  }], meta: { total: 1 } }));
  await page.route('**/api/company/checklists/templates**', route => json(route, { data: [{ id: 10, name: 'Producao diaria', category: 'producao', active: true, status: 'published' }], meta: { total: 1 } }));
  await page.route('**/api/company/checklists/executions**', route => json(route, { data: [{ id: 77, template_id: 10, template_name: 'Producao diaria', unit_id: unit.id, unit_name: unit.name, status: 'completed', operational_actions: [{ id: 501, action_type: 'execute_recipe', status: 'completed', recipe_execution_id: 100, recipe_execution: { id: 100, number: 'RE-20260803-000100', status: 'confirmed' } }] }], meta: { total: 1 } }));
  await page.route('**/api/company/dre/comparison**', route => json(route, { data: {
    current: { summary: { gross_revenue: 0, net_revenue: 0, cmv: 46.6, gross_profit: -46.6, expenses: 0, net_profit: -46.6, margin: 0 }, rows: [{ key: 'cmv', label: 'CMV', amount: 46.6, kind: 'expense' }] },
    previous: { summary: { gross_revenue: 0, net_revenue: 0, cmv: 0, gross_profit: 0, expenses: 0, net_profit: 0, margin: 0 }, rows: [] },
    comparison: { gross_revenue: { variation_percentage: 0 }, net_profit: { variation_percentage: 0 }, margin: { variation_percentage: 0 } },
  } }));
}

test('@release @inventory Melten MVP mostra producao perda contagem e DRE gerencial', async ({ page }) => {
  await mockAuth(page);
  await mockMeltenApi(page);

  await page.goto('/recipe-executions');
  await expect(page.getByText('RE-20260803-000100')).toBeVisible();
  await expect(page.getByText('Sorvete de morango').first()).toBeVisible();

  await page.goto('/checklists/executions');
  await expect(page.getByRole('row', { name: /Producao diaria Melten Centro Concluido/i })).toBeVisible();

  await page.goto('/inventory/movements');
  await expect(page.getByText('recipe_execution').first()).toBeVisible();
  await expect(page.getByText('stock_count').first()).toBeVisible();
  await expect(page.getByText('Perda').first()).toBeVisible();

  await page.goto('/inventory/balances');
  await expect(page.getByRole('row', { name: /Morango Melten Centro Estoque principal 39/i })).toBeVisible();
  await expect(page.getByRole('row', { name: /Sorvete de morango Melten Centro Estoque principal 23/i })).toBeVisible();

  await page.goto('/inventory/counts');
  await expect(page.getByText('SC-20260803-000001')).toBeVisible();
  await expect(page.getByText('Melten Centro').first()).toBeVisible();

  await page.goto('/financial/dre');
  await expect(page.getByRole('heading', { name: /DRE Gerencial/i })).toBeVisible();
  await expect(page.getByText(/R\$\s?47|46/).first()).toBeVisible();
});
