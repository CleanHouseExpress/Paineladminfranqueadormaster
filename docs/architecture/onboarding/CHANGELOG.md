# Changelog Frontend do Onboarding

## Objetivo
Registrar entregas frontend relevantes do Onboarding.

## Escopo
Mudancas em telas, hooks, services, adapters, testes e documentacao.

## 2026-07-08 - Sprint 4 Guided Setup Experience
- Tela `/onboarding/implementations` reposicionada como Setup Guiado.
- Adapter passou a normalizar `guided_setup`, `next_action`, passos e first value.
- UI passou a exibir progresso de setup, proxima acao, deep link para modulo dono e comandos de concluir/pular passo.
- E2E atualizado para validar jornada criada, proximo passo e conclusao de passo.

## 2026-07-08 - RFC-002 Scope Guard
- Onboarding reposicionado como Assistente Guiado de Implantacao.
- UX, telas, roadmap, backlog e lifecycle ajustados para setup guiado e first value.
- Explicitado que workflow engine, BPM, tarefas recorrentes e sistema de projetos ficam fora da UI de Onboarding.

## 2026-07-08 - Sprint 3 Implementation Lifecycle
- Criada tela `/onboarding/implementations`.
- Criados types, service e hook para Implementation Lifecycle.
- Criado fluxo de materializacao por ProgramVersion publicada e unidade.
- Criado E2E impactado para materializacao e detalhe.
- Registrada rota no module registry com permissao `tenant.onboarding.implementations.view`.

## 2026-07-08 - Sprint 2 Program Builder
- Criada tela de Program Builder em `/onboarding/programs`.
- Criados types, service e hook para Program Builder.
- Criado E2E impactado cobrindo criar, editar, publicar, duplicar e arquivar.
- Mantida separacao entre Program Builder e `Implementation`.

## 2026-07-08 - Sprint 1
- Removido fallback mock critico de implementation.
- Falhas de API passaram a renderizar erro com retry.

## Decisoes aprovadas
- Program Builder consome API real e nao cria execution.
- RFC-002: Onboarding frontend deve guiar setup e first value, nao operar tarefas continuas.

## Pendencias
- Hardening visual apos validacao de UX.
- Definir first value por segmento.

## Proximos passos
- Refinar first value por segmento e deep links reais por modulo.
