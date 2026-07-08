# Estrategia de Testes Frontend

## Objetivo
Definir estrategia de testes frontend e E2E para o modulo Onboarding.

## Escopo
Componentes, hooks, adapters, telas, permissoes, estados e jornada de setup guiado.

## Testes unitarios
- adapters;
- formatadores;
- helpers de UI;
- validacoes de formulario;
- normalizacao de proximas acoes.

## Testes de componentes
- wizard step;
- checklist item de setup;
- status/progress card;
- next action card;
- empty/error/retry states;
- first value milestone.

## E2E
- iniciar onboarding;
- concluir wizard;
- materializar implementation;
- retomar setup;
- concluir passo de setup;
- abrir deep link para modulo dono;
- validar first value;
- validar escopo por perfil.

## Estados obrigatorios
- loading;
- erro;
- vazio;
- sem permissao;
- sucesso;
- validacao;
- offline/rascunho quando aplicavel.

## Decisoes aprovadas
- Fluxo critico deve ter E2E.
- Mocks devem simular contratos reais.
- Testes devem usar `data-testid` em elementos de fluxo critico.
- RFC-002: fluxo completo de documentos, aprovacoes, automacoes e workflow recorrente pertence aos respectivos modulos.

## Recomendacoes
- Manter helpers compartilhados de auth e seed.
- Evitar `waitForTimeout`.
- Testar 403/422/409.

## Pendencias
- Definir massa E2E final.
- Definir coverage minimo por fase.

## Proximos passos
- Criar matriz de casos a partir da especificacao funcional.
