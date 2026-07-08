import { expect, test, type Page } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function programPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    name: 'Programa Clinicas Premium',
    description: 'Onboarding completo de rede premium',
    category: 'franquia',
    status: 'draft',
    versions_count: 1,
    published_versions_count: 0,
    versions: [
      {
        id: 21,
        program_id: 10,
        version: 1,
        status: 'draft',
        change_notes: 'Primeira versao',
        steps: [
          {
            id: 101,
            name: 'Contrato',
            description: 'Formalizacao contratual',
            category: 'juridico',
            position: 1,
            responsible_role: 'consultor',
            is_required: true,
            completion_criteria: { contract_signed: true },
            document_requirements: [{ name: 'Contrato assinado', required: true }],
            dependencies: [],
            sla: { days: 3, starts_from: 'program_start', escalation_policy: {} },
          },
          {
            id: 102,
            name: 'Configuracao',
            description: 'Parametros iniciais',
            category: 'operacao',
            position: 2,
            responsible_role: 'implantador',
            is_required: true,
            dependencies: [101],
            sla: { days: 7, starts_from: 'program_start', escalation_policy: {} },
          },
        ],
      },
    ],
    latest_version: null,
    created_at: '2026-07-08T00:00:00Z',
    updated_at: '2026-07-08T00:00:00Z',
    ...overrides,
  };
}

async function mockSession(page: Page) {
  await disableOnboarding(page);
  await page.route('**/api/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: { id: 1, name: 'Admin', email: 'admin@orchestra.test', role: 'company_admin' },
      context: { companyId: 1 },
    }),
  }));
  await page.route('**/api/me/company', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }),
  }));
  await page.route('**/api/me/modules', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 'onboarding', slug: 'onboarding', status: 'active' }] }),
  }));
  await page.route('**/api/me/roles', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 1, name: 'Company Admin' }] }),
  }));
  await page.route('**/api/me/permissions', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [
      'tenant.onboarding.programs.view',
      'tenant.onboarding.programs.create',
      'tenant.onboarding.programs.update',
      'tenant.onboarding.programs.archive',
      'tenant.onboarding.programs.publish',
    ] }),
  }));

  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'e2e-token');
  });
}

async function mockProgramApi(page: Page) {
  let program = programPayload();

  await page.route('**/api/tenant/onboarding/programs?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [program], meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } }),
  }));
  await page.route('**/api/tenant/onboarding/programs', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [program], meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } }),
      });
      return;
    }

    program = programPayload({ id: 11, name: 'Novo programa de onboarding', versions: [], versions_count: 0 });
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: program }) });
  });
  await page.route('**/api/tenant/onboarding/programs/10', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: program }),
  }));
  await page.route('**/api/tenant/onboarding/programs/10/versions/21', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: program.versions[0] }) });
  });
  await page.route('**/api/tenant/onboarding/programs/10/versions/21/publish', async route => {
    program = programPayload({
      status: 'active',
      published_versions_count: 1,
      versions: [{ ...(program.versions as Array<Record<string, unknown>>)[0], status: 'published', published_at: '2026-07-08T12:00:00Z' }],
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: (program.versions as Array<unknown>)[0] }) });
  });
  await page.route('**/api/tenant/onboarding/programs/*/duplicate', async route => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: programPayload({ id: 12, name: 'Programa Clinicas Premium (copia)' }) }) });
  });
  await page.route('**/api/tenant/onboarding/programs/*/archive', async route => {
    program = programPayload({ status: 'archived' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: program }) });
  });
}

test('Program Builder cria, edita, publica, duplica e arquiva @smoke', async ({ page }) => {
  await mockSession(page);
  await mockProgramApi(page);

  page.on('dialog', dialog => dialog.accept());
  await page.goto('/onboarding/programs');

  await expect(page.getByTestId('onboarding-program-builder')).toBeVisible();
  await expect(page.getByTestId('program-list')).toContainText('Programa Clinicas Premium');
  await page.getByText('Programa Clinicas Premium').click();

  await expect(page.getByTestId('program-step-list')).toContainText('Contrato');
  await page.getByTestId('program-step-name-input').fill('Contrato e documentos');
  await page.getByRole('button', { name: /Salvar/ }).click();
  await expect(page.getByText('Programa salvo.')).toBeVisible();

  await page.getByRole('button', { name: /Publicar/ }).click();
  await expect(page.getByText('Versao publicada.')).toBeVisible();
  await expect(page.getByText('Publicado').first()).toBeVisible();

  await page.getByRole('button', { name: /Duplicar/ }).click();
  await expect(page.getByText('Programa duplicado.')).toBeVisible();

  await page.getByRole('button', { name: /Arquivar/ }).click();
  await expect(page.getByText('Programa arquivado.')).toBeVisible();
});
