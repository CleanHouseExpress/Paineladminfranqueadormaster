export type TenantPolicyType = 'subscription' | 'billing' | 'metrics';
export type TenantPolicyScope = 'company' | 'unit' | 'contract';
export type TenantPolicyStatus = 'draft' | 'published' | 'superseded' | 'archived';

export type PolicySettings = Record<string, unknown>;
export type PolicyGovernance = Record<string, string>;

export interface SubscriptionPolicyVersion {
  id: number;
  policy_type: TenantPolicyType;
  scope_type: TenantPolicyScope;
  scope_id: number | null;
  version: number;
  status: TenantPolicyStatus;
  name: string;
  description?: string | null;
  settings: PolicySettings;
  governance: PolicyGovernance;
  effective_from: string;
  effective_until?: string | null;
  published_at?: string | null;
  superseded_at?: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SubscriptionPolicyPreset {
  slug: string;
  name: string;
  recommended_for: string;
  description: string;
  settings: Record<TenantPolicyType, PolicySettings>;
}

export interface PolicyIssue {
  field: string;
  message: string;
}

export interface PolicyValidationReport {
  valid: boolean;
  errors: PolicyIssue[];
  warnings: PolicyIssue[];
  recommendations: PolicyIssue[];
}

export interface EffectivePolicy {
  policy_type: TenantPolicyType;
  policy_version_id: number | null;
  settings: PolicySettings;
  sources: Array<Record<string, unknown>>;
  resolved_at: string;
}

export interface PolicySimulationResult {
  operation_type: string;
  operator_role: string;
  effective_date: string;
  access_change: string;
  financial_behavior: {
    behavior: string;
    real_financial_execution: boolean;
    creates_invoice: boolean;
    creates_credit: boolean;
    creates_refund: boolean;
  };
  estimated_charge: number;
  estimated_credit: number;
  next_renewal_at: string;
  mrr_impact: Record<string, number>;
  requires_approval: boolean;
  warnings: string[];
  unavailable_capabilities: string[];
  rules_applied: Record<string, unknown>;
}

export interface PolicyListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PolicyDraftPayload {
  preset?: string;
  policy_type: TenantPolicyType;
  scope_type: TenantPolicyScope;
  scope_id?: number | null;
  name: string;
  description?: string | null;
  settings: PolicySettings;
  governance?: PolicyGovernance;
  effective_from: string;
  effective_until?: string | null;
}
