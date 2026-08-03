# Jornadas de usuario - Guia do Catalogo

## Personas

### Franqueadora

Define o padrao da rede. Quer que unidades usem os mesmos nomes, tipos, unidades de medida, precos base e regras de governanca.

Precisa entender:

- O que deve nascer no Catalogo.
- O que pode ser adaptado por unidade.
- Como aprovar itens locais.
- Como preparar itens para Estoque, Vendas, Producao e Financeiro.

### Administrador da unidade

Opera uma unidade com alguma autonomia. Pode consultar itens corporativos, criar itens locais quando permitido, ajustar preco local quando permitido e entender por que alguns itens precisam de aprovacao.

Precisa entender:

- O que vem da franqueadora.
- O que a unidade pode criar.
- Por que um item local pode nao aparecer para todos.
- Quando pedir aprovacao.

### Operador

Usa o Catalogo como consulta. Normalmente nao cria nem altera itens.

Precisa entender:

- Onde encontrar o item correto.
- Por que nome, SKU e unidade devem ser padronizados.
- Que alteracoes dependem de permissao.

### Usuario somente leitura

Consulta a lista e detalhes para apoiar operacao, venda, atendimento ou conferencia.

Precisa entender:

- O Catalogo e a lista oficial.
- Itens arquivados ou pendentes podem nao estar disponiveis para uso.

## Jornada da franqueadora

1. Acessa `Catalogo`.
2. Ve a mensagem: "O Catalogo e onde sua rede define tudo o que utiliza ou comercializa."
3. Entende exemplos: produto vendido, insumo, embalagem, servico e produto acabado.
4. Cria ou revisa categorias.
5. Cria o primeiro item vendido.
6. Cria o primeiro item com controle de estoque.
7. Cria um item sem estoque, como um servico.
8. Revisa campos extras que a rede precisa.
9. Revisa governanca de itens locais e preco local.
10. Conclui o guia.
11. Recebe sugestao: "Agora vamos configurar o Estoque."

Momento de valor:

```text
Primeira categoria
-> primeiro item criado
-> primeiro item controlado
-> primeiro servico criado
-> Catalogo pronto para alimentar outros modulos
```

## Jornada do administrador da unidade

1. Acessa `Catalogo`.
2. Ve itens corporativos disponiveis.
3. Se permitido, cria item local.
4. Entende se item local fica como rascunho, pendente ou aprovado.
5. Se permitido, ajusta preco local.
6. Usa itens aprovados em vendas ou operacoes.

Mensagem-chave:

```text
A unidade pode adaptar apenas o que a franqueadora liberar.
```

## Jornada do operador

1. Acessa `Catalogo` ou seleciona item em outro modulo.
2. Pesquisa por nome, tipo ou SKU.
3. Abre o detalhe para conferir descricao, unidade e status.
4. Se nao encontrar o item, aciona alguem com permissao.

Mensagem-chave:

```text
Use o item oficial para evitar duplicidade e erro de saldo, venda ou producao.
```

## Jornada de primeiro uso

Fluxo recomendado:

```text
Abrir Catalogo
-> entender para que serve
-> criar categoria "Produtos para venda"
-> criar "Sorvete de Morango"
-> criar categoria "Insumos"
-> criar "Morango" com controle de estoque
-> criar "Aula demonstrativa" sem controle de estoque
-> revisar governanca
-> seguir para Estoque
```

## Jornada Melten

Objetivo didatico: mostrar que nem todo item e vendido, mas todos nascem no Catalogo.

Fluxo:

1. Criar categoria `Produtos para venda`.
2. Criar `Sorvete de Morango` como produto acabado.
3. Ativar controle de estoque se a rede deseja acompanhar litros produzidos.
4. Criar categoria `Insumos`.
5. Criar `Morango` com unidade `kg` e controle de estoque.
6. Criar `Leite` com unidade `l` e controle de estoque.
7. Criar `Acucar` com unidade `kg` e controle de estoque.
8. Criar `Embalagem 1 litro` com unidade `un` e controle de estoque.
9. Criar `Casquinha` com unidade `un` e controle de estoque, se for armazenada.
10. Criar `Entrega local` ou `Degustacao` como servico sem controle de estoque, se fizer sentido.

Explicacao para o usuario:

```text
Sorvete pode ser vendido.
Morango, leite, acucar, embalagem e casquinha podem apenas compor a producao.
Mesmo assim, todos ficam no Catalogo para a rede usar os mesmos nomes.
```

## Jornada Catalogo -> Estoque

1. Usuario cria item no Catalogo.
2. Usuario marca "Controlar estoque".
3. Item passa a aparecer em `Estoque > Itens controlados`.
4. Usuario habilita/configura o item em `Estoque > Itens por Unidade`.
5. Usuario registra entrada ou contagem.
6. Saldo fica visivel.

Microcopy recomendada:

```text
Os dados do item sao definidos no Catalogo. O Estoque cuida de onde esta, quanto existe e como se movimenta.
```

## Jornada Catalogo -> Compras

1. Usuario cria ou revisa itens compraveis no Catalogo.
2. Compras usa esses itens para montar pedidos.
3. Recebimento confirma quantidade e pode alimentar Estoque quando o fluxo estiver habilitado.

Mensagem:

```text
Comprar fica mais facil quando o item ja tem nome, unidade e categoria padronizados.
```

## Jornada Catalogo -> Producao

1. Usuario cria produto acabado e insumos no Catalogo.
2. Receita/Composicao usa esses itens para montar uma ficha.
3. Producao calcula consumo e output a partir da ficha publicada.
4. Estoque registra movimentos quando a producao e confirmada.

Mensagem:

```text
A ficha tecnica nao inventa itens. Ela usa os itens que a rede ja definiu no Catalogo.
```

## Jornada Catalogo -> Financeiro

1. Usuario define preco base quando o item e vendido.
2. Sales usa o item para gerar venda com snapshot comercial.
3. Financeiro usa a venda, receitas, custos e efeitos gerenciais para analise.

Mensagem:

```text
O Catalogo ajuda a padronizar o que e vendido. O Financeiro registra os valores reais da operacao.
```

## Retorno apos abandono

Ao voltar, o usuario deve ver:

- O que ja existe.
- Qual e a proxima acao util.
- Links diretos para continuar.
- Opcao de abrir o guia completo.

Exemplo:

```text
Voce ja criou produtos e insumos.
Proximo passo: revisar quais itens precisam controlar estoque.
```

## Complexidade por tela

Baixa:

- Lista do Catalogo.
- Detalhe do item.

Media:

- Formulario de item.
- Tipos e controle de estoque.
- Categorias e unidades de medida.

Alta:

- Configuracoes do Catalogo.
- Campos extras.
- Governanca local.
- Aprovacoes.
- Preco local.

## O que esconder do iniciante

- Termos de banco de dados.
- Nomes internos do sistema.
- Detalhes de integracao tecnica com Estoque.
- Motor interno de campos como conceito.
- Bounded contexts.
- Chaves ou vinculos tecnicos.

## O que mostrar depois

- Campos extras por tipo.
- Aprovacoes locais.
- Preco local.
- Promocao de item local.
- Relacao com receitas, compras e financeiro.
- Boas praticas para evitar duplicidade.
