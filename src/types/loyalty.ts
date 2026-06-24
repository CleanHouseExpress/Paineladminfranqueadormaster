export type CashbackRuleType = 'percentage' | 'fixed_amount' | 'tiered' | 'campaign';
export type CashbackCalculationBase = 'sale_total' | 'catalog_item' | 'catalog_category' | 'unit' | 'customer_segment' | 'first_purchase';
export type CashbackTransactionStatus = 'pending' | 'available' | 'redeemed' | 'expired' | 'cancelled' | 'reversal';
export type CashbackTransactionType = 'credit' | 'debit' | 'adjustment' | 'reversal' | 'expiration';

export interface CashbackMetrics {
  generatedTotal: number;
  redeemedTotal: number;
  liabilityTotal: number;
  availableTotal: number;
  pendingTotal: number;
  expiredTotal: number;
  redemptionRate: number;
  customersWithBalance: number;
}

export interface CashbackSettings {
  enabled: boolean;
  cashbackReleaseDays: number;
  allowCrossUnitRedemption: boolean;
  expirationDays: number | null;
  maxRedemptionPercentage: number;
  minimumRedemptionAmount: number;
  liabilityAlertThreshold: number | null;
}

export interface CashbackRule {
  id: string;
  name: string;
  description?: string | null;
  type: CashbackRuleType;
  calculationBase: CashbackCalculationBase;
  value: number;
  priority: number;
  stackable: boolean;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  minimumPurchaseAmount?: number | null;
  unitId?: string | null;
  catalogItemId?: string | null;
  catalogCategoryId?: string | null;
  customerSegment?: string | null;
  firstPurchaseOnly?: boolean;
  maxRewardAmount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CashbackRulePayload {
  name: string;
  description?: string | null;
  type: CashbackRuleType;
  calculation_base: CashbackCalculationBase;
  value: number;
  priority: number;
  stackable: boolean;
  active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  minimum_purchase_amount?: number | null;
  unit_id?: number | null;
  catalog_item_id?: number | null;
  catalog_category_id?: number | null;
  customer_segment?: string | null;
  first_purchase_only?: boolean;
  max_reward_amount?: number | null;
}

export interface CashbackWallet {
  customerId: string;
  customerName: string;
  availableBalance: number;
  pendingBalance: number;
  expiredBalance: number;
  redeemedTotal: number;
  lifetimeEarned: number;
  liabilityTotal: number;
  updatedAt?: string | null;
}

export interface CashbackTransaction {
  id: string;
  customerId: string;
  type: CashbackTransactionType;
  status: CashbackTransactionStatus;
  amount: number;
  balanceAfter?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  saleOrderId?: string | null;
  description?: string | null;
  reason?: string | null;
  availableAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
}

export interface CashbackAdjustmentPayload {
  amount: number;
  reason: string;
}

export interface CashbackRedeemPayload {
  amount: number;
}

export const LOYALTY_PERMISSIONS = {
  view: 'tenant.loyalty.view',
  configure: 'tenant.loyalty.configure',
  rulesView: 'tenant.loyalty.rules.view',
  rulesCreate: 'tenant.loyalty.rules.create',
  rulesUpdate: 'tenant.loyalty.rules.update',
  rulesDelete: 'tenant.loyalty.rules.delete',
  walletsView: 'tenant.loyalty.wallets.view',
  adjust: 'tenant.loyalty.adjust',
  redeem: 'tenant.loyalty.redeem',
  franchisePortalCashbackView: 'tenant.franchise_portal.cashback.view',
} as const;
