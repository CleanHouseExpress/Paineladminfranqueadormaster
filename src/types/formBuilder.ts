export type FieldType =
  | 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'datetime'
  | 'email' | 'phone' | 'url' | 'checkbox' | 'select' | 'multiselect'
  | 'file' | 'image';

export type FieldOrigin = 'system' | 'custom';
export type FieldStatus = 'active' | 'inactive' | 'draft';
export type EntityStatus = 'active' | 'draft';
export type VersionStatus = 'draft' | 'published' | 'archived';
export type HistoryAction = 'created' | 'updated' | 'deleted' | 'published' | 'restored' | 'duplicated';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  color?: string;
  order: number;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FormField {
  id: string;
  entityId: string;
  name: string;       // internal snake_case name
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  required: boolean;
  unique: boolean;
  visible: boolean;
  origin: FieldOrigin;
  status: FieldStatus;
  options?: FieldOption[];
  validation?: FieldValidation;
  sectionId?: string;
  groupId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormSection {
  id: string;
  entityId: string;
  label: string;
  description?: string;
  order: number;
  collapsed?: boolean;
}

export interface FormGroup {
  id: string;
  entityId: string;
  sectionId: string;
  label: string;
  columns: 1 | 2 | 3;
  order: number;
}

export interface FormEntity {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  module: string;
  totalFields: number;
  customFields: number;
  status: EntityStatus;
  currentVersion: string;
  lastModified: string;
  lastModifiedBy: string;
}

export interface FormVersion {
  id: string;
  entityId: string;
  version: string;
  status: VersionStatus;
  changesCount: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
}

export interface HistoryEntry {
  id: string;
  entityId: string;
  fieldId?: string;
  fieldLabel?: string;
  user: string;
  userAvatar: string;
  action: HistoryAction;
  attribute?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  version?: string;
}

export interface ImpactSummary {
  entityId: string;
  affectedEntities: number;
  affectedForms: number;
  impactedUsers: number;
  impactedRecords: number;
  breakingChanges: string[];
  warnings: string[];
}

export interface FieldTypeDefinition {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
  category: 'text' | 'number' | 'date' | 'choice' | 'media' | 'contact';
  supportsOptions?: boolean;
  supportsValidation?: boolean;
}

export const FIELD_TYPE_DEFINITIONS: FieldTypeDefinition[] = [
  { type: 'text',        label: 'Texto',        icon: 'Type',        description: 'Campo de texto curto',              category: 'text',    supportsValidation: true },
  { type: 'textarea',    label: 'Texto Longo',  icon: 'AlignLeft',   description: 'Texto multilinha',                  category: 'text',    supportsValidation: true },
  { type: 'number',      label: 'Número',       icon: 'Hash',        description: 'Valor numérico inteiro ou decimal',  category: 'number',  supportsValidation: true },
  { type: 'currency',    label: 'Moeda',        icon: 'DollarSign',  description: 'Valor monetário formatado',          category: 'number',  supportsValidation: true },
  { type: 'date',        label: 'Data',         icon: 'Calendar',    description: 'Seletor de data',                   category: 'date' },
  { type: 'datetime',    label: 'Data e Hora',  icon: 'Clock',       description: 'Seletor de data e hora',            category: 'date' },
  { type: 'email',       label: 'E-mail',       icon: 'Mail',        description: 'Endereço de e-mail validado',       category: 'contact' },
  { type: 'phone',       label: 'Telefone',     icon: 'Phone',       description: 'Número de telefone',                category: 'contact' },
  { type: 'url',         label: 'URL',          icon: 'Link2',       description: 'Endereço web validado',             category: 'contact' },
  { type: 'checkbox',    label: 'Checkbox',     icon: 'ToggleLeft',  description: 'Verdadeiro ou falso',               category: 'choice' },
  { type: 'select',      label: 'Select',       icon: 'ChevronDown', description: 'Seleção única de opções',           category: 'choice',  supportsOptions: true },
  { type: 'multiselect', label: 'Multi Select', icon: 'ListChecks',  description: 'Múltiplas opções selecionáveis',    category: 'choice',  supportsOptions: true },
  { type: 'file',        label: 'Arquivo',      icon: 'Paperclip',   description: 'Upload de arquivos',                category: 'media' },
  { type: 'image',       label: 'Imagem',       icon: 'Image',       description: 'Upload de imagens',                 category: 'media' },
];
