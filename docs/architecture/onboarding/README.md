# Documentacao Frontend do Onboarding

O Onboarding existe para ajudar o usuario inicial a preparar sua base para uso e guia-lo ate conseguir operar a plataforma.

## Objetivo
Centralizar a documentacao oficial de frontend, UX e implementacao futura da experiencia de Onboarding.

## Escopo
Esta pasta cobre arquitetura frontend, telas, wizard, checklist de setup, orientacao contextual, estado, adapters, testes e roadmap. Nao contem componentes React, rotas ou codigo funcional.

## Visao geral
O frontend do Onboarding deve funcionar como um Assistente Guiado de Implantacao. Ele mostra o que falta configurar, qual e o proximo passo e como o usuario faz isso, sempre buscando levar o cliente ao primeiro valor do Orchestra.

## Indice
- `FRONTEND_ARCHITECTURE.md`: arquitetura recomendada de frontend.
- `UX_SPECIFICATION.md`: experiencia ideal do usuario.
- `SCREENS.md`: telas e responsabilidades.
- `WIZARD.md`: comportamento do wizard.
- `CHECKLIST_UI.md`: experiencia de checklist de setup.
- `DOCUMENTS_UI.md`: experiencia documental inicial.
- `TIMELINE_UI.md`: registros da jornada de implantacao.
- `DASHBOARDS.md`: indicadores de adocao.
- `STATE_MANAGEMENT.md`: server state, form state e cache.
- `API_ADAPTERS.md`: adapters e contratos frontend/backend.
- `LIFECYCLE.md`: UI de materializacao e ciclo inicial de `Implementation`.
- `TEST_STRATEGY.md`: testes frontend e E2E.
- `IMPLEMENTATION_ROADMAP.md`: fases futuras.
- `BACKLOG.md`: backlog frontend por capability.
- `CHANGELOG.md`: historico de entregas frontend.

## Decisoes aprovadas
- A UI nao decide regras criticas de conclusao.
- O frontend deve renderizar estado autoritativo vindo do backend.
- RFC-001: `Implementation` e o aggregate root operacional exibido pelo frontend.
- RFC-001: `OnboardingRun` nao deve ser usado em types, adapters, telas ou payloads novos.
- RFC-002: Onboarding e Assistente Guiado de Implantacao, nao workflow engine ou sistema de tarefas.
- Sprint 2: Program Builder usa API real em `/api/tenant/onboarding/programs`.
- Sprint 3: Implementation Lifecycle usa API real em `/api/tenant/onboarding/implementations`.
- Mocks devem ficar restritos a testes e desenvolvimento controlado.

## Recomendacoes
- Criar experiencia de primeiro acesso inspirada em SaaS como Shopify, HubSpot, Slack, Stripe e Google Workspace.
- Usar adapters para isolar contrato de API.
- Priorizar proxima acao, ajuda contextual e first value.
- Encaminhar acoes de Financeiro, Catalogo, Documents, Automation e Comunicacao para os modulos donos.

## Pendencias
- Definir microcopy final do assistente.
- Definir first value por segmento/persona.

## Proximos passos
- Evoluir Sprint 4 para setup guiado, proximas acoes e first value.
- Converter operacao continua em referencias para modulos donos, nao em telas internas do Onboarding.
