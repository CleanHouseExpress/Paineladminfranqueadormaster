import { apiClient } from './apiClient';
import type { NocAlert, NocDashboard, NocTrend, NocUnit } from '../types/noc';

const query = (filters: Record<string, string | number | undefined> = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  return params.size ? `?${params}` : '';
};

export const nocService = {
  dashboard: async (filters = {}) => (await apiClient.get<{ data: NocDashboard }>(`/api/company/noc/dashboard${query(filters)}`)).data,
  units: async (filters = {}) => (await apiClient.get<{ data: NocUnit[] }>(`/api/company/noc/units${query(filters)}`)).data,
  alerts: async (filters = {}) => (await apiClient.get<{ data: NocAlert[] }>(`/api/company/noc/alerts${query(filters)}`)).data,
  unit: async (id: string, filters = {}) => (await apiClient.get<{ data: NocUnit }>(`/api/company/noc/unit/${id}${query(filters)}`)).data,
  trends: async (filters = {}) => (await apiClient.get<{ data: { series: NocTrend[] } }>(`/api/company/noc/trends${query(filters)}`)).data,
};
