import { test as base, expect } from '@playwright/test';
import { login } from './auth';
import { users } from './test-data';

export const test = base.extend<{ masterPage: import('@playwright/test').Page }>({
  masterPage: async ({ page }, use) => {
    await login(page, users.master);
    await use(page);
  },
});

export { expect };
