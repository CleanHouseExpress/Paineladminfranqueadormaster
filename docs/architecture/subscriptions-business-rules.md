# Subscriptions Business Rules

## Fase 3A - Policy Engine

A Fase 3A introduz um configurador versionado de politicas para assinaturas recorrentes. A entidade persistida e `tenant_policy_versions`, no schema do tenant, com escopo `company`, `unit` ou `contract`, status `draft`, `published`, `superseded` ou `archived`, vigencia e JSON de `settings`/`governance`.

Nesta fase, as politicas sao contratuais e explicativas. Elas nao executam prorata real, credito, refund, pagamento, gateway, dunning ou entitlement. O simulador pode estimar e explicar efeitos, mas retorna explicitamente que nao cria invoice, credito, refund ou pagamento.

## Tipos De Politica

- `subscription`: regras de upgrade, downgrade, cancelamento, reativacao, trial e renewal.
- `billing`: dia de vencimento, arredondamento, matriz pos-faturamento, credit policy futura e limites de desconto.
- `metrics`: leitura de MRR, trial, pausa, churn e forecast.

## Governanca

Campos podem ser marcados como:

- `locked`: unidade/contrato nao podem alterar.
- `unit_can_override`: unidade pode sobrescrever.
- `unit_can_restrict_only`: unidade pode reduzir limite numerico, mas nao ampliar.
- `operator_can_choose`: runtime futuro deve registrar a escolha do operador.
- `requires_approval`: alteracao exige aprovacao em runtime futuro.

## Snapshot

Na ativacao de uma assinatura, o backend resolve a politica efetiva por ordem:

1. defaults Orchestra;
2. politica publicada da rede;
3. politica publicada da unidade;
4. politica publicada do contrato.

O resultado e congelado em `subscriptions.policy_snapshot`, e a versao de subscription aplicada fica em `subscriptions.policy_version_id`/`policy_applied_at`.

## Limites Da Fase 3A

Nao pertencem a esta fase:

- execucao real de upgrade/downgrade;
- prorata;
- creditos reais;
- refunds;
- payments;
- gateways;
- PIX, boleto, cartao;
- webhooks;
- dunning;
- entitlements;
- pricing completo;
- settlement;
- consumo ou split.
