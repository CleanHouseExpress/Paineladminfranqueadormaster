# Frontend Realtime com Laravel Echo e Reverb

## Estado padrao

O Realtime permanece desligado por padrao. Com `VITE_REALTIME_ENABLED=false` ou sem essa variavel, o `RealtimeContextProvider` usa `NullRealtimeProvider` e nenhuma conexao websocket e aberta.

Ainda nao existem inscricoes da Communication Inbox. A feature flag apenas seleciona e conecta o provider.

## Variaveis de ambiente

```env
VITE_REALTIME_ENABLED=false
VITE_REVERB_APP_KEY=
VITE_REVERB_HOST=
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
VITE_REVERB_AUTH_ENDPOINT=/broadcasting/auth
```

- `VITE_REALTIME_ENABLED`: use `true` para selecionar o provider Echo.
- `VITE_REVERB_APP_KEY`: chave publica configurada no Reverb.
- `VITE_REVERB_HOST`: host websocket, sem protocolo.
- `VITE_REVERB_PORT`: porta websocket.
- `VITE_REVERB_SCHEME`: `http` usa `ws`; `https` usa `wss`.
- `VITE_REVERB_AUTH_ENDPOINT`: endpoint da orchestra-api que autoriza canais privados. Pode ser relativo ao `VITE_API_BASE_URL` ou uma URL absoluta.

Alteracoes em variaveis `VITE_*` exigem reiniciar o servidor Vite ou gerar um novo build.

## Autenticacao

O authorizer envia:

- cookie de sessao com `credentials: include`;
- `Authorization: Bearer <token>` quando `orchestra_auth_token` existe;
- headers JSON/AJAX equivalentes aos usados pelo client HTTP.

A orchestra-api continua responsavel por validar autenticacao, RBAC, TBAC e acesso ao canal solicitado.

## Como ligar

1. Configure as variaveis do Reverb no ambiente frontend.
2. Defina `VITE_REALTIME_ENABLED=true`.
3. Reinicie o Vite.
4. Confirme no navegador a conexao `ws` ou `wss` e as chamadas ao endpoint de autorizacao.

## Como desligar

Defina `VITE_REALTIME_ENABLED=false` ou remova a variavel. O contexto voltara a fornecer `NullRealtimeProvider`.

## Depuracao

- Verifique o console por mensagens prefixadas com `[realtime]`.
- Confirme app key, host, porta e scheme.
- Verifique a aba Network para o websocket e o `POST /broadcasting/auth`.
- Confirme se token e cookies pertencem ao tenant correto.
- Respostas `401` e `403` no auth endpoint indicam falha de sessao ou autorizacao de canal.

## Limitacoes atuais

- A Communication Inbox ainda nao assina canais nem eventos.
- Nao ha presenca, typing, polling ou estrategia de atualizacao de cache.
- Nao ha UI de status da conexao.
- Falhas sao isoladas e registradas no console; elas nao tornam o websocket obrigatorio para usar a aplicacao.
