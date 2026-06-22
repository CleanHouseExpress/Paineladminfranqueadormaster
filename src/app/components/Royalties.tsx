import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  AlertCircle, BarChart3, CheckCircle2, ChevronRight, Clock3, Edit, Link2,
  Plus, Receipt, Settings2, Trash2, WalletCards, X, XCircle,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

import { ApiError } from '../../services/apiClient';
import { financialService } from '../../services/financialService';
import { royaltyService } from '../../services/royaltyService';
import { unitManagementService } from '../../services/unitManagementService';
import { ModuleStateView } from '../../shared/components/ModuleStateView';
import { usePermission } from '../../shared/hooks/usePermission';
import type { FinancialAccountOption } from '../../types/financial';
import {
  ROYALTY_BASES, ROYALTY_PERMISSIONS,
  type RoyaltyAssignment, type RoyaltyAssignmentPayload, type RoyaltyCalculation,
  type RoyaltyCalculationStatus, type RoyaltyMetrics, type RoyaltyRule, type RoyaltyRulePayload,
} from '../../types/royalties';
import type { UnitOption } from '../../types/unitManagement';

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14,
  boxShadow: '0 1px 4px rgba(15,23,42,.04)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid rgba(0,0,0,.12)',
  borderRadius: 9, fontSize: 13, color: '#0F172A', background: '#fff',
  outline: 'none', boxSizing: 'border-box',
};

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const apiMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== 'object') return fallback;
  const payload = error.data as { message?: string; errors?: Record<string, string[]> };
  return (payload.errors ? Object.values(payload.errors).flat()[0] : undefined) ?? payload.message ?? fallback;
};

const STATUS: Record<RoyaltyCalculationStatus, { label: string; color: string; bg: string; icon: ReactNode }> = {
  draft: { label: 'Rascunho', color: '#64748B', bg: '#F1F5F9', icon: <Clock3 size={12} /> },
  generated: { label: 'Gerado', color: '#D97706', bg: '#FFFBEB', icon: <Clock3 size={12} /> },
  approved: { label: 'Aprovado', color: '#2563EB', bg: '#EFF6FF', icon: <CheckCircle2 size={12} /> },
  paid: { label: 'Pago', color: '#059669', bg: '#ECFDF5', icon: <CheckCircle2 size={12} /> },
  cancelled: { label: 'Cancelado', color: '#64748B', bg: '#F1F5F9', icon: <XCircle size={12} /> },
};

function PageShell({ current, children }: { current: 'dashboard' | 'rules' | 'calculations' | 'settings'; children: ReactNode }) {
  const tabs = [
    { key: 'dashboard', label: 'Visão Geral', path: '/royalties', icon: <BarChart3 size={14} /> },
    { key: 'rules', label: 'Regras', path: '/royalties/rules', icon: <Receipt size={14} /> },
    { key: 'calculations', label: 'Competências', path: '/royalties/calculations', icon: <WalletCards size={14} /> },
    { key: 'settings', label: 'Vínculos', path: '/royalties/settings', icon: <Settings2 size={14} /> },
  ] as const;

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#94A3B8', fontSize: 12, marginBottom: 5 }}>
          <span>Financeiro</span><ChevronRight size={12} /><span>Royalties</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}><Receipt size={20} /></span>
          <div><h1 style={{ margin: 0, color: '#0F172A', fontSize: 23 }}>Royalties & Taxas</h1><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>Cobranças da rede integradas a Vendas, DRE e Financeiro.</p></div>
        </div>
        <nav style={{ display: 'flex', gap: 5, borderBottom: '1px solid #E2E8F0', marginBottom: 20, overflowX: 'auto' }}>
          {tabs.map(tab => <Link key={tab.key} to={tab.path} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 13px',
            color: current === tab.key ? '#4F46E5' : '#64748B', textDecoration: 'none', fontSize: 13,
            fontWeight: current === tab.key ? 700 : 500,
            borderBottom: current === tab.key ? '2px solid #6366F1' : '2px solid transparent',
          }}>{tab.icon}{tab.label}</Link>)}
        </nav>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label style={{ display: 'grid', gap: 6 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{label}</span>{children}{hint && <small style={{ color: '#94A3B8', fontSize: 11 }}>{hint}</small>}</label>;
}

function Button({ children, onClick, disabled, secondary = false, danger = false }: { children: ReactNode; onClick: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean }) {
  const background = disabled ? '#CBD5E1' : danger ? '#DC2626' : secondary ? '#fff' : 'linear-gradient(135deg,#6366F1,#8B5CF6)';
  return <button type="button" onClick={onClick} disabled={disabled} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9,
    border: secondary ? '1px solid #CBD5E1' : 0, background,
    color: secondary ? '#475569' : '#fff', fontSize: 12, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }}>{children}</button>;
}

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return <div onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.46)', display: 'grid', placeItems: 'center', padding: 20 }}>
    <div style={{ ...cardStyle, width: 'min(700px,100%)', maxHeight: '90vh', overflow: 'auto' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 17, color: '#0F172A' }}>{title}</h2>
        <button onClick={onClose} style={{ border: 0, background: 'transparent', color: '#64748B', cursor: 'pointer' }}><X size={19} /></button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>;
}

function StatusBadge({ calculation }: { calculation: RoyaltyCalculation }) {
  const overdue = calculation.status === 'approved'
    && (calculation.referenceYear * 100 + calculation.referenceMonth) < Number(new Date().toISOString().slice(0, 7).replace('-', ''));
  const config = overdue ? { label: 'Inadimplente', color: '#DC2626', bg: '#FEF2F2', icon: <AlertCircle size={12} /> } : STATUS[calculation.status];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 999, background: config.bg, color: config.color, fontSize: 11, fontWeight: 700 }}>{config.icon}{config.label}</span>;
}

export function Royalties() {
  return <RoyaltyDashboard />;
}

export function RoyaltyDashboard() {
  const [metrics, setMetrics] = useState<RoyaltyMetrics | null>(null);
  const [calculations, setCalculations] = useState<RoyaltyCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const now = new Date();

  const load = async () => {
    setLoading(true); setError('');
    try {
      const filters = { reference_year: now.getFullYear(), reference_month: now.getMonth() + 1 };
      const [nextMetrics, list] = await Promise.all([royaltyService.metrics(), royaltyService.listCalculations(filters)]);
      setMetrics(nextMetrics); setCalculations(list.data);
    } catch (loadError) { setError(apiMessage(loadError, 'Não foi possível carregar os royalties.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const chartData = useMemo(() => {
    const units = new Map<string, { unit: string; royalties: number; marketing: number; extras: number }>();
    calculations.forEach(item => {
      const name = item.unit?.name ?? 'Sem unidade';
      const row = units.get(name) ?? { unit: name, royalties: 0, marketing: 0, extras: 0 };
      const rule = (item.rule?.name ?? '').toLowerCase();
      if (rule.includes('marketing')) row.marketing += item.calculatedAmount;
      else if (item.rule?.ruleType === 'fixed' && !rule.includes('royalt')) row.extras += item.calculatedAmount;
      else row.royalties += item.calculatedAmount;
      units.set(name, row);
    });
    return [...units.values()];
  }, [calculations]);

  if (loading) return <ModuleStateView state="loading" />;
  if (error || !metrics) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  const cards = [
    { label: 'Total gerado', value: metrics.totalGenerated, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Recebido', value: metrics.totalPaid, color: '#059669', bg: '#ECFDF5' },
    { label: 'Pendente', value: metrics.totalPending, color: '#D97706', bg: '#FFFBEB' },
    { label: 'Inadimplência', value: metrics.defaultAmount, detail: `${metrics.defaultRate.toFixed(1)}% do total`, color: '#DC2626', bg: '#FEF2F2' },
  ];

  return <PageShell current="dashboard">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 13, marginBottom: 18 }}>
      {cards.map(card => <div key={card.label} style={{ ...cardStyle, padding: 17 }}>
        <div style={{ width: 9, height: 25, borderRadius: 6, background: card.color, opacity: .45, marginBottom: 10 }} />
        <strong style={{ display: 'block', fontSize: 19, color: card.color, fontFamily: 'monospace' }}>{money(card.value)}</strong>
        <span style={{ display: 'block', fontSize: 12, color: '#64748B', marginTop: 3 }}>{card.label}</span>
        <small style={{ color: '#94A3B8', fontSize: 11 }}>{card.detail ?? 'Valores consolidados'}</small>
      </div>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 18 }}>
      <div style={{ ...cardStyle, padding: 18 }}>
        <h3 style={{ margin: '0 0 15px', color: '#0F172A', fontSize: 15 }}>Cobranças do mês por unidade</h3>
        {chartData.length ? <ResponsiveContainer width="100%" height={235}>
          <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="unit" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={value => `${value / 1000}k`} /><Tooltip formatter={value => money(Number(value))} /><Bar dataKey="royalties" name="Royalties" fill="#6366F1" stackId="a" /><Bar dataKey="marketing" name="Marketing" fill="#8B5CF6" stackId="a" /><Bar dataKey="extras" name="Taxas extras" fill="#F59E0B" stackId="a" radius={[4, 4, 0, 0]} /></BarChart>
        </ResponsiveContainer> : <div style={{ height: 235, display: 'grid', placeItems: 'center', color: '#94A3B8', fontSize: 13 }}>Nenhuma competência gerada neste mês.</div>}
      </div>
      <div style={{ ...cardStyle, padding: 18 }}>
        <h3 style={{ margin: '0 0 15px', color: '#0F172A', fontSize: 15 }}>Composição do mês</h3>
        {[
          ['Royalties', metrics.royaltiesMonth, '#6366F1'],
          ['Fundo de Marketing', metrics.marketingMonth, '#8B5CF6'],
          ['Taxas extras', metrics.extraFeesMonth, '#F59E0B'],
        ].map(([label, value, color]) => <div key={String(label)} style={{ padding: '13px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span style={{ fontSize: 12, color: '#64748B' }}>{label}</span><strong style={{ fontSize: 13, color: String(color) }}>{money(Number(value))}</strong></div>
        </div>)}
        <Link to="/royalties/calculations" style={{ display: 'inline-flex', marginTop: 17, color: '#6366F1', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Ver competências →</Link>
      </div>
    </div>
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <div style={{ padding: '14px 17px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#0F172A', fontSize: 14 }}>Competências recentes</strong><Link to="/royalties/rules" style={{ color: '#6366F1', textDecoration: 'none', fontSize: 12 }}>Configurar regras</Link></div>
      <CalculationTable rows={calculations.slice(0, 8)} />
    </div>
  </PageShell>;
}

const emptyRule = (): RoyaltyRulePayload => ({
  name: '', description: '', rule_type: 'percentage', calculation_base: 'gross_revenue',
  percentage: 5, fixed_amount: null, minimum_amount: null, maximum_amount: null, active: true,
});

export function RoyaltyRules() {
  const { hasPermission } = usePermission();
  const [rules, setRules] = useState<RoyaltyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoyaltyRule | null>(null);
  const [form, setForm] = useState<RoyaltyRulePayload>(emptyRule);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try { setRules((await royaltyService.listRules()).data); }
    catch (loadError) { setError(apiMessage(loadError, 'Não foi possível carregar as regras.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const showForm = (rule?: RoyaltyRule) => {
    setEditing(rule ?? null);
    setForm(rule ? {
      name: rule.name, description: rule.description, rule_type: rule.ruleType,
      calculation_base: rule.calculationBase, percentage: rule.percentage,
      fixed_amount: rule.fixedAmount, minimum_amount: rule.minimumAmount,
      maximum_amount: rule.maximumAmount, active: rule.active,
    } : emptyRule());
    setOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      if (editing) await royaltyService.updateRule(editing.id, form);
      else await royaltyService.createRule(form);
      toast.success(editing ? 'Regra atualizada.' : 'Regra criada.');
      setOpen(false); await load();
    } catch (saveError) { toast.error(apiMessage(saveError, 'Não foi possível salvar a regra.')); }
    finally { setSaving(false); }
  };
  const remove = async (rule: RoyaltyRule) => {
    if (!window.confirm(`Excluir a regra "${rule.name}"?`)) return;
    try { await royaltyService.deleteRule(rule.id); toast.success('Regra excluída.'); await load(); }
    catch (deleteError) { toast.error(apiMessage(deleteError, 'Não foi possível excluir a regra.')); }
  };

  if (loading) return <ModuleStateView state="loading" />;
  if (error) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  return <PageShell current="rules">
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 15 }}>
      <div><h2 style={{ margin: 0, color: '#0F172A', fontSize: 17 }}>Regras de cobrança</h2><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 12 }}>Configure percentuais, valores fixos e limites.</p></div>
      {hasPermission(ROYALTY_PERMISSIONS.create) && <Button onClick={() => showForm()}><Plus size={14} /> Nova regra</Button>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
      {rules.map(rule => <div key={rule.id} style={{ ...cardStyle, padding: 17, opacity: rule.active ? 1 : .65 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <div><strong style={{ color: '#0F172A', fontSize: 14 }}>{rule.name}</strong><p style={{ color: '#94A3B8', fontSize: 11, margin: '4px 0 0' }}>{rule.description || 'Sem descrição'}</p></div>
          <span style={{ padding: '3px 7px', borderRadius: 999, background: rule.active ? '#ECFDF5' : '#F1F5F9', color: rule.active ? '#059669' : '#64748B', fontSize: 10, fontWeight: 700 }}>{rule.active ? 'Ativa' : 'Inativa'}</span>
        </div>
        <div style={{ margin: '15px 0', padding: 13, borderRadius: 10, background: '#F8FAFC' }}>
          <strong style={{ display: 'block', color: '#6366F1', fontSize: 18 }}>{rule.ruleType === 'percentage' ? `${rule.percentage}%` : money(rule.fixedAmount ?? 0)}</strong>
          <span style={{ color: '#64748B', fontSize: 11 }}>{rule.ruleType === 'percentage' ? `sobre ${ROYALTY_BASES[rule.calculationBase].toLowerCase()}` : 'cobrança fixa mensal'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 11 }}><span>{rule.assignmentsCount} vínculo(s)</span><span>{rule.minimumAmount != null ? `Mín. ${money(rule.minimumAmount)}` : 'Sem mínimo'}</span></div>
        <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
          {hasPermission(ROYALTY_PERMISSIONS.update) && <Button secondary onClick={() => showForm(rule)}><Edit size={13} /> Editar</Button>}
          {hasPermission(ROYALTY_PERMISSIONS.configure) && <Button secondary onClick={() => void remove(rule)}><Trash2 size={13} /> Excluir</Button>}
        </div>
      </div>)}
    </div>
    {!rules.length && <ModuleStateView state="empty" emptyHint="Crie a primeira regra de royalty ou taxa da rede." />}

    <Modal open={open} title={editing ? 'Editar regra' : 'Nova regra'} onClose={() => setOpen(false)}>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="Nome"><input style={inputStyle} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Ex.: Royalty 5%" /></Field>
        <Field label="Descrição"><textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description ?? ''} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tipo"><select style={inputStyle} value={form.rule_type} onChange={event => setForm(current => ({ ...current, rule_type: event.target.value as RoyaltyRulePayload['rule_type'] }))}><option value="percentage">Percentual</option><option value="fixed">Valor fixo</option></select></Field>
          <Field label="Base de cálculo"><select style={inputStyle} value={form.calculation_base} onChange={event => setForm(current => ({ ...current, calculation_base: event.target.value as RoyaltyRulePayload['calculation_base'] }))}>{Object.entries(ROYALTY_BASES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          {form.rule_type === 'percentage' ? <Field label="Percentual (%)"><input type="number" min=".0001" max="100" step=".01" style={inputStyle} value={form.percentage ?? ''} onChange={event => setForm(current => ({ ...current, percentage: Number(event.target.value) }))} /></Field> : <Field label="Valor fixo"><input type="number" min=".01" step=".01" style={inputStyle} value={form.fixed_amount ?? ''} onChange={event => setForm(current => ({ ...current, fixed_amount: Number(event.target.value) }))} /></Field>}
          <Field label="Valor mínimo"><input type="number" min="0" step=".01" style={inputStyle} value={form.minimum_amount ?? ''} onChange={event => setForm(current => ({ ...current, minimum_amount: event.target.value ? Number(event.target.value) : null }))} /></Field>
          <Field label="Valor máximo"><input type="number" min="0" step=".01" style={inputStyle} value={form.maximum_amount ?? ''} onChange={event => setForm(current => ({ ...current, maximum_amount: event.target.value ? Number(event.target.value) : null }))} /></Field>
          <Field label="Situação"><select style={inputStyle} value={form.active ? 'true' : 'false'} onChange={event => setForm(current => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Ativa</option><option value="false">Inativa</option></select></Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button secondary onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => void save()} disabled={saving || !form.name}>{saving ? 'Salvando...' : 'Salvar regra'}</Button></div>
      </div>
    </Modal>
  </PageShell>;
}

export function RoyaltyCalculations() {
  const { hasPermission } = usePermission();
  const now = new Date();
  const [rows, setRows] = useState<RoyaltyCalculation[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccountOption[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [customBase, setCustomBase] = useState('');
  const [paying, setPaying] = useState<RoyaltyCalculation | null>(null);
  const [accountId, setAccountId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [list, options] = await Promise.all([
        royaltyService.listCalculations({ reference_year: year, reference_month: month, status }),
        hasPermission(ROYALTY_PERMISSIONS.markPaid) ? financialService.accountOptions() : Promise.resolve([]),
      ]);
      setRows(list.data); setAccounts(options);
    } catch (loadError) { setError(apiMessage(loadError, 'Não foi possível carregar as competências.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [year, month, status]);

  const generate = async () => {
    setSaving(true);
    try {
      await royaltyService.generate({ reference_year: year, reference_month: month, ...(customBase ? { custom_base_amount: Number(customBase) } : {}) });
      toast.success('Competências geradas.'); setGenerateOpen(false); await load();
    } catch (generateError) { toast.error(apiMessage(generateError, 'Não foi possível gerar as competências.')); }
    finally { setSaving(false); }
  };
  const action = async (type: 'approve' | 'cancel', row: RoyaltyCalculation) => {
    if (type === 'cancel' && !window.confirm(`Cancelar a competência de ${row.unit?.name}?`)) return;
    try {
      if (type === 'approve') await royaltyService.approve(row.id); else await royaltyService.cancel(row.id);
      toast.success(type === 'approve' ? 'Competência aprovada e receita financeira criada.' : 'Competência cancelada.');
      await load();
    } catch (actionError) { toast.error(apiMessage(actionError, 'Não foi possível concluir a ação.')); }
  };
  const pay = async () => {
    if (!paying || !accountId) return;
    setSaving(true);
    try { await royaltyService.markPaid(paying.id, accountId); toast.success('Pagamento registrado e saldo atualizado.'); setPaying(null); await load(); }
    catch (payError) { toast.error(apiMessage(payError, 'Não foi possível registrar o pagamento.')); }
    finally { setSaving(false); }
  };

  if (error && !rows.length) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  return <PageShell current="calculations">
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 15, flexWrap: 'wrap' }}>
      <div><h2 style={{ margin: 0, color: '#0F172A', fontSize: 17 }}>Competências</h2><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 12 }}>Gere, aprove e registre os recebimentos.</p></div>
      {hasPermission(ROYALTY_PERMISSIONS.create) && <Button onClick={() => setGenerateOpen(true)}><Plus size={14} /> Gerar competências</Button>}
    </div>
    <div style={{ ...cardStyle, padding: 13, display: 'flex', gap: 9, marginBottom: 14, flexWrap: 'wrap' }}>
      <select style={{ ...inputStyle, width: 120 }} value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2026, index, 1))}</option>)}</select>
      <input type="number" style={{ ...inputStyle, width: 105 }} value={year} onChange={event => setYear(Number(event.target.value))} />
      <select style={{ ...inputStyle, width: 155 }} value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos os status</option>{Object.entries(STATUS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}</select>
    </div>
    <div style={{ ...cardStyle, overflow: 'hidden', opacity: loading ? .6 : 1 }}>
      <CalculationTable rows={rows} actions={row => <div style={{ display: 'flex', gap: 6 }}>
        {['draft', 'generated'].includes(row.status) && hasPermission(ROYALTY_PERMISSIONS.approve) && <Button secondary onClick={() => void action('approve', row)}>Aprovar</Button>}
        {row.status === 'approved' && hasPermission(ROYALTY_PERMISSIONS.markPaid) && <Button onClick={() => { setPaying(row); setAccountId(''); }}>Marcar pago</Button>}
        {!['paid', 'cancelled'].includes(row.status) && hasPermission(ROYALTY_PERMISSIONS.update) && <Button secondary onClick={() => void action('cancel', row)}>Cancelar</Button>}
      </div>} />
    </div>

    <Modal open={generateOpen} title={`Gerar competências ${String(month).padStart(2, '0')}/${year}`} onClose={() => setGenerateOpen(false)}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ padding: 13, borderRadius: 10, background: '#EEF2FF', color: '#4338CA', fontSize: 12 }}>Serão processados todos os vínculos ativos e vigentes desta competência. Registros já aprovados ou pagos serão preservados.</div>
        <Field label="Base personalizada (opcional)" hint="Preencha somente quando houver regra com base customizada."><input type="number" min="0" step=".01" style={inputStyle} value={customBase} onChange={event => setCustomBase(event.target.value)} /></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button secondary onClick={() => setGenerateOpen(false)}>Cancelar</Button><Button onClick={() => void generate()} disabled={saving}>{saving ? 'Gerando...' : 'Confirmar geração'}</Button></div>
      </div>
    </Modal>
    <Modal open={Boolean(paying)} title="Registrar recebimento" onClose={() => setPaying(null)}>
      <div style={{ display: 'grid', gap: 14 }}>
        {paying && <div style={{ padding: 13, borderRadius: 10, background: '#ECFDF5' }}><strong style={{ display: 'block', color: '#0F172A' }}>{paying.unit?.name} · {paying.rule?.name}</strong><span style={{ color: '#059669', fontSize: 20, fontWeight: 800 }}>{money(paying.calculatedAmount)}</span></div>}
        <Field label="Conta financeira" hint="O saldo da conta será atualizado imediatamente."><select style={inputStyle} value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Selecione a conta</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.label}</option>)}</select></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button secondary onClick={() => setPaying(null)}>Cancelar</Button><Button onClick={() => void pay()} disabled={saving || !accountId}>{saving ? 'Processando...' : 'Confirmar pagamento'}</Button></div>
      </div>
    </Modal>
  </PageShell>;
}

function CalculationTable({ rows, actions }: { rows: RoyaltyCalculation[]; actions?: (row: RoyaltyCalculation) => ReactNode }) {
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead><tr style={{ background: '#F8FAFC' }}>{['Competência', 'Unidade', 'Regra', 'Base', 'Valor', 'Status', ...(actions ? ['Ações'] : [])].map(header => <th key={header} style={{ padding: '11px 14px', textAlign: 'left', color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>{header}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.id} style={{ borderTop: '1px solid #F1F5F9' }}>
      <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12, fontFamily: 'monospace' }}>{row.reference}</td>
      <td style={{ padding: '12px 14px', color: '#0F172A', fontSize: 13, fontWeight: 600 }}>{row.unit?.name ?? '—'}</td>
      <td style={{ padding: '12px 14px', color: '#64748B', fontSize: 12 }}>{row.rule?.name ?? '—'}</td>
      <td style={{ padding: '12px 14px', color: '#64748B', fontSize: 12, fontFamily: 'monospace' }}>{money(row.baseAmount)}</td>
      <td style={{ padding: '12px 14px', color: '#0F172A', fontSize: 13, fontWeight: 800 }}>{money(row.calculatedAmount)}</td>
      <td style={{ padding: '12px 14px' }}><StatusBadge calculation={row} /></td>
      {actions && <td style={{ padding: '9px 14px' }}>{actions(row)}</td>}
    </tr>)}</tbody>
  </table>{!rows.length && <div style={{ padding: 35, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Nenhuma competência encontrada.</div>}</div>;
}

const emptyAssignment = (): RoyaltyAssignmentPayload => ({
  unit_id: 0, royalty_rule_id: 0, start_date: new Date().toISOString().slice(0, 10), end_date: null, active: true,
});

export function RoyaltySettings() {
  const [assignments, setAssignments] = useState<RoyaltyAssignment[]>([]);
  const [rules, setRules] = useState<RoyaltyRule[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoyaltyAssignment | null>(null);
  const [form, setForm] = useState<RoyaltyAssignmentPayload>(emptyAssignment);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [links, nextRules, nextUnits] = await Promise.all([
        royaltyService.listAssignments(), royaltyService.listRules({ active: true }), unitManagementService.getUnitOptions(),
      ]);
      setAssignments(links.data); setRules(nextRules.data); setUnits(nextUnits);
    } catch (loadError) { setError(apiMessage(loadError, 'Não foi possível carregar os vínculos.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const showForm = (assignment?: RoyaltyAssignment) => {
    setEditing(assignment ?? null);
    setForm(assignment ? {
      unit_id: Number(assignment.unitId), royalty_rule_id: Number(assignment.royaltyRuleId),
      start_date: assignment.startDate, end_date: assignment.endDate, active: assignment.active,
    } : emptyAssignment());
    setOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      if (editing) await royaltyService.updateAssignment(editing.id, form);
      else await royaltyService.createAssignment(form);
      toast.success(editing ? 'Vínculo atualizado.' : 'Vínculo criado.'); setOpen(false); await load();
    } catch (saveError) { toast.error(apiMessage(saveError, 'Não foi possível salvar o vínculo.')); }
    finally { setSaving(false); }
  };
  const remove = async (assignment: RoyaltyAssignment) => {
    if (!window.confirm(`Excluir o vínculo de ${assignment.unit?.name} com ${assignment.rule?.name}?`)) return;
    try { await royaltyService.deleteAssignment(assignment.id); toast.success('Vínculo excluído.'); await load(); }
    catch (deleteError) { toast.error(apiMessage(deleteError, 'Não foi possível excluir o vínculo.')); }
  };

  if (loading) return <ModuleStateView state="loading" />;
  if (error) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  return <PageShell current="settings">
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 15 }}>
      <div><h2 style={{ margin: 0, color: '#0F172A', fontSize: 17 }}>Vínculos por unidade</h2><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 12 }}>Defina quais regras se aplicam a cada unidade e vigência.</p></div>
      <Button onClick={() => showForm()}><Link2 size={14} /> Novo vínculo</Button>
    </div>
    <div style={{ ...cardStyle, overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr style={{ background: '#F8FAFC' }}>{['Unidade', 'Regra', 'Início', 'Fim', 'Situação', 'Ações'].map(header => <th key={header} style={{ padding: '11px 14px', textAlign: 'left', color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' }}>{header}</th>)}</tr></thead>
      <tbody>{assignments.map(item => <tr key={item.id} style={{ borderTop: '1px solid #F1F5F9' }}>
        <td style={{ padding: '12px 14px', color: '#0F172A', fontSize: 13, fontWeight: 700 }}>{item.unit?.name}</td>
        <td style={{ padding: '12px 14px', color: '#64748B', fontSize: 12 }}>{item.rule?.name}</td>
        <td style={{ padding: '12px 14px', color: '#64748B', fontSize: 12 }}>{new Intl.DateTimeFormat('pt-BR').format(new Date(`${item.startDate}T12:00:00`))}</td>
        <td style={{ padding: '12px 14px', color: '#64748B', fontSize: 12 }}>{item.endDate ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${item.endDate}T12:00:00`)) : 'Sem término'}</td>
        <td style={{ padding: '12px 14px' }}><span style={{ padding: '4px 8px', borderRadius: 999, background: item.active ? '#ECFDF5' : '#F1F5F9', color: item.active ? '#059669' : '#64748B', fontSize: 11, fontWeight: 700 }}>{item.active ? 'Ativo' : 'Inativo'}</span></td>
        <td style={{ padding: '9px 14px' }}><div style={{ display: 'flex', gap: 6 }}><Button secondary onClick={() => showForm(item)}><Edit size={13} /> Editar</Button><Button secondary onClick={() => void remove(item)}><Trash2 size={13} /> Excluir</Button></div></td>
      </tr>)}</tbody>
    </table></div></div>
    {!assignments.length && <ModuleStateView state="empty" emptyHint="Vincule uma regra ativa à primeira unidade." />}

    <Modal open={open} title={editing ? 'Editar vínculo' : 'Novo vínculo'} onClose={() => setOpen(false)}>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="Unidade"><select style={inputStyle} value={form.unit_id || ''} onChange={event => setForm(current => ({ ...current, unit_id: Number(event.target.value) }))}><option value="">Selecione</option>{units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></Field>
        <Field label="Regra"><select style={inputStyle} value={form.royalty_rule_id || ''} onChange={event => setForm(current => ({ ...current, royalty_rule_id: Number(event.target.value) }))}><option value="">Selecione</option>{rules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}</select></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Início da vigência"><input type="date" style={inputStyle} value={form.start_date} onChange={event => setForm(current => ({ ...current, start_date: event.target.value }))} /></Field>
          <Field label="Fim da vigência"><input type="date" style={inputStyle} value={form.end_date ?? ''} onChange={event => setForm(current => ({ ...current, end_date: event.target.value || null }))} /></Field>
          <Field label="Situação"><select style={inputStyle} value={form.active ? 'true' : 'false'} onChange={event => setForm(current => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Ativo</option><option value="false">Inativo</option></select></Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button secondary onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => void save()} disabled={saving || !form.unit_id || !form.royalty_rule_id}>{saving ? 'Salvando...' : 'Salvar vínculo'}</Button></div>
      </div>
    </Modal>
  </PageShell>;
}
