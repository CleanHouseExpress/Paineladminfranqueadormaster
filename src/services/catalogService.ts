import { apiClient } from './apiClient';
import {
  CATALOG_TYPE_CONFIG,
  DEFAULT_CATALOG_LABELS,
  DEFAULT_CATALOG_METADATA_SCHEMA,
} from '../types/catalog';
import type {
  CatalogItem,
  CatalogApprovalStatus,
  CatalogItemStatus,
  CatalogItemType,
  CatalogGovernanceSettings,
  CatalogLabels,
  CatalogMetadataConfig,
  CatalogMetadataField,
  CatalogStats,
} from '../types/catalog';

interface ApiItem<T> { data: T }
interface ApiList<T> { data: T[] }

interface ApiCatalogItem {
  id: number | string;
  name: string;
  description?: string | null;
  item_type: CatalogItemType;
  status: CatalogItemStatus;
  scope?: 'corporate' | 'local' | null;
  owner_unit_id?: number | string | null;
  owner_unit_name?: string | null;
  approval_status?: CatalogApprovalStatus | null;
  origin?: 'corporate' | 'local' | 'promoted' | null;
  rejection_reason?: string | null;
  promoted_from_item_id?: number | string | null;
  base_price?: number | null;
  sku?: string | null;
  unit_of_measure?: string | null;
  metadata?: Record<string, unknown> | CatalogMetadataField[] | null;
  product_detail?: Record<string, unknown> | null;
  service_detail?: Record<string, unknown> | null;
  subscription_detail?: Record<string, unknown> | null;
  course_detail?: Record<string, unknown> | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiMetrics {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  local_items?: number;
  pending_approvals?: number;
  rejected_items?: number;
  promoted_items?: number;
  unit_price_overrides?: number;
  average_price: number;
}

interface ApiMetadataField {
  key: string;
  label: string;
  field_type?: CatalogMetadataField['type'];
  type?: CatalogMetadataField['type'];
  required?: boolean;
  visible?: boolean;
  editable?: boolean;
  order?: number;
  section?: string;
  options?: Array<{ label: string; value: string }> | string[];
}

interface ApiMetadata {
  singular_label: string;
  plural_label: string;
  description?: string;
  form_schema: ApiMetadataField[];
  table_schema: CatalogMetadataConfig['tableSchema'];
  settings?: {
    module_title?: string;
    new_item_label?: string;
    enabled_types?: CatalogItemType[];
  };
  active?: boolean;
}

export interface CatalogFilters {
  status?: CatalogItemStatus | '';
  type?: CatalogItemType | '';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sku?: string;
  scope?: 'corporate' | 'local' | '';
  approvalStatus?: CatalogApprovalStatus | '';
  ownerUnitId?: string;
}

const BASIC_FIELDS = new Set([
  'name', 'description', 'item_type', 'status', 'base_price',
  'sku', 'unit_of_measure', 'metadata', 'created_at',
]);

function normalizedOptions(value?: ApiMetadataField['options']) {
  return (value ?? []).map(option => typeof option === 'string'
    ? { label: option, value: option }
    : option);
}

function metadataFields(value: ApiCatalogItem['metadata']): CatalogMetadataField[] {
  if (Array.isArray(value)) return value;
  return Object.entries(value ?? {}).map(([key, fieldValue]) => ({
    key,
    label: key.replaceAll('_', ' '),
    type: 'text',
    value: fieldValue,
  }));
}

function typeFields(api: ApiCatalogItem): Record<string, unknown> {
  if (api.item_type === 'product') {
    const detail = api.product_detail ?? {};
    return {
      controlaEstoque: detail.track_stock,
      estoqueMinimo: detail.min_stock,
      custo: detail.cost_price,
      codigoBarras: detail.barcode,
      pesoGramas: detail.weight,
      dimensoes: typeof detail.dimensions === 'string'
        ? detail.dimensions
        : (detail.dimensions as { value?: string } | null)?.value ?? '',
    };
  }
  if (api.item_type === 'service' || api.item_type === 'procedure') {
    const detail = api.service_detail ?? {};
    return {
      duracaoMinutos: detail.duration_minutes,
      exigeProfissional: detail.requires_professional,
      exigeAgenda: detail.requires_schedule,
    };
  }
  if (api.item_type === 'subscription' || api.item_type === 'plan') {
    const detail = api.subscription_detail ?? {};
    const cycles: Record<string, string> = {
      monthly: 'mensal', quarterly: 'trimestral', semiannual: 'semestral', annual: 'anual',
    };
    return {
      cicloCobranca: cycles[String(detail.billing_cycle)] ?? detail.billing_cycle,
      intervaloRecorrencia: detail.recurrence_interval,
      periodoTeste: detail.trial_days,
    };
  }
  if (api.item_type === 'course') {
    const detail = api.course_detail ?? {};
    return {
      cargaHoraria: detail.duration_hours,
      certificadoDisponivel: detail.certificate_available,
      treinamentoRelacionadoId: detail.training_id ? String(detail.training_id) : undefined,
      treinamentoRelacionadoNome: (detail.training as { title?: string } | undefined)?.title,
    };
  }
  return {};
}

function toItem(api: ApiCatalogItem): CatalogItem {
  const createdAt = api.created_at ?? new Date().toISOString();
  return {
    id: String(api.id),
    name: api.name,
    description: api.description ?? undefined,
    type: api.item_type,
    status: api.status,
    scope: api.scope ?? 'corporate',
    ownerUnitId: api.owner_unit_id ?? null,
    ownerUnitName: api.owner_unit_name ?? null,
    approvalStatus: api.approval_status ?? 'approved',
    origin: api.origin ?? 'corporate',
    rejectionReason: api.rejection_reason ?? null,
    promotedFromItemId: api.promoted_from_item_id ?? null,
    price: Number(api.base_price ?? 0),
    sku: api.sku ?? undefined,
    unit: api.unit_of_measure ?? undefined,
    typeFields: typeFields(api),
    metadata: metadataFields(api.metadata),
    createdBy: api.created_by ? `Usuario ${api.created_by}` : 'Sistema',
    createdByAvatar: api.created_by ? `U${api.created_by}` : 'SI',
    updatedBy: api.updated_by ? `Usuario ${api.updated_by}` : undefined,
    createdAt,
    updatedAt: api.updated_at ?? createdAt,
  };
}

function billingCycle(value: unknown) {
  const cycles: Record<string, string> = {
    mensal: 'monthly', trimestral: 'quarterly', semestral: 'semiannual', anual: 'annual',
  };
  return cycles[String(value)] ?? value;
}

function toPayload(data: Partial<CatalogItem>) {
  const fields = data.typeFields ?? {};
  const payload: Record<string, unknown> = {
    name: data.name,
    description: data.description ?? null,
    item_type: data.type,
    status: data.status,
    base_price: Number(data.price ?? 0),
    sku: data.sku || null,
    unit_of_measure: data.unit || null,
    metadata: Object.fromEntries((data.metadata ?? []).map(field => [field.key, field.value])),
  };

  if (data.type === 'product') payload.product_detail = {
    track_stock: Boolean(fields.controlaEstoque),
    min_stock: fields.estoqueMinimo || null,
    cost_price: fields.custo || null,
    barcode: fields.codigoBarras || null,
    weight: fields.pesoGramas || null,
    dimensions: fields.dimensoes ? { value: fields.dimensoes } : null,
  };
  if (data.type === 'service' || data.type === 'procedure') payload.service_detail = {
    duration_minutes: fields.duracaoMinutos || null,
    requires_professional: Boolean(fields.exigeProfissional),
    requires_schedule: Boolean(fields.exigeAgenda),
  };
  if (data.type === 'subscription' || data.type === 'plan') payload.subscription_detail = {
    billing_cycle: billingCycle(fields.cicloCobranca) || null,
    recurrence_interval: fields.intervaloRecorrencia || null,
    trial_days: fields.periodoTeste || null,
  };
  if (data.type === 'course') payload.course_detail = {
    duration_hours: fields.cargaHoraria || null,
    certificate_available: Boolean(fields.certificadoDisponivel),
    training_id: fields.treinamentoRelacionadoId ? Number(fields.treinamentoRelacionadoId) : null,
  };
  return payload;
}

function queryString(filters?: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('item_type', filters.type);
  if (filters?.scope) params.set('scope', filters.scope);
  if (filters?.approvalStatus) params.set('approval_status', filters.approvalStatus);
  if (filters?.ownerUnitId) params.set('owner_unit_id', filters.ownerUnitId);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.minPrice !== undefined) params.set('min_price', String(filters.minPrice));
  if (filters?.maxPrice !== undefined) params.set('max_price', String(filters.maxPrice));
  if (filters?.sku) params.set('sku', filters.sku);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getItems(filters?: CatalogFilters) {
  const response = await apiClient.get<ApiList<ApiCatalogItem>>(`/api/company/catalog/items${queryString(filters)}`);
  return response.data.map(toItem);
}

export async function getItem(id: string) {
  try {
    const response = await apiClient.get<ApiItem<ApiCatalogItem>>(`/api/company/catalog/items/${id}`);
    return toItem(response.data);
  } catch {
    return null;
  }
}

export async function createItem(data: Partial<CatalogItem>) {
  const response = await apiClient.post<ApiItem<ApiCatalogItem>>('/api/company/catalog/items', toPayload(data));
  return toItem(response.data);
}

export async function updateItem(id: string, data: Partial<CatalogItem>) {
  const response = await apiClient.put<ApiItem<ApiCatalogItem>>(`/api/company/catalog/items/${id}`, toPayload(data));
  return toItem(response.data);
}

export async function archiveItem(id: string) {
  const response = await apiClient.patch<ApiItem<ApiCatalogItem>>(`/api/company/catalog/items/${id}/archive`, {});
  return toItem(response.data);
}

export async function reactivateItem(id: string) {
  const response = await apiClient.patch<ApiItem<ApiCatalogItem>>(`/api/company/catalog/items/${id}/reactivate`, {});
  return toItem(response.data);
}

export async function deleteItem(id: string) {
  await apiClient.delete<void>(`/api/company/catalog/items/${id}`);
}

export async function getStats(): Promise<CatalogStats> {
  const [metrics, items] = await Promise.all([
    apiClient.get<ApiMetrics>('/api/company/catalog/items/metrics'),
    getItems(),
  ]);
  return {
    total: metrics.total,
    active: metrics.active,
    inactive: metrics.inactive,
    archived: metrics.archived,
    avgPrice: metrics.average_price,
    localItems: metrics.local_items ?? 0,
    pendingApprovals: metrics.pending_approvals ?? 0,
    rejectedItems: metrics.rejected_items ?? 0,
    promotedItems: metrics.promoted_items ?? 0,
    unitPriceOverrides: metrics.unit_price_overrides ?? 0,
    byType: (Object.keys(CATALOG_TYPE_CONFIG) as CatalogItemType[]).map(type => ({
      type,
      count: items.filter(item => item.type === type).length,
      label: CATALOG_TYPE_CONFIG[type].label,
      color: CATALOG_TYPE_CONFIG[type].color,
    })),
    recentItems: items.slice(0, 5),
  };
}

export async function getCatalogConfig(): Promise<CatalogMetadataConfig> {
  const response = await apiClient.get<ApiItem<ApiMetadata>>('/api/metadata/catalog_items');
  const metadata = response.data;
  const settings = metadata.settings ?? {};
  const customFields = metadata.form_schema.filter(field => !BASIC_FIELDS.has(field.key));
  const source = customFields.length ? customFields : DEFAULT_CATALOG_METADATA_SCHEMA;
  return {
    labels: {
      singular: metadata.singular_label || DEFAULT_CATALOG_LABELS.singular,
      plural: metadata.plural_label || DEFAULT_CATALOG_LABELS.plural,
      newItem: settings.new_item_label || `Novo ${metadata.singular_label || DEFAULT_CATALOG_LABELS.singular}`,
      moduleTitle: settings.module_title || DEFAULT_CATALOG_LABELS.moduleTitle,
    },
    formSchema: source.map((field, index) => ({
      key: field.key,
      label: field.label,
      type: field.type ?? ('field_type' in field ? field.field_type : undefined) ?? 'text',
      required: 'required' in field ? Boolean(field.required) : false,
      visible: 'visible' in field ? field.visible !== false : true,
      editable: 'editable' in field ? field.editable !== false : true,
      order: 'order' in field ? Number(field.order ?? index + 1) : index + 1,
      section: 'section' in field ? field.section : 'custom',
      options: normalizedOptions(field.options),
    })),
    tableSchema: metadata.table_schema ?? [],
    enabledTypes: settings.enabled_types ?? (Object.keys(CATALOG_TYPE_CONFIG) as CatalogItemType[]),
    description: metadata.description,
    active: metadata.active !== false,
  };
}

export async function saveCatalogConfig(config: CatalogMetadataConfig) {
  const current = await apiClient.get<ApiItem<ApiMetadata>>('/api/metadata/catalog_items');
  await apiClient.put('/api/metadata/catalog_items', {
    singular_label: config.labels.singular,
    plural_label: config.labels.plural,
    description: config.description ?? current.data.description ?? '',
    form_schema: [
      ...current.data.form_schema.filter(field => BASIC_FIELDS.has(field.key)),
      ...config.formSchema.map(field => ({ ...field, field_type: field.type })),
    ],
    table_schema: config.tableSchema,
    settings: {
      module_title: config.labels.moduleTitle,
      new_item_label: config.labels.newItem,
      enabled_types: config.enabledTypes,
    },
    active: config.active,
  });
  return getCatalogConfig();
}

export async function getLabels(): Promise<CatalogLabels> {
  return (await getCatalogConfig()).labels;
}

export async function getCatalogGovernanceSettings(): Promise<CatalogGovernanceSettings> {
  const response = await apiClient.get<ApiItem<CatalogGovernanceSettings>>('/api/company/catalog/settings');
  return response.data;
}

export async function saveCatalogGovernanceSettings(payload: Partial<CatalogGovernanceSettings>): Promise<CatalogGovernanceSettings> {
  const response = await apiClient.put<ApiItem<CatalogGovernanceSettings>>('/api/company/catalog/settings', payload);
  return response.data;
}

export async function approveCatalogItem(id: string) {
  const response = await apiClient.patch<ApiItem<ApiCatalogItem>>(`/api/company/catalog/items/${id}/approve`, {});
  return toItem(response.data);
}

export async function rejectCatalogItem(id: string, rejectionReason: string) {
  const response = await apiClient.patch<ApiItem<ApiCatalogItem>>(`/api/company/catalog/items/${id}/reject`, { rejection_reason: rejectionReason });
  return toItem(response.data);
}

export async function promoteCatalogItem(id: string) {
  const response = await apiClient.patch<ApiItem<ApiCatalogItem>>(`/api/company/catalog/items/${id}/promote`, {});
  return toItem(response.data);
}
