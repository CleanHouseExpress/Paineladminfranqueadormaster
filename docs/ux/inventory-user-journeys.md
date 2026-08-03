# Jornadas de usuario - Onboarding de Estoque

## Personas

Franqueadora:

- Configura a rede.
- Define itens, locais, parametros e permissao de uso.
- Quer padronizar operacao e reduzir erro nas unidades.

Unidade:

- Opera o dia a dia.
- Precisa saber o que tem, o que entrou, o que saiu e como contar.
- Quer respostas simples e poucas decisoes.

Administrador novo:

- Ja tem acesso ao modulo, mas nao sabe a ordem correta.
- Precisa entender sem ler documentacao tecnica.

Operador com permissao limitada:

- Vê apenas parte das telas.
- Deve receber ajuda compativel com permissao, sem CTA para acao proibida.

## Jornada da Franqueadora

1. Acessa `Estoque`.
2. Ve um resumo: "Vamos deixar o estoque pronto para operar".
3. Confirma se o modulo esta habilitado.
4. Revisa nomes usados pela rede, se necessario.
5. Cadastra ou revisa itens.
6. Cadastra locais de estoque.
7. Habilita itens por unidade.
8. Faz ou orienta a primeira entrada.
9. Confere saldos.
10. Entende como receitas e checklists podem gerar consumo/entrada.
11. Aprende a abrir uma contagem fisica.
12. Conclui o guia e deixa o guia permanente disponivel.

Momentos de trava:

- Configuracoes parecem tecnicas demais.
- Itens por unidade parece uma segunda lista de itens.
- Saldo so aparece depois de uma entrada oficial.
- Movimentos exigem escolher o tipo certo.
- Contagem gera ajustes e isso pode parecer perigoso.

## Jornada da Unidade

1. Acessa Estoque com permissao operacional.
2. Ve apenas o que pode consultar/operar.
3. Entende seus itens habilitados.
4. Consulta saldos por local.
5. Registra entrada, saida, consumo, perda ou ajuste se tiver permissao.
6. Abre contagem fisica quando permitido.
7. Corrige divergencias via confirmacao da contagem ou ajuste autorizado.

Momentos de trava:

- Nao saber diferenciar saldo, movimento e contagem.
- Nao saber qual local selecionar.
- Nao entender quando usar perda, saida, ajuste positivo ou ajuste negativo.
- Medo de confirmar contagem e alterar estoque.

## Jornada de primeiro valor

Primeiro valor para franqueadora:

```text
Modulo habilitado
-> primeiro item cadastrado
-> primeiro local criado
-> item habilitado na unidade
-> primeira entrada
-> saldo visivel
```

Primeiro valor para unidade:

```text
Abrir Estoque
-> ver itens da unidade
-> consultar saldo
-> registrar entrada ou fazer contagem
```

## Retorno apos abandono

Ao voltar, o usuario deve ver:

- Etapa em que parou.
- O que ja esta pronto.
- Proxima acao unica.
- Link direto para continuar.
- Opcao de "ver guia completo".

Exemplo:

```text
Voce ja tem itens e locais cadastrados.
Proximo passo: habilitar os itens nas unidades para comecar a movimentar.
```

## Complexidade por tela

Baixa:

- Dashboard de estoque.
- Saldos.
- Categorias.
- Fornecedores.

Media:

- Itens.
- Locais.
- Itens por unidade.

Alta:

- Configuracoes.
- Movimentacoes.
- Inventario fisico.
- Receitas e execucoes integradas ao estoque.

## O que esconder do iniciante

- Metadata Engine como conceito.
- Termos como ledger, capability e managerial effects.
- Transferencias indisponiveis.
- Planejamento/cobertura/divergencias/turnover enquanto nao houver tela principal dedicada.
- Detalhes de origem tecnica dos movimentos, exceto quando precisar auditar.

## O que mostrar depois

- Personalizacao de campos.
- Custos e CMV.
- Receita/executar ficha tecnica.
- Automacao por forms/checklists.
- Estorno/reversao.
- Inventario fisico avancado por divergencia.

## Fase B2.1 - Jornada implementada para franqueadora

A jornada implementada no frontend cobre somente a franqueadora no modulo `Estoque & Suprimentos`.

Entrada:

- Primeiro acesso ao dashboard de Estoque com guia nao iniciado: convite modal.
- Acesso recorrente: botao "Guia de configuracao" no header.
- Guia iniciado e nao concluido: card "Continue configurando seu estoque".

Fluxo:

1. Usuario inicia o convite.
2. Frontend salva `completed_step = welcome` no backend.
3. Wizard abre a etapa atual retornada pelo backend.
4. Cada CTA principal direciona para a rota existente em `step.path`.
5. Etapas opcionais podem ser puladas via backend.
6. Ao voltar para Estoque, o frontend busca novamente o estado oficial.
7. Card de retomada reabre o wizard na etapa oficial.
8. Reset e dismiss usam endpoints B1 e nao removem dados operacionais.

Experiencia esperada:

- O usuario entende a ordem de implantacao sem sair do modulo.
- O guia nunca bloqueia uso do Estoque.
- Operadores sem permissao veem somente etapas que o backend permite.
- Capabilities desabilitadas nao viram promessa de funcionalidade.
- Erro na API de onboarding vira aviso discreto; o modulo continua disponivel.

Fora desta jornada:

- Wizard da unidade.
- Tour com spotlight.
- Central global de ajuda.
- FAQ completa.
- Qualquer cadastro ou movimento automatico de estoque.

## Atualizacao - jornada de identidade unica

Hoje, o item nasce no Catalogo. A entidade fonte da identidade e `CatalogItem`; Estoque mostra apenas itens controlados derivados dessa identidade.

Jornada revisada da franqueadora:

1. Acessa Catalogo.
2. Cria Morango, Leite, Embalagem ou insumo interno.
3. Marca "Controlar estoque".
4. Abre Estoque e ve o item automaticamente em Itens controlados.
5. Associa o item a unidade.
6. Registra entrada e acompanha saldo.

Itens por Unidade nao e uma segunda lista de cadastro: e a configuracao local do item que ja existe no Catalogo.
