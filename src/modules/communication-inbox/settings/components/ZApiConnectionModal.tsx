import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw, Unplug, X } from 'lucide-react';
import type { CommunicationChannel } from '../../channelTypes';
import { communicationChannelsService } from '../../communicationChannelsService';

interface ZApiConnectionModalProps {
  open: boolean;
  channel: CommunicationChannel | null;
  onClose: () => void;
  onChannelUpdate: (channel: CommunicationChannel) => void;
}

type ConnectionState = 'idle' | 'loading' | 'waiting' | 'connected' | 'disconnected' | 'expired' | 'error' | 'disconnecting' | 'syncing';

function statusLabel(status?: CommunicationChannel['status']) {
  const labels: Record<CommunicationChannel['status'], string> = {
    draft: 'Rascunho',
    pending_connection: 'Aguardando leitura',
    qr_pending: 'QR pendente',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    error: 'Erro',
    disabled: 'Desativado',
  };

  return status ? labels[status] ?? status : 'Indefinido';
}

function normalizeQrCode(value?: string | null) {
  if (!value) return { kind: 'empty' as const, value: null };
  const trimmed = value.trim();
  if (!trimmed) return { kind: 'empty' as const, value: null };
  if (/^data:image\//i.test(trimmed)) return { kind: 'image' as const, value: trimmed };
  if (/^https?:\/\//i.test(trimmed)) return { kind: 'image' as const, value: trimmed };
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 80) {
    return { kind: 'image' as const, value: `data:image/png;base64,${trimmed.replace(/\s/g, '')}` };
  }
  return { kind: 'text' as const, value: trimmed };
}

export function ZApiConnectionModal({
  open,
  channel,
  onClose,
  onChannelUpdate,
}: ZApiConnectionModalProps) {
  const [state, setState] = useState<ConnectionState>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  const normalizedQr = useMemo(() => normalizeQrCode(qrCode), [qrCode]);
  const isBusy = state === 'loading' || state === 'syncing' || state === 'disconnecting';

  const stopPolling = () => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const applyChannel = (nextChannel: CommunicationChannel) => {
    onChannelUpdate(nextChannel);
    if (nextChannel.status === 'connected') {
      setState('connected');
      stopPolling();
    } else if (nextChannel.status === 'disconnected') {
      setState('disconnected');
    } else if (nextChannel.status === 'error') {
      setState('error');
    } else if (nextChannel.status === 'qr_pending' || nextChannel.status === 'pending_connection') {
      setState('waiting');
    }
  };

  const pollStatus = async () => {
    if (!channel) return;
    try {
      const response = await communicationChannelsService.connectionStatus(channel.id);
      applyChannel(response.channel);
      if (response.qrCode) setQrCode(response.qrCode);
    } catch {
      setState(current => (current === 'connected' ? current : 'error'));
    }
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = window.setInterval(() => {
      void pollStatus();
    }, 4000);
  };

  const connect = async () => {
    if (!channel) return;
    setState('loading');
    setError(null);
    try {
      const response = await communicationChannelsService.connect(channel.id);
      applyChannel(response.channel);
      setQrCode(response.qrCode ?? null);
      if (response.channel.status !== 'connected') startPolling();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel iniciar a conexao.');
      setState('error');
    }
  };

  useEffect(() => {
    if (!open || !channel) {
      stopPolling();
      return;
    }

    void connect();

    return () => {
      stopPolling();
    };
  }, [open, channel?.id]);

  if (!open || !channel) return null;

  const refreshQr = async () => {
    setState('loading');
    setError(null);
    try {
      const response = await communicationChannelsService.refreshQr(channel.id);
      applyChannel(response.channel);
      setQrCode(response.qrCode ?? null);
      if (response.channel.status !== 'connected') startPolling();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel gerar novo QR Code.');
      setState('error');
    }
  };

  const syncStatus = async () => {
    setState('syncing');
    setError(null);
    try {
      const response = await communicationChannelsService.syncStatus(channel.id);
      applyChannel(response.channel);
      if (response.qrCode) setQrCode(response.qrCode);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel sincronizar o status.');
      setState('error');
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Desconectar este canal WhatsApp?')) return;
    setState('disconnecting');
    setError(null);
    try {
      const response = await communicationChannelsService.disconnect(channel.id);
      applyChannel(response.channel);
      stopPolling();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel desconectar o canal.');
      setState('error');
    }
  };

  const copyQrText = async () => {
    if (!normalizedQr.value) return;
    await navigator.clipboard?.writeText(normalizedQr.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Conectar WhatsApp/Z-API</h3>
            <p className="mt-1 text-sm text-slate-600">{channel.name} {channel.phoneNumber ? `- ${channel.phoneNumber}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {statusLabel(channel.status)}
            </span>
            {state === 'waiting' && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Aguardando leitura</span>}
            {state === 'connected' && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Conexao ativa</span>}
            {state === 'expired' && <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">QR expirado</span>}
          </div>

          <p className="mt-4 text-sm text-slate-700">
            Abra o WhatsApp no celular, acesse Aparelhos conectados e leia este QR Code.
          </p>

          <div className="mt-4 flex min-h-72 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4">
            {state === 'loading' ? (
              <div className="text-sm text-slate-600">Carregando QR Code...</div>
            ) : normalizedQr.kind === 'image' ? (
              <img src={normalizedQr.value ?? ''} alt="QR Code de conexao WhatsApp" className="max-h-64 max-w-full rounded-md bg-white p-3 shadow-sm" />
            ) : normalizedQr.kind === 'text' ? (
              <div className="w-full">
                <p className="mb-2 text-sm text-slate-700">A API retornou texto QR. Copie o conteudo abaixo se necessario.</p>
                <pre className="max-h-52 overflow-auto rounded-md bg-white p-3 text-xs text-slate-700">{normalizedQr.value}</pre>
                <button type="button" onClick={copyQrText} className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Copiar texto QR
                </button>
              </div>
            ) : state === 'connected' ? (
              <div className="text-sm font-medium text-emerald-700">Canal conectado com sucesso.</div>
            ) : (
              <div className="text-sm text-slate-600">Nenhum QR Code recebido ate o momento.</div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={refreshQr} disabled={isBusy} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCcw className="h-4 w-4" />
            Gerar novo QR Code
          </button>
          <button type="button" onClick={syncStatus} disabled={isBusy} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCcw className="h-4 w-4" />
            Sincronizar status
          </button>
          <button type="button" onClick={disconnect} disabled={isBusy} className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
            <Unplug className="h-4 w-4" />
            Desconectar
          </button>
          <button type="button" onClick={onClose} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
