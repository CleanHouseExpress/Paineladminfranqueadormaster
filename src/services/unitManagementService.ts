import { apiClient } from './apiClient';
import { metadataService } from './metadataService';
import type { Unit, UnitMetadata, UnitMetric, UnitOption, UnitPayload, UnitsMeta } from '../types/unitManagement';

interface ListUnitsParams {
  search?: string;
  status?: string;
  city?: string;
  state?: string;
  page?: number;
  per_page?: number;
}

interface ListUnitsResponse {
  data: Unit[];
  meta: UnitsMeta;
}

interface DataResponse<T> {
  data: T;
}

function queryString(params: ListUnitsParams) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const unitManagementService = {
  listUnits: (params: ListUnitsParams = {}) =>
    apiClient.get<ListUnitsResponse>(`/api/company/units${queryString(params)}`),

  getUnit: async (id: string | number) =>
    (await apiClient.get<DataResponse<Unit>>(`/api/company/units/${id}`)).data,

  createUnit: async (payload: UnitPayload) =>
    (await apiClient.post<DataResponse<Unit>>('/api/company/units', payload)).data,

  updateUnit: async (id: string | number, payload: UnitPayload) =>
    (await apiClient.put<DataResponse<Unit>>(`/api/company/units/${id}`, payload)).data,

  deleteUnit: (id: string | number) =>
    apiClient.delete<null>(`/api/company/units/${id}`),

  getUnitOptions: () =>
    apiClient.get<UnitOption[]>('/api/company/units/options'),

  getUnitMetrics: async () =>
    (await apiClient.get<DataResponse<UnitMetric[]>>('/api/company/units/metrics')).data,

  getUnitMetadata: async () =>
    metadataService.getEntity('units') as Promise<UnitMetadata>,

  updateUnitMetadata: async (payload: UnitMetadata) =>
    metadataService.updateEntity('units', {
      ...payload,
      entity: 'units',
      form_schema: payload.fields ?? payload.form_schema,
      table_schema: payload.table_columns ?? payload.table_schema,
    }) as Promise<UnitMetadata>,
};
