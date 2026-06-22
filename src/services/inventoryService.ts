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
  MovementType,
} from '../types/inventory';

interface DataResponse<T> { data: T }
interface ListResponse<T> { data: T[]; meta?: Record<string, number> }

interface ApiItem {
  id: number | string;
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
  inventory_item_id: number | string;
  item?: { id: number | string; name: string; unit_of_measure?: string } | null;
  unit_id?: number | string | null;
  unit?: { id: number | string; name: string } | null;
  movement_type: MovementType;
  quantity: number | string;
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
  created_at?: string | null;
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
  type?: MovementType | '';
  dateFrom?: string;
  dateTo?: string;
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
  const currentStock = Number(item.current_stock ?? 0);
  const averageCost = Number(item.average_cost ?? 0);
  return {
    id: String(item.id),
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
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function itemPayload(data: InventoryPayload) {
  return {
    name: data.name,
    description: data.description || null,
    sku: data.sku || null,
    barcode: data.barcode || null,
    unit_of_measure: data.unit_of_measure ?? data.unitOfMeasure,
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
  return {
    id: String(movement.id),
    itemId: String(movement.inventory_item_id),
    itemName: movement.item?.name ?? `Insumo ${movement.inventory_item_id}`,
    itemUnit: movement.item?.unit_of_measure,
    unitId: movement.unit_id ? String(movement.unit_id) : null,
    unitName: movement.unit?.name,
    type: movement.movement_type,
    quantity: Number(movement.quantity),
    unitCost: movement.unit_cost === null ? null : Number(movement.unit_cost ?? 0),
    totalCost: movement.total_cost === null ? null : Number(movement.total_cost ?? 0),
    reference: movement.reference,
    notes: movement.notes,
    performedBy: movement.performed_by ? String(movement.performed_by) : null,
    performedByName: movement.performed_by_name,
    originType: movement.origin_type,
    originId: movement.origin_id ? String(movement.origin_id) : null,
    originFieldKey: movement.origin_field_key,
    originReference: movement.origin_reference,
    createdAt: movement.created_at,
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
      movement_type: filters.type,
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      per_page: 100,
    })}`);
    return response.data.map(toMovement);
  },
  createMovement: async (payload: InventoryPayload) => toMovement((await apiClient.post<DataResponse<ApiMovement>>('/api/company/inventory/movements', {
    inventory_item_id: payload.itemId ?? payload.inventory_item_id,
    unit_id: payload.unitId ?? payload.unit_id ?? null,
    movement_type: payload.type ?? payload.movement_type,
    quantity: Number(payload.quantity),
    unit_cost: payload.unitCost === '' ? null : payload.unitCost ?? payload.unit_cost ?? null,
    reference: payload.reference || null,
    notes: payload.notes || null,
  })).data),

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
};
