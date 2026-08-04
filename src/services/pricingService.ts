import { apiClient } from './apiClient';
import type {
  EffectivePrice,
  PricingFilters,
  PricingListResult,
  ProductPrice,
  ProductPricePayload,
  ProductUnitPrice,
  ProductUnitPricePayload,
} from '../types/pricing';

interface ApiItem<T> { data: T }
interface ApiList<T> { data: T[]; meta?: PricingListResult['meta'] }

type ApiProductPrice = Record<string, any>;
type ApiProductUnitPrice = Record<string, any>;
type ApiEffectivePrice = Record<string, any>;

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function queryString(filters: PricingFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.active !== undefined && filters.active !== '') params.set('active', String(filters.active));
  if (filters.catalogItemId) params.set('catalog_item_id', String(filters.catalogItemId));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function toProductPrice(api: ApiProductPrice): ProductPrice {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    catalogItemId: api.catalog_item_id,
    catalogItem: api.catalog_item ?? null,
    salePrice: numberOrNull(api.sale_price),
    costPrice: numberOrNull(api.cost_price),
    currency: String(api.currency ?? 'BRL'),
    active: api.active !== false,
    createdAt: api.created_at ?? null,
    updatedAt: api.updated_at ?? null,
  };
}

function toProductUnitPrice(api: ApiProductUnitPrice): ProductUnitPrice {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    catalogItemId: api.catalog_item_id,
    catalogItem: api.catalog_item ?? null,
    unitId: api.unit_id,
    unit: api.unit ?? null,
    salePrice: numberOrNull(api.sale_price),
    active: api.active !== false,
    createdAt: api.created_at ?? null,
    updatedAt: api.updated_at ?? null,
  };
}

function toEffectivePrice(api: ApiEffectivePrice): EffectivePrice {
  const origin = api.price_origin === 'unit' || api.price_origin === 'network' ? api.price_origin : null;
  return {
    effectivePrice: numberOrNull(api.effective_price),
    priceOrigin: origin,
    networkPrice: numberOrNull(api.network_price),
    unitPrice: numberOrNull(api.unit_price),
    currency: String(api.currency ?? 'BRL'),
  };
}

function toProductPayload(payload: ProductPricePayload) {
  return {
    ...(payload.catalogItemId ? { catalog_item_id: Number(payload.catalogItemId) } : {}),
    sale_price: payload.salePrice,
    cost_price: payload.costPrice ?? null,
    currency: payload.currency ?? 'BRL',
    active: payload.active ?? true,
  };
}

export const pricingService = {
  async listPrices(filters: PricingFilters = {}): Promise<PricingListResult> {
    const response = await apiClient.get<ApiList<ApiProductPrice>>(`/api/company/pricing/products${queryString(filters)}`);
    return {
      data: (response.data ?? []).map(toProductPrice),
      meta: response.meta ?? { current_page: 1, last_page: 1, per_page: response.data?.length ?? 0, total: response.data?.length ?? 0 },
    };
  },

  async createPrice(payload: ProductPricePayload) {
    const response = await apiClient.post<ApiItem<ApiProductPrice>>('/api/company/pricing/products', toProductPayload(payload));
    return toProductPrice(response.data);
  },

  async updatePrice(id: string | number, payload: ProductPricePayload) {
    const response = await apiClient.put<ApiItem<ApiProductPrice>>(`/api/company/pricing/products/${id}`, toProductPayload(payload));
    return toProductPrice(response.data);
  },

  async effectivePrice(catalogItemId: string | number, unitId?: string | number | null) {
    const query = unitId ? `?unit_id=${unitId}` : '';
    const response = await apiClient.get<ApiItem<ApiEffectivePrice>>(`/api/company/pricing/products/${catalogItemId}/effective${query}`);
    return toEffectivePrice(response.data);
  },

  async unitPrices(catalogItemId: string | number) {
    const response = await apiClient.get<ApiList<ApiProductUnitPrice>>(`/api/company/pricing/products/${catalogItemId}/units`);
    return (response.data ?? []).map(toProductUnitPrice);
  },

  async updateUnitPrice(catalogItemId: string | number, unitId: string | number, payload: ProductUnitPricePayload) {
    const response = await apiClient.put<ApiItem<ApiProductUnitPrice>>(`/api/company/pricing/products/${catalogItemId}/units/${unitId}`, {
      sale_price: payload.salePrice,
      active: payload.active ?? true,
    });
    return toProductUnitPrice(response.data);
  },
};
