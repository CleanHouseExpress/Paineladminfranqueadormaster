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
  unreadCount: number;
}

export interface CommunicationMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound' | string;
  senderType: 'client' | 'bot' | 'human' | 'system' | string;
  senderName?: string | null;
  body: string;
  createdAt: string;
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
