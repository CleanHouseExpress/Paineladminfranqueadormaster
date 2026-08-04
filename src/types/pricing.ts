export interface PricingCatalogItemRef {
  id: number | string;
  name: string;
  sku?: string | null;
  item_type?: string | null;
  unit_of_measure?: string | null;
}

export interface ProductPrice {
  id: number | string;
  tenantId: number | string;
  catalogItemId: number | string;
  catalogItem: PricingCatalogItemRef | null;
  salePrice: number | null;
  costPrice: number | null;
  currency: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProductUnitPrice {
  id: number | string;
  tenantId: number | string;
  catalogItemId: number | string;
  catalogItem: PricingCatalogItemRef | null;
  unitId: number | string;
  unit: {
    id: number | string;
    name: string;
    code?: string | null;
  } | null;
  salePrice: number | null;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type PriceOrigin = 'network' | 'unit' | null;

export interface EffectivePrice {
  effectivePrice: number | null;
  priceOrigin: PriceOrigin;
  networkPrice: number | null;
  unitPrice: number | null;
  currency: string;
}

export interface PricingListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PricingListResult {
  data: ProductPrice[];
  meta: PricingListMeta;
}

export interface PricingFilters {
  search?: string;
  active?: boolean | '';
  catalogItemId?: string | number;
  page?: number;
  perPage?: number;
}

export interface ProductPricePayload {
  catalogItemId?: string | number;
  salePrice: number;
  costPrice?: number | null;
  currency?: string;
  active?: boolean;
}

export interface ProductUnitPricePayload {
  salePrice: number;
  active?: boolean;
}

export const PRICING_PERMISSIONS = {
  view: 'tenant.pricing.view',
  create: 'tenant.pricing.create',
  update: 'tenant.pricing.update',
  unitUpdate: 'tenant.pricing.unit.update',
} as const;
