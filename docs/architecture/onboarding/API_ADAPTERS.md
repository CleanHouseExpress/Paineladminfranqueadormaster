# API Adapters do Onboarding

## Objetivo
Definir como o frontend deve se proteger de mudancas de contrato e mapear APIs para modelos de tela.

## Escopo
Adapters, normalizacao, erros, permissoes e comandos.

## Responsabilidades dos adapters
- converter snake_case/camelCase;
- normalizar enums/status;
- fornecer defaults seguros;
- mapear erros para mensagens de UX;
- separar payload de comando e modelo de leitura;
- esconder detalhes da API dos componentes.

## Recursos mapeados
- Programa.
- Implementation.
- Etapa.
- Tarefa.
- Checklist.
- Documento.
- Timeline.
- Dashboard.
- Permissoes.

## Decisoes aprovadas
- Componentes nao consomem payload bruto.
- RFC-001: adapters devem expor `Implementation` como view model operacional; `OnboardingRun` esta descontinuado.
- Sprint 3: `onboardingImplementationService` normaliza `/api/tenant/onboarding/implementations`.
- Sprint 4: `onboardingImplementationService` normaliza `guided_setup`, `next_action`, passos guiados e comandos de concluir/pular.
- Sprint 3: `onboardingProgramService` permanece fonte para selecionar ProgramVersions publicadas.
- Adapters nao decidem regra critica.
- Erros 401/403/422/409 devem ser tratados explicitamente.

## Recomendacoes
- Criar tipos de view model por tela.
- Manter testes unitarios para adapters.
- Rejeitar payload incompatível em ambiente de desenvolvimento.

## Pendencias
- Definir schema validation de responses.
- Definir padrao de erro global.
- Definir se endpoints legados de implementation por unidade serao mantidos como fonte primaria ou envelopados por `/api/v1/onboarding`.

## Proximos passos
- Alinhar com `API_CONTRACTS.md` do backend.
