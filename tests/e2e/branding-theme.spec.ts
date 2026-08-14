import { test, expect } from '@playwright/test';

const initialBranding = {
  display_name: 'Orchestra E2E',
  logo: null,
  compact_logo: null,
  favicon: '/api/tenant/branding/assets/favicon',
  primary_color: '#6366F1',
  secondary_color: '#8B5CF6',
  accent_color: '#E9EBEF',
  background_color: '#FFFFFF',
  sidebar_color: '#0F172A',
  header_color: '#FFFFFF',
  foreground_color: '#0F172A',
  authentication_background_image: null,
  theme_mode: 'light',
  login_title: 'Orchestra',
  login_subtitle: 'Acesse o painel da sua rede',
};

const restoredBranding = {
  ...initialBranding,
  display_name: 'Orchestra',
  favicon: null,
  primary_color: '#030213',
  secondary_color: '#6366F1',
  sidebar_color: '#0F172A',
};

const expectedApiOrigin = new URL(process.env.E2E_API_URL ?? 'http://orchestra-e2e.localhost:8000').origin;

test('@branding configuracao aplica preview, salva e restaura tema', async ({ page }) => {
  let branding = { ...initialBranding };
  let saveCalls = 0;
  let restoreCalls = 0;

  await page.route('**/api/tenant/current', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      exists: true,
      tenant: { name: 'Orchestra E2E', status: 'active', segment: 'Homologacao', plan: 'Enterprise', subdomain: 'orchestra-e2e' },
      branding,
      white_label: branding,
    }),
  }));

  await page.route('**/api/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 1, name: 'Admin Branding', email: 'admin@orchestra.test', role: 'company_admin' } }),
  }));
  await page.route('**/api/me/company', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise', subdomain: { subdomain: 'orchestra-e2e' } } }),
  }));
  await page.route('**/api/me/modules', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 'settings', slug: 'settings', name: 'Configuracoes', status: 'active' }] }),
  }));
  await page.route('**/api/me/roles', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 1, name: 'Admin Master' }] }) }));
  await page.route('**/api/me/permissions', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: ['tenant.onboarding.manage'] }) }));
  await page.route('**/api/company/logout', route => route.fulfill({ status: 204 }));
  await page.route('**/api/tenant/branding/assets/favicon', route => route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    ),
  }));
  await page.route('**/api/me/onboarding', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ required: false, status: 'completed', onboarding_required: false, completed_steps: ['company_profile', 'branding', 'settings'] }),
  }));
  await page.route('**/api/me/onboarding/branding', async route => {
    if (route.request().method() === 'PUT') {
      saveCalls += 1;
      const payload = route.request().postDataJSON() as Record<string, string | null>;
      branding = {
        ...branding,
        display_name: payload.display_name ?? branding.display_name,
        primary_color: payload.primary_color ?? branding.primary_color,
        secondary_color: payload.secondary_color ?? branding.secondary_color,
        background_color: payload.background_color ?? branding.background_color,
        sidebar_color: payload.sidebar_color ?? branding.sidebar_color,
        header_color: payload.header_color ?? branding.header_color,
        foreground_color: payload.foreground_color ?? branding.foreground_color,
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: branding, branding_completed: true }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: branding, branding_completed: true }) });
  });
  await page.route('**/api/me/onboarding/branding/restore-default', route => {
    restoreCalls += 1;
    branding = { ...restoredBranding };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: branding, branding_completed: false }) });
  });

  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'e2e-token'));
  await page.goto('/settings/whitelabel');

  await expect(page.getByRole('heading', { name: 'Personalizacao White Label' })).toBeVisible();
  await expect(page).toHaveTitle('Orchestra E2E - Orchestra');
  const faviconHref = await page.locator('#tenant-branding-favicon').getAttribute('href');
  expect(faviconHref).not.toBeNull();
  const faviconUrl = new URL(faviconHref!);
  expect(faviconUrl.origin).toBe(expectedApiOrigin);
  expect(faviconUrl.pathname).toBe('/api/tenant/branding/assets/favicon');
  expect([...faviconUrl.searchParams.keys()]).toEqual(['v']);
  expect(faviconUrl.searchParams.get('v')).toMatch(/^\d+$/);
  await page.locator('#branding-primaryColor').fill('#0EA5E9');
  await page.locator('#branding-sidebarColor').fill('#111827');
  await expect(page.getByTestId('branding-preview')).toContainText('Contraste calculado');
  await expect(page.getByTestId('branding-preview').locator('aside')).toHaveCSS('background-color', 'rgb(17, 24, 39)');
  await expect(page.locator('aside').first()).toHaveCSS('background-color', 'rgb(15, 23, 42)');

  await page.locator('#branding-secondaryColor').fill('url(javascript:alert(1))');
  await expect(page.getByText('Use #RGB ou #RRGGBB.')).toBeVisible();
  await expect(page.getByTestId('branding-save')).toBeDisabled();

  await page.locator('#branding-secondaryColor').fill('#22C55E');
  await expect(page.getByTestId('branding-save')).toBeEnabled();
  await page.getByTestId('branding-save').click();
  await expect(page.getByText('Branding salvo e aplicado para esta sessao.')).toBeVisible();
  expect(saveCalls).toBe(1);
  await expect(page.locator('aside').first()).toHaveCSS('background-color', 'rgb(17, 24, 39)');

  await page.reload();
  await expect(page.locator('#branding-primaryColor')).toHaveValue('#0EA5E9');

  await page.getByRole('button', { name: 'Restaurar padrao' }).click();
  await expect(page.getByRole('dialog')).toContainText('Restaurar tema padrao?');
  await page.getByRole('button', { name: /^Restaurar$/ }).click();
  await expect(page.getByText('Tema padrao Orchestra restaurado.')).toBeVisible();
  expect(restoreCalls).toBe(1);
  await expect(page.locator('#branding-primaryColor')).toHaveValue('#030213');
  await expect(page.locator('#tenant-branding-favicon')).toHaveCount(0);
  await expect(page).toHaveTitle('Orchestra');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Salvar alteracoes' })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.getByTestId('logout-button').click();
  await expect(page.getByTestId('login-submit')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Entrar no Orchestra' })).toBeVisible();
});
