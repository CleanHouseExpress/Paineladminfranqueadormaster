export type DocumentVisibility = 'interno' | 'portal_cliente' | 'portal_franqueado' | 'publico';
export type DocumentStatus = 'ativo' | 'arquivado' | 'rascunho';
export type DocumentFileType = 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'other';

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  color: string;       // hex color for the category
  icon: string;        // Lucide icon name
  active: boolean;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  visibility: DocumentVisibility;
  status: DocumentStatus;
  fileType: DocumentFileType;
  fileName: string;
  fileSize: number;          // bytes
  fileSizeFormatted: string; // "2.4 MB"
  unitId?: string;
  unitName?: string;
  clientId?: string;
  clientName?: string;
  userId?: string;
  userName?: string;
  createdBy: string;
  createdByAvatar: string;   // initials
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  tags?: string[];
}

export interface DocumentStats {
  total: number;
  active: number;
  categories: number;
  downloadsLast30Days: number;
  recentDocuments: Document[];
  topCategories: Array<{ id: string; name: string; count: number; color: string }>;
}

export const VISIBILITY_CONFIG: Record<DocumentVisibility, { label: string; color: string; bg: string }> = {
  interno:           { label: 'Interno',           color: '#64748B', bg: '#F8FAFC' },
  portal_cliente:    { label: 'Portal Cliente',    color: '#3B82F6', bg: '#EFF6FF' },
  portal_franqueado: { label: 'Portal Franqueado', color: '#6366F1', bg: '#EEF2FF' },
  publico:           { label: 'Público',           color: '#10B981', bg: '#ECFDF5' },
};

export const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  ativo:     { label: 'Ativo',     color: '#10B981', bg: '#ECFDF5' },
  arquivado: { label: 'Arquivado', color: '#94A3B8', bg: '#F1F5F9' },
  rascunho:  { label: 'Rascunho', color: '#F59E0B', bg: '#FFFBEB' },
};

export const FILE_TYPE_CONFIG: Record<DocumentFileType, { label: string; color: string; bg: string; icon: string }> = {
  pdf:   { label: 'PDF',   color: '#EF4444', bg: '#FEF2F2', icon: 'FileText' },
  docx:  { label: 'DOCX',  color: '#3B82F6', bg: '#EFF6FF', icon: 'FileText' },
  xlsx:  { label: 'XLSX',  color: '#10B981', bg: '#ECFDF5', icon: 'FileSpreadsheet' },
  png:   { label: 'PNG',   color: '#8B5CF6', bg: '#F5F3FF', icon: 'Image' },
  jpg:   { label: 'JPG',   color: '#EC4899', bg: '#FDF2F8', icon: 'Image' },
  other: { label: 'Outro', color: '#64748B', bg: '#F8FAFC', icon: 'File' },
};

export const DOCUMENT_PERMISSIONS = [
  'tenant.documents.view',
  'tenant.documents.upload',
  'tenant.documents.update',
  'tenant.documents.delete',
  'tenant.documents.archive',
  'tenant.documents.download',
  'tenant.documents.configure',
] as const;

export type DocumentPermission = typeof DOCUMENT_PERMISSIONS[number];
