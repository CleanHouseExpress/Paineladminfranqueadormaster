export interface DreFilters {
  start_date: string;
  end_date: string;
  unit_id?: number;
  franchised_id?: number;
}

export type DreRowKind = 'value' | 'subtraction' | 'subtotal' | 'total';

export interface DreRow {
  key: string;
  label: string;
  position: number;
  kind: DreRowKind;
  amount: number;
}

export interface DreSummary {
  gross_revenue: number;
  deductions: number;
  net_revenue: number;
  cmv: number;
  gross_profit: number;
  operational_expense: number;
  operating_profit: number;
  other_income: number;
  other_expense: number;
  other_result: number;
  net_profit: number;
  margin: number;
  cmv_percentage: number;
}

export interface DreStatement {
  filters: DreFilters;
  summary: DreSummary;
  rows: DreRow[];
}

export interface DreComparisonMetric {
  current: number;
  previous: number;
  variation_percentage: number | null;
}

export interface DreComparison {
  current_period: DreFilters;
  previous_period: DreFilters;
  comparison: Record<keyof DreSummary, DreComparisonMetric>;
  current: DreStatement;
  previous: DreStatement;
}
