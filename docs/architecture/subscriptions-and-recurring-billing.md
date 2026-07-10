# Contrato arquitetural: Assinaturas e Billing recorrente

**Status:** Aprovado tecnicamente para planejamento. Implementação pendente de decisões de produto da seção 30.

**Versão:** 0.3

**Data da revisão:** 2026-07-10

**Repositórios analisados:**

- Backend: `C:\repos\Clin\orchestra-api`
- Frontend/documentação: `C:\repos\Clin\Paineladminfranqueadormaster`

**Escopo:** contrato arquitetural para implementação futura dos domínios de Subscriptions e Billing recorrente dentro da arquitetura real do Orchestra API. Este documento não implementa código funcional.

**Documentos relacionados:**

- `docs/architecture/domain-map.md`, mapa mestre de bounded contexts do Orchestra.
- `docs/architecture/subscriptions-product-decisions.md`, decision log das decisões de produto pendentes.

**Dependências arquiteturais:** Catalog, Pricing futuro, Sales, Contracts, Subscriptions, Entitlements futuro, Billing, Payments futuro, Finance, Revenue Settlement futuro/Royalties atual, Automation, Communication, Analytics, auditoria central, RBAC tenant, tenancy por subdomínio/schema e rotas protegidas por `tenant.auth` + `tenant.context`.

**Responsáveis por validação:** arquitetura/engenharia do Orchestra API, produto financeiro, produto franquias/rede, financeiro/contabilidade, operações e segurança.

**Fontes principais do backend usadas nesta revisão:**

- Laravel/PHP: `composer.json`
- Rotas tenant/admin: `routes/company.php`, `routes/admin.php`, `routes/console.php`
- Tenancy: `config/tenancy.php`, `app/Http/Middleware/EnsureRegisteredSubdomain.php`, `app/Http/Middleware/AuthenticateTenantSanctum.php`, `app/Services/TenantMigrationService.php`, `app/Support/TenantContext.php`
- Empresa/unidade/acesso: `app/Models/Company.php`, `app/Models/Unit.php`, `app/Services/TenantUnitScopeService.php`, `app/Services/UnitAccessService.php`
- Catálogo: `database/tenant_migrations/2026_06_18_000001_create_catalog_tables.php`, `database/tenant_migrations/2026_07_06_000003_add_catalog_governance_tables.php`, `app/Models/CatalogItem.php`, `app/Services/CatalogItemService.php`, `app/Services/CatalogSettingsService.php`
- Vendas: `database/tenant_migrations/2026_06_18_000007_create_sales_orders_tables.php`, `app/Models/SalesOrder.php`, `app/Services/SalesOrderService.php`
- Contratos: `database/tenant_migrations/2026_06_17_000006_create_contracts_table.php`, `app/Models/Contract.php`, `app/Services/ContractService.php`
- Financeiro: `database/tenant_migrations/2026_06_18_000006_create_financial_accounts_and_transactions.php`, `database/tenant_migrations/2026_06_22_000002_create_financial_governance_tables.php`, `app/Models/TenantFinancialTransaction.php`, `app/Services/TenantFinancialTransactionService.php`, `app/Services/FinancialPeriodService.php`
- Royalties: `database/tenant_migrations/2026_06_21_000001_create_royalty_tables.php`, `app/Services/RoyaltyCalculationService.php`, `app/Services/RoyaltyPeriodService.php`
- Auditoria: `database/migrations/2026_06_10_000005_create_audit_logs_table.php`, `app/Models/AuditLog.php`, `app/Services/AuditLogService.php`
- Permissões: `database/tenant_seeders/TenantPermissionsSeeder.php`, `app/Services/AccessControlService.php`
- Automação e filas: `config/automation.php`, `app/Services/AutomationEngineService.php`, `config/queue.php`

## 1. Objetivo

O domínio de Assinaturas deve controlar o ciclo contratual recorrente de clientes, unidades e redes/franqueadoras que vendem produtos, serviços, planos, mensalidades, anuidades, licenças, pacotes recorrentes, adicionais, cobranças por quantidade, consumo ou modelos híbridos.

O domínio de Billing deve calcular ciclos e cobranças recorrentes, produzindo documentos comerciais de cobrança e os lançamentos necessários para integração com Finance, sem assumir responsabilidade por baixa, caixa, competência financeira, royalties ou gateway.

O aggregate root de Billing deve ser `BillingInvoice`, não `Subscription`. A assinatura informa o direito recorrente contratado e o ciclo esperado; a invoice materializa uma cobrança específica, com estado, itens, régua de cobrança, referência ao título financeiro e, no futuro, referências a tentativas executadas por Payments.

O contrato anterior foi revisado porque o backend Laravel está disponível em `C:\repos\Clin\orchestra-api`. A arquitetura real é Laravel 13/PHP 8.3, namespace `App\`, pastas por camada (`Models`, `Services`, `Http\Controllers\Api`, `Http\Requests`, `Events`, `Policies`, `Support`) e tenancy por subdomínio/schema, não uma pasta `Modules/` já existente. Portanto, Subscriptions e Billing devem nascer aderentes ao padrão atual de services, models, controllers e tenant migrations.

## 2. Limites dos domínios

Fluxo macro oficial entre bounded contexts:

```text
Catalog
  -> Pricing
  -> Sale or Proposal
  -> Contract
  -> Subscription
  -> Entitlements
  -> Billing Cycle
  -> Billing Invoice
  -> Finance Receivable / Financial Transaction
  -> Payments
  -> Revenue Settlement
```

Fluxo financeiro específico:

```text
BillingInvoice
   ├── gera Receivable em Finance
   └── solicita cobrança em Payments

Payments
   └── informa resultado para Finance e Billing
```

Ordem de responsabilidade:

1. Billing calcula a cobrança e emite `BillingInvoice`.
2. Finance registra o recebível em `financial_transactions`.
3. Payments executa a cobrança quando existir gateway/provider.
4. Finance confirma a baixa.
5. Billing reflete o estado financeiro sem recalcular a invoice.

**Catalog** define o que pode ser vendido. Já existe `catalog_items` com `item_type` incluindo `subscription` e `plan`, detalhe em `catalog_subscription_details` e governança corporativo/local por unidade em `catalog_settings` e `catalog_unit_prices`. Catalog não gerencia assinatura ativa, renovação, inadimplência ou MRR.

**Pricing** deve ser tratado como bounded context futuro. Hoje parte do preço está no Catalog (`base_price`, `catalog_unit_prices`) e parte ficará em políticas recorrentes. No futuro, Pricing deve responder "quanto isto deveria custar hoje?", incluindo reajuste, IPCA, cupom, campanha, preço regional, preço corporativo e preço por unidade. Billing responde "quanto será cobrado neste ciclo?", usando snapshots e decisões de Pricing, sem se tornar dono de política comercial ampla. O MVP de Subscriptions/Billing não depende da implementação prévia de Pricing; Catalog, `CatalogUnitPrice` e snapshot comercial resolvido são suficientes até a extração planejada.

**Sales** registra o ato comercial em `sales_orders` e `sales_order_items`. Já valida item vendável pelo Catalog e pode gerar `financial_transactions` pendentes via `SalesOrderService::generateFinancialTransaction`. Uma venda recorrente deve originar uma assinatura após confirmação ou conclusão, por comando explícito e idempotente de Subscriptions, não por alteração silenciosa em Sales.

**Contracts** registra instrumento jurídico/comercial. O service tenant atual trata contrato como título, cliente, unidade, documento, vigência e status. `Contract` pode apoiar a assinatura, mas não deve ser o motor recorrente.

**Subscriptions** controlará ciclo de vida recorrente, snapshot contratual, alterações, pausa, suspensão, cancelamento, renovação e métricas contratadas.

**Entitlements** deve ser tratado como bounded context futuro. Subscriptions gera direitos contratados, mas não deve virar o lugar onde todos os limites de uso, módulos, licenças, features e add-ons são verificados. Entitlements deverá conversar com Module Registry e com consumo para responder se um cliente/unidade pode usar determinado recurso.

**Billing** calculará ciclos, invoices comerciais, itens, consumo, créditos, descontos, multa, juros, impostos e parcelas. Seu aggregate root é `BillingInvoice`. Billing não deve baixar caixa nem substituir `financial_transactions`.

**Payments** ainda não existe como módulo dedicado no backend. Deve ser criado como camada futura de contratos/providers quando houver gateway, PIX, boleto, cartão ou adquirente. Até lá, Billing pode gerar títulos financeiros pendentes e a baixa manual acontece em Finance. `PaymentAttempt` pertence conceitualmente a Payments; no MVP sem gateway, ele pode não existir.

**Finance** já existe e controla `financial_accounts`, `financial_transactions`, status financeiro, pagamento/baixa e competências (`financial_periods`). Finance consome Billing criando/baixando recebíveis, mas nunca recalcula Billing. Billing pode solicitar ou materializar um título financeiro com `reference_type` e `reference_id`, mas a baixa pertence a Finance.

**Revenue Settlement** deve ser bounded context próprio no roadmap. O módulo atual de Royalties já cobre um caso de uso importante: regras, vínculos por unidade, cálculos, aprovação, geração de financeiro, pagamento e fechamento/snapshot de período. No futuro, Revenue Settlement deve englobar Royalties, Split, Commissions, Transfers e Settlement Cycles. Royalties será um subdomínio/caso de uso dentro dele, não todo o contexto.

## 3. Princípios arquiteturais

- Usar a arquitetura real do backend: `App\Models`, `App\Services`, `App\Http\Controllers\Api`, `database/tenant_migrations`, seeders tenant e rotas em `routes/company.php`.
- Preservar tenancy por subdomínio/schema. Em PostgreSQL, tenant é isolado por `search_path` via `TenantMigrationService::runInSchema`; tabelas tenant não devem receber `tenant_id` redundante por padrão.
- Usar `Company` como entidade central da rede/franqueadora/empresa; usar `Unit` como unidade/filial. Não introduzir `network_id` sem decisão de produto e migration de plataforma.
- Aplicar escopo de unidade com `TenantUnitScopeService` e `UnitAccessService`.
- Usar IDs incrementais (`id()`) como padrão atual, salvo decisão futura explícita por UUID/ULID.
- Seguir o padrão monetário atual `decimal(..., 2)`, reconhecendo risco técnico. O princípio ideal é evitar ponto flutuante em cálculo; se valores em centavos forem adotados, a mudança deve ser transversal e planejada.
- Usar `AuditLogService` e `audit_logs` central para auditoria; não criar infraestrutura paralela.
- Usar `tenant_settings`, `catalog_settings` e tabelas específicas quando política exigir governança e versionamento. Evitar sete tabelas soltas se uma estrutura versionada comum for criada.
- Tratar bounded contexts explicitamente: Catalog define ofertas, Pricing calcula preço esperado, Subscriptions controla contrato recorrente, Entitlements libera direitos, Billing materializa cobrança, Finance registra recebíveis/baixas, Payments executa provedores e Revenue Settlement distribui receita.
- Manter dependência direcional: Subscriptions não consulta nem depende de `BillingInvoice`; Billing referencia `Subscription` para cobrar ciclos; Finance consome invoices/títulos, sem recalcular Billing.
- Integrar Automation/Communication por eventos e regras; Subscriptions/Billing não devem enviar WhatsApp/e-mail diretamente.
- Jobs e commands devem preservar contexto tenant por schema/subdomínio, seguindo o padrão de `routes/console.php`.
- Webhooks/gateways futuros devem ser idempotentes e reconciliáveis, mas não existem hoje.

## 4. Entidades do domínio

Entidades existentes a reutilizar:

- `Company`: representa a rede/franqueadora/empresa no banco central.
- `CompanySubdomain`: resolve o tenant/subdomínio.
- `Unit`: unidade/filial no schema tenant.
- `Customer`: cliente no schema tenant.
- `CatalogItem` e `CatalogSubscriptionDetail`: catálogo e detalhes recorrentes básicos.
- `CatalogSetting` e `CatalogUnitPrice`: governança e preço local por unidade.
- `SalesOrder` e `SalesOrderItem`: origem comercial.
- `Contract`: vínculo jurídico opcional/recomendado conforme produto.
- `TenantFinancialTransaction`: título financeiro/lançamento no schema tenant.
- `FinancialAccount` e `FinancialPeriod`: conta/caixa e competência.
- `RoyaltyRule`, `RoyaltyAssignment`, `RoyaltyCalculation`, `RoyaltyPeriodSnapshot`: royalties/settlement atual.
- `AuditLog`: auditoria central.

Entidades novas propostas:

- `SubscriptionPolicyVersion`: versão resolvida de políticas recorrentes por empresa/unidade/contrato.
- `Subscription`: aggregate root recorrente no schema tenant.
- `SubscriptionItem`: itens recorrentes contratados com snapshot do catálogo.
- `SubscriptionCycle`: ciclo contratual/serviço previsto. Billing pode referenciar o ciclo, mas a assinatura não deve guardar dependência obrigatória da invoice.
- `SubscriptionChange`: ledger de alterações contratuais.
- `SubscriptionPause`: pausa solicitada.
- `SubscriptionCancellation`: cancelamento solicitado/agendado/executado.
- `SubscriptionTimelineEvent`: histórico/auditoria de domínio para leitura operacional. Não é event sourcing.
- `BillingInvoice`: aggregate root do Billing e documento comercial de cobrança calculado.
- `BillingInvoiceItem`: itens da cobrança.
- `PaymentAttempt`: tentativa de cobrança pertencente conceitualmente a Payments. No MVP sem gateway, pode não existir; se for indispensável registrar tentativas antes de Payments, a persistência em Billing deve ser técnica, transitória e explicitamente marcada para migração.
- `DunningPolicyVersion`: versão da régua de cobrança.
- `DunningProcess`: execução da régua para uma invoice/assinatura.
- `DunningAction`: cada tentativa ou ação da régua.
- `UsageRecord`: consumo medido.
- `SubscriptionCredit`: crédito recorrente.
- `MrrMovement`: ledger de MRR contratado/faturável.

`SubscriptionPlanConfiguration` do contrato anterior deve ser renomeada ou absorvida por `SubscriptionPolicyVersion` + `CatalogSubscriptionDetail`, porque o backend já possui detalhes de assinatura no catálogo e governança de catálogo por unidade.

Aggregate de Billing:

```text
Billing
└── BillingInvoice
    ├── BillingInvoiceItem
    ├── DunningProcess
    ├── FinancialTransaction (referência externa)
    └── PaymentAttempt (referência futura de Payments)
```

`BillingInvoice` possui estado próprio, itens próprios, write-off, estorno, dunning e referência ao título financeiro. Quando Payments existir, ela também poderá referenciar tentativas de pagamento externas. Por isso ela deve ser o aggregate root de Billing, sem tornar Billing dono conceitual de `PaymentAttempt`.

## 5. Snapshot contratual

No momento da contratação, Subscriptions deve copiar snapshot do plano, itens e políticas aplicáveis. O snapshot deve conter nome comercial, descrição, preço, moeda, periodicidade, quantidade, descontos, fidelidade, cancelamento, reajuste, trial, tolerância, benefícios, limites de uso, impostos, vendedor, unidade, proprietário econômico e responsável pela cobrança.

Referenciar:

- `catalog_item_id`
- `catalog_subscription_detail_id`, quando existir
- `sales_order_id`
- `contract_id`, quando houver contrato
- `customer_id`
- `unit_id`
- `seller_id`/`created_by`
- `policy_version_id`

Copiar em snapshot:

- Dados comerciais e preço efetivo, incluindo `catalog_unit_prices` quando aplicável.
- Campos de `catalog_subscription_details`: `billing_cycle`, `recurrence_interval`, `trial_days`.
- Política resolvida por herança.
- Dados de ownership econômico/cobrança definidos no momento da contratação.

Alterações futuras no Catalog não alteram contratos ativos. O backend já protege parte disso indiretamente porque Sales copia `description`, `quantity`, `unit_price`, `discount` e `total` em `sales_order_items`; Subscriptions deve seguir o mesmo padrão, ampliado para regras recorrentes.

## 6. Estados e transições

### Subscription

Estados: `draft`, `pending_activation`, `trialing`, `active`, `past_due`, `suspended`, `paused`, `cancel_scheduled`, `canceled`, `expired`.

Transições principais:

- `draft -> pending_activation|trialing|active|canceled`
- `pending_activation -> trialing|active|canceled`
- `trialing -> active|expired|canceled`
- `active -> past_due|paused|suspended|cancel_scheduled|canceled|expired`
- `past_due -> active|suspended|cancel_scheduled|canceled`
- `paused -> active|canceled`
- `suspended -> active|canceled`
- `cancel_scheduled -> active|canceled`
- `canceled` não renova; reativação exige evento/comando explícito.
- `expired -> active` apenas por renovação manual autorizada.

Transições proibidas: retorno silencioso para `draft`, cancelada renovar, `past_due` substituir invoice vencida, `active` sem snapshot válido.

Eventos/auditoria esperados: criar `SubscriptionTimelineEvent`, registrar `audit_logs` central e disparar eventos para Automation/Analytics.

### BillingInvoice

Estados: `draft`, `open`, `partially_paid`, `paid`, `overdue`, `canceled`, `refunded`, `written_off`.

`BillingInvoice` é documento comercial de cobrança, não o título financeiro. Ao emitir, pode gerar `financial_transactions` com `reference_type = billing_invoice` e status `pending`. Ao pagar, Finance continua responsável pela baixa via `TenantFinancialTransactionService::pay`.

Transições principais:

- `draft -> open|canceled`
- `open -> partially_paid|paid|overdue|canceled|written_off`
- `partially_paid -> paid|overdue|written_off|refunded`
- `overdue -> paid|partially_paid|written_off|canceled`
- `paid -> refunded|chargeback_handling`, se Payments futuro expuser contestação

Transições proibidas: `paid -> open` silencioso, `canceled -> paid`, fechamento duplicado do mesmo ciclo.

Efeitos colaterais esperados:

- `open`: pode solicitar criação de `financial_transactions`.
- `paid`: é consequência de baixa financeira ou confirmação de pagamento, não cálculo próprio de Billing.
- `written_off`: deve refletir decisão financeira autorizada.
- `refunded`: deve gerar ajuste/estorno em Finance e, quando Payments existir, no `PaymentAttempt`, sem reabrir cobrança silenciosamente.

### PaymentAttempt futuro

Estados: `pending`, `processing`, `authorized`, `paid`, `failed`, `canceled`, `refunded`, `chargeback`.

Como não há Payments/gateway hoje, `PaymentAttempt` não é necessário para o MVP. Tentativas manuais podem ser registradas como ação financeira e auditoria. Quando Payments existir, `PaymentAttempt` deve nascer no contexto correto e esses estados mapearão callbacks/webhooks e polling.

Status da assinatura, invoice, payment attempt e financial transaction são independentes:

- Subscription: situação contratual.
- BillingInvoice: documento/cobrança calculada.
- PaymentAttempt: tentativa de cobrança.
- FinancialTransaction: título financeiro, baixa e caixa.

## 7. Ciclos e renovações

O Orchestra deve possuir motor próprio de renovação. O padrão atual para processos por tenant é command que itera `CompanySubdomain` e executa callbacks via `TenantMigrationService::runInSchema`, como `cashback:process`, `checklists:generate-occurrences` e `checklists:mark-overdue` em `routes/console.php`.

Jobs/commands futuros:

- `subscriptions:open-cycles {--tenant=}`
- `subscriptions:close-cycles {--tenant=}`
- `subscriptions:renew {--tenant=}`
- `billing:issue-invoices {--tenant=}`
- `billing:mark-overdue {--tenant=}`
- `dunning:run {--tenant=}`

Periodicidades suportadas devem aproveitar o padrão já aceito em Catalog: `weekly`, `monthly`, `quarterly`, `semiannual`, `annual`, `custom`. Se forem necessárias `bimonthly` e outras, adicionar de forma compatível ao `CatalogItemService::BILLING_CYCLES` ou criar enum/política oficial.

Cada ciclo deve ter chave única por `subscription_id + period_start + period_end` e locks em fechamento/renovação.

## 8. Trial, ativação e fidelidade

O backend atual só possui `trial_days` em `catalog_subscription_details`; não há motor de trial. Subscriptions deve criar:

- Trial gratuito: `trialing` sem invoice inicial ou com invoice zero.
- Trial pago: invoice inicial e ativação conforme pagamento.
- Ativação imediata, futura ou após pagamento.
- Fidelidade: campos/política em snapshot e cálculo de multa por Billing.
- Expiração/conversão de trial por command tenant-aware.

Produto deve decidir se trial pode ser configurado por item de catálogo, por política da empresa ou por contrato individual.

## 9. Upgrade, downgrade e alterações

Alterações devem seguir o padrão de auditoria já usado por Catalog, Sales e Contracts: capturar `before`, `after`, `company_id`, `tenant_user_id`, `schema/subdomain` e registrar no `AuditLogService`.

`SubscriptionChange` deve registrar:

- Tipo: upgrade, downgrade, troca de plano, add-on, remoção, quantidade, unidade, titularidade, pagador, desconto, política, cancelamento agendado.
- Aplicação: imediata ou próximo ciclo.
- Pro-rata, crédito/débito e invoice gerada.
- Referências a `catalog_item_id`, `sales_order_id`, `contract_id`, `billing_invoice_id`.

Pro-rata deve usar decimal com arredondamento determinístico enquanto o projeto mantiver `decimal(16,2)`. A recomendação futura de centavos exige migração transversal de Finance/Sales/Catalog.

## 10. Pausa, suspensão, cancelamento e reativação

Pausa solicitada pelo cliente (`SubscriptionPause`) não é inadimplência. Suspensão por inadimplência nasce de Dunning. Suspensão administrativa exige permissão e auditoria.

Cancelamento:

- Pode ser imediato ou ao fim do ciclo.
- Deve gerar `SubscriptionCancellation`.
- Não apaga invoices, financial transactions, payment attempts, credits ou MRR movements.
- Deve respeitar contrato vinculado: cancelar assinatura não cancela automaticamente `Contract` sem comando explícito, e cancelar contrato deve acionar avaliação das assinaturas vinculadas.

Reativação:

- Deve validar dívidas abertas, política, contrato e snapshot.
- Pode retomar a assinatura anterior ou criar nova assinatura conforme decisão de produto.

## 11. Billing

Billing é o bounded context de cobrança recorrente. Seu aggregate root é `BillingInvoice`.

Billing deve calcular:

- Preço fixo, por unidade, faixas, volume, consumo e modelo híbrido.
- Descontos, cupons, créditos, multa, juros, impostos, pro-rata, arredondamento e parcelas.
- Fatura consolidada por cliente/pagador ou fatura por assinatura, conforme política.
- Cobrança antecipada e cobrança posterior ao uso.

Fronteira com Finance:

- BillingInvoice: documento comercial calculado.
- FinancialTransaction: título financeiro/contas a receber existente em `financial_transactions`.
- Payment/baixa: `TenantFinancialTransactionService::pay`.
- Competência/fechamento: `FinancialPeriodService`.

Contrato de dependência:

- Billing pode solicitar/criar um recebível em Finance a partir de uma invoice emitida.
- Finance pode ler dados da invoice para descrever o título financeiro.
- Finance nunca recalcula itens, descontos, consumo, pro-rata ou total de Billing.
- Billing nunca baixa caixa, altera saldo de conta financeira ou fecha competência.
- Payments deve liquidar ou falhar contra o recebível/tentativa de pagamento; a baixa final continua em Finance.

Billing não deve duplicar `financial_accounts`, `financial_periods` ou `royalty_calculations`.

## 12. Cobrança por consumo

`UsageRecord` deve ser tabela nova no schema tenant. Campos mínimos: `subscription_id`, `subscription_item_id`, `source`, `external_id`, `period_start`, `period_end`, `measured_at`, `unit_of_measure`, `quantity`, `status`, `idempotency_key`, `correction_of_id`, `metadata`.

Regras:

- Chave única por fonte/idempotência.
- Correção e estorno por registro compensatório.
- Consumo fechado/faturado não é editado diretamente.
- Consumo atrasado entra em invoice futura ou complementar.
- Auditoria central para importações e correções.

## 13. Inadimplência e régua de cobrança

Separar três conceitos:

- **DunningPolicyVersion:** configuração/versionamento da régua.
- **DunningProcess:** execução da régua para uma `BillingInvoice`.
- **DunningAction:** cada tentativa/ação, como lembrete, cobrança, WhatsApp, suspensão, cancelamento ou write-off.

Configuração por empresa/unidade/contrato deve permitir D-3, D0, D+1, D+3, D+5, D+10 e D+30, além de multa, juros, tolerância, retentativas, canais e reativação.

Automation/Communication:

- Dunning não envia WhatsApp/e-mail diretamente.
- Deve emitir eventos como `billing.invoice.overdue`, `payment.failed`, `subscription.suspended`, `subscription.recovered`.
- `config/automation.php` deverá receber novos eventos para regras `send_email`, `send_whatsapp`, `create_task`, `create_noc_alert` ou `audit_only`.

## 14. MRR, ARR e métricas

Separar responsabilidades:

- **Contracted MRR:** pertence a Subscriptions; valor recorrente contratado e normalizado, independente de pagamento.
- **Billable MRR:** pertence a Billing; valor faturável no ciclo após descontos, pausas e créditos recorrentes.
- **Delinquent MRR:** interseção Subscriptions/Billing/Dunning; MRR contratado com invoice vencida relevante.
- **Collected Recurring Revenue:** pertence a Finance; receita recorrente efetivamente baixada como paga.
- **ARR:** derivado de Contracted ou Billable MRR, conforme dashboard.
- **Expansion, Contraction, Churn, Reactivation:** movimentos em `MrrMovement`.

Normalização:

- Mensal R$ 200 -> MRR R$ 200.
- Anual R$ 1.200 -> MRR R$ 100.
- Trimestral R$ 600 -> MRR R$ 200.

Analytics atual já possui registry em `config/analytics.php`. Métricas recorrentes devem entrar por handlers próprios, não por cálculo ad hoc em controllers.

## 15. Configuração por rede

A entidade real de rede/franqueadora/empresa é `Company`. No schema tenant, configurações atuais ficam em:

- `tenant_settings`: timezone, currency, network_type, unit_management_mode, preferências.
- `catalog_settings`: governança de catálogo e overrides por unidade.
- tabelas específicas, como `royalty_rules` e `royalty_assignments`.

Políticas futuras:

- `subscription_policy`
- `billing_policy`
- `dunning_policy`
- `cancellation_policy`
- `price_adjustment_policy`
- `trial_policy`
- `renewal_policy`

Recomendação: criar tabela versionada genérica ou específica como `subscription_policy_versions` e `dunning_policy_versions`, com escopo `company`, `unit`, `contract`, `effective_from`, `effective_until`, `settings_json`, `created_by`, `published_at`. A assinatura deve referenciar a versão aplicada e copiar snapshot.

Unidade só pode sobrescrever política se a empresa permitir, seguindo o precedente de `CatalogSettingsService`.

## 16. Franqueadora, unidade e propriedade econômica

Modelo real:

- Tenant/rede/franqueadora/empresa: `Company` no banco central.
- Subdomínio/schema: `CompanySubdomain`.
- Unidade/filial: `Unit` no schema tenant.
- Usuários: `User`, com `company_id` injetado no tenant auth em PostgreSQL e vínculo com unidades por `user_unit`.

Não há `network_id` real. Subscriptions/Billing não devem criar `network_id` até existir decisão de plataforma. Usar `company_id` apenas em auditoria/central; nas tabelas tenant, o schema já identifica a empresa.

Ownership econômico proposto em `Subscription`:

- `unit_id`: unidade operacional/prestadora.
- `seller_user_id`: vendedor/usuário.
- `payer_customer_id` ou `payer_id`: pagador, se diferente do cliente.
- `economic_owner_unit_id`: unidade dona da receita, se produto decidir.
- `billing_owner_unit_id`: unidade responsável pela cobrança.
- `receivable_owner_unit_id`: unidade/empresa que receberá o financeiro.

Royalties e repasses continuam fora de Subscriptions. No curto prazo, usam o módulo atual de Royalties; no roadmap, devem migrar conceitualmente para Revenue Settlement.

Revenue Settlement futuro:

```text
Revenue Settlement
├── Royalties
├── Split
├── Commissions
├── Transfers
└── Settlement Cycles
```

Subscriptions e Billing devem fornecer contexto econômico suficiente para Revenue Settlement, mas não calcular split, comissão, royalties avançados, repasse de marketplace ou transferência entre participantes.

## 17. Integração com Payments

Não há módulo Payments dedicado, contrato de providers de pagamento, armazenamento de eventos externos financeiros, webhook de pagamento ou conciliação de gateway no backend analisado.

Integração futura deve criar:

- `PaymentProviderContract`
- `PaymentMethodToken`
- `PaymentAttempt`
- `PaymentWebhookEvent`
- `PaymentReconciliationRun`
- Services/adapters por provider.

Contratos conceituais:

- `createCharge`
- `retryCharge`
- `cancelCharge`
- `refundPayment`
- `fetchPaymentStatus`
- `tokenizePaymentMethod`

Até Payments existir, Billing deve gerar `financial_transactions` pendentes e permitir cobrança/baixa manual via Finance. `PaymentAttempt` não deve ser criado no MVP salvo decisão explícita; se isso ocorrer, a persistência inicial em Billing será técnica e o ownership conceitual/API futura permanecerá em Payments.

Quando Payments existir, a dependência esperada é:

```text
BillingInvoice
   ├── FinancialTransaction/Receivable
   └── PaymentAttempt -> Provider

PaymentAttempt -> Finance/Billing
```

Payments não deve decidir renovação, valor contratado, desconto, pro-rata ou MRR. Payments executa a cobrança e informa resultado de pagamento. Finance confirma baixa/caixa; Billing reflete o estado financeiro sem recalcular a invoice.

## 18. Eventos de domínio

O backend usa:

- Eventos Laravel em `app/Events` para Onboarding.
- `Event::dispatch` com strings em Sales.
- `AuditLogService` para trilha central.
- `AutomationEngineService` para eventos configuráveis.

Decisão: Subscriptions/Billing devem usar eventos Laravel para integração interna, auditoria central para histórico e `SubscriptionTimelineEvent` para timeline operacional. Isso não é event sourcing. Não há outbox hoje; se integrações externas/gateways exigirem confiabilidade transacional, criar outbox futura.

Eventos mínimos:

- `subscription.created`
- `subscription.activated`
- `subscription.trial_started`
- `subscription.renewed`
- `subscription.past_due`
- `subscription.suspended`
- `subscription.paused`
- `subscription.resumed`
- `subscription.changed`
- `subscription.cancellation_scheduled`
- `subscription.canceled`
- `subscription.reactivated`
- `billing.cycle.opened`
- `billing.cycle.closed`
- `billing.invoice.created`
- `billing.invoice.issued`
- `billing.invoice.paid`
- `billing.invoice.overdue`
- `payment.attempt_failed`
- `dunning.started`
- `dunning.completed`
- `mrr.changed`

Cada evento deve ter produtor, payload mínimo, `company_id` via contexto/auditoria, schema/subdomain, unit_id quando houver e chave de idempotência.

## 19. Jobs e processamento assíncrono

O padrão atual é Laravel queue database (`config/queue.php`) e commands closures em `routes/console.php` que iteram tenants. Não há Horizon nem pasta `app/Jobs` com jobs de domínio analisados.

Para Subscriptions/Billing:

- Criar commands tenant-aware primeiro, seguindo `cashback:process` e checklists.
- Se forem criados Jobs, incluir `subdomain`/schema no payload e executar o handler dentro de `TenantMigrationService::runInSchema`.
- Usar locks de banco (`lockForUpdate`) para ciclos, invoices e pagamentos, como Finance/Royalties já fazem.
- Usar failed jobs padrão `failed_jobs`.
- Definir retries/backoff por job quando passar de command síncrono para queue.

Jobs/commands mínimos: abertura/fechamento de ciclos, geração/emissão de invoices, renovação, cobrança, webhooks futuros, dunning, suspensão, cancelamento, MRR e reconciliação.

## 20. Permissões e governança

Padrão real: permissões `tenant.modulo.acao` em `database/tenant_seeders/TenantPermissionsSeeder.php`, checadas por `authorizeTenant` em controllers e `AccessControlService`.

Permissões propostas:

- `tenant.subscriptions.view`
- `tenant.subscriptions.create`
- `tenant.subscriptions.update`
- `tenant.subscriptions.activate`
- `tenant.subscriptions.change_plan`
- `tenant.subscriptions.discount`
- `tenant.subscriptions.pause`
- `tenant.subscriptions.suspend`
- `tenant.subscriptions.cancel`
- `tenant.subscriptions.reactivate`
- `tenant.subscriptions.configure`
- `tenant.subscriptions.export`
- `tenant.billing.view`
- `tenant.billing.invoices.issue`
- `tenant.billing.invoices.cancel`
- `tenant.billing.manual_charge`
- `tenant.billing.write_off`
- `tenant.billing.apply_credit`
- `tenant.billing.refund`
- `tenant.billing.configure`
- `tenant.dunning.view`
- `tenant.dunning.manage`
- `tenant.mrr.view`
- `tenant.mrr.export`

Perfis devem respeitar papéis atuais (`company_admin`, usuários de unidade, financeiro, gestor, atendente) e escopo por unidade.

## 21. Auditoria

Usar `AuditLogService` e `audit_logs` central. O padrão de auditoria tenant executa `TenantMigrationService::runInPublic` e grava `company_id`, `tenant_type`, `before`, `after`, `metadata.schema`, `metadata.subdomain` e `metadata.tenant_user_id`.

Auditar obrigatoriamente:

- criação/ativação/alteração/cancelamento/reativação de assinatura;
- snapshot contratual;
- descontos, créditos, write-off, refund;
- emissão/cancelamento de invoice;
- tentativa de pagamento;
- alteração de política/versionamento;
- uso/correção de consumo;
- dunning e suspensão;
- reprocessamento administrativo.

Não criar pacote paralelo de auditoria.

## 22. APIs futuras

Seguir `routes/company.php` para módulos tenant administrativos/operacionais:

- `GET /api/company/subscriptions`
- `POST /api/company/subscriptions`
- `GET /api/company/subscriptions/{id}`
- `PUT /api/company/subscriptions/{id}`
- `POST /api/company/subscriptions/{id}/activate`
- `POST /api/company/subscriptions/{id}/change`
- `POST /api/company/subscriptions/{id}/pause`
- `POST /api/company/subscriptions/{id}/resume`
- `POST /api/company/subscriptions/{id}/suspend`
- `POST /api/company/subscriptions/{id}/cancel`
- `POST /api/company/subscriptions/{id}/reactivate`
- `GET /api/company/subscriptions/{id}/cycles`
- `GET /api/company/billing/invoices`
- `POST /api/company/billing/invoices`
- `GET /api/company/billing/invoices/{id}`
- `POST /api/company/billing/invoices/{id}/issue`
- `POST /api/company/billing/invoices/{id}/cancel`
- `POST /api/company/billing/invoices/{id}/charge`
- `POST /api/company/billing/invoices/{id}/write-off`
- `GET /api/company/billing/invoices/{id}/dunning`
- `GET /api/company/usage-records`
- `POST /api/company/usage-records`
- `GET /api/company/dunning/processes`
- `POST /api/company/dunning/processes/{id}/run-action`
- `GET /api/company/subscriptions/mrr`
- `GET/PUT /api/company/subscriptions/settings`

Usar envelopes `data`/`meta`, paginação Laravel, filtros por status, cliente, unidade, contrato, datas, payload `snake_case` e Resources/Requests quando necessário.

## 23. Estrutura modular proposta

O backend real não usa `Modules/`. Proposta aderente:

```text
app/
  Models/
    Subscription.php
    SubscriptionItem.php
    SubscriptionCycle.php
    SubscriptionChange.php
    SubscriptionPause.php
    SubscriptionCancellation.php
    SubscriptionTimelineEvent.php
    BillingInvoice.php
    BillingInvoiceItem.php
    DunningPolicyVersion.php
    DunningProcess.php
    DunningAction.php
    UsageRecord.php
    SubscriptionCredit.php
    MrrMovement.php
  Services/
    SubscriptionService.php
    SubscriptionPolicyService.php
    SubscriptionCycleService.php
    UsageRecordService.php
    MrrService.php
    BillingInvoiceService.php
    BillingCalculatorService.php
    DunningService.php
  Http/
    Controllers/Api/
      SubscriptionController.php
      BillingInvoiceController.php
      UsageRecordController.php
      DunningController.php
    Requests/
    Resources/
  Events/
  Policies/
database/
  tenant_migrations/
  tenant_seeders/
```

Se a plataforma adotar módulos PHP no futuro, este desenho pode migrar, mas hoje deve seguir a organização por camada.

Quando Payments for implementado, `PaymentAttempt`, provider contracts, webhooks e reconciliação devem nascer no contexto de Payments. Eles não fazem parte da fundação inicial de Subscriptions/Billing.

## 24. Banco de dados

Tabelas novas no schema tenant, sem `tenant_id` por padrão:

- `subscription_policy_versions`: escopo, versão, JSON de políticas, vigência e publicação.
- `subscriptions`: IDs incrementais, `customer_id`, `unit_id`, `contract_id`, `sales_order_id`, status, datas, moeda, snapshots JSON, owners e índices por status/renovação/unidade/cliente.
- `subscription_items`: FK assinatura, `catalog_item_id`, snapshot JSON, quantidade, preço, desconto, periodicidade.
- `subscription_cycles`: período contratual/serviço, status e chave única por assinatura/período. Não deve depender de `billing_invoice_id`; a invoice referencia o ciclo quando houver cobrança.
- `subscription_changes`, `subscription_pauses`, `subscription_cancellations`, `subscription_timeline_events`.
- `billing_invoices`, `billing_invoice_items`: aggregate de Billing, documento comercial, status, valores `decimal(16,2)`, due_date, issued_at, `subscription_id`, `subscription_cycle_id` opcional e `financial_transaction_id`.
- `dunning_policy_versions`, `dunning_processes`, `dunning_actions`.
- `usage_records`: consumo e idempotência.
- `subscription_credits`: saldo/origem/expiração.
- `mrr_movements`: ledger explicável.

Tabelas futuras de Payments, fora do MVP sem gateway:

- `payment_attempts`: invoice/receivable, status, amount, provider, external_reference, idempotency_key.
- `payment_webhook_events`: payload externo sanitizado, assinatura, idempotência e correlação.
- `payment_reconciliation_runs`: execuções de conciliação por provider/período.

Reutilizar:

- `financial_transactions` para título/recebível.
- `financial_accounts` para conta.
- `financial_periods` para competência.
- `audit_logs` para auditoria.
- `royalty_*` para royalties atuais.

## 25. Invariantes

- Assinatura cancelada não renova.
- Ciclo não fecha duas vezes.
- Invoice paga não volta silenciosamente para aberta.
- PaymentAttempt duplicado não gera duas baixas, quando Payments existir.
- BillingInvoice emitida pode gerar no máximo um título financeiro ativo por chave idempotente.
- `financial_transactions` pagas não são editadas diretamente, coerente com `TenantFinancialTransactionService`.
- Mudança no Catalog não altera snapshot ativo.
- MRR sempre nasce de `MrrMovement`.
- Unidade sem permissão não acessa assinatura de outra unidade.
- Período financeiro fechado bloqueia alterações com efeito financeiro, seguindo `FinancialPeriodService::assertOpen`.

## 26. Segurança e multi-tenancy

Controles obrigatórios:

- Resolver tenant por subdomínio e middleware existentes.
- Executar queries tenant no schema correto.
- Usar `TenantUnitScopeService` em list/show e `authorize` em comandos com `unit_id`.
- Validar preço no servidor via Catalog, não confiar no frontend.
- Proteger snapshots contra edição direta.
- Sanitizar tokens/provider payloads, seguindo padrão de Communication.
- Webhooks futuros com assinatura, idempotência, replay protection e armazenamento bruto sanitizado.
- Auditoria central para qualquer ação sensível.

Riscos: vazamento entre schemas, escopo de unidade em metadata financeira, manipulação de desconto/crédito, cancelamento indevido, replay de webhook futuro, exposure de tokens de pagamento.

## 27. Observabilidade

Usar logs Laravel, `audit_logs`, métricas Analytics e NOC/Automation. Alertas:

- ciclos atrasados;
- invoices não emitidas;
- invoices vencidas;
- divergência Billing x Finance;
- jobs/commands por tenant falhando;
- dunning com alta falha;
- MRR inconsistente;
- uso duplicado;
- duplicidade de cobrança;
- gateway/webhook futuro rejeitado.

Todo log operacional deve incluir subdomain/schema, company_id quando disponível, unit_id, subscription_id, invoice_id, command/job e correlation/idempotency key quando houver.

## 28. Estratégia de implementação

O primeiro plano implementável deve cobrir somente `Subscriptions Foundation`: `Subscription`, `SubscriptionItem`, `SubscriptionCycle`, snapshots, estados e transições, permissões, auditoria e eventos. Sem Payments, dunning, consumo, Pricing ou Entitlements nessa primeira fase.

| Fase | Objetivo | Dependências | Entregáveis | Riscos | Critérios de aceite | Testes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Subscriptions Foundation | Catalog atual, tenant migrations, RBAC, auditoria | Subscription, SubscriptionItem, SubscriptionCycle, snapshots, estados, permissões, auditoria, eventos | acoplar Billing/Pricing cedo demais | assinatura criada com snapshot, ciclo previsto e auditoria | unit/feature tenant |
| 2 | Billing invoice fixa | fase 1, Catalog/Sales, Finance | BillingInvoice, emissão, título financeiro pendente | duplicidade de financeiro | invoice gera `financial_transactions` idempotente | feature com schema tenant |
| 3 | Alterações/pro-rata | fases 1-2 | SubscriptionChange, credits, MRR movements | cálculo monetário | alteração explicável por ledger | unit de cálculo |
| 4 | Payments futuro | fase 2 | contratos provider, PaymentAttempt, webhooks | gateway acoplar domínio | provider fake e idempotência | integration fake |
| 5 | Dunning | Billing/Finance/Automation | policies, processes/actions, suspensão | suspensão indevida | régua executa sem enviar comunicação direta | feature/command |
| 6 | Consumo | Billing | UsageRecord, fechamento por uso | consumo duplicado/atrasado | idempotência por fonte | unit/feature |
| 7 | Métricas | events/ledger | MRR/ARR/churn handlers Analytics | números inexplicáveis | dashboard rastreável ao ledger | unit agregações |
| 8 | Royalties/Settlement | Finance/Royalties | integração pós-pagamento e base recorrente | duplicar Royalties | royalties usam bases existentes/evoluídas | feature royalties |

## 29. Fora de escopo inicial

Fora da primeira implementação:

- contabilidade completa;
- emissão fiscal municipal/nacional;
- múltiplos gateways simultâneos por assinatura;
- split avançado;
- cobrança internacional;
- reconhecimento contábil avançado;
- marketplace;
- securitização;
- recuperação judicial de crédito;
- Revenue Settlement completo além do módulo Royalties atual;
- migração global de money para centavos;
- event sourcing/outbox, salvo decisão técnica futura.
- Payments, gateway, webhook, conciliação e `PaymentAttempt`;
- dunning automatizado;
- consumo medido;
- Pricing como bounded context extraído;
- Entitlements como bounded context extraído.

## 30. Questões em aberto

As questões abaixo devem ser decididas no decision log `docs/architecture/subscriptions-product-decisions.md` antes do plano implementável. O contrato arquitetural está tecnicamente aprovado para planejamento, mas migrations e services dependem dessas escolhas.

- Produto confirma `Company` como “rede/franqueadora” em todos os contextos ou será criada entidade Network?
- Contrato será obrigatório para todos os tipos de assinatura ou apenas para planos com fidelidade/documento?
- Um contrato pode gerar múltiplas assinaturas? Recomendação técnica: sim, 1:N opcional.
- Assinatura pode existir sem venda (`sales_order_id`) para migração/importação?
- Unidade pode criar planos recorrentes próprios além do Catalog local?
- Quais políticas podem ser sobrescritas por unidade?
- Qual política padrão de inadimplência?
- Quando reconhecer receita: emissão, competência, pagamento ou prestação?
- Como tratar impostos e nota fiscal?
- Billing consolidará múltiplas assinaturas em uma invoice no MVP?
- Quais gateways entram primeiro?
- Quem pode conceder desconto/crédito/write-off?
- Como diferenciar recebedor financeiro, proprietário econômico e unidade prestadora?
- Métrica oficial principal será Contracted MRR ou Billable MRR?
- Automação enviará comunicação por rules ou haverá jornada dedicada de comunicação?
