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

function defaultTenantApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  const apiPort = import.meta.env.VITE_API_PORT ?? '8000';

  return `${window.location.protocol}//${window.location.hostname}:${apiPort}`;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultTenantApiBaseUrl();
export const AUTH_TOKEN_STORAGE_KEY = 'orchestra_auth_token';

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

  if (!options.skipCsrf && method !== 'GET' && !getStoredToken()) {
    await ensureCsrfCookie();
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    method,
    credentials: options.credentials ?? 'omit',
    headers: {
      ...apiClientConfig.defaultHeaders,
      ...(getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}),
      ...options.headers,
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
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