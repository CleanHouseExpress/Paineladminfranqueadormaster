export type LeadStatus = 'open' | 'won' | 'lost' | 'converted';
export type ActivityType = 'call' | 'meeting' | 'whatsapp' | 'email' | 'task' | 'visit' | 'note';
export type LeadOrigin = 'website' | 'instagram' | 'facebook' | 'google' | 'indication' | 'whatsapp' | 'manual' | 'other';

export const LEAD_STATUS_CONFIG = {
  open: { label: 'Aberto', color: '#2563EB', bg: '#EFF6FF' },
  won: { label: 'Ganho', color: '#059669', bg: '#ECFDF5' },
  lost: { label: 'Perdido', color: '#DC2626', bg: '#FEF2F2' },
  converted: { label: 'Convertido', color: '#7C3AED', bg: '#F5F3FF' },
} satisfies Record<LeadStatus, { label: string; color: string; bg: string }>;

export const LEAD_ORIGIN_CONFIG = {
  website: { label: 'Site', color: '#2563EB', bg: '#EFF6FF' },
  instagram: { label: 'Instagram', color: '#DB2777', bg: '#FDF2F8' },
  facebook: { label: 'Facebook', color: '#1D4ED8', bg: '#EFF6FF' },
  google: { label: 'Google', color: '#D97706', bg: '#FFFBEB' },
  indication: { label: 'Indicação', color: '#059669', bg: '#ECFDF5' },
  whatsapp: { label: 'WhatsApp', color: '#16A34A', bg: '#F0FDF4' },
  manual: { label: 'Manual', color: '#475569', bg: '#F8FAFC' },
  other: { label: 'Outro', color: '#64748B', bg: '#F1F5F9' },
} satisfies Record<LeadOrigin, { label: string; color: string; bg: string }>;

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; color: string }> = {
  call: { label: 'Ligação', color: '#059669' }, meeting: { label: 'Reunião', color: '#2563EB' },
  whatsapp: { label: 'WhatsApp', color: '#16A34A' }, email: { label: 'E-mail', color: '#4F46E5' },
  task: { label: 'Tarefa', color: '#D97706' }, visit: { label: 'Visita', color: '#DB2777' },
  note: { label: 'Nota', color: '#64748B' },
};

export interface CrmStage {
  id: string; pipelineId: string; pipelineName?: string; name: string; position: number;
  color: string; isWon: boolean; isLost: boolean; active: boolean; leadsCount?: number;
}
export interface CrmPipeline {
  id: string; name: string; description?: string; active: boolean; isDefault: boolean; stages: CrmStage[];
}
export interface CrmActivity {
  id: string; leadId: string; leadName?: string; type: ActivityType; title: string;
  description?: string; dueDate?: string; completedAt?: string; assignedUserId?: string;
  assignedUserName?: string; createdAt?: string;
}
export interface CrmLead {
  id: string; pipelineId: string; pipelineName: string; stageId: string; stageName: string;
  stageColor: string; position: number; unitId?: string; unitName?: string; name: string;
  email?: string; phone?: string; document?: string; origin: LeadOrigin; status: LeadStatus;
  score: number; estimatedValue: number; assignedUserId?: string; assignedUserName?: string;
  customerId?: string; customerName?: string; lostReason?: string; notes?: string;
  metadata?: Record<string, unknown>; activities?: CrmActivity[]; createdAt?: string; updatedAt?: string;
}
export interface CrmMetrics {
  totalLeads: number; openLeads: number; convertedLeads: number; lostLeads: number;
  conversionRate: number; estimatedValue: number; pendingActivities: number;
  topSources: Array<{ source: LeadOrigin; total: number }>;
}
export interface CrmLeadPayload {
  pipelineId: string; stageId: string; unitId?: string; name: string; email?: string;
  phone?: string; document?: string; origin?: LeadOrigin; score?: number; estimatedValue?: number;
  assignedUserId?: string; customerId?: string; notes?: string; metadata?: Record<string, unknown>;
}
export interface CrmActivityPayload {
  leadId: string; type: ActivityType; title: string; description?: string; dueDate?: string; assignedUserId?: string;
}
export interface CrmFilters {
  search?: string; pipelineId?: string; stageId?: string; status?: LeadStatus | '';
  origin?: LeadOrigin | ''; assignedUserId?: string; unitId?: string; startDate?: string; endDate?: string;
}
export interface CrmOption { id: string; label: string }
