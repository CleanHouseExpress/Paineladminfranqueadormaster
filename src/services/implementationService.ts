import { apiClient, apiClientConfig, ApiError, AUTH_TOKEN_STORAGE_KEY } from './apiClient';
import type {
  ImplementationChecklistItem,
  ImplementationTaskDocument,
  ImplementationTaskDocumentStatus,
  ImplementationHistoryItem,
  ImplementationPhase,
  ImplementationPriority,
  ImplementationTask,
  ImplementationTaskComment,
  ImplementationTaskStatus,
  ImplementationTemplate,
  ImplementationTemplatePhase,
  ImplementationTemplateTask,
  UnitImplementation,
} from '../types/implementation';

type ApiRecord = Record<string, unknown>;

function now() {
  return new Date().toISOString();
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function idValue(value: unknown, fallback: number | string | null = '') {
  if (typeof value === 'number' || typeof value === 'string') return value;
  return fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function recordValue(value: unknown): ApiRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : {};
}

function unwrapData(value: unknown): unknown {
  const record = recordValue(value);
  if ('data' in record) return record.data;
  return value;
}

function unwrapList(value: unknown): unknown[] {
  const data = unwrapData(value);
  if (Array.isArray(data)) return data;
  const record = recordValue(data);
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

function shouldTreatUnitImplementationAsEmpty(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const data = recordValue(error.data);
    return stringValue(data.message, `${fallback} (${error.status})`);
  }
  return fallback;
}

function tenantApiGet<T>(path: string) {
  return apiClient.get<T>(path, { expireSessionOnUnauthorized: false });
}

function tenantApiPost<T>(path: string, body?: unknown) {
  return apiClient.post<T>(path, body, { expireSessionOnUnauthorized: false });
}

function tenantApiPut<T>(path: string, body?: unknown) {
  return apiClient.put<T>(path, body, { expireSessionOnUnauthorized: false });
}

function tenantApiDelete<T>(path: string) {
  return apiClient.delete<T>(path, { expireSessionOnUnauthorized: false });
}

function mapChecklistItem(item: unknown, index: number): ImplementationChecklistItem {
  const record = recordValue(item);
  return {
    id: String(idValue(record.id, `check-${index}`)),
    title: stringValue(record.title ?? record.name ?? record.label, `Item ${index + 1}`),
    completed: Boolean(record.completed ?? record.is_completed),
  };
}

function mapComment(item: unknown): ImplementationTaskComment {
  const record = recordValue(item);
  return {
    id: String(idValue(record.id, `comment-${Date.now()}`)),
    author: stringValue(record.author ?? record.author_name ?? record.user_name, 'Usuario Orchestra'),
    body: stringValue(record.body ?? record.comment ?? record.message),
    createdAt: stringValue(record.created_at ?? record.createdAt, now()),
  };
}

function mapDocumentStatus(value: unknown): ImplementationTaskDocumentStatus {
  if (value === 'pending_approval' || value === 'approved' || value === 'rejected') return value;
  return 'pending_approval';
}

function mapTaskDocument(item: unknown): ImplementationTaskDocument {
  const record = recordValue(item);
  const originalName = stringValue(record.original_name ?? record.originalName ?? record.file_name ?? record.fileName, 'Documento');

  return {
    id: String(idValue(record.id, `doc-${Date.now()}`)),
    taskId: String(idValue(record.task_id ?? record.taskId, '')),
    fileName: stringValue(record.file_name ?? record.fileName, originalName),
    originalName,
    mimeType: stringValue(record.mime_type ?? record.mimeType, '') || null,
    extension: stringValue(record.extension, '') || null,
    sizeBytes: numberValue(record.size_bytes ?? record.sizeBytes, 0),
    status: mapDocumentStatus(record.status),
    uploadedBy: idValue(record.uploaded_by ?? record.uploadedBy, null),
    uploadedByName: stringValue(record.uploaded_by_name ?? record.uploadedByName, '') || null,
    approvedBy: idValue(record.approved_by ?? record.approvedBy, null),
    approvedByName: stringValue(record.approved_by_name ?? record.approvedByName, '') || null,
    approvedAt: stringValue(record.approved_at ?? record.approvedAt, '') || null,
    createdAt: stringValue(record.created_at ?? record.createdAt, now()),
  };
}

function mapHistoryItem(item: unknown): ImplementationHistoryItem {
  const record = recordValue(item);
  return {
    id: String(idValue(record.id, `history-${Date.now()}`)),
    title: stringValue(record.title ?? record.event ?? record.action, 'Evento'),
    description: stringValue(record.description ?? record.details, ''),
    createdAt: stringValue(record.created_at ?? record.createdAt, now()),
  };
}

function mapPriority(value: unknown): ImplementationPriority {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') return value;
  return 'medium';
}

function mapTaskStatus(value: unknown): ImplementationTaskStatus {
  if (value === 'pending' || value === 'in_progress' || value === 'completed' || value === 'blocked' || value === 'delayed') return value;
  if (value === 'open') return 'pending';
  return 'pending';
}

function mapImplementationStatus(value: unknown): UnitImplementation['status'] {
  if (value === 'not_started' || value === 'in_progress' || value === 'delayed' || value === 'completed' || value === 'paused') return value;
  if (value === 'open') return 'in_progress';
  return 'not_started';
}

function mapTask(item: unknown, fallbackPhaseId = ''): ImplementationTask {
  const record = recordValue(item);
  const id = String(idValue(record.id, `task-${Date.now()}`));
  const name = stringValue(record.name ?? record.title, 'Tarefa');
  const responsibleUserName = stringValue(record.responsible_user_name ?? record.responsibleUserName ?? record.assignee, '');
  const dependsOnTaskIds = arrayValue<string | number>(record.depends_on_task_ids ?? record.dependsOnTaskIds ?? record.dependencies).map(String);

  return {
    id,
    phaseId: String(idValue(record.phase_id ?? record.phaseId, fallbackPhaseId)),
    name,
    title: name,
    description: stringValue(record.description),
    position: numberValue(record.position ?? record.order, 0),
    status: mapTaskStatus(record.status),
    priority: mapPriority(record.priority),
    responsibleUserId: idValue(record.responsible_user_id ?? record.responsibleUserId, ''),
    responsibleUserName,
    assignee: responsibleUserName || 'Responsavel nao definido',
    startDate: stringValue(record.start_date ?? record.startDate, ''),
    dueDate: stringValue(record.due_date ?? record.dueDate, ''),
    completedAt: stringValue(record.completed_at ?? record.completedAt, '') || null,
    dependsOnTaskIds,
    checklist: arrayValue(record.checklist).map(mapChecklistItem),
    comments: arrayValue(record.comments).map(mapComment),
    documents: arrayValue(record.documents).map(mapTaskDocument),
    history: arrayValue(record.history).map(mapHistoryItem),
    files: arrayValue<string>(record.files),
    dependencies: dependsOnTaskIds,
    documentRequired: Boolean(record.document_required ?? record.documentRequired),
    trainingRequired: Boolean(record.training_required ?? record.trainingRequired),
  };
}

function mapPhase(item: unknown): ImplementationPhase {
  const record = recordValue(item);
  const id = String(idValue(record.id, `phase-${Date.now()}`));
  const name = stringValue(record.name ?? record.title, 'Fase');

  return {
    id,
    name,
    title: name,
    description: stringValue(record.description, ''),
    position: numberValue(record.position ?? record.order, 0),
    order: numberValue(record.position ?? record.order, 0),
    status: mapTaskStatus(record.status),
    startDate: stringValue(record.start_date ?? record.startDate, '') || null,
    dueDate: stringValue(record.due_date ?? record.dueDate, '') || null,
    startedAt: stringValue(record.start_date ?? record.started_at ?? record.startedAt, '') || null,
    completedAt: stringValue(record.completed_at ?? record.completedAt, '') || null,
    tasks: arrayValue(record.tasks).map(task => mapTask(task, id)),
  };
}

function mapKpis(value: unknown): UnitImplementation['kpis'] {
  const record = recordValue(value);
  if (Object.keys(record).length === 0) return undefined;

  return {
    daysRemaining: numberValue(record.days_remaining ?? record.daysRemaining, 0),
    daysDelayed: numberValue(record.days_delayed ?? record.daysDelayed, 0),
    completedTasks: numberValue(record.completed_tasks ?? record.completedTasks, 0),
    totalTasks: numberValue(record.total_tasks ?? record.totalTasks, 0),
    criticalPending: numberValue(record.critical_pending ?? record.criticalPending, 0),
    documentsPending: numberValue(record.documents_pending ?? record.documentsPending, 0),
    trainingsCompletePercent: numberValue(record.trainings_complete_percent ?? record.trainingsCompletePercent, 0),
    progressPercent: numberValue(record.progress_percent ?? record.progressPercent, 0),
  };
}

function mapImplementation(value: unknown): UnitImplementation {
  const record = recordValue(unwrapData(value));
  const unitRecord = recordValue(record.unit);
  const phases = arrayValue(record.phases).map(mapPhase);
  const progressPercent = numberValue(record.progress_percent ?? record.progressPercent, numberValue(record.progress, 0));
  const plannedOpeningDate = stringValue(record.planned_opening_date ?? record.plannedOpeningDate ?? record.expected_opening_date ?? record.expectedOpeningDate, '');
  const responsibleUserName = stringValue(record.responsible_user_name ?? record.responsibleUserName ?? record.consultant, '');

  return {
    id: String(idValue(record.id, `impl-${idValue(record.unit_id ?? record.unitId, '')}`)),
    unitId: idValue(record.unit_id ?? record.unitId ?? unitRecord.id, ''),
    unitName: stringValue(record.unit_name ?? record.unitName ?? unitRecord.name, ''),
    city: stringValue(record.city ?? unitRecord.address_city ?? unitRecord.city, ''),
    state: stringValue(record.state ?? unitRecord.address_state ?? unitRecord.state, ''),
    brand: stringValue(record.brand ?? unitRecord.brand, ''),
    status: mapImplementationStatus(record.status),
    responsibleUserId: idValue(record.responsible_user_id ?? record.responsibleUserId, ''),
    responsibleUserName,
    consultant: responsibleUserName || 'Consultor de implantacao',
    templateId: String(idValue(record.template_id ?? record.templateId, '')),
    plannedOpeningDate: plannedOpeningDate || null,
    expectedOpeningDate: plannedOpeningDate,
    actualOpeningDate: stringValue(record.actual_opening_date ?? record.actualOpeningDate, '') || null,
    progressPercent,
    currentPhaseId: String(idValue(record.current_phase_id ?? record.currentPhaseId, phases[0]?.id ?? '')),
    progress: progressPercent,
    createdAt: stringValue(record.created_at ?? record.createdAt, now()),
    updatedAt: stringValue(record.updated_at ?? record.updatedAt, now()),
    phases,
    history: arrayValue(record.history).map(mapHistoryItem),
    kpis: mapKpis(record.kpis),
  };
}

function mapTemplateTask(item: unknown): ImplementationTemplateTask {
  const record = recordValue(item);
  const id = String(idValue(record.id, `template-task-${Date.now()}`));
  const title = stringValue(record.title ?? record.name, 'Tarefa');

  return {
    id,
    title,
    description: stringValue(record.description),
    relativeDay: numberValue(record.relative_day ?? record.relativeDay, 0),
    priority: mapPriority(record.priority),
    suggestedAssignee: stringValue(record.suggested_assignee ?? record.suggestedAssignee ?? record.responsible_user_name, ''),
    dependencies: arrayValue<string | number>(record.dependencies ?? record.depends_on_task_ids ?? record.dependsOnTaskIds).map(String),
    documentRequired: Boolean(record.document_required ?? record.documentRequired),
    trainingRequired: Boolean(record.training_required ?? record.trainingRequired),
    checklist: arrayValue<string>(record.checklist),
  };
}

function mapTemplatePhase(item: unknown): ImplementationTemplatePhase {
  const record = recordValue(item);
  const id = String(idValue(record.id, `template-phase-${Date.now()}`));
  return {
    id,
    title: stringValue(record.title ?? record.name, 'Fase'),
    order: numberValue(record.order ?? record.position, 0),
    relativeStartDay: numberValue(record.relative_start_day ?? record.relativeStartDay, 0),
    slaDays: numberValue(record.sla_days ?? record.slaDays, 0),
    tasks: arrayValue(record.tasks).map(mapTemplateTask),
  };
}

function mapTemplate(value: unknown): ImplementationTemplate {
  const record = recordValue(unwrapData(value));
  return {
    id: String(idValue(record.id, `template-${Date.now()}`)),
    name: stringValue(record.name, 'Template de implantacao'),
    description: stringValue(record.description),
    active: Boolean(record.active ?? true),
    phases: arrayValue(record.phases).map(mapTemplatePhase),
    createdAt: stringValue(record.created_at ?? record.createdAt, now()),
    updatedAt: stringValue(record.updated_at ?? record.updatedAt, now()),
  };
}

function templateToPayload(template: ImplementationTemplate) {
  return {
    name: template.name,
    description: template.description,
    active: template.active,
    phases: (template.phases ?? []).map(phase => ({
      id: phase.id,
      name: phase.title,
      position: phase.order,
      relative_start_day: phase.relativeStartDay,
      sla_days: phase.slaDays,
      tasks: (phase.tasks ?? []).map(task => ({
        id: task.id,
        name: task.title,
        description: task.description,
        relative_day: task.relativeDay,
        priority: task.priority,
        suggested_assignee: task.suggestedAssignee,
        dependencies: task.dependencies ?? [],
        document_required: task.documentRequired,
        training_required: task.trainingRequired,
        checklist: task.checklist ?? [],
      })),
    })),
  };
}

export const implementationService = {
  async listImplementations(): Promise<UnitImplementation[]> {
    return unwrapList(await tenantApiGet<unknown>('/api/tenant/implementations')).map(mapImplementation);
  },

  async getImplementationByUnit(unitId: number | string): Promise<UnitImplementation | null> {
    try {
      const response = await tenantApiGet<unknown>(`/api/tenant/units/${unitId}/implementation`);
      return mapImplementation(response);
    } catch (error) {
      if (shouldTreatUnitImplementationAsEmpty(error)) return null;
      throw error;
    }
  },

  async createImplementation(unitId: number | string, templateId: string): Promise<UnitImplementation> {
    return mapImplementation(await tenantApiPost<unknown>(`/api/tenant/units/${unitId}/implementation/start`, { template_id: templateId }));
  },

  async getImplementation(implementationId: string): Promise<UnitImplementation> {
    return mapImplementation(await tenantApiGet<unknown>(`/api/tenant/implementations/${implementationId}`));
  },

  async updateImplementation(implementationId: string, payload: Partial<UnitImplementation>): Promise<UnitImplementation> {
    return mapImplementation(await tenantApiPut<unknown>(`/api/tenant/implementations/${implementationId}`, {
      status: payload.status,
      responsible_user_id: payload.responsibleUserId,
      planned_opening_date: payload.plannedOpeningDate,
      actual_opening_date: payload.actualOpeningDate,
    }));
  },

  async completeTask(implementationId: string, taskId: string): Promise<UnitImplementation | null> {
    await tenantApiPost<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/complete`, {});
    return mapImplementation(await tenantApiGet<unknown>(`/api/tenant/implementations/${implementationId}`));
  },

  async updateTask(implementationId: string, taskId: string, payload: Partial<ImplementationTask>): Promise<ImplementationTask> {
    return mapTask(await tenantApiPut<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}`, {
      name: payload.name ?? payload.title,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      responsible_user_id: payload.responsibleUserId,
      start_date: payload.startDate,
      due_date: payload.dueDate,
      depends_on_task_ids: payload.dependsOnTaskIds ?? payload.dependencies,
      checklist: payload.checklist,
    }));
  },

  async reopenTask(implementationId: string, taskId: string): Promise<UnitImplementation | null> {
    await tenantApiPost<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/reopen`, {});
    return mapImplementation(await tenantApiGet<unknown>(`/api/tenant/implementations/${implementationId}`));
  },

  async addTaskComment(implementationId: string, taskId: string, comment: string): Promise<UnitImplementation | null> {
    await tenantApiPost<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/comments`, { comment });
    return mapImplementation(await tenantApiGet<unknown>(`/api/tenant/implementations/${implementationId}`));
  },

  async uploadTaskDocument(implementationId: string, taskId: string, file: File): Promise<UnitImplementation | null> {
    const formData = new FormData();
    formData.append('file', file);
    await tenantApiPost<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/documents`, formData);
    return mapImplementation(await tenantApiGet<unknown>(`/api/tenant/implementations/${implementationId}`));
  },

  async approveTaskDocument(implementationId: string, taskId: string, documentId: string): Promise<UnitImplementation | null> {
    await tenantApiPost<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/documents/${documentId}/approve`, {});
    return mapImplementation(await tenantApiGet<unknown>(`/api/tenant/implementations/${implementationId}`));
  },

  async downloadTaskDocument(implementationId: string, taskId: string, documentId: string, filename: string): Promise<void> {
    const token = (() => {
      try {
        return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    const baseUrl = apiClientConfig.baseUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/tenant/implementations/${implementationId}/tasks/${taskId}/documents/${documentId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
      throw new ApiError(response.status, data);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  async registerOpeningDate(implementationId: string, date: string): Promise<UnitImplementation | null> {
    return mapImplementation(await tenantApiPost<unknown>(`/api/tenant/implementations/${implementationId}/register-opening`, {
      actual_opening_date: date,
    }));
  },

  async getHistory(implementationId: string): Promise<ImplementationHistoryItem[]> {
    return unwrapList(await tenantApiGet<unknown>(`/api/tenant/implementations/${implementationId}/history`)).map(mapHistoryItem);
  },

  async listTemplates(): Promise<ImplementationTemplate[]> {
    return unwrapList(await tenantApiGet<unknown>('/api/tenant/implementations/templates')).map(mapTemplate);
  },

  async saveTemplate(template: ImplementationTemplate): Promise<ImplementationTemplate> {
    const payload = templateToPayload(template);
    const response = template.id
      ? await tenantApiPut<unknown>(`/api/tenant/implementations/templates/${template.id}`, payload)
      : await tenantApiPost<unknown>('/api/tenant/implementations/templates', payload);
    return mapTemplate(response);
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await tenantApiDelete<unknown>(`/api/tenant/implementations/templates/${templateId}`);
  },

  async getDashboard(): Promise<unknown> {
    return tenantApiGet<unknown>('/api/tenant/implementations/dashboard');
  },

  getErrorMessage(error: unknown, fallback: string): string {
    return apiErrorMessage(error, fallback);
  },

};
