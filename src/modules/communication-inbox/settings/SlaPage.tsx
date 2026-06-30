import { Clock3 } from 'lucide-react';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

const slaItems = [
  { label: 'Primeira resposta', value: '5 min' },
  { label: 'Tempo máximo', value: '30 min' },
  { label: 'Tempo de resolução', value: '2 h' },
  { label: 'Horário comercial', value: '08:00–18:00' },
];

export function SlaPage() {
  return (
    <CommunicationSettingsLayout title="SLA" subtitle="Configure os indicadores operacionais de resposta e resolução." activePath="/communication/settings/sla">
      <div className="grid gap-4 md:grid-cols-2">
        {slaItems.map(item => (
          <SettingsCard key={item.label} title={item.label} description="Valor mockado para evolução visual da área administrativa.">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold text-slate-950">{item.value}</div>
            </div>
          </SettingsCard>
        ))}
      </div>
    </CommunicationSettingsLayout>
  );
}
