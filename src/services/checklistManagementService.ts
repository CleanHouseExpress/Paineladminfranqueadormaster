import { apiClient } from './apiClient';
import type {
  ChecklistExecution,
  ChecklistExecutionPayload,
  ChecklistMeta,
  ChecklistMetrics,
  ChecklistTemplate,
  ChecklistTemplatePayload,
} from '../types/checklistManagement';

interface ListResponse<T> {
  data: T[];
  meta: ChecklistMeta;
}

interface DataResponse<T> {
  data: T;
}

function queryString(params: Record<string, unknown>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export const checklistManagementService = {
  listTemplates: (params: Record<string, unknown> = {}) =>
    apiClient.get<ListResponse<ChecklistTemplate>>(`/api/company/checklists/templates${queryString(params)}`),

  getTemplate: async (id: string | number) =>
    (await apiClient.get<DataResponse<ChecklistTemplate>>(`/api/company/checklists/templates/${id}`)).data,

  createTemplate: async (payload: ChecklistTemplatePayload) =>
    (await apiClient.post<DataResponse<ChecklistTemplate>>('/api/company/checklists/templates', payload)).data,

  updateTemplate: async (id: string | number, payload: ChecklistTemplatePayload) =>
    (await apiClient.put<DataResponse<ChecklistTemplate>>(`/api/company/checklists/templates/${id}`, payload)).data,

  deleteTemplate: (id: string | number) =>
    apiClient.delete<null>(`/api/company/checklists/templates/${id}`),

  listExecutions: (params: Record<string, unknown> = {}) =>
    apiClient.get<ListResponse<ChecklistExecution>>(`/api/company/checklists/executions${queryString(params)}`),

  getExecution: async (id: string | number) =>
    (await apiClient.get<DataResponse<ChecklistExecution>>(`/api/company/checklists/executions/${id}`)).data,

  startExecution: async (payload: ChecklistExecutionPayload) =>
    (await apiClient.post<DataResponse<ChecklistExecution>>('/api/company/checklists/executions', payload)).data,

  updateExecution: async (id: string | number, payload: ChecklistExecutionPayload) =>
    (await apiClient.put<DataResponse<ChecklistExecution>>(`/api/company/checklists/executions/${id}`, payload)).data,

  completeExecution: async (id: string | number, payload: ChecklistExecutionPayload = {}) =>
    (await apiClient.post<DataResponse<ChecklistExecution>>(`/api/company/checklists/executions/${id}/complete`, payload)).data,

  metrics: async () =>
    (await apiClient.get<DataResponse<ChecklistMetrics>>('/api/company/checklists/metrics')).data,
};
