import { apiClient } from './apiClient';
import type {
  CMVByItem, CMVByOrigin, CMVByUnit, CMVFilters, CMVMetrics,
} from '../types/cmv';

interface ApiMetrics {
  consumption_cost: number | string;
  loss_cost: number | string;
  adjustment_cost: number | string;
  movements: number;
  units: number;
  top_item?: string | null;
  top_unit?: string | null;
}

interface ApiByItem {
  item_id: number | string;
  item_name: string;
  unit_of_measure?: string | null;
  quantity: number | string;
  average_cost: number | string;
  cost: number | string;
}

interface ApiByUnit {
  unit_id?: number | string | null;
  unit_name: string;
  consumption_cost: number | string;
  loss_cost: number | string;
  adjustment_cost: number | string;
}

interface ApiByOrigin {
  origin: string;
  origin_type: string;
  cost: number | string;
  movements: number;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function query(filters: CMVFilters) {
  const params = new URLSearchParams();
  const end = filters.endDate || dateOnly(new Date());
  let start = filters.startDate;

  if (filters.period !== 'custom') {
    const days = filters.period === 'today' ? 0 : Number(filters.period.replace('d', '')) - 1;
    const value = new Date(`${end}T12:00:00`);
    value.setDate(value.getDate() - days);
    start = dateOnly(value);
  }

  if (start) params.set('start_date', start);
  if (end) params.set('end_date', end);
  if (filters.unitId) params.set('unit_id', filters.unitId);
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
}

export const cmvService = {
  metrics: async (filters: CMVFilters): Promise<CMVMetrics> => {
    const data = await apiClient.get<ApiMetrics>(`/api/company/cmv/metrics${query(filters)}`);
    return {
      consumptionCost: Number(data.consumption_cost),
      lossCost: Number(data.loss_cost),
      adjustmentCost: Number(data.adjustment_cost),
      movements: data.movements,
      units: data.units,
      topItem: data.top_item,
      topUnit: data.top_unit,
    };
  },

  byItem: async (filters: CMVFilters): Promise<CMVByItem[]> => (
    await apiClient.get<ApiByItem[]>(`/api/company/cmv/by-item${query(filters)}`)
  ).map(row => ({
    itemId: String(row.item_id),
    itemName: row.item_name,
    unitOfMeasure: row.unit_of_measure,
    quantity: Number(row.quantity),
    averageCost: Number(row.average_cost),
    cost: Number(row.cost),
  })),

  byUnit: async (filters: CMVFilters): Promise<CMVByUnit[]> => (
    await apiClient.get<ApiByUnit[]>(`/api/company/cmv/by-unit${query(filters)}`)
  ).map(row => ({
    unitId: row.unit_id ? String(row.unit_id) : null,
    unitName: row.unit_name,
    consumptionCost: Number(row.consumption_cost),
    lossCost: Number(row.loss_cost),
    adjustmentCost: Number(row.adjustment_cost),
  })),

  byOrigin: async (filters: CMVFilters): Promise<CMVByOrigin[]> => (
    await apiClient.get<ApiByOrigin[]>(`/api/company/cmv/by-origin${query(filters)}`)
  ).map(row => ({
    origin: row.origin,
    originType: row.origin_type,
    cost: Number(row.cost),
    movements: row.movements,
  })),
};
