import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

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

type CatalogGuideState = {
  version: number;
  context: 'network';
  started: boolean;
  completed: boolean;
  dismissed: boolean;
  current_step: string;
  suggested_next_module: { id: string; label: string; path: string } | null;
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

const baseSteps: Step[] = [
  ['welcome', 'Conhecer o catalogo', '/catalog', 'tenant.catalog.view', false, 5],
  ['item_types', 'Escolher tipos de item', '/catalog', 'tenant.catalog.view', false, 10],
  ['first_category', 'Organizar grupos', '/catalog/settings', 'tenant.catalog.configure', true, 5],
  ['first_item', 'Criar primeiro item', '/catalog/new', 'tenant.catalog.create', false, 15],
  ['stock_control', 'Ativar controle de estoque', '/catalog/new', 'tenant.catalog.create', false, 15],
  ['internal_supply', 'Cadastrar insumo interno', '/catalog/new', 'tenant.catalog.create', true, 10],
  ['service_item', 'Cadastrar servico', '/catalog/new', 'tenant.catalog.create', true, 10],
  ['additional_fields', 'Ajustar campos', '/catalog/settings', 'tenant.catalog.configure', true, 5],
  ['governance', 'Revisar governanca', '/catalog/settings', 'tenant.catalog.configure', true, 10],
  ['inventory_integration', 'Continuar no estoque', '/inventory/items', 'tenant.inventory.view', true, 10],
  ['finish', 'Concluir guia', '/catalog', 'tenant.catalog.view', false, 10],
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

function makeState(patch: Partial<CatalogGuideState> = {}): CatalogGuideState {
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
    suggested_next_module: patch.suggested_next_module ?? null,
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
    window.localStorage.setItem('orchestra_auth_token', 'catalog-onboarding-token');
    window.sessionStorage.clear();
  });
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Melten', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'catalog', name: 'Catalogo', status: 'active' },
    { module_id: 'inventory', name: 'Estoque', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions ?? [
    'tenant.catalog.view', 'tenant.catalog.create', 'tenant.catalog.configure',
    'tenant.inventory.view',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockCatalog(page: Page, options: { withItems?: boolean } = {}) {
  const items = options.withItems ? [
    {
      id: 10,
      name: 'Sorvete de Morango',
      item_type: 'product',
      status: 'active',
      base_price: 24,
      sku: 'SOR-MOR-500',
      unit_of_measure: 'un',
      metadata: {},
      product_detail: { track_stock: true, min_stock: 5, cost_price: 12 },
      created_at: '2026-08-03T10:00:00Z',
      updated_at: '2026-08-03T10:00:00Z',
    },
  ] : [];

  await page.route('**/api/metadata/catalog_items', route => json(route, {
    data: {
      singular_label: 'Item',
      plural_label: 'Itens',
      description: 'Catalogo',
      form_schema: [
        { key: 'name', label: 'Nome', field_type: 'text', required: true, visible: true, order: 1 },
        { key: 'categoria', label: 'Categoria interna', field_type: 'text', required: false, visible: true, order: 2 },
      ],
      table_schema: [],
      settings: {
        module_title: 'Catalogo',
        new_item_label: 'Novo Item',
        enabled_types: ['product', 'internal_supply', 'material', 'packaging', 'semi_finished', 'finished_product', 'service'],
      },
      active: true,
    },
  }));

  await page.route('**/api/company/catalog/items**', route => {
    const url = route.request().url();
    if (url.includes('/metrics')) {
      return json(route, {
        total: items.length,
        active: items.length,
        inactive: 0,
        archived: 0,
        average_price: items.length ? 24 : 0,
      });
    }
    return json(route, { data: items, meta: { total: items.length } });
  });

  await page.route('**/api/company/catalog/settings', route => json(route, {
    data: {
      allow_unit_local_items: false,
      allow_unit_edit_price: false,
      allow_unit_create_products: false,
      allow_unit_create_services: false,
      allow_unit_create_subscriptions: false,
      allow_unit_create_courses: false,
      allow_unit_create_bundles: false,
      local_items_require_approval: true,
      allow_unit_use_corporate_categories: true,
      allow_unit_create_categories: false,
      allow_unit_create_measurement_units: false,
      allow_promote_local_items: true,
      settings_json: {},
    },
  }));

  await page.route('**/api/company/inventory/**', route => json(route, { data: [], meta: { total: 0 } }));
}

async function mockGuide(page: Page, initial: CatalogGuideState) {
  let state = initial;
  await page.route('**/api/company/catalog/onboarding**', async route => {
    const request = route.request();
    const url = request.url();
    if (request.method() === 'GET') return json(route, { data: state });
    if (url.endsWith('/dismiss')) {
      state = { ...state, started: true, dismissed: true };
      return json(route, { data: state });
    }
    if (url.endsWith('/reset')) {
      state = makeState({
        started: true,
        suggested_next_module: state.suggested_next_module,
        steps: state.steps,
        progress: {
          ...state.progress,
          completed_steps: [],
          skipped_steps: [],
          auto_completed_steps: state.progress.auto_completed_steps,
        },
      });
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
      suggested_next_module: state.suggested_next_module,
      started: true,
      completed: Boolean(payload.completed),
      current_step: payload.completed ? 'completed' : payload.current_step,
      progress: { ...state.progress, completed_steps: completed, skipped_steps: skipped },
      completed_at: payload.completed ? '2026-08-03T12:00:00Z' : null,
    });
    return json(route, { data: state });
  });
}

test('@catalog onboarding primeiro acesso abre convite e wizard', async ({ page }) => {
  await mockAuth(page);
  await mockCatalog(page);
  await mockGuide(page, makeState());

  await page.goto('/catalog');
  await expect(page.getByTestId('catalog-onboarding-invite')).toBeVisible();
  await page.getByTestId('catalog-onboarding-start').click();
  await expect(page.getByTestId('catalog-onboarding-guide')).toBeVisible();
  await expect(page.getByTestId('catalog-guide-progress')).toContainText('Configuracao do Catalogo');
  await expect(page.getByTestId('catalog-onboarding-guide').getByText('Melten')).toBeVisible();
});

test('@catalog onboarding dados existentes concluem etapas e reset preserva automatico', async ({ page }) => {
  await mockAuth(page);
  await mockCatalog(page, { withItems: true });
  await mockGuide(page, makeState({
    started: true,
    progress: {
      completed_steps: [],
      skipped_steps: [],
      pending_steps: ['welcome', 'item_types', 'finish'],
      auto_completed_steps: ['first_item', 'stock_control', 'inventory_integration'],
    },
    suggested_next_module: { id: 'inventory', label: 'Configurar Estoque', path: '/inventory/items' },
  }));

  await page.goto('/catalog');
  await page.getByText('Continuar').first().click();
  await expect(page.getByTestId('catalog-guide-checklist')).toContainText('Ativar controle de estoque');
  await page.getByText('Reiniciar guia').click();
  await expect(page.getByTestId('catalog-guide-checklist')).toContainText('Continuar no estoque');
});

test('@catalog onboarding deep link leva ao Estoque sem segundo cadastro', async ({ page }) => {
  await mockAuth(page);
  await mockCatalog(page, { withItems: true });
  await mockGuide(page, makeState({
    started: true,
    current_step: 'inventory_integration',
    progress: {
      completed_steps: ['welcome', 'item_types'],
      skipped_steps: [],
      pending_steps: ['inventory_integration', 'finish'],
      auto_completed_steps: ['first_item', 'stock_control'],
    },
    suggested_next_module: { id: 'inventory', label: 'Configurar Estoque', path: '/inventory/items' },
  }));

  await page.goto('/catalog?guide=catalog-onboarding');
  await expect(page.getByText('Continue no Estoque')).toBeVisible();
  await page.getByTestId('catalog-onboarding-primary-action').click();
  await expect(page).toHaveURL(/\/inventory\/items/);
});

test('@catalog onboarding respeita RBAC e nao mostra etapas de criacao sem permissao', async ({ page }) => {
  await mockAuth(page, ['tenant.catalog.view']);
  await mockCatalog(page);
  await mockGuide(page, makeState({ steps: baseSteps.filter(step => ['welcome', 'item_types', 'finish'].includes(step.id)) }));

  await page.goto('/catalog');
  await page.getByTestId('catalog-onboarding-start').click();
  await expect(page.getByText('Criar item')).toBeHidden();
  await expect(page.getByTestId('catalog-onboarding-guide')).toContainText('Entenda qual tipo usar');
});

test('@catalog onboarding dismiss e responsivo mantem acesso manual', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await mockAuth(page);
  await mockCatalog(page);
  await mockGuide(page, makeState());

  await page.goto('/catalog');
  await page.getByText('Nao mostrar novamente').click();
  await expect(page.getByTestId('catalog-onboarding-invite')).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('catalog-onboarding-invite')).toBeHidden();
  await page.getByRole('button', { name: 'Guia', exact: true }).click();
  await expect(page.getByTestId('catalog-onboarding-guide')).toBeVisible();
});
