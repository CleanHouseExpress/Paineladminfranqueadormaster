import { expect, test } from '@playwright/test';
import {
  NullRealtimeProvider,
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
});
