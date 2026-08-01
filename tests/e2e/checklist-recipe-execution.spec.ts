import { expect, test } from './support/fixtures';
import type { Page, Route } from '@playwright/test';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const formSchema = [
  { key: 'produced_liters', label: 'Quantidade produzida', type: 'number', field_type: 'number', required: true, visible: true, editable: true, order: 10, section: 'producao' },
];

function initialExecution() {
  return {
  id: 77,
  template_id: 10,
  template_name: 'Producao diaria',
  unit_id: 20,
  unit_name: 'Melten Centro',
  user_id: 1,
  user_name: 'Admin Master',
  status: 'in_progress',
  started_at: '2026-08-01T12:00:00.000Z',
  completed_at: null,
  score: null,
  answers: [],
  schema: { form_schema: formSchema },
  operational_actions: [],
  created_at: '2026-08-01T12:00:00.000Z',
  updated_at: '2026-08-01T12:00:00.000Z',
  };
}

async function mockApi(page: Page, state: { automations: Record<string, unknown>[]; execution: ReturnType<typeof initialExecution> }) {
  await page.route('**/api/company/units/options', route => json(route, [{ value: '20', label: 'Melten Centro' }]));
  await page.route('**/api/company/inventory/locations**', route => json(route, { data: [{ id: 30, unit_id: 20, unit: { id: 20, name: 'Melten Centro' }, name: 'Principal', code: 'MAIN', type: 'main', is_default: true, active: true }], meta: { total: 1 } }));
  await page.route('**/api/company/recipes**', route => json(route, { data: [{
    id: 1,
    code: 'REC-SORV-MORANGO',
    name: 'Sorvete de morango',
    recipe_type: 'physical_product',
    active: true,
    active_version_id: 100,
    active_version: {
      id: 100,
      recipe_id: 1,
      version: 1,
      status: 'published',
      base_quantity: 10,
      base_uom_id: 4,
      base_uom: { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' },
      expected_yield_quantity: 10,
      expected_yield_uom_id: 4,
      expected_yield_uom: { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume' },
      components: [],
      outputs: [],
    },
    metadata: {},
  }], meta: { total: 1 } }));
  await page.route('**/api/company/checklists/templates/10/automations', async route => {
    if (route.request().method() === 'PUT') {
      state.automations = (await route.request().postDataJSON()).automations;
      return json(route, { data: state.automations });
    }
    return json(route, { data: state.automations });
  });
  await page.route('**/api/company/checklists/templates/10', route => json(route, { data: {
    id: 10,
    name: 'Producao diaria',
    category: 'producao',
    active: true,
    status: 'published',
    metadata: { form_schema: formSchema },
  } }));
  await page.route('**/api/company/checklists/executions/77/complete', async route => {
    const payload = await route.request().postDataJSON();
    state.execution = {
      ...state.execution,
      status: 'completed',
      completed_at: '2026-08-01T12:20:00.000Z',
      answers: [{ field_key: 'produced_liters', field_label: 'Quantidade produzida', field_type: 'number', value: { value: payload.answers.produced_liters } }],
      operational_actions: [{
        id: 501,
        action_type: 'execute_recipe',
        status: 'completed',
        recipe_execution_id: 900,
        recipe_execution: { id: 900, number: 'RE-20260801-000900', status: 'confirmed' },
        result: { status: 'completed' },
        executed_at: '2026-08-01T12:20:02.000Z',
      }],
    };
    return json(route, { data: state.execution });
  });
  await page.route('**/api/company/checklists/executions/77', route => json(route, { data: state.execution }));
}

test('@smoke checklists executa ficha tecnica publicada ao concluir formulario', async ({ masterPage: page }) => {
  await mockApi(page, { automations: [], execution: initialExecution() });

  await page.goto('/checklists/templates/10');
  await page.locator('main').getByRole('button', { name: /^Automacoes$/ }).click();
  await page.getByRole('button', { name: /Adicionar automacao/i }).click();
  await page.getByTestId('automation-action-type-0').selectOption('execute_recipe');
  await page.getByTestId('execute-recipe-recipe-0').selectOption('1');
  await page.getByTestId('execute-recipe-quantity-field-0').selectOption('produced_liters');
  await page.getByTestId('execute-recipe-uom-0').selectOption('4');
  await page.getByTestId('execute-recipe-location-source-0').selectOption('fixed_location');
  await page.getByTestId('execute-recipe-fixed-location-0').selectOption('30');
  await Promise.all([
    page.waitForResponse(response => response.request().method() === 'PUT' && response.url().includes('/api/company/checklists/templates/10/automations')),
    page.getByRole('button', { name: /Salvar automacoes/i }).click(),
  ]);

  await page.goto('/checklists/executions/77');
  await page.getByRole('spinbutton').fill('25');
  await page.getByRole('button', { name: /Concluir/i }).click();
  await expect(page.getByTestId('operational-actions-panel')).toContainText('Estoque atualizado pela ficha tecnica');
  await expect(page.getByTestId('operational-actions-panel')).toContainText('RE-20260801-000900');
  await expect(page.getByRole('link', { name: /Detalhe/i })).toHaveAttribute('href', '/recipe-executions/900');
});
