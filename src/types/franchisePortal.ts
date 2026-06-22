export interface FranchiseUnit {
  id: number;
  name: string;
  code?: string | null;
  status: string;
  phone?: string | null;
  email?: string | null;
  address_city?: string | null;
  address_state?: string | null;
}

export interface FranchisePortalContextData {
  user: { id: number; name: string; email: string; role: string; status: string };
  unit: FranchiseUnit;
  franchise_scope: { unit_id: number; franchised_id: number; can_view_all_units: boolean };
  permissions: string[];
}

export interface FranchiseDashboardData {
  sales: { count: number; gross_total: number; net_total: number; paid_total: number };
  financial: { income: number; expenses: number; result: number; pending: number };
  dre: { net_profit: number; margin: number };
  cmv: { consumption_cost: number; loss_cost: number };
  royalties: { total_pending: number; total_paid: number };
  checklists: { pending: number; overdue: number; compliance_rate: number };
  trainings: { total: number; completed: number; in_progress: number; completion_rate: number };
}
