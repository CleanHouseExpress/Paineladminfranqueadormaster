# Onboarding guiado do Catalogo - Fase A

## Escopo desta fase

Esta fase e somente discovery, UX e arquitetura da experiencia. Nao implementa codigo, componentes, backend, APIs, migrations, testes, commit ou push.

O objetivo do Guia do Catalogo e ensinar uma pessoa nova a configurar o Catalogo sem treinamento externo. A experiencia deve explicar o modulo com exemplos concretos, orientar a primeira configuracao e mostrar o que acontece depois que um item e criado.

Mensagem central:

```text
O Catalogo e onde sua rede define tudo o que utiliza ou comercializa.

Depois disso, cada modulo utiliza essas informacoes.
```

## Diagnostico UX

O Catalogo ja possui telas para lista, criacao, detalhe, configuracao, itens locais, aprovacoes e preco local. O problema principal para um usuario novo e entender que o Catalogo nao e apenas uma tabela comercial de produtos; ele e o lugar onde a rede nomeia e padroniza aquilo que sera usado pelos outros modulos.

Pontos que podem confundir:

- O usuario pode achar que "produto" significa apenas item vendido.
- Insumo, material, embalagem e semiacabado parecem pertencer ao Estoque, mas tambem precisam nascer no Catalogo.
- "Controlar estoque" pode parecer uma configuracao avancada, quando na verdade responde uma pergunta simples: este item precisa ter saldo?
- Configuracoes de campos e governanca podem parecer tecnicas demais.
- Itens locais por unidade exigem explicar aprovacao e visibilidade sem usar linguagem de arquitetura.
- Preco base, preco local e custo operacional podem se misturar na cabeca do usuario.

## Principios do guia

O Guia deve:

- Ensinar antes de pedir acao.
- Usar exemplos reais e curtos.
- Mostrar uma proxima acao por vez.
- Explicar que tudo nasce no Catalogo.
- Separar identidade do item de operacao diaria.
- Evitar termos tecnicos de arquitetura.
- Levar o usuario para telas existentes.
- Permanecer disponivel depois do primeiro uso.

O Guia nao deve:

- Criar um fluxo paralelo de cadastro.
- Duplicar configuracoes existentes.
- Prometer automacao inexistente.
- Explicar detalhes tecnicos internos.
- Transformar progresso em checklist artificial.

## O que o usuario precisa aprender

### 1. O que e o Catalogo

Explicacao curta:

```text
O Catalogo e a lista oficial da rede. Nele ficam os nomes, tipos, codigos, unidades, precos e informacoes dos itens que a operacao usa.
```

Exemplo:

```text
Sorvete de Morango, Morango, Leite, Acucar, Embalagem e Casquinha ficam no Catalogo.
Alguns sao vendidos. Alguns apenas entram na producao. Todos precisam ter um nome padrao.
```

### 2. O que pode ser cadastrado

Tipos ensinados no guia:

- Produtos.
- Insumos.
- Materiais.
- Embalagens.
- Servicos.
- Semiacabados.
- Produtos acabados.
- Assinaturas, planos, cursos, procedimentos e tipos personalizados quando a rede usar.

Microcopy recomendada:

```text
Escolha o tipo que melhor explica como este item e usado. Se ele sera contado no estoque, voce tambem podera ativar o controle de estoque.
```

### 3. Categorias

Explicacao:

```text
Categorias ajudam a organizar a lista para encontrar, filtrar e analisar itens parecidos.
```

Exemplos:

- Materias-primas.
- Embalagens.
- Produtos para venda.
- Servicos da unidade.
- Recorrencias.

### 4. Unidades de medida

Explicacao:

```text
A unidade de medida diz como a rede fala sobre aquele item: kg, litro, unidade, hora, sessao, mes ou outra medida.
```

Regra didatica:

```text
Use a medida que a equipe realmente entende no dia a dia.
```

### 5. Atributos

Explicacao:

```text
Atributos sao informacoes extras que sua rede quer guardar para todos ou alguns itens.
```

Exemplos:

- Marca.
- Linha.
- Temperatura.
- Tamanho.
- Validade padrao.
- Observacao operacional.

O guia deve chamar isso de "campos extras" ou "informacoes adicionais".

### 6. Controle de estoque

Explicacao principal:

```text
Se este item precisa ter saldo, ative o controle de estoque.
```

O guia deve reforcar:

- Ativar controle de estoque faz o item aparecer em Estoque como item controlado.
- Desativar controle de estoque nao apaga historico.
- Servicos normalmente nao precisam de saldo.
- Produtos, insumos, materiais, embalagens, semiacabados e produtos acabados podem precisar de saldo.

Nao explicar detalhes internos ou vinculos tecnicos.

### 7. Disponibilidade

Explicacao:

```text
Disponibilidade responde onde e por quem o item pode ser usado.
```

O guia deve diferenciar:

- Item ativo no Catalogo.
- Item aprovado para uso pela rede.
- Item disponivel para uma unidade.
- Item com saldo no Estoque, quando houver controle fisico.

### 8. Governanca da rede

Explicacao:

```text
A franqueadora decide o que e padrao da rede e o que cada unidade pode adaptar.
```

O guia deve cobrir:

- Itens corporativos.
- Itens locais.
- Aprovacao de itens locais.
- Preco local quando permitido.
- Promocao de item local para padrao da rede.
- Tipos que unidades podem criar.

## Entrada do guia

Entradas recomendadas para Fase B:

- Card discreto no topo de `/catalog` quando o usuario ainda nao tem itens.
- Botao permanente "Guia do Catalogo" no header do Catalogo.
- Link contextual em `/catalog/new` perto de Tipo e Controle de estoque.
- Ajuda discreta em `/catalog/settings` explicando campos e governanca.
- Chamada no onboarding principal antes do Estoque.

## Blueprint do guia

Etapas propostas:

1. Entender o Catalogo.
2. Criar primeira categoria.
3. Criar primeiro item vendido.
4. Criar primeiro item com estoque.
5. Criar primeiro item sem estoque.
6. Criar primeiro servico.
7. Revisar campos extras.
8. Revisar governanca da rede.
9. Entender proximos modulos.
10. Concluir e sugerir Estoque.

## Relacao com outros modulos

### Estoque

```text
Catalogo define o item.
Estoque controla quantidade, locais e movimentacoes dos itens marcados para controle de estoque.
```

### Compras

```text
Compras usa os itens do Catalogo para pedir, receber e comparar fornecedores.
```

### Producao

```text
Producao usa itens do Catalogo para dizer o que sera produzido e quais insumos entram na composicao.
```

### Financeiro

```text
Financeiro usa informacoes comerciais do Catalogo para vendas, receitas, custos planejados e analises.
```

## Tom de voz

O tom deve ser simples, direto e acolhedor.

Preferir:

```text
Crie aqui tudo que sua rede vende ou usa.
```

Evitar:

```text
Configure a estrutura tecnica do Catalogo.
```

Preferir:

```text
Se precisa ter saldo, marque Controlar estoque.
```

Evitar:

```text
Isto criara um perfil operacional vinculado.
```

## Fora do escopo da Fase A

- Criar componentes.
- Criar wizard.
- Criar rotas.
- Criar endpoints.
- Criar migrations.
- Alterar permissao.
- Alterar services.
- Criar testes.
- Commit e push.

## Roadmap para Fase B

1. Criar entrada visual do guia em `/catalog`.
2. Criar shell do Guia do Catalogo consumindo dados existentes.
3. Criar ajuda contextual em lista, formulario, detalhe e settings.
4. Criar empty states educativos.
5. Criar progresso automatico com base em dados reais.
6. Integrar o fim do guia com sugestao de Estoque.
7. Adicionar E2E da jornada Catalogo -> Estoque.
