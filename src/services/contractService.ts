import { apiClient, apiClientConfig } from './apiClient';
import type {
  Contract,
  ContractDocument,
  ContractHistoryEntry,
  ContractStats,
  ContractStatus,
} from '../types/contract';

export interface ContractFilters {
  status?: ContractStatus | '';
  clientId?: string;
  customerId?: string;
  unitId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface ApiList<T> {
  data: T[];
}

interface ApiItem<T> {
  data: T;
}

interface ApiContract {
  id: number | string;
  customer_id?: number | string | null;
  customer_name?: string | null;
  unit_id?: number | string | null;
  unit_name?: string | null;
  document_id?: number | string | null;
  document_name?: string | null;
  document_url?: string | null;
  title: string;
  contract_number?: string | null;
  status: ContractStatus;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiMetrics {
  total: number;
  active: number;
  draft: number;
  expired: number;
  cancelled: number;
}

interface ApiOption {
  value: number | string;
  label: string;
}

function initials(name?: string | null) {
  const words = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (words[0]?.[0] ?? 'C') + (words[1]?.[0] ?? words[0]?.[1] ?? 'T');
}

function daysRemaining(endDate?: string | null) {
  if (!endDate) return undefined;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return undefined;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function absoluteApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiClientConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function toDocument(api: ApiContract): ContractDocument | undefined {
  if (!api.document_id) return undefined;

  const name = api.document_name ?? 'Documento do contrato';
  const ext = name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';

  return {
    id: String(api.document_id),
    name,
    fileType: ext,
    fileSize: 0,
    fileSizeFormatted: 'Arquivo vinculado',
    uploadedAt: api.created_at ?? new Date().toISOString(),
  };
}

function toContract(api: ApiContract): Contract {
  const remaining = daysRemaining(api.end_date);
  const clientName = api.customer_name ?? 'Cliente';
  const createdAt = api.created_at ?? new Date().toISOString();
  const updatedAt = api.updated_at ?? createdAt;

  return {
    id: String(api.id),
    title: api.title,
    number: api.contract_number || `CTR-${api.id}`,
    clientId: String(api.customer_id ?? ''),
    clientName,
    clientAvatar: initials(clientName).toUpperCase(),
    unitId: api.unit_id ? String(api.unit_id) : undefined,
    unitName: api.unit_name ?? undefined,
    unitCode: api.unit_id ? `UN-${api.unit_id}` : undefined,
    documentId: api.document_id ? String(api.document_id) : undefined,
    document: toDocument(api),
    status: api.status,
    startDate: api.start_date ?? '',
    endDate: api.end_date ?? '',
    notes: api.notes ?? undefined,
    createdBy: 'Sistema',
    createdByAvatar: 'SI',
    createdAt,
    updatedAt,
    daysRemaining: remaining,
    isExpiringSoon: api.status === 'active' && remaining !== undefined && remaining >= 0 && remaining <= 60,
  };
}

function toPayload(data: Partial<Contract>) {
  return {
    title: data.title,
    contract_number: data.number,
    customer_id: data.clientId ? Number(data.clientId) : undefined,
    unit_id: data.unitId ? Number(data.unitId) : null,
    document_id: data.documentId ? Number(data.documentId) : null,
    status: data.status,
    start_date: data.startDate,
    end_date: data.endDate || null,
    notes: data.notes ?? null,
  };
}

function queryString(filters?: ContractFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.clientId || filters?.customerId) params.set('customer_id', filters.clientId || filters.customerId || '');
  if (filters?.unitId) params.set('unit_id', filters.unitId);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getContracts(filters?: ContractFilters): Promise<Contract[]> {
  const response = await apiClient.get<ApiList<ApiContract>>(`/api/company/contracts${queryString(filters)}`);
  return response.data.map(toContract);
}

export async function getContract(id: string): Promise<Contract | null> {
  try {
    const response = await apiClient.get<ApiItem<ApiContract>>(`/api/company/contracts/${id}`);
    return toContract(response.data);
  } catch {
    return null;
  }
}

export async function createContract(data: Partial<Contract>): Promise<Contract> {
  const response = await apiClient.post<ApiItem<ApiContract>>('/api/company/contracts', toPayload(data));
  return toContract(response.data);
}

export async function updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
  const response = await apiClient.put<ApiItem<ApiContract>>(`/api/company/contracts/${id}`, toPayload(data));
  return toContract(response.data);
}

export async function deleteContract(id: string): Promise<void> {
  await apiClient.delete<void>(`/api/company/contracts/${id}`);
}

export async function activateContract(id: string): Promise<Contract> {
  const response = await apiClient.patch<ApiItem<ApiContract>>(`/api/company/contracts/${id}/activate`, {});
  return toContract(response.data);
}

export async function cancelContract(id: string): Promise<Contract> {
  const response = await apiClient.patch<ApiItem<ApiContract>>(`/api/company/contracts/${id}/cancel`, {});
  return toContract(response.data);
}

export async function getStats(): Promise<ContractStats> {
  const metrics = await apiClient.get<ApiMetrics>('/api/company/contracts/metrics');
  const contracts = await getContracts();
  const expiringContracts = contracts.filter(contract => contract.isExpiringSoon);

  return {
    ...metrics,
    expiringSoon: expiringContracts.length,
    recentContracts: contracts.slice(0, 5),
    expiringContracts,
  };
}

export async function getHistory(contractId: string): Promise<ContractHistoryEntry[]> {
  const contract = await getContract(contractId);
  if (!contract) return [];

  return [
    {
      id: `${contractId}-created`,
      contractId,
      action: 'created',
      user: contract.createdBy,
      userAvatar: contract.createdByAvatar,
      description: `Contrato ${contract.number} criado no sistema.`,
      timestamp: contract.createdAt,
    },
    {
      id: `${contractId}-updated`,
      contractId,
      action: 'updated',
      user: 'Sistema',
      userAvatar: 'SI',
      description: 'Dados do contrato sincronizados com a API.',
      timestamp: contract.updatedAt,
    },
  ];
}

export async function getCustomerOptions(): Promise<ApiOption[]> {
  return apiClient.get<ApiOption[]>('/api/company/customers/options');
}

export async function getUnitOptions(): Promise<ApiOption[]> {
  return apiClient.get<ApiOption[]>('/api/company/units/options');
}

export async function getDocumentOptions(): Promise<ApiOption[]> {
  return apiClient.get<ApiOption[]>('/api/company/documents/options');
}

export function documentDownloadUrl(contract: Contract): string | null {
  return contract.documentId
    ? absoluteApiUrl(`/api/company/documents/${contract.documentId}/download`)
    : null;
}
