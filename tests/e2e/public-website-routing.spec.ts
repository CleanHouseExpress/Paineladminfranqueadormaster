import { test, expect } from '@playwright/test';

test('raiz / publica fica restrita ao host institucional', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const routing = await import('/src/website/publicWebsiteRouting.ts');
    return {
      tenantRoot: routing.shouldRenderPublicWebsite('/', 'melten.orchestra.elonex.com.br'),
      institutionalRoot: routing.shouldRenderPublicWebsite('/', 'orchestra.elonex.com.br'),
      wwwRoot: routing.shouldRenderPublicWebsite('/', 'www.orchestra.elonex.com.br'),
      tenantDashboard: routing.shouldRenderPublicWebsite('/dashboard', 'melten.orchestra.elonex.com.br'),
      login: routing.shouldRenderPublicWebsite('/login', 'melten.orchestra.elonex.com.br'),
    };
  });

  expect(result).toEqual({
    tenantRoot: false,
    institutionalRoot: true,
    wwwRoot: true,
    tenantDashboard: false,
    login: false,
  });
});
