type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientConfig {
  baseUrl: string;
  csrfCookiePath: string;
  defaultHeaders: HeadersInit;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: HttpMethod;
  body?: unknown;
  skipCsrf?: boolean;
  expireSessionOnUnauthorized?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown, message = 'API request failed') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const API_FIELD_LABELS: Record<string, string> = {
  document: 'CNPJ',
  email: 'e-mail',
  name: 'nome',
  password: 'senha',
  phone: 'telefone/WhatsApp',
  responsible_email: 'e-mail do responsavel',
  responsible_name: 'responsavel',
  responsible_phone: 'WhatsApp do responsavel',
};

function localizeApiMessage(message: string, field?: string): string {
  const label = field ? API_FIELD_LABELS[field] ?? field : 'campo';

  return message
    .replace(/^The (.+) field is required\.$/i, `O campo ${label} e obrigatorio.`)
    .replace(/^The (.+) field must be a valid email address\.$/i, `O campo ${label} deve ser um e-mail valido.`)
    .replace(/^The (.+) field must be (\d+) digits\.$/i, `O campo ${label} deve ter $2 digitos.`)
    .replace(/^The (.+) field must be between (\d+) and (\d+) digits\.$/i, `O campo ${label} deve ter entre $2 e $3 digitos.`)
    .replace(/^The (.+) field must be at least (\d+) characters\.$/i, `O campo ${label} deve ter pelo menos $2 caracteres.`)
    .replace(/^The selected (.+) is invalid\.$/i, `O valor selecionado para ${label} e invalido.`);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;

  const data = error.data;
  if (!isRecord(data)) return `${fallback} (${error.status})`;

  const errors = data.errors;
  if (isRecord(errors)) {
    const messages = Object.entries(errors)
      .flatMap(([field, value]) => {
        const items = Array.isArray(value) ? value : [value];
        return items
          .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
          .map(message => localizeApiMessage(message, field));
      });

    if (messages.length > 0) return [...new Set(messages)].join(' ');
  }

  return typeof data.message === 'string' && data.message.trim() !== ''
    ? localizeApiMessage(data.message)
    : `${fallback} (${error.status})`;
}

function withoutContentType(headers: HeadersInit): HeadersInit {
  const entries = new Headers(headers);
  entries.delete('Content-Type');
  entries.delete('content-type');
  return entries;
}

interface ApiClientEnv {
  VITE_API_PORT?: string;
  VITE_API_BASE_URL?: string;
}

const viteEnv = ((import.meta as ImportMeta & { env?: ApiClientEnv }).env ?? {});

function isLocalTenantHost(hostname: string) {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname.endsWith('.localhost');
}

function defaultTenantApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  const apiPort = viteEnv.VITE_API_PORT ?? (isLocalTenantHost(window.location.hostname) ? '8000' : '');
  const port = apiPort ? `:${apiPort}` : '';

  return `${window.location.protocol}//${window.location.hostname}${port}`;
}

function normalizeApiBaseUrl(baseUrl: string) {
  return baseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');
}

const API_BASE_URL = normalizeApiBaseUrl(viteEnv.VITE_API_BASE_URL || defaultTenantApiBaseUrl());
export const AUTH_TOKEN_STORAGE_KEY = 'orchestra_auth_token';
export const AUTH_SESSION_EXPIRED_EVENT = 'orchestra:auth-session-expired';

export const apiClientConfig: ApiClientConfig = {
  baseUrl: API_BASE_URL.replace(/\/$/, ''),
  csrfCookiePath: '/sanctum/csrf-cookie',
  defaultHeaders: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

let csrfReady = false;
let redirectingToLogin = false;

function clearBrowserCookies() {
  if (typeof document === 'undefined') return;

  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0]?.trim();
    if (!name) return;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  });
}

export function expireClientSession(status: number) {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.clear();
  } catch {
    // Storage may be unavailable in restricted browser modes.
  }

  csrfReady = false;
  clearBrowserCookies();

  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
    detail: { status },
  }));

  if (redirectingToLogin || window.location.pathname === '/login') return;

  redirectingToLogin = true;
  const reason = status === 419 ? 'session-expired' : 'unauthorized';
  window.location.replace(`/login?reason=${reason}`);
}

function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiClientConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function ensureCsrfCookie() {
  if (csrfReady || !apiClientConfig.baseUrl) return;

  await fetch(buildUrl(apiClientConfig.csrfCookiePath), {
    credentials: 'include',
    headers: apiClientConfig.defaultHeaders,
  });

  csrfReady = true;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204) return null;
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const hasBody = options.body !== undefined;
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!options.skipCsrf && method !== 'GET' && !getStoredToken()) {
    await ensureCsrfCookie();
  }

  const defaultHeaders = isFormDataBody
    ? withoutContentType(apiClientConfig.defaultHeaders)
    : apiClientConfig.defaultHeaders;

  const response = await fetch(buildUrl(path), {
    ...options,
    method,
    credentials: options.credentials ?? 'omit',
    headers: {
      ...defaultHeaders,
      ...(getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}),
      ...options.headers,
    },
    body: hasBody ? (isFormDataBody ? options.body : JSON.stringify(options.body)) as BodyInit : undefined,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    if ((response.status === 401 || response.status === 419) && options.expireSessionOnUnauthorized !== false) {
      expireClientSession(response.status);
    }
    throw new ApiError(response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET', skipCsrf: true }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { skipCsrf: true, ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { skipCsrf: true, ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { skipCsrf: true, ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { skipCsrf: true, ...options, method: 'DELETE' }),
};
