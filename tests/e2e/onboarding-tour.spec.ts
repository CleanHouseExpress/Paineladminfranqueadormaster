import { test, expect, type Page, type Route } from '@playwright/test';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function setupOnboardingPlatform(page: Page) {
  let settingsState = {
    data: {
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      currency: 'BRL',
      dashboard_preferences: {
        onboarding_financial: { royaltyRate: 7 },
        onboarding_clients_imported: true,
      },
    },
  };

  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'e2e-onboarding-tour-token');
    window.sessionStorage.clear();
  });

  await page.route('**/api/tenant/current', route => json(route, {
    exists: true,
    tenant: { name: 'Onboard Master', status: 'active', segment: 'Food', plan: 'Enterprise', subdomain: 'orchestra-e2e' },
    branding: null,
    white_label: null,
  }));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Onboard Master', plan: 'enterprise', segment: 'Food' } }));
  await page.route('**/api/me/modules', route => json(route, { data: [
    { id: 'dashboard', slug: 'dashboard', name: 'Dashboard', status: 'active' },
    { id: 'financial', slug: 'financial', name: 'Financeiro', status: 'active' },
    { id: 'access', slug: 'access', name: 'Acessos', status: 'active' },
    { id: 'settings', slug: 'settings', name: 'Configuracoes', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'Admin Master' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [] }));
  await page.route('**/api/me/onboarding', route => json(route, {
    required: false,
    status: 'in_progress',
    current_step: null,
    required_steps: ['company_profile', 'branding', 'settings'],
    completed_steps: ['company_profile', 'branding', 'settings'],
    onboarding_required: true,
    completed_at: null,
  }));
  await page.route('**/api/me/onboarding/company-profile', route => json(route, {
    data: {
      trade_name: 'Onboard Master',
      segment: 'Food',
      email: 'admin@orchestra.test',
      city: 'Sao Paulo',
      state: 'SP',
    },
  }));
  await page.route('**/api/me/onboarding/branding', route => json(route, {
    data: {
      primary_color: '#6366F1',
      secondary_color: '#8B5CF6',
      login_title: 'Orchestra',
    },
  }));
  await page.route('**/api/me/settings', async route => {
    if (route.request().method() === 'GET') {
      return json(route, settingsState);
    }

    const payload = route.request().postDataJSON();
    settingsState.data = {
      ...settingsState.data,
      ...payload,
      dashboard_preferences: {
        ...settingsState.data.dashboard_preferences,
        ...(payload.dashboard_preferences ?? {}),
      },
    };
    return json(route, settingsState);
  });
  await page.route('**/api/company/units?per_page=100', route => json(route, { data: [{ id: 101, name: 'HQ', address_city: 'Sao Paulo', address_state: 'SP', responsible_name: 'Admin' }], meta: { total: 1 } }));
  await page.route('**/api/company/users?per_page=100', route => json(route, { data: [{ id: 1, email: 'admin@orchestra.test' }, { id: 2, email: 'manager@orchestra.test' }], meta: { total: 2 } }));
  await page.route('**/api/company/royalties/rules?per_page=1', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/royalties/assignments?per_page=1', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/me/modules/sidebar', route => json(route, { data: [
    { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
    { module_id: 'financial', name: 'Financeiro', status: 'active' },
    { module_id: 'access', name: 'Acessos', status: 'active' },
    { module_id: 'settings', name: 'Configurações', status: 'active' },
  ] }));
  await page.route('**/api/company/units?per_page=5', route => json(route, { data: [{ id: 101, name: 'HQ', address_city: 'Sao Paulo', address_state: 'SP', status: 'active' }], meta: { total: 1 } }));

  return settingsState;
}

async function expectTourCardInsideViewport(page: Page) {
  const card = page.getByTestId('product-tour-card');
  await expect(card).toBeVisible();

  const box = await card.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
}

test('Tour completion is persisted after reload', async ({ page }) => {
  const settingsState = await setupOnboardingPlatform(page);

  await page.goto('/');
  await expect(page.getByText('Checklist de implantação')).toBeVisible();
  await expect(page.getByText('Fazer tour pela plataforma')).toBeVisible();

  await page.getByRole('button', { name: /Iniciar/i }).click();
  await expect(page.getByTestId('dashboard-title')).toHaveText('Painel Executivo');
  await expect(page.locator('body > [data-tour-portal-root="true"]')).toHaveCount(1);
  await expect(page.locator('body > svg.fixed')).toHaveCount(0);
  await expectTourCardInsideViewport(page);

  let nextButtons = await page.getByRole('button', { name: /Próximo/i }).all();
  while (nextButtons.length > 0) {
    await nextButtons[0].click();
    await expectTourCardInsideViewport(page);
    nextButtons = await page.getByRole('button', { name: /Próximo/i }).all();
  }

  await page.getByRole('button', { name: /Concluir/i }).click();
  await expect(page.getByText('Fazer tour pela plataforma')).toBeHidden();
  expect(settingsState.data.dashboard_preferences).toEqual(expect.objectContaining({ onboarding_tour_completed: true }));

  await page.reload();
  await expect(page.getByText('Fazer tour pela plataforma')).toBeHidden();
});

test('Tour cards stay inside the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupOnboardingPlatform(page);

  await page.goto('/');
  await page.getByRole('button', { name: /Iniciar/i }).click();
  await expectTourCardInsideViewport(page);

  let nextButtons = await page.getByRole('button', { name: /Próximo/i }).all();
  while (nextButtons.length > 0) {
    await nextButtons[0].click();
    await expectTourCardInsideViewport(page);
    nextButtons = await page.getByRole('button', { name: /Próximo/i }).all();
  }
});
