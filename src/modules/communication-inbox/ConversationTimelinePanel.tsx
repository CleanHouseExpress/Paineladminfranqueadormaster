import { AlertCircle, Clock3, Loader2, RefreshCcw } from 'lucide-react';
import type { ConversationTimelineEvent } from './types';

const eventLabels: Record<string, string> = {
  conversation_created: 'Conversa criada',
  message_received: 'Mensagem recebida',
  message_sent: 'Mensagem enviada',
  human_message_sent: 'Atendente respondeu',
  agent_started: 'IA acionada',
  agent_finished: 'IA respondeu',
  agent_skipped: 'IA ignorada',
  handoff_requested: 'Atendimento humano solicitado',
  conversation_assigned: 'Atendimento assumido',
  conversation_returned_to_ai: 'Retornado para IA',
  conversation_closed: 'Conversa encerrada',
  conversation_reopened: 'Conversa reaberta',
};

function formatEventType(value: string) {
  return eventLabels[value] ?? value.replace(/_/g, ' ');
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

interface ConversationTimelinePanelProps {
  events: ConversationTimelineEvent[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

export function ConversationTimelinePanel({
  events,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: ConversationTimelinePanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-5 text-sm text-slate-600" data-testid="communication-timeline-loading">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando timeline...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5" data-testid="communication-timeline-error">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium">Nao foi possivel carregar a timeline.</p>
              <p className="mt-1 text-red-700">{errorMessage ?? 'Tente novamente em instantes.'}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex h-full min-h-[260px] flex-col items-center justify-center p-8 text-center text-slate-500" data-testid="communication-timeline-empty">
        <Clock3 className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Nenhum evento registrado</p>
        <p className="mt-1 text-xs">A timeline aparecera aqui quando o backend disponibilizar os eventos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5" data-testid="communication-timeline-list">
      {events.map(event => (
        <article key={event.id} className="relative border-l border-slate-200 pl-4">
          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-950">{formatEventType(event.eventType)}</h3>
              <span className="text-xs text-slate-500">{formatDateTime(event.occurredAt)}</span>
            </div>
            {event.description && (
              <p className="mt-2 text-sm text-slate-700">{event.description}</p>
            )}
            {(event.actorName || event.actorType) && (
              <p className="mt-2 text-xs font-medium text-slate-500">
                {event.actorName ?? event.actorType}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
