# Onboarding guiado de Estoque - Fase A

## Escopo desta fase

Esta fase e somente discovery, UX e arquitetura de experiencia. Nao implementa codigo, componentes, backend, APIs, migrations, testes, commit ou push.

O MVP de Estoque ja esta concluido. O wizard deve ensinar e orientar o uso do modulo com telas, services, APIs, permissoes e componentes existentes. A experiencia proposta nao cria nova regra de negocio de estoque.

## Diagnostico UX

O modulo ja cobre a operacao real: configuracoes, itens, governanca por unidade, locais, saldos, movimentos, contagem fisica, receitas, execucao de receitas, checklists, efeitos gerenciais e DRE. O problema atual nao e falta de funcionalidade; e a quantidade de conceitos que chegam juntos para um usuario novo.

Principais pontos que assustam:

- "Estoque" aparece como varios lugares separados: itens, locais, itens por unidade, saldos, movimentos, inventario fisico e configuracoes.
- A tela de configuracoes mistura capability, modo, terminologia e Metadata Engine.
- O usuario precisa entender a ordem correta: ativar, cadastrar itens, definir locais, habilitar por unidade, fazer entrada, consultar saldo, movimentar, contar e corrigir.
- Movimentacao exige compreender tipo, unidade, local, custo, quantidade e reversao.
- Contagem fisica exige entender snapshot, rascunho, divergencia, confirmacao, cancelamento e estorno.
- Receitas e checklists movimentam estoque, mas moram fora da navegacao principal de Estoque.
- Transferencias aparecem na rota e service, mas estao temporariamente indisponiveis no backend novo.

## O que ja existe para reutilizar

Backend:

- `InventorySettingsService`: capability, modo, flags, terminologia e audit de configuracao.
- `StockMovementService`: ledger oficial, saldos, validacao de saldo negativo, idempotencia, reversao e efeitos gerenciais.
- `StockCountService`: inventario fisico, snapshot, divergencias, confirmacao, cancelamento e estorno.
- `InventoryTransferService`: rotas existem, mas o fluxo esta indisponivel nesta fase.
- `MetadataEngineService` e seeders: entidades `inventory_items`, `inventory_item_unit_settings`, `inventory_suppliers`, `inventory_categories`, `stock_locations`, `stock_movements`, `stock_counts` e `stock_count_items`.
- `TenantOnboardingService`: onboarding geral do tenant, util como referencia de persistencia e retomada, mas nao como regra de estoque.
- `ImplementationMaterializer`: guided setup de implantacao, util como referencia de estrutura de progresso, nao como fonte para o wizard de estoque.

Frontend:

- Rotas de Estoque em `App.tsx`: dashboard, itens, categorias, fornecedores, locais, itens por unidade, saldos, movimentos, settings, transferencias e contagens.
- `inventoryService`: adapter unico para as APIs existentes.
- `InventoryPages.tsx`: dashboard, items, item form/detail, categories, suppliers, locations, balances, movements, unit items e settings.
- `InventorySupplyChainPages.tsx`: transferencias indisponiveis e inventario fisico simples.
- `ModuleStateView`: loading, erro, empty, sem permissao e no-config.
- `DynamicFormRenderer` e `DynamicTableRenderer`: reaproveitaveis para formulacao e leitura de metadata.
- `ProductTour`: padrao existente de tour com spotlight por `data-tour`.
- `OnboardingWizard` e `OnboardingContext`: padrao visual e de retomada do onboarding geral.
- `usePermission`, `ModuleGate`, `PermissionGate` e Module Registry: base de RBAC e navegacao.
- E2E existente cobrindo MVP Melten e regressao de inventario.

## Principio de arquitetura do wizard

O wizard deve ser uma camada de orientacao sobre o modulo existente.

Ele pode:

- Explicar o proximo passo.
- Mostrar progresso.
- Direcionar para telas existentes.
- Abrir modais existentes quando ja houver suporte.
- Exibir ajuda contextual, exemplos e empty states educativos.
- Marcar progresso com base em dados ja existentes.

Ele nao deve:

- Criar novo fluxo operacional paralelo.
- Duplicar regras de estoque no frontend.
- Criar movimentos, saldos, receitas ou contagens por fora dos services existentes.
- Prometer transferencias enquanto o backend mantiver o fluxo indisponivel.
- Esconder erros reais do dominio.

## Blueprint resumido

Entrada principal:

- Banner compacto no `InventoryDashboard` quando o modulo estiver habilitado e o usuario ainda nao concluiu o guia.
- Botao permanente "Guia de estoque" no header do modulo ou area de ajuda.
- Empty states educativos em itens, locais, saldos, movimentos e contagens.

Wizard da Franqueadora:

- Entender o modulo.
- Ativar e escolher modo.
- Definir nomes usados pela rede.
- Cadastrar ou revisar itens.
- Definir locais.
- Habilitar itens por unidade.
- Fazer primeira entrada.
- Conferir saldo.
- Conhecer receitas/checklists.
- Abrir primeira contagem fisica.
- Concluir com proximas acoes.

Wizard da Unidade:

- Entender o que a unidade pode fazer.
- Ver itens disponiveis para a unidade.
- Consultar saldo.
- Registrar entrada/saida quando permitido.
- Fazer inventario fisico.
- Corrigir divergencia pelos fluxos oficiais.

## Componentes recomendados para Fase B

- `InventoryOnboardingEntry`: banner/CTA no dashboard.
- `InventoryOnboardingWizard`: shell do wizard de estoque.
- `InventoryOnboardingStep`: conteudo padronizado de etapa.
- `InventoryOnboardingChecklist`: progresso resumido.
- `InventoryContextHelp`: ajuda por tela.
- `InventoryGuideDrawer`: guia permanente do modulo.
- `InventoryFirstUseEmptyState`: variacoes educativas de empty state.
- `InventoryProgressService` frontend: calcula progresso a partir de APIs existentes.
- Opcional backend futuro: endpoint simples de preferencia/progresso se for necessario persistir por usuario e tenant.

## Melhorias UX fora do wizard

- Ajustar textos com encoding quebrado antes da implementacao visual, para evitar experiencia ruim.
- Reduzir linguagem tecnica em settings: "Capability" pode virar "Modulo habilitado".
- Separar visualmente "configuracao de uso" de "campos personalizados".
- Indicar em movimentos qual tipo entra, sai ou corrige estoque.
- Explicar em contagem fisica que confirmar cria ajustes oficiais no ledger.
- Em transferencias, manter mensagem explicita de indisponibilidade e nao incluir como etapa obrigatoria.
- Adicionar links cruzados: movimentos para saldos, contagem para movimentos gerados, receitas para execucoes.

## Roadmap de implementacao

1. Fase B1 - Guia sem backend novo: criar UI, progresso local calculado por dados existentes e deep links.
2. Fase B2 - Persistencia minima, se necessaria: salvar estado por usuario/tenant sem criar regra de estoque.
3. Fase B3 - Tour contextual: adicionar `data-tour` em pontos existentes e reaproveitar padrao de `ProductTour`.
4. Fase B4 - Empty states e microcopy: tornar telas vazias educativas.
5. Fase B5 - E2E de adocao: validar primeiro acesso, retomada e links para telas existentes.

## Estimativa de complexidade

- Discovery/documentacao: concluido nesta fase.
- Guia sem backend novo: media.
- Persistencia por usuario: media, com cuidado multi-tenant.
- Tour contextual: baixa a media.
- Empty states: baixa.
- E2E completo do onboarding: media.

## Fora do escopo

- Transferencias enquanto indisponiveis.
- Novas automacoes.
- Novos tipos de movimento.
- Novas regras de saldo.
- Novas regras de receita.
- Novo modulo de compras.
- Alterar RBAC, TenantContext, AuditLog ou Metadata Engine sem necessidade comprovada.

## Documentos complementares

- `docs/ux/inventory-user-journeys.md`
- `docs/ux/inventory-first-use.md`
- `docs/ux/inventory-help-system.md`
- `docs/ux/inventory-progress-model.md`

## Fase B2.1 - Wizard da franqueadora implementado

A Fase B2.1 implementa o onboarding guiado dentro do modulo de Estoque, somente para o contexto de franqueadora/rede. A experiencia nao cria novo fluxo operacional: ela apresenta explicacoes curtas, exemplos, progresso e CTAs que apontam para telas existentes.

Superficies frontend:

- `InventoryDashboard`: entrada automatica de primeiro acesso, card de retomada e botao permanente "Guia de configuracao".
- `InventoryNetworkOnboardingWizard`: modal do guia, convite inicial, progresso, exemplos, checklist final, dismiss e reset.
- `inventoryOnboardingService`: adapter unico para os endpoints B1 de onboarding.
- `InventoryOnboardingState` e tipos relacionados: contrato tipado do progresso recebido do backend.

Contrato consumido:

- `GET /api/company/inventory/onboarding?context=network`
- `PUT /api/company/inventory/onboarding`
- `POST /api/company/inventory/onboarding/reset`
- `POST /api/company/inventory/onboarding/dismiss`

Responsabilidades do frontend:

- renderizar apenas as etapas retornadas pelo backend;
- abrir o convite uma vez por sessao quando o backend indicar guia nao iniciado;
- manter acesso manual ao guia pelo header do modulo;
- persistir acao do usuario chamando os endpoints B1;
- navegar por deep links recebidos em `step.path`;
- continuar mostrando o modulo se a API do onboarding estiver indisponivel.

Responsabilidades que permanecem fora do frontend:

- decidir quais etapas existem para cada RBAC/capability;
- marcar progresso automatico por dados reais;
- validar regras de estoque;
- criar item, local, movimento, saldo, receita ou contagem fora das telas oficiais.
