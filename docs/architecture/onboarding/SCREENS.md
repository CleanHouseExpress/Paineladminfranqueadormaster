# Telas do Onboarding

## Objetivo
Definir telas futuras do modulo e suas responsabilidades funcionais.

## Escopo
Telas, informacoes exibidas, acoes, filtros, navegacao e estados do Assistente Guiado de Implantacao.

## Telas principais
| Tela | Objetivo | Perfis |
|---|---|---|
| Assistente inicial | Guiar configuracao da base e primeiro acesso | Admin, Usuario inicial |
| Checklist de setup | Mostrar o que falta configurar e proxima acao | Admin, Consultor, Franqueado |
| Lista de implementations | Acompanhar jornadas de onboarding por rede/unidade | Admin, Consultor |
| Detalhe da implementation | Mostrar progresso, passos guiados e links para modulos donos | Admin, Consultor, Franqueado |
| Builder de programa | Configurar roteiros de onboarding por rede | Admin |
| Operacao assistida | Sugerir proximas acoes apos setup sem fluxo rigido | Admin, Franqueado |
| Indicadores de adocao | Acompanhar setup pronto, first value e gargalos | Admin, Diretoria |

## Fora de escopo de telas do Onboarding
- Gerenciador corporativo de tarefas.
- Kanban/BPM de processos continuos.
- Auditoria operacional completa.
- Central documental corporativa completa.
- Motor visual de automacoes.

## Estados por tela
- Loading.
- Erro com retry.
- Sem dados.
- Sem permissao.
- Dados parciais.
- Setup completo.
- Proxima acao disponivel.

## Filtros comuns
- status de setup;
- rede;
- unidade;
- programa;
- primeiro valor;
- pendencia de configuracao;
- modulo dono.

## Decisoes aprovadas
- Toda tela operacional deve mostrar progresso, proxima acao e ajuda contextual.
- RFC-001: telas operacionais devem usar o conceito `Implementation`.
- RFC-002: telas de Onboarding nao devem implementar workflow generico ou gestao de tarefas recorrentes.
- Sprint 3: `/onboarding/implementations` entrega lista, criacao e detalhe resumido de `Implementation`.
- Sprint 3: criacao exige programa ativo, ProgramVersion publicada e unidade.

## Recomendacoes
- Usar links profundos para abrir configuracoes em modulos donos.
- Manter breadcrumb e navegacao lateral consistente.
- Privilegiar linguagem de assistente, nao de gestao de projeto.

## Pendencias
- Definir deep links finais para detalhe por id.
- Definir quais telas entram no MVP.

## Proximos passos
- Criar wireframes por tela.
- Mapear permissoes de acesso por tela.
