# Roadmap Frontend do Onboarding

## Objetivo
Definir fases de implementacao futura da experiencia frontend.

## Escopo
Roadmap de telas, estado, adapters, UX e testes do Assistente Guiado de Implantacao.

## Fase 1 - Base
- Feature folder.
- Adapters.
- Listagem e detalhe de implementations.
- Estados de loading/erro/vazio.
- Sprint 3 entregue: tela `/onboarding/implementations`, adapter, hook e E2E impactado para materializacao.

## Sprint 1 - Remocao de fallback mock critico
- Decisao aplicada: o fluxo de implantacao/onboarding operacional nao deve usar fallback local para substituir falhas da API.
- Decisao aplicada: RFC-001 define `Implementation` como aggregate root operacional oficial do Onboarding.
- Arquivos impactados: `src/services/implementationService.ts`, `src/app/components/units/UnitImplementationTab.tsx`, `tests/e2e/implementation-flow.spec.ts`.
- Resultado esperado: falhas de API ou rede devem aparecer como erro de UI com retry, sem preencher telas com dados locais de `implementationMockData`.
- Pendencia: manter mocks apenas dentro de testes E2E controlados por `page.route`.

## Fase 2 - Wizard, programas e setup guiado
- Wizard dinamico.
- Builder de programa como roteiro de onboarding.
- Resume e rascunho.
- Validacoes de UX.
- Checklist simples de setup.
- Sprint 4 entregue: setup guiado com progresso, proxima acao, comandos de passo e deep links.

## Fase 3 - Proximas acoes e first value
- Sugestoes contextuais sem sequencia rigida.
- Deep links para modulos donos.
- Marcos de first value por segmento.
- Mensagens de ajuda contextual.

## Fase 4 - Referencias documentais e integracoes
- Documentos iniciais com fluxo delegado ao modulo Documents.
- Financeiro, Catalogo, Comunicacao, PDV e CRM acionados por links/contratos.
- Indicadores de setup pronto.

## Fase 5 - Adocao e orientacao
- Notificacoes de setup incompleto.
- Indicadores de adocao.
- Operacao assistida por recomendacoes.

## Fase 6 - Enterprise
- Acessibilidade avancada.
- Offline/rascunho controlado quando aplicavel.
- Observabilidade frontend de adocao.
- Performance em alto volume.

## Decisoes aprovadas
- Implementar por fases.
- Nao criar UX dependente de mocks.
- Validar cada fase com E2E.
- Program Builder deve usar `Program`/`ProgramVersion`; nao deve criar `Implementation`.
- RFC-002: Onboarding deve permanecer enxuto e focado em setup/first value.

## Recomendacoes
- Liberar telas por feature flag se necessario.
- Alinhar cada fase com backend equivalente.
- Avaliar toda nova tela contra a pergunta: ajuda o usuario a configurar e chegar ao primeiro valor?

## Pendencias
- Definir prioridade de telas do MVP.
- Definir dependencias com backend.
- Definir first value por segmento.

## Proximos passos
- Refinar first value por segmento e deep links reais por modulo.
