import { BarChart3, Filter, SlidersHorizontal } from 'lucide-react';
import { CommunicationAreaShell } from './CommunicationAreaShell';
import { CommunicationEmptyState } from './components/CommunicationEmptyState';
import { CommunicationPageHeader } from './components/CommunicationPageHeader';
import { CommunicationSectionCard } from './components/CommunicationSectionCard';

const filters = ['Período', 'Canal', 'Departamento', 'Atendente'];

export function CommunicationAnalyticsPage() {
  return (
    <CommunicationAreaShell title="Analytics de Comunicação" subtitle="Análise de performance, SLA e comportamento dos atendimentos.">
      <div className="space-y-6 p-6">
        <CommunicationPageHeader
          title="Analytics de Comunicação"
          subtitle="Análise de performance, SLA e comportamento dos atendimentos."
          badge={<span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">Em breve</span>}
        />

        <CommunicationSectionCard title="Filtros" description="Seletores de contexto para análise futura.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filters.map(filter => (
              <div key={filter} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <Filter className="h-4 w-4 text-slate-500" />
                {filter}
              </div>
            ))}
          </div>
        </CommunicationSectionCard>

        <CommunicationSectionCard title="Análises e métricas" description="Painéis analíticos e indicadores operacionais serão liberados conforme o contrato evoluir.">
          <CommunicationEmptyState
            icon={BarChart3}
            title="Analytics em construção"
            description="A análise de SLA, produtividade e comportamento de conversas será disponibilizada em uma próxima etapa."
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros placeholder
              </div>
            }
          />
        </CommunicationSectionCard>
      </div>
    </CommunicationAreaShell>
  );
}
