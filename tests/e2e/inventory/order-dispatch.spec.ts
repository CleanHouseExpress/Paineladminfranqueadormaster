import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(page: Page, permissions = [
  'tenant.inventory.view',
  'tenant.procurement.purchase_orders.view',
  'tenant.procurement.purchase_orders.dispatch',
  'tenant.procurement.policy.view',
]) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'order-dispatch-token');
    window.sessionStorage.clear();
  });
  await page.route('**/api/me', route => json(route, { data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }));
  await page.route('**/api/me/company', route => json(route, { data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }));
  await page.route('**/api/me/modules**', route => json(route, { data: [
    { module_id: 'inventory', name: 'Estoque & Suprimentos', status: 'active' },
  ] }));
  await page.route('**/api/me/roles', route => json(route, { data: [{ id: 1, name: 'company_admin' }] }));
  await page.route('**/api/me/permissions', route => json(route, { data: permissions }));
  await page.route('**/api/me/units', route => json(route, []));
}

const order = {
  id: 193,
  number: 'PC-00193',
  status: 'approved',
  supplier: { id: 31, name: 'Fornecedor Central', document: '12345678000199' },
  supplier_snapshot: {
    id: 31,
    name: 'Fornecedor Central',
    document: '12345678000199',
    email: 'pedidos@fornecedor.test',
    phone: null,
    contact_name: 'Equipe de compras',
  },
  unit: { id: 101, name: 'Unidade Centro', code: 'CENTRO' },
  total: 1250,
};

const policy = {
  procurement_enabled: true,
  manual_dispatch_enabled: true,
  email_dispatch_enabled: false,
  whatsapp_dispatch_enabled: false,
  api_dispatch_enabled: false,
  effective: { procurement_enabled: true, supplier_management_enabled: true },
};

test('dispatch falho retornado com 201 preserva a chave para retry do mesmo registro', async ({ page }) => {
  await mockAuth(page);

  let dispatchPayload: Record<string, unknown> | undefined;
  const idempotencyKeys: Array<string | undefined> = [];
  let dispatchAttempts = 0;

  await page.route('**/api/company/procurement/purchase-orders/193', route => json(route, { data: order }));
  await page.route('**/api/company/procurement/policy', route => json(route, { data: policy }));
  await page.route('**/api/company/procurement/purchase-orders/193/dispatches', route => {
    if (route.request().method() === 'GET') return json(route, {
      data: [],
      capabilities: {
        manual: true,
        email: false,
        whatsapp: false,
        api: false,
      },
      can_dispatch: true,
    });

    dispatchAttempts += 1;
    dispatchPayload = route.request().postDataJSON() as Record<string, unknown>;
    idempotencyKeys.push(route.request().headers()['idempotency-key']);
    if (dispatchAttempts === 1) {
      return json(route, {
        data: {
          id: 901,
          purchase_order_id: 193,
          channel: 'manual',
          status: 'failed',
          recipient: 'pedidos@fornecedor.test',
          attempts: 1,
          payload_snapshot: { order_number: 'PC-00193' },
          external_reference: null,
          last_error: 'Falha temporária no dispatch.',
          attempted_at: '2026-10-05T22:20:05Z',
          sent_at: null,
          created_at: '2026-10-05T22:20:05Z',
          updated_at: '2026-10-05T22:20:05Z',
        },
      }, 201);
    }
    return json(route, {
      data: {
        id: 901,
        purchase_order_id: 193,
        channel: 'manual',
        status: 'sent',
        recipient: 'pedidos@fornecedor.test',
        attempts: 2,
        payload_snapshot: { order_number: 'PC-00193' },
        external_reference: null,
        last_error: null,
        attempted_at: '2026-10-05T22:20:05Z',
        sent_at: '2026-10-05T22:20:05Z',
        created_at: '2026-10-05T22:20:05Z',
        updated_at: '2026-10-05T22:20:05Z',
      },
    }, 201);
  });

  await page.goto('/inventory/purchase-orders/193');
  await expect(page.getByRole('heading', { name: 'PC-00193' })).toBeVisible();
  await expect(page.getByText('Aprovado', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Enviar pedido/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /Despachar pedido/i })).toBeVisible();
  await expect(dialog.getByLabel(/Canal/i)).toHaveValue('manual');
  await expect(dialog.getByRole('option', { name: /E-mail|WhatsApp|API/i })).toHaveCount(0);
  await dialog.getByRole('button', { name: /Confirmar envio/i }).click();
  await expect(dialog.getByRole('alert')).toContainText('Falha temporária no dispatch.');
  await dialog.getByRole('button', { name: /Confirmar envio/i }).click();

  expect(dispatchAttempts).toBe(2);
  expect(dispatchPayload).toEqual({ channel: 'manual', recipient: 'pedidos@fornecedor.test' });
  expect(idempotencyKeys[0]).toBeTruthy();
  expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  const history = page.getByRole('region', { name: /Histórico de envios/i });
  await expect(history).toContainText('Manual');
  await expect(history).toContainText('Enviado');
  await expect(history).toContainText('pedidos@fornecedor.test');
  await expect(history).toContainText(/2 tentativas/i);
});

test('usuario com apenas permissoes do pedido acessa capacidades e historico de dispatch', async ({ page }) => {
  await mockAuth(page, [
    'tenant.inventory.view',
    'tenant.procurement.purchase_orders.view',
    'tenant.procurement.purchase_orders.dispatch',
  ]);

  let policyRequests = 0;
  await page.route('**/api/company/procurement/purchase-orders/193', route => json(route, { data: order }));
  await page.route('**/api/company/procurement/purchase-orders/193/dispatches', route => json(route, {
    data: [],
    capabilities: {
      manual: true,
      email: false,
      whatsapp: false,
      api: false,
    },
    can_dispatch: true,
  }));
  await page.route('**/api/company/procurement/policy', route => {
    policyRequests += 1;
    return json(route, { message: 'Forbidden' }, 403);
  });

  await page.goto('/inventory/purchase-orders/193');

  await expect(page.getByRole('heading', { name: 'PC-00193' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Enviar pedido/i })).toBeVisible();
  await expect(page.getByRole('region', { name: /Histórico de envios/i })).toContainText('Nenhum envio registrado.');
  expect(policyRequests).toBe(0);
});

test('pedido submitted sem aprovacao obrigatoria usa elegibilidade derivada do backend para permitir dispatch', async ({ page }) => {
  await mockAuth(page);

  await page.route('**/api/company/procurement/purchase-orders/193', route => json(route, {
    data: { ...order, status: 'submitted' },
  }));
  await page.route('**/api/company/procurement/purchase-orders/193/dispatches', route => json(route, {
    data: [],
    capabilities: {
      manual: true,
      email: false,
      whatsapp: false,
      api: false,
    },
    can_dispatch: true,
  }));

  await page.goto('/inventory/purchase-orders/193');

  await expect(page.getByRole('heading', { name: 'PC-00193' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Enviar pedido/i })).toBeVisible();
});

test('historico separado normaliza os valores do backend e exibe a auditoria da tentativa', async ({ page }) => {
  await mockAuth(page);

  await page.route('**/api/company/procurement/purchase-orders/193', route => json(route, { data: order }));
  await page.route('**/api/company/procurement/policy', route => json(route, { data: policy }));
  await page.route('**/api/company/procurement/purchase-orders/193/dispatches', route => json(route, {
    capabilities: {
      manual: true,
      email: false,
      whatsapp: false,
      api: false,
    },
    can_dispatch: true,
    data: [
      {
        id: 902,
        purchase_order_id: 193,
        channel: 'api',
        status: 'failed',
        recipient: 'Fornecedor Central',
        attempts: 2,
        payload_snapshot: { order_number: 'PC-00193' },
        external_reference: 'dispatch-ext-902',
        last_error: 'Fornecedor indisponível',
        attempted_at: '2026-10-05T22:25:05Z',
        sent_at: null,
        created_at: '2026-10-05T22:25:05Z',
        updated_at: '2026-10-05T22:26:05Z',
      },
    ],
  }));

  await page.goto('/inventory/purchase-orders/193');

  const history = page.getByRole('region', { name: /Histórico de envios/i });
  await expect(history).toContainText('API');
  await expect(history).toContainText('Falhou');
  await expect(history).toContainText('2 tentativas');
  await expect(history).toContainText('dispatch-ext-902');
  await expect(history).toContainText('Fornecedor indisponível');
  await expect(history).toContainText('PC-00193');
  await expect(history).toContainText('05/10/2026');
});

test('historico audita separadamente quando o dispatch foi enviado', async ({ page }) => {
  await mockAuth(page);

  await page.route('**/api/company/procurement/purchase-orders/193', route => json(route, { data: order }));
  await page.route('**/api/company/procurement/policy', route => json(route, { data: policy }));
  await page.route('**/api/company/procurement/purchase-orders/193/dispatches', route => json(route, {
    capabilities: {
      manual: true,
      email: false,
      whatsapp: false,
      api: false,
    },
    can_dispatch: true,
    data: [
      {
        id: 903,
        purchase_order_id: 193,
        channel: 'manual',
        status: 'sent',
        recipient: 'pedidos@fornecedor.test',
        attempts: 1,
        payload_snapshot: { order_number: 'PC-00193' },
        external_reference: 'dispatch-ext-903',
        last_error: null,
        attempted_at: '2026-10-05T22:25:05Z',
        sent_at: '2026-10-06T01:15:00Z',
        created_at: '2026-10-05T22:25:05Z',
        updated_at: '2026-10-06T01:15:00Z',
      },
    ],
  }));

  await page.goto('/inventory/purchase-orders/193');

  const history = page.getByRole('region', { name: /Histórico de envios/i });
  await expect(history).toContainText('Tentativa em 05/10/2026');
  await expect(history).toContainText('Enviado em 06/10/2026');
});
