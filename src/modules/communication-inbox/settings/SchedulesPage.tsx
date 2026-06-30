import { CalendarDays } from 'lucide-react';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

const scheduleRows = [
  { day: 'Segunda', hours: '08:00–18:00' },
  { day: 'Terça', hours: '08:00–18:00' },
  { day: 'Quarta', hours: '08:00–18:00' },
  { day: 'Quinta', hours: '08:00–18:00' },
  { day: 'Sexta', hours: '08:00–18:00' },
  { day: 'Sábado', hours: '09:00–14:00' },
  { day: 'Domingo', hours: 'Fechado' },
];

export function SchedulesPage() {
  return (
    <CommunicationSettingsLayout title="Horários" subtitle="Defina os horários de atendimento e a disponibilidade operacional." activePath="/communication/settings/schedules">
      <SettingsCard title="Horários de atendimento" description="Exemplo visual da configuração futura de jornada operacional.">
        <div className="grid gap-3 md:grid-cols-2">
          {scheduleRows.map(row => (
            <div key={row.day} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">{row.day}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                {row.hours}
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>
    </CommunicationSettingsLayout>
  );
}
