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
  operational_actions?: OperationalActionExecution[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OperationalActionExecution {
  id: number | string;
  automation_rule_id?: number | string | null;
  action_type: string;
  source_type?: string | null;
  source_id?: number | string | null;
  source_reference?: string | null;
  unit_id?: number | string | null;
  status: 'pending_confirmation' | 'completed' | 'failed' | 'reversed' | string;
  recipe_execution_id?: number | string | null;
  recipe_execution?: {
    id: number | string;
    number?: string | null;
    status?: string | null;
    recipe_id?: number | string | null;
    recipe_version_id?: number | string | null;
    unit_id?: number | string | null;
    stock_location_id?: number | string | null;
  } | null;
  error_code?: string | null;
  error_message?: string | null;
  result?: Record<string, unknown>;
  executed_at?: string | null;
  executed_by?: number | string | null;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChecklistMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type ChecklistPolicyActivation = 'enabled' | 'disabled';
export type ChecklistPolicyRequirement = 'required' | 'optional';
export type ChecklistPolicyOverride<T extends string> = T | 'inherit';
export type ChecklistPolicySource = 'unit' | 'network' | 'form_default' | string;

export interface ChecklistNetworkApplicationPolicy {
  activation: ChecklistPolicyActivation;
  requirement: ChecklistPolicyRequirement;
  effective_enabled: boolean;
  effective_required: boolean;
  activation_source: ChecklistPolicySource;
  requirement_source: ChecklistPolicySource;
}

export interface ChecklistUnitApplicationPolicy {
  id: number;
  code?: string | null;
  name: string;
  status?: string | null;
  activation: ChecklistPolicyOverride<ChecklistPolicyActivation>;
  requirement: ChecklistPolicyOverride<ChecklistPolicyRequirement>;
  effective_enabled: boolean;
  effective_required: boolean;
  activation_source: ChecklistPolicySource;
  requirement_source: ChecklistPolicySource;
  has_exception: boolean;
}

export interface ChecklistApplicationPolicies {
  template_id: number;
  network: ChecklistNetworkApplicationPolicy;
  units: ChecklistUnitApplicationPolicy[];
  meta: ChecklistMeta;
}

export interface ChecklistApplicationPolicyFilters {
  search?: string;
  status?: string;
  effective_activation?: ChecklistPolicyActivation | '';
  effective_requirement?: ChecklistPolicyRequirement | '';
  has_exception?: boolean;
  page?: number;
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
