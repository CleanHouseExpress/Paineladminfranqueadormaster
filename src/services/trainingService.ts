import { apiClient, apiClientConfig } from './apiClient';
import type {
  Training,
  TrainingAssignment,
  TrainingCategory,
  TrainingDocument,
  TrainingStats,
  TrainingStatus,
  UserProgress,
  UserProgressStatus,
} from '../types/training';

export interface TrainingFilters {
  status?: TrainingStatus | '';
  category?: TrainingCategory | string;
  mandatory?: boolean | '';
  search?: string;
  documentId?: string;
  userId?: string;
  unitId?: string;
}

interface ApiList<T> {
  data: T[];
}

interface ApiItem<T> {
  data: T;
}

interface ApiTrainingUser {
  id: number | string;
  name?: string | null;
  email?: string | null;
  status?: 'assigned' | 'in_progress' | 'completed' | null;
  progress_percentage?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ApiTrainingUnit {
  id: number | string;
  name?: string | null;
}

interface ApiTraining {
  id: number | string;
  title: string;
  description?: string | null;
  document_id?: number | string | null;
  document_name?: string | null;
  document_url?: string | null;
  status: TrainingStatus;
  category?: string | null;
  duration_minutes?: number | null;
  mandatory?: boolean | number | null;
  published_at?: string | null;
  archived_at?: string | null;
  created_by?: number | string | null;
  users?: ApiTrainingUser[];
  units?: ApiTrainingUnit[];
  created_at?: string | null;
  updated_at?: string | null;
}

interface ApiMetrics {
  total: number;
  published: number;
  draft: number;
  mandatory: number;
  average_progress: number;
}

export interface ApiOption {
  value: number | string;
  label: string;
}

function absoluteApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiClientConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function initials(name?: string | null) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? 'U') + (words[1]?.[0] ?? words[0]?.[1] ?? 'S')).toUpperCase();
}

function normalizeCategory(category?: string | null): TrainingCategory {
  const value = (category || 'operacional') as TrainingCategory;
  const allowed: TrainingCategory[] = ['operacional', 'financeiro', 'atendimento', 'compliance', 'seguranca', 'lideranca', 'tecnico', 'comercial'];
  return allowed.includes(value) ? value : 'operacional';
}

function documentType(name?: string | null): TrainingDocument['fileType'] {
  const lower = String(name ?? '').toLowerCase();
  if (lower.endsWith('.pptx')) return 'pptx';
  if (lower.endsWith('.mp4')) return 'mp4';
  if (lower.endsWith('.docx')) return 'docx';
  return 'pdf';
}

function toDocument(api: ApiTraining): TrainingDocument | undefined {
  if (!api.document_id) return undefined;
  const name = api.document_name ?? 'Material de apoio';

  return {
    id: String(api.document_id),
    name,
    fileType: documentType(name),
    fileSize: 0,
    fileSizeFormatted: 'Arquivo vinculado',
    uploadedAt: api.created_at ?? new Date().toISOString(),
  };
}

function toUserStatus(status?: string | null, progress = 0): UserProgressStatus {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress' || progress > 0) return 'in_progress';
  return 'not_started';
}

function avgProgress(users: ApiTrainingUser[] = []) {
  if (users.length === 0) return 0;
  return Math.round(users.reduce((sum, user) => sum + Number(user.progress_percentage ?? 0), 0) / users.length);
}

function completedUsers(users: ApiTrainingUser[] = []) {
  return users.filter(user => user.status === 'completed' || Number(user.progress_percentage ?? 0) >= 100).length;
}

function toTraining(api: ApiTraining): Training {
  const users = api.users ?? [];
  const units = api.units ?? [];
  const createdAt = api.created_at ?? new Date().toISOString();
  const updatedAt = api.updated_at ?? createdAt;

  return {
    id: String(api.id),
    title: api.title,
    description: api.description ?? undefined,
    category: normalizeCategory(api.category),
    status: api.status,
    mandatory: Boolean(api.mandatory),
    durationMinutes: Number(api.duration_minutes ?? 0),
    document: toDocument(api),
    documentId: api.document_id ? String(api.document_id) : undefined,
    createdBy: api.created_by ? `Usuario ${api.created_by}` : 'Sistema',
    createdByAvatar: api.created_by ? `U${api.created_by}` : 'SI',
    publishedAt: api.published_at ?? undefined,
    createdAt,
    updatedAt,
    assignedUsers: users.length,
    assignedUnits: units.length,
    completedUsers: completedUsers(users),
    avgProgress: avgProgress(users),
  };
}

function toPayload(data: Partial<Training>) {
  return {
    title: data.title,
    description: data.description ?? null,
    document_id: data.documentId ? Number(data.documentId) : null,
    status: data.status,
    category: data.category,
    duration_minutes: data.durationMinutes ? Number(data.durationMinutes) : null,
    mandatory: Boolean(data.mandatory),
  };
}

function queryString(filters?: TrainingFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.category) params.set('category', String(filters.category));
  if (filters?.mandatory !== '' && filters?.mandatory !== undefined) params.set('mandatory', filters.mandatory ? '1' : '0');
  if (filters?.search) params.set('search', filters.search);
  if (filters?.documentId) params.set('document_id', filters.documentId);
  if (filters?.userId) params.set('user_id', filters.userId);
  if (filters?.unitId) params.set('unit_id', filters.unitId);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getTrainings(filters?: TrainingFilters): Promise<Training[]> {
  const response = await apiClient.get<ApiList<ApiTraining>>(`/api/company/trainings${queryString(filters)}`);
  return response.data.map(toTraining);
}

export async function getTraining(id: string): Promise<Training | null> {
  try {
    const response = await apiClient.get<ApiItem<ApiTraining>>(`/api/company/trainings/${id}`);
    return toTraining(response.data);
  } catch {
    return null;
  }
}

export async function createTraining(data: Partial<Training>): Promise<Training> {
  const response = await apiClient.post<ApiItem<ApiTraining>>('/api/company/trainings', toPayload(data));
  return toTraining(response.data);
}

export async function updateTraining(id: string, data: Partial<Training>): Promise<Training> {
  const response = await apiClient.put<ApiItem<ApiTraining>>(`/api/company/trainings/${id}`, toPayload(data));
  return toTraining(response.data);
}

export async function deleteTraining(id: string): Promise<void> {
  await apiClient.delete<void>(`/api/company/trainings/${id}`);
}

export async function publishTraining(id: string): Promise<Training> {
  const response = await apiClient.patch<ApiItem<ApiTraining>>(`/api/company/trainings/${id}/publish`, {});
  return toTraining(response.data);
}

export async function archiveTraining(id: string): Promise<Training> {
  const response = await apiClient.patch<ApiItem<ApiTraining>>(`/api/company/trainings/${id}/archive`, {});
  return toTraining(response.data);
}

export async function getProgress(trainingId: string): Promise<UserProgress[]> {
  const response = await apiClient.get<ApiItem<ApiTraining>>(`/api/company/trainings/${trainingId}`);
  return (response.data.users ?? []).map(user => {
    const progress = Number(user.progress_percentage ?? 0);
    const name = user.name ?? user.email ?? `Usuario ${user.id}`;

    return {
      userId: String(user.id),
      userName: name,
      userAvatar: initials(name),
      unitName: '',
      status: toUserStatus(user.status, progress),
      progressPercent: progress,
      completedAt: user.completed_at ?? undefined,
      lastAccessedAt: user.started_at ?? undefined,
    };
  });
}

export async function getAssignments(trainingId: string): Promise<TrainingAssignment[]> {
  const response = await apiClient.get<ApiItem<ApiTraining>>(`/api/company/trainings/${trainingId}`);
  const training = response.data;

  return [
    ...(training.users ?? []).map(user => ({
      id: `${trainingId}-user-${user.id}`,
      trainingId,
      type: 'user' as const,
      targetId: String(user.id),
      targetName: user.name ?? user.email ?? `Usuario ${user.id}`,
      targetAvatar: initials(user.name ?? user.email),
      assignedAt: training.created_at ?? new Date().toISOString(),
      assignedBy: 'Sistema',
    })),
    ...(training.units ?? []).map(unit => ({
      id: `${trainingId}-unit-${unit.id}`,
      trainingId,
      type: 'unit' as const,
      targetId: String(unit.id),
      targetName: unit.name ?? `Unidade ${unit.id}`,
      assignedAt: training.created_at ?? new Date().toISOString(),
      assignedBy: 'Sistema',
    })),
  ];
}

export async function assignUsers(trainingId: string, userIds: string[]): Promise<void> {
  await apiClient.put<ApiItem<ApiTraining>>(`/api/company/trainings/${trainingId}/users`, {
    user_ids: userIds.map(Number),
  });
}

export async function assignUnits(trainingId: string, unitIds: string[]): Promise<void> {
  await apiClient.put<ApiItem<ApiTraining>>(`/api/company/trainings/${trainingId}/units`, {
    unit_ids: unitIds.map(Number),
  });
}

export async function getStats(): Promise<TrainingStats> {
  const metrics = await apiClient.get<ApiMetrics>('/api/company/trainings/metrics');
  const trainings = await getTrainings();
  const publishedTrainings = trainings.filter(training => training.status === 'published');

  return {
    total: metrics.total,
    published: metrics.published,
    draft: metrics.draft,
    mandatory: metrics.mandatory,
    avgProgress: Math.round(metrics.average_progress),
    recentTrainings: trainings.slice(0, 5),
    mandatoryTrainings: publishedTrainings.filter(training => training.mandatory),
    topTrainings: [...publishedTrainings].sort((a, b) => b.completedUsers - a.completedUsers).slice(0, 5),
  };
}

export async function getDocumentOptions(): Promise<ApiOption[]> {
  return apiClient.get<ApiOption[]>('/api/company/documents/options');
}

export async function getUserOptions(): Promise<ApiOption[]> {
  return apiClient.get<ApiOption[]>('/api/company/users/options');
}

export async function getUnitOptions(): Promise<ApiOption[]> {
  return apiClient.get<ApiOption[]>('/api/company/units/options');
}

export function documentDownloadUrl(training: Training): string | null {
  return training.documentId
    ? absoluteApiUrl(`/api/company/documents/${training.documentId}/download`)
    : null;
}
