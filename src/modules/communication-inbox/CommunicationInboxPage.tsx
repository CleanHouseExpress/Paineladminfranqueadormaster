import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  Send,
  Tag,
  UserCheck,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import type { CommunicationAssignee, CommunicationConversation, ConversationFilters } from './types';
import { CommunicationAreaShell } from './CommunicationAreaShell';
import { ConversationTimelinePanel } from './ConversationTimelinePanel';
import { useAuth } from '../../shared/context/AuthContext';
import { useTenant } from '../../shared/context/TenantContext';
import { useRealtime } from '../../services/realtime';
import {
  useConversation,
  useConversationMessages,
  useConversationTimeline,
  useCommunicationAssignees,
  useAssignConversation,
  useCloseConversation,
  useInboxConversations,
  useInboxSummary,
  useReopenConversation,
  useRequestHandoff,
  useReturnToAi,
  useSendMessage,
  useTransferConversation,
} from './hooks';

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'open', label: 'Abertas' },
  { value: 'waiting_handoff', label: 'Aguardando handoff' },
  { value: 'in_progress', label: 'Em atendimento' },
  { value: 'closed', label: 'Encerradas' },
];

const handoffOptions = [
  { value: 'all', label: 'Todos handoffs' },
  { value: 'requested', label: 'Solicitado' },
  { value: 'none', label: 'Sem handoff' },
];

const assignmentOptions = [
  { value: 'all', label: 'Todas atribuicoes' },
  { value: 'assigned', label: 'Atribuidas' },
  { value: 'unassigned', label: 'Sem responsavel' },
];

const realtimeEvents = [
  'ConversationCreated',
  'ConversationUpdated',
  'ConversationAssigned',
  'ConversationReturnedToAi',
  'ConversationClosed',
  'ConversationReopened',
  'ConversationHandoffRequested',
  'MessageReceived',
  'MessageSent',
  'MessageStatusUpdated',
  'TimelineUpdated',
] as const;

type CommunicationRealtimeEvent = typeof realtimeEvents[number];

const messageRealtimeEvents: CommunicationRealtimeEvent[] = ['MessageReceived', 'MessageSent'];

function readStringField(payload: unknown, keys: string[]): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }

  return null;
}

function getRealtimeConversationId(payload: unknown): string | null {
  const direct = readStringField(payload, ['conversation_id', 'conversationId']);
  if (direct) return direct;

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const conversation = record.conversation;
    const fromConversation = readStringField(conversation, ['id', 'conversation_id', 'conversationId']);
    if (fromConversation) return fromConversation;

    const message = record.message;
    const fromMessage = readStringField(message, ['conversation_id', 'conversationId']);
    if (fromMessage) return fromMessage;
  }

  return null;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  const displayValue = value === undefined || value === null || value === '' ? 'Nao informado' : value;

  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">{displayValue}</p>
    </div>
  );
}

function formatServiceModeLabel(value?: string | null) {
  const mode = String(value ?? '').toLowerCase();
  if (mode === 'ai') return 'IA';
  if (mode === 'human') return 'Humano';
  return value ?? '';
}

function formatHandoffStatusLabel(value?: string | null) {
  const status = String(value ?? '').toLowerCase();
  if (status === 'requested') return 'Aguardando humano';
  if (status === 'assigned') return 'Assumido';
  return value ?? '';
}

function formatDeliveryStatusLabel(value?: string | null) {
  const status = String(value ?? '').toLowerCase();
  if (['pending', 'sending'].includes(status)) return 'Enviando...';
  if (status === 'sent') return 'Enviada âœ“';
  if (status === 'delivered') return 'Entregue âœ“âœ“';
  if (status === 'read') return 'Lida âœ“âœ“';
  if (status === 'failed') return 'Falhou';
  return value ?? '';
}

function getDeliveryStatusClass(value?: string | null) {
  const status = String(value ?? '').toLowerCase();
  if (status === 'failed') return 'bg-red-50 text-red-700';
  if (status === 'read') return 'bg-emerald-50 text-emerald-700';
  if (status === 'delivered') return 'bg-blue-50 text-blue-700';
  if (status === 'sent') return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-500';
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">Nao foi possivel carregar esta area.</p>
          <p className="mt-1 text-red-700">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  selected,
  onSelect,
}: {
  conversation: CommunicationConversation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full border-b border-slate-100 px-4 py-3 text-left transition ${
        selected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 flex-shrink-0 text-blue-600" />
            <p className="truncate text-sm font-semibold text-slate-950">{conversation.customerName}</p>
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">
            {conversation.lastMessage || 'Sem mensagens recentes'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{conversation.channel}</span>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">{conversation.status}</span>
            {conversation.serviceMode && (
              <span className="rounded bg-violet-50 px-2 py-0.5 text-violet-700">
                {formatServiceModeLabel(conversation.serviceMode)}
              </span>
            )}
            {conversation.handoffStatus && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700">
                {formatHandoffStatusLabel(conversation.handoffStatus)}
              </span>
            )}
            {conversation.assignmentStatus && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">
                {conversation.assignmentStatus}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="whitespace-nowrap text-xs text-slate-500">{formatDateTime(conversation.lastMessageAt)}</span>
          {conversation.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function AssigneeItem({
  assignee,
  selected,
  onSelect,
}: {
  assignee: CommunicationAssignee;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition ${
        selected
          ? 'border-blue-300 bg-blue-50'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
      data-testid={`communication-assignee-${assignee.id}`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <UserRound className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{assignee.name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-600">{assignee.email ?? 'Sem e-mail'}</p>
        {assignee.role && (
          <p className="mt-1 text-xs font-medium text-slate-500">{assignee.role}</p>
        )}
      </div>
      {selected && <UserCheck className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600" />}
    </button>
  );
}

const isClosedConversation = (conversation: CommunicationConversation | null) =>
  String(conversation?.status ?? '').toLowerCase() === 'closed';

const hasRequestedHandoff = (conversation: CommunicationConversation | null) => {
  const status = String(conversation?.handoffStatus ?? '').toLowerCase();
  return ['requested', 'pending', 'waiting', 'waiting_handoff', 'handoff_requested'].includes(status);
};

const isAssignedToCurrentUser = (conversation: CommunicationConversation | null) => {
  const status = String(conversation?.assignmentStatus ?? '').toLowerCase();
  return ['assigned_to_me', 'mine', 'me'].includes(status);
};

const isHumanConversation = (conversation: CommunicationConversation | null) => {
  const serviceMode = String(conversation?.serviceMode ?? '').toLowerCase();
  const handoffStatus = String(conversation?.handoffStatus ?? '').toLowerCase();
  return serviceMode === 'human' || handoffStatus === 'assigned';
};

export function CommunicationInboxPage() {
  const realtime = useRealtime();
  const { context, company } = useAuth();
  const { tenant } = useTenant();
  const [filters, setFilters] = useState<ConversationFilters>({
    search: '',
    status: 'all',
    handoff: 'all',
    assignmentStatus: 'all',
    page: 1,
    perPage: 25,
  });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeConversationTab, setActiveConversationTab] = useState<'messages' | 'timeline'>('messages');
  const realtimeDedupeRef = useRef(new Map<string, number>());
  const tenantId = String(context?.companyId ?? company?.id ?? tenant.id ?? '').trim();
  const tenantRealtimeChannel = tenantId ? `tenant.${tenantId}.communication` : null;
  const conversationRealtimeChannel = selectedConversationId ? `conversation.${selectedConversationId}` : null;
  const realtimeAvailable = realtime.isAvailable === true;

  const summaryQuery = useInboxSummary(filters);
  const conversationsQuery = useInboxConversations(filters);

  const selectedConversationQuery = useConversation(selectedConversationId);
  const messagesQuery = useConversationMessages(selectedConversationId);
  const timelineQuery = useConversationTimeline(
    activeConversationTab === 'timeline' ? selectedConversationId : null,
  );
  const requestHandoffMutation = useRequestHandoff();
  const assignMutation = useAssignConversation();
  const closeMutation = useCloseConversation();
  const reopenMutation = useReopenConversation();
  const returnToAiMutation = useReturnToAi();
  const sendMessageMutation = useSendMessage();
  const transferMutation = useTransferConversation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [transferPanelOpen, setTransferPanelOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const assigneesQuery = useCommunicationAssignees(assigneeSearch, transferPanelOpen);

  const conversations = conversationsQuery.data?.data ?? [];
  const conversationMeta = conversationsQuery.data?.meta;
  const selectedConversation = selectedConversationQuery.data
    ?? conversations.find(conversation => conversation.id === selectedConversationId)
    ?? null;
  const messageStatusById = useMemo(() => {
    const statuses = new Map<string, { status?: string | null; sentAt?: string | null; deliveredAt?: string | null; readAt?: string | null; failedAt?: string | null }>();
    for (const message of messagesQuery.data?.data ?? []) {
      statuses.set(message.id, {
        status: message.status,
        sentAt: message.sentAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
        failedAt: message.failedAt,
      });
    }
    return statuses;
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
    if (selectedConversationId && conversations.length > 0 && !conversations.some(item => item.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    setTransferPanelOpen(false);
    setAssigneeSearch('');
    setSelectedAssigneeId(null);
    setTransferError(null);
  }, [selectedConversationId]);

  const summaryCards = useMemo(() => {
    const summary = summaryQuery.data ?? {
      total: 0,
      open: 0,
      waitingHandoff: 0,
      assigned: 0,
      unassigned: 0,
      closed: 0,
    };

    return [
      { label: 'Total', value: summary.total },
      { label: 'Abertas', value: summary.open },
      { label: 'Handoff', value: summary.waitingHandoff },
      { label: 'Atribuidas', value: summary.assigned },
      { label: 'Sem responsavel', value: summary.unassigned },
      { label: 'Encerradas', value: summary.closed },
    ];
  }, [summaryQuery.data]);

  const updateFilter = (key: keyof ConversationFilters, value: string) => {
    setFilters(current => ({ ...current, [key]: value, page: 1 }));
    setSelectedConversationId(null);
    setActiveConversationTab('messages');
  };

  const updateConversationPage = (page: number) => {
    setFilters(current => ({ ...current, page }));
    setSelectedConversationId(null);
    setActiveConversationTab('messages');
  };

  const refreshSelectedConversation = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      conversationsQuery.refetch(),
      selectedConversationId ? selectedConversationQuery.refetch() : Promise.resolve(),
    ]);
  };

  const refreshConversationAfterMessage = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      conversationsQuery.refetch(),
      selectedConversationId ? selectedConversationQuery.refetch() : Promise.resolve(),
      selectedConversationId ? messagesQuery.refetch() : Promise.resolve(),
    ]);
  };

  const handleRealtimeEvent = useCallback((event: CommunicationRealtimeEvent, payload: unknown) => {
    const conversationId = getRealtimeConversationId(payload);
    const dedupeKey = `${event}:${conversationId ?? 'global'}`;
    const now = Date.now();
    const lastRunAt = realtimeDedupeRef.current.get(dedupeKey) ?? 0;

    if (now - lastRunAt < 250) return;
    realtimeDedupeRef.current.set(dedupeKey, now);

    const shouldRefreshSelectedConversation =
      Boolean(conversationId && selectedConversationId && conversationId === selectedConversationId);
    const shouldRefreshMessages = shouldRefreshSelectedConversation && messageRealtimeEvents.includes(event);
    const shouldRefreshStatuses = shouldRefreshSelectedConversation && event === 'MessageStatusUpdated';
    const shouldRefreshTimeline =
      shouldRefreshSelectedConversation &&
      event === 'TimelineUpdated' &&
      activeConversationTab === 'timeline';

    void Promise.all([
      summaryQuery.refetch(),
      conversationsQuery.refetch(),
      shouldRefreshSelectedConversation ? selectedConversationQuery.refetch() : Promise.resolve(),
      shouldRefreshMessages ? messagesQuery.refetch() : Promise.resolve(),
      shouldRefreshStatuses ? messagesQuery.refetch() : Promise.resolve(),
      shouldRefreshTimeline ? timelineQuery.refetch() : Promise.resolve(),
    ]);
  }, [
    activeConversationTab,
    conversationsQuery,
    messagesQuery,
    selectedConversationId,
    selectedConversationQuery,
    summaryQuery,
    timelineQuery,
  ]);

  useEffect(() => {
    if (!realtimeAvailable || !tenantRealtimeChannel) return undefined;

    realtime.subscribe(tenantRealtimeChannel);
    return () => realtime.unsubscribe(tenantRealtimeChannel);
  }, [realtime, realtimeAvailable, tenantRealtimeChannel]);

  useEffect(() => {
    if (!realtimeAvailable || !conversationRealtimeChannel) return undefined;

    realtime.subscribe(conversationRealtimeChannel);
    return () => realtime.unsubscribe(conversationRealtimeChannel);
  }, [conversationRealtimeChannel, realtime, realtimeAvailable]);

  useEffect(() => {
    if (!realtimeAvailable) return undefined;

    const registrations = realtimeEvents.map(event => {
      const handler = (payload: unknown) => handleRealtimeEvent(event, payload);
      realtime.listen(event, handler);
      return { event, handler };
    });

    return () => {
      registrations.forEach(({ event, handler }) => realtime.stopListening(event, handler));
    };
  }, [handleRealtimeEvent, realtime, realtimeAvailable]);

  const runConversationAction = async (
    action: () => Promise<unknown>,
    refresh: () => Promise<void> = refreshSelectedConversation,
  ) => {
    setActionError(null);
    try {
      await action();
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Nao foi possivel executar a acao.');
    }
  };

  const actionInProgress =
    requestHandoffMutation.isLoading ||
    assignMutation.isLoading ||
    closeMutation.isLoading ||
    reopenMutation.isLoading ||
    returnToAiMutation.isLoading ||
    transferMutation.isLoading;
  const conversationClosed = isClosedConversation(selectedConversation);
  const conversationInHumanMode = isHumanConversation(selectedConversation);
  const canRequestHandoff =
    Boolean(selectedConversationId) && !conversationClosed && !hasRequestedHandoff(selectedConversation);
  const canAssign =
    Boolean(selectedConversationId) && !conversationClosed && !isAssignedToCurrentUser(selectedConversation);
  const canClose = Boolean(selectedConversationId) && !conversationClosed;
  const canReopen = Boolean(selectedConversationId) && conversationClosed;
  const canReturnToAi = Boolean(selectedConversationId) && !conversationClosed && conversationInHumanMode;
  const canTransfer = Boolean(selectedConversationId) && !conversationClosed;
  const trimmedMessageText = messageText.trim();
  const canSendMessage =
    Boolean(selectedConversationId) &&
    !conversationClosed &&
    conversationInHumanMode &&
    Boolean(trimmedMessageText) &&
    !sendMessageMutation.isLoading;

  const handleSendMessage = async (nextMessageText = messageText) => {
    const textToSend = nextMessageText.trim();
    const canSendText =
      Boolean(selectedConversationId) &&
      !conversationClosed &&
      conversationInHumanMode &&
      Boolean(textToSend) &&
      !sendMessageMutation.isLoading;

    if (!selectedConversationId || !canSendText) return;

    setSendError(null);
    try {
      await sendMessageMutation.mutate(selectedConversationId, textToSend);
      setMessageText('');
      await refreshConversationAfterMessage();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Nao foi possivel enviar a mensagem.');
    }
  };

  const closeTransferPanel = () => {
    setTransferPanelOpen(false);
    setAssigneeSearch('');
    setSelectedAssigneeId(null);
    setTransferError(null);
  };

  const handleTransferConversation = async () => {
    if (!selectedConversationId || !selectedAssigneeId || transferMutation.isLoading) return;

    setTransferError(null);
    try {
      await transferMutation.mutate(selectedConversationId, selectedAssigneeId);
      closeTransferPanel();
      await refreshSelectedConversation();
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Nao foi possivel transferir a conversa.');
    }
  };

  return (
    <CommunicationAreaShell title="Caixa de Entrada" subtitle="Leitura de conversas e mensagens vindas da orchestra-api.">
    <main className="flex h-full min-h-0 flex-col bg-slate-50" data-testid="communication-inbox-page">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Inbox className="h-4 w-4" />
              Communication Inbox
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Caixa de comunicacao</h1>
            <p className="mt-1 text-sm text-slate-600">Leitura de conversas e mensagens vindas da orchestra-api.</p>
            <div
              className={`mt-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                realtimeAvailable
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
              data-testid="communication-realtime-status"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  realtimeAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {realtimeAvailable ? 'Tempo real ativo' : 'Offline / tempo real indisponivel'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void summaryQuery.refetch();
              void conversationsQuery.refetch();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </header>

      <section className="space-y-4 px-6 py-5">
        {summaryQuery.isError ? (
          <ErrorState message={summaryQuery.error?.message ?? 'Erro ao carregar resumo.'} onRetry={summaryQuery.refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6" data-testid="communication-inbox-summary">
            {summaryQuery.isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-lg border border-slate-200 bg-white" />
              ))
              : summaryCards.map(card => (
                <SummaryCard key={card.label} label={card.label} value={card.value} />
              ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            Busca
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={filters.search ?? ''}
                onChange={event => updateFilter('search', event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900"
                placeholder="Nome, telefone ou texto"
                data-testid="communication-filter-search"
              />
            </div>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={filters.status}
              onChange={event => updateFilter('status', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              data-testid="communication-filter-status"
            >
              {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Handoff
            <select
              value={filters.handoff}
              onChange={event => updateFilter('handoff', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              data-testid="communication-filter-handoff"
            >
              {handoffOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Atribuicao
            <select
              value={filters.assignmentStatus}
              onChange={event => updateFilter('assignmentStatus', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              data-testid="communication-filter-assignment"
            >
              {assignmentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 xl:grid-cols-[360px_minmax(0,1fr)_300px] 2xl:grid-cols-[420px_minmax(0,1fr)_320px]">
        <aside className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <Search className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-950">Conversas</h2>
          </div>

          {conversationsQuery.isLoading ? (
            <div className="space-y-3 p-4" data-testid="communication-conversations-loading">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-md bg-slate-100" />
              ))}
            </div>
          ) : conversationsQuery.isError ? (
            <div className="p-4">
              <ErrorState message={conversationsQuery.error?.message ?? 'Erro ao carregar conversas.'} onRetry={conversationsQuery.refetch} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center px-6 text-center text-slate-500" data-testid="communication-conversations-empty">
              <Inbox className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Nenhuma conversa encontrada</p>
              <p className="mt-1 text-xs">Ajuste os filtros ou tente novamente mais tarde.</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto" data-testid="communication-conversation-list">
                {conversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    selected={conversation.id === selectedConversationId}
                    onSelect={() => {
                      setSelectedConversationId(conversation.id);
                      setActiveConversationTab('messages');
                    }}
                  />
                ))}
              </div>
              {conversationMeta && conversationMeta.total > conversationMeta.perPage && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
                  <span data-testid="communication-conversation-pagination-label">
                    Pagina {conversationMeta.currentPage} de {conversationMeta.lastPage}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={conversationMeta.currentPage <= 1 || conversationsQuery.isLoading}
                      onClick={() => updateConversationPage(conversationMeta.currentPage - 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Pagina anterior"
                      data-testid="communication-page-previous"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={conversationMeta.currentPage >= conversationMeta.lastPage || conversationsQuery.isLoading}
                      onClick={() => updateConversationPage(conversationMeta.currentPage + 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Proxima pagina"
                      data-testid="communication-page-next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        <section className="min-h-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white">
          {!selectedConversationId ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center p-8 text-center text-slate-500" data-testid="communication-messages-empty">
              <MessageCircle className="mb-3 h-12 w-12 text-slate-300" />
              <p className="font-medium text-slate-700">Selecione uma conversa</p>
              <p className="mt-1 text-sm">As mensagens aparecerao aqui em modo somente leitura.</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      {selectedConversation?.customerName ?? 'Conversa'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedConversation?.customerPhone ?? 'Sem telefone'} - {selectedConversation?.channel ?? 'canal'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    {selectedConversation?.status && (
                      <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{selectedConversation.status}</span>
                    )}
                    {selectedConversation?.serviceMode && (
                      <span className="rounded bg-violet-50 px-2 py-1 text-violet-700">
                        {formatServiceModeLabel(selectedConversation.serviceMode)}
                      </span>
                    )}
                    {selectedConversation?.handoffStatus && (
                      <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">
                        {formatHandoffStatusLabel(selectedConversation.handoffStatus)}
                      </span>
                    )}
                    {selectedConversation?.assignedToName && (
                      <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                        {selectedConversation.assignedToName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2" data-testid="communication-actions">
                  {canAssign && (
                    <button
                      type="button"
                      disabled={actionInProgress}
                      onClick={() => selectedConversationId && void runConversationAction(() => assignMutation.mutate(selectedConversationId))}
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid="communication-action-assign"
                    >
                      {assignMutation.isLoading ? 'Assumindo...' : 'Assumir'}
                    </button>
                  )}
                  {canRequestHandoff && (
                    <button
                      type="button"
                      disabled={actionInProgress}
                      onClick={() => selectedConversationId && void runConversationAction(() => requestHandoffMutation.mutate(selectedConversationId))}
                      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid="communication-action-handoff"
                    >
                      {requestHandoffMutation.isLoading ? 'Solicitando...' : 'Solicitar handoff'}
                    </button>
                  )}
                  {canTransfer && (
                    <button
                      type="button"
                      disabled={actionInProgress}
                      onClick={() => {
                        setTransferPanelOpen(true);
                        setTransferError(null);
                      }}
                      className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid="communication-action-transfer"
                    >
                      Transferir
                    </button>
                  )}
                  {canClose && (
                    <button
                      type="button"
                      disabled={actionInProgress}
                      onClick={() => {
                        if (!selectedConversationId) return;
                        if (!window.confirm('Fechar esta conversa?')) return;
                        void runConversationAction(() => closeMutation.mutate(selectedConversationId));
                      }}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid="communication-action-close"
                    >
                      {closeMutation.isLoading ? 'Fechando...' : 'Fechar'}
                    </button>
                  )}
                  {canReturnToAi && (
                    <button
                      type="button"
                      disabled={actionInProgress}
                      onClick={() => {
                        if (!selectedConversationId) return;
                        if (!window.confirm('Voltar esta conversa para IA?')) return;
                        void runConversationAction(
                          () => returnToAiMutation.mutate(selectedConversationId),
                          refreshConversationAfterMessage,
                        );
                      }}
                      className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid="communication-action-return-ai"
                    >
                      {returnToAiMutation.isLoading ? 'Retornando...' : 'Voltar para IA'}
                    </button>
                  )}
                  {canReopen && (
                    <button
                      type="button"
                      disabled={actionInProgress}
                      onClick={() => selectedConversationId && void runConversationAction(() => reopenMutation.mutate(selectedConversationId))}
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid="communication-action-reopen"
                    >
                      {reopenMutation.isLoading ? 'Reabrindo...' : 'Reabrir'}
                    </button>
                  )}
                </div>
                {actionError && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="communication-action-error">
                    {actionError}
                  </div>
                )}
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4" data-testid="communication-conversation-tabs">
                  <button
                    type="button"
                    onClick={() => setActiveConversationTab('messages')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      activeConversationTab === 'messages'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    data-testid="communication-tab-messages"
                  >
                    Mensagens
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConversationTab('timeline')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      activeConversationTab === 'timeline'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    data-testid="communication-tab-timeline"
                  >
                    Timeline
                  </button>
                </div>
              </div>

              {activeConversationTab === 'messages' ? (
                <>
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5" data-testid="communication-message-list">
                {messagesQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando mensagens...
                  </div>
                ) : messagesQuery.isError ? (
                  <ErrorState message={messagesQuery.error?.message ?? 'Erro ao carregar mensagens.'} onRetry={messagesQuery.refetch} />
                ) : (messagesQuery.data?.data.length ?? 0) === 0 ? (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-slate-500">
                    <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">Nenhuma mensagem nesta conversa</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messagesQuery.data?.data.map(message => {
                      const outbound = message.direction === 'outbound';
                      const Icon = message.senderType === 'bot' ? Bot : UserRound;
                      const deliveryStatus = messageStatusById.get(message.id);
                      const statusValue = deliveryStatus?.status ?? message.status;
                      const statusLabel = outbound ? formatDeliveryStatusLabel(statusValue) : '';
                      return (
                        <article
                          key={message.id}
                          className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[78%] rounded-lg border px-4 py-3 shadow-sm ${
                            outbound
                              ? 'border-blue-100 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white text-slate-900'
                          }`}
                          >
                            <div className={`mb-1 flex items-center gap-1.5 text-xs ${
                              outbound ? 'text-blue-100' : 'text-slate-500'
                            }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{message.senderName || message.senderType}</span>
                              <span>Â·</span>
                              <span>{formatDateTime(message.createdAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body || 'Mensagem sem texto'}</p>
                            {outbound && statusLabel && (
                              <div className="mt-2 flex justify-end">
                                <span
                                  className={`rounded px-2 py-0.5 text-[11px] font-medium ${getDeliveryStatusClass(statusValue)}`}
                                  title={[
                                    deliveryStatus?.sentAt ?? message.sentAt ? `Enviada: ${formatDateTime(deliveryStatus?.sentAt ?? message.sentAt)}` : '',
                                    deliveryStatus?.deliveredAt ?? message.deliveredAt ? `Entregue: ${formatDateTime(deliveryStatus?.deliveredAt ?? message.deliveredAt)}` : '',
                                    deliveryStatus?.readAt ?? message.readAt ? `Lida: ${formatDateTime(deliveryStatus?.readAt ?? message.readAt)}` : '',
                                    deliveryStatus?.failedAt ?? message.failedAt ? `Falhou: ${formatDateTime(deliveryStatus?.failedAt ?? message.failedAt)}` : '',
                                  ].filter(Boolean).join(' | ')}
                                  data-testid={`communication-message-status-${message.id}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <form
                className="border-t border-slate-200 bg-white p-4"
                data-testid="communication-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSendMessage();
                }}
              >
                {conversationClosed && (
                  <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" data-testid="communication-composer-closed">
                    Esta conversa esta fechada. Reabra para enviar uma nova mensagem.
                  </div>
                )}
                {!conversationClosed && !conversationInHumanMode && (
                  <div className="mb-3 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800" data-testid="communication-composer-ai">
                    Esta conversa esta em modo IA. O envio manual fica disponivel apenas em atendimento humano.
                  </div>
                )}
                {sendError && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="communication-send-error">
                    {sendError}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={messageText}
                    onChange={event => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendMessage(event.currentTarget.value);
                      }
                    }}
                    disabled={!selectedConversationId || conversationClosed || !conversationInHumanMode || sendMessageMutation.isLoading}
                    rows={2}
                    placeholder={
                      conversationClosed
                        ? 'Reabra a conversa para responder'
                        : conversationInHumanMode
                          ? 'Digite uma mensagem...'
                          : 'Conversa em modo IA'
                    }
                    className="min-h-[44px] flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    data-testid="communication-message-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleSendMessage();
                    }}
                    disabled={!canSendMessage}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    data-testid="communication-send-button"
                  >
                    {sendMessageMutation.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar
                  </button>
                </div>
              </form>
                </>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50" data-testid="communication-timeline-panel">
                  <ConversationTimelinePanel
                    events={timelineQuery.data ?? []}
                    isLoading={timelineQuery.isLoading}
                    isError={timelineQuery.isError}
                    errorMessage={timelineQuery.error?.message}
                    onRetry={() => {
                      void timelineQuery.refetch();
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="min-h-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white" data-testid="communication-conversation-details">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <UserRound className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-950">Detalhes</h2>
          </div>
          {!selectedConversationId ? (
            <div className="flex h-80 flex-col items-center justify-center px-6 text-center text-slate-500">
              <UserRound className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Nenhuma conversa selecionada</p>
            </div>
          ) : selectedConversationQuery.isLoading && !selectedConversation ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-md bg-slate-100" />
              ))}
            </div>
          ) : selectedConversationQuery.isError ? (
            <div className="p-4">
              <ErrorState message={selectedConversationQuery.error?.message ?? 'Erro ao carregar detalhes.'} onRetry={selectedConversationQuery.refetch} />
            </div>
          ) : (
            <div className="p-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {selectedConversation?.customerName ?? 'Cliente sem nome'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedConversation?.customerPhone ?? 'Sem telefone'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 px-4">
                <DetailRow label="Canal" value={selectedConversation?.channel} />
                <DetailRow label="Status" value={selectedConversation?.status} />
                <DetailRow label="Modo" value={formatServiceModeLabel(selectedConversation?.serviceMode)} />
                <DetailRow label="Handoff" value={formatHandoffStatusLabel(selectedConversation?.handoffStatus)} />
                <DetailRow label="Atribuicao" value={selectedConversation?.assignmentStatus} />
                <DetailRow label="Responsavel" value={selectedConversation?.assignedToName} />
                <DetailRow label="Ultima mensagem" value={selectedConversation?.lastMessage} />
                <DetailRow label="Atualizacao" value={formatDateTime(selectedConversation?.lastMessageAt)} />
                <DetailRow label="Nao lidas" value={selectedConversation?.unreadCount} />
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                Dados limitados ao contrato atual da Orchestra API.
              </div>
            </div>
          )}
        </aside>
      </section>

      {transferPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" data-testid="communication-transfer-modal">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <UserPlus className="h-4 w-4" />
                  Transferir conversa
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Responsavel atual: {selectedConversation?.assignedToName ?? 'Nao informado'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTransferPanel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fechar transferencia"
                data-testid="communication-transfer-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <label className="text-sm font-medium text-slate-700">
                Buscar atendente
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={assigneeSearch}
                    onChange={event => {
                      setAssigneeSearch(event.target.value);
                      setSelectedAssigneeId(null);
                      setTransferError(null);
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900"
                    placeholder="Nome ou e-mail"
                    data-testid="communication-assignee-search"
                  />
                </div>
              </label>

              {assigneesQuery.isLoading ? (
                <div className="space-y-2" data-testid="communication-assignees-loading">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-md bg-slate-100" />
                  ))}
                </div>
              ) : assigneesQuery.isError ? (
                <div data-testid="communication-assignees-error">
                  <ErrorState
                    message={assigneesQuery.error?.message ?? 'Erro ao carregar atendentes.'}
                    onRetry={assigneesQuery.refetch}
                  />
                </div>
              ) : (assigneesQuery.data?.length ?? 0) === 0 ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600" data-testid="communication-assignees-empty">
                  Nenhum atendente encontrado.
                </div>
              ) : (
                <div className="space-y-2" data-testid="communication-assignee-list">
                  {assigneesQuery.data?.map(assignee => (
                    <AssigneeItem
                      key={assignee.id}
                      assignee={assignee}
                      selected={assignee.id === selectedAssigneeId}
                      onSelect={() => {
                        setSelectedAssigneeId(assignee.id);
                        setTransferError(null);
                      }}
                    />
                  ))}
                </div>
              )}

              {transferError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="communication-transfer-error">
                  {transferError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={closeTransferPanel}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedAssigneeId || transferMutation.isLoading}
                onClick={() => {
                  void handleTransferConversation();
                }}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="communication-transfer-confirm"
              >
                {transferMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar transferencia
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </CommunicationAreaShell>
  );
}

