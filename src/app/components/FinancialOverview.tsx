import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, Banknote, Building2, CircleDollarSign, Clock3, Landmark,
  ListChecks, TrendingDown, TrendingUp, WalletCards,
} from 'lucide-react';

import { DynamicTableRenderer, type ColumnDef } from '../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../shared/components/ModuleStateView';
import { financialService } from '../../services/financialService';
import type { FinancialMetrics, FinancialTransaction } from '../../types/financial';

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14,
  boxShadow: '0 1px 4px rgba(15,23,42,.04)',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function Kpi({
  label, value, icon, color, bg, detail,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; bg: string; detail: string;
}) {
  return (
    <div style={{ ...cardStyle, padding: 17 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color, background: bg, marginBottom: 13 }}>{icon}</div>
      <strong style={{ display: 'block', color: '#0F172A', fontSize: 20, fontFamily: 'monospace', letterSpacing: '-.03em' }}>{value}</strong>
      <span style={{ display: 'block', color: '#64748B', fontSize: 12, marginTop: 3 }}>{label}</span>
      <small style={{ display: 'block', color: '#94A3B8', fontSize: 11, marginTop: 8 }}>{detail}</small>
    </div>
  );
}

export function FinancialOverview() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextMetrics, recent] = await Promise.all([
        financialService.metrics(),
        financialService.listTransactions(),
      ]);
      setMetrics(nextMetrics);
      setTransactions(recent.data.slice(0, 6));
    } catch {
      setError('Não foi possível carregar os dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <ModuleStateView state="loading" />;
  if (error || !metrics) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  const columns: ColumnDef[] = [
    { key: 'description', label: 'Descrição', width: '30%' },
    {
      key: 'type', label: 'Tipo', type: 'badge', width: '90px',
      badgeConfig: {
        income: { label: 'Receita', color: '#059669', bg: '#ECFDF5' },
        expense: { label: 'Despesa', color: '#DC2626', bg: '#FEF2F2' },
      },
    },
    { key: 'dueDate', label: 'Vencimento', type: 'date', width: '110px' },
    {
      key: 'accountName', label: 'Conta', width: '150px',
      render: value => <span style={{ fontSize: 13, color: value ? '#0F172A' : '#94A3B8' }}>{String(value || 'Não definida')}</span>,
    },
    {
      key: 'status', label: 'Status', type: 'badge', width: '95px',
      badgeConfig: {
        pending: { label: 'Pendente', color: '#D97706', bg: '#FFFBEB' },
        paid: { label: 'Pago', color: '#059669', bg: '#ECFDF5' },
        overdue: { label: 'Vencido', color: '#DC2626', bg: '#FEF2F2' },
        canceled: { label: 'Cancelado', color: '#64748B', bg: '#F1F5F9' },
      },
    },
    {
      key: 'amount', label: 'Valor', width: '125px',
      render: (value, row) => <strong style={{ fontSize: 13, color: row.type === 'income' ? '#059669' : '#DC2626' }}>{row.type === 'income' ? '+' : '-'} {money(Number(value))}</strong>,
    },
  ];

  const tableData = transactions.map(transaction => ({
    ...transaction,
    accountName: transaction.financialAccount?.name ?? '',
  }));

  const operationalKpis = [
    { label: 'Receitas recebidas', value: money(metrics.income), icon: <TrendingUp size={17} />, color: '#059669', bg: '#ECFDF5', detail: 'Transações de receita pagas' },
    { label: 'Despesas pagas', value: money(metrics.expenses), icon: <TrendingDown size={17} />, color: '#DC2626', bg: '#FEF2F2', detail: 'Transações de despesa pagas' },
    { label: 'Resultado realizado', value: money(metrics.result), icon: <CircleDollarSign size={17} />, color: metrics.result >= 0 ? '#2563EB' : '#DC2626', bg: metrics.result >= 0 ? '#EFF6FF' : '#FEF2F2', detail: 'Receitas menos despesas' },
    { label: 'Valores pendentes', value: money(metrics.pending), icon: <Clock3 size={17} />, color: '#D97706', bg: '#FFFBEB', detail: 'Receitas e despesas pendentes' },
  ];

  const balanceKpis = [
    { label: 'Saldo consolidado', value: money(metrics.consolidatedBalance), icon: <WalletCards size={17} />, color: '#7C3AED', bg: '#F5F3FF', detail: 'Soma de todas as contas ativas' },
    { label: 'Saldo em caixa', value: money(metrics.cashBalance), icon: <Banknote size={17} />, color: '#D97706', bg: '#FFFBEB', detail: 'Contas classificadas como caixa' },
    { label: 'Saldo em bancos', value: money(metrics.bankBalance), icon: <Landmark size={17} />, color: '#2563EB', bg: '#EFF6FF', detail: 'Contas classificadas como banco' },
    { label: 'Contas financeiras', value: String(metrics.accountsCount), icon: <Building2 size={17} />, color: '#059669', bg: '#ECFDF5', detail: 'Quantidade de contas ativas' },
  ];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Financeiro · Visão Geral</div>
          <h1 style={{ margin: 0, color: '#0F172A', fontSize: 24 }}>Visão Geral Financeira</h1>
          <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0' }}>Posição realizada e saldo atual das contas da empresa.</p>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <Link to="/financial/accounts" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '9px 14px', borderRadius: 10, border: '1px solid #D1FAE5', background: '#fff', color: '#047857', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}><WalletCards size={15} /> Contas</Link>
          <Link to="/financial/transactions" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '9px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}><ListChecks size={15} /> Transações</Link>
        </div>
      </div>

      <section style={{ marginBottom: 22 }}>
        <h2 style={{ margin: '0 0 11px', fontSize: 14, color: '#334155' }}>Movimentação financeira</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 13 }}>
          {operationalKpis.map(kpi => <Kpi key={kpi.label} {...kpi} />)}
        </div>
      </section>

      <section style={{ marginBottom: 22 }}>
        <h2 style={{ margin: '0 0 11px', fontSize: 14, color: '#334155' }}>Posição das contas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 13 }}>
          {balanceKpis.map(kpi => <Kpi key={kpi.label} {...kpi} />)}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
          <div><h2 style={{ margin: 0, fontSize: 15, color: '#0F172A' }}>Transações recentes</h2><p style={{ margin: '3px 0 0', color: '#94A3B8', fontSize: 12 }}>Últimos lançamentos registrados</p></div>
          <Link to="/financial/transactions" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: '#059669', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>Ver todas <ArrowRight size={13} /></Link>
        </div>
        <DynamicTableRenderer columns={columns} data={tableData as unknown as Record<string, unknown>[]} emptyMessage="Nenhuma transação financeira cadastrada." />
      </section>
    </div>
  );
}
