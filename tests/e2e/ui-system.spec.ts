import { expect, test, type Page, type Route } from '@playwright/test';

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockAdmin(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'ui-system-token');
  });
  await page.route('**/api/me', route => json(route, {
    user: { id: 1, name: 'Admin Master', email: 'admin@example.com', role: 'company_admin', company_id: 1 },
    context: { companyId: 1 },
  }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules', route => json(route, { data: [{ id: 'units', slug: 'units', status: 'active' }] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ slug: 'company_admin', name: 'Company Admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, {
    data: [
      { slug: 'tenant.units.view' },
      { slug: 'tenant.units.create' },
      { slug: 'tenant.units.update' },
      { slug: 'tenant.units.configure' },
    ],
  }));
  await page.route('**/api/me/onboarding', route => json(route, { required: false, status: 'completed', current_step: 'completed', onboarding_required: false }));
  await page.route('**/api/me/onboarding/company-profile', route => json(route, { data: {} }));
  await page.route('**/api/me/onboarding/branding', route => json(route, { data: { primary_color: '#0f766e', secondary_color: '#155e75' } }));
  await page.route('**/api/me/settings', route => json(route, { data: {} }));
  await page.route('**/api/me/modules/sidebar', route => json(route, []));
  await page.route('**/api/me/units', route => json(route, []));
  await page.route('**/api/metadata/units', route => json(route, {
    data: {
      entity_key: 'units',
      entity: 'units',
      singular_label: 'Unidade',
      plural_label: 'Unidades',
      fields: [],
      table_columns: [
        { key: 'name', label: 'Nome', sortable: true },
        { key: 'status', label: 'Status' },
      ],
      table_schema: [
        { key: 'name', label: 'Nome', sortable: true },
        { key: 'status', label: 'Status' },
      ],
    },
  }));
  await page.route('**/api/company/units**', route => json(route, { data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } }));
}

test('@smoke sistema visual aplica layout, tabela e empty state padronizados', async ({ page }) => {
  await mockAdmin(page);
  await page.goto('/units');

  const main = page.locator('main');
  await expect(main).toHaveAttribute('data-testid', 'admin-main');
  const mainPadding = await main.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      left: Number.parseFloat(style.paddingLeft),
      top: Number.parseFloat(style.paddingTop),
    };
  });
  expect(mainPadding.left).toBeGreaterThanOrEqual(24);
  expect(mainPadding.top).toBeGreaterThanOrEqual(24);

  const header = page.getByTestId('page-header');
  await expect(header.getByRole('heading', { name: 'Unidades' })).toBeVisible();
  await expect(header.getByText('Gestao operacional de unidades.')).toBeVisible();
  await expect(header.getByRole('link', { name: /Nova Unidade/i })).toBeVisible();

  const toolbar = page.getByTestId('list-toolbar');
  await expect(toolbar.getByPlaceholder(/Buscar unidade/i)).toBeVisible();
  await expect(toolbar.getByRole('button', { name: /Filtrar/i })).toBeVisible();

  const table = page.getByTestId('dynamic-table');
  await expect(table).toBeVisible();
  await expect(table).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(table.getByText('Nenhuma unidade encontrada')).toBeVisible();
  await expect(table.getByText(/Ajuste a busca/)).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(header.getByRole('link', { name: /Nova Unidade/i })).toBeVisible();
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalScroll).toBe(false);
});
