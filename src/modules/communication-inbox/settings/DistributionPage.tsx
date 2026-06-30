import { Network, Shuffle, Sparkles, Workflow } from 'lucide-react';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

const rules = [
  { title: 'Round Robin', description: 'Distribuição equilibrada entre agentes', icon: Shuffle },
  { title: 'Menor fila', description: 'Prioriza o atendente com menor carga', icon: Network },
  { title: 'Mesmo atendente', description: 'Mantém a conversa na mesma pessoa', icon: Workflow },
  { title: 'Departamento padrão', description: 'Define o departamento inicial da conversa', icon: Sparkles },
];

export function DistributionPage() {
  return (
    <CommunicationSettingsLayout title="Distribuição" subtitle="Defina as regras futuras de roteamento e atendimento." activePath="/communication/settings/distribution">
      <div className="grid gap-4 md:grid-cols-2">
        {rules.map(rule => {
          const Icon = rule.icon;
          return (
            <SettingsCard key={rule.title} title={rule.title} description={rule.description}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Em breve</span>
              </div>
            </SettingsCard>
          );
        })}
      </div>
    </CommunicationSettingsLayout>
  );
}
