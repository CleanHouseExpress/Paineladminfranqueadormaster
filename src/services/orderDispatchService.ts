import { apiClient } from './apiClient';

export type OrderDispatchChannel = 'manual' | 'email' | 'whatsapp' | 'api';
export type OrderDispatchStatus = 'pending' | 'sent' | 'failed';

export interface OrderDispatch {
  id: number;
  channel: OrderDispatchChannel;
  status: OrderDispatchStatus;
  recipient: string;
  attempts: number;
  payload_snapshot: Record<string, unknown> | null;
  external_reference: string | null;
  last_error: string | null;
  attempted_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
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
  can_dispatch: boolean;
  dispatches: OrderDispatch[];
}

interface DataResponse<T> {
  data: T;
}

interface DispatchHistoryResponse {
  data: Array<Omit<OrderDispatch, 'channel'> & { channel: string }>;
  capabilities: Partial<Record<OrderDispatchChannel, boolean>>;
  can_dispatch: boolean;
}

const procurementPath = '/api/company/procurement';

function normalizeChannel(channel: string): OrderDispatchChannel {
  return channel.toLowerCase() as OrderDispatchChannel;
}

function normalizeDispatch(dispatch: Omit<OrderDispatch, 'channel'> & { channel: string }): OrderDispatch {
  return { ...dispatch, channel: normalizeChannel(dispatch.channel) };
}

export const orderDispatchService = {
  getPurchaseOrder: async (id: string): Promise<PurchaseOrderDispatchData> => {
    const orderPath = `${procurementPath}/purchase-orders/${id}`;
    const [orderResponse, dispatchResponse] = await Promise.all([
      apiClient.get<DataResponse<PurchaseOrder>>(orderPath),
      apiClient.get<DispatchHistoryResponse>(`${orderPath}/dispatches`),
    ]);

    const allowedDispatchChannels = Object.entries(dispatchResponse.capabilities ?? {})
      .filter(([, enabled]) => enabled === true)
      .map(([channel]) => normalizeChannel(channel));

    return {
      ...orderResponse.data,
      status: orderResponse.data.status.toLowerCase(),
      allowed_dispatch_channels: allowedDispatchChannels,
      can_dispatch: dispatchResponse.can_dispatch === true,
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
