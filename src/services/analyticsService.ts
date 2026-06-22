import { ApiError, apiClient } from './apiClient';
import type {
  AnalyticsFilters,
  AnalyticsMetricDefinition,
  AnalyticsMetricResult,
  AnalyticsUnitOption,
  CreateDashboardWidget,
  DashboardWidget,
  WidgetSize,
  WidgetViewType,
} from '../types/analytics';
import { WIDGET_SIZE_COLS } from '../types/analytics';

const BASE = '/api/company/analytics';

type Raw = Record<string, any>;

const MODULE_META: Record<string, { color: string; icon: string }> = {
  sales: { color: '#2563EB', icon: 'ShoppingCart' },
  crm: { color: '#7C3AED', icon: 'Target' },
  financial: { color: '#16A34A', icon: 'DollarSign' },
  cmv: { color: '#EA580C', icon: 'TrendingDown' },
  inventory: { color: '#D97706', icon: 'Boxes' },
  checklists: { color: '#0891B2', icon: 'ClipboardCheck' },
  training: { color: '#DB2777', icon: 'GraduationCap' },
  trainings: { color: '#DB2777', icon: 'GraduationCap' },
};

function dataOf<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response
    ? (response as { data: T }).data
    : response as T;
}

function mapWidget(raw: Raw): DashboardWidget {
  const size = (raw.size ?? 'medium') as WidgetSize;
  return {
    id: String(raw.id),
    title: raw.title ?? raw.metric_key,
    metricKey: raw.metric_key,
    viewType: raw.view_type,
    size,
    positionX: Number(raw.position_x ?? 0),
    positionY: Number(raw.position_y ?? 0),
    width: Number(raw.width ?? WIDGET_SIZE_COLS[size]),
    height: Number(raw.height ?? 1),
    filters: {
      period: raw.filters?.period,
      startDate: raw.filters?.start_date,
      endDate: raw.filters?.end_date,
      unitId: raw.filters?.unit_id,
      franchisedId: raw.filters?.franchised_id,
    },
    settings: raw.settings ?? {},
    active: raw.active !== false,
  };
}

function filtersPayload(filters: AnalyticsFilters) {
  return {
    period: filters.period ?? '30d',
    start_date: filters.startDate,
    end_date: filters.endDate,
    unit_id: filters.unitId || undefined,
    franchised_id: filters.franchisedId || undefined,
  };
}

function widgetPayload(widget: Partial<DashboardWidget> & { title?: string }) {
  return {
    title: widget.title,
    metric_key: widget.metricKey,
    view_type: widget.viewType,
    size: widget.size,
    position_x: widget.positionX,
    position_y: widget.positionY,
    width: widget.width,
    height: widget.height,
    filters: widget.filters ? filtersPayload(widget.filters) : undefined,
    settings: widget.settings,
    active: widget.active,
  };
}

export const analyticsService = {
  async widgets(): Promise<DashboardWidget[]> {
    const response = await apiClient.get<Raw[] | { data: Raw[] }>(`${BASE}/widgets`);
    return dataOf(response).map(mapWidget);
  },

  async available(): Promise<AnalyticsMetricDefinition[]> {
    const response = await apiClient.get<Raw[] | { data: Raw[] }>(`${BASE}/available-widgets`);
    return dataOf(response).map(raw => {
      const meta = MODULE_META[raw.module] ?? { color: '#6366F1', icon: 'LayoutDashboard' };
      return {
        key: raw.metric_key,
        label: raw.label,
        description: raw.description ?? '',
        module: raw.module ?? 'analytics',
        permission: raw.permission,
        allowedViews: raw.allowed_views ?? ['counter'],
        defaultView: raw.default_view ?? 'counter',
        supportedFilters: raw.supported_filters ?? [],
        ...meta,
      };
    });
  },

  async units(): Promise<AnalyticsUnitOption[]> {
    const response = await apiClient.get<Raw[] | { data: Raw[] }>('/api/company/units/options');
    return dataOf(response).map(item => ({
      id: String(item.value ?? item.id),
      label: item.label ?? item.name ?? String(item.value ?? item.id),
    }));
  },

  async create(input: CreateDashboardWidget, order: number): Promise<DashboardWidget> {
    const width = WIDGET_SIZE_COLS[input.size];
    const response = await apiClient.post<Raw | { data: Raw }>(`${BASE}/widgets`, {
      title: input.title,
      metric_key: input.metricKey,
      view_type: input.viewType,
      size: input.size,
      position_x: 0,
      position_y: order,
      width,
      height: 1,
      filters: filtersPayload(input.filters),
      settings: {},
      active: true,
    });
    return mapWidget(dataOf(response));
  },

  async update(id: string, changes: Partial<DashboardWidget>): Promise<DashboardWidget> {
    const normalized = changes.size
      ? { ...changes, width: WIDGET_SIZE_COLS[changes.size] }
      : changes;
    const response = await apiClient.put<Raw | { data: Raw }>(
      `${BASE}/widgets/${id}`,
      widgetPayload(normalized),
    );
    return mapWidget(dataOf(response));
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/widgets/${id}`);
  },

  async reorder(widgets: DashboardWidget[]): Promise<void> {
    await apiClient.put(`${BASE}/widgets/reorder`, {
      widgets: widgets.map((widget, index) => ({
        id: Number(widget.id),
        position_x: 0,
        position_y: index,
        width: WIDGET_SIZE_COLS[widget.size],
        height: widget.height,
      })),
    });
  },

  async query(widget: DashboardWidget, filters: AnalyticsFilters): Promise<AnalyticsMetricResult> {
    try {
      const response = await apiClient.post<Raw | { data: Raw }>(`${BASE}/query`, {
        metric_key: widget.metricKey,
        view_type: widget.viewType,
        filters: filtersPayload({ ...widget.filters, ...filters }),
      });
      const raw = dataOf(response);
      const metricData = raw.data ?? {};
      return {
        metricKey: raw.metric_key ?? widget.metricKey,
        label: raw.label ?? widget.title,
        viewType: raw.view_type ?? widget.viewType,
        value: metricData.value ?? 0,
        format: metricData.format,
        series: metricData.series ?? [],
        rows: metricData.rows ?? [],
      };
    } catch (error) {
      return {
        metricKey: widget.metricKey,
        label: widget.title,
        viewType: widget.viewType,
        value: 0,
        series: [],
        rows: [],
        error: error instanceof ApiError && error.status === 403 ? 'no_permission' : 'unavailable',
      };
    }
  },

  async queryAll(widgets: DashboardWidget[], filters: AnalyticsFilters) {
    const entries = await Promise.all(
      widgets.map(async widget => [widget.id, await this.query(widget, filters)] as const),
    );
    return Object.fromEntries(entries) as Record<string, AnalyticsMetricResult>;
  },
};
