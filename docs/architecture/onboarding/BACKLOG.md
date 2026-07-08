# Backlog Frontend do Onboarding

## Objetivo
Manter o backlog frontend oficial do Onboarding.

## Escopo
Capabilities de interface, adapters, hooks, testes e dependencias de backend do Assistente Guiado de Implantacao.

| Capability | Status | Dependencias | Sprint | Prioridade | Estimativa | Criterios de Aceitacao |
|---|---|---|---|---|---|---|
| Remover fallback mock critico | Implementado | API de implementations | 1 | Critico | M | Falha de API aparece como erro com retry |
| Program Builder | Implementado | `/api/tenant/onboarding/programs` | 2 | Critico | G | Listar, criar, editar, publicar, duplicar e arquivar programas |
| Implementation Materialization UI | Implementado | ProgramVersion publicada | 3 | Critico | G | Criar implementation sem mock a partir de programa publicado |
| Setup Guided Experience | Implementado | RFC-002, Implementation | 4 | Critico | G | Exibir o que falta configurar, proximo passo e ajuda contextual |
| Next Actions UI | Implementado | Setup Guided Experience | 4 | Alto | M | Mostrar sugestoes e deep links para modulos donos |
| First Value UI | Parcial | Produto/QA | 4 | Alto | M | Mostrar marco de primeiro valor e progresso ate ele |
| Initial Documents References | Pendente | Documents | 5 | Medio | M | Direcionar para Documents sem duplicar gestao documental |

## Decisoes aprovadas
- Program Builder e configuracao.
- Implementation e jornada de onboarding.
- RFC-002: Onboarding nao deve implementar workflow engine ou sistema de tarefas.
- Mocks apenas em testes E2E via interceptacao controlada.

## Pendencias
- Definir microcopy e layout do assistente guiado.
- Definir first value por segmento.

## Proximos passos
- Refinar first value por segmento e deep links reais por modulo.
