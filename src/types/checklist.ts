import type { FieldType } from './formBuilder';

export type ChecklistCategory =
  | 'abertura' | 'fechamento' | 'limpeza' | 'estoque'
  | 'manutencao' | 'auditoria' | 'operacional';

export type ExecutionStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled';

// Field schema stored in the template (Metadata Engine field definition)
export interface ChecklistFieldSchema {
  key: string;          // snake_case internal key
  label: string;
  type: FieldType | 'boolean' | 'document' | 'photo' | 'signature';
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string; color?: string }>;
  order: number;
  sectionLabel?: string; // optional grouping label
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  category: ChecklistCategory;
  active: boolean;
  schema: ChecklistFieldSchema[];
  estimatedMinutes: number;
  totalExecutions: number;
  lastExecutedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistExecution {
  id: string;
  templateId: string;
  templateName: string;
  category: ChecklistCategory;
  unitId: string;
  unitName: string;
  userId: string;
  userName: string;
  status: ExecutionStatus;
  score?: number;  // 0-100 percentage of required fields answered
  totalItems: number;
  answeredItems: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistAnswer {
  id: string;
  executionId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  value: unknown;  // JSON - string | number | boolean | string[]
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistStats {
  executedToday: number;
  pending: number;
  completedThisWeek: number;
  complianceRate: number; // 0-100
  activeTemplates: number;
  recentExecutions: ChecklistExecution[];
}

// RBAC permissions
export const CHECKLIST_PERMISSIONS = [
  'tenant.checklists.view',
  'tenant.checklists.create',
  'tenant.checklists.update',
  'tenant.checklists.delete',
  'tenant.checklists.execute',
  'tenant.checklists.approve',
  'tenant.checklists.configure',
] as const;

export type ChecklistPermission = typeof CHECKLIST_PERMISSIONS[number];
