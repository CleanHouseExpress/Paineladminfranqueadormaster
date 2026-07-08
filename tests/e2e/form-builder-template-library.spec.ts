import { test, expect } from './support/fixtures';
import { disableOnboarding } from './support/auth';

test('@smoke biblioteca oficial importa template para o Form Builder', async ({ masterPage }) => {
  await masterPage.goto('/settings/form-builder');

  await expect(masterPage.getByRole('heading', { name: 'Biblioteca de templates' })).toBeVisible();
  await masterPage.getByLabel('Buscar template').fill('Temperatura');
  await masterPage.getByLabel('Filtrar categoria da biblioteca').selectOption('qualidade');

  const card = masterPage.getByTestId('template-library-card').filter({ hasText: 'Controle de Temperatura dos Equipamentos' }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('Oficial Orchestra');

  await card.getByRole('button', { name: /ver detalhes/i }).click();
  const details = masterPage.getByTestId('template-library-details');
  await expect(details.getByRole('heading', { name: 'Controle de Temperatura dos Equipamentos' })).toBeVisible();
  await expect(details.getByText('Preview do franqueado')).toBeVisible();
  await expect(details.getByText('Metadata Engine')).toBeVisible();

  await details.getByRole('button', { name: /usar este template/i }).click();
  await expect(masterPage.getByText('Template importado com sucesso.')).toBeVisible();
  await expect(masterPage.getByRole('button', { name: /editar agora/i })).toBeVisible();
  await expect(masterPage.getByRole('button', { name: /^publicar$/i }).first()).toBeVisible();

  await masterPage.getByRole('button', { name: /editar agora/i }).click();
  await expect(masterPage).toHaveURL(/\/settings\/form-builder\/\d+$/);
  await expect(masterPage.getByLabel('Nome')).toHaveValue('Controle de Temperatura dos Equipamentos');
  await expect(masterPage.getByRole('button', { name: /preview/i })).toBeVisible();

  await masterPage.getByRole('button', { name: /publicacao/i }).click();
  await expect(masterPage.getByText('Resumo do template')).toBeVisible();
  await masterPage.getByRole('button', { name: /publicar template/i }).click();
  await expect(masterPage.getByText('published').first()).toBeVisible();
});

test('@smoke Form Builder abre pela Central de Modulos sem solicitar acesso', async ({ masterPage }) => {
  await masterPage.goto('/modules');

  await masterPage.getByRole('textbox', { name: /Buscar módulos/i }).fill('Form Builder');
  const card = masterPage.locator('div').filter({ hasText: 'Form Builder' }).filter({ hasText: 'Configurar' }).first();

  await expect(card).toBeVisible();
  await card.getByRole('button', { name: /configurar/i }).click();

  await expect(masterPage).toHaveURL(/\/settings\/form-builder$/);
  await expect(masterPage.getByRole('heading', { name: 'Form Builder' })).toBeVisible();
});

test('@smoke Form Builder permanece liberado quando API de modulos nao retorna o slug', async ({ page }) => {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'e2e-token');
  });

  await page.route('**/api/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: {
        id: 1,
        name: 'Admin ACME',
        email: 'admin@acme.test',
        company_id: 10,
      },
      context: { companyId: 10 },
    }),
  }));
  await page.route('**/api/me/company', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        id: 10,
        name: 'ACME',
        domain: 'acme',
        plan: 'enterprise',
        whiteLabel: {},
      },
    }),
  }));
  await page.route('**/api/me/modules**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: [
        { id: 'dashboard', slug: 'dashboard', status: 'active' },
        { id: 'settings', slug: 'settings', status: 'active' },
      ],
    }),
  }));
  await page.route('**/api/me/roles', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 1, name: 'Admin Master' }] }),
  }));
  await page.route('**/api/me/permissions', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 'tenant.form-builder.view', name: 'tenant.form-builder.view' }] }),
  }));
  await page.route('**/api/company/checklists/templates**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { total: 0 } }),
  }));
  await page.route('**/api/company/checklists/template-library**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }));

  await page.goto('/settings/form-builder');

  await expect(page.getByRole('heading', { name: 'Form Builder' })).toBeVisible();
  await expect(page.getByText(/solicite o acesso/i)).toHaveCount(0);
});
