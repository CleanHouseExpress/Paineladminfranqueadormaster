export type OnboardingProgramStatus = 'draft' | 'active' | 'archived';
export type OnboardingProgramVersionStatus = 'draft' | 'published' | 'archived';

export interface OnboardingProgramStepSla {
  days: number;
  startsFrom: string;
  escalationPolicy: Record<string, unknown>;
}

export interface OnboardingProgramStepActivity {
  id: string;
  clientId: string;
  stepId: string;
  name: string;
  description: string;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  defaultResponsibleRole: string;
  defaultDurationDays: number;
  relativeStartDays: number;
  requiresDocument: boolean;
  requiresTraining: boolean;
  checklistItems: string[];
}

export interface OnboardingProgramStep {
  id: string;
  clientId: string;
  name: string;
  description: string;
  category: string;
  position: number;
  responsibleRole: string;
  isRequired: boolean;
  condition: Record<string, unknown>;
  completionCriteria: Record<string, unknown>;
  documentRequirements: Array<Record<string, unknown>>;
  checklistTemplateId: number | null;
  dependencies: string[];
  sla: OnboardingProgramStepSla;
  activities: OnboardingProgramStepActivity[];
}

export interface OnboardingProgramVersion {
  id: string;
  programId: string;
  version: number;
  status: OnboardingProgramVersionStatus;
  changeNotes: string;
  duplicatedFromVersionId: string | null;
  publishedAt: string | null;
  steps: OnboardingProgramStep[];
  roleAssignments: Array<{
    id: string;
    stepId: string | null;
    roleKey: string;
    userId: number | null;
    isRequired: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingProgram {
  id: string;
  name: string;
  description: string;
  category: string;
  status: OnboardingProgramStatus;
  versionsCount: number;
  publishedVersionsCount: number;
  latestVersion: OnboardingProgramVersion | null;
  versions: OnboardingProgramVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingProgramsMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface OnboardingProgramsResult {
  data: OnboardingProgram[];
  meta: OnboardingProgramsMeta;
}

export const ONBOARDING_PROGRAM_STATUS_LABELS: Record<OnboardingProgramStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};

export const ONBOARDING_PROGRAM_VERSION_STATUS_LABELS: Record<OnboardingProgramVersionStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};
