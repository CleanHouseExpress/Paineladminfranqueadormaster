export interface InboxSummary {
  total: number;
  open: number;
  waitingHandoff: number;
  assigned: number;
  unassigned: number;
  closed: number;
}

export interface ConversationFilters {
  search?: string;
  status?: string;
  statuses?: string[];
  closed?: string;
  handoff?: string;
  assignmentStatus?: string;
  page?: number;
  perPage?: number;
}

export interface MessageFilters {
  page?: number;
  perPage?: number;
}

export interface CommunicationConversation {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  channel: string;
  status: string;
  serviceMode?: string | null;
  handoffStatus?: string | null;
  assignmentStatus?: string | null;
  assignedToName?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastMessageDirection?: string | null;
  lastMessageType?: string | null;
  unreadCount: number;
}

export interface CommunicationContact {
  id: string;
  name: string;
  phone?: string | null;
  provider?: string | null;
  externalId?: string | null;
}

export interface StartConversationPayload {
  contactId?: string;
  contact?: {
    name: string;
    phone: string;
  };
  createUser?: boolean;
}

export interface CommunicationAssignee {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
}

export interface CommunicationMessageMedia {
  type?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  url?: string | null;
  base64?: string | null;
}

export interface CommunicationMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound' | string;
  senderType: 'client' | 'bot' | 'human' | 'system' | string;
  senderName?: string | null;
  messageType?: string | null;
  media?: CommunicationMessageMedia | null;
  body: string;
  createdAt: string;
  status?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
}

export interface MessageDeliveryStatus {
  messageId: string;
  status: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
}

export interface ConversationTimelineEvent {
  id: string;
  eventType: string;
  actorType?: string | null;
  actorName?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

