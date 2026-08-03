# Primeiro uso do Catalogo

## Objetivo

Guiar uma pessoa nova do zero ate um Catalogo minimo e util. Ao final, ela deve entender que tudo que a rede utiliza ou comercializa nasce no Catalogo e que outros modulos reaproveitam essa informacao.

## Estado inicial

Cenario esperado:

- Usuario tem acesso ao modulo `Catalogo`.
- Pode existir Catalogo vazio ou com poucos itens.
- Estoque pode estar habilitado ou nao.
- Governanca pode permitir ou bloquear itens locais.
- Campos customizados podem existir.

## Fluxo resumido

```text
Primeiro acesso
-> entender o Catalogo
-> criar primeira categoria
-> criar primeiro item vendido
-> criar primeiro item com estoque
-> criar primeiro item sem estoque
-> criar primeiro servico
-> revisar governanca
-> sugerir Estoque
```

## 1. Primeiro acesso

Pergunta respondida:

```text
Para que serve o Catalogo?
```

Mensagem:

```text
O Catalogo e a lista oficial da rede. Crie aqui tudo que sua rede vende, compra, usa ou produz.
```

Exemplos exibidos:

- Sorvete de Morango.
- Morango.
- Leite.
- Embalagem.
- Casquinha.
- Entrega local.

Acao principal: abrir guia ou criar primeiro item.

Acao secundaria: conhecer exemplos.

Conclusao automatica: usuario visualizou a lista ou iniciou o guia.

## 2. Primeira categoria

Pergunta respondida:

```text
Como organizo meus itens?
```

Mensagem:

```text
Categorias agrupam itens parecidos para facilitar busca, filtros e analises.
```

Exemplos:

- Produtos para venda.
- Insumos.
- Embalagens.
- Servicos.

Acao principal: criar categoria, quando houver superficie de categoria disponivel.

Fallback enquanto categoria dedicada nao existir: orientar a usar campos extras ou tipo do item sem bloquear o guia.

Conclusao automatica: existe ao menos uma categoria ou o usuario pulou porque a rede ainda nao usa categorias.

## 3. Primeiro item vendido

Pergunta respondida:

```text
Como cadastro algo que vendo?
```

Mensagem:

```text
Cadastre o produto com nome claro, tipo, unidade e preco base.
```

Exemplo:

```text
Sorvete de Morango
Tipo: Produto acabado
Unidade: l
Preco base: R$ 32,00
```

Acao principal: abrir `/catalog/new`.

Campos ensinados:

- Nome.
- Tipo.
- SKU.
- Unidade de medida.
- Preco base.
- Status.

Conclusao automatica: existe item ativo vendavel.

## 4. Primeiro item com estoque

Pergunta respondida:

```text
Como faco um item aparecer no Estoque?
```

Mensagem:

```text
Se este item precisa ter saldo, ative o controle de estoque.
```

Exemplo:

```text
Morango
Tipo: Insumo interno
Unidade: kg
Controlar estoque: sim
```

Acao principal: abrir `/catalog/new`.

Depois de salvar:

```text
O item aparecera em Estoque > Itens controlados.
```

Conclusao automatica: existe item ativo com controle de estoque.

## 5. Primeiro item sem estoque

Pergunta respondida:

```text
Quando nao devo controlar estoque?
```

Mensagem:

```text
Se voce nao conta saldo deste item, deixe o controle de estoque desligado.
```

Exemplos:

- Taxa de entrega.
- Servico de consultoria.
- Aula demonstrativa.
- Assinatura mensal.

Acao principal: criar item sem controle de estoque.

Conclusao automatica: existe item ativo sem controle de estoque.

## 6. Primeiro servico

Pergunta respondida:

```text
Como cadastro algo que nao e fisico?
```

Mensagem:

```text
Servicos nao costumam ter saldo. Eles podem ter duracao, agenda, profissional ou regras comerciais.
```

Exemplo:

```text
Entrega local
Tipo: Servico
Controlar estoque: nao
```

Acao principal: abrir `/catalog/new` com tipo `service`, quando houver deep link futuro.

Conclusao automatica: existe item do tipo servico ou procedimento.

## 7. Revisar campos extras

Pergunta respondida:

```text
Quais informacoes minha rede precisa guardar?
```

Mensagem:

```text
Campos extras ajudam a guardar detalhes que sao importantes para a sua operacao.
```

Exemplos:

- Temperatura.
- Marca.
- Linha.
- Tamanho.
- Observacao.

Acao principal: abrir `/catalog/settings`.

Conclusao automatica: usuario acessou configuracoes ou existem campos extras ativos.

## 8. Revisar governanca

Pergunta respondida:

```text
O que as unidades podem adaptar?
```

Mensagem:

```text
A franqueadora decide se unidades podem criar itens locais, ajustar preco e enviar itens para aprovacao.
```

Acao principal: abrir `/catalog/settings`.

Conclusao automatica: usuario visualizou governanca ou salvou configuracoes.

## 9. Encerramento

Mensagem:

```text
Seu Catalogo ja tem uma base inicial. Agora outros modulos podem usar esses itens.
```

Sugestoes:

- Configurar Estoque para itens controlados.
- Criar ficha tecnica em Producao/Receitas.
- Criar venda usando itens do Catalogo.
- Revisar precos e governanca.

## Fluxo Melten detalhado

### Criar Sorvete de Morango

```text
Nome: Sorvete de Morango
Tipo: Produto acabado
Unidade: l
Preco base: definido pela rede
Controlar estoque: sim, se a rede quer acompanhar litros produzidos
```

### Criar Morango

```text
Nome: Morango
Tipo: Insumo interno
Unidade: kg
Controlar estoque: sim
```

### Criar Leite

```text
Nome: Leite
Tipo: Insumo interno
Unidade: l
Controlar estoque: sim
```

### Criar Acucar

```text
Nome: Acucar
Tipo: Insumo interno
Unidade: kg
Controlar estoque: sim
```

### Criar Embalagem

```text
Nome: Embalagem 1 litro
Tipo: Embalagem
Unidade: un
Controlar estoque: sim
```

### Criar Casquinha

```text
Nome: Casquinha
Tipo: Material ou Embalagem
Unidade: un
Controlar estoque: sim, se a operacao acompanha saldo
```

Explicacao final:

```text
Alguns desses itens vendem. Alguns apenas compoem. Todos nascem no Catalogo para a rede falar a mesma lingua.
```

## Estados de erro

Sem permissao:

```text
Voce pode consultar o Catalogo, mas nao pode criar itens. Fale com a franqueadora ou administrador.
```

Catalogo desabilitado:

```text
O Catalogo nao esta habilitado para esta rede. Peça para um administrador revisar os modulos disponiveis.
```

Erro ao carregar:

```text
Nao foi possivel carregar o Catalogo agora. Tente novamente em instantes.
```

Item pendente:

```text
Este item ainda precisa de aprovacao antes de ficar disponivel para uso.
```
