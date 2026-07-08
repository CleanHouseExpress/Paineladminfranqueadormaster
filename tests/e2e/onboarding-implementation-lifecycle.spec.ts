import { expect, test, type Page } from '@playwright/test';
import { disableOnboarding } from './support/auth';

const publishedProgram = {
  id: 10,
  name: 'Programa Clinicas Premium',
  description: 'Onboarding completo de rede premium',
  category: 'franquia',
  status: 'active',
  versions_count: 1,
  published_versions_count: 1,
  versions: [
    {
      id: 21,
      program_id: 10,
      version: 1,
      status: 'published',
      change_notes: 'Primeira versao publicada',
      published_at: '2026-07-08T12:00:00Z',
      steps: [
        { id: 101, name: 'Contrato', position: 1, responsible_role: 'consultor', dependencies: [], sla: { days: 3 } },
        { id: 102, name: 'Catalogo inicial', position: 2, responsible_role: 'implantador', dependencies: [101], sla: { days: 7 } },
        { id: 103, name: 'Primeira venda', position: 3, responsible_role: 'operacoes', dependencies: [102], sla: { days: 2 } },
      ],
      role_assignments: [],
    },
  ],
  latest_version: null,
  created_at: '2026-07-08T00:00:00Z',
  updated_at: '2026-07-08T00:00:00Z',
};

function guidedSetup(firstStepCompleted = false) {
  return {
    summary: {
      title: 'Setup guiado',
      description: 'Configure a base inicial e avance ate o primeiro valor do Orchestra.',
      progress_percent: firstStepCompleted ? 33 : 0,
      completed_required_steps: firstStepCompleted ? 1 : 0,
      total_required_steps: 3,
      first_value_reached: false,
    },
    next_action: firstStepCompleted ? {
      id: 9002,
      title: 'Catalogo inicial',
      description: 'Cadastre os primeiros produtos ou servicos.',
      position: 2,
      status: 'pending',
      is_required: true,
      can_complete: true,
      can_skip: false,
      blocked_by_phase_ids: [],
      module_owner: 'catalogo',
      module_route: '/catalog',
      cta_label: 'Abrir catalogo',
      help_text: 'Cadastre produtos ou servicos iniciais no Catalogo.',
    } : {
      id: 9001,
      title: 'Contrato',
      description: 'Formalize o inicio da jornada.',
      position: 1,
      status: 'pending',
      is_required: true,
      can_complete: true,
      can_skip: false,
      blocked_by_phase_ids: [],
      module_owner: 'onboarding',
      module_route: '/onboarding/implementations',
      cta_label: 'Continuar setup',
      help_text: 'Conclua Contrato para avancar no setup inicial.',
    },
    steps: [
      { id: 9001, title: 'Contrato', description: 'Formalize o inicio da jornada.', position: 1, status: firstStepCompleted ? 'completed' : 'pending', is_required: true, can_complete: !firstStepCompleted, can_skip: false, blocked_by_phase_ids: [], module_owner: 'onboarding', module_route: '/onboarding/implementations', cta_label: 'Continuar setup', help_text: 'Conclua Contrato para avancar no setup inicial.' },
      { id: 9002, title: 'Catalogo inicial', description: 'Cadastre os primeiros produtos ou servicos.', position: 2, status: 'pending', is_required: true, can_complete: firstStepCompleted, can_skip: false, blocked_by_phase_ids: firstStepCompleted ? [] : [9001], module_owner: 'catalogo', module_route: '/catalog', cta_label: 'Abrir catalogo', help_text: 'Cadastre produtos ou servicos iniciais no Catalogo.' },
      { id: 9003, title: 'Primeira venda', description: 'Realize o primeiro uso efetivo.', position: 3, status: 'pending', is_required: true, can_complete: false, can_skip: false, blocked_by_phase_ids: [9002], module_owner: 'vendas', module_route: '/sales', cta_label: 'Abrir vendas', help_text: 'Registre a primeira venda quando a base estiver pronta.' },
    ],
  };
}

function createdImplementation(firstStepCompleted = false) {
  return {
    id: 501,
    tenant_id: 1,
    unit_id: 101,
    unit: { id: 101, name: 'Unidade Centro', code: 'CTR', status: 'active', address_city: 'Sao Paulo', address_state: 'SP' },
    program_id: 10,
    program: { id: 10, name: 'Programa Clinicas Premium', category: 'franquia', status: 'active' },
    program_version_id: 21,
    program_version: { id: 21, version: 1, status: 'published' },
    status: 'planning',
    current_phase_id: firstStepCompleted ? 9002 : 9001,
    current_phase: firstStepCompleted ? { id: 9002, name: 'Catalogo inicial', position: 2, status: 'pending' } : { id: 9001, name: 'Contrato', position: 1, status: 'pending' },
    responsible_user_id: null,
    responsible: null,
    created_by: 1,
    planned_opening_date: '2026-08-01',
    actual_opening_date: null,
    progress_percent: firstStepCompleted ? 33 : 0,
    steps_count: 3,
    guided_setup: guidedSetup(firstStepCompleted),
    phases: [
      { id: 9001, program_step_id: 101, name: 'Contrato', description: '', position: 1, responsible_role: 'consultor', responsible_user_id: null, is_required: true, sla_days: 3, depends_on_phase_ids: [], condition: {}, completion_criteria: {}, document_requirements: [], checklist_template_id: null, status: firstStepCompleted ? 'completed' : 'pending', due_date: '2026-08-04' },
      { id: 9002, program_step_id: 102, name: 'Catalogo inicial', description: '', position: 2, responsible_role: 'implantador', responsible_user_id: null, is_required: true, sla_days: 7, depends_on_phase_ids: [9001], condition: {}, completion_criteria: {}, document_requirements: [], checklist_template_id: null, status: 'pending', due_date: '2026-08-08' },
      { id: 9003, program_step_id: 103, name: 'Primeira venda', description: '', position: 3, responsible_role: 'operacoes', responsible_user_id: null, is_required: true, sla_days: 2, depends_on_phase_ids: [9002], condition: {}, completion_criteria: {}, document_requirements: [], checklist_template_id: null, status: 'pending', due_date: '2026-08-03' },
    ],
    archived_at: null,
    created_at: '2026-07-08T13:00:00Z',
    updated_at: '2026-07-08T13:00:00Z',
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
      'tenant.onboarding.implementations.view',
      'tenant.onboarding.implementations.create',
      'tenant.onboarding.implementations.update',
      'tenant.onboarding.implementations.cancel',
    ] }),
  }));

  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'e2e-token');
  });
}

async function mockLifecycleApi(page: Page) {
  let implementations: Array<Record<string, unknown>> = [];

  await page.route('**/api/tenant/onboarding/programs?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [publishedProgram], meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } }),
  }));
  await page.route('**/api/tenant/onboarding/programs/10', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: publishedProgram }),
  }));
  await page.route('**/api/company/units/options', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ value: 101, label: 'Unidade Centro' }]),
  }));
  await page.route('**/api/tenant/onboarding/implementations?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: implementations, meta: { current_page: 1, last_page: 1, per_page: 15, total: implementations.length } }),
  }));
  await page.route('**/api/tenant/onboarding/implementations', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: implementations, meta: { current_page: 1, last_page: 1, per_page: 15, total: implementations.length } }),
      });
      return;
    }

    implementations = [createdImplementation()];
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: implementations[0] }) });
  });
  await page.route('**/api/tenant/onboarding/implementations/501/steps/9001/complete', async route => {
    implementations = [createdImplementation(true)];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: implementations[0] }) });
  });
}

test('Guided Setup materializa jornada e mostra proximo passo @smoke', async ({ page }) => {
  await mockSession(page);
  await mockLifecycleApi(page);

  await page.goto('/onboarding/implementations');

  await expect(page.getByTestId('onboarding-implementation-lifecycle')).toBeVisible();
  await expect(page.getByTestId('implementation-empty-state')).toBeVisible();

  await page.getByRole('button', { name: /Nova jornada/ }).click();
  await expect(page.getByTestId('implementation-create-panel')).toBeVisible();
  await page.getByTestId('implementation-program-select').selectOption('10');
  await page.getByTestId('implementation-version-select').selectOption('21');
  await page.getByTestId('implementation-unit-select').selectOption('101');
  await page.getByLabel('Data prevista').fill('2026-08-01');
  await page.getByTestId('implementation-create-submit').click();

  await expect(page.getByText('Jornada criada.')).toBeVisible();
  await expect(page.getByTestId('implementation-list')).toContainText('Unidade Centro');
  await expect(page.getByTestId('implementation-detail')).toContainText('Planejamento');
  await expect(page.getByTestId('guided-setup-panel')).toContainText('Setup guiado');
  await expect(page.getByTestId('next-action-card')).toContainText('Contrato');
  await expect(page.getByTestId('implementation-phases')).toContainText('Contrato');
  await expect(page.getByTestId('implementation-phases')).toContainText('Catalogo inicial');

  await page.getByRole('button', { name: /Marcar pronto/ }).click();
  await expect(page.getByText('Passo concluido.')).toBeVisible();
  await expect(page.getByTestId('next-action-card')).toContainText('Catalogo inicial');
  await expect(page.getByTestId('guided-setup-panel')).toContainText('33%');
});
