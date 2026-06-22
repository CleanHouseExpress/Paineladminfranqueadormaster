export type RoyaltyRuleType = 'percentage' | 'fixed';
export type RoyaltyCalculationBase = 'gross_revenue' | 'net_revenue' | 'operating_profit' | 'sales_count' | 'custom';
export type RoyaltyCalculationStatus = 'draft' | 'generated' | 'approved' | 'paid' | 'cancelled';

export interface RoyaltyRule {
  id: string;
  name: string;
  description?: string | null;
  ruleType: RoyaltyRuleType;
  calculationBase: RoyaltyCalculationBase;
  percentage?: number | null;
  fixedAmount?: number | null;
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  active: boolean;
  assignmentsCount: number;
}

export interface RoyaltyRulePayload {
  name: string;
  description?: string | null;
  rule_type: RoyaltyRuleType;
  calculation_base: RoyaltyCalculationBase;
  percentage?: number | null;
  fixed_amount?: number | null;
  minimum_amount?: number | null;
  maximum_amount?: number | null;
  active?: boolean;
}

export interface RoyaltyAssignment {
  id: string;
  unitId: string;
  unit?: { id: string; name: string } | null;
  royaltyRuleId: string;
  rule?: Pick<RoyaltyRule, 'id' | 'name' | 'ruleType' | 'calculationBase'> | null;
  startDate: string;
  endDate?: string | null;
  active: boolean;
}

export interface RoyaltyAssignmentPayload {
  unit_id: number;
  royalty_rule_id: number;
  start_date: string;
  end_date?: string | null;
  active?: boolean;
}

export interface RoyaltyCalculation {
  id: string;
  unitId: string;
  unit?: { id: string; name: string } | null;
  royaltyRuleId: string;
  rule?: Pick<RoyaltyRule, 'id' | 'name' | 'ruleType' | 'calculationBase'> | null;
  referenceYear: number;
  referenceMonth: number;
  reference: string;
  baseAmount: number;
  calculatedAmount: number;
  status: RoyaltyCalculationStatus;
  generatedAt?: string | null;
  financialTransactionId?: string | null;
  financialTransaction?: {
    id: string;
    status: string;
    financialAccountId?: string | null;
  } | null;
}

export interface RoyaltyMetrics {
  totalGenerated: number;
  totalPaid: number;
  totalPending: number;
  defaultAmount: number;
  defaultRate: number;
  royaltiesMonth: number;
  marketingMonth: number;
  extraFeesMonth: number;
}

export type FinancialPeriodStatus = 'open' | 'closing' | 'closed' | 'reopened';

export interface RoyaltyPeriodSnapshot {
  id: number;
  unit_id: number;
  unit_name?: string | null;
  base_amount: number;
  royalty_amount: number;
  status: string;
  generated_at?: string | null;
}

export interface FinancialPeriod {
  id: number;
  year: number;
  month: number;
  reference: string;
  status: FinancialPeriodStatus;
  opened_at?: string | null;
  closed_at?: string | null;
  closed_by?: number | null;
  closed_by_name?: string | null;
  notes?: string | null;
  snapshots: RoyaltyPeriodSnapshot[];
}

export const ROYALTY_PERMISSIONS = {
  view: 'tenant.royalties.view',
  create: 'tenant.royalties.create',
  update: 'tenant.royalties.update',
  approve: 'tenant.royalties.approve',
  markPaid: 'tenant.royalties.mark_paid',
  configure: 'tenant.royalties.configure',
  close: 'tenant.royalties.close',
} as const;

export const ROYALTY_BASES: Record<RoyaltyCalculationBase, string> = {
  gross_revenue: 'Faturamento bruto',
  net_revenue: 'Faturamento líquido',
  operating_profit: 'Resultado operacional',
  sales_count: 'Quantidade de vendas',
  custom: 'Base personalizada',
};
