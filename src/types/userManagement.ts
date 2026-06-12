export interface TenantRole {
  id: number;
  name: string;
  slug: string;
  scope?: string;
}

export interface TenantUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
  status: 'active' | 'inactive' | string;
  last_login_at?: string | null;
  roles: TenantRole[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TenantUsersMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TenantUserPayload {
  name: string;
  email: string;
  password?: string;
  roles: number[];
  active?: boolean;
}

export interface DynamicFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface DynamicFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'boolean' | 'multiselect' | 'textarea' | 'date' | 'phone';
  required?: boolean;
  visible?: boolean;
  editable?: boolean;
  order?: number;
  section?: string;
  placeholder?: string;
  options?: DynamicFieldOption[];
}

export interface DynamicTableColumnSchema {
  key: keyof TenantUser | 'roles';
  label: string;
  type?: 'text' | 'status' | 'roles' | 'datetime';
}

// Schema default local. Sera substituido futuramente pelo Metadata Engine.
export const USER_FORM_SCHEMA: DynamicFieldSchema[] = [
  {
    key: 'name',
    label: 'Nome',
    type: 'text',
    required: true,
    placeholder: 'Nome completo',
  },
  {
    key: 'email',
    label: 'E-mail',
    type: 'email',
    required: true,
    placeholder: 'usuario@empresa.com',
  },
  {
    key: 'password',
    label: 'Senha inicial',
    type: 'password',
    required: true,
    placeholder: 'Minimo 8 caracteres',
  },
  {
    key: 'roles',
    label: 'Perfis',
    type: 'multiselect',
    required: true,
    options: [],
  },
  {
    key: 'active',
    label: 'Usuario ativo',
    type: 'boolean',
  },
];

// Schema default local. Sera substituido futuramente pelo Metadata Engine.
export const USER_TABLE_SCHEMA: DynamicTableColumnSchema[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'roles', label: 'Perfis', type: 'roles' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'last_login_at', label: 'Ultimo acesso', type: 'datetime' },
];
