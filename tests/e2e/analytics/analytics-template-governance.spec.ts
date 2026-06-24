import { test, expect } from '@playwright/test';
import { login } from '../support/auth';
import { users } from '../support/test-data';
import { openHealthy } from '../support/page-health';

test('@release @analytics templates analytics governam dashboard corporativo', async ({ page }) => {
  await login(page, users.master);
  for (const path of ['/analytics/templates', '/analytics/catalog', '/analytics']) {
    await openHealthy(page, path, { allowBlockedState: true });
  }
  await expect(page.getByText(/Template|Widget|Public|Clonar|Favorit|Dashboard/i).first()).toBeVisible();

  await login(page, users.centro);
  await openHealthy(page, '/franchise/dashboard');
  await expect(page.getByText(/Dashboard corporativo|Analytics|Indicadores/i).first()).toBeVisible();
});

