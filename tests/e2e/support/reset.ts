import { APIRequestContext, expect } from '@playwright/test';
import { apiUrl } from './test-data';

export async function assertE2EEnvironment(request: APIRequestContext) {
  const response = await request.get(`${apiUrl}/api/tenant/current`);
  expect(response.ok(), `API E2E indisponivel em ${apiUrl}; rode php artisan e2e:seed e inicie o backend.`).toBeTruthy();
}
