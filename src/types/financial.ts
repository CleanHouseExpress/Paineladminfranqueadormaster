export type FinancialAccountType = 'cash' | 'bank' | 'pix' | 'wallet' | 'investment';
export type FinancialTransactionType = 'income' | 'expense';
export type FinancialTransactionStatus = 'pending' | 'paid' | 'overdue' | 'canceled';

export interface FinancialMetrics {
  income: number;
  expenses: number;
  result: number;
  pending: number;
  consolidatedBalance: number;
  cashBalance: number;
  bankBalance: number;
  accountsCount: number;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: FinancialAccountType;
  bankName?: string | null;
  agency?: string | null;
  accountNumber?: string | null;
  pixKey?: string | null;
  initialBalance: number;
  currentBalance: number;
  active: boolean;
  metadata: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FinancialAccountOption {
  id: string;
  label: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  type: FinancialTransactionType;
  status: FinancialTransactionStatus;
  amount: number;
  issuedAt?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  category?: string | null;
  method?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  financialAccountId?: string | null;
  financialAccount?: {
    id: string;
    name: string;
    type: FinancialAccountType;
  } | null;
  metadata: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FinancialAccountPayload {
  name: string;
  type: FinancialAccountType;
  bank_name?: string | null;
  agency?: string | null;
  account_number?: string | null;
  pix_key?: string | null;
  initial_balance?: number;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FinancialTransactionPayload {
  description: string;
  type: FinancialTransactionType;
  status?: FinancialTransactionStatus;
  amount: number;
  issued_at?: string | null;
  due_date?: string | null;
  category?: string | null;
  method?: string | null;
  financial_account_id?: number | null;
  metadata?: Record<string, unknown>;
}

export interface FinancialListMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export const FINANCIAL_ACCOUNT_TYPES: Record<FinancialAccountType, { label: string; color: string; bg: string }> = {
  cash: { label: 'Caixa', color: '#D97706', bg: '#FFFBEB' },
  bank: { label: 'Banco', color: '#2563EB', bg: '#EFF6FF' },
  pix: { label: 'PIX', color: '#059669', bg: '#ECFDF5' },
  wallet: { label: 'Carteira', color: '#7C3AED', bg: '#F5F3FF' },
  investment: { label: 'Investimento', color: '#0891B2', bg: '#ECFEFF' },
};

export const FINANCIAL_PERMISSIONS = {
  view: 'tenant.financial.transactions.view',
  transactionsView: 'tenant.financial.transactions.view',
  transactionsCreate: 'tenant.financial.transactions.create',
  transactionsUpdate: 'tenant.financial.transactions.update',
  transactionsDelete: 'tenant.financial.transactions.delete',
  transactionsPay: 'tenant.financial.transactions.pay',
  accountsView: 'tenant.financial.accounts.view',
  accountsCreate: 'tenant.financial.accounts.create',
  accountsUpdate: 'tenant.financial.accounts.update',
  accountsDelete: 'tenant.financial.accounts.delete',
} as const;
