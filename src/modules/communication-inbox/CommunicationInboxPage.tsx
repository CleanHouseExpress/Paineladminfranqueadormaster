import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Search,
  UserRound,
} from 'lucide-react';
import type { CommunicationConversation, ConversationFilters } from './types';
import {
  useConversation,
  useConversationMessages,
  useInboxConversations,
  useInboxSummary,
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

export function CommunicationInboxPage() {
  const [filters, setFilters] = useState<ConversationFilters>({
    status: 'all',
    handoff: 'all',
    assignmentStatus: 'all',
  });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const summaryQuery = useInboxSummary(filters);
  const conversationsQuery = useInboxConversations(filters);
  const selectedConversationQuery = useConversation(selectedConversationId);
  const messagesQuery = useConversationMessages(selectedConversationId);

  const conversations = conversationsQuery.data?.data ?? [];
  const selectedConversation = selectedConversationQuery.data
    ?? conversations.find(conversation => conversation.id === selectedConversationId)
    ?? null;

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
    if (selectedConversationId && conversations.length > 0 && !conversations.some(item => item.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

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
    setFilters(current => ({ ...current, [key]: value }));
    setSelectedConversationId(null);
  };

  return (
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

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
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

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="min-h-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white">
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
            <div className="max-h-[58vh] overflow-y-auto" data-testid="communication-conversation-list">
              {conversations.map(conversation => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  selected={conversation.id === selectedConversationId}
                  onSelect={() => setSelectedConversationId(conversation.id)}
                />
              ))}
            </div>
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
                      {selectedConversation?.customerPhone ?? 'Sem telefone'} · {selectedConversation?.channel ?? 'canal'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    {selectedConversation?.status && (
                      <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{selectedConversation.status}</span>
                    )}
                    {selectedConversation?.assignedToName && (
                      <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                        {selectedConversation.assignedToName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
                              <span>·</span>
                              <span>{formatDateTime(message.createdAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body || 'Mensagem sem texto'}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
