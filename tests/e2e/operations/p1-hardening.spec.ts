import { test, expect } from '../support/fixtures';
import { openHealthy } from '../support/page-health';

test('@release @modules marketplace nao exibe ativacao ou valores sem backend', async ({ masterPage: page }) => {
  await openHealthy(page, '/modules');

  await expect(page.getByTestId('modules-marketplace')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/R\$\s*\d|Sob consulta|Ativar m|Solicitar novo|Solicitar acesso|Notificar/i);
  await expect(page.getByTestId('module-unavailable-whatsapp')).toBeVisible();
  await expect(page.getByTestId('module-unavailable-reports')).toBeVisible();
});

test('@release @modules rotas diretas de solicitacao ficam bloqueadas sem simular envio', async ({ masterPage: page }) => {
  await openHealthy(page, '/modules/whatsapp/request', { allowBlockedState: true });
  await expect(page.getByTestId('module-request-unavailable')).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Solicitacao enviada|Acompanhar solicitacao|Enviar solicitacao/i);

  await openHealthy(page, '/modules/request-new', { allowBlockedState: true });
  await expect(page.getByTestId('new-module-request-unavailable')).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Ideia recebida|Enviar sugestao|Nova sugestao/i);
});

test('@release @inventory transferencias internas ficam disponiveis para operacao', async ({ masterPage: page }) => {
  await page.route('**/api/company/inventory/settings', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        inventory_enabled: true,
        inventory_mode: 'advanced',
        enable_transfers: true,
        capabilities: { enabled: true, transfers: true },
      },
    }),
  }));
  await page.route('**/api/company/inventory/transfers**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: [{
        id: 196,
        origin_unit_id: 101,
        origin_unit_name: 'CD Central',
        destination_unit_id: 202,
        destination_unit_name: 'Unidade Centro',
        status: 'in_transit',
        requested_at: '2026-10-06T09:00:00.000Z',
        items: [{ id: 1, inventory_item_id: 10, item_name: 'Cafe em graos', quantity: 12, unit_cost: 20 }],
      }],
      meta: { total: 1 },
    }),
  }));

  await page.goto('/inventory/transfers');

  await expect(page.getByTestId('inventory-transfers-unavailable')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Transfer.ncias/i })).toBeVisible();
  await expect(page.getByText('CD Central')).toBeVisible();
  await expect(page.getByText('Unidade Centro')).toBeVisible();
  await expect(page.getByText(/Em tr.nsito/i)).toBeVisible();
});
