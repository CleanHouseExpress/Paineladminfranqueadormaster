import { BriefcaseBusiness, Plus } from 'lucide-react';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { EmptyConfigurationState } from './components/EmptyConfigurationState';
import { SettingsCard } from './components/SettingsCard';

export function DepartmentsPage() {
  return (
    <CommunicationSettingsLayout title="Departamentos" subtitle="Estruture os departamentos de atendimento e suas regras operacionais." activePath="/communication/settings/departments">
      <SettingsCard
        title="Departamentos"
        description="Cadastre e organize os departamentos responsáveis pelo atendimento e distribuição das conversas."
        actions={
          <button type="button" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Novo departamento</span>
          </button>
        }
      >
        <EmptyConfigurationState
          icon={BriefcaseBusiness}
          title="Nenhum departamento cadastrado"
          description="A estrutura de departamentos da comunicação aparecerá aqui quando estiver disponível para configuração."
        />
      </SettingsCard>
    </CommunicationSettingsLayout>
  );
}
