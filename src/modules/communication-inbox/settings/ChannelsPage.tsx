import { useEffect, useMemo, useState } from 'react';
import { MessageCircleMore, Plus, RefreshCcw, Unplug, Logs } from 'lucide-react';
import { CommunicationChannelFormModal } from '../components/CommunicationChannelFormModal';
import { CommunicationEmptyState } from '../components/CommunicationEmptyState';
import { CommunicationErrorState } from '../components/CommunicationErrorState';
import { communicationChannelsService } from '../communicationChannelsService';
import type { CommunicationChannel, CommunicationChannelDraft } from '../channelTypes';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { ChannelLogsDrawer } from './components/ChannelLogsDrawer';
import { SettingsCard } from './components/SettingsCard';
import { ZApiConnectionModal } from './components/ZApiConnectionModal';

function formatDateTime(value?: string | null) {
  if (!value) return 'Ainda não conectado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusLabel(status: CommunicationChannel['status']) {
  const map: Record<CommunicationChannel['status'], string> = {
    draft: 'Rascunho',
    pending_connection: 'Aguardando conexão',
    qr_pending: 'QR pendente',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    error: 'Erro',
    disabled: 'Desativado',
  };

  return map[status] ?? status;
}

function getStatusClass(status: CommunicationChannel['status']) {
  switch (status) {
    case 'connected':
      return 'bg-emerald-50 text-emerald-700';
    case 'pending_connection':
    case 'qr_pending':
      return 'bg-amber-50 text-amber-700';
    case 'disabled':
      return 'bg-slate-100 text-slate-600';
    case 'error':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-blue-50 text-blue-700';
  }
}

export function ChannelsPage() {
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const [disconnectingIds, setDisconnectingIds] = useState<string[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<CommunicationChannel | null>(null);
  const [connectionChannel, setConnectionChannel] = useState<CommunicationChannel | null>(null);
  const [logsChannel, setLogsChannel] = useState<CommunicationChannel | null>(null);

  const loadChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextChannels = await communicationChannelsService.listChannels();
      setChannels(Array.isArray(nextChannels) ? nextChannels : []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível carregar os canais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChannels();
  }, []);

  const handleCreateOrEdit = async (payload: CommunicationChannelDraft) => {
    setSaving(true);
    setError(null);
    try {
      const normalizedPayload = {
        ...payload,
        instanceToken: payload.instanceToken?.trim() || (editingChannel?.instanceToken ?? ''),
        clientToken: payload.clientToken?.trim() || (editingChannel?.clientToken ?? ''),
      };

      if (editingChannel) {
        const updatedChannel = await communicationChannelsService.updateChannel(editingChannel.id, normalizedPayload);
        setChannels(current => current.map(channel => (channel.id === updatedChannel.id ? updatedChannel : channel)));
      } else {
        const createdChannel = await communicationChannelsService.createChannel(normalizedPayload);
        setChannels(current => [createdChannel, ...current]);
      }

      setFormModalOpen(false);
      setEditingChannel(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível salvar o canal.');
    } finally {
      setSaving(false);
    }
  };

  const channelSummary = useMemo(() => ({
    total: Array.isArray(channels) ? channels.length : 0,
    connected: Array.isArray(channels) ? channels.filter(channel => channel.status === 'connected').length : 0,
    pending: Array.isArray(channels) ? channels.filter(channel => channel.status === 'pending_connection' || channel.status === 'qr_pending').length : 0,
  }), [channels]);

  const handleChannelUpdated = (nextChannel: CommunicationChannel) => {
    setChannels(current => (Array.isArray(current) ? current.map(channel => (channel.id === nextChannel.id ? nextChannel : channel)) : []));
  };

  const handleOpenConnection = (channel: CommunicationChannel) => {
    setConnectionChannel(channel);
    setConnectionModalOpen(true);
  };

  const handleOpenLogs = (channel: CommunicationChannel) => {
    setLogsChannel(channel);
    setLogsDrawerOpen(true);
  };

  const handleSyncChannelStatus = async (channel: CommunicationChannel) => {
    setError(null);
    setSyncingIds(current => [...current, channel.id]);
    try {
      const updatedChannel = await communicationChannelsService.syncChannelStatus(channel.id);
      handleChannelUpdated(updatedChannel.channel);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível sincronizar o status do canal.');
    } finally {
      setSyncingIds(current => current.filter(id => id !== channel.id));
    }
  };

  const handleDisconnectChannel = async (channel: CommunicationChannel) => {
    if (!window.confirm(`Desconectar o canal ${channel.name}?`)) return;
    setError(null);
    setDisconnectingIds(current => [...current, channel.id]);
    try {
      const updatedChannel = await communicationChannelsService.disconnectChannel(channel.id);
      handleChannelUpdated(updatedChannel.channel);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível desconectar o canal.');
    } finally {
      setDisconnectingIds(current => current.filter(id => id !== channel.id));
    }
  };

  return (
    <CommunicationSettingsLayout title="Canais" subtitle="Gerencie os canais de atendimento e seus estados operacionais." activePath="/communication/settings/channels">
      <div className="space-y-6" data-testid="communication-settings-channels-page">
        <SettingsCard
          title="Canais WhatsApp/Z-API"
          description="Gerencie canais da API real quando disponível e mantenha fallback mock em ambiente de desenvolvimento."
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="communication-channel-create"
                onClick={() => {
                  setEditingChannel(null);
                  setFormModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Novo canal
              </button>
              <button
                type="button"
                data-testid="communication-channel-refresh"
                onClick={() => { void loadChannels(); }}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{channelSummary.total}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Conectados</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{channelSummary.connected}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pendentes</p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{channelSummary.pending}</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-4">
              <CommunicationErrorState description={error} onRetry={() => { void loadChannels(); }} />
            </div>
          ) : channels.length === 0 ? (
            <div className="mt-4">
              <CommunicationEmptyState
                icon={MessageCircleMore}
                title="Nenhum canal cadastrado"
                description="Adicione o primeiro canal WhatsApp/Z-API para começar a estruturar a configuração da área de comunicação."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChannel(null);
                      setFormModalOpen(true);
                    }}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Criar canal
                  </button>
                }
              />
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Número</th>
                      <th className="px-4 py-3">Provedor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Departamento</th>
                      <th className="px-4 py-3">Atendente</th>
                      <th className="px-4 py-3">Última conexão</th>
                      <th className="px-4 py-3">Última desconexão</th>
                      <th className="px-4 py-3">Última checagem</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {channels.map(channel => (
                      <tr key={channel.id} className="align-top">
                        <td className="px-4 py-3 text-slate-950">
                          <div className="font-semibold">{channel.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{channel.instanceId || 'Sem instance ID'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{channel.phoneNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{channel.provider}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(channel.status)}`}>
                            {getStatusLabel(channel.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{channel.department}</td>
                        <td className="px-4 py-3 text-slate-700">{channel.defaultAssignee}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateTime(channel.lastConnectedAt ?? channel.lastConnectionAt)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateTime(channel.lastDisconnectedAt)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateTime(channel.lastStatusCheckAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              data-testid={`communication-channel-edit-${channel.id}`}
                              onClick={() => {
                                setEditingChannel(channel);
                                setFormModalOpen(true);
                              }}
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              data-testid={`communication-channel-connect-${channel.id}`}
                              onClick={() => handleOpenConnection(channel)}
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Conectar
                            </button>
                            <button
                              type="button"
                              data-testid={`communication-channel-sync-${channel.id}`}
                              onClick={() => { void handleSyncChannelStatus(channel); }}
                              disabled={syncingIds.includes(channel.id)}
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {syncingIds.includes(channel.id) ? 'Sincronizando...' : 'Sincronizar'}
                            </button>
                            <button
                              type="button"
                              data-testid={`communication-channel-disconnect-${channel.id}`}
                              onClick={() => { void handleDisconnectChannel(channel); }}
                              disabled={disconnectingIds.includes(channel.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Unplug className="h-3.5 w-3.5" />
                              {disconnectingIds.includes(channel.id) ? 'Desconectando...' : 'Desconectar'}
                            </button>
                            <button
                              type="button"
                              data-testid={`communication-channel-logs-${channel.id}`}
                              onClick={() => handleOpenLogs(channel)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Logs className="h-3.5 w-3.5" />
                              Logs
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            Tokens são armazenados localmente no navegador e sempre renderizados mascarados após o salvamento.
          </div>
        </SettingsCard>
      </div>

      <CommunicationChannelFormModal
        open={formModalOpen}
        mode={editingChannel ? 'edit' : 'create'}
        channel={editingChannel}
        isSaving={saving}
        onClose={() => {
          setFormModalOpen(false);
          setEditingChannel(null);
        }}
        onSubmit={handleCreateOrEdit}
      />

      <ZApiConnectionModal
        open={connectionModalOpen}
        channel={connectionChannel}
        onClose={() => {
          setConnectionModalOpen(false);
          setConnectionChannel(null);
        }}
        onChannelUpdate={handleChannelUpdated}
      />

      <ChannelLogsDrawer
        open={logsDrawerOpen}
        channel={logsChannel}
        onClose={() => {
          setLogsDrawerOpen(false);
          setLogsChannel(null);
        }}
      />
    </CommunicationSettingsLayout>
  );
}
