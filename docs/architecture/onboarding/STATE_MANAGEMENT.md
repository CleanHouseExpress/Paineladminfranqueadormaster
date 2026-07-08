# Gerenciamento de Estado

## Objetivo
Definir estrategia de estado frontend para Onboarding.

## Escopo
Server state, form state, cache, invalidacao, optimistic updates e rascunhos.

## Tipos de estado
- Server state: implementations, programas, etapas, documentos, timeline e metricas.
- Form state: campos em edicao, rascunhos e validacao local.
- UI state: abas, drawers, modais, filtros e ordenacao.
- Draft state: rascunhos recuperaveis quando permitido.

## Decisoes aprovadas
- Backend e fonte de verdade.
- RFC-001: o server state operacional principal e `Implementation`.
- Sprint 3: `useOnboardingImplementations` controla lista, meta, loading, erro, retry e atualizacao apos mutation.
- Sprint 3: mutations de start/cancel atualizam a implementation retornada pelo backend, sem optimistic update.
- Local state nao pode substituir status autoritativo.
- Cache deve ser invalidado apos mutations relevantes.

## Recomendacoes
- Usar biblioteca padrao de query/cache.
- Separar mutations de comandos criticos.
- Evitar fallback silencioso para mock em producao.
- Persistir rascunhos apenas quando o produto permitir.

## Pendencias
- Definir biblioteca oficial de server state.
- Definir tempo de cache por recurso.
- Definir comportamento offline.

## Proximos passos
- Documentar padrao de hooks.
- Criar matriz de invalidacao.
