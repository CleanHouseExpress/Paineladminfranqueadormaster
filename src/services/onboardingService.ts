import type { NetworkStepData, OnboardingState, TenantSettingsStepData, WhiteLabelStepData, WizardStepData } from '../types/onboarding';
import { INITIAL_ONBOARDING_STATE } from '../types/onboarding';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'orchestra_onboarding_v1';

const delay = (ms = 80) => new Promise(r => setTimeout(r, ms));

interface ApiOnboardingStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  current_step: string | null;
  required_steps: string[];
  completed_steps: string[];
  onboarding_required: boolean;
  completed_at: string | null;
}

interface ApiCompleteOnboardingResponse extends ApiOnboardingStatus {
  required: boolean;
  pending_steps?: string[];
  message?: string;
}

interface ApiCompanyProfileResponse {
  data: {
    legal_name: string | null;
    trade_name: string | null;
    document: string | null;
    segment: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    responsible_name: string | null;
    responsible_email: string | null;
    responsible_phone: string | null;
  };
}

interface ApiCompanyProfileUpdateResponse extends ApiCompanyProfileResponse {
  company_profile_completed: boolean;
}

interface ApiBrandingResponse {
  data: {
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    login_title: string | null;
    login_subtitle: string | null;
  };
}

interface ApiBrandingUpdateResponse extends ApiBrandingResponse {
  branding_completed: boolean;
}

interface ApiSettingsResponse {
  data: {
    timezone: string;
    language: string;
    currency: string;
    date_format: string;
    time_format: string;
    decimal_separator: string;
    thousand_separator: string;
    week_starts_on: string;
    default_country: string;
    default_state: string | null;
    default_city: string | null;
    network_type: string | null;
    unit_management_mode: string | null;
    email_notifications: boolean;
    system_notifications: boolean;
    critical_alerts: boolean;
    dashboard_preferences: Record<string, unknown> | null;
  };
}

interface ApiSettingsUpdateResponse extends ApiSettingsResponse {
  settings_completed: boolean;
}

const STEP_INDEX_BY_API_STEP: Record<string, number> = {
  company_profile: 0,
  branding: 1,
  settings: 2,
  review: 3,
  completed: 3,
};

function load(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_ONBOARDING_STATE };
    return { ...INITIAL_ONBOARDING_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...INITIAL_ONBOARDING_STATE };
  }
}

function save(state: OnboardingState): OnboardingState {
  const next = { ...state, lastSynced: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

// ─── Public API (matches real endpoints) ──────────────────────────────────────

/** GET /onboarding/status */
export async function getOnboardingStatus(): Promise<OnboardingState> {
  const local = load();

  try {
    const [status, profile, branding, settings] = await Promise.all([
      apiClient.get<ApiOnboardingStatus>('/api/me/onboarding'),
      apiClient.get<ApiCompanyProfileResponse>('/api/me/onboarding/company-profile').catch(() => null),
      apiClient.get<ApiBrandingResponse>('/api/me/onboarding/branding').catch(() => null),
      apiClient.get<ApiSettingsResponse>('/api/me/settings').catch(() => null),
    ]);

    const completedSteps = new Set(status.completed_steps);
    const currentWizardStep = status.current_step
      ? STEP_INDEX_BY_API_STEP[status.current_step] ?? local.currentWizardStep
      : local.currentWizardStep;
    const apiProfile = profile?.data;
    const apiBranding = branding?.data;
    const apiSettings = settings?.data;

    return {
      ...local,
      wizardStarted: status.status !== 'pending' || completedSteps.size > 0,
      wizardCompleted: !status.onboarding_required || status.status === 'completed',
      currentWizardStep,
      stepData: {
        ...local.stepData,
        network: {
          ...local.stepData.network,
          networkName: apiProfile?.trade_name ?? apiProfile?.legal_name ?? local.stepData.network.networkName,
          segment: apiProfile?.segment ?? local.stepData.network.segment,
          cnpj: apiProfile?.document ?? local.stepData.network.cnpj,
          email: apiProfile?.email ?? local.stepData.network.email,
          city: apiProfile?.city ?? local.stepData.network.city,
          state: apiProfile?.state ?? local.stepData.network.state,
          responsibleName: apiProfile?.responsible_name ?? local.stepData.network.responsibleName,
          responsibleEmail: apiProfile?.responsible_email ?? local.stepData.network.responsibleEmail,
          responsiblePhone: apiProfile?.responsible_phone ?? local.stepData.network.responsiblePhone,
        },
        whitelabel: {
          ...local.stepData.whitelabel,
          platformName: apiBranding?.login_title ?? local.stepData.whitelabel.platformName,
          primaryColor: apiBranding?.primary_color ?? local.stepData.whitelabel.primaryColor,
          secondaryColor: apiBranding?.secondary_color ?? local.stepData.whitelabel.secondaryColor,
        },
        settings: {
          ...local.stepData.settings,
          timezone: apiSettings?.timezone ?? local.stepData.settings.timezone,
          language: apiSettings?.language ?? local.stepData.settings.language,
          currency: apiSettings?.currency ?? local.stepData.settings.currency,
          dateFormat: apiSettings?.date_format ?? local.stepData.settings.dateFormat,
          timeFormat: apiSettings?.time_format ?? local.stepData.settings.timeFormat,
          decimalSeparator: apiSettings?.decimal_separator ?? local.stepData.settings.decimalSeparator,
          thousandSeparator: apiSettings?.thousand_separator ?? local.stepData.settings.thousandSeparator,
          weekStartsOn: apiSettings?.week_starts_on ?? local.stepData.settings.weekStartsOn,
          defaultCountry: apiSettings?.default_country ?? local.stepData.settings.defaultCountry,
          defaultState: apiSettings?.default_state ?? local.stepData.settings.defaultState,
          defaultCity: apiSettings?.default_city ?? local.stepData.settings.defaultCity,
          networkType: apiSettings?.network_type ?? local.stepData.settings.networkType,
          unitManagementMode: apiSettings?.unit_management_mode ?? local.stepData.settings.unitManagementMode,
          emailNotifications: apiSettings?.email_notifications ?? local.stepData.settings.emailNotifications,
          systemNotifications: apiSettings?.system_notifications ?? local.stepData.settings.systemNotifications,
          criticalAlerts: apiSettings?.critical_alerts ?? local.stepData.settings.criticalAlerts,
          dashboardPreferences: apiSettings?.dashboard_preferences ?? local.stepData.settings.dashboardPreferences,
        },
      },
      checklist: local.checklist.map(item =>
        item.id === 'network'
          ? { ...item, completed: completedSteps.has('company_profile') }
          : item.id === 'whitelabel'
            ? { ...item, completed: completedSteps.has('branding') }
          : item
      ),
      lastSynced: new Date().toISOString(),
    };
  } catch {
    await delay();
    return local;
  }
}

export async function saveLocalStepData(
  stepIndex: number,
  data: Partial<WizardStepData>,
): Promise<OnboardingState> {
  const current = load();
  return save({
    ...current,
    wizardStarted: true,
    wizardCompleted: false,
    currentWizardStep: Math.max(current.currentWizardStep, stepIndex),
    stepData: { ...current.stepData, ...data },
  });
}

export async function syncNetworkStep(
  stepIndex: number,
  network: Partial<NetworkStepData>,
): Promise<OnboardingState> {
  const response = await apiClient.put<ApiCompanyProfileUpdateResponse>('/api/me/onboarding/company-profile', {
    trade_name: network.networkName,
    legal_name: network.networkName,
    segment: network.segment,
    document: network.cnpj,
    email: network.email,
    city: network.city,
    state: network.state,
    responsible_name: network.responsibleName,
    responsible_email: network.responsibleEmail,
    responsible_phone: network.responsiblePhone,
  });

  const current = load();

  return save({
    ...current,
    wizardStarted: true,
    wizardCompleted: false,
    currentWizardStep: Math.max(current.currentWizardStep, stepIndex),
    stepData: {
      ...current.stepData,
      network: {
        ...current.stepData.network,
        ...network,
      },
    },
    checklist: current.checklist.map(item =>
      item.id === 'network'
        ? { ...item, completed: response.company_profile_completed }
        : item
    ),
  });
}

export async function syncBrandingStep(
  stepIndex: number,
  whitelabel: Partial<WhiteLabelStepData>,
): Promise<OnboardingState> {
  const response = await apiClient.put<ApiBrandingUpdateResponse>('/api/me/onboarding/branding', {
    primary_color: whitelabel.primaryColor,
    secondary_color: whitelabel.secondaryColor,
    login_title: whitelabel.platformName,
  });

  const current = load();

  return save({
    ...current,
    wizardStarted: true,
    wizardCompleted: false,
    currentWizardStep: Math.max(current.currentWizardStep, stepIndex),
    stepData: {
      ...current.stepData,
      whitelabel: {
        ...current.stepData.whitelabel,
        ...whitelabel,
      },
    },
    checklist: current.checklist.map(item =>
      item.id === 'whitelabel'
        ? { ...item, completed: response.branding_completed }
        : item
    ),
  });
}

export async function syncSettingsStep(
  stepIndex: number,
  settings: Partial<TenantSettingsStepData>,
): Promise<OnboardingState> {
  const response = await apiClient.put<ApiSettingsUpdateResponse>('/api/me/settings', {
    timezone: settings.timezone,
    language: settings.language,
    currency: settings.currency,
    date_format: settings.dateFormat,
    time_format: settings.timeFormat,
    decimal_separator: settings.decimalSeparator,
    thousand_separator: settings.thousandSeparator,
    week_starts_on: settings.weekStartsOn,
    default_country: settings.defaultCountry,
    default_state: settings.defaultState,
    default_city: settings.defaultCity,
    network_type: settings.networkType,
    unit_management_mode: settings.unitManagementMode,
    email_notifications: settings.emailNotifications,
    system_notifications: settings.systemNotifications,
    critical_alerts: settings.criticalAlerts,
    dashboard_preferences: settings.dashboardPreferences,
  });
  const completed = response.settings_completed;
  void completed;

  const current = load();

  return save({
    ...current,
    wizardStarted: true,
    wizardCompleted: false,
    currentWizardStep: Math.max(current.currentWizardStep, stepIndex),
    stepData: {
      ...current.stepData,
      settings: {
        ...current.stepData.settings,
        ...settings,
      },
    },
  });
}

/** POST /onboarding/complete */
export async function completeOnboarding(): Promise<OnboardingState> {
  const response = await apiClient.post<ApiCompleteOnboardingResponse>('/api/me/onboarding/complete');
  const current = load();
  const completed = response.status === 'completed' || response.onboarding_required === false;

  return save({
    ...current,
    wizardCompleted: completed,
    currentWizardStep: completed ? STEP_INDEX_BY_API_STEP.completed : current.currentWizardStep,
      checklist: current.checklist.map(item =>
      ['network', 'whitelabel'].includes(item.id)
        ? { ...item, completed }
        : item
    ),
  });
}

/** Persist tour progress */
export async function updateTourProgress(
  stop: number,
  completed: boolean,
): Promise<OnboardingState> {
  await delay(30);
  const current = load();
  return save({
    ...current,
    currentTourStop: stop,
    tourCompleted: completed,
    tourActive: !completed,
    checklist: completed
      ? current.checklist.map(i => i.id === 'tour' ? { ...i, completed: true } : i)
      : current.checklist,
  });
}

/** Mark a checklist item as complete */
export async function completeChecklistItem(itemId: string): Promise<OnboardingState> {
  await delay(30);
  const current = load();
  return save({
    ...current,
    checklist: current.checklist.map(i =>
      i.id === itemId ? { ...i, completed: true } : i
    ),
  });
}

/** Reset (for dev/testing) */
export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}
