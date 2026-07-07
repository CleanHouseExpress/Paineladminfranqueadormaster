import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Clock3, MessageCircle, RefreshCcw, Users, type LucideIcon } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { CommunicationAreaShell } from './CommunicationAreaShell';
import { CommunicationEmptyState } from './components/CommunicationEmptyState';
import { CommunicationPageHeader } from './components/CommunicationPageHeader';
import { CommunicationSectionCard } from './components/CommunicationSectionCard';
import { CommunicationSummaryCard } from './components/CommunicationSummaryCard';

type DashboardData = {
  openConversations: number;
  waitingAssignment: number;
  inService: number;
  closedToday: number;
  avgFirstResponseSeconds: number | null;
  avgResolutionSeconds: number | null;
  slaExpired: number;
  messagesReceivedToday: number;
  messagesSentToday: number;
  onlineAgents: number;
  connectedChannels: number;
  disconnectedChannels: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unwrapData(payload: unknown) {
  const record = asRecord(payload);
  return asRecord(record.data ?? payload);
}

function normalizeDashboard(payload: unknown): DashboardData {
  const data = unwrapData(payload);
  return {
    openConversations: numberValue(data.open_conversations),
    waitingAssignment: numberValue(data.waiting_assignment),
    inService: numberValue(data.in_service),
    closedToday: numberValue(data.closed_today),
    avgFirstResponseSeconds: nullableNumber(data.avg_first_response_seconds),
    avgResolutionSeconds: nullableNumber(data.avg_resolution_seconds),
    slaExpired: numberValue(data.sla_expired),
    messagesReceivedToday: numberValue(data.messages_received_today),
    messagesSentToday: numberValue(data.messages_sent_today),
    onlineAgents: numberValue(data.online_agents),
    connectedChannels: numberValue(data.connected_channels),
    disconnectedChannels: numberValue(data.disconnected_channels),
  };
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return 'Nao informado';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

export function CommunicationDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(normalizeDashboard(await apiClient.get<unknown>('/api/tenant/communication/dashboard')));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel carregar o dashboard de comunicacao.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const cards = [
    { label: 'Conversas abertas', value: data?.openConversations ?? 0, tone: 'blue' as const },
    { label: 'Aguardando atendimento', value: data?.waitingAssignment ?? 0, tone: 'amber' as const },
    { label: 'Em atendimento', value: data?.inService ?? 0, tone: 'emerald' as const },
    { label: 'Encerradas hoje', value: data?.closedToday ?? 0, tone: 'violet' as const },
  ];

  return (
    <CommunicationAreaShell title="Dashboard de Atendimento" subtitle="Indicadores operacionais do atendimento em tempo real.">
      <div className="space-y-6 p-6" data-testid="communication-dashboard-page">
        <CommunicationPageHeader
          title="Dashboard de Atendimento"
          subtitle="Indicadores operacionais do atendimento em tempo real."
          badge={<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">API real</span>}
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" data-testid="communication-dashboard-error">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Nao foi possivel carregar o dashboard.</p>
                <p className="mt-1">{error}</p>
                <button type="button" onClick={() => { void loadDashboard(); }} className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(card => (
            <CommunicationSummaryCard key={card.label} label={card.label} value={loading ? 0 : card.value} tone={card.tone} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CommunicationSectionCard title="Indicadores de SLA" description="Dados consolidados pelo backend de comunicacao.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric icon={Clock3} label="Primeira resposta media" value={loading ? '...' : formatDuration(data?.avgFirstResponseSeconds ?? null)} />
              <Metric icon={Clock3} label="Resolucao media" value={loading ? '...' : formatDuration(data?.avgResolutionSeconds ?? null)} />
              <Metric icon={BarChart3} label="SLA expirado" value={loading ? '...' : String(data?.slaExpired ?? 0)} />
              <Metric icon={Users} label="Agentes online" value={loading ? '...' : String(data?.onlineAgents ?? 0)} />
            </div>
          </CommunicationSectionCard>

          <CommunicationSectionCard title="Atendimento por canal" description="Resumo operacional dos canais e mensagens do dia.">
            <div className="space-y-3">
              <MetricRow icon={MessageCircle} label="Canais conectados" value={loading ? '...' : String(data?.connectedChannels ?? 0)} />
              <MetricRow icon={MessageCircle} label="Canais desconectados ou em erro" value={loading ? '...' : String(data?.disconnectedChannels ?? 0)} />
              <MetricRow icon={BarChart3} label="Mensagens recebidas hoje" value={loading ? '...' : String(data?.messagesReceivedToday ?? 0)} />
              <MetricRow icon={BarChart3} label="Mensagens enviadas hoje" value={loading ? '...' : String(data?.messagesSentToday ?? 0)} />
            </div>
          </CommunicationSectionCard>
        </div>

        {!loading && !error && !data ? (
          <CommunicationSectionCard title="Sem dados" description="O backend respondeu sem indicadores para este tenant.">
            <CommunicationEmptyState icon={BarChart3} title="Nenhum indicador disponivel" description="Conecte canais e utilize a inbox para gerar dados operacionais." />
          </CommunicationSectionCard>
        ) : null}
      </div>
    </CommunicationAreaShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-600"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
      <span className="flex items-center gap-2 text-slate-700"><Icon className="h-4 w-4" />{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

