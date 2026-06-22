import { apiClient } from './apiClient';
import type {
  DreComparison, DreFilters, DreGoalAnalysis, DreHistoryPoint, DreProjection,
  DreRankingRow, DreStatement, FinancialGoal,
} from '../types/dre';

interface DataResponse<T> {
  data: T;
}

function queryString(filters: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export const dreService = {
  statement: async (filters: DreFilters) =>
    (await apiClient.get<DataResponse<DreStatement>>(`/api/company/dre?${queryString(filters)}`)).data,

  comparison: async (filters: DreFilters) =>
    (await apiClient.get<DataResponse<DreComparison>>(`/api/company/dre/comparison?${queryString(filters)}`)).data,

  goals: async (filters: { year: number; month: number; unit_id?: number }) =>
    (await apiClient.get<DataResponse<DreGoalAnalysis>>(`/api/company/dre/goals?${queryString(filters)}`)).data,

  saveGoal: async (payload: Omit<FinancialGoal, 'id' | 'unit_name'>, id?: number | null) =>
    (id
      ? await apiClient.put<DataResponse<FinancialGoal>>(`/api/company/dre/goals/${id}`, payload)
      : await apiClient.post<DataResponse<FinancialGoal>>('/api/company/dre/goals', payload)
    ).data,

  history: async (filters: { year: number; month: number; months?: number; unit_id?: number }) =>
    (await apiClient.get<DataResponse<{ series: DreHistoryPoint[] }>>(`/api/company/dre/history?${queryString(filters)}`)).data,

  projection: async (filters: { year: number; month: number; unit_id?: number }) =>
    (await apiClient.get<DataResponse<DreProjection>>(`/api/company/dre/projection?${queryString(filters)}`)).data,

  ranking: async (filters: DreFilters) =>
    (await apiClient.get<DataResponse<DreRankingRow[]>>(`/api/company/dre/ranking?${queryString(filters)}`)).data,
};
