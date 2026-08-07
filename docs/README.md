# Documentacao do Painel Admin Franqueador Master

Esta pasta e o indice oficial da documentacao tecnica deste repositorio frontend. Use estes documentos como contexto inicial para desenvolvimento humano ou assistido por IA, sempre conferindo o codigo atual antes de alterar comportamento.

## Fontes principais

| Documento | Finalidade | Situacao |
| --- | --- | --- |
| [../AGENTS.md](../AGENTS.md) | Orientacoes oficiais para agentes de IA. | Atual e util. |
| [architecture/overview.md](architecture/overview.md) | Visao geral confirmada da arquitetura real do frontend. | Atual e util. |
| [development/local-setup.md](development/local-setup.md) | Comandos e ambiente local confirmados. | Atual e util. |
| [e2e-playwright.md](e2e-playwright.md) | Preparacao e execucao da suite Playwright. | Atual e util, depende do backend externo. |
| [frontend-realtime-echo.md](frontend-realtime-echo.md) | Configuracao atual do realtime com Echo/Reverb por feature flag. | Atual e util. |
| [frontend-realtime.md](frontend-realtime.md) | Contrato conceitual da camada realtime e uso na Communication Inbox. | Parcialmente historico; use junto com `frontend-realtime-echo.md`. |

## Arquitetura e dominios

| Documento | Finalidade | Situacao |
| --- | --- | --- |
| [architecture/domain-map.md](architecture/domain-map.md) | Mapa amplo de dominios Orchestra, incluindo backend externo. | Util, mas precisa de validacao humana para o estado atual do backend. |
| [architecture/subscriptions-and-recurring-billing.md](architecture/subscriptions-and-recurring-billing.md) | Contrato arquitetural futuro de assinaturas/billing. | Historico/propositivo; nao e evidencia de codigo deste repo. |
| [architecture/subscriptions-business-rules.md](architecture/subscriptions-business-rules.md) | Regras de subscription policies. | Parcial; validar contra codigo e backend antes de usar como fonte oficial. |
| [architecture/subscriptions-product-decisions.md](architecture/subscriptions-product-decisions.md) | Decision log de produto para subscriptions/billing. | Preservar como historico/decisoes pendentes. |
| [architecture/onboarding/README.md](architecture/onboarding/README.md) | Indice do pacote documental de onboarding. | Fragmentado, mas preservado como historico util. |

## Pacote historico de onboarding

Os documentos abaixo pertencem ao pacote `docs/architecture/onboarding`. Eles foram preservados porque registram escopo, UX, telas, estado, adapters, backlog e changelog do frontend de onboarding. Situacao geral: fragmentados/historicos; validar contra o codigo atual antes de usar como contrato.

- [architecture/onboarding/API_ADAPTERS.md](architecture/onboarding/API_ADAPTERS.md)
- [architecture/onboarding/BACKLOG.md](architecture/onboarding/BACKLOG.md)
- [architecture/onboarding/CHANGELOG.md](architecture/onboarding/CHANGELOG.md)
- [architecture/onboarding/CHECKLIST_UI.md](architecture/onboarding/CHECKLIST_UI.md)
- [architecture/onboarding/DASHBOARDS.md](architecture/onboarding/DASHBOARDS.md)
- [architecture/onboarding/DOCUMENTS_UI.md](architecture/onboarding/DOCUMENTS_UI.md)
- [architecture/onboarding/FRONTEND_ARCHITECTURE.md](architecture/onboarding/FRONTEND_ARCHITECTURE.md)
- [architecture/onboarding/IMPLEMENTATION_ROADMAP.md](architecture/onboarding/IMPLEMENTATION_ROADMAP.md)
- [architecture/onboarding/LIFECYCLE.md](architecture/onboarding/LIFECYCLE.md)
- [architecture/onboarding/SCREENS.md](architecture/onboarding/SCREENS.md)
- [architecture/onboarding/STATE_MANAGEMENT.md](architecture/onboarding/STATE_MANAGEMENT.md)
- [architecture/onboarding/TEST_STRATEGY.md](architecture/onboarding/TEST_STRATEGY.md)
- [architecture/onboarding/TIMELINE_UI.md](architecture/onboarding/TIMELINE_UI.md)
- [architecture/onboarding/UX_SPECIFICATION.md](architecture/onboarding/UX_SPECIFICATION.md)
- [architecture/onboarding/WIZARD.md](architecture/onboarding/WIZARD.md)

## UX e especificacoes de feature

| Documento | Finalidade | Situacao |
| --- | --- | --- |
| [ux/inventory-onboarding.md](ux/inventory-onboarding.md) | UX do onboarding de Estoque. | Parcialmente historico; validar contra telas atuais. |
| [ux/inventory-first-use.md](ux/inventory-first-use.md) | Primeiro uso/wizard de Estoque. | Parcialmente historico. |
| [ux/inventory-progress-model.md](ux/inventory-progress-model.md) | Modelo de progresso do onboarding de Estoque. | Parcialmente historico. |
| [ux/inventory-user-journeys.md](ux/inventory-user-journeys.md) | Jornadas de usuario de Estoque. | Parcialmente historico. |
| [ux/inventory-help-system.md](ux/inventory-help-system.md) | Ajuda contextual de Estoque. | Parcialmente historico. |
| [ux/catalog-onboarding.md](ux/catalog-onboarding.md) | UX do onboarding de Catalogo. | Parcialmente historico. |
| [ux/catalog-first-use.md](ux/catalog-first-use.md) | Primeiro uso do Catalogo. | Parcialmente historico. |
| [ux/catalog-progress-model.md](ux/catalog-progress-model.md) | Modelo de progresso do Catalogo. | Parcialmente historico. |
| [ux/catalog-user-journeys.md](ux/catalog-user-journeys.md) | Jornadas de usuario do Catalogo. | Parcialmente historico. |
| [ux/catalog-help-system.md](ux/catalog-help-system.md) | Ajuda contextual do Catalogo. | Parcialmente historico. |
| [communication-inbox-ui-assessment.md](communication-inbox-ui-assessment.md) | Auditoria e plano incremental da Communication Inbox. | Util como historico; validar contra codigo atual antes de implementar. |

## Testes e regressao

| Documento | Finalidade | Situacao |
| --- | --- | --- |
| [e2e-playwright.md](e2e-playwright.md) | Suite Playwright principal. | Atual e util. |
| [e2e-playwright-fase-2.md](e2e-playwright-fase-2.md) | Complemento de regressao da Fase 2. | Complementar/historico. |

## Outros documentos

| Documento | Finalidade | Situacao |
| --- | --- | --- |
| [../README.md](../README.md) | Descricao curta do bundle e comandos basicos. | Atual, mas minimo. |
| [../ATTRIBUTIONS.md](../ATTRIBUTIONS.md) | Atribuicoes do bundle. | Preservado. |
| [../guidelines/Guidelines.md](../guidelines/Guidelines.md) | Guidelines de design/importacao do bundle. | Util para UI, precisa ser lido junto ao codigo atual. |
| [../src/imports/pasted_text/checklist-module.md](../src/imports/pasted_text/checklist-module.md) | Texto importado sobre modulo de checklists. | Legado/sem referencia oficial; nao usar como fonte unica. |

## Regras para novos documentos

- Pesquise neste indice e no repositorio antes de criar um arquivo novo.
- Atualize documentos permanentes quando a mudanca afetar arquitetura, setup, testes, API ou operacao.
- Prefira nomes em minusculas com hifen, como `architecture/overview.md`.
- Nao duplique uma fonte oficial existente; consolide ou referencie.
- Separe documento permanente de plano temporario ou feature pontual.
- Marque explicitamente informacoes nao confirmadas como "nao identificado", "nao documentado" ou "precisa de validacao humana".
- Nao incluir segredos, tokens, senhas ou dados sensiveis.

## Pontos que precisam de validacao humana

- O nome de pacote em `package.json` e `@figma/my-make-file`, enquanto o README e a UI usam Painel Admin Franqueador Master/Orchestra.
- O backend `orchestra-api` e referenciado por docs e CI, mas nao faz parte deste repositorio.
- Parte da documentacao de dominios descreve arquitetura/backend futuros ou externos.
- Alguns documentos possuem texto com problemas de encoding; o conteudo deve ser validado antes de ser tratado como contrato.
