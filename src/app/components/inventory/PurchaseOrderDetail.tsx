import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Send } from 'lucide-react';

import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import { getApiErrorMessage } from '../../../services/apiClient';
import {
  orderDispatchService,
  type OrderDispatch,
  type OrderDispatchChannel,
  type PurchaseOrderDispatchData,
} from '../../../services/orderDispatchService';
import { Button } from '../ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../ui/dialog';

const channelLabels: Record<OrderDispatchChannel, string> = {
  manual: 'Manual',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  api: 'API',
};

const statusLabels: Record<OrderDispatch['status'], string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  failed: 'Falhou',
};

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%' };
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14,
  boxShadow: '0 1px 4px rgba(15,23,42,.04)', padding: 20,
};

function DispatchHistory({ dispatches }: { dispatches: OrderDispatch[] }) {
  return (
    <section aria-label="Histórico de envios" style={{ ...cardStyle, marginTop: 20 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 17 }}>Histórico de envios</h2>
      {dispatches.length === 0 ? (
        <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>Nenhum envio registrado.</p>
      ) : dispatches.map(dispatch => (
        <article key={dispatch.id} style={{ display: 'grid', gap: 5, padding: '12px 0', borderTop: '1px solid #E2E8F0' }}>
          <strong>{channelLabels[dispatch.channel]}</strong>
          <span>{statusLabels[dispatch.status]}</span>
          <span style={{ color: '#475569' }}>{dispatch.recipient}</span>
          <span style={{ color: '#64748B', fontSize: 13 }}>
            {dispatch.attempts} {dispatch.attempts === 1 ? 'tentativa' : 'tentativas'}
          </span>
          {dispatch.external_reference && (
            <span style={{ color: '#64748B', fontSize: 13 }}>
              Referência externa: {dispatch.external_reference}
            </span>
          )}
          {dispatch.last_error && (
            <span style={{ color: '#B91C1C', fontSize: 13 }}>
              Erro: {dispatch.last_error}
            </span>
          )}
        </article>
      ))}
    </section>
  );
}

export function PurchaseOrderDetailPage() {
  const { id = '' } = useParams();
  const { hasPermission } = usePermission();
  const [order, setOrder] = useState<PurchaseOrderDispatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [channel, setChannel] = useState<OrderDispatchChannel | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const idempotencyKey = useRef('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    orderDispatchService.getPurchaseOrder(id)
      .then(data => {
        if (!active) return;
        setOrder(data);
        setChannel(data.allowed_dispatch_channels[0] ?? '');
      })
      .catch(requestError => {
        if (active) setError(getApiErrorMessage(requestError, 'Não foi possível carregar o pedido.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function confirmDispatch() {
    if (!channel || !order) return;
    const recipient = order.supplier_snapshot?.email
      ?? order.supplier.email
      ?? order.supplier_snapshot?.contact_name
      ?? order.supplier.name;
    if (!idempotencyKey.current) {
      idempotencyKey.current = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `order-dispatch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const dispatch = await orderDispatchService.create(id, channel, recipient, idempotencyKey.current);
      setOrder(current => current ? { ...current, dispatches: [dispatch, ...current.dispatches] } : current);
      idempotencyKey.current = '';
      setDialogOpen(false);
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError, 'Não foi possível enviar o pedido.'));
    } finally {
      setSubmitting(false);
    }
  }

  function setDispatchDialogOpen(open: boolean) {
    if (!open) {
      idempotencyKey.current = '';
      setSubmitError('');
    }
    setDialogOpen(open);
  }

  if (loading) return <ModuleStateView state="loading" />;
  if (error || !order) return <ModuleStateView state="error" errorMessage={error || 'Pedido não encontrado.'} />;

  const canDispatch = order.status === 'approved'
    && order.allowed_dispatch_channels.length > 0
    && hasPermission('tenant.procurement.purchase_orders.dispatch');

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 25 }}>{order.number}</h1>
          <span style={{ display: 'inline-block', marginTop: 8, padding: '5px 10px', borderRadius: 99, background: '#DCFCE7', color: '#166534', fontSize: 12, fontWeight: 700 }}>
            {order.status === 'approved' ? 'Aprovado' : order.status}
          </span>
        </div>
        {canDispatch && (
          <Button onClick={() => setDispatchDialogOpen(true)}><Send /> Enviar pedido</Button>
        )}
      </div>

      <div style={{ ...cardStyle, marginTop: 20 }}>
        <div><strong>Fornecedor:</strong> {order.supplier.name}</div>
        <div style={{ marginTop: 8 }}><strong>Unidade:</strong> {order.unit.name}</div>
      </div>

      <DispatchHistory dispatches={order.dispatches} />

      <Dialog open={dialogOpen} onOpenChange={setDispatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Despachar pedido</DialogTitle>
            <DialogDescription>Selecione um canal permitido para registrar o envio.</DialogDescription>
          </DialogHeader>
          <label htmlFor="dispatch-channel" style={{ display: 'grid', gap: 7, fontSize: 13, fontWeight: 600 }}>
            Canal
            <select
              id="dispatch-channel"
              value={channel}
              onChange={event => {
                idempotencyKey.current = '';
                setChannel(event.target.value as OrderDispatchChannel);
              }}
              style={{ height: 38, border: '1px solid #CBD5E1', borderRadius: 8, padding: '0 10px', background: '#fff' }}
            >
              {order.allowed_dispatch_channels.map(item => (
                <option key={item} value={item}>{channelLabels[item]}</option>
              ))}
            </select>
          </label>
          {submitError && <p role="alert" style={{ margin: 0, color: '#B91C1C', fontSize: 13 }}>{submitError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchDialogOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={() => void confirmDispatch()} disabled={!channel || submitting}>
              {submitting ? 'Enviando...' : 'Confirmar envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
