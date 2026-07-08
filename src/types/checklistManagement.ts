import type { DynamicFieldSchema } from './userManagement';
import type { CustomerTableColumn } from './customerManagement';

export interface ChecklistTemplate {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  active: boolean;
  status?: string;
  metadata?: {
    form_schema: DynamicFieldSchema[];
  };
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChecklistTemplateLibraryItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  description?: string | null;
  fields_count: number;
  automations_count: number;
}

export interface ChecklistExecution {
  id: number;
  template_id: number;
  template_name?: string | null;
  unit_id: number;
  unit_name?: string | null;
  user_id?: number | null;
  user_name?: string | null;
  status: string;
  score?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  answers?: Array<{
    field_key: string;
    field_label: string;
    field_type: string;
    value: { value: unknown } | unknown;
  }>;
  schema?: {
    form_schema: DynamicFieldSchema[];
  };
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChecklistMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ChecklistMetrics {
  executed_today: number;
  pending: number;
  completed: number;
  latest: Array<{
    id: number;
    template_name?: string | null;
    unit_name?: string | null;
    status: string;
    created_at?: string | null;
  }>;
}

export type ChecklistTemplatePayload = Record<string, unknown>;
export type ChecklistExecutionPayload = Record<string, unknown>;

export const CHECKLIST_TEMPLATE_COLUMNS: CustomerTableColumn[] = [
  { key: 'name', label: 'Nome', visible: true, sortable: true, order: 10 },
  { key: 'category', label: 'Categoria', visible: true, sortable: true, order: 20 },
  { key: 'status', label: 'Status', visible: true, order: 30 },
  { key: 'created_at', label: 'Criado em', visible: true, order: 40 },
];

export const CHECKLIST_EXECUTION_COLUMNS: CustomerTableColumn[] = [
  { key: 'template_name', label: 'Checklist', visible: true, order: 10 },
  { key: 'unit_name', label: 'Unidade', visible: true, order: 20 },
  { key: 'status', label: 'Status', visible: true, order: 30 },
  { key: 'score', label: 'Score', visible: true, order: 40 },
  { key: 'started_at', label: 'Inicio', visible: true, order: 50 },
];
