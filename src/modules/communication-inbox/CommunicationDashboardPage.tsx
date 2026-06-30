import { BarChart3, Clock3, MessageCircle, Users } from 'lucide-react';
import { CommunicationAreaShell } from './CommunicationAreaShell';
import { CommunicationEmptyState } from './components/CommunicationEmptyState';
import { CommunicationPageHeader } from './components/CommunicationPageHeader';
import { CommunicationSectionCard } from './components/CommunicationSectionCard';
import { CommunicationSummaryCard } from './components/CommunicationSummaryCard';

const cards = [
  { label: 'Conversas abertas', value: 48, tone: 'blue' as const },
  { label: 'Aguardando atendimento', value: 12, tone: 'amber' as const },
  { label: 'Em atendimento', value: 19, tone: 'emerald' as const },
  { label: 'Encerradas hoje', value: 37, tone: 'violet' as const },
];

export function CommunicationDashboardPage() {
  return (
    <CommunicationAreaShell title="Dashboard de Atendimento" subtitle="Indicadores operacionais do atendimento em tempo real.">
      <div className="space-y-6 p-6">
        <CommunicationPageHeader
          title="Dashboard de Atendimento"
          subtitle="Indicadores operacionais do atendimento em tempo real."
          badge={<span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Em breve</span>}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(card => (
            <CommunicationSummaryCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
          ))}
        </div>

        <CommunicationSectionCard title="Visão operacional" description="Gráficos e métricas consolidadas serão adicionados conforme o backend evoluir.">
          <CommunicationEmptyState
            icon={BarChart3}
            title="Gráficos em construção"
            description="A área de dashboard estará disponível com indicadores de SLA, canais e produtividade quando os contratos estiverem prontos."
          />
        </CommunicationSectionCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CommunicationSectionCard title="Atendimento por canal" description="Resumo operacional dos canais ativos.">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </span>
                <span className="font-semibold text-slate-950">24</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <Users className="h-4 w-4" />
                  Web
                </span>
                <span className="font-semibold text-slate-950">14</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <Clock3 className="h-4 w-4" />
                  Instagram
                </span>
                <span className="font-semibold text-slate-950">10</span>
              </div>
            </div>
          </CommunicationSectionCard>

          <CommunicationSectionCard title="Próximos passos" description="O conteúdo operacional será evoluído junto ao backend e ao contrato da Inbox.">
            <CommunicationEmptyState
              icon={Clock3}
              title="Em breve"
              description="Acompanhe a evolução do módulo para habilitar gráficos e indicadores mais ricos."
            />
          </CommunicationSectionCard>
        </div>
      </div>
    </CommunicationAreaShell>
  );
}
