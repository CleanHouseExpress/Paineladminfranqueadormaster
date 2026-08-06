import { expect, test, type Page, type Route } from '@playwright/test';

const unitMetadata = {
  data: {
    entity_key: 'units',
    entity: 'units',
    singular_label: 'Unidade',
    plural_label: 'Unidades',
    fields: [
      { key: 'name', label: 'Nome', type: 'text', field_type: 'text', required: true, visible: true, editable: true, order: 10, section: 'general' },
      { key: 'code', label: 'Codigo', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 20, section: 'general' },
      { key: 'document', label: 'CNPJ', type: 'document', field_type: 'document', required: false, visible: true, editable: true, order: 30, section: 'general' },
      { key: 'phone', label: 'Telefone', type: 'phone', field_type: 'phone', required: false, visible: true, editable: true, order: 40, section: 'general' },
      { key: 'email', label: 'E-mail', type: 'email', field_type: 'email', required: false, visible: true, editable: true, order: 50, section: 'general' },
      { key: 'status', label: 'Status', type: 'select', field_type: 'select', required: true, visible: true, editable: true, order: 60, section: 'operation', options: [
        { label: 'Ativa', value: 'active' },
        { label: 'Em abertura', value: 'opening' },
      ] },
      { key: 'responsible_name', label: 'Responsavel', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 70, section: 'responsible' },
      { key: 'responsible_email', label: 'E-mail do responsavel', type: 'email', field_type: 'email', required: false, visible: true, editable: true, order: 80, section: 'responsible' },
      { key: 'responsible_phone', label: 'Telefone do responsavel', type: 'phone', field_type: 'phone', required: false, visible: true, editable: true, order: 90, section: 'responsible' },
      { key: 'opening_date', label: 'Data de abertura', type: 'date', field_type: 'date', required: false, visible: true, editable: true, order: 100, section: 'operation' },
      { key: 'address_zipcode', label: 'CEP', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 110, section: 'address' },
      { key: 'address_street', label: 'Rua', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 120, section: 'address' },
      { key: 'address_number', label: 'Numero', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 130, section: 'address' },
      { key: 'address_complement', label: 'Complemento', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 140, section: 'address' },
      { key: 'address_district', label: 'Bairro', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 150, section: 'address' },
      { key: 'address_city', label: 'Cidade', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 160, section: 'address' },
      { key: 'address_state', label: 'Estado', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 170, section: 'address' },
      { key: 'notes', label: 'Observacoes', type: 'textarea', field_type: 'textarea', required: false, visible: true, editable: true, order: 180, section: 'notes' },
      { key: 'access_notes', label: 'Orientacoes de acesso', type: 'textarea', field_type: 'textarea', required: false, visible: true, editable: true, order: 190, section: 'custom_ops' },
      { key: 'internal_code', label: 'Campo interno', type: 'text', field_type: 'text', required: false, visible: false, editable: true, order: 200, section: 'general' },
    ],
    table_columns: [],
    table_schema: [],
  },
};

const existingUnit = {
  id: 101,
  name: 'Unidade Centro',
  code: 'CTR',
  document: '11222333000181',
  phone: '11999990000',
  email: 'centro@example.com',
  status: 'active',
  responsible_name: 'Marina Costa',
  address_zipcode: '01310-200',
  address_street: 'Rua manual',
  address_number: '45',
  address_complement: 'Sala 2',
  address_district: 'Bairro manual',
  address_city: 'Cidade manual',
  address_state: 'MG',
};

const permissions = [
  { slug: 'tenant.units.view' },
  { slug: 'tenant.units.create' },
  { slug: 'tenant.units.update' },
];

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockSession(page: Page, allowed = true) {
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'e2e-token');
  });
  await page.route('**/api/me', route => json(route, {
    user: { id: 1, name: 'Admin Master', email: 'admin@example.com', role: 'company_admin', company_id: 1 },
    context: { companyId: 1 },
  }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules', route => json(route, { data: [{ id: 'units', slug: 'units', status: 'active' }] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ slug: 'company_admin', name: 'Company Admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: allowed ? permissions : [{ slug: 'tenant.units.view' }] }));
  await page.route('**/api/me/onboarding', route => json(route, { required: false, status: 'completed', current_step: 'completed', onboarding_required: false }));
  await page.route('**/api/me/onboarding/company-profile', route => json(route, { data: {} }));
  await page.route('**/api/me/onboarding/branding', route => json(route, { data: {} }));
  await page.route('**/api/me/settings', route => json(route, { data: {} }));
  await page.route('**/api/me/modules/sidebar', route => json(route, []));
  await page.route('**/api/me/units', route => json(route, []));
  await page.route('**/api/metadata/units', route => json(route, unitMetadata));
  await page.route('**/api/tenant/implementations/templates', route => json(route, { data: [] }));
  await page.route('**/api/company/users?per_page=200', route => json(route, {
    data: [{ id: 10, name: 'Marina Costa', email: 'marina@example.com', phone: '11988887777' }],
    meta: { total: 1 },
  }));
  await page.route('**/api/company/roles', route => json(route, [{ id: 1, slug: 'franchise_admin', name: 'Administrador da Franquia' }]));
}

async function openNewUnit(page: Page) {
  await mockSession(page);
  await page.goto('/units/new');
  await expect(page.getByRole('heading', { name: /Nova Unidade/i })).toBeVisible();
}

function unitNameInput(page: Page) {
  return page.locator('form input').first();
}

test('estrutura visual, metadata e acessibilidade basica do formulario', async ({ page }) => {
  await openNewUnit(page);

  await expect(page.getByRole('heading', { name: 'Nova Unidade' })).toBeVisible();
  await expect(page.getByText('Cadastre os dados de identificacao, endereco e responsaveis pela unidade.')).toBeVisible();

  await expect(page.getByTestId('unit-section-identification').getByRole('heading', { name: 'Identificacao da unidade' })).toBeVisible();
  await expect(page.getByTestId('unit-section-contact').getByRole('heading', { name: 'Contato da unidade' })).toBeVisible();
  await expect(page.getByTestId('unit-section-address').getByRole('heading', { name: 'Endereco' })).toBeVisible();
  await expect(page.getByTestId('unit-section-additional').getByRole('heading', { name: 'Informacoes adicionais' })).toBeVisible();
  await expect(page.getByTestId('unit-section-custom').getByRole('heading', { name: 'Campos personalizados' })).toBeVisible();
  await expect(page.getByTestId('unit-section-admin').getByRole('heading', { name: 'Admin da unidade' })).toBeVisible();

  await expect(page.getByText('general', { exact: true })).toHaveCount(0);
  await expect(page.getByText('address', { exact: true })).toHaveCount(0);
  await expect(page.getByText('responsible', { exact: true })).toHaveCount(0);

  const identification = page.getByTestId('unit-section-identification');
  await expect(identification.getByLabel(/Nome da unidade/)).toBeVisible();
  await expect(identification.getByLabel('Codigo')).toBeVisible();
  await expect(identification.getByLabel('CNPJ')).toBeVisible();
  await expect(identification.getByLabel(/Nome da unidade/)).toHaveAttribute('required', '');
  await expect(identification.getByText('*')).toBeVisible();

  const address = page.getByTestId('unit-section-address');
  await expect(address.getByLabel('CEP')).toBeVisible();
  await expect(address.getByLabel('Logradouro')).toBeVisible();
  await expect(address.getByLabel('Numero')).toBeVisible();
  await expect(address.getByLabel('Complemento')).toBeVisible();
  await expect(address.getByLabel('Bairro')).toBeVisible();
  await expect(address.getByLabel('Cidade')).toBeVisible();
  await expect(address.getByLabel('Estado')).toBeVisible();

  await expect(page.getByLabel(/Nome da unidade/)).toHaveCount(1);
  await expect(page.getByLabel('CEP')).toHaveCount(1);
  await expect(page.getByLabel('Orientacoes de acesso')).toBeVisible();
  await expect(page.getByText('Campo interno')).toHaveCount(0);

  await mockSession(page);
  await page.route('**/api/company/units/101', route => json(route, { data: existingUnit }));
  await page.goto('/units/101');
  await expect(page.getByRole('heading', { name: 'Editar Unidade' })).toBeVisible();
  await expect(page.getByText('Atualize os dados cadastrais e operacionais da unidade.')).toBeVisible();
  await expect(page.getByTestId('unit-section-responsible').getByRole('heading', { name: 'Responsavel pela unidade' })).toBeVisible();
  await expect(page.getByLabel('Status')).toBeVisible();
  await expect(page.getByLabel('Status')).toHaveAttribute('required', '');
});

test('responsividade mobile mantem campos, feedback e acoes utilizaveis', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openNewUnit(page);
  await page.route('**/api/company/address/cep/*', async route => {
    await new Promise(resolve => setTimeout(resolve, 450));
    await json(route, {
      data: {
        cep: '01310200',
        street: 'Avenida Paulista',
        neighborhood: 'Bela Vista',
        city: 'Sao Paulo',
        state: 'SP',
        city_code: null,
      },
    });
  });

  await expect(page.getByTestId('unit-form')).toBeVisible();
  await expect(page.getByLabel(/Nome da unidade/)).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Orientacoes de acesso')).toBeVisible();
  await expect(page.locator('#implementation_initial_status')).toBeVisible();

  await page.getByLabel('CEP').fill('01310200');
  await expect(page.getByTestId('unit-cep-loading')).toBeVisible();

  const boxes = await Promise.all([
    page.getByTestId('unit-address_zipcode').boundingBox(),
    page.getByTestId('unit-cep-loading').boundingBox(),
  ]);
  expect(boxes[0]).not.toBeNull();
  expect(boxes[1]).not.toBeNull();
  expect(boxes[1]!.x).toBeGreaterThan(boxes[0]!.x + boxes[0]!.width - 48);

  await expect(page.getByTestId('unit-address_street')).toHaveValue('Avenida Paulista');
  await expect(page.getByRole('button', { name: 'Salvar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cancelar' })).toBeVisible();
  const saveBox = await page.getByRole('button', { name: 'Salvar' }).boundingBox();
  expect(saveBox?.width).toBeGreaterThan(300);

  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalScroll).toBe(false);
});

test('erro de salvamento devolve disponibilidade da acao principal', async ({ page }) => {
  await openNewUnit(page);
  let createCount = 0;
  await page.route('**/api/company/units', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    createCount += 1;
    await new Promise(resolve => setTimeout(resolve, 250));
    await json(route, {}, 500);
  });

  await page.getByLabel(/Nome da unidade/).fill('Unidade com erro');
  await page.locator('#unit_responsible_user_id').selectOption('10');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('button', { name: /Salvando/i })).toBeDisabled();
  await expect(page.getByText(/Nao foi possivel salvar unidade/i)).toBeVisible();
  await expect(page.getByTestId('unit-save-button')).toBeEnabled();
  expect(createCount).toBe(1);
});

test('mascara, consulta, preenchimento parcial, foco e payload normalizado na criacao', async ({ page }) => {
  await openNewUnit(page);
  let lookupCount = 0;
  let createPayload: Record<string, unknown> | null = null;
  await page.route('**/api/company/address/cep/*', async route => {
    lookupCount += 1;
    await new Promise(resolve => setTimeout(resolve, 450));
    await json(route, {
      data: {
        cep: '01310200',
        street: 'Avenida Paulista',
        neighborhood: 'Bela Vista',
        city: 'Sao Paulo',
        state: 'SP',
        city_code: '3550308',
      },
    });
  });
  await page.route('**/api/company/units', async route => {
    if (route.request().method() === 'GET') return json(route, { data: [], meta: { total: 0 } });
    if (route.request().method() !== 'POST') return route.continue();
    createPayload = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 250));
    await json(route, { data: { id: 333, ...(createPayload ?? {}) } }, 201);
  });
  await page.route('**/api/company/units?*', route => json(route, { data: [], meta: { total: 0 } }));

  const cep = page.getByTestId('unit-address_zipcode');
  await cep.fill('01310abc200999');
  await expect(cep).toHaveValue('01310-200');
  await expect(page.getByTestId('unit-cep-loading')).toBeVisible();
  await expect(page.getByTestId('unit-address_street')).toHaveValue('Avenida Paulista');
  await expect(page.getByTestId('unit-address_district')).toHaveValue('Bela Vista');
  await expect(page.getByTestId('unit-address_city')).toHaveValue('Sao Paulo');
  await expect(page.getByTestId('unit-address_state')).toHaveValue('SP');
  await expect(page.getByTestId('unit-address_number')).toHaveValue('');
  await expect(page.getByTestId('unit-address_complement')).toHaveValue('');
  await expect(page.getByTestId('unit-address_number')).toBeFocused();

  await page.getByTestId('unit-address_street').fill('Avenida editada');
  await page.getByTestId('unit-address_number').fill('1000');
  await page.getByTestId('unit-address_complement').fill('Conjunto 12');
  await cep.fill('01310200');
  expect(lookupCount).toBe(1);
  await unitNameInput(page).fill('Unidade Paulista');
  await page.locator('#unit_responsible_user_id').selectOption('10');
  const save = page.getByTestId('unit-save-button');
  await page.locator('form').evaluate(form => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(save).toBeDisabled();
  await expect(page.locator('svg.animate-spin').first()).toBeVisible();
  await expect(page).toHaveURL(/\/units$/);

  expect(lookupCount).toBe(1);
  expect(createPayload).toMatchObject({
    name: 'Unidade Paulista',
    address_zipcode: '01310200',
    address_street: 'Avenida editada',
    address_number: '1000',
    address_complement: 'Conjunto 12',
    address_district: 'Bela Vista',
    address_city: 'Sao Paulo',
    address_state: 'SP',
  });
  expect(createPayload).not.toHaveProperty('city_code');
});

test('cep incompleto nao consulta, mostra erro no blur e bloqueia salvamento', async ({ page }) => {
  await openNewUnit(page);
  let lookupCount = 0;
  let createCount = 0;
  await page.route('**/api/company/address/cep/*', async route => {
    lookupCount += 1;
    await json(route, { data: { cep: '01310200', street: null, neighborhood: null, city: null, state: null, city_code: null } });
  });
  await page.route('**/api/company/units', async route => {
    if (route.request().method() === 'POST') createCount += 1;
    await json(route, { data: {} }, 201);
  });

  await page.getByTestId('unit-address_zipcode').fill('01310');
  await page.getByTestId('unit-address_zipcode').blur();
  await expect(page.getByText('Informe um CEP valido com oito digitos.')).toBeVisible();
  await unitNameInput(page).fill('Unidade Manual');
  await page.locator('#unit_responsible_user_id').selectOption('10');
  await page.getByRole('button', { name: /Salvar/i }).click();

  expect(lookupCount).toBe(0);
  expect(createCount).toBe(0);
  await expect(page.getByText('Informe um CEP valido com oito digitos.')).toBeVisible();
});

test('erros de consulta mantem preenchimento manual e nao focam numero', async ({ page }) => {
  await openNewUnit(page);
  await page.route('**/api/company/address/cep/99999999', route => json(route, { message: 'provider stack trace secret' }, 404));
  await page.route('**/api/company/address/cep/88888888', route => json(route, { message: 'provider stack trace secret' }, 502));
  await page.route('**/api/company/address/cep/77777777', route => json(route, { message: 'provider stack trace secret' }, 504));

  await page.getByTestId('unit-address_street').fill('Rua manual');
  await page.getByTestId('unit-address_zipcode').fill('99999999');
  await expect(page.getByText(/CEP nao localizado/)).toBeVisible();
  await expect(page.getByTestId('unit-address_street')).toHaveValue('Rua manual');
  await expect(page.getByTestId('unit-address_number')).not.toBeFocused();

  await page.getByTestId('unit-address_zipcode').fill('88888888');
  await expect(page.getByText(/Nao foi possivel consultar o endereco/)).toBeVisible();
  await expect(page.getByText(/stack trace|secret/i)).toHaveCount(0);

  await page.getByTestId('unit-address_zipcode').fill('77777777');
  await expect(page.getByText(/demorou mais que o esperado/)).toBeVisible();
});

test('resposta obsoleta e cep apagado nao sobrescrevem o endereco mais recente', async ({ page }) => {
  await openNewUnit(page);
  let resolveSlowCepRequested: () => void = () => undefined;
  let resolveSlowCepResponded: () => void = () => undefined;
  let resolveClearedCepRequested: () => void = () => undefined;
  let resolveClearedCepResponded: () => void = () => undefined;
  const slowCepRequested = new Promise<void>(resolve => { resolveSlowCepRequested = resolve; });
  const slowCepResponded = new Promise<void>(resolve => { resolveSlowCepResponded = resolve; });
  const clearedCepRequested = new Promise<void>(resolve => { resolveClearedCepRequested = resolve; });
  const clearedCepResponded = new Promise<void>(resolve => { resolveClearedCepResponded = resolve; });
  await page.route('**/api/company/address/cep/11111111', async route => {
    resolveSlowCepRequested();
    await new Promise(resolve => setTimeout(resolve, 650));
    await json(route, { data: { cep: '11111111', street: 'Rua lenta', neighborhood: 'Bairro lento', city: 'Cidade lenta', state: 'RJ', city_code: null } });
    resolveSlowCepResponded();
  });
  await page.route('**/api/company/address/cep/22222222', async route => {
    await json(route, { data: { cep: '22222222', street: 'Rua rapida', neighborhood: 'Bairro rapido', city: 'Cidade rapida', state: 'SP', city_code: null } });
  });
  await page.route('**/api/company/address/cep/33333333', async route => {
    resolveClearedCepRequested();
    await new Promise(resolve => setTimeout(resolve, 500));
    await json(route, { data: { cep: '33333333', street: 'Rua apagada', neighborhood: 'Bairro apagado', city: 'Cidade apagada', state: 'MG', city_code: null } });
    resolveClearedCepResponded();
  });

  await page.getByTestId('unit-address_zipcode').fill('11111111');
  await slowCepRequested;
  await page.getByTestId('unit-address_zipcode').fill('22222222');
  await expect(page.getByTestId('unit-address_street')).toHaveValue('Rua rapida');
  await slowCepResponded;
  await expect(page.getByTestId('unit-address_street')).toHaveValue('Rua rapida');

  await page.getByTestId('unit-address_zipcode').fill('33333333');
  await clearedCepRequested;
  await page.getByTestId('unit-address_zipcode').fill('');
  await clearedCepResponded;
  await expect(page.getByTestId('unit-address_street')).toHaveValue('Rua rapida');
});

test('edicao mascara cep existente, nao consulta ao carregar, consulta ao alterar e envia put normalizado uma vez', async ({ page }) => {
  await mockSession(page);
  let lookupCount = 0;
  let updateCount = 0;
  let updatePayload: Record<string, unknown> | null = null;
  await page.route('**/api/company/units/101', async route => {
    if (route.request().method() === 'GET') return json(route, { data: existingUnit });
    if (route.request().method() === 'PUT') {
      updateCount += 1;
      updatePayload = route.request().postDataJSON();
      await new Promise(resolve => setTimeout(resolve, 250));
      return json(route, { data: { ...existingUnit, ...(updatePayload ?? {}) } });
    }
    return route.continue();
  });
  await page.route('**/api/company/units?*', route => json(route, { data: [], meta: { total: 0 } }));
  await page.route('**/api/company/address/cep/*', async route => {
    lookupCount += 1;
    await json(route, { data: { cep: '30130010', street: null, neighborhood: null, city: 'Belo Horizonte', state: 'MG', city_code: '3106200' } });
  });

  await page.goto('/units/101');
  await expect(page.getByRole('heading', { name: /Editar Unidade/i })).toBeVisible();
  await expect(page.getByTestId('unit-address_zipcode')).toHaveValue('01310-200');
  expect(lookupCount).toBe(0);

  await page.getByTestId('unit-address_street').fill('Rua preservada');
  await page.getByTestId('unit-address_zipcode').fill('30130-010');
  await expect(page.getByTestId('unit-address_city')).toHaveValue('Belo Horizonte');
  await expect(page.getByTestId('unit-address_street')).toHaveValue('Rua preservada');
  expect(lookupCount).toBe(1);

  const save = page.getByTestId('unit-save-button');
  await page.locator('form').evaluate(form => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(save).toBeDisabled();
  await expect(page.locator('svg.animate-spin').first()).toBeVisible();
  await expect(page).toHaveURL(/\/units$/);

  expect(updateCount).toBe(1);
  expect(updatePayload).toMatchObject({
    name: 'Unidade Centro',
    code: 'CTR',
    address_zipcode: '30130010',
    address_street: 'Rua preservada',
    address_city: 'Belo Horizonte',
    address_state: 'MG',
  });
});

test('usuario sem permissao continua bloqueado pelos mecanismos existentes', async ({ page }) => {
  await mockSession(page, false);
  await page.goto('/units/new');
  await expect(page.getByRole('heading', { name: /Sem permiss/i })).toBeVisible();
});
