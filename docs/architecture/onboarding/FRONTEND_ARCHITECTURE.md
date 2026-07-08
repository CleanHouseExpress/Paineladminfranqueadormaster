# Arquitetura Frontend do Onboarding

## Objetivo
Definir a arquitetura recomendada para a implementacao futura do modulo Onboarding no frontend.

## Escopo
Abrange organizacao de arquivos, responsabilidades, componentizacao, adapters e limites da UI.

## Estrutura recomendada
```text
src/features/onboarding/
  api/
  adapters/
  domain/
  hooks/
  pages/
  components/
  schemas/
  tests/
```

## Responsabilidades
- `api`: chamadas HTTP brutas.
- `adapters`: conversao entre API e modelos de tela.
- `domain`: tipos e helpers de leitura, sem regra critica.
- `hooks`: composicao de queries e mutations.
- `pages`: telas roteaveis.
- `components`: blocos reutilizaveis.
- `schemas`: validacoes de formulario para UX.

## Decisoes aprovadas
- Status, progresso e conclusao devem vir do backend.
- RFC-001: telas e hooks operacionais devem modelar o aggregate root operacional como `Implementation`.
- Componentes nao devem conhecer detalhes brutos da API.
- A UI deve tratar loading, erro, vazio e sem permissao em todos os fluxos.

## Recomendacoes
- Separar wizard, dashboard, documentos e timeline em subareas.
- Usar componentes pequenos para cards, tabelas, timeline events, uploads e approval panels.
- Evitar localStorage como fonte de verdade.

## Pendencias
- Definir padrao final de cache e invalidacao.
- Definir se onboarding entra no module registry como modulo independente ou area operacional.
- Definir alias visual entre rotas atuais de implantacao e nomenclatura oficial de Onboarding/Implementation.

## Proximos passos
- Mapear rotas e telas em `SCREENS.md`.
- Definir adapters em `API_ADAPTERS.md`.
