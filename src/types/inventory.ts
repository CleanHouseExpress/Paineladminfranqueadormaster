import type { CustomerFormSettings, CustomerTableColumn } from './customerManagement';
import type { DynamicFieldSchema } from './userManagement';

export type InventoryItemStatus = 'active' | 'inactive';
export type MovementType = 'entry' | 'exit' | 'adjustment' | 'positive_adjustment' | 'negative_adjustment' | 'loss' | 'transfer' | 'reversal';

export const MOVEMENT_TYPE_CONFIG: Record<MovementType, { label: string; color: string; bg: string; sign: string }> = {
  entry: { label: 'Entrada', color: '#10B981', bg: '#ECFDF5', sign: '+' },
  positive_adjustment: { label: 'Ajuste positivo', color: '#6366F1', bg: '#EEF2FF', sign: '+' },
  negative_adjustment: { label: 'Ajuste negativo', color: '#6366F1', bg: '#EEF2FF', sign: '-' },
  reversal: { label: 'Estorno', color: '#64748B', bg: '#F1F5F9', sign: 'Â±' },
  exit: { label: 'Saída', color: '#EF4444', bg: '#FEF2F2', sign: '-' },
  adjustment: { label: 'Ajuste', color: '#6366F1', bg: '#EEF2FF', sign: '±' },
  loss: { label: 'Perda', color: '#F59E0B', bg: '#FFFBEB', sign: '-' },
  transfer: { label: 'Transferência', color: '#3B82F6', bg: '#EFF6FF', sign: '±' },
};

export const UNITS_OF_MEASURE = [
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'un', label: 'Unidade (un)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cm', label: 'Centímetro (cm)' },
] as const;

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventorySupplier {
  id: string;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventoryUnitBalance {
  unitId: string;
  unitName?: string | null;
  currentStock: number;
  averageCost: number;
}

export interface StockBalance {
  id: string;
  itemId: string;
  itemName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  onHand: number;
  reserved: number;
  blocked: number;
  available: number;
  averageCost: number;
}

export interface StockLocation {
  id: string;
  unitId: string;
  unitName?: string | null;
  name: string;
  code: string;
  type: string;
  isDefault: boolean;
  active: boolean;
  metadata: Record<string, unknown>;
}

export interface InventoryItem {
  id: string;
  catalogItemId?: string | null;
  itemKind?: 'catalog_product' | 'internal_supply' | string;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  unitOfMeasure: string;
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  active: boolean;
  trackInventory: boolean;
  minimumStock: number;
  currentStock: number;
  averageCost: number;
  totalValue: number;
  metadata: Record<string, unknown>;
  unitBalances: InventoryUnitBalance[];
  stockBalances: StockBalance[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventoryMovement {
  id: string;
  number?: string;
  status?: string;
  itemId: string;
  itemName: string;
  itemUnit?: string;
  unitId?: string | null;
  unitName?: string | null;
  sourceLocationId?: string | null;
  sourceLocationName?: string | null;
  destinationLocationId?: string | null;
  destinationLocationName?: string | null;
  type: MovementType;
  quantity: number;
  unitCost?: number | null;
  totalCost?: number | null;
  reference?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  performedByName?: string | null;
  originType?: string | null;
  originId?: string | null;
  originFieldKey?: string | null;
  originReference?: string | null;
  sourceType?: string | null;
  reason?: string | null;
  items?: Array<{ itemId: string; itemName: string; quantity: number; unitCost?: number | null; totalCost?: number | null; unitOfMeasure?: string | null }>;
  createdAt?: string | null;
}

export interface InventoryMetrics {
  items: number;
  activeItems: number;
  lowStock: number;
  outOfStock: number;
  suppliers: number;
  movementsToday: number;
  inventoryValue: number;
}

export interface InventorySettings {
  inventory_enabled: boolean; inventory_mode: 'simple' | 'intermediate' | 'advanced' | string;
  enable_transfers: boolean; enable_inventory_counts: boolean; enable_stock_minimum: boolean;
  enable_stock_ideal: boolean; enable_reorder_point: boolean; enable_coverage: boolean;
  enable_inventory_alerts: boolean; enable_purchase_flow: boolean; enable_recipes: boolean;
  enable_supplier_management: boolean; enable_cost_tracking: boolean; enable_multi_unit_inventory: boolean;
  settings_json: Record<string, unknown>;
  terminology_json?: Record<string, unknown>;
}

export interface InventoryTransfer {
  id: number; origin_unit_id: number; origin_unit_name: string; destination_unit_id: number;
  destination_unit_name: string; status: string; notes?: string; requested_at?: string;
  items: Array<{ id: number; inventory_item_id: number; item_name: string; quantity: number; unit_cost: number }>;
}

export interface InventoryCount {
  id: number; unit_id: number; unit_name: string; type: string; status: string; notes?: string;
  items: Array<{ id: number; inventory_item_id: number; item_name: string; system_quantity: number; counted_quantity: number | null; difference_quantity: number; difference_cost: number }>;
}

export interface InventoryOption {
  value: number;
  label: string;
}

export type InventoryPayload = Record<string, unknown>;
export type InventoryMetadata = Omit<CustomerFormSettings, 'entity_key'> & {
  entity_key: 'inventory_items' | 'inventory_suppliers' | 'inventory_categories' | 'stock_locations' | 'stock_movements';
  fields: DynamicFieldSchema[];
  table_columns: CustomerTableColumn[];
};

export const INVENTORY_PERMISSIONS = {
  view: 'tenant.inventory.view',
  create: 'tenant.inventory.create',
  update: 'tenant.inventory.update',
  delete: 'tenant.inventory.delete',
  move: 'tenant.inventory.move',
  adjust: 'tenant.inventory.adjust',
  itemsManage: 'tenant.inventory.items.manage',
  locationsManage: 'tenant.inventory.locations.manage',
  entryCreate: 'tenant.inventory.entry.create',
  exitCreate: 'tenant.inventory.exit.create',
  adjustCreate: 'tenant.inventory.adjust.create',
  reverse: 'tenant.inventory.reverse',
  costView: 'tenant.inventory.cost.view',
  configure: 'tenant.inventory.configure',
  automationView: 'tenant.inventory.automation.view',
  automationManage: 'tenant.inventory.automation.manage',
  settingsView: 'tenant.inventory.settings.view', settingsUpdate: 'tenant.inventory.settings.update',
  transfer: 'tenant.inventory.transfer', transferApprove: 'tenant.inventory.transfer.approve', transferReceive: 'tenant.inventory.transfer.receive',
  count: 'tenant.inventory.count', countApprove: 'tenant.inventory.count.approve',
} as const;
