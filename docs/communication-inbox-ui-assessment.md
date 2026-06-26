# Communication Inbox UI Assessment

Auditoria do modulo de chat/comunicacao existente em `C:\repos\Clin\clin-pulse-dashboard` para avaliar reaproveitamento no novo modulo Communication Inbox da Orchestra.

## Visao geral do chat existente

O chat antigo esta concentrado em `src/modules/messaging` no frontend `clin-pulse-dashboard`. Ele implementa uma central de atendimento omnichannel com:

- lista de conversas com busca, filtro por status, filtro rapido "minhas" e "somente IA", filtro por departamento e scroll infinito;
- janela de chat com mensagens em ordem cronologica, envio de texto, imagem, video e audio gravado no navegador;
- controles de atendimento para assumir conversa, transferir para atendente online, retornar ao bot/IA, fechar a conversa localmente e encerrar conversa no backend;
- painel lateral de cliente com dados cadastrais, servicos, historico e notas;
- dashboard operacional, metricas, lista de atendentes, configuracoes e logs;
- realtime via Pusher/Laravel Echo-compatible channels, atualizando cache do React Query.

O modulo ja usa React Query, shadcn/ui, lucide-react, sonner, axios compartilhado (`src/config/api.js`) e AuthContext do painel antigo.

No frontend Orchestra atual (`Paineladminfranqueadormaster`), nao ha ainda uma tela real de Communication Inbox. Existe apenas placeholder de suporte/atendimento em `src/app/App.tsx` e metadados de modulo em `src/services/moduleRegistry.ts`.

## Arquivos relevantes

Rotas e paginas no `clin-pulse-dashboard`:

- `src/App.tsx`: registra `/atendimento`, `/atendimento/dashboard`, `/atendimento/atendentes`, `/atendimento/metricas`, `/atendimento/configuracoes` e `/atendimento/logs`.
- `src/modules/messaging/pages/MessagingDashboard.tsx`: tela principal de inbox/chat.
- `src/modules/messaging/pages/MessagingDashboardHome.tsx`: dashboard operacional.
- `src/modules/messaging/pages/AttendantsPage.tsx`: monitoramento/lista de atendentes.
- `src/modules/messaging/pages/MetricsPage.tsx`: metricas detalhadas.
- `src/modules/messaging/pages/SettingsPage.tsx`: configuracoes.
- `src/modules/messaging/pages/LogsPage.tsx`: logs.

Componentes principais:

- `src/modules/messaging/components/ConversationList/ConversationList.tsx`: lista, busca, filtros e contador.
- `src/modules/messaging/components/ChatWindow/ChatWindow.tsx`: header da conversa, area de mensagens, anexos, audio e input.
- `src/modules/messaging/components/AssignmentControls/AssignmentControls.tsx`: assumir, transferir, retornar ao bot e encerrar.
- `src/modules/messaging/components/MessageBubble/MessageBubble.tsx`: renderizacao de mensagens.
- `src/modules/messaging/components/MessageBubble/ImageMessagePreview.tsx`: preview/lightbox de imagem.
- `src/modules/messaging/components/MessageBubble/VideoMessagePreview.tsx`: preview de video.
- `src/modules/messaging/components/MessageBubble/AudioMessagePlayer.tsx`: player de audio.
- `src/modules/messaging/components/ClientInfoPanel/ClientInfoPanel.tsx`: painel de cliente.
- `src/modules/messaging/components/NewConversationModal.tsx`: criacao/inicio de conversa.
- `src/modules/messaging/components/layout/MessagingHeader.tsx`: status/presenca do atendente.
- `src/modules/messaging/components/MessagingNav.tsx` e `MessagingPageWrapper.tsx`: navegacao/shell do modulo.
- `src/modules/messaging/components/shared/StatusBadge.tsx` e `ChannelIcon.tsx`: badges e icones reutilizaveis.

Services/api clients:

- `src/modules/messaging/services/messagingApi.ts`: client principal para `/api/messaging/*` e alguns endpoints legados `/api/clients/*`.
- `src/config/api.js`: instancia axios compartilhada, base URL, token e interceptors.
- `src/types/messaging.ts`: contrato SDK/exemplo antigo para Messaging Core.

Hooks/stores:

- `src/modules/messaging/hooks/useMessaging.ts`: orquestra conversa selecionada, mensagens, cliente e acoes.
- `src/modules/messaging/hooks/useConversations.ts`: listagem infinita e mutations de assign/release/transfer/close.
- `src/modules/messaging/hooks/useMessages.ts`: busca mensagens, envio e optimistic update.
- `src/modules/messaging/hooks/useConversationDetail.ts`: detalhe da conversa e fallback de cliente.
- `src/modules/messaging/hooks/useMessagingSocket.ts`: realtime Pusher.
- `src/modules/messaging/hooks/realtimeConnection.ts`: store externo de status realtime.
- `src/modules/messaging/hooks/useAgentPresence.ts`: status do atendente logado e agentes online.
- `src/modules/messaging/hooks/useMessagingAttendants.ts`: lista de atendentes.
- `src/modules/messaging/hooks/useMessagingDashboard.ts` e `useMessagingMetrics.ts`: dashboard/metricas.
- `src/modules/messaging/hooks/useMessagingClientPanel.ts`, `useClientServices.ts`, `useClientConversations.ts`, `useClientNotes.ts`: painel do cliente.
- `src/modules/messaging/hooks/useCreateConversation.ts`, `useStartWhatsAppConversation.ts`, `useSendMessage.ts`, `useConversation.ts`: hooks especificos/legados.
- `src/modules/messaging/hooks/queryRetry.ts` e `presenceCache.ts`: utilitarios de cache/retry.

Realtime:

- `src/modules/messaging/hooks/useMessagingSocket.ts`
- `src/modules/messaging/hooks/realtimeConnection.ts`
- `src/modules/messaging/config/messagingConfig.ts`

Tipos/adapters/utils:

- `src/modules/messaging/types/messaging.types.ts`
- `src/types/messaging.ts`
- `src/modules/messaging/adapters/messaging.adapter.ts`
- `src/modules/messaging/utils/messagingUtils.ts`
- `src/modules/messaging/mocks/mockData.ts`

Testes existentes:

- `src/modules/messaging/adapters/messaging.adapter.test.ts`: mapeia conversa, mensagem, payloads de audio/video e paginacao.
- `src/modules/messaging/utils/messagingUtils.test.ts`: labels/status/canais.
- Nao foram encontrados testes e2e especificos para `/atendimento`; o repo antigo tem Vitest, mas nao possui pasta `tests` de Playwright.

## Fluxos existentes

1. Entrada na inbox
   - Rota `/atendimento` renderiza `MessagingDashboard`.
   - `useMessaging` carrega conversas via `useConversations({ perPage: 1000 })`.
   - A tela restaura a conversa selecionada via IndexedDB (`messaging-dashboard-state-v1`).

2. Selecao e leitura de conversa
   - `ConversationList` seleciona uma conversa.
   - `useMessages` busca mensagens em um ou mais `sourceConversationIds`.
   - `useConversationDetail` busca detalhe se a conversa nao vier com cliente embutido.
   - A UI zera contador local de nao lidas via baseline em memoria.

3. Acompanhar IA
   - Conversas com `status === 'waiting_bot'` ou `aiActive` aparecem no filtro "Somente IA".
   - A conversa pode ser aberta e visualizada sem assumir.
   - O input permanece desabilitado ate assumir.

4. Assumir atendimento humano
   - `AssignmentControls` exibe "Assumir Conversa" quando o status e `waiting_human` ou `waiting_bot` e nao ha lock.
   - `useConversations.assignConversation` chama `POST /api/messaging/conversations/{id}/assign`.
   - A conversa passa para `in_progress`/lock do usuario atual.

5. Atendimento humano
   - O input e habilitado apenas se a conversa esta `in_progress` ou `waiting_human` e `lockedByUserId === currentUserId`.
   - `useMessages.sendMessage` faz optimistic update e chama `POST /api/messaging/messages`.

6. Transferencia
   - `AssignmentControls` carrega atendentes via `GET /api/messaging/attendants`.
   - Mostra somente atendentes online diferentes do usuario atual.
   - Ao confirmar, chama `POST /api/messaging/conversations/{id}/transfer`.

7. Voltar para IA/bot
   - Acao "Retornar ao Bot" chama `POST /api/messaging/conversations/{id}/release-to-bot`.
   - A UI invalida conversa, mensagens e presenca.

8. Encerrar/reabrir
   - O legado implementa encerrar via `POST /api/messaging/conversations/{id}/close`.
   - Nao ha fluxo de reopen na UI antiga.
   - O item "Fechar conversa" no menu apenas sai da conversa selecionada no frontend; nao fecha no backend.

9. Realtime
   - A tela assina `private-conversations.queue` e `private-conversations.{conversationId}`.
   - Eventos `MessageCreated` e `ConversationUpdated` fazem upsert da conversa e append/dedupe de mensagem no cache React Query.

## Acoes disponiveis

Na UI principal:

- Buscar conversa por nome/telefone.
- Filtrar por status: `waiting_human`, `in_progress`, `waiting_bot`, `closed`.
- Filtrar por "Todas", "Minhas" e "Somente IA".
- Filtrar por departamento: `suporte_profissional`, `suporte_cliente`, `vendas_servicos`, `clin_pro`.
- Visualizar conversa e mensagens.
- Visualizar IA ativa e atendente atual.
- Assumir conversa.
- Transferir para outro atendente online.
- Retornar conversa ao bot/IA.
- Encerrar conversa.
- Sair da conversa selecionada sem alterar backend.
- Enviar texto.
- Anexar imagem/video em base64.
- Gravar/enviar audio em base64.
- Iniciar nova conversa ou WhatsApp ativo.
- Consultar painel de cliente, historico, servicos e notas.
- Alterar status de presenca do atendente (`online`, `offline`, `paused`, `away`).

## Dependencias de API

Endpoints antigos usados por `messagingApi.ts`:

- `GET /api/messaging/conversations`
- `GET /api/messaging/conversations/{id}`
- `GET /api/messaging/conversations/{id}/messages`
- `POST /api/messaging/messages`
- `POST /api/messaging/conversations/{id}/assign`
- `POST /api/messaging/conversations/{id}/release-to-bot`
- `POST /api/messaging/conversations/{id}/transfer`
- `POST /api/messaging/conversations/{id}/close`
- `POST /api/messaging/conversations`
- `POST /api/messaging/conversations/start-whatsapp`
- `GET /api/messaging/dashboard`
- `GET /api/messaging/attendants`
- `GET /api/messaging/metrics/cards`
- `GET /api/messaging/metrics/conversations-per-day`
- `GET /api/messaging/metrics/response-time-trend`
- `GET /api/messaging/metrics/channel-comparison`
- `GET /api/messaging/clients/{id}/panel`
- `GET /api/messaging/clients/{id}`
- `GET /api/messaging/agents/me/status`
- `POST /api/messaging/agents/me/status`
- `POST /api/messaging/agents/me/activity`
- `GET /api/messaging/agents/online`
- `GET /api/clients/{id}/services`
- `GET /api/clients/{id}/conversations`
- `GET /api/clients/{id}/notes`
- `POST /api/clients/{id}/notes`

Comparacao com endpoints novos da `orchestra-api`:

| Fluxo | API antiga | API nova | Observacao |
| --- | --- | --- | --- |
| Resumo da inbox | `GET /api/messaging/dashboard` e metricas separadas | `GET /api/tenant/communication/inbox/summary` | Adaptar dashboard/resumo. O contrato novo parece mais focado na inbox. |
| Listar conversas | `GET /api/messaging/conversations` | `GET /api/tenant/communication/inbox/conversations` | Reaproveitavel com adapter novo. Validar filtros/paginacao/campos. |
| Detalhe da conversa | `GET /api/messaging/conversations/{id}` | `GET /api/tenant/communication/inbox/conversations/{conversation_id}` | Reaproveitavel com adapter novo. |
| Mensagens | `GET /api/messaging/conversations/{id}/messages` | `GET /api/tenant/communication/inbox/conversations/{conversation_id}/messages` | Reaproveitavel para leitura. |
| Solicitar handoff humano | inexistente com esse nome; havia `assign` direto e status `waiting_human` | `POST /api/tenant/communication/inbox/conversations/{conversation_id}/request-handoff` | Criar acao nova na UI ou mapear "solicitar atendimento humano". |
| Assumir/atribuir | `POST /api/messaging/conversations/{id}/assign` | `POST /api/tenant/communication/inbox/conversations/{conversation_id}/assign` | Provavel reaproveitamento de fluxo; validar payload (`user_id`, `assignee_id` ou sem body). |
| Encerrar | `POST /api/messaging/conversations/{id}/close` | `POST /api/tenant/communication/inbox/conversations/{conversation_id}/close` | Reaproveitavel. |
| Reabrir | nao implementado | `POST /api/tenant/communication/inbox/conversations/{conversation_id}/reopen` | Nova acao/UI necessaria. |
| Voltar para IA | `POST /api/messaging/conversations/{id}/release-to-bot` | nao listado | Gap de backend ou acao deve ser modelada por outro endpoint. |
| Transferir | `POST /api/messaging/conversations/{id}/transfer` | nao listado diretamente; talvez `assign` com alvo | Gap/ajuste de contrato: precisa saber se `assign` transfere para outro usuario. |
| Enviar mensagem | `POST /api/messaging/messages` | nao listado | Gap se o novo Inbox precisar resposta humana pelo frontend. |
| Atendentes/agentes online | `GET /api/messaging/attendants`, `GET /agents/online` | nao listado | Gap para menu de transferencia e presenca. Pode vir de RBAC/usuarios da orchestra-api. |
| Presenca do atendente | `/agents/me/status`, `/agents/me/activity` | nao listado | Gap se o produto mantiver disponibilidade online/offline. |
| Cliente/painel | `/messaging/clients/*`, `/clients/*` | nao listado | Reaproveitar visualmente apenas se houver endpoint equivalente em Orchestra. |

## Dependencias de realtime

O legado usa `pusher-js` diretamente. A configuracao esta em `messagingConfig.ts`:

- habilita somente se `__BROADCAST_DRIVER__ === 'pusher'` e `__PUSHER_APP_KEY__` estiver presente;
- auth endpoint default: `${VITE_API_URL sem /api}/api/broadcasting/auth`;
- token: `localStorage.getItem('auth_token')`;
- canais:
  - `private-conversations.queue`;
  - `private-conversations.{conversationId}`;
- eventos:
  - `MessageCreated`;
  - `ConversationUpdated`.

Para Orchestra, isso depende de confirmacao do backend:

- se `orchestra-api` publicara eventos realtime para inbox;
- nomes dos canais tenant-aware;
- auth endpoint e headers;
- payload dos eventos;
- se o frontend atual tera `pusher-js` como dependencia. Hoje o `Paineladminfranqueadormaster` nao declara `pusher-js` em `package.json`.

## O que reaproveitar

- Estrutura visual da inbox: lista + chat + painel lateral em `MessagingDashboard`.
- `ConversationList` como base para busca/filtros/status/unread.
- `ChatWindow` para layout de mensagens, header, input e estados bloqueados, desde que o novo modulo precise envio.
- `MessageBubble` e previews de midia para leitura de mensagens.
- `StatusBadge`, `ChannelIcon` e `messagingUtils` com ajustes de labels/status.
- Padrao de adapter (`messaging.adapter.ts`) para traduzir snake_case/backend para modelo de UI.
- Padrao de React Query dos hooks `useConversations`, `useMessages` e invalidacoes apos mutations.
- Tratamento de lock/conflito no assign.
- Realtime cache updates (`upsertConversationInCache`, `appendMessageInCache`) como desenho, nao como contrato final.
- Estado persistido de conversa selecionada via IndexedDB, se desejavel na Orchestra.
- Testes de adapter como modelo para cobrir o contrato novo.

## O que adaptar

- Base path de API de `/api/messaging` para `/api/tenant/communication/inbox`.
- Auth/token para usar `src/services/apiClient.ts` da Orchestra, nao `src/config/api.js` do Clin antigo.
- Tipos de conversa/mensagem para o contrato da `orchestra-api`.
- Payloads e respostas de `assign`, `close`, `reopen` e `request-handoff`.
- Status e labels: mapear status novos da Orchestra para `waiting_bot`, `waiting_human`, `in_progress`, `closed` ou ajustar a UI para os nomes novos.
- Transferencia: decidir se vira `assign` para outro usuario ou se exige endpoint dedicado.
- "Voltar para IA": depende de endpoint equivalente ao antigo `release-to-bot`.
- "Acompanhar IA": manter como leitura de conversas em modo IA se a API expuser `interaction_mode`, `ai_active` ou status equivalente.
- Lista de atendentes: obter usuarios elegiveis via Orchestra/RBAC ou endpoint novo.
- Realtime: trocar nomes de canais/eventos e incluir dependencia/config se backend suportar.
- Painel de cliente: trocar por dados disponiveis na nova conversa ou remover da primeira entrega.
- Rotas: usar o padrao de modulo/rotas da Orchestra atual, nao o `react-router-dom`/`AdminLayout` antigo.
- UI kit: ambos usam shadcn/lucide, mas os paths e tokens visuais diferem.

## O que descartar

- `src/types/messaging.ts` como SDK exemplo antigo; util apenas como referencia historica.
- Endpoints legados `/api/messaging/dashboard`, `/metrics/*`, `/attendants`, `/agents/*`, `/clients/*` se nao existirem na Orchestra.
- Criacao ativa de conversa e WhatsApp (`POST /conversations`, `start-whatsapp`) para a primeira fase, pois nao aparecem no contrato novo.
- Presenca online/offline/away se nao houver backend novo.
- `CURRENT_USER_ID` mockado.
- Mocks como fonte de verdade; podem ser usados apenas para story/teste local.
- Logs/configuracoes/metricas antigas fora do escopo inicial da inbox.
- Upload/base64 de anexos e gravacao de audio ate existir endpoint de envio/armazenamento no novo backend.

## Gaps de backend

Para reproduzir todos os comportamentos desejados do chat antigo, faltam confirmacoes ou endpoints no contrato novo informado:

- Envio de mensagem humana. Os endpoints listados cobrem leitura e acoes administrativas, mas nao `send message`.
- Voltar para IA/bot. Nao ha equivalente direto ao antigo `release-to-bot`.
- Transferencia. Pode ser coberta por `assign`, mas falta contrato claro para atribuir a outro usuario, payload e validacoes.
- Lista de atendentes/usuarios elegiveis para transferencia. Como o communication-service nao gerencia usuarios/permissoes, isso deve vir da `orchestra-api`/RBAC.
- Presenca/disponibilidade de atendentes (`online`, `paused`, `away`) se a operacao exigir fila por disponibilidade.
- Realtime para novas mensagens e atualizacoes de conversa: canais, eventos, payloads e auth.
- Contrato de conflitos/locks no `assign`: status HTTP, shape do erro e dados do usuario que possui lock.
- Dados de cliente/painel lateral: nome, telefone, tags, historico, notas e servicos.
- Reopen ja existe no backend novo, mas nao existe no legado UI; precisa UX e regras de quando mostrar.
- Summary novo deve ser detalhado: contadores, agrupamentos, SLA, canais e status.

## Plano incremental de migracao

1. Criar contrato frontend novo
   - Definir `CommunicationInboxConversation`, `CommunicationInboxMessage`, `CommunicationInboxSummary` e DTOs de acoes a partir da `orchestra-api`.
   - Escrever adapter novo com testes unitarios antes de portar UI.

2. Implementar client de leitura
   - Criar service usando `src/services/apiClient.ts`.
   - Cobrir `summary`, `conversations`, `conversation detail` e `messages`.
   - Manter pagina inicial read-only.

3. Portar layout minimo da inbox
   - Reaproveitar a estrutura lista + chat do legado.
   - Comecar sem envio, sem transferencia e sem painel de cliente se os contratos ainda nao estiverem fechados.
   - Conectar filtros apenas aos campos suportados pela API nova.

4. Adicionar acoes suportadas
   - Implementar `request-handoff`, `assign`, `close` e `reopen`.
   - Tratar 403/RBAC/TBAC e conflito de lock com mensagens claras.
   - Invalidar queries apos cada mutation.

5. Resolver transferencia e voltar para IA
   - Se `assign` suportar alvo, adaptar o menu de transferencia.
   - Se nao, solicitar endpoint dedicado.
   - Solicitar/implementar endpoint equivalente a `release-to-bot` para "voltar para IA".

6. Adicionar envio de mensagem
   - Somente apos endpoint novo definido.
   - Comecar por texto; anexos/audio depois.

7. Adicionar realtime
   - Confirmar provider/canais/eventos.
   - Reaproveitar desenho do `useMessagingSocket`, mas tenant-aware e com auth da Orchestra.
   - Testar atualizacao de lista, detalhe e mensagens.

8. Evoluir paineis auxiliares
   - Summary/dashboard da inbox.
   - Dados do cliente.
   - Atendentes/presenca, se houver contrato.

9. Validar
   - Unit tests para adapters e services.
   - E2E smoke para rota da inbox, leitura, assign/close/reopen.
   - Build e `git diff --check`.

## Nova auditoria de paridade legado x Communication Inbox

Auditoria atualizada usando este documento como baseline e comparando os comportamentos do modulo legado `clin-pulse-dashboard/src/modules/messaging` com o modulo novo `src/modules/communication-inbox` do frontend Orchestra.

| Area do legado | Estado na Communication Inbox | Observacao |
| --- | --- | --- |
| Rota principal de atendimento | Implementado | Nova rota `/communication/inbox`, sem reutilizar `/atendimento`. |
| Lista de conversas | Implementado | Usa `GET /api/tenant/communication/inbox/conversations`. |
| Busca por conversa | Implementado | Campo de busca adicionado e enviado como filtro `search` no endpoint novo de conversas. |
| Filtros por status | Implementado | Filtro basico de status usando contrato novo. |
| Filtro por handoff | Implementado | Usa `handoff`/`handoff_status` do contrato novo. |
| Filtro por atribuicao | Implementado | Usa `assignment_status` do contrato novo. |
| Paginacao/scroll de conversas | Parcial | Adicionada navegacao por pagina usando `meta`; ainda nao e scroll infinito. |
| Cards de resumo | Implementado | Usa `GET /api/tenant/communication/inbox/summary`. |
| Selecao de conversa | Implementado | Carrega detalhe e mensagens pelo contrato novo. |
| Janela de mensagens | Implementado | Renderiza mensagens com direcao, autor e data. |
| Composer humano | Implementado | Usa `POST /api/tenant/communication/inbox/conversations/{id}/messages`. |
| Enter para enviar e Shift+Enter | Implementado | Mantido comportamento esperado do chat. |
| Anexos de imagem/video | Ausente | Nao ha contrato novo de upload/anexo no escopo atual. |
| Audio gravado no navegador | Ausente | Nao ha contrato novo de midia/audio no escopo atual. |
| Assumir atendimento | Implementado | Usa `POST /assign`. |
| Solicitar handoff | Implementado | Usa `POST /request-handoff`. |
| Encerrar conversa | Implementado | Usa `POST /close`. |
| Reabrir conversa | Implementado | Usa `POST /reopen`. |
| Voltar para IA | Implementado | Usa `POST /return-to-ai`. |
| Transferencia para atendente | Ausente | Nao ha endpoint dedicado nem lista de usuarios elegiveis no contrato atual. |
| Presenca/atendentes online | Ausente | Nao ha contrato novo de presenca no Inbox. |
| Painel lateral de cliente | Parcial | Adicionado painel de detalhes com dados da conversa; historico, notas e servicos dependem de novos contratos. |
| Timeline operacional | Implementado | Usa `GET /timeline` e renderiza eventos, vazio e erro seguro. |
| Realtime Pusher/Echo na tela | Parcial | Camada `src/services/realtime` existe com Null/Echo por feature flag, mas a Inbox ainda nao assina canais. |
| Dashboard operacional legado | Parcial | Summary basico implementado; metricas detalhadas antigas nao foram portadas. |
| Lista de atendentes | Ausente | Depende de contrato RBAC/usuarios da Orchestra. |
| Configuracoes/logs do modulo antigo | Ausente | Fora do escopo do Inbox operacional atual. |
| Testes E2E do fluxo | Implementado | Cobrem render, acoes, composer, timeline, busca, paginacao e detalhes. |

### Incrementos implementados nesta auditoria

- Busca na lista de conversas com filtro `search`, mantendo o client em `/api/tenant/communication/inbox/conversations`.
- Paginacao basica da lista de conversas usando `meta.currentPage`, `meta.lastPage`, `meta.perPage` e `meta.total`.
- Painel lateral de detalhes da conversa selecionada com dados ja expostos pelo contrato atual.
- Testes E2E para busca, paginacao e painel de detalhes.

### Limites mantidos

- Nenhum endpoint legado `/api/messaging/*` foi introduzido.
- Nenhum codigo funcional do modulo antigo foi copiado.
- Transferencia, presenca, anexos, audio, painel completo de cliente e assinatura realtime da Inbox permanecem ausentes ate existirem contratos novos equivalentes ou decisao de produto.
