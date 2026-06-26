import type {
  CommunicationAssignee,
  CommunicationConversation,
  CommunicationMessage,
  ConversationTimelineEvent,
  InboxSummary,
  PaginatedResult,
} from './types';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const pick = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
};

const toStringValue = (value: unknown, fallback = '') =>
  value === undefined || value === null ? fallback : String(value);

const toNumberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const unwrapData = (payload: unknown): unknown => {
  const record = asRecord(payload);
  return record.data ?? payload;
};

export function normalizeSummary(payload: unknown): InboxSummary {
  const summary = asRecord(unwrapData(payload));

  return {
    total: toNumberValue(pick(summary, ['total', 'total_conversations', 'conversations_total'])),
    open: toNumberValue(pick(summary, ['open', 'active', 'open_conversations'])),
    waitingHandoff: toNumberValue(pick(summary, ['waiting_handoff', 'handoff_requested', 'pending_handoff'])),
    assigned: toNumberValue(pick(summary, ['assigned', 'assigned_conversations'])),
    unassigned: toNumberValue(pick(summary, ['unassigned', 'unassigned_conversations'])),
    closed: toNumberValue(pick(summary, ['closed', 'closed_conversations'])),
  };
}

export function normalizeConversation(payload: unknown): CommunicationConversation {
  const conversation = asRecord(payload);
  const customer = asRecord(pick(conversation, ['customer', 'client', 'contact']));
  const assignee = asRecord(pick(conversation, ['assigned_to', 'assignee', 'attendant']));
  const assignment = asRecord(pick(conversation, ['assignment']));

  return {
    id: toStringValue(pick(conversation, ['id', 'conversation_id'])),
    customerName: toStringValue(
      pick(conversation, ['customer_name', 'client_name', 'contact_name', 'name'])
        ?? pick(customer, ['name', 'full_name']),
      'Cliente sem nome',
    ),
    customerPhone: (
      pick(conversation, ['customer_phone', 'client_phone', 'phone'])
      ?? pick(customer, ['phone', 'mobile'])
    ) as string | null | undefined,
    channel: toStringValue(pick(conversation, ['channel', 'source']), 'unknown'),
    status: toStringValue(pick(conversation, ['status']), 'unknown'),
    serviceMode: pick(conversation, ['service_mode', 'serviceMode']) as string | null | undefined,
    handoffStatus: (
      pick(conversation, ['handoff_status', 'handoff'])
      ?? pick(assignment, ['handoff_status'])
    ) as string | null | undefined,
    assignmentStatus: (
      pick(conversation, ['assignment_status'])
      ?? pick(assignment, ['status'])
    ) as string | null | undefined,
    assignedToName: (
      pick(conversation, ['assigned_to_name', 'assignee_name', 'attendant_name'])
      ?? pick(assignee, ['name'])
      ?? pick(assignment, ['assignee_name'])
    ) as string | null | undefined,
    lastMessage: pick(conversation, ['last_message', 'last_message_body', 'preview']) as string | null | undefined,
    lastMessageAt: pick(conversation, ['last_message_at', 'updated_at', 'created_at']) as string | null | undefined,
    unreadCount: toNumberValue(pick(conversation, ['unread_count', 'unread'])),
  };
}

export function normalizeMessage(payload: unknown): CommunicationMessage {
  const message = asRecord(payload);
  const sender = asRecord(pick(message, ['sender', 'user']));

  return {
    id: toStringValue(pick(message, ['id', 'message_id'])),
    conversationId: toStringValue(pick(message, ['conversation_id', 'conversationId'])),
    direction: toStringValue(pick(message, ['direction']), 'inbound'),
    senderType: toStringValue(pick(message, ['sender_type', 'senderType', 'type']), 'client'),
    senderName: (
      pick(message, ['sender_name'])
      ?? pick(sender, ['name'])
    ) as string | null | undefined,
    body: toStringValue(pick(message, ['body', 'message', 'content', 'text'])),
    createdAt: toStringValue(pick(message, ['created_at', 'createdAt', 'timestamp']), new Date(0).toISOString()),
  };
}

export function normalizeAssignee(payload: unknown): CommunicationAssignee {
  const assignee = asRecord(payload);
  const user = asRecord(pick(assignee, ['user', 'assignee', 'attendant']));

  return {
    id: toStringValue(
      pick(assignee, ['id', 'user_id', 'assignee_id'])
        ?? pick(user, ['id', 'user_id']),
    ),
    name: toStringValue(
      pick(assignee, ['name', 'full_name', 'display_name'])
        ?? pick(user, ['name', 'full_name', 'display_name']),
      'Atendente sem nome',
    ),
    email: (
      pick(assignee, ['email'])
      ?? pick(user, ['email'])
    ) as string | null | undefined,
    role: (
      pick(assignee, ['role', 'role_name', 'profile'])
      ?? pick(user, ['role', 'role_name', 'profile'])
    ) as string | null | undefined,
  };
}

export function normalizeTimelineEvent(payload: unknown): ConversationTimelineEvent {
  const event = asRecord(payload);
  const actor = asRecord(pick(event, ['actor', 'user']));
  const metadata = pick(event, ['metadata', 'meta']);

  return {
    id: toStringValue(pick(event, ['id', 'event_id'])),
    eventType: toStringValue(pick(event, ['event_type', 'eventType', 'type']), 'unknown'),
    actorType: (
      pick(event, ['actor_type', 'actorType'])
      ?? pick(actor, ['type'])
    ) as string | null | undefined,
    actorName: (
      pick(event, ['actor_name', 'actorName'])
      ?? pick(actor, ['name'])
    ) as string | null | undefined,
    description: pick(event, ['description', 'message', 'label']) as string | null | undefined,
    metadata: metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata as Record<string, unknown>
      : null,
    occurredAt: toStringValue(pick(event, ['occurred_at', 'occurredAt', 'created_at', 'createdAt', 'timestamp'])),
  };
}

export function normalizePaginated<T>(
  payload: unknown,
  normalizer: (item: unknown) => T,
): PaginatedResult<T> {
  const root = asRecord(payload);
  const dataCandidate = root.data;
  const nested = asRecord(dataCandidate);
  const rows = Array.isArray(dataCandidate)
    ? dataCandidate
    : Array.isArray(nested.data)
      ? nested.data
      : Array.isArray(payload)
        ? payload
        : [];
  const meta = asRecord(root.meta ?? nested.meta ?? dataCandidate ?? root);

  return {
    data: rows.map(normalizer),
    meta: {
      currentPage: toNumberValue(pick(meta, ['current_page', 'currentPage']), 1),
      lastPage: toNumberValue(pick(meta, ['last_page', 'lastPage']), 1),
      perPage: toNumberValue(pick(meta, ['per_page', 'perPage']), rows.length),
      total: toNumberValue(pick(meta, ['total']), rows.length),
    },
  };
}
