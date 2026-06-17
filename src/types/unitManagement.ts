import type { CustomerFormSettings, CustomerTableColumn } from './customerManagement';
import type { DynamicFieldSchema } from './userManagement';

export interface Unit {
  id: number;
  name: string;
  code?: string | null;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  status: 'active' | 'inactive' | 'opening' | 'closed' | string;
  responsible_name?: string | null;
  responsible_email?: string | null;
  responsible_phone?: string | null;
  opening_date?: string | null;
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

export interface UnitsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UnitOption {
  value: number;
  label: string;
}

export interface UnitMetric {
  unit_id: number;
  unit_name: string;
  customers_count: number;
}

export type UnitPayload = Record<string, unknown>;
export type UnitMetadata = Omit<CustomerFormSettings, 'entity_key'> & {
  entity_key: 'units';
  fields: DynamicFieldSchema[];
  table_columns: CustomerTableColumn[];
};

export const DEFAULT_UNIT_METADATA: UnitMetadata = {
  entity_key: 'units',
  entity: 'units',
  singular_label: 'Unidade',
  plural_label: 'Unidades',
  description: 'Cadastro de unidades operacionais do tenant.',
  fields: [
    { key: 'name', label: 'Nome', type: 'text', field_type: 'text', required: true, visible: true, editable: true, order: 10, section: 'general' },
    { key: 'code', label: 'Codigo', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 20, section: 'general' },
    { key: 'document', label: 'CNPJ', type: 'document', field_type: 'document', required: false, visible: true, editable: true, order: 30, section: 'general' },
    { key: 'phone', label: 'Telefone', type: 'phone', field_type: 'phone', required: false, visible: true, editable: true, order: 40, section: 'general' },
    { key: 'email', label: 'E-mail', type: 'email', field_type: 'email', required: false, visible: true, editable: true, order: 50, section: 'general' },
    { key: 'status', label: 'Status', type: 'select', field_type: 'select', required: true, visible: true, editable: true, order: 60, section: 'operation', options: [
      { label: 'Ativa', value: 'active' },
      { label: 'Inativa', value: 'inactive' },
      { label: 'Em abertura', value: 'opening' },
      { label: 'Fechada', value: 'closed' },
    ] },
    { key: 'responsible_name', label: 'Responsavel', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 70, section: 'responsible' },
    { key: 'responsible_email', label: 'E-mail do responsavel', type: 'email', field_type: 'email', required: false, visible: true, editable: true, order: 80, section: 'responsible' },
    { key: 'responsible_phone', label: 'Telefone do responsavel', type: 'phone', field_type: 'phone', required: false, visible: true, editable: true, order: 90, section: 'responsible' },
    { key: 'opening_date', label: 'Data de abertura', type: 'date', field_type: 'date', required: false, visible: true, editable: true, order: 100, section: 'operation' },
    { key: 'address_city', label: 'Cidade', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 160, section: 'address' },
    { key: 'address_state', label: 'Estado', type: 'text', field_type: 'text', required: false, visible: true, editable: true, order: 170, section: 'address' },
    { key: 'notes', label: 'Observacoes', type: 'textarea', field_type: 'textarea', required: false, visible: true, editable: true, order: 180, section: 'notes' },
  ],
  table_columns: [
    { key: 'name', label: 'Nome', visible: true, sortable: true, order: 10 },
    { key: 'code', label: 'Codigo', visible: true, sortable: true, order: 20 },
    { key: 'status', label: 'Status', visible: true, sortable: false, order: 60 },
    { key: 'responsible_name', label: 'Responsavel', visible: true, sortable: true, order: 70 },
    { key: 'phone', label: 'Telefone', visible: true, sortable: true, order: 40 },
    { key: 'address_city', label: 'Cidade', visible: true, sortable: true, order: 160 },
    { key: 'address_state', label: 'Estado', visible: true, sortable: true, order: 170 },
    { key: 'opening_date', label: 'Data de abertura', visible: true, sortable: true, order: 100 },
  ],
};
