import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { CommunicationChannel, CommunicationChannelDraft, CommunicationChannelProvider, CommunicationChannelStatus } from '../channelTypes';

interface CommunicationChannelFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  channel?: CommunicationChannel | null;
  onClose: () => void;
  onSubmit: (payload: CommunicationChannelDraft) => Promise<void> | void;
  isSaving?: boolean;
}

const providerOptions: Array<{ value: CommunicationChannelProvider; label: string }> = [
  { value: 'z-api', label: 'Z-API' },
  { value: 'whatsapp-business', label: 'WhatsApp Business' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'meta', label: 'Meta' },
  { value: 'custom', label: 'Personalizado' },
];

const statusOptions: Array<{ value: CommunicationChannelStatus; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'pending_connection', label: 'Aguardando conexão' },
  { value: 'qr_pending', label: 'QR pendente' },
  { value: 'connected', label: 'Conectado' },
  { value: 'disconnected', label: 'Desconectado' },
  { value: 'error', label: 'Erro' },
  { value: 'disabled', label: 'Desativado' },
];

const emptyDraft = (channel?: CommunicationChannel | null): CommunicationChannelDraft => ({
  id: channel?.id,
  name: channel?.name ?? '',
  phoneNumber: channel?.phoneNumber ?? '',
  provider: channel?.provider ?? 'z-api',
  status: channel?.status ?? 'draft',
  instanceId: channel?.instanceId ?? '',
  instanceToken: channel?.instanceToken ?? '',
  clientToken: channel?.clientToken ?? '',
  department: channel?.department ?? 'Atendimento',
  defaultAssignee: channel?.defaultAssignee ?? 'Sem responsável',
  isActive: channel?.isActive ?? true,
  lastConnectionAt: channel?.lastConnectionAt ?? null,
});

export function CommunicationChannelFormModal({
  open,
  mode,
  channel,
  onClose,
  onSubmit,
  isSaving = false,
}: CommunicationChannelFormModalProps) {
  const [form, setForm] = useState<CommunicationChannelDraft>(emptyDraft(channel));

  useEffect(() => {
    if (open) {
      setForm(emptyDraft(channel));
    }
  }, [channel, open]);

  const title = useMemo(() => (mode === 'edit' ? 'Editar canal' : 'Novo canal'), [mode]);

  if (!open) return null;

  const handleChange = <K extends keyof CommunicationChannelDraft>(field: K, value: CommunicationChannelDraft[K]) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">Cadastre ou atualize um canal WhatsApp/Z-API de forma local e segura.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="overflow-y-auto px-5 py-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Nome do canal
              <input
                required
                value={form.name}
                onChange={event => handleChange('name', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Ex.: WhatsApp Suporte"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Número WhatsApp
              <input
                required
                value={form.phoneNumber}
                onChange={event => handleChange('phoneNumber', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="+55 11 99999-9999"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Provedor
              <select
                value={form.provider}
                onChange={event => handleChange('provider', event.target.value as CommunicationChannelProvider)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                {providerOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={form.status}
                onChange={event => handleChange('status', event.target.value as CommunicationChannelStatus)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Instance ID
              <input
                value={form.instanceId}
                onChange={event => handleChange('instanceId', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="instance-001"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Instance Token
              <input
                value={form.instanceToken ?? ''}
                onChange={event => handleChange('instanceToken', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Token de instância"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Client Token
              <input
                value={form.clientToken ?? ''}
                onChange={event => handleChange('clientToken', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Token do cliente"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Departamento padrão
              <input
                value={form.department}
                onChange={event => handleChange('department', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Atendimento"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Atendente padrão
              <input
                value={form.defaultAssignee}
                onChange={event => handleChange('defaultAssignee', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Ana Souza"
              />
            </label>

            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={event => handleChange('isActive', event.target.checked)}
              />
              Canal ativo
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving}>
              {isSaving ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Criar canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
