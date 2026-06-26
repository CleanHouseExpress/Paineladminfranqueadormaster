import { apiClient } from '../../../services/apiClient';
import {
  normalizeAssignee,
  normalizeConversation,
  normalizeMessage,
  normalizePaginated,
  normalizeSummary,
  normalizeTimelineEvent,
} from '../adapters';
import type {
  CommunicationAssignee,
  CommunicationConversation,
  CommunicationMessage,
  ConversationTimelineEvent,
  ConversationFilters,
  InboxSummary,
  MessageFilters,
  PaginatedResult,
} from '../types';

const INBOX_BASE = '/api/tenant/communication/inbox';

const buildSearchParams = (filters?: ConversationFilters | MessageFilters) => {
  const params = new URLSearchParams();
  if (!filters) return params;

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;

    const apiKey = key === 'perPage'
      ? 'per_page'
      : key === 'assignmentStatus'
        ? 'assignment_status'
        : key;
    params.set(apiKey, String(value));
  });

  return params;
};

const withParams = (path: string, filters?: ConversationFilters | MessageFilters) => {
  const params = buildSearchParams(filters);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

const normalizeConversationPayload = (payload: unknown) =>
  normalizeConversation((() => {
    if (!payload || typeof payload !== 'object' || !('data' in payload)) return payload;
    const data = (payload as { data: unknown }).data;
    if (data && typeof data === 'object' && 'conversation' in data) {
      return (data as { conversation: unknown }).conversation;
    }
    return data;
  })());

const normalizeMessagePayload = (payload: unknown) =>
  normalizeMessage((() => {
    if (!payload || typeof payload !== 'object' || !('data' in payload)) return payload;
    const data = (payload as { data: unknown }).data;
    if (data && typeof data === 'object' && 'message' in data) {
      return (data as { message: unknown }).message;
    }
    return data;
  })());

export const communicationInboxApi = {
  async getSummary(filters?: ConversationFilters): Promise<InboxSummary> {
    const payload = await apiClient.get<unknown>(withParams(`${INBOX_BASE}/summary`, filters));
    return normalizeSummary(payload);
  },

  async listConversations(filters?: ConversationFilters): Promise<PaginatedResult<CommunicationConversation>> {
    const payload = await apiClient.get<unknown>(withParams(`${INBOX_BASE}/conversations`, filters));
    return normalizePaginated(payload, normalizeConversation);
  },

  async getConversation(conversationId: string | number): Promise<CommunicationConversation> {
    const payload = await apiClient.get<unknown>(`${INBOX_BASE}/conversations/${conversationId}`);
    return normalizeConversationPayload(payload);
  },

  async listMessages(
    conversationId: string | number,
    filters?: MessageFilters,
  ): Promise<PaginatedResult<CommunicationMessage>> {
    const payload = await apiClient.get<unknown>(
      withParams(`${INBOX_BASE}/conversations/${conversationId}/messages`, filters),
    );
    return normalizePaginated(payload, normalizeMessage);
  },

  async listTimeline(conversationId: string | number): Promise<ConversationTimelineEvent[]> {
    const payload = await apiClient.get<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/timeline`,
    );
    return normalizePaginated(payload, normalizeTimelineEvent).data;
  },

  async listAssignees(search?: string): Promise<CommunicationAssignee[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    const query = params.toString();
    const payload = await apiClient.get<unknown>(
      `${INBOX_BASE}/assignees${query ? `?${query}` : ''}`,
    );
    return normalizePaginated(payload, normalizeAssignee).data;
  },

  async requestHandoff(conversationId: string | number, reason?: string): Promise<CommunicationConversation> {
    const payload = await apiClient.post<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/request-handoff`,
      reason ? { reason } : {},
    );
    return normalizeConversationPayload(payload);
  },

  async assignConversation(conversationId: string | number): Promise<CommunicationConversation> {
    const payload = await apiClient.post<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/assign`,
      {},
    );
    return normalizeConversationPayload(payload);
  },

  async closeConversation(conversationId: string | number, reason?: string): Promise<CommunicationConversation> {
    const payload = await apiClient.post<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/close`,
      reason ? { reason } : {},
    );
    return normalizeConversationPayload(payload);
  },

  async reopenConversation(conversationId: string | number): Promise<CommunicationConversation> {
    const payload = await apiClient.post<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/reopen`,
      {},
    );
    return normalizeConversationPayload(payload);
  },

  async returnToAi(conversationId: string | number, reason?: string): Promise<CommunicationConversation> {
    const payload = await apiClient.post<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/return-to-ai`,
      reason ? { reason } : {},
    );
    return normalizeConversationPayload(payload);
  },

  async transferConversation(
    conversationId: string | number,
    assigneeId: string | number,
  ): Promise<CommunicationConversation> {
    const payload = await apiClient.post<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/transfer`,
      { assignee_id: assigneeId },
    );
    return normalizeConversationPayload(payload);
  },

  async sendMessage(conversationId: string | number, text: string): Promise<CommunicationMessage> {
    const payload = await apiClient.post<unknown>(
      `${INBOX_BASE}/conversations/${conversationId}/messages`,
      { text },
    );
    return normalizeMessagePayload(payload);
  },
};
