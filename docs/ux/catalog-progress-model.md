# Modelo de progresso do Guia do Catalogo

## Objetivo

Definir progresso automatico para o Guia do Catalogo sem criar checklists artificiais. O progresso deve refletir dados reais e permissoes reais.

O usuario nao deve marcar tarefas manualmente para "parecer pronto". O sistema deve reconhecer quando algo ja existe.

## Principios

- Progresso e derivado de dados existentes.
- Etapas indisponiveis por permissao ou capability nao devem bloquear conclusao.
- O guia pode ser retomado a qualquer momento.
- Progresso deve explicar o proximo passo util.
- Concluir o guia nao bloqueia uso do modulo.
- O fim do guia pode sugerir Estoque.

## Eventos conceituais de progresso

```text
catalog_opened
catalog_first_category_created
catalog_first_item_created
catalog_first_sellable_item_created
catalog_first_stock_controlled_item_created
catalog_first_non_stock_item_created
catalog_first_service_created
catalog_custom_fields_reviewed
catalog_governance_reviewed
catalog_ready_for_inventory
catalog_guide_completed
```

Estes nomes sao conceituais para UX. A Fase A nao cria API nem persistence.

## Etapas propostas

| Etapa | Pergunta | Conclusao automatica | Peso |
| --- | --- | --- | ---: |
| `welcome` | O que e o Catalogo? | Usuario abriu o guia ou `/catalog` | 5 |
| `first_category` | Como organizar itens? | Existe categoria ou etapa foi dispensada | 10 |
| `first_item` | Como criar o primeiro item? | Existe ao menos um item | 15 |
| `sellable_item` | Como cadastrar algo vendido? | Existe item vendavel ativo | 10 |
| `stock_item` | Como preparar item para Estoque? | Existe item ativo com controle de estoque | 20 |
| `non_stock_item` | Quando nao controlar estoque? | Existe item ativo sem controle de estoque | 10 |
| `service_item` | Como cadastrar servico? | Existe servico/procedimento ativo | 10 |
| `custom_fields` | Quais campos extras usar? | Usuario abriu configuracoes ou existem campos extras | 5 |
| `governance` | O que unidades podem adaptar? | Usuario abriu/salvou governanca | 10 |
| `next_modules` | O que vem depois? | Usuario viu recomendacoes finais | 5 |

Total: 100.

## Como calcular com dados existentes

### Catalogo aberto

Fonte provavel:

- Estado local de sessao.
- Futuro endpoint de progresso, se existir.

Sem backend novo na Fase B inicial, pode ser calculado no frontend durante a sessao.

### Primeiro item

Fonte:

- `GET /api/company/catalog/items`.

Regra:

```text
total > 0
```

### Primeiro item vendido

Fonte:

- Lista de itens do Catalogo.

Regra:

```text
Existe item ativo de tipo produto, produto acabado, servico, assinatura, plano, curso ou procedimento.
```

### Primeiro item com estoque

Fonte:

- Lista/detalhe do Catalogo com campos de produto.

Regra:

```text
Existe item ativo em que "Controlar estoque" esta ligado.
```

Mensagem:

```text
Este item agora pode aparecer em Estoque > Itens controlados.
```

### Primeiro item sem estoque

Fonte:

- Lista/detalhe do Catalogo.

Regra:

```text
Existe item ativo com controle de estoque desligado.
```

### Primeiro servico

Fonte:

- Lista de itens do Catalogo.

Regra:

```text
Existe item ativo do tipo servico ou procedimento.
```

### Campos extras revisados

Fonte:

- Configuracoes atuais de campos do Catalogo.
- Acesso a `/catalog/settings`.

Regra:

```text
Usuario visualizou configuracoes ou existe form_schema customizado visivel.
```

### Governanca revisada

Fonte:

- `GET /api/company/catalog/settings`.
- Acesso a `/catalog/settings`.

Regra:

```text
Usuario visualizou governanca ou salvou configuracoes de governanca.
```

### Pronto para Estoque

Fonte:

- Existe item controlado.
- Usuario tem permissao de ver Estoque.

Regra:

```text
Existe ao menos um item com controle de estoque e usuario pode acessar /inventory/items.
```

## Proximo passo recomendado

Prioridade:

1. Se Catalogo vazio: criar primeiro item.
2. Se nao ha item controlado: criar item com controle de estoque.
3. Se nao ha item sem estoque: criar servico ou item sem saldo.
4. Se governanca nao revisada e usuario pode configurar: revisar governanca.
5. Se ha item controlado e usuario pode ver Estoque: abrir Estoque.
6. Se tudo basico esta pronto: manter guia permanente.

## RBAC

### Franqueadora

Pode ver progresso completo quando possui permissoes de configuracao.

Etapas acionaveis:

- Criar item.
- Editar item.
- Configurar campos.
- Configurar governanca.
- Aprovar itens locais.
- Seguir para Estoque.

### Administrador da unidade

Pode ver progresso adaptado.

Etapas acionaveis dependem da governanca:

- Criar item local, se permitido.
- Ajustar preco local, se permitido.
- Consultar itens corporativos.
- Aguardar aprovacao.

### Operador

Progresso deve virar leitura guiada.

Pode:

- Abrir lista.
- Pesquisar item.
- Ver detalhe.

Nao deve ver CTA de criar ou configurar.

### Somente leitura

Mostra apenas:

- Explicacao do Catalogo.
- Como encontrar itens.
- Por que usar item oficial.

## Capabilities

### Catalogo desabilitado

Comportamento:

- Nao mostrar wizard operacional.
- Mostrar estado informativo para quem tentou acessar.
- Sugerir falar com administrador.

Mensagem:

```text
O Catalogo nao esta habilitado para esta rede.
```

### Campos customizados

Comportamento:

- Se existem campos extras, o guia deve explica-los como informacoes adicionais.
- Se nao existem, nao forcar criacao.

### Tipos personalizados

Comportamento:

- Mostrar o tipo personalizado como escolha valida.
- Explicar que a rede pode adaptar tipos, mas o usuario ainda deve responder se o item tem saldo ou nao.

### Governanca central

Comportamento:

- Se unidade nao pode criar item, esconder CTA de criacao.
- Se item local exige aprovacao, mostrar status pendente com linguagem simples.
- Se preco local esta bloqueado, explicar que o preco vem da franqueadora.

## Persistencia futura

Se a Fase B precisar salvar estado, usar uma persistencia minima por usuario e tenant.

Salvar apenas:

- guia iniciado;
- guia concluido;
- etapa manualmente dispensada;
- ultima etapa vista;
- dismiss do convite.

Nao salvar:

- resultado operacional calculado no frontend;
- duplicacao de itens;
- flags que substituam a verdade dos dados.

## Mensagens de progresso

Inicio:

```text
Vamos montar seu Catalogo inicial.
```

Item criado:

```text
Voce ja tem seu primeiro item.
```

Item controlado:

```text
Voce ja tem item pronto para Estoque.
```

Servico criado:

```text
Voce tambem ja sabe cadastrar algo sem saldo.
```

Concluido:

```text
Seu Catalogo inicial esta pronto. Agora outros modulos podem usar esses itens.
```

Sugestao para Estoque:

```text
Proximo passo sugerido: configurar Estoque para os itens controlados.
```

## Riscos de UX

- Forcar categoria quando a tela ainda nao existir claramente.
- Tratar governanca como obrigatoria para operador.
- Chamar controle de estoque de forma tecnica.
- Confundir preco base com custo ou saldo.
- Mostrar Estoque para usuario sem permissao.
- Concluir guia sem nenhum item real.

## Roadmap para Fase B

1. Implementar calculo de progresso no frontend usando services existentes.
2. Adicionar estado de convite e retomada.
3. Criar etapa final conectando com Estoque.
4. Adicionar persistencia minima somente se a experiencia exigir.
5. Criar E2E de progresso automatico.
# Fase B - contrato implementado

O progresso do Guia do Catalogo e hibrido:

- Etapas educativas podem ser marcadas pelo usuario.
- Etapas operacionais tambem sao concluidas automaticamente quando existem dados reais.
- Reset limpa progresso manual e preserva conclusoes automaticas.
- Dismiss oculta o convite automatico, mas nao remove o acesso permanente ao guia.

Fonte de progresso automatico:

- Primeiro item: existe item no Catalogo.
- Controle de estoque: existe item estocavel com controle de estoque marcado.
- Insumo interno: existe insumo, material, embalagem ou semiacabado.
- Servico: existe item de servico ou procedimento.
- Campos extras: existe configuracao de campos para itens do Catalogo.
- Governanca: existe configuracao de governanca de Catalogo.
- Estoque: existe item controlado e o usuario pode ver Estoque.

O modelo nao cria item de exemplo, nao duplica regra de Catalogo e nao substitui validacoes do backend.
