export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  event_key: string;
  conditions_json?: Record<string, unknown>;
  action_type: 'create_task' | 'create_noc_alert' | 'audit_only';
  action_config_json?: Record<string, unknown>;
  is_active: boolean;
}

export interface ActionTask {
  id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  completed_at?: string;
  assigned_user_id?: number;
  assigned_unit_id?: number;
  assigned_user?: { id: number; name: string; email: string };
  assigned_unit?: { id: number; name: string };
  source_type?: string;
  source_id?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface TaskMetrics {
  open: number;
  overdue: number;
  critical: number;
  completed_today: number;
  completed: number;
}
