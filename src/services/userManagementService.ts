import { apiClient } from './apiClient';
import type { TenantRole, TenantUser, TenantUserPayload, TenantUsersMeta } from '../types/userManagement';

interface UserUnit {
  id: number;
  name: string;
}

interface ListUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

interface ListUsersResponse {
  data: TenantUser[];
  meta: TenantUsersMeta;
}

interface DataResponse<T> {
  data: T;
}

function queryString(params: ListUsersParams) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const userManagementService = {
  listUsers: (params: ListUsersParams = {}) =>
    apiClient.get<ListUsersResponse>(`/api/company/users${queryString(params)}`),

  getUser: async (id: string | number) =>
    (await apiClient.get<DataResponse<TenantUser>>(`/api/company/users/${id}`)).data,

  createUser: async (payload: TenantUserPayload) =>
    (await apiClient.post<DataResponse<TenantUser>>('/api/company/users', payload)).data,

  updateUser: async (id: string | number, payload: TenantUserPayload) =>
    (await apiClient.put<DataResponse<TenantUser>>(`/api/company/users/${id}`, payload)).data,

  activateUser: async (id: string | number) =>
    (await apiClient.patch<DataResponse<TenantUser>>(`/api/company/users/${id}/activate`)).data,

  deactivateUser: async (id: string | number) =>
    (await apiClient.patch<DataResponse<TenantUser>>(`/api/company/users/${id}/deactivate`)).data,

  assignRoles: async (id: string | number, roles: number[]) =>
    (await apiClient.put<DataResponse<TenantUser>>(`/api/company/users/${id}/roles`, { roles })).data,

  getUserUnits: (id: string | number) =>
    apiClient.get<UserUnit[]>(`/api/company/users/${id}/units`),

  assignUnits: (id: string | number, unit_ids: number[]) =>
    apiClient.put<{ unit_ids: number[] }>(`/api/company/users/${id}/units`, { unit_ids }),

  listRoles: async () =>
    (await apiClient.get<DataResponse<TenantRole[]>>('/api/company/roles')).data,
};
