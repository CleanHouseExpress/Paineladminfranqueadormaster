# Ajuda contextual e guia permanente de Estoque

## Objetivo

Criar uma camada de ajuda dentro do modulo, sem criar nova funcionalidade operacional. A ajuda deve ensinar conceitos, apontar a proxima acao e reduzir medo de operar estoque.

## Ajuda contextual por tela

### Dashboard

Pergunta respondida: "Como esta meu estoque agora?"

Ajuda:

- Itens ativos.
- Estoque baixo.
- Sem estoque.
- Ultimos movimentos.
- Valor de estoque quando permitido.

CTA: continuar guia ou ver saldos.

### Itens

Pergunta respondida: "O que eu controlo no estoque?"

Ajuda:

- Item pode ser insumo, embalagem ou produto pronto.
- SKU ajuda a padronizar.
- Unidade de medida deve refletir como a operacao conta.
- `track_inventory` define se o item aparece no controle fisico.

CTA: criar item.

### Itens por Unidade

Pergunta respondida: "Quais itens cada unidade pode usar?"

Ajuda:

- A rede define itens.
- A unidade opera somente itens habilitados.
- Minimo e maximo ajudam alerta e reposicao, quando flags estiverem ativas.
- Local preferencial reduz erro ao movimentar.

CTA: revisar unidade.

### Locais

Pergunta respondida: "Onde o estoque fica guardado?"

Ajuda:

- Local e parte da unidade.
- Um local padrao simplifica entradas e saidas.
- Locais inativos nao devem receber novas operacoes.

CTA: criar local.

### Movimentacoes

Pergunta respondida: "O que mudou no estoque?"

Ajuda:

- Entrada aumenta saldo.
- Saida, perda e consumo reduzem saldo.
- Ajuste positivo aumenta por correcao.
- Ajuste negativo reduz por correcao.
- Reversao desfaz com movimento oficial, nao apaga historico.

CTA: novo movimento.

### Saldos

Pergunta respondida: "Quanto eu tenho?"

Ajuda:

- Saldo e resultado dos movimentos.
- Se nao ha saldo, falta entrada ou contagem confirmada.
- Saldo deve ser lido por item, unidade e local.

CTA: registrar entrada.

### Inventario Fisico

Pergunta respondida: "Como confiro e corrijo divergencias?"

Ajuda:

- Contagem cria um retrato do saldo naquele momento.
- Enquanto rascunho, pode preencher e salvar.
- Confirmar gera ajustes oficiais para divergencias.
- Estornar tambem registra movimento oficial.

CTA: nova contagem.

### Receitas e execucoes

Pergunta respondida: "Como a producao mexe no estoque?"

Ajuda:

- Receita publicada define componentes, rendimento e saida.
- Calcular nao movimenta estoque.
- Confirmar execucao pode consumir insumos e dar entrada no item produzido.

CTA: abrir execucoes de ficha tecnica.

### Checklists

Pergunta respondida: "Como a rotina operacional pode gerar estoque?"

Ajuda:

- Checklist pode acionar execucao operacional existente.
- O estoque continua sendo movimentado pelos services oficiais.

CTA: abrir checklists.

## Guia permanente

Formato recomendado: drawer lateral ou painel nao intrusivo acessado por botao "Guia de estoque".

Secoes:

- Comece por aqui.
- Conceitos em 1 minuto.
- Configurar rede.
- Operar unidade.
- Corrigir divergencias.
- Receitas e checklists.
- Perguntas frequentes.

Regras:

- Deve estar disponivel mesmo depois do wizard concluido.
- Deve respeitar permissoes.
- Deve usar links para rotas existentes.
- Deve mostrar estado atual quando possivel.

## FAQ

Pergunta: Por que meu saldo esta zerado?

Resposta: O saldo aparece depois de uma entrada, ajuste positivo, producao ou contagem confirmada que gere ajuste.

Pergunta: Posso apagar uma movimentacao?

Resposta: Nao. Para manter historico, use reversao quando tiver permissao.

Pergunta: Quando uso ajuste?

Resposta: Use ajuste quando precisa corrigir uma diferenca identificada fora de uma contagem fisica.

Pergunta: Quando uso contagem fisica?

Resposta: Use quando a equipe conferiu o estoque real e quer comparar com o sistema.

Pergunta: Receita movimenta estoque automaticamente?

Resposta: Calcular nao movimenta. Confirmar execucao pode movimentar, conforme fluxo existente.

Pergunta: Transferencias fazem parte do guia?

Resposta: Nao nesta fase. As rotas existem, mas o fluxo esta temporariamente indisponivel no ledger novo.

## Empty states educativos

Itens vazio:

```text
Ainda nao ha itens de estoque.
Comece cadastrando o que voce quer acompanhar, como insumos, embalagens ou produtos prontos.
```

Locais vazio:

```text
Ainda nao ha locais de estoque.
Crie pelo menos um local por unidade, como Estoque principal.
```

Saldos vazio:

```text
Ainda nao ha saldo.
Registre uma entrada ou confirme uma contagem para o sistema calcular o saldo.
```

Movimentos vazio:

```text
Nenhuma movimentacao registrada.
Movimentos mostram tudo que entrou, saiu ou corrigiu o estoque.
```

Contagens vazio:

```text
Nenhuma contagem fisica aberta.
Use uma contagem quando quiser comparar o saldo do sistema com o estoque real.
```

## Callouts inteligentes

- Se estoque desabilitado: mostrar CTA para configuracoes apenas para quem tem permissao.
- Se nao ha itens: sugerir primeiro item.
- Se ha itens, mas nao ha locais: sugerir criar local.
- Se ha itens e locais, mas nao ha saldo: sugerir primeira entrada.
- Se ha saldo baixo: explicar estoque minimo e link para itens por unidade.
- Se usuario nao tem permissao: explicar que a acao depende da franqueadora/admin.
