# Lifecycle UI de Implementation

## Objetivo
Definir a experiencia frontend da Sprint 3 para materializar e visualizar uma `Implementation` de onboarding.

## Escopo
Inclui listagem, filtros, criacao a partir de ProgramVersion publicada, detalhe resumido, status, fases materializadas, loading, erro, retry e estado vazio. Nao inclui workflow generico, tarefas recorrentes, documentos avancados, automacoes ou dashboards.

## Decisoes aprovadas
- A rota oficial da Sprint 3 e `/onboarding/implementations`.
- A tela consome `/api/tenant/onboarding/implementations`.
- A tela usa Program Builder apenas para selecionar programa ativo e versao publicada.
- A tela usa `/api/company/units/options` para selecionar unidade.
- O frontend nao calcula progresso, status ou fases: apenas renderiza o response autoritativo do backend.
- RFC-002: fases materializadas devem evoluir visualmente para passos guiados de setup e first value, nao para BPM.
- Mocks ficam restritos aos testes E2E.

## Estados de UI
- Loading de lista.
- Erro com retry.
- Empty state quando nao ha implementations.
- Painel de criacao com validacao local minima.
- Detalhe com status, progresso, fase atual, data prevista e fases/passos.

## Pendencias
- Adicionar responsavel na criacao quando o contrato de usuarios/responsaveis estiver consolidado.
- Refinar first value por segmento.
- Conectar deep links a checagens reais dos modulos donos.
- Avaliar deep link para detalhe por id.

## Proximos passos
- Evoluir criterios de first value por segmento e ampliar checagens reais nos modulos donos.
