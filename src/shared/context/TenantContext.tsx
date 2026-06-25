import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TenantConfig } from '../../types';

/** Mock tenant — in a real app this comes from the auth session / API */
const DEFAULT_TENANT: TenantConfig = {
  id: 'bella-vita',
  name: 'Bella Vita Franchising',
  domain: 'bellavita.orchestra.app',
  plan: 'enterprise',
  enabledModuleIds: [
    'dashboard', 'units', 'clients',
    'financial', 'cashflow', 'dre', 'cmv', 'royalties',
    'crm', 'sales',
    'operations', 'checklists', 'documents', 'contracts', 'catalog', 'inventory', 'trainings', 'pendencias', 'diario',
    'automation', 'tasks', 'noc', 'network_operations_center', 'analytics',
    'support', 'communication-inbox', 'marketplace', 'access', 'settings',
  ],
  pendingModuleIds: ['instagram'],
  blockedModuleIds: [],
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
  /** Whether a given module ID is enabled for the current tenant */
  isModuleEnabled: (moduleId: string) => boolean;
  /** Whether a given module is in the tenant's blocked list */
  isModuleBlocked: (moduleId: string) => boolean;
  /** Update the entire tenant config from a hydrated session payload */
  hydrateTenant: (patch: Partial<TenantConfig>) => void;
  /** Update white-label settings (persists in context for session) */
  updateWhiteLabel: (patch: Partial<TenantConfig['whiteLabel']>) => void;
  /** Enable or disable a module for this tenant */
  setModuleEnabled: (moduleId: string, enabled: boolean) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig>(DEFAULT_TENANT);

  const isModuleEnabled = useCallback(
    (moduleId: string) => tenant.enabledModuleIds.includes(moduleId),
    [tenant.enabledModuleIds],
  );

  const isModuleBlocked = useCallback(
    (moduleId: string) => tenant.blockedModuleIds.includes(moduleId),
    [tenant.blockedModuleIds],
  );

  const hydrateTenant = useCallback((patch: Partial<TenantConfig>) => {
    setTenant(current => ({
      ...current,
      ...patch,
      whiteLabel: {
        ...current.whiteLabel,
        ...(patch.whiteLabel ?? {}),
      },
      enabledModuleIds: patch.enabledModuleIds ?? current.enabledModuleIds,
      pendingModuleIds: patch.pendingModuleIds ?? current.pendingModuleIds,
      blockedModuleIds: patch.blockedModuleIds ?? current.blockedModuleIds,
    }));
  }, []);

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

  const value = useMemo(
    () => ({
      tenant,
      isModuleEnabled,
      isModuleBlocked,
      hydrateTenant,
      updateWhiteLabel,
      setModuleEnabled,
    }),
    [tenant, isModuleEnabled, isModuleBlocked, hydrateTenant, updateWhiteLabel, setModuleEnabled],
  );

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
