import { apiClientConfig } from './apiClient';

export interface TenantBrandingContract {
  display_name?: string | null;
  logo?: string | null;
  compact_logo?: string | null;
  favicon?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  sidebar_color?: string | null;
  header_color?: string | null;
  foreground_color?: string | null;
  authentication_background_image?: string | null;
  theme_mode?: 'light' | 'dark' | 'system' | string | null;
  login_title?: string | null;
  login_subtitle?: string | null;
}

export interface TenantTheme {
  branding: Required<Omit<TenantBrandingContract, 'login_title' | 'login_subtitle'>> & {
    login_title: string | null;
    login_subtitle: string | null;
  };
  variables: Record<string, string>;
}

export const ORCHESTRA_BRANDING: TenantTheme['branding'] = {
  display_name: 'Orchestra',
  logo: null,
  compact_logo: null,
  favicon: null,
  primary_color: '#030213',
  secondary_color: '#6366F1',
  accent_color: '#E9EBEF',
  background_color: '#FFFFFF',
  sidebar_color: '#0F172A',
  header_color: '#FFFFFF',
  foreground_color: '#0F172A',
  authentication_background_image: null,
  theme_mode: 'light',
  login_title: null,
  login_subtitle: null,
};

const THEME_VARIABLES = [
  '--primary',
  '--primary-hover',
  '--primary-foreground',
  '--secondary',
  '--secondary-hover',
  '--secondary-foreground',
  '--accent',
  '--accent-foreground',
  '--background',
  '--surface',
  '--surface-foreground',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-active',
  '--sidebar-active-foreground',
  '--header',
  '--header-foreground',
  '--border',
  '--text',
  '--muted-text',
  '--link',
  '--focus-ring',
  '--foreground',
  '--card',
  '--card-foreground',
  '--ring',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-ring',
];

const TENANT_FAVICON_ID = 'tenant-branding-favicon';
const DEFAULT_DOCUMENT_TITLE = 'Orchestra';

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

export function normalizeHexColor(value: unknown): string | null {
  const color = cleanString(value);
  if (!color || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) return null;
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  }
  return color.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  if (first === null || second === null) return 0;
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getAccessibleForeground(background: unknown, fallback = ORCHESTRA_BRANDING.foreground_color): string {
  const bg = normalizeHexColor(background);
  if (!bg) return fallback;

  return ['#FFFFFF', '#000000', fallback]
    .map(color => ({ color, ratio: contrastRatio(bg, color) }))
    .sort((a, b) => b.ratio - a.ratio)[0]?.color ?? fallback;
}

function adjustColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const next = rgb
    .map(channel => Math.max(0, Math.min(255, channel + amount)))
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('');
  return `#${next}`.toUpperCase();
}

function safeAssetUrl(value: unknown): string | null {
  const url = cleanString(value);
  if (!url) return null;
  if (url.startsWith('/api/')) return `${apiClientConfig.baseUrl}${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

export function normalizeBranding(input?: TenantBrandingContract | null): TenantTheme['branding'] {
  const source = input ?? {};
  return {
    display_name: cleanString(source.display_name) ?? ORCHESTRA_BRANDING.display_name,
    logo: safeAssetUrl(source.logo),
    compact_logo: safeAssetUrl(source.compact_logo),
    favicon: safeAssetUrl(source.favicon),
    primary_color: normalizeHexColor(source.primary_color) ?? ORCHESTRA_BRANDING.primary_color,
    secondary_color: normalizeHexColor(source.secondary_color) ?? ORCHESTRA_BRANDING.secondary_color,
    accent_color: normalizeHexColor(source.accent_color) ?? ORCHESTRA_BRANDING.accent_color,
    background_color: normalizeHexColor(source.background_color) ?? ORCHESTRA_BRANDING.background_color,
    sidebar_color: normalizeHexColor(source.sidebar_color) ?? ORCHESTRA_BRANDING.sidebar_color,
    header_color: normalizeHexColor(source.header_color) ?? ORCHESTRA_BRANDING.header_color,
    foreground_color: normalizeHexColor(source.foreground_color) ?? ORCHESTRA_BRANDING.foreground_color,
    authentication_background_image: safeAssetUrl(source.authentication_background_image),
    theme_mode: source.theme_mode === 'dark' || source.theme_mode === 'system' ? source.theme_mode : 'light',
    login_title: cleanString(source.login_title),
    login_subtitle: cleanString(source.login_subtitle),
  };
}

export function buildTenantTheme(input?: TenantBrandingContract | null): TenantTheme {
  const branding = normalizeBranding(input);
  const primary = branding.primary_color;
  const secondary = branding.secondary_color;
  const accent = branding.accent_color;
  const background = branding.background_color;
  const sidebar = branding.sidebar_color;
  const header = branding.header_color;
  const text = branding.foreground_color;

  const variables = {
    '--primary': primary,
    '--primary-hover': adjustColor(primary, -18),
    '--primary-foreground': getAccessibleForeground(primary),
    '--secondary': secondary,
    '--secondary-hover': adjustColor(secondary, -18),
    '--secondary-foreground': getAccessibleForeground(secondary),
    '--accent': accent,
    '--accent-foreground': getAccessibleForeground(accent),
    '--background': background,
    '--surface': '#FFFFFF',
    '--surface-foreground': text,
    '--sidebar': sidebar,
    '--sidebar-foreground': getAccessibleForeground(sidebar),
    '--sidebar-active': primary,
    '--sidebar-active-foreground': getAccessibleForeground(primary),
    '--header': header,
    '--header-foreground': getAccessibleForeground(header),
    '--border': 'rgba(15, 23, 42, 0.12)',
    '--text': text,
    '--muted-text': '#64748B',
    '--link': primary,
    '--focus-ring': secondary,
    '--foreground': text,
    '--card': '#FFFFFF',
    '--card-foreground': text,
    '--ring': secondary,
    '--sidebar-primary': primary,
    '--sidebar-primary-foreground': getAccessibleForeground(primary),
    '--sidebar-accent': adjustColor(sidebar, 18),
    '--sidebar-accent-foreground': getAccessibleForeground(sidebar),
    '--sidebar-ring': secondary,
  };

  return { branding, variables };
}

export function applyThemeVariables(theme: TenantTheme, root: HTMLElement = document.documentElement) {
  resetThemeVariables(root);
  Object.entries(theme.variables).forEach(([name, value]) => root.style.setProperty(name, value));
  root.dataset.tenantTheme = theme.branding.display_name;
}

export function resetThemeVariables(root: HTMLElement = document.documentElement) {
  THEME_VARIABLES.forEach(name => root.style.removeProperty(name));
  delete root.dataset.tenantTheme;
}

export function applyDocumentBranding(theme: TenantTheme, doc: Document = document) {
  const existing = doc.getElementById(TENANT_FAVICON_ID);
  if (existing) existing.remove();

  if (theme.branding.favicon) {
    const link = doc.createElement('link');
    link.id = TENANT_FAVICON_ID;
    link.rel = 'icon';
    link.href = theme.branding.favicon;
    doc.head.appendChild(link);
  }

  doc.title = theme.branding.display_name && theme.branding.display_name !== DEFAULT_DOCUMENT_TITLE
    ? `${theme.branding.display_name} - Orchestra`
    : DEFAULT_DOCUMENT_TITLE;
}

export function resetDocumentBranding(doc: Document = document) {
  doc.getElementById(TENANT_FAVICON_ID)?.remove();
  doc.title = DEFAULT_DOCUMENT_TITLE;
}

export async function loadTenantBranding(): Promise<TenantBrandingContract | null> {
  const response = await fetch(`${apiClientConfig.baseUrl}/api/tenant/current`, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data?.branding ?? data?.white_label ?? null;
}
