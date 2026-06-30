import { Link } from 'react-router';
import { ArrowRight, BriefcaseBusiness, CalendarDays, CircleDashed, LayoutGrid, MessageCircleMore, Settings2, Sparkles, Tags, Workflow } from 'lucide-react';
import { CommunicationAreaShell } from './CommunicationAreaShell';
import { CommunicationPageHeader } from './components/CommunicationPageHeader';
import { CommunicationSectionCard } from './components/CommunicationSectionCard';

const settingsEntries = [
  { title: 'Canais', description: 'Gerencie conectores, tokens e status.', path: '/communication/settings/channels', icon: MessageCircleMore },
  { title: 'Departamentos', description: 'Estruture a operação por área.', path: '/communication/settings/departments', icon: BriefcaseBusiness },
  { title: 'Horários', description: 'Defina a janela operacional.', path: '/communication/settings/schedules', icon: CalendarDays },
  { title: 'Distribuição', description: 'Organize regras de roteamento.', path: '/communication/settings/distribution', icon: Workflow },
  { title: 'SLA', description: 'Acompanhe tempos de resposta.', path: '/communication/settings/sla', icon: CircleDashed },
  { title: 'Etiquetas', description: 'Categorize conversas e tickets.', path: '/communication/settings/tags', icon: Tags },
  { title: 'IA', description: 'Configure assistentes e automações.', path: '/communication/settings/ai', icon: Sparkles },
  { title: 'Webhooks', description: 'Kits de integração externa.', path: '/communication/settings/webhooks', icon: Settings2 },
];

export function CommunicationSettingsPage() {
  return (
    <CommunicationAreaShell title="Configurações de Comunicação" subtitle="Configure canais, WhatsApp, webhooks, departamentos e regras de atendimento.">
      <div className="space-y-6 p-6">
        <CommunicationPageHeader
          title="Configurações de Comunicação"
          subtitle="Explore os blocos administrativos da área e acesse cada configuração sem sair do contexto de Configurações."
          badge={<span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Área administrativa</span>}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {settingsEntries.map(entry => {
            const Icon = entry.icon;
            return (
              <CommunicationSectionCard key={entry.path} title={entry.title} description={entry.description}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Link to={entry.path} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Abrir
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CommunicationSectionCard>
            );
          })}
        </div>

        <CommunicationSectionCard title="Navegação administrativa" description="A estrutura de Configurações agora funciona como um módulo interno com menu lateral e páginas dedicadas.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <LayoutGrid className="h-4 w-4 text-slate-500" />
                Menu lateral fixo
              </div>
              <p className="mt-2 text-sm text-slate-600">O conteúdo troca mantendo a navegação lateral visível e estável.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Settings2 className="h-4 w-4 text-slate-500" />
                Estrutura modular
              </div>
              <p className="mt-2 text-sm text-slate-600">Cada bloco possui uma página própria para evolução incremental sem backend.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <MessageCircleMore className="h-4 w-4 text-slate-500" />
                Canais preservados
              </div>
              <p className="mt-2 text-sm text-slate-600">O CRUD mock de canais permanece disponível na seção específica.</p>
            </div>
          </div>
        </CommunicationSectionCard>
      </div>
    </CommunicationAreaShell>
  );
}
