import { apiClient, type ApiRequestOptions } from './apiClient';
import type {
  Recipe,
  RecipeCalculationResult,
  RecipeExecution,
  RecipeExecutionFilters,
  RecipeExecutionPayload,
  RecipeFilters,
  RecipeListResponse,
  RecipePayload,
  RecipeVersion,
  RecipeVersionPayload,
} from '../types/recipes';

interface DataResponse<T> { data: T }
interface ListResponse<T> { data: T[]; meta?: Record<string, number> }

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

function normalizeRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    id: String(recipe.id),
    catalog_item_id: recipe.catalog_item_id ? String(recipe.catalog_item_id) : null,
    active: recipe.active !== false,
    active_version_id: recipe.active_version_id ? String(recipe.active_version_id) : null,
    metadata: recipe.metadata ?? {},
    active_version: recipe.active_version ? normalizeVersion(recipe.active_version) : null,
  };
}

function normalizeVersion(version: RecipeVersion): RecipeVersion {
  return {
    ...version,
    id: String(version.id),
    recipe_id: String(version.recipe_id),
    base_quantity: Number(version.base_quantity ?? 1),
    base_uom_id: Number(version.base_uom_id),
    expected_yield_quantity: Number(version.expected_yield_quantity ?? 1),
    expected_yield_uom_id: Number(version.expected_yield_uom_id),
    expected_waste_percent: version.expected_waste_percent === null || version.expected_waste_percent === undefined ? null : Number(version.expected_waste_percent),
    governance: version.governance ?? {},
    settings: version.settings ?? {},
    metadata: version.metadata ?? {},
    components: (version.components ?? []).map(component => ({
      ...component,
      id: component.id ? String(component.id) : undefined,
      inventory_item_id: String(component.inventory_item_id),
      quantity: Number(component.quantity ?? 0),
      uom_id: Number(component.uom_id),
      expected_waste_percent: component.expected_waste_percent === null || component.expected_waste_percent === undefined ? null : Number(component.expected_waste_percent),
      optional: Boolean(component.optional),
      sort_order: Number(component.sort_order ?? 1),
      metadata: component.metadata ?? {},
    })),
    outputs: (version.outputs ?? []).map(output => ({
      ...output,
      id: output.id ? String(output.id) : undefined,
      catalog_item_id: output.catalog_item_id ? String(output.catalog_item_id) : null,
      inventory_item_id: output.inventory_item_id ? String(output.inventory_item_id) : null,
      quantity: Number(output.quantity ?? 0),
      uom_id: Number(output.uom_id),
      is_primary: output.is_primary !== false,
      metadata: output.metadata ?? {},
    })),
  };
}

function normalizeExecution(execution: RecipeExecution): RecipeExecution {
  return {
    ...execution,
    id: String(execution.id),
    recipe_id: String(execution.recipe_id),
    recipe_version_id: String(execution.recipe_version_id),
    unit_id: String(execution.unit_id),
    stock_location_id: String(execution.stock_location_id),
    target_quantity: Number(execution.target_quantity ?? 0),
    target_uom_id: Number(execution.target_uom_id),
    input_movement_id: execution.input_movement_id ? String(execution.input_movement_id) : null,
    output_movement_id: execution.output_movement_id ? String(execution.output_movement_id) : null,
    calculation_snapshot: execution.calculation_snapshot ?? {} as RecipeExecution['calculation_snapshot'],
    metadata: execution.metadata ?? {},
  };
}

function versionPayload(payload: RecipeVersionPayload): RecipeVersionPayload {
  return {
    ...payload,
    effective_from: payload.effective_from || null,
    effective_until: payload.effective_until || null,
    expected_waste_percent: payload.expected_waste_percent === null || payload.expected_waste_percent === undefined ? null : Number(payload.expected_waste_percent),
    components: (payload.components ?? []).map((component, index) => ({
      inventory_item_id: Number(component.inventory_item_id),
      quantity: Number(component.quantity),
      uom_id: Number(component.uom_id),
      expected_waste_percent: component.expected_waste_percent === null || component.expected_waste_percent === undefined ? null : Number(component.expected_waste_percent),
      optional: Boolean(component.optional),
      sort_order: component.sort_order ?? index + 1,
      metadata: component.metadata ?? {},
    })),
    outputs: (payload.outputs ?? []).map(output => ({
      output_type: output.output_type,
      catalog_item_id: output.catalog_item_id ? Number(output.catalog_item_id) : null,
      inventory_item_id: output.inventory_item_id ? Number(output.inventory_item_id) : null,
      description: output.description || null,
      quantity: Number(output.quantity),
      uom_id: Number(output.uom_id),
      is_primary: output.is_primary !== false,
      metadata: output.metadata ?? {},
    })),
  };
}

function newClientKey(prefix = 'recipe-execution') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const recipeService = {
  list: async (filters: RecipeFilters = {}, options?: ApiRequestOptions): Promise<RecipeListResponse> => {
    const response = await apiClient.get<ListResponse<Recipe>>(`/api/company/recipes${queryString({
      search: filters.search,
      recipe_type: filters.recipe_type,
      active: filters.active,
      per_page: 100,
    })}`, options);
    return { data: response.data.map(normalizeRecipe), meta: response.meta };
  },
  get: async (id: string) => normalizeRecipe((await apiClient.get<DataResponse<Recipe>>(`/api/company/recipes/${id}`)).data),
  create: async (payload: RecipePayload) => normalizeRecipe((await apiClient.post<DataResponse<Recipe>>('/api/company/recipes', payload)).data),
  update: async (id: string, payload: Partial<RecipePayload>) => normalizeRecipe((await apiClient.put<DataResponse<Recipe>>(`/api/company/recipes/${id}`, payload)).data),
  archive: async (id: string) => normalizeRecipe((await apiClient.post<DataResponse<Recipe>>(`/api/company/recipes/${id}/archive`, {})).data),
  versions: async (recipeId: string) => (await apiClient.get<DataResponse<RecipeVersion[]> | ListResponse<RecipeVersion>>(`/api/company/recipes/${recipeId}/versions`)).data.map(normalizeVersion),
  createVersion: async (recipeId: string, payload: RecipeVersionPayload) => normalizeVersion((await apiClient.post<DataResponse<RecipeVersion>>(`/api/company/recipes/${recipeId}/versions`, versionPayload(payload))).data),
  getVersion: async (recipeId: string, version: string) => normalizeVersion((await apiClient.get<DataResponse<RecipeVersion>>(`/api/company/recipes/${recipeId}/versions/${version}`)).data),
  updateVersion: async (recipeId: string, version: string, payload: RecipeVersionPayload) => normalizeVersion((await apiClient.put<DataResponse<RecipeVersion>>(`/api/company/recipes/${recipeId}/versions/${version}`, versionPayload(payload))).data),
  validateVersion: async (recipeId: string, version: string) => (await apiClient.post<DataResponse<{ valid: boolean; version: number }>>(`/api/company/recipes/${recipeId}/versions/${version}/validate`, {})).data,
  publishVersion: async (recipeId: string, version: string) => normalizeVersion((await apiClient.post<DataResponse<RecipeVersion>>(`/api/company/recipes/${recipeId}/versions/${version}/publish`, {})).data),
  cloneVersion: async (recipeId: string, version: string) => normalizeVersion((await apiClient.post<DataResponse<RecipeVersion>>(`/api/company/recipes/${recipeId}/versions/${version}/clone`, {})).data),
  calculate: async (recipeId: string, version: string, payload: { target_quantity: number; target_uom_id: number; unit_id?: number | string | null }) => (await apiClient.post<DataResponse<RecipeCalculationResult>>(`/api/company/recipes/${recipeId}/versions/${version}/calculate`, payload)).data,
  listExecutions: async (filters: RecipeExecutionFilters = {}) => {
    const response = await apiClient.get<ListResponse<RecipeExecution>>(`/api/company/recipe-executions${queryString({ ...filters, per_page: 100 })}`);
    return { data: response.data.map(normalizeExecution), meta: response.meta };
  },
  getExecution: async (id: string) => normalizeExecution((await apiClient.get<DataResponse<RecipeExecution>>(`/api/company/recipe-executions/${id}`)).data),
  confirmExecution: async (payload: RecipeExecutionPayload, idempotencyKey = newClientKey()) => normalizeExecution((await apiClient.post<DataResponse<RecipeExecution>>('/api/company/recipe-executions', {
    recipe_id: Number(payload.recipe_id),
    recipe_version_id: Number(payload.recipe_version_id),
    unit_id: Number(payload.unit_id),
    stock_location_id: payload.stock_location_id ? Number(payload.stock_location_id) : null,
    target_quantity: Number(payload.target_quantity),
    target_uom_id: Number(payload.target_uom_id),
    notes: payload.notes || null,
    metadata: payload.metadata ?? {},
  }, { headers: { 'Idempotency-Key': idempotencyKey } })).data),
  reverseExecution: async (id: string, reason: string) => normalizeExecution((await apiClient.post<DataResponse<RecipeExecution>>(`/api/company/recipe-executions/${id}/reverse`, {
    reason,
  })).data),
};
