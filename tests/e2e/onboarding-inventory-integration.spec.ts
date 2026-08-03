import { expect, test, type Page, type Route } from '@playwright/test';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

type InventoryStep = {
  id: string;
  title: string;
  path: string;
  permission: string;
  optional: boolean;
  weight: number;
  completed: boolean;
  skipped: boolean;
  auto_completed: boolean;
};

type InventoryOnboardingState = {
  version: number;
  context: 'network';
  started: boolean;
  completed: boolean;
  dismissed: boolean;
  current_step: string;
  progress: {
    percent: number;
    completed_steps: string[];
    skipped_steps: string[];
    pending_steps: string[];
    auto_completed_steps: string[];
  };
  steps: InventoryStep[];
  completed_at: string | null;
};

const inventorySteps: InventoryStep[] = [
  ['welcome', 'Conhecer o estoque', '/inventory', 'tenant.inventory.view', false, 5],
  ['inventory_items', 'Cadastrar itens no Catalogo', '/catalog/new', 'tenant.catalog.create', false, 15],
  ['stock_locations', 'Criar locais', '/inventory/locations', 'tenant.inventory.locations.manage', false, 15],
  ['unit_items', 'Habilitar itens por unidade', '/inventory/unit-items', 'tenant.inventory.unit_items.manage', false, 15],
  ['first_entry', 'Registrar primeira entrada', '/inventory/movements?new=1', 'tenant.inventory.entry.create', false, 20],
  ['balances', 'Conferir saldos', '/inventory/balances', 'tenant.inventory.view', false, 10],
  ['finish', 'Concluir guia', '/inventory', 'tenant.inventory.view', false, 10],
].map(([id, title, path, permission, optional, weight]) => ({
  id: String(id),
  title: String(title),
  path: String(path),
  permission: String(permission),
  optional: Boolean(optional),
  weight: Number(weight),
  completed: false,
  skipped: false,
  auto_completed: false,
}));

function makeInventoryState(patch: Partial<InventoryOnboardingState> = {}): InventoryOnboardingState {
  const completed = patch.progress?.completed_steps ?? [];
  const skipped = patch.progress?.skipped_steps ?? [];
  const autoCompleted = patch.progress?.auto_completed_steps ?? [];
  const done = new Set([...completed, ...skipped, ...autoCompleted]);
  const steps = (patch.steps ?? inventorySteps).map(step => ({
    ...step,
    completed: completed.includes(step.id) || autoCompleted.includes(step.id),
    skipped: skipped.includes(step.id),
    auto_completed: autoCompleted.includes(step.id),
  }));
  const currentStep = patch.current_step ?? steps.find(step => !done.has(step.id))?.id ?? 'completed';

  return {
    version: 1,
    context: 'network',
    started: patch.started ?? false,
    completed: patch.completed ?? false,
    dismissed: patch.dismissed ?? false,
    current_step: currentStep,
    progress: {
      percent: Math.round((steps.filter(step => done.has(step.id)).length / Math.max(1, steps.length)) * 100),
      completed_steps: completed,
      skipped_steps: skipped,
      pending_steps: steps.map(step => step.id).filter(id => !done.has(id)),
      auto_completed_steps: autoCompleted,
      ...patch.progress,
    },
    steps,
    completed_at: patch.completed_at ?? null,
  };
}

async function mockPlatform(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'onboarding-inventory-token');
    window.sessionStorage.clear();
  });

  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Melten', plan: 'enterprise', segment: 'Food' } }));
  await page.route('**/api/me/onboarding', route => json(route, {
    required: false,
    status: 'completed',
    current_step: 'completed',
    required_steps: ['company_profile', 'branding', 'settings'],
    completed_steps: ['company_profile', 'branding', 'settings'],
    onboarding_required: false,
    completed_at: '2026-08-03T12:00:00Z',
  }));
  await page.route('**/api/me/onboarding/company-profile', route => json(route, { data: { trade_name: 'Melten', segment: 'Food', email: 'admin@melten.test', city: 'Sao Paulo', state: 'SP' } }));
  await page.route('**/api/me/onboarding/branding', route => json(route, { data: { primary_color: '#6366F1', secondary_color: '#8B5CF6', login_title: 'Orchestra' } }));
  await page.route('**/api/me/settings', route => json(route, { data: { timezone: 'America/Sao_Paulo', language: 'pt-BR', currency: 'BRL', dashboard_preferences: { onboarding_clients_imported: true, onboarding_financial: { royaltyRate: 7 } } } }));
  await page.route('**/api/company/units?per_page=100', route => json(route, { data: [{ id: 101, name: 'Melten Centro', address_city: 'Sao Paulo', address_state: 'SP' }], meta: { total: 1 } }));
  await page.route('**/api/company/units?per_page=5', route => json(route, { data: [{ id: 101, name: 'Melten Centro', address_city: 'Sao Paulo', address_state: 'SP', status: 'active' }], meta: { total: 1 } }));
  await page.route('**/api/company/users?per_page=100', route => json(route, { data: [{ id: 1, email: 'admin@orchestra.test' }, { id: 2, email: 'gestor@orchestra.test' }], meta: { total: 2 } }));
  await page.route('**/api/company/royalties/rules?per_page=1', route => json(route, { data: [{ id: 1 }], meta: { total: 1 } }));
  await page.route('**/api/company/royalties/assignments?per_page=1', route => json(route, { data: [{ id: 1 }], meta: { total: 1 } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
    { module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' },
    { module_id: 'finance', name: 'Financeiro', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.inventory.view',
    'tenant.catalog.create',
    'tenant.inventory.items.manage',
    'tenant.inventory.locations.manage',
    'tenant.inventory.unit_items.manage',
    'tenant.inventory.entry.create',
    'tenant.inventory.cost.view',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockInventoryModule(page: Page) {
  const unit = { id: 101, name: 'Melten Centro' };
  const location = { id: 501, unit_id: 101, name: 'Estoque principal', code: 'MAIN', type: 'main', is_default: true, active: true };
  const balances = [{ id: 1, inventory_item_id: 10, item: { id: 10, name: 'Morango', unit_of_measure: 'kg' }, unit_id: unit.id, unit, stock_location_id: location.id, location, on_hand: 20, reserved: 0, blocked: 0, available: 20, average_cost: 12 }];

  await page.route('**/api/company/inventory/settings', route => json(route, { data: { inventory_enabled: true, inventory_mode: 'advanced', terminology_json: {}, enable_inventory_counts: false, enable_recipes: false, capabilities: { enabled: true, locations: true, balances: true, movements: true } } }));
  await page.route('**/api/company/inventory/metrics', route => json(route, { items: 1, active_items: 1, low_stock: 0, out_of_stock: 0, suppliers: 0, movements_today: 1, inventory_value: 240 }));
  await page.route('**/api/company/inventory/items**', route => json(route, { data: [{ id: 10, name: 'Morango', unit_of_measure: 'kg', track_inventory: true, minimum_stock: 5, stock_balances: balances }], meta: { total: 1 } }));
  await page.route('**/api/company/inventory/locations**', route => json(route, { data: [location], meta: { total: 1 } }));
  await page.route('**/api/company/inventory/balances**', route => json(route, { data: balances, meta: { total: 1 } }));
  await page.route('**/api/company/inventory/movements**', route => json(route, { data: [], meta: { total: 0 } }));
}

async function mockInventoryOnboarding(page: Page, initial: InventoryOnboardingState) {
  let state = initial;

  await page.route('**/api/company/inventory/onboarding**', route => {
    const request = route.request();
    if (request.method() === 'GET') return json(route, { data: state });

    const payload = request.postDataJSON() as { completed_step?: string; skipped_step?: string; current_step?: string; completed?: boolean };
    const completed = [...state.progress.completed_steps];
    const skipped = [...state.progress.skipped_steps];
    if (payload.completed_step && !completed.includes(payload.completed_step)) completed.push(payload.completed_step);
    if (payload.skipped_step && !skipped.includes(payload.skipped_step)) skipped.push(payload.skipped_step);

    state = makeInventoryState({
      started: true,
      completed: Boolean(payload.completed),
      current_step: payload.completed ? 'completed' : payload.current_step,
      progress: { ...state.progress, completed_steps: completed, skipped_steps: skipped },
      completed_at: payload.completed ? '2026-08-03T13:00:00Z' : null,
    });

    return json(route, { data: state });
  });
}

test('@onboarding inventory guia de estoque integra checklist principal e retoma progresso salvo', async ({ page }) => {
  await mockPlatform(page);
  await mockInventoryModule(page);
  await mockInventoryOnboarding(page, makeInventoryState({
    started: true,
    current_step: 'finish',
    progress: {
      completed_steps: ['welcome', 'inventory_items', 'stock_locations', 'unit_items', 'first_entry', 'balances'],
      skipped_steps: [],
      pending_steps: ['finish'],
      auto_completed_steps: [],
    },
  }));

  await page.goto('/');
  await expect(page.getByText('Configurar Estoque')).toBeVisible();
  await expect(page.getByText('Voce ainda nao terminou a configuracao do Estoque.')).toBeVisible();

  await page.locator('div').filter({ hasText: 'Configurar Estoque' }).getByText('Acessar').click();
  await expect(page).toHaveURL(/\/inventory/);
  await expect(page.getByTestId('inventory-network-onboarding-wizard')).toBeVisible();
  await expect(page.getByText('Vamos preparar o estoque da sua rede?')).toBeHidden();
  await expect(page.getByText(/Etapa 7 de 7/)).toBeVisible();

  await page.getByTestId('inventory-onboarding-primary-action').click();
  await expect(page.getByTestId('inventory-network-onboarding-wizard')).toBeHidden();

  await page.goto('/');
  await expect(page.getByText('Checklist de implantação')).toBeHidden();
});
