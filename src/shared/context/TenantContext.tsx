import { createContext, useContext, useState } from 'react';
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
  /** Whether a given module ID is enabled for the current tenant */
  isModuleEnabled: (moduleId: string) => boolean;
  /** Whether a given module is in the tenant's blocked list */
  isModuleBlocked: (moduleId: string) => boolean;
  /** Update white-label settings (persists in context for session) */
  updateWhiteLabel: (patch: Partial<TenantConfig['whiteLabel']>) => void;
  /** Enable or disable a module for this tenant */
  setModuleEnabled: (moduleId: string, enabled: boolean) => void;
  /** Hydrate tenant data from the authenticated API session */
  hydrateTenant: (patch: Partial<TenantConfig>) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig>(DEFAULT_TENANT);

  const isModuleEnabled = (moduleId: string) =>
    tenant.enabledModuleIds.includes(moduleId);

  const isModuleBlocked = (moduleId: string) =>
    tenant.blockedModuleIds.includes(moduleId);

  const updateWhiteLabel = (patch: Partial<TenantConfig['whiteLabel']>) =>
    setTenant(t => ({ ...t, whiteLabel: { ...t.whiteLabel, ...patch } }));

  const setModuleEnabled = (moduleId: string, enabled: boolean) =>
    setTenant(t => ({
      ...t,
      enabledModuleIds: enabled
        ? [...t.enabledModuleIds, moduleId]
        : t.enabledModuleIds.filter(id => id !== moduleId),
    }));

  const hydrateTenant = (patch: Partial<TenantConfig>) =>
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

  return (
    <TenantContext.Provider value={{ tenant, isModuleEnabled, isModuleBlocked, updateWhiteLabel, setModuleEnabled, hydrateTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used inside <TenantProvider>');
  return ctx;
}
