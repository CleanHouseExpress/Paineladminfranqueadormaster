import { implementationsMock, implementationTemplatesMock } from '../app/data/implementationMockData';
import { apiClient, ApiError } from './apiClient';
import type {
  ImplementationChecklistItem,
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

const IMPLEMENTATIONS_KEY = 'orchestra-unit-implementations-v1';
const TEMPLATES_KEY = 'orchestra-implementation-templates-v1';

type ApiRecord = Record<string, unknown>;

const viteEnv = ((import.meta as ImportMeta & { env?: { DEV?: boolean; MODE?: string } }).env ?? {});
const isDev = Boolean(viteEnv.DEV) || viteEnv.MODE === 'development';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function now() {
  return new Date().toISOString();
}

function today() {
  return now().slice(0, 10);
}

function cloneImplementation(item: UnitImplementation): UnitImplementation {
  return JSON.parse(JSON.stringify(item)) as UnitImplementation;
}

function cloneTemplate(item: ImplementationTemplate): ImplementationTemplate {
  return JSON.parse(JSON.stringify(item)) as ImplementationTemplate;
}

function normalizeImplementations(items: unknown): UnitImplementation[] {
  if (!Array.isArray(items)) return implementationsMock.map(cloneImplementation);

  return items
    .filter(Boolean)
    .map(item => ({
      ...cloneImplementation(item as UnitImplementation),
      phases: Array.isArray((item as UnitImplementation).phases) ? (item as UnitImplementation).phases : [],
      history: Array.isArray((item as UnitImplementation).history) ? (item as UnitImplementation).history : [],
    }));
}

function normalizeTemplates(items: unknown): ImplementationTemplate[] {
  if (!Array.isArray(items)) return implementationTemplatesMock.map(cloneTemplate);

  return items
    .filter(Boolean)
    .map(item => ({
      ...cloneTemplate(item as ImplementationTemplate),
      phases: Array.isArray((item as ImplementationTemplate).phases) ? (item as ImplementationTemplate).phases : [],
    }));
}

function getMockImplementations() {
  const stored = readJson<unknown>(IMPLEMENTATIONS_KEY, null);
  const implementations = normalizeImplementations(stored ?? implementationsMock);
  if (!stored) writeJson(IMPLEMENTATIONS_KEY, implementations);
  return implementations;
}

function saveMockImplementations(items: UnitImplementation[]) {
  writeJson(IMPLEMENTATIONS_KEY, items);
}

function getMockTemplates() {
  const stored = readJson<unknown>(TEMPLATES_KEY, null);
  const templates = normalizeTemplates(stored ?? implementationTemplatesMock);
  if (!stored) writeJson(TEMPLATES_KEY, templates);
  return templates;
}

function saveMockTemplates(items: ImplementationTemplate[]) {
  writeJson(TEMPLATES_KEY, items);
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function idValue(value: unknown, fallback = '') {
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

function isSafeDevFallback(error: unknown) {
  if (!isDev) return false;
  if (error instanceof ApiError) return error.status === 404 || error.status === 501;
  return error instanceof TypeError;
}

function isHardApiError(error: unknown) {
  return error instanceof ApiError && [401, 403, 422, 500].includes(error.status);
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

function recalculateMock(implementation: UnitImplementation): UnitImplementation {
  const phases = (implementation.phases ?? []).map(phase => {
    const tasks = phase.tasks ?? [];
    const status = tasks.some(task => task.status === 'blocked')
      ? 'blocked'
      : tasks.some(task => task.status === 'delayed')
        ? 'delayed'
        : tasks.length > 0 && tasks.every(task => task.status === 'completed')
          ? 'completed'
          : tasks.some(task => task.status === 'completed' || task.status === 'in_progress')
            ? 'in_progress'
            : 'pending';

    return { ...phase, status };
  });

  const tasks = phases.flatMap(phase => phase.tasks ?? []);
  const completed = tasks.filter(task => task.status === 'completed').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
  const currentPhase = phases.find(phase => phase.status !== 'completed') ?? phases[phases.length - 1];
  const hasDelayed = tasks.some(task => task.status === 'blocked' || task.status === 'delayed');

  return {
    ...implementation,
    phases,
    progress,
    progressPercent: progress,
    currentPhaseId: currentPhase?.id ?? implementation.currentPhaseId,
    status: implementation.actualOpeningDate
      ? 'completed'
      : hasDelayed
        ? 'delayed'
        : progress > 0
          ? 'in_progress'
          : implementation.status,
    updatedAt: now(),
  };
}

function updateMockImplementation(
  implementationId: string,
  update: (implementation: UnitImplementation) => UnitImplementation,
) {
  const implementations = getMockImplementations();
  const next = implementations.map(item => (
    item.id === implementationId ? recalculateMock(update(cloneImplementation(item))) : item
  ));
  saveMockImplementations(next);
  return next.find(item => item.id === implementationId) ?? null;
}

async function withSafeFallback<T>(request: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isHardApiError(error)) throw error;
    if (isSafeDevFallback(error)) return fallback();
    throw error;
  }
}

export const implementationService = {
  async listImplementations(): Promise<UnitImplementation[]> {
    return withSafeFallback(
      async () => unwrapList(await apiClient.get<unknown>('/api/tenant/implementations')).map(mapImplementation),
      () => getMockImplementations(),
    );
  },

  async getImplementationByUnit(unitId: number | string): Promise<UnitImplementation | null> {
    try {
      const response = await apiClient.get<unknown>(`/api/tenant/units/${unitId}/implementation`);
      return mapImplementation(response);
    } catch (error) {
      if (shouldTreatUnitImplementationAsEmpty(error)) return null;
      if (isHardApiError(error)) throw error;
      if (isSafeDevFallback(error)) return getMockImplementations().find(item => String(item.unitId) === String(unitId)) ?? null;
      throw error;
    }
  },

  async createImplementation(unitId: number | string, templateId: string): Promise<UnitImplementation> {
    return withSafeFallback(
      async () => mapImplementation(await apiClient.post<unknown>(`/api/tenant/units/${unitId}/implementation/start`, { template_id: templateId })),
      () => {
        const templates = getMockTemplates();
        const template = templates.find(item => item.id === templateId) ?? templates[0] ?? implementationTemplatesMock[0];
        const existing = getMockImplementations().find(item => String(item.unitId) === String(unitId));
        if (existing) return existing;

        const phases = (template.phases ?? []).map(phase => ({
          id: phase.id,
          name: phase.title,
          title: phase.title,
          position: phase.order,
          order: phase.order,
          status: 'pending' as const,
          startDate: null,
          dueDate: null,
          startedAt: null,
          completedAt: null,
          tasks: (phase.tasks ?? []).map(task => ({
            id: task.id,
            phaseId: phase.id,
            name: task.title,
            title: task.title,
            description: task.description,
            position: task.relativeDay,
            status: 'pending' as const,
            priority: task.priority,
            responsibleUserId: null,
            responsibleUserName: task.suggestedAssignee,
            assignee: task.suggestedAssignee,
            startDate: null,
            dueDate: new Date(Date.now() + task.relativeDay * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            completedAt: null,
            dependsOnTaskIds: task.dependencies ?? [],
            checklist: (task.checklist ?? []).map((title, index) => ({ id: `${task.id}-${index}`, title, completed: false })),
            comments: [],
            history: [],
            files: [],
            dependencies: task.dependencies ?? [],
            documentRequired: task.documentRequired,
            trainingRequired: task.trainingRequired,
          })),
        }));

        const implementation = recalculateMock({
          id: `impl-${unitId}`,
          unitId,
          unitName: `Unidade ${unitId}`,
          city: '',
          state: '',
          brand: 'Bella Vita',
          status: 'not_started',
          responsibleUserId: null,
          responsibleUserName: 'Consultor de implantacao',
          consultant: 'Consultor de implantacao',
          templateId: template.id,
          plannedOpeningDate: new Date(Date.now() + 98 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          expectedOpeningDate: new Date(Date.now() + 98 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          actualOpeningDate: null,
          currentPhaseId: phases[0]?.id ?? 'contract',
          progressPercent: 0,
          progress: 0,
          createdAt: now(),
          updatedAt: now(),
          phases,
          history: [{ id: `impl-${unitId}-created`, title: 'Implantacao criada', createdAt: now() }],
        });

        saveMockImplementations([...getMockImplementations(), implementation]);
        return implementation;
      },
    );
  },

  async getImplementation(implementationId: string): Promise<UnitImplementation> {
    return withSafeFallback(
      async () => mapImplementation(await apiClient.get<unknown>(`/api/tenant/implementations/${implementationId}`)),
      () => {
        const implementation = getMockImplementations().find(item => item.id === implementationId);
        if (!implementation) throw new Error('Implantacao nao encontrada.');
        return implementation;
      },
    );
  },

  async updateImplementation(implementationId: string, payload: Partial<UnitImplementation>): Promise<UnitImplementation> {
    return withSafeFallback(
      async () => mapImplementation(await apiClient.put<unknown>(`/api/tenant/implementations/${implementationId}`, {
        status: payload.status,
        responsible_user_id: payload.responsibleUserId,
        planned_opening_date: payload.plannedOpeningDate,
        actual_opening_date: payload.actualOpeningDate,
      })),
      () => {
        const updated = updateMockImplementation(implementationId, implementation => ({ ...implementation, ...payload }));
        if (!updated) throw new Error('Implantacao nao encontrada.');
        return updated;
      },
    );
  },

  async completeTask(implementationId: string, taskId: string): Promise<UnitImplementation | null> {
    return withSafeFallback(
      async () => mapImplementation(await apiClient.post<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/complete`, {})),
      () => updateMockImplementation(implementationId, implementation => ({
        ...implementation,
        phases: (implementation.phases ?? []).map(phase => ({
          ...phase,
          tasks: (phase.tasks ?? []).map(task => {
            if (task.id !== taskId) return task;
            const history: ImplementationHistoryItem[] = [
              ...(task.history ?? []),
              { id: `${task.id}-completed-${Date.now()}`, title: 'Tarefa concluida', createdAt: now() },
            ];
            return {
              ...task,
              status: 'completed',
              completedAt: today(),
              checklist: (task.checklist ?? []).map(item => ({ ...item, completed: true })),
              history,
            };
          }),
        })),
        history: [
          ...(implementation.history ?? []),
          { id: `${implementation.id}-task-${Date.now()}`, title: 'Tarefa concluida', description: taskId, createdAt: now() },
        ],
      })),
    );
  },

  async updateTask(implementationId: string, taskId: string, payload: Partial<ImplementationTask>): Promise<ImplementationTask> {
    return withSafeFallback(
      async () => mapTask(await apiClient.put<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}`, {
        name: payload.name ?? payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        responsible_user_id: payload.responsibleUserId,
        start_date: payload.startDate,
        due_date: payload.dueDate,
        depends_on_task_ids: payload.dependsOnTaskIds ?? payload.dependencies,
        checklist: payload.checklist,
      })),
      () => {
        const implementation = updateMockImplementation(implementationId, current => ({
          ...current,
          phases: (current.phases ?? []).map(phase => ({
            ...phase,
            tasks: (phase.tasks ?? []).map(task => task.id === taskId ? { ...task, ...payload } : task),
          })),
        }));
        const task = implementation?.phases.flatMap(phase => phase.tasks ?? []).find(item => item.id === taskId);
        if (!task) throw new Error('Tarefa nao encontrada.');
        return task;
      },
    );
  },

  async reopenTask(implementationId: string, taskId: string): Promise<UnitImplementation | null> {
    return withSafeFallback(
      async () => mapImplementation(await apiClient.post<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/reopen`, {})),
      () => updateMockImplementation(implementationId, implementation => ({
        ...implementation,
        phases: (implementation.phases ?? []).map(phase => ({
          ...phase,
          tasks: (phase.tasks ?? []).map(task => task.id === taskId ? { ...task, status: 'in_progress', completedAt: null } : task),
        })),
      })),
    );
  },

  async addTaskComment(implementationId: string, taskId: string, comment: string): Promise<UnitImplementation | null> {
    return withSafeFallback(
      async () => {
        await apiClient.post<unknown>(`/api/tenant/implementations/${implementationId}/tasks/${taskId}/comments`, { comment });
        return mapImplementation(await apiClient.get<unknown>(`/api/tenant/implementations/${implementationId}`));
      },
      () => updateMockImplementation(implementationId, implementation => ({
        ...implementation,
        phases: (implementation.phases ?? []).map(phase => ({
          ...phase,
          tasks: (phase.tasks ?? []).map(task => {
            if (task.id !== taskId) return task;
            const comments: ImplementationTaskComment[] = [
              ...(task.comments ?? []),
              { id: `${task.id}-comment-${Date.now()}`, author: 'Usuario Orchestra', body: comment, createdAt: now() },
            ];
            return { ...task, comments };
          }),
        })),
      })),
    );
  },

  async registerOpeningDate(implementationId: string, date: string): Promise<UnitImplementation | null> {
    return withSafeFallback(
      async () => mapImplementation(await apiClient.post<unknown>(`/api/tenant/implementations/${implementationId}/register-opening`, {
        actual_opening_date: date,
      })),
      () => updateMockImplementation(implementationId, implementation => ({
        ...implementation,
        actualOpeningDate: date,
        status: 'completed',
        progress: 100,
        progressPercent: 100,
        history: [
          ...(implementation.history ?? []),
          { id: `${implementation.id}-opening-${Date.now()}`, title: 'Inauguracao registrada', description: date, createdAt: now() },
        ],
      })),
    );
  },

  async getHistory(implementationId: string): Promise<ImplementationHistoryItem[]> {
    return withSafeFallback(
      async () => unwrapList(await apiClient.get<unknown>(`/api/tenant/implementations/${implementationId}/history`)).map(mapHistoryItem),
      () => getMockImplementations().find(item => item.id === implementationId)?.history ?? [],
    );
  },

  async listTemplates(): Promise<ImplementationTemplate[]> {
    return withSafeFallback(
      async () => unwrapList(await apiClient.get<unknown>('/api/tenant/implementations/templates')).map(mapTemplate),
      () => getMockTemplates(),
    );
  },

  async saveTemplate(template: ImplementationTemplate): Promise<ImplementationTemplate> {
    return withSafeFallback(
      async () => {
        const payload = templateToPayload(template);
        const response = template.id
          ? await apiClient.put<unknown>(`/api/tenant/implementations/templates/${template.id}`, payload)
          : await apiClient.post<unknown>('/api/tenant/implementations/templates', payload);
        return mapTemplate(response);
      },
      () => {
        const templates = getMockTemplates();
        const nextTemplate = { ...template, updatedAt: now() };
        const exists = templates.some(item => item.id === nextTemplate.id);
        const next = exists
          ? templates.map(item => (item.id === nextTemplate.id ? nextTemplate : item))
          : [...templates, nextTemplate];
        saveMockTemplates(next);
        return nextTemplate;
      },
    );
  },

  async deleteTemplate(templateId: string): Promise<void> {
    return withSafeFallback(
      async () => {
        await apiClient.delete<unknown>(`/api/tenant/implementations/templates/${templateId}`);
      },
      () => {
        saveMockTemplates(getMockTemplates().filter(item => item.id !== templateId));
      },
    );
  },

  async getDashboard(): Promise<unknown> {
    return withSafeFallback(
      async () => apiClient.get<unknown>('/api/tenant/implementations/dashboard'),
      () => ({ data: getMockImplementations() }),
    );
  },

  getErrorMessage(error: unknown, fallback: string): string {
    return apiErrorMessage(error, fallback);
  },

  async resetMocks(): Promise<void> {
    saveMockImplementations(implementationsMock.map(cloneImplementation));
    saveMockTemplates(implementationTemplatesMock.map(cloneTemplate));
  },
};
