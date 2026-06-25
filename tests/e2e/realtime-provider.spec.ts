import { expect, test } from '@playwright/test';
import {
  EchoRealtimeProvider,
  NullRealtimeProvider,
  createRealtimeProvider,
  nullRealtimeProvider,
} from '../../src/services/realtime';
import type { RealtimeProvider } from '../../src/services/realtime';

test.describe('@smoke realtime provider', () => {
  test('NullRealtimeProvider implementa o contrato sem efeitos colaterais', async () => {
    const provider: RealtimeProvider = new NullRealtimeProvider();
    const handler = () => undefined;

    await provider.connect();
    provider.subscribe('private-tenant.communication.inbox');
    provider.listen('ConversationUpdated', handler);
    provider.stopListening('ConversationUpdated', handler);
    provider.unsubscribe('private-tenant.communication.inbox');
    provider.disconnect();

    expect(provider).toBeInstanceOf(NullRealtimeProvider);
  });

  test('exporta uma instancia nula padrao', () => {
    expect(nullRealtimeProvider).toBeInstanceOf(NullRealtimeProvider);
  });

  test('feature flag desligada usa NullRealtimeProvider', () => {
    expect(createRealtimeProvider({
      VITE_REALTIME_ENABLED: 'false',
    })).toBe(nullRealtimeProvider);
  });

  test('env ausente nao habilita websocket', () => {
    expect(createRealtimeProvider({})).toBe(nullRealtimeProvider);
  });

  test('feature flag ligada cria EchoRealtimeProvider sem conectar', () => {
    const provider = createRealtimeProvider({
      VITE_REALTIME_ENABLED: 'true',
      VITE_REVERB_APP_KEY: 'test-key',
      VITE_REVERB_HOST: 'localhost',
    });

    expect(provider).toBeInstanceOf(EchoRealtimeProvider);
    provider.disconnect();
  });
});
