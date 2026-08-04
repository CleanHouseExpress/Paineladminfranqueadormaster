import { test, expect } from '@playwright/test';

import { ALL_ROUTES } from '../../src/services/moduleRegistry';
import { FINANCIAL_PERMISSIONS } from '../../src/types/financial';

test('@smoke financial transactions uses granular backend permissions', () => {
  const transactionsRoute = ALL_ROUTES.find(route => route.path === '/financial/transactions');

  expect(transactionsRoute?.requiredPermissions).toEqual([FINANCIAL_PERMISSIONS.transactionsView]);
  expect(FINANCIAL_PERMISSIONS.transactionsCreate).toBe('tenant.financial.transactions.create');
  expect(FINANCIAL_PERMISSIONS.transactionsUpdate).toBe('tenant.financial.transactions.update');
  expect(FINANCIAL_PERMISSIONS.transactionsDelete).toBe('tenant.financial.transactions.delete');
  expect(FINANCIAL_PERMISSIONS.transactionsPay).toBe('tenant.financial.transactions.pay');
});