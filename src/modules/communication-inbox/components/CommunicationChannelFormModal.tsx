import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { CommunicationChannel, ProvisionWhatsappChannelPayload } from '../channelTypes';

interface CommunicationChannelFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  channel?: CommunicationChannel | null;
  onClose: () => void;
  onSubmit: (payload: ProvisionWhatsappChannelPayload) => Promise<void> | void;
  isSaving?: boolean;
}

const emptyDraft = (channel?: CommunicationChannel | null): ProvisionWhatsappChannelPayload => ({
  name: channel?.name ?? '',
  expectedPhoneNumber: channel?.expectedPhoneNumber ?? channel?.phoneNumber ?? '',
  department: channel?.department ?? '',
  defaultDepartmentId: channel?.defaultDepartmentId ?? null,
  defaultAssignee: channel?.defaultAssignee ?? '',
  defaultAssigneeId: channel?.defaultAssigneeId ?? null,
});

export function CommunicationChannelFormModal({
  open,
  mode,
  channel,
  onClose,
  onSubmit,
  isSaving = false,
}: CommunicationChannelFormModalProps) {
  const [form, setForm] = useState<ProvisionWhatsappChannelPayload>(emptyDraft(channel));

  useEffect(() => {
    if (open) setForm(emptyDraft(channel));
  }, [channel, open]);

  const title = useMemo(() => (mode === 'edit' ? 'Atualizar WhatsApp' : 'Conectar WhatsApp'), [mode]);

  if (!open) return null;

  const handleChange = <K extends keyof ProvisionWhatsappChannelPayload>(field: K, value: ProvisionWhatsappChannelPayload[K]) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name: form.name?.trim() || undefined,
      expectedPhoneNumber: form.expectedPhoneNumber?.trim() || undefined,
      department: form.department?.trim() || undefined,
      defaultDepartmentId: form.defaultDepartmentId ?? null,
      defaultAssignee: form.defaultAssignee?.trim() || undefined,
      defaultAssigneeId: form.defaultAssigneeId ?? null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              Informe os dados comerciais do canal. A configuracao tecnica sera feita automaticamente pela plataforma.
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="overflow-y-auto px-5 py-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Nome do canal <span className="font-normal text-slate-500">(opcional)</span>
              <input
                value={form.name ?? ''}
                onChange={event => handleChange('name', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Ex.: WhatsApp Atendimento"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Numero esperado <span className="font-normal text-slate-500">(opcional)</span>
              <input
                value={form.expectedPhoneNumber ?? ''}
                onChange={event => handleChange('expectedPhoneNumber', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="5531999999999"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Departamento padrao <span className="font-normal text-slate-500">(opcional)</span>
              <input
                value={form.department ?? ''}
                onChange={event => handleChange('department', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Atendimento"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Atendente padrao <span className="font-normal text-slate-500">(opcional)</span>
              <input
                value={form.defaultAssignee ?? ''}
                onChange={event => handleChange('defaultAssignee', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Ana Souza"
              />
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            Depois de confirmar, basta ler o QR Code no WhatsApp. Nenhuma configuracao tecnica precisa ser informada.
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving}>
              {isSaving ? 'Preparando...' : 'Conectar WhatsApp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
