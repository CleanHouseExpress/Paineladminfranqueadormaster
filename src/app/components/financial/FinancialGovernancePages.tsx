import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { BarChart3, CalendarCheck, Save, Target } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { toast } from 'sonner';

import { dreService } from '../../../services/dreService';
import { royaltyService } from '../../../services/royaltyService';
import { unitManagementService } from '../../../services/unitManagementService';
import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import type { DreGoalAnalysis, DreHistoryPoint, DreProjection, DreRankingRow, FinancialGoal } from '../../../types/dre';
import type { FinancialPeriod } from '../../../types/royalties';
import type { UnitOption } from '../../../types/unitManagement';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18 };
const input: React.CSSProperties = { padding: '9px 11px', border: '1px solid #CBD5E1', borderRadius: 9, background: '#fff' };
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const now = new Date();

function Shell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}><div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gap: 18 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}><BarChart3 size={20} /></span>
      <div><h1 style={{ margin: 0, fontSize: 23 }}>{title}</h1><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>{description}</p></div>
    </div>
    <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[['/financial/dre', 'DRE'], ['/dre/goals', 'Metas'], ['/dre/history', 'Histórico'], ['/dre/projection', 'Projeção'], ['/royalties/periods', 'Fechamento de royalties']].map(([path, label]) =>
        <Link key={path} to={path} style={{ padding: '8px 12px', borderRadius: 9, background: '#fff', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#475569', fontSize: 12, fontWeight: 700 }}>{label}</Link>)}
    </nav>
    {children}
  </div></div>;
}

function Filters({ year, month, unitId, units, onChange }: {
  year: number; month: number; unitId: string; units: UnitOption[];
  onChange: (values: { year?: number; month?: number; unitId?: string }) => void;
}) {
  return <div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
    <select style={input} value={month} onChange={event => onChange({ month: Number(event.target.value) })}>
      {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, '0')}</option>)}
    </select>
    <input style={input} type="number" min={2000} max={2100} value={year} onChange={event => onChange({ year: Number(event.target.value) })} />
    <select style={{ ...input, minWidth: 210 }} value={unitId} onChange={event => onChange({ unitId: event.target.value })}>
      <option value="">Rede consolidada</option>
      {units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
    </select>
  </div>;
}

function usePeriodFilters() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState<UnitOption[]>([]);
  useEffect(() => { void unitManagementService.getUnitOptions().then(setUnits).catch(() => setUnits([])); }, []);
  return { year, month, unitId, units, set: (values: { year?: number; month?: number; unitId?: string }) => {
    if (values.year !== undefined) setYear(values.year);
    if (values.month !== undefined) setMonth(values.month);
    if (values.unitId !== undefined) setUnitId(values.unitId);
  } };
}

export function DreGoalsPage() {
  const filters = usePeriodFilters();
  const { hasPermission } = usePermission();
  const [data, setData] = useState<DreGoalAnalysis | null>(null);
  const [form, setForm] = useState<FinancialGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dreService.goals({ year: filters.year, month: filters.month, ...(filters.unitId ? { unit_id: Number(filters.unitId) } : {}) });
      setData(result); setForm(result.goal);
    } finally { setLoading(false); }
  }, [filters.year, filters.month, filters.unitId]);
  useEffect(() => { void load(); }, [load]);
  const save = async () => {
    if (!form) return;
    await dreService.saveGoal({ ...form, unit_id: filters.unitId ? Number(filters.unitId) : null }, form.id);
    toast.success('Meta financeira salva.'); await load();
  };
  if (loading && !data) return <ModuleStateView state="loading" />;
  return <Shell title="Metas do DRE" description="Planejamento mensal e acompanhamento de meta versus realizado.">
    <Filters {...filters} onChange={filters.set} />
    {data && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
      {[
        ['Faturamento', data.actual.sales, data.goal.sales_target, data.achievement.sales],
        ['Lucro líquido', data.actual.profit, data.goal.profit_target, data.achievement.profit],
        ['CMV', data.actual.cmv, data.goal.cmv_target, data.achievement.cmv],
        ['Royalties', data.actual.royalty, data.goal.royalty_target, data.achievement.royalty],
      ].map(([label, actual, target, percent]) => <div key={String(label)} style={card}><small style={{ color: '#64748B' }}>{label}</small><strong style={{ display: 'block', fontSize: 21, marginTop: 6 }}>{money(Number(actual))}</strong><span style={{ fontSize: 12, color: '#64748B' }}>Meta {money(Number(target))} · {Number(percent).toFixed(1)}%</span></div>)}
    </div>}
    {form && <div style={card}><h3 style={{ marginTop: 0 }}><Target size={17} /> Definir metas</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
      {(['sales_target', 'profit_target', 'cmv_target', 'royalty_target'] as const).map(key => <label key={key} style={{ display: 'grid', gap: 6, fontSize: 12, color: '#475569' }}>{({ sales_target: 'Vendas', profit_target: 'Lucro', cmv_target: 'CMV', royalty_target: 'Royalties' })[key]}<input style={input} type="number" value={form[key]} onChange={event => setForm(current => current ? { ...current, [key]: Number(event.target.value) } : current)} /></label>)}
    </div><button disabled={!hasPermission('tenant.dre.goals.manage')} onClick={() => void save()} style={{ marginTop: 14, padding: '10px 15px', border: 0, borderRadius: 9, color: '#fff', background: '#6366F1', fontWeight: 700 }}><Save size={14} /> Salvar metas</button></div>}
  </Shell>;
}

export function DreHistoryPage() {
  const filters = usePeriodFilters();
  const [rows, setRows] = useState<DreHistoryPoint[]>([]);
  const [ranking, setRanking] = useState<DreRankingRow[]>([]);
  useEffect(() => {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
    const end = new Date(filters.year, filters.month, 0).toISOString().slice(0, 10);
    void Promise.all([
      dreService.history({ year: filters.year, month: filters.month, months: 12, ...(filters.unitId ? { unit_id: Number(filters.unitId) } : {}) }),
      dreService.ranking({ start_date: start, end_date: end }),
    ]).then(([history, nextRanking]) => { setRows(history.series); setRanking(nextRanking); });
  }, [filters.year, filters.month, filters.unitId]);
  const columns = useMemo<ColumnDef[]>(() => [
    { key: 'position', label: '#' }, { key: 'unit_name', label: 'Unidade' },
    { key: 'revenue', label: 'Receita', render: value => money(Number(value)) },
    { key: 'profit', label: 'Lucro', render: value => money(Number(value)) },
    { key: 'margin', label: 'Margem', render: value => `${Number(value).toFixed(1)}%` },
  ], []);
  return <Shell title="Histórico e ranking do DRE" description="Evolução mensal do resultado e comparação entre unidades.">
    <Filters {...filters} onChange={filters.set} />
    <div style={card}><ResponsiveContainer width="100%" height={330}><LineChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip formatter={value => money(Number(value))} /><Legend /><Line dataKey="revenue" name="Receita" stroke="#6366F1" isAnimationActive={false} /><Line dataKey="profit" name="Lucro" stroke="#10B981" isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
    <DynamicTableRenderer columns={columns} data={ranking as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma unidade no ranking." />
  </Shell>;
}

export function DreProjectionPage() {
  const filters = usePeriodFilters();
  const [data, setData] = useState<DreProjection | null>(null);
  useEffect(() => { void dreService.projection({ year: filters.year, month: filters.month, ...(filters.unitId ? { unit_id: Number(filters.unitId) } : {}) }).then(setData); }, [filters.year, filters.month, filters.unitId]);
  const chartData = data ? [
    { metric: 'Receita bruta', atual: data.actual.gross_revenue, projetado: data.projected.gross_revenue },
    { metric: 'Receita líquida', atual: data.actual.net_revenue, projetado: data.projected.net_revenue },
    { metric: 'CMV', atual: data.actual.cmv, projetado: data.projected.cmv },
    { metric: 'Lucro líquido', atual: data.actual.net_profit, projetado: data.projected.net_profit },
  ] : [];
  return <Shell title="Projeção do DRE" description="Run rate da competência com base nos dias já realizados.">
    <Filters {...filters} onChange={filters.set} />
    {data ? <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
      <div style={card}><small>Dias realizados</small><strong style={{ display: 'block', fontSize: 24 }}>{data.elapsed_days}/{data.total_days}</strong></div>
      <div style={card}><small>Lucro projetado</small><strong style={{ display: 'block', fontSize: 24 }}>{money(data.projected.net_profit)}</strong></div>
      <div style={card}><small>Margem projetada</small><strong style={{ display: 'block', fontSize: 24 }}>{data.projected.margin.toFixed(1)}%</strong></div>
    </div><div style={card}><ResponsiveContainer width="100%" height={330}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="metric" /><YAxis /><Tooltip formatter={value => money(Number(value))} /><Legend /><Bar dataKey="atual" fill="#94A3B8" isAnimationActive={false} /><Bar dataKey="projetado" fill="#6366F1" isAnimationActive={false} /></BarChart></ResponsiveContainer></div></> : <ModuleStateView state="loading" />}
  </Shell>;
}

export function RoyaltyPeriodsPage() {
  const { hasPermission } = usePermission();
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setPeriods(await royaltyService.listPeriods()); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const close = async () => {
    await royaltyService.closePeriod({ year: now.getFullYear(), month: now.getMonth() + 1 });
    toast.success('Competência fechada e snapshots gerados.'); await load();
  };
  const reopen = async (period: FinancialPeriod) => {
    await royaltyService.reopenPeriod(period.id, 'Reabertura pelo painel');
    toast.success('Competência reaberta.'); await load();
  };
  const columns = useMemo<ColumnDef[]>(() => [
    { key: 'reference', label: 'Competência' }, { key: 'status', label: 'Status' },
    { key: 'royalty_total', label: 'Royalties', render: value => money(Number(value)) },
    { key: 'units', label: 'Unidades' }, { key: 'closed_by_name', label: 'Fechado por' },
    { key: 'action', label: 'Ação', render: (_value, row) => row.status === 'closed' && hasPermission('tenant.financial.period.reopen')
      ? <button onClick={() => void reopen(row.source as FinancialPeriod)} style={{ ...input, cursor: 'pointer' }}>Reabrir</button> : '—' },
  ], [hasPermission]);
  const rows = periods.map(period => ({
    ...period, source: period, royalty_total: period.snapshots.reduce((sum, item) => sum + item.royalty_amount, 0),
    units: period.snapshots.length,
  }));
  if (loading && !periods.length) return <ModuleStateView state="loading" />;
  return <Shell title="Fechamento de royalties" description="Congelamento mensal das bases e valores por unidade.">
    <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div><strong><CalendarCheck size={17} /> Fechar competência atual</strong><p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 12 }}>Após o fechamento, alterações retroativas ficam bloqueadas.</p></div>
      <button disabled={!hasPermission('tenant.royalties.close')} onClick={() => void close()} style={{ padding: '10px 15px', border: 0, borderRadius: 9, color: '#fff', background: '#6366F1', fontWeight: 700 }}>Fechar período</button>
    </div>
    <DynamicTableRenderer columns={columns} data={rows as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma competência financeira criada." />
  </Shell>;
}
