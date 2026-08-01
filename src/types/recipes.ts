export type RecipeType = 'physical_product' | 'service_consumption' | 'operational_composition';
export type RecipeVersionStatus = 'draft' | 'published' | 'superseded' | 'archived' | string;

export interface RecipeUom {
  id: number;
  code: string;
  name: string;
  symbol: string;
  dimension: string;
  precision?: number;
}

export interface RecipeItemRef {
  id: number | string;
  name: string;
  sku?: string | null;
  item_type?: string | null;
  unit_of_measure?: string | null;
  base_uom?: string | null;
  inventory_name?: string | null;
}

export interface RecipeComponent {
  id?: number | string;
  inventory_item_id: number | string;
  inventory_item?: RecipeItemRef | null;
  quantity: number;
  uom_id: number;
  uom?: RecipeUom | null;
  expected_waste_percent?: number | null;
  optional?: boolean;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

export interface RecipeOutput {
  id?: number | string;
  output_type: 'inventory_item' | 'catalog_item' | 'service_result' | 'waste' | string;
  catalog_item_id?: number | string | null;
  catalog_item?: RecipeItemRef | null;
  inventory_item_id?: number | string | null;
  inventory_item?: RecipeItemRef | null;
  description?: string | null;
  quantity: number;
  uom_id: number;
  uom?: RecipeUom | null;
  is_primary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RecipeVersion {
  id: number | string;
  recipe_id: number | string;
  version: number;
  status: RecipeVersionStatus;
  effective_from?: string | null;
  effective_until?: string | null;
  base_quantity: number;
  base_uom_id: number;
  base_uom?: RecipeUom | null;
  expected_yield_quantity: number;
  expected_yield_uom_id: number;
  expected_yield_uom?: RecipeUom | null;
  expected_waste_percent?: number | null;
  governance?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  published_at?: string | null;
  published_by?: number | string | null;
  components: RecipeComponent[];
  outputs: RecipeOutput[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Recipe {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  recipe_type: RecipeType;
  catalog_item_id?: number | string | null;
  catalog_item?: RecipeItemRef | null;
  active: boolean;
  active_version_id?: number | string | null;
  active_version?: RecipeVersion | null;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RecipeFilters {
  search?: string;
  recipe_type?: RecipeType | '';
  active?: boolean | '';
}

export interface RecipeListResponse {
  data: Recipe[];
  meta?: Record<string, number>;
}

export interface RecipePayload {
  code: string;
  name: string;
  description?: string | null;
  recipe_type: RecipeType;
  catalog_item_id?: number | string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
  create_initial_version?: boolean;
  version?: Partial<RecipeVersionPayload>;
}

export interface RecipeVersionPayload {
  effective_from?: string | null;
  effective_until?: string | null;
  base_quantity: number;
  base_uom_id: number;
  expected_yield_quantity: number;
  expected_yield_uom_id: number;
  expected_waste_percent?: number | null;
  governance?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  components?: RecipeComponent[];
  output?: RecipeOutput | null;
  outputs?: RecipeOutput[];
}

export interface RecipeCalculationComponent {
  id: number | string;
  inventory_item_id: number | string;
  name: string;
  base_quantity: string;
  expected_loss_quantity: string;
  gross_quantity: string;
  uom: RecipeUom;
  unit_cost?: string | null;
  estimated_cost?: string | null;
  cost_available: boolean;
  available_quantity?: string | null;
  warnings?: RecipeWarning[];
}

export interface RecipeWarning {
  code?: string;
  field?: string;
  message?: string;
  inventory_item_id?: number | string | null;
}

export interface RecipeCalculationResult {
  recipe: { id: number | string; code: string; name: string; version: number; status: string };
  request: { target_quantity: string; target_uom: RecipeUom; unit_id?: number | string | null };
  scale_factor: string;
  expected_output: { id?: number | string; quantity: string; uom: RecipeUom; description?: string | null; type?: string | null; output_type?: string | null; inventory_item_id?: number | string | null; catalog_item_id?: number | string | null };
  yield: { base_quantity: string; base_uom: RecipeUom; requested_quantity_in_yield_uom: string };
  components: RecipeCalculationComponent[];
  estimated_total_cost: string;
  estimated_cost_per_output_unit?: string | null;
  currency: string;
  cost_coverage: { components_total: number; components_with_cost: number; complete: boolean };
  cost_complete: boolean;
  warnings: RecipeWarning[];
  side_effects: Record<string, boolean>;
}

export interface RecipeExecution {
  id: number | string;
  number: string;
  recipe_id: number | string;
  recipe?: Pick<Recipe, 'id' | 'code' | 'name' | 'recipe_type'> | null;
  recipe_version_id: number | string;
  version?: { id: number | string; version: number; status: string } | null;
  unit_id: number | string;
  unit?: { id: number | string; name: string } | null;
  stock_location_id: number | string;
  stock_location?: { id: number | string; name: string; code?: string | null; unit_id?: number | string } | null;
  target_quantity: number;
  target_uom_id: number | string;
  target_uom?: RecipeUom | null;
  status: 'confirmed' | 'reversed' | string;
  operation_id: string;
  idempotency_key?: string | null;
  correlation_id?: string | null;
  calculation_snapshot: RecipeCalculationResult & Record<string, unknown>;
  input_movement_id?: number | string | null;
  input_movement?: { id: number | string; number: string; movement_type: string; status: string } | null;
  output_movement_id?: number | string | null;
  output_movement?: { id: number | string; number: string; movement_type: string; status: string } | null;
  executed_at?: string | null;
  executed_by?: number | string | null;
  executed_by_name?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  reversed_at?: string | null;
  reversed_by?: number | string | null;
  reversal_reason?: string | null;
}

export interface RecipeExecutionPayload {
  recipe_id: number | string;
  recipe_version_id: number | string;
  unit_id: number | string;
  stock_location_id?: number | string | null;
  target_quantity: number;
  target_uom_id: number | string;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RecipeExecutionFilters {
  unit_id?: number | string | '';
  recipe_id?: number | string | '';
  recipe_version_id?: number | string | '';
  status?: string;
  date_from?: string;
  date_to?: string;
}

export const RECIPE_PERMISSIONS = {
  view: 'tenant.recipes.view',
  create: 'tenant.recipes.create',
  update: 'tenant.recipes.update',
  publish: 'tenant.recipes.publish',
  archive: 'tenant.recipes.archive',
  simulate: 'tenant.recipes.simulate',
  executionsView: 'tenant.recipe-executions.view',
  executionsCreate: 'tenant.recipe-executions.create',
  executionsReverse: 'tenant.recipe-executions.reverse',
} as const;

export const RECIPE_TYPE_CONFIG: Record<RecipeType, { label: string; color: string; bg: string }> = {
  physical_product: { label: 'Produto fisico', color: '#0F766E', bg: '#CCFBF1' },
  service_consumption: { label: 'Servico com consumo', color: '#7C3AED', bg: '#F3E8FF' },
  operational_composition: { label: 'Composicao operacional', color: '#B45309', bg: '#FEF3C7' },
};

export const RECIPE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: '#475569', bg: '#F1F5F9' },
  published: { label: 'Publicada', color: '#047857', bg: '#D1FAE5' },
  superseded: { label: 'Substituida', color: '#B45309', bg: '#FEF3C7' },
  archived: { label: 'Arquivada', color: '#991B1B', bg: '#FEE2E2' },
};

export const RECIPE_UOMS: RecipeUom[] = [
  { id: 1, code: 'unit', name: 'Unidade', symbol: 'un', dimension: 'count', precision: 0 },
  { id: 2, code: 'kg', name: 'Quilograma', symbol: 'kg', dimension: 'mass', precision: 4 },
  { id: 3, code: 'g', name: 'Grama', symbol: 'g', dimension: 'mass', precision: 2 },
  { id: 4, code: 'l', name: 'Litro', symbol: 'L', dimension: 'volume', precision: 4 },
  { id: 5, code: 'ml', name: 'Mililitro', symbol: 'ml', dimension: 'volume', precision: 2 },
];
