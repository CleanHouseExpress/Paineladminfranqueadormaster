import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError, AUTH_SESSION_EXPIRED_EVENT, AUTH_TOKEN_STORAGE_KEY,
} from '../../services/apiClient';
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

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const candidate = payload as { data?: unknown; result?: unknown; value?: unknown };
    if ('data' in candidate && candidate.data !== undefined) {
      return candidate.data as T;
    }
    if ('result' in candidate && candidate.result !== undefined) {
      return candidate.result as T;
    }
    if ('value' in candidate && Array.isArray(candidate.value)) {
      return candidate.value as T;
    }
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

function normalizeMePayload(payload: unknown) {
  const unwrapped = unwrap<Record<string, unknown>>(payload);

  if (
    unwrapped &&
    typeof unwrapped === 'object' &&
    !Array.isArray(unwrapped) &&
    ('user' in unwrapped || 'context' in unwrapped || 'settings' in unwrapped || 'onboarding' in unwrapped)
  ) {
    const sessionPayload = unwrapped as {
      user?: AuthUser;
      context?: AuthSessionContext;
      settings?: unknown;
      onboarding?: unknown;
      units?: unknown;
    };

    return {
      user: sessionPayload.user ?? null,
      context: sessionPayload.context ?? null,
    };
  }

  if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped) && 'id' in unwrapped) {
    return {
      user: unwrapped as AuthUser,
      context: null,
    };
  }

  return {
    user: null,
    context: null,
  };
}

const MODULE_ID_ALIASES: Record<string, string> = {
  communication: 'communication-inbox',
  support: 'communication-inbox',
  noc: 'network_operations_center',
};

function normalizeModuleId(module: AuthModule) {
  const rawId = String(module.moduleId ?? module.module_id ?? module.slug ?? module.id ?? '');
  return MODULE_ID_ALIASES[rawId] ?? rawId;
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
  const userRef = useRef<AuthUser | null>(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const hydrateSession = useCallback(async (options?: { fallbackUser?: AuthUser | null }) => {
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
      const fallbackUser = options?.fallbackUser ?? userRef.current ?? null;
      const mePayload = await authService.me();
      const normalizedMe = normalizeMePayload(mePayload);
      const nextUser = normalizedMe.user ?? fallbackUser;

      const [companyResult, modulesResult, rolesResult, permissionsResult] = await Promise.allSettled([
        authService.getMeCompany(),
        authService.getMeModules(),
        authService.getMeRoles(),
        authService.getMePermissions(),
      ]);

      const companyPayload = companyResult.status === 'fulfilled'
        ? unwrap<AuthCompany | null>(companyResult.value)
        : null;
      const modulesPayload = modulesResult.status === 'fulfilled'
        ? unwrap<AuthModule[]>(modulesResult.value) ?? []
        : [];
      const rolesPayload = rolesResult.status === 'fulfilled'
        ? unwrap<AuthRole[]>(rolesResult.value) ?? []
        : [];
      const permissionsPayload = permissionsResult.status === 'fulfilled'
        ? unwrap<AuthPermission[]>(permissionsResult.value) ?? []
        : [];

      const sessionContext = (normalizedMe.context ?? {}) as AuthSessionContext & {
        company_id?: string | number;
      };
      const resolvedCompanyId =
        companyPayload?.id ??
        sessionContext.companyId ??
        sessionContext.company_id ??
        (typeof nextUser.company_id !== 'undefined' ? nextUser.company_id : undefined);
      const nextCompany = companyPayload ?? null;
      const nextModules = Array.isArray(modulesPayload) ? modulesPayload : [];
      const nextRoles = Array.isArray(rolesPayload) ? rolesPayload : [];
      const nextPermissions = Array.isArray(permissionsPayload) ? permissionsPayload : [];

      setUser(nextUser);
      setCompany(nextCompany);
      setModules(nextModules);
      setRoles(nextRoles);
      setPermissions(nextPermissions);

      setContext({
        userId: nextUser.id,
        companyId: resolvedCompanyId,
        ...(sessionContext as AuthSessionContext),
        hydratedAt: new Date().toISOString(),
      });

      if (nextCompany) {
        hydrateTenant(buildTenantPatch(nextCompany, nextModules));
      }
    } catch (err) {
      const isUnauthorized = err instanceof ApiError && (err.status === 401 || err.status === 419);

      if (!isUnauthorized) {
        setError('Não foi possível carregar sua sessão agora. Verifique a API e tente novamente.');
      }

      setUser(options?.fallbackUser ?? userRef.current ?? null);
      setCompany(null);
      setModules([]);
      setRoles([]);
      setPermissions([]);
      setContext(null);
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

      await hydrateSession({ fallbackUser: loginUser ?? null });
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

  useEffect(() => {
    const resetExpiredSession = () => {
      writeStoredToken(null);
      setToken(null);
      setUser(null);
      setCompany(null);
      setModules([]);
      setRoles([]);
      setPermissions([]);
      setContext(null);
      setError(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, resetExpiredSession);

    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, resetExpiredSession);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    context,
    company,
    modules,
    roles,
    permissions,
    isAuthenticated: Boolean(token),
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
