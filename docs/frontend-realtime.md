# Frontend Realtime

## Arquitetura

A camada de Realtime fica em `src/services/realtime` e isola a UI do transporte que sera adotado. Componentes e hooks devem depender apenas de `RealtimeProvider`, sem importar Laravel Echo, Reverb, Pusher ou detalhes de autenticacao.

O `RealtimeContextProvider` foi adicionado ao `AppProvider`. Nesta fase ele entrega `nullRealtimeProvider`, portanto nao abre conexoes, nao registra canais e nao altera o comportamento atual da aplicacao.

## Contrato do provider

`RealtimeProvider` define:

- `connect()` e `disconnect()` para o ciclo de vida da conexao;
- `subscribe(channel)` e `unsubscribe(channel)` para canais;
- `listen(event, handler)` e `stopListening(event, handler)` para eventos.

O payload recebido pelo handler e inicialmente `unknown`. Cada modulo deve validar ou adaptar o payload antes de atualizar seu estado.

## Provider padrao

`NullRealtimeProvider` implementa todos os metodos como operacoes vazias. Ele permite preparar pontos de extensao e consumir `useRealtime()` sem condicionais enquanto nao existe uma conexao websocket configurada.

Um provider concreto podera ser injetado pela propriedade `provider` de `RealtimeContextProvider`.

## Futura integracao com Laravel Echo

Uma implementacao futura, por exemplo `EchoRealtimeProvider`, devera:

1. criar e encerrar a instancia do Laravel Echo;
2. usar a orchestra-api para autenticar canais privados;
3. incluir os headers de autenticacao e contexto de tenant usados pelo `apiClient`;
4. traduzir `subscribe`, `listen`, `stopListening` e `unsubscribe` para a API do Echo;
5. normalizar erros de conexao e reconexao sem expor o SDK aos modulos;
6. ser injetada no `RealtimeContextProvider` no bootstrap da aplicacao.

Nesta sprint nao ha dependencia de Echo, Reverb ou Pusher e nenhuma conexao e iniciada.

## Communication Inbox

A `CommunicationInboxPage` consome `useRealtime()` sem depender de Echo diretamente.

Ao montar, a inbox assina o canal privado do tenant:

- `tenant.{tenantId}.communication`

Ao selecionar uma conversa, assina:

- `conversation.{conversationId}`

Ao trocar de conversa, o canal anterior e desassinado. Ao desmontar a tela, todos os listeners e canais usados pela pagina sao limpos pelo ciclo de vida do React.

Eventos consumidos:

- `ConversationCreated`
- `ConversationUpdated`
- `ConversationAssigned`
- `ConversationReturnedToAi`
- `ConversationClosed`
- `ConversationReopened`
- `ConversationHandoffRequested`
- `MessageReceived`
- `MessageSent`
- `MessageStatusUpdated`
- `TimelineUpdated`

Comportamento:

- eventos de conversa atualizam summary e lista;
- eventos da conversa aberta tambem recarregam detalhe;
- `MessageReceived` e `MessageSent` recarregam mensagens quando a conversa aberta corresponde ao payload;
- `MessageStatusUpdated` recarrega status de entrega quando a conversa aberta corresponde ao payload;
- `TimelineUpdated` recarrega timeline somente quando a aba Timeline esta aberta;
- ha dedupe curto para reduzir refetch duplicado quando o mesmo evento chegar pelo canal do tenant e pelo canal da conversa.

Com `NullRealtimeProvider`, as chamadas sao operacoes vazias e a UI continua funcionando normalmente.
