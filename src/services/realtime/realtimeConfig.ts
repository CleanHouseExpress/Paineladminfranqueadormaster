import { apiClientConfig, AUTH_TOKEN_STORAGE_KEY } from '../apiClient';

export interface RealtimeEnv {
  VITE_REALTIME_ENABLED?: string;
  VITE_REVERB_APP_KEY?: string;
  VITE_REVERB_HOST?: string;
  VITE_REVERB_PORT?: string;
  VITE_REVERB_SCHEME?: string;
  VITE_REVERB_AUTH_ENDPOINT?: string;
}

export interface EchoRealtimeConfig {
  appKey: string;
  host: string;
  port: number;
  scheme: 'http' | 'https';
  authEndpoint: string;
}

export const isRealtimeEnabled = (env: RealtimeEnv) =>
  env.VITE_REALTIME_ENABLED?.trim().toLowerCase() === 'true';

export function createEchoRealtimeConfig(env: RealtimeEnv): EchoRealtimeConfig {
  const scheme = env.VITE_REVERB_SCHEME?.trim().toLowerCase() === 'https' ? 'https' : 'http';
  const parsedPort = Number(env.VITE_REVERB_PORT ?? '8080');

  return {
    appKey: env.VITE_REVERB_APP_KEY?.trim() ?? '',
    host: env.VITE_REVERB_HOST?.trim() || (typeof window !== 'undefined' ? window.location.hostname : ''),
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 8080,
    scheme,
    authEndpoint: env.VITE_REVERB_AUTH_ENDPOINT?.trim()
      || '/api/tenant/communication/broadcasting/auth',
  };
}

export function resolveRealtimeAuthUrl(authEndpoint: string) {
  if (/^https?:\/\//i.test(authEndpoint)) return authEndpoint;
  const path = authEndpoint.startsWith('/') ? authEndpoint : `/${authEndpoint}`;
  return `${apiClientConfig.baseUrl}${path}`;
}

export function getRealtimeAuthHeaders(): Record<string, string> {
  let token: string | null = null;

  try {
    token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in restricted browser modes.
  }

  return {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
