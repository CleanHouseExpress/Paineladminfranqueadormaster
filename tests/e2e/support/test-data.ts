export const users = {
  master: {
    email: process.env.E2E_MASTER_EMAIL ?? 'master.e2e@orchestra.com',
    password: process.env.E2E_MASTER_PASSWORD ?? 'password',
  },
  centro: {
    email: process.env.E2E_FRANCHISE_CENTRO_EMAIL ?? 'admin.centro@orchestra.com',
    password: process.env.E2E_FRANCHISE_CENTRO_PASSWORD ?? 'password',
  },
  norte: {
    email: process.env.E2E_FRANCHISE_NORTE_EMAIL ?? 'admin.norte@orchestra.com',
    password: process.env.E2E_FRANCHISE_NORTE_PASSWORD ?? 'password',
  },
} as const;

export const apiUrl = process.env.E2E_API_URL ?? 'http://orchestra-e2e.localhost:8000';
export const unique = (prefix: string) => `${prefix} ${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
