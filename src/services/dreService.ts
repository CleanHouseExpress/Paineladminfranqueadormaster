import { apiClient } from './apiClient';
import type { DreComparison, DreFilters, DreStatement } from '../types/dre';

interface DataResponse<T> {
  data: T;
}

function queryString(filters: DreFilters) {
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
};
