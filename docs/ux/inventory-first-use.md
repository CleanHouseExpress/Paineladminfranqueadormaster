# Primeiro uso e wizard de Estoque

## Modelo de tela

Cada etapa deve responder uma pergunta simples:

- O que e isto?
- Por que importa?
- O que eu faco agora?
- Como sei que deu certo?

Cada etapa deve ter:

- Nome.
- Objetivo.
- Mensagem.
- Exemplo.
- Ilustracao sugerida.
- Acao principal.
- Acao secundaria.
- Criterio de conclusao.
- Criterio de progresso.

## Wizard da Franqueadora

### 1. Boas-vindas ao Estoque

Objetivo: explicar o modulo em linguagem operacional.

Mensagem: "Aqui voce acompanha o que entra, o que sai, o que cada unidade tem em estoque e quando precisa corrigir uma diferenca."

Exemplo: "Se a unidade recebeu 10 kg de morango, registre uma entrada. O saldo passa a mostrar essa quantidade."

Ilustracao sugerida: mini fluxo `Entrada -> Saldo -> Saida/Contagem`.

Acao principal: comecar guia.

Acao secundaria: ir para dashboard.

Conclusao: usuario avancou.

Progresso: `welcome_seen`.

### 2. Ativar o modulo

Objetivo: garantir que a capability esteja habilitada.

Mensagem: "Primeiro confirme se o estoque esta liberado para esta rede."

Exemplo: "Quando estiver habilitado, as telas de itens, locais, saldos e movimentos ficam disponiveis."

Ilustracao sugerida: interruptor simples.

Acao principal: abrir `/inventory/settings`.

Acao secundaria: continuar se ja estiver habilitado.

Conclusao: `inventory_enabled = true`.

Progresso: settings carregado e habilitado.

### 3. Escolher o modo de uso

Objetivo: explicar `simple`, `intermediate` e `advanced` sem linguagem tecnica.

Mensagem: "Escolha o nivel que combina com sua operacao hoje. Voce pode evoluir depois."

Exemplo: "Simples para controlar entradas, saidas e saldos; avancado para rede com custo, contagem e integracoes."

Ilustracao sugerida: tres opcoes comparativas.

Acao principal: abrir configuracoes.

Acao secundaria: manter modo atual.

Conclusao: modo salvo ou revisado.

Progresso: `inventory_mode` existente.

### 4. Cadastrar itens

Objetivo: criar a base de insumos/produtos controlados.

Mensagem: "Item e tudo que voce quer acompanhar: insumo, embalagem ou produto pronto."

Exemplo: "Morango, leite, embalagem 1 litro, sorvete de morango."

Ilustracao sugerida: lista curta com nomes reais.

Acao principal: abrir `/inventory/items/new`.

Acao secundaria: ver lista de itens.

Conclusao: existe ao menos um item ativo.

Progresso: `GET /api/company/inventory/items` com total maior que zero.

### 5. Criar locais de estoque

Objetivo: indicar onde o saldo fica dentro da unidade.

Mensagem: "Local e onde o item fica guardado, como estoque principal, cozinha ou freezer."

Exemplo: "Melten Centro - Estoque principal."

Ilustracao sugerida: planta simples com pontos de armazenamento.

Acao principal: abrir `/inventory/locations`.

Acao secundaria: pular se ja existe local padrao.

Conclusao: existe ao menos um local ativo.

Progresso: `GET /api/company/inventory/locations`.

### 6. Habilitar itens por unidade

Objetivo: explicar governanca rede x unidade.

Mensagem: "A rede define o catalogo, mas cada unidade usa apenas os itens habilitados para ela."

Exemplo: "A unidade Centro usa morango e leite; outra unidade pode nao usar os mesmos itens."

Ilustracao sugerida: item ligado a duas unidades.

Acao principal: abrir `/inventory/unit-items`.

Acao secundaria: ir para item especifico.

Conclusao: existe item habilitado para uma unidade.

Progresso: unit item com `enabled = true`.

### 7. Registrar primeira entrada

Objetivo: levar ao primeiro saldo visivel.

Mensagem: "Saldo nasce de movimento. Para comecar, registre uma entrada do que chegou na unidade."

Exemplo: "Entrada de 10 kg de morango no estoque principal."

Ilustracao sugerida: caixa entrando no local.

Acao principal: abrir `/inventory/movements?new=1`.

Acao secundaria: ver movimentos.

Conclusao: existe movimento confirmado de entrada.

Progresso: movimento `entry` confirmado.

### 8. Conferir saldos

Objetivo: mostrar o resultado da operacao.

Mensagem: "Depois da entrada, o saldo mostra quanto existe por item, unidade e local."

Exemplo: "Morango - Melten Centro - Estoque principal - 10 kg."

Ilustracao sugerida: tabela enxuta de saldo.

Acao principal: abrir `/inventory/balances`.

Acao secundaria: voltar ao dashboard.

Conclusao: usuario acessou saldos depois de movimento.

Progresso: existe saldo com `on_hand > 0`.

### 9. Entender receitas e checklists

Objetivo: explicar integracoes ja existentes sem transformar em configuracao obrigatoria.

Mensagem: "Receitas e checklists podem gerar consumo e producao quando voce ja usa esses modulos."

Exemplo: "Executar ficha tecnica de sorvete consome morango e leite e pode dar entrada no produto final."

Ilustracao sugerida: receita gerando dois movimentos.

Acao principal: abrir `/recipe-executions`.

Acao secundaria: continuar sem configurar.

Conclusao: etapa vista ou receita publicada existente.

Progresso: `recipes`/`recipe-executions` disponivel e usuario viu a explicacao.

### 10. Fazer primeira contagem fisica

Objetivo: ensinar correcao oficial de divergencias.

Mensagem: "Contagem compara o que o sistema mostra com o que existe fisicamente. Ao confirmar, o sistema cria ajustes oficiais."

Exemplo: "Sistema: 40 kg. Contado: 39 kg. Diferenca: falta 1 kg."

Ilustracao sugerida: prancheta comparando sistema e fisico.

Acao principal: abrir `/inventory/counts/new`.

Acao secundaria: ver contagens.

Conclusao: existe contagem criada ou usuario marcou para fazer depois.

Progresso: count em rascunho ou confirmado.

### 11. Concluir guia

Objetivo: reforcar mapa mental e proximas acoes.

Mensagem: "Seu estoque esta pronto para operar. O guia continua disponivel quando precisar."

Exemplo: "Cadastrar item, movimentar, consultar saldo, contar, corrigir."

Ilustracao sugerida: checklist completo.

Acao principal: concluir.

Acao secundaria: abrir guia permanente.

Conclusao: wizard marcado como concluido.

Progresso: todas as etapas obrigatorias completas ou puladas quando opcionais.

## Wizard da Unidade

Etapas recomendadas:

1. Ver o que a unidade controla.
2. Consultar saldo.
3. Registrar entrada ou saida, se permitido.
4. Abrir contagem fisica, se permitido.
5. Entender quando pedir ajuda para a franqueadora.

O wizard da unidade deve esconder configuracao da rede, Metadata Engine, terminologia e custos se o usuario nao tiver permissao.
