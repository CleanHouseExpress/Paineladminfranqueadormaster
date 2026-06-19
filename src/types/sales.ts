export type SalesOrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';
export type SalesPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface SalesOrderItem {
  id: string;
  catalogItemId?: string | null;
  catalogItemName?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  number: string;
  customerId?: string | null;
  customerName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  contractId?: string | null;
  contractNumber?: string | null;
  status: SalesOrderStatus;
  paymentStatus: SalesPaymentStatus;
  saleDate: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  financialTransactionId?: string | null;
  notes?: string | null;
  items: SalesOrderItem[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SalesMetrics {
  totalOrders: number;
  draft: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  unpaid: number;
  paid: number;
}

export interface SalesOrderPayload {
  number?: string;
  customer_id?: number | null;
  unit_id?: number | null;
  contract_id?: number | null;
  sale_date: string;
  notes?: string | null;
  items: Array<{
    catalog_item_id?: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }>;
  generate_financial_transaction?: boolean;
  financial_account_id?: number;
  account_category_id?: number;
  cost_center_id?: number | null;
  due_date?: string;
}

export interface SalesFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  customer_id?: string;
  unit_id?: string;
  contract_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface SalesOption {
  id: string;
  label: string;
}

export interface CatalogSalesOption extends SalesOption {
  type?: string;
  price: number;
}

export const SALES_ORDER_STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: '#64748B', bg: '#F1F5F9' },
  confirmed: { label: 'Confirmada', color: '#2563EB', bg: '#EFF6FF' },
  completed: { label: 'Concluída', color: '#059669', bg: '#ECFDF5' },
  cancelled: { label: 'Cancelada', color: '#DC2626', bg: '#FEF2F2' },
} as const;

export const SALES_PAYMENT_STATUS_CONFIG = {
  unpaid: { label: 'Em aberto', color: '#D97706', bg: '#FFFBEB' },
  partial: { label: 'Parcial', color: '#7C3AED', bg: '#F5F3FF' },
  paid: { label: 'Recebida', color: '#059669', bg: '#ECFDF5' },
  cancelled: { label: 'Cancelada', color: '#64748B', bg: '#F1F5F9' },
} as const;

export const SALES_PERMISSIONS = {
  view: 'tenant.sales.view',
  create: 'tenant.sales.create',
  update: 'tenant.sales.update',
  delete: 'tenant.sales.delete',
  confirm: 'tenant.sales.confirm',
  complete: 'tenant.sales.complete',
  cancel: 'tenant.sales.cancel',
  generateFinancial: 'tenant.sales.generate_financial',
  configure: 'tenant.sales.configure',
} as const;
