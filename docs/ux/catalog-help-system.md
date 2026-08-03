# Ajuda contextual e guia permanente do Catalogo

## Objetivo

Criar uma camada de ajuda discreta para ensinar o Catalogo no momento certo. A ajuda deve reduzir duvida, orientar a proxima acao e reforcar que o Catalogo e a origem das informacoes usadas pelos outros modulos.

## Regras gerais

- Ajuda deve ser curta.
- Ajuda deve aparecer perto da decisao.
- Ajuda deve usar exemplos reais.
- Ajuda deve respeitar permissao.
- Ajuda nao deve substituir validacao do backend.
- Ajuda nao deve ensinar termos tecnicos internos.

## Ajuda contextual por tela

### Lista do Catalogo

Pergunta respondida:

```text
O que existe na minha rede?
```

Ajuda:

- O Catalogo mostra tudo que a rede vende, usa ou produz.
- Busque por nome ou SKU.
- Filtre por tipo para separar produto, insumo, servico e outros.
- Itens inativos ou arquivados podem nao aparecer em outros modulos.
- Itens pendentes dependem de aprovacao.

CTA principal: criar item.

CTA secundario: abrir guia.

### Formulario de item

Pergunta respondida:

```text
Como cadastro corretamente?
```

Ajuda:

- Nome deve ser claro para toda a rede.
- Tipo explica como o item sera usado.
- Unidade de medida deve refletir como a equipe vende, compra ou conta.
- Preco base e usado por fluxos comerciais.
- Controle de estoque deve ser ligado quando o item precisa ter saldo.
- Campos extras servem para informacoes especificas da rede.

Callout perto de Controle de estoque:

```text
Se este item precisa ter saldo, ative o controle de estoque. Depois ele aparecera em Estoque > Itens controlados.
```

### Detalhe do item

Pergunta respondida:

```text
Este item esta pronto para uso?
```

Ajuda:

- Confira status, tipo, unidade, SKU e preco.
- Se controla estoque, o item deve aparecer no Estoque.
- Se for local, confira se esta aprovado.
- Arquivar tira o item do uso comum, mas preserva historico.

CTA: editar item.

### Configuracoes do Catalogo

Pergunta respondida:

```text
Como a rede personaliza o Catalogo?
```

Ajuda:

- Labels mudam como o modulo fala com a equipe.
- Campos visiveis definem o que aparece no cadastro.
- Campos obrigatorios ajudam a evitar cadastro incompleto.
- Ordem e colunas melhoram leitura.
- Tipos habilitados reduzem escolhas desnecessarias.
- Governanca define o que unidades podem criar ou alterar.

CTA: salvar configuracoes.

### Aprovacoes

Pergunta respondida:

```text
O que precisa de revisao da franqueadora?
```

Ajuda:

- Itens locais podem ficar pendentes.
- Aprovar libera o item conforme regras da rede.
- Rejeitar deve explicar o motivo.
- Promover transforma um item local em padrao da rede, quando permitido.

CTA: aprovar ou rejeitar.

### Catalogo local

Pergunta respondida:

```text
O que a minha unidade pode cadastrar?
```

Ajuda:

- A franqueadora escolhe se unidades podem criar itens locais.
- Alguns tipos podem estar bloqueados.
- Um item local pode precisar de aprovacao antes de uso.
- Preco local nao altera o preco base da rede.

CTA: criar item local, quando permitido.

## Tooltips recomendados

Tipo:

```text
Escolha como a rede usa este item.
```

SKU:

```text
Codigo curto para buscar e identificar o item.
```

Unidade de medida:

```text
Como este item e vendido, comprado ou contado.
```

Preco base:

```text
Valor padrao usado pelos fluxos comerciais.
```

Controlar estoque:

```text
Ligue quando o item precisa ter saldo fisico.
```

Status:

```text
Itens ativos ficam disponiveis para uso. Itens inativos ou arquivados ficam restritos.
```

Item local:

```text
Criado por uma unidade, conforme regras da franqueadora.
```

Aprovacao:

```text
Itens pendentes aguardam revisao antes de uso amplo.
```

## Help cards

### Comece pelo essencial

```text
Crie primeiro os itens que todo mundo reconhece: produtos vendidos, insumos principais, embalagens e servicos.
```

### Estoque depende do Catalogo

```text
Para controlar saldo, crie o item no Catalogo e marque Controlar estoque. O Estoque cuidara de locais, entradas, saidas e saldos.
```

### Evite duplicidade

```text
Antes de criar, pesquise pelo nome ou SKU. Usar o mesmo item oficial evita erro em venda, producao e estoque.
```

### Governanca sem susto

```text
A franqueadora pode deixar unidades criarem itens locais, mas tambem pode exigir aprovacao antes do uso.
```

## Guia permanente

Formato recomendado: drawer lateral ou painel discreto acessado por botao "Guia do Catalogo".

Secoes:

- Comece por aqui.
- O que entra no Catalogo.
- Criar item corretamente.
- Controle de estoque.
- Itens locais e aprovacao.
- Como outros modulos usam o Catalogo.
- Perguntas frequentes.

Regras:

- Deve estar disponivel mesmo depois do guia concluido.
- Deve mostrar links para rotas existentes.
- Deve esconder CTAs proibidos por permissao.
- Deve permitir retomar a etapa recomendada.

## FAQ

Pergunta: O que devo cadastrar no Catalogo?

Resposta: Tudo que sua rede vende, compra, usa ou produz: produtos, insumos, materiais, embalagens, servicos, semiacabados e produtos acabados.

Pergunta: Quando ativo controle de estoque?

Resposta: Ative quando o item precisa ter saldo fisico, como morango, leite, embalagem ou produto acabado.

Pergunta: Servico controla estoque?

Resposta: Normalmente nao. Servicos podem consumir itens por receitas, checklists ou regras operacionais, mas o servico em si nao costuma ter saldo.

Pergunta: Por que meu item nao apareceu no Estoque?

Resposta: Confira se o item esta ativo e se "Controlar estoque" foi marcado.

Pergunta: Posso criar o mesmo item no Estoque?

Resposta: Nao. O item nasce no Catalogo. O Estoque mostra os itens controlados e cuida da operacao fisica.

Pergunta: O que e um item local?

Resposta: E um item criado por uma unidade, quando a franqueadora permite. Ele pode precisar de aprovacao.

Pergunta: Preco local muda o item da rede?

Resposta: Nao. Preco local e uma adaptacao da unidade quando a governanca permite.

Pergunta: Arquivar apaga historico?

Resposta: Nao. Arquivar remove o item do uso comum, mas preserva registros anteriores.

## Empty states educativos

Nenhum item:

```text
Seu Catalogo ainda esta vazio.
Crie aqui tudo que sua rede vende, compra, usa ou produz.
```

Nenhuma categoria:

```text
Nenhuma categoria cadastrada.
Categorias ajudam a organizar produtos, insumos, embalagens e servicos.
```

Nenhuma unidade de medida:

```text
Nenhuma unidade personalizada.
Use medidas simples como un, kg, l, h ou crie medidas da rede quando permitido.
```

Nenhum atributo:

```text
Nenhum campo extra configurado.
Adicione apenas informacoes que ajudam a equipe a cadastrar melhor.
```

Nenhum item controlado:

```text
Nenhum item com controle de estoque.
Crie ou edite um item no Catalogo e marque Controlar estoque.
```

Nenhum item pendente:

```text
Nao ha itens aguardando aprovacao.
Quando uma unidade enviar um item local, ele aparecera aqui.
```

Nenhum resultado de busca:

```text
Nenhum item encontrado.
Confira o nome, SKU ou filtros antes de criar um novo item.
```

## Links contextuais

- Lista: `/catalog`.
- Novo item: `/catalog/new`.
- Configuracoes: `/catalog/settings`.
- Aprovacoes: `/catalog/approvals`.
- Itens locais: `/catalog/local`.
- Itens controlados no Estoque: `/inventory/items`.
- Itens por unidade: `/inventory/unit-items`.

## Callouts por situacao

Catalogo vazio:

```text
Comece com poucos itens reais. Voce pode ampliar depois.
```

Existe item, mas nenhum controla estoque:

```text
Se algum item precisa ter saldo, edite o item e marque Controlar estoque.
```

Existe item controlado:

```text
Agora voce pode configurar o Estoque para habilitar esse item nas unidades.
```

Governanca bloqueia unidade:

```text
A franqueadora controla este cadastro. Solicite alteracao para um administrador.
```

Item pendente:

```text
Este item ainda aguarda aprovacao da franqueadora.
```
