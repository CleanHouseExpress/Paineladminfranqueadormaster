import { apiClient } from './apiClient';
import type { Customer, CustomerFormSettings, CustomerPayload, CustomersMeta } from '../types/customerManagement';
import { metadataService } from './metadataService';

interface ListCustomersParams {
  search?: string;
  unit_id?: string | number;
  page?: number;
  per_page?: number;
}

interface ListCustomersResponse {
  data: Customer[];
  meta: CustomersMeta;
}

interface DataResponse<T> {
  data: T;
}

function queryString(params: ListCustomersParams) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const customerManagementService = {
  listCustomers: (params: ListCustomersParams = {}) =>
    apiClient.get<ListCustomersResponse>(`/api/company/customers${queryString(params)}`),

  getCustomer: async (id: string | number) =>
    (await apiClient.get<DataResponse<Customer>>(`/api/company/customers/${id}`)).data,

  createCustomer: async (payload: CustomerPayload) =>
    (await apiClient.post<DataResponse<Customer>>('/api/company/customers', payload)).data,

  updateCustomer: async (id: string | number, payload: CustomerPayload) =>
    (await apiClient.put<DataResponse<Customer>>(`/api/company/customers/${id}`, payload)).data,

  deleteCustomer: (id: string | number) =>
    apiClient.delete<null>(`/api/company/customers/${id}`),

  getSettings: async () =>
    metadataService.getEntity('customers') as Promise<CustomerFormSettings>,

  updateSettings: async (payload: CustomerFormSettings) =>
    metadataService.updateEntity('customers', {
      ...payload,
      entity: 'customers',
      form_schema: payload.fields ?? payload.form_schema,
      table_schema: payload.table_columns ?? payload.table_schema,
    }) as Promise<CustomerFormSettings>,
};
