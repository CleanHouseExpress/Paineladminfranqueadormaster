import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

const permissions = [
  'tenant.documents.view',
  'tenant.documents.upload',
  'tenant.documents.update',
  'tenant.documents.delete',
  'tenant.documents.archive',
  'tenant.documents.download',
  'tenant.documents.configure',
];

const meta = { current_page: 1, last_page: 1, per_page: 100, total: 1 };

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'documents-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
    { module_id: 'documents', name: 'Documentos', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions }));
  await page.route('**/api/me/units', route => json(route, []));
  await page.route('**/api/company/units/options', route => json(route, [{ value: 101, label: 'Unidade Centro' }]));
}

async function mockDocumentsApi(page: Page, options: { empty?: boolean; failList?: boolean } = {}) {
  const categories = [
    { id: 10, name: 'Operacional', description: 'Documentos da operacao', parent_id: null, parent_name: null, active: true, created_at: '2026-07-01T10:00:00.000Z', updated_at: '2026-07-01T10:00:00.000Z' },
  ];
  const documents = options.empty ? [] : [
    { id: 501, title: 'Manual de Operacao', description: 'Documento base da rede', category_id: 10, category_name: 'Operacional', file_name: 'manual-operacao.pdf', file_size: 2048, mime_type: 'application/pdf', extension: 'pdf', visibility: 'internal', unit_id: 101, unit_name: 'Unidade Centro', customer_id: null, customer_name: null, user_id: null, user_name: null, status: 'active', created_at: '2026-07-01T10:00:00.000Z', updated_at: '2026-07-01T10:00:00.000Z' },
  ];
  const created = { id: 777, title: 'Documento Playwright', description: 'Upload E2E', category_id: 10, category_name: 'Operacional', file_name: 'documento-playwright.txt', file_size: 18, mime_type: 'text/plain', extension: 'txt', visibility: 'internal', unit_id: null, unit_name: null, customer_id: null, customer_name: null, user_id: null, user_name: null, status: 'active', created_at: '2026-07-06T10:00:00.000Z', updated_at: '2026-07-06T10:00:00.000Z' };
  const archived = { ...created, status: 'archived', updated_at: '2026-07-06T11:00:00.000Z' };
  let currentCreated = created;

  await page.route('**/api/company/documents/categories/options', route => json(route, categories.map(category => ({ value: category.id, label: category.name }))));
  await page.route('**/api/company/documents/categories**', route => json(route, { data: categories, meta }));
  await page.route('**/api/company/documents/777/download', route => route.fulfill({ status: 200, contentType: 'text/plain', body: 'download ok' }));
  await page.route('**/api/company/documents/501/download', route => route.fulfill({ status: 200, contentType: 'application/pdf', body: 'pdf' }));
  await page.route('**/api/company/documents/777/archive', route => {
    currentCreated = archived;
    return json(route, { data: archived });
  });
  await page.route('**/api/company/documents/777', route => {
    const method = route.request().method();
    if (method === 'GET') return json(route, { data: currentCreated });
    if (method === 'DELETE') return route.fulfill({ status: 204, body: '' });
    if (method === 'PUT') return json(route, { data: currentCreated });
    return route.fallback();
  });
  await page.route('**/api/company/documents/501', route => json(route, { data: documents[0] }));
  await page.route('**/api/company/documents**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.endsWith('/api/company/documents')) return route.fallback();
    if (options.failList && request.method() === 'GET') return json(route, { message: 'Falha simulada' }, 500);
    if (request.method() === 'POST') return json(route, { data: created }, 201);
    return json(route, { data: documents, meta: { ...meta, total: documents.length } });
  });
}

test('@smoke documentos: menu, listagem, upload, arquivamento e download usam API real', async ({ page }) => {
  await mockAuth(page);
  await mockDocumentsApi(page);

  await page.goto('/dashboard');
  await expect(page.getByTestId('main-sidebar')).toBeVisible();
  await page.getByRole('button', { name: /Documentos/i }).click();
  await page.getByRole('link', { name: /Biblioteca/i }).click();
  await expect(page).toHaveURL(/\/documents$/);
  await expect(page.getByTestId('documents-page')).toBeVisible();
  await expect(page.getByText('Manual de Operacao')).toBeVisible();

  await page.getByTestId('documents-new').click();
  await expect(page).toHaveURL(/\/documents\/new$/);
  await page.getByTestId('document-title').fill('Documento Playwright');
  await page.getByTestId('document-file').setInputFiles({ name: 'documento-playwright.txt', mimeType: 'text/plain', buffer: Buffer.from('conteudo playwright') });
  await page.getByTestId('document-submit').click();
  await expect(page).toHaveURL(/\/documents\/777$/);
  await expect(page.getByRole('heading', { name: 'Documento Playwright' })).toBeVisible();

  await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/company/documents/777/download') && response.status() === 200),
    page.getByRole('button', { name: /Download/i }).first().click(),
  ]);

  await page.getByRole('button', { name: /Arquivar/i }).first().click();
  await expect(page.getByText('Arquivado')).toBeVisible();
});

test('documentos: empty state e erro de API sao visiveis', async ({ page }) => {
  await mockAuth(page);
  await mockDocumentsApi(page, { empty: true });
  await page.goto('/documents');
  await expect(page.getByTestId('documents-empty')).toBeVisible();

  const errorPage = await page.context().newPage();
  await mockAuth(errorPage);
  await mockDocumentsApi(errorPage, { failList: true });
  await errorPage.goto('/documents');
  await expect(errorPage.getByRole('alert')).toContainText('Falha simulada');
  await errorPage.close();
});




