import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import {
  AlertCircle, CheckCircle2, Clock3, Download, Lock, Receipt, TrendingDown,
  TrendingUp, WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { franchisePortalService } from '../../../services/franchisePortalService';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { useFranchisePortal } from '../../../shared/context/FranchisePortalContext';
import type { FranchiseDashboardData } from '../../../types/franchisePortal';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 13 };
const money = (value: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0));

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const { data } = useFranchisePortal();
  return <div style={{ padding: 24, maxWidth: 1240, margin: '0 auto' }}>
    <div style={{ marginBottom: 18 }}><div style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Unidade · {data?.unit.name}</div><h1 style={{ margin: '4px 0 2px', color: '#0F172A', fontSize: 22 }}>{title}</h1><p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>{description}</p></div>
    {children}
  </div>;
}

function useLoad<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { setData(await loader()); } catch { setError('Não foi possível carregar os dados da unidade.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, dependencies);
  return { data, loading, error, load };
}

function State<T>({ result, children }: { result: ReturnType<typeof useLoad<T>>; children: (data: T) => React.ReactNode }) {
  if (result.loading) return <ModuleStateView state="loading" />;
  if (result.error || !result.data) return <ModuleStateView state="error" errorMessage={result.error} onRetry={() => void result.load()} />;
  return <>{children(result.data)}</>;
}

export function FranchiseDashboard() {
  const result = useLoad(async () => {
    const [dashboard, analytics] = await Promise.all([
      franchisePortalService.dashboard(), franchisePortalService.analyticsDashboard().catch(() => ({ template: null, widgets: [] })),
    ]);
    return { dashboard, analytics };
  });
  return <State result={result}>{data => {
    const d = data.dashboard as FranchiseDashboardData;
    const cards = [
      ['Vendas do mês', money(d.sales.net_total), TrendingUp, '#2563EB'],
      ['Recebido', money(d.financial.income), WalletCards, '#059669'],
      ['Pendente', money(d.financial.pending), Clock3, '#D97706'],
      ['CMV', money(d.cmv.consumption_cost), TrendingDown, '#DC2626'],
      ['Resultado', money(d.dre.net_profit), Receipt, d.dre.net_profit >= 0 ? '#059669' : '#DC2626'],
      ['Royalties pendentes', money(d.royalties.total_pending), AlertCircle, '#7C3AED'],
      ['Checklists pendentes', String(d.checklists.pending + d.checklists.overdue), CheckCircle2, '#D97706'],
      ['Treinamentos pendentes', String(Math.max(0, d.trainings.total - d.trainings.completed)), CheckCircle2, '#2563EB'],
    ] as const;
    return <Shell title="Dashboard da Franquia" description="Indicadores essenciais da operação da sua unidade.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 13 }}>
        {cards.map(([label, value, Icon, color]) => <div key={label} style={{ ...card, padding: 17 }}><Icon size={18} color={color} /><strong style={{ display: 'block', marginTop: 11, fontSize: 19, color: '#0F172A' }}>{value}</strong><span style={{ color: '#64748B', fontSize: 12 }}>{label}</span></div>)}
      </div>
      <div style={{ ...card, marginTop: 16, padding: 18, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <Progress label="Conformidade de checklists" value={d.checklists.compliance_rate} />
        <Progress label="Treinamentos concluídos" value={d.trainings.completion_rate} />
        <Progress label="Margem da unidade" value={d.dre.margin} />
      </div>
      {data.analytics.template && <section style={{ marginTop: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Lock size={14} color="#7C3AED" /><strong style={{ fontSize: 14 }}>{data.analytics.template.name}</strong><span style={{ fontSize: 11, color: '#7C3AED' }}>Dashboard corporativo</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 13 }}>{data.analytics.widgets.map(widget => <div key={widget.id} style={{ ...card, padding: 16 }}><span style={{ color: '#64748B', fontSize: 11 }}>{widget.title}</span><strong style={{ display: 'block', marginTop: 8, fontSize: 19 }}>{widget.data.error ? 'Indisponível' : widget.data.format === 'currency' ? money(widget.data.value) : widget.data.format === 'percentage' ? `${Number(widget.data.value).toFixed(1)}%` : String(widget.data.value)}</strong></div>)}</div></section>}
    </Shell>;
  }}</State>;
}

function Progress({ label, value }: { label: string; value: number }) {
  return <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 7 }}><span>{label}</span><strong>{Number(value).toFixed(1)}%</strong></div><div style={{ height: 7, borderRadius: 99, background: '#E2E8F0' }}><div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', borderRadius: 99, background: '#3B82F6' }} /></div></div>;
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return <div style={{ ...card, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ background: '#F8FAFC' }}>{headers.map(header => <th key={header} style={{ padding: '11px 13px', textAlign: 'left', color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' }}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} style={{ borderTop: '1px solid #F1F5F9' }}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: '12px 13px', color: '#475569', fontSize: 12 }}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <div style={{ padding: 35, textAlign: 'center', color: '#94A3B8' }}>Nenhum registro encontrado.</div>}</div>;
}

export function FranchiseSales() {
  const result = useLoad(franchisePortalService.sales);
  return <State result={result}>{response => <Shell title="Vendas" description="Pedidos e vendas registrados para sua unidade."><Table headers={['Número', 'Data', 'Cliente', 'Status', 'Pagamento', 'Total']} rows={response.data.map(row => [String(row.number ?? '—'), String(row.sale_date ?? '—'), String(row.customer_name ?? '—'), String(row.status ?? '—'), String(row.payment_status ?? '—'), <strong>{money(row.total)}</strong>])} /></Shell>}</State>;
}

export function FranchiseFinancial() {
  const transactions = useLoad(franchisePortalService.transactions);
  const metrics = useLoad(franchisePortalService.financialMetrics);
  if (transactions.loading || metrics.loading) return <ModuleStateView state="loading" />;
  if (!transactions.data || !metrics.data) return <ModuleStateView state="error" errorMessage={transactions.error || metrics.error} />;
  return <Shell title="Financeiro" description="Receitas e despesas vinculadas à unidade.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>{[['Recebido', metrics.data.income], ['Despesas', metrics.data.expenses], ['Resultado', metrics.data.result], ['Pendente', metrics.data.pending]].map(([label, value]) => <div key={String(label)} style={{ ...card, padding: 15 }}><strong style={{ fontSize: 17 }}>{money(value)}</strong><span style={{ display: 'block', color: '#64748B', fontSize: 11 }}>{label}</span></div>)}</div>
    <Table headers={['Descrição', 'Tipo', 'Categoria', 'Vencimento', 'Status', 'Valor']} rows={transactions.data.data.map(row => [String(row.description), String(row.type), String(row.category ?? '—'), String(row.due_date ?? '—'), String(row.status), money(row.amount)])} />
  </Shell>;
}

export function FranchiseDre() {
  const result = useLoad(franchisePortalService.dre);
  return <State result={result}>{data => {
    const rows = (data.rows ?? []) as Record<string, unknown>[];
    return <Shell title="DRE Gerencial" description="Demonstrativo exclusivo da sua unidade."><Table headers={['Descrição', 'Valor']} rows={rows.map(row => [<strong>{String(row.label)}</strong>, money(row.amount)])} /></Shell>;
  }}</State>;
}

export function FranchiseRoyalties() {
  const rows = useLoad(franchisePortalService.royalties);
  const metrics = useLoad(franchisePortalService.royaltyMetrics);
  if (rows.loading || metrics.loading) return <ModuleStateView state="loading" />;
  if (!rows.data || !metrics.data) return <ModuleStateView state="error" errorMessage={rows.error || metrics.error} />;
  return <Shell title="Royalties" description="Competências e status de cobrança da sua unidade.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>{[['Gerado', metrics.data.total_generated], ['Pago', metrics.data.total_paid], ['Pendente', metrics.data.total_pending]].map(([label, value]) => <div key={String(label)} style={{ ...card, padding: 15 }}><strong>{money(value)}</strong><span style={{ display: 'block', color: '#64748B', fontSize: 11 }}>{label}</span></div>)}</div>
    <Table headers={['Competência', 'Regra', 'Base', 'Valor', 'Status']} rows={rows.data.data.map(row => [`${String(row.reference_month).padStart(2, '0')}/${row.reference_year}`, String((row.rule as Record<string, unknown>)?.name ?? '—'), money(row.base_amount), money(row.calculated_amount), String(row.status)])} />
  </Shell>;
}

export function FranchiseCmv() {
  const metrics = useLoad(franchisePortalService.cmvMetrics);
  const items = useLoad(franchisePortalService.cmvItems);
  if (metrics.loading || items.loading) return <ModuleStateView state="loading" />;
  if (!metrics.data || !items.data) return <ModuleStateView state="error" errorMessage={metrics.error || items.error} />;
  return <Shell title="CMV" description="Custos de consumo e perdas da unidade."><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>{[['Consumo', metrics.data.consumption_cost], ['Perdas', metrics.data.loss_cost], ['Ajustes', metrics.data.adjustment_cost]].map(([label, value]) => <div key={String(label)} style={{ ...card, padding: 15 }}><strong>{money(value)}</strong><span style={{ display: 'block', color: '#64748B', fontSize: 11 }}>{label}</span></div>)}</div><Table headers={['Item', 'Quantidade', 'Custo médio', 'Custo total']} rows={items.data.map(row => [String(row.item_name), `${row.quantity} ${row.unit_of_measure}`, money(row.average_cost), money(row.cost)])} /></Shell>;
}

export function FranchiseChecklists() {
  const result = useLoad(franchisePortalService.checklistOccurrences);
  return <State result={result}>{response => <Shell title="Checklists" description="Ocorrências e execução operacional da unidade."><Table headers={['Checklist', 'Data', 'Prazo', 'Status']} rows={response.data.map(row => [String((row.template as Record<string, unknown>)?.name ?? '—'), String(row.scheduled_date), String(row.due_at ?? '—'), String(row.status)])} /></Shell>}</State>;
}

export function FranchiseTrainings() {
  const result = useLoad(franchisePortalService.trainings);
  return <State result={result}>{response => <Shell title="Treinamentos" description="Conteúdos atribuídos a você ou à sua unidade."><Table headers={['Treinamento', 'Categoria', 'Duração', 'Obrigatório', 'Status']} rows={response.data.map(row => [String(row.title), String(row.category ?? '—'), `${row.duration_minutes ?? 0} min`, row.mandatory ? 'Sim' : 'Não', String(row.status)])} /></Shell>}</State>;
}

export function FranchiseDocuments() {
  const result = useLoad(franchisePortalService.documents);
  return <State result={result}>{response => <Shell title="Documentos" description="Arquivos disponibilizados para o portal da unidade."><Table headers={['Documento', 'Categoria', 'Tipo', 'Data', 'Download']} rows={response.data.map(row => [String(row.title), String(row.category_name ?? '—'), String(row.extension ?? '—').toUpperCase(), String(row.created_at ?? '—').slice(0, 10), <button onClick={() => void franchisePortalService.downloadDocument(String(row.id), String(row.file_name ?? row.title)).catch(error => toast.error(error.message))} style={{ border: 0, background: '#EFF6FF', color: '#2563EB', borderRadius: 7, padding: '6px 9px', cursor: 'pointer' }}><Download size={13} /></button>])} /></Shell>}</State>;
}

export function FranchiseContracts() {
  const result = useLoad(franchisePortalService.contracts);
  return <State result={result}>{response => <Shell title="Contratos" description="Contratos vinculados à sua unidade."><Table headers={['Contrato', 'Número', 'Cliente', 'Início', 'Fim', 'Status']} rows={response.data.map(row => [String(row.title), String(row.contract_number ?? '—'), String(row.customer_name ?? '—'), String(row.start_date ?? '—'), String(row.end_date ?? '—'), String(row.status)])} /></Shell>}</State>;
}

export function FranchiseTasks() {
  const result = useLoad(franchisePortalService.tasks);
  return <State result={result}>{response => <Shell title="Tarefas" description="Ações atribuídas a você ou à sua unidade."><Table headers={['Tarefa', 'Prioridade', 'Origem', 'Prazo', 'Status', 'Ação']} rows={response.data.map(row => [
    String(row.title), String(row.priority), String(row.source_type ?? 'manual'), String(row.due_date ?? '—'), String(row.status),
    <select key={`status-${row.id}`} value={String(row.status)} onChange={event => void franchisePortalService.updateTaskStatus(String(row.id), event.target.value as 'open' | 'in_progress' | 'completed').then(() => result.load()).catch(() => toast.error('Não foi possível atualizar a tarefa.'))}><option value="open">Aberta</option><option value="in_progress">Em andamento</option><option value="completed">Concluída</option></select>,
  ])} /></Shell>}</State>;
}

export function FranchiseInventory() {
  const stock = useLoad(franchisePortalService.inventory);
  const transfers = useLoad(franchisePortalService.inventoryTransfers);
  if (stock.loading) return <ModuleStateView state="loading" />;
  if (!stock.data) return <ModuleStateView state="error" errorMessage={stock.error} />;
  const settings = stock.data.settings;
  return <Shell title="Estoque" description="Saldos, transferências e inventário da sua unidade conforme configuração da rede.">
    <Table headers={['Item', 'Saldo', 'Reservado', 'Mínimo']} rows={stock.data.stock.map(row => [String(row.item_name), `${row.current_stock} ${row.unit_of_measure}`, String(row.reserved_stock ?? 0), settings.enable_stock_minimum ? String(row.minimum_stock) : '—'])} />
    {settings.enable_transfers && transfers.data && <div style={{ marginTop: 16 }}><h2 style={{ fontSize: 15 }}>Transferências</h2><Table headers={['#', 'Origem', 'Destino', 'Status', 'Ação']} rows={transfers.data.map(row => [String(row.id), String(row.origin_unit_name), String(row.destination_unit_name), String(row.status), row.status === 'in_transit' ? <button onClick={() => void franchisePortalService.receiveInventoryTransfer(String(row.id)).then(() => transfers.load())}>Receber</button> : '—'])} /></div>}
    {settings.enable_inventory_counts && <p style={{ ...card, marginTop: 16, color: '#64748B', fontSize: 12 }}>Inventário físico habilitado para esta unidade.</p>}
  </Shell>;
}

export function FranchisePortalRoutes() {
  return <Routes>
    <Route index element={<Navigate to="/franchise/dashboard" replace />} />
    <Route path="dashboard" element={<FranchiseDashboard />} />
    <Route path="sales" element={<FranchiseSales />} />
    <Route path="financial" element={<FranchiseFinancial />} />
    <Route path="dre" element={<FranchiseDre />} />
    <Route path="royalties" element={<FranchiseRoyalties />} />
    <Route path="cmv" element={<FranchiseCmv />} />
    <Route path="checklists" element={<FranchiseChecklists />} />
    <Route path="trainings" element={<FranchiseTrainings />} />
    <Route path="documents" element={<FranchiseDocuments />} />
    <Route path="contracts" element={<FranchiseContracts />} />
    <Route path="tasks" element={<FranchiseTasks />} />
    <Route path="inventory" element={<FranchiseInventory />} />
    <Route path="*" element={<Navigate to="/franchise/dashboard" replace />} />
  </Routes>;
}
