export type CommunicationChannelProvider = 'z-api' | 'whatsapp-business' | 'twilio' | 'meta' | 'custom';

export type CommunicationChannelStatus =
  | 'draft'
  | 'provisioning'
  | 'pending_connection'
  | 'qr_pending'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'disabled';

export interface CommunicationChannel {
  id: string;
  name: string;
  phoneNumber: string;
  provider: CommunicationChannelProvider;
  status: CommunicationChannelStatus;
  instanceId: string;
  providerInstanceId?: string;
  instanceToken: string;
  clientToken: string;
  department: string;
  defaultDepartmentId?: string | null;
  defaultAssignee: string;
  defaultAssigneeId?: string | null;
  unitId?: string | null;
  isActive: boolean;
  lastConnectionAt?: string | null;
  lastConnectedAt?: string | null;
  lastDisconnectedAt?: string | null;
  lastStatusCheckAt?: string | null;
  credentialsConfigured?: {
    providerInstanceToken: boolean;
  providerClientToken: boolean;
  };
  provisionedBySystem?: boolean;
  provisionedAt?: string | null;
  provisioningStatus?: string | null;
  provisioningError?: string | null;
  expectedPhoneNumber?: string | null;
  connectedPhoneNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisionWhatsappChannelPayload {
  name?: string;
  expectedPhoneNumber?: string;
  defaultDepartmentId?: string | null;
  defaultAssigneeId?: string | null;
  department?: string;
  defaultAssignee?: string;
}

export interface CommunicationChannelDraft {
  id?: string;
  name: string;
  phoneNumber: string;
  provider: CommunicationChannelProvider;
  status: CommunicationChannelStatus;
  instanceId: string;
  providerInstanceId?: string;
  instanceToken?: string;
  clientToken?: string;
  department: string;
  defaultDepartmentId?: string | null;
  defaultAssignee: string;
  defaultAssigneeId?: string | null;
  unitId?: string | null;
  isActive: boolean;
  lastConnectionAt?: string | null;
}

export interface CommunicationChannelConnectionPayload {
  channel: CommunicationChannel;
  provider: Record<string, unknown>;
  qrCode?: string | null;
}

export interface CommunicationChannelConnectionStatus {
  channel: CommunicationChannel;
  provider?: Record<string, unknown>;
  qrCode?: string | null;
  status?: CommunicationChannelStatus;
}

export interface CommunicationChannelQrResponse extends CommunicationChannelConnectionStatus {}

export interface CommunicationChannelLog {
  id: string;
  event: string;
  level: 'debug' | 'info' | 'warning' | 'error' | string;
  status?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  occurredAt?: string | null;
  createdAt?: string | null;
}
