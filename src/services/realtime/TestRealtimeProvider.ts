import type { RealtimeEventHandler, RealtimeProvider } from './RealtimeProvider';

interface RealtimeTestState {
  channels: string[];
  subscribed: string[];
  unsubscribed: string[];
  listened: string[];
  stopped: string[];
  connected: boolean;
}

declare global {
  interface Window {
    __ORCHESTRA_REALTIME_TEST__?: boolean;
    __ORCHESTRA_REALTIME_TEST_STATE__?: RealtimeTestState;
    __ORCHESTRA_REALTIME_EMIT__?: (event: string, payload?: unknown) => void;
  }
}

function createState(): RealtimeTestState {
  return {
    channels: [],
    subscribed: [],
    unsubscribed: [],
    listened: [],
    stopped: [],
    connected: false,
  };
}

export class TestRealtimeProvider implements RealtimeProvider {
  readonly isAvailable = true;

  private readonly listeners = new Map<string, Set<RealtimeEventHandler>>();
  private readonly channels = new Set<string>();

  constructor(private readonly state: RealtimeTestState = createState()) {
    if (typeof window !== 'undefined') {
      window.__ORCHESTRA_REALTIME_TEST_STATE__ = this.state;
      window.__ORCHESTRA_REALTIME_EMIT__ = (event, payload) => this.emit(event, payload);
    }
  }

  connect(): void {
    this.state.connected = true;
  }

  disconnect(): void {
    this.state.connected = false;
    this.channels.clear();
    this.listeners.clear();
    this.state.channels = [];
  }

  subscribe(channel: string): void {
    if (this.channels.has(channel)) return;

    this.channels.add(channel);
    this.state.channels = Array.from(this.channels);
    this.state.subscribed.push(channel);
  }

  unsubscribe(channel: string): void {
    if (!this.channels.has(channel)) return;

    this.channels.delete(channel);
    this.state.channels = Array.from(this.channels);
    this.state.unsubscribed.push(channel);
  }

  listen(event: string, handler: RealtimeEventHandler = () => undefined): void {
    const handlers = this.listeners.get(event) ?? new Set<RealtimeEventHandler>();
    if (handlers.has(handler)) return;

    handlers.add(handler);
    this.listeners.set(event, handlers);
    this.state.listened.push(event);
  }

  stopListening(event: string, handler?: RealtimeEventHandler): void {
    if (!handler) {
      this.listeners.delete(event);
    } else {
      const handlers = this.listeners.get(event);
      handlers?.delete(handler);
      if (handlers?.size === 0) this.listeners.delete(event);
    }

    this.state.stopped.push(event);
  }

  emit(event: string, payload?: unknown): void {
    this.listeners.get(event)?.forEach(handler => handler(payload));
  }
}
