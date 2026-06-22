export type TrainingStatus = 'draft' | 'published' | 'archived';

export const TRAINING_STATUS_CONFIG: Record<TrainingStatus, {
  label: string; color: string; bg: string;
}> = {
  draft:     { label: 'Rascunho',   color: '#94A3B8', bg: '#F1F5F9' },
  published: { label: 'Publicado',  color: '#10B981', bg: '#ECFDF5' },
  archived:  { label: 'Arquivado',  color: '#64748B', bg: '#F8FAFC' },
};

export type TrainingCategory =
  | 'operacional' | 'financeiro' | 'atendimento' | 'compliance'
  | 'seguranca' | 'lideranca' | 'tecnico' | 'comercial';

export const TRAINING_CATEGORY_CONFIG: Record<TrainingCategory, {
  label: string; color: string; bg: string;
}> = {
  operacional:  { label: 'Operacional',  color: '#3B82F6', bg: '#EFF6FF' },
  financeiro:   { label: 'Financeiro',   color: '#10B981', bg: '#ECFDF5' },
  atendimento:  { label: 'Atendimento',  color: '#6366F1', bg: '#EEF2FF' },
  compliance:   { label: 'Compliance',   color: '#F59E0B', bg: '#FFFBEB' },
  seguranca:    { label: 'Segurança',    color: '#EF4444', bg: '#FEF2F2' },
  lideranca:    { label: 'Liderança',    color: '#8B5CF6', bg: '#F5F3FF' },
  tecnico:      { label: 'Técnico',      color: '#06B6D4', bg: '#ECFEFF' },
  comercial:    { label: 'Comercial',    color: '#EC4899', bg: '#FDF2F8' },
};

export interface TrainingDocument {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'mp4';
  fileSize: number;
  fileSizeFormatted: string;
  uploadedAt: string;
}

export interface TrainingAssignment {
  id: string;
  trainingId: string;
  type: 'user' | 'unit';
  targetId: string;
  targetName: string;
  targetAvatar?: string;  // initials for users
  assignedAt: string;
  assignedBy: string;
}

export type UserProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface UserProgress {
  userId: string;
  userName: string;
  userAvatar: string;
  unitName: string;
  status: UserProgressStatus;
  progressPercent: number; // 0–100
  completedAt?: string;
  lastAccessedAt?: string;
}

export interface Training {
  id: string;
  title: string;
  description?: string;
  category: TrainingCategory;
  status: TrainingStatus;
  mandatory: boolean;
  durationMinutes: number;
  document?: TrainingDocument;
  documentId?: string;
  createdBy: string;
  createdByAvatar: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Aggregates (computed)
  assignedUsers: number;
  assignedUnits: number;
  completedUsers: number;
  avgProgress: number; // 0–100
}

export interface TrainingStats {
  total: number;
  published: number;
  draft: number;
  mandatory: number;
  avgProgress: number;
  recentTrainings: Training[];
  mandatoryTrainings: Training[];
  topTrainings: Training[];    // most accessed/completed
}

export const TRAINING_PERMISSIONS = [
  'tenant.trainings.view',
  'tenant.trainings.create',
  'tenant.trainings.update',
  'tenant.trainings.delete',
  'tenant.trainings.publish',
  'tenant.trainings.archive',
  'tenant.trainings.assign',
  'tenant.trainings.complete',
  'tenant.trainings.configure',
] as const;

export type TrainingPermission = typeof TRAINING_PERMISSIONS[number];
