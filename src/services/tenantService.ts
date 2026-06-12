import { apiClient } from './apiClient';
import type { TenantConfig } from '../types';

export type TenantCurrentResponse = Partial<TenantConfig> | {
  data?: Partial<TenantConfig>;
  tenant?: Partial<TenantConfig> & Record<string, unknown>;
  white_label?: Partial<TenantConfig['whiteLabel']>;
  enabled_module_ids?: string[];
  pending_module_ids?: string[];
  blocked_module_ids?: string[];
  menu_config?: TenantConfig['menuConfig'];
};

export const tenantService = {
  current: () =>
    apiClient.get<TenantCurrentResponse>('/api/tenant/current'),
};
