import { expect, test, type Page } from '@playwright/test';
import { disableOnboarding } from './support/auth';

const unitMetadata = {
  data: {
    entity_key: 'units',
    entity: 'units',
    singular_label: 'Unidade',
    plural_label: 'Unidades',
    fields: [
      { key: 'name', label: 'Nome', type: 'text', field_type: 'text', required: true, visible: true, editable: true, order: 10, section: 'general' },
      { key: 'status', label: 'Status', type: 'select', field_type: 'select', required: true, visible: true, editable: true, order: 20, section: 'general', options: [
        { label: 'Ativa', value: 'active' },
        { label: 'Em abertura', value: 'opening' },
      ] },
      { key: 'responsible_name', label: 'Responsavel', type: 'text', field_type: 'text', visible: true, editable: true, order: 30, section: 'responsible' },
      { key: 'opening_date', label: 'Data de abertura', type: 'date', field_type: 'date', visible: true, editable: true, order: 40, section: 'operation' },
      { key: 'address_city', label: 'Cidade', type: 'text', field_type: 'text', visible: true, editable: true, order: 50, section: 'address' },
      { key: 'address_state', label: 'Estado', type: 'text', field_type: 'text', visible: true, editable: true, order: 60, section: 'address' },
    ],
    table_columns: [],
    table_schema: [],
  },
};

const unit101 = {
  id: 101,
  name: 'BH Savassi',
  status: 'opening',
  responsible_name: 'Marina Costa',
  opening_date: '2026-09-07',
  address_city: 'Belo Horizonte',
  address_state: 'MG',
};

const unit999 = {
  id: 999,
  name: 'Unidade Sem Implantacao',
  status: 'opening',
  responsible_name: 'Consultor',
  opening_date: '2026-10-10',
  address_city: 'Sao Paulo',
  address_state: 'SP',
};

const templatePayload = {
  id: 'tpl-franchise-standard',
  name: 'Implantacao padrao de franquia',
  description: 'Fluxo padrao.',
  active: true,
  phases: [
    {
      id: 'contract',
      name: 'Contrato',
      position: 1,
      relative_start_day: 0,
      sla_days: 5,
      tasks: [
        {
          id: 'contract-signature',
          name: 'Assinar contrato de franquia',
          description: 'Assinatura formal.',
          relative_day: 1,
          priority: 'high',
          suggested_assignee: 'Expansao',
          checklist: ['Validar dados', 'Coletar assinatura'],
        },
      ],
    },
    {
      id: 'equipment',
      name: 'Equipamentos',
      position: 5,
      relative_start_day: 54,
      sla_days: 14,
      tasks: [
        {
          id: 'equipment-delivery',
          name: 'Confirmar entrega de equipamentos',
          description: 'Validar recebimento dos equipamentos homologados.',
          relative_day: 64,
          priority: 'high',
          suggested_assignee: 'Compras',
          dependencies: ['equipment-order'],
          checklist: ['Conferir nota fiscal', 'Registrar evidencia'],
        },
      ],
    },
  ],
};

function implementationPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'impl-101',
    unit_id: 101,
    unit_name: 'BH Savassi',
    city: 'Belo Horizonte',
    state: 'MG',
    brand: 'Bella Vita',
    status: 'in_progress',
    responsible_user_id: 7,
    responsible_user_name: 'Marina Costa',
    template_id: 'tpl-franchise-standard',
    planned_opening_date: '2026-09-07',
    actual_opening_date: null,
    progress_percent: 65,
    current_phase_id: 'equipment',
    phases: [
      {
        id: 'contract',
        name: 'Contrato',
        position: 1,
        status: 'completed',
        start_date: '2026-06-01',
        due_date: '2026-06-05',
        completed_at: '2026-06-05',
        tasks: [
          {
            id: 'contract-signature',
            phase_id: 'contract',
            name: 'Assinar contrato de franquia',
            description: 'Assinatura formal do contrato.',
            position: 1,
            status: 'completed',
            priority: 'high',
            responsible_user_id: 3,
            responsible_user_name: 'Expansao',
            start_date: '2026-06-01',
            due_date: '2026-06-02',
            completed_at: '2026-06-02',
            depends_on_task_ids: [],
            checklist: [{ id: 'check-1', title: 'Validar dados', completed: true }],
            comments: [],
          },
        ],
      },
      {
        id: 'equipment',
        name: 'Equipamentos',
        position: 5,
        status: 'in_progress',
        start_date: '2026-07-25',
        due_date: '2026-08-08',
        completed_at: null,
        tasks: [
          {
            id: 'equipment-delivery',
            phase_id: 'equipment',
            name: 'Confirmar entrega de equipamentos',
            description: 'Validar recebimento dos equipamentos homologados.',
            position: 2,
            status: 'in_progress',
            priority: 'high',
            responsible_user_id: 8,
            responsible_user_name: 'Compras',
            start_date: '2026-08-01',
            due_date: '2026-08-04',
            completed_at: null,
            depends_on_task_ids: ['equipment-order'],
            checklist: [{ id: 'check-2', title: 'Conferir nota fiscal', completed: false }],
            comments: [],
          },
        ],
      },
    ],
    history: [{ id: 'h-1', title: 'Implantacao iniciada', created_at: '2026-06-01T09:00:00.000Z' }],
    kpis: {
      days_remaining: 20,
      days_delayed: 0,
      completed_tasks: 1,
      total_tasks: 2,
      critical_pending: 0,
      documents_pending: 1,
      trainings_complete_percent: 50,
      progress_percent: 65,
    },
    ...overrides,
  };
}

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.removeItem('orchestra-unit-implementations-v1');
    window.localStorage.removeItem('orchestra-implementation-templates-v1');
    window.sessionStorage.clear();
    window.localStorage.setItem('orchestra_auth_token', 'e2e-token');
  });

  await page.route('**/api/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test', role: 'master' } }),
  }));
  await page.route('**/api/me/company', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }),
  }));
  await page.route('**/api/me/modules/sidebar', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [
      { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
      { module_id: 'units', name: 'Unidades', status: 'active' },
    ] }),
  }));
  await page.route('**/api/me/roles', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 1, name: 'master' }] }),
  }));
  await page.route('**/api/me/permissions', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [
      'tenant.units.view',
      'tenant.units.create',
      'tenant.units.update',
      'tenant.units.configure',
    ] }),
  }));
  await page.route('**/api/me/units', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  }));
}

async function mockUnits(page: Page) {
  await page.route('**/api/metadata/units', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(unitMetadata),
  }));
  await page.route('**/api/company/units/101', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: unit101 }),
  }));
  await page.route('**/api/company/units/999', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: unit999 }),
  }));
}

async function mockTemplates(page: Page) {
  let template = { ...templatePayload };
  await page.route('**/api/tenant/implementations/templates', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [template] }) });
      return;
    }

    await route.fallback();
  });
  await page.route('**/api/tenant/implementations/templates/tpl-franchise-standard', async route => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      template = { ...template, name: String(body.name ?? template.name), description: String(body.description ?? template.description) };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: template }) });
      return;
    }
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: template }) });
  });
}

async function mockImplementationApi(page: Page, options: { emptyUnit?: boolean; emptyArrays?: boolean } = {}) {
  let implementation = implementationPayload(options.emptyArrays ? { phases: [], history: [] } : {});

  await page.route('**/api/tenant/units/101/implementation', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: implementation }),
  }));
  await page.route('**/api/tenant/units/999/implementation', async route => {
    await route.fulfill({ status: options.emptyUnit ? 404 : 200, contentType: 'application/json', body: JSON.stringify({ data: implementation }) });
  });
  await page.route('**/api/tenant/units/999/implementation/start', async route => {
    implementation = implementationPayload({ id: 'impl-999', unit_id: 999, unit_name: 'Unidade Sem Implantacao', progress_percent: 0 });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: implementation }) });
  });
  await page.route('**/api/tenant/implementations', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [implementationPayload()] }),
  }));
  await page.route('**/api/tenant/implementations/impl-101', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: implementation }),
  }));
  await page.route('**/api/tenant/implementations/impl-101/tasks/equipment-delivery/complete', route => {
    implementation = implementationPayload({
      progress_percent: 75,
      phases: (implementation.phases as Array<Record<string, unknown>>).map(phase => ({
        ...phase,
        tasks: (phase.tasks as Array<Record<string, unknown>> | undefined ?? []).map(task => task.id === 'equipment-delivery'
          ? { ...task, status: 'completed', completed_at: '2026-08-04' }
          : task),
      })),
    });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: implementation }) });
  });
  await page.route('**/api/tenant/implementations/impl-101/tasks/equipment-delivery/comments', route => {
    implementation = implementationPayload({
      phases: (implementation.phases as Array<Record<string, unknown>>).map(phase => ({
        ...phase,
        tasks: (phase.tasks as Array<Record<string, unknown>> | undefined ?? []).map(task => task.id === 'equipment-delivery'
          ? { ...task, comments: [{ id: 'comment-1', author: 'Admin Master', body: 'Comentario E2E', created_at: '2026-06-26T10:00:00.000Z' }] }
          : task),
      })),
    });
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { id: 'comment-1' } }) });
  });
  await page.route('**/api/tenant/implementations/impl-101/register-opening', route => {
    implementation = implementationPayload({ status: 'completed', actual_opening_date: '2026-09-08', progress_percent: 100 });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: implementation }) });
  });
}

async function setup(page: Page, options: { emptyUnit?: boolean; emptyArrays?: boolean } = {}) {
  await mockAuth(page);
  await mockUnits(page);
  await mockTemplates(page);
  await mockImplementationApi(page, options);
}

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test('@smoke implantacao navega da unidade para aba e mantem dados funcionando', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await setup(page);

  await page.goto('/units/101');
  await expect(page.getByRole('heading', { name: /Editar Unidade/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dados' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('textbox').first()).toHaveValue('BH Savassi');

  await page.goto('/units/101?tab=implantacao');
  await expect(page.getByTestId('implementation-tab')).toBeVisible();
  await expect(page.getByTestId('implementation-progress')).toContainText('65%');
  await expect(page.getByTestId('implementation-phase-list')).toContainText('Equipamentos');
  await expect(page.getByTestId('implementation-task-list')).toContainText('Confirmar entrega de equipamentos');
  await expect(page.getByText('Marina Costa')).toBeVisible();
  await expect(page.getByText(/Prevista:/)).toBeVisible();

  expect(errors).toEqual([]);
});

test('@smoke implantacao drawer conclui tarefa e adiciona comentario', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await setup(page);

  await page.goto('/units/101?tab=implantacao');
  await page.getByTestId('implementation-task-item').filter({ hasText: 'Confirmar entrega de equipamentos' }).click();
  await expect(page.getByTestId('implementation-task-drawer')).toBeVisible();
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('Validar recebimento dos equipamentos homologados.');
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('Checklist');
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('Comentarios');
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('Compras');
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('04/08/2026');
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('equipment-order');

  await page.getByTestId('implementation-comment-input').fill('Comentario E2E');
  await page.getByTestId('implementation-comment-submit').click();
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('Comentario E2E');

  await page.getByTestId('implementation-task-complete-button').click();
  await expect(page.getByTestId('implementation-progress')).toContainText('75%');
  await expect(page.getByTestId('implementation-task-drawer')).toContainText('Concluida');

  expect(errors).toEqual([]);
});

test('@smoke implantacao cria fluxo para unidade sem implantacao', async ({ page }) => {
  await setup(page, { emptyUnit: true });

  await page.goto('/units/999?tab=implantacao');
  await expect(page.getByTestId('implementation-empty-state')).toBeVisible();
  await expect(page.getByTestId('implementation-start-button')).toBeVisible();
  await page.getByTestId('implementation-start-button').click();
  await expect(page.getByTestId('implementation-tab')).toBeVisible();
  await expect(page.getByText('Unidade Sem Implantacao')).toBeVisible();
});

test('@smoke implantacoes dashboard alterna visualizacoes', async ({ page }) => {
  await setup(page);

  await page.goto('/implementations');
  await expect(page.getByTestId('implementations-dashboard')).toBeVisible();
  await expect(page.getByText('Implantacoes ativas')).toBeVisible();
  await expect(page.getByRole('link', { name: 'BH Savassi', exact: true })).toBeVisible();
  await page.getByTestId('implementations-view-kanban').click();
  await expect(page.getByRole('heading', { name: 'Em andamento' })).toBeVisible();
  await page.getByTestId('implementations-view-timeline').click();
  await expect(page.getByRole('link', { name: /BH Savassi.*07\/09\/2026/ })).toBeVisible();
  await page.getByTestId('implementations-view-table').click();
  await expect(page.getByText('Equipamentos')).toBeVisible();
});

test('@smoke templates lista fases tarefas e salva alteracao', async ({ page }) => {
  await setup(page);

  await page.goto('/implementations/templates');
  await expect(page.getByTestId('implementation-templates-page')).toBeVisible();
  await expect(page.getByTestId('implementation-template-list')).toContainText('Implantacao padrao de franquia');
  await expect(page.getByTestId('implementation-template-phase').first()).toContainText('Contrato');
  await expect(page.getByTestId('implementation-template-task').first().locator('input').first()).toHaveValue('Assinar contrato de franquia');
  await page.getByLabel('Nome').fill('Template E2E');
  await page.getByRole('button', { name: /Salvar template/i }).click();
  await expect(page.getByText('Template salvo.')).toBeVisible();
});

test('implantacao renderiza arrays vazios sem quebrar', async ({ page }) => {
  await setup(page, { emptyArrays: true });

  await page.goto('/units/101?tab=implantacao');
  await expect(page.getByTestId('implementation-tab')).toBeVisible();
  await expect(page.getByText('Nenhuma tarefa nesta fase.')).toBeVisible();
});

test('implantacao 403 nao cai para mock', async ({ page }) => {
  await mockAuth(page);
  await mockUnits(page);
  await mockTemplates(page);
  await page.route('**/api/tenant/units/101/implementation', route => route.fulfill({
    status: 403,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Sem permissao para implantacao' }),
  }));

  await page.goto('/units/101?tab=implantacao');
  await expect(page.getByText('Sem permissao para implantacao')).toBeVisible();
  await expect(page.getByText('BH Savassi')).not.toBeVisible();
});

test('implantacao 422 nao cai para mock', async ({ page }) => {
  await mockAuth(page);
  await mockUnits(page);
  await mockTemplates(page);
  await page.route('**/api/tenant/units/101/implementation', route => route.fulfill({
    status: 422,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Template invalido' }),
  }));

  await page.goto('/units/101?tab=implantacao');
  await expect(page.getByText('Template invalido')).toBeVisible();
  await expect(page.getByText('65%')).not.toBeVisible();
});

test('implantacao network error em dev cai para fallback mock', async ({ page }) => {
  await mockAuth(page);
  await mockUnits(page);
  await mockTemplates(page);
  await page.route('**/api/tenant/units/101/implementation', route => route.abort('failed'));

  await page.goto('/units/101?tab=implantacao');
  await expect(page.getByTestId('implementation-tab')).toBeVisible();
  await expect(page.getByText('BH Savassi')).toBeVisible();
});

test('implantacao 404 mostra estado vazio e 500 mostra erro com retry', async ({ page }) => {
  await mockAuth(page);
  await mockUnits(page);
  await mockTemplates(page);
  await page.route('**/api/tenant/units/999/implementation', route => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Nao encontrada' }),
  }));
  await page.goto('/units/999?tab=implantacao');
  await expect(page.getByTestId('implementation-empty-state')).toBeVisible();

  await page.route('**/api/tenant/units/101/implementation', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Falha interna' }),
  }));
  await page.goto('/units/101?tab=implantacao');
  await expect(page.getByText('Falha interna')).toBeVisible();
  await expect(page.getByRole('button', { name: /Tentar novamente/i })).toBeVisible();
});
