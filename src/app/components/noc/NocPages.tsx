import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertTriangle, Building2, CheckCircle2, Gauge, Loader2, ShieldAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { nocService } from '../../../services/nocService';
import type { NocAlert, NocDashboard, NocSeverity, NocTrend, NocUnit } from '../../../types/noc';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 };
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const status = {
  healthy: { label: 'Saudável', color: '#059669', bg: '#D1FAE5' },
  warning: { label: 'Atenção', color: '#D97706', bg: '#FEF3C7' },
  critical: { label: 'Crítico', color: '#DC2626', bg: '#FEE2E2' },
};
const severity: Record<NocSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: 'Crítico', color: '#B91C1C', bg: '#FEE2E2' },
  high: { label: 'Alto', color: '#C2410C', bg: '#FFEDD5' },
  medium: { label: 'Médio', color: '#A16207', bg: '#FEF9C3' },
  low: { label: 'Baixo', color: '#0369A1', bg: '#E0F2FE' },
};

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div style={{ padding: 24, display: 'grid', gap: 18 }}><div><h1 style={{ margin: 0, fontSize: 26 }}>{title}</h1><p style={{ margin: '6px 0 0', color: '#64748B' }}>{description}</p></div>{children}</div>;
}
function Loading() { return <div style={{ ...card, minHeight: 180, display: 'grid', placeItems: 'center' }}><Loader2 className="animate-spin" color="#6366F1" /></div>; }
function Kpi({ label, value, tone, icon: Icon }: { label: string; value: string | number; tone: string; icon: typeof Gauge }) {
  return <div style={card}><div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 13 }}><span>{label}</span><Icon size={18} color={tone} /></div><strong style={{ display: 'block', marginTop: 10, fontSize: 29, color: tone }}>{value}</strong></div>;
}
function AlertList({ rows }: { rows: NocAlert[] }) {
  if (!rows.length) return <div style={{ ...card, color: '#64748B' }}>Nenhum alerta para os filtros selecionados.</div>;
  return <div style={{ ...card, padding: 0, overflow: 'hidden' }}>{rows.map(row => <div key={row.id} style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}><AlertTriangle size={18} color={severity[row.severity].color} /><div style={{ flex: 1 }}><strong style={{ fontSize: 14 }}>{row.title}</strong><div style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}>{row.unit_name} · {String(row.value)}</div></div><span style={{ color: severity[row.severity].color, background: severity[row.severity].bg, borderRadius: 99, padding: '4px 9px', fontSize: 11, fontWeight: 700 }}>{severity[row.severity].label}</span></div>)}</div>;
}

const unitColumns: ColumnDef[] = [
  { key: 'position', label: '#', type: 'number', width: '55px' },
  { key: 'unit_name', label: 'Unidade' },
  { key: 'health_score', label: 'Health Score', type: 'number' },
  { key: 'status', label: 'Status', type: 'badge', badgeConfig: status },
  { key: 'sales', label: 'Vendas', type: 'currency' },
  { key: 'cmv_percentage', label: 'CMV %', type: 'number' },
  { key: 'royalties_overdue', label: 'Royalties vencidos', type: 'currency' },
];

export function NocDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<NocDashboard>();
  const [trends, setTrends] = useState<NocTrend[]>([]);
  useEffect(() => { Promise.all([nocService.dashboard(), nocService.trends()]).then(([d, t]) => { setDashboard(d); setTrends(t.series); }); }, []);
  if (!dashboard) return <Shell title="NOC" description="Central de Operações da Rede"><Loading /></Shell>;
  return <Shell title="NOC" description="Monitoramento executivo e priorização da saúde da rede">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }}>
      <Kpi label="Network Score" value={`${dashboard.network_score}%`} tone="#4F46E5" icon={Gauge} />
      <Kpi label="Unidades saudáveis" value={dashboard.healthy_units} tone="#059669" icon={CheckCircle2} />
      <Kpi label="Em atenção" value={dashboard.warning_units} tone="#D97706" icon={AlertTriangle} />
      <Kpi label="Críticas" value={dashboard.critical_units} tone="#DC2626" icon={ShieldAlert} />
      <Kpi label="Alertas ativos" value={dashboard.total_alerts} tone="#7C3AED" icon={AlertTriangle} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 16 }}>
      <div style={card}><h3 style={{ marginTop: 0 }}>Tendência da rede</h3><ResponsiveContainer width="100%" height={290}><LineChart data={trends}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis /><Tooltip formatter={v => money(Number(v))} /><Legend /><Line dataKey="sales" name="Vendas" stroke="#4F46E5" strokeWidth={2} /><Line dataKey="financial" name="Financeiro" stroke="#059669" strokeWidth={2} /><Line dataKey="cmv" name="CMV" stroke="#DC2626" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
      <div><h3 style={{ marginTop: 0 }}>Alertas prioritários</h3><AlertList rows={dashboard.alerts.slice(0, 5)} /></div>
    </div>
    <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3>Ranking de unidades</h3><button onClick={() => navigate('/noc/units')}>Ver ranking completo</button></div><DynamicTableRenderer columns={unitColumns} data={dashboard.top_units as unknown as Record<string, unknown>[]} onRowClick={row => navigate(`/noc/unit/${row.unit_id}`)} /></div>
  </Shell>;
}

export function NocUnitsPage() {
  const navigate = useNavigate(); const [rows, setRows] = useState<NocUnit[]>();
  useEffect(() => { nocService.units().then(setRows); }, []);
  return <Shell title="Ranking de Unidades" description="Saúde operacional comparada entre as unidades">{rows ? <DynamicTableRenderer columns={unitColumns} data={rows as unknown as Record<string, unknown>[]} searchable onRowClick={row => navigate(`/noc/unit/${row.unit_id}`)} /> : <Loading />}</Shell>;
}

export function NocAlertsPage() {
  const [rows, setRows] = useState<NocAlert[]>(); const [filter, setFilter] = useState('');
  useEffect(() => { nocService.alerts(filter ? { severity: filter } : {}).then(setRows); }, [filter]);
  return <Shell title="Alertas da Rede" description="Fila priorizada de desvios operacionais"><select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 220, padding: 9 }}><option value="">Todas as severidades</option>{Object.entries(severity).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select>{rows ? <AlertList rows={rows} /> : <Loading />}</Shell>;
}

export function NocUnitDetailPage() {
  const { id = '' } = useParams(); const [unit, setUnit] = useState<NocUnit>();
  useEffect(() => { nocService.unit(id).then(setUnit); }, [id]);
  const chartData = useMemo(() => unit?.dimensions.map(d => ({ ...d, label: ({ sales: 'Vendas', financial: 'Financeiro', royalties: 'Royalties', cmv: 'CMV', checklists: 'Checklists', trainings: 'Treinamentos', crm: 'CRM', contracts: 'Contratos' } as Record<string, string>)[d.key] })) ?? [], [unit]);
  if (!unit) return <Shell title="Saúde da Unidade" description="Visão consolidada"><Loading /></Shell>;
  return <Shell title={unit.unit_name} description={`Health Score ${unit.health_score}% · ${status[unit.status].label}`}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}><Kpi label="Vendas" value={money(unit.sales)} tone="#4F46E5" icon={Building2} /><Kpi label="Resultado financeiro" value={money(unit.financial_balance)} tone={unit.financial_balance >= 0 ? '#059669' : '#DC2626'} icon={Gauge} /><Kpi label="CMV" value={`${unit.cmv_percentage}%`} tone="#D97706" icon={AlertTriangle} /><Kpi label="Royalties vencidos" value={money(unit.royalties_overdue)} tone="#DC2626" icon={ShieldAlert} /></div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div style={card}><h3 style={{ marginTop: 0 }}>Score por dimensão</h3><ResponsiveContainer width="100%" height={330}><BarChart data={chartData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} /><YAxis type="category" dataKey="label" width={105} /><Tooltip /><Bar dataKey="score" fill="#6366F1" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div><div><h3 style={{ marginTop: 0 }}>Alertas da unidade</h3><AlertList rows={unit.alerts} /></div></div>
  </Shell>;
}
