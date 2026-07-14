import { apiClient } from './apiClient';
import type {
  EffectivePolicy,
  PolicyDraftPayload,
  PolicyListMeta,
  PolicySimulationResult,
  PolicyValidationReport,
  SubscriptionPolicyPreset,
  SubscriptionPolicyVersion,
  TenantPolicyScope,
  TenantPolicyStatus,
  TenantPolicyType,
} from '../types/subscriptionPolicies';

interface ApiItem<T> { data: T }
interface ApiList<T> { data: T[]; meta: PolicyListMeta }

function query(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const subscriptionPolicyService = {
  list: (filters: {
    policy_type?: TenantPolicyType;
    scope_type?: TenantPolicyScope;
    status?: TenantPolicyStatus;
    per_page?: number;
  } = {}) => apiClient.get<ApiList<SubscriptionPolicyVersion>>(`/api/company/subscription-policies${query({ per_page: 50, ...filters })}`),

  presets: async () => (await apiClient.get<ApiItem<SubscriptionPolicyPreset[]>>('/api/company/subscription-policies/presets')).data,

  effective: async (filters: { policy_type: TenantPolicyType; unit_id?: number | null; contract_id?: number | null }) =>
    (await apiClient.get<ApiItem<EffectivePolicy>>(`/api/company/subscription-policies/effective${query(filters)}`)).data,

  create: async (payload: PolicyDraftPayload) =>
    (await apiClient.post<ApiItem<SubscriptionPolicyVersion>>('/api/company/subscription-policies', payload, {
      headers: { 'Idempotency-Key': `policy-ui-${Date.now()}` },
    })).data,

  fromPreset: async (payload: Omit<PolicyDraftPayload, 'settings'> & { preset: string }) =>
    (await apiClient.post<ApiItem<SubscriptionPolicyVersion>>('/api/company/subscription-policies/from-preset', payload, {
      headers: { 'Idempotency-Key': `policy-preset-ui-${Date.now()}` },
    })).data,

  validate: async (id: number) =>
    (await apiClient.post<ApiItem<PolicyValidationReport>>(`/api/company/subscription-policies/${id}/validate`, {})).data,

  publish: async (id: number) =>
    (await apiClient.post<ApiItem<SubscriptionPolicyVersion>>(`/api/company/subscription-policies/${id}/publish`, {})).data,

  archive: async (id: number) =>
    (await apiClient.post<ApiItem<SubscriptionPolicyVersion>>(`/api/company/subscription-policies/${id}/archive`, {})).data,

  simulate: async (id: number | null, payload: Record<string, unknown>) => {
    const path = id
      ? `/api/company/subscription-policies/${id}/simulate`
      : '/api/company/subscription-policies/simulate';
    return (await apiClient.post<ApiItem<PolicySimulationResult>>(path, payload)).data;
  },
};
