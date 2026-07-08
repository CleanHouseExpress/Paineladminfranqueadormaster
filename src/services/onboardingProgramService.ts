import { apiClient, ApiError, getApiErrorMessage } from './apiClient';
import type {
  OnboardingProgram,
  OnboardingProgramsResult,
  OnboardingProgramStatus,
  OnboardingProgramStep,
  OnboardingProgramVersion,
  OnboardingProgramVersionStatus,
} from '../types/onboardingProgram';

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

function mapProgramStatus(value: unknown): OnboardingProgramStatus {
  if (value === 'active' || value === 'archived') return value;
  return 'draft';
}

function mapVersionStatus(value: unknown): OnboardingProgramVersionStatus {
  if (value === 'published' || value === 'archived') return value;
  return 'draft';
}

function mapStep(value: unknown, index = 0): OnboardingProgramStep {
  const record = recordValue(value);
  const id = idValue(record.id, `step-${index + 1}`);
  const sla = recordValue(record.sla);

  return {
    id,
    clientId: id,
    name: stringValue(record.name, `Etapa ${index + 1}`),
    description: stringValue(record.description),
    category: stringValue(record.category),
    position: numberValue(record.position, index + 1),
    responsibleRole: stringValue(record.responsible_role ?? record.responsibleRole),
    isRequired: boolValue(record.is_required ?? record.isRequired, true),
    condition: recordValue(record.condition),
    completionCriteria: recordValue(record.completion_criteria ?? record.completionCriteria),
    documentRequirements: arrayValue<Record<string, unknown>>(record.document_requirements ?? record.documentRequirements),
    checklistTemplateId: typeof record.checklist_template_id === 'number' ? record.checklist_template_id : null,
    dependencies: arrayValue<string | number>(record.dependencies).map(String),
    sla: {
      days: numberValue(sla.days, 0),
      startsFrom: stringValue(sla.starts_from ?? sla.startsFrom, 'program_start'),
      escalationPolicy: recordValue(sla.escalation_policy ?? sla.escalationPolicy),
    },
  };
}

function mapVersion(value: unknown): OnboardingProgramVersion {
  const record = recordValue(value);

  return {
    id: idValue(record.id),
    programId: idValue(record.program_id ?? record.programId),
    version: numberValue(record.version, 1),
    status: mapVersionStatus(record.status),
    changeNotes: stringValue(record.change_notes ?? record.changeNotes),
    duplicatedFromVersionId: idValue(record.duplicated_from_version_id ?? record.duplicatedFromVersionId, '') || null,
    publishedAt: stringValue(record.published_at ?? record.publishedAt) || null,
    steps: arrayValue(record.steps).map(mapStep),
    roleAssignments: arrayValue<ApiRecord>(record.role_assignments ?? record.roleAssignments).map(item => ({
      id: idValue(item.id),
      stepId: idValue(item.step_id ?? item.stepId, '') || null,
      roleKey: stringValue(item.role_key ?? item.roleKey),
      userId: typeof item.user_id === 'number' ? item.user_id : null,
      isRequired: boolValue(item.is_required ?? item.isRequired),
    })),
    createdAt: stringValue(record.created_at ?? record.createdAt),
    updatedAt: stringValue(record.updated_at ?? record.updatedAt),
  };
}

function mapProgram(value: unknown): OnboardingProgram {
  const record = recordValue(unwrapData(value));
  const versions = arrayValue(record.versions).map(mapVersion);
  const latestVersion = record.latest_version ? mapVersion(record.latest_version) : versions[0] ?? null;

  return {
    id: idValue(record.id),
    name: stringValue(record.name, 'Programa sem nome'),
    description: stringValue(record.description),
    category: stringValue(record.category),
    status: mapProgramStatus(record.status),
    versionsCount: numberValue(record.versions_count ?? record.versionsCount, versions.length),
    publishedVersionsCount: numberValue(record.published_versions_count ?? record.publishedVersionsCount),
    latestVersion,
    versions,
    createdAt: stringValue(record.created_at ?? record.createdAt),
    updatedAt: stringValue(record.updated_at ?? record.updatedAt),
  };
}

function stepToPayload(step: OnboardingProgramStep, index: number) {
  return {
    client_id: step.clientId || step.id || `step-${index + 1}`,
    name: step.name,
    description: step.description,
    category: step.category,
    position: step.position || index + 1,
    responsible_role: step.responsibleRole,
    is_required: step.isRequired,
    condition: step.condition,
    completion_criteria: step.completionCriteria,
    document_requirements: step.documentRequirements,
    checklist_template_id: step.checklistTemplateId,
    dependencies: step.dependencies,
    sla: {
      days: step.sla.days,
      starts_from: step.sla.startsFrom,
      escalation_policy: step.sla.escalationPolicy,
    },
  };
}

function versionToPayload(version: Pick<OnboardingProgramVersion, 'changeNotes' | 'steps' | 'roleAssignments'>) {
  return {
    change_notes: version.changeNotes,
    steps: version.steps.map(stepToPayload),
    role_assignments: version.roleAssignments.map(item => ({
      step_client_id: item.stepId,
      role_key: item.roleKey,
      user_id: item.userId,
      is_required: item.isRequired,
    })),
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

export const onboardingProgramService = {
  async list(filters: { search?: string; status?: string; category?: string } = {}): Promise<OnboardingProgramsResult> {
    const response = recordValue(await apiClient.get<unknown>(`/api/tenant/onboarding/programs${queryString(filters)}`, { expireSessionOnUnauthorized: false }));
    const meta = recordValue(response.meta);

    return {
      data: arrayValue(response.data).map(mapProgram),
      meta: {
        currentPage: numberValue(meta.current_page ?? meta.currentPage, 1),
        lastPage: numberValue(meta.last_page ?? meta.lastPage, 1),
        perPage: numberValue(meta.per_page ?? meta.perPage, 15),
        total: numberValue(meta.total, 0),
      },
    };
  },

  async create(payload: Pick<OnboardingProgram, 'name' | 'description' | 'category'>): Promise<OnboardingProgram> {
    return mapProgram(await apiClient.post('/api/tenant/onboarding/programs', {
      name: payload.name,
      description: payload.description,
      category: payload.category,
    }, { expireSessionOnUnauthorized: false }));
  },

  async update(program: OnboardingProgram): Promise<OnboardingProgram> {
    return mapProgram(await apiClient.put(`/api/tenant/onboarding/programs/${program.id}`, {
      name: program.name,
      description: program.description,
      category: program.category,
      status: program.status,
    }, { expireSessionOnUnauthorized: false }));
  },

  async get(programId: string): Promise<OnboardingProgram> {
    return mapProgram(await apiClient.get(`/api/tenant/onboarding/programs/${programId}`, { expireSessionOnUnauthorized: false }));
  },

  async createVersion(programId: string, version: Pick<OnboardingProgramVersion, 'changeNotes' | 'steps' | 'roleAssignments'>): Promise<OnboardingProgramVersion> {
    return mapVersion(unwrapData(await apiClient.post(`/api/tenant/onboarding/programs/${programId}/versions`, versionToPayload(version), { expireSessionOnUnauthorized: false })));
  },

  async updateVersion(programId: string, version: OnboardingProgramVersion): Promise<OnboardingProgramVersion> {
    return mapVersion(unwrapData(await apiClient.put(`/api/tenant/onboarding/programs/${programId}/versions/${version.id}`, versionToPayload(version), { expireSessionOnUnauthorized: false })));
  },

  async publishVersion(programId: string, versionId: string): Promise<OnboardingProgramVersion> {
    return mapVersion(unwrapData(await apiClient.post(`/api/tenant/onboarding/programs/${programId}/versions/${versionId}/publish`, {}, { expireSessionOnUnauthorized: false })));
  },

  async duplicateProgram(programId: string): Promise<OnboardingProgram> {
    return mapProgram(await apiClient.post(`/api/tenant/onboarding/programs/${programId}/duplicate`, {}, { expireSessionOnUnauthorized: false }));
  },

  async archiveProgram(programId: string): Promise<OnboardingProgram> {
    return mapProgram(await apiClient.post(`/api/tenant/onboarding/programs/${programId}/archive`, {}, { expireSessionOnUnauthorized: false }));
  },

  async duplicateVersion(programId: string, versionId: string): Promise<OnboardingProgramVersion> {
    return mapVersion(unwrapData(await apiClient.post(`/api/tenant/onboarding/programs/${programId}/versions/${versionId}/duplicate`, {}, { expireSessionOnUnauthorized: false })));
  },

  async archiveVersion(programId: string, versionId: string): Promise<OnboardingProgramVersion> {
    return mapVersion(unwrapData(await apiClient.post(`/api/tenant/onboarding/programs/${programId}/versions/${versionId}/archive`, {}, { expireSessionOnUnauthorized: false })));
  },

  emptyStep(index: number): OnboardingProgramStep {
    return {
      id: `new-step-${Date.now()}-${index}`,
      clientId: `step-${Date.now()}-${index}`,
      name: `Nova etapa ${index + 1}`,
      description: '',
      category: '',
      position: index + 1,
      responsibleRole: '',
      isRequired: true,
      condition: {},
      completionCriteria: {},
      documentRequirements: [],
      checklistTemplateId: null,
      dependencies: [],
      sla: { days: 0, startsFrom: 'program_start', escalationPolicy: {} },
    };
  },

  getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return getApiErrorMessage(error, fallback);
    return fallback;
  },
};
