import { apiClient } from '../../../services/apiClient';
import {
  normalizeConversation,
  normalizeMessage,
  normalizePaginated,
  normalizeSummary,
} from '../adapters';
import type {
  CommunicationConversation,
  CommunicationMessage,
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
    return normalizeConversation(
      payload && typeof payload === 'object' && 'data' in payload
        ? (payload as { data: unknown }).data
        : payload,
    );
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
};
