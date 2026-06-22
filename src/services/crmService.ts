import { apiClient } from './apiClient';
import type {
  CrmActivity, CrmActivityPayload, CrmFilters, CrmLead, CrmLeadPayload,
  CrmMetrics, CrmOption, CrmPipeline, CrmStage, LeadOrigin,
} from '../types/crm';

interface ApiItem<T> { data: T }
interface ApiList<T> { data: T[]; meta?: { total: number } }
type Raw = Record<string, any>;
const id = (value: unknown) => value == null ? undefined : String(value);
const options = (items: Raw[]): CrmOption[] => items.map(item => ({
  id: String(item.id ?? item.value), label: String(item.label ?? item.name ?? item.code),
}));

function mapStage(raw: Raw): CrmStage {
  return {
    id: String(raw.id), pipelineId: String(raw.pipeline_id), pipelineName: raw.pipeline_name,
    name: raw.name, position: Number(raw.position ?? 0), color: raw.color || '#6366F1',
    isWon: Boolean(raw.is_won), isLost: Boolean(raw.is_lost), active: raw.active !== false,
    leadsCount: raw.leads_count == null ? undefined : Number(raw.leads_count),
  };
}
function mapPipeline(raw: Raw): CrmPipeline {
  return {
    id: String(raw.id), name: raw.name, description: raw.description, active: raw.active !== false,
    isDefault: Boolean(raw.is_default), stages: (raw.stages ?? []).map(mapStage),
  };
}
function mapActivity(raw: Raw): CrmActivity {
  return {
    id: String(raw.id), leadId: String(raw.lead_id), leadName: raw.lead_name, type: raw.activity_type,
    title: raw.title, description: raw.description, dueDate: raw.due_date, completedAt: raw.completed_at,
    assignedUserId: id(raw.assigned_user_id), assignedUserName: raw.assigned_user_name, createdAt: raw.created_at,
  };
}
function mapLead(raw: Raw): CrmLead {
  return {
    id: String(raw.id), pipelineId: String(raw.pipeline_id), pipelineName: raw.pipeline_name ?? '',
    stageId: String(raw.stage_id), stageName: raw.stage_name ?? '', stageColor: raw.stage_color || '#6366F1',
    position: Number(raw.position ?? 0), unitId: id(raw.unit_id), unitName: raw.unit_name,
    name: raw.name, email: raw.email, phone: raw.phone, document: raw.document,
    origin: (raw.source ?? 'other') as LeadOrigin, status: raw.status,
    score: Number(raw.score ?? 0), estimatedValue: Number(raw.estimated_value ?? 0),
    assignedUserId: id(raw.assigned_user_id), assignedUserName: raw.assigned_user_name,
    customerId: id(raw.customer_id), customerName: raw.customer_name, lostReason: raw.lost_reason,
    notes: raw.notes, metadata: raw.metadata ?? {}, activities: (raw.activities ?? []).map(mapActivity),
    createdAt: raw.created_at, updatedAt: raw.updated_at,
  };
}
const leadPayload = (payload: Partial<CrmLeadPayload>) => ({
  ...(payload.pipelineId !== undefined && { pipeline_id: Number(payload.pipelineId) }),
  ...(payload.stageId !== undefined && { stage_id: Number(payload.stageId) }),
  unit_id: payload.unitId ? Number(payload.unitId) : null,
  ...(payload.name !== undefined && { name: payload.name }),
  email: payload.email || null, phone: payload.phone || null, document: payload.document || null,
  source: payload.origin || null, score: payload.score ?? null, estimated_value: payload.estimatedValue ?? null,
  assigned_user_id: payload.assignedUserId ? Number(payload.assignedUserId) : null,
  customer_id: payload.customerId ? Number(payload.customerId) : null,
  notes: payload.notes || null, metadata: payload.metadata ?? {},
});
function query(filters: CrmFilters = {}) {
  const params = new URLSearchParams({ per_page: '100' });
  const values: Record<string, unknown> = {
    search: filters.search, pipeline_id: filters.pipelineId, stage_id: filters.stageId,
    status: filters.status, source: filters.origin, assigned_user_id: filters.assignedUserId,
    unit_id: filters.unitId, start_date: filters.startDate, end_date: filters.endDate,
  };
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, String(value)); });
  return `?${params}`;
}

export const crmService = {
  metrics: async (): Promise<CrmMetrics> => {
    const raw = await apiClient.get<Raw>('/api/company/crm/metrics');
    return {
      totalLeads: Number(raw.total_leads), openLeads: Number(raw.open_leads),
      convertedLeads: Number(raw.converted_leads), lostLeads: Number(raw.lost_leads),
      conversionRate: Number(raw.conversion_rate), estimatedValue: Number(raw.estimated_value),
      pendingActivities: Number(raw.pending_activities),
      topSources: (raw.top_sources ?? []).map((item: Raw) => ({ source: item.source, total: Number(item.total) })),
    };
  },
  pipelines: async () => (await apiClient.get<ApiItem<Raw[]>>('/api/company/crm/pipelines')).data.map(mapPipeline),
  createPipeline: async (payload: Partial<CrmPipeline>) => mapPipeline((await apiClient.post<ApiItem<Raw>>('/api/company/crm/pipelines', {
    name: payload.name, description: payload.description, active: payload.active, is_default: payload.isDefault,
  })).data),
  updatePipeline: async (pipelineId: string, payload: Partial<CrmPipeline>) => mapPipeline((await apiClient.put<ApiItem<Raw>>(`/api/company/crm/pipelines/${pipelineId}`, {
    name: payload.name, description: payload.description, active: payload.active, is_default: payload.isDefault,
  })).data),
  deletePipeline: (pipelineId: string) => apiClient.delete<void>(`/api/company/crm/pipelines/${pipelineId}`),
  stages: async (pipelineId?: string) => (await apiClient.get<ApiItem<Raw[]>>(`/api/company/crm/stages${pipelineId ? `?pipeline_id=${pipelineId}` : ''}`)).data.map(mapStage),
  createStage: async (payload: Partial<CrmStage>) => mapStage((await apiClient.post<ApiItem<Raw>>('/api/company/crm/stages', {
    pipeline_id: Number(payload.pipelineId), name: payload.name, position: payload.position, color: payload.color,
    is_won: payload.isWon, is_lost: payload.isLost, active: payload.active,
  })).data),
  updateStage: async (stageId: string, payload: Partial<CrmStage>) => mapStage((await apiClient.put<ApiItem<Raw>>(`/api/company/crm/stages/${stageId}`, {
    pipeline_id: payload.pipelineId ? Number(payload.pipelineId) : undefined, name: payload.name,
    position: payload.position, color: payload.color, is_won: payload.isWon, is_lost: payload.isLost, active: payload.active,
  })).data),
  deleteStage: (stageId: string) => apiClient.delete<void>(`/api/company/crm/stages/${stageId}`),
  leads: async (filters: CrmFilters = {}) => (await apiClient.get<ApiList<Raw>>(`/api/company/crm/leads${query(filters)}`)).data.map(mapLead),
  lead: async (leadId: string) => mapLead((await apiClient.get<ApiItem<Raw>>(`/api/company/crm/leads/${leadId}`)).data),
  createLead: async (payload: CrmLeadPayload) => mapLead((await apiClient.post<ApiItem<Raw>>('/api/company/crm/leads', leadPayload(payload))).data),
  updateLead: async (leadId: string, payload: Partial<CrmLeadPayload>) => mapLead((await apiClient.put<ApiItem<Raw>>(`/api/company/crm/leads/${leadId}`, leadPayload(payload))).data),
  deleteLead: (leadId: string) => apiClient.delete<void>(`/api/company/crm/leads/${leadId}`),
  moveLead: async (leadId: string, stageId: string, position?: number) => mapLead((await apiClient.patch<ApiItem<Raw>>(`/api/company/crm/leads/${leadId}/stage`, { stage_id: Number(stageId), position })).data),
  winLead: async (leadId: string) => mapLead((await apiClient.patch<ApiItem<Raw>>(`/api/company/crm/leads/${leadId}/won`, {})).data),
  loseLead: async (leadId: string, lostReason: string) => mapLead((await apiClient.patch<ApiItem<Raw>>(`/api/company/crm/leads/${leadId}/lost`, { lost_reason: lostReason })).data),
  convertLead: async (leadId: string) => mapLead((await apiClient.post<ApiItem<Raw>>(`/api/company/crm/leads/${leadId}/convert`, {})).data),
  activities: async (leadId?: string) => (await apiClient.get<ApiItem<Raw[]>>(`/api/company/crm/activities${leadId ? `?lead_id=${leadId}` : ''}`)).data.map(mapActivity),
  createActivity: async (payload: CrmActivityPayload) => mapActivity((await apiClient.post<ApiItem<Raw>>('/api/company/crm/activities', {
    lead_id: Number(payload.leadId), activity_type: payload.type, title: payload.title,
    description: payload.description || null, due_date: payload.dueDate || null,
    assigned_user_id: payload.assignedUserId ? Number(payload.assignedUserId) : null,
  })).data),
  completeActivity: async (activityId: string) => mapActivity((await apiClient.patch<ApiItem<Raw>>(`/api/company/crm/activities/${activityId}/complete`, {})).data),
  deleteActivity: (activityId: string) => apiClient.delete<void>(`/api/company/crm/activities/${activityId}`),
  units: async () => options(await apiClient.get<Raw[]>('/api/company/units/options')),
  users: async () => options(await apiClient.get<Raw[]>('/api/company/users/options')),
  metadata: (entity: string) => apiClient.get<ApiItem<Raw>>(`/api/metadata/${entity}`),
  updateMetadata: (entity: string, payload: Raw) => apiClient.put<ApiItem<Raw>>(`/api/metadata/${entity}`, payload),
};
