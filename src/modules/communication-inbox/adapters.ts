import type {
  CommunicationAssignee,
  CommunicationContact,
  CommunicationConversation,
  CommunicationMessage,
  CommunicationMessageMedia,
  ConversationTimelineEvent,
  InboxSummary,
  MessageDeliveryStatus,
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

const messageTypeLabel = (messageType: unknown) => {
  const type = typeof messageType === 'string' ? messageType.toLowerCase() : '';

  if (type === 'image') return 'Imagem recebida';
  if (type === 'audio') return 'Audio recebido';
  if (type === 'video') return 'Video recebido';
  if (type === 'document') return 'Documento recebido';

  return null;
};

const messageBodyFrom = (record: Record<string, unknown>, fallback = 'Mensagem sem texto') => {
  const text = pick(record, ['body', 'message', 'content', 'text']);

  if (typeof text === 'string' && text.trim() !== '') return text;
  if (typeof text === 'number') return String(text);

  return messageTypeLabel(pick(record, ['message_type', 'messageType', 'type'])) ?? fallback;
};

const normalizeMedia = (record: Record<string, unknown>): CommunicationMessageMedia | null => {
  const media = asRecord(pick(record, ['media', 'attachment', 'file']));
  const source = Object.keys(media).length > 0 ? media : record;
  const url = pick(source, ['url', 'media_url', 'mediaUrl']);
  const base64 = pick(source, ['base64', 'media_base64', 'mediaBase64']);

  if (!url && !base64) return null;

  return {
    type: pick(source, ['type', 'message_type', 'messageType']) as string | null | undefined,
    mimeType: pick(source, ['mime_type', 'mimeType', 'mimetype']) as string | null | undefined,
    fileName: pick(source, ['file_name', 'fileName', 'filename']) as string | null | undefined,
    url: typeof url === 'string' ? url : null,
    base64: typeof base64 === 'string' ? base64 : null,
  };
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
  const rawLastMessage = pick(conversation, ['last_message']);
  const latestMessage = asRecord(pick(conversation, ['latest_message', 'message']) ?? rawLastMessage);
  const lastMessageText = (typeof rawLastMessage === 'string' || typeof rawLastMessage === 'number' ? rawLastMessage : undefined)
    ?? pick(conversation, ['last_message_body', 'preview'])
    ?? messageBodyFrom(latestMessage, '');

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
    lastMessage: typeof lastMessageText === 'string' || typeof lastMessageText === 'number'
      ? String(lastMessageText)
      : null,
    lastMessageAt: (
      pick(conversation, ['last_message_at', 'updated_at', 'created_at'])
      ?? pick(latestMessage, ['occurred_at', 'created_at', 'timestamp'])
    ) as string | null | undefined,
    lastMessageDirection: pick(latestMessage, ['direction']) as string | null | undefined,
    lastMessageType: pick(latestMessage, ['message_type', 'messageType', 'type']) as string | null | undefined,
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
    messageType: pick(message, ['message_type', 'messageType', 'type']) as string | null | undefined,
    media: normalizeMedia(message),
    body: messageBodyFrom(message),
    createdAt: toStringValue(pick(message, ['created_at', 'createdAt', 'timestamp']), new Date(0).toISOString()),
    status: pick(message, ['status', 'delivery_status', 'deliveryStatus']) as string | null | undefined,
    sentAt: pick(message, ['sent_at', 'sentAt']) as string | null | undefined,
    deliveredAt: pick(message, ['delivered_at', 'deliveredAt']) as string | null | undefined,
    readAt: pick(message, ['read_at', 'readAt']) as string | null | undefined,
    failedAt: pick(message, ['failed_at', 'failedAt']) as string | null | undefined,
  };
}

export function normalizeMessageDeliveryStatus(payload: unknown): MessageDeliveryStatus {
  const status = asRecord(payload);
  const message = asRecord(pick(status, ['message']));

  return {
    messageId: toStringValue(
      pick(status, ['message_id', 'messageId', 'id'])
        ?? pick(message, ['id', 'message_id']),
    ),
    status: toStringValue(pick(status, ['status', 'delivery_status', 'deliveryStatus']), 'unknown'),
    sentAt: pick(status, ['sent_at', 'sentAt']) as string | null | undefined,
    deliveredAt: pick(status, ['delivered_at', 'deliveredAt']) as string | null | undefined,
    readAt: pick(status, ['read_at', 'readAt']) as string | null | undefined,
    failedAt: pick(status, ['failed_at', 'failedAt']) as string | null | undefined,
  };
}

export function normalizeContact(payload: unknown): CommunicationContact {
  const contact = asRecord(payload);

  return {
    id: toStringValue(pick(contact, ['id', 'contact_id'])),
    name: toStringValue(pick(contact, ['name', 'full_name', 'display_name']), 'Cliente sem nome'),
    phone: pick(contact, ['phone', 'mobile', 'external_id']) as string | null | undefined,
    provider: pick(contact, ['provider']) as string | null | undefined,
    externalId: pick(contact, ['external_id', 'externalId']) as string | null | undefined,
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


