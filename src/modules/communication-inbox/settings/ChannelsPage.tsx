import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, MessageCircleMore, Power, QrCode, RefreshCcw, Smartphone } from 'lucide-react';
import { communicationSettingsService, type CommunicationSettingsStatus, type CommunicationWhatsAppState } from '../communicationSettingsService';
import { CommunicationSettingsLayout } from './CommunicationSettingsLayout';
import { SettingsCard } from './components/SettingsCard';

function formatDateTime(value?: string | null) {
  if (!value) return 'Ainda nao atualizado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function qrCodeSource(value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) return trimmed;
  return `data:image/png;base64,${trimmed}`;
}

function stateLabel(state: CommunicationWhatsAppState) {
  const labels: Record<CommunicationWhatsAppState, string> = {
    module_inactive: 'Modulo inativo',
    instance_missing: 'Instancia ausente',
    disconnected: 'Desconectado',
    qrcode_pending: 'QR Code pendente',
    qrcode_available: 'QR Code disponivel',
    connecting: 'Conectando',
    connected: 'WhatsApp conectado',
    error: 'Erro na conexao',
  };

  return labels[state];
}

function stateClass(state: CommunicationWhatsAppState) {
  if (state === 'connected') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (state === 'error' || state === 'disconnected') return 'bg-red-50 text-red-700 ring-red-100';
  if (state === 'module_inactive' || state === 'instance_missing') return 'bg-slate-100 text-slate-700 ring-slate-200';
  return 'bg-amber-50 text-amber-700 ring-amber-100';
}

function shouldShowQrCode(status: CommunicationSettingsStatus) {
  return Boolean(status.qrCode && ['disconnected', 'qrcode_pending', 'qrcode_available', 'connecting', 'error'].includes(status.state));
}

interface CommunicationModuleActivationCardProps {
  loading: boolean;
  onActivate: () => void;
}

export function CommunicationModuleActivationCard({ loading, onActivate }: CommunicationModuleActivationCardProps) {
  return (
    <SettingsCard
      title="Communication ainda nao esta ativo"
      description="Ative o modulo para registrar a instancia WhatsApp no Orchestra e liberar a leitura do QR Code."
    >
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Modulo Communication inativo</p>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                A ativacao cria ou registra a instancia no Communication Service por meio da Orchestra API.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="communication-activate-button"
            onClick={onActivate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            {loading ? 'Ativando...' : 'Ativar modulo Communication'}
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}

interface WhatsAppQrCodePanelProps {
  qrCode: string;
  loading: boolean;
  onRefreshQrCode: () => void;
}

export function WhatsAppQrCodePanel({ qrCode, loading, onRefreshQrCode }: WhatsAppQrCodePanelProps) {
  const isImage = /^https?:\/\//i.test(qrCode.trim()) || /^data:image\//i.test(qrCode.trim()) || /^[A-Za-z0-9+/]+=*$/.test(qrCode.trim());

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5" data-testid="communication-whatsapp-qrcode-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex h-56 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 lg:w-56">
          {isImage ? (
            <img
              src={qrCodeSource(qrCode)}
              alt="QR Code de conexao do WhatsApp"
              className="max-h-full max-w-full object-contain"
              data-testid="communication-whatsapp-qrcode-image"
            />
          ) : (
            <div className="break-all text-center text-sm font-medium text-slate-700" data-testid="communication-whatsapp-qrcode-text">
              {qrCode}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <QrCode className="h-4 w-4 text-blue-600" />
            Escaneie o QR Code
          </div>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Abra o WhatsApp no celular, va em Aparelhos conectados e escaneie este QR Code.
          </p>
          <button
            type="button"
            data-testid="communication-refresh-qrcode-button"
            onClick={onRefreshQrCode}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            {loading ? 'Gerando...' : 'Gerar/Recarregar QR Code'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface WhatsAppConnectionCardProps {
  status: CommunicationSettingsStatus;
  loading: boolean;
  refreshingStatus: boolean;
  refreshingQrCode: boolean;
  onRefreshStatus: () => void;
  onRefreshQrCode: () => void;
}

export function WhatsAppConnectionCard({
  status,
  loading,
  refreshingStatus,
  refreshingQrCode,
  onRefreshStatus,
  onRefreshQrCode,
}: WhatsAppConnectionCardProps) {
  const showQrCode = shouldShowQrCode(status);
  const connected = status.state === 'connected';
  const pendingMessage = status.message ?? 'A conexao ainda nao foi concluida. Atualize o status ou gere um novo QR Code.';

  return (
    <SettingsCard
      title="WhatsApp"
      description="Acompanhe a instancia WhatsApp registrada no Communication Service sem expor credenciais no navegador."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="communication-refresh-status-button"
            onClick={onRefreshStatus}
            disabled={loading || refreshingStatus}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Atualizar status
          </button>
          {!connected ? (
            <button
              type="button"
              data-testid="communication-refresh-qrcode-action"
              onClick={onRefreshQrCode}
              disabled={loading || refreshingQrCode}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshingQrCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Gerar/Recarregar QR Code
            </button>
          ) : null}
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4" data-testid="communication-settings-loading">
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-56 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : (
        <div className="space-y-5" data-testid="communication-whatsapp-card">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Modulo Communication</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{status.moduleActive ? 'Ativo' : 'Inativo'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Instancia WhatsApp</p>
              <p className="mt-2 truncate text-sm font-semibold text-slate-950">{status.instanceName ?? 'Instancia nao registrada'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${stateClass(status.state)}`}>
                {stateLabel(status.state)}
              </span>
            </div>
          </div>

          {connected ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4" data-testid="communication-connected-success">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">WhatsApp conectado</p>
                  <p className="mt-1 text-sm text-emerald-800">A instancia esta pronta para operar no Communication.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4" data-testid="communication-pending-alert">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="font-semibold text-amber-950">{status.state === 'error' ? 'Nao foi possivel conectar o WhatsApp' : 'WhatsApp ainda nao conectado'}</p>
                  <p className="mt-1 text-sm text-amber-900">{pendingMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Smartphone className="h-4 w-4 text-slate-500" />
                Numero conectado
              </div>
              <p className="mt-2 text-sm text-slate-600">{status.connectedPhoneNumber ?? 'Nao informado'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
              <div className="text-sm font-semibold text-slate-950">Ultima atualizacao</div>
              <p className="mt-2 text-sm text-slate-600">{formatDateTime(status.lastUpdatedAt)}</p>
            </div>
          </div>

          {showQrCode && status.qrCode ? (
            <WhatsAppQrCodePanel qrCode={status.qrCode} loading={refreshingQrCode} onRefreshQrCode={onRefreshQrCode} />
          ) : null}
        </div>
      )}
    </SettingsCard>
  );
}

export function ChannelsPage() {
  const [status, setStatus] = useState<CommunicationSettingsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [refreshingQrCode, setRefreshingQrCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleState = useMemo(() => status?.state ?? 'module_inactive', [status]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await communicationSettingsService.getSettings());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel carregar as configuracoes de comunicacao.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    try {
      setStatus(await communicationSettingsService.activate());
      setStatus(await communicationSettingsService.getWhatsAppStatus());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel ativar o modulo Communication.');
    } finally {
      setActivating(false);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshingStatus(true);
    setError(null);
    try {
      setStatus(await communicationSettingsService.getWhatsAppStatus());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel atualizar o status do WhatsApp.');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleRefreshQrCode = async () => {
    setRefreshingQrCode(true);
    setError(null);
    try {
      setStatus(await communicationSettingsService.refreshWhatsAppQrCode());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel gerar o QR Code do WhatsApp.');
    } finally {
      setRefreshingQrCode(false);
    }
  };

  return (
    <CommunicationSettingsLayout
      title="Comunicacao"
      subtitle="Configure o modulo Communication e acompanhe a conexao WhatsApp da instancia."
      activePath="/communication/settings/channels"
    >
      <div className="space-y-6" data-testid="communication-settings-channels-page" data-state={visibleState}>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" data-testid="communication-settings-error">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Nao foi possivel concluir a acao</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <SettingsCard title="Comunicacao" description="Carregando status do modulo e da instancia WhatsApp.">
            <div className="space-y-4" data-testid="communication-settings-loading">
              <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </SettingsCard>
        ) : !status?.moduleActive ? (
          <CommunicationModuleActivationCard loading={activating} onActivate={handleActivate} />
        ) : status ? (
          <WhatsAppConnectionCard
            status={status}
            loading={false}
            refreshingStatus={refreshingStatus}
            refreshingQrCode={refreshingQrCode}
            onRefreshStatus={handleRefreshStatus}
            onRefreshQrCode={handleRefreshQrCode}
          />
        ) : null}
      </div>
    </CommunicationSettingsLayout>
  );
}
