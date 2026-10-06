import { apiClient } from './apiClient';

export interface ReplenishmentOffer {
  id: number;
  supplier_id: number;
  supplier_name: string;
  authorized: boolean;
  preferred: boolean;
  unit_price: number;
  lead_time_days: number;
  moq: number;
  purchase_multiple: number;
  package_quantity: number;
  suggested_quantity: number;
}

export interface ReplenishmentSuggestion {
  inventory_item_id: number;
  item_name: string;
  sku?: string | null;
  unit_id: number;
  unit_name: string;
  current_stock: number;
  minimum_stock: number;
  target_stock: number;
  required_quantity: number;
  offers: ReplenishmentOffer[];
}

interface SuggestionsResponse {
  data: ReplenishmentSuggestion[];
}

export interface PurchaseOrderItem {
  inventory_item_id: number;
  supplier_offer_id: number;
  quantity: number;
}

export interface CreatePurchaseOrderPayload {
  unit_id: number;
  supplier_id: number;
  items: PurchaseOrderItem[];
}

export const replenishmentService = {
  listSuggestions: async (unitId: number) => (
    await apiClient.get<SuggestionsResponse>(
      `/api/company/procurement/replenishment-suggestions?unit_id=${encodeURIComponent(unitId)}`,
    )
  ).data,

  createPurchaseOrder: (payload: CreatePurchaseOrderPayload) =>
    apiClient.post('/api/company/procurement/purchase-orders', payload),
};
