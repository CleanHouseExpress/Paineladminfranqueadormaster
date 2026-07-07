import { apiClient, apiClientConfig, ApiError, AUTH_TOKEN_STORAGE_KEY } from './apiClient';
import type {
  Document,
  DocumentCategory,
  DocumentStats,
  DocumentStatus,
  DocumentVisibility,
  DocumentFileType,
} from '../types/document';

interface ApiList<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface ApiItem<T> {
  data: T;
}

interface ApiOption {
  value: number | string;
  label: string;
}

interface ApiDocument {
  id: number | string;
  title: string;
  description?: string | null;
  category_id?: number | string | null;
  category_name?: string | null;
  file_name?: string | null;
  file_size?: number | string | null;
  mime_type?: string | null;
  extension?: string | null;
  visibility?: string | null;
  unit_id?: number | string | null;
  unit_name?: string | null;
  customer_id?: number | string | null;
  customer_name?: string | null;
  user_id?: number | string | null;
  user_name?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiCategory {
  id: number | string;
  name: string;
  description?: string | null;
  parent_id?: number | string | null;
  parent_name?: string | null;
  active?: boolean | number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DocumentFilters {
  status?: DocumentStatus | '';
  categoryId?: string;
  visibility?: DocumentVisibility | '';
  fileType?: DocumentFileType | '';
  search?: string;
  unitId?: string;
  customerId?: string;
  userId?: string;
  perPage?: number;
}

export interface DocumentPayload {
  title: string;
  description?: string;
  categoryId?: string;
  visibility?: DocumentVisibility;
  unitId?: string;
  customerId?: string;
  userId?: string;
  file?: File | null;
}

export interface DocumentCategoryPayload {
  name: string;
  description?: string;
  parentId?: string;
  active?: boolean;
}

const visibilityToApi: Record<DocumentVisibility, string> = {
  interno: 'internal',
  portal_cliente: 'customer_portal',
  portal_franqueado: 'franchisee_portal',
  publico: 'public',
};

const visibilityFromApi: Record<string, DocumentVisibility> = {
  internal: 'interno',
  customer_portal: 'portal_cliente',
  franchisee_portal: 'portal_franqueado',
  public: 'publico',
};

const statusToApi: Partial<Record<DocumentStatus, string>> = {
  ativo: 'active',
  arquivado: 'archived',
};

const statusFromApi: Record<string, DocumentStatus> = {
  active: 'ativo',
  archived: 'arquivado',
  deleted: 'arquivado',
};

const categoryColors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#EF4444', '#64748B'];

function hashColor(id: string) {
  const sum = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return categoryColors[sum % categoryColors.length];
}

function fileTypeFromExtension(extension?: string | null, mimeType?: string | null): DocumentFileType {
  const ext = String(extension || '').toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'docx';
  if (ext === 'xls' || ext === 'xlsx') return 'xlsx';
  if (ext === 'png' || mimeType === 'image/png') return 'png';
  if (ext === 'jpg' || ext === 'jpeg' || mimeType === 'image/jpeg') return 'jpg';
  return 'other';
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Arquivo';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name?: string | null) {
  const words = String(name || 'Sistema').trim().split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] ?? 'S'}${words[1]?.[0] ?? words[0]?.[1] ?? 'I'}`.toUpperCase();
}

function valueOrUndefined(value?: number | string | null) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function queryString(filters?: DocumentFilters) {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.categoryId) params.set('category_id', filters.categoryId);
  if (filters?.visibility) params.set('visibility', visibilityToApi[filters.visibility]);
  if (filters?.status && statusToApi[filters.status]) params.set('status', statusToApi[filters.status]!);
  if (filters?.unitId) params.set('unit_id', filters.unitId);
  if (filters?.customerId) params.set('customer_id', filters.customerId);
  if (filters?.userId) params.set('user_id', filters.userId);
  if (filters?.perPage) params.set('per_page', String(filters.perPage));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function dataOf<T>(payload: T | ApiItem<T>) {
  return payload && typeof payload === 'object' && 'data' in payload ? (payload as ApiItem<T>).data : payload as T;
}

function toCategory(api: ApiCategory, documentCount = 0): DocumentCategory {
  const id = String(api.id);
  const now = new Date().toISOString();
  return {
    id,
    name: api.name,
    description: api.description ?? undefined,
    parentId: valueOrUndefined(api.parent_id),
    parentName: api.parent_name ?? undefined,
    color: hashColor(id),
    icon: 'FolderOpen',
    active: Boolean(api.active ?? true),
    documentCount,
    createdAt: api.created_at ?? now,
    updatedAt: api.updated_at ?? api.created_at ?? now,
  };
}

function toDocument(api: ApiDocument, categories: DocumentCategory[] = []): Document {
  const categoryId = valueOrUndefined(api.category_id) ?? '';
  const category = categories.find(item => item.id === categoryId);
  const createdAt = api.created_at ?? new Date().toISOString();
  const updatedAt = api.updated_at ?? createdAt;
  const fileSize = Number(api.file_size ?? 0);
  const fileName = api.file_name ?? api.title;
  const fileType = fileTypeFromExtension(api.extension, api.mime_type);
  const userName = api.user_name ?? 'Sistema';

  return {
    id: String(api.id),
    title: api.title,
    description: api.description ?? undefined,
    categoryId,
    categoryName: api.category_name ?? category?.name ?? 'Sem categoria',
    categoryColor: category?.color ?? (categoryId ? hashColor(categoryId) : '#64748B'),
    visibility: visibilityFromApi[String(api.visibility ?? 'internal')] ?? 'interno',
    status: statusFromApi[String(api.status ?? 'active')] ?? 'ativo',
    fileType,
    fileName,
    fileSize,
    fileSizeFormatted: formatFileSize(fileSize),
    unitId: valueOrUndefined(api.unit_id),
    unitName: api.unit_name ?? undefined,
    clientId: valueOrUndefined(api.customer_id),
    clientName: api.customer_name ?? undefined,
    userId: valueOrUndefined(api.user_id),
    userName: api.user_name ?? undefined,
    createdBy: userName,
    createdByAvatar: initials(userName),
    createdAt,
    updatedAt,
    downloadCount: 0,
    tags: [],
  };
}

function toCategoryPayload(data: DocumentCategoryPayload) {
  return {
    name: data.name,
    description: data.description || null,
    parent_id: data.parentId ? Number(data.parentId) : null,
    active: data.active ?? true,
  };
}

function appendOptional(form: FormData, key: string, value?: string | null) {
  if (value !== undefined && value !== null && value !== '' && value !== 'all') form.append(key, value);
}

function toDocumentPayload(data: DocumentPayload, requireFile: boolean) {
  const form = new FormData();
  form.append('title', data.title);
  appendOptional(form, 'description', data.description ?? '');
  appendOptional(form, 'category_id', data.categoryId);
  appendOptional(form, 'visibility', data.visibility ? visibilityToApi[data.visibility] : undefined);
  appendOptional(form, 'unit_id', data.unitId);
  appendOptional(form, 'customer_id', data.customerId);
  appendOptional(form, 'user_id', data.userId);
  if (data.file) form.append('file', data.file);
  if (requireFile && !data.file) throw new Error('Selecione um arquivo para enviar.');
  return form;
}

function absoluteApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiClientConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function loadCategoryMap() {
  const categories = await getCategories().catch(() => []);
  return categories;
}

export async function getDocuments(filters?: DocumentFilters): Promise<Document[]> {
  const [categories, response] = await Promise.all([
    loadCategoryMap(),
    apiClient.get<ApiList<ApiDocument>>(`/api/company/documents${queryString({ ...filters, perPage: filters?.perPage ?? 100 })}`),
  ]);
  const documents = response.data.map(item => toDocument(item, categories));
  return filters?.fileType ? documents.filter(item => item.fileType === filters.fileType) : documents;
}

export async function getDocument(id: string): Promise<Document | null> {
  try {
    const [categories, response] = await Promise.all([
      loadCategoryMap(),
      apiClient.get<ApiItem<ApiDocument>>(`/api/company/documents/${id}`),
    ]);
    return toDocument(response.data, categories);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createDocument(data: DocumentPayload): Promise<Document> {
  const [categories, response] = await Promise.all([
    loadCategoryMap(),
    apiClient.post<ApiItem<ApiDocument>>('/api/company/documents', toDocumentPayload(data, true)),
  ]);
  return toDocument(response.data, categories);
}

export async function updateDocument(id: string, data: DocumentPayload): Promise<Document> {
  const payload = {
    title: data.title,
    description: data.description || null,
    category_id: data.categoryId ? Number(data.categoryId) : null,
    visibility: data.visibility ? visibilityToApi[data.visibility] : undefined,
    unit_id: data.unitId ? Number(data.unitId) : null,
    customer_id: data.customerId ? Number(data.customerId) : null,
    user_id: data.userId ? Number(data.userId) : null,
  };
  const [categories, response] = await Promise.all([
    loadCategoryMap(),
    apiClient.put<ApiItem<ApiDocument>>(`/api/company/documents/${id}`, payload),
  ]);
  return toDocument(response.data, categories);
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete<void>(`/api/company/documents/${id}`);
}

export async function archiveDocument(id: string): Promise<Document> {
  const [categories, response] = await Promise.all([
    loadCategoryMap(),
    apiClient.patch<ApiItem<ApiDocument>>(`/api/company/documents/${id}/archive`, {}),
  ]);
  return toDocument(response.data, categories);
}

export async function getCategories(): Promise<DocumentCategory[]> {
  const [categoryResponse, documentResponse] = await Promise.all([
    apiClient.get<ApiList<ApiCategory>>('/api/company/documents/categories?per_page=100'),
    apiClient.get<ApiList<ApiDocument>>('/api/company/documents?per_page=100').catch(() => ({ data: [] } as ApiList<ApiDocument>)),
  ]);
  const counts = new Map<string, number>();
  documentResponse.data.forEach(document => {
    const id = valueOrUndefined(document.category_id);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return categoryResponse.data.map(category => toCategory(category, counts.get(String(category.id)) ?? 0));
}

export async function getCategoryOptions(): Promise<ApiOption[]> {
  return apiClient.get<ApiOption[]>('/api/company/documents/categories/options');
}

export async function createCategory(data: DocumentCategoryPayload): Promise<DocumentCategory> {
  const response = await apiClient.post<ApiItem<ApiCategory>>('/api/company/documents/categories', toCategoryPayload(data));
  return toCategory(response.data);
}

export async function updateCategory(id: string, data: DocumentCategoryPayload): Promise<DocumentCategory> {
  const response = await apiClient.put<ApiItem<ApiCategory>>(`/api/company/documents/categories/${id}`, toCategoryPayload(data));
  return toCategory(response.data);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete<void>(`/api/company/documents/categories/${id}`);
}

export async function getStats(): Promise<DocumentStats> {
  const [documents, categories] = await Promise.all([getDocuments({ perPage: 100 }), getCategories()]);
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return {
    total: documents.length,
    active: documents.filter(document => document.status === 'ativo').length,
    categories: categories.length,
    downloadsLast30Days: 0,
    recentDocuments,
    topCategories: categories.map(category => ({
      id: category.id,
      name: category.name,
      count: documents.filter(document => document.categoryId === category.id).length,
      color: category.color,
    })),
  };
}

export function documentDownloadUrl(id: string) {
  return absoluteApiUrl(`/api/company/documents/${id}/download`);
}

export async function downloadDocument(id: string, filename?: string): Promise<void> {
  const response = await fetch(documentDownloadUrl(id), {
    method: 'GET',
    credentials: 'omit',
    headers: {
      Accept: '*/*',
      ...(getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}),
    },
  });

  if (!response.ok) {
    let data: unknown = null;
    try { data = await response.json(); } catch { data = await response.text().catch(() => null); }
    throw new ApiError(response.status, data, 'Falha ao baixar documento.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || `documento-${id}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const documentService = {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  archiveDocument,
  getCategories,
  getCategoryOptions,
  createCategory,
  updateCategory,
  deleteCategory,
  getStats,
  downloadDocument,
  documentDownloadUrl,
};
