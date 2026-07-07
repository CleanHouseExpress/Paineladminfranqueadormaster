import { expect, Page } from '@playwright/test';
import { ids } from './selectors';

export async function disableOnboarding(page: Page) {
  const completed = {
    required: false,
    status: 'completed',
    current_step: 'completed',
    required_steps: ['company_profile', 'branding', 'settings'],
    completed_steps: ['company_profile', 'branding', 'settings'],
    onboarding_required: false,
    completed_at: new Date(0).toISOString(),
  };

  await page.route('**/api/me/onboarding', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(completed),
  }));
  await page.route('**/api/me/onboarding/company-profile', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { trade_name: 'Orchestra E2E', segment: 'Homologacao', email: 'e2e@orchestra.com', city: 'Sao Paulo', state: 'SP' } }),
  }));
  await page.route('**/api/me/onboarding/branding', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { primary_color: '#6366F1', secondary_color: '#8B5CF6', login_title: 'Orchestra' } }),
  }));
  await page.route('**/api/me/settings', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { timezone: 'America/Sao_Paulo', language: 'pt-BR', currency: 'BRL', dashboard_preferences: { onboarding_clients_imported: true } } }),
  }));
  await page.route('**/api/company/units?per_page=100', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 101, name: 'BH Savassi', address_city: 'Belo Horizonte', address_state: 'MG', responsible_name: 'Marina Costa' }], meta: { total: 1 } }),
  }));
  await page.route('**/api/company/users?per_page=100', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 1, email: 'admin@orchestra.test', roles: [{ name: 'Admin Master' }] }, { id: 2, email: 'franqueado@orchestra.test', roles: [{ name: 'Franqueado' }] }], meta: { total: 2 } }),
  }));
}

export async function login(page: Page, credentials: { email: string; password: string }) {
  await disableOnboarding(page);
  await page.goto('/login');
  await page.evaluate(() => {
    window.localStorage.removeItem('orchestra_auth_token');
    window.sessionStorage.clear();
  });
  await page.reload();
  await page.getByTestId(ids.loginEmail).fill(credentials.email);
  await page.getByTestId(ids.loginPassword).fill(credentials.password);
  await expect(page.getByTestId(ids.loginSubmit)).toBeEnabled();
  await page.getByTestId(ids.loginSubmit).click();
  await expect(page).not.toHaveURL(/\/login$/);
  await page.waitForFunction(() => Boolean(window.localStorage.getItem('orchestra_auth_token')));
  await expect(page.getByTestId(ids.sidebar)).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByTestId(ids.logout).click({ force: true });
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
}

