export type ContractStatus = 'draft' | 'active' | 'expired' | 'cancelled';

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, {
  label: string; color: string; bg: string;
}> = {
  draft:     { label: 'Rascunho',  color: '#94A3B8', bg: '#F1F5F9' },
  active:    { label: 'Ativo',     color: '#10B981', bg: '#ECFDF5' },
  expired:   { label: 'Vencido',   color: '#EF4444', bg: '#FEF2F2' },
  cancelled: { label: 'Cancelado', color: '#64748B', bg: '#F8FAFC' },
};

export interface ContractDocument {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx';
  fileSize: number;
  fileSizeFormatted: string;
  uploadedAt: string;
}

export interface Contract {
  id: string;
  title: string;
  number: string;           // e.g. "CTR-2024-001"
  clientId: string;
  clientName: string;
  clientAvatar: string;     // initials
  unitId?: string;
  unitName?: string;
  unitCode?: string;        // e.g. "BV-001"
  documentId?: string;
  document?: ContractDocument;
  status: ContractStatus;
  startDate: string;        // ISO date
  endDate: string;          // ISO date
  notes?: string;
  createdBy: string;
  createdByAvatar: string;
  createdAt: string;
  updatedAt: string;
  // Derived
  daysRemaining?: number;   // negative = already expired
  isExpiringSoon?: boolean; // within 30 days
}

export interface ContractStats {
  total: number;
  active: number;
  draft: number;
  expired: number;
  cancelled: number;
  expiringSoon: number;     // active contracts expiring within 30 days
  recentContracts: Contract[];
  expiringContracts: Contract[];
}

export interface ContractHistoryEntry {
  id: string;
  contractId: string;
  action: 'created' | 'activated' | 'cancelled' | 'expired' | 'document_attached' | 'updated' | 'renewed';
  user: string;
  userAvatar: string;
  description: string;
  timestamp: string;
}

export const CONTRACT_PERMISSIONS = [
  'tenant.contracts.view',
  'tenant.contracts.create',
  'tenant.contracts.update',
  'tenant.contracts.delete',
  'tenant.contracts.activate',
  'tenant.contracts.cancel',
  'tenant.contracts.configure',
] as const;

export type ContractPermission = typeof CONTRACT_PERMISSIONS[number];
