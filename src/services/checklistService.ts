/**
 * Mock checklist service — localStorage-backed async interface shaped after
 * the real API so the implementation can be swapped without changing callers.
 *
 * Real API contracts:
 *   GET    /api/company/checklists/templates           → ChecklistTemplate[]
 *   GET    /api/company/checklists/templates/:id       → ChecklistTemplate
 *   POST   /api/company/checklists/templates           → ChecklistTemplate
 *   PUT    /api/company/checklists/templates/:id       → ChecklistTemplate
 *   DELETE /api/company/checklists/templates/:id       → void
 *   GET    /api/company/checklists/executions          → ChecklistExecution[]
 *   GET    /api/company/checklists/executions/:id      → ChecklistExecution
 *   POST   /api/company/checklists/executions          → ChecklistExecution
 *   PUT    /api/company/checklists/executions/:id      → ChecklistExecution (save answers)
 *   POST   /api/company/checklists/executions/:id/complete → ChecklistExecution
 */

import type {
  ChecklistTemplate,
  ChecklistExecution,
  ChecklistAnswer,
  ChecklistStats,
  ExecutionStatus,
} from '../types/checklist';
import {
  mockChecklistTemplates,
  mockChecklistExecutions,
  mockChecklistStats,
  mockChecklistAnswers,
} from '../app/data/checklistMockData';

const STORAGE_KEY = 'orchestra_checklists_v1';
const delay = (ms = 80) => new Promise<void>(r => setTimeout(r, ms));

// ─── Storage shape ─────────────────────────────────────────────────────────────

interface StorageShape {
  templates: ChecklistTemplate[];
  executions: ChecklistExecution[];
  answers: Record<string, ChecklistAnswer[]>;
}

function load(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StorageShape>;
      return {
        templates: parsed.templates ?? [...mockChecklistTemplates],
        executions: parsed.executions ?? [...mockChecklistExecutions],
        answers: parsed.answers ?? { ...mockChecklistAnswers },
      };
    }
  } catch {
    // fall through
  }
  return {
    templates: [...mockChecklistTemplates],
    executions: [...mockChecklistExecutions],
    answers: { ...mockChecklistAnswers },
  };
}

function save(state: StorageShape): StorageShape {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Templates ─────────────────────────────────────────────────────────────────

/** GET /api/company/checklists/templates */
export async function getTemplates(): Promise<ChecklistTemplate[]> {
  await delay();
  const { templates } = load();
  return templates;
}

/** GET /api/company/checklists/templates/:id */
export async function getTemplate(id: string): Promise<ChecklistTemplate | null> {
  await delay();
  const { templates } = load();
  return templates.find(t => t.id === id) ?? null;
}

/** POST /api/company/checklists/templates */
export async function createTemplate(
  data: Omit<ChecklistTemplate, 'id' | 'totalExecutions' | 'createdAt' | 'updatedAt'>,
): Promise<ChecklistTemplate> {
  await delay();
  const state = load();
  const now = new Date().toISOString();
  const template: ChecklistTemplate = {
    ...data,
    id: generateId('tpl'),
    totalExecutions: 0,
    createdAt: now,
    updatedAt: now,
  };
  save({ ...state, templates: [...state.templates, template] });
  return template;
}

/** PUT /api/company/checklists/templates/:id */
export async function updateTemplate(
  id: string,
  data: Partial<Omit<ChecklistTemplate, 'id' | 'createdAt' | 'createdBy'>>,
): Promise<ChecklistTemplate> {
  await delay();
  const state = load();
  const index = state.templates.findIndex(t => t.id === id);
  if (index === -1) throw new Error(`Template ${id} not found`);
  const updated: ChecklistTemplate = {
    ...state.templates[index],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  const templates = [...state.templates];
  templates[index] = updated;
  save({ ...state, templates });
  return updated;
}

/** DELETE /api/company/checklists/templates/:id */
export async function deleteTemplate(id: string): Promise<void> {
  await delay();
  const state = load();
  save({ ...state, templates: state.templates.filter(t => t.id !== id) });
}

/** Toggle template active/inactive (convenience, maps to PUT) */
export async function toggleTemplate(id: string): Promise<ChecklistTemplate> {
  await delay();
  const state = load();
  const index = state.templates.findIndex(t => t.id === id);
  if (index === -1) throw new Error(`Template ${id} not found`);
  const current = state.templates[index];
  const updated: ChecklistTemplate = {
    ...current,
    active: !current.active,
    updatedAt: new Date().toISOString(),
  };
  const templates = [...state.templates];
  templates[index] = updated;
  save({ ...state, templates });
  return updated;
}

// ─── Executions ────────────────────────────────────────────────────────────────

/** GET /api/company/checklists/executions */
export async function getExecutions(filters?: {
  status?: ExecutionStatus;
  templateId?: string;
  unitId?: string;
}): Promise<ChecklistExecution[]> {
  await delay();
  let { executions } = load();
  if (filters?.status) {
    executions = executions.filter(e => e.status === filters.status);
  }
  if (filters?.templateId) {
    executions = executions.filter(e => e.templateId === filters.templateId);
  }
  if (filters?.unitId) {
    executions = executions.filter(e => e.unitId === filters.unitId);
  }
  return executions;
}

/** GET /api/company/checklists/executions/:id */
export async function getExecution(id: string): Promise<ChecklistExecution | null> {
  await delay();
  const { executions } = load();
  return executions.find(e => e.id === id) ?? null;
}

/** POST /api/company/checklists/executions — starts a new execution from a template */
export async function startExecution(
  templateId: string,
  unitId: string,
): Promise<ChecklistExecution> {
  await delay();
  const state = load();
  const template = state.templates.find(t => t.id === templateId);
  if (!template) throw new Error(`Template ${templateId} not found`);

  const now = new Date().toISOString();
  const execution: ChecklistExecution = {
    id: generateId('exec'),
    templateId,
    templateName: template.name,
    category: template.category,
    unitId,
    unitName: unitId, // caller may enrich with a lookup
    userId: 'current-user',
    userName: 'Usuário Atual',
    status: 'in_progress',
    totalItems: template.schema.length,
    answeredItems: 0,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // bump template execution count
  const templateIndex = state.templates.findIndex(t => t.id === templateId);
  const updatedTemplates = [...state.templates];
  updatedTemplates[templateIndex] = {
    ...template,
    totalExecutions: template.totalExecutions + 1,
    lastExecutedAt: now,
    updatedAt: now,
  };

  save({
    ...state,
    templates: updatedTemplates,
    executions: [...state.executions, execution],
  });

  return execution;
}

/** PUT /api/company/checklists/executions/:id — persist answers mid-execution */
export async function saveAnswers(
  executionId: string,
  answers: Omit<ChecklistAnswer, 'id' | 'executionId' | 'createdAt' | 'updatedAt'>[],
): Promise<void> {
  await delay();
  const state = load();
  const execIndex = state.executions.findIndex(e => e.id === executionId);
  if (execIndex === -1) throw new Error(`Execution ${executionId} not found`);

  const now = new Date().toISOString();
  const existingAnswers = state.answers[executionId] ?? [];

  // Upsert answers by fieldKey
  const answerMap = new Map(existingAnswers.map(a => [a.fieldKey, a]));
  for (const incoming of answers) {
    const existing = answerMap.get(incoming.fieldKey);
    if (existing) {
      answerMap.set(incoming.fieldKey, { ...existing, value: incoming.value, updatedAt: now });
    } else {
      answerMap.set(incoming.fieldKey, {
        id: generateId('ans'),
        executionId,
        ...incoming,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const updatedAnswers = Array.from(answerMap.values());
  const execution = state.executions[execIndex];
  const updatedExecution: ChecklistExecution = {
    ...execution,
    answeredItems: updatedAnswers.length,
    updatedAt: now,
  };

  const executions = [...state.executions];
  executions[execIndex] = updatedExecution;

  save({
    ...state,
    executions,
    answers: { ...state.answers, [executionId]: updatedAnswers },
  });
}

/** POST /api/company/checklists/executions/:id/complete */
export async function completeExecution(executionId: string): Promise<ChecklistExecution> {
  await delay();
  const state = load();
  const execIndex = state.executions.findIndex(e => e.id === executionId);
  if (execIndex === -1) throw new Error(`Execution ${executionId} not found`);

  const execution = state.executions[execIndex];
  const answers = state.answers[executionId] ?? [];
  const template = state.templates.find(t => t.id === execution.templateId);
  const requiredFields = template?.schema.filter(f => f.required).length ?? execution.totalItems;
  const answeredRequired = answers.filter(a => {
    const field = template?.schema.find(f => f.key === a.fieldKey);
    return field?.required;
  }).length;

  const score = requiredFields > 0 ? Math.round((answeredRequired / requiredFields) * 100) : 100;
  const now = new Date().toISOString();

  const updated: ChecklistExecution = {
    ...execution,
    status: 'completed',
    score,
    answeredItems: answers.length,
    completedAt: now,
    updatedAt: now,
  };

  const executions = [...state.executions];
  executions[execIndex] = updated;
  save({ ...state, executions });
  return updated;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

/** Aggregated stats for dashboard widgets */
export async function getStats(): Promise<ChecklistStats> {
  await delay();
  const { executions, templates } = load();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const executedToday = executions.filter(e => {
    const d = new Date(e.startedAt);
    return d >= todayStart;
  }).length;

  const pending = executions.filter(e =>
    e.status === 'draft' || e.status === 'in_progress',
  ).length;

  const completedThisWeek = executions.filter(e => {
    if (e.status !== 'completed' && e.status !== 'approved') return false;
    const d = new Date(e.completedAt ?? e.updatedAt);
    return d >= weekStart;
  }).length;

  const completed = executions.filter(e => e.status === 'completed' || e.status === 'approved');
  const complianceRate = completed.length > 0
    ? Math.round(completed.reduce((sum, e) => sum + (e.score ?? 100), 0) / completed.length)
    : mockChecklistStats.complianceRate;

  const activeTemplates = templates.filter(t => t.active).length;

  const recentExecutions = [...executions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return {
    executedToday,
    pending,
    completedThisWeek,
    complianceRate,
    activeTemplates,
    recentExecutions,
  };
}

// ─── Answers ───────────────────────────────────────────────────────────────────

/** GET /api/company/checklists/executions/:id/answers */
export async function getAnswers(executionId: string): Promise<ChecklistAnswer[]> {
  await delay();
  const { answers } = load();
  return answers[executionId] ?? [];
}
