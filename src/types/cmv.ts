export type CMVPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface CMVFilters {
  period: CMVPeriod;
  unitId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CMVMetrics {
  consumptionCost: number;
  lossCost: number;
  adjustmentCost: number;
  movements: number;
  units: number;
  topItem?: string | null;
  topUnit?: string | null;
}

export interface CMVByItem {
  itemId: string;
  itemName: string;
  unitOfMeasure?: string | null;
  quantity: number;
  averageCost: number;
  cost: number;
}

export interface CMVByUnit {
  unitId?: string | null;
  unitName: string;
  consumptionCost: number;
  lossCost: number;
  adjustmentCost: number;
}

export interface CMVByOrigin {
  origin: string;
  originType: string;
  cost: number;
  movements: number;
}

export const CMV_PERMISSIONS = {
  view: 'tenant.cmv.view',
  export: 'tenant.cmv.export',
  configure: 'tenant.cmv.configure',
} as const;
