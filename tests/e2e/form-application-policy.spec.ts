import { expect, test } from './support/fixtures';
import type { Page, Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const template = {
  id: 10,
  name: 'Abertura da loja',
  description: 'Checklist diario de abertura',
  category: 'operacional',
  active: true,
  status: 'published',
  metadata: { form_schema: [] },
};

const applicationPolicies = {
  data: {
    template_id: 10,
    network: {
      activation: 'enabled',
      requirement: 'optional',
      effective_enabled: true,
      effective_required: false,
      activation_source: 'network',
      requirement_source: 'network',
    },
    units: [
      {
        id: 101,
        code: 'BH-01',
        name: 'BH Savassi',
        status: 'active',
        activation: 'disabled',
        requirement: 'inherit',
        effective_enabled: false,
        effective_required: false,
        activation_source: 'unit',
        requirement_source: 'network',
        has_exception: true,
      },
      {
        id: 102,
        code: 'SP-02',
        name: 'SP Centro',
        status: 'active',
        activation: 'inherit',
        requirement: 'required',
        effective_enabled: true,
        effective_required: true,
        activation_source: 'network',
        requirement_source: 'unit',
        has_exception: true,
      },
    ],
    meta: { current_page: 1, last_page: 1, per_page: 20, total: 2 },
  },
};

async function mockBuilderApi(page: Page) {
  await page.route('**/api/company/checklists/templates/10/automations', route => json(route, { data: [] }));
  await page.route('**/api/company/checklists/templates/10/application-policies**', route => {
    if (route.request().method() === 'GET') return json(route, applicationPolicies);
    return json(route, applicationPolicies);
  });
  await page.route('**/api/company/checklists/templates/10', route => json(route, { data: template }));
  await page.route('**/api/company/units/options', route => json(route, []));
  await page.route('**/api/company/inventory/locations**', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/recipes**', route => json(route, { data: [], meta: { total: 0 } }));
}

async function mockAuthenticatedSession(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'application-policy-e2e-token');
  });
  await page.route('**/api/me', route => json(route, {
    user: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test', company_id: 10 },
    context: { companyId: 10 },
  }));
  await page.route('**/api/me/company', route => json(route, {
    data: { id: 10, name: 'Orchestra E2E', domain: 'orchestra-e2e', plan: 'enterprise', whiteLabel: {} },
  }));
  await page.route('**/api/me/modules**', route => json(route, {
    data: [
      { id: 'settings', slug: 'settings', status: 'active' },
      { id: 'form-builder', slug: 'form-builder', status: 'active' },
    ],
  }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'Admin Master' }] }));
  await page.route('**/api/me/permissions', route => json(route, {
    data: [
      { id: 'tenant.form-builder.view', name: 'tenant.form-builder.view' },
      { id: 'tenant.form-builder.update', name: 'tenant.form-builder.update' },
      { id: 'tenant.checklists.configure', name: 'tenant.checklists.configure' },
    ],
  }));
}

async function openApplicationPolicies(page: Page) {
  await mockAuthenticatedSession(page);
  await mockBuilderApi(page);
  await page.goto('/settings/form-builder/10');
  const applicationTab = page.getByRole('button', { name: /aplica[cç][aã]o na rede/i });
  await expect(applicationTab).toBeVisible();
  await applicationTab.click();
}

test.describe('politicas de aplicacao do Form Builder', () => {
  test('exibe configuracao, valores efetivos e origens independentes retornados pela API', async ({ page }) => {
    await openApplicationPolicies(page);

    await expect(page.getByRole('heading', { name: /pol[ií]tica da rede/i })).toBeVisible();
    await expect(page.getByTestId('network-application-policy')).toContainText('Ativado');
    await expect(page.getByTestId('network-application-policy')).toContainText('Opcional');

    const disabledUnit = page.getByTestId('unit-application-policy-101');
    await expect(disabledUnit).toContainText('BH Savassi');
    await expect(disabledUnit).toContainText('Desativado');
    await expect(disabledUnit).toContainText(/origem.*unidade/i);
    await expect(disabledUnit).toContainText('Não obrigatório');
    await expect(disabledUnit).toContainText(/origem.*rede/i);
    await expect(disabledUnit).toContainText(/exce[cç][aã]o/i);

    const requiredUnit = page.getByTestId('unit-application-policy-102');
    await expect(requiredUnit).toContainText('Ativado');
    await expect(requiredUnit).toContainText(/origem.*rede/i);
    await expect(requiredUnit).toContainText('Obrigatório');
    await expect(requiredUnit).toContainText(/origem.*unidade/i);
  });

  test('edita a politica explicita da rede e apresenta a validacao disabled + required', async ({ page }) => {
    await openApplicationPolicies(page);

    const network = page.getByTestId('network-application-policy');
    await network.getByLabel('Ativação da rede').selectOption('disabled');
    await network.getByLabel('Obrigatoriedade da rede').selectOption('required');
    await network.getByRole('button', { name: /salvar pol[ií]tica da rede/i }).click();

    await expect(page.getByRole('alert')).toContainText(/desativad[oa].*obrigat[oó]ri[oa]/i);
  });

  test('cria excecao parcial e restaura somente a propriedade escolhida', async ({ page }) => {
    await openApplicationPolicies(page);

    const unit = page.getByTestId('unit-application-policy-102');
    await unit.getByLabel('Ativação de SP Centro').selectOption('disabled');

    const update = page.waitForRequest(request =>
      request.method() === 'PUT'
      && request.url().includes('/api/company/checklists/templates/10/application-policies/units/102'),
    );
    await unit.getByRole('button', { name: /salvar exce[cç][aã]o/i }).click();
    expect((await update).postDataJSON()).toEqual({ activation: 'disabled', requirement: 'required' });

    const restore = page.waitForRequest(request =>
      request.method() === 'DELETE'
      && request.url().includes('/api/company/checklists/templates/10/application-policies/units/102/requirement'),
    );
    await unit.getByRole('button', { name: /restaurar obrigatoriedade/i }).click();
    await restore;

    await expect(unit.getByRole('button', { name: /restaurar ativa[cç][aã]o/i })).toBeVisible();
  });

  test('envia filtros administrativos para a API sem calcular valores efetivos localmente', async ({ page }) => {
    await openApplicationPolicies(page);

    await page.getByLabel('Buscar unidade').fill('Savassi');
    await page.getByLabel('Ativação efetiva').selectOption('disabled');
    await page.getByLabel('Obrigatoriedade efetiva').selectOption('optional');
    await page.getByLabel('Existência de exceção').selectOption('with_exception');

    const filteredRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return request.method() === 'GET'
        && url.pathname.endsWith('/api/company/checklists/templates/10/application-policies')
        && url.searchParams.get('search') === 'Savassi'
        && url.searchParams.get('effective_activation') === 'disabled'
        && url.searchParams.get('effective_requirement') === 'optional'
        && url.searchParams.get('has_exception') === 'true';
    });
    await page.getByRole('button', { name: /aplicar filtros/i }).click();
    await filteredRequest;
  });
});
