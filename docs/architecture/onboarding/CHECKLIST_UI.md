# Interface de Checklist

## Objetivo
Definir experiencia de checklist dinamico no frontend.

## Escopo
Itens, categorias, comentarios, fotos, arquivos, pendencias, aprovacao, SLA, dependencias e reabertura.

## Experiencia
O checklist deve mostrar categorias, itens, status, responsavel, prazo, evidencias e comentarios. Itens obrigatorios bloqueiam conclusao quando pendentes.

## Acoes
- marcar em andamento;
- concluir;
- anexar evidencia;
- comentar;
- solicitar aprovacao;
- aprovar/reprovar;
- reabrir com motivo;
- filtrar por status/responsavel/categoria.

## Estados de item
- pendente;
- em andamento;
- aguardando evidencia;
- aguardando aprovacao;
- aprovado;
- reprovado;
- concluido;
- dispensado.

## Decisoes aprovadas
- Checklist e dinamico e vem do backend.
- Item obrigatorio pode bloquear etapa.
- Reabertura exige justificativa.

## Recomendacoes
- Mostrar dependencias antes da acao.
- Agrupar pendencias no topo.
- Permitir upload rapido de foto/arquivo.

## Pendencias
- Definir preview de evidencias.
- Definir UX para checklist longo.

## Proximos passos
- Criar componentes reutilizaveis de item e categoria.
