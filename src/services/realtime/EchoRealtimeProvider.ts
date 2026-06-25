import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { Channel } from 'laravel-echo';
import type { RealtimeEventHandler, RealtimeProvider } from './RealtimeProvider';
import {
  getRealtimeAuthHeaders,
  resolveRealtimeAuthUrl,
} from './realtimeConfig';
import type { EchoRealtimeConfig } from './realtimeConfig';

type EchoChannel = Channel & {
  error(callback: (error: unknown) => void): EchoChannel;
};

interface ListenerRegistration {
  event: string;
  handler: RealtimeEventHandler;
}

const noopHandler: RealtimeEventHandler = () => undefined;

function normalizePrivateChannelName(channel: string) {
  return channel.startsWith('private-') ? channel.slice('private-'.length) : channel;
}

export class EchoRealtimeProvider implements RealtimeProvider {
  private echo: Echo<'reverb'> | null = null;
  private readonly channels = new Map<string, EchoChannel>();
  private readonly listeners: ListenerRegistration[] = [];

  constructor(private readonly config: EchoRealtimeConfig) {}

  connect(): void {
    if (this.echo) return;

    if (!this.config.appKey || !this.config.host) {
      console.warn('[realtime] Reverb is enabled but app key or host is missing.');
      return;
    }

    try {
      this.echo = new Echo<'reverb'>({
        broadcaster: 'reverb',
        key: this.config.appKey,
        wsHost: this.config.host,
        wsPort: this.config.port,
        wssPort: this.config.port,
        forceTLS: this.config.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        Pusher,
        authorizer: channel => ({
          authorize: async (socketId, callback) => {
            try {
              const response = await fetch(resolveRealtimeAuthUrl(this.config.authEndpoint), {
                method: 'POST',
                credentials: 'include',
                headers: getRealtimeAuthHeaders(),
                body: new URLSearchParams({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              });

              const data = await response.json().catch(() => null);
              if (!response.ok) {
                callback(new Error(`Realtime authorization failed with status ${response.status}`), null);
                return;
              }

              callback(null, data);
            } catch (error) {
              callback(error instanceof Error ? error : new Error('Realtime authorization failed'), null);
            }
          },
        }),
      });
    } catch (error) {
      this.echo = null;
      console.warn('[realtime] Could not connect to Reverb.', error);
    }
  }

  disconnect(): void {
    if (!this.echo) return;

    this.channels.forEach((_channel, name) => this.echo?.leave(name));
    this.channels.clear();
    this.echo.disconnect();
    this.echo = null;
  }

  subscribe(channelName: string): void {
    if (!this.echo || this.channels.has(channelName)) return;

    try {
      const normalizedName = normalizePrivateChannelName(channelName);
      const channel = this.echo.private(normalizedName) as EchoChannel;
      channel.error(error => {
        console.warn(`[realtime] Subscription failed for ${channelName}.`, error);
      });
      this.listeners.forEach(({ event, handler }) => channel.listen(event, handler));
      this.channels.set(channelName, channel);
    } catch (error) {
      console.warn(`[realtime] Could not subscribe to ${channelName}.`, error);
    }
  }

  unsubscribe(channelName: string): void {
    if (!this.echo || !this.channels.has(channelName)) return;

    const normalizedName = normalizePrivateChannelName(channelName);
    this.echo.leave(normalizedName);
    this.channels.delete(channelName);
  }

  listen(event: string, handler: RealtimeEventHandler = noopHandler): void {
    if (this.listeners.some(item => item.event === event && item.handler === handler)) return;

    this.listeners.push({ event, handler });
    this.channels.forEach(channel => channel.listen(event, handler));
  }

  stopListening(event: string, handler?: RealtimeEventHandler): void {
    this.channels.forEach(channel => channel.stopListening(event, handler));

    for (let index = this.listeners.length - 1; index >= 0; index -= 1) {
      const listener = this.listeners[index];
      if (listener.event === event && (!handler || listener.handler === handler)) {
        this.listeners.splice(index, 1);
      }
    }
  }
}
