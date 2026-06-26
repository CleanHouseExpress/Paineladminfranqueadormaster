import type { RealtimeEventHandler, RealtimeProvider } from './RealtimeProvider';

export class NullRealtimeProvider implements RealtimeProvider {
  readonly isAvailable = false;

  connect(): void {}

  disconnect(): void {}

  subscribe(_channel: string): void {}

  unsubscribe(_channel: string): void {}

  listen(_event: string, _handler?: RealtimeEventHandler): void {}

  stopListening(_event: string, _handler?: RealtimeEventHandler): void {}
}

export const nullRealtimeProvider = new NullRealtimeProvider();
