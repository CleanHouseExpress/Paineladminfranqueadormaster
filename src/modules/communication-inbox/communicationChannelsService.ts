import { ApiError, apiClient } from '../../services/apiClient';
import type {
  CommunicationChannel,
  CommunicationChannelConnectionPayload,
  CommunicationChannelDraft,
  CommunicationChannelLog,
  CommunicationChannelProvider,
  ProvisionWhatsappChannelPayload,
} from './channelTypes';

const CHANNELS_BASE = '/api/tenant/communication/channels';

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

function unwrapData(payload: unknown): unknown {
  const record = asRecord(payload);
  return record.data ?? payload;
}

function toStringValue(value: unknown, fallback = '') {
  return value === undefined || value === null ? fallback : String(value);
}

function toNullableString(value: unknown): string | null {
  return value === undefined || value === null || value === '' ? null : String(value);
}

function isMaskedToken(token?: string | null) {
  if (!token) return false;
  return token.includes('*');
}

function fromApiProvider(provider: unknown): CommunicationChannelProvider {
  const value = String(provider ?? 'z_api').toLowerCase();
  if (value === 'z_api' || value === 'z-api') return 'z-api';
  if (value === 'whatsapp_business') return 'whatsapp-business';
  if (['twilio', 'meta', 'custom'].includes(value)) return value as CommunicationChannelProvider;
  return 'z-api';
}

function toApiProvider(provider: CommunicationChannelProvider) {
  return provider === 'z-api' ? 'z_api' : provider.replaceAll('-', '_');
}

function maskToken(token?: string | null) {
  if (!token) return '';
  const value = String(token).trim();
  if (!value) return '';
  if (value.length <= 6) return '******';
  return `${value.slice(0, 2)}${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}

function normalizeApiChannel(payload: unknown): CommunicationChannel {
  const record = asRecord(unwrapData(payload));
  if (!Object.keys(record).length) {
    throw new Error('Canal invalido');
  }

  const defaultDepartment = asRecord(pick(record, ['default_department', 'defaultDepartment']));
  const defaultAssignee = asRecord(pick(record, ['default_assignee', 'defaultAssignee']));
  const credentials = asRecord(pick(record, ['credentials_configured', 'credentialsConfigured']));
  const instanceId = toStringValue(pick(record, ['provider_instance_id', 'providerInstanceId', 'instanceId']));
  const status = toStringValue(pick(record, ['status']), 'draft') as CommunicationChannel['status'];
  const lastConnectedAt = toNullableString(pick(record, ['last_connected_at', 'lastConnectedAt', 'lastConnectionAt']));

  return {
    id: toStringValue(record.id),
    name: toStringValue(record.name, 'Novo canal'),
    phoneNumber: toStringValue(pick(record, ['phone_number', 'phoneNumber', 'connected_phone_number', 'expected_phone_number'])),
    provider: fromApiProvider(record.provider),
    status,
    instanceId,
    providerInstanceId: instanceId,
    instanceToken: maskToken(toStringValue(pick(record, ['provider_instance_token', 'instanceToken']))),
    clientToken: maskToken(toStringValue(pick(record, ['provider_client_token', 'clientToken']))),
    department: toStringValue(pick(record, ['department']) ?? pick(defaultDepartment, ['name']), 'Atendimento'),
    defaultDepartmentId: toNullableString(pick(record, ['default_department_id', 'defaultDepartmentId'])),
    defaultAssignee: toStringValue(pick(record, ['defaultAssignee']) ?? pick(defaultAssignee, ['name']), 'Sem responsavel'),
    defaultAssigneeId: toNullableString(pick(record, ['default_assignee_id', 'defaultAssigneeId'])),
    unitId: toNullableString(pick(record, ['unit_id', 'unitId'])),
    isActive: pick(record, ['is_active', 'isActive']) === undefined ? status !== 'disabled' : Boolean(pick(record, ['is_active', 'isActive'])),
    lastConnectionAt: lastConnectedAt,
    lastConnectedAt,
    lastDisconnectedAt: toNullableString(pick(record, ['last_disconnected_at', 'lastDisconnectedAt'])),
    lastStatusCheckAt: toNullableString(pick(record, ['last_status_check_at', 'lastStatusCheckAt'])),
    credentialsConfigured: {
      providerInstanceToken: Boolean(pick(credentials, ['provider_instance_token', 'providerInstanceToken'])),
      providerClientToken: Boolean(pick(credentials, ['provider_client_token', 'providerClientToken'])),
    },
    provisionedBySystem: Boolean(pick(record, ['provisioned_by_system', 'provisionedBySystem'])),
    provisionedAt: toNullableString(pick(record, ['provisioned_at', 'provisionedAt'])),
    provisioningStatus: toNullableString(pick(record, ['provisioning_status', 'provisioningStatus'])),
    provisioningError: toNullableString(pick(record, ['provisioning_error', 'provisioningError'])),
    expectedPhoneNumber: toNullableString(pick(record, ['expected_phone_number', 'expectedPhoneNumber'])),
    connectedPhoneNumber: toNullableString(pick(record, ['connected_phone_number', 'connectedPhoneNumber'])),
    createdAt: toStringValue(pick(record, ['created_at', 'createdAt']), new Date().toISOString()),
    updatedAt: toStringValue(pick(record, ['updated_at', 'updatedAt']), new Date().toISOString()),
  };
}

function provisionWhatsappToChannelDraft(payload: ProvisionWhatsappChannelPayload): CommunicationChannelDraft {
  return {
    name: payload.name?.trim() || 'WhatsApp Atendimento',
    phoneNumber: payload.expectedPhoneNumber?.trim() || '',
    provider: 'z-api',
    status: 'draft',
    instanceId: '',
    providerInstanceId: undefined,
    department: payload.department?.trim() || 'Atendimento',
    defaultDepartmentId: payload.defaultDepartmentId ?? null,
    defaultAssignee: payload.defaultAssignee?.trim() || 'Sem responsavel',
    defaultAssigneeId: payload.defaultAssigneeId ?? null,
    isActive: true,
  };
}

function channelDraftToApiPayload(payload: CommunicationChannelDraft) {
  const providerInstanceId = payload.providerInstanceId ?? payload.instanceId;
  const next: Record<string, unknown> = {
    name: payload.name,
    type: 'whatsapp',
    provider: toApiProvider(payload.provider),
    phone_number: payload.phoneNumber || null,
    status: payload.status,
    default_department_id: payload.defaultDepartmentId ? Number(payload.defaultDepartmentId) : null,
    default_assignee_id: payload.defaultAssigneeId ? Number(payload.defaultAssigneeId) : null,
    unit_id: payload.unitId ? Number(payload.unitId) : null,
    provider_instance_id: providerInstanceId || null,
  };

  if (payload.instanceToken && !isMaskedToken(payload.instanceToken)) {
    next.provider_instance_token = payload.instanceToken;
  }

  if (payload.clientToken && !isMaskedToken(payload.clientToken)) {
    next.provider_client_token = payload.clientToken;
  }

  return next;
}

function normalizeLog(payload: unknown): CommunicationChannelLog {
  const log = asRecord(payload);
  return {
    id: toStringValue(pick(log, ['id'])),
    event: toStringValue(pick(log, ['event', 'type']), 'unknown'),
    level: toStringValue(pick(log, ['level']), 'info'),
    status: toNullableString(pick(log, ['status'])),
    message: toStringValue(pick(log, ['message']), 'Sem mensagem'),
    metadata: asRecord(pick(log, ['metadata'])),
    occurredAt: toNullableString(pick(log, ['occurred_at', 'occurredAt'])),
    createdAt: toNullableString(pick(log, ['created_at', 'createdAt'])),
  };
}

function extractRows(payload: unknown): unknown[] {
  const root = asRecord(payload);
  const data = root.data;
  if (Array.isArray(data)) return data;
  const nested = asRecord(data);
  if (Array.isArray(nested.data)) return nested.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function extractQrCode(payload: unknown): string | null {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const provider = asRecord(root.provider);
  const providerData = asRecord(provider.data);

  return toNullableString(
    pick(root, ['qr_code', 'qrcode', 'qr', 'base64', 'image', 'url'])
      ?? pick(data, ['qr_code', 'qrcode', 'qr', 'base64', 'image', 'url'])
      ?? pick(provider, ['qr_code', 'qrcode', 'qr', 'base64', 'image', 'url'])
      ?? pick(providerData, ['qr_code', 'qrcode', 'qr', 'base64', 'image', 'url']),
  );
}

function normalizeConnectionPayload(payload: unknown): CommunicationChannelConnectionPayload {
  const root = asRecord(unwrapData(payload));
  const channel = normalizeApiChannel(root.channel ?? payload);
  const provider = asRecord(root.provider);

  return {
    channel,
    provider,
    qrCode: extractQrCode(payload),
  };
}

function rethrowApiError(error: unknown, fallbackMessage: string): never {
  if (error instanceof ApiError) {
    const data = asRecord(error.data);
    throw new Error(toStringValue(data.message, fallbackMessage));
  }

  if (error instanceof Error) throw error;
  throw new Error(fallbackMessage);
}

export const communicationChannelsService = {
  async list(): Promise<CommunicationChannel[]> {
    try {
      const payload = await apiClient.get<unknown>(`${CHANNELS_BASE}?per_page=100`);
      return extractRows(payload).map(normalizeApiChannel);
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel carregar os canais.');
    }
  },

  async get(id: string): Promise<CommunicationChannel | null> {
    try {
      const payload = await apiClient.get<unknown>(`${CHANNELS_BASE}/${id}`);
      return normalizeApiChannel(payload);
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel carregar o canal.');
    }
  },

  async create(payload: CommunicationChannelDraft): Promise<CommunicationChannel> {
    try {
      const response = await apiClient.post<unknown>(CHANNELS_BASE, channelDraftToApiPayload(payload));
      return normalizeApiChannel(response);
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel criar o canal.');
    }
  },

  async provisionWhatsappChannel(payload: ProvisionWhatsappChannelPayload): Promise<CommunicationChannelConnectionPayload> {
    const channel = await this.create(provisionWhatsappToChannelDraft(payload));
    return { channel, provider: {}, qrCode: null };
  },

  async update(id: string, payload: CommunicationChannelDraft): Promise<CommunicationChannel> {
    try {
      const response = await apiClient.put<unknown>(`${CHANNELS_BASE}/${id}`, channelDraftToApiPayload(payload));
      return normalizeApiChannel(response);
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel salvar o canal.');
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`${CHANNELS_BASE}/${id}`);
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel remover o canal.');
    }
  },

  async listChannels(): Promise<CommunicationChannel[]> {
    return this.list();
  },

  async getChannel(id: string): Promise<CommunicationChannel | null> {
    return this.get(id);
  },

  async createChannel(payload: CommunicationChannelDraft): Promise<CommunicationChannel> {
    return this.create(payload);
  },

  async updateChannel(id: string, payload: CommunicationChannelDraft): Promise<CommunicationChannel> {
    return this.update(id, payload);
  },

  async deleteChannel(id: string): Promise<void> {
    return this.remove(id);
  },

  async connectChannel(id: string): Promise<CommunicationChannelConnectionPayload> {
    return this.connect(id);
  },

  async refreshChannelQr(id: string): Promise<CommunicationChannelConnectionPayload> {
    return this.refreshQr(id);
  },

  async getChannelConnectionStatus(id: string): Promise<CommunicationChannelConnectionPayload> {
    return this.connectionStatus(id);
  },

  async syncChannelStatus(id: string): Promise<CommunicationChannelConnectionPayload> {
    return this.syncStatus(id);
  },

  async disconnectChannel(id: string): Promise<CommunicationChannelConnectionPayload> {
    return this.disconnect(id);
  },

  async listChannelLogs(id: string): Promise<CommunicationChannelLog[]> {
    return this.logs(id);
  },

  async connect(id: string): Promise<CommunicationChannelConnectionPayload> {
    try {
      return normalizeConnectionPayload(await apiClient.post<unknown>(`${CHANNELS_BASE}/${id}/connect`, {}));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel iniciar a conexao.');
    }
  },

  async refreshQr(id: string): Promise<CommunicationChannelConnectionPayload> {
    try {
      return normalizeConnectionPayload(await apiClient.post<unknown>(`${CHANNELS_BASE}/${id}/refresh-qr`, {}));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel gerar novo QR Code.');
    }
  },

  async connectionStatus(id: string): Promise<CommunicationChannelConnectionPayload> {
    try {
      return normalizeConnectionPayload(await apiClient.get<unknown>(`${CHANNELS_BASE}/${id}/connection-status`));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel consultar o status.');
    }
  },

  async syncStatus(id: string): Promise<CommunicationChannelConnectionPayload> {
    try {
      return normalizeConnectionPayload(await apiClient.post<unknown>(`${CHANNELS_BASE}/${id}/sync-status`, {}));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel sincronizar o status.');
    }
  },

  async disconnect(id: string): Promise<CommunicationChannelConnectionPayload> {
    try {
      return normalizeConnectionPayload(await apiClient.post<unknown>(`${CHANNELS_BASE}/${id}/disconnect`, {}));
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel desconectar o canal.');
    }
  },

  async logs(id: string): Promise<CommunicationChannelLog[]> {
    try {
      const payload = await apiClient.get<unknown>(`${CHANNELS_BASE}/${id}/logs?per_page=30`);
      return extractRows(payload).map(normalizeLog);
    } catch (error) {
      rethrowApiError(error, 'Nao foi possivel carregar os logs.');
    }
  },

  maskToken,
};

