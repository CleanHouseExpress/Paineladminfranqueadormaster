# Mapa de domínios do Orchestra

**Status:** Draft arquitetural para validação de ownership.

**Versão:** 0.1

**Data:** 2026-07-10

**Escopo:** mapa de bounded contexts do Orchestra. Este documento descreve responsabilidades, ownership, dependências e eventos entre domínios. Não define tabelas, migrations, controllers ou telas.

**Base técnica analisada:** backend Laravel em `C:\repos\Clin\orchestra-api` e frontend/documentação em `C:\repos\Clin\Paineladminfranqueadormaster`.

Nota de aceite MVP Inventory: o encerramento funcional do fluxo Melten esta documentado no backend em `docs/architecture/inventory-mvp-acceptance.md` e coberto no frontend por `tests/e2e/inventory/inventory-melten-e2e.spec.ts`.

## 1. Objetivo

Este documento é a referência mestre para posicionar novos módulos e evoluções do Orchestra dentro de bounded contexts claros. Ele existe para evitar que domínios amplos como Finance, Communication, Automation ou Subscriptions virem caixas genéricas de responsabilidade.

Cada novo módulo deve responder:

- Qual bounded context é dono da regra?
- Qual entidade é aggregate root?
- Quais domínios ele pode consumir?
- Quais eventos ele deve publicar?
- Quais dados ele pode apenas referenciar?

## 2. Princípios

- O backend atual usa Laravel por camadas (`app/Models`, `app/Services`, `app/Http/Controllers/Api`) e tenancy por subdomínio/schema.
- `Company` representa a rede/franqueadora/empresa no modelo atual.
- `Unit` representa unidade/filial.
- Tabelas tenant não devem receber `tenant_id` redundante por padrão.
- Domínios podem compartilhar IDs e eventos, mas não devem recalcular regras pertencentes a outro domínio.
- Auditoria oficial usa `AuditLogService` e `audit_logs`.
- Comunicação e automação devem ser acionadas por eventos, não por chamadas diretas espalhadas nos domínios de negócio.

## 3. Visão Geral

```text
Platform
├── IAM
├── Tenancy
├── Company
├── Units
├── Users
├── Permissions
│
├── Catalog
├── Pricing
├── Sales
├── Contracts
├── Subscriptions
├── Entitlements
├── Billing
├── Payments
├── Finance
├── Revenue Settlement
│
├── CRM
├── Communication
├── Automation
├── AI
│
├── Inventory
├── Recipe and Composition
├── Purchasing
├── Manufacturing
├── Service Orders
├── Checklists
│
└── Analytics
```

## 4. Domínios de Plataforma

**IAM**

Responsável por autenticação, sessão, tokens, usuários autenticados e identidade. No backend atual usa Sanctum e `User`.

**Tenancy**

Responsável por resolver tenant/subdomínio, schema e contexto. Implementado por `CompanySubdomain`, `TenantMigrationService`, `AuthenticateTenantSanctum`, `TenantContext` e middlewares tenant.

**Company**

Representa a rede/franqueadora/empresa. É entidade central, hoje `Company` no banco público. Não deve ser duplicada como `network_id` sem decisão de produto.

**Units**

Representa unidades/filiais dentro do tenant. Dono de `Unit`, vínculo `user_unit` e regras de acesso operacional por unidade.

**Users**

Representa usuários operacionais e administrativos dentro do tenant ou plataforma.

**Permissions**

Responsável por roles, permissions e autorização. Usa slugs no padrão `tenant.modulo.acao` e `AccessControlService`.

## 5. Domínios Comerciais e Recorrência

**Catalog**

Dono do que pode ser vendido: produtos, serviços, assinaturas, planos, cursos, procedimentos, bundles e itens customizados. Não controla contrato ativo, preço promocional complexo, renovação ou cobrança.

**Pricing**

Domínio futuro responsável por responder "quanto isto deveria custar hoje?". Deve concentrar reajuste, IPCA, cupom, campanha, promoção, preço regional, preço corporativo, preço por unidade e regras progressivas. Hoje parte disso está em Catalog (`base_price`, `catalog_unit_prices`) e futuras políticas.

**Sales**

Dono do ato comercial: pedido, itens vendidos, cliente, unidade, vendedor/origem, status comercial e vínculo opcional com contrato. Pode originar assinatura, mas não controla recorrência.

**Contracts**

Dono do instrumento jurídico/comercial: vigência, documento, status, aceite, cancelamento e histórico contratual. Pode ser opcional ou obrigatório para uma assinatura conforme produto.

**Subscriptions**

Dono do ciclo contratual recorrente: assinatura, itens contratados, status contratual, trial, fidelidade, renovação, pausa, suspensão, cancelamento, alterações e MRR contratado.

**Entitlements**

Domínio futuro responsável por direitos de uso: benefícios, limites, módulos, features, licenças, add-ons e permissões de consumo. Subscriptions gera direitos; Entitlements responde se o cliente/unidade pode usar um recurso. Deve conversar com Module Registry.

## 6. Domínios Financeiros

**Billing**

Dono da cobrança recorrente. Aggregate root: `BillingInvoice`. Calcula invoice, itens, consumo faturável, créditos, multa, juros, impostos, pro-rata e parcelas. Billing não baixa caixa e não fecha competência.

```text
Billing
└── BillingInvoice
    ├── BillingInvoiceItem
    ├── DunningProcess
    ├── FinancialTransaction (referência)
    └── PaymentAttempt (referência futura de Payments)
```

**Payments**

Domínio futuro responsável por provedores de pagamento, tokenização, charge, retry, cancelamento, refund, webhook, chargeback e reconciliação com gateways. Não decide preço, renovação, MRR ou baixa contábil.

**Finance**

Dono de contas financeiras, títulos/recebíveis/pagáveis, pagamentos, baixas, saldo, caixa, competência e conciliação financeira. No backend atual usa `financial_accounts`, `financial_transactions` e `financial_periods`.

Finance consome Billing; Finance não recalcula Billing.

**Revenue Settlement**

Domínio futuro responsável por distribuição de receita entre franqueadora, unidade e participantes. Royalties atual é caso de uso existente dentro desse contexto.

```text
Revenue Settlement
├── Royalties
├── Split
├── Commissions
├── Transfers
└── Settlement Cycles
```

## 7. Domínios de Relacionamento e Operação Digital

**CRM**

Dono de leads, pipelines, estágios, atividades, origem, conversão e relacionamento pré-venda.

**Communication**

Dono de canais, inbox, conversas, mensagens, logs de provider e comunicação multicanal. Outros domínios publicam eventos; Communication decide como comunicar.

**Automation**

Dono de regras reativas a eventos, condições e ações configuráveis. Pode criar tarefas, alertas NOC, enviar comunicações via canais oficiais ou auditar.

**AI**

Domínio futuro para assistentes, recomendações, análise, resposta automática e inteligência aplicada. Deve consumir eventos e dados autorizados, não possuir regras transacionais críticas.

## 8. Domínios Operacionais

**Inventory**

Dono de itens de estoque, saldos, movimentações, transferências, contagens, consumo e CMV operacional.

**Recipe and Composition**

Dono de ficha tecnica, composicao, receita, formula, transformacao, rendimento previsto, perdas previstas, explosao de materiais, outputs e custo teorico. Nao pertence exclusivamente ao Inventory: Catalog, Forms, Checklists, Automation, Production, Sales/PDV, Finance, Analytics, AI e Portal podem consumir composicoes publicadas.

**Purchasing**

Domínio futuro para compras, fornecedores, pedidos de compra, aprovações e recebimento.

**Manufacturing**

Domínio futuro para produção, fichas técnicas, ordens de produção e transformação de insumos.

**Service Orders**

Domínio futuro para ordens de serviço, execução, agendamento, profissionais, materiais e conclusão.

**Checklists**

Dono de templates, ocorrências, execuções, respostas, agendamento e conformidade operacional.

## 9. Analytics

Analytics consome dados e eventos dos demais domínios para métricas, dashboards, templates e relatórios. Não deve ser fonte de verdade transacional. No backend atual há registry em `config/analytics.php` e handlers por domínio.

## 10. Dependências Permitidas

Direção recomendada:

```text
Catalog -> Pricing -> Sales -> Contracts -> Subscriptions -> Entitlements
Subscriptions -> Billing
Billing -> Finance
Billing/Finance -> Payments
Payments -> Finance/Billing
Finance -> Revenue Settlement
Todos -> Analytics
Todos -> AuditLog
Todos -> Automation events
Automation -> Communication
```

Fluxo financeiro recorrente esperado:

```text
BillingInvoice
   ├── gera Receivable em Finance
   └── solicita cobrança em Payments

Payments
   └── informa resultado para Finance e Billing
```

Regras:

- Sales pode consultar Catalog/Pricing para montar pedido.
- Subscriptions pode referenciar Sales e Contracts.
- Billing pode referenciar Subscription e Pricing snapshot, mas Subscription não deve depender de BillingInvoice.
- Finance pode referenciar BillingInvoice, registrar o recebível e confirmar a baixa, mas não recalcular invoice.
- Payments pode referenciar receivable/payment attempt, executar a cobrança e informar resultado, mas não decidir regras contratuais.
- Revenue Settlement pode consumir Finance/Billing/Sales/Subscriptions, mas não alterar contrato ou invoice.
- Analytics pode ler/consumir eventos, mas não comandar transações.

## 11. Eventos Entre Domínios

Eventos mínimos recomendados:

- `catalog.item.approved`
- `pricing.price.resolved`
- `sales.order.confirmed`
- `sales.order.completed`
- `contract.activated`
- `contract.cancelled`
- `subscription.created`
- `subscription.activated`
- `subscription.changed`
- `subscription.renewed`
- `subscription.canceled`
- `entitlement.granted`
- `entitlement.revoked`
- `billing.invoice.issued`
- `billing.invoice.overdue`
- `billing.invoice.written_off`
- `payment.paid`
- `payment.failed`
- `payment.refunded`
- `finance.receivable.created`
- `finance.receivable.paid`
- `settlement.royalty.generated`
- `settlement.transfer.scheduled`

Eventos devem carregar chave de idempotência, aggregate id, schema/subdomain, company context quando aplicável, unit_id quando aplicável e payload mínimo.

## 12. Ownership de Entidades

| Entidade | Dono |
| --- | --- |
| `Company` | Company |
| `CompanySubdomain` | Tenancy |
| `Unit` | Units |
| `User`, `Role`, `Permission` | IAM/Permissions |
| `CatalogItem` | Catalog |
| Preço promocional/reajuste/cupom | Pricing |
| `SalesOrder` | Sales |
| `Contract` | Contracts |
| `Subscription` | Subscriptions |
| Direitos/limites/features | Entitlements |
| `BillingInvoice` | Billing |
| `PaymentAttempt` | Payments conceitualmente. No MVP sem gateway, pode não existir; se for indispensável, a persistência inicial em Billing deve ser tratada como técnica e transitória. |
| `FinancialTransaction` | Finance |
| `RoyaltyCalculation` | Revenue Settlement/Royalties |
| `AutomationRule`, `Task` | Automation |
| `CommunicationChannel`, conversa, mensagem | Communication |
| Dashboard/metric handlers | Analytics |

## 13. Roadmap de Evolução

**Fase A: consolidar mapa**

- Aprovar bounded contexts.
- Definir ownership com produto.
- Usar este mapa como checklist para novos módulos.

**Fase B: Subscriptions/Billing**

- Implementar Subscriptions e Billing aderentes ao contrato específico.
- Manter BillingInvoice como aggregate root de Billing.
- Integrar Finance sem recalcular invoice.
- Não exigir Pricing como pré-requisito do MVP; usar Catalog, `CatalogUnitPrice` e snapshots comerciais até a extração planejada.

**Fase C: Pricing e Entitlements**

- Extrair Pricing de regras espalhadas em Catalog/políticas.
- Criar Entitlements conectado ao Module Registry.

**Fase D: Payments**

- Criar contracts/providers, webhooks, idempotência e reconciliação.

**Fase E: Revenue Settlement**

- Evoluir Royalties para contexto maior com split, comissões, transfers e settlement cycles.

## 14. Questões em Aberto

- `Company` continuará sendo suficiente como rede/franqueadora ou haverá entidade `Network`?
- Pricing será extraído após o MVP de Billing ou alguma regra comercial exige antecipação?
- Entitlements deve controlar apenas módulos internos ou também benefícios de clientes finais?
- Payments será criado antes de cobrança recorrente automatizada ou o MVP será manual via Finance?
- Revenue Settlement absorverá Royalties tecnicamente ou apenas conceitualmente no curto prazo?
- Quais eventos serão síncronos, assíncronos ou outbox no futuro?
## Inventory Foundation - Fase 1B.1

O frontend passa a distinguir tres superficies do dominio:

- Itens de estoque da rede: `InventoryItems`, `InventoryItemForm`, `InventoryItemDetail`.
- Configuracao operacional por unidade: `InventoryUnitItems` e bloco "Governanca por unidade" no detalhe do item.
- Operacao fisica: `InventoryLocations`, `InventoryBalances`, `InventoryMovements`.

Contrato novo:

- `InventoryItemUnitSetting` representa habilitacao, disponibilidade operacional e overrides locais permitidos.
- `InventoryItem` continua sendo a identidade fisica da rede.
- `StockBalance` continua sendo saldo, nao cadastro/configuracao.
- `StockMovement` continua sendo o ledger fisico.

Rotas frontend:

- `/inventory/items/:id`: franqueadora visualiza/associa/desabilita unidades do item quando possui `tenant.inventory.unit_items.manage`.
- `/inventory/unit-items`: unidade visualiza itens associados e altera configuracao local quando possui `tenant.inventory.unit_items.update`.

Fora desta fase: Portal Franqueado, CMV, DRE, Forms/Checklists, producao, transferencias novas, contagens novas, reservas, Purchasing e Sales/PDV.

## Inventory Foundation - Fase 1B.2

O frontend passa a tratar a Inventory Foundation nova como fonte definitiva, sem fallback para estruturas pre-producao.

Fonte oficial consumida:

```text
inventory_items
inventory_item_unit_settings
stock_locations
stock_movements
stock_movement_items
stock_balances
```

Decisoes de UI e contrato:

- `InventoryItem` exibe saldo agregado calculado a partir de `stockBalances`.
- `StockBalance` representa saldo por local/unidade e custo medio projetado local.
- `InventoryMovements` registra e lista movimentos pelo ledger novo.
- Portal Franqueado consome diretamente itens habilitados, saldos por local, disponibilidade, bloqueios e minimos locais.
- Transferencias e contagens antigas ficam ocultas/bloqueadas ate reimplementacao propria.
- Forms/Checklists nao executam baixa/entrada de estoque nesta fase.

Fora desta fase: transferencias novas, contagens novas, automacoes de estoque sobre ledger, producao/ficha tecnica e integracao financeira completa.

## Recipe and Composition - Fase 2A

Novo bounded context arquitetural para conhecimento operacional versionado da rede.

Responsabilidades:

- ficha tecnica, composicao, receita, formula e transformacao;
- inputs e outputs estruturados;
- rendimento previsto e perdas previstas;
- explosao de materiais;
- custo teorico;
- versoes publicadas imutaveis;
- snapshots para execucoes futuras.

Fronteira:

- Catalog define identidade comercial.
- Inventory registra ledger, saldo e custo realizado.
- Recipe and Composition define o que deveria ser consumido, produzido ou executado.
- Forms, Checklists, Automation, Production, Sales/PDV, Finance, Analytics, AI e Portal consomem versoes publicadas conforme permissao/policy.

Documento base: `docs/architecture/recipe-and-composition.md` no backend.

## Recipe and Composition - Fase 2A.2.3 Frontend minimo

O frontend passa a registrar o modulo `recipes` como superficie operacional da franqueadora para configurar fichas tecnicas versionadas.

Rotas frontend:

- `/recipes`: lista fichas tecnicas com busca, tipo, status, versao oficial e acoes permitidas.
- `/recipes/new`: cria a identidade da ficha e abre o primeiro rascunho.
- `/recipes/:id`: exibe resumo e historico de versoes.
- `/recipes/:id/versions/:version`: edita rascunho, valida, publica, clona versao publicada e calcula previa oficial quando publicada.

Responsabilidades desta fase:

- cadastrar identidade simples da ficha tecnica;
- editar rendimento, perda prevista, componentes e saida principal;
- consultar itens de Inventory e Catalog apenas como referencias;
- chamar o backend para validar, publicar e calcular composicao;
- respeitar RBAC `tenant.recipes.*`.

Fora desta fase:

- execucao de producao;
- baixa ou entrada de estoque;
- reservas;
- historico de simulacoes;
- Forms/Checklists;
- Financeiro, CMV e DRE;
- overrides por unidade;
- builder visual avancado.

## Recipe and Composition - Fase 2B Execucao manual

O frontend passa a expor a area operacional:

```text
Producao e Consumo
```

Rotas frontend:

- `/recipe-executions`: lista execucoes confirmadas e revertidas;
- `/recipe-executions/new`: seleciona ficha publicada, unidade, local e quantidade, calcula para conferencia e confirma;
- `/recipe-executions/:id`: exibe snapshot, componentes, output, movimentos vinculados e reversao quando autorizada.

Contrato de UI:

- o usuario nao calcula manualmente componentes;
- o frontend chama o endpoint de calculo antes da confirmacao;
- a confirmacao chama `POST /api/company/recipe-executions` com `Idempotency-Key`;
- o detalhe usa o snapshot persistido, nao recalcula historico;
- reversao exige motivo e permissao.

Permissoes:

- `tenant.recipe-executions.view`;
- `tenant.recipe-executions.create`;
- `tenant.recipe-executions.reverse`.

Fora desta fase:

- Forms;
- Checklists;
- Automation;
- Finance;
- DRE;
- reserva;
- execucao parcial;
- ordem de producao.

## Recipe and Composition - Fase 3 Forms e Checklists

O frontend passa a expor a primeira acao operacional concreta em Forms/Checklists:

```text
Executar ficha tecnica
```

Superficie de configuracao:

- aba `Automacoes` do builder de templates;
- selecao de ficha tecnica publicada;
- campo numerico da submissao como quantidade;
- UOM alvo;
- unidade da submissao ou unidade fixa;
- local default ou local fixo;
- trigger ao concluir ou ao aprovar;
- modo automatico ou confirmacao manual.

Superficie operacional:

- detalhe da execucao de checklist;
- painel de acoes operacionais vinculadas;
- status pendente, concluido, falhou ou revertido;
- link para a `RecipeExecution`;
- confirmar movimentacao quando pendente;
- tentar novamente quando falhar;
- reverter explicitamente quando houver execucao confirmada.

Fronteira:

- o frontend nao calcula composicao;
- o frontend nao cria movimentos de estoque;
- o frontend nao duplica logica de Inventory ou Recipe;
- a execucao real continua no backend via `RecipeExecutionService`.

## Inventory - Fase 5 Inventario Fisico Simples

O frontend reativa contagens somente no fluxo novo:

```text
stock_counts
stock_count_items
stock_movements
stock_balances
```

Rotas frontend:

- `/inventory/counts`: lista inventarios fisicos;
- `/inventory/counts/new`: abre contagem por unidade e local;
- `/inventory/counts/:id`: edita rascunho, confirma, cancela ou estorna.

Contrato de UI:

- a abertura da contagem chama o backend para criar snapshot;
- o frontend nao calcula saldo oficial;
- a diferenca exibida e apenas derivada da linha recebida/editada;
- confirmar chama `POST /api/company/inventory/counts/{id}/confirm`;
- cancelar chama `POST /api/company/inventory/counts/{id}/cancel`;
- estornar chama `POST /api/company/inventory/counts/{id}/reverse`;
- erro `stock_count_stale` deve ser exibido com a mensagem do backend;
- movimentos e efeitos gerenciais permanecem responsabilidade do backend.

Permissoes:

- `tenant.inventory.stock_counts.view`;
- `tenant.inventory.stock_counts.create`;
- `tenant.inventory.stock_counts.update`;
- `tenant.inventory.stock_counts.confirm`;
- `tenant.inventory.stock_counts.cancel`;
- `tenant.inventory.stock_counts.reverse`.

Fora desta fase:

- contagem cega;
- multiplas rodadas;
- aprovacao;
- importacao massiva;
- leitura offline;
- lotes, validade, serial e reserva.
