export type WidgetViewType = 'counter' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'table';
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: 'Hoje',
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  custom: 'Personalizado',
};

export const WIDGET_SIZE_COLS: Record<WidgetSize, number> = {
  small: 4,
  medium: 6,
  large: 8,
  full: 12,
};

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
  full: 'Largura total',
};

export interface AnalyticsFilters {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  unitId?: string | number | null;
  franchisedId?: string | number | null;
}

export interface DashboardWidget {
  id: string;
  title: string;
  metricKey: string;
  viewType: WidgetViewType;
  size: WidgetSize;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  filters: AnalyticsFilters;
  settings: Record<string, unknown>;
  active: boolean;
}

export interface AnalyticsMetricDefinition {
  key: string;
  label: string;
  description: string;
  module: string;
  permission?: string;
  allowedViews: WidgetViewType[];
  defaultView: WidgetViewType;
  supportedFilters: string[];
  color: string;
  icon: string;
}

export interface MetricSeriesItem {
  label: string;
  value: number;
  color?: string;
}

export interface AnalyticsMetricResult {
  metricKey: string;
  label: string;
  viewType: WidgetViewType;
  value: number | string;
  format?: 'currency' | 'percentage' | 'number' | string;
  series: MetricSeriesItem[];
  rows: Array<Record<string, unknown>>;
  error?: 'no_permission' | 'no_data' | 'unavailable';
}

export interface AnalyticsUnitOption {
  id: string;
  label: string;
}

export interface CreateDashboardWidget {
  title: string;
  metricKey: string;
  viewType: WidgetViewType;
  size: WidgetSize;
  filters: AnalyticsFilters;
}

export const ANALYTICS_PERMISSIONS = [
  'tenant.analytics.view',
  'tenant.analytics.create',
  'tenant.analytics.update',
  'tenant.analytics.delete',
  'tenant.analytics.configure',
] as const;
