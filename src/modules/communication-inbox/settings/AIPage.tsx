import { Bot, MessageSquareText, Sparkles, Workflow } from 'lucide-react';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

const aiCards = [
  { title: 'Atendimento automático', description: 'Habilita respostas automáticas para fluxos simples.', icon: Bot },
  { title: 'Transferência para humano', description: 'Define as regras de escalonamento para o atendimento humano.', icon: Workflow },
  { title: 'Mensagem inicial', description: 'Texto inicial que aparece ao iniciar a interação.', icon: MessageSquareText },
  { title: 'Modelo de IA', description: 'Seleciona o modelo futuro do assistente.', icon: Sparkles },
];

export function AIPage() {
  return (
    <CommunicationSettingsLayout title="IA" subtitle="Defina as regras futuras de automação e atendimento assistido por IA." activePath="/communication/settings/ai">
      <div className="grid gap-4 md:grid-cols-2">
        {aiCards.map(card => {
          const Icon = card.icon;
          return (
            <SettingsCard key={card.title} title={card.title} description={card.description}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Futuro</span>
              </div>
            </SettingsCard>
          );
        })}
      </div>
    </CommunicationSettingsLayout>
  );
}
