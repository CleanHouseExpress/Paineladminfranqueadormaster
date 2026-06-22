export type NocStatus = 'healthy' | 'warning' | 'critical';
export type NocSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface NocAlert {
  id: string;
  type: string;
  severity: NocSeverity;
  title: string;
  unit_id: number;
  unit_name: string;
  value: number | string;
}

export interface NocUnit {
  position: number;
  unit_id: number;
  unit_name: string;
  code?: string;
  location?: string;
  health_score: number;
  status: NocStatus;
  sales: number;
  sales_change: number;
  financial_balance: number;
  cmv: number;
  cmv_percentage: number;
  royalties: number;
  royalties_overdue: number;
  checklist_compliance: number;
  training_completion: number;
  crm_conversion: number;
  contracts_expiring: number;
  inventory_critical: number;
  dimensions: Array<{ key: string; score: number; weight: number }>;
  alerts: NocAlert[];
}

export interface NocDashboard {
  network_score: number;
  healthy_units: number;
  warning_units: number;
  critical_units: number;
  total_alerts: number;
  alerts: NocAlert[];
  top_units: NocUnit[];
}

export interface NocTrend {
  period: string;
  sales: number;
  cmv: number;
  royalties: number;
  financial: number;
}
