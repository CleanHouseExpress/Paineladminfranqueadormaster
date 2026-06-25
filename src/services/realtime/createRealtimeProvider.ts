import { EchoRealtimeProvider } from './EchoRealtimeProvider';
import { nullRealtimeProvider } from './NullRealtimeProvider';
import type { RealtimeProvider } from './RealtimeProvider';
import {
  createEchoRealtimeConfig,
  isRealtimeEnabled,
} from './realtimeConfig';
import type { RealtimeEnv } from './realtimeConfig';

export function createRealtimeProvider(env: RealtimeEnv): RealtimeProvider {
  if (!isRealtimeEnabled(env)) return nullRealtimeProvider;
  return new EchoRealtimeProvider(createEchoRealtimeConfig(env));
}

const viteEnv = ((import.meta as ImportMeta & { env?: RealtimeEnv }).env ?? {});

export const defaultRealtimeProvider = createRealtimeProvider(viteEnv);
