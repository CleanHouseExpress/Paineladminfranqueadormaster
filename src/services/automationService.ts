import { apiClient } from './apiClient';
import type { ActionTask, AutomationRule, TaskMetrics } from '../types/automation';

interface Page<T> { data: T[]; current_page: number; total: number }
const query = (filters: Record<string, string | number | undefined> = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value !== undefined && value !== '' && params.set(key, String(value)));
  return params.size ? `?${params}` : '';
};

export const automationService = {
  rules: (filters = {}) => apiClient.get<Page<AutomationRule>>(`/api/company/automation/rules${query(filters)}`),
  rule: async (id: number) => (await apiClient.get<{ data: AutomationRule }>(`/api/company/automation/rules/${id}`)).data,
  createRule: async (payload: Partial<AutomationRule>) => (await apiClient.post<{ data: AutomationRule }>('/api/company/automation/rules', payload)).data,
  updateRule: async (id: number, payload: Partial<AutomationRule>) => (await apiClient.put<{ data: AutomationRule }>(`/api/company/automation/rules/${id}`, payload)).data,
  deleteRule: (id: number) => apiClient.delete(`/api/company/automation/rules/${id}`),
  toggleRule: async (id: number) => (await apiClient.patch<{ data: AutomationRule }>(`/api/company/automation/rules/${id}/toggle`)).data,
  tasks: (filters = {}) => apiClient.get<Page<ActionTask>>(`/api/company/tasks${query(filters)}`),
  task: async (id: number | string) => (await apiClient.get<{ data: ActionTask }>(`/api/company/tasks/${id}`)).data,
  metrics: async () => (await apiClient.get<{ data: TaskMetrics }>('/api/company/tasks/metrics')).data,
  createTask: async (payload: Partial<ActionTask>) => (await apiClient.post<{ data: ActionTask }>('/api/company/tasks', payload)).data,
  updateTask: async (id: number, payload: Partial<ActionTask>) => (await apiClient.put<{ data: ActionTask }>(`/api/company/tasks/${id}`, payload)).data,
  completeTask: async (id: number) => (await apiClient.patch<{ data: ActionTask }>(`/api/company/tasks/${id}/complete`)).data,
  cancelTask: async (id: number) => (await apiClient.patch<{ data: ActionTask }>(`/api/company/tasks/${id}/cancel`)).data,
  reopenTask: async (id: number) => (await apiClient.patch<{ data: ActionTask }>(`/api/company/tasks/${id}/reopen`)).data,
  assignTask: async (id: number, payload: { assigned_user_id?: number; assigned_unit_id?: number }) => (await apiClient.patch<{ data: ActionTask }>(`/api/company/tasks/${id}/assign`, payload)).data,
};
