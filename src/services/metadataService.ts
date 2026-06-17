import { apiClient } from './apiClient';
import type { CustomerFormSettings } from '../types/customerManagement';

interface DataResponse<T> {
  data: T;
}

export type EntityMetadata = CustomerFormSettings & {
  entity: string;
  description?: string | null;
  form_schema: CustomerFormSettings['fields'];
  table_schema: CustomerFormSettings['table_columns'];
  active?: boolean;
};

export const metadataService = {
  getEntity: async (entity: string) =>
    (await apiClient.get<DataResponse<EntityMetadata>>(`/api/metadata/${entity}`)).data,

  updateEntity: async (entity: string, payload: EntityMetadata) =>
    (await apiClient.put<DataResponse<EntityMetadata>>(`/api/metadata/${entity}`, payload)).data,
};
