import { apiClient, ApiError, getApiErrorMessage } from './apiClient';
import type {
  OnboardingGuidedSetup,
  OnboardingGuidedSetupStep,
  OnboardingImplementation,
  OnboardingImplementationCreatePayload,
  OnboardingImplementationPhase,
  OnboardingImplementationStatus,
  OnboardingImplementationsResult,
  OnboardingUnitOption,
} from '../types/onboardingImplementation';

type ApiRecord = Record<string, unknown>;

function recordValue(value: unknown): ApiRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : {};
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function boolValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function idValue(value: unknown, fallback = '') {
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  return fallback;
}

function unwrapData(value: unknown): unknown {
  const record = recordValue(value);
  return 'data' in record ? record.data : value;
}

function mapStatus(value: unknown): OnboardingImplementationStatus {
  if (
    value === 'planning'
    || value === 'created'
    || value === 'not_started'
    || value === 'in_progress'
    || value === 'delayed'
    || value === 'completed'
    || value === 'cancelled'
    || value === 'archived'
  ) return value;

  return 'planning';
}

function mapPhase(value: unknown): OnboardingImplementationPhase {
  const record = recordValue(value);

  return {
    id: idValue(record.id),
    programStepId: idValue(record.program_step_id ?? record.programStepId),
    name: stringValue(record.name, 'Etapa'),
    description: stringValue(record.description),
    position: numberValue(record.position, 0),
    responsibleRole: stringValue(record.responsible_role ?? record.responsibleRole),
    responsibleUserId: typeof record.responsible_user_id === 'number' ? record.responsible_user_id : null,
    isRequired: boolValue(record.is_required ?? record.isRequired, true),
    slaDays: numberValue(record.sla_days ?? record.slaDays),
    dependsOnPhaseIds: arrayValue<string | number>(record.depends_on_phase_ids ?? record.dependsOnPhaseIds).map(String),
    condition: recordValue(record.condition),
    completionCriteria: recordValue(record.completion_criteria ?? record.completionCriteria),
    documentRequirements: arrayValue<Record<string, unknown>>(record.document_requirements ?? record.documentRequirements),
    checklistTemplateId: typeof record.checklist_template_id === 'number' ? record.checklist_template_id : null,
    status: stringValue(record.status, 'pending'),
    dueDate: stringValue(record.due_date ?? record.dueDate) || null,
  };
}

function mapGuidedStep(value: unknown): OnboardingGuidedSetupStep {
  const record = recordValue(value);

  return {
    id: idValue(record.id),
    title: stringValue(record.title, 'Proximo passo'),
    description: stringValue(record.description),
    position: numberValue(record.position),
    status: stringValue(record.status, 'pending'),
    isRequired: boolValue(record.is_required ?? record.isRequired, true),
    canComplete: boolValue(record.can_complete ?? record.canComplete),
    canSkip: boolValue(record.can_skip ?? record.canSkip),
    blockedByPhaseIds: arrayValue<string | number>(record.blocked_by_phase_ids ?? record.blockedByPhaseIds).map(String),
    moduleOwner: stringValue(record.module_owner ?? record.moduleOwner, 'onboarding'),
    moduleRoute: stringValue(record.module_route ?? record.moduleRoute, '/onboarding/implementations'),
    ctaLabel: stringValue(record.cta_label ?? record.ctaLabel, 'Continuar setup'),
    helpText: stringValue(record.help_text ?? record.helpText),
  };
}

function mapGuidedSetup(value: unknown): OnboardingGuidedSetup | null {
  const record = recordValue(value);
  if (Object.keys(record).length === 0) return null;
  const summary = recordValue(record.summary);
  const nextAction = record.next_action ?? record.nextAction;

  return {
    summary: {
      title: stringValue(summary.title, 'Setup guiado'),
      description: stringValue(summary.description),
      progressPercent: numberValue(summary.progress_percent ?? summary.progressPercent),
      completedRequiredSteps: numberValue(summary.completed_required_steps ?? summary.completedRequiredSteps),
      totalRequiredSteps: numberValue(summary.total_required_steps ?? summary.totalRequiredSteps),
      firstValueReached: boolValue(summary.first_value_reached ?? summary.firstValueReached),
    },
    nextAction: nextAction ? mapGuidedStep(nextAction) : null,
    steps: arrayValue(record.steps).map(mapGuidedStep),
  };
}

function mapImplementation(value: unknown): OnboardingImplementation {
  const record = recordValue(unwrapData(value));
  const unit = recordValue(record.unit);
  const program = recordValue(record.program);
  const version = recordValue(record.program_version ?? record.programVersion);
  const currentPhase = recordValue(record.current_phase ?? record.currentPhase);
  const responsible = recordValue(record.responsible);

  return {
    id: idValue(record.id),
    tenantId: idValue(record.tenant_id ?? record.tenantId),
    unitId: idValue(record.unit_id ?? record.unitId),
    unit: Object.keys(unit).length > 0 ? {
      id: idValue(unit.id),
      name: stringValue(unit.name, 'Unidade'),
      code: stringValue(unit.code),
      status: stringValue(unit.status),
      addressCity: stringValue(unit.address_city ?? unit.addressCity),
      addressState: stringValue(unit.address_state ?? unit.addressState),
    } : null,
    programId: idValue(record.program_id ?? record.programId),
    program: Object.keys(program).length > 0 ? {
      id: idValue(program.id),
      name: stringValue(program.name, 'Programa'),
      category: stringValue(program.category),
      status: stringValue(program.status),
    } : null,
    programVersionId: idValue(record.program_version_id ?? record.programVersionId),
    programVersion: Object.keys(version).length > 0 ? {
      id: idValue(version.id),
      version: numberValue(version.version, 1),
      status: stringValue(version.status),
    } : null,
    status: mapStatus(record.status),
    currentPhaseId: idValue(record.current_phase_id ?? record.currentPhaseId) || null,
    currentPhase: Object.keys(currentPhase).length > 0 ? {
      id: idValue(currentPhase.id),
      name: stringValue(currentPhase.name),
      position: numberValue(currentPhase.position),
      status: stringValue(currentPhase.status),
    } : null,
    responsibleUserId: typeof record.responsible_user_id === 'number' ? record.responsible_user_id : null,
    responsible: Object.keys(responsible).length > 0 ? {
      id: numberValue(responsible.id),
      name: stringValue(responsible.name),
      email: stringValue(responsible.email),
    } : null,
    createdBy: typeof record.created_by === 'number' ? record.created_by : null,
    plannedOpeningDate: stringValue(record.planned_opening_date ?? record.plannedOpeningDate) || null,
    actualOpeningDate: stringValue(record.actual_opening_date ?? record.actualOpeningDate) || null,
    progressPercent: numberValue(record.progress_percent ?? record.progressPercent),
    stepsCount: numberValue(record.steps_count ?? record.stepsCount),
    guidedSetup: mapGuidedSetup(record.guided_setup ?? record.guidedSetup),
    phases: arrayValue(record.phases).map(mapPhase),
    archivedAt: stringValue(record.archived_at ?? record.archivedAt) || null,
    createdAt: stringValue(record.created_at ?? record.createdAt),
    updatedAt: stringValue(record.updated_at ?? record.updatedAt),
  };
}

function queryString(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

function optionFromRecord(value: unknown): OnboardingUnitOption {
  const record = recordValue(value);
  return {
    value: idValue(record.value ?? record.id),
    label: stringValue(record.label ?? record.name, 'Unidade'),
  };
}

export const onboardingImplementationService = {
  async list(filters: { search?: string; status?: string; program_id?: string; unit_id?: string } = {}): Promise<OnboardingImplementationsResult> {
    const response = recordValue(await apiClient.get<unknown>(`/api/tenant/onboarding/implementations${queryString(filters)}`, { expireSessionOnUnauthorized: false }));
    const meta = recordValue(response.meta);

    return {
      data: arrayValue(response.data).map(mapImplementation),
      meta: {
        currentPage: numberValue(meta.current_page ?? meta.currentPage, 1),
        lastPage: numberValue(meta.last_page ?? meta.lastPage, 1),
        perPage: numberValue(meta.per_page ?? meta.perPage, 15),
        total: numberValue(meta.total, 0),
      },
    };
  },

  async get(id: string): Promise<OnboardingImplementation> {
    return mapImplementation(await apiClient.get(`/api/tenant/onboarding/implementations/${id}`, { expireSessionOnUnauthorized: false }));
  },

  async create(payload: OnboardingImplementationCreatePayload): Promise<OnboardingImplementation> {
    return mapImplementation(await apiClient.post('/api/tenant/onboarding/implementations', {
      unit_id: payload.unitId,
      program_version_id: payload.programVersionId,
      responsible_user_id: payload.responsibleUserId ?? null,
      planned_opening_date: payload.plannedOpeningDate || null,
    }, { expireSessionOnUnauthorized: false }));
  },

  async start(id: string): Promise<OnboardingImplementation> {
    return mapImplementation(await apiClient.post(`/api/tenant/onboarding/implementations/${id}/start`, {}, { expireSessionOnUnauthorized: false }));
  },

  async guidedSetup(id: string): Promise<OnboardingGuidedSetup> {
    return mapGuidedSetup(unwrapData(await apiClient.get(`/api/tenant/onboarding/implementations/${id}/guided-setup`, { expireSessionOnUnauthorized: false }))) ?? {
      summary: { title: 'Setup guiado', description: '', progressPercent: 0, completedRequiredSteps: 0, totalRequiredSteps: 0, firstValueReached: false },
      nextAction: null,
      steps: [],
    };
  },

  async completeStep(id: string, phaseId: string): Promise<OnboardingImplementation> {
    return mapImplementation(await apiClient.post(`/api/tenant/onboarding/implementations/${id}/steps/${phaseId}/complete`, {}, { expireSessionOnUnauthorized: false }));
  },

  async skipStep(id: string, phaseId: string): Promise<OnboardingImplementation> {
    return mapImplementation(await apiClient.post(`/api/tenant/onboarding/implementations/${id}/steps/${phaseId}/skip`, {}, { expireSessionOnUnauthorized: false }));
  },

  async cancel(id: string): Promise<OnboardingImplementation> {
    return mapImplementation(await apiClient.post(`/api/tenant/onboarding/implementations/${id}/cancel`, {}, { expireSessionOnUnauthorized: false }));
  },

  async archive(id: string): Promise<OnboardingImplementation> {
    return mapImplementation(await apiClient.post(`/api/tenant/onboarding/implementations/${id}/archive`, {}, { expireSessionOnUnauthorized: false }));
  },

  async unitOptions(): Promise<OnboardingUnitOption[]> {
    const response = await apiClient.get<unknown>('/api/company/units/options', { expireSessionOnUnauthorized: false });
    return arrayValue(unwrapData(response)).map(optionFromRecord);
  },

  getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return getApiErrorMessage(error, fallback);
    return fallback;
  },
};
