import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  CheckCircle2, Edit, Eye, Plus, Save, Settings, ShoppingCart, Trash2, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import { loyaltyService } from '../../../services/loyaltyService';
import { salesService } from '../../../services/salesService';
import { LOYALTY_PERMISSIONS } from '../../../types/loyalty';
import {
  SALES_ORDER_STATUS_CONFIG, SALES_PAYMENT_STATUS_CONFIG, SALES_PERMISSIONS,
  type CatalogSalesOption, type SalesFilters, type SalesMetrics, type SalesOption,
  type SalesOrder, type SalesOrderItem, type SalesOrderPayload,
} from '../../../types/sales';

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14, padding: 18 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 9, background: '#fff', color: '#0F172A', fontSize: 13, boxSizing: 'border-box' };
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function Header({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap', marginBottom: 20 }}><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}><ShoppingCart size={20} /></div><div><h1 style={{ margin: 0, fontSize: 22, color: '#0F172A' }}>{title}</h1><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>{subtitle}</p></div></div>{actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}</div>;
}

function Button({ children, onClick, secondary, disabled }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, border: secondary ? '1px solid #E2E8F0' : 0, background: disabled ? '#CBD5E1' : secondary ? '#fff' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: secondary ? '#475569' : '#fff', fontWeight: 700, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>;
}

export function SalesList() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [options, setOptions] = useState<{ customers: SalesOption[]; units: SalesOption[]; contracts: SalesOption[] }>({ customers: [], units: [], contracts: [] });
  const [filters, setFilters] = useState<SalesFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [rows, totals, customers, units, contracts] = await Promise.all([
        salesService.list(filters), salesService.metrics(filters),
        salesService.customers().catch(() => []), salesService.units().catch(() => []), salesService.contracts().catch(() => []),
      ]);
      setOrders(rows); setMetrics(totals); setOptions({ customers, units, contracts });
    } catch { setError('Não foi possível carregar as vendas.'); } finally { setLoading(false); }
  };
  useEffect(() => { const timer = setTimeout(() => void load(), 200); return () => clearTimeout(timer); }, [JSON.stringify(filters)]);

  const act = async (action: 'confirm' | 'complete' | 'cancel' | 'remove', id: string) => {
    if ((action === 'cancel' || action === 'remove') && !window.confirm('Confirma esta ação?')) return;
    try {
      if (action === 'remove') await salesService.remove(id); else await salesService[action](id);
      toast.success('Venda atualizada.'); await load();
    } catch { toast.error('Não foi possível executar a ação.'); }
  };

  const columns: ColumnDef[] = [
    { key: 'number', label: 'Número', width: '130px', sortable: true, render: value => <strong style={{ fontFamily: 'monospace', color: '#6366F1' }}>{String(value)}</strong> },
    { key: 'customerName', label: 'Cliente', width: '20%' },
    { key: 'unitName', label: 'Unidade', width: '150px' },
    { key: 'status', label: 'Status', type: 'badge', width: '110px', badgeConfig: SALES_ORDER_STATUS_CONFIG },
    { key: 'paymentStatus', label: 'Pagamento', type: 'badge', width: '110px', badgeConfig: SALES_PAYMENT_STATUS_CONFIG },
    { key: 'saleDate', label: 'Data', type: 'date', width: '100px' },
    { key: 'discountTotal', label: 'Desconto', type: 'currency', width: '110px' },
    { key: 'total', label: 'Total', width: '120px', render: value => <strong style={{ color: '#059669' }}>{money(Number(value))}</strong> },
  ];
  if (error && !orders.length) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;
  const kpis = metrics ? [
    ['Total', metrics.totalOrders], ['Rascunhos', metrics.draft], ['Confirmadas', metrics.confirmed], ['Concluídas', metrics.completed], ['Canceladas', metrics.cancelled],
    ['Vendas brutas', money(metrics.grossSales)], ['Descontos', money(metrics.discounts)], ['Vendas líquidas', money(metrics.netSales)], ['Em aberto', money(metrics.unpaid)], ['Recebidas', money(metrics.paid)],
  ] : [];
  return <div style={pageStyle}>
    <Header title="Vendas" subtitle="Pedidos, vendas e ordens comerciais integradas ao catálogo e financeiro." actions={<>{hasPermission(SALES_PERMISSIONS.configure) && <Button secondary onClick={() => navigate('/sales/settings')}><Settings size={14} /> Configurações</Button>}{hasPermission(SALES_PERMISSIONS.create) && <Button onClick={() => navigate('/sales/new')}><Plus size={14} /> Nova venda</Button>}</>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10, marginBottom: 14 }}>{kpis.map(([label, value]) => <div key={String(label)} style={cardStyle}><small style={{ color: '#64748B' }}>{label}</small><strong style={{ display: 'block', marginTop: 5, color: '#0F172A', fontSize: 19 }}>{value}</strong></div>)}</div>
    <div style={{ ...cardStyle, padding: 12, display: 'grid', gridTemplateColumns: '2fr repeat(6,1fr)', gap: 8, marginBottom: 14 }}>
      <input style={inputStyle} placeholder="Buscar número ou cliente..." value={filters.search ?? ''} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
      <select style={inputStyle} value={filters.status ?? ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><option value="">Status</option>{Object.entries(SALES_ORDER_STATUS_CONFIG).map(([v, c]) => <option value={v} key={v}>{c.label}</option>)}</select>
      <select style={inputStyle} value={filters.payment_status ?? ''} onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value }))}><option value="">Pagamento</option>{Object.entries(SALES_PAYMENT_STATUS_CONFIG).map(([v, c]) => <option value={v} key={v}>{c.label}</option>)}</select>
      <select style={inputStyle} value={filters.customer_id ?? ''} onChange={e => setFilters(f => ({ ...f, customer_id: e.target.value }))}><option value="">Cliente</option>{options.customers.map(o => <option value={o.id} key={o.id}>{o.label}</option>)}</select>
      <select style={inputStyle} value={filters.unit_id ?? ''} onChange={e => setFilters(f => ({ ...f, unit_id: e.target.value }))}><option value="">Unidade</option>{options.units.map(o => <option value={o.id} key={o.id}>{o.label}</option>)}</select>
      <input type="date" style={inputStyle} value={filters.start_date ?? ''} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} />
      <input type="date" style={inputStyle} value={filters.end_date ?? ''} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} />
    </div>
    <DynamicTableRenderer columns={columns} data={orders as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Nenhuma venda encontrada." actions={[
      { label: 'Visualizar', icon: <Eye size={13} />, onClick: row => navigate(`/sales/${row.id}`) },
      { label: 'Editar', icon: <Edit size={13} />, showCondition: row => row.status === 'draft' && hasPermission(SALES_PERMISSIONS.update), onClick: row => navigate(`/sales/${row.id}/edit`) },
      { label: 'Confirmar', icon: <CheckCircle2 size={13} />, showCondition: row => row.status === 'draft' && hasPermission(SALES_PERMISSIONS.confirm), onClick: row => void act('confirm', String(row.id)) },
      { label: 'Concluir', icon: <CheckCircle2 size={13} />, showCondition: row => row.status === 'confirmed' && hasPermission(SALES_PERMISSIONS.complete), onClick: row => void act('complete', String(row.id)) },
      { label: 'Cancelar', icon: <XCircle size={13} />, variant: 'danger', showCondition: row => !['completed', 'cancelled'].includes(String(row.status)) && hasPermission(SALES_PERMISSIONS.cancel), onClick: row => void act('cancel', String(row.id)) },
      { label: 'Excluir', icon: <Trash2 size={13} />, variant: 'danger', showCondition: row => row.status === 'draft' && hasPermission(SALES_PERMISSIONS.delete), onClick: row => void act('remove', String(row.id)) },
    ]} />
  </div>;
}

const blankItem = (): SalesOrderItem => ({ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 });

export function SalesForm() {
  const { id } = useParams(); const navigate = useNavigate(); const { hasPermission } = usePermission();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [opts, setOpts] = useState<{ customers: SalesOption[]; units: SalesOption[]; contracts: SalesOption[]; catalog: CatalogSalesOption[]; accounts: SalesOption[] }>({ customers: [], units: [], contracts: [], catalog: [], accounts: [] });
  const [form, setForm] = useState({ customerId: '', unitId: '', contractId: '', saleDate: new Date().toISOString().slice(0, 10), notes: '', generate: false, accountId: '', categoryId: '', costCenterId: '', dueDate: '' });
  const [items, setItems] = useState<SalesOrderItem[]>([blankItem()]);
  const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false);
  useEffect(() => { void (async () => {
    try {
      const [customers, units, contracts, catalog, accounts, existing] = await Promise.all([
        salesService.customers().catch(() => []), salesService.units().catch(() => []),
        salesService.contracts().catch(() => []), salesService.catalog().catch(() => []),
        hasPermission(SALES_PERMISSIONS.generateFinancial) ? salesService.accounts().catch(() => []) : Promise.resolve([]),
        id ? salesService.get(id) : Promise.resolve(null),
      ]);
      setOpts({ customers, units, contracts, catalog, accounts });
      if (existing) { setOrder(existing); setForm(f => ({ ...f, customerId: existing.customerId ?? '', unitId: existing.unitId ?? '', contractId: existing.contractId ?? '', saleDate: existing.saleDate, notes: existing.notes ?? '' })); setItems(existing.items); }
    } catch { toast.error('Não foi possível carregar o formulário.'); } finally { setLoading(false); }
  })(); }, [id]);
  const computed = useMemo(() => items.map(item => ({ ...item, total: item.quantity * item.unitPrice - item.discount })), [items]);
  const subtotal = computed.reduce((s, i) => s + i.quantity * i.unitPrice, 0); const discount = computed.reduce((s, i) => s + i.discount, 0); const total = subtotal - discount;
  const patchItem = (itemId: string, patch: Partial<SalesOrderItem>) => setItems(rows => rows.map(row => row.id === itemId ? { ...row, ...patch } : row));
  const chooseCatalog = (itemId: string, catalogId: string) => { const option = opts.catalog.find(item => item.id === catalogId); patchItem(itemId, { catalogItemId: catalogId || null, catalogItemName: option?.label, description: option?.label ?? '', unitPrice: option?.price ?? 0 }); };
  const payload = (): SalesOrderPayload => ({
    customer_id: form.customerId ? Number(form.customerId) : null, unit_id: form.unitId ? Number(form.unitId) : null, contract_id: form.contractId ? Number(form.contractId) : null,
    sale_date: form.saleDate, notes: form.notes || null, items: computed.map(item => ({ catalog_item_id: item.catalogItemId ? Number(item.catalogItemId) : null, description: item.description, quantity: item.quantity, unit_price: item.unitPrice, discount: item.discount })),
    ...(form.generate ? { generate_financial_transaction: true, financial_account_id: Number(form.accountId), account_category_id: Number(form.categoryId), cost_center_id: form.costCenterId ? Number(form.costCenterId) : null, due_date: form.dueDate } : {}),
  });
  const save = async (confirmAfter = false) => {
    if (!form.saleDate || !computed.length || computed.some(item => !item.description || item.quantity <= 0 || item.discount > item.quantity * item.unitPrice)) { toast.error('Revise a data, itens e descontos.'); return; }
    if (form.generate && (!form.accountId || !form.categoryId || !form.dueDate)) { toast.error('Informe conta, identificador da categoria e vencimento.'); return; }
    setSaving(true); try { const saved = id ? await salesService.update(id, payload()) : await salesService.create(payload()); if (confirmAfter && saved.status === 'draft') await salesService.confirm(saved.id); toast.success(confirmAfter ? 'Venda confirmada.' : 'Rascunho salvo.'); navigate(`/sales/${saved.id}`); } catch { toast.error('Não foi possível salvar a venda.'); } finally { setSaving(false); }
  };
  if (loading) return <ModuleStateView state="loading" />;
  return <div style={pageStyle}><Header title={id ? `Editar ${order?.number ?? 'venda'}` : 'Nova venda'} subtitle="Monte os itens e deixe o backend recalcular todos os totais." actions={<><Button secondary onClick={() => navigate(-1)}>Cancelar</Button><Button secondary disabled={saving} onClick={() => void save(false)}><Save size={14} /> Salvar rascunho</Button><Button disabled={saving} onClick={() => void save(true)}><CheckCircle2 size={14} /> Confirmar venda</Button></>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(300px,.7fr)', gap: 16 }}>
      <div><div style={{ ...cardStyle, marginBottom: 14 }}><h3 style={{ marginTop: 0 }}>Dados gerais</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        <label>Data da venda<input type="date" style={inputStyle} value={form.saleDate} onChange={e => setForm(f => ({ ...f, saleDate: e.target.value }))} /></label>
        <label>Cliente<select style={inputStyle} value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}><option value="">Sem cliente</option>{opts.customers.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
        <label>Unidade<select style={inputStyle} value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}><option value="">Sem unidade</option>{opts.units.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
        <label>Contrato<select style={inputStyle} value={form.contractId} onChange={e => setForm(f => ({ ...f, contractId: e.target.value }))}><option value="">Sem contrato</option>{opts.contracts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
      </div><label style={{ display: 'block', marginTop: 12 }}>Observações<textarea style={{ ...inputStyle, minHeight: 70 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></label></div>
      <div style={cardStyle}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ marginTop: 0 }}>Itens</h3><Button onClick={() => setItems(rows => [...rows, blankItem()])}><Plus size={13} /> Item</Button></div>
        {computed.map(item => <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.4fr .55fr .8fr .8fr auto', gap: 7, marginBottom: 8, alignItems: 'end' }}>
          <select style={inputStyle} value={item.catalogItemId ?? ''} onChange={e => chooseCatalog(item.id, e.target.value)}><option value="">Manual</option>{opts.catalog.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
          <input style={inputStyle} value={item.description} placeholder="Descrição" onChange={e => patchItem(item.id, { description: e.target.value })} />
          <input style={inputStyle} type="number" min=".001" step=".001" value={item.quantity} onChange={e => patchItem(item.id, { quantity: Number(e.target.value) })} />
          <input style={inputStyle} type="number" min="0" step=".01" value={item.unitPrice} onChange={e => patchItem(item.id, { unitPrice: Number(e.target.value) })} />
          <input style={inputStyle} type="number" min="0" step=".01" value={item.discount} onChange={e => patchItem(item.id, { discount: Number(e.target.value) })} />
          <button onClick={() => setItems(rows => rows.filter(row => row.id !== item.id))} style={{ border: 0, background: '#FEF2F2', color: '#DC2626', borderRadius: 8, padding: 9 }}><Trash2 size={14} /></button>
        </div>)}
      </div></div>
      <aside><div style={{ ...cardStyle, marginBottom: 14 }}><h3 style={{ marginTop: 0 }}>Resumo</h3><p>Subtotal <strong style={{ float: 'right' }}>{money(subtotal)}</strong></p><p>Descontos <strong style={{ float: 'right', color: '#DC2626' }}>-{money(discount)}</strong></p><hr /><p style={{ fontSize: 19 }}>Total <strong style={{ float: 'right', color: '#059669' }}>{money(total)}</strong></p></div>
      {hasPermission(SALES_PERMISSIONS.generateFinancial) && <div style={cardStyle}><label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={form.generate} onChange={e => setForm(f => ({ ...f, generate: e.target.checked }))} /> Gerar receita financeira</label>{form.generate && <div style={{ display: 'grid', gap: 9, marginTop: 12 }}><select style={inputStyle} value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}><option value="">Conta financeira</option>{opts.accounts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select><input type="number" min="1" style={inputStyle} placeholder="ID da categoria financeira" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} /><input type="number" min="1" style={inputStyle} placeholder="ID do centro de custo (opcional)" value={form.costCenterId} onChange={e => setForm(f => ({ ...f, costCenterId: e.target.value }))} /><input type="date" style={inputStyle} value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /><small style={{ color: '#64748B' }}>A receita será criada como pendente; o recebimento continua no Financeiro.</small></div>}</div>}</aside>
    </div>
  </div>;
}

export function SalesDetail() {
  const { id = '' } = useParams(); const navigate = useNavigate(); const { hasPermission } = usePermission();
  const [order, setOrder] = useState<SalesOrder | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [redeemAmount, setRedeemAmount] = useState(0); const [redeeming, setRedeeming] = useState(false);
  const load = async () => { setLoading(true); try { setOrder(await salesService.get(id)); } catch { setError('Venda não encontrada.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [id]);
  const act = async (action: 'confirm' | 'complete' | 'cancel' | 'remove') => { if (!order) return; if ((action === 'cancel' || action === 'remove') && !window.confirm('Confirma esta ação?')) return; try { if (action === 'remove') { await salesService.remove(order.id); navigate('/sales'); return; } setOrder(await salesService[action](order.id)); toast.success('Venda atualizada.'); } catch { toast.error('Não foi possível executar a ação.'); } };
  const redeemCashback = async () => { if (!order || redeemAmount <= 0) return; setRedeeming(true); try { await loyaltyService.redeemSalesOrderCashback(order.id, { amount: redeemAmount }); setOrder(await salesService.get(order.id)); setRedeemAmount(0); toast.success('Cashback resgatado na venda.'); } catch { toast.error('Não foi possível resgatar cashback.'); } finally { setRedeeming(false); } };
  if (loading) return <ModuleStateView state="loading" />; if (error || !order) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;
  const status = SALES_ORDER_STATUS_CONFIG[order.status], payment = SALES_PAYMENT_STATUS_CONFIG[order.paymentStatus];
  const canRedeemCashback = Boolean(order.customerId) && !['completed', 'cancelled'].includes(order.status) && hasPermission(LOYALTY_PERMISSIONS.redeem);
  return <div style={pageStyle}><Header title={order.number} subtitle={`${status.label} · ${payment.label}`} actions={<>{order.status === 'draft' && hasPermission(SALES_PERMISSIONS.update) && <Button secondary onClick={() => navigate(`/sales/${order.id}/edit`)}><Edit size={14} /> Editar</Button>}{order.status === 'draft' && hasPermission(SALES_PERMISSIONS.confirm) && <Button onClick={() => void act('confirm')}>Confirmar</Button>}{order.status === 'confirmed' && hasPermission(SALES_PERMISSIONS.complete) && <Button onClick={() => void act('complete')}>Concluir</Button>}{!['completed', 'cancelled'].includes(order.status) && hasPermission(SALES_PERMISSIONS.cancel) && <Button secondary onClick={() => void act('cancel')}>Cancelar</Button>}{order.status === 'draft' && hasPermission(SALES_PERMISSIONS.delete) && <Button secondary onClick={() => void act('remove')}>Excluir</Button>}</>} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}><div><div style={{ ...cardStyle, marginBottom: 14 }}><h3 style={{ marginTop: 0 }}>Dados gerais</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>{[['Cliente', order.customerName || '—'], ['Unidade', order.unitName || '—'], ['Contrato', order.contractNumber || '—'], ['Data da venda', new Date(`${order.saleDate}T12:00:00`).toLocaleDateString('pt-BR')]].map(([l, v]) => <div key={l}><small style={{ color: '#64748B' }}>{l}</small><strong style={{ display: 'block', marginTop: 3 }}>{v}</strong></div>)}</div>{order.notes && <p style={{ background: '#F8FAFC', padding: 12 }}>{order.notes}</p>}</div>
    <div style={cardStyle}><h3 style={{ marginTop: 0 }}>Itens do pedido</h3><DynamicTableRenderer columns={[{ key: 'description', label: 'Descrição' }, { key: 'quantity', label: 'Qtd.', type: 'number', width: '80px' }, { key: 'unitPrice', label: 'Preço', type: 'currency', width: '120px' }, { key: 'discount', label: 'Desconto', type: 'currency', width: '120px' }, { key: 'total', label: 'Total', type: 'currency', width: '120px' }]} data={order.items as unknown as Record<string, unknown>[]} /></div></div>
    <aside><div style={{ ...cardStyle, marginBottom: 14 }}><h3 style={{ marginTop: 0 }}>Totais</h3><p>Subtotal <strong style={{ float: 'right' }}>{money(order.subtotal)}</strong></p><p>Descontos <strong style={{ float: 'right', color: '#DC2626' }}>-{money(order.discountTotal)}</strong></p><p>Cashback resgatado <strong style={{ float: 'right', color: '#7C3AED' }}>-{money(order.cashbackRedeemedAmount)}</strong></p><p>Cashback gerado <strong style={{ float: 'right', color: '#059669' }}>{money(order.cashbackEarnedAmount)}</strong></p><hr /><p style={{ fontSize: 19 }}>Total <strong style={{ float: 'right', color: '#059669' }}>{money(order.total)}</strong></p></div>{canRedeemCashback && <div style={{ ...cardStyle, marginBottom: 14 }} data-testid="sales-cashback-redeem"><h3 style={{ marginTop: 0 }}>Resgatar cashback</h3><label>Valor<input data-testid="sales-cashback-amount" type="number" min="0" step=".01" style={inputStyle} value={redeemAmount} onChange={e => setRedeemAmount(Number(e.target.value))} /></label><Button disabled={redeeming || redeemAmount <= 0} onClick={() => void redeemCashback()}>Aplicar cashback</Button><small style={{ display: 'block', marginTop: 8, color: '#64748B' }}>O backend valida saldo, limites e elegibilidade.</small></div>}{order.financialTransactionId && <div style={cardStyle}><h3 style={{ marginTop: 0 }}>Receita vinculada</h3><p>Lançamento <Link to="/financial/transactions">#{order.financialTransactionId}</Link></p><small style={{ color: '#64748B' }}>Pagamento e conta são controlados no Financeiro.</small></div>}</aside></div>
  </div>;
}

export function SalesSettings() {
  const [entity, setEntity] = useState<'sales_orders' | 'sales_order_items'>('sales_orders'); const [schema, setSchema] = useState<Record<string, any> | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { setSchema((await salesService.metadata(entity)).data); } catch { toast.error('Não foi possível carregar as configurações.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [entity]);
  const save = async () => { if (!schema) return; setSaving(true); try { setSchema((await salesService.updateMetadata(entity, schema)).data); toast.success('Configurações salvas.'); } catch { toast.error('Não foi possível salvar.'); } finally { setSaving(false); } };
  if (loading) return <ModuleStateView state="loading" />;
  return <div style={pageStyle}><Header title="Configurações de Vendas" subtitle="Labels, campos obrigatórios, ordem e colunas via Metadata Engine." actions={<Button disabled={saving} onClick={() => void save()}><Save size={14} /> Salvar</Button>} /><div style={{ display: 'flex', gap: 8, marginBottom: 14 }}><Button secondary={entity !== 'sales_orders'} onClick={() => setEntity('sales_orders')}>Pedidos</Button><Button secondary={entity !== 'sales_order_items'} onClick={() => setEntity('sales_order_items')}>Itens do pedido</Button></div>{schema && <div style={{ display: 'grid', gap: 14 }}><div style={cardStyle}><h3 style={{ marginTop: 0 }}>Labels</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><label>Singular<input style={inputStyle} value={schema.singular_label ?? ''} onChange={e => setSchema({ ...schema, singular_label: e.target.value })} /></label><label>Plural<input style={inputStyle} value={schema.plural_label ?? ''} onChange={e => setSchema({ ...schema, plural_label: e.target.value })} /></label></div></div><div style={cardStyle}><h3 style={{ marginTop: 0 }}>Campos</h3>{(schema.form_schema ?? []).map((field: Record<string, any>, index: number) => <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 90px', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}><input style={inputStyle} value={field.label} onChange={e => { const fields = [...schema.form_schema]; fields[index] = { ...field, label: e.target.value }; setSchema({ ...schema, form_schema: fields }); }} /><label><input type="checkbox" checked={field.visible} onChange={e => { const fields = [...schema.form_schema]; fields[index] = { ...field, visible: e.target.checked }; setSchema({ ...schema, form_schema: fields }); }} /> Visível</label><label><input type="checkbox" checked={field.required} onChange={e => { const fields = [...schema.form_schema]; fields[index] = { ...field, required: e.target.checked }; setSchema({ ...schema, form_schema: fields }); }} /> Obrigatório</label><input type="number" style={inputStyle} value={field.order} onChange={e => { const fields = [...schema.form_schema]; fields[index] = { ...field, order: Number(e.target.value) }; setSchema({ ...schema, form_schema: fields }); }} /></div>)}</div><div style={cardStyle}><h3 style={{ marginTop: 0 }}>Colunas da tabela</h3>{(schema.table_schema ?? []).map((column: Record<string, any>, index: number) => <label key={column.key} style={{ display: 'flex', gap: 10, padding: 8 }}><input type="checkbox" checked={column.visible} onChange={e => { const columns = [...schema.table_schema]; columns[index] = { ...column, visible: e.target.checked }; setSchema({ ...schema, table_schema: columns }); }} /> {column.label}</label>)}</div></div>}</div>;
}
