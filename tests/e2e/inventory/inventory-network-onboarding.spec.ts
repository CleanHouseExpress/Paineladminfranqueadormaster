import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

type Step = {
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

type OnboardingState = {
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
  steps: Step[];
  completed_at: string | null;
};

const unit = { id: 101, name: 'Melten Centro' };
const location = { id: 501, unit_id: 101, name: 'Estoque principal', code: 'MAIN', type: 'main', is_default: true, active: true };
const balances = [{ id: 1, inventory_item_id: 10, item: { id: 10, name: 'Morango', unit_of_measure: 'kg' }, unit_id: unit.id, unit, stock_location_id: location.id, location, on_hand: 20, reserved: 0, blocked: 0, available: 20, average_cost: 12 }];

const baseSteps: Step[] = [
  ['welcome', 'Conhecer o estoque', '/inventory', 'tenant.inventory.view', false, 5],
  ['inventory_items', 'Cadastrar itens no Catalogo', '/catalog/new', 'tenant.catalog.create', false, 15],
  ['stock_locations', 'Criar locais', '/inventory/locations', 'tenant.inventory.locations.manage', false, 15],
  ['unit_items', 'Habilitar itens por unidade', '/inventory/unit-items', 'tenant.inventory.unit_items.manage', false, 15],
  ['first_entry', 'Registrar primeira entrada', '/inventory/movements?new=1', 'tenant.inventory.entry.create', false, 20],
  ['balances', 'Conferir saldos', '/inventory/balances', 'tenant.inventory.view', false, 10],
  ['recipes_intro', 'Entender receitas e checklists', '/recipe-executions', 'tenant.recipe-executions.view', true, 5],
  ['stock_counts', 'Fazer inventario fisico', '/inventory/counts/new', 'tenant.inventory.stock_counts.create', true, 5],
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

function makeState(patch: Partial<OnboardingState> = {}): OnboardingState {
  const completed = patch.progress?.completed_steps ?? [];
  const skipped = patch.progress?.skipped_steps ?? [];
  const autoCompleted = patch.progress?.auto_completed_steps ?? [];
  const done = new Set([...completed, ...skipped, ...autoCompleted]);
  const sourceSteps = patch.steps ?? baseSteps;
  const steps = sourceSteps.map(step => ({
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

async function mockAuth(page: Page, permissions?: string[]) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'inventory-onboarding-token');
    window.sessionStorage.clear();
  });
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Melten', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' },
    { module_id: 'recipes', name: 'Fichas Tecnicas', status: 'active' },
    { module_id: 'checklists', name: 'Checklists', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions ?? [
    'tenant.inventory.view', 'tenant.catalog.create', 'tenant.inventory.items.manage', 'tenant.inventory.locations.manage',
    'tenant.inventory.unit_items.manage', 'tenant.inventory.entry.create', 'tenant.inventory.cost.view',
    'tenant.inventory.stock_counts.create', 'tenant.inventory.stock_counts.view', 'tenant.recipe-executions.view',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockInventory(page: Page, enabled = true) {
  await page.route('**/api/company/inventory/settings', route => json(route, { data: { inventory_enabled: enabled, inventory_mode: 'advanced', terminology_json: {}, enable_inventory_counts: true, enable_recipes: true, capabilities: { enabled, locations: true, balances: true, movements: true, counts: true } } }));
  await page.route('**/api/company/inventory/metrics', route => json(route, { items: 1, active_items: 1, low_stock: 0, out_of_stock: 0, suppliers: 0, movements_today: 1, inventory_value: 240 }));
  await page.route('**/api/company/inventory/items**', route => json(route, { data: [{ id: 10, name: 'Morango', unit_of_measure: 'kg', track_inventory: true, minimum_stock: 5, stock_balances: balances }], meta: { total: 1 } }));
  await page.route('**/api/company/inventory/locations**', route => json(route, { data: [location], meta: { total: 1 } }));
  await page.route('**/api/company/inventory/balances**', route => json(route, { data: balances, meta: { total: 1 } }));
  await page.route('**/api/company/inventory/movements**', route => json(route, { data: [{ id: 99, number: 'SM-1', movement_type: 'entry', status: 'confirmed', unit_id: unit.id, unit, destination_location_id: location.id, destination_location: location, quantity: 20, confirmed_at: '2026-08-03T10:00:00Z', items: [{ inventory_item_id: 10, item: { name: 'Morango', unit_of_measure: 'kg' }, quantity: 20 }] }], meta: { total: 1 } }));
}

async function mockOnboarding(page: Page, initial: OnboardingState) {
  let state = initial;
  await page.route('**/api/company/inventory/onboarding**', async route => {
    const request = route.request();
    const url = request.url();
    if (request.method() === 'GET') return json(route, { data: state });
    if (url.endsWith('/dismiss')) {
      state = { ...state, started: true, dismissed: true };
      return json(route, { data: state });
    }
    if (url.endsWith('/reset')) {
      state = makeState({ started: true, progress: { ...state.progress, completed_steps: [], skipped_steps: [], auto_completed_steps: state.progress.auto_completed_steps }, current_step: state.progress.auto_completed_steps.includes('welcome') ? 'inventory_items' : 'welcome' });
      return json(route, { data: state });
    }
    const payload = request.postDataJSON() as { completed_step?: string; skipped_step?: string; current_step?: string; completed?: boolean };
    const completed = [...state.progress.completed_steps];
    const skipped = [...state.progress.skipped_steps];
    if (payload.completed_step && !completed.includes(payload.completed_step)) completed.push(payload.completed_step);
    if (payload.skipped_step && !skipped.includes(payload.skipped_step)) skipped.push(payload.skipped_step);
    state = makeState({
      version: state.version,
      context: state.context,
      dismissed: state.dismissed,
      steps: state.steps,
      started: true,
      completed: Boolean(payload.completed),
      current_step: payload.completed || payload.current_step ? (payload.completed ? 'completed' : payload.current_step) : undefined,
      progress: { ...state.progress, completed_steps: completed, skipped_steps: skipped },
      completed_at: payload.completed ? '2026-08-03T12:00:00Z' : null,
    });
    return json(route, { data: state });
  });
}

test('@inventory onboarding primeiro acesso inicia wizard e mostra progresso', async ({ page }) => {
  await mockAuth(page);
  await mockInventory(page);
  await mockOnboarding(page, makeState());

  await page.goto('/inventory');
  await expect(page.getByText('Vamos preparar o estoque da sua rede?')).toBeVisible();
  await page.getByTestId('inventory-onboarding-start').click();
  await expect(page.getByTestId('inventory-network-onboarding-wizard')).toBeVisible();
  await expect(page.getByText(/Configuracao do Estoque/i)).toBeVisible();
  await expect(page.getByText(/Etapa 2 de/)).toBeVisible();
});

test('@inventory onboarding abre mesmo com onboarding principal pendente', async ({ page }) => {
  await mockAuth(page);
  await page.route('**/api/me/onboarding', route => json(route, {
    required: true,
    status: 'pending',
    current_step: 'company_profile',
    required_steps: ['company_profile', 'branding', 'settings'],
    completed_steps: [],
    onboarding_required: true,
    completed_at: null,
  }));
  await mockInventory(page);
  await mockOnboarding(page, makeState());

  await page.goto('/inventory');
  await expect(page.getByText('Vamos preparar o estoque da sua rede?')).toBeVisible();
});

test('@inventory onboarding dados existentes aparecem concluidos e reset preserva progresso automatico', async ({ page }) => {
  await mockAuth(page);
  await mockInventory(page);
  await mockOnboarding(page, makeState({ started: true, progress: { completed_steps: [], skipped_steps: [], pending_steps: ['finish'], auto_completed_steps: ['welcome', 'inventory_items', 'stock_locations', 'unit_items', 'first_entry', 'balances'] } }));

  await page.goto('/inventory');
  await page.getByText('Guia de configuracao').click();
  await expect(page.getByText(/6 de 9 etapas concluidas/i)).toBeVisible();
  await page.getByText('Reiniciar guia').click();
  await expect(page.getByText(/6 de 9 etapas concluidas/i)).toBeVisible();
});

test('@inventory onboarding atualizar progresso avanca etapa atual ja concluida', async ({ page }) => {
  await mockAuth(page);
  await mockInventory(page);
  let state = makeState({
    started: true,
    current_step: 'inventory_items',
    progress: {
      completed_steps: ['welcome'],
      skipped_steps: [],
      pending_steps: ['inventory_items', 'stock_locations', 'unit_items', 'first_entry', 'balances', 'recipes_intro', 'stock_counts', 'finish'],
      auto_completed_steps: [],
    },
  });
  await page.route('**/api/company/inventory/onboarding**', route => json(route, { data: state }));

  await page.goto('/inventory');
  await page.getByText('Guia de configuracao').click();
  await expect(page.getByText('Crie o primeiro item no Catalogo')).toBeVisible();

  state = makeState({
    started: true,
    current_step: 'inventory_items',
    progress: {
      completed_steps: ['welcome'],
      skipped_steps: [],
      pending_steps: ['stock_locations', 'unit_items', 'first_entry', 'balances', 'recipes_intro', 'stock_counts', 'finish'],
      auto_completed_steps: ['inventory_items'],
    },
  });
  await page.getByText('Atualizar progresso').click();
  await expect(page.getByText('Crie o primeiro local')).toBeVisible();
});

test('@inventory onboarding deep link, pular e retomar', async ({ page }) => {
  await mockAuth(page);
  await mockInventory(page);
  await mockOnboarding(page, makeState({
    started: true,
    current_step: 'recipes_intro',
    progress: {
      completed_steps: ['welcome'],
      skipped_steps: [],
      pending_steps: ['recipes_intro', 'stock_counts', 'finish'],
      auto_completed_steps: ['inventory_items', 'stock_locations', 'unit_items', 'first_entry', 'balances'],
    },
  }));

  await page.goto('/inventory');
  await page.getByText('Continuar').first().click();
  await page.getByText('Pular por enquanto').click();
  await page.getByLabel('Fechar guia').click();
  await expect(page.getByTestId('inventory-onboarding-resume-card')).toBeVisible();
  await page.getByText('Continuar').first().click();
  await page.getByTestId('inventory-onboarding-primary-action').click();
  await expect(page).toHaveURL(/\/inventory\/counts/);
});

test('@inventory onboarding dismiss impede convite automatico mas mantem acesso manual', async ({ page }) => {
  await mockAuth(page);
  await mockInventory(page);
  await mockOnboarding(page, makeState());

  await page.goto('/inventory');
  await page.getByText('Nao mostrar novamente').click();
  await expect(page.getByText('Vamos preparar o estoque da sua rede?')).toBeHidden();
  await page.reload();
  await expect(page.getByText('Vamos preparar o estoque da sua rede?')).toBeHidden();
  await expect(page.getByText('Guia de configuracao')).toBeVisible();
});

test('@inventory onboarding respeita RBAC e capability desativada', async ({ page }) => {
  await mockAuth(page, ['tenant.inventory.view', 'tenant.inventory.entry.create']);
  await mockInventory(page);
  await mockOnboarding(page, makeState({ steps: baseSteps.filter(step => ['welcome', 'first_entry', 'finish'].includes(step.id)) }));

  await page.goto('/inventory');
  await page.getByText('Comecar agora').click();
  await expect(page.getByText('Criar no Catalogo')).toBeHidden();

  await mockInventory(page, false);
  await page.reload();
  await expect(page.getByText(/Estoque desabilitado|Capability desabilitada/i).first()).toBeVisible();
});

test('@inventory onboarding responsivo e API indisponivel nao bloqueia modulo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await mockAuth(page);
  await mockInventory(page);
  await page.route('**/api/company/inventory/onboarding**', route => json(route, { message: 'offline' }, 500));

  await page.goto('/inventory');
  await expect(page.getByText(/On hand|Disponivel/i).first()).toBeVisible();
  await expect(page.getByText(/O modulo continua disponivel normalmente/i)).toBeHidden();
});
