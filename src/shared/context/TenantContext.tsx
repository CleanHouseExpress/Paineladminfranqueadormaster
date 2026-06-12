import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../services/apiClient';
import { tenantService, type TenantCurrentResponse } from '../../services/tenantService';
import type { TenantConfig } from '../../types';

/** Mock tenant — in a real app this comes from the auth session / API */
const DEFAULT_TENANT: TenantConfig = {
  id: 'bella-vita',
  name: 'Bella Vita Franchising',
  domain: 'bellavita.orchestra.app',
  plan: 'enterprise',
  enabledModuleIds: [
    'dashboard', 'units', 'customers',
    'financial', 'cashflow', 'dre', 'cmv', 'royalties',
    'operations', 'checklists', 'pendencias', 'diario',
    'support', 'marketplace', 'access', 'settings',
  ],
  pendingModuleIds: ['instagram'],
  blockedModuleIds: ['supply'],
  whiteLabel: {
    primaryColor: '#6366F1',
    secondaryColor: '#8B5CF6',
    logoText: 'BV',
    platformName: 'Orchestra',
    supportEmail: 'suporte@bellavita.com.br',
  },
  menuConfig: [],
};

interface TenantContextValue {
  tenant: TenantConfig;
  isTenantLoading: boolean;
  tenantExists: boolean | null;
  tenantError: string | null;
  isModuleEnabled: (moduleId: string) => boolean;
  isModuleBlocked: (moduleId: string) => boolean;
  updateWhiteLabel: (patch: Partial<TenantConfig['whiteLabel']>) => void;
  setModuleEnabled: (moduleId: string, enabled: boolean) => void;
  hydrateTenant: (patch: Partial<TenantConfig>) => void;
  loadCurrentTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

function unwrapTenant(payload: TenantCurrentResponse): Partial<TenantConfig> & Record<string, unknown> {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
    return payload.data as Partial<TenantConfig> & Record<string, unknown>;
  }

  if (payload && typeof payload === 'object' && 'tenant' in payload && payload.tenant) {
    return payload.tenant as Partial<TenantConfig> & Record<string, unknown>;
  }

  return payload as Partial<TenantConfig> & Record<string, unknown>;
}

function normalizeTenantPlan(plan: unknown): TenantConfig['plan'] | undefined {
  if (plan === 'starter' || plan === 'professional' || plan === 'enterprise') return plan;
  if (typeof plan !== 'string') return undefined;

  const normalizedPlan = plan.toLowerCase();
  if (normalizedPlan === 'starter') return 'starter';
  if (normalizedPlan === 'pro' || normalizedPlan === 'professional') return 'professional';
  if (normalizedPlan === 'enterprise') return 'enterprise';

  return undefined;
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}

function normalizeTenantPatch(payload: TenantCurrentResponse): Partial<TenantConfig> {
  const data = unwrapTenant(payload);
  const whiteLabel = data.whiteLabel ?? data.white_label;

  return withoutUndefined({
    id: data.id !== undefined ? String(data.id) : undefined,
    name: typeof data.name === 'string' ? data.name : undefined,
    domain: typeof data.domain === 'string' ? data.domain : window.location.hostname,
    plan: normalizeTenantPlan(data.plan),
    whiteLabel: whiteLabel && typeof whiteLabel === 'object'
      ? whiteLabel as Partial<TenantConfig['whiteLabel']>
      : undefined,
    enabledModuleIds: Array.isArray(data.enabledModuleIds)
      ? data.enabledModuleIds
      : Array.isArray(data.enabled_module_ids)
        ? data.enabled_module_ids as string[]
        : undefined,
    pendingModuleIds: Array.isArray(data.pendingModuleIds)
      ? data.pendingModuleIds
      : Array.isArray(data.pending_module_ids)
        ? data.pending_module_ids as string[]
        : undefined,
    blockedModuleIds: Array.isArray(data.blockedModuleIds)
      ? data.blockedModuleIds
      : Array.isArray(data.blocked_module_ids)
        ? data.blocked_module_ids as string[]
        : undefined,
    menuConfig: Array.isArray(data.menuConfig)
      ? data.menuConfig
      : Array.isArray(data.menu_config)
        ? data.menu_config as TenantConfig['menuConfig']
        : undefined,
  });
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig>(DEFAULT_TENANT);
  const [isTenantLoading, setIsTenantLoading] = useState(true);
  const [tenantExists, setTenantExists] = useState<boolean | null>(null);
  const [tenantError, setTenantError] = useState<string | null>(null);

  const isModuleEnabled = useCallback((moduleId: string) =>
    tenant.enabledModuleIds.includes(moduleId), [tenant.enabledModuleIds]);

  const isModuleBlocked = useCallback((moduleId: string) =>
    tenant.blockedModuleIds.includes(moduleId), [tenant.blockedModuleIds]);

  const updateWhiteLabel = useCallback((patch: Partial<TenantConfig['whiteLabel']>) => {
    setTenant(t => ({ ...t, whiteLabel: { ...t.whiteLabel, ...patch } }));
  }, []);

  const setModuleEnabled = useCallback((moduleId: string, enabled: boolean) => {
    setTenant(t => ({
      ...t,
      enabledModuleIds: enabled
        ? [...t.enabledModuleIds, moduleId]
        : t.enabledModuleIds.filter(id => id !== moduleId),
    }));
  }, []);

  const hydrateTenant = useCallback((patch: Partial<TenantConfig>) => {
    setTenant(t => ({
      ...t,
      ...patch,
      whiteLabel: {
        ...t.whiteLabel,
        ...patch.whiteLabel,
      },
      enabledModuleIds: patch.enabledModuleIds ?? t.enabledModuleIds,
      pendingModuleIds: patch.pendingModuleIds ?? t.pendingModuleIds,
      blockedModuleIds: patch.blockedModuleIds ?? t.blockedModuleIds,
      menuConfig: patch.menuConfig ?? t.menuConfig,
    }));
  }, []);

  const loadCurrentTenant = useCallback(async () => {
    setIsTenantLoading(true);
    setTenantError(null);

    try {
      const response = await tenantService.current();
      hydrateTenant(normalizeTenantPatch(response));
      setTenantExists(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setTenantExists(false);
        setTenantError(null);
      } else {
        setTenantExists(null);
        setTenantError('Nao foi possivel consultar o tenant atual.');
      }
    } finally {
      setIsTenantLoading(false);
    }
  }, [hydrateTenant]);

  useEffect(() => {
    void loadCurrentTenant();
  }, [loadCurrentTenant]);

  const value = useMemo<TenantContextValue>(() => ({
    tenant,
    isTenantLoading,
    tenantExists,
    tenantError,
    isModuleEnabled,
    isModuleBlocked,
    updateWhiteLabel,
    setModuleEnabled,
    hydrateTenant,
    loadCurrentTenant,
  }), [tenant, isTenantLoading, tenantExists, tenantError, isModuleEnabled, isModuleBlocked, updateWhiteLabel, setModuleEnabled, hydrateTenant, loadCurrentTenant]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used inside <TenantProvider>');
  return ctx;
}
