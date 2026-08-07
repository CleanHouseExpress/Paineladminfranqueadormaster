import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyThemeVariables,
  buildTenantTheme,
  loadTenantBranding,
  resetThemeVariables,
  type TenantBrandingContract,
  type TenantTheme,
} from '../../services/tenantTheme';

interface TenantThemeContextValue {
  theme: TenantTheme;
  branding: TenantTheme['branding'];
  isThemeLoading: boolean;
  themeError: string | null;
  refreshTheme: (branding?: TenantBrandingContract | null) => Promise<void>;
}

const TenantThemeContext = createContext<TenantThemeContextValue | null>(null);

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(() => buildTenantTheme(null));
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const [themeError, setThemeError] = useState<string | null>(null);

  const apply = useCallback((next: TenantTheme) => {
    applyThemeVariables(next);
    setTheme(next);
  }, []);

  const refreshTheme = useCallback(async (branding?: TenantBrandingContract | null) => {
    setIsThemeLoading(true);
    setThemeError(null);
    resetThemeVariables();
    apply(buildTenantTheme(null));

    try {
      const resolved = branding === undefined ? await loadTenantBranding() : branding;
      apply(buildTenantTheme(resolved));
    } catch {
      setThemeError('Nao foi possivel carregar o tema da rede.');
      apply(buildTenantTheme(null));
    } finally {
      setIsThemeLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    void refreshTheme();
    return () => resetThemeVariables();
  }, [refreshTheme]);

  const value = useMemo(() => ({
    theme,
    branding: theme.branding,
    isThemeLoading,
    themeError,
    refreshTheme,
  }), [theme, isThemeLoading, themeError, refreshTheme]);

  return (
    <TenantThemeContext.Provider value={value}>
      {children}
    </TenantThemeContext.Provider>
  );
}

export function useTenantTheme(): TenantThemeContextValue {
  const ctx = useContext(TenantThemeContext);
  if (!ctx) throw new Error('useTenantTheme must be used inside <TenantThemeProvider>');
  return ctx;
}
