import type { CustomerFormSettings, CustomerTableColumn } from './customerManagement';
import type { DynamicFieldSchema } from './userManagement';

export type InventoryItemStatus = 'active' | 'inactive';
export type MovementType = 'entry' | 'exit' | 'adjustment' | 'loss' | 'transfer';

export const MOVEMENT_TYPE_CONFIG: Record<MovementType, { label: string; color: string; bg: string; sign: string }> = {
  entry: { label: 'Entrada', color: '#10B981', bg: '#ECFDF5', sign: '+' },
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

export interface InventoryItem {
  id: string;
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
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemUnit?: string;
  unitId?: string | null;
  unitName?: string | null;
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

export interface InventoryOption {
  value: number;
  label: string;
}

export type InventoryPayload = Record<string, unknown>;
export type InventoryMetadata = Omit<CustomerFormSettings, 'entity_key'> & {
  entity_key: 'inventory_items' | 'inventory_suppliers' | 'inventory_categories';
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
  configure: 'tenant.inventory.configure',
  automationView: 'tenant.inventory.automation.view',
  automationManage: 'tenant.inventory.automation.manage',
} as const;
