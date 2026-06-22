import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  BarChart3, ChevronDown, GripVertical, Hash, LayoutDashboard, LineChart as LineIcon,
  Loader2, Lock, Pencil, PieChart as PieIcon, Plus, RefreshCw, Save, Table2,
  Star, Trash2, X,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { toast } from 'sonner';

import { analyticsService } from '../../../services/analyticsService';
import { usePermission } from '../../../shared/hooks/usePermission';
import type {
  AnalyticsFilters, AnalyticsMetricDefinition, AnalyticsMetricResult, AnalyticsPeriod,
  AnalyticsUnitOption, CreateDashboardWidget, DashboardWidget, WidgetSize, WidgetViewType,
} from '../../../types/analytics';
import {
  ANALYTICS_PERIOD_LABELS, WIDGET_SIZE_COLS, WIDGET_SIZE_LABELS,
} from '../../../types/analytics';

const PERIODS: AnalyticsPeriod[] = ['today', '7d', '30d', '90d'];
const SIZES: WidgetSize[] = ['small', 'medium', 'large', 'full'];
const VIEW_META: Record<WidgetViewType, { label: string; icon: typeof Hash }> = {
  counter: { label: 'Contador', icon: Hash },
  bar_chart: { label: 'Barras', icon: BarChart3 },
  line_chart: { label: 'Linhas', icon: LineIcon },
  pie_chart: { label: 'Pizza', icon: PieIcon },
  table: { label: 'Tabela', icon: Table2 },
};
const MODULE_LABELS: Record<string, string> = {
  sales: 'Vendas', crm: 'CRM', financial: 'Financeiro', cmv: 'CMV',
  inventory: 'Estoque', checklists: 'Operação', training: 'Treinamentos',
  trainings: 'Treinamentos',
};

const button: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 8,
  padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

function formatValue(value: number | string, format?: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
  }
  if (format === 'percentage') {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(number)}%`;
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(number);
}

function MetricContent({
  widget, definition, result, loading,
}: {
  widget: DashboardWidget;
  definition?: AnalyticsMetricDefinition;
  result?: AnalyticsMetricResult;
  loading: boolean;
}) {
  if (loading && !result) {
    return <div style={{ height: 130, display: 'grid', placeItems: 'center' }}><Loader2 className="animate-spin" color="#6366F1" /></div>;
  }
  if (result?.error === 'no_permission') {
    return <div style={{ height: 130, display: 'grid', placeItems: 'center', color: '#94A3B8', textAlign: 'center', fontSize: 13 }}><div><Lock size={20} style={{ margin: '0 auto 8px' }} />Sem permissão para esta métrica.</div></div>;
  }
  if (!result || result.error) {
    return <div style={{ height: 130, display: 'grid', placeItems: 'center', color: '#94A3B8', fontSize: 13 }}>Métrica temporariamente indisponível.</div>;
  }
  if (widget.viewType === 'counter') {
    return (
      <div style={{ padding: '16px 2px 10px' }}>
        <div style={{ fontSize: 34, lineHeight: 1.15, fontWeight: 800, color: definition?.color ?? '#6366F1' }}>
          {formatValue(result.value, result.format)}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#94A3B8' }}>Valor consolidado para os filtros selecionados</div>
      </div>
    );
  }

  const series = result.series.length
    ? result.series
    : Number(result.value) !== 0
      ? [{ label: result.label, value: Number(result.value), color: definition?.color }]
      : [];
  if (widget.viewType === 'table') {
    if (!result.rows.length) return <EmptyMetric />;
    const columns = Object.keys(result.rows[0] ?? {});
    return (
      <div style={{ overflowX: 'auto', maxHeight: 230 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr>{columns.map(column => <th key={column} style={{ padding: 8, textAlign: 'left', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>{column}</th>)}</tr></thead>
          <tbody>{result.rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={column} style={{ padding: 8, borderBottom: '1px solid #F1F5F9' }}>{String(row[column] ?? '—')}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  if (!series.length) return <EmptyMetric />;
  const color = definition?.color ?? '#6366F1';
  if (widget.viewType === 'pie_chart') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={series} dataKey="value" nameKey="label" innerRadius={48} outerRadius={78} isAnimationActive={false}>
            {series.map((item, index) => <Cell key={`${item.label}-${index}`} fill={item.color ?? color} />)}
          </Pie>
          <Tooltip formatter={(value) => formatValue(value as number, result.format)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      {widget.viewType === 'bar_chart' ? (
        <BarChart data={series} margin={{ left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value) => formatValue(value as number, result.format)} />
          <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ) : (
        <LineChart data={series} margin={{ left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value) => formatValue(value as number, result.format)} />
          <Line dataKey="value" stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

function EmptyMetric() {
  return <div style={{ height: 170, display: 'grid', placeItems: 'center', color: '#94A3B8', fontSize: 13 }}>Sem dados para o período.</div>;
}

function WidgetCard({
  widget, definition, result, loading, editMode, canDelete, onRemove, onUpdate, onFavorite,
}: {
  widget: DashboardWidget;
  definition?: AnalyticsMetricDefinition;
  result?: AnalyticsMetricResult;
  loading: boolean;
  editMode: boolean;
  canDelete: boolean;
  onRemove: () => void;
  onUpdate: (changes: Partial<DashboardWidget>) => void;
  onFavorite: () => void;
}) {
  return (
    <article style={{
      height: '100%', background: '#fff', borderRadius: 14, padding: 16,
      border: editMode ? '2px dashed rgba(99,102,241,.35)' : '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(15,23,42,.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
        {editMode && <GripVertical size={16} color="#94A3B8" />}
        <div style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 999, background: `${definition?.color ?? '#6366F1'}18`, color: definition?.color ?? '#6366F1' }}>
          <LayoutDashboard size={14} />
        </div>
        <strong style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{widget.title}</strong>
        {widget.locked && <Lock size={14} color="#7C3AED" />}
        <button onClick={onFavorite} title={widget.favorited ? 'Remover dos favoritos' : 'Favoritar widget'} style={{ border: 0, background: 'transparent', color: widget.favorited ? '#F59E0B' : '#CBD5E1', cursor: 'pointer' }}><Star size={15} fill={widget.favorited ? '#F59E0B' : 'none'} /></button>
        {editMode && !widget.locked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <select value={widget.viewType} onChange={event => onUpdate({ viewType: event.target.value as WidgetViewType })} style={{ padding: 4, borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11 }}>
              {definition?.allowedViews.map(view => <option key={view} value={view}>{VIEW_META[view].label}</option>)}
            </select>
            <select value={widget.size} onChange={event => onUpdate({ size: event.target.value as WidgetSize })} style={{ padding: 4, borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11 }}>
              {SIZES.map(size => <option key={size} value={size}>{WIDGET_SIZE_LABELS[size]}</option>)}
            </select>
            {canDelete && <button onClick={onRemove} title="Excluir widget" style={{ border: 0, background: '#FEF2F2', color: '#DC2626', borderRadius: 6, width: 27, height: 27, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Trash2 size={13} /></button>}
          </div>
        )}
      </div>
      <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />
      <MetricContent widget={widget} definition={definition} result={result} loading={loading} />
    </article>
  );
}

function WidgetPicker({
  open, definitions, onClose, onAdd,
}: {
  open: boolean;
  definitions: AnalyticsMetricDefinition[];
  onClose: () => void;
  onAdd: (input: CreateDashboardWidget) => Promise<void>;
}) {
  const [selected, setSelected] = useState<AnalyticsMetricDefinition>();
  const [view, setView] = useState<WidgetViewType>('counter');
  const [size, setSize] = useState<WidgetSize>('medium');
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) { setSelected(undefined); setTitle(''); setView('counter'); setSize('medium'); setPeriod('30d'); }
  }, [open]);
  if (!open) return null;
  const grouped = definitions.reduce<Record<string, AnalyticsMetricDefinition[]>>((acc, definition) => {
    (acc[definition.module] ??= []).push(definition);
    return acc;
  }, {});

  return (
    <div onMouseDown={event => event.target === event.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(720px, 100%)', maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 24px 70px rgba(15,23,42,.3)' }}>
        <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ margin: 0, fontSize: 18, flex: 1 }}>Adicionar widget</h2>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 22 }}>
          {!selected ? Object.entries(grouped).map(([module, metrics]) => (
            <section key={module} style={{ marginBottom: 22 }}>
              <div style={{ color: '#94A3B8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 9 }}>{MODULE_LABELS[module] ?? module}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: 9 }}>
                {metrics.map(metric => <button key={metric.key} onClick={() => { setSelected(metric); setView(metric.defaultView); setTitle(metric.label); }} style={{ padding: 14, textAlign: 'left', border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', cursor: 'pointer' }}>
                  <div style={{ color: '#0F172A', fontSize: 14, fontWeight: 700 }}>{metric.label}</div>
                  <div style={{ color: '#64748B', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{metric.description}</div>
                </button>)}
              </div>
            </section>
          )) : (
            <div>
              <button onClick={() => setSelected(undefined)} style={{ border: 0, background: 'transparent', color: '#6366F1', padding: 0, cursor: 'pointer', fontWeight: 600 }}>← Escolher outra métrica</button>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, margin: '16px 0 20px' }}>
                <strong>{selected.label}</strong><div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{selected.description}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, fontSize: 11, color: '#64748B' }}><span>Categoria: {selected.category}</span><span>Permissão: {selected.permission ?? '—'}</span><span>Recomendado: {VIEW_META[selected.recommendedView].label}</span></div>
              </div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 7 }}>Título</label>
              <input value={title} onChange={event => setTitle(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10, marginBottom: 18 }} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Visualização</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {selected.allowedViews.map(item => { const Icon = VIEW_META[item].icon; return <button key={item} onClick={() => setView(item)} style={{ ...button, border: view === item ? '1px solid #6366F1' : '1px solid #E2E8F0', background: view === item ? '#EEF2FF' : '#fff', color: view === item ? '#4F46E5' : '#64748B' }}><Icon size={15} />{VIEW_META[item].label}</button>; })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Tamanho<select value={size} onChange={event => setSize(event.target.value as WidgetSize)} style={{ display: 'block', width: '100%', marginTop: 7, padding: 9, border: '1px solid #E2E8F0', borderRadius: 8 }}>{SIZES.map(item => <option key={item} value={item}>{WIDGET_SIZE_LABELS[item]}</option>)}</select></label>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Período padrão<select value={period} onChange={event => setPeriod(event.target.value as AnalyticsPeriod)} style={{ display: 'block', width: '100%', marginTop: 7, padding: 9, border: '1px solid #E2E8F0', borderRadius: 8 }}>{PERIODS.map(item => <option key={item} value={item}>{ANALYTICS_PERIOD_LABELS[item]}</option>)}</select></label>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '15px 22px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ ...button, border: '1px solid #E2E8F0', background: '#fff' }}>Cancelar</button>
          {selected && <button disabled={saving || !title.trim()} onClick={async () => { setSaving(true); try { await onAdd({ title: title.trim(), metricKey: selected.key, viewType: view, size, filters: { period } }); onClose(); } finally { setSaving(false); } }} style={{ ...button, border: 0, background: '#6366F1', color: '#fff', opacity: saving ? .65 : 1 }}>{saving && <Loader2 size={14} className="animate-spin" />}Adicionar</button>}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermission();
  const editMode = location.pathname.endsWith('/edit');
  const canCreate = hasPermission('tenant.analytics.create');
  const canUpdate = hasPermission('tenant.analytics.update');
  const canDelete = hasPermission('tenant.analytics.delete');
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [savedWidgets, setSavedWidgets] = useState<DashboardWidget[]>([]);
  const [definitions, setDefinitions] = useState<AnalyticsMetricDefinition[]>([]);
  const [units, setUnits] = useState<AnalyticsUnitOption[]>([]);
  const [results, setResults] = useState<Record<string, AnalyticsMetricResult>>({});
  const [filters, setFilters] = useState<AnalyticsFilters>({ period: '30d', unitId: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(false);
  const [dragging, setDragging] = useState<string>();
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const hasLockedDashboard = widgets.some(widget => widget.locked);

  const ordered = useMemo(() => [...widgets].sort((a, b) => a.positionY - b.positionY), [widgets]);
  const refresh = useCallback(async (items = widgets, currentFilters = filters) => {
    if (!items.length) { setResults({}); return; }
    setLoading(true);
    try {
      setResults(await analyticsService.queryAll(items, currentFilters));
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, [filters, widgets]);

  useEffect(() => {
    let active = true;
    Promise.all([
      analyticsService.widgets(),
      analyticsService.available(),
      analyticsService.units().catch(() => []),
    ]).then(async ([loadedWidgets, loadedDefinitions, loadedUnits]) => {
      if (!active) return;
      setWidgets(loadedWidgets); setSavedWidgets(loadedWidgets);
      setDefinitions(loadedDefinitions); setUnits(loadedUnits);
      setResults(await analyticsService.queryAll(loadedWidgets, filters));
      setUpdatedAt(new Date());
    }).catch(() => toast.error('Não foi possível carregar o dashboard.')).finally(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) refresh(widgets, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period, filters.unitId]);

  async function addWidget(input: CreateDashboardWidget) {
    const created = await analyticsService.create(input, widgets.length);
    const result = await analyticsService.query(created, filters);
    const next = [...widgets, created];
    setWidgets(next);
    setResults(previous => ({ ...previous, [created.id]: result }));
    toast.success('Widget adicionado.');
  }

  async function updateWidget(widget: DashboardWidget, changes: Partial<DashboardWidget>) {
    try {
      const updated = await analyticsService.update(widget.id, changes);
      setWidgets(current => current.map(item => item.id === updated.id ? updated : item));
      if (changes.viewType) {
        setResults(previous => ({ ...previous, [updated.id]: { ...previous[updated.id], viewType: changes.viewType! } }));
        refresh(widgets.map(item => item.id === updated.id ? updated : item), filters);
      }
    } catch {
      toast.error('Não foi possível atualizar o widget.');
    }
  }

  async function removeWidget(widget: DashboardWidget) {
    if (!window.confirm(`Excluir o widget "${widget.title}"?`)) return;
    await analyticsService.remove(widget.id);
    setWidgets(current => current.filter(item => item.id !== widget.id));
    setResults(current => { const next = { ...current }; delete next[widget.id]; return next; });
    toast.success('Widget excluído.');
  }

  async function toggleFavorite(widget: DashboardWidget) {
    await analyticsService.favorite(widget.id, !widget.favorited);
    setWidgets(current => current.map(item => item.id === widget.id ? { ...item, favorited: !item.favorited } : item));
    toast.success(widget.favorited ? 'Widget removido dos favoritos.' : 'Widget favoritado.');
  }

  function dropOn(targetId: string) {
    if (!dragging || dragging === targetId) return;
    setWidgets(current => {
      const sorted = [...current].sort((a, b) => a.positionY - b.positionY);
      const sourceIndex = sorted.findIndex(item => item.id === dragging);
      const targetIndex = sorted.findIndex(item => item.id === targetId);
      const [source] = sorted.splice(sourceIndex, 1);
      sorted.splice(targetIndex, 0, source);
      return sorted.map((item, index) => ({ ...item, positionY: index }));
    });
    setDragging(undefined);
  }

  async function saveOrder() {
    setSaving(true);
    try {
      await analyticsService.reorder(ordered);
      setSavedWidgets(ordered);
      navigate('/analytics');
      toast.success('Dashboard salvo.');
    } catch {
      toast.error('Não foi possível salvar a organização.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '22px 30px' }}>
        <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 11 }}>Analytics</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff' }}><LayoutDashboard size={22} /></div>
          <div style={{ flex: 1 }}><h1 style={{ margin: 0, fontSize: 22, color: '#0F172A' }}>Analytics</h1><div style={{ color: '#64748B', fontSize: 13, marginTop: 3 }}>Dashboard executivo personalizado da rede.</div></div>
          <Link to="/analytics/templates" style={{ ...button, border: '1px solid #E2E8F0', color: '#475569', textDecoration: 'none' }}>Templates</Link>
          <Link to="/analytics/catalog" style={{ ...button, border: '1px solid #E2E8F0', color: '#475569', textDecoration: 'none' }}>Catálogo</Link>
          <button onClick={() => refresh()} disabled={loading} style={{ ...button, border: '1px solid #E2E8F0', background: '#fff', color: '#475569' }}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Atualizar</button>
          {!editMode && canUpdate && <button onClick={() => { setSavedWidgets(widgets); navigate('/analytics/edit'); }} style={{ ...button, border: '1px solid #6366F1', background: '#fff', color: '#4F46E5' }}><Pencil size={15} />Personalizar</button>}
          {editMode && <><button onClick={() => { setWidgets(savedWidgets); navigate('/analytics'); }} style={{ ...button, border: '1px solid #E2E8F0', background: '#fff' }}><X size={15} />Cancelar</button><button onClick={saveOrder} disabled={saving} style={{ ...button, border: 0, background: '#6366F1', color: '#fff' }}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Salvar dashboard</button></>}
        </div>
      </header>

      {editMode && <div style={{ padding: '11px 30px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', color: '#92400E', fontSize: 13 }}>Modo de edição ativo — arraste os cards para reorganizar e ajuste visualização ou tamanho.</div>}
      {hasLockedDashboard && <div style={{ padding: '11px 30px', background: '#F5F3FF', borderBottom: '1px solid #DDD6FE', color: '#6D28D9', fontSize: 13 }}><Lock size={14} style={{ display: 'inline', marginRight: 6 }} />Dashboard corporativo: widgets bloqueados podem ser visualizados e favoritados, mas não alterados.</div>}

      <div style={{ padding: '12px 30px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {PERIODS.map(period => <button key={period} onClick={() => setFilters(current => ({ ...current, period }))} style={{ ...button, padding: '6px 13px', border: filters.period === period ? '1px solid #6366F1' : '1px solid #E2E8F0', background: filters.period === period ? '#6366F1' : '#fff', color: filters.period === period ? '#fff' : '#475569', borderRadius: 999 }}>{ANALYTICS_PERIOD_LABELS[period]}</button>)}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <select value={String(filters.unitId ?? '')} onChange={event => setFilters(current => ({ ...current, unitId: event.target.value || null }))} style={{ appearance: 'none', padding: '8px 34px 8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', fontSize: 13 }}>
            <option value="">Todas as unidades</option>
            {units.map(unit => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 10, pointerEvents: 'none', color: '#64748B' }} />
        </div>
      </div>

      <main style={{ padding: 30 }}>
        {!loading && !widgets.length ? (
          <div style={{ minHeight: 390, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div><LayoutDashboard size={52} color="#CBD5E1" style={{ margin: '0 auto 16px' }} /><h2 style={{ margin: 0, fontSize: 19 }}>Seu dashboard está vazio</h2><p style={{ color: '#64748B', fontSize: 13 }}>Adicione as métricas relevantes para sua operação.</p>{canCreate && <button onClick={() => setPicker(true)} style={{ ...button, border: 0, background: '#6366F1', color: '#fff', margin: '16px auto 0' }}><Plus size={16} />Adicionar primeiro widget</button>}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 16 }}>
            {ordered.map(widget => (
              <div key={widget.id} draggable={editMode && !widget.locked} onDragStart={() => setDragging(widget.id)} onDragOver={event => event.preventDefault()} onDrop={() => dropOn(widget.id)} style={{ gridColumn: `span ${WIDGET_SIZE_COLS[widget.size]}`, minWidth: 0, opacity: dragging === widget.id ? .55 : 1 }}>
                <WidgetCard widget={widget} definition={definitions.find(item => item.key === widget.metricKey)} result={results[widget.id]} loading={loading} editMode={editMode} canDelete={canDelete} onRemove={() => removeWidget(widget)} onUpdate={changes => updateWidget(widget, changes)} onFavorite={() => void toggleFavorite(widget)} />
              </div>
            ))}
            {editMode && canCreate && <button onClick={() => setPicker(true)} style={{ gridColumn: 'span 4', minHeight: 180, border: '2px dashed rgba(99,102,241,.35)', borderRadius: 14, background: 'transparent', color: '#6366F1', cursor: 'pointer', fontWeight: 700 }}><Plus size={28} style={{ margin: '0 auto 8px' }} />Adicionar widget</button>}
          </div>
        )}
        {updatedAt && <div style={{ textAlign: 'right', color: '#94A3B8', fontSize: 11, marginTop: 18 }}>Atualizado às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>}
        {!!widgets.filter(widget => widget.favorited).length && <section style={{ marginTop: 22 }}><h2 style={{ fontSize: 16 }}>Meus Favoritos</h2><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{widgets.filter(widget => widget.favorited).map(widget => <span key={widget.id} style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', padding: '7px 10px', borderRadius: 999, fontSize: 12 }}><Star size={12} fill="#F59E0B" style={{ display: 'inline', marginRight: 5 }} />{widget.title}</span>)}</div></section>}
      </main>
      <WidgetPicker open={picker} definitions={definitions} onClose={() => setPicker(false)} onAdd={addWidget} />
    </div>
  );
}
