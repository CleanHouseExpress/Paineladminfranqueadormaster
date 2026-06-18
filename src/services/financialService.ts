import { apiClient } from './apiClient';
import type {
  FinancialAccount, FinancialAccountOption, FinancialAccountPayload, FinancialListMeta,
  FinancialMetrics, FinancialTransaction, FinancialTransactionPayload,
} from '../types/financial';

interface ApiList<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface ApiItem<T> {
  data: T;
}

interface ApiAccount {
  id: number;
  name: string;
  type: FinancialAccount['type'];
  bank_name?: string | null;
  agency?: string | null;
  account_number?: string | null;
  pix_key?: string | null;
  initial_balance: number;
  current_balance: number;
  active: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiTransaction {
  id: number;
  description: string;
  type: FinancialTransaction['type'];
  status: FinancialTransaction['status'];
  amount: number;
  issued_at?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  category?: string | null;
  method?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  financial_account_id?: number | null;
  financial_account?: { id: number; name: string; type: FinancialAccount['type'] } | null;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiMetrics {
  income: number;
  expenses: number;
  result: number;
  pending: number;
  consolidated_balance: number;
  cash_balance: number;
  bank_balance: number;
  accounts_count: number;
}

function queryString(params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : '';
}

function mapMeta(meta: ApiList<unknown>['meta']): FinancialListMeta {
  return {
    currentPage: meta.current_page,
    lastPage: meta.last_page,
    perPage: meta.per_page,
    total: meta.total,
  };
}

function mapAccount(account: ApiAccount): FinancialAccount {
  return {
    id: String(account.id),
    name: account.name,
    type: account.type,
    bankName: account.bank_name,
    agency: account.agency,
    accountNumber: account.account_number,
    pixKey: account.pix_key,
    initialBalance: Number(account.initial_balance),
    currentBalance: Number(account.current_balance),
    active: Boolean(account.active),
    metadata: account.metadata ?? {},
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  };
}

function mapTransaction(transaction: ApiTransaction): FinancialTransaction {
  return {
    id: String(transaction.id),
    description: transaction.description,
    type: transaction.type,
    status: transaction.status,
    amount: Number(transaction.amount),
    issuedAt: transaction.issued_at,
    dueDate: transaction.due_date,
    paidAt: transaction.paid_at,
    category: transaction.category,
    method: transaction.method,
    referenceType: transaction.reference_type,
    referenceId: transaction.reference_id ? String(transaction.reference_id) : null,
    financialAccountId: transaction.financial_account_id ? String(transaction.financial_account_id) : null,
    financialAccount: transaction.financial_account ? {
      id: String(transaction.financial_account.id),
      name: transaction.financial_account.name,
      type: transaction.financial_account.type,
    } : null,
    metadata: transaction.metadata ?? {},
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  };
}

export const financialService = {
  metrics: async (): Promise<FinancialMetrics> => {
    const data = await apiClient.get<ApiMetrics>('/api/company/financial/metrics');
    return {
      income: Number(data.income),
      expenses: Number(data.expenses),
      result: Number(data.result),
      pending: Number(data.pending),
      consolidatedBalance: Number(data.consolidated_balance),
      cashBalance: Number(data.cash_balance),
      bankBalance: Number(data.bank_balance),
      accountsCount: Number(data.accounts_count),
    };
  },

  listTransactions: async (filters: Record<string, string | number | undefined> = {}) => {
    const response = await apiClient.get<ApiList<ApiTransaction>>(
      `/api/company/financial/transactions${queryString({ per_page: 100, ...filters })}`,
    );
    return { data: response.data.map(mapTransaction), meta: mapMeta(response.meta) };
  },
  createTransaction: async (payload: FinancialTransactionPayload) =>
    mapTransaction((await apiClient.post<ApiItem<ApiTransaction>>('/api/company/financial/transactions', payload)).data),
  updateTransaction: async (id: string, payload: FinancialTransactionPayload) =>
    mapTransaction((await apiClient.put<ApiItem<ApiTransaction>>(`/api/company/financial/transactions/${id}`, payload)).data),
  deleteTransaction: (id: string) =>
    apiClient.delete<void>(`/api/company/financial/transactions/${id}`),
  payTransaction: async (id: string, financialAccountId: string) =>
    mapTransaction((await apiClient.patch<ApiItem<ApiTransaction>>(`/api/company/financial/transactions/${id}/pay`, {
      financial_account_id: Number(financialAccountId),
    })).data),

  listAccounts: async (filters: Record<string, string | number | boolean | undefined> = {}) => {
    const response = await apiClient.get<ApiList<ApiAccount>>(
      `/api/company/financial/accounts${queryString({ per_page: 100, ...filters })}`,
    );
    return { data: response.data.map(mapAccount), meta: mapMeta(response.meta) };
  },
  accountOptions: async (): Promise<FinancialAccountOption[]> =>
    (await apiClient.get<Array<{ id: number; label: string }>>('/api/company/financial/accounts/options'))
      .map(option => ({ id: String(option.id), label: option.label })),
  createAccount: async (payload: FinancialAccountPayload) =>
    mapAccount((await apiClient.post<ApiItem<ApiAccount>>('/api/company/financial/accounts', payload)).data),
  updateAccount: async (id: string, payload: FinancialAccountPayload) =>
    mapAccount((await apiClient.put<ApiItem<ApiAccount>>(`/api/company/financial/accounts/${id}`, payload)).data),
  deleteAccount: (id: string) =>
    apiClient.delete<void>(`/api/company/financial/accounts/${id}`),
};
