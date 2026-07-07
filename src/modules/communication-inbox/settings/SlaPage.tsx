import { Clock3 } from 'lucide-react';
import { CommunicationEmptyState } from '../components/CommunicationEmptyState';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

export function SlaPage() {
  return (
    <CommunicationSettingsLayout title="SLA" subtitle="Configure os indicadores operacionais de resposta e resolucao." activePath="/communication/settings/sla">
      <SettingsCard title="SLA de atendimento" description="Configuracao administrativa ainda sem contrato backend publicado nesta fase.">
        <CommunicationEmptyState
          icon={Clock3}
          title="Configuracao de SLA em desenvolvimento"
          description="O dashboard ja consome indicadores reais de SLA quando enviados pelo backend. A edicao das regras de SLA sera habilitada quando houver API especifica para salvar metas, horarios e escalonamentos."
        />
      </SettingsCard>
    </CommunicationSettingsLayout>
  );
}
