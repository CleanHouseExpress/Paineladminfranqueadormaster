import { test, expect } from '@playwright/test';

test('raiz / publica fica restrita ao host institucional', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const routing = await import('/src/website/publicWebsiteRouting.ts');
    return {
      tenantRoot: routing.shouldRenderPublicWebsite('/', 'melten.orchestra.elonex.com.br'),
      newTenantRoot: routing.shouldRenderPublicWebsite('/', 'clin.orchestratecnologia.com.br'),
      institutionalRoot: routing.shouldRenderPublicWebsite('/', 'orchestra.elonex.com.br'),
      wwwRoot: routing.shouldRenderPublicWebsite('/', 'www.orchestra.elonex.com.br'),
      newInstitutionalRoot: routing.shouldRenderPublicWebsite('/', 'orchestratecnologia.com.br'),
      newWwwRoot: routing.shouldRenderPublicWebsite('/', 'www.orchestratecnologia.com.br'),
      apiRoot: routing.shouldRenderPublicWebsite('/', 'api.orchestratecnologia.com.br'),
      tenantDashboard: routing.shouldRenderPublicWebsite('/dashboard', 'melten.orchestra.elonex.com.br'),
      login: routing.shouldRenderPublicWebsite('/login', 'melten.orchestra.elonex.com.br'),
    };
  });

  expect(result).toEqual({
    tenantRoot: false,
    newTenantRoot: false,
    institutionalRoot: true,
    wwwRoot: true,
    newInstitutionalRoot: true,
    newWwwRoot: true,
    apiRoot: false,
    tenantDashboard: false,
    login: false,
  });
});
