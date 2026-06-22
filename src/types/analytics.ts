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
  templateId?: string | null;
  shared: boolean;
  locked: boolean;
  favorited: boolean;
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
  category: 'executive' | 'financial' | 'operational' | 'commercial';
  recommendedView: WidgetViewType;
  color: string;
  icon: string;
}

export type DashboardTemplateScope = 'network' | 'unit' | 'role' | 'user';

export interface DashboardTemplateWidget {
  id?: number;
  metricKey: string;
  viewType: WidgetViewType;
  config: Record<string, unknown>;
  position: number;
}

export interface DashboardTemplate {
  id: number;
  name: string;
  description?: string | null;
  targetScope: DashboardTemplateScope;
  targetIds: Array<string | number>;
  isDefault: boolean;
  locked: boolean;
  published: boolean;
  ownership: 'mine' | 'shared';
  createdByName?: string | null;
  widgets: DashboardTemplateWidget[];
  updatedAt?: string | null;
}

export interface DashboardCatalog {
  mine: DashboardTemplate[];
  network: DashboardTemplate[];
  shared: DashboardTemplate[];
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
