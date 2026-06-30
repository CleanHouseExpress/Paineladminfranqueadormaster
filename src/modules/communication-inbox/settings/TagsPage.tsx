import { Tag } from 'lucide-react';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

const tags = ['Financeiro', 'Comercial', 'Urgente', 'VIP', 'Suporte'];

export function TagsPage() {
  return (
    <CommunicationSettingsLayout title="Etiquetas" subtitle="Organize conversas e tickets por etiquetas mockadas." activePath="/communication/settings/tags">
      <SettingsCard title="Etiquetas disponíveis" description="Exemplo visual de agrupamento e categorização futura.">
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500">
                <Tag className="h-3.5 w-3.5" />
              </span>
              {tag}
            </span>
          ))}
        </div>
      </SettingsCard>
    </CommunicationSettingsLayout>
  );
}
