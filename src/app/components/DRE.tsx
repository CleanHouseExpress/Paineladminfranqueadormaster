import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

import { ApiError } from '../../services/apiClient';
import { dreService } from '../../services/dreService';
import { unitManagementService } from '../../services/unitManagementService';
import { ModuleStateView } from '../../shared/components/ModuleStateView';
import type { DreComparison, DreRow, DreSummary } from '../../types/dre';
import type { UnitOption } from '../../types/unitManagement';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0,
  }).format(Math.abs(value));

const dateInput = (date: Date) => date.toISOString().slice(0, 10);

const monthStart = () => {
  const date = new Date();
  return dateInput(new Date(date.getFullYear(), date.getMonth(), 1));
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const payload = error.data as { message?: string };
    if (payload.message) return payload.message;
  }
  return 'Não foi possível carregar o DRE gerencial.';
}

function periodLabel(start: string, end: string) {
  const format = (value: string) =>
    new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
  return `${format(start)} a ${format(end)}`;
}

function previousAmount(comparison: DreComparison, row: DreRow) {
  return comparison.previous.rows.find(item => item.key === row.key)?.amount ?? 0;
}

export function DRE() {
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(() => dateInput(new Date()));
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [data, setData] = useState<DreComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        start_date: startDate,
        end_date: endDate,
        ...(unitId ? { unit_id: Number(unitId) } : {}),
      };
      const [comparison, options] = await Promise.all([
        dreService.comparison(filters),
        units.length
          ? Promise.resolve(units)
          : unitManagementService.getUnitOptions().catch(() => [] as UnitOption[]),
      ]);
      setData(comparison);
      setUnits(options);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [startDate, endDate, unitId]);

  const revenue = data?.current.summary.gross_revenue ?? 0;
  const summaryCards = useMemo(() => {
    if (!data) return [];
    const cards: Array<{ label: string; value: number; suffix?: string; metric: keyof DreSummary }> = [
      { label: 'Receita Bruta', value: data.current.summary.gross_revenue, metric: 'gross_revenue' },
      { label: 'Lucro Líquido', value: data.current.summary.net_profit, metric: 'net_profit' },
      { label: 'Margem Líquida', value: data.current.summary.margin, suffix: '%', metric: 'margin' },
    ];
    return cards.map(card => ({
      ...card,
      change: data.comparison[card.metric]?.variation_percentage,
    }));
  }, [data]);

  if (loading && !data) return <ModuleStateView state="loading" />;
  if (error && !data) {
    return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;
  }
  if (!data) return null;

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: 12, color: '#94A3B8' }}>
          <span>Financeiro</span><ChevronRight size={12} /><span>DRE Gerencial</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 style={{ color: '#0F172A', margin: 0 }}>DRE Gerencial</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Demonstração de Resultado · {periodLabel(startDate, endDate)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={event => setStartDate(event.target.value)}
              className="px-3 py-2 rounded-lg"
              style={{ background: 'white', border: '1px solid rgba(0,0,0,.1)', fontSize: 12 }}
            />
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={event => setEndDate(event.target.value)}
              className="px-3 py-2 rounded-lg"
              style={{ background: 'white', border: '1px solid rgba(0,0,0,.1)', fontSize: 12 }}
            />
            <select
              value={unitId}
              onChange={event => setUnitId(event.target.value)}
              className="px-3 py-2 rounded-lg"
              style={{ minWidth: 180, background: 'white', border: '1px solid rgba(0,0,0,.1)', fontSize: 12 }}
            >
              <option value="">Todas as unidades</option>
              {units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
            </select>
          </div>
        </div>
        {error && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {summaryCards.map(card => {
          const change = card.change;
          const positive = change === null || change === undefined || change >= 0;
          return (
            <div key={card.label} className="bg-white rounded-xl p-4" style={{ border: '1px solid rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                {card.suffix ? `${card.value.toFixed(1)}${card.suffix}` : money(card.value)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {positive ? <TrendingUp size={11} color="#10B981" /> : <TrendingDown size={11} color="#EF4444" />}
                <span style={{ fontSize: 11, color: positive ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                  {change === null || change === undefined
                    ? 'Sem base anterior'
                    : `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs período anterior`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,.06)', opacity: loading ? .65 : 1 }}>
        <div className="px-5 py-3" style={{ background: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
          <div className="grid grid-cols-4 gap-4">
            <Header>Descrição</Header>
            <Header right>Período atual</Header>
            <Header right>Período anterior</Header>
            <Header right>% Receita</Header>
          </div>
        </div>
        {data.current.rows.map(row => {
          const subtotal = row.kind === 'subtotal' || row.kind === 'total';
          const result = row.kind === 'total';
          const previous = previousAmount(data, row);
          const base = revenue || data.current.summary.net_revenue;
          return (
            <div
              key={row.key}
              className="px-5 py-3 grid grid-cols-4 gap-4"
              style={{
                borderBottom: '1px solid rgba(0,0,0,.04)',
                background: result
                  ? 'linear-gradient(135deg,#ECFDF5,#F0FDF4)'
                  : subtotal ? '#F8FAFC' : 'transparent',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: subtotal ? 700 : 400, color: subtotal ? '#0F172A' : '#374151', paddingLeft: subtotal ? 0 : 16 }}>
                {row.label}
              </div>
              <Amount value={row.amount} strong={subtotal} result={result} />
              <Amount value={previous} muted />
              <div className="text-right" style={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>
                {base ? `${Math.abs((row.amount / base) * 100).toFixed(1)}%` : '0,0%'}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4" style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
        Dados reais consolidados {unitId ? 'da unidade selecionada' : 'das unidades permitidas ao seu perfil'} · Valores em R$
      </p>
    </div>
  );
}

function Header({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : ''} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
      {children}
    </div>
  );
}

function Amount({ value, strong = false, result = false, muted = false }: { value: number; strong?: boolean; result?: boolean; muted?: boolean }) {
  const color = muted
    ? '#94A3B8'
    : result ? (value >= 0 ? '#10B981' : '#EF4444')
      : value < 0 ? '#EF4444'
        : strong ? '#0F172A' : '#10B981';
  return (
    <div className="text-right" style={{ fontSize: 13, fontWeight: strong ? 700 : 400, color, fontFamily: 'monospace' }}>
      {value < 0 ? `(${money(value)})` : money(value)}
    </div>
  );
}
