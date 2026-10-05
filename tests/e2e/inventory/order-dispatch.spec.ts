import { expect, test, type Page, type Route } from '@playwright/test';
import { disableOnboarding } from '../support/auth';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAuth(page: Page) {
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
  await page.route('**/api/me/permissions', route => json(route, { data: [
    'tenant.inventory.view',
    'tenant.purchase-orders.view',
    'tenant.order-dispatches.create',
  ] }));
  await page.route('**/api/me/units', route => json(route, []));
}

test('pedido de compra aprovado permite dispatch manual e exibe o resultado no historico', async ({ page }) => {
  await mockAuth(page);

  const order = {
    id: 193,
    number: 'PC-00193',
    status: 'approved',
    supplier: { id: 31, name: 'Fornecedor Central', email: 'pedidos@fornecedor.test' },
    unit: { id: 101, name: 'Unidade Centro' },
    total: 1250,
    allowed_dispatch_channels: ['MANUAL'],
    dispatches: [],
  };
  let dispatchPayload: Record<string, unknown> | undefined;

  await page.route('**/api/v1/purchase-orders/193', route => json(route, { data: order }));
  await page.route('**/api/v1/purchase-orders/193/dispatches', route => {
    dispatchPayload = route.request().postDataJSON() as Record<string, unknown>;
    return json(route, {
      data: {
        id: 901,
        channel: 'MANUAL',
        status: 'sent',
        recipient: 'Fornecedor Central',
        attempts: 1,
        external_reference: null,
        last_error: null,
        created_at: '2026-10-05T22:20:05Z',
      },
    }, 201);
  });

  await page.goto('/inventory/purchase-orders/193');
  await expect(page.getByRole('heading', { name: 'PC-00193' })).toBeVisible();
  await expect(page.getByText('Aprovado', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Enviar pedido/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /Despachar pedido/i })).toBeVisible();
  await expect(dialog.getByLabel(/Canal/i)).toHaveValue('MANUAL');
  await expect(dialog.getByRole('option', { name: /E-mail|WhatsApp|API/i })).toHaveCount(0);
  await dialog.getByRole('button', { name: /Confirmar envio/i }).click();

  expect(dispatchPayload).toMatchObject({ channel: 'MANUAL' });
  const history = page.getByRole('region', { name: /Histórico de envios/i });
  await expect(history).toContainText('Manual');
  await expect(history).toContainText('Enviado');
  await expect(history).toContainText('Fornecedor Central');
  await expect(history).toContainText(/1 tentativa/i);
});
