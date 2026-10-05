import type { Page, Route } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockTenantSession(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'field-visibility-e2e-token');
  });

  await page.route('**/api/me', route => json(route, {
    user: { id: 1, name: 'Admin Tenant A', email: 'admin@tenant-a.test', company_id: 10 },
    context: { companyId: 10 },
  }));
  await page.route('**/api/me/company', route => json(route, {
    data: { id: 10, name: 'Tenant A', domain: 'tenant-a', plan: 'enterprise', whiteLabel: {} },
  }));
  await page.route('**/api/me/modules**', route => json(route, {
    data: [{ id: 'customers', slug: 'customers', status: 'active' }],
  }));
  await page.route('**/api/me/roles', route => json(route, {
    data: [{ id: 1, name: 'Admin Master' }],
  }));
  await page.route('**/api/me/permissions', route => json(route, {
    data: [{ id: 'tenant.customers.create', name: 'tenant.customers.create' }],
  }));
}

test('formulario dinamico exibe somente os campos visiveis configurados para o tenant', async ({ page }) => {
  await mockTenantSession(page);
  await page.route('**/api/metadata/customers', route => json(route, {
    data: {
      entity: 'customers',
      entity_key: 'customers',
      singular_label: 'Cliente',
      plural_label: 'Clientes',
      form_schema: [
        { key: 'name', label: 'Nome visivel', type: 'text', visible: true, order: 10 },
        { key: 'internal_code', label: 'Codigo interno oculto', type: 'text', visible: false, order: 20 },
      ],
      table_schema: [],
    },
  }));

  await page.goto('/customers/new');

  await expect(page.getByRole('heading', { name: 'Novo Cliente' })).toBeVisible();
  await expect(page.getByLabel('Nome visivel')).toBeVisible();
  await expect(page.getByLabel('Codigo interno oculto')).toHaveCount(0);
});

test('administrador oculta um campo de Clientes no Form Builder e salva a configuracao', async ({ page }) => {
  await mockTenantSession(page);

  const metadata = {
    entity: 'customers',
    entity_key: 'customers',
    singular_label: 'Cliente',
    plural_label: 'Clientes',
    form_schema: [
      { key: 'name', label: 'Nome', type: 'text', required: true, visible: true, order: 10 },
      { key: 'internal_code', label: 'Codigo interno', type: 'text', required: false, visible: true, order: 20 },
    ],
    table_schema: [],
  };

  await page.route('**/api/metadata/customers', async route => {
    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON() as typeof metadata;
      metadata.form_schema = payload.form_schema;
      await json(route, { data: metadata });
      return;
    }

    await json(route, { data: metadata });
  });

  await page.goto('/settings/form-builder/customers');

  const requiredVisibility = page.getByRole('switch', { name: 'Exibir Nome' });
  await expect(requiredVisibility).toBeChecked();
  await expect(requiredVisibility).toBeDisabled();

  const visibility = page.getByRole('switch', { name: 'Exibir Codigo interno' });
  await expect(visibility).toBeChecked();

  const updateRequest = page.waitForRequest(request => (
    request.method() === 'PUT'
    && new URL(request.url()).pathname === '/api/metadata/customers'
  ));

  await visibility.click();
  await page.getByRole('button', { name: 'Salvar alteracoes' }).click();

  const request = await updateRequest;
  expect(request.postDataJSON()).toMatchObject({
    form_schema: [
      { key: 'name', visible: true },
      { key: 'internal_code', visible: false },
    ],
  });

  await page.reload();
  await expect(page.getByRole('switch', { name: 'Exibir Codigo interno' })).not.toBeChecked();
});
