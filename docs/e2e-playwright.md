# E2E Regression Suite com Playwright

Esta suite cobre os fluxos regressivos da Fase 1 usando o tenant determinístico `orchestra-e2e` criado pelo backend.

## Pré-requisitos

- Backend em `C:\repos\Clin\orchestra-api`.
- Frontend em `C:\repos\Clin\Paineladminfranqueadormaster`.
- PHP usado no terminal com `pdo_pgsql` habilitado.
- PostgreSQL acessível com as credenciais do `.env` do backend.
- Node.js e npm instalados.
- Browser do Playwright instalado:

```bash
npx playwright install --with-deps chromium
```

No Windows, se `--with-deps` não instalar dependências de sistema, rode ao menos:

```bash
npx playwright install chromium
```

## Variáveis de ambiente

Copie o arquivo de exemplo no frontend, se precisar customizar URLs ou credenciais:

```bash
copy .env.e2e.example .env.e2e.local
```

Valores padrão esperados:

- `E2E_FRONT_URL=http://orchestra-e2e.localhost:5174`
- `E2E_API_URL=http://orchestra-e2e.localhost:8000`
- Usuário master: `master.e2e@orchestra.com`
- Senha padrão: `password`

## Preparação do backend

No repositório `orchestra-api`, execute:

```bash
php artisan tenants:migrate --seed
php artisan e2e:seed
php artisan serve --host=0.0.0.0 --port=8000
```

O comando `e2e:seed` é idempotente e cria dados base para CRM, catálogo, estoque, checklist, financeiro, royalties e usuários por unidade.

## Preparação do frontend

No repositório `Paineladminfranqueadormaster`, execute:

```bash
npm install
npm run build
npm run dev -- --host 0.0.0.0 --port 5174
```

Garanta permissão de escrita nas pastas geradas durante build e teste:

- `node_modules/.vite-temp`
- `dist`
- `playwright-report`
- `test-results`

## Execução da suite

Com backend e frontend rodando:

```bash
npm run test:e2e
```

Com navegador visível:

```bash
npm run test:e2e:headed
```

Relatório HTML:

```bash
npm run test:e2e:report
```

## Escopo da Fase 1

A suite valida autenticação, RBAC, navegação pelos módulos principais e fluxos smoke/regressivos de CRM, vendas/financeiro, estoque/checklists/CMV, DRE/royalties, NOC/automações/tarefas, portal do franqueado e analytics.

## Troubleshooting

- Erro `could not find driver`: habilite `pdo_pgsql` no PHP efetivamente usado pelo terminal.
- Erro de browser Playwright inexistente: rode `npx playwright install --with-deps chromium`.
- Erro de escrita no Vite/Playwright: remova bloqueios de permissão em `node_modules/.vite-temp`, `dist`, `playwright-report` e `test-results`.
- Falha de login: rode novamente `php artisan e2e:seed` e confirme `E2E_FRONT_URL`/`E2E_API_URL`.
