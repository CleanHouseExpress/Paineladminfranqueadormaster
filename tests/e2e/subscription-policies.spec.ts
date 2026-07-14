import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from './support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => window.localStorage.setItem('orchestra_auth_token', 'policy-e2e-token'));
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
    { module_id: 'subscription-policies', name: 'Politicas de Assinaturas', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.subscription-policies.view',
    'tenant.subscription-policies.create',
    'tenant.subscription-policies.update',
    'tenant.subscription-policies.publish',
    'tenant.subscription-policies.archive',
    'tenant.subscription-policies.simulate',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

async function mockPolicyApi(page: Page) {
  const policy = {
    id: 1,
    policy_type: 'subscription',
    scope_type: 'company',
    scope_id: null,
    version: 1,
    status: 'draft',
    name: 'Politica SaaS',
    settings: { upgrade: { effective_timing: 'immediate', billing_behavior: 'next_cycle_only' } },
    governance: { 'upgrade.billing_behavior': 'locked' },
    effective_from: '2026-07-01',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
  };

  await page.route('**/api/company/subscription-policies**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.endsWith('/presets')) {
      return json(route, { data: [
        {
          slug: 'saas',
          name: 'SaaS',
          recommended_for: 'Softwares e plataformas digitais.',
          description: 'Mudancas controladas por ciclo.',
          settings: {
            subscription: { upgrade: { effective_timing: 'immediate', billing_behavior: 'next_cycle_only' } },
            billing: { billing: { due_day: 10 } },
            metrics: { primary_mrr_metric: 'committed_mrr' },
          },
        },
      ] });
    }

    if (pathname.endsWith('/effective')) {
      return json(route, { data: {
        policy_type: 'subscription',
        policy_version_id: 1,
        settings: policy.settings,
        sources: [{ policy_version_id: 1, scope_type: 'company' }],
        resolved_at: '2026-07-01T10:00:00.000Z',
      } });
    }

    if (pathname.endsWith('/simulate')) {
      return json(route, { data: {
        operation_type: 'upgrade',
        operator_role: 'company_admin',
        effective_date: '2026-07-10',
        access_change: 'Beneficios mudam na confirmacao.',
        financial_behavior: {
          behavior: 'next_cycle_only',
          real_financial_execution: false,
          creates_invoice: false,
          creates_credit: false,
          creates_refund: false,
        },
        estimated_charge: 0,
        estimated_credit: 0,
        next_renewal_at: '2026-08-01',
        mrr_impact: { requested_mrr_delta: 50 },
        requires_approval: false,
        warnings: [],
        unavailable_capabilities: [],
        rules_applied: { no_financial_records_created: true },
      } });
    }

    if (pathname.endsWith('/publish')) return json(route, { data: { ...policy, status: 'published' } });
    if (pathname.endsWith('/validate')) return json(route, { data: { valid: true, errors: [], warnings: [], recommendations: [] } });
    if (request.method() === 'POST') return json(route, { data: policy }, 201);

    return json(route, { data: [policy], meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 } });
  });
}

test('@smoke subscription policies renderiza wizard, presets e simulador', async ({ page }) => {
  await mockAuth(page);
  await mockPolicyApi(page);

  await page.goto('/subscription-policies');

  await expect(page.getByTestId('subscription-policies-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Politicas de Assinaturas' })).toBeVisible();
  await expect(page.getByTestId('policy-version-list')).toContainText('Politica SaaS');
  await page.getByTestId('policy-preset-saas').click();
  await expect(page.getByText('Preset SaaS aplicado ao draft.')).toBeVisible();

  await page.getByRole('button', { name: /Simular/i }).click();
  await page.getByTestId('policy-simulate-button').click();
  await expect(page.getByTestId('policy-simulation-result')).toContainText('Nao');

  await page.getByRole('button', { name: /Publicar/i }).click();
  await page.getByTestId('policy-publish-button').click();
  await expect(page.getByText(/Politica publicada/)).toBeVisible();
});
