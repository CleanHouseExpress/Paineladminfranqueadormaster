import { Plus } from 'lucide-react';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

const webhooks = [
  { name: 'Notificações de conversa', url: 'https://hooks.example.com/conversations', event: 'conversation.updated', status: 'Ativo' },
  { name: 'Eventos de mensagem', url: 'https://hooks.example.com/messages', event: 'message.created', status: 'Pendente' },
];

export function WebhooksPage() {
  return (
    <CommunicationSettingsLayout title="Webhooks" subtitle="Gerencie os webhooks futuros para integrações externas." activePath="/communication/settings/webhooks">
      <SettingsCard
        title="Webhooks"
        description="Exemplo visual da tabela de integração futura."
        actions={
          <button type="button" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Novo Webhook</span>
          </button>
        }
      >
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {webhooks.map(webhook => (
                <tr key={webhook.name}>
                  <td className="px-4 py-3 font-medium text-slate-950">{webhook.name}</td>
                  <td className="px-4 py-3 text-slate-700">{webhook.url}</td>
                  <td className="px-4 py-3 text-slate-700">{webhook.event}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${webhook.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {webhook.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>
    </CommunicationSettingsLayout>
  );
}
