# Decision log: Subscriptions e Billing recorrente

## Decisao - Fase 3A Policy Engine

- Politicas de recorrencia ficam no schema do tenant em `tenant_policy_versions`.
- O escopo de aplicacao e `company`, `unit` ou `contract`.
- A publicacao supersede a politica publicada anterior do mesmo tipo/escopo.
- Drafts podem ser editados; versoes publicadas/superseded/archived sao imutaveis.
- A assinatura congela a politica efetiva na ativacao.
- Billing policy e metrics policy sao registradas como contrato de comportamento, mas nao executam faturamento real nesta fase.
- O simulador da Fase 3A nao cria invoice, transacao financeira, credito, refund, pagamento ou entitlement.

**Status:** Aberto para rodada de decisões de produto.

**Versão:** 0.1

**Data:** 2026-07-10

**Origem:** seção 30 de `docs/architecture/subscriptions-and-recurring-billing.md`.

**Objetivo:** converter as questões pendentes de produto em decisões rastreáveis antes do plano implementável de Subscriptions Foundation.

## Modelo de decisão

Para cada decisão:

- Decisão
- Alternativas consideradas
- Escolha
- Motivação
- Impacto técnico
- Impacto no MVP
- Pode mudar no futuro?

## Decisões pendentes

### D01. Company ou Network

**Decisão:** confirmar se `Company` representa "rede/franqueadora" em todos os contextos ou se será criada entidade `Network`.

**Alternativas consideradas:** usar `Company`; criar `Network`; criar alias conceitual sem tabela nova.

**Escolha:** pendente.

**Motivação:** Subscriptions/Billing não devem introduzir `network_id` sem decisão de plataforma.

**Impacto técnico:** afeta migrations, snapshots, auditoria, escopo financeiro e relatórios.

**Impacto no MVP:** alto se houver nova entidade; baixo se `Company` permanecer como referência oficial.

**Pode mudar no futuro?** Sim, mas exigirá migração transversal.

### D02. Obrigatoriedade de contrato

**Decisão:** definir se toda assinatura exige `contract_id`.

**Alternativas consideradas:** contrato obrigatório; contrato opcional; obrigatório apenas para fidelidade/documento.

**Escolha:** pendente.

**Motivação:** contratos têm ownership jurídico/comercial, mas assinatura é o motor recorrente.

**Impacto técnico:** afeta validação, criação de assinatura, importação e relacionamento 1:N.

**Impacto no MVP:** alto.

**Pode mudar no futuro?** Sim, com cuidado para assinaturas legadas.

### D03. Assinatura sem venda

**Decisão:** permitir criação/importação de assinatura sem `sales_order_id`.

**Alternativas consideradas:** sempre exigir venda; permitir importação/admin; permitir criação direta operacional.

**Escolha:** pendente.

**Motivação:** migrações e contratos legados podem não ter venda formal no Orchestra.

**Impacto técnico:** afeta comandos de criação, auditoria, permissões e snapshots comerciais.

**Impacto no MVP:** médio.

**Pode mudar no futuro?** Sim.

### D04. Catálogo local e políticas por unidade

**Decisão:** definir se unidade pode criar planos recorrentes próprios e quais políticas pode sobrescrever.

**Alternativas consideradas:** apenas catálogo corporativo; catálogo local governado; sobrescrita seletiva por unidade.

**Escolha:** pendente.

**Motivação:** o backend já possui governança de Catalog e `CatalogUnitPrice`.

**Impacto técnico:** afeta resolução de preço/snapshot, permissões e escopo por unidade.

**Impacto no MVP:** médio.

**Pode mudar no futuro?** Sim, mas afeta contratos ativos apenas via novas assinaturas ou alterações explícitas.

### D05. Política padrão de inadimplência

**Decisão:** definir tolerância, suspensão, cancelamento, comunicação e write-off padrão.

**Alternativas consideradas:** manual no MVP; régua simples; régua configurável por empresa/unidade/contrato.

**Escolha:** pendente.

**Motivação:** dunning automatizado ficou fora da primeira fase.

**Impacto técnico:** afeta estados de assinatura, BillingInvoice, Automation e Finance.

**Impacto no MVP:** baixo se manual; alto se automatizado.

**Pode mudar no futuro?** Sim.

### D06. Reconhecimento de receita

**Decisão:** definir quando reconhecer receita: emissão, competência, pagamento ou prestação.

**Alternativas consideradas:** emissão da invoice; competência financeira; baixa/pagamento; prestação de serviço.

**Escolha:** pendente.

**Motivação:** Finance é dono de competência, caixa e baixa.

**Impacto técnico:** afeta relatórios financeiros, Analytics, Revenue Settlement e fechamento de período.

**Impacto no MVP:** médio.

**Pode mudar no futuro?** Sim, com migração de relatórios.

### D07. Impostos e nota fiscal

**Decisão:** definir escopo fiscal inicial.

**Alternativas consideradas:** fora do MVP; campos informativos; integração fiscal futura.

**Escolha:** pendente.

**Motivação:** emissão fiscal ficou fora do escopo inicial.

**Impacto técnico:** afeta invoice items, snapshots e integrações futuras.

**Impacto no MVP:** baixo se fora do MVP.

**Pode mudar no futuro?** Sim.

### D08. Invoice consolidada

**Decisão:** definir se Billing consolidará múltiplas assinaturas em uma invoice no MVP.

**Alternativas consideradas:** uma invoice por assinatura/ciclo; invoice consolidada por cliente; invoice consolidada por pagador.

**Escolha:** pendente.

**Motivação:** consolidação aumenta complexidade de ciclo, baixa e cancelamento.

**Impacto técnico:** afeta aggregate `BillingInvoice`, idempotência, relacionamento com ciclos e Finance.

**Impacto no MVP:** alto.

**Pode mudar no futuro?** Sim, mas deve ser planejado como evolução.

### D09. Primeiro gateway

**Decisão:** definir se haverá gateway no primeiro ciclo de implementação e qual será.

**Alternativas consideradas:** sem gateway, baixa manual via Finance; PIX; boleto; cartão; provider fake primeiro.

**Escolha:** pendente.

**Motivação:** Payments ficou como contexto futuro.

**Impacto técnico:** afeta necessidade de `PaymentAttempt`, webhooks, idempotência e reconciliação.

**Impacto no MVP:** alto se gateway entrar; baixo se manual.

**Pode mudar no futuro?** Sim.

### D10. Descontos, créditos, write-off e refund

**Decisão:** definir quem pode conceder desconto, crédito, baixa por perda e estorno.

**Alternativas consideradas:** somente admin financeiro; gestor por unidade; regra por perfil/permissão; workflow de aprovação.

**Escolha:** pendente.

**Motivação:** ações financeiras sensíveis exigem auditoria e RBAC claro.

**Impacto técnico:** afeta permissões, auditoria, Finance e Billing.

**Impacto no MVP:** médio.

**Pode mudar no futuro?** Sim.

### D11. Ownership econômico

**Decisão:** diferenciar unidade prestadora, proprietária econômica, responsável pela cobrança e recebedora financeira.

**Alternativas consideradas:** todos iguais a `unit_id`; campos separados em snapshot; resolução por política.

**Escolha:** pendente.

**Motivação:** Royalties e Revenue Settlement dependem dessa distinção.

**Impacto técnico:** afeta snapshots, Billing, Finance, Royalties e Analytics.

**Impacto no MVP:** alto se houver repasse/royalty imediato.

**Pode mudar no futuro?** Sim, mas contratos ativos exigem preservação de snapshot.

### D12. Métrica principal de MRR

**Decisão:** definir métrica oficial principal: Contracted MRR ou Billable MRR.

**Alternativas consideradas:** Contracted MRR; Billable MRR; ambas com nomes explícitos.

**Escolha:** pendente.

**Motivação:** Analytics precisa evitar números incompatíveis entre produto, financeiro e operação.

**Impacto técnico:** afeta `MrrMovement`, dashboards e relatórios.

**Impacto no MVP:** médio.

**Pode mudar no futuro?** Sim, mas deve manter histórico explicável.

### D13. Comunicação e automação

**Decisão:** definir se comunicação de assinatura/cobrança será por Automation rules ou jornada dedicada.

**Alternativas consideradas:** Automation rules; jornada dedicada; híbrido.

**Escolha:** pendente.

**Motivação:** Subscriptions/Billing não devem enviar WhatsApp/e-mail diretamente.

**Impacto técnico:** afeta eventos, `config/automation.php`, Communication e auditoria.

**Impacto no MVP:** baixo se comunicação ficar manual; médio se houver regras.

**Pode mudar no futuro?** Sim.
