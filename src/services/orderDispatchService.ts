import { apiClient } from './apiClient';

export type OrderDispatchChannel = 'manual' | 'email' | 'whatsapp' | 'api';
export type OrderDispatchStatus = 'pending' | 'sent' | 'failed';

export interface OrderDispatch {
  id: number;
  channel: OrderDispatchChannel;
  status: OrderDispatchStatus;
  recipient: string;
  attempts: number;
  external_reference: string | null;
  last_error: string | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  number: string;
  status: string;
  supplier: { id: number; name: string; email?: string | null };
  supplier_snapshot?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    contact_name?: string | null;
  } | null;
  unit: { id: number; name: string };
  total: number;
}

export interface PurchaseOrderDispatchData extends PurchaseOrder {
  allowed_dispatch_channels: OrderDispatchChannel[];
  dispatches: OrderDispatch[];
}

interface ProcurementPolicy {
  procurement_enabled?: boolean;
  manual_dispatch_enabled?: boolean;
  email_dispatch_enabled?: boolean;
  whatsapp_dispatch_enabled?: boolean;
  api_dispatch_enabled?: boolean;
}

interface DataResponse<T> {
  data: T;
}

const procurementPath = '/api/company/procurement';

function normalizeChannel(channel: string): OrderDispatchChannel {
  return channel.toLowerCase() as OrderDispatchChannel;
}

function normalizeDispatch(dispatch: Omit<OrderDispatch, 'channel'> & { channel: string }): OrderDispatch {
  return { ...dispatch, channel: normalizeChannel(dispatch.channel) };
}

function allowedChannels(policy: ProcurementPolicy): OrderDispatchChannel[] {
  if (policy.procurement_enabled === false) return [];

  const channelFlags: Array<[OrderDispatchChannel, boolean | undefined]> = [
    ['manual', policy.manual_dispatch_enabled],
    ['email', policy.email_dispatch_enabled],
    ['whatsapp', policy.whatsapp_dispatch_enabled],
    ['api', policy.api_dispatch_enabled],
  ];

  return channelFlags.filter(([, enabled]) => enabled === true).map(([channel]) => channel);
}

export const orderDispatchService = {
  getPurchaseOrder: async (id: string): Promise<PurchaseOrderDispatchData> => {
    const orderPath = `${procurementPath}/purchase-orders/${id}`;
    const [orderResponse, policyResponse, dispatchResponse] = await Promise.all([
      apiClient.get<DataResponse<PurchaseOrder>>(orderPath),
      apiClient.get<DataResponse<ProcurementPolicy>>(`${procurementPath}/policy`),
      apiClient.get<DataResponse<Array<Omit<OrderDispatch, 'channel'> & { channel: string }>>>(`${orderPath}/dispatches`),
    ]);

    return {
      ...orderResponse.data,
      status: orderResponse.data.status.toLowerCase(),
      allowed_dispatch_channels: allowedChannels(policyResponse.data),
      dispatches: dispatchResponse.data.map(normalizeDispatch),
    };
  },

  create: async (
    purchaseOrderId: string,
    channel: OrderDispatchChannel,
    recipient: string,
    idempotencyKey: string,
  ) => normalizeDispatch((
    await apiClient.post<DataResponse<Omit<OrderDispatch, 'channel'> & { channel: string }>>(
      `${procurementPath}/purchase-orders/${purchaseOrderId}/dispatches`,
      { channel, recipient },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
  ).data),
};
