import { ApiError, apiClient } from '../../services/apiClient';

export type CommunicationWhatsAppState =
  | 'module_inactive'
  | 'instance_missing'
  | 'disconnected'
  | 'qrcode_pending'
  | 'qrcode_available'
  | 'pairing_code_available'
  | 'connecting'
  | 'connected'
  | 'error';

export interface CommunicationSettingsStatus {
  moduleActive: boolean;
  moduleStatus: string;
  state: CommunicationWhatsAppState;
  instanceName: string | null;
  connectedPhoneNumber: string | null;
  qrCode: string | null;
  lastUpdatedAt: string | null;
  message: string | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function pick(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function unwrapData(payload: unknown): Record<string, unknown> {
  const root = asRecord(payload);
  return asRecord(root.data ?? payload);
}

function toNullableString(value: unknown): string | null {
  return value === undefined || value === null || value === '' ? null : String(value);
}

function toState(value: unknown, moduleActive: boolean): CommunicationWhatsAppState {
  if (!moduleActive) return 'module_inactive';

  const normalized = String(value ?? '').toLowerCase();
  const allowed: CommunicationWhatsAppState[] = [
    'module_inactive',
    'instance_missing',
    'disconnected',
    'qrcode_pending',
    'qrcode_available',
    'pairing_code_available',
    'connecting',
    'connected',
    'error',
  ];

  if (allowed.includes(normalized as CommunicationWhatsAppState)) {
    return normalized as CommunicationWhatsAppState;
  }

  if (normalized === 'qr_pending') return 'qrcode_pending';
  if (normalized === 'pending_connection') return 'qrcode_available';
  if (normalized === 'active') return 'connected';

  return 'instance_missing';
}

function extractQrCode(record: Record<string, unknown>): string | null {
  const whatsapp = asRecord(pick(record, ['whatsapp', 'whatsapp_status', 'whatsappStatus']));
  const instance = asRecord(pick(record, ['instance']));

  return toNullableString(
    pick(record, ['qr_code', 'qrcode', 'qrCode', 'qr', 'base64', 'url'])
      ?? pick(whatsapp, ['qr_code', 'qrcode', 'qrCode', 'qr', 'base64', 'url'])
      ?? pick(instance, ['qr_code', 'qrcode', 'qrCode', 'qr', 'base64', 'url']),
  );
}

export function normalizeCommunicationSettingsStatus(payload: unknown): CommunicationSettingsStatus {
  const record = unwrapData(payload);
  const whatsapp = asRecord(pick(record, ['whatsapp', 'whatsapp_status', 'whatsappStatus']));
  const instance = asRecord(pick(record, ['instance']));
  const module = asRecord(pick(record, ['module']));
  const moduleStatus = toNullableString(pick(record, ['module_status', 'moduleStatus', 'status']) ?? pick(module, ['status'])) ?? 'inactive';
  const moduleActive = Boolean(
    pick(record, ['module_active', 'moduleActive', 'is_active', 'active'])
      ?? pick(module, ['active', 'is_active'])
      ?? moduleStatus === 'active',
  );
  const rawState = pick(record, ['state', 'connection_state', 'connectionState'])
    ?? pick(whatsapp, ['state', 'status', 'connection_status', 'connectionStatus'])
    ?? pick(instance, ['state', 'status']);
  const state = toState(rawState, moduleActive);

  return {
    moduleActive,
    moduleStatus,
    state,
    instanceName: toNullableString(
      pick(record, ['instance_name', 'instanceName'])
        ?? pick(whatsapp, ['instance_name', 'instanceName'])
        ?? pick(instance, ['name', 'instance_name', 'instanceName']),
    ),
    connectedPhoneNumber: toNullableString(
      pick(record, ['connected_phone_number', 'connectedPhoneNumber', 'phone_number', 'phoneNumber'])
        ?? pick(whatsapp, ['connected_phone_number', 'connectedPhoneNumber', 'phone_number', 'phoneNumber'])
        ?? pick(instance, ['connected_phone_number', 'connectedPhoneNumber', 'phone_number', 'phoneNumber']),
    ),
    qrCode: extractQrCode(record),
    lastUpdatedAt: toNullableString(
      pick(record, ['last_updated_at', 'lastUpdatedAt', 'last_status_check_at', 'lastStatusCheckAt', 'updated_at', 'updatedAt'])
        ?? pick(whatsapp, ['last_updated_at', 'lastUpdatedAt', 'updated_at', 'updatedAt'])
        ?? pick(instance, ['last_updated_at', 'lastUpdatedAt', 'updated_at', 'updatedAt']),
    ),
    message: toNullableString(pick(record, ['message', 'error']) ?? pick(whatsapp, ['message', 'error'])),
  };
}

function rethrowApiError(error: unknown, fallbackMessage: string): never {
  if (error instanceof ApiError) {
    const data = asRecord(error.data);
    throw new Error(toNullableString(data.message) ?? fallbackMessage);
  }

  if (error instanceof Error) throw error;
  throw new Error(fallbackMessage);
}

export const communicationSettingsService = {
  async getSettings(): Promise<CommunicationSettingsStatus> {
    try {
      return normalizeCommunicationSettingsStatus(await apiClient.get<unknown>('/api/tenant/communication/settings'));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel carregar as configuracoes de comunicacao.');
    }
  },

  async activate(): Promise<CommunicationSettingsStatus> {
    try {
      return normalizeCommunicationSettingsStatus(await apiClient.post<unknown>('/api/tenant/communication/activate', {}));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel ativar o modulo Communication.');
    }
  },

  async getWhatsAppStatus(): Promise<CommunicationSettingsStatus> {
    try {
      return normalizeCommunicationSettingsStatus(await apiClient.get<unknown>('/api/tenant/communication/whatsapp/status'));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel atualizar o status do WhatsApp.');
    }
  },

  async refreshWhatsAppQrCode(): Promise<CommunicationSettingsStatus> {
    try {
      return normalizeCommunicationSettingsStatus(await apiClient.post<unknown>('/api/tenant/communication/whatsapp/qrcode/refresh', {}));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel gerar o QR Code do WhatsApp.');
    }
  },
};
