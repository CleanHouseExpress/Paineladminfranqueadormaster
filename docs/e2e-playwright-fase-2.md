# E2E Regression Suite — Fase 2

A Fase 2 evolui a suite Playwright para duas camadas:

```bash
npm run test:e2e       # regressao rapida: specs @smoke
npm run test:e2e:full  # regressao completa: @smoke + @release
```

## Organizacao

Os 8 specs da Fase 1 foram preservados e marcados com `@smoke`.

Os specs da Fase 2 ficam organizados por jornada:

```txt
tests/e2e/security
tests/e2e/commercial
tests/e2e/financial
tests/e2e/inventory
tests/e2e/operations
tests/e2e/analytics
tests/e2e/portal-franqueado
```

## Tags

```txt
@smoke
@release
@security
@commercial
@financial
@inventory
@analytics
@portal
```

## Escopo Fase 2

- navegacao critica e health check de rotas
- seguranca e isolamento basico Centro/Norte
- jornada comercial lead → vendas → financeiro
- fechamento financeiro, DRE, metas, historico, projecao e royalties
- Inventory Fase 2, transferencias, contagens e configuracoes
- Checklist → Inventory → CMV
- Analytics templates e dashboard corporativo no portal
- NOC, Automation e Tasks
- Portal franqueado completo por unidade
- configuracao por tenant

Os testes evitam `waitForTimeout`, usam seed idempotente e preferem seletores estaveis ou contratos visiveis de pagina.

## CI

O workflow manual `E2E Playwright` aceita a opcao `suite`:

- `smoke`: executa `npm run test:e2e`
- `full`: executa `npm run test:e2e:full`

Os artefatos `playwright-report` e `test-results` sao enviados como artifact do workflow e continuam fora do Git.
