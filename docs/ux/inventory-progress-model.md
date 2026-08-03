# Modelo de progresso do onboarding de Estoque

## Objetivo

Definir como medir progresso do usuario sem criar regras novas de estoque. O progresso deve ser uma leitura da adocao, nao uma fonte de verdade operacional.

## Principios

- O backend de estoque continua sendo autoridade.
- O frontend nao recalcula saldo nem valida regra critica.
- Progresso deve ser derivado de APIs existentes sempre que possivel.
- Persistencia futura deve guardar somente estado de UX: visto, pulado, concluido, ultimo passo.
- Progresso deve respeitar RBAC e capabilities.

## Sinais derivados de dados existentes

Modulo habilitado:

- Fonte: `GET /api/company/inventory/settings`.
- Criterio: `inventory_enabled = true`.

Modo definido:

- Fonte: `GET /api/company/inventory/settings`.
- Criterio: `inventory_mode` preenchido.

Itens cadastrados:

- Fonte: `GET /api/company/inventory/items`.
- Criterio: total maior que zero ou item ativo.

Locais cadastrados:

- Fonte: `GET /api/company/inventory/locations`.
- Criterio: total maior que zero ou local ativo.

Itens por unidade:

- Fonte: `GET /api/company/inventory/unit-items`.
- Criterio: ao menos um item habilitado.

Primeira entrada:

- Fonte: `GET /api/company/inventory/movements`.
- Criterio: movimento confirmado com `movement_type = entry`.

Saldo visivel:

- Fonte: `GET /api/company/inventory/balances`.
- Criterio: ao menos um saldo com `on_hand > 0`.

Contagem fisica:

- Fonte: `GET /api/company/inventory/counts`.
- Criterio: ao menos uma contagem em rascunho ou confirmada.

Receitas/execucoes:

- Fonte: `GET /api/company/recipes` e `GET /api/company/recipe-executions`.
- Criterio: modulo habilitado e usuario viu etapa; opcionalmente receita publicada ou execucao existente.

## Etapas obrigatorias e opcionais

Obrigatorias para franqueadora:

- Entender modulo.
- Estoque habilitado.
- Itens.
- Locais.
- Itens por unidade.
- Primeira entrada.
- Conferir saldo.

Opcionais:

- Terminologia.
- Metadata Engine.
- Receitas/checklists.
- Contagem fisica inicial.
- Custos/CMV.

Unidade:

- Consultar itens/saldos e operar movimentos/contagens quando permitido.
- Nunca exigir configuracoes da rede para concluir o guia da unidade.

## Persistencia recomendada para Fase B

Primeira opcao: progresso calculado no frontend, com estado local por usuario para etapas vistas/puladas. Baixo risco, sem backend novo.

Segunda opcao: persistencia em backend se for necessario retomar entre dispositivos. Criar um recurso generico de preferencia/onboarding de modulo, nao regra de estoque.

Sugestao de shape conceitual futuro:

```json
{
  "module": "inventory",
  "scope": "tenant",
  "current_step": "first_entry",
  "completed_steps": ["welcome", "enabled", "items", "locations"],
  "skipped_steps": ["recipes_intro"],
  "dismissed_callouts": ["dashboard_first_use"],
  "completed_at": null
}
```

Observacao: isso nao deve criar movimento, saldo, item ou contagem. Deve guardar apenas UX.

## RBAC

O progresso deve considerar o que o usuario pode fazer:

- Sem `tenant.inventory.settings.update`: nao mostrar "ativar modulo" como tarefa acionavel; mostrar "solicitar ao admin".
- Sem `tenant.catalog.create`: pode ver explicacao de itens, mas nao CTA de criar no Catalogo.
- Sem `tenant.inventory.locations.manage`: locais viram etapa informativa.
- Sem `tenant.inventory.entry.create`: primeira entrada vira "peca para alguem autorizado".
- Sem `tenant.inventory.stock_counts.create`: contagem vira leitura/explicacao.
- Sem `tenant.inventory.cost.view`: esconder custo/CMV do guia.

## Capabilities

O guia deve ler `InventorySettings.capabilities` e flags:

- `locations`
- `balances`
- `movements`
- `counts`
- `enable_recipes`
- `enable_supplier_management`
- `enable_cost_tracking`
- `enable_multi_unit_inventory`

Se uma capability estiver desabilitada, a etapa correspondente deve ser omitida ou marcada como "nao usada pela sua rede".

## Estados do onboarding

- `not_started`: usuario ainda nao abriu o guia.
- `in_progress`: usuario iniciou e tem proxima etapa.
- `blocked_by_permission`: proxima acao depende de permissao.
- `blocked_by_capability`: recurso desabilitado para a rede.
- `waiting_for_data`: depende de cadastro feito em tela existente.
- `completed`: etapas obrigatorias concluidas.
- `dismissed`: usuario ocultou o guia, mas pode reabrir.

## Pontuacao sugerida

Franqueadora:

- Boas-vindas: 5%.
- Modulo habilitado: 15%.
- Itens: 15%.
- Locais: 15%.
- Itens por unidade: 15%.
- Primeira entrada: 20%.
- Saldo visivel: 10%.
- Finalizacao: 5%.

Unidade:

- Guia visto: 20%.
- Itens/saldos vistos: 30%.
- Movimento ou contagem iniciada: 30%.
- Finalizacao: 20%.

## Evitar

- Marcar progresso por clique quando o dado operacional nao existe, exceto etapas puramente educativas.
- Fazer polling agressivo.
- Criar endpoint especifico de estoque so para reproduzir dados que ja existem.
- Usar transferencias como etapa obrigatoria.
- Bloquear o modulo porque o onboarding nao foi concluido.

## Fase B2.1 - Modelo efetivo no frontend

Na Fase B2.1, o frontend nao calcula progresso por dados operacionais. O backend B1 e a fonte oficial de:

- contexto do guia;
- etapa atual;
- lista de etapas permitidas;
- porcentagem;
- etapas concluidas;
- etapas puladas;
- etapas auto-concluidas;
- status `started`, `completed` e `dismissed`.

O frontend deriva somente um estado visual local para renderizacao, sem decisao de negocio:

- convite inicial quando `started = false`, `completed = false`, `dismissed = false` e ha etapas;
- card de retomada quando `started = true`, `completed = false` e `dismissed = false`;
- aviso nao bloqueante quando a API de onboarding falha;
- sincronismo com backend apos update, dismiss ou reset.

Atualizacao de progresso:

- `welcome` chama `PUT` com `completed_step`;
- etapa opcional chama `PUT` com `skipped_step`;
- fechamento do wizard salva `current_step`;
- conclusao chama `PUT` com `completed = true`;
- reset e dismiss chamam endpoints dedicados.

Regra de ouro: o wizard apenas mostra o que o backend B1 determinou e envia intencoes de UX. Ele nao consulta itens, locais, saldos ou movimentos para reinterpretar progresso.
