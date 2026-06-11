import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_TOKEN_STORAGE_KEY } from '../../services/apiClient';
import {
  authService,
  type AuthCompany,
  type AuthModule,
  type AuthPermission,
  type AuthRole,
  type AuthUser,
  type LoginResponse,
} from '../../services/authService';
import type { TenantConfig } from '../../types';
import { useTenant } from './TenantContext';

interface AuthSessionContext {
  userId?: string | number;
  companyId?: string | number;
  hydratedAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  context: AuthSessionContext | null;
  company: AuthCompany | null;
  modules: AuthModule[];
  roles: AuthRole[];
  permissions: AuthPermission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in restricted browser modes.
  }
}

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function extractToken(response: LoginResponse) {
  return response.token
    ?? response.access_token
    ?? response.data?.token
    ?? response.data?.access_token
    ?? null;
}

function extractUser(response: LoginResponse) {
  return response.user ?? response.data?.user ?? null;
}

function normalizeModuleId(module: AuthModule) {
  return String(module.moduleId ?? module.module_id ?? module.slug ?? module.id ?? '');
}

function normalizeTenantPlan(plan: unknown): TenantConfig['plan'] {
  return plan === 'starter' || plan === 'professional' || plan === 'enterprise'
    ? plan
    : 'enterprise';
}

function buildTenantPatch(company: AuthCompany, modules: AuthModule[]): Partial<TenantConfig> {
  const whiteLabel = company.whiteLabel ?? company.white_label ?? {};
  const enabledModuleIds = modules
    .filter(module => module.status !== 'blocked' && module.status !== 'review')
    .map(normalizeModuleId)
    .filter(Boolean);
  const pendingModuleIds = modules
    .filter(module => module.status === 'review')
    .map(normalizeModuleId)
    .filter(Boolean);
  const blockedModuleIds = modules
    .filter(module => module.status === 'blocked')
    .map(normalizeModuleId)
    .filter(Boolean);

  return {
    id: String(company.id),
    name: company.name,
    domain: typeof company.domain === 'string' ? company.domain : undefined,
    plan: normalizeTenantPlan(company.plan),
    whiteLabel,
    ...(enabledModuleIds.length ? { enabledModuleIds } : {}),
    ...(pendingModuleIds.length ? { pendingModuleIds } : {}),
    ...(blockedModuleIds.length ? { blockedModuleIds } : {}),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrateTenant } = useTenant();
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<AuthCompany | null>(null);
  const [modules, setModules] = useState<AuthModule[]>([]);
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [permissions, setPermissions] = useState<AuthPermission[]>([]);
  const [context, setContext] = useState<AuthSessionContext | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  const hydrateSession = useCallback(async () => {
    const currentToken = readStoredToken();
    setToken(currentToken);

    if (!currentToken) {
      setUser(null);
      setCompany(null);
      setModules([]);
      setRoles([]);
      setPermissions([]);
      setContext(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [mePayload, companyPayload, modulesPayload, rolesPayload, permissionsPayload] = await Promise.all([
        authService.me(),
        authService.getMeCompany(),
        authService.getMeModules(),
        authService.getMeRoles(),
        authService.getMePermissions(),
      ]);

      const nextUser = unwrap(mePayload);
      const nextCompany = unwrap(companyPayload);
      const nextModules = unwrap(modulesPayload);
      const nextRoles = unwrap(rolesPayload);
      const nextPermissions = unwrap(permissionsPayload);

      setUser(nextUser);
      setCompany(nextCompany);
      setModules(nextModules);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
      setContext({
        userId: nextUser.id,
        companyId: nextCompany.id,
        hydratedAt: new Date().toISOString(),
      });
      hydrateTenant(buildTenantPatch(nextCompany, nextModules));
    } catch {
      setUser(null);
      setCompany(null);
      setModules([]);
      setRoles([]);
      setPermissions([]);
      setContext(null);
      setError('NÃ£o foi possÃ­vel carregar sua sessÃ£o agora. Verifique a API e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [hydrateTenant]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      const nextToken = extractToken(response);

      if (!nextToken) {
        throw new Error('Login response did not include a token.');
      }

      writeStoredToken(nextToken);
      setToken(nextToken);

      const loginUser = extractUser(response);
      if (loginUser) setUser(loginUser);

      await hydrateSession();
    } catch {
      writeStoredToken(null);
      setToken(null);
      setUser(null);
      setError('NÃ£o foi possÃ­vel entrar. Confira suas credenciais ou a disponibilidade da API.');
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [hydrateSession]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
    } catch {
      // Local logout still wins if the API is unavailable.
    } finally {
      writeStoredToken(null);
      setToken(null);
      setUser(null);
      setCompany(null);
      setModules([]);
      setRoles([]);
      setPermissions([]);
      setContext(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    context,
    company,
    modules,
    roles,
    permissions,
    isAuthenticated: Boolean(token && user),
    isLoading,
    error,
    login,
    logout,
    hydrateSession,
  }), [company, context, error, hydrateSession, isLoading, login, logout, modules, permissions, roles, token, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
