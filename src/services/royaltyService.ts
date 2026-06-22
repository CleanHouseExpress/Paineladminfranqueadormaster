import { apiClient } from './apiClient';
import type {
  RoyaltyAssignment, RoyaltyAssignmentPayload, RoyaltyCalculation, RoyaltyMetrics,
  RoyaltyRule, RoyaltyRulePayload,
} from '../types/royalties';

interface ApiList<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

interface ApiItem<T> { data: T }

interface ApiRule {
  id: number; name: string; description?: string | null; rule_type: RoyaltyRule['ruleType'];
  calculation_base: RoyaltyRule['calculationBase']; percentage?: number | null;
  fixed_amount?: number | null; minimum_amount?: number | null; maximum_amount?: number | null;
  active: boolean; assignments_count: number;
}

interface ApiAssignment {
  id: number; unit_id: number; unit?: { id: number; name: string } | null;
  royalty_rule_id: number;
  rule?: { id: number; name: string; rule_type: RoyaltyRule['ruleType']; calculation_base: RoyaltyRule['calculationBase'] } | null;
  start_date: string; end_date?: string | null; active: boolean;
}

interface ApiCalculation {
  id: number; unit_id: number; unit?: { id: number; name: string } | null;
  royalty_rule_id: number;
  rule?: { id: number; name: string; rule_type: RoyaltyRule['ruleType']; calculation_base: RoyaltyRule['calculationBase'] } | null;
  reference_year: number; reference_month: number; reference: string; base_amount: number;
  calculated_amount: number; status: RoyaltyCalculation['status']; generated_at?: string | null;
  financial_transaction_id?: number | null;
  financial_transaction?: { id: number; status: string; financial_account_id?: number | null } | null;
}

function queryString(filters: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : '';
}

const mapRule = (item: ApiRule): RoyaltyRule => ({
  id: String(item.id), name: item.name, description: item.description, ruleType: item.rule_type,
  calculationBase: item.calculation_base, percentage: item.percentage === null ? null : Number(item.percentage),
  fixedAmount: item.fixed_amount === null ? null : Number(item.fixed_amount),
  minimumAmount: item.minimum_amount === null ? null : Number(item.minimum_amount),
  maximumAmount: item.maximum_amount === null ? null : Number(item.maximum_amount),
  active: Boolean(item.active), assignmentsCount: Number(item.assignments_count ?? 0),
});

const mapAssignment = (item: ApiAssignment): RoyaltyAssignment => ({
  id: String(item.id), unitId: String(item.unit_id),
  unit: item.unit ? { id: String(item.unit.id), name: item.unit.name } : null,
  royaltyRuleId: String(item.royalty_rule_id),
  rule: item.rule ? {
    id: String(item.rule.id), name: item.rule.name,
    ruleType: item.rule.rule_type, calculationBase: item.rule.calculation_base,
  } : null,
  startDate: item.start_date, endDate: item.end_date, active: Boolean(item.active),
});

const mapCalculation = (item: ApiCalculation): RoyaltyCalculation => ({
  id: String(item.id), unitId: String(item.unit_id),
  unit: item.unit ? { id: String(item.unit.id), name: item.unit.name } : null,
  royaltyRuleId: String(item.royalty_rule_id),
  rule: item.rule ? {
    id: String(item.rule.id), name: item.rule.name,
    ruleType: item.rule.rule_type, calculationBase: item.rule.calculation_base,
  } : null,
  referenceYear: Number(item.reference_year), referenceMonth: Number(item.reference_month),
  reference: item.reference, baseAmount: Number(item.base_amount),
  calculatedAmount: Number(item.calculated_amount), status: item.status,
  generatedAt: item.generated_at,
  financialTransactionId: item.financial_transaction_id ? String(item.financial_transaction_id) : null,
  financialTransaction: item.financial_transaction ? {
    id: String(item.financial_transaction.id), status: item.financial_transaction.status,
    financialAccountId: item.financial_transaction.financial_account_id
      ? String(item.financial_transaction.financial_account_id) : null,
  } : null,
});

export const royaltyService = {
  metrics: async (filters: Record<string, string | number | undefined> = {}): Promise<RoyaltyMetrics> => {
    const data = await apiClient.get<Record<string, number>>(`/api/company/royalties/metrics${queryString(filters)}`);
    return {
      totalGenerated: Number(data.total_generated), totalPaid: Number(data.total_paid),
      totalPending: Number(data.total_pending), defaultAmount: Number(data.default_amount),
      defaultRate: Number(data.default_rate), royaltiesMonth: Number(data.royalties_month),
      marketingMonth: Number(data.marketing_month), extraFeesMonth: Number(data.extra_fees_month),
    };
  },
  listRules: async (filters: Record<string, string | number | boolean | undefined> = {}) => {
    const response = await apiClient.get<ApiList<ApiRule>>(`/api/company/royalties/rules${queryString({ per_page: 100, ...filters })}`);
    return { data: response.data.map(mapRule), meta: response.meta };
  },
  createRule: async (payload: RoyaltyRulePayload) =>
    mapRule((await apiClient.post<ApiItem<ApiRule>>('/api/company/royalties/rules', payload)).data),
  updateRule: async (id: string, payload: Partial<RoyaltyRulePayload>) =>
    mapRule((await apiClient.put<ApiItem<ApiRule>>(`/api/company/royalties/rules/${id}`, payload)).data),
  deleteRule: (id: string) => apiClient.delete<void>(`/api/company/royalties/rules/${id}`),

  listAssignments: async (filters: Record<string, string | number | boolean | undefined> = {}) => {
    const response = await apiClient.get<ApiList<ApiAssignment>>(`/api/company/royalties/assignments${queryString({ per_page: 100, ...filters })}`);
    return { data: response.data.map(mapAssignment), meta: response.meta };
  },
  createAssignment: async (payload: RoyaltyAssignmentPayload) =>
    mapAssignment((await apiClient.post<ApiItem<ApiAssignment>>('/api/company/royalties/assignments', payload)).data),
  updateAssignment: async (id: string, payload: Partial<RoyaltyAssignmentPayload>) =>
    mapAssignment((await apiClient.put<ApiItem<ApiAssignment>>(`/api/company/royalties/assignments/${id}`, payload)).data),
  deleteAssignment: (id: string) => apiClient.delete<void>(`/api/company/royalties/assignments/${id}`),

  listCalculations: async (filters: Record<string, string | number | undefined> = {}) => {
    const response = await apiClient.get<ApiList<ApiCalculation>>(`/api/company/royalties/calculations${queryString({ per_page: 100, ...filters })}`);
    return { data: response.data.map(mapCalculation), meta: response.meta };
  },
  generate: async (payload: { reference_year: number; reference_month: number; unit_id?: number; royalty_rule_id?: number; custom_base_amount?: number }) =>
    (await apiClient.post<ApiItem<ApiCalculation[]>>('/api/company/royalties/generate', payload)).data.map(mapCalculation),
  approve: async (id: string) =>
    mapCalculation((await apiClient.post<ApiItem<ApiCalculation>>(`/api/company/royalties/${id}/approve`)).data),
  markPaid: async (id: string, financialAccountId: string) =>
    mapCalculation((await apiClient.post<ApiItem<ApiCalculation>>(`/api/company/royalties/${id}/mark-paid`, {
      financial_account_id: Number(financialAccountId),
    })).data),
  cancel: async (id: string) =>
    mapCalculation((await apiClient.post<ApiItem<ApiCalculation>>(`/api/company/royalties/${id}/cancel`)).data),
};
