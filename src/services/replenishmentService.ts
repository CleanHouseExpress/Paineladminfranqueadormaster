import { apiClient } from './apiClient';

export interface ReplenishmentOffer {
  supplier_offer_id: number;
  supplier_id: number;
  supplier: {
    id: number;
    name: string;
  };
  purchase_uom: string;
  package_uom: string;
  inventory_uom: string;
  conversion_factor: number;
  unit_price: number;
  currency: string;
  minimum_order_quantity: number;
  purchase_multiple: number;
  package_quantity: number;
  lead_time_min: number;
  lead_time_max: number;
  availability_status: string;
  suggested_purchase_quantity: number;
  suggested_inventory_quantity: number;
}

export interface ReplenishmentSuggestion {
  inventory_item_id: number;
  name: string;
  unit_id: number;
  current_stock: number;
  minimum_stock: number;
  target_stock: number;
  needed_quantity: number;
  offers: ReplenishmentOffer[];
}

interface SuggestionsResponse {
  data: ReplenishmentSuggestion[];
}

export interface ReplenishmentUnit {
  id: string | number;
  name: string;
}

interface UnitsResponse {
  data: ReplenishmentUnit[];
}

export interface PurchaseOrderItem {
  supplier_offer_id: number;
  quantity: number;
}

export interface CreatePurchaseOrdersPayload {
  unit_id: number;
  items: PurchaseOrderItem[];
}

export const replenishmentService = {
  listAccessibleUnits: async () => (
    await apiClient.get<UnitsResponse>('/api/me/units')
  ).data,

  listSuggestions: async (unitId: number) => (
    await apiClient.get<SuggestionsResponse>(
      `/api/company/procurement/replenishment-suggestions?unit_id=${encodeURIComponent(unitId)}`,
    )
  ).data,

  createPurchaseOrders: (payload: CreatePurchaseOrdersPayload) =>
    apiClient.post('/api/company/procurement/replenishment-suggestions/purchase-orders', payload),
};
