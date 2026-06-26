export type RealtimeEventHandler = (payload: unknown) => void;

export interface RealtimeProvider {
  readonly isAvailable?: boolean;
  connect(): void | Promise<void>;
  disconnect(): void;
  subscribe(channel: string): void;
  unsubscribe(channel: string): void;
  listen(event: string, handler?: RealtimeEventHandler): void;
  stopListening(event: string, handler?: RealtimeEventHandler): void;
}
