import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  AlertTriangle, Building2, Download, Lock, Package, SlidersHorizontal, TrendingUp,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import { cmvService } from '../../../services/cmvService';
import type {
  CMVByItem, CMVByOrigin, CMVByUnit, CMVFilters, CMVMetrics, CMVPeriod,
} from '../../../types/cmv';

const PERIODS: Array<{ value: CMVPeriod; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'custom', label: 'Personalizado' },
];

const ORIGIN_COLORS: Record<string, string> = {
  checklist_execution: '#6366F1',
  manual: '#64748B',
  loss: '#EF4444',
  adjustment: '#F59E0B',
};

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(15,23,42,.04)' };

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function shortMoney(value: number) {
  return value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : money(value);
}

function Header() {
  const { hasPermission } = usePermission();
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: '#0F172A' }}>CMV Operacional</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>Consumo, perdas e ajustes calculados pelas movimentações de estoque.</p>
          </div>
        </div>
        <button disabled title={hasPermission('tenant.cmv.export') ? 'Em breve' : 'Sem permissão para exportar'} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', color: '#94A3B8', background: '#fff', cursor: 'not-allowed' }}>
          <Lock size={13} /><Download size={14} /> Exportar CSV
        </button>
      </div>
      <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          ['/cmv', 'Visão Geral'],
          ['/cmv/by-item', 'Por Item'],
          ['/cmv/by-unit', 'Por Unidade'],
          ['/cmv/by-origin', 'Por Origem'],
        ].map(([to, label]) => <NavLink key={to} to={to} label={label} />)}
      </nav>
    </>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  const active = useLocation().pathname === to;
  return <Link to={to} style={{ padding: '7px 15px', borderRadius: 99, textDecoration: 'none', fontSize: 13, fontWeight: 650, color: active ? '#fff' : '#64748B', background: active ? '#6366F1' : '#fff', border: active ? '1px solid #6366F1' : '1px solid #E2E8F0' }}>{label}</Link>;
}

function useCMVFilters() {
  const [filters, setFilters] = useState<CMVFilters>({ period: '30d' });
  const [units, setUnits] = useState<Array<{ value: string; label: string }>>([]);
  useEffect(() => {
    void cmvService.byUnit({ period: '90d' })
      .then(rows => setUnits(rows
        .filter(row => Boolean(row.unitId))
        .map(row => ({ value: String(row.unitId), label: row.unitName }))))
      .catch(() => setUnits([]));
  }, []);
  return { filters, setFilters, units };
}

function FilterBar({ filters, setFilters, units }: {
  filters: CMVFilters;
  setFilters: React.Dispatch<React.SetStateAction<CMVFilters>>;
  units: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ ...cardStyle, padding: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {PERIODS.map(period => (
          <button key={period.value} onClick={() => setFilters(current => ({ ...current, period: period.value }))} style={{ padding: '6px 12px', borderRadius: 99, border: 0, fontSize: 12, fontWeight: 650, cursor: 'pointer', color: filters.period === period.value ? '#fff' : '#64748B', background: filters.period === period.value ? '#6366F1' : '#F1F5F9' }}>
            {period.label}
          </button>
        ))}
      </div>
      {filters.period === 'custom' && <>
        <input type="date" value={filters.startDate ?? ''} onChange={event => setFilters(current => ({ ...current, startDate: event.target.value }))} style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }} />
        <input type="date" value={filters.endDate ?? ''} onChange={event => setFilters(current => ({ ...current, endDate: event.target.value }))} style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }} />
      </>}
      <select value={filters.unitId ?? ''} onChange={event => setFilters(current => ({ ...current, unitId: event.target.value || undefined }))} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', minWidth: 180 }}>
        <option value="">Todas as unidades</option>
        {units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
      </select>
    </div>
  );
}

function Shell({ children, filters, setFilters, units }: React.PropsWithChildren<{
  filters: CMVFilters;
  setFilters: React.Dispatch<React.SetStateAction<CMVFilters>>;
  units: Array<{ value: string; label: string }>;
}>) {
  return <div style={{ ...pageStyle, display: 'grid', gap: 20 }}><Header /><FilterBar filters={filters} setFilters={setFilters} units={units} />{children}</div>;
}

function useLoad<T>(loader: () => Promise<T>, dependencies: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await loader()); } catch { setError('Não foi possível carregar os indicadores de CMV.'); }
    finally { setLoading(false); }
  }, dependencies);
  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load };
}

export function CMVDashboardPage() {
  const { filters, setFilters, units } = useCMVFilters();
  const metrics = useLoad<CMVMetrics>(() => cmvService.metrics(filters), [filters]);
  const items = useLoad<CMVByItem[]>(() => cmvService.byItem(filters), [filters]);
  const byUnit = useLoad<CMVByUnit[]>(() => cmvService.byUnit(filters), [filters]);
  const origins = useLoad<CMVByOrigin[]>(() => cmvService.byOrigin(filters), [filters]);
  if (metrics.loading || items.loading || byUnit.loading || origins.loading) return <ModuleStateView state="loading" />;
  if (metrics.error || items.error || byUnit.error || origins.error || !metrics.data) return <ModuleStateView state="error" errorMessage={metrics.error || items.error || byUnit.error || origins.error} onRetry={() => void Promise.all([metrics.reload(), items.reload(), byUnit.reload(), origins.reload()])} />;

  const kpis = [
    ['Consumo Total', money(metrics.data.consumptionCost), Package, '#6366F1', '#EEF2FF'],
    ['Perdas', money(metrics.data.lossCost), AlertTriangle, '#EF4444', '#FEF2F2'],
    ['Ajustes', money(metrics.data.adjustmentCost), SlidersHorizontal, '#F59E0B', '#FFFBEB'],
    ['Maior Unidade', metrics.data.topUnit ?? '—', Building2, '#3B82F6', '#EFF6FF'],
    ['Maior Item', metrics.data.topItem ?? '—', Package, '#8B5CF6', '#F5F3FF'],
  ] as const;
  const originData = (origins.data ?? []).map(row => ({ ...row, color: ORIGIN_COLORS[row.originType] ?? '#8B5CF6' }));

  return <Shell filters={filters} setFilters={setFilters} units={units}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
      {kpis.map(([label, value, Icon, color, bg]) => <div key={label} style={{ ...cardStyle, padding: 17 }}><div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12 }}><span>{label}</span><span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', color, background: bg }}><Icon size={16} /></span></div><strong style={{ display: 'block', marginTop: 10, fontSize: 19, color: '#0F172A' }}>{value}</strong></div>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16 }}>
      <ChartCard title="Top itens por custo"><ResponsiveContainer width="100%" height={310}><BarChart layout="vertical" data={items.data ?? []} margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={shortMoney} /><YAxis type="category" dataKey="itemName" width={130} tick={{ fontSize: 11 }} /><Tooltip formatter={value => money(Number(value))} /><Bar dataKey="cost" fill="#6366F1" radius={[0, 5, 5, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Por unidade"><ResponsiveContainer width="100%" height={310}><BarChart data={byUnit.data ?? []}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="unitName" tick={{ fontSize: 10 }} /><YAxis tickFormatter={shortMoney} /><Tooltip formatter={value => money(Number(value))} /><Legend /><Bar dataKey="consumptionCost" name="Consumo" stackId="a" fill="#6366F1" isAnimationActive={false} /><Bar dataKey="lossCost" name="Perdas" stackId="a" fill="#EF4444" isAnimationActive={false} /><Bar dataKey="adjustmentCost" name="Ajustes" stackId="a" fill="#F59E0B" isAnimationActive={false} /></BarChart></ResponsiveContainer></ChartCard>
    </div>
    <ChartCard title="Distribuição por origem"><div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center' }}><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={originData} dataKey="cost" nameKey="origin" innerRadius={55} outerRadius={95} isAnimationActive={false}>{originData.map(row => <Cell key={row.originType} fill={row.color} />)}</Pie><Tooltip formatter={value => money(Number(value))} /></PieChart></ResponsiveContainer><OriginTable rows={originData} /></div></ChartCard>
  </Shell>;
}

function ChartCard({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return <div style={{ ...cardStyle, padding: 18 }}><h2 style={{ margin: '0 0 14px', fontSize: 14, color: '#0F172A' }}>{title}</h2>{children}</div>;
}

function OriginTable({ rows }: { rows: CMVByOrigin[] }) {
  const total = rows.reduce((sum, row) => sum + Math.abs(row.cost), 0);
  return <div style={{ display: 'grid', gap: 9 }}>{rows.map(row => <div key={row.originType} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px', gap: 8, alignItems: 'center', fontSize: 12 }}><span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 99, marginRight: 7, background: ORIGIN_COLORS[row.originType] ?? '#8B5CF6' }} />{row.origin}</span><strong>{money(row.cost)}</strong><span style={{ color: '#64748B' }}>{total ? ((Math.abs(row.cost) / total) * 100).toFixed(1) : 0}%</span></div>)}</div>;
}

export function CMVByItemPage() {
  const { filters, setFilters, units } = useCMVFilters();
  const state = useLoad<CMVByItem[]>(() => cmvService.byItem(filters), [filters]);
  if (state.loading) return <ModuleStateView state="loading" />;
  if (state.error || !state.data) return <ModuleStateView state="error" errorMessage={state.error} onRetry={() => void state.reload()} />;
  const total = state.data.reduce((sum, row) => sum + row.cost, 0);
  const columns: ColumnDef[] = [
    { key: 'itemName', label: 'Item', sortable: true },
    { key: 'quantity', label: 'Quantidade', render: (_, row) => `${Number(row.quantity).toLocaleString('pt-BR')} ${row.unitOfMeasure ?? ''}` },
    { key: 'averageCost', label: 'Custo Médio', type: 'currency' },
    { key: 'cost', label: 'Custo Total', type: 'currency', sortable: true },
    { key: 'share', label: '% do Total', render: value => `${Number(value).toFixed(1)}%` },
  ];
  const rows = state.data.map(row => ({ ...row, share: total ? (row.cost / total) * 100 : 0 }));
  return <Shell filters={filters} setFilters={setFilters} units={units}><ChartCard title="Itens com maior custo"><ResponsiveContainer width="100%" height={320}><BarChart layout="vertical" data={rows.slice(0, 10)} margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={shortMoney} /><YAxis type="category" dataKey="itemName" width={140} tick={{ fontSize: 11 }} /><Tooltip formatter={value => money(Number(value))} /><Bar dataKey="cost" fill="#6366F1" radius={[0, 5, 5, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></ChartCard><DynamicTableRenderer columns={columns} data={rows as unknown as Record<string, unknown>[]} emptyMessage="Nenhum consumo no período." /></Shell>;
}

export function CMVByUnitPage() {
  const { filters, setFilters, units } = useCMVFilters();
  const state = useLoad<CMVByUnit[]>(() => cmvService.byUnit(filters), [filters]);
  if (state.loading) return <ModuleStateView state="loading" />;
  if (state.error || !state.data) return <ModuleStateView state="error" errorMessage={state.error} onRetry={() => void state.reload()} />;
  const columns: ColumnDef[] = [
    { key: 'unitName', label: 'Unidade', sortable: true },
    { key: 'consumptionCost', label: 'Consumo', type: 'currency' },
    { key: 'lossCost', label: 'Perdas', type: 'currency' },
    { key: 'adjustmentCost', label: 'Ajustes', type: 'currency' },
    { key: 'total', label: 'Total', type: 'currency', sortable: true },
  ];
  const rows = state.data.map(row => ({ ...row, total: row.consumptionCost + row.lossCost + row.adjustmentCost }));
  return <Shell filters={filters} setFilters={setFilters} units={units}><ChartCard title="Composição por unidade"><ResponsiveContainer width="100%" height={340}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="unitName" /><YAxis tickFormatter={shortMoney} /><Tooltip formatter={value => money(Number(value))} /><Legend /><Bar dataKey="consumptionCost" name="Consumo" stackId="a" fill="#6366F1" isAnimationActive={false} /><Bar dataKey="lossCost" name="Perdas" stackId="a" fill="#EF4444" isAnimationActive={false} /><Bar dataKey="adjustmentCost" name="Ajustes" stackId="a" fill="#F59E0B" isAnimationActive={false} /></BarChart></ResponsiveContainer></ChartCard><DynamicTableRenderer columns={columns} data={rows as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma unidade com movimentações no período." /></Shell>;
}

export function CMVByOriginPage() {
  const { filters, setFilters, units } = useCMVFilters();
  const state = useLoad<CMVByOrigin[]>(() => cmvService.byOrigin(filters), [filters]);
  if (state.loading) return <ModuleStateView state="loading" />;
  if (state.error || !state.data) return <ModuleStateView state="error" errorMessage={state.error} onRetry={() => void state.reload()} />;
  const total = state.data.reduce((sum, row) => sum + Math.abs(row.cost), 0);
  const rows = state.data.map(row => ({ ...row, share: total ? (Math.abs(row.cost) / total) * 100 : 0, color: ORIGIN_COLORS[row.originType] ?? '#8B5CF6' }));
  const columns: ColumnDef[] = [
    { key: 'origin', label: 'Origem', sortable: true },
    { key: 'movements', label: 'Movimentações', type: 'number' },
    { key: 'cost', label: 'Custo', type: 'currency', sortable: true },
    { key: 'share', label: '% do Total', render: value => `${Number(value).toFixed(1)}%` },
  ];
  return <Shell filters={filters} setFilters={setFilters} units={units}><div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,.8fr) minmax(0,1.2fr)', gap: 16 }}><ChartCard title="Distribuição por origem"><ResponsiveContainer width="100%" height={330}><PieChart><Pie data={rows} dataKey="cost" nameKey="origin" innerRadius={70} outerRadius={125} isAnimationActive={false}>{rows.map(row => <Cell key={row.originType} fill={row.color} />)}</Pie><Tooltip formatter={value => money(Number(value))} /><Legend /></PieChart></ResponsiveContainer></ChartCard><div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>{rows.slice(0, 3).map(row => <div key={row.originType} style={{ ...cardStyle, padding: 18, borderLeft: `4px solid ${row.color}` }}><span style={{ fontSize: 12, color: '#64748B' }}>{row.origin}</span><strong style={{ display: 'block', marginTop: 6, fontSize: 22 }}>{money(row.cost)}</strong><small style={{ color: '#94A3B8' }}>{row.movements} movimentações · {row.share.toFixed(1)}%</small></div>)}</div></div><DynamicTableRenderer columns={columns} data={rows as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma origem encontrada no período." /></Shell>;
}
