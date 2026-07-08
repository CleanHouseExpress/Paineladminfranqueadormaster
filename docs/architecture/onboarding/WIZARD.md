# Wizard do Onboarding

## Objetivo
Definir o comportamento funcional do wizard de configuracao e implantacao.

## Escopo
Fluxo, salvamento, retomada, validacao, bloqueios, etapas opcionais, personalizacao e progresso.

## Funcionamento
O wizard guia o usuario por etapas definidas pelo programa de onboarding da rede. A ordem e os campos podem variar por rede, tipo de unidade e segmento.

## Comportamentos obrigatorios
- Mostrar progresso total e etapa atual.
- Permitir salvar rascunho.
- Validar antes de concluir etapa.
- Bloquear avanco por pendencias obrigatorias.
- Permitir pular apenas etapas opcionais.
- Registrar etapa pulada com usuario e data.
- Retomar do ultimo ponto.

## Estados
- nao iniciado;
- em andamento;
- aguardando dados;
- aguardando aprovacao;
- bloqueado;
- concluido.

## Decisoes aprovadas
- O wizard nao e fonte de verdade do workflow.
- O backend retorna etapas, status e criterio de conclusao.
- Frontend apenas exibe e envia comandos.

## Recomendacoes
- Evitar salvar a cada tecla sem debounce ou feedback.
- Exibir erros por campo e por etapa.
- Mostrar resumo antes de concluir.

## Pendencias
- Definir layout final para mobile.
- Definir regras de autosave e rascunho.

## Proximos passos
- Validar fluxo com UX.
- Criar cenarios E2E do wizard completo.
