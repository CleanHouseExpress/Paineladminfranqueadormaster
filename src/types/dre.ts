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

export interface FinancialGoal {
  id: number | null;
  unit_id?: number | null;
  unit_name?: string | null;
  year: number;
  month: number;
  sales_target: number;
  profit_target: number;
  cmv_target: number;
  royalty_target: number;
}

export interface DreGoalAnalysis {
  goal: FinancialGoal;
  actual: { sales: number; profit: number; cmv: number; royalty: number };
  achievement: { sales: number; profit: number; cmv: number; royalty: number };
}

export interface DreHistoryPoint {
  period: string;
  label: string;
  revenue: number;
  cmv: number;
  profit: number;
  margin: number;
}

export interface DreProjection {
  period: string;
  elapsed_days: number;
  total_days: number;
  actual: DreSummary;
  projected: Pick<DreSummary, 'gross_revenue' | 'net_revenue' | 'cmv' | 'net_profit' | 'margin'>;
}

export interface DreRankingRow {
  position: number;
  unit_id: number;
  unit_name: string;
  revenue: number;
  cmv: number;
  expenses: number;
  profit: number;
  margin: number;
}
