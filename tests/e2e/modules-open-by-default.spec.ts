import { expect, test, type Page, type Route } from '@playwright/test';

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockSessionWithoutDashboardModule(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'modules-open-token');
  });

  await page.route('**/api/me', route => json(route, {
    user: { id: 1, name: 'Admin Master', email: 'admin@example.com', role: 'company_admin', company_id: 1 },
    context: { companyId: 1 },
  }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Melten', plan: 'enterprise' } }));
  await page.route('**/api/me/modules', route => json(route, {
    data: [
      { id: 'units', slug: 'units', status: 'active' },
      { id: 'financial', slug: 'financial', status: 'active' },
    ],
  }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ slug: 'company_admin', name: 'Company Admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, {
    data: [
      { slug: 'tenant.dashboard.view' },
      { slug: 'tenant.units.view' },
      { slug: 'tenant.financial.view' },
    ],
  }));
  await page.route('**/api/me/onboarding', route => json(route, { required: false, status: 'completed', current_step: 'completed', onboarding_required: false }));
  await page.route('**/api/me/onboarding/company-profile', route => json(route, { data: {} }));
  await page.route('**/api/me/onboarding/branding', route => json(route, { data: {} }));
  await page.route('**/api/me/settings', route => json(route, { data: {} }));
  await page.route('**/api/me/modules/sidebar', route => json(route, []));
  await page.route('**/api/me/units', route => json(route, []));
  await page.route('**/api/company/units?per_page=100', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/users?per_page=100', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/royalties/rules?per_page=1', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/royalties/assignments?per_page=1', route => json(route, { data: [], meta: { total: 0 } }));
}

test('@smoke modulos ausentes na lista da API ficam liberados por padrao', async ({ page }) => {
  await mockSessionWithoutDashboardModule(page);

  const modulesResponse = page.waitForResponse(response => response.url().includes('/api/me/modules') && response.status() === 200);
  await page.goto('/dashboard');
  await modulesResponse;
  await page.waitForTimeout(250);

  await expect(page.getByText('Dashboard nao esta disponivel pela interface')).toHaveCount(0);
  await expect(page.getByText('Este modulo esta registrado no catalogo')).toHaveCount(0);
});
