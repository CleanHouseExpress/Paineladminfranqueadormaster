export type ImplementationStatus = 'not_started' | 'in_progress' | 'delayed' | 'completed' | 'paused';

export type ImplementationTaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';

export type ImplementationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ImplementationChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface ImplementationTaskComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export type ImplementationTaskDocumentStatus = 'pending_approval' | 'approved' | 'rejected';

export interface ImplementationTaskDocument {
  id: string;
  taskId: string;
  fileName: string;
  originalName: string;
  mimeType?: string | null;
  extension?: string | null;
  sizeBytes: number;
  status: ImplementationTaskDocumentStatus;
  uploadedBy?: number | string | null;
  uploadedByName?: string | null;
  approvedBy?: number | string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface ImplementationHistoryItem {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface ImplementationTask {
  id: string;
  phaseId: string;
  name?: string;
  title: string;
  description: string;
  position?: number;
  status: ImplementationTaskStatus;
  priority: ImplementationPriority;
  responsibleUserId?: number | string | null;
  responsibleUserName?: string | null;
  assignee: string;
  startDate?: string | null;
  dueDate: string;
  completedAt?: string | null;
  dependsOnTaskIds?: string[];
  checklist?: ImplementationChecklistItem[];
  comments?: ImplementationTaskComment[];
  documents?: ImplementationTaskDocument[];
  history?: ImplementationHistoryItem[];
  files?: string[];
  dependencies?: string[];
  documentRequired?: boolean;
  trainingRequired?: boolean;
}

export interface ImplementationPhase {
  id: string;
  name?: string;
  title: string;
  description?: string | null;
  position?: number;
  order: number;
  status: ImplementationTaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  tasks: ImplementationTask[];
}

export interface ImplementationKpis {
  daysRemaining?: number;
  daysDelayed?: number;
  completedTasks?: number;
  totalTasks?: number;
  criticalPending?: number;
  documentsPending?: number;
  trainingsCompletePercent?: number;
  progressPercent?: number;
}

export interface UnitImplementation {
  id: string;
  unitId: number | string;
  unitName: string;
  city: string;
  state: string;
  brand: string;
  status: ImplementationStatus;
  responsibleUserId?: number | string | null;
  responsibleUserName?: string | null;
  consultant: string;
  templateId: string;
  plannedOpeningDate?: string | null;
  expectedOpeningDate: string;
  actualOpeningDate?: string | null;
  progressPercent?: number;
  currentPhaseId: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  phases: ImplementationPhase[];
  history?: ImplementationHistoryItem[];
  kpis?: ImplementationKpis;
}

export interface ImplementationTemplateTask {
  id: string;
  title: string;
  description: string;
  relativeDay: number;
  priority: ImplementationPriority;
  suggestedAssignee: string;
  dependencies?: string[];
  documentRequired?: boolean;
  trainingRequired?: boolean;
  checklist?: string[];
}

export interface ImplementationTemplatePhase {
  id: string;
  title: string;
  order: number;
  relativeStartDay: number;
  slaDays: number;
  tasks: ImplementationTemplateTask[];
}

export interface ImplementationTemplate {
  id: string;
  name: string;
  description: string;
  active: boolean;
  phases: ImplementationTemplatePhase[];
  createdAt: string;
  updatedAt: string;
}

export const IMPLEMENTATION_STATUS_LABELS: Record<ImplementationStatus, string> = {
  not_started: 'Nao iniciada',
  in_progress: 'Em andamento',
  delayed: 'Atrasada',
  completed: 'Concluida',
  paused: 'Pausada',
};

export const IMPLEMENTATION_TASK_STATUS_LABELS: Record<ImplementationTaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluida',
  blocked: 'Bloqueada',
  delayed: 'Atrasada',
};

export const IMPLEMENTATION_PRIORITY_LABELS: Record<ImplementationPriority, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
};
