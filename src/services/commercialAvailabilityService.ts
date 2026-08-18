import { apiClient } from './apiClient';

export interface CommercialAvailabilityUnit {
  id: string | number;
  name: string;
}

export interface CommercialAvailability {
  networkAvailable: boolean;
  unitOverride: boolean | null;
  commerciallyAvailable: boolean;
  source: 'network' | 'store_type' | 'unit';
  inherited: boolean;
  applicable: boolean;
}

interface DataResponse<T> { data: T }

interface ApiAvailability {
  network_available: boolean;
  unit_override: boolean | null;
  commercially_available: boolean;
  commercial_availability_source: CommercialAvailability['source'];
  inherited?: boolean;
  has_own_value?: boolean;
  applicable?: boolean;
}

function normalize(payload: ApiAvailability): CommercialAvailability {
  return {
    networkAvailable: payload.network_available,
    unitOverride: payload.unit_override,
    commerciallyAvailable: payload.commercially_available,
    source: payload.commercial_availability_source,
    inherited: payload.inherited ?? payload.has_own_value === false,
    applicable: payload.applicable ?? true,
  };
}

const endpoint = (itemId: string | number) =>
  `/api/company/catalog/items/${itemId}/commercial-availability`;

export const commercialAvailabilityService = {
  async listUnits() {
    const response = await apiClient.get<DataResponse<CommercialAvailabilityUnit[]> | CommercialAvailabilityUnit[]>('/api/me/units');
    return Array.isArray(response) ? response : response.data;
  },

  async get(itemId: string | number, unitId: string | number) {
    const response = await apiClient.get<DataResponse<ApiAvailability>>(
      `${endpoint(itemId)}?unit_id=${encodeURIComponent(String(unitId))}`,
    );
    return normalize(response.data);
  },

  async updateNetwork(itemId: string | number, commerciallyAvailable: boolean, unitId: string | number) {
    const response = await apiClient.put<DataResponse<ApiAvailability>>(endpoint(itemId), {
      unit_id: unitId,
      network_available: commerciallyAvailable,
    });
    return normalize(response.data);
  },

  async updateUnit(itemId: string | number, unitId: string | number, commerciallyAvailable: boolean) {
    const response = await apiClient.put<DataResponse<ApiAvailability>>(endpoint(itemId), {
      unit_id: unitId,
      unit_override: commerciallyAvailable,
    });
    return normalize(response.data);
  },

  async restoreUnit(itemId: string | number, unitId: string | number) {
    const response = await apiClient.delete<DataResponse<ApiAvailability>>(
      `${endpoint(itemId)}?unit_id=${encodeURIComponent(String(unitId))}`,
    );
    return normalize(response.data);
  },
};
