import { apiClient } from './apiClient';
import { metadataService } from './metadataService';
import type {
  InventoryCategory,
  InventoryItem,
  InventoryMetadata,
  InventoryMetrics,
  InventoryMovement,
  InventoryOption,
  InventoryPayload,
  InventorySupplier,
  StockBalance,
  StockLocation,
  MovementType,
  InventorySettings, InventoryTransfer, InventoryCount, InventoryCapabilities,
} from '../types/inventory';

interface DataResponse<T> { data: T }
interface ListResponse<T> { data: T[]; meta?: Record<string, number> }

interface ApiItem {
  id: number | string;
  catalog_item_id?: number | string | null;
  item_kind?: string | null;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  unit_of_measure: string;
  category_id?: number | string | null;
  category?: { id: number | string; name: string } | null;
  supplier_id?: number | string | null;
  supplier?: { id: number | string; name: string } | null;
  active: boolean;
  track_inventory: boolean;
  minimum_stock: number | string;
  current_stock: number | string;
  average_cost: number | string;
  metadata?: Record<string, unknown> | null;
  unit_balances?: Array<{
    unit_id: number | string;
    unit_name?: string | null;
    current_stock: number | string;
    average_cost: number | string;
  }>;
  stock_balances?: Array<{
    stock_location_id?: number | string | null;
    location_name?: string | null;
    on_hand: number | string;
    reserved: number | string;
    blocked: number | string;
    available: number | string;
    average_cost: number | string;
  }>;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiCategory {
  id: number | string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiSupplier {
  id: number | string;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_name?: string | null;
  active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiMovement {
  id: number | string;
  number?: string;
  status?: string;
  inventory_item_id?: number | string;
  item?: { id: number | string; name: string; unit_of_measure?: string } | null;
  unit_id?: number | string | null;
  unit?: { id: number | string; name: string } | null;
  source_location_id?: number | string | null;
  source_location?: { id: number | string; name: string; code?: string } | null;
  destination_location_id?: number | string | null;
  destination_location?: { id: number | string; name: string; code?: string } | null;
  movement_type: MovementType;
  quantity?: number | string;
  unit_cost?: number | string | null;
  total_cost?: number | string | null;
  reference?: string | null;
  notes?: string | null;
  performed_by?: number | string | null;
  performed_by_name?: string | null;
  origin_type?: string | null;
  origin_id?: number | string | null;
  origin_field_key?: string | null;
  origin_reference?: string | null;
  source_type?: string | null;
  reason?: string | null;
  confirmed_at?: string | null;
  items?: Array<{
    inventory_item_id: number | string;
    item?: { id: number | string; name: string; unit_of_measure?: string } | null;
    quantity: number | string;
    unit_cost?: number | string | null;
    total_cost?: number | string | null;
  }>;
  created_at?: string | null;
}

interface ApiLocation {
  id: number | string;
  unit_id: number | string;
  unit?: { id: number | string; name: string } | null;
  name: string;
  code: string;
  type: string;
  is_default: boolean;
  active: boolean;
  metadata?: Record<string, unknown> | null;
}

interface ApiBalance {
  id: number | string;
  inventory_item_id: number | string;
  item?: { id: number | string; name: string; unit_of_measure?: string } | null;
  unit_id?: number | string | null;
  unit?: { id: number | string; name: string } | null;
  stock_location_id?: number | string | null;
  location?: { id: number | string; name: string; code?: string } | null;
  on_hand: number | string;
  reserved: number | string;
  blocked: number | string;
  available: number | string;
  average_cost: number | string;
}

interface ApiMetrics {
  items: number;
  active_items: number;
  low_stock: number;
  out_of_stock: number;
  suppliers: number;
  movements_today: number;
  inventory_value: number | string;
}

export interface InventoryItemFilters {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  active?: boolean | '';
  stockStatus?: 'low' | 'out' | '';
}

export interface InventoryMovementFilters {
  itemId?: string;
  unitId?: string;
  locationId?: string;
  type?: MovementType | '';
  dateFrom?: string;
  dateTo?: string;
}

export interface StockLocationFilters {
  unitId?: string;
  active?: boolean | '';
}

export interface StockBalanceFilters {
  itemId?: string;
  unitId?: string;
  locationId?: string;
  stockStatus?: 'low' | 'out' | 'available' | '';
}

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

function toItem(item: ApiItem): InventoryItem {
  const currentStock = Number(item.current_stock ?? item.stock_balances?.reduce((total, balance) => total + Number(balance.on_hand ?? 0), 0) ?? 0);
  const averageCost = Number(item.average_cost ?? 0);
  return {
    id: String(item.id),
    catalogItemId: item.catalog_item_id ? String(item.catalog_item_id) : null,
    itemKind: item.item_kind ?? 'internal_supply',
    name: item.name,
    description: item.description,
    sku: item.sku,
    barcode: item.barcode,
    unitOfMeasure: item.unit_of_measure,
    categoryId: item.category_id ? String(item.category_id) : null,
    categoryName: item.category?.name,
    supplierId: item.supplier_id ? String(item.supplier_id) : null,
    supplierName: item.supplier?.name,
    active: item.active,
    trackInventory: item.track_inventory,
    minimumStock: Number(item.minimum_stock ?? 0),
    currentStock,
    averageCost,
    totalValue: currentStock * averageCost,
    metadata: item.metadata ?? {},
    unitBalances: (item.unit_balances ?? []).map(balance => ({
      unitId: String(balance.unit_id),
      unitName: balance.unit_name,
      currentStock: Number(balance.current_stock ?? 0),
      averageCost: Number(balance.average_cost ?? 0),
    })),
    stockBalances: (item.stock_balances ?? []).map(balance => ({
      id: `${item.id}-${balance.stock_location_id ?? 'general'}`,
      itemId: String(item.id),
      itemName: item.name,
      locationId: balance.stock_location_id ? String(balance.stock_location_id) : null,
      locationName: balance.location_name,
      onHand: Number(balance.on_hand ?? 0),
      reserved: Number(balance.reserved ?? 0),
      blocked: Number(balance.blocked ?? 0),
      available: Number(balance.available ?? 0),
      averageCost: Number(balance.average_cost ?? 0),
    })),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function itemPayload(data: InventoryPayload) {
  return {
    catalog_item_id: data.catalog_item_id ?? data.catalogItemId ?? null,
    item_kind: data.item_kind ?? data.itemKind,
    name: data.name ?? data.inventory_name,
    inventory_name: data.inventory_name ?? data.name,
    description: data.description || null,
    sku: data.sku || null,
    internal_sku: data.internal_sku ?? data.sku ?? null,
    barcode: data.barcode || null,
    internal_barcode: data.internal_barcode ?? data.barcode ?? null,
    unit_of_measure: data.unit_of_measure ?? data.unitOfMeasure ?? data.base_uom,
    base_uom: data.base_uom ?? data.unit_of_measure ?? data.unitOfMeasure,
    stocking_uom: data.stocking_uom ?? data.base_uom ?? data.unit_of_measure ?? data.unitOfMeasure,
    category_id: data.category_id || data.categoryId || null,
    supplier_id: data.supplier_id || data.supplierId || null,
    active: data.active ?? true,
    track_inventory: data.track_inventory ?? data.trackInventory ?? true,
    minimum_stock: Number(data.minimum_stock ?? data.minimumStock ?? 0),
    metadata: data.metadata ?? {},
  };
}

function toCategory(category: ApiCategory): InventoryCategory {
  return {
    id: String(category.id),
    name: category.name,
    description: category.description,
    active: category.active,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
}

function toSupplier(supplier: ApiSupplier): InventorySupplier {
  return {
    id: String(supplier.id),
    name: supplier.name,
    document: supplier.document,
    phone: supplier.phone,
    email: supplier.email,
    contactName: supplier.contact_name,
    active: supplier.active,
    metadata: supplier.metadata ?? {},
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
  };
}

function toMovement(movement: ApiMovement): InventoryMovement {
  const firstItem = movement.items?.[0];
  const itemId = movement.inventory_item_id ?? firstItem?.inventory_item_id ?? '';
  const quantity = movement.quantity ?? firstItem?.quantity ?? 0;
  return {
    id: String(movement.id),
    number: movement.number,
    status: movement.status,
    itemId: String(itemId),
    itemName: movement.item?.name ?? firstItem?.item?.name ?? `Insumo ${itemId}`,
    itemUnit: movement.item?.unit_of_measure ?? firstItem?.item?.unit_of_measure,
    unitId: movement.unit_id ? String(movement.unit_id) : null,
    unitName: movement.unit?.name,
    sourceLocationId: movement.source_location_id ? String(movement.source_location_id) : null,
    sourceLocationName: movement.source_location?.name,
    destinationLocationId: movement.destination_location_id ? String(movement.destination_location_id) : null,
    destinationLocationName: movement.destination_location?.name,
    type: movement.movement_type,
    quantity: Number(quantity),
    unitCost: movement.unit_cost === null ? null : Number(movement.unit_cost ?? firstItem?.unit_cost ?? 0),
    totalCost: movement.total_cost === null ? null : Number(movement.total_cost ?? firstItem?.total_cost ?? 0),
    reference: movement.reference,
    notes: movement.notes,
    performedBy: movement.performed_by ? String(movement.performed_by) : null,
    performedByName: movement.performed_by_name,
    originType: movement.origin_type,
    originId: movement.origin_id ? String(movement.origin_id) : null,
    originFieldKey: movement.origin_field_key,
    originReference: movement.origin_reference,
    sourceType: movement.source_type,
    reason: movement.reason ?? movement.notes,
    operationId: (movement as ApiMovement & { operation_id?: string | null }).operation_id ?? null,
    idempotencyKey: (movement as ApiMovement & { idempotency_key?: string | null }).idempotency_key ?? null,
    metadata: (movement as ApiMovement & { metadata?: Record<string, unknown> | null }).metadata ?? {},
    items: (movement.items ?? []).map(item => ({
      itemId: String(item.inventory_item_id),
      itemName: item.item?.name ?? `Insumo ${item.inventory_item_id}`,
      unitOfMeasure: item.item?.unit_of_measure,
      quantity: Number(item.quantity),
      unitCost: item.unit_cost === null ? null : Number(item.unit_cost ?? 0),
      totalCost: item.total_cost === null ? null : Number(item.total_cost ?? 0),
    })),
    createdAt: movement.confirmed_at ?? movement.created_at,
  };
}

function normalizeSettings(settings: InventorySettings): InventorySettings {
  const terminology = settings.terminology_json ?? settings.terminology ?? (settings.settings_json?.terminology as Record<string, unknown> | undefined) ?? {};
  const capabilities: InventoryCapabilities = settings.capabilities ?? {
    enabled: Boolean(settings.inventory_enabled),
    mode: settings.inventory_mode ?? 'simple',
    locations: true,
    balances: true,
    movements: true,
    costs: Boolean(settings.enable_cost_tracking),
    transfers: Boolean(settings.enable_transfers),
    counts: Boolean(settings.enable_inventory_counts),
    automation: false,
  };

  return { ...settings, terminology_json: terminology, terminology, capabilities };
}

function newClientKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `inventory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toLocation(location: ApiLocation): StockLocation {
  return {
    id: String(location.id),
    unitId: String(location.unit_id),
    unitName: location.unit?.name,
    name: location.name,
    code: location.code,
    type: location.type,
    isDefault: location.is_default,
    active: location.active,
    metadata: location.metadata ?? {},
  };
}

function toBalance(balance: ApiBalance): StockBalance {
  return {
    id: String(balance.id),
    itemId: String(balance.inventory_item_id),
    itemName: balance.item?.name,
    unitId: balance.unit_id ? String(balance.unit_id) : null,
    unitName: balance.unit?.name,
    locationId: balance.stock_location_id ? String(balance.stock_location_id) : null,
    locationName: balance.location?.name,
    onHand: Number(balance.on_hand ?? 0),
    reserved: Number(balance.reserved ?? 0),
    blocked: Number(balance.blocked ?? 0),
    available: Number(balance.available ?? 0),
    averageCost: Number(balance.average_cost ?? 0),
  };
}

export const inventoryService = {
  listItems: async (filters: InventoryItemFilters = {}) => {
    const response = await apiClient.get<ListResponse<ApiItem>>(`/api/company/inventory/items${queryString({
      search: filters.search,
      category_id: filters.categoryId,
      supplier_id: filters.supplierId,
      active: filters.active,
      stock_status: filters.stockStatus,
      per_page: 100,
    })}`);
    return response.data.map(toItem);
  },
  getItem: async (id: string) => toItem((await apiClient.get<DataResponse<ApiItem>>(`/api/company/inventory/items/${id}`)).data),
  createItem: async (payload: InventoryPayload) => toItem((await apiClient.post<DataResponse<ApiItem>>('/api/company/inventory/items', itemPayload(payload))).data),
  updateItem: async (id: string, payload: InventoryPayload) => toItem((await apiClient.put<DataResponse<ApiItem>>(`/api/company/inventory/items/${id}`, itemPayload(payload))).data),
  deleteItem: (id: string) => apiClient.delete<void>(`/api/company/inventory/items/${id}`),
  itemOptions: () => apiClient.get<InventoryOption[]>('/api/company/inventory/items/options'),

  listCategories: async () => (await apiClient.get<ListResponse<ApiCategory>>('/api/company/inventory/categories?per_page=100')).data.map(toCategory),
  createCategory: async (payload: InventoryPayload) => toCategory((await apiClient.post<DataResponse<ApiCategory>>('/api/company/inventory/categories', payload)).data),
  updateCategory: async (id: string, payload: InventoryPayload) => toCategory((await apiClient.put<DataResponse<ApiCategory>>(`/api/company/inventory/categories/${id}`, payload)).data),
  deleteCategory: (id: string) => apiClient.delete<void>(`/api/company/inventory/categories/${id}`),

  listSuppliers: async () => (await apiClient.get<ListResponse<ApiSupplier>>('/api/company/inventory/suppliers?per_page=100')).data.map(toSupplier),
  createSupplier: async (payload: InventoryPayload) => toSupplier((await apiClient.post<DataResponse<ApiSupplier>>('/api/company/inventory/suppliers', {
    ...payload,
    contact_name: payload.contactName ?? payload.contact_name,
  })).data),
  updateSupplier: async (id: string, payload: InventoryPayload) => toSupplier((await apiClient.put<DataResponse<ApiSupplier>>(`/api/company/inventory/suppliers/${id}`, {
    ...payload,
    contact_name: payload.contactName ?? payload.contact_name,
  })).data),
  deleteSupplier: (id: string) => apiClient.delete<void>(`/api/company/inventory/suppliers/${id}`),

  listMovements: async (filters: InventoryMovementFilters = {}) => {
    const response = await apiClient.get<ListResponse<ApiMovement>>(`/api/company/inventory/movements${queryString({
      inventory_item_id: filters.itemId,
      unit_id: filters.unitId,
      stock_location_id: filters.locationId,
      movement_type: filters.type,
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      per_page: 100,
    })}`);
    return response.data.map(toMovement);
  },
  getMovement: async (id: string) => toMovement((await apiClient.get<DataResponse<ApiMovement>>(`/api/company/inventory/movements/${id}`)).data),
  createMovement: async (payload: InventoryPayload) => {
    const idempotencyKey = String(payload.idempotencyKey ?? payload.idempotency_key ?? newClientKey());
    const rawItems = Array.isArray(payload.items) ? payload.items : [{
      inventory_item_id: payload.itemId ?? payload.inventory_item_id,
      quantity: payload.quantity,
      unit_cost: payload.unitCost ?? payload.unit_cost ?? null,
      metadata: {},
    }];
    return toMovement((await apiClient.post<DataResponse<ApiMovement>>('/api/company/inventory/movements', {
    operation_id: payload.operationId ?? payload.operation_id ?? undefined,
    unit_id: payload.unitId ?? payload.unit_id ?? null,
    movement_type: payload.type ?? payload.movement_type,
    source_location_id: payload.sourceLocationId ?? payload.source_location_id ?? null,
    destination_location_id: payload.destinationLocationId ?? payload.destination_location_id ?? null,
    items: rawItems.map(item => {
      const row = item as Record<string, unknown>;
      return {
        inventory_item_id: row.itemId ?? row.inventory_item_id,
        quantity: Number(row.quantity),
        unit_cost: row.unitCost === '' ? null : row.unitCost ?? row.unit_cost ?? null,
        metadata: row.metadata ?? {},
      };
    }),
    reference: payload.reference || null,
    source_type: payload.sourceType ?? payload.source_type ?? 'manual',
    source_reference: payload.sourceReference ?? payload.source_reference ?? null,
    reason: payload.reason || payload.notes || null,
    notes: payload.notes || null,
    idempotency_key: idempotencyKey,
    metadata: payload.metadata ?? {},
  }, { headers: { 'Idempotency-Key': idempotencyKey } })).data);
  },
  reverseMovement: async (id: string, reason: string) => {
    const idempotencyKey = newClientKey();
    return toMovement((await apiClient.post<DataResponse<ApiMovement>>(`/api/company/inventory/movements/${id}/reverse`, { reason, idempotency_key: idempotencyKey }, { headers: { 'Idempotency-Key': idempotencyKey } })).data);
  },
  listLocations: async (filters: StockLocationFilters = {}) => (await apiClient.get<ListResponse<ApiLocation>>(`/api/company/inventory/locations${queryString({
    unit_id: filters.unitId,
    active: filters.active,
    per_page: 100,
  })}`)).data.map(toLocation),
  createLocation: async (payload: InventoryPayload) => toLocation((await apiClient.post<DataResponse<ApiLocation>>('/api/company/inventory/locations', {
    unit_id: payload.unitId ?? payload.unit_id,
    name: payload.name,
    code: payload.code,
    type: payload.type ?? 'warehouse',
    is_default: payload.isDefault ?? payload.is_default ?? false,
    active: payload.active ?? true,
    metadata: payload.metadata ?? {},
  })).data),
  updateLocation: async (id: string, payload: InventoryPayload) => toLocation((await apiClient.put<DataResponse<ApiLocation>>(`/api/company/inventory/locations/${id}`, {
    unit_id: payload.unitId ?? payload.unit_id,
    name: payload.name,
    code: payload.code,
    type: payload.type ?? 'warehouse',
    is_default: payload.isDefault ?? payload.is_default ?? false,
    active: payload.active ?? true,
    metadata: payload.metadata ?? {},
  })).data),
  listBalances: async (filters: StockBalanceFilters = {}) => (await apiClient.get<ListResponse<ApiBalance>>(`/api/company/inventory/balances${queryString({
    inventory_item_id: filters.itemId,
    unit_id: filters.unitId,
    stock_location_id: filters.locationId,
    stock_status: filters.stockStatus,
    per_page: 100,
  })}`)).data.map(toBalance),

  getMetrics: async (): Promise<InventoryMetrics> => {
    const metrics = await apiClient.get<ApiMetrics>('/api/company/inventory/metrics');
    return {
      items: metrics.items,
      activeItems: metrics.active_items,
      lowStock: metrics.low_stock,
      outOfStock: metrics.out_of_stock,
      suppliers: metrics.suppliers,
      movementsToday: metrics.movements_today,
      inventoryValue: Number(metrics.inventory_value),
    };
  },

  getMetadata: async (entity: InventoryMetadata['entity_key']) => metadataService.getEntity(entity) as Promise<InventoryMetadata>,
  updateMetadata: async (entity: InventoryMetadata['entity_key'], payload: InventoryMetadata) => metadataService.updateEntity(entity, {
    ...payload,
    entity,
    form_schema: payload.fields ?? payload.form_schema,
    table_schema: payload.table_columns ?? payload.table_schema,
  }) as Promise<InventoryMetadata>,

  getSettings: async () => normalizeSettings((await apiClient.get<DataResponse<InventorySettings>>('/api/company/inventory/settings')).data),
  updateSettings: async (payload: Partial<InventorySettings>) => normalizeSettings((await apiClient.put<DataResponse<InventorySettings>>('/api/company/inventory/settings', payload)).data),
  listTransfers: async () => (await apiClient.get<DataResponse<InventoryTransfer[]>>('/api/company/inventory/transfers')).data,
  getTransfer: async (id: string) => (await apiClient.get<DataResponse<InventoryTransfer>>(`/api/company/inventory/transfers/${id}`)).data,
  createTransfer: async (payload: Record<string, unknown>) => (await apiClient.post<DataResponse<InventoryTransfer>>('/api/company/inventory/transfers', payload)).data,
  transferAction: async (id: number, action: 'approve' | 'ship' | 'receive' | 'cancel') => (await apiClient.patch<DataResponse<InventoryTransfer>>(`/api/company/inventory/transfers/${id}/${action}`, {})).data,
  listCounts: async () => (await apiClient.get<DataResponse<InventoryCount[]>>('/api/company/inventory/counts')).data,
  getCount: async (id: string) => (await apiClient.get<DataResponse<InventoryCount>>(`/api/company/inventory/counts/${id}`)).data,
  createCount: async (payload: Record<string, unknown>) => (await apiClient.post<DataResponse<InventoryCount>>('/api/company/inventory/counts', payload)).data,
  updateCount: async (id: number, payload: Record<string, unknown>) => (await apiClient.put<DataResponse<InventoryCount>>(`/api/company/inventory/counts/${id}`, payload)).data,
  countAction: async (id: number, action: 'complete' | 'approve') => (await apiClient.patch<DataResponse<InventoryCount>>(`/api/company/inventory/counts/${id}/${action}`, {})).data,
  coverage: async () => (await apiClient.get<DataResponse<Record<string, unknown>[]>>('/api/company/inventory/coverage')).data,
  divergences: async () => (await apiClient.get<DataResponse<Record<string, unknown>[]>>('/api/company/inventory/divergences')).data,
};
