import { apiClient } from './apiClient';
import type {
  CatalogSalesOption, SalesFilters, SalesMetrics, SalesOption, SalesOrder, SalesOrderPayload,
} from '../types/sales';

interface ApiList<T> { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }
interface ApiItem<T> { data: T }
type ApiOrder = Record<string, any>;

function query(filters: SalesFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  params.set('per_page', '100');
  return `?${params.toString()}`;
}

function mapOrder(order: ApiOrder): SalesOrder {
  return {
    id: String(order.id),
    number: order.number,
    customerId: order.customer_id ? String(order.customer_id) : null,
    customerName: order.customer_name,
    unitId: order.unit_id ? String(order.unit_id) : null,
    unitName: order.unit_name,
    contractId: order.contract_id ? String(order.contract_id) : null,
    contractNumber: order.contract_number,
    status: order.status,
    paymentStatus: order.payment_status,
    saleDate: order.sale_date,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discount_total),
    total: Number(order.total),
    financialTransactionId: order.financial_transaction_id ? String(order.financial_transaction_id) : null,
    notes: order.notes,
    items: (order.items ?? []).map((item: ApiOrder) => ({
      id: String(item.id),
      catalogItemId: item.catalog_item_id ? String(item.catalog_item_id) : null,
      catalogItemName: item.catalog_item_name,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      discount: Number(item.discount),
      total: Number(item.total),
    })),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

const normalizeOptions = (items: Array<Record<string, any>>): SalesOption[] =>
  items.map(item => ({ id: String(item.id ?? item.value), label: String(item.label ?? item.name) }));

export const salesService = {
  list: async (filters: SalesFilters = {}) =>
    (await apiClient.get<ApiList<ApiOrder>>(`/api/company/sales/orders${query(filters)}`)).data.map(mapOrder),
  metrics: async (filters: SalesFilters = {}): Promise<SalesMetrics> => {
    const data = await apiClient.get<Record<string, number>>(`/api/company/sales/orders/metrics${query(filters)}`);
    return {
      totalOrders: data.total_orders, draft: data.draft, confirmed: data.confirmed,
      completed: data.completed, cancelled: data.cancelled, grossSales: data.gross_sales,
      discounts: data.discounts, netSales: data.net_sales, unpaid: data.unpaid, paid: data.paid,
    };
  },
  get: async (id: string) => mapOrder((await apiClient.get<ApiItem<ApiOrder>>(`/api/company/sales/orders/${id}`)).data),
  create: async (payload: SalesOrderPayload) => mapOrder((await apiClient.post<ApiItem<ApiOrder>>('/api/company/sales/orders', payload)).data),
  update: async (id: string, payload: SalesOrderPayload) => mapOrder((await apiClient.put<ApiItem<ApiOrder>>(`/api/company/sales/orders/${id}`, payload)).data),
  remove: (id: string) => apiClient.delete<void>(`/api/company/sales/orders/${id}`),
  confirm: async (id: string, payload: Partial<SalesOrderPayload> = {}) => mapOrder((await apiClient.patch<ApiItem<ApiOrder>>(`/api/company/sales/orders/${id}/confirm`, payload)).data),
  complete: async (id: string) => mapOrder((await apiClient.patch<ApiItem<ApiOrder>>(`/api/company/sales/orders/${id}/complete`, {})).data),
  cancel: async (id: string) => mapOrder((await apiClient.patch<ApiItem<ApiOrder>>(`/api/company/sales/orders/${id}/cancel`, {})).data),
  customers: async () => normalizeOptions(await apiClient.get<Array<Record<string, any>>>('/api/company/customers/options')),
  units: async () => normalizeOptions(await apiClient.get<Array<Record<string, any>>>('/api/company/units/options')),
  contracts: async () => normalizeOptions(await apiClient.get<Array<Record<string, any>>>('/api/company/contracts/options')),
  accounts: async () => normalizeOptions(await apiClient.get<Array<Record<string, any>>>('/api/company/financial/accounts/options')),
  catalog: async (): Promise<CatalogSalesOption[]> =>
    (await apiClient.get<Array<Record<string, any>>>('/api/company/catalog/items/options')).map(item => ({
      id: String(item.value), label: item.label, type: item.type, price: Number(item.price ?? 0),
    })),
  metadata: (entity: 'sales_orders' | 'sales_order_items') => apiClient.get<ApiItem<Record<string, any>>>(`/api/metadata/${entity}`),
  updateMetadata: (entity: 'sales_orders' | 'sales_order_items', payload: Record<string, any>) => apiClient.put<ApiItem<Record<string, any>>>(`/api/metadata/${entity}`, payload),
};
