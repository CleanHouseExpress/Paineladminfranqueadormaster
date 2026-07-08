export type OnboardingImplementationStatus =
  | 'planning'
  | 'created'
  | 'not_started'
  | 'in_progress'
  | 'delayed'
  | 'completed'
  | 'cancelled'
  | 'archived';

export interface OnboardingImplementationUnit {
  id: string;
  name: string;
  code: string;
  status: string;
  addressCity: string;
  addressState: string;
}

export interface OnboardingImplementationPhase {
  id: string;
  programStepId: string;
  name: string;
  description: string;
  position: number;
  responsibleRole: string;
  responsibleUserId: number | null;
  isRequired: boolean;
  slaDays: number;
  dependsOnPhaseIds: string[];
  condition: Record<string, unknown>;
  completionCriteria: Record<string, unknown>;
  documentRequirements: Array<Record<string, unknown>>;
  checklistTemplateId: number | null;
  status: string;
  dueDate: string | null;
}

export interface OnboardingGuidedSetupStep {
  id: string;
  title: string;
  description: string;
  position: number;
  status: string;
  isRequired: boolean;
  canComplete: boolean;
  canSkip: boolean;
  blockedByPhaseIds: string[];
  moduleOwner: string;
  moduleRoute: string;
  ctaLabel: string;
  helpText: string;
}

export interface OnboardingGuidedSetup {
  summary: {
    title: string;
    description: string;
    progressPercent: number;
    completedRequiredSteps: number;
    totalRequiredSteps: number;
    firstValueReached: boolean;
  };
  nextAction: OnboardingGuidedSetupStep | null;
  steps: OnboardingGuidedSetupStep[];
}

export interface OnboardingImplementation {
  id: string;
  tenantId: string;
  unitId: string;
  unit: OnboardingImplementationUnit | null;
  programId: string;
  program: {
    id: string;
    name: string;
    category: string;
    status: string;
  } | null;
  programVersionId: string;
  programVersion: {
    id: string;
    version: number;
    status: string;
  } | null;
  status: OnboardingImplementationStatus;
  currentPhaseId: string | null;
  currentPhase: {
    id: string;
    name: string;
    position: number;
    status: string;
  } | null;
  responsibleUserId: number | null;
  responsible: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdBy: number | null;
  plannedOpeningDate: string | null;
  actualOpeningDate: string | null;
  progressPercent: number;
  stepsCount: number;
  guidedSetup: OnboardingGuidedSetup | null;
  phases: OnboardingImplementationPhase[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingImplementationsMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface OnboardingImplementationsResult {
  data: OnboardingImplementation[];
  meta: OnboardingImplementationsMeta;
}

export interface OnboardingImplementationCreatePayload {
  unitId: string;
  programVersionId: string;
  responsibleUserId?: number | null;
  plannedOpeningDate?: string | null;
}

export interface OnboardingUnitOption {
  value: string;
  label: string;
}

export const ONBOARDING_IMPLEMENTATION_STATUS_LABELS: Record<OnboardingImplementationStatus, string> = {
  planning: 'Planejamento',
  created: 'Criada',
  not_started: 'Nao iniciada',
  in_progress: 'Em andamento',
  delayed: 'Atrasada',
  completed: 'Concluida',
  cancelled: 'Cancelada',
  archived: 'Arquivada',
};
