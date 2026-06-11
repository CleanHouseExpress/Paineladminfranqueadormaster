import { apiClient } from './apiClient';

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  [key: string]: unknown;
}

export interface AuthCompany {
  id: string | number;
  name: string;
  domain?: string;
  plan?: string;
  whiteLabel?: Record<string, unknown>;
  white_label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AuthModule {
  id?: string | number;
  moduleId?: string;
  module_id?: string;
  slug?: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
}

export interface AuthRole {
  id: string | number;
  name: string;
  [key: string]: unknown;
}

export type AuthPermission = string | {
  id?: string | number;
  name?: string;
  key?: string;
  slug?: string;
  [key: string]: unknown;
};

export interface LoginResponse {
  token?: string;
  access_token?: string;
  user?: AuthUser;
  data?: {
    token?: string;
    access_token?: string;
    user?: AuthUser;
  };
  [key: string]: unknown;
}

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/api/company/login', { email, password }),

  logout: () =>
    apiClient.post<void>('/api/logout'),

  me: () =>
    apiClient.get<AuthUser | { data: AuthUser }>('/api/me'),

  getMeCompany: () =>
    apiClient.get<AuthCompany | { data: AuthCompany }>('/api/me/company'),

  getMeModules: () =>
    apiClient.get<AuthModule[] | { data: AuthModule[] }>('/api/me/modules'),

  getMeRoles: () =>
    apiClient.get<AuthRole[] | { data: AuthRole[] }>('/api/me/roles'),

  getMePermissions: () =>
    apiClient.get<AuthPermission[] | { data: AuthPermission[] }>('/api/me/permissions'),
};
