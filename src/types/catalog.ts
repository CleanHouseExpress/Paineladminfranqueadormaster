// The 7 item types — each unlocks different form fields
export type CatalogItemType =
  | 'product'      // Produto — has stock, barcode, weight
  | 'service'      // Serviço — has duration, professional, schedule
  | 'subscription' // Assinatura — has billing cycle, recurrence, trial
  | 'course'       // Curso — has workload, certificate, linked training
  | 'procedure'    // Procedimento — has duration, professional, equipment
  | 'plan'         // Plano — has cycle, validity, included items
  | 'custom';      // Personalizado — basic fields only

export const CATALOG_TYPE_CONFIG: Record<CatalogItemType, {
  label: string; color: string; bg: string; icon: string;
}> = {
  product:      { label: 'Produto',       color: '#3B82F6', bg: '#EFF6FF',  icon: 'Package' },
  service:      { label: 'Serviço',       color: '#10B981', bg: '#ECFDF5',  icon: 'Briefcase' },
  subscription: { label: 'Assinatura',    color: '#8B5CF6', bg: '#F5F3FF',  icon: 'RefreshCw' },
  course:       { label: 'Curso',         color: '#F59E0B', bg: '#FFFBEB',  icon: 'GraduationCap' },
  procedure:    { label: 'Procedimento',  color: '#EC4899', bg: '#FDF2F8',  icon: 'Stethoscope' },
  plan:         { label: 'Plano',         color: '#6366F1', bg: '#EEF2FF',  icon: 'Star' },
  custom:       { label: 'Personalizado', color: '#64748B', bg: '#F8FAFC',  icon: 'Boxes' },
};

export type CatalogItemStatus = 'active' | 'inactive' | 'archived';

export const CATALOG_STATUS_CONFIG: Record<CatalogItemStatus, {
  label: string; color: string; bg: string;
}> = {
  active:   { label: 'Ativo',     color: '#10B981', bg: '#ECFDF5' },
  inactive: { label: 'Inativo',   color: '#F59E0B', bg: '#FFFBEB' },
  archived: { label: 'Arquivado', color: '#64748B', bg: '#F8FAFC' },
};

// Type-specific extra fields stored as a JSON blob
export interface ProductFields {
  controlaEstoque?: boolean;
  estoqueMinimo?: number;
  custo?: number;
  codigoBarras?: string;
  pesoGramas?: number;
  dimensoes?: string; // "LxAxP cm"
}

export interface ServiceFields {
  duracaoMinutos?: number;
  exigeProfissional?: boolean;
  exigeAgenda?: boolean;
  profissionalNecessario?: string;
}

export interface SubscriptionFields {
  cicloCobranca?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  intervaloRecorrencia?: number;
  periodoTeste?: number; // days
}

export interface CourseFields {
  cargaHoraria?: number; // hours
  certificadoDisponivel?: boolean;
  treinamentoRelacionadoId?: string;
  treinamentoRelacionadoNome?: string;
}

export interface ProcedureFields {
  duracaoMinutos?: number;
  exigeProfissional?: boolean;
  equipamentoNecessario?: string;
}

export interface PlanFields {
  cicloCobranca?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  validade?: number; // months
  itensIncluidos?: string[];
}

export type CatalogItemTypeFields =
  | { type: 'product';      fields: ProductFields }
  | { type: 'service';      fields: ServiceFields }
  | { type: 'subscription'; fields: SubscriptionFields }
  | { type: 'course';       fields: CourseFields }
  | { type: 'procedure';    fields: ProcedureFields }
  | { type: 'plan';         fields: PlanFields }
  | { type: 'custom';       fields: Record<string, unknown> };

// Custom metadata fields configured by the tenant via Metadata Engine
export interface CatalogMetadataField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'currency';
  value: unknown;
  options?: Array<{ label: string; value: string }>;
}

export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  type: CatalogItemType;
  status: CatalogItemStatus;
  price: number;               // base price in BRL
  sku?: string;                // SKU or internal code
  unit?: string;               // "un", "h", "mês", "sessão", etc.
  typeFields: Record<string, unknown>; // type-specific extra fields
  metadata: CatalogMetadataField[];    // tenant custom fields
  imageUrl?: string;
  createdBy: string;
  createdByAvatar: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogStats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  avgPrice: number;
  byType: Array<{ type: CatalogItemType; count: number; label: string; color: string }>;
  recentItems: CatalogItem[];
}

// Labels from Metadata Engine — tenant can rename the module
export interface CatalogLabels {
  singular: string;    // e.g. "Produto", "Serviço", "Item"
  plural: string;      // e.g. "Produtos", "Serviços", "Itens"
  newItem: string;     // e.g. "Novo Produto"
  moduleTitle: string; // e.g. "Catálogo de Produtos"
}

export interface CatalogMetadataConfig {
  labels: CatalogLabels;
  formSchema: Array<{
    key: string;
    label: string;
    type: CatalogMetadataField['type'];
    required: boolean;
    visible: boolean;
    editable: boolean;
    order: number;
    section?: string;
    options?: Array<{ label: string; value: string }>;
  }>;
  tableSchema: Array<{
    key: string;
    label: string;
    visible: boolean;
    sortable: boolean;
    order: number;
  }>;
  enabledTypes: CatalogItemType[];
  description?: string;
  active: boolean;
}

export const DEFAULT_CATALOG_LABELS: CatalogLabels = {
  singular: 'Item',
  plural: 'Itens',
  newItem: 'Novo Item',
  moduleTitle: 'Catálogo Comercial',
};

// Default custom metadata schema for catalog items
const options = (values: string[]) => values.map(value => ({ label: value, value }));

export const DEFAULT_CATALOG_METADATA_SCHEMA: Omit<CatalogMetadataField, 'value'>[] = [
  { key: 'especialidade', label: 'Especialidade',      type: 'text' },
  { key: 'cor',           label: 'Cor',                type: 'text' },
  { key: 'tamanho',       label: 'Tamanho',            type: 'select', options: options(['PP', 'P', 'M', 'G', 'GG']) },
  { key: 'nivel',         label: 'Nível',              type: 'select', options: options(['Básico', 'Intermediário', 'Avançado']) },
  { key: 'categoria',     label: 'Categoria Interna',  type: 'text' },
  { key: 'tags',          label: 'Tags',               type: 'text' },
  { key: 'observacoes',   label: 'Observações',        type: 'textarea' },
];

export const CATALOG_PERMISSIONS = [
  'tenant.catalog.view',
  'tenant.catalog.create',
  'tenant.catalog.update',
  'tenant.catalog.delete',
  'tenant.catalog.archive',
  'tenant.catalog.configure',
] as const;

export type CatalogPermission = typeof CATALOG_PERMISSIONS[number];
