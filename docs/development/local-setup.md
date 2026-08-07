# Setup local

## Pre-requisitos confirmados

- Node.js/npm. O workflow E2E usa Node 22.
- Dependencias instaladas via npm, apesar de `package.json` declarar `packageManager` pnpm.
- Backend externo `orchestra-api` quando for executar fluxos integrados ou E2E.
- Browser Chromium do Playwright para testes E2E.

## Instalar dependencias

```bash
npm install
```

O CI usa:

```bash
npm ci
```

## Variaveis de ambiente

`.env.example` lista:

```env
VITE_API_BASE_URL=https://acme.orchestra.elonex.com.br/api
VITE_REALTIME_ENABLED=false
VITE_REVERB_APP_KEY=
VITE_REVERB_HOST=
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
VITE_REVERB_AUTH_ENDPOINT=/api/tenant/communication/broadcasting/auth
```

`.env.e2e.example` lista URLs e credenciais deterministicas de teste para a suite Playwright. Esses valores sao exemplos de teste; nao registrar credenciais reais em documentacao.

## Executar frontend

```bash
npm run dev
```

Para E2E, a documentacao e o CI usam porta 5174:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

## Build

```bash
npm run build
```

## Testes E2E

Instale o navegador, se necessario:

```bash
npx playwright install chromium
```

Smoke:

```bash
npm run test:e2e
```

Suite completa:

```bash
npm run test:e2e:full
```

Modos auxiliares:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
```

Mais detalhes em [../e2e-playwright.md](../e2e-playwright.md).

## Backend para E2E

O backend nao esta neste repositorio. O workflow `.github/workflows/e2e.yml` espera um repositorio backend informado manualmente, instala dependencias Composer, configura PHP 8.4, usa PostgreSQL 16, roda migrations/seeds e inicia `php artisan serve --host=0.0.0.0 --port=8000`.

Comandos backend citados pela documentacao existente:

```bash
php artisan tenants:migrate --seed
php artisan e2e:seed
php artisan serve --host=0.0.0.0 --port=8000
```

Esses comandos pertencem ao backend externo e precisam ser executados no repositorio correto.

## Comandos nao identificados

- Lint: nao identificado.
- Testes unitarios: nao identificado.
- Analise estatica: nao identificado.
- Docker/container local: nao identificado.
- Migrations/seeds neste repositorio frontend: nao aplicavel.
