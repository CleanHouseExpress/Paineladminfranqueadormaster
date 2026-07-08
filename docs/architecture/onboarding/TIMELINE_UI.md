# Jornada do Onboarding

## Objetivo
Definir a experiencia visual dos registros da jornada de implantacao.

## Escopo
Eventos de setup, mudancas de progresso, marcos de first value e origem das acoes. Nao define timeline operacional completa nem auditoria continua.

## Eventos exibidos
- criacao da implementation;
- inicio/conclusao de passo de setup;
- passo pulado;
- requisito documental inicial referenciado;
- configuracao detectada em modulo dono;
- evento de integracao relevante para adocao;
- first value atingido.

## Informacoes por evento
- titulo;
- descricao;
- usuario ou sistema;
- origem;
- data/hora;
- modulo relacionado;
- link para modulo dono quando aplicavel.

## Filtros
- setup;
- documentos iniciais;
- sistema;
- integracoes;
- usuario;
- periodo;
- first value.

## Decisoes aprovadas
- Registros de jornada devem estar disponiveis no detalhe da implementation.
- RFC-001: eventos exibidos devem referenciar implementation como aggregate root operacional.
- RFC-002: essa visao nao substitui audit log nem workflow/timeline operacional futura.

## Recomendacoes
- Usar agrupamento por dia.
- Destacar progresso e proximas acoes.
- Permitir copiar link de evento quando houver detalhe.

## Pendencias
- Definir nivel de detalhe por perfil.
- Definir se exportacao pertence ao Onboarding ou BI.

## Proximos passos
- Criar taxonomia visual de eventos de adocao.
