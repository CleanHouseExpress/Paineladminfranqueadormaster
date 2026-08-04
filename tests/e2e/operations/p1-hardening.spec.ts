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

test('@release @inventory transferencias antigas ficam indisponiveis', async ({ masterPage: page }) => {
  await openHealthy(page, '/inventory/settings', { allowBlockedState: true });
  await expect(page.locator('body')).not.toContainText(/Transfer.ncias/i);

  await openHealthy(page, '/inventory/transfers', { allowBlockedState: true });
  await expect(page.getByTestId('inventory-transfers-unavailable')).toBeVisible();
  await expect(page.locator('body')).toContainText(/temporariamente indispon/i);
});
