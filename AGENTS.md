# Painel Admin Franqueador Master

## Visao geral

Painel Admin Franqueador Master e uma aplicacao web frontend para administracao de rede/franquias. O README informa que o bundle original veio de um projeto Figma chamado "Painel Admin Franqueador Master"; o codigo atual organiza uma SPA React com rotas protegidas para painel administrativo e portal do franqueado.

Tipo identificado: frontend de aplicacao web, SPA, consumindo uma API externa. O backend nao esta neste repositorio; a documentacao e o CI referenciam `orchestra-api` como backend Laravel usado em desenvolvimento/testes E2E.

Responsabilidades principais confirmadas:

- autenticar usuarios e hidratar sessao, empresa, modulos, roles e permissoes;
- renderizar rotas administrativas e do portal franqueado;
- aplicar gates de modulo e permissao antes de exibir telas;
- consumir endpoints da API por services/adapters;
- expor modulos de gestao de rede, clientes, CRM, catalogo, financeiro, vendas, estoque, checklists, comunicacao, automacao, NOC, analytics, configuracoes e marketplace de modulos;
- executar testes E2E com Playwright contra frontend e backend preparados.

## Stack confirmada

- Linguagem: TypeScript.
- UI: React 18.3.1, React Router 7.13.0.
- Build/dev server: Vite 6.3.5 com `@vitejs/plugin-react` 4.7.0.
- Estilos/componentes: Tailwind CSS 4.1.12, Radix UI, MUI, lucide-react, shadcn-style components em `src/app/components/ui`.
- Realtime opcional: `laravel-echo` e `pusher-js`, selecionados por feature flag; o padrao e `NullRealtimeProvider`.
- Testes: Playwright 1.55.1.
- Banco/cache/filas: nao identificados neste repositorio frontend. O workflow E2E sobe PostgreSQL 16 para o backend externo.
- Containers locais: nao identificados neste repositorio.
- CI/CD: workflow manual `.github/workflows/e2e.yml` para suite Playwright com backend externo, PHP 8.4, Node 22 e PostgreSQL 16.

## Organizacao do codigo

- Entrada da aplicacao: `src/main.tsx`.
- Bootstrap de rotas/providers: `src/app/App.tsx`.
- Layouts e paginas legadas/compostas: `src/app/components`.
- Modulos por dominio/superficie: `src/modules`.
- Services/adapters de API: `src/services`.
- Cliente HTTP compartilhado: `src/services/apiClient.ts`.
- Realtime: `src/services/realtime`.
- Contextos globais: `src/shared/context`.
- Hooks compartilhados: `src/shared/hooks`.
- Componentes compartilhados: `src/shared/components`.
- Tipos de dominio/UI: `src/types`.
- Dados mockados ou fixtures locais de UI: `src/app/data`.
- Testes E2E: `tests/e2e`.
- Configuracoes: `vite.config.ts`, `playwright.config.ts`, `postcss.config.mjs`, `.env.example`, `.env.e2e.example`.
- Documentacao permanente e historica: `docs`, `guidelines`, `ATTRIBUTIONS.md`, `README.md`.

Nao foram identificados controllers, models, migrations, jobs ou filas neste repositorio. Esses conceitos aparecem em documentacao que referencia o backend externo, mas nao existem aqui como codigo fonte.

## Padroes encontrados

- Rotas administrativas sao registradas em `src/services/moduleRegistry.ts` e resolvidas em `src/app/App.tsx` por `componentId`.
- Novas superficies modulares normalmente expõem exports em `src/modules/<modulo>/index.tsx` e usam `src/app/components/<dominio>` quando ha componentes maiores reaproveitados.
- Acesso a API deve passar por `apiClient` ou services/adapters em `src/services` e `src/modules/*/*Service.ts`.
- Autenticacao usa token em `localStorage` com chave `orchestra_auth_token`; requests adicionam `Authorization: Bearer <token>` quando disponivel.
- Respostas protegidas por rota passam por `ProtectedRoute`, `ModuleGate` e `PermissionGate`.
- Permissoes usam strings como `tenant.<dominio>.<acao>` quando declaradas no registry ou nos testes.
- Realtime deve ser consumido por `useRealtime()`/`RealtimeProvider`; componentes nao devem importar Echo/Reverb/Pusher diretamente.
- Falhas de API em fluxos ja cobertos tendem a renderizar estado de erro/retry, sem substituir silenciosamente por mock quando o fluxo espera API real. Esse padrao aparece em testes e docs de onboarding/implementation.
- Testes E2E usam Playwright em `tests/e2e`, com fixtures em `tests/e2e/support`.

Quando um padrao aparecer em apenas um arquivo isolado, trate como implementacao local e registre que precisa de validacao humana antes de promover a regra global.

## Comandos confirmados

Instalar dependencias:

```bash
npm install
```

Executar em desenvolvimento:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Playwright smoke:

```bash
npm run test:e2e
```

Playwright completo:

```bash
npm run test:e2e:full
```

Playwright headed/UI/report:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
```

Instalar browser Playwright:

```bash
npx playwright install chromium
```

Lint, testes unitarios e analise estatica: nao identificados em `package.json`.

## Restricoes para agentes

- Nao editar arquivos de ambiente com credenciais reais.
- Nao expor tokens, senhas, chaves privadas, cookies ou outros dados sensiveis.
- Nao alterar migrations, regras de banco ou backend externo a partir deste repositorio sem autorizacao explicita.
- Nao remover contratos de API ou mudar endpoints sem autorizacao.
- Nao alterar a arquitetura global durante uma tarefa comum.
- Pesquisar implementacoes existentes antes de criar novas telas, services, hooks ou tipos.
- Reutilizar `apiClient`, services, contexts, gates, registry e componentes existentes.
- Criar ou atualizar testes relevantes quando houver alteracao funcional.
- Executar os testes relevantes antes de concluir; se nao for possivel, informar claramente.
- Nao criar documentacao duplicada; atualizar ou referenciar documentos existentes.
- Manter documentos permanentes enxutos e baseados em evidencias do repositorio.

## Politica de desenvolvimento orientado a testes

Toda alteracao funcional deve seguir o ciclo:

1. Analisar os criterios de aceite.
2. Identificar os testes adequados para a alteracao.
3. Criar ou atualizar os testes antes de alterar o codigo funcional.
4. Executar os novos testes e confirmar que falham pelo motivo esperado.
5. Somente depois implementar a alteracao.
6. Executar novamente os testes modificados.
7. Executar a suite completa relevante.
8. Nao concluir a tarefa enquanto houver testes obrigatorios falhando.

O teste inicial nao deve falhar por erro de sintaxe, configuracao, dependencia ausente ou ambiente incorreto. Ele deve falhar porque o comportamento solicitado ainda nao foi implementado.

Nao modificar ou enfraquecer testes apenas para fazer a implementacao passar.

Quando um teste nao puder ser criado antes da implementacao, o agente deve interromper e explicar o motivo antes de continuar.

## Processo documental

Em futuras tarefas, o agente deve:

1. Ler este `AGENTS.md`.
2. Ler `docs/README.md`.
3. Pesquisar documentacao existente antes de criar um arquivo.
4. Atualizar documentos permanentes quando a alteracao afetar arquitetura, dominio, API, operacao ou testes.
5. Criar documentacao especifica de feature somente quando houver utilidade pratica e evidencia.
6. Criar ADR somente para decisoes arquiteturais relevantes e permanentes.
7. Marcar como "nao identificado", "nao documentado" ou "precisa de validacao humana" qualquer ponto nao confirmado pelo codigo, configuracoes ou documentacao existente.
