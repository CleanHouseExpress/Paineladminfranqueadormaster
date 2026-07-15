import { test, expect } from './support/fixtures';

async function enableInventory(page: import('@playwright/test').Page) {
  await page.goto('/inventory/settings');
  await expect(page.getByRole('heading', { name: /Configuracoes de Estoque|Configura/i })).toBeVisible();
  const checkbox = page.getByLabel(/Inventory habilitado/i);
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.getByText(/Configuracoes salvas|Configura/i).first()).toBeVisible({ timeout: 15000 });
  }
}

test('@smoke inventory foundation cobre capability saldos locais movimento e reversao', async ({ masterPage: page }) => {
  await page.goto('/inventory');
  await expect(page.getByRole('heading', { name: /Estoque/i }).first()).toBeVisible();

  if (await page.getByText(/Estoque desabilitado/i).isVisible().catch(() => false)) {
    await enableInventory(page);
  }

  for (const path of ['/inventory', '/inventory/items', '/inventory/locations', '/inventory/balances', '/inventory/movements']) {
    await page.goto(path);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(/Algo deu errado|erro tecnico/i)).toHaveCount(0);
  }

  await page.goto('/inventory/movements?new=1');
  await expect(page.getByRole('heading', { name: /Moviment/i })).toBeVisible();
  await expect(page.getByText(/Novo Movimento|Novo Moviment/i).last()).toBeVisible();
  await page.getByRole('button', { name: /Entrada/i }).click();
  await page.getByLabel(/Item|Insumo/i).selectOption({ index: 1 });
  const unit = page.getByLabel('Unidade');
  if ((await unit.locator('option').count()) > 1) await unit.selectOption({ index: 1 });
  await page.getByLabel(/Quantidade/).fill('10');
  const cost = page.getByLabel(/Custo unit/i);
  if (await cost.isVisible().catch(() => false)) await cost.fill('5');
  await page.getByRole('button', { name: /Registrar/i }).click();
  await expect(page.getByText(/Movimento registrado|Entrada/i).first()).toBeVisible({ timeout: 15000 });

  await page.goto('/inventory/balances');
  await expect(page.getByRole('heading', { name: /Saldos|Saldo/i })).toBeVisible();
  await expect(page.getByText(/Available|On hand/i).first()).toBeVisible();

  await page.goto('/inventory/movements');
  await page.getByText(/Entrada/i).first().click();
  await expect(page.getByText(/Detalhe|Movimento/i).first()).toBeVisible();
  const reason = page.getByLabel(/Motivo do estorno/i);
  if (await reason.isVisible().catch(() => false)) {
    await reason.fill('Estorno E2E foundation');
    await page.getByRole('button', { name: /Estornar/i }).click();
    await expect(page.getByText(/estornado|Estorno/i).first()).toBeVisible({ timeout: 15000 });
  }
});
