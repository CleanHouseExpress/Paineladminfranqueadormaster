import { apiClient } from './apiClient';

export type OrderDispatchChannel = 'MANUAL' | 'EMAIL' | 'WHATSAPP' | 'API';
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
  unit: { id: number; name: string };
  total: number;
  allowed_dispatch_channels: OrderDispatchChannel[];
  dispatches: OrderDispatch[];
}

interface DataResponse<T> {
  data: T;
}

export const orderDispatchService = {
  getPurchaseOrder: async (id: string) => (
    await apiClient.get<DataResponse<PurchaseOrder>>(`/api/v1/purchase-orders/${id}`)
  ).data,

  create: async (purchaseOrderId: string, channel: OrderDispatchChannel) => (
    await apiClient.post<DataResponse<OrderDispatch>>(
      `/api/v1/purchase-orders/${purchaseOrderId}/dispatches`,
      { channel },
    )
  ).data,
};
