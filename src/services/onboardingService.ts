import type { ChecklistItem, OnboardingState, WizardStepData, WizardStepId } from '../types/onboarding';
import { INITIAL_CHECKLIST, INITIAL_ONBOARDING_STATE, WIZARD_STEPS } from '../types/onboarding';
import { apiClient, AUTH_TOKEN_STORAGE_KEY } from './apiClient';

export const ONBOARDING_REALITY_CHANGED_EVENT = 'orchestra:onboarding-reality-changed';

type ApiOnboarding = {
  required?: boolean;
  status?: string;
  current_step?: string | null;
  required_steps?: string[];
  completed_steps?: string[];
  onboarding_required?: boolean;
  completed_at?: string | null;
};

type CompanyProfile = {
  legal_name?: string | null;
  trade_name?: string | null;
  document?: string | null;
  segment?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  responsible_name?: string | null;
  responsible_email?: string | null;
};

type CompanySummary = {
  name?: string | null;
  document?: string | null;
  segment?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
};

type TenantBranding = {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  login_title?: string | null;
  login_subtitle?: string | null;
};

type TenantSettings = {
  timezone?: string | null;
  language?: string | null;
  currency?: string | null;
  default_city?: string | null;
  default_state?: string | null;
  network_type?: string | null;
  unit_management_mode?: string | null;
  dashboard_preferences?: Record<string, unknown> | null;
};

type DataResponse<T> = { data: T };
type UnitSummary = {
  id: number | string;
  name: string;
  address_city?: string | null;
  address_state?: string | null;
  responsible_name?: string | null;
};
type UserSummary = { id: number | string; email: string; roles?: Array<{ name?: string; slug?: string }> };
type ListResponse<T> = { data: T[]; meta?: { total?: number } };
type SidebarModule = { id?: string; slug?: string; enabled?: boolean; status?: string };
type SidebarModuleResponse = SidebarModule[] | { data?: SidebarModule[] };

const STEP_TO_WIZARD_INDEX: Record<string, number> = {
  company_profile: 1,
  branding: 2,
  settings: 5,
  review: WIZARD_STEPS.length - 1,
  completed: WIZARD_STEPS.length - 1,
};

function hasToken() {
  try {
    return Boolean(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
  } catch {
    return false;
  }
}

async function optional<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch {
    return null;
  }
}

function dataOf<T>(response: DataResponse<T> | T | null): T | null {
  if (!response) return null;
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as DataResponse<T>).data;
  }
  return response as T;
}

function backendStepCompleted(onboarding: ApiOnboarding | null, step: string) {
  return Array.isArray(onboarding?.completed_steps) && onboarding.completed_steps.includes(step);
}

function firstFilled(...values: Array<string | null | undefined>): string {
  return values.find(value => typeof value === 'string' && value.trim() !== '')?.trim() ?? '';
}

function toNetwork(profile: CompanyProfile | null, settings: TenantSettings | null, company: CompanySummary | null): WizardStepData['network'] {
  return {
    networkName: firstFilled(profile?.trade_name, profile?.legal_name, company?.name),
    segment: firstFilled(profile?.segment, company?.segment),
    cnpj: firstFilled(profile?.document, company?.document),
    email: firstFilled(profile?.email, profile?.responsible_email, company?.email),
    city: firstFilled(profile?.city, settings?.default_city, company?.city),
    state: firstFilled(profile?.state, settings?.default_state, company?.state),
  };
}

function toWhitelabel(branding: TenantBranding | null): WizardStepData['whitelabel'] {
  return {
    platformName: branding?.login_title ?? INITIAL_ONBOARDING_STATE.stepData.whitelabel.platformName,
    primaryColor: branding?.primary_color ?? INITIAL_ONBOARDING_STATE.stepData.whitelabel.primaryColor,
    secondaryColor: branding?.secondary_color ?? INITIAL_ONBOARDING_STATE.stepData.whitelabel.secondaryColor,
  };
}

function toUnits(units: UnitSummary[]): WizardStepData['units'] {
  return units.map(unit => ({
    id: String(unit.id),
    name: unit.name,
    city: unit.address_city ?? '',
    state: unit.address_state ?? '',
    manager: unit.responsible_name ?? '',
  }));
}

function toUsers(users: UserSummary[]): WizardStepData['users'] {
  return users.map(user => ({
    id: String(user.id),
    email: user.email,
    role: user.roles?.[0]?.name ?? user.roles?.[0]?.slug ?? 'Perfil operacional',
  }));
}

function toModules(modules: SidebarModuleResponse | null): string[] {
  const items = Array.isArray(modules) ? modules : modules?.data ?? [];
  const fromApi = items
    .map(module => module.id ?? module.slug)
    .filter((id): id is string => Boolean(id));

  return fromApi.length > 0 ? fromApi : INITIAL_ONBOARDING_STATE.stepData.modules;
}

function toFinancial(settings: TenantSettings | null): WizardStepData['financial'] {
  const preferences = settings?.dashboard_preferences ?? {};
  const financial = typeof preferences.onboarding_financial === 'object' && preferences.onboarding_financial !== null
    ? preferences.onboarding_financial as WizardStepData['financial']
    : {};

  return {
    ...INITIAL_ONBOARDING_STATE.stepData.financial,
    ...financial,
  };
}

function clientsImported(settings: TenantSettings | null): boolean {
  return settings?.dashboard_preferences?.onboarding_clients_imported === true;
}

function checklistFromBackend(params: {
  onboarding: ApiOnboarding | null;
  units: UnitSummary[];
  usersTotal: number;
  modules: SidebarModuleResponse | null;
  settings: TenantSettings | null;
}): ChecklistItem[] {
  const modulesAvailable = (Array.isArray(params.modules) ? params.modules : params.modules?.data ?? []).length > 0;
  const settingsCompleted = backendStepCompleted(params.onboarding, 'settings');

  const completed: Record<string, boolean> = {
    network: backendStepCompleted(params.onboarding, 'company_profile'),
    whitelabel: backendStepCompleted(params.onboarding, 'branding'),
    unit: params.units.length > 0,
    user: params.usersTotal > 1,
    modules: settingsCompleted || modulesAvailable,
    royalties: settingsCompleted || Boolean(params.settings?.dashboard_preferences?.onboarding_financial),
    clients: clientsImported(params.settings),
    tour: params.onboarding?.status === 'completed',
  };

  return INITIAL_CHECKLIST.map(item => ({
    ...item,
    completed: completed[item.id] ?? item.completed,
  }));
}

function currentWizardStep(onboarding: ApiOnboarding | null): number {
  if (!onboarding) return 0;
  if (onboarding.status === 'completed' || onboarding.onboarding_required === false || onboarding.required === false) {
    return WIZARD_STEPS.length - 1;
  }

  return STEP_TO_WIZARD_INDEX[onboarding.current_step ?? 'company_profile'] ?? 1;
}

function wizardStarted(onboarding: ApiOnboarding | null): boolean {
  if (!onboarding) return false;
  if (onboarding.status === 'completed') return true;
  return (onboarding.completed_steps ?? []).length > 0 || onboarding.status === 'in_progress';
}

function isWizardCompleted(onboarding: ApiOnboarding | null): boolean {
  return onboarding?.status === 'completed' || onboarding?.onboarding_required === false || onboarding?.required === false;
}

export async function getOnboardingStatus(): Promise<OnboardingState> {
  if (!hasToken()) return { ...INITIAL_ONBOARDING_STATE };

  const [onboarding, profileResponse, companyResponse, brandingResponse, settingsResponse, unitsResponse, usersResponse, modulesResponse] = await Promise.all([
    optional(apiClient.get<ApiOnboarding>('/api/me/onboarding', { expireSessionOnUnauthorized: false })),
    optional(apiClient.get<DataResponse<CompanyProfile>>('/api/me/onboarding/company-profile', { expireSessionOnUnauthorized: false })),
    optional(apiClient.get<DataResponse<CompanySummary> | CompanySummary>('/api/me/company', { expireSessionOnUnauthorized: false })),
    optional(apiClient.get<DataResponse<TenantBranding>>('/api/me/onboarding/branding', { expireSessionOnUnauthorized: false })),
    optional(apiClient.get<DataResponse<TenantSettings>>('/api/me/settings', { expireSessionOnUnauthorized: false })),
    optional(apiClient.get<ListResponse<UnitSummary>>('/api/company/units?per_page=100', { expireSessionOnUnauthorized: false })),
    optional(apiClient.get<ListResponse<UserSummary>>('/api/company/users?per_page=100', { expireSessionOnUnauthorized: false })),
    optional(apiClient.get<SidebarModuleResponse>('/api/me/modules/sidebar', { expireSessionOnUnauthorized: false })),
  ]);

  if (!onboarding) {
    return {
      ...INITIAL_ONBOARDING_STATE,
      wizardStarted: true,
      wizardCompleted: true,
      currentWizardStep: WIZARD_STEPS.length - 1,
      tourCompleted: true,
      tourActive: false,
      lastSynced: new Date().toISOString(),
    };
  }

  const profile = dataOf(profileResponse);
  const company = dataOf(companyResponse);
  const branding = dataOf(brandingResponse);
  const settings = dataOf(settingsResponse);
  const units = unitsResponse?.data ?? [];
  const usersTotal = usersResponse?.meta?.total ?? usersResponse?.data?.length ?? 0;
  const modules = modulesResponse ?? null;
  const completed = isWizardCompleted(onboarding);

  return {
    ...INITIAL_ONBOARDING_STATE,
    wizardStarted: wizardStarted(onboarding),
    wizardCompleted: completed,
    currentWizardStep: currentWizardStep(onboarding),
    stepData: {
      network: toNetwork(profile, settings, company),
      whitelabel: toWhitelabel(branding),
      units: toUnits(units),
      users: toUsers(usersResponse?.data ?? []),
      modules: toModules(modules),
      financial: toFinancial(settings),
      clientsImported: clientsImported(settings),
    },
    tourCompleted: completed,
    tourActive: false,
    currentTourStop: 0,
    checklist: checklistFromBackend({ onboarding, units, usersTotal, modules, settings }),
    lastSynced: new Date().toISOString(),
  };
}

export function notifyOnboardingRealityChanged(): void {
  window.dispatchEvent(new Event(ONBOARDING_REALITY_CHANGED_EVENT));
}

function validEmail(value: string | null): string | null {
  if (!value) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

async function saveCompanyProfile(network: Partial<WizardStepData['network']>) {
  const networkName = network.networkName?.trim() || null;
  const email = validEmail(network.email?.trim() || null);

  await apiClient.put('/api/me/onboarding/company-profile', {
    legal_name: networkName,
    trade_name: networkName,
    document: network.cnpj || null,
    segment: network.segment || null,
    business_type: 'franchise',
    email,
    responsible_name: networkName,
    responsible_email: email,
    city: network.city || null,
    state: network.state || null,
  });
}

async function saveBranding(whitelabel: Partial<WizardStepData['whitelabel']>) {
  await apiClient.put('/api/me/onboarding/branding', {
    primary_color: whitelabel.primaryColor ?? INITIAL_ONBOARDING_STATE.stepData.whitelabel.primaryColor,
    secondary_color: whitelabel.secondaryColor ?? INITIAL_ONBOARDING_STATE.stepData.whitelabel.secondaryColor,
    login_title: whitelabel.platformName ?? INITIAL_ONBOARDING_STATE.stepData.whitelabel.platformName,
    login_subtitle: 'Acesse sua rede no Orchestra',
  });
}

async function saveSettings(data: Partial<WizardStepData>) {
  const current = dataOf(await optional(apiClient.get<DataResponse<TenantSettings>>('/api/me/settings')));
  const preferences: Record<string, unknown> = { ...(current?.dashboard_preferences ?? {}) };
  if (data.modules) preferences.onboarding_modules = data.modules;
  if (data.financial) preferences.onboarding_financial = data.financial;
  if (data.clientsImported !== undefined) preferences.onboarding_clients_imported = data.clientsImported;

  await apiClient.put('/api/me/settings', {
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    currency: 'BRL',
    network_type: 'franchise',
    unit_management_mode: 'hybrid',
    email_notifications: true,
    system_notifications: true,
    critical_alerts: true,
    dashboard_preferences: preferences,
  });
}

export async function updateOnboardingStep(
  stepId: WizardStepId,
  _stepIndex: number,
  data: Partial<WizardStepData>,
): Promise<OnboardingState> {
  if (stepId === 'network' && data.network) {
    await saveCompanyProfile(data.network);
  }

  if (stepId === 'whitelabel' && data.whitelabel) {
    await saveBranding(data.whitelabel);
  }

  if (['modules', 'financial', 'clients', 'review'].includes(stepId)) {
    await saveSettings(data);
  }

  notifyOnboardingRealityChanged();
  return getOnboardingStatus();
}

export async function completeOnboarding(): Promise<OnboardingState> {
  await saveSettings({});
  await apiClient.post('/api/me/onboarding/complete');
  notifyOnboardingRealityChanged();
  return getOnboardingStatus();
}

export async function updateTourProgress(
  stop: number,
  completed: boolean,
): Promise<OnboardingState> {
  const current = await getOnboardingStatus();

  return {
    ...current,
    currentTourStop: stop,
    tourCompleted: completed,
    tourActive: !completed,
    checklist: completed
      ? current.checklist.map(item => item.id === 'tour' ? { ...item, completed: true } : item)
      : current.checklist,
  };
}

export async function completeChecklistItem(_itemId: string): Promise<OnboardingState> {
  return getOnboardingStatus();
}

export async function resetOnboarding(): Promise<OnboardingState> {
  return getOnboardingStatus();
}
