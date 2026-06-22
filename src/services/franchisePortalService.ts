import { apiClient, apiClientConfig, AUTH_TOKEN_STORAGE_KEY } from './apiClient';
import type { FranchiseDashboardData, FranchisePortalContextData, FranchiseUnit } from '../types/franchisePortal';

interface ApiList<T> { data: T[]; meta: { total: number } }
interface DataResponse<T> { data: T }

const query = (filters: Record<string, string | number | undefined> = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.size ? `?${params}` : '';
};

export const franchisePortalService = {
  context: () => apiClient.get<FranchisePortalContextData>('/api/franchise/me'),
  dashboard: () => apiClient.get<FranchiseDashboardData>('/api/franchise/dashboard'),
  unit: async () => (await apiClient.get<DataResponse<FranchiseUnit>>('/api/franchise/unit')).data,
  sales: () => apiClient.get<ApiList<Record<string, unknown>>>('/api/franchise/sales?per_page=100'),
  salesMetrics: () => apiClient.get<Record<string, number>>('/api/franchise/sales/metrics'),
  transactions: () => apiClient.get<ApiList<Record<string, unknown>>>('/api/franchise/financial/transactions?per_page=100'),
  financialMetrics: () => apiClient.get<Record<string, number>>('/api/franchise/financial/metrics'),
  dre: async () => (await apiClient.get<DataResponse<Record<string, unknown>>>('/api/franchise/dre')).data,
  royalties: () => apiClient.get<ApiList<Record<string, unknown>>>('/api/franchise/royalties?per_page=100'),
  royaltyMetrics: () => apiClient.get<Record<string, number>>('/api/franchise/royalties/metrics'),
  cmvMetrics: () => apiClient.get<Record<string, unknown>>('/api/franchise/cmv/metrics'),
  cmvItems: () => apiClient.get<Record<string, unknown>[]>('/api/franchise/cmv/by-item'),
  checklistOccurrences: () => apiClient.get<ApiList<Record<string, unknown>>>('/api/franchise/checklists/occurrences?per_page=100'),
  trainings: () => apiClient.get<ApiList<Record<string, unknown>>>('/api/franchise/trainings?per_page=100'),
  trainingProgress: () => apiClient.get<Record<string, number>>('/api/franchise/trainings/progress'),
  documents: () => apiClient.get<ApiList<Record<string, unknown>>>('/api/franchise/documents?per_page=100'),
  contracts: () => apiClient.get<ApiList<Record<string, unknown>>>('/api/franchise/contracts?per_page=100'),
  async downloadDocument(id: string | number, fileName: string) {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const response = await fetch(`${apiClientConfig.baseUrl}/api/franchise/documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Não foi possível baixar o documento.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url; link.download = fileName; link.click();
    URL.revokeObjectURL(url);
  },
  query,
};
