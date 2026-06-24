import { apiClient } from './apiClient';
import type {
  CashbackAdjustmentPayload, CashbackMetrics, CashbackRedeemPayload, CashbackRule,
  CashbackRulePayload, CashbackSettings, CashbackTransaction, CashbackWallet,
} from '../types/loyalty';

interface ApiList<T> { data: T[]; meta?: Record<string, unknown> }
interface ApiItem<T> { data: T }
type ApiRecord = Record<string, any>;

const number = (value: unknown) => Number(value ?? 0);
const stringOrNull = (value: unknown) => value === undefined || value === null ? null : String(value);

function query(filters: Record<string, string | number | boolean | undefined | null> = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params.size ? `?${params.toString()}` : '';
}

function unwrap<T>(response: T | ApiItem<T>): T {
  return response && typeof response === 'object' && 'data' in response ? (response as ApiItem<T>).data : response as T;
}

function mapMetrics(data: ApiRecord): CashbackMetrics {
  return {
    generatedTotal: number(data.generated_total ?? data.total_generated),
    redeemedTotal: number(data.redeemed_total ?? data.total_redeemed),
    liabilityTotal: number(data.cashback_liability_total ?? data.liability_total ?? data.available_total),
    availableTotal: number(data.available_total),
    pendingTotal: number(data.pending_total),
    expiredTotal: number(data.expired_total),
    redemptionRate: number(data.redemption_rate),
    customersWithBalance: number(data.customers_with_balance),
  };
}

function mapSettings(data: ApiRecord): CashbackSettings {
  return {
    enabled: Boolean(data.enabled ?? data.cashback_enabled ?? true),
    cashbackReleaseDays: number(data.cashback_release_days),
    allowCrossUnitRedemption: Boolean(data.allow_cross_unit_redemption),
    expirationDays: data.expiration_days === null || data.expiration_days === undefined ? null : number(data.expiration_days),
    maxRedemptionPercentage: number(data.max_redemption_percentage ?? 100),
    minimumRedemptionAmount: number(data.minimum_redemption_amount),
    liabilityAlertThreshold: data.liability_alert_threshold === null || data.liability_alert_threshold === undefined ? null : number(data.liability_alert_threshold),
  };
}

function settingsPayload(settings: CashbackSettings) {
  return {
    enabled: settings.enabled,
    cashback_release_days: settings.cashbackReleaseDays,
    allow_cross_unit_redemption: settings.allowCrossUnitRedemption,
    expiration_days: settings.expirationDays,
    max_redemption_percentage: settings.maxRedemptionPercentage,
    minimum_redemption_amount: settings.minimumRedemptionAmount,
    liability_alert_threshold: settings.liabilityAlertThreshold,
  };
}

function mapRule(rule: ApiRecord): CashbackRule {
  return {
    id: String(rule.id),
    name: rule.name,
    description: rule.description,
    type: rule.type ?? rule.rule_type,
    calculationBase: rule.calculation_base,
    value: number(rule.value ?? rule.percentage ?? rule.fixed_amount),
    priority: number(rule.priority),
    stackable: Boolean(rule.stackable),
    active: Boolean(rule.active),
    startsAt: rule.starts_at,
    endsAt: rule.ends_at,
    minimumPurchaseAmount: rule.minimum_purchase_amount === null || rule.minimum_purchase_amount === undefined ? null : number(rule.minimum_purchase_amount),
    unitId: stringOrNull(rule.unit_id),
    catalogItemId: stringOrNull(rule.catalog_item_id),
    catalogCategoryId: stringOrNull(rule.catalog_category_id),
    customerSegment: rule.customer_segment,
    firstPurchaseOnly: Boolean(rule.first_purchase_only),
    maxRewardAmount: rule.max_reward_amount === null || rule.max_reward_amount === undefined ? null : number(rule.max_reward_amount),
    createdAt: rule.created_at,
    updatedAt: rule.updated_at,
  };
}

function mapWallet(wallet: ApiRecord): CashbackWallet {
  const customer = wallet.customer ?? {};
  return {
    customerId: String(wallet.customer_id ?? customer.id ?? wallet.id),
    customerName: String(wallet.customer_name ?? customer.name ?? wallet.name ?? 'Cliente'),
    availableBalance: number(wallet.available_balance ?? wallet.available),
    pendingBalance: number(wallet.pending_balance ?? wallet.pending),
    expiredBalance: number(wallet.expired_balance ?? wallet.expired),
    redeemedTotal: number(wallet.redeemed_total),
    lifetimeEarned: number(wallet.lifetime_earned ?? wallet.generated_total),
    liabilityTotal: number(wallet.liability_total ?? wallet.available_balance),
    updatedAt: wallet.updated_at,
  };
}

function mapTransaction(transaction: ApiRecord): CashbackTransaction {
  return {
    id: String(transaction.id),
    customerId: String(transaction.customer_id),
    type: transaction.type,
    status: transaction.status,
    amount: number(transaction.amount),
    balanceAfter: transaction.balance_after === null || transaction.balance_after === undefined ? null : number(transaction.balance_after),
    sourceType: transaction.source_type,
    sourceId: stringOrNull(transaction.source_id),
    saleOrderId: stringOrNull(transaction.sale_order_id),
    description: transaction.description,
    reason: transaction.reason,
    availableAt: transaction.available_at,
    expiresAt: transaction.expires_at,
    createdAt: transaction.created_at,
  };
}

export const loyaltyService = {
  metrics: async () => mapMetrics(unwrap(await apiClient.get<ApiRecord | ApiItem<ApiRecord>>('/api/company/loyalty/cashback/metrics'))),
  settings: async () => mapSettings(unwrap(await apiClient.get<ApiRecord | ApiItem<ApiRecord>>('/api/company/loyalty/cashback/settings'))),
  updateSettings: async (settings: CashbackSettings) =>
    mapSettings(unwrap(await apiClient.put<ApiRecord | ApiItem<ApiRecord>>('/api/company/loyalty/cashback/settings', settingsPayload(settings)))),
  rules: async () => (await apiClient.get<ApiList<ApiRecord>>('/api/company/loyalty/cashback/rules')).data.map(mapRule),
  createRule: async (payload: CashbackRulePayload) =>
    mapRule(unwrap(await apiClient.post<ApiRecord | ApiItem<ApiRecord>>('/api/company/loyalty/cashback/rules', payload))),
  updateRule: async (id: string, payload: CashbackRulePayload) =>
    mapRule(unwrap(await apiClient.put<ApiRecord | ApiItem<ApiRecord>>(`/api/company/loyalty/cashback/rules/${id}`, payload))),
  deleteRule: (id: string) => apiClient.delete<void>(`/api/company/loyalty/cashback/rules/${id}`),
  wallets: async (filters: Record<string, string | number | undefined> = {}) =>
    (await apiClient.get<ApiList<ApiRecord>>(`/api/company/loyalty/cashback/wallets${query({ per_page: 100, ...filters })}`)).data.map(mapWallet),
  wallet: async (customerId: string) =>
    mapWallet(unwrap(await apiClient.get<ApiRecord | ApiItem<ApiRecord>>(`/api/company/loyalty/cashback/wallets/${customerId}`))),
  transactions: async (customerId: string) =>
    (await apiClient.get<ApiList<ApiRecord>>(`/api/company/loyalty/cashback/wallets/${customerId}/transactions?per_page=100`)).data.map(mapTransaction),
  adjustWallet: (customerId: string, payload: CashbackAdjustmentPayload) =>
    apiClient.post<ApiItem<ApiRecord>>(`/api/company/loyalty/cashback/wallets/${customerId}/adjustments`, payload),
  redeemSalesOrderCashback: (orderId: string, payload: CashbackRedeemPayload) =>
    apiClient.post<ApiItem<ApiRecord>>(`/api/company/sales/orders/${orderId}/cashback/redeem`, payload),
};

export const franchiseCashbackService = {
  summary: async () => mapMetrics(unwrap(await apiClient.get<ApiRecord | ApiItem<ApiRecord>>('/api/franchise/cashback/summary'))),
  wallets: async () => (await apiClient.get<ApiList<ApiRecord>>('/api/franchise/cashback/wallets?per_page=100')).data.map(mapWallet),
  wallet: async (customerId: string) => mapWallet(unwrap(await apiClient.get<ApiRecord | ApiItem<ApiRecord>>(`/api/franchise/cashback/wallets/${customerId}`))),
};
