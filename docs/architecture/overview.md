# Visao geral da arquitetura

## Proposito

Painel Admin Franqueador Master e uma SPA frontend para administracao de rede/franquias e portal do franqueado. O repositorio contem a aplicacao React/Vite, documentacao e testes Playwright. O backend nao esta neste repositorio; a API externa e referenciada como `orchestra-api` em documentos e no workflow E2E.

## Stack

- TypeScript, React 18.3.1 e React Router 7.13.0.
- Vite 6.3.5 com plugin React e Tailwind CSS 4.1.12.
- Componentes/UI com Radix UI, MUI, lucide-react, Recharts, Sonner e componentes locais em `src/app/components/ui`.
- Realtime opcional com Laravel Echo/Pusher/Reverb por `VITE_REALTIME_ENABLED=true`; padrao sem websocket via `NullRealtimeProvider`.
- Testes E2E com Playwright 1.55.1.

Banco de dados, cache, filas e storage persistente nao existem neste frontend. O workflow E2E sobe PostgreSQL 16 para o backend externo.

## Componentes principais

- `src/main.tsx`: monta o React no elemento `#root`.
- `src/app/App.tsx`: compoe providers, browser router, rotas protegidas, portal franqueado e lazy loading de paginas.
- `src/services/moduleRegistry.ts`: fonte central de modulos, navegacao, marketplace, rotas e permissoes declaradas.
- `src/services/apiClient.ts`: cliente HTTP compartilhado, base URL por `VITE_API_BASE_URL` ou host local, token bearer, tratamento de 401/419 e erros de API.
- `src/shared/context/AuthContext.tsx`: login, logout, hidratacao da sessao, empresa, modulos, roles, permissoes e tema.
- `src/shared/context/AppProvider.tsx`: compoe realtime, tenant, tema, auth, modules e onboarding.
- `src/shared/components/ProtectedRoute.tsx`, `ModuleGate.tsx` e `PermissionGate.tsx`: protecao por sessao, estado de modulo e permissoes.
- `src/services/realtime`: contrato, provider nulo, provider de teste e provider Echo.

## Estrutura geral

```text
src/
  app/                 bootstrap, layout, paginas compostas e componentes de UI
  modules/             superficies de negocio exportadas por modulo
  services/            clients, adapters e services de API
  shared/              contexts, hooks e componentes compartilhados
  styles/              estilos globais e Tailwind/theme
  types/               tipos TypeScript por dominio
tests/e2e/             suites Playwright e fixtures
docs/                  documentacao tecnica e historica
```

## Dominios/superficies identificados

Pelo `moduleRegistry` e pela estrutura `src/modules`, os principais dominios/superficies do frontend incluem dashboard, unidades/implantacoes, onboarding, clientes, CRM, catalogo, financeiro, vendas, pricing, politicas de assinatura, fidelidade, estoque, receitas/composicao, documentos, contratos, checklists, CMV, portal franqueado, communication inbox, automacao, tasks, NOC, analytics, marketplace/acessos/configuracoes e form builder.

Alguns itens do marketplace estao marcados como `development`, `review` ou `blocked`; isso indica disponibilidade de UI/modulo, nao necessariamente implementacao completa no backend.

## API e integracoes

O frontend usa uma API HTTP externa com prefixos observados como:

- `/api/company/*` para login, logout e varios recursos de tenant/company;
- `/api/me/*` para sessao, empresa, modulos, roles, permissoes, settings e onboarding;
- `/api/tenant/*` para tenant atual, onboarding, implementations, communication e realtime auth;
- `/api/franchise/*` para recursos do portal franqueado.

`VITE_API_BASE_URL` pode definir a URL base. Em hosts locais, `apiClient` deriva a base do hostname atual e usa `VITE_API_PORT` ou porta `8000`.

Realtime usa `VITE_REALTIME_ENABLED` e variaveis `VITE_REVERB_*`. Com a flag desligada, a aplicacao nao abre websocket.

Integracoes externas confirmadas por codigo/configuracao: API Orchestra externa, Laravel Sanctum/CSRF, Laravel Echo/Reverb/Pusher quando habilitado e endpoint de autorizacao de broadcasting. Z-API aparece em nomes de componentes/configuracoes da Communication Inbox, mas a responsabilidade concreta do provider precisa de validacao contra backend.

## Autenticacao e autorizacao

O login chama `/api/company/login`. O token retornado e salvo em `localStorage` como `orchestra_auth_token`. Requests incluem `Authorization: Bearer <token>` quando o token existe.

Ao hidratar sessao, o frontend busca `/api/me`, `/api/me/company`, `/api/me/modules`, `/api/me/roles`, `/api/me/permissions` e branding. Rotas protegidas exigem usuario autenticado; paginas administrativas passam por `ModuleGate` e `PermissionGate` quando a rota declara modulo/permissoes.

Erros 401 ou 419 expiram a sessao local, limpam storage/cookies e redirecionam para `/login`.

## Fluxo resumido de uma requisicao

1. Usuario acessa uma rota no `BrowserRouter`.
2. `ProtectedRoute` valida se ha token/sessao.
3. A rota vem de `ALL_ROUTES`, derivado do `moduleRegistry`.
4. `ModuleGate` valida se o modulo esta ativo para o tenant.
5. `PermissionGate` valida permissoes declaradas.
6. A pagina chama um service/adapters via `apiClient` ou `fetch` autenticado para downloads/midia.
7. O erro de API e normalizado por `ApiError` e por helpers locais de cada fluxo.

## Testes

`playwright.config.ts` define `tests/e2e` como suite, projeto Chromium, execucao serial (`workers: 1`) e base URL padrao `http://orchestra-e2e.localhost:5174`. Scripts confirmados:

- `npm run test:e2e` para smoke `@smoke`;
- `npm run test:e2e:full` para suite Chromium completa;
- `npm run test:e2e:headed`, `npm run test:e2e:ui` e `npm run test:e2e:report` para modos auxiliares.

Nao foram identificados scripts de lint, testes unitarios ou analise estatica em `package.json`.

## Limitacoes e pontos nao confirmados

- Backend, banco, filas, migrations, controllers e models nao estao neste repositorio.
- Documentos de dominio citam backend Laravel e caminhos externos; precisam de validacao humana antes de serem tratados como contrato atual.
- Nao ha Dockerfile ou docker-compose neste repositorio.
- Nao foi identificado validador Markdown configurado.
- Parte da documentacao existente tem problemas de encoding e pode precisar de revisao humana antes de consolidacao semantica.
