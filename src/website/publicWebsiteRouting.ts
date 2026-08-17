const LOCAL_PUBLIC_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'orchestra-e2e.localhost',
]);

const DEFAULT_PUBLIC_BASE_DOMAINS = ['orchestra.elonex.com.br'];

function normalizeHost(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
}

function readEnvList(key: string) {
  return String(import.meta.env[key] ?? '')
    .split(',')
    .map(item => normalizeHost(item))
    .filter(Boolean);
}

export function isPublicWebsiteHost(hostname = window.location.hostname) {
  const normalized = normalizeHost(hostname);
  if (LOCAL_PUBLIC_HOSTS.has(normalized)) return true;

  const explicitHosts = readEnvList('VITE_PUBLIC_WEBSITE_HOSTS');
  if (explicitHosts.includes(normalized)) return true;

  const baseDomains = [
    ...DEFAULT_PUBLIC_BASE_DOMAINS,
    ...readEnvList('VITE_PUBLIC_WEBSITE_BASE_DOMAINS'),
  ];
  return baseDomains.some(baseDomain => normalized === baseDomain || normalized === `www.${baseDomain}`);
}

export function shouldRenderPublicWebsite(pathname = window.location.pathname, hostname = window.location.hostname) {
  return pathname === '/' && isPublicWebsiteHost(hostname);
}
