import type { DynamicFieldSchema } from './userManagement';

export interface Customer {
  id: number;
  name: string;
  unit_id?: number | null;
  unit_name?: string | null;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  birth_date?: string | null;
  address_zipcode?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_district?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CustomerTableColumn {
  key: string;
  label: string;
  visible?: boolean;
  order?: number;
}

export interface CustomerFormSettings {
  entity_key: 'customers';
  entity?: string;
  singular_label: string;
  plural_label: string;
  description?: string | null;
  fields: DynamicFieldSchema[];
  table_columns: CustomerTableColumn[];
  form_schema?: DynamicFieldSchema[];
  table_schema?: CustomerTableColumn[];
  active?: boolean;
}

export interface CustomersMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type CustomerPayload = Record<string, unknown>;

export const DEFAULT_CUSTOMER_SETTINGS: CustomerFormSettings = {
  entity_key: 'customers',
  singular_label: 'Cliente',
  plural_label: 'Clientes',
  fields: [
    { key: 'name', label: 'Nome', type: 'text', required: true, visible: true, editable: true, order: 10, section: 'basic' },
    { key: 'unit_id', label: 'Unidade', type: 'select', required: false, visible: true, editable: true, order: 15, section: 'basic', options: [], options_source: '/api/company/units/options' },
    { key: 'phone', label: 'Telefone', type: 'phone', required: true, visible: true, editable: true, order: 20, section: 'basic' },
    { key: 'email', label: 'E-mail', type: 'email', required: false, visible: true, editable: true, order: 30, section: 'basic' },
    { key: 'document', label: 'CPF/CNPJ', type: 'text', required: false, visible: true, editable: true, order: 40, section: 'basic' },
    { key: 'birth_date', label: 'Data de nascimento', type: 'date', required: false, visible: true, editable: true, order: 50, section: 'basic' },
    { key: 'address_zipcode', label: 'CEP', type: 'text', required: false, visible: true, editable: true, order: 60, section: 'address' },
    { key: 'address_street', label: 'Rua', type: 'text', required: false, visible: true, editable: true, order: 70, section: 'address' },
    { key: 'address_number', label: 'Numero', type: 'text', required: false, visible: true, editable: true, order: 80, section: 'address' },
    { key: 'address_complement', label: 'Complemento', type: 'text', required: false, visible: true, editable: true, order: 90, section: 'address' },
    { key: 'address_district', label: 'Bairro', type: 'text', required: false, visible: true, editable: true, order: 100, section: 'address' },
    { key: 'address_city', label: 'Cidade', type: 'text', required: false, visible: true, editable: true, order: 110, section: 'address' },
    { key: 'address_state', label: 'Estado', type: 'text', required: false, visible: true, editable: true, order: 120, section: 'address' },
    { key: 'notes', label: 'Observacoes', type: 'textarea', required: false, visible: true, editable: true, order: 130, section: 'notes' },
  ],
  table_columns: [
    { key: 'name', label: 'Nome', visible: true, order: 10 },
    { key: 'unit_name', label: 'Unidade', visible: true, order: 15 },
    { key: 'phone', label: 'Telefone', visible: true, order: 20 },
    { key: 'email', label: 'E-mail', visible: true, order: 30 },
    { key: 'document', label: 'CPF/CNPJ', visible: true, order: 40 },
  ],
};
