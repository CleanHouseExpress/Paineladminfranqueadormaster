# Interface de Documentos

## Objetivo
Definir experiencia de upload, versoes, assinatura, pendencias, validade, preview, comentarios e historico.

## Escopo
Documentos exigidos pelo onboarding e sua interacao com o usuario.

## Experiencia
O usuario deve ver documentos solicitados, obrigatoriedade, prazo, formato aceito, status, motivo de reprovação, validade e historico de versoes.

## Acoes
- enviar arquivo;
- substituir antes de analise;
- reenviar apos reprovação;
- visualizar preview;
- baixar;
- comentar;
- aprovar;
- reprovar com motivo;
- solicitar assinatura.

## Estados
- solicitado;
- enviado;
- em analise;
- aprovado;
- reprovado;
- reenvio solicitado;
- vencido;
- dispensado.

## Decisoes aprovadas
- Nova versao nao apaga historico.
- Documento obrigatorio bloqueia etapa quando pendente.
- Reprovacao exige motivo.

## Recomendacoes
- Mostrar checklist de requisitos do documento antes do upload.
- Usar feedback claro de progresso de upload.
- Exibir alertas de vencimento.

## Pendencias
- Definir assinatura digital no MVP ou pos-MVP.
- Definir tipos de preview suportados.

## Proximos passos
- Alinhar com modulo Documents.
