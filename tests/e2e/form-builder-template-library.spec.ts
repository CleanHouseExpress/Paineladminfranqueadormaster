import { test, expect } from './support/fixtures';

test('@smoke biblioteca oficial importa template para o Form Builder', async ({ masterPage }) => {
  await masterPage.goto('/settings/form-builder');

  await expect(masterPage.getByRole('heading', { name: 'Biblioteca de templates' })).toBeVisible();
  await expect(masterPage.getByText('Controle de Temperatura dos Equipamentos').first()).toBeVisible();

  const row = masterPage.getByRole('row').filter({ hasText: 'Controle de Temperatura dos Equipamentos' }).first();
  await row.getByRole('button', { name: /usar template/i }).click();

  await expect(masterPage).toHaveURL(/\/settings\/form-builder\/\d+$/);
  await expect(masterPage.getByLabel('Nome')).toHaveValue('Controle de Temperatura dos Equipamentos');
  await expect(masterPage.getByRole('button', { name: /publicar/i })).toBeVisible();

  await masterPage.getByRole('button', { name: /publicar/i }).click();
  await expect(masterPage.getByText('published').first()).toBeVisible();
});
